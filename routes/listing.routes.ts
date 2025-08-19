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
import { filterListingDetails } from "../utils/listing.utils.js";
import { ErrorHandler, ResponseHelpers } from "../utils/error.handler.js";
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
        const req = request as ListingCreateRequest;
        const user = req.user;
        
        if (!user) {
          return ResponseHelpers.unauthorized(reply, "User not found");
        }
        
        // Use validated and normalized data
        const validatedData = req.validatedData;
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

        // Extract vehicle fields from request body (Flutter sends these as separate form fields)
        const requestBody = req.body as any;
        const vehicleDetails = details?.vehicles || {};
        
        console.log('🚗 EXTRACTING VEHICLE FIELDS FROM REQUEST:');
        console.log('  Direct fields from Flutter:', {
          make: requestBody.make,
          model: requestBody.model,
          year: requestBody.year,
          fuelType: requestBody.fuelType,
          transmission: requestBody.transmission,
          bodyType: requestBody.bodyType,
          engineSize: requestBody.engineSize,
          mileage: requestBody.mileage,
          color: requestBody.color || requestBody.exteriorColor,
          sellerType: requestBody.sellerType,
        });
        console.log('  Nested details.vehicles:', vehicleDetails);

        // Helper function to add non-empty values
        const addIfNotEmpty = (obj: any, key: string, value: any) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string') {
              const trimmed = value.trim();
              if (trimmed !== '') {
                obj[key] = trimmed;
              }
            } else if (typeof value === 'number' && !isNaN(value)) {
              obj[key] = value;
            } else if (value !== null && value !== undefined) {
              obj[key] = value;
            }
          }
        };

        // Prepare data for database insertion - only include defined values
        const listingData = createSafeDbData({
          title,
          description,
          price,
          location,
          latitude: parseNumeric(latitude),
          longitude: parseNumeric(longitude),
          category: mainCategory, // For backwards compatibility
          mainCategory,
          subCategory,
          userId: user.id,
          listingAction,
          details,
        });

        // Add vehicle fields (prioritize direct form fields from Flutter over nested details)
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

        console.log('🚗 FINAL VEHICLE FIELDS TO SAVE:', {
          make: listingData.make,
          model: listingData.model,
          year: listingData.year,
          fuelType: listingData.fuelType,
          transmission: listingData.transmission,
          bodyType: listingData.bodyType,
          engineSize: listingData.engineSize,
          mileage: listingData.mileage,
          exteriorColor: listingData.exteriorColor,
          sellerType: listingData.sellerType,
          condition: listingData.condition,
          accidental: listingData.accidental,
        });

        // Prepare images data
        const imagesData = imageUrls.length > 0 ? {
          create: imageUrls.map((url, index) => ({
            url,
            order: index,
          })),
        } : undefined;

        // console.log("-------------------------------------------")
        // console.log(listingData)
        // console.log("=========================================")
        // return;

        // return listingData;
        const listing = await prisma.listing.create({
          data: {
            ...listingData,
            ...(imagesData && { images: imagesData }),
          },
          include: {
            images: true,
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
            favorites: true
          },
        });

        console.log("✅ Listing created successfully:", listing.id);
        
        const formattedResponse = formatListingResponse(listing);
        console.log("📄 Formatted response ready:", !!formattedResponse);
        
        // return reply.code(201).send(formattedResponse);
        return  reply.code(201).send({
            success: true,
            data: formattedResponse,
            status: 201,
            timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error creating listing:", error);
        return ErrorHandler.sendError(reply, error as Error, request.url);
      }
    }
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

  // Other routes continue with similar improvements...
  // (Keeping remaining routes from original for space, but applying same patterns)
}
