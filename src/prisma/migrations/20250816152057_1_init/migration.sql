-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('USER', 'LISTING', 'MESSAGE', 'COMMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'MISLEADING', 'OFFENSIVE', 'HARASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('FREE_USER', 'PREMIUM_USER', 'BUSINESS_USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'RENTED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ListingAction" AS ENUM ('SALE', 'RENT', 'SEARCHING');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('NEW_MESSAGE', 'LISTING_INTEREST', 'PRICE_UPDATE', 'LISTING_SOLD', 'SYSTEM_NOTICE', 'LISTING_CREATED', 'NEW_LISTING_MATCH', 'ACCOUNT_WARNING', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "public"."VehicleType" AS ENUM ('CARS', 'MOTORCYCLES', 'VANS', 'TRUCKS', 'BUSES', 'TRACTORS', 'PASSENGER_VEHICLES', 'COMMERCIAL_TRANSPORT', 'CONSTRUCTION_VEHICLES', 'STORE');

-- CreateEnum
CREATE TYPE "public"."FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG', 'OTHER', 'BIODIESEL');

-- CreateEnum
CREATE TYPE "public"."TransmissionType" AS ENUM ('AUTOMATIC', 'MANUAL', 'AUTOMATIC_MANUAL');

-- CreateEnum
CREATE TYPE "public"."Condition" AS ENUM ('NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SALVAGE');

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "type" "public"."ReportType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "public"."ReportReason" NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reporterId" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profilePicture" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'FREE_USER',
    "preferences" JSONB,
    "city" TEXT,
    "dateOfBirth" TEXT,
    "street" TEXT,
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "phone" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "verificationToken" TEXT,
    "verificationCode" TEXT,
    "verificationTokenExpires" TIMESTAMP(3),
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "allowMessaging" BOOLEAN NOT NULL DEFAULT true,
    "listingNotifications" BOOLEAN NOT NULL DEFAULT true,
    "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
    "showEmail" BOOLEAN NOT NULL DEFAULT true,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "showPhoneNumber" BOOLEAN NOT NULL DEFAULT true,
    "maxListings" INTEGER NOT NULL DEFAULT 1,
    "listingRestriction" TEXT NOT NULL DEFAULT 'NONE',
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'INACTIVE',
    "subscriptionEndsAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "last_active_at" TIMESTAMP(3),
    "newsletterSubscribed" BOOLEAN DEFAULT true,
    "loginNotifications" BOOLEAN NOT NULL DEFAULT false,
    "privateProfile" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."View" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "userIp" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "mainCategory" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "condition" TEXT,
    "listingAction" TEXT,
    "sellerType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "viewUsersId" TEXT[],

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "listingId" TEXT,
    "relatedNotificationId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "relatedId" TEXT,
    "relatedListingId" TEXT,
    "relatedUserId" TEXT,
    "relatedMessageId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attribute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL DEFAULT false,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleDetails" (
    "id" TEXT NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER,
    "fuelType" "public"."FuelType",
    "transmissionType" "public"."TransmissionType",
    "color" TEXT,
    "condition" "public"."Condition",
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interiorColor" TEXT,
    "engine" TEXT,
    "warranty" TEXT,
    "previousOwners" INTEGER,
    "listingId" TEXT NOT NULL,
    "brakeType" TEXT,
    "engineSize" TEXT,
    "abs" BOOLEAN,
    "accessibilityFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accidentFree" BOOLEAN,
    "adaptiveCruiseControl" BOOLEAN,
    "adaptiveHeadlights" BOOLEAN,
    "additionalNotes" TEXT,
    "airConditioning" BOOLEAN,
    "airQualitySensor" BOOLEAN,
    "airbags" INTEGER,
    "doors" INTEGER,
    "seats" INTEGER,
    "aluminumRims" BOOLEAN,
    "ambientLighting" BOOLEAN,
    "androidAuto" BOOLEAN,
    "androidCar" BOOLEAN,
    "appleCarPlay" BOOLEAN,
    "armrest" BOOLEAN,
    "autoDimmingMirrors" BOOLEAN,
    "automaticDazzlingInteriorMirrors" BOOLEAN,
    "automaticEmergencyBraking" BOOLEAN,
    "automaticHighBeams" BOOLEAN,
    "automaticStartStop" BOOLEAN,
    "blindSpotMonitor" BOOLEAN,
    "bluetooth" BOOLEAN,
    "bodyStyle" TEXT,
    "bodyType" TEXT,
    "brakeSystem" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "burglarAlarmSystem" BOOLEAN,
    "cabFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "camera360" BOOLEAN,
    "cargoVolume" INTEGER,
    "cdPlayer" BOOLEAN,
    "centralLocking" BOOLEAN,
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "climateControl" BOOLEAN,
    "comfortFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "communicationSystem" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cruiseControl" BOOLEAN,
    "curtainAirbags" BOOLEAN,
    "customFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customsCleared" BOOLEAN,
    "cylinders" TEXT,
    "dabRadio" BOOLEAN,
    "dashCam" BOOLEAN,
    "daytimeRunningLights" BOOLEAN,
    "deadAngleAssistant" BOOLEAN,
    "displacement" TEXT,
    "distanceTempomat" BOOLEAN,
    "distanceWarning" BOOLEAN,
    "driveSystem" TEXT,
    "driveType" TEXT,
    "driverAirbag" BOOLEAN,
    "dualZoneClimate" BOOLEAN,
    "dvdPlayer" BOOLEAN,
    "electricSeats" BOOLEAN,
    "electricalSideMirrors" BOOLEAN,
    "electricalSystem" TEXT,
    "electricalWindowLifter" BOOLEAN,
    "electronics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergencyBrakeAssist" BOOLEAN,
    "emergencyCallSystem" BOOLEAN,
    "emergencyExits" INTEGER,
    "emissions" TEXT,
    "engineConfiguration" TEXT,
    "engineManufacturer" TEXT,
    "engineModel" TEXT,
    "enginePowerOutput" TEXT,
    "engineSpecs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "engineType" TEXT,
    "entertainmentSystem" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "esp" BOOLEAN,
    "exteriorFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fatigueWarningSystem" BOOLEAN,
    "fogLights" BOOLEAN,
    "frameType" TEXT,
    "frontAirbags" BOOLEAN,
    "frontAttachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "frontSuspension" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fuelTankCapacity" TEXT,
    "glarelessHighBeam" BOOLEAN,
    "handlebarType" TEXT,
    "handsFreeCalling" BOOLEAN,
    "headUpDisplay" BOOLEAN,
    "headlightCleaning" BOOLEAN,
    "heatedSeats" BOOLEAN,
    "highBeamAssistant" BOOLEAN,
    "hitchCapacity" DOUBLE PRECISION,
    "horsepower" INTEGER,
    "hours" INTEGER,
    "hydraulicFlow" DOUBLE PRECISION,
    "hydraulicSystem" TEXT,
    "immobilizer" BOOLEAN,
    "importStatus" TEXT,
    "instrumentCluster" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "insuranceType" TEXT,
    "integratedMusicStreaming" BOOLEAN,
    "isofix" BOOLEAN,
    "keylessEntry" BOOLEAN,
    "kneeAirbags" BOOLEAN,
    "laneAssist" BOOLEAN,
    "laneDepartureWarning" BOOLEAN,
    "laneKeepAssist" BOOLEAN,
    "lastInspectionDate" TEXT,
    "leatherSteeringWheel" BOOLEAN,
    "ledDaytimeRunningLights" BOOLEAN,
    "ledHeadlights" BOOLEAN,
    "lightSensor" BOOLEAN,
    "lighting" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lightingSystem" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "luggageCompartmentSeparation" BOOLEAN,
    "luggageCompartments" INTEGER,
    "luggageRacks" BOOLEAN,
    "luggageSpace" DOUBLE PRECISION,
    "lumbarSupport" BOOLEAN,
    "maintenanceHistory" TEXT,
    "modifications" TEXT,
    "monitor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "motorcycleType" TEXT,
    "mountainDrivingAssistant" BOOLEAN,
    "multifunctionalSteeringWheel" BOOLEAN,
    "navigationSystem" TEXT,
    "nightVision" BOOLEAN,
    "onBoardComputer" BOOLEAN,
    "parkingAid" BOOLEAN,
    "parkingAidCamera" BOOLEAN,
    "parkingAidSensorsFront" BOOLEAN,
    "parkingAidSensorsRear" BOOLEAN,
    "parkingAssist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parkingSensors" BOOLEAN,
    "passengerAirbag" BOOLEAN,
    "performanceFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "powerSteering" BOOLEAN,
    "powerTailgate" BOOLEAN,
    "precisionFarming" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "premiumSound" BOOLEAN,
    "protectiveEquipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ptoHorsepower" INTEGER,
    "ptoSystem" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "radio" BOOLEAN,
    "rainSensingWipers" BOOLEAN,
    "rainSensor" BOOLEAN,
    "rearAC" BOOLEAN,
    "rearAttachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rearCamera" BOOLEAN,
    "rearSeatEntertainment" BOOLEAN,
    "rearSuspension" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remoteStart" BOOLEAN,
    "riderAids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ridingStyle" TEXT,
    "roofHeight" TEXT,
    "roofType" TEXT,
    "safetyFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seatHeight" INTEGER,
    "seating" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seatingCapacity" INTEGER,
    "serviceHistoryDetails" TEXT,
    "sideAirbag" BOOLEAN,
    "sideAirbags" BOOLEAN,
    "soundSystem" BOOLEAN,
    "spareKey" BOOLEAN,
    "speedLimitingSystem" BOOLEAN,
    "startingSystem" TEXT,
    "steeringSystem" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "steeringType" TEXT,
    "storageOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summerTires" BOOLEAN,
    "sunroof" BOOLEAN,
    "suspensionType" TEXT,
    "switchingRockers" BOOLEAN,
    "threePointHitch" TEXT,
    "tirePressureMonitoring" BOOLEAN,
    "tireType" TEXT,
    "torque" INTEGER,
    "touchscreen" BOOLEAN,
    "trackHoldingAssistant" BOOLEAN,
    "tractionControl" BOOLEAN,
    "trafficSignRecognition" BOOLEAN,
    "trunkCapacity" DOUBLE PRECISION,
    "twoZoneClimateControl" BOOLEAN,
    "upholsteryMaterial" TEXT,
    "usbPorts" BOOLEAN,
    "vanType" TEXT,
    "ventilatedSeats" BOOLEAN,
    "voiceControl" BOOLEAN,
    "warrantyPeriod" TEXT,
    "wheelSize" TEXT,
    "wheelType" TEXT,
    "wheelchairAccessible" BOOLEAN,
    "wheelchairLift" BOOLEAN,
    "wifiHotspot" BOOLEAN,
    "wirelessCharging" BOOLEAN,
    "seatMaterial" TEXT,
    "emissionStandard" TEXT,
    "enginePower" TEXT,
    "engineTorque" TEXT,
    "seatBelts" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gearbox" TEXT,
    "bedLength" TEXT,
    "cabType" TEXT,
    "equipmentType" TEXT,
    "gps" BOOLEAN,
    "loadingFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxLiftingCapacity" TEXT,
    "operatingWeight" TEXT,
    "operatorCabType" TEXT,
    "payload" INTEGER,
    "ptoType" TEXT,
    "hydraulicOutlets" INTEGER,
    "registrationStatus" TEXT,
    "coolingSystem" TEXT,
    "customParts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seatType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interiorHeight" TEXT,
    "interiorLength" TEXT,
    "seatingConfiguration" TEXT,
    "temperatureRange" TEXT,
    "serviceHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transmission" TEXT,
    "registrationExpiry" TEXT,
    "engineNumber" TEXT,

    CONSTRAINT "VehicleDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RealEstateDetails" (
    "id" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "size" TEXT,
    "condition" TEXT,
    "listingId" TEXT NOT NULL,
    "constructionType" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parking" TEXT,
    "accessibilityFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "balcony" BOOLEAN,
    "buildingAmenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cooling" TEXT,
    "elevator" BOOLEAN,
    "energyRating" TEXT,
    "exposureDirection" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fireSafety" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "floor" INTEGER,
    "flooringType" TEXT,
    "furnished" TEXT,
    "heating" TEXT,
    "internetIncluded" BOOLEAN,
    "parkingType" TEXT,
    "petPolicy" TEXT,
    "renovationHistory" TEXT,
    "securityFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "storage" BOOLEAN,
    "storageType" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalFloors" INTEGER,
    "utilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "view" TEXT,
    "windowType" TEXT,
    "attic" TEXT,
    "basement" TEXT,
    "buildable" TEXT,
    "buildingRestrictions" TEXT,
    "elevation" INTEGER,
    "environmentalFeatures" TEXT,
    "flooringTypes" TEXT[],
    "halfBathrooms" INTEGER,
    "naturalFeatures" TEXT,
    "parcelNumber" TEXT,
    "permitsInPlace" TEXT,
    "soilTypes" TEXT[],
    "stories" INTEGER,
    "topography" TEXT[],
    "waterFeatures" TEXT,
    "floorLevel" INTEGER,
    "isBuildable" BOOLEAN,
    "totalArea" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "accessibility" TEXT,
    "appliances" TEXT,
    "basementFeatures" TEXT,
    "bathroomFeatures" TEXT,
    "communityFeatures" TEXT,
    "energyFeatures" TEXT,
    "exteriorFeatures" TEXT,
    "hoaFeatures" TEXT,
    "kitchenFeatures" TEXT,
    "landscaping" TEXT,
    "livingArea" DOUBLE PRECISION,
    "outdoorFeatures" TEXT,
    "parkingSpaces" INTEGER,
    "petFeatures" TEXT,
    "roofAge" INTEGER,
    "smartHomeFeatures" TEXT,
    "storageFeatures" TEXT,
    "windowFeatures" TEXT,

    CONSTRAINT "RealEstateDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_UserConversations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserConversations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Report_type_targetId_idx" ON "public"."Report"("type", "targetId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "public"."Report"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "public"."User"("verificationToken");

-- CreateIndex
CREATE INDEX "User_refreshToken_idx" ON "public"."User"("refreshToken");

-- CreateIndex
CREATE INDEX "View_createdAt_idx" ON "public"."View"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "View_listingId_userId_userIp_key" ON "public"."View"("listingId", "userId", "userIp");

-- CreateIndex
CREATE INDEX "Listing_userId_idx" ON "public"."Listing"("userId");

-- CreateIndex
CREATE INDEX "Listing_mainCategory_idx" ON "public"."Listing"("mainCategory");

-- CreateIndex
CREATE INDEX "Image_listingId_idx" ON "public"."Image"("listingId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "public"."Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_listingId_idx" ON "public"."Favorite"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "public"."Favorite"("userId", "listingId");

-- CreateIndex
CREATE INDEX "Conversation_listingId_idx" ON "public"."Conversation"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_relatedNotificationId_key" ON "public"."Message"("relatedNotificationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "public"."Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "public"."Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_listingId_idx" ON "public"."Message"("listingId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_relatedListingId_idx" ON "public"."Notification"("relatedListingId");

-- CreateIndex
CREATE INDEX "Notification_relatedUserId_idx" ON "public"."Notification"("relatedUserId");

-- CreateIndex
CREATE INDEX "Attribute_listingId_idx" ON "public"."Attribute"("listingId");

-- CreateIndex
CREATE INDEX "Feature_listingId_idx" ON "public"."Feature"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleDetails_listingId_key" ON "public"."VehicleDetails"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "RealEstateDetails_listingId_key" ON "public"."RealEstateDetails"("listingId");

-- CreateIndex
CREATE INDEX "RealEstateDetails_listingId_idx" ON "public"."RealEstateDetails"("listingId");

-- CreateIndex
CREATE INDEX "_UserConversations_B_index" ON "public"."_UserConversations"("B");

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."View" ADD CONSTRAINT "View_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_relatedNotificationId_fkey" FOREIGN KEY ("relatedNotificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_relatedListingId_fkey" FOREIGN KEY ("relatedListingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attribute" ADD CONSTRAINT "Attribute_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feature" ADD CONSTRAINT "Feature_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleDetails" ADD CONSTRAINT "VehicleDetails_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RealEstateDetails" ADD CONSTRAINT "RealEstateDetails_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserConversations" ADD CONSTRAINT "_UserConversations_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserConversations" ADD CONSTRAINT "_UserConversations_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
