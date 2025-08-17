/*
  Warnings:

  - You are about to drop the column `bathrooms` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `bodyType` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `fuelType` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `make` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `transmissionType` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Listing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Listing" DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "bodyType",
DROP COLUMN "color",
DROP COLUMN "fuelType",
DROP COLUMN "make",
DROP COLUMN "model",
DROP COLUMN "transmissionType",
DROP COLUMN "year";
