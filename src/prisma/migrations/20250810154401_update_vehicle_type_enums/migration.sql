/*
  Warnings:

  - The values [CAR,MOTORCYCLE] on the enum `VehicleType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."VehicleType_new" AS ENUM ('CARS', 'TRUCK', 'MOTORCYCLES', 'RV', 'OTHER', 'VAN', 'BUS', 'CONSTRUCTION', 'TRACTOR');
ALTER TABLE "public"."VehicleDetails" ALTER COLUMN "vehicleType" TYPE "public"."VehicleType_new" USING ("vehicleType"::text::"public"."VehicleType_new");
ALTER TYPE "public"."VehicleType" RENAME TO "VehicleType_old";
ALTER TYPE "public"."VehicleType_new" RENAME TO "VehicleType";
DROP TYPE "public"."VehicleType_old";
COMMIT;
