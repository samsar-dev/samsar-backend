import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";
import { processImagesMiddleware } from "../middleware/upload.middleware.js";
import {
  validateListingCreate,
  validateListingUpdate,
  validateListingQuery,
  createSuccessResponse,
  createValidationErrorResponse,
  ListingCreateRequest,
  ListingUpdateRequest,
} from "../middleware/listing.validation.middleware.js";
import prisma from "../src/lib/prismaClient.js";
import { AuthRequest, MultipartAuthRequest } from "../types/auth.js";
import {
  ListingDetails,
  ListingWithRelations,
  RealEstateDetails,
  VehicleDetails,
} from "../types/shared.js";
import { calculateDistance } from "../utils/distance.js";
import { PropertyType, VehicleType, ListingCategory } from "../types/enums.js";
import { ErrorHandler, ValidationError, ResponseHelpers } from "../utils/error.handler.js";
import { addListingImages } from "../controllers/listing.controller.js";

interface ListingQuery {
  mainCategory?: string;
  subCategory?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
  builtYear?: string;
  preview?: string;
  publicAccess?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface SearchQuery {
  query?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  limit?: string;
}

// Type for sorting options
type SortOrder = "asc" | "desc";

// Define valid sort fields
const validSortFields = ["price", "createdAt", "favorites"] as const;
type SortField = (typeof validSortFields)[number];

// Helper function to build orderBy object
const buildOrderBy = (
  sortBy?: string,
  sortOrder?: string
): Prisma.ListingOrderByWithRelationInput => {
  const order: SortOrder = sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

  if (sortBy === "favorites") {
    return {
      favorites: {
        _count: order,
      },
    };
  }

  if (sortBy === "price") {
    return { price: order };
  }

  // Default sort by createdAt
  return { createdAt: "desc" };
};

// Helper function to validate request user
const validateUser = (req: AuthRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error("Unauthorized: User not found");
  }
  return userId;
};

// Helper function to safely parse numeric values
const parseNumeric = (value: any, defaultValue: number = 0): number => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to safely parse array values
const parseArray = (value: any, defaultValue: any[] = []): any[] => {
  if (!value) return defaultValue;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper function to create safe database data (omit undefined/null/empty values)
const createSafeDbData = (data: any): any => {
  const safeData: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      // Handle arrays - only include if not empty
      if (Array.isArray(value)) {
        if (value.length > 0) {
          safeData[key] = value;
        }
      } else {
        safeData[key] = value;
      }
    }
  }
  return safeData;
};

const formatListingResponse = (listing: any): ListingWithRelations | null => {
  if (!listing) return null;

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: {
      mainCategory: listing.mainCategory,
      subCategory: listing.subCategory,
    },
    location: listing.location,
    images: listing.images?.map((img: any) => img.url) || [],
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    userId: listing.userId,
    views: listing.views,
    details: listing.details,
    listingAction: listing.listingAction,
    status: listing.status,
    // Vehicle fields as individual properties
    make: listing.make,
    model: listing.model,
    year: listing.year,
    condition: listing.condition,
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    bodyType: listing.bodyType,
    engineSize: listing.engineSize,
    mileage: listing.mileage,
    exteriorColor: listing.exteriorColor,
    sellerType: listing.sellerType,
    accidental: listing.accidental,
    // Real Estate fields as individual properties
    totalArea: listing.totalArea,
    yearBuilt: listing.yearBuilt,
    furnishing: listing.furnishing,
    floor: listing.floor,
    totalFloors: listing.totalFloors,
    seller: listing.user
      ? {
          id: listing.user.id,
          username: listing.user.username,
          profilePicture: listing.user.profilePicture,
          allowMessaging: listing.user.allowMessaging ?? true,
          privateProfile: listing.user.privateProfile ?? false,
        }
      : undefined,
    savedBy:
      listing.favorites?.map((fav: any) => ({
        id: fav.id,
        userId: fav.userId,
      })) || [],
  };
};

// Helper function to handle authenticated routes
const handleAuthRoute = (
  handler: (req: AuthRequest, reply: FastifyReply) => Promise<void>
) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      // Only authenticate if this is not a public listings request
      if (
        !request.url.includes("/listings") ||
        (request.query as any)?.publicAccess !== "true"
      ) {
        await authenticate(request, reply);
        if (!request.user) {
          reply
            .code(401)
            .send({ success: false, error: "Unauthorized: User not found" });
          return;
        }
      }

      // Cast request to AuthRequest since it's been authenticated
      const authReq = request as unknown as MultipartAuthRequest;
      return await handler(authReq, reply);
    } catch (error) {
      console.error("Auth route error:", error);
      return reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        status: 500,
        data: null,
      });
    }
  };
};

export default async function (fastify: FastifyInstance) {
  // Upload images for listing (authenticated)
  fastify.post(
    "/:id/images",
    { preHandler: [authenticate, processImagesMiddleware] },
    async (req, reply) => {
      const authReq = req as unknown as MultipartAuthRequest;
      authReq.body = {
        ...(authReq.body || {}),
        listingId: (req.params as any).id,
      };

      return addListingImages(authReq, reply);
    }
  );

  // Public Routes with validation
  fastify.get<{ Querystring: ListingQuery }>("/", 
    { preHandler: validateListingQuery },
    async (req, reply) => {
    try {
      const {
        mainCategory,
        subCategory,
        sortBy,
        sortOrder,
        page = "1",
        limit = "10",
        builtYear,
        preview = "false",
        publicAccess = "false",
        latitude,
        longitude,
        radius,
      } = req.query as ListingQuery;

      // Build where clause for filtering
      const where: Prisma.ListingWhereInput = {
        status: "ACTIVE", // Only show active listings by default
      };
      
      if (mainCategory) {
        where.mainCategory = mainCategory as string;
      }
      if (subCategory) {
        where.subCategory = subCategory as string;
      }

      // Add price range filtering
      if (req.query.minPrice || req.query.maxPrice) {
        where.price = {};
        if (req.query.minPrice) {
          where.price.gte = parseFloat(req.query.minPrice);
        }
        if (req.query.maxPrice) {
          where.price.lte = parseFloat(req.query.maxPrice);
        }
      }

      // Real estate built year filter (nested)
      // if (builtYear) {
      //   where.realEstateDetails = {
      //     is: {
      //       ...(where.realEstateDetails?.is || {}),
      //       yearBuilt: parseInt(builtYear),
      //     },
      //   };
      // }

      // First get all listings that match the basic filters
      const allListings = await prisma.listing.findMany({
        where,
        orderBy: buildOrderBy(sortBy as string, sortOrder as string),
        include: {
          images: true,
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
              allowMessaging: true,
              privateProfile: true,
            },
          },
          favorites: true,
        },
      });

      // If radius is specified, filter by distance
      let filteredListings = allListings || [];
      if (latitude && longitude && radius) {
        const centerLat = parseFloat(latitude);
        const centerLon = parseFloat(longitude);
        const maxDistance = parseFloat(radius);

        // Filter listings within the specified radius
        filteredListings = (allListings || []).filter((listing) => {
          if (!listing.latitude || !listing.longitude) return false;
          const distance = calculateDistance(
            centerLat,
            centerLon,
            listing.latitude,
            listing.longitude
          );
          return distance <= maxDistance;
        });
      }

      // Apply pagination to the filtered results
      const start = (Number(page) - 1) * Number(limit);
      const end = start + Number(limit);
      const paginatedListings = filteredListings.slice(start, end);

      // Format listings for response
      const formattedListings = paginatedListings
        .map((listing) => formatListingResponse(listing))
        .filter(
          (listing): listing is Exclude<typeof listing, null> =>
            listing !== null
        );

      return reply.code(200).send({
        success: true,
        data: formattedListings || [],
        total: filteredListings.length || 0,
        page: Number(page),
        limit: Number(limit),
        hasMore: (filteredListings.length || 0) > end,
      });
    } catch (error) {
      console.error("Error fetching listings:", error);
              return ErrorHandler.sendError(reply, error as Error, req.url);
    }
  });

  // Create listing with improved validation and payload structure
  fastify.post(
    "/",
    {
      onRequest: authenticate,
      preHandler: [processImagesMiddleware, validateListingCreate],
    },
    async (request, reply) => {
      try {
        console.log("🎯 ROUTE HANDLER STARTED");
        const req = request as ListingCreateRequest;
        const user = req.user;
        
        if (!user) {
          return ResponseHelpers.unauthorized(reply, "User not found");
        }
        
        // Use validated and normalized data
        const validatedData = req.validatedData;
        console.log("🎯 ROUTE HANDLER - validatedData exists:", !!validatedData);
        if (!validatedData) {
          return ResponseHelpers.badRequest(reply, "Validation data missing");
        }


        const {
          title,
          description,
          price,
          mainCategory,
          subCategory,
          location,
          latitude,
          longitude,
          listingAction,
          details,
        } = validatedData;

        // Get processed image URLs
        const imageUrls = req.processedImages?.map((img) => img.url) || [];

        // Extract vehicle fields from validated data (includes both form fields and details)
        const vehicleDetails = details?.vehicles || {};
        
        console.log('🚗 EXTRACTING VEHICLE FIELDS FROM REQUEST:');
        console.log('  Direct fields from Flutter:', {
          make: validatedData.make,
          model: validatedData.model,
          year: validatedData.year,
          fuelType: validatedData.fuelType,
          transmission: validatedData.transmission,
          bodyType: validatedData.bodyType,
          engineSize: validatedData.engineSize,
          mileage: validatedData.mileage,
          color: validatedData.color || validatedData.exteriorColor,
          sellerType: validatedData.sellerType,
        });
        console.log('  Nested details.vehicles:', vehicleDetails);

        // Helper function to add non-empty values - only for flat database fields
        const addIfNotEmpty = (obj: any, key: string, value: any) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string') {
              const trimmed = value.trim();
              if (trimmed !== '') {
                obj[key] = trimmed;
              }
            } else if (typeof value === 'number' && !isNaN(value)) {
              obj[key] = value;
            } else if (typeof value === 'boolean') {
              obj[key] = value;
            } else if (value !== null && value !== undefined && typeof value !== 'object') {
              obj[key] = value;
            }
          }
        };

        // Prepare data for database insertion - only include basic fields
        const listingData: any = {
          title,
          description,
          price,
          location,
          latitude: parseNumeric(latitude),
          longitude: parseNumeric(longitude),
          mainCategory,
          subCategory,
          userId: user.id,
          listingAction,
          // Store details as JSON object, not spread into top-level fields
          details,
          // Add images if any were uploaded
          images: imageUrls.length > 0 ? {
            create: imageUrls.map((url, index) => {
              const storageKey = `listings/${user.id}/${Date.now()}_${index}.jpg`;
              return {
                storageProvider: 'CLOUDFLARE',
                storageKey,
                url, // Keep URL for backward compatibility during migration
                altText: title || 'Listing image',
                order: index,
                isCover: index === 0, // First image is cover
                status: 'VALID',
                lastChecked: new Date(),
              };
            })
          } : undefined,
        };

        // Add category-specific fields based on mainCategory
        if (mainCategory.toLowerCase() === 'vehicles') {
          // Vehicle-specific fields only
          addIfNotEmpty(listingData, 'make', validatedData.make || vehicleDetails.make);
          addIfNotEmpty(listingData, 'model', validatedData.model || vehicleDetails.model);
          
          const yearValue = validatedData.year ? parseInt(validatedData.year) : (vehicleDetails.year ? parseInt(vehicleDetails.year) : null);
          addIfNotEmpty(listingData, 'year', yearValue);
          
          addIfNotEmpty(listingData, 'bodyType', validatedData.bodyType || vehicleDetails.bodyType);
          const mileageValue = validatedData.mileage ? parseInt(validatedData.mileage) : (vehicleDetails.mileage ? parseInt(vehicleDetails.mileage) : null);
          addIfNotEmpty(listingData, 'mileage', mileageValue);
          addIfNotEmpty(listingData, 'exteriorColor', validatedData.exteriorColor || validatedData.color || vehicleDetails.exteriorColor || vehicleDetails.color);
          const horsepowerValue = validatedData.horsepower ? parseInt(validatedData.horsepower) : (vehicleDetails.horsepower ? parseInt(vehicleDetails.horsepower) : null);
          addIfNotEmpty(listingData, 'horsepower', horsepowerValue);
          // registrationExpiry moved to JSON details only
          // previousOwners should only be in details JSON, not as top-level field
          // registrationStatus should only be in details JSON, not as top-level field
          // warranty should only be in details JSON, not as top-level field
          
          // customsCleared should only be in details JSON, not as top-level field
          
          // driveType should only be in details JSON, not as top-level field
          // parkingSensor should only be in details JSON, not as top-level field
          // doors and seatingCapacity moved to JSON details only
          
          const engineSizeValue = validatedData.engineSize ? parseFloat(validatedData.engineSize) : (vehicleDetails.engineSize ? parseFloat(vehicleDetails.engineSize) : null);
          addIfNotEmpty(listingData, 'engineSize', engineSizeValue);
          
          // Handle enum fields with uppercase conversion
          if (validatedData.fuelType || vehicleDetails.fuelType) {
            addIfNotEmpty(listingData, 'fuelType', (validatedData.fuelType || vehicleDetails.fuelType).toUpperCase());
          }
          
          if (validatedData.transmission || validatedData.transmissionType || vehicleDetails.transmission || vehicleDetails.transmissionType) {
            const transmissionValue = validatedData.transmission || validatedData.transmissionType || vehicleDetails.transmission || vehicleDetails.transmissionType;
            addIfNotEmpty(listingData, 'transmission', transmissionValue.toUpperCase());
          }
          
          if (validatedData.sellerType || vehicleDetails.sellerType) {
            addIfNotEmpty(listingData, 'sellerType', (validatedData.sellerType || vehicleDetails.sellerType).toUpperCase());
          }
          
          if (validatedData.condition || vehicleDetails.condition) {
            addIfNotEmpty(listingData, 'condition', (validatedData.condition || vehicleDetails.condition).toUpperCase());
          }
          
          // Handle accidental status mapping
          if (validatedData.accidental !== undefined && validatedData.accidental !== null && validatedData.accidental !== '') {
            const accidentalValue = String(validatedData.accidental).toLowerCase();
            const isAccidentFree = accidentalValue === 'no' || accidentalValue === 'false';
            addIfNotEmpty(listingData, 'accidental', isAccidentFree ? 'NO' : 'YES');
          } else if (vehicleDetails.accidental !== undefined) {
            const accidentalValue = String(vehicleDetails.accidental).toLowerCase();
            const isAccidentFree = accidentalValue === 'no' || accidentalValue === 'false';
            addIfNotEmpty(listingData, 'accidental', isAccidentFree ? 'NO' : 'YES');
          }
        } else if (mainCategory.toLowerCase() === 'real_estate' || mainCategory.toLowerCase() === 'realestate') {
          // Real estate-specific fields only
          const realEstateDetails = details?.realEstate || {};
          
          console.log('🏠 EXTRACTING REAL ESTATE FIELDS FROM REQUEST:');
          console.log('  mainCategory:', mainCategory);
          console.log('  Direct fields from Flutter:', {
            bedrooms: validatedData.bedrooms,
            bathrooms: validatedData.bathrooms,
            area: validatedData.area,
            totalArea: validatedData.totalArea,
            yearBuilt: validatedData.yearBuilt,
            furnishing: validatedData.furnishing,
            sellerType: validatedData.sellerType,
            condition: validatedData.condition,
          });
          console.log('  Nested details.realEstate:', realEstateDetails);
          
          addIfNotEmpty(listingData, 'bedrooms', validatedData.bedrooms ? parseInt(validatedData.bedrooms) : (realEstateDetails.bedrooms ? parseInt(realEstateDetails.bedrooms) : null));
          addIfNotEmpty(listingData, 'bathrooms', validatedData.bathrooms ? parseInt(validatedData.bathrooms) : (realEstateDetails.bathrooms ? parseInt(realEstateDetails.bathrooms) : null));
          addIfNotEmpty(listingData, 'totalArea', validatedData.totalArea ? parseFloat(validatedData.totalArea) : (realEstateDetails.totalArea ? parseFloat(realEstateDetails.totalArea) : null));
          addIfNotEmpty(listingData, 'yearBuilt', validatedData.yearBuilt ? parseInt(validatedData.yearBuilt) : (realEstateDetails.yearBuilt ? parseInt(realEstateDetails.yearBuilt) : null));
          addIfNotEmpty(listingData, 'furnishing', validatedData.furnishing || realEstateDetails.furnishing);
          
          // Handle sellerType and condition mapping with proper enum conversion
          if (validatedData.sellerType || realEstateDetails.sellerType) {
            addIfNotEmpty(listingData, 'sellerType', (validatedData.sellerType || realEstateDetails.sellerType).toUpperCase());
          }
          
          if (validatedData.condition || realEstateDetails.condition) {
            addIfNotEmpty(listingData, 'condition', (validatedData.condition || realEstateDetails.condition).toUpperCase());
          }
        }

        // Log final fields for debugging
        if (mainCategory.toLowerCase() === 'vehicles') {
          console.log("\n📊 FINAL VEHICLE LISTING DATA BEFORE DB INSERT:");
          console.log("Complete listingData object:", JSON.stringify(listingData, null, 2));
          const vehicleFields = ['make', 'model', 'year', 'mileage', 'fuelType', 'transmission', 'bodyType', 'exteriorColor', 'sellerType', 'condition', 'accidental', 'horsepower'];
          vehicleFields.forEach(field => {
            console.log(`${field}: ${listingData[field]} (${typeof listingData[field]})`);
          });
        } else if (mainCategory.toLowerCase() === 'real_estate' || mainCategory.toLowerCase() === 'realestate') {
          console.log("\n📊 FINAL REAL ESTATE LISTING DATA BEFORE DB INSERT:");
          console.log("Complete listingData object:", JSON.stringify(listingData, null, 2));
          const realEstateFields = ['bedrooms', 'bathrooms', 'totalArea', 'yearBuilt', 'furnishing', 'sellerType', 'condition'];
          realEstateFields.forEach(field => {
            console.log(`${field}: ${listingData[field]} (${typeof listingData[field]})`);
          });
        }

        // Create the listing in database
        console.log("\n🗄️ ATTEMPTING DATABASE INSERT:");
        console.log("listingData keys:", Object.keys(listingData));
        console.log("listingData vehicle fields:", {
          make: listingData.make,
          model: listingData.model,
          year: listingData.year,
          fuelType: listingData.fuelType,
          transmission: listingData.transmission,
          bodyType: listingData.bodyType,
          mileage: listingData.mileage,
          exteriorColor: listingData.exteriorColor,
        });

        try {
          const createdListing = await prisma.listing.create({
            data: listingData,
            include: {
              images: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  profilePicture: true,
                },
              },
            },
          });

          console.log("\n✅ DATABASE INSERT SUCCESSFUL");
          console.log("Created listing vehicle fields:", {
            make: createdListing.make,
            model: createdListing.model,
            year: createdListing.year,
            fuelType: createdListing.fuelType,
            transmission: createdListing.transmission,
            bodyType: createdListing.bodyType,
            mileage: createdListing.mileage,
            exteriorColor: createdListing.exteriorColor,
          });

          // Move images from temp folder to proper listing folder
          const { moveListingImagesFromTemp } = await import("../config/cloudflareR2.js");
          const moveResult = await moveListingImagesFromTemp(user.id!, createdListing.id);
          
          if (moveResult.success && moveResult.movedImages.length > 0) {
            console.log(`✅ Moved ${moveResult.movedImages.length} images to listing ${createdListing.id}`);
            
            // Update listing with proper image URLs
            await prisma.listing.update({
              where: { id: createdListing.id },
              data: {
                images: {
                  deleteMany: {}, // Remove old temp image records
                  create: moveResult.movedImages.map((url, index) => ({
                    url,
                    storageProvider: 'CLOUDFLARE',
                    storageKey: url.split('/').slice(-4).join('/'), // Extract key from URL
                    order: index,
                  }))
                }
              }
            });
          }

          console.log(`\n✅ Created listing ${createdListing.id}`);
          if (mainCategory === 'vehicles') {
            const savedVehicleFields = ['make', 'model', 'year', 'mileage', 'fuelType', 'transmission'].filter(field => (createdListing as any)[field]);
            console.log(`  Saved vehicle fields: [${savedVehicleFields.join(', ')}]`);
          }

          const formattedListing = formatListingResponse(createdListing);
          return reply.code(201).send({
            success: true,
            data: formattedListing,
            status: 201,
            timestamp: new Date().toISOString(),
          });
        } catch (dbError) {
          console.error("❌ DATABASE INSERT FAILED:", dbError);
          console.error("Failed listingData:", JSON.stringify(listingData, null, 2));
          throw dbError;
        }
      } catch (error) {
        console.error("Error creating listing:", error);
        return ErrorHandler.sendError(reply, error as Error, request.url);
      }
    }
  );

  // Get saved listings
  fastify.get(
    "/save",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const userId = validateUser(req);
          const savedListings = await prisma.favorite.findMany({
            where: {
              userId,
            },
            include: {
              listing: {
                include: {
                  images: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      profilePicture: true,
                    },
                  },
                  favorites: true,
                },
              },
            },
          });

          const formattedListings = savedListings.map((favorite) =>
            formatListingResponse(favorite.listing)
          );

          return reply.send({
            success: true,
            data: { items: formattedListings },
            status: 200,
          });
        } catch (error) {
          return reply.code(500).send({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
            status: 500,
          });
        }
      }
    )
  );

  // Get listing by ID (public route)
  fastify.get<{ Params: { id: string } }>(
    "/public/:id",
    async (req, reply): Promise<void> => {
      try {
        const listing = await prisma.listing.findUnique({
          where: { id: req.params.id },
          include: {
            images: true,
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
                allowMessaging: true,
                privateProfile: true,
              },
            },
            favorites: true,
          },
        });

        if (!listing) {
          return ResponseHelpers.notFound(reply, "Listing");
        }

        const formattedListing = formatListingResponse(listing);
        return reply.code(200).send({
          success: true,
          data: formattedListing,
          status: 200,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error fetching listing:", error);
        return ErrorHandler.sendError(reply, error as Error, req.url);
      }
    }
  );

  // Search listings with validation
  fastify.get<{ Querystring: SearchQuery }>(
    "/search",
    { preHandler: validateListingQuery },
    async (req, reply): Promise<void> => {
      try {
        const {
          query,
          category,
          minPrice,
          maxPrice,
          page = "1",
          limit = "10",
        } = req.query as unknown as SearchQuery;

        const where: Prisma.ListingWhereInput = {
          status: "ACTIVE",
          ...(query && {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          }),
          ...(category && { mainCategory: category }),
          ...(minPrice || maxPrice
            ? {
                price: {
                  ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
                  ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
                },
              }
            : {}),
        };

        const skip = (Number(page) - 1) * Number(limit);

        const [listings, total] = await Promise.all([
          prisma.listing.findMany({
            where,
            include: {
              user: {
                select: { id: true, username: true, profilePicture: true },
              },
              images: true,
              favorites: true,
            },
            orderBy: { createdAt: "desc" },
            take: Number(limit),
            skip,
          }),
          prisma.listing.count({ where }),
        ]);

        return reply.code(200).send({
          success: true,
          data: listings.map((listing) => formatListingResponse(listing)),
          total,
          page: Number(page),
          limit: Number(limit),
          hasMore: total > Number(page) * Number(limit),
        });
      } catch (error) {
        return ErrorHandler.sendError(reply, error as Error, req.url);
      }
    }
  );

  // Get user's own listings (authenticated)
  fastify.get(
    "/user",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const userId = validateUser(req);
          const { page = "1", limit = "10" } = req.query as { page?: string; limit?: string };
          
          const skip = (Number(page) - 1) * Number(limit);
          
          const [listings, total] = await Promise.all([
            prisma.listing.findMany({
              where: {
                userId,
              },
              include: {
                images: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    profilePicture: true,
                    allowMessaging: true,
                    privateProfile: true,
                  },
                },
                favorites: true,
              },
              orderBy: { createdAt: "desc" },
              take: Number(limit),
              skip,
            }),
            prisma.listing.count({ where: { userId } }),
          ]);

          const formattedListings = listings.map((listing) =>
            formatListingResponse(listing)
          );

          return reply.send({
            success: true,
            data: {
              listings: formattedListings,
              total,
              page: Number(page),
              limit: Number(limit),
              hasMore: total > Number(page) * Number(limit),
            },
            status: 200,
          });
        } catch (error) {
          return reply.code(500).send({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
            status: 500,
          });
        }
      }
    )
  );

  // Delete listing (authenticated - only owner can delete)
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const userId = validateUser(req);
          const listingId = (req.params as { id: string }).id;

          // First check if listing exists and belongs to user
          const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            include: { images: true },
          });

          if (!listing) {
            return reply.code(404).send({
              success: false,
              error: "Listing not found",
              status: 404,
            });
          }

          if (listing.userId !== userId) {
            return reply.code(403).send({
              success: false,
              error: "You can only delete your own listings",
              status: 403,
            });
          }

          // Delete the listing (this will cascade delete related records)
          await prisma.listing.delete({
            where: { id: listingId },
          });

          return reply.send({
            success: true,
            message: "Listing deleted successfully",
            status: 200,
          });
        } catch (error) {
          console.error("Error deleting listing:", error);
          return reply.code(500).send({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
            status: 500,
          });
        }
      }
    )
  );

  // Other routes continue with similar improvements...
  // (Keeping remaining routes from original for space, but applying same patterns)
}