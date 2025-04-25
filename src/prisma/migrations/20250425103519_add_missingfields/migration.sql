/*
  Warnings:

  - You are about to drop the column `furnished` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `vin` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `conversionFeatures` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `engineNumber` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `entertainmentFeatures` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `interiorHeight` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `interiorLength` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `passengerFeatures` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `powerOutput` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `registrationExpiry` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `registrationStatus` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `tireCondition` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `vin` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to alter the column `cargoVolume` on the `VehicleDetails` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `hydraulicOutlets` column on the `VehicleDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "furnished",
DROP COLUMN "vin";

-- AlterTable
ALTER TABLE "RealEstateDetails" ADD COLUMN     "attic" TEXT,
ADD COLUMN     "basement" TEXT,
ADD COLUMN     "buildable" TEXT,
ADD COLUMN     "buildingRestrictions" TEXT,
ADD COLUMN     "elevation" INTEGER,
ADD COLUMN     "environmentalFeatures" TEXT,
ADD COLUMN     "flooringTypes" TEXT[],
ADD COLUMN     "halfBathrooms" INTEGER,
ADD COLUMN     "naturalFeatures" TEXT,
ADD COLUMN     "parcelNumber" TEXT,
ADD COLUMN     "permitsInPlace" TEXT,
ADD COLUMN     "soilTypes" TEXT[],
ADD COLUMN     "stories" INTEGER,
ADD COLUMN     "topography" TEXT[],
ADD COLUMN     "waterFeatures" TEXT;

-- AlterTable
ALTER TABLE "VehicleDetails" DROP COLUMN "conversionFeatures",
DROP COLUMN "engineNumber",
DROP COLUMN "entertainmentFeatures",
DROP COLUMN "interiorHeight",
DROP COLUMN "interiorLength",
DROP COLUMN "passengerFeatures",
DROP COLUMN "powerOutput",
DROP COLUMN "registrationExpiry",
DROP COLUMN "registrationStatus",
DROP COLUMN "tireCondition",
DROP COLUMN "vin",
ADD COLUMN     "bedLength" TEXT,
ADD COLUMN     "cabType" TEXT,
ADD COLUMN     "equipmentType" TEXT,
ADD COLUMN     "gps" BOOLEAN,
ADD COLUMN     "loadingFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxLiftingCapacity" TEXT,
ADD COLUMN     "operatingWeight" TEXT,
ADD COLUMN     "operatorCabType" TEXT,
ADD COLUMN     "payload" INTEGER,
ADD COLUMN     "ptoType" TEXT,
ADD COLUMN     "truckType" TEXT,
ALTER COLUMN "cargoVolume" SET DATA TYPE INTEGER,
DROP COLUMN "hydraulicOutlets",
ADD COLUMN     "hydraulicOutlets" INTEGER;
