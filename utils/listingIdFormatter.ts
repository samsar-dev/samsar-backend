/**
 * Utility functions for formatting listing IDs for user-friendly display
 */

/**
 * Converts a cuid() to a user-friendly 8-digit display ID
 * @param cuid - The original cuid() from database
 * @returns Formatted ID like "#12345678"
 */
export function formatListingIdForDisplay(cuid: string): string {
  // Extract numeric characters from cuid and pad to ensure 8 digits
  const numericChars = cuid.replace(/[^0-9]/g, '');
  
  // If we have enough digits, take first 8
  if (numericChars.length >= 8) {
    return `#${numericChars.substring(0, 8)}`;
  }
  
  // If not enough digits, use hash of the cuid to generate consistent 8-digit number
  let hash = 0;
  for (let i = 0; i < cuid.length; i++) {
    const char = cuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive number and format to 8 digits
  const displayId = Math.abs(hash).toString().padStart(8, '0').substring(0, 8);
  return `#${displayId}`;
}

/**
 * Extracts the display ID from a formatted listing ID
 * @param displayId - Formatted ID like "#12345678"
 * @returns Just the numeric part "12345678"
 */
export function extractDisplayId(displayId: string): string {
  return displayId.replace('#', '');
}

/**
 * Validates if a string is a valid display ID format
 * @param displayId - String to validate
 * @returns boolean indicating if valid
 */
export function isValidDisplayId(displayId: string): boolean {
  const pattern = /^#\d{8}$/;
  return pattern.test(displayId);
}
