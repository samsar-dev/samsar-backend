/**
 * Generates a user-friendly 10-digit numeric ID for listings
 * Format: XXXXXXXXXX (10 digits)
 * Range: 1000000000 to 9999999999
 */
export function generateListingId(): string {
  // Generate a random 10-digit number
  // Start from 1000000000 (10 digits) to 9999999999 (10 digits)
  const min = 1000000000;
  const max = 9999999999;
  
  const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomId.toString();
}

/**
 * Validates if a string is a valid 10-digit listing ID
 */
export function isValidListingId(id: string): boolean {
  return /^\d{10}$/.test(id);
}
