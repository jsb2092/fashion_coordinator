import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  userId: string
) {
  const key = `wardrobe/${userId}/${Date.now()}-${fileName}`;

  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Expires: 3600,
    Conditions: [
      { bucket: process.env.S3_BUCKET! },
      ["eq", "$key", key],
      ["starts-with", "$Content-Type", "image/"],
      ["content-length-range", 1000, 10_000_000],
    ],
  });

  return { url, fields, key };
}

export function getPublicUrl(key: string): string {
  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
}

export async function deleteObject(key: string) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    })
  );
}
