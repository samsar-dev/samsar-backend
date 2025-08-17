-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "fuelType" TEXT,
ADD COLUMN     "make" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "transmissionType" TEXT,
ADD COLUMN     "year" INTEGER;
