import sharp from "sharp";
import { FastifyRequest, FastifyReply } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { uploadToR2, UploadOptions } from "../config/cloudflareR2.js";

// Image compression configuration
const IMAGE_CONFIG = {
  // Only compress files larger than this threshold (KB)
  COMPRESSION_THRESHOLD_KB: 500,
  // Maximum dimensions for resizing
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  // Quality settings for different formats
  JPEG_QUALITY: 85,
  PNG_QUALITY: 85,
  WEBP_QUALITY: 85,
  WEBP_ALPHA_QUALITY: 90,
  // PNG compression level (0-9)
  PNG_COMPRESSION_LEVEL: 6,
  // WebP effort level (0-6, higher = better compression but slower)
  WEBP_EFFORT: 4,
};

// Define Express.Multer.File interface for compatibility
interface ExpressMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size?: number;
  stream?: NodeJS.ReadableStream;
  destination?: string;
  filename?: string;
  path?: string;
}

// Extend FastifyRequest for TypeScript support
declare module "fastify" {
  interface FastifyRequest {
    processedImages?: Array<{
      url: string;
      order: number;
    }>;
    uploadedFiles?: string[];
  }
}

// Image type check
function isImage(mimetype: string) {
  return mimetype.startsWith("image/");
}

// Smart image processing with configurable compression
export const processImage = async (
  buffer: Buffer,
  originalMimetype: string,
): Promise<{ buffer: Buffer; format: string; metadata?: any }> => {
  console.log(`🔧 Processing image: ${(buffer.length / 1024).toFixed(1)}KB, mimetype: ${originalMimetype}`);
  
  try {
    // Extract metadata to preserve orientation and other important data
    const metadata = await sharp(buffer).metadata();
    console.log(`📊 Image metadata: ${metadata.width}x${metadata.height}, channels: ${metadata.channels}, hasAlpha: ${metadata.hasAlpha}`);

    // Determine if we should compress based on file size and type
    const fileSizeKB = buffer.length / 1024;
    const shouldCompress = fileSizeKB > IMAGE_CONFIG.COMPRESSION_THRESHOLD_KB;
    
    if (!shouldCompress) {
      console.log("📁 File is small enough, skipping compression");
      let format = "jpg";
      if (originalMimetype === "image/png") format = "png";
      else if (originalMimetype === "image/webp") format = "webp";
      else if (originalMimetype === "image/jpeg") format = "jpg";
      
      return { buffer, format, metadata };
    }

    // Create a base sharp instance with proper orientation handling
    let processor = sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(IMAGE_CONFIG.MAX_WIDTH, IMAGE_CONFIG.MAX_HEIGHT, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      });

    // Smart format selection based on content and transparency
    if (metadata.hasAlpha && originalMimetype === "image/png") {
      // For PNGs with transparency, keep as PNG with gentle compression
      const processedBuffer = await processor
        .png({ 
          quality: IMAGE_CONFIG.PNG_QUALITY,
          compressionLevel: IMAGE_CONFIG.PNG_COMPRESSION_LEVEL,
          palette: true // Use palette when possible for smaller files
        })
        .toBuffer();
      
      console.log(`✅ PNG processed: ${(buffer.length / 1024).toFixed(1)}KB → ${(processedBuffer.length / 1024).toFixed(1)}KB`);
      return { buffer: processedBuffer, format: "png", metadata };
      
    } else if (originalMimetype === "image/webp") {
      // Keep WebP format with optimized settings
      const processedBuffer = await processor
        .webp({
          quality: IMAGE_CONFIG.WEBP_QUALITY,
          alphaQuality: IMAGE_CONFIG.WEBP_ALPHA_QUALITY,
          lossless: false,
          nearLossless: false,
          smartSubsample: true,
          effort: IMAGE_CONFIG.WEBP_EFFORT,
        })
        .toBuffer();
      
      console.log(`✅ WebP processed: ${(buffer.length / 1024).toFixed(1)}KB → ${(processedBuffer.length / 1024).toFixed(1)}KB`);
      return { buffer: processedBuffer, format: "webp", metadata };
      
    } else {
      // For JPEG and other formats, convert to JPEG with high quality
      const processedBuffer = await processor
        .jpeg({
          quality: IMAGE_CONFIG.JPEG_QUALITY,
          progressive: true, // Progressive loading
          mozjpeg: true, // Use mozjpeg for better compression
        })
        .toBuffer();
      
      console.log(`✅ JPEG processed: ${(buffer.length / 1024).toFixed(1)}KB → ${(processedBuffer.length / 1024).toFixed(1)}KB`);
      return { buffer: processedBuffer, format: "jpg", metadata };
    }
    
  } catch (error) {
    console.error("❌ Image processing failed, returning original:", error);
    // Fallback: return original image if processing fails
    let format = "jpg";
    if (originalMimetype === "image/png") format = "png";
    else if (originalMimetype === "image/webp") format = "webp";
    else if (originalMimetype === "image/jpeg") format = "jpg";
    
    return { buffer, format };
  }
};

// Middleware: Process & upload all images
export const processImagesMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MIN_FILE_SIZE = 5 * 1024; // 5KB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  try {
    if (!request.isMultipart()) {
      console.log("Request is not multipart");
      return;
    }

    const processedImages: Array<{ url: string; order: number }> = [];
    const uploadedFiles: string[] = [];
    const formData: Record<string, any> = {};
    let index = 0;

    console.log("🔍 Request headers:", request.headers);
    console.log("🔍 Request method:", request.method);
    console.log("🔍 Initial request body:", request.body);

    // Process all parts (files and fields)
    const parts = await request.parts();
    console.log("🔍 Found multipart parts");

    for await (const part of parts) {
      console.log("🔍 Processing part:", {
        type: part.type,
        fieldname: part.fieldname,
        filename: part.type === "file" ? part.filename : undefined,
        mimetype: part.type === "file" ? part.mimetype : undefined,
      });
      if (part.type === "file" && isImage(part.mimetype)) {
        // Process image file
        console.log(
          `Processing image file: ${part.filename}, field: ${part.fieldname}, size: ${(part.file.bytesRead / 1024).toFixed(1)}KB`,
        );
        const fileBuffer = await part.toBuffer();
        const originalSizeKB = (fileBuffer.length / 1024).toFixed(1);
        const { buffer: processedBuffer, format, metadata } = await processImage(
          fileBuffer,
          part.mimetype,
        );

        console.log(
          `📸 Image processed: ${originalSizeKB}KB → ${(processedBuffer.length / 1024).toFixed(1)}KB (${format})`,
        );

        const fileForUpload: ExpressMulterFile = {
          fieldname: part.fieldname,
          originalname: part.filename || `image-${Date.now()}.${format}`,
          encoding: part.encoding,
          mimetype: format === "webp" ? "image/webp" : `image/${format}`,
          buffer: processedBuffer,
          size: processedBuffer.length,
        } as any;

        // Get user and listing IDs from request
        const userId = (request as any).user?.id;
        const listingId = (request.body as any)?.listingId;

        if (!userId) {
          throw new Error("User authentication required for uploads");
        }

        // Determine upload type based on fieldname
        let uploadType: "avatar" | "listing" | "other" = "other";
        if (
          part.fieldname === "avatar" ||
          part.fieldname === "profilePicture"
        ) {
          uploadType = "avatar";
        } else if (listingId) {
          uploadType = "listing";
        } else {
          uploadType = "other"; // temporary until listingId is available
        }

        const uploadOptions: UploadOptions = {
          userId,
          originalName: fileForUpload.originalname,
          ...(listingId && { listingId }),
        };
        console.log("fileForUpload:", fileForUpload);
        console.log("uploadType:", uploadType);
        console.log("uploadOptions:", uploadOptions);

        const uploadResult = await uploadToR2(
          fileForUpload,
          uploadType,
          uploadOptions,
        );

        if (uploadResult?.url) {
          const url = uploadResult.url;
          processedImages.push({ url, order: index++ });
          uploadedFiles.push(url);
        }
      } else if (part.type === "field") {
        // Process form field
        const fieldValue = await part.value;
        if (typeof fieldValue !== "string") {
          console.error("🔍 Field value is not a string:", part.fieldname);
          continue;
        }

        console.log("🔍 Processing field:", part.fieldname, fieldValue);

        try {
          // Try to parse as JSON if it looks like JSON
          if (fieldValue.startsWith("[") || fieldValue.startsWith("{")) {
            try {
              formData[part.fieldname] = JSON.parse(fieldValue);
              console.log("🔍 Successfully parsed JSON for", part.fieldname);
            } catch (error) {
              console.error(
                "🔍 Failed to parse JSON for",
                part.fieldname,
                error,
              );
              formData[part.fieldname] = fieldValue;
            }
          } else {
            formData[part.fieldname] = fieldValue;
          }
        } catch (error) {
          console.error("🔍 Error processing field", part.fieldname, error);
          formData[part.fieldname] = fieldValue;
        }
      }
    }

    request.processedImages = processedImages;
    request.uploadedFiles = uploadedFiles;

    console.log("🔍 Form data collected:", formData);

    // Merge formData with existing body instead of replacing it
    const mergedBody = {
      ...(typeof request.body === "object" ? request.body : {}),
      ...formData,
    } as Record<string, any>;

    console.log("🔍 Final merged body:", mergedBody);
    request.body = mergedBody;

    console.log(
      "Processed request body:",
      JSON.stringify(request.body, null, 2),
    );
    console.log("Processed images:", processedImages);
  } catch (error) {
    console.error("❌ Error in processImagesMiddleware:", error);
    reply.status(500).send({ error: "Image processing failed" });
  }
};

// Middleware: Upload raw files without processing
export const uploadMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    if (!request.isMultipart()) {
      return;
    }

    const parts = request.parts();
    const uploadedFiles: string[] = [];

    for await (const part of parts) {
      if (part.type !== "file") continue;
      if (!isImage(part.mimetype)) continue;

      const chunks: Uint8Array[] = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Create a temporary file for the image
      const tempFilename = `upload-${crypto.randomUUID()}${path.extname(part.filename || "")}`;
      const tempFilePath = path.join(process.cwd(), "temp", tempFilename);

      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write buffer to temp file
      fs.writeFileSync(tempFilePath, buffer);

      const fileForUpload: ExpressMulterFile = {
        fieldname: part.fieldname,
        originalname: part.filename || tempFilename,
        encoding: part.encoding,
        mimetype: part.mimetype,
        buffer,
        size: buffer.length,
        destination: tempDir,
        filename: tempFilename,
        path: tempFilePath,
      };

      // Get user ID and request context
      const userId = (request as any).user?.id;
      const listingId = (request as any).body?.listingId;

      if (!userId) {
        throw new Error("User authentication required for file uploads");
      }

      // Determine the upload type based on the request context
      let uploadType = "other";
      const isProfilePicture = ["avatar", "profilePicture", "profile"].includes(
        part.fieldname?.toLowerCase(),
      );
      const isListingImage =
        part.fieldname?.toLowerCase().includes("listing") || listingId;

      if (isProfilePicture) {
        uploadType = "avatar";
      } else if (isListingImage) {
        uploadType = "listing";
        if (!listingId) {
          throw new Error("Listing ID is required for listing image uploads");
        }
      }

      // Set up upload options
      const uploadOptions: UploadOptions = {
        userId,
        originalName: fileForUpload.originalname,
      };

      // Add listing ID if this is a listing image
      if (uploadType === "listing") {
        uploadOptions.listingId = listingId;
      }

      console.log(
        `Uploading ${uploadType} file for user ${userId}${listingId ? `, listing ${listingId}` : ""}`,
      );

      // Upload the file to R2
      const uploadResult = await uploadToR2(
        fileForUpload,
        uploadType,
        uploadOptions,
      );

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      if (uploadResult?.url) {
        uploadedFiles.push(uploadResult.url);
      }
    }

    request.uploadedFiles = uploadedFiles;
  } catch (error) {
    console.error("❌ Error in uploadMiddleware:", error);
    reply.status(500).send({ error: "Upload failed" });
  }
};

// Re-export for convenience

export { default as s3 } from "../config/cloudflareR2.js";

// Placeholder for upload object to maintain compatibility
export const upload = {
  single:
    (fieldname: string) =>
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Implement single file upload logic if needed
    },
  array:
    (fieldname: string, maxCount: number) =>
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Implement array upload logic if needed
    },
};
