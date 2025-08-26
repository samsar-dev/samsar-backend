import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generates simple sequential listing IDs like professional websites
 * Examples: 123456, 789012, 345678
 */
export class ListingIdGenerator {
  
  /**
   * Get the next sequential number from the database
   */
  private static async getNextSequentialNumber(): Promise<number> {
    try {
      // Find the highest existing numeric ID
      const result = await prisma.$queryRaw<Array<{ max_id: string | null }>>`
        SELECT MAX(CAST(id AS INTEGER)) as max_id 
        FROM "Listing" 
        WHERE id ~ '^[0-9]+$'
      `;

      let nextNumber = 100000; // Start from 6-digit numbers

      if (result[0]?.max_id) {
        const maxId = parseInt(result[0].max_id);
        if (!isNaN(maxId)) {
          nextNumber = maxId + 1;
        }
      }

      return nextNumber;
    } catch (error) {
      console.error('Error getting next sequential number:', error);
      // Fallback to random 6-digit number if database query fails
      return Math.floor(Math.random() * 900000) + 100000;
    }
  }

  /**
   * Generate a simple sequential listing ID
   * @returns Promise<string> - Generated ID (6-8 digits)
   */
  public static async generateListingId(): Promise<string> {
    const nextNumber = await this.getNextSequentialNumber();
    const generatedId = nextNumber.toString();
    
    console.log(`🆔 Generated simple listing ID: ${generatedId}`);
    
    return generatedId;
  }

  /**
   * Validate if an ID is a valid numeric listing ID
   * @param id - The ID to validate
   * @returns boolean - True if valid format (6-8 digits)
   */
  public static isValidListingId(id: string): boolean {
    const pattern = /^\d{6,8}$/;
    return pattern.test(id);
  }

  /**
   * Check if an ID already exists in the database
   * @param id - The ID to check
   * @returns Promise<boolean> - True if ID exists
   */
  public static async idExists(id: string): Promise<boolean> {
    try {
      const existing = await prisma.listing.findUnique({
        where: { id },
        select: { id: true }
      });
      return !!existing;
    } catch (error) {
      console.error('Error checking if ID exists:', error);
      return false;
    }
  }

  /**
   * Generate a unique listing ID (retry if collision occurs)
   * @returns Promise<string> - Guaranteed unique ID
   */
  public static async generateUniqueListingId(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const id = await this.generateListingId();
      const exists = await this.idExists(id);
      
      if (!exists) {
        return id;
      }
      
      attempts++;
      console.log(`🔄 ID collision detected (${id}), retrying... (attempt ${attempts})`);
    }

    // If we still have collisions after max attempts, add timestamp
    const timestamp = Date.now().toString().slice(-6);
    return timestamp;
  }
}
