-- AlterTable
ALTER TABLE "VehicleDetails" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "gearbox" TEXT;
