import { PrismaClient, ImageStatus, StorageProvider } from '@prisma/client';
import fetch from 'node-fetch';
import { ImageUrlService } from './image.url.service.js';

const prisma = new PrismaClient();

export class ImageValidationService {
  /**
   * Validate if an image URL is accessible and returns proper response
   */
  static async validateImageUrl(url: string): Promise<{
    status: ImageStatus;
    statusCode?: number;
    contentType?: string;
    contentLength?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const fileSize = contentLength ? parseInt(contentLength) : 0;

      // Determine status based on response
      let status: ImageStatus = 'VALID';
      
      if (!response.ok) {
        status = 'BROKEN_URL';
      } else if (!contentType?.startsWith('image/')) {
        status = 'UNSUPPORTED_FORMAT';
      } else if (fileSize > 10 * 1024 * 1024) { // 10MB limit
        status = 'TOO_LARGE';
      }

      return {
        status,
        statusCode: response.status,
        contentType: contentType || undefined,
        contentLength: fileSize,
      };
    } catch (error) {
      return {
        status: 'BROKEN_URL',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch validate multiple image URLs
   */
  static async validateMultipleImages(urls: string[]): Promise<Array<{
    url: string;
    status: ImageStatus;
    statusCode?: number;
    contentType?: string;
    contentLength?: number;
    error?: string;
  }>> {
    const validationPromises = urls.map(async (url) => {
      const result = await this.validateImageUrl(url);
      return { url, ...result };
    });

    return Promise.all(validationPromises);
  }

  /**
   * Validate all images for a specific listing
   */
  static async validateListingImages(listingId: string): Promise<{
    totalImages: number;
    validImages: number;
    invalidImages: string[];
  }> {
    const images = await prisma.image.findMany({
      where: { listingId },
      select: { 
        id: true, 
        url: true, 
        storageProvider: true, 
        storageKey: true 
      }
    });

    // Build URLs from storage keys if URL is not available
    const urlsToValidate = images.map(img => {
      if (img.url) return img.url;
      return ImageUrlService.buildImageUrl(img.storageProvider, img.storageKey);
    });

    const validationResults = await this.validateMultipleImages(urlsToValidate);

    const invalidImages: string[] = [];
    let validCount = 0;

    // Count valid/invalid images and update database
    for (let i = 0; i < images.length; i++) {
      const result = validationResults[i];
      const image = images[i];

      if (result.status === 'VALID') {
        validCount++;
      } else {
        invalidImages.push(urlsToValidate[i]);
      }

      // Update image status in database
      await prisma.image.update({
        where: { id: image.id },
        data: {
          status: result.status,
          lastChecked: new Date(),
          fileSize: result.contentLength,
          format: result.contentType?.split('/')[1],
        }
      });
    }

    return {
      totalImages: images.length,
      validImages: validCount,
      invalidImages
    };
  }
}
