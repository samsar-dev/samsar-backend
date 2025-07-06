// Cloudflare R2
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

// ✅ Check if Cloudflare R2 is configured
const isR2Configured = !!(
  process.env.CLOUDFLARE_R2_ENDPOINT &&
  process.env.CLOUDFLARE_R2_ACCESS_KEY &&
  process.env.CLOUDFLARE_R2_SECRET_KEY &&
  process.env.CLOUDFLARE_R2_BUCKET
);

// ✅ Initialize Cloudflare R2 Client
const s3 = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
      },
    })
  : null;

// ✅ Types
export interface UploadResult {
  success: boolean;
  message: string;
  url?: string;
  key?: string;
}

export interface UploadOptions {
  userId?: string;
  listingId?: string;
  originalName?: string;
}

// ✅ Upload Handler
export const uploadToR2 = async (
  file: Buffer | { buffer: Buffer; mimetype?: string; originalname?: string },
  category: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  if (!isR2Configured || !s3) {
    console.warn("⚠️ Cloudflare R2 is not configured. Upload skipped.");
    return { success: false, message: "Cloudflare R2 not configured" };
  }

  try {
    const fileBuffer = Buffer.isBuffer(file) ? file : file.buffer;
    const originalName = (file as any).originalname || "";
    const ext = originalName.split(".").pop() || "bin";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);

    let fileName: string;

    switch (category.toLowerCase()) {
      case "avatar":
        if (!options.userId) throw new Error("User ID required for avatar");
        fileName = `uploads/avatars/${options.userId}.${ext}`;
        break;

      case "listing":
        if (!options.userId || !options.listingId) {
          throw new Error("User ID and Listing ID required for listing");
        }
        fileName = `uploads/listings/${options.userId}/${options.listingId}/images/${timestamp}-${random}.${ext}`;
        break;

      default:
        fileName = `uploads/${category}/${timestamp}-${random}.${ext}`;
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Key: fileName,
        Body: fileBuffer,
        ContentType: (file as any).mimetype || "application/octet-stream",
      })
    );

    return {
      success: true,
      message: "File uploaded successfully",
      url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileName}`,
      key: fileName,
    };
  } catch (err) {
    console.error("❌ R2 Upload Failed:", err);
    throw new Error("Failed to upload to R2");
  }
};

// ✅ Delete from R2
export const deleteFromR2 = async (key: string) => {
  if (!isR2Configured || !s3) {
    console.warn("⚠️ Cloudflare R2 is not configured. Deletion skipped.");
    return;
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Key: key,
      })
    );
  } catch (err) {
    console.error("❌ Failed to delete from R2:", err);
    throw new Error("Failed to delete from R2");
  }
};

export default s3;
