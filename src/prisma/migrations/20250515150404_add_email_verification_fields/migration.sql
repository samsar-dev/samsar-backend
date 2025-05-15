/*
  Warnings:

  - You are about to drop the column `usageType` on the `RealEstateDetails` table. All the data in the column will be lost.
  - You are about to drop the column `accountLocked` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `accountLockedUntil` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `failedLoginAttempts` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastFailedLogin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `User` table. All the data in the column will be lost.
  - The `serviceHistory` column on the `VehicleDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `startType` column on the `VehicleDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `seatType` column on the `VehicleDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "FuelType" ADD VALUE 'biodiesel';

-- AlterTable
ALTER TABLE "RealEstateDetails" DROP COLUMN "usageType",
ADD COLUMN     "accessibility" TEXT,
ADD COLUMN     "appliances" TEXT,
ADD COLUMN     "basementFeatures" TEXT,
ADD COLUMN     "bathroomFeatures" TEXT,
ADD COLUMN     "communityFeatures" TEXT,
ADD COLUMN     "energyFeatures" TEXT,
ADD COLUMN     "exteriorFeatures" TEXT,
ADD COLUMN     "hoaFeatures" TEXT,
ADD COLUMN     "kitchenFeatures" TEXT,
ADD COLUMN     "landscaping" TEXT,
ADD COLUMN     "livingArea" DOUBLE PRECISION,
ADD COLUMN     "outdoorFeatures" TEXT,
ADD COLUMN     "parkingSpaces" INTEGER,
ADD COLUMN     "petFeatures" TEXT,
ADD COLUMN     "roofAge" INTEGER,
ADD COLUMN     "smartHomeFeatures" TEXT,
ADD COLUMN     "storageFeatures" TEXT,
ADD COLUMN     "windowFeatures" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accountLocked",
DROP COLUMN "accountLockedUntil",
DROP COLUMN "failedLoginAttempts",
DROP COLUMN "lastFailedLogin",
DROP COLUMN "lastLoginAt",
ADD COLUMN     "allowMessaging" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "listingNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPhoneNumber" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpires" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VehicleDetails" ADD COLUMN     "coolingSystem" TEXT,
ADD COLUMN     "customParts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "interiorHeight" TEXT,
ADD COLUMN     "interiorLength" TEXT,
ADD COLUMN     "seatingConfiguration" TEXT,
ADD COLUMN     "temperatureRange" TEXT,
DROP COLUMN "serviceHistory",
ADD COLUMN     "serviceHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "modifications" DROP NOT NULL,
ALTER COLUMN "modifications" DROP DEFAULT,
ALTER COLUMN "modifications" SET DATA TYPE TEXT,
DROP COLUMN "startType",
ADD COLUMN     "startType" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "seatType",
ADD COLUMN     "seatType" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");
