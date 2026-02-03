import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

export const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Expires: 3600,
    Conditions: [
      { bucket: process.env.AWS_S3_BUCKET_NAME! },
      ["eq", "$key", key],
      ["starts-with", "$Content-Type", "image/"],
      ["content-length-range", 1000, 10_000_000],
    ],
  });

  return { url, fields, key };
}

export function getPublicUrl(key: string): string {
  return `${process.env.AWS_ENDPOINT_URL_S3}/${process.env.AWS_S3_BUCKET_NAME}/${key}`;
}

export async function deleteObject(key: string) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    })
  );
}
