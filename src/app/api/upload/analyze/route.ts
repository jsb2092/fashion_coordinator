import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { analyzeClothingImage } from "@/lib/claude";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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

    // Convert to base64
    const base64Data = Buffer.from(bodyBytes).toString("base64");

    // Determine media type
    const contentType = s3Response.ContentType || "image/jpeg";
    const mediaType = contentType.startsWith("image/")
      ? contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
      : "image/jpeg";

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
