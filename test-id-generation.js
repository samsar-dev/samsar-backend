// Quick test for the new ID generation
import { generateListingId, isValidListingId } from './utils/idGenerator.utils.js';

// Generate 10 test IDs
for (let i = 0; i < 10; i++) {
  const id = generateListingId();
  const isValid = isValidListingId(id);
}

