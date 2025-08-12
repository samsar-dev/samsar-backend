/*
  Warnings:

  - The values [new,likeNew,excellent,good,fair,poor,salvage] on the enum `Condition` will be removed. If these variants are still used in the database, this will fail.
  - The values [gasoline,diesel,electric,hybrid,pluginHybrid,lpg,cng,other,biodiesel] on the enum `FuelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [automatic,manual,semiAutomatic,continuouslyVariable,dualClutch,other] on the enum `TransmissionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Condition_new" AS ENUM ('NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SALVAGE');
ALTER TABLE "public"."VehicleDetails" ALTER COLUMN "condition" TYPE "public"."Condition_new" USING ("condition"::text::"public"."Condition_new");
ALTER TYPE "public"."Condition" RENAME TO "Condition_old";
ALTER TYPE "public"."Condition_new" RENAME TO "Condition";
DROP TYPE "public"."Condition_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."FuelType_new" AS ENUM ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG', 'OTHER', 'BIODIESEL');
ALTER TABLE "public"."VehicleDetails" ALTER COLUMN "fuelType" TYPE "public"."FuelType_new" USING ("fuelType"::text::"public"."FuelType_new");
ALTER TYPE "public"."FuelType" RENAME TO "FuelType_old";
ALTER TYPE "public"."FuelType_new" RENAME TO "FuelType";
DROP TYPE "public"."FuelType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransmissionType_new" AS ENUM ('AUTOMATIC', 'MANUAL', 'SEMI_AUTOMATIC', 'CONTINUOUSLY_VARIABLE', 'DUAL_CLUTCH', 'OTHER');
ALTER TABLE "public"."VehicleDetails" ALTER COLUMN "transmissionType" TYPE "public"."TransmissionType_new" USING ("transmissionType"::text::"public"."TransmissionType_new");
ALTER TYPE "public"."TransmissionType" RENAME TO "TransmissionType_old";
ALTER TYPE "public"."TransmissionType_new" RENAME TO "TransmissionType";
DROP TYPE "public"."TransmissionType_old";
COMMIT;
