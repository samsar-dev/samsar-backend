/*
  Warnings:
  - The values [USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
*/

-- Rename the old enum type
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

-- Create the new enum type
CREATE TYPE "UserRole" AS ENUM ('FREE_USER', 'PREMIUM_USER', 'BUSINESS_USER', 'ADMIN', 'MODERATOR');

-- Update the User table to use the new enum
ALTER TABLE "User" 
  ALTER COLUMN "role" TYPE "UserRole" 
  USING (
    CASE "role"::text
      WHEN 'USER' THEN 'FREE_USER'::"UserRole"
      WHEN 'ADMIN' THEN 'ADMIN'::"UserRole"
      WHEN 'MODERATOR' THEN 'MODERATOR'::"UserRole"
      ELSE 'FREE_USER'::"UserRole"
    END
  );

-- Set default value
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'FREE_USER';

-- Drop the old enum
DROP TYPE "UserRole_old";

-- Add new columns (only once)
ALTER TABLE "User" 
  ADD COLUMN "maxListings" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "listingRestriction" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "subscriptionId" TEXT,
  ADD COLUMN "subscriptionStatus" TEXT DEFAULT 'INACTIVE',
  ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);

-- Update existing users' role to FREE_USER if they were USER
UPDATE "User" SET "role" = 'FREE_USER' WHERE "role" IS NULL OR "role"::text = 'USER';