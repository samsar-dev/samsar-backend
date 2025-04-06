// Cloudflare R2
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// Check if Cloudflare R2 is configured
const isR2Configured = !!(
  process.env.CLOUDFLARE_R2_ENDPOINT &&
  process.env.CLOUDFLARE_R2_ACCESS_KEY &&
  process.env.CLOUDFLARE_R2_SECRET_KEY &&
  process.env.CLOUDFLARE_R2_BUCKET
);

// Initialize Cloudflare R2 Client if configured
const s3 = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY || "",
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY || "",
      },
    })
  : null;

// Upload File to Cloudflare R2
export const uploadToR2 = async (
  file: Express.Multer.File,
  category: string,
) => {
  if (!isR2Configured || !s3) {
    console.warn("⚠️ Cloudflare R2 is not configured. File upload will be skipped.");
    return {
      url: "placeholder-url",
      key: "placeholder-key",
    };
  }

  const folder = category === "avatar" ? "avatars/" : "listings/";
  const fileKey = `${folder}${crypto.randomUUID()}-${file.originalname.replace(/\s/g, "-")}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return {
      url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`,
      key: fileKey,
    };
  } catch (error) {
    console.error("❌ Failed to upload to R2:", error);
    throw new Error("Failed to upload file");
  }
};

// Delete File from Cloudflare R2
export const deleteFromR2 = async (key: string) => {
  if (!isR2Configured || !s3) {
    console.warn("⚠️ Cloudflare R2 is not configured. File deletion will be skipped.");
    return;
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
      })
    );
  } catch (error) {
    console.error("❌ Failed to delete from R2:", error);
    throw new Error("Failed to delete file");
  }
};

export default s3;
