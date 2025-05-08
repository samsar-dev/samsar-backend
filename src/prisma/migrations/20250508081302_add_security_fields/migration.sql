/*
  Warnings:

  - You are about to drop the column `accessibility` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `appliances` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `basementFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `bathroomFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `communityFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `energyFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `exteriorFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `hoaFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `kitchenFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `landscaping` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `livingArea` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `outdoorFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `parkingSpaces` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `petFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `roofAge` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `smartHomeFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `storageFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `windowFeatures` on the `RealEstateDetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RealEstateDetails" DROP COLUMN "accessibility",
DROP COLUMN "appliances",
DROP COLUMN "basementFeatures",
DROP COLUMN "bathroomFeatures",
DROP COLUMN "communityFeatures",
DROP COLUMN "energyFeatures",
DROP COLUMN "exteriorFeatures",
DROP COLUMN "hoaFeatures",
DROP COLUMN "kitchenFeatures",
DROP COLUMN "landscaping",
DROP COLUMN "livingArea",
DROP COLUMN "outdoorFeatures",
DROP COLUMN "parkingSpaces",
DROP COLUMN "petFeatures",
DROP COLUMN "roofAge",
DROP COLUMN "smartHomeFeatures",
DROP COLUMN "storageFeatures",
DROP COLUMN "windowFeatures",
ADD COLUMN     "usageType" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accountLockedUntil" TIMESTAMP(3),
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastFailedLogin" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);
