// Quick test for the new ID generation
import { generateListingId, isValidListingId } from './utils/idGenerator.utils.js';

console.log('Testing 10-digit ID generation...');

// Generate 10 test IDs
for (let i = 0; i < 10; i++) {
  const id = generateListingId();
  const isValid = isValidListingId(id);
  console.log(`ID ${i + 1}: ${id} - Valid: ${isValid} - Length: ${id.length}`);
}

console.log('\nTesting validation function...');
console.log('Valid ID (1234567890):', isValidListingId('1234567890'));
console.log('Invalid ID (123):', isValidListingId('123'));
console.log('Invalid ID (abc1234567):', isValidListingId('abc1234567'));
console.log('Invalid ID (12345678901):', isValidListingId('12345678901'));
