/*
  Warnings:

  - The `yearBuilt` column on the `RealEstateDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bedrooms` column on the `RealEstateDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bathrooms` column on the `RealEstateDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RealEstateDetails" ADD COLUMN     "floorLevel" INTEGER,
ADD COLUMN     "isBuildable" BOOLEAN,
ADD COLUMN     "totalArea" DOUBLE PRECISION,
ADD COLUMN     "usageType" TEXT,
DROP COLUMN "yearBuilt",
ADD COLUMN     "yearBuilt" INTEGER,
DROP COLUMN "bedrooms",
ADD COLUMN     "bedrooms" INTEGER,
DROP COLUMN "bathrooms",
ADD COLUMN     "bathrooms" DOUBLE PRECISION;
