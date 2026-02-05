import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { analyzeSupplyImage, analyzeSupplyKitFromUrl, analyzeKitFromDescription } from "@/lib/claude";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

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
    const { imageUrls, productUrl, kitDescription } = body;

    // If a product URL is provided (e.g., Amazon link), analyze from that
    // Uses kit analysis to detect if it's a multi-item kit
    if (productUrl) {
      // Fetch the page content to give Claude context
      let pageContent = "";
      try {
        const pageRes = await fetch(productUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        });

        if (pageRes.ok) {
          const html = await pageRes.text();
          // Extract text content, remove scripts/styles, limit size
          pageContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 15000); // Limit to ~15k chars for Claude context
        }
      } catch (fetchError) {
        console.warn("Failed to fetch URL content:", fetchError);
        // Continue without page content - Claude will try to infer from URL
      }

      const kitAnalysis = await analyzeSupplyKitFromUrl(productUrl, pageContent || undefined, kitDescription || undefined);
      return NextResponse.json(kitAnalysis);
    }

    // Otherwise, analyze from uploaded images
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Missing imageUrls or productUrl" },
        { status: 400 }
      );
    }

    const images: Array<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" }> = [];

    for (const imageUrl of imageUrls) {
      const keyMatch = imageUrl.match(/\/api\/upload\/image\/(.+)$/);
      if (!keyMatch) {
        console.warn(`Invalid image URL format: ${imageUrl}`);
        continue;
      }

      const key = decodeURIComponent(keyMatch[1]);

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

      if (imageBuffer.length > MAX_IMAGE_SIZE) {
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
      } else {
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

    // If kit description provided, parse as kit
    if (kitDescription) {
      const kitAnalysis = await analyzeKitFromDescription(kitDescription, images);
      return NextResponse.json(kitAnalysis);
    }

    const analysis = await analyzeSupplyImage(images);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Supply analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze supply" },
      { status: 500 }
    );
  }
}
