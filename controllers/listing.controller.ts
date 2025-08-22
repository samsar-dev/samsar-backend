import {
  ListingStatus,
  ListingAction,
  Prisma,
  NotificationType,
} from "@prisma/client";
import prisma from "../src/lib/prismaClient.js";
import { uploadToR2, deleteFromR2 } from "../config/cloudflareR2.js";
import { FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import { handleListingPriceUpdate } from "../src/services/notification.service.js";
 

// Extend Fastify request with custom properties
declare module "fastify" {
  interface FastifyRequest {
    processedImages?: Array<{
      url: string;
      order: number;
    }>;
  }
}

import { UserRole } from "../types/auth.js";

interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

interface ListingResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  mainCategory: string;
  subCategory: string;
  location: string;
  latitude: number;
  longitude: number;
  views?: number;
  condition?: string;
  status: string;
  listingAction?: string;
  sellerType?: string;
  // Vehicle fields
  make?: string;
  model?: string;
  year?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  engineSize?: number;
  mileage?: number;
  exteriorColor?: string;
  doors?: number;
  seatingCapacity?: number;
  horsepower?: number;
  // Real estate fields
  bedrooms?: number;
  bathrooms?: number;
  totalArea?: number;
  yearBuilt?: number;
  furnishing?: string;
  floor?: number;
  totalFloors?: number;
  parking?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  details: any;
  user: {
    id: string;
    username: string;
    profilePicture?: string;
  };
  images: Array<{
    id: string;
    url: string;
    order: number;
    listingId: string;
  }>;
  favorites: Array<{
    id: string;
    createdAt: Date;
    userId: string;
    listingId: string;
  }>;
  attributes: Array<{
    id: string;
    name: string;
    value: string;
    listingId: string;
  }>;
  features: Array<{
    id: string;
    name: string;
    value: boolean;
    listingId: string;
  }>;
}

type ListingCreateInput = Prisma.ListingCreateInput;
type NotificationCreateInput = Prisma.NotificationUncheckedCreateInput;

type ListingWithRelations = Prisma.ListingGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        username: true;
        profilePicture: true;
      };
    };
    images: true;
    favorites: true;
    attributes: true;
    features: true;
  };
}> & {
  views?: number;
};

// Helper type for request parameters
type ListingParams = {
  id: string;
};

// Helper type for request body
type ListingCreateBody = {
  title: string;
  description: string;
  price: number;
  mainCategory: string;
  subCategory: string;
  location: string;
  latitude: number;
  longitude: number;
  condition?: string;
  details?: any;
  listingAction?: ListingAction;
  attributes?: Array<{ name: string; value: string }>;
  features?: Array<{ name: string; value: boolean }>;
};

const formatListingResponse = (
  listing: ListingWithRelations,
): ListingResponse => {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description || "",
    price: listing.price,
    mainCategory: listing.mainCategory,
    subCategory: listing.subCategory,
    location: listing.location,
    latitude: listing.latitude,
    longitude: listing.longitude,
    views: 'views' in listing ? (listing.views || 0) : 0,
    condition: listing.condition || undefined,
    status: listing.status,
    listingAction: listing.listingAction || undefined,
    sellerType: listing.sellerType || undefined,
    // Vehicle fields
    make: listing.make || undefined,
    model: listing.model || undefined,
    year: listing.year || undefined,
    fuelType: listing.fuelType || undefined,
    transmission: listing.transmission || undefined,
    bodyType: listing.bodyType || undefined,
    engineSize: listing.engineSize || undefined,
    mileage: listing.mileage || undefined,
    exteriorColor: listing.exteriorColor || undefined,
    doors: listing.doors || undefined,
    seatingCapacity: listing.seatingCapacity || undefined,
    horsepower: listing.horsepower || undefined,
    // Real estate fields
    bedrooms: listing.bedrooms || undefined,
    bathrooms: listing.bathrooms || undefined,
    totalArea: listing.totalArea || undefined,
    yearBuilt: listing.yearBuilt || undefined,
    furnishing: listing.furnishing || undefined,
    floor: listing.floor || undefined,
    totalFloors: listing.totalFloors || undefined,
    parking: listing.parking || undefined,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    userId: listing.userId,
    details: listing.details,
    user: {
      id: listing.user.id,
      username: listing.user.username,
      profilePicture: listing.user.profilePicture || undefined,
    },
    images: listing.images.map((img) => ({
      id: img.id,
      url: img.url || '', // Handle nullable URL
      order: img.order,
      listingId: img.listingId,
    })),
    favorites: listing.favorites.map((fav) => ({
      id: fav.id,
      createdAt: fav.createdAt,
      userId: fav.userId,
      listingId: fav.listingId,
    })),
    attributes: listing.attributes.map((attr) => ({
      id: attr.id,
      name: attr.name,
      value: attr.value,
      listingId: attr.listingId,
    })),
    features: listing.features.map((feature) => ({
      id: feature.id,
      name: feature.name,
      value: feature.value,
      listingId: feature.listingId,
    })),
  };
};

const validateListingData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.title) {
    errors.push("Title is required");
  }

  if (!data.description) {
    errors.push("Description is required");
  }

  if (!data.price || isNaN(parseFloat(data.price))) {
    errors.push("Valid price is required");
  }

  if (!data.mainCategory) {
    errors.push("Main category is required");
  }

  if (!data.subCategory) {
    errors.push("Sub category is required");
  }

  if (!data.location) {
    errors.push("Location is required");
  }

  if (
    data.latitude === undefined ||
    data.longitude === undefined ||
    isNaN(parseFloat(data.latitude)) ||
    isNaN(parseFloat(data.longitude))
  ) {
    errors.push("Valid latitude and longitude are required");
  }

  return errors;
};

export const createListing = async (req: FastifyRequest, res: FastifyReply) => {
  const prismaClient = prisma;
  try {
    // @ts-ignore: Assume user is attached by Fastify auth decorator
    const userId = (req.user as any).id;

    const {
      title,
      description,
      price,
      mainCategory,
      subCategory,
      location,
      latitude,
      longitude,
      condition,
      details,
      listingAction,
      attributes,
      features,
    } = req.body as ListingCreateBody;

    // Parse details if it's a string
    const parsedDetails =
      typeof details === "string" ? JSON.parse(details) : details;

    const errors = validateListingData(req.body);
    if (errors.length > 0) {
      return res.code(400).send({
        success: false,
        error: "Validation failed",
        errors,
        status: 400,
        data: null,
      });
    }

    // Ensure price is a valid number
    const listingPrice = typeof price === "string" ? parseFloat(price) : price;

    if (isNaN(listingPrice)) {
      return res.code(400).send({
        success: false,
        error: "Invalid price",
        status: 400,
        data: null,
      });
    }

    // Start transaction
    const result = await prismaClient.$transaction(async (tx) => {
      // Extract individual fields from request body (Flutter sends them as separate fields)
      const requestBody = req.body as any;
      const vehicleDetails = parsedDetails?.vehicles || {};
      const realEstateDetails = parsedDetails?.realEstate || {};
      
      // Helper function to only include non-empty values
      const addIfNotEmpty = (obj: any, key: string, value: any) => {
        if (value !== null && value !== undefined && value !== "" && value !== 0) {
          obj[key] = value;
        }
      };
      
      // Create listing data with individual columns
      const listingData: Prisma.ListingCreateInput = {
        title,
        description,
        price: listingPrice,
        mainCategory,
        subCategory,
        location,
        latitude:
          typeof latitude === "string" ? parseFloat(latitude) : latitude,
        longitude:
          typeof longitude === "string" ? parseFloat(longitude) : longitude,
        condition,
        status: ListingStatus.ACTIVE,
        listingAction: listingAction || ListingAction.SALE,
        details: parsedDetails, // Keep full details for backward compatibility
        user: {
          connect: {
            id: userId,
          },
        },
        images: {
          create:
            req.processedImages?.map((img, index) => ({
              storageProvider: 'CLOUDFLARE',
              storageKey: `listings/${userId}/${Date.now()}_${index}.jpg`,
              url: img.url,
              order: img.order,
              isCover: index === 0,
              status: 'VALID',
              lastChecked: new Date(),
            })) || [],
        },
      };

      // Handle category-specific fields based on mainCategory
      if (mainCategory.toLowerCase() === 'vehicles') {
        // Vehicle-specific fields only
        addIfNotEmpty(listingData, 'make', requestBody.make || vehicleDetails.make);
        addIfNotEmpty(listingData, 'model', requestBody.model || vehicleDetails.model);
        addIfNotEmpty(listingData, 'year', requestBody.year ? parseInt(requestBody.year) : (vehicleDetails.year ? parseInt(vehicleDetails.year) : null));
        
        // Handle enum fields with uppercase conversion
        const fuelType = requestBody.fuelType || vehicleDetails.fuelType;
        if (fuelType) {
          addIfNotEmpty(listingData, 'fuelType', fuelType.toUpperCase());
        }
        
        const transmission = requestBody.transmission || requestBody.transmissionType || vehicleDetails.transmission || vehicleDetails.transmissionType;
        if (transmission) {
          addIfNotEmpty(listingData, 'transmission', transmission.toUpperCase());
        }
        
        addIfNotEmpty(listingData, 'bodyType', requestBody.bodyType || vehicleDetails.bodyType);
        addIfNotEmpty(listingData, 'engineSize', requestBody.engineSize ? parseFloat(requestBody.engineSize) : (vehicleDetails.engineSize ? parseFloat(vehicleDetails.engineSize) : null));
        addIfNotEmpty(listingData, 'mileage', requestBody.mileage ? parseInt(requestBody.mileage) : (vehicleDetails.mileage ? parseInt(vehicleDetails.mileage) : null));
        addIfNotEmpty(listingData, 'exteriorColor', requestBody.color || requestBody.exteriorColor || vehicleDetails.color || vehicleDetails.exteriorColor);
        
        const sellerType = requestBody.sellerType || vehicleDetails.sellerType;
        if (sellerType) {
          addIfNotEmpty(listingData, 'sellerType', sellerType.toUpperCase());
        }
        
        // Handle condition mapping
        const condition = requestBody.condition || vehicleDetails.condition;
        if (condition) {
          addIfNotEmpty(listingData, 'condition', condition.toUpperCase());
        }
        
        // Handle accidental status mapping
        const accidental = requestBody.accidental || vehicleDetails.accidental;
        if (accidental !== undefined && accidental !== null && accidental !== '') {
          const isAccidentFree = String(accidental).toLowerCase() === 'no' || accidental === false || String(accidental).toLowerCase() === 'false';
          addIfNotEmpty(listingData, 'accidental', isAccidentFree ? 'NO' : 'YES');
        }
        
        console.log("🔧 Vehicle fields extracted for vehicles category");
      } else if (mainCategory.toLowerCase() === 'real_estate') {
        // Real estate-specific fields only
        addIfNotEmpty(listingData, 'bedrooms', requestBody.bedrooms ? parseInt(requestBody.bedrooms) : (realEstateDetails.bedrooms ? parseInt(realEstateDetails.bedrooms) : null));
        addIfNotEmpty(listingData, 'bathrooms', requestBody.bathrooms ? parseInt(requestBody.bathrooms) : (realEstateDetails.bathrooms ? parseInt(realEstateDetails.bathrooms) : null));
        addIfNotEmpty(listingData, 'totalArea', requestBody.totalArea ? parseFloat(requestBody.totalArea) : (realEstateDetails.totalArea ? parseFloat(realEstateDetails.totalArea) : null));
        addIfNotEmpty(listingData, 'yearBuilt', requestBody.yearBuilt ? parseInt(requestBody.yearBuilt) : (realEstateDetails.yearBuilt ? parseInt(realEstateDetails.yearBuilt) : null));
        addIfNotEmpty(listingData, 'furnishing', requestBody.furnishing || realEstateDetails.furnishing);
        addIfNotEmpty(listingData, 'floor', requestBody.floor ? parseInt(requestBody.floor) : (realEstateDetails.floor ? parseInt(realEstateDetails.floor) : null));
        addIfNotEmpty(listingData, 'totalFloors', requestBody.totalFloors ? parseInt(requestBody.totalFloors) : (realEstateDetails.totalFloors ? parseInt(realEstateDetails.totalFloors) : null));
        addIfNotEmpty(listingData, 'parking', requestBody.parking || realEstateDetails.parking);
        
        console.log("🔧 Real estate fields extracted for real_estate category");
      }

      // Create listing
      const listing = await tx.listing.create({
        data: listingData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          images: true,
          favorites: true,
          attributes: true,
          features: true,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: listing.userId,
          type: NotificationType.LISTING_CREATED,
          content: `Your listing "${listing.title}" has been created.`,
          relatedListingId: listing.id,
        },
      });

      return listing;
    });

    // Format and send response
    const formattedListing = formatListingResponse(result);

    // Send response
        res.code(201).send({
      message: "Listing created successfully - V2 DEPLOYED!", // Deployment verification
      success: true,
      data: formattedListing,
      status: 201,
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.code(500).send({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create listing",
      status: 500,
      data: null,
    });
  }
};

// Simple in-memory cache for listings
const listingsCache = new Map<
  string,
  { data: any; etag: string; timestamp: number }
>();
const CACHE_TTL = 60 * 1000; // 60 seconds cache TTL

export const getListings = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    console.log("Request query:", req.query);

    // Create a cache key from the request query parameters
    const cacheKey = JSON.stringify(req.query);
    const ifNoneMatch = req.headers["if-none-match"];

    // Check if we have a valid cache entry
    const cachedResponse = listingsCache.get(cacheKey);
    if (cachedResponse) {
      const isExpired = Date.now() - cachedResponse.timestamp > CACHE_TTL;

      // If the client sent an ETag that matches our cached ETag and the cache isn't expired
      if (ifNoneMatch === cachedResponse.etag && !isExpired) {
        // Return 304 Not Modified to tell the client to use its cached version
        console.log("Cache hit with matching ETag, returning 304");
        return res.code(304).send();
      }

      // If cache is still valid but client didn't send matching ETag
      if (!isExpired) {
        console.log("Cache hit, returning cached data");
        res.header("ETag", cachedResponse.etag);
        res.header("Cache-Control", "private, max-age=60"); // Tell client to cache for 60 seconds
        return res.send(cachedResponse.data);
      }

      // Cache expired, will fetch new data
      console.log("Cache expired, fetching new data");
    }

    const query = req.query as {
      page?: string;
      limit?: string;
      search?: string;
      mainCategory?: string;
      minPrice?: string;
      maxPrice?: string;
    };

    const page = Math.max(1, parseInt(query.page || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || "12")));
    const search = query.search || "";
    const mainCategory = query.mainCategory || "";
    const minPrice = parseFloat(query.minPrice || "0");
    const maxPrice = parseFloat(
      query.maxPrice || String(Number.MAX_SAFE_INTEGER),
    );



    const where: Prisma.ListingWhereInput = {
      OR: search
        ? [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
      mainCategory: mainCategory || undefined,
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
      status: ListingStatus.ACTIVE,
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
          images: true,
          favorites: true,
          attributes: true,
          features: true,
        },
      }),
      prisma.listing.count({ where }),
    ]);

    console.log("Found listings:", listings.length);
    const formattedListings = listings.map((listing) =>
      formatListingResponse(listing as ListingWithRelations),
    );

    console.log("Formatted listings:", formattedListings.length);

    // Prepare response data
    const responseData = {
      success: true,
      data: formattedListings,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: Math.ceil(total / limit),
      },
    };

    // Generate ETag for caching
    const etag = require("crypto")
      .createHash("md5")
      .update(JSON.stringify(responseData))
      .digest("hex");

    // Cache the response
    listingsCache.set(cacheKey, {
      data: responseData,
      etag,
      timestamp: Date.now(),
    });

    // Send response with ETag
    res.headers({ ETag: etag }).send(responseData);
  } catch (error) {
    console.error(
      "Error getting listings:",
      error instanceof Error ? error.message : "Unknown error",
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    res.code(500).send({
      success: false,
      message: "Error getting listings",
    });
  }
};

export const getListing = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { id } = req.params as ListingParams;
    
    // First, get the listing with all its relations
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        images: true,
        favorites: true,
        attributes: true,
        features: true,
      },
    });

    if (!listing) {
      return res.code(404).send({
        success: false,
        message: "Listing not found",
      });
    }

    // Only increment view count if viewer is not the listing owner
    if (!req.user || req.user.id !== listing.userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if user has already viewed this listing today
      const existingView = await prisma.view.findFirst({
        where: {
          listingId: id,
          OR: [
            { userId: req.user?.id },
            { userIp: req.ip || 'unknown' }
          ],
          createdAt: {
            gte: today
          }
        }
      });

      if (!existingView) {
        // Use a transaction to ensure atomic update
        await prisma.$transaction([
          // Increment the view count
          prisma.$executeRaw`
            UPDATE "Listing" 
            SET "views" = COALESCE("views", 0) + 1
            WHERE id = ${id}
          `,
          // Record the view
          prisma.view.create({
            data: {
              listingId: id,
              userId: req.user?.id,
              userIp: req.ip || 'unknown',
              userAgent: req.headers['user-agent'] || 'unknown'
            }
          })
        ]);
      }
    }

    // Get the updated listing with the incremented view count
    const updatedListing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        images: true,
        favorites: true,
        attributes: true,
        features: true,
      },
    }) as ListingWithRelations;

    // Create view notification if viewer is not the seller
    if (req.user && req.user.id !== listing.userId) {
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: NotificationType.LISTING_INTEREST,
          content: `${(req.user as any).username} viewed your listing "${listing.title}"`,
          relatedListingId: listing.id,
        },
      });
    }

    res.send({
      success: true,
      data: formatListingResponse(updatedListing as ListingWithRelations),
    });
  } catch (error) {
    console.error("Error getting listing:", error);
    res.code(500).send({
      success: false,
      message: "Error getting listing",
    });
  }
};

export const updateListing = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    console.log("🔍 [updateListing] Request body:", req.body);
    console.log(
      "🔍 [updateListing] Request files:",
      (req as any).processedImages,
    );
    console.log("🔍 [updateListing] Request params:", req.params);

    const { id } = req.params as ListingParams;
    const {
      title,
      description,
      price,
      mainCategory,
      subCategory,
      location,
      latitude,
      longitude,
      condition,
      existingImages,
      attributes,
      details,
      features,
    } = req.body as {
      title: string;
      description: string;
      price: number | string;
      mainCategory: string;
      subCategory: string;
      location: string;
      latitude: number | string;
      longitude: number | string;
      condition?: string;
      existingImages?: string[] | string;
      attributes?: Array<{ name: string; value: string }>;
      details?: any;
      features?: Array<{ name: string; value: boolean }>;
    };

    const oldListing = await prisma.listing.findUnique({
      where: { id },
      select: {
        price: true,
        title: true,
        userId: true,
      },
    });

    if (!oldListing) {
      return res.code(404).send({
        success: false,
        error: "Listing not found",
        status: 404,
        data: null,
      });
    }
    // Process images - combine existing and new images
    let imagesToCreate: Array<{ url: string; order: number }> = [];

    console.log("🔍 [updateListing] Processing images:");
    console.log("- Processed images:", req.processedImages);
    console.log("- Existing images:", existingImages);

    // Add processed new images
    if (req.processedImages && req.processedImages.length > 0) {
      console.log("- Adding new processed images");
      imagesToCreate = [...req.processedImages];
    }

    // Handle deleted images if provided so we don't recreate them later
    const { deletedImages } = req.body as { deletedImages?: string[] | string };
    let deletedImagesArray: string[] = [];
    if (deletedImages) {
      if (Array.isArray(deletedImages)) {
        deletedImagesArray = deletedImages;
      } else if (typeof deletedImages === "string") {
        try {
          deletedImagesArray = JSON.parse(deletedImages);
        } catch {
          deletedImagesArray = [deletedImages];
        }
      }
    }

    // Add existing images if provided
    if (existingImages) {
      console.log("🔍 [DEBUG] existingImages type:", typeof existingImages);
      console.log("🔍 [DEBUG] existingImages value:", existingImages);
      console.log("🔍 [DEBUG] Is Array?", Array.isArray(existingImages));

      try {
        let existingImagesArray: string[] = [];

        if (Array.isArray(existingImages)) {
          console.log("🔍 [DEBUG] Processing as array");
          existingImagesArray = existingImages;
        } else if (typeof existingImages === "string") {
          console.log("🔍 [DEBUG] Processing as string");
          if (existingImages.startsWith("[")) {
            console.log("🔍 [DEBUG] Parsing JSON array string");
            existingImagesArray = JSON.parse(existingImages);
          } else {
            console.log("🔍 [DEBUG] Using as single string");
            existingImagesArray = [existingImages];
          }
        } else {
          console.log("🔍 [DEBUG] Unknown format:", existingImages);
          throw new Error(
            `Invalid existingImages format: ${typeof existingImages}`,
          );
        }

        console.log("🔍 [DEBUG] Processed array:", existingImagesArray);
        console.log("🔍 [DEBUG] Array length:", existingImagesArray.length);

        existingImagesArray.forEach((url: string, index: number) => {
          console.log(`🔍 [DEBUG] Processing URL ${index}:`, url);
          if (
            url &&
            typeof url === "string" &&
            !deletedImagesArray.includes(url)
          ) {
            imagesToCreate.push({
              url,
              order: imagesToCreate.length + index,
            });
            console.log("🔍 [DEBUG] Added URL to imagesToCreate");
          } else {
            console.log("🔍 [DEBUG] Skipped invalid or deleted URL:", url);
          }
        });
      } catch (error) {
        console.error("Error processing existing images:", error);
        console.error("existingImages type:", typeof existingImages);
        console.error("existingImages value:", existingImages);
        throw new Error("Invalid existingImages format");
      }
    }

    // Deduplicate images by URL while preserving first occurrence order
    const seen = new Set<string>();
    imagesToCreate = imagesToCreate.filter((img) => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });

    // Re-index order to be sequential starting from 0
    imagesToCreate = imagesToCreate.map((img, idx) => ({ ...img, order: idx }));

    console.log("- Final imagesToCreate (deduped & reindexed):", imagesToCreate);

    // Clean up existing images from R2 storage if we're replacing them
    if (imagesToCreate.length > 0) {
      const existingImages = await prisma.image.findMany({
        where: { listingId: id },
        select: { storageKey: true, url: true },
      });

      for (const image of existingImages) {
        try {
          if (image.storageKey) {
            console.log(`🗑️ Deleting existing image with key: ${image.storageKey}`);
            await deleteFromR2(image.storageKey);
          } else if (image.url) {
            // Extract key from URL if no storage key is available
            const urlParts = image.url.split('/');
            const keyStartIndex = urlParts.findIndex(part => part === 'uploads');
            if (keyStartIndex !== -1) {
              const key = urlParts.slice(keyStartIndex).join('/');
              console.log(`🗑️ Deleting existing image with extracted key: ${key}`);
              await deleteFromR2(key);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to delete existing image from R2:`, error);
          // Continue with other deletions even if one fails
        }
      }
    }

    // Ensure price is a number and handle potential string input
    const newPrice = typeof price === "string" ? parseFloat(price) : price;

    // Check if price has changed and is a valid number
    const isPriceChanged = !isNaN(newPrice) && oldListing.price !== newPrice;

    // Parse details and extract individual fields
    const parsedDetails = details ? (typeof details === "string" ? JSON.parse(details) : details) : {};
    const requestBody = req.body as any;
    const vehicleDetails = parsedDetails?.vehicles || {};
    const realEstateDetails = parsedDetails?.realEstate || {};

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        price: newPrice,
        mainCategory,
        subCategory,
        location,
        latitude:
          typeof latitude === "string" ? parseFloat(latitude) : latitude,
        longitude:
          typeof longitude === "string" ? parseFloat(longitude) : longitude,
        condition,
        // Category-specific fields based on mainCategory
        ...(mainCategory.toLowerCase() === 'vehicles' ? {
          // Vehicle fields only for vehicle listings
          make: requestBody.make || vehicleDetails.make || null,
          model: requestBody.model || vehicleDetails.model || null,
          year: requestBody.year ? parseInt(requestBody.year) : (vehicleDetails.year ? parseInt(vehicleDetails.year) : null),
          fuelType: requestBody.fuelType || vehicleDetails.fuelType || null,
          transmission: requestBody.transmissionType || vehicleDetails.transmission || null,
          bodyType: requestBody.bodyType || vehicleDetails.bodyType || null,
          engineSize: requestBody.engineSize ? parseFloat(requestBody.engineSize) : (vehicleDetails.engineSize ? parseFloat(vehicleDetails.engineSize) : null),
          mileage: requestBody.mileage ? parseInt(requestBody.mileage) : (vehicleDetails.mileage ? parseInt(vehicleDetails.mileage) : null),
          exteriorColor: requestBody.color || vehicleDetails.exteriorColor || null,
          sellerType: requestBody.sellerType || null,
          accidental: requestBody.accidental || vehicleDetails.accidental || null,
        } : {}),
        ...(mainCategory.toLowerCase() === 'real_estate' ? {
          // Real estate fields only for real estate listings
          bedrooms: realEstateDetails.bedrooms ? parseInt(realEstateDetails.bedrooms) : null,
          bathrooms: realEstateDetails.bathrooms ? parseInt(realEstateDetails.bathrooms) : null,
          totalArea: realEstateDetails.totalArea ? parseFloat(realEstateDetails.totalArea) : null,
          yearBuilt: realEstateDetails.yearBuilt ? parseInt(realEstateDetails.yearBuilt) : null,
          furnishing: realEstateDetails.furnishing || null,
          floor: realEstateDetails.floor ? parseInt(realEstateDetails.floor) : null,
          totalFloors: realEstateDetails.totalFloors ? parseInt(realEstateDetails.totalFloors) : null,
          parking: realEstateDetails.parking || null,
        } : {}),
        details: parsedDetails, // Keep full details for backward compatibility
        attributes: attributes
          ? {
              deleteMany: {},
              create: attributes,
            }
          : undefined,
        features: features
          ? {
              deleteMany: {},
              create: features,
            }
          : undefined,
        images:
          imagesToCreate.length > 0
            ? {
                deleteMany: {},
                create: imagesToCreate.map((img, index) => ({
                  storageProvider: 'CLOUDFLARE',
                  storageKey: `listings/${oldListing.userId}/${Date.now()}_${index}.jpg`,
                  url: img.url,
                  order: img.order,
                  isCover: index === 0,
                  status: 'VALID',
                  lastChecked: new Date(),
                })),
              }
            : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        images: true,
        favorites: true,
        attributes: true,
        features: true,
      },
    });

    // Handle price update notifications
    if (isPriceChanged) {
      // Notify the listing owner
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: NotificationType.PRICE_UPDATE,
          content: `The price of your listing "${oldListing.title}" has been updated from ${oldListing.price} to ${newPrice}.`,
          relatedListingId: listing.id,
        },
      });

      // Notify users who have favorited the listing
      await handleListingPriceUpdate(listing.id, oldListing.price, newPrice);
    }

    res.send({
      success: true,
      data: formatListingResponse(listing as ListingWithRelations),
      status: 200,
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    res.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : "Error updating listing",
      status: 500,
      data: null,
    });
  }
};

export const deleteListing = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const { id } = req.params as ListingParams;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!listing) {
      return res.code(404).send({
        success: false,
        message: "Listing not found",
      });
    }

    if ((req.user as any).id !== listing.userId) {
      return res.code(403).send({
        success: false,
        message: "Not authorized to delete this listing",
      });
    }

    // Delete images from storage
    for (const image of listing.images) {
      if (image.storageKey) {
        // Use the storage key if available
        console.log(`🗑️ Deleting image with key: ${image.storageKey}`);
        await deleteFromR2(image.storageKey);
      } else if (image.url) {
        // Extract key from URL if no storage key is available
        const urlParts = image.url.split('/');
        const keyStartIndex = urlParts.findIndex(part => part === 'uploads');
        if (keyStartIndex !== -1) {
          const key = urlParts.slice(keyStartIndex).join('/');
          console.log(`🗑️ Deleting image with extracted key: ${key}`);
          await deleteFromR2(key);
        } else {
          console.warn(`⚠️ Could not extract storage key from URL: ${image.url}`);
        }
      }
    }

    await prisma.listing.delete({ where: { id } });

    res.send({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.code(500).send({
      success: false,
      message: "Error deleting listing",
    });
  }
};

export const toggleSaveListing = async (
  req: FastifyRequest,
  res: FastifyReply,
) => {
  // Ensure user is authenticated
  if (!req.user) {
    return res.code(401).send({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const { id } = req.params as ListingParams;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
        },
        favorites: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!listing) {
      return res.code(404).send({
        success: false,
        message: "Listing not found",
      });
    }

    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        listingId: id,
        userId: req.user.id, // Type-safe access
      },
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
    } else {
      await prisma.favorite.create({
        data: {
          listingId: id,
          userId: req.user.sub || req.user.id!,
        },
      });

      // Create save notification
      if (req.user.id !== listing.userId) {
        await prisma.notification.create({
          data: {
            userId: listing.userId,
            type: NotificationType.LISTING_INTEREST,
            content: `${req.user.username} saved your listing "${listing.title}"`,
            relatedListingId: listing.id,
          },
        });
      }
    }

    const updatedListing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        images: true,
        favorites: true,
        attributes: true,
        features: true,
      },
    });

    res.send({
      success: true,
      data: formatListingResponse(updatedListing as ListingWithRelations),
    });
  } catch (error) {
    console.error("Error toggling save listing:", error);
    res.code(500).send({
      success: false,
      message: "Error toggling save listing",
    });
  }
};

export const addListingImages = async (req: FastifyRequest, res: FastifyReply): Promise<any> => {
  try {
    const { id } = req.params as ListingParams;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!listing) {
      return res.code(404).send({
        success: false,
        message: "Listing not found",
      });
    }

    const image = await prisma.image.create({
      data: {
        storageProvider: 'CLOUDFLARE',
        storageKey: `listings/${listing.userId}/${Date.now()}_0.jpg`,
        url: req.processedImages?.[0].url || "",
        order: req.processedImages?.[0].order || 0,
        listingId: id,
        isCover: true,
        status: 'VALID',
        lastChecked: new Date(),
      },
    });

    return image;
  }
  catch (error) {
    console.error("Error adding listing images:", error);
    res.code(500).send({
      success: false,
      message: "Error adding listing images",
    });
  }
}