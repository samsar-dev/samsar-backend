/*
  Warnings:

  - The values [SEMI_AUTOMATIC,CONTINUOUSLY_VARIABLE,DUAL_CLUTCH,OTHER] on the enum `TransmissionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransmissionType_new" AS ENUM ('AUTOMATIC', 'MANUAL', 'AUTOMATIC_MANUAL');
ALTER TABLE "public"."VehicleDetails" ALTER COLUMN "transmissionType" TYPE "public"."TransmissionType_new" USING ("transmissionType"::text::"public"."TransmissionType_new");
ALTER TYPE "public"."TransmissionType" RENAME TO "TransmissionType_old";
ALTER TYPE "public"."TransmissionType_new" RENAME TO "TransmissionType";
DROP TYPE "public"."TransmissionType_old";
COMMIT;
