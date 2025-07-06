// Cloudflare R2
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
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

    // Always require user ID for all uploads
    if (!options.userId) {
      throw new Error("User ID is required for all uploads");
    }
    
    // Generate file paths under the user's directory
    switch (category.toLowerCase()) {
      case "avatar":
        // Store avatars in user's avatar directory with unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        fileName = `uploads/users/${options.userId}/avatar/profile-${uniqueSuffix}.${ext}`;
        break;

      case "listing":
        if (!options.listingId) {
          throw new Error("Listing ID is required for listing images");
        }
        // Store listing images in user's listings directory
        fileName = `uploads/users/${options.userId}/listings/${options.listingId}/images/${timestamp}-${random}.${ext}`;
        break;

      default:
        // Store other uploads in user's directory
        fileName = `uploads/users/${options.userId}/${category}/${timestamp}-${random}.${ext}`;
    }
    
    console.log(`Uploading file to: ${fileName}`);

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
/**
 * Move an object within R2 (copy then delete original)
 */
export const moveObjectInR2 = async (oldKey: string, newKey: string): Promise<{success:boolean; message:string; url?:string}> => {
  if (!isR2Configured || !s3) {
    return { success:false, message:"Cloudflare R2 not configured"};
  }
  try {
    await s3.send(new CopyObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      CopySource: `${process.env.CLOUDFLARE_R2_BUCKET}/${oldKey}`,
      Key: newKey,
    }));
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: oldKey,
    }));
    return {success:true, message:"Object moved", url:`${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${newKey}`};
  } catch(err){
    console.error('Failed to move object in R2', err);
    return {success:false, message:'Failed to move object'};
  }
};

export const deleteFromR2 = async (keyOrOptions: string | { userId: string; type: 'avatar' | 'listing'; listingId?: string }): Promise<{ success: boolean; message: string }> => {
  if (!isR2Configured || !s3) {
    console.warn("⚠️ Cloudflare R2 is not configured. Delete operation skipped.");
    return { success: false, message: "Cloudflare R2 not configured" };
  }

  try {
    let key: string;

    // Handle different parameter types
    if (typeof keyOrOptions === 'string') {
      key = keyOrOptions;
    } else {
      const { userId, type, listingId } = keyOrOptions;
      
      switch (type) {
        case 'avatar':
          // Get the file extension from the existing avatar if needed
          key = `uploads/users/${userId}/avatar/profile.jpg`; // Default to jpg, adjust if needed
          break;
          
        case 'listing':
          if (!listingId) {
            throw new Error("Listing ID is required for deleting listing images");
          }
          // This will delete all images for a specific listing
          key = `uploads/users/${userId}/listings/${listingId}`;
          break;
          
        default:
          throw new Error("Invalid file type for deletion");
      }
    }

    console.log(`Deleting file from R2: ${key}`);
    
    // If the key ends with a directory, we need to list and delete all files in that directory
    if (key.endsWith('/') || !key.includes('.')) {
      // This is a directory, list all files and delete them
      // Note: You'll need to implement listObjectsV2 and deleteObjects if you want to delete directories
      console.warn("⚠️ Directory deletion not fully implemented. Need to list and delete all files in the directory.");
      // For now, we'll just try to delete the directory itself (which may work if it's empty)
    }
    
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Key: key,
      })
    );
    
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("❌ Failed to delete file from R2:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to delete file from R2" 
    };
  }
};

export default s3;
