import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { analyzeClothingImage } from "@/lib/claude";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB to be safe (Claude limit is 5MB)

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
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl" },
        { status: 400 }
      );
    }

    // Extract key from the URL (format: /api/upload/image/KEY)
    const keyMatch = imageUrl.match(/\/api\/upload\/image\/(.+)$/);
    if (!keyMatch) {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 }
      );
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
      throw new Error("Failed to read image from S3");
    }

    let imageBuffer: Buffer = Buffer.from(bodyBytes);
    let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";

    // Resize if image is too large for Claude API (5MB limit)
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      console.log(`Image too large (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB), resizing...`);

      // Resize to max 1500px on longest side and convert to JPEG for smaller size
      const resized = await sharp(imageBuffer)
        .resize(1500, 1500, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      imageBuffer = resized;

      mediaType = "image/jpeg";
      console.log(`Resized to ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    } else {
      // Determine media type from original
      const contentType = s3Response.ContentType || "image/jpeg";
      mediaType = contentType.startsWith("image/")
        ? contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
        : "image/jpeg";
    }

    const base64Data = imageBuffer.toString("base64");
    const analysis = await analyzeClothingImage(base64Data, mediaType);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
