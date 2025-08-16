-- AlterEnum
ALTER TYPE "public"."VehicleType" ADD VALUE 'STORE';

-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "sellerType" TEXT;
