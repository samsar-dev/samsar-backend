import {
  ListingStatus,
  ListingAction,
  Prisma,
  NotificationType,
} from "@prisma/client";
import { VehicleType, FuelType, TransmissionType, Condition, PropertyType } from "../types/enums.js";
import { VehicleValidatorFactory, RealEstateValidatorFactory } from "../validators/index.js";
import prisma from "../src/lib/prismaClient.js";
import {
  uploadToR2,
  deleteFromR2,
  moveObjectInR2,
} from "../config/cloudflareR2.js";
import { FastifyRequest, FastifyReply } from "fastify";
import { MultipartAuthRequest } from "../types/auth.js";
import fs from "fs";
import { handleListingPriceUpdate } from "../src/services/notification.service.js";
import { UserPayload } from "../types/auth.js";
import { formatListingIdForDisplay } from "../utils/listingIdFormatter.js";

import { UserRole } from "../types/auth.js";

// Extend Fastify request with processedImages
declare module "fastify" {
  interface FastifyRequest {
    processedImages?: Array<{
      url: string;
      order: number;
    }>;
  }
}

interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

interface ListingResponse {
  id: string;
  displayId: string;
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
  createdAt: Date;
  updatedAt: Date;
  userId: string;
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
  vehicleDetails?: {
    id: string;
    vehicleType: VehicleType;
    make: string;
    model: string;
    year: number;
    mileage?: number;
    fuelType?: FuelType;
    transmissionType?: TransmissionType;
    color?: string;
    condition?: Condition;
    listingId: string;
    interiorColor?: string;
    engine?: string;
    warranty?: string;
    serviceHistory?: string[];
    previousOwners?: number;
    registrationStatus?: string;
  } | null;
  realEstateDetails?: {
    id: string;
    propertyType: string;
    size?: string;
    yearBuilt?: string;
    bedrooms?: string;
    bathrooms?: string;
    condition?: string;
    listingId: string;
  } | null;
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
    vehicleDetails: {
      select: {
        id: true;
        vehicleType: true;
        make: true;
        model: true;
        year: true;
        mileage: true;
        fuelType: true;
        transmissionType: true;
        color: true;
        condition: true;
        listingId: true;
        interiorColor: true;
        engine: true;
        warranty: true;
        serviceHistory: true;
        previousOwners: true;
        registrationStatus: true;
      };
    };
    realEstateDetails: true;
    favorites: true;
    attributes: true;
    features: true;
  };
}> & {
  views?: number;
};

type VehicleDetailsWithRelations = Prisma.VehicleDetailsGetPayload<{
  select: {
    id: true;
    vehicleType: true;
    make: true;
    model: true;
    year: true;
    mileage: true;
    fuelType: true;
    transmissionType: true;
    color: true;
    condition: true;
    listingId: true;
    interiorColor: true;
    engine: true;
    warranty: true;
    serviceHistory: true;
    previousOwners: true;
    registrationStatus: true;
  };
}>;

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
  details?: {
    vehicles?: Partial<{
      vehicleType: VehicleType;
      make: string;
      model: string;
      year: number;
      mileage?: number;
      fuelType?: FuelType;
      transmissionType?: TransmissionType;
      color?: string;
      condition?: Condition;
    }>;
    realEstate?: Record<string, unknown>;
  };
  listingAction?: ListingAction;
  sellerType?: string;
  attributes?: Array<{ name: string; value: string }>;
  features?: Array<{ name: string; value: boolean }>;
};

const formatListingResponse = (
  listing: ListingWithRelations,
): ListingResponse => {
  return {
    id: listing.id,
    displayId: formatListingIdForDisplay(listing.id),
    title: listing.title,
    description: listing.description || "",
    price: listing.price,
    mainCategory: listing.mainCategory,
    subCategory: listing.subCategory,
    location: listing.location,
    latitude: listing.latitude,
    longitude: listing.longitude,
    views: "views" in listing ? listing.views || 0 : 0,
    condition: listing.condition || undefined,
    status: listing.status,
    listingAction: listing.listingAction || undefined,
    sellerType: (listing as any).sellerType || undefined,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    userId: listing.userId,
    user: {
      id: listing.user.id,
      username: listing.user.username,
      profilePicture: listing.user.profilePicture || undefined,
    },
    images: listing.images.map((img) => ({
      id: img.id,
      url: img.url,
      order: img.order,
      listingId: img.listingId,
    })),
    vehicleDetails: listing.vehicleDetails
      ? {
          id: listing.vehicleDetails.id,
          vehicleType: listing.vehicleDetails.vehicleType as any,
          make: listing.vehicleDetails.make,
          model: listing.vehicleDetails.model,
          year: listing.vehicleDetails.year,
          mileage: listing.vehicleDetails.mileage || undefined,
          fuelType: listing.vehicleDetails.fuelType as any,
          transmissionType:
            listing.vehicleDetails.transmissionType as any || undefined,
          color: listing.vehicleDetails.color || undefined,
          condition: listing.vehicleDetails.condition as any || undefined,
          listingId: listing.vehicleDetails.listingId,
          interiorColor: listing.vehicleDetails.interiorColor || undefined,
          engine: listing.vehicleDetails.engine || undefined,
          warranty: listing.vehicleDetails.warranty || undefined,
          serviceHistory: listing.vehicleDetails.serviceHistory || undefined,
          previousOwners: listing.vehicleDetails.previousOwners || undefined,
          registrationStatus:
            listing.vehicleDetails.registrationStatus || undefined,
        }
      : null,
    realEstateDetails: listing.realEstateDetails
      ? {
          id: listing.realEstateDetails.id,
          propertyType: listing.realEstateDetails.propertyType as any,
          size: listing.realEstateDetails.size || undefined,
          yearBuilt: listing.realEstateDetails.yearBuilt
            ? String(listing.realEstateDetails.yearBuilt)
            : undefined,
          bedrooms: listing.realEstateDetails.bedrooms
            ? String(listing.realEstateDetails.bedrooms)
            : undefined,
          bathrooms: listing.realEstateDetails.bathrooms
            ? String(listing.realEstateDetails.bathrooms)
            : undefined,
          condition: listing.realEstateDetails.condition || undefined,
          listingId: listing.realEstateDetails.listingId,
        }
      : null,
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

export async function addListingImages(
  req: MultipartAuthRequest,
  res: FastifyReply,
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.code(401).send({ success: false, error: "Unauthorized" });
    }
    const { listingId } = req.body as any;
    if (!listingId) {
      return res
        .code(400)
        .send({ success: false, error: "listingId is required" });
    }
    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.userId !== userId) {
      return res.code(403).send({ success: false, error: "Forbidden" });
    }

    if (req.processedImages && req.processedImages.length > 0) {
      await prisma.image.createMany({
        data: req.processedImages.map((img, idx) => ({
          url: img.url,
          order: idx,
          listingId,
        })),
      });
    }
    const updatedImages = await prisma.image.findMany({ where: { listingId } });
    return res.code(201).send({ success: true, data: updatedImages });
  } catch (err) {
    console.error("addListingImages error", err);
    return res.code(500).send({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

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
      sellerType,
      attributes,
      features,
    } = req.body as ListingCreateBody;

    // Parse details if it's a string
    const parsedDetails = typeof details === "string" ? JSON.parse(details) : details || {};
    
    // Debug logging to see exactly what's being received
    console.log("=== DEBUG: Request Body ===");
    console.log("Raw details:", details);
    console.log("Parsed details:", parsedDetails);
    console.log("Vehicle type:", parsedDetails?.vehicleType);
    console.log("Type of vehicleType:", typeof parsedDetails?.vehicleType);
    console.log("=== END DEBUG ===");
    
    // Ensure vehicleType is set from subCategory if not provided
    if (!parsedDetails.vehicleType && subCategory) {
      parsedDetails.vehicleType = subCategory;
    }

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

    // Start transaction to ensure data consistency
    const result = await prismaClient.$transaction(async (tx) => {
      // Prepare base listing data
      const listingData: Prisma.ListingCreateInput = {
        title,
        description,
        price: listingPrice,
        mainCategory,
        subCategory,
        category: JSON.stringify({ mainCategory, subCategory }),
        location,
        latitude:
          typeof latitude === "string" ? parseFloat(latitude) : latitude,
        longitude:
          typeof longitude === "string" ? parseFloat(longitude) : longitude,
        condition,
        status: ListingStatus.ACTIVE,
        listingAction: listingAction || ListingAction.SALE,
        sellerType,
        user: {
          connect: { id: userId },
        },
      } as any;

      // Add vehicle details if present (single vehicle per listing)
      // Handle both flat and nested vehicle details structure
      const vehicleData = parsedDetails.vehicles || parsedDetails;
      
      console.log('🔍 [createListing] Vehicle data check:', {
        hasVehicleData: Object.keys(vehicleData).length > 0,
        vehicleType: vehicleData.vehicleType,
        subCategory,
        mainCategory,
        vehicleDataKeys: Object.keys(vehicleData)
      });
      
      // Check if we have vehicle-related data or if this is a vehicle listing
      const hasVehicleData = vehicleData.vehicleType || 
                           vehicleData.make || 
                           vehicleData.model || 
                           vehicleData.year ||
                           mainCategory === 'vehicles';
      
      // If we have any vehicle data, process it
      if (hasVehicleData && Object.keys(vehicleData).length > 0) {
        // If vehicleType is not set but we have subCategory, use that
        if (!vehicleData.vehicleType && subCategory) {
          vehicleData.vehicleType = subCategory;
        }
        
        // If still no vehicleType but mainCategory is vehicles, default to CARS
        if (!vehicleData.vehicleType && mainCategory === 'vehicles') {
          vehicleData.vehicleType = 'CARS';
        }
        
        if (vehicleData.vehicleType) {
          const vehicleType = vehicleData.vehicleType as VehicleType;
          
          // Log the data being validated
          console.log('Validating vehicle data:', JSON.stringify(vehicleData, null, 2));
          
          // Use the validator factory for clean validation
          const validationResult = VehicleValidatorFactory.validate(vehicleType, vehicleData);
          
          if (validationResult.errors.length > 0) {
            console.log('Validation errors:', validationResult.errors);
            return res.code(400).send({
              success: false,
              error: "Vehicle validation failed",
              errors: validationResult.errors,
              validator: VehicleValidatorFactory.getValidatorName(vehicleType),
              status: 400,
              data: null,
            });
          }

          // Use the mapped data from the validator
          const mappedVehicleData = validationResult.mappedData || vehicleData;
          
          console.log('Mapped vehicle data:', JSON.stringify(mappedVehicleData, null, 2));
          
          // Create base vehicle details with all possible fields
          const vehicleDetails: any = {
            vehicleType: (mappedVehicleData.vehicleType || subCategory) as any,
            make: mappedVehicleData.make || null,
            model: mappedVehicleData.model || null,
            year: mappedVehicleData.year ? parseInt(mappedVehicleData.year) : null,
            mileage: mappedVehicleData.mileage ? parseFloat(mappedVehicleData.mileage) : null,
            fuelType: mappedVehicleData.fuelType as any || null,
            transmissionType: mappedVehicleData.transmissionType as any || null,
            color: mappedVehicleData.color || null,
            condition: (mappedVehicleData.condition || condition) as any || null,
            engine: mappedVehicleData.engine || null,
            engineSize: mappedVehicleData.engineSize || null,
            warranty: mappedVehicleData.warranty || null,
            serviceHistory: mappedVehicleData.serviceHistory || null,
            previousOwners: mappedVehicleData.previousOwners ? parseInt(mappedVehicleData.previousOwners) : null,
            registrationStatus: mappedVehicleData.registrationStatus || null,
            interiorColor: mappedVehicleData.interiorColor || null,
            // Add any additional fields that might be in the data
            ...(mappedVehicleData.engineNumber && { engineNumber: mappedVehicleData.engineNumber }),
            ...(mappedVehicleData.vin && { vin: mappedVehicleData.vin }),
            ...(mappedVehicleData.licensePlate && { licensePlate: mappedVehicleData.licensePlate }),
          };

          console.log('Final vehicle details to save:', JSON.stringify(vehicleDetails, null, 2));
          
          listingData.vehicleDetails = {
            create: vehicleDetails as Prisma.VehicleDetailsCreateWithoutListingInput,
          };
        }
      }

      // Add real estate details if present (single property per listing)
      if (parsedDetails?.propertyType) {
        const propertyType = parsedDetails.propertyType as PropertyType;
        
        // Use our clean real estate validator factory
        const validationResult = RealEstateValidatorFactory.validate(propertyType, parsedDetails);
        
        if (validationResult.errors.length > 0) {
          return res.code(400).send({
            success: false,
            error: "Real estate validation failed",
            errors: validationResult.errors,
            validator: RealEstateValidatorFactory.getValidatorName(propertyType),
            status: 400,
            data: null,
          });
        }

        // Use the mapped data from the validator
        const mappedRealEstateData = validationResult.mappedData;
        if (mappedRealEstateData) {
          // Create flexible real estate details mapping
          const realEstateDetails: any = {
            propertyType: (mappedRealEstateData as any).propertyType || "OTHER",
          };

          // Map all possible fields from the validator result
          const fieldMappings = [
            'size', 'condition', 'constructionType', 'features', 'parking', 
            'accessibilityFeatures', 'balcony', 'buildingAmenities', 'cooling',
            'elevator', 'energyRating', 'exposureDirection', 'fireSafety',
            'floor', 'flooringType', 'furnished', 'heating', 'internetIncluded',
            'parkingType', 'petPolicy', 'renovationHistory', 'securityFeatures',
            'storage', 'storageType', 'totalFloors', 'utilities', 'view',
            'windowType', 'totalArea', 'yearBuilt', 'bedrooms', 'bathrooms',
            'floorLevel', 'isBuildable', 'elevation', 'buildable', 'buildingRestrictions',
            'environmentalFeatures', 'naturalFeatures', 'parcelNumber', 'permitsInPlace',
            'soilTypes', 'topography', 'waterFeatures', 'accessibility', 'appliances',
            'communityFeatures', 'energyFeatures', 'exteriorFeatures', 'hoaFeatures',
            'kitchenFeatures', 'landscaping', 'livingArea', 'halfBathrooms', 'stories',
            'attic', 'basement', 'flooringTypes', 'basementFeatures', 'bathroomFeatures'
          ];

          // Map all available fields from the validator result
          fieldMappings.forEach(field => {
            if (field in (mappedRealEstateData as any)) {
              realEstateDetails[field] = (mappedRealEstateData as any)[field] || null;
            }
          });

          listingData.realEstateDetails = {
            create: realEstateDetails as Prisma.RealEstateDetailsCreateWithoutListingInput,
          };
        }
      }

      // Create the listing
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
          vehicleDetails: {
            select: {
              id: true,
              vehicleType: true,
              make: true,
              model: true,
              year: true,
              mileage: true,
              fuelType: true,
              transmissionType: true,
              color: true,
              condition: true,
              listingId: true,
              interiorColor: true,
              engine: true,
              warranty: true,
              serviceHistory: true,
              previousOwners: true,
              registrationStatus: true,
            },
          },
          realEstateDetails: true,
          favorites: true,
          attributes: true,
          features: true,
        },
      });

      // Process images if any
      if (req.processedImages && req.processedImages.length > 0) {
        await tx.image.createMany({
          data: req.processedImages.map((img, index) => ({
            url: img.url,
            order: index,
            listingId: listing.id,
          })),
        });
      }

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
    /* --- Move images from temporary 'other' folder to listing folder --- */
    if (req.processedImages && req.processedImages.length > 0) {
      const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";
      await Promise.all(
        req.processedImages.map(async (img) => {
          if (!img.url.includes("/other/")) return;
          try {
            const urlPath = img.url.replace(baseUrl + "/", "");
            const filename = urlPath.split("/").pop() || "";
            const newKey = `uploads/users/${result.userId}/listings/${result.id}/images/${filename}`;
            const moveRes = await moveObjectInR2(urlPath, newKey);
            if (moveRes.success && moveRes.url) {
              await prisma.image.updateMany({
                where: { listingId: result.id, url: img.url },
                data: { url: moveRes.url },
              });
            }
          } catch (err) {
            console.error("Failed to move listing image", err);
          }
        }),
      );
    }

    const refreshedListing = await prisma.listing.findUnique({
      where: { id: result.id },
      include: {
        user: { select: { id: true, username: true, profilePicture: true } },
        images: true,
        vehicleDetails: true,
        realEstateDetails: true,
        favorites: true,
        attributes: true,
        features: true,
      },
    });
    const formattedListing = formatListingResponse(refreshedListing as any);

    // Send response
    res.code(201).send({
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

    // Year filter
    const year =
      (req.query as any).year !== undefined &&
      (req.query as any).year !== null &&
      (req.query as any).year !== ""
        ? Number((req.query as any).year)
        : undefined;

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
      // Vehicle year filter (only for vehicle listings)
      ...(year
        ? {
            vehicleDetails: {
              year: year,
            },
          }
        : {}),
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
          vehicleDetails: {
            select: {
              id: true,
              vehicleType: true,
              make: true,
              model: true,
              year: true,
              mileage: true,
              fuelType: true,
              transmissionType: true,
              color: true,
              condition: true,
              listingId: true,
              interiorColor: true,
              engine: true,
              warranty: true,
              serviceHistory: true,
              previousOwners: true,
              registrationStatus: true,
            },
          },
          realEstateDetails: true,
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
        vehicleDetails: {
          select: {
            id: true,
            vehicleType: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            fuelType: true,
            transmissionType: true,
            color: true,
            condition: true,
            listingId: true,
            interiorColor: true,
            engine: true,
            warranty: true,
            serviceHistory: true,
            previousOwners: true,
            registrationStatus: true,
          },
        },
        realEstateDetails: true,
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
          OR: [{ userId: req.user?.id }, { userIp: req.ip || "unknown" }],
          createdAt: {
            gte: today,
          },
        },
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
              userIp: req.ip || "unknown",
              userAgent: req.headers["user-agent"] || "unknown",
            },
          }),
        ]);
      }
    }

    // Get the updated listing with the incremented view count
    const updatedListing = (await prisma.listing.findUnique({
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
        vehicleDetails: {
          select: {
            id: true,
            vehicleType: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            fuelType: true,
            transmissionType: true,
            color: true,
            condition: true,
            listingId: true,
            interiorColor: true,
            engine: true,
            warranty: true,
            serviceHistory: true,
            previousOwners: true,
            registrationStatus: true,
          },
        },
        realEstateDetails: true,
      },
    })) as ListingWithRelations;

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
      features,
      details,
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
      features?: Array<{ name: string; value: boolean }>;
      details?: any;
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

    console.log(
      "- Final imagesToCreate (deduped & reindexed):",
      imagesToCreate,
    );

    // Ensure price is a number and handle potential string input
    const newPrice = typeof price === "string" ? parseFloat(price) : price;

    // Parse details if provided
    const parsedDetails = typeof details === "string" ? JSON.parse(details) : details || {};
    
    console.log("🔍 [updateListing] Processing details:", parsedDetails);

    // Check if price has changed and is a valid number
    const isPriceChanged = !isNaN(newPrice) && oldListing.price !== newPrice;

    // Start transaction to handle nested updates
    const listing = await prisma.$transaction(async (tx) => {
      // First, update the main listing
      const updatedListing = await tx.listing.update({
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
                  create: imagesToCreate.map((img) => ({
                    url: img.url,
                    order: img.order,
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
          vehicleDetails: {
            select: {
              id: true,
              vehicleType: true,
              make: true,
              model: true,
              year: true,
              mileage: true,
              fuelType: true,
              transmissionType: true,
              color: true,
              condition: true,
              listingId: true,
              interiorColor: true,
              engine: true,
              warranty: true,
              serviceHistory: true,
              previousOwners: true,
              registrationStatus: true,
            },
          },
          realEstateDetails: true,
        },
      });

      // Handle vehicle details update if provided
      if (parsedDetails && Object.keys(parsedDetails).length > 0) {
        const vehicleData = parsedDetails.vehicles || parsedDetails;
        
        // If we have vehicle data, process it
        if (vehicleData && Object.keys(vehicleData).length > 0) {
          // Set vehicleType from subCategory if not provided
          if (!vehicleData.vehicleType && subCategory) {
            vehicleData.vehicleType = subCategory;
          }
          
          if (vehicleData.vehicleType) {
            const vehicleType = vehicleData.vehicleType as VehicleType;
            
            console.log('🔍 [updateListing] Validating vehicle data:', JSON.stringify(vehicleData, null, 2));
            
            // Use the validator factory for clean validation
            const validationResult = VehicleValidatorFactory.validate(vehicleType, vehicleData);
            
            if (validationResult.errors.length > 0) {
              console.log('❌ Vehicle validation errors:', validationResult.errors);
              throw new Error(`Vehicle validation failed: ${validationResult.errors.join(', ')}`);
            }

            // Use the mapped data from the validator
            const mappedVehicleData = validationResult.mappedData || vehicleData;
            
            console.log('✅ Mapped vehicle data:', JSON.stringify(mappedVehicleData, null, 2));
            
            // Create base vehicle details with all possible fields
            const vehicleDetails: any = {
              vehicleType: (mappedVehicleData.vehicleType || subCategory) as any,
              make: mappedVehicleData.make || null,
              model: mappedVehicleData.model || null,
              year: mappedVehicleData.year ? parseInt(mappedVehicleData.year) : null,
              mileage: mappedVehicleData.mileage ? parseFloat(mappedVehicleData.mileage) : null,
              fuelType: mappedVehicleData.fuelType as any || null,
              transmissionType: mappedVehicleData.transmissionType as any || null,
              color: mappedVehicleData.color || null,
              condition: (mappedVehicleData.condition || condition) as any || null,
              engine: mappedVehicleData.engine || null,
              engineSize: mappedVehicleData.engineSize || null,
              warranty: mappedVehicleData.warranty || null,
              serviceHistory: mappedVehicleData.serviceHistory || null,
              previousOwners: mappedVehicleData.previousOwners ? parseInt(mappedVehicleData.previousOwners) : null,
              registrationStatus: mappedVehicleData.registrationStatus || null,
              interiorColor: mappedVehicleData.interiorColor || null,
              // Add any additional fields that might be in the data
              ...(mappedVehicleData.engineNumber && { engineNumber: mappedVehicleData.engineNumber }),
              ...(mappedVehicleData.vin && { vin: mappedVehicleData.vin }),
              ...(mappedVehicleData.licensePlate && { licensePlate: mappedVehicleData.licensePlate }),
            };

            console.log('🔧 Final vehicle details to save:', JSON.stringify(vehicleDetails, null, 2));
            
            // Check if vehicle details already exist
            const existingVehicleDetails = await tx.vehicleDetails.findUnique({
              where: { listingId: id }
            });

            if (existingVehicleDetails) {
              // Update existing vehicle details
              await tx.vehicleDetails.update({
                where: { listingId: id },
                data: vehicleDetails as Prisma.VehicleDetailsUpdateInput,
              });
              console.log('✅ Updated existing vehicle details');
            } else {
              // Create new vehicle details
              await tx.vehicleDetails.create({
                data: {
                  ...vehicleDetails,
                  listingId: id,
                } as Prisma.VehicleDetailsCreateInput,
              });
              console.log('✅ Created new vehicle details');
            }
          }
        }

        // Handle real estate details if present
        if (parsedDetails?.propertyType) {
          const propertyType = parsedDetails.propertyType as PropertyType;
          
          // Use our clean real estate validator factory
          const validationResult = RealEstateValidatorFactory.validate(propertyType, parsedDetails);
          
          if (validationResult.errors.length > 0) {
            console.log('❌ Real estate validation errors:', validationResult.errors);
            throw new Error(`Real estate validation failed: ${validationResult.errors.join(', ')}`);
          }

          // Use the mapped data from the validator
          const mappedRealEstateData = validationResult.mappedData;
          if (mappedRealEstateData) {
            // Create flexible real estate details mapping
            const realEstateDetails: any = {
              propertyType: (mappedRealEstateData as any).propertyType || "OTHER",
            };

            // Map all possible fields from the validator result
            const fieldMappings = [
              'size', 'condition', 'constructionType', 'features', 'parking', 
              'accessibilityFeatures', 'balcony', 'buildingAmenities', 'cooling',
              'elevator', 'energyRating', 'exposureDirection', 'fireSafety',
              'floor', 'flooringType', 'furnished', 'heating', 'internetIncluded',
              'parkingType', 'petPolicy', 'renovationHistory', 'securityFeatures',
              'storage', 'storageType', 'totalFloors', 'utilities', 'view',
              'windowType', 'totalArea', 'yearBuilt', 'bedrooms', 'bathrooms',
              'floorLevel', 'isBuildable', 'elevation', 'buildable', 'buildingRestrictions',
              'environmentalFeatures', 'naturalFeatures', 'parcelNumber', 'permitsInPlace',
              'soilTypes', 'topography', 'waterFeatures', 'accessibility', 'appliances',
              'communityFeatures', 'energyFeatures', 'exteriorFeatures', 'hoaFeatures',
              'kitchenFeatures', 'landscaping', 'livingArea', 'halfBathrooms', 'stories',
              'attic', 'basement', 'flooringTypes', 'basementFeatures', 'bathroomFeatures'
            ];

            // Map all available fields from the validator result
            fieldMappings.forEach(field => {
              if (field in (mappedRealEstateData as any)) {
                realEstateDetails[field] = (mappedRealEstateData as any)[field] || null;
              }
            });

            // Check if real estate details already exist
            const existingRealEstateDetails = await tx.realEstateDetails.findUnique({
              where: { listingId: id }
            });

            if (existingRealEstateDetails) {
              // Update existing real estate details
              await tx.realEstateDetails.update({
                where: { listingId: id },
                data: realEstateDetails as Prisma.RealEstateDetailsUpdateInput,
              });
              console.log('✅ Updated existing real estate details');
            } else {
              // Create new real estate details
              await tx.realEstateDetails.create({
                data: {
                  ...realEstateDetails,
                  listingId: id,
                } as Prisma.RealEstateDetailsCreateInput,
              });
              console.log('✅ Created new real estate details');
            }
          }
        }
      }

      return updatedListing;
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
      await deleteFromR2(image.url);
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
          userId: req.user.id,
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
        vehicleDetails: {
          select: {
            id: true,
            vehicleType: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            fuelType: true,
            transmissionType: true,
            color: true,
            condition: true,
            listingId: true,
            interiorColor: true,
            engine: true,
            warranty: true,
            serviceHistory: true,
            previousOwners: true,
            registrationStatus: true,
          },
        },
        realEstateDetails: true,
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
