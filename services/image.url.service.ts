import { StorageProvider } from '@prisma/client';

export interface ImageUrlOptions {
  variant?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
}

export class ImageUrlService {
  /**
   * Build image URL from storage provider and key
   */
  static buildImageUrl(
    provider: StorageProvider,
    storageKey: string,
    options: ImageUrlOptions = {}
  ): string {
    switch (provider) {
      case 'CLOUDFLARE':
        return this.buildCloudflareUrl(storageKey, options);
      case 'R2':
        return this.buildR2Url(storageKey, options);
      case 'S3':
        return this.buildS3Url(storageKey, options);
      case 'LOCAL':
        return this.buildLocalUrl(storageKey, options);
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  /**
   * Build Cloudflare Images URL with transformations
   */
  private static buildCloudflareUrl(storageKey: string, options: ImageUrlOptions): string {
    const baseUrl = process.env.CLOUDFLARE_IMAGES_BASE_URL || 'https://imagedelivery.net';
    const accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH;
    
    if (!accountHash) {
      throw new Error('CLOUDFLARE_ACCOUNT_HASH environment variable is required');
    }

    let transformations: string[] = [];
    
    if (options.width) transformations.push(`width=${options.width}`);
    if (options.height) transformations.push(`height=${options.height}`);
    if (options.quality) transformations.push(`quality=${options.quality}`);
    if (options.format) transformations.push(`format=${options.format}`);
    
    // Handle predefined variants
    if (options.variant) {
      switch (options.variant) {
        case 'thumb':
          transformations = ['width=150', 'height=150', 'fit=crop'];
          break;
        case 'sm':
          transformations = ['width=400', 'height=300', 'fit=scale-down'];
          break;
        case 'lg':
          transformations = ['width=1200', 'height=900', 'fit=scale-down'];
          break;
      }
    }

    const transformString = transformations.length > 0 ? transformations.join(',') : 'public';
    return `${baseUrl}/${accountHash}/${storageKey}/${transformString}`;
  }

  /**
   * Build R2 URL (Cloudflare R2)
   */
  private static buildR2Url(storageKey: string, options: ImageUrlOptions): string {
    const baseUrl = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;
    
    if (!baseUrl) {
      throw new Error('R2_PUBLIC_URL environment variable is required');
    }

    // R2 doesn't have built-in transformations, so return direct URL
    // You could integrate with Cloudflare Images or other transform service
    return `${baseUrl}/${storageKey}`;
  }

  /**
   * Build S3 URL
   */
  private static buildS3Url(storageKey: string, options: ImageUrlOptions): string {
    const bucketName = process.env.S3_BUCKET_NAME;
    const region = process.env.S3_REGION || 'us-east-1';
    
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }

    // Basic S3 URL - you could integrate with CloudFront for transformations
    return `https://${bucketName}.s3.${region}.amazonaws.com/${storageKey}`;
  }

  /**
   * Build local file URL
   */
  private static buildLocalUrl(storageKey: string, options: ImageUrlOptions): string {
    const baseUrl = process.env.LOCAL_STORAGE_BASE_URL || 'http://localhost:3000/uploads';
    return `${baseUrl}/${storageKey}`;
  }

  /**
   * Extract storage key from existing URL (for migration)
   */
  static extractStorageKeyFromUrl(url: string, provider: StorageProvider): string {
    switch (provider) {
      case 'CLOUDFLARE':
        // Extract from Cloudflare Images URL pattern
        const cfMatch = url.match(/\/([^\/]+)\/([^\/]+)$/);
        return cfMatch ? cfMatch[2] : url;
      case 'R2':
      case 'S3':
      case 'LOCAL':
        // Extract path after domain
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1); // Remove leading slash
      default:
        return url;
    }
  }

  /**
   * Generate storage key for new uploads
   */
  static generateStorageKey(listingId: string, filename: string, index: number = 0): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop() || 'jpg';
    return `listings/${listingId}/${timestamp}_${index}.${extension}`;
  }

  /**
   * Get all variants for an image
   */
  static getImageVariants(
    provider: StorageProvider,
    storageKey: string
  ): Record<string, string> {
    return {
      original: this.buildImageUrl(provider, storageKey),
      thumb: this.buildImageUrl(provider, storageKey, { variant: 'thumb' }),
      sm: this.buildImageUrl(provider, storageKey, { variant: 'sm' }),
      lg: this.buildImageUrl(provider, storageKey, { variant: 'lg' }),
    };
  }
}
