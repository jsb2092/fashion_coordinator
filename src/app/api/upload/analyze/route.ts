import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { analyzeClothingImage } from "@/lib/claude";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// Claude's 5MB limit is for base64, which is ~33% larger than raw bytes
// So raw image must be under ~3.75MB to be safe after base64 encoding
const MAX_IMAGE_SIZE = 3.5 * 1024 * 1024;

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Support both single imageUrl and array of imageUrls
    const imageUrls: string[] = body.imageUrls || (body.imageUrl ? [body.imageUrl] : []);
    const description: string | undefined = body.description;

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Missing imageUrl or imageUrls" },
        { status: 400 }
      );
    }

    // Process all images
    const images: Array<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" }> = [];

    for (const imageUrl of imageUrls) {
      // Extract key from the URL (format: /api/upload/image/KEY)
      const keyMatch = imageUrl.match(/\/api\/upload\/image\/(.+)$/);
      if (!keyMatch) {
        console.warn(`Invalid image URL format: ${imageUrl}`);
        continue;
      }

      const key = decodeURIComponent(keyMatch[1]);

      // Fetch image from S3
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
      });

      const s3Response = await s3Client.send(command);
      const bodyBytes = await s3Response.Body?.transformToByteArray();

      if (!bodyBytes) {
        console.warn(`Failed to read image from S3: ${key}`);
        continue;
      }

      let imageBuffer: Buffer = Buffer.from(bodyBytes);
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";

      // Resize if image is too large for Claude API (5MB base64 limit)
      if (imageBuffer.length > MAX_IMAGE_SIZE) {
        console.log(`Image too large (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB), resizing...`);

        // Try progressively lower quality until it fits
        let quality = 85;
        let maxDim = 1500;

        while (imageBuffer.length > MAX_IMAGE_SIZE && quality >= 50) {
          const resized = await sharp(Buffer.from(bodyBytes))
            .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality })
            .toBuffer();
          imageBuffer = resized;

          if (imageBuffer.length > MAX_IMAGE_SIZE) {
            quality -= 10;
            if (quality >= 50 && maxDim > 1000) {
              maxDim -= 250;
            }
          }
        }

        mediaType = "image/jpeg";
        console.log(`Resized to ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB (quality: ${quality}, maxDim: ${maxDim})`);
      } else {
        // Determine media type from original
        const contentType = s3Response.ContentType || "image/jpeg";
        mediaType = contentType.startsWith("image/")
          ? contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
          : "image/jpeg";
      }

      images.push({
        base64: imageBuffer.toString("base64"),
        mediaType,
      });
    }

    if (images.length === 0) {
      throw new Error("No valid images to analyze");
    }

    const analysis = await analyzeClothingImage(images, description);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
