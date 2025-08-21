-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "accidental" TEXT,
ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "doors" INTEGER,
ADD COLUMN     "engineSize" DOUBLE PRECISION,
ADD COLUMN     "exteriorColor" TEXT,
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "fuelType" "public"."FuelType",
ADD COLUMN     "furnishing" TEXT,
ADD COLUMN     "horsepower" INTEGER,
ADD COLUMN     "make" TEXT,
ADD COLUMN     "mileage" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "parking" TEXT,
ADD COLUMN     "registrationExpiry" TEXT,
ADD COLUMN     "seatingCapacity" INTEGER,
ADD COLUMN     "totalArea" DOUBLE PRECISION,
ADD COLUMN     "totalFloors" INTEGER,
ADD COLUMN     "transmission" "public"."TransmissionType",
ADD COLUMN     "year" INTEGER,
ADD COLUMN     "yearBuilt" INTEGER;

-- CreateIndex
CREATE INDEX "Listing_make_idx" ON "public"."Listing"("make");

-- CreateIndex
CREATE INDEX "Listing_model_idx" ON "public"."Listing"("model");

-- CreateIndex
CREATE INDEX "Listing_year_idx" ON "public"."Listing"("year");

-- CreateIndex
CREATE INDEX "Listing_fuelType_idx" ON "public"."Listing"("fuelType");

-- CreateIndex
CREATE INDEX "Listing_transmission_idx" ON "public"."Listing"("transmission");
