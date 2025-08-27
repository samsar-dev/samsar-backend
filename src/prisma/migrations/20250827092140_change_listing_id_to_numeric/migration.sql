-- CreateEnum
CREATE TYPE "public"."StorageProvider" AS ENUM ('CLOUDFLARE', 'R2', 'S3', 'LOCAL');

-- CreateEnum
CREATE TYPE "public"."ImageStatus" AS ENUM ('VALID', 'BROKEN_URL', 'UNSUPPORTED_FORMAT', 'TOO_LARGE', 'FLAGGED');

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
CREATE TYPE "public"."FuelType" AS ENUM ('BENZIN', 'DIESEL', 'HYBRID', 'ELECTRIC', 'GASOLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TransmissionType" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."Condition" AS ENUM ('NEW', 'USED', 'DAMAGED', 'NOT_WORKING');

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
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "fuelType" "public"."FuelType",
    "transmission" "public"."TransmissionType",
    "bodyType" TEXT,
    "engineSize" DOUBLE PRECISION,
    "mileage" INTEGER,
    "exteriorColor" TEXT,
    "horsepower" INTEGER,
    "accidental" TEXT,
    "registrationExpiry" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "totalArea" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "furnishing" TEXT,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "details" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "storageProvider" "public"."StorageProvider" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "altText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ImageStatus" NOT NULL DEFAULT 'VALID',
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "variant" TEXT,
    "cloudflareId" TEXT,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
CREATE INDEX "Listing_make_idx" ON "public"."Listing"("make");

-- CreateIndex
CREATE INDEX "Listing_model_idx" ON "public"."Listing"("model");

-- CreateIndex
CREATE INDEX "Listing_year_idx" ON "public"."Listing"("year");

-- CreateIndex
CREATE INDEX "Listing_fuelType_idx" ON "public"."Listing"("fuelType");

-- CreateIndex
CREATE INDEX "Listing_transmission_idx" ON "public"."Listing"("transmission");

-- CreateIndex
CREATE INDEX "Image_listingId_idx" ON "public"."Image"("listingId");

-- CreateIndex
CREATE INDEX "Image_status_idx" ON "public"."Image"("status");

-- CreateIndex
CREATE INDEX "Image_lastChecked_idx" ON "public"."Image"("lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "Image_listingId_order_key" ON "public"."Image"("listingId", "order");

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
ALTER TABLE "public"."_UserConversations" ADD CONSTRAINT "_UserConversations_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserConversations" ADD CONSTRAINT "_UserConversations_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
