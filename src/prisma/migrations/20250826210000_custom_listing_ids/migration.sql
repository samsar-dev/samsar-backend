-- Custom migration to handle listing ID changes without resetting database
-- This migration ensures the Listing table can accept custom string IDs

-- Remove the default cuid() constraint if it exists
ALTER TABLE "Listing" ALTER COLUMN "id" DROP DEFAULT;

-- Ensure the id column is properly set as String type (it should already be)
-- No changes needed as schema already defines id as String

-- Create a sequence for generating numeric IDs if needed
CREATE SEQUENCE IF NOT EXISTS listing_id_seq START 100000;
