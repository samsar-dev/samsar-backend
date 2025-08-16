/*
  Warnings:

  - You are about to drop the `RealEstateDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VehicleDetails` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RealEstateDetails" DROP CONSTRAINT "RealEstateDetails_listingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VehicleDetails" DROP CONSTRAINT "VehicleDetails_listingId_fkey";

-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "details" JSONB NOT NULL DEFAULT '{}';

-- DropTable
DROP TABLE "public"."RealEstateDetails";

-- DropTable
DROP TABLE "public"."VehicleDetails";
