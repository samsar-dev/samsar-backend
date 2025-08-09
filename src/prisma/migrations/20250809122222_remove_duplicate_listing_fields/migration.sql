/*
  Warnings:

  - The values [USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bathrooms` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `engineNumber` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `engineSize` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `floors` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `fuelType` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `interiorColor` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `make` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `mileage` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `parkingSpaces` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `transmission` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `utilities` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `yearBuilt` on the `Listing` table. All the data in the column will be lost.
  - Added the required column `latitude` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('USER', 'LISTING', 'MESSAGE', 'COMMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'MISLEADING', 'OFFENSIVE', 'HARASSMENT', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('FREE_USER', 'PREMIUM_USER', 'BUSINESS_USER', 'ADMIN', 'MODERATOR');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'FREE_USER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Listing" DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "color",
DROP COLUMN "engineNumber",
DROP COLUMN "engineSize",
DROP COLUMN "floors",
DROP COLUMN "fuelType",
DROP COLUMN "interiorColor",
DROP COLUMN "make",
DROP COLUMN "mileage",
DROP COLUMN "model",
DROP COLUMN "parkingSpaces",
DROP COLUMN "size",
DROP COLUMN "transmission",
DROP COLUMN "utilities",
DROP COLUMN "year",
DROP COLUMN "yearBuilt",
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "viewUsersId" TEXT[],
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "last_active_at" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "listingRestriction" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "loginNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "maxListings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "newsletterSubscribed" BOOLEAN DEFAULT true,
ADD COLUMN     "privateProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'INACTIVE',
ALTER COLUMN "role" SET DEFAULT 'FREE_USER';

-- AlterTable
ALTER TABLE "public"."VehicleDetails" ADD COLUMN     "engineNumber" TEXT,
ADD COLUMN     "registrationExpiry" TEXT,
ADD COLUMN     "transmission" TEXT;

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "public"."ReportReason" NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reporterId" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."View" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "userIp" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_type_targetId_idx" ON "public"."Report"("type", "targetId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");

-- CreateIndex
CREATE INDEX "View_createdAt_idx" ON "public"."View"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "View_listingId_userId_userIp_key" ON "public"."View"("listingId", "userId", "userIp");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
