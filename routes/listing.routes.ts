import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { schemaMap } from "../schemas/listingSchemaMap.js";
import { Prisma } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";
import { processImagesMiddleware } from "../middleware/upload.middleware.js";
import prisma from "../src/lib/prismaClient.js";
import { AuthRequest, MultipartAuthRequest } from "../types/auth.js";
import {
  ListingDetails,
  ListingWithRelations,
  RealEstateDetails,
  VehicleDetails,
} from "../types/shared.js";
import { calculateDistance } from "../utils/distance.js";
import { PropertyType, VehicleType } from "../types/enums.js";
import { filterListingDetails } from "../utils/listing.utils.js";
import { 
  addListingImages, 
  createListing, 
  getListings, 
  getListing, 
  updateListing, 
  deleteListing, 
  toggleSaveListing 
} from "../controllers/listing.controller.js";
import { VehicleValidatorFactory, RealEstateValidatorFactory } from "../validators/index.js";
import { Param } from "@prisma/client/runtime/library";
interface ListingQuery {
  mainCategory?: string;
  subCategory?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
  builtYear?: string;
  year?: string; // For vehicle year
  listingAction?: string; // For sale/rent filter
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
  sortOrder?: string,
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

const formatListingResponse = (listing: any): ListingWithRelations | null => {
  if (!listing) return null;

  const details: ListingDetails = {
    vehicles: listing.vehicleDetails
      ? (filterListingDetails(
          listing.vehicleDetails,
          listing.subCategory,
        ) as VehicleDetails)
      : undefined,
    realEstate: listing.realEstateDetails
      ? (filterListingDetails(
          listing.realEstateDetails,
          listing.subCategory,
        ) as RealEstateDetails)
      : undefined,
  };

  // console.log("Details sent to DB:", details);

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
    details: details,
    listingAction: listing.listingAction,
    status: listing.status,
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
  handler: (req: AuthRequest, reply: FastifyReply) => Promise<void>,
) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    try {
      console.log("Fetching favorite listings...", request);
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
    },
  );
  // Remove global auth middleware and handle auth per route

  // Public Routes
  fastify.get<{ Querystring: ListingQuery }>("/", async (req, reply) => {
    try {
      // No authentication needed for this route
      const {
        mainCategory,
        subCategory,
        sortBy,
        sortOrder,
        page = "1",
        limit = "10",
        builtYear,
        year,
        listingAction,
        preview = "false",
        publicAccess = "false",
        latitude,
        longitude,
        radius,
      } = req.query as ListingQuery;

      // Build where clause for filtering
      const where: Prisma.ListingWhereInput = {};
      if (mainCategory) {
        where.mainCategory = mainCategory as string;
      }
      if (subCategory) {
        where.subCategory = subCategory as string;
      }
      
      // Add listingAction filtering (for sale/rent)
      if (listingAction) {
        where.listingAction = listingAction as string;
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
      if (builtYear) {
        where.realEstateDetails = {
          is: {
            ...(where.realEstateDetails?.is || {}),
            yearBuilt: parseInt(builtYear),
          },
        };
      }
      
      // Vehicle year filter (nested)
      if (year) {
        where.vehicleDetails = {
          is: {
            ...(where.vehicleDetails?.is || {}),
            year: parseInt(year),
          },
        };
      }

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
            },
          },
          favorites: true,
          realEstateDetails: true,
          vehicleDetails: true,
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
            listing.longitude,
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
            listing !== null,
        );

      // Always return a response, even if empty
      return reply.status(200).send({
        success: true,
        data: {
          items: formattedListings || [],
          total: filteredListings.length || 0,
          page: Number(page),
          limit: Number(limit),
          hasMore: (filteredListings.length || 0) > end,
        },
        status: 200,
      });
      return;
    } catch (error) {
      console.error("Error fetching listings:", error);
      return reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch listings",
        status: 500,
        data: null,
      });
    }
  });

  fastify.get<{ Querystring: SearchQuery }>(
    "/search",
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
          ...(category && { category }),
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

        return reply.send({
          success: true,
          data: {
            items: listings.map((listing) => formatListingResponse(listing)),
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
            error instanceof Error ? error.message : "Error searching listings",
          status: 500,
          data: null,
        });
      }
    },
  );

  fastify.get("/trending", async (_req, reply): Promise<void> => {
    try {
      const trendingListings = await prisma.listing.findMany({
        where: { status: "ACTIVE" },
        include: {
          images: true,
          _count: {
            select: { favorites: true },
          },
        },
        orderBy: {
          favorites: {
            _count: "desc",
          },
        },
        take: 10,
      });

      return reply.send({
        success: true,
        data: { items: trendingListings },
        status: 200,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return reply.code(500).send({
        success: false,
        error: errorMessage,
        status: 500,
        data: null,
      });
    }
  });

  // Get listing by ID (public route)
  fastify.get<{ Params: { id: string } }>(
    "/public/:id",
    async (req, reply): Promise<void> => {
      try {
        console.log(`Fetching listing with ID: ${req.params.id}`);

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
            // This includes all vehicle details
            realEstateDetails: true, // This includes all real estate details
            // This includes all vehicle details
            vehicleDetails: true,
          },
        });

        if (!listing) {
          console.log(`Listing not found with ID: ${req.params.id}`);
          return reply.code(404).send({
            success: false,
            error: "Listing not found",
            status: 404,
            data: null,
          });
          return;
        }

        // Detailed logging
        console.log("Raw listing data:", JSON.stringify(listing, null, 2));

        const formattedListing = formatListingResponse(listing);

        if (
          formattedListing &&
          formattedListing.details &&
          formattedListing.details.vehicles
        ) {
          console.log(
            "Formatted listing:",
            JSON.stringify(formattedListing, null, 2),
          );
          console.log(
            "Formatted vehicle details:",
            JSON.stringify(formattedListing.details.vehicles, null, 2),
          );
        }

        return reply.send({
          success: true,
          data: formattedListing,
          status: 200,
        });
      } catch (error) {
        console.error("Error fetching listing:", error);
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch listing",
          status: 500,
          data: null,
        });
      }
    },
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
            formatListingResponse(favorite.listing),
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
            data: null,
          });
        }
      },
    ),
  );

  // Save a listing to favorites
  fastify.post<{ Params: { listingId: string } }>(
    "/saved/:listingId",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const userId = validateUser(req);
          const { listingId } = req.params as { listingId: string };

          // Check if listing exists
          const listing = await prisma.listing.findUnique({
            where: { id: listingId },
          });

          if (!listing) {
            return reply.code(404).send({
              success: false,
              error: "Listing not found",
              status: 404,
              data: null,
            });
            return;
          }

          // Check if already favorited
          const existingFavorite = await prisma.favorite.findUnique({
            where: {
              userId_listingId: {
                userId,
                listingId,
              },
            },
          });

          if (existingFavorite) {
            return reply.code(400).send({
              success: false,
              error: "Listing already saved",
              status: 400,
              data: null,
            });
            return;
          }

          // Create favorite
          const favorite = await prisma.favorite.create({
            data: {
              userId,
              listingId,
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

          return reply.send({
            success: true,
            data: formatListingResponse(favorite.listing),
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
            data: null,
          });
        }
      },
    ),
  );

  // Delete a saved listing
  fastify.delete<{ Params: { listingId: string } }>(
    "/saved/:listingId",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const userId = validateUser(req);
          const { listingId } = req.params as { listingId: string };

          // Check if favorite exists
          const favorite = await prisma.favorite.findUnique({
            where: {
              userId_listingId: {
                userId,
                listingId,
              },
            },
          });

          if (!favorite) {
            return reply.code(404).send({
              success: false,
              error: "Saved listing not found",
              status: 404,
              data: null,
            });
            return;
          }

          // Delete favorite
          await prisma.favorite.delete({
            where: {
              userId_listingId: {
                userId,
                listingId,
              },
            },
          });

          return reply.send({
            success: true,
            data: null,
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
            data: null,
          });
        }
      },
    ),
  );

  // Add save listing
  fastify.post<{ Body: { userId: string; listingId: string } }>(
    "/save",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          console.log(req.body);
          const userId = (req.body as { userId: string }).userId;
          const listingId = (req.body as { listingId: string }).listingId;
          const listing = await prisma.listing.findUnique({
            where: { id: listingId },
          });
          if (!listing) {
            return reply.code(404).send({
              success: false,
              error: "Listing not found",
              status: 404,
              data: null,
            });
            return;
          }
          const oldFavorite = await prisma.favorite.findFirst({
            where: {
              userId,
              listingId: listing.id,
            },
          });

          if (oldFavorite !== null) {
            return reply.code(400).send({
              success: false,
              error: "Listing already saved",
              status: 400,
              data: null,
            });
          }
          await prisma.favorite.create({
            data: {
              userId,
              listingId: listing.id,
            },
          });
          return reply.send({
            success: true,
            status: 200,
          });
        } catch (error) {
          console.error("Error creating listing:", error);
          // Log more details about the error
          if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);

            // Log request body for debugging
            console.error("Request body:", JSON.stringify(req.body, null, 2));

            // Log parsed details if available
            try {
              const reqBody = req.body as { details?: any };
              if (reqBody?.details) {
                console.error(
                  "Details:",
                  typeof reqBody.details === "string"
                    ? JSON.parse(reqBody.details)
                    : reqBody.details,
                );
              }
            } catch (detailsError) {
              console.error("Error logging details:", detailsError);
            }
          }
          return reply.code(500).send({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to create listing",
            status: 500,
            data: null,
          });
        }
      },
    ),
  );

  // Note: You'll need to adapt upload.array and processImagesMiddleware to work with Fastify
  // This might require using @fastify/multipart plugin
  fastify.post(
    "/",
    {
      onRequest: authenticate,
      preHandler: processImagesMiddleware,
    },
    async (request, reply) => {
      try {
        const user = request.user;
        if (!user) {
          return reply.code(401).send({
            success: false,
            error: "Unauthorized: User not found",
            status: 401,
            data: null,
          });
          return;
        }

        // Log request body and files for debugging
        // console.log("Request body:", request.body);
        // console.log("Processed images:", request.processedImages);
        // console.log("User:", user);

        const body = request.body as any;
        if (!body) {
          return reply.code(400).send({
            success: false,
            error: "Missing request body",
            status: 400,
            data: null,
          });
          return;
        }

        const {
          title,
          description,
          price,
          mainCategory,
          subCategory,
          location = "",
          latitude = 0, // Default to 0 if not provided
          longitude = 0, // Default to 0 if not provided
          listingAction,
          details,
        } = body;

        // Validate required fields
        const missingFields: string[] = [];
        if (!title) missingFields.push("title");
        if (!description) missingFields.push("description");
        if (!price) missingFields.push("price");
        if (!location) missingFields.push("location");
        if (!mainCategory) missingFields.push("mainCategory");
        if (!subCategory) missingFields.push("subCategory");

        if (missingFields.length > 0) {
          return reply.code(400).send({
            success: false,
            error: `Missing required fields: ${missingFields.join(", ")}`,
            status: 400,
            data: null,
          });
          return;
        }

        // Parse and validate details
        let parsedDetails;
        try {
          parsedDetails =
            typeof details === "string" ? JSON.parse(details) : details;
          console.log("Details sent to DB:", parsedDetails);
        } catch (error) {
          console.error("Error parsing/validating details:", error);
          return reply.code(400).send({
            success: false,
            error: "Invalid details format",
            status: 400,
            data: null,
          });
          return;
        }

        // Get processed image URLs
        const imageUrls = request.processedImages?.map((img) => img.url) || [];
        console.log("Processed image URLs:", imageUrls);

        const listing = await prisma.listing.create({
          data: {
            title,
            description,
            price: Number(price),
            location,
            latitude: Number(latitude) || 0, // Ensure it's a number, default to 0
            longitude: Number(longitude) || 0, // Ensure it's a number, default to 0
            category: mainCategory, // For backwards compatibility
            mainCategory,
            subCategory,
            images: {
              create: imageUrls.map((url, index) => ({
                url,
                order: index,
              })),
            },
            userId: user.id,
            listingAction,
            vehicleDetails: await (async () => {
              if (!parsedDetails.vehicles) return undefined;
              
              const vehicleType = parsedDetails.vehicles.vehicleType as VehicleType;
              
              // Use our clean validator factory
              const validationResult = VehicleValidatorFactory.validate(vehicleType, parsedDetails.vehicles);
              
              if (validationResult.errors.length > 0) {
                throw new Error(`Vehicle validation failed: ${validationResult.errors.join(', ')}`);
              }

              // Use the mapped data from the validator
              const mappedVehicleData = validationResult.mappedData;
              if (!mappedVehicleData) return undefined;

              // Create base vehicle details with type conversion for Prisma compatibility
              const vehicleDetails: any = {
                vehicleType: mappedVehicleData.vehicleType as any,
                make: mappedVehicleData.make || undefined,
                model: mappedVehicleData.model || undefined,
                year: mappedVehicleData.year || undefined,
                mileage: mappedVehicleData.mileage || null,
                fuelType: mappedVehicleData.fuelType as any || null,
                transmissionType: mappedVehicleData.transmissionType as any || null,
                color: mappedVehicleData.color || null,
                condition: mappedVehicleData.condition as any || null,
                engine: (mappedVehicleData as any).engine || null,
                warranty: (mappedVehicleData as any).warranty || null,
                serviceHistory: (mappedVehicleData as any).serviceHistory || null,
                previousOwners: (mappedVehicleData as any).previousOwners || null,
                registrationStatus: (mappedVehicleData as any).registrationStatus || null,
              };

              // Add type-specific fields based on validator results
              if ('interiorColor' in mappedVehicleData) {
                vehicleDetails.interiorColor = (mappedVehicleData as any).interiorColor || null;
              }
              if ('doors' in mappedVehicleData) {
                vehicleDetails.doors = (mappedVehicleData as any).doors || null;
              }
              if ('seats' in mappedVehicleData) {
                vehicleDetails.seats = (mappedVehicleData as any).seats || null;
              }
              if ('engineCapacity' in mappedVehicleData) {
                vehicleDetails.engineCapacity = (mappedVehicleData as any).engineCapacity || null;
              }
              if ('payloadCapacity' in mappedVehicleData) {
                vehicleDetails.payloadCapacity = (mappedVehicleData as any).payloadCapacity || null;
              }

              return { create: vehicleDetails };
            })(),
            realEstateDetails: await (async () => {
              if (!parsedDetails.realEstate) return undefined;
              
              const propertyType = parsedDetails.realEstate.propertyType as PropertyType;
              
              // Use our clean real estate validator factory
              const validationResult = RealEstateValidatorFactory.validate(propertyType, parsedDetails.realEstate);
              
              if (validationResult.errors.length > 0) {
                throw new Error(`Real estate validation failed: ${validationResult.errors.join(', ')}`);
              }

              // Use the mapped data from the validator
              const mappedRealEstateData = validationResult.mappedData;
              if (!mappedRealEstateData) return undefined;

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

              return { create: realEstateDetails };
            })(),
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
            favorites: true,

            realEstateDetails: true,
          },
        });

        console.log("✅ Created listing:", listing);

        return reply.code(201).send({
          success: true,
          data: formatListingResponse(listing),
          status: 201,
        });
      } catch (error) {
        console.error("Error creating listing:", error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);

          // Log request body for debugging
          console.error("Request body:", JSON.stringify(request.body, null, 2));

          // Log parsed details if available
          try {
            const reqBody = request.body as { details?: any };
            if (reqBody?.details) {
              console.error(
                "Details:",
                typeof reqBody.details === "string"
                  ? JSON.parse(reqBody.details)
                  : reqBody.details,
              );
            }
          } catch (detailsError) {
            console.error("Error logging details:", detailsError);
          }
        }
        return reply.code(500).send({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to create listing",
          status: 500,
          data: null,
        });
      }
    },
  );

  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    "/user",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const { page = 1, limit = 12 } = req.query as {
            page?: string | number;
            limit?: string | number;
          };
          const skip = (Number(page) - 1) * Number(limit);

          const userId = validateUser(req);

          const listings = await prisma.listing.findMany({
            where: {
              userId,
            },
            include: {
              user: true,
              images: true,
              favorites: true,
            },
            skip,
            take: Number(limit),
            orderBy: {
              createdAt: "desc",
            },
          });

          const total = await prisma.listing.count({
            where: {
              userId,
            },
          });

          return reply.send({
            success: true,
            data: {
              listings: listings.map((listing) =>
                formatListingResponse(listing),
              ),
              total,
              page: Number(page),
              limit: Number(limit),
              hasMore: total > Number(page) * Number(limit),
            },
            status: 200,
          });
        } catch (error) {
          console.error("Error fetching user listings:", error);
          return reply.code(500).send({
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "An error occurred while fetching user listings",
            },
          });
        }
      },
    ),
  );

  fastify.get(
    "/favorites",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const userId = validateUser(req);
          const favorites = await prisma.favorite.findMany({
            where: {
              userId,
            },
            include: {
              listing: {
                include: {
                  images: true,
                  user: true,
                  favorites: true,
                },
              },
            },
          });

          const data = {
            favorites: favorites.map((fav) => ({
              ...formatListingResponse(fav.listing),
              favorite: true,
            })),
          };

          return reply.send({
            success: true,
            data: data,
            status: 200,
          });
        } catch (error) {
          console.error("Error fetching favorite listings:", error);
          return reply.code(500).send({
            success: false,
            error: {
              code: "SERVER_ERROR",
              message: "An error occurred while fetching favorite listings",
            },
          });
        }
      },
    ),
  );

  // This route has been moved above the authentication middleware to make it public

  // Note: You'll need to adapt upload.array and processImagesMiddleware to work with Fastify
  // This might require using @fastify/multipart plugin
  fastify.put<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: authenticate,
      preHandler: processImagesMiddleware,
    },
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const {
            title,
            description,
            price,
            mainCategory,
            subCategory,
            location = "",
            features = [],
            details,
            listingAction,
            existingImages = [],
          } = req.body as {
            title: string;
            description: string;
            price: string | number;
            mainCategory: string;
            subCategory: string;
            location?: string;
            features?: any[];
            details: any;
            listingAction: string;
            existingImages?: any[];
          };

          console.log("🔍 [DEBUG] Details before processing:", details);

          // Handle details whether it's already parsed or still a string
          const objDetails =
            typeof details === "string" ? JSON.parse(details) : details;

          console.log("🔍 [DEBUG] Processed details:", objDetails);

          // Process vehicle details with validation
          let vehicleDetails = objDetails?.vehicles;

          // Ensure seatingCapacity is a valid number and not negative
          if (vehicleDetails) {
            vehicleDetails = {
              ...vehicleDetails,
              seatingCapacity: Math.max(
                0,
                Number(vehicleDetails.seatingCapacity || 0),
              ),
            };
          }

          const realEstateDetails = objDetails?.realEstate;

          console.log("🔍 [DEBUG] Extracted details:", {
            vehicleDetails,
            realEstateDetails,
          });

          // Get current images from the database first
          const currentImages = await prisma.image.findMany({
            where: { listingId: (req.params as { id: string }).id },
            select: { url: true },
          });

          // Parse and validate existing images
          let parsedExistingImages: string[] = [];
          if (existingImages) {
            try {
              parsedExistingImages =
                typeof existingImages === "string"
                  ? JSON.parse(existingImages)
                  : Array.isArray(existingImages)
                    ? existingImages
                    : [];

              // Ensure we only keep valid image URLs that exist in the database
              const validImageUrls = currentImages.map((img) => img.url);
              parsedExistingImages = parsedExistingImages.filter((url) =>
                validImageUrls.includes(url),
              );

              console.log(
                "🔍 [DEBUG] Valid existing images:",
                parsedExistingImages,
              );
            } catch (error) {
              console.error("🔍 [DEBUG] Error parsing existing images:", error);
              // If there's an error, keep all existing images
              parsedExistingImages = currentImages.map((img) => img.url);
            }
          } else {
            // If no existing images provided, keep all current images
            parsedExistingImages = currentImages.map((img) => img.url);
          }

          // Process new images
          const newImages = req.processedImages || [];
          console.log("🔍 [DEBUG] New images to add:", newImages);

          // Only delete images that are not in the parsedExistingImages
          const imagesToDelete = currentImages
            .filter((img) => !parsedExistingImages.includes(img.url))
            .map((img) => img.url);

          if (imagesToDelete.length > 0) {
            console.log("🔍 [DEBUG] Deleting removed images:", imagesToDelete);
            await prisma.image.deleteMany({
              where: {
                listingId: (req.params as { id: string }).id,
                url: { in: imagesToDelete },
              },
            });
          }

          // Update the listing
          const listing = await prisma.listing.update({
            where: { id: (req.params as { id: string }).id },
            data: {
              title,
              description,
              price: parseFloat(price.toString()),
              mainCategory,
              subCategory,
              location,
              listingAction,
              images:
                newImages.length > 0
                  ? {
                      create: newImages.map((image: any, index: number) => ({
                        url: image.url,
                        order: parsedExistingImages.length + index,
                      })),
                    }
                  : undefined,
              features: features
                ? {
                    deleteMany: {},
                    create: features.map((feature: string) => ({
                      name: feature,
                      value: true,
                    })),
                  }
                : undefined,

              realEstateDetails: realEstateDetails
                ? {
                    update: filterListingDetails(
                      realEstateDetails,
                      realEstateDetails.propertyType,
                    ) as RealEstateDetails,
                  }
                : undefined,

              vehicleDetails: vehicleDetails
                ? {
                    update: filterListingDetails(
                      vehicleDetails,
                      vehicleDetails.vehicleType,
                    ) as VehicleDetails,
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

              realEstateDetails: true,
            },
          });

          return reply.send({
            success: true,
            data: formatListingResponse(
              listing as unknown as ListingWithRelations,
            ),
            status: 200,
          });
        } catch (error) {
          console.error("Database error:", error);
          return reply.code(500).send({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to update listing",
            status: 500,
            data: null,
          });
        }
      },
    ),
  );

  fastify.put<{ Params: { id: string } }>(
    "/views/:id",
    { onRequest: authenticate },
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const listingId = (req.query as { id: string }).id;
          if (!listingId) {
            return reply.code(400).send({
              success: false,
              error: "Listing ID is required",
              status: 400,
              data: null,
            });
          }
          const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { views: true, viewUsersId: true },
          });

          if (!listing) {
            return reply.code(404).send({
              success: false,
              error: "Listing not found",
              status: 404,
              data: null,
            });
          }

          if (listing.viewUsersId.includes(req.user.id)) {
            return reply.code(400).send({
              success: false,
              error: "You have already viewed this listing",
              status: 400,
              data: {
                message: "You have already viewed this listing",
                view: listing.views,
              },
            });
          }

          listing.views += 1;
          listing.viewUsersId.push(req.user.id);

          const updateListing = await prisma.listing.update({
            where: { id: listingId },
            data: {
              views: listing.views,
              viewUsersId: listing.viewUsersId,
            },
          });

          if (!updateListing) {
            return reply.code(500).send({
              success: false,
              error: "Failed to update listing views",
              status: 500,
              data: null,
            });
          }

          return reply.send({
            success: true,
            data: {
              message: "Listing views updated successfully",
              view: listing.views,
            },
            status: 200,
          });
        } catch (error) {
          console.error("error:", error);
          return reply.code(500).send({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to update listing views",
            status: 500,
            data: null,
          });
        }
      },
    ),
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    handleAuthRoute(
      async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
        try {
          const userId = validateUser(req);

          // Find listing
          const listing = await prisma.listing.findUnique({
            where: { id: (req.params as { id: string }).id },
            include: {
              images: true,
              favorites: true,
              realEstateDetails: true,
              vehicleDetails: true,
            },
          });

          // Check if listing exists and belongs to user
          if (!listing) {
            return reply.code(404).send({
              success: false,
              error: "Listing not found",
              status: 404,
              data: null,
            });
            return;
          }

          if (listing.userId !== userId) {
            return reply.code(403).send({
              success: false,
              error: "Not authorized to delete this listing",
              status: 403,
              data: null,
            });
            return;
          }

          // Delete in a transaction to ensure atomicity
          await prisma.$transaction(async (tx) => {
            // Delete vehicle details if they exist
            if (listing.vehicleDetails) {
              await tx.vehicleDetails.delete({
                where: { listingId: listing.id },
              });
            }

            // Delete real estate details if they exist
            if (listing.realEstateDetails) {
              await tx.realEstateDetails.delete({
                where: { listingId: listing.id },
              });
            }

            // Delete favorites
            await tx.favorite.deleteMany({
              where: { listingId: listing.id },
            });

            // Delete images
            await tx.image.deleteMany({
              where: { listingId: listing.id },
            });

            // Delete the listing itself
            await tx.listing.delete({
              where: { id: listing.id },
            });
          });

          return reply.send({
            success: true,
            data: null,
            status: 200,
          });
        } catch (error) {
          console.error("Error deleting listing:", error);
          return reply.code(500).send({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete listing",
            status: 500,
            data: null,
          });
        }
      },
    ),
  );
}
