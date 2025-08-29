import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import prisma from "../src/lib/prismaClient.js";
import dotenv from "dotenv";

dotenv.config();

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
});

interface OrphanedImage {
  key: string;
  lastModified: Date;
  size: number;
}

/**
 * Find all images in the "other" category that are older than specified hours
 */
async function findOrphanedImages(olderThanHours: number = 24): Promise<OrphanedImage[]> {
  const orphanedImages: OrphanedImage[] = [];
  const cutoffDate = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
  
  try {
    let continuationToken: string | undefined;
    
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Prefix: "uploads/users/",
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });
      
      const response = await s3Client.send(listCommand);
      
      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Key.includes("/other/") && object.LastModified) {
            // Check if image is older than cutoff date
            if (object.LastModified < cutoffDate) {
              orphanedImages.push({
                key: object.Key,
                lastModified: object.LastModified,
                size: object.Size || 0,
              });
            }
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    return orphanedImages;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if an image is referenced in the database
 */
async function isImageReferenced(imageKey: string): Promise<boolean> {
  const imageUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${imageKey}`;
  
  try {
    // Check if image is referenced in listings
    const listingImage = await prisma.listing.findFirst({
      where: {
        images: {
          some: {
            OR: [
              { url: imageUrl },
              { storageKey: imageKey }
            ]
          }
        }
      }
    });
    
    if (listingImage) return true;
    
    // Check if image is referenced as user avatar
    const userAvatar = await prisma.user.findFirst({
      where: {
        OR: [
          { profilePicture: imageUrl },
          { profilePicture: { contains: imageKey } }
        ]
      }
    });
    
    if (userAvatar) return true;
    
    return false;
  } catch (error) {
    return true; // Err on the side of caution - don't delete if we can't verify
  }
}

/**
 * Delete orphaned images from Cloudflare R2
 */
async function deleteOrphanedImages(imagesToDelete: OrphanedImage[]): Promise<void> {
  if (imagesToDelete.length === 0) {
    return;
  }
  
  // Delete in batches of 1000 (AWS S3/R2 limit)
  const batchSize = 1000;
  
  for (let i = 0; i < imagesToDelete.length; i += batchSize) {
    const batch = imagesToDelete.slice(i, i + batchSize);
    
    try {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Delete: {
          Objects: batch.map(img => ({ Key: img.key })),
          Quiet: false,
        },
      });
      
      const response = await s3Client.send(deleteCommand);
      
      if (response.Deleted) {
        response.Deleted.forEach(deleted => {
        });
      }
      
      if (response.Errors && response.Errors.length > 0) {
        response.Errors.forEach(error => {
        });
      }
    } catch (error) {
    }
  }
}

/**
 * Main cleanup function
 */
export async function cleanupOrphanedImages(options: {
  olderThanHours?: number;
  dryRun?: boolean;
  skipDatabaseCheck?: boolean;
} = {}): Promise<void> {
  const { olderThanHours = 24, dryRun = false, skipDatabaseCheck = false } = options;

  try {
    // Find all potentially orphaned images
    const orphanedImages = await findOrphanedImages(olderThanHours);
    
    if (orphanedImages.length === 0) {
      return;
    }
    
    // Calculate total size
    const totalSize = orphanedImages.reduce((sum, img) => sum + img.size, 0);
    
    let imagesToDelete = orphanedImages;
    
    // Check database references if not skipped
    if (!skipDatabaseCheck) {
      imagesToDelete = [];
      
      for (const image of orphanedImages) {
        const isReferenced = await isImageReferenced(image.key);
        if (!isReferenced) {
          imagesToDelete.push(image);
        } else {
        }
      }
      
    }
    
    if (dryRun) {
      imagesToDelete.forEach(img => {
      });
    } else {
      // Actually delete the images
      await deleteOrphanedImages(imagesToDelete);
    }
    
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipDbCheck = args.includes('--skip-db-check');
  const hoursArg = args.find(arg => arg.startsWith('--hours='));
  const hours = hoursArg ? parseInt(hoursArg.split('=')[1]) : 24;
  
  cleanupOrphanedImages({
    olderThanHours: hours,
    dryRun,
    skipDatabaseCheck: skipDbCheck
  }).catch(console.error);
}
