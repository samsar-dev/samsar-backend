-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VehicleType" ADD VALUE 'VAN';
ALTER TYPE "VehicleType" ADD VALUE 'BUS';
ALTER TYPE "VehicleType" ADD VALUE 'BOAT';
ALTER TYPE "VehicleType" ADD VALUE 'CONSTRUCTION';

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_listingId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "listingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "listingId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "relatedListingId" TEXT,
ADD COLUMN     "relatedUserId" TEXT;

-- AlterTable
ALTER TABLE "RealEstateDetails" ADD COLUMN     "constructionType" TEXT,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "parking" TEXT;

-- AlterTable
ALTER TABLE "VehicleDetails" ADD COLUMN     "brakeType" TEXT,
ADD COLUMN     "engineSize" TEXT;

-- CreateIndex
CREATE INDEX "Conversation_listingId_idx" ON "Conversation"("listingId");

-- CreateIndex
CREATE INDEX "Message_listingId_idx" ON "Message"("listingId");

-- CreateIndex
CREATE INDEX "Notification_relatedListingId_idx" ON "Notification"("relatedListingId");

-- CreateIndex
CREATE INDEX "Notification_relatedUserId_idx" ON "Notification"("relatedUserId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedListingId_fkey" FOREIGN KEY ("relatedListingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
