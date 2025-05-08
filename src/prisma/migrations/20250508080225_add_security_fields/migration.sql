/*
  Warnings:

  - You are about to drop the column `usageType` on the `RealEstateDetails` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[relatedNotificationId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEW_LISTING_MATCH';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_WARNING';
ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM_ANNOUNCEMENT';

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "relatedNotificationId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "relatedMessageId" TEXT;

-- AlterTable
ALTER TABLE "RealEstateDetails" DROP COLUMN "usageType",
ADD COLUMN     "accessibility" TEXT,
ADD COLUMN     "appliances" TEXT,
ADD COLUMN     "basementFeatures" TEXT,
ADD COLUMN     "bathroomFeatures" TEXT,
ADD COLUMN     "communityFeatures" TEXT,
ADD COLUMN     "energyFeatures" TEXT,
ADD COLUMN     "exteriorFeatures" TEXT,
ADD COLUMN     "hoaFeatures" TEXT,
ADD COLUMN     "kitchenFeatures" TEXT,
ADD COLUMN     "landscaping" TEXT,
ADD COLUMN     "livingArea" DOUBLE PRECISION,
ADD COLUMN     "outdoorFeatures" TEXT,
ADD COLUMN     "parkingSpaces" INTEGER,
ADD COLUMN     "petFeatures" TEXT,
ADD COLUMN     "roofAge" INTEGER,
ADD COLUMN     "smartHomeFeatures" TEXT,
ADD COLUMN     "storageFeatures" TEXT,
ADD COLUMN     "windowFeatures" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Message_relatedNotificationId_key" ON "Message"("relatedNotificationId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_relatedNotificationId_fkey" FOREIGN KEY ("relatedNotificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
