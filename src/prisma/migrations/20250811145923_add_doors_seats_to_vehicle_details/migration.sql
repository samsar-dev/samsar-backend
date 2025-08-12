/*
  Warnings:

  - The values [TRUCK,RV,OTHER,VAN,BUS,CONSTRUCTION,TRACTOR] on the enum `VehicleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `busType` on the `VehicleDetails` table. All the data in the column will be lost.
  - You are about to drop the column `truckType` on the `VehicleDetails` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."VehicleType_new" AS ENUM ('CARS', 'MOTORCYCLES');
ALTER TABLE "public"."VehicleDetails" ALTER COLUMN "vehicleType" TYPE "public"."VehicleType_new" USING ("vehicleType"::text::"public"."VehicleType_new");
ALTER TYPE "public"."VehicleType" RENAME TO "VehicleType_old";
ALTER TYPE "public"."VehicleType_new" RENAME TO "VehicleType";
DROP TYPE "public"."VehicleType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."VehicleDetails" DROP COLUMN "busType",
DROP COLUMN "truckType",
ADD COLUMN     "doors" INTEGER,
ADD COLUMN     "seats" INTEGER;
