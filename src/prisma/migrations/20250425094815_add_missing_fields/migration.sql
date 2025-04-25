/*
  Warnings:

  - You are about to drop the column `axleConfiguration` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `bedLength` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `bodyFeatures` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `cabType` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `cargoCapacity` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `cargoFeatures` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `gvwr` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `payload` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `towingCapacity` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `truckType` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `wheelbase` on the `VehicleDetails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VehicleDetails" DROP COLUMN "axleConfiguration",
DROP COLUMN "bedLength",
DROP COLUMN "bodyFeatures",
DROP COLUMN "cabType",
DROP COLUMN "cargoCapacity",
DROP COLUMN "cargoFeatures",
DROP COLUMN "gvwr",
DROP COLUMN "payload",
DROP COLUMN "towingCapacity",
DROP COLUMN "truckType",
DROP COLUMN "wheelbase",
ADD COLUMN     "emissionStandard" TEXT,
ADD COLUMN     "enginePower" TEXT,
ADD COLUMN     "engineTorque" TEXT,
ADD COLUMN     "entertainmentFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "powerOutput" INTEGER,
ADD COLUMN     "seatBelts" TEXT,
ALTER COLUMN "hitchCapacity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "hydraulicFlow" SET DATA TYPE DOUBLE PRECISION;
