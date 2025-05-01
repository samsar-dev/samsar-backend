import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { Prisma } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";
import { processImagesMiddleware } from "../middleware/upload.middleware.js";
import prisma from "../src/lib/prismaClient.js";
import { AuthRequest, MultipartAuthRequest } from "../types/auth.js";
import { ListingDetails, ListingWithRelations } from "../types/shared.js";
interface ListingQuery {
  mainCategory?: string;
  subCategory?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
  limit?: string;
  location?: string;
  builtYear?: string;
  preview?: string;
  publicAccess?: string;
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
    vehicles: listing.vehicleDetails ? listing.vehicleDetails : undefined,
    realEstate: listing.realEstateDetails
      ? listing.realEstateDetails
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
    details: details,
    listingAction: listing.listingAction,
    status: listing.status,
    seller: listing.user
      ? {
          id: listing.user.id,
          username: listing.user.username,
          profilePicture: listing.user.profilePicture,
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
      await handler(authReq, reply);
    } catch (error) {
      console.error("Auth route error:", error);
      reply.code(500).send({
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
        location,
        builtYear,
        preview = "false",
      } = req.query as ListingQuery;

      // Build where clause for filtering
      const where: Prisma.ListingWhereInput = {};
      if (mainCategory) {
        where.mainCategory = mainCategory as string;
      }
      if (subCategory) {
        where.subCategory = subCategory as string;
      }
      if (location) {
        where.location = location as string;
      }
      // Real estate built year filter (nested)
      if (builtYear) {
        where.realEstateDetails = {
          is: {
            ...(where.realEstateDetails?.is || {}),
            yearBuilt: builtYear.toString(),
          },
        };
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Get total count for pagination
      const total = await prisma.listing.count({ where });

      // Determine if we should fetch full data or just preview data
      const isPreview = preview === "true";

      // Get listings with pagination, sorting, and filtering
      const listings = await prisma.listing.findMany({
        where,
        take: Number(limit),
        skip,
        orderBy: buildOrderBy(sortBy as string, sortOrder as string),
        include: isPreview
          ? {
              // Preview mode - fetch minimal data
              images: {
                take: 1, // Only get the first image
                select: {
                  url: true,
                  id: true,
                },
              },
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
              _count: {
                select: {
                  favorites: true,
                },
              },
              vehicleDetails: {
                select: {
                  make: true,
                  model: true,
                  year: true,
                  mileage: true,
                  transmissionType: true,
                  fuelType: true,
                },
              },
              realEstateDetails: {
                select: {
                  size: true,
                  bedrooms: true,
                  bathrooms: true,
                },
              },
            }
          : {
              // Full data mode
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

      // Format listings for response
      const formattedListings = isPreview
        ? listings.map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            price: listing.price,
            category: {
              mainCategory: listing.mainCategory,
              subCategory: listing.subCategory,
            },
            location: listing.location,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt,
            image: listing.images?.[0]?.url || null,
            user: {
              id: listing.user.id,
              username: listing.user.username,
            },
            favoritesCount: listing._count?.favorites || 0,
            details: {
              vehicles: listing.vehicleDetails
                ? {
                    make: listing.vehicleDetails.make,
                    model: listing.vehicleDetails.model,
                    year: listing.vehicleDetails.year,
                    mileage: listing.vehicleDetails.mileage,
                    transmissionType: listing.vehicleDetails.transmissionType,
                    fuelType: listing.vehicleDetails.fuelType,
                  }
                : undefined,
              realEstate: listing.realEstateDetails
                ? {
                    size: listing.realEstateDetails.size,
                    bedrooms: listing.realEstateDetails.bedrooms,
                    bathrooms: listing.realEstateDetails.bathrooms,
                  }
                : undefined,
            },
          }))
        : listings.map((listing) => formatListingResponse(listing));

      reply.send({
        success: true,
        data: {
          items: formattedListings,
          total,
          page: Number(page),
          limit: Number(limit),
          hasMore: total > Number(page) * Number(limit),
        },
        status: 200,
      });
    } catch (error) {
      console.error("Error fetching listings:", error);
      reply.code(500).send({
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

        reply.send({
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
        reply.code(500).send({
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

      reply.send({
        success: true,
        data: { items: trendingListings },
        status: 200,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      reply.code(500).send({
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
          reply.code(404).send({
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

        reply.send({
          success: true,
          data: formattedListing,
          status: 200,
        });
      } catch (error) {
        console.error("Error fetching listing:", error);
        reply.code(500).send({
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

          reply.send({
            success: true,
            data: { items: formattedListings },
            status: 200,
          });
        } catch (error) {
          reply.code(500).send({
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
            reply.code(404).send({
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
            reply.code(400).send({
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

          reply.send({
            success: true,
            data: formatListingResponse(favorite.listing),
            status: 200,
          });
        } catch (error) {
          reply.code(500).send({
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
            reply.code(404).send({
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

          reply.send({
            success: true,
            data: null,
            status: 200,
          });
        } catch (error) {
          reply.code(500).send({
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
            reply.code(404).send({
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
            reply.code(400).send({
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
          reply.send({
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
          reply.code(500).send({
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
          reply.code(401).send({
            success: false,
            error: "Unauthorized: User not found",
            status: 401,
            data: null,
          });
          return;
        }

        // Log request body and files for debugging
        console.log("Request body:", request.body);
        console.log("Processed images:", request.processedImages);
        console.log("User:", user);

        const body = request.body as any;
        if (!body) {
          reply.code(400).send({
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
          reply.code(400).send({
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
          console.log("Details sent to DB:", JSON.stringify(parsedDetails));
        } catch (error) {
          console.error("Error parsing/validating details:", error);
          reply.code(400).send({
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

        // Create listing with images
        console.log(
          "Details sent to DB:",
          JSON.stringify(parsedDetails, null, 2),
        );

        const listing = await prisma.listing.create({
          data: {
            title,
            description,
            price: Number(price),
            location,
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
            vehicleDetails: parsedDetails.vehicles
              ? {
                  create: {
                    vehicleType: parsedDetails.vehicles.vehicleType,
                    make: parsedDetails.vehicles.make,
                    model: parsedDetails.vehicles.model,
                    year:
                      parsedDetails.vehicles.year || new Date().getFullYear(),
                    mileage: parsedDetails.vehicles.mileage
                      ? Number(parsedDetails.vehicles.mileage)
                      : 0,
                    fuelType: parsedDetails.vehicles.fuelType,
                    transmissionType: parsedDetails.vehicles.transmissionType,
                    color: parsedDetails.vehicles.color || "#000000",
                    condition: parsedDetails.vehicles.condition,
                    features: parsedDetails.vehicles.features || [],
                    interiorColor:
                      parsedDetails.vehicles.interiorColor || "#000000",
                    engine: parsedDetails.vehicles.engine || "",
                    warranty: parsedDetails.vehicles.warranty || "",
                    serviceHistory:
                      parsedDetails.vehicles.serviceHistory || null,
                    previousOwners:
                      parsedDetails.vehicles.previousOwners !== undefined
                        ? Number(parsedDetails.vehicles.previousOwners)
                        : undefined,
                    registrationStatus:
                      parsedDetails.vehicles.registrationStatus || undefined,
                    horsepower: parsedDetails.vehicles.horsepower,
                    torque: parsedDetails.vehicles.torque,
                    engineType: parsedDetails.vehicles.engineType,
                    engineSize: parsedDetails.vehicles.engineSize,
                    enginePowerOutput: parsedDetails.vehicles.enginePowerOutput,
                    driveType: parsedDetails.vehicles.driveType,
                    bodyStyle: parsedDetails.vehicles.bodyStyle,
                    safetyFeatures: parsedDetails.vehicles.safetyFeatures || [],
                    comfortFeatures:
                      parsedDetails.vehicles.comfortFeatures || [],
                    entertainmentSystem:
                      parsedDetails.vehicles.entertainmentSystem || [],
                    exteriorFeatures:
                      parsedDetails.vehicles.exteriorFeatures || [],
                    performanceFeatures:
                      parsedDetails.vehicles.performanceFeatures || [],
                    modifications: parsedDetails.vehicles.modifications || [],
                    customFeatures: parsedDetails.vehicles.customFeatures || [],
                    emissionStandard: parsedDetails.vehicles.emissionStandard,
                    enginePower: parsedDetails.vehicles.enginePower,
                    engineTorque: parsedDetails.vehicles.engineTorque,
                    trunkCapacity: parsedDetails.vehicles.trunkCapacity,
                    airbags: parsedDetails.vehicles.airbags,
                    brakeType: parsedDetails.vehicles.brakeType,
                    fuelTankCapacity: parsedDetails.vehicles.fuelTankCapacity,
                    roofType: parsedDetails.vehicles.roofType,
                    suspensionType: parsedDetails.vehicles.suspensionType,
                    steeringType: parsedDetails.vehicles.steeringType,
                    parkingAssist: parsedDetails.vehicles.parkingAssist || [],
                    motorcycleType: parsedDetails.vehicles.motorcycleType,
                    engineConfiguration:
                      parsedDetails.vehicles.engineConfiguration,
                    ridingStyle: parsedDetails.vehicles.ridingStyle,
                    brakeSystem: parsedDetails.vehicles.brakeSystem || [],
                    frameType: parsedDetails.vehicles.frameType,
                    wheelSize: parsedDetails.vehicles.wheelSize,
                    tireType: parsedDetails.vehicles.tireType,
                    startingSystem: parsedDetails.vehicles.startingSystem,
                    instrumentCluster:
                      parsedDetails.vehicles.instrumentCluster || [],
                    lightingSystem: parsedDetails.vehicles.lightingSystem || [],
                    hours: parsedDetails.vehicles.hours,
                    driveSystem: parsedDetails.vehicles.driveSystem,
                    engineSpecs: parsedDetails.vehicles.engineSpecs || [],
                    engineManufacturer:
                      parsedDetails.vehicles.engineManufacturer,
                    engineModel: parsedDetails.vehicles.engineModel,
                    displacement: parsedDetails.vehicles.displacement,
                    cylinders: parsedDetails.vehicles.cylinders,
                    emissions: parsedDetails.vehicles.emissions,
                    hydraulicFlow: parsedDetails.vehicles.hydraulicFlow,
                    ptoSystem: parsedDetails.vehicles.ptoSystem || [],
                    ptoHorsepower: parsedDetails.vehicles.ptoHorsepower,
                    frontAttachments:
                      parsedDetails.vehicles.frontAttachments || [],
                    rearAttachments:
                      parsedDetails.vehicles.rearAttachments || [],
                    threePointHitch: parsedDetails.vehicles.threePointHitch,
                    hitchCapacity: parsedDetails.vehicles.hitchCapacity,
                    cabFeatures: parsedDetails.vehicles.cabFeatures || [],
                    seating: parsedDetails.vehicles.seating || [],
                    steeringSystem: parsedDetails.vehicles.steeringSystem || [],
                    lighting: parsedDetails.vehicles.lighting || [],
                    precisionFarming:
                      parsedDetails.vehicles.precisionFarming || [],
                    vanType: parsedDetails.vehicles.vanType,
                    cargoVolume: parsedDetails.vehicles.cargoVolume,
                    roofHeight: parsedDetails.vehicles.roofHeight,
                    loadingFeatures:
                      parsedDetails.vehicles.loadingFeatures || [],
                    truckType: parsedDetails.vehicles.truckType,
                    cabType: parsedDetails.vehicles.cabType,
                    bedLength: parsedDetails.vehicles.bedLength,
                    payload: parsedDetails.vehicles.payload,
                    equipmentType: parsedDetails.vehicles.equipmentType,
                    operatingWeight: parsedDetails.vehicles.operatingWeight,
                    maxLiftingCapacity:
                      parsedDetails.vehicles.maxLiftingCapacity,
                    hydraulicSystem: parsedDetails.vehicles.hydraulicSystem,
                    operatorCabType: parsedDetails.vehicles.operatorCabType,
                    gps: parsedDetails.vehicles.gps,
                    ptoType: parsedDetails.vehicles.ptoType,
                    hydraulicOutlets: parsedDetails.vehicles.hydraulicOutlets,
                    busType: parsedDetails.vehicles.busType,
                    seatingCapacity: parsedDetails.vehicles.seatingCapacity,
                    luggageSpace: parsedDetails.vehicles.luggageSpace,
                    wheelchairAccessible:
                      parsedDetails.vehicles.wheelchairAccessible,
                    wheelchairLift: parsedDetails.vehicles.wheelchairLift,
                    accessibilityFeatures:
                      parsedDetails.vehicles.accessibilityFeatures || [],
                    emergencyExits: parsedDetails.vehicles.emergencyExits,
                    luggageCompartments:
                      parsedDetails.vehicles.luggageCompartments,
                    luggageRacks: parsedDetails.vehicles.luggageRacks,
                    warrantyPeriod: parsedDetails.vehicles.warrantyPeriod,
                    serviceHistoryDetails:
                      parsedDetails.vehicles.serviceHistoryDetails,
                    customsCleared: parsedDetails.vehicles.customsCleared,
                    communicationSystem:
                      parsedDetails.vehicles.communicationSystem || [],
                    lastInspectionDate:
                      parsedDetails.vehicles.lastInspectionDate,
                    certifications: parsedDetails.vehicles.certifications || [],
                    monitor: parsedDetails.vehicles.monitor || [],
                    electricalSystem: parsedDetails.vehicles.electricalSystem,
                    maintenanceHistory:
                      parsedDetails.vehicles.maintenanceHistory,
                    blindSpotMonitor: parsedDetails.vehicles.blindSpotMonitor,
                    laneAssist: parsedDetails.vehicles.laneAssist,
                    adaptiveCruiseControl:
                      parsedDetails.vehicles.adaptiveCruiseControl,
                    tractionControl: parsedDetails.vehicles.tractionControl,
                    abs: parsedDetails.vehicles.abs,
                    emergencyBrakeAssist:
                      parsedDetails.vehicles.emergencyBrakeAssist,
                    tirePressureMonitoring:
                      parsedDetails.vehicles.tirePressureMonitoring,
                    distanceTempomat: parsedDetails.vehicles.distanceTempomat,
                    distanceWarning: parsedDetails.vehicles.distanceWarning,
                    passengerAirbag: parsedDetails.vehicles.passengerAirbag,
                    glarelessHighBeam: parsedDetails.vehicles.glarelessHighBeam,
                    esp: parsedDetails.vehicles.esp,
                    driverAirbag: parsedDetails.vehicles.driverAirbag,
                    highBeamAssistant: parsedDetails.vehicles.highBeamAssistant,
                    speedLimitingSystem:
                      parsedDetails.vehicles.speedLimitingSystem,
                    isofix: parsedDetails.vehicles.isofix,
                    fatigueWarningSystem:
                      parsedDetails.vehicles.fatigueWarningSystem,
                    emergencyCallSystem:
                      parsedDetails.vehicles.emergencyCallSystem,
                    sideAirbag: parsedDetails.vehicles.sideAirbag,
                    trackHoldingAssistant:
                      parsedDetails.vehicles.trackHoldingAssistant,
                    deadAngleAssistant:
                      parsedDetails.vehicles.deadAngleAssistant,
                    trafficSignRecognition:
                      parsedDetails.vehicles.trafficSignRecognition,
                    burglarAlarmSystem:
                      parsedDetails.vehicles.burglarAlarmSystem,
                    immobilizer: parsedDetails.vehicles.immobilizer,
                    centralLocking: parsedDetails.vehicles.centralLocking,
                    rearCamera: parsedDetails.vehicles.rearCamera,
                    camera360: parsedDetails.vehicles.camera360,
                    dashCam: parsedDetails.vehicles.dashCam,
                    nightVision: parsedDetails.vehicles.nightVision,
                    parkingSensors: parsedDetails.vehicles.parkingSensors,
                    parkingAid: parsedDetails.vehicles.parkingAid,
                    parkingAidCamera: parsedDetails.vehicles.parkingAidCamera,
                    parkingAidSensorsRear:
                      parsedDetails.vehicles.parkingAidSensorsRear,
                    parkingAidSensorsFront:
                      parsedDetails.vehicles.parkingAidSensorsFront,
                    climateControl: parsedDetails.vehicles.climateControl,
                    heatedSeats: parsedDetails.vehicles.heatedSeats,
                    ventilatedSeats: parsedDetails.vehicles.ventilatedSeats,
                    dualZoneClimate: parsedDetails.vehicles.dualZoneClimate,
                    rearAC: parsedDetails.vehicles.rearAC,
                    airQualitySensor: parsedDetails.vehicles.airQualitySensor,
                    airConditioning: parsedDetails.vehicles.airConditioning,
                    twoZoneClimateControl:
                      parsedDetails.vehicles.twoZoneClimateControl,
                    bluetooth: parsedDetails.vehicles.bluetooth,
                    appleCarPlay: parsedDetails.vehicles.appleCarPlay,
                    androidAuto: parsedDetails.vehicles.androidAuto,
                    premiumSound: parsedDetails.vehicles.premiumSound,
                    wirelessCharging: parsedDetails.vehicles.wirelessCharging,
                    usbPorts: parsedDetails.vehicles.usbPorts,
                    cdPlayer: parsedDetails.vehicles.cdPlayer,
                    dvdPlayer: parsedDetails.vehicles.dvdPlayer,
                    rearSeatEntertainment:
                      parsedDetails.vehicles.rearSeatEntertainment,
                    androidCar: parsedDetails.vehicles.androidCar,
                    onBoardComputer: parsedDetails.vehicles.onBoardComputer,
                    dabRadio: parsedDetails.vehicles.dabRadio,
                    handsFreeCalling: parsedDetails.vehicles.handsFreeCalling,
                    integratedMusicStreaming:
                      parsedDetails.vehicles.integratedMusicStreaming,
                    radio: parsedDetails.vehicles.radio,
                    soundSystem: parsedDetails.vehicles.soundSystem,
                    wifiHotspot: parsedDetails.vehicles.wifiHotspot,
                    ledHeadlights: parsedDetails.vehicles.ledHeadlights,
                    adaptiveHeadlights:
                      parsedDetails.vehicles.adaptiveHeadlights,
                    ambientLighting: parsedDetails.vehicles.ambientLighting,
                    fogLights: parsedDetails.vehicles.fogLights,
                    automaticHighBeams:
                      parsedDetails.vehicles.automaticHighBeams,
                    ledDaytimeRunningLights:
                      parsedDetails.vehicles.ledDaytimeRunningLights,
                    daytimeRunningLights:
                      parsedDetails.vehicles.daytimeRunningLights,
                    headlightCleaning: parsedDetails.vehicles.headlightCleaning,
                    lightSensor: parsedDetails.vehicles.lightSensor,
                    keylessEntry: parsedDetails.vehicles.keylessEntry,
                    sunroof: parsedDetails.vehicles.sunroof,
                    spareKey: parsedDetails.vehicles.spareKey,
                    remoteStart: parsedDetails.vehicles.remoteStart,
                    powerTailgate: parsedDetails.vehicles.powerTailgate,
                    autoDimmingMirrors:
                      parsedDetails.vehicles.autoDimmingMirrors,
                    rainSensingWipers: parsedDetails.vehicles.rainSensingWipers,
                    mountainDrivingAssistant:
                      parsedDetails.vehicles.mountainDrivingAssistant,
                    electricalWindowLifter:
                      parsedDetails.vehicles.electricalWindowLifter,
                    electricalSideMirrors:
                      parsedDetails.vehicles.electricalSideMirrors,
                    electricSeats: parsedDetails.vehicles.electricSeats,
                    headUpDisplay: parsedDetails.vehicles.headUpDisplay,
                    leatherSteeringWheel:
                      parsedDetails.vehicles.leatherSteeringWheel,
                    lumbarSupport: parsedDetails.vehicles.lumbarSupport,
                    multifunctionalSteeringWheel:
                      parsedDetails.vehicles.multifunctionalSteeringWheel,
                    navigationSystem: parsedDetails.vehicles.navigationSystem,
                    rainSensor: parsedDetails.vehicles.rainSensor,
                    automaticStartStop:
                      parsedDetails.vehicles.automaticStartStop,
                    automaticDazzlingInteriorMirrors:
                      parsedDetails.vehicles.automaticDazzlingInteriorMirrors,
                    switchingRockers: parsedDetails.vehicles.switchingRockers,
                    armrest: parsedDetails.vehicles.armrest,
                    voiceControl: parsedDetails.vehicles.voiceControl,
                    touchscreen: parsedDetails.vehicles.touchscreen,
                    aluminumRims: parsedDetails.vehicles.aluminumRims,
                    luggageCompartmentSeparation:
                      parsedDetails.vehicles.luggageCompartmentSeparation,
                    summerTires: parsedDetails.vehicles.summerTires,
                    powerSteering: parsedDetails.vehicles.powerSteering,
                    wheelType: parsedDetails.vehicles.wheelType,
                    bodyType: parsedDetails.vehicles.bodyType,
                    insuranceType: parsedDetails.vehicles.insuranceType,
                    upholsteryMaterial:
                      parsedDetails.vehicles.upholsteryMaterial,
                    accidentFree: parsedDetails.vehicles.accidentFree,
                    importStatus: parsedDetails.vehicles.importStatus,
                    startType: parsedDetails.vehicles.startType,
                    frontSuspension:
                      parsedDetails.vehicles.frontSuspension || [],
                    rearSuspension: parsedDetails.vehicles.rearSuspension || [],
                    riderAids: parsedDetails.vehicles.riderAids || [],
                    electronics: parsedDetails.vehicles.electronics || [],
                    seatType: parsedDetails.vehicles.seatType,
                    seatMaterial: parsedDetails.vehicles.seatMaterial,
                    seatHeight: parsedDetails.vehicles.seatHeight,
                    handlebarType: parsedDetails.vehicles.handlebarType,
                    storageOptions: parsedDetails.vehicles.storageOptions || [],
                    seatBelts: parsedDetails.vehicles.seatBelts,
                    protectiveEquipment:
                      parsedDetails.vehicles.protectiveEquipment || [],
                    frontAirbags: parsedDetails.vehicles.frontAirbags,
                    sideAirbags: parsedDetails.vehicles.sideAirbags,
                    curtainAirbags: parsedDetails.vehicles.curtainAirbags,
                    kneeAirbags: parsedDetails.vehicles.kneeAirbags,
                    cruiseControl: parsedDetails.vehicles.cruiseControl,
                    laneDepartureWarning:
                      parsedDetails.vehicles.laneDepartureWarning,
                    laneKeepAssist: parsedDetails.vehicles.laneKeepAssist,
                    automaticEmergencyBraking:
                      parsedDetails.vehicles.automaticEmergencyBraking,
                    additionalNotes: parsedDetails.vehicles.additionalNotes,
                    gearbox: parsedDetails.vehicles.gearbox,
                    attachments: parsedDetails.vehicles.attachments || [],
                  },
                }
              : undefined,
            realEstateDetails: parsedDetails.realEstate
              ? {
                  create: {
                    propertyType:
                      parsedDetails.realEstate.propertyType || "HOUSE",
                    size: parsedDetails.realEstate.size?.toString() || null,
                    yearBuilt:
                      parsedDetails.realEstate.yearBuilt?.toString() || null,
                    bedrooms:
                      parsedDetails.realEstate.bedrooms?.toString() || null,
                    bathrooms:
                      parsedDetails.realEstate.bathrooms?.toString() || null,
                    condition:
                      parsedDetails.realEstate.condition?.toString() || null,
                    constructionType: parsedDetails.realEstate.constructionType,
                    features: parsedDetails.realEstate.features || [],
                    parking: parsedDetails.realEstate.parking,
                    floor: parsedDetails.realEstate.floor,
                    totalFloors: parsedDetails.realEstate.totalFloors,
                    elevator: parsedDetails.realEstate.elevator,
                    balcony: parsedDetails.realEstate.balcony,
                    storage: parsedDetails.realEstate.storage,
                    heating: parsedDetails.realEstate.heating,
                    cooling: parsedDetails.realEstate.cooling,
                    buildingAmenities:
                      parsedDetails.realEstate.buildingAmenities || [],
                    energyRating: parsedDetails.realEstate.energyRating,
                    furnished: parsedDetails.realEstate.furnished,
                    view: parsedDetails.realEstate.view,
                    securityFeatures:
                      parsedDetails.realEstate.securityFeatures || [],
                    fireSafety: parsedDetails.realEstate.fireSafety || [],
                    flooringType: parsedDetails.realEstate.flooringType,
                    internetIncluded: parsedDetails.realEstate.internetIncluded,
                    windowType: parsedDetails.realEstate.windowType,
                    accessibilityFeatures:
                      parsedDetails.realEstate.accessibilityFeatures || [],
                    renovationHistory:
                      parsedDetails.realEstate.renovationHistory,
                    parkingType: parsedDetails.realEstate.parkingType,
                    utilities: parsedDetails.realEstate.utilities || [],
                    exposureDirection:
                      parsedDetails.realEstate.exposureDirection || [],
                    storageType: parsedDetails.realEstate.storageType || [],
                    halfBathrooms: parsedDetails.realEstate.halfBathrooms,
                    stories: parsedDetails.realEstate.stories,
                    basement: parsedDetails.realEstate.basement,
                    attic: parsedDetails.realEstate.attic,
                    flooringTypes: parsedDetails.realEstate.flooringTypes || [],
                    parcelNumber: parsedDetails.realEstate.parcelNumber,
                    topography: parsedDetails.realEstate.topography || [],
                    elevation: parsedDetails.realEstate.elevation,
                    waterFeatures: parsedDetails.realEstate.waterFeatures,
                    naturalFeatures: parsedDetails.realEstate.naturalFeatures,
                    buildable: parsedDetails.realEstate.buildable,
                    buildingRestrictions:
                      parsedDetails.realEstate.buildingRestrictions,
                    permitsInPlace: parsedDetails.realEstate.permitsInPlace,
                    environmentalFeatures:
                      parsedDetails.realEstate.environmentalFeatures,
                    soilTypes: parsedDetails.realEstate.soilTypes || [],
                    petPolicy: parsedDetails.realEstate.petPolicy,
                  },
                }
              : undefined,
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

        reply.code(201).send({
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
        reply.code(500).send({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to create listing",
          status: 500,
          data: null,
        });
      }
    },
  ),
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

            reply.send({
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
            reply.code(500).send({
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

          reply.send({
            success: true,
            data: {
              favorites: favorites.map((fav) => ({
                ...formatListingResponse(fav.listing),
                favorite: true,
              })),
            },
            status: 200,
          });
        } catch (error) {
          console.error("Error fetching favorite listings:", error);
          reply.code(500).send({
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
    {}, // Remove preHandler until middleware is adapted for Fastify
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

          const objDetails = JSON.parse(details);

          const vehicleDetails = objDetails.vehicles
            ? objDetails.vehicles
            : undefined;
          const realEstateDetails = objDetails.realEstate
            ? objDetails.realEstate
            : undefined;

          const newImages = req.processedImages || [];
          const parsedExistingImages =
            typeof existingImages === "string"
              ? JSON.parse(existingImages)
              : existingImages;

          // First, delete removed images
          await prisma.image.deleteMany({
            where: {
              listingId: (req.params as { id: string }).id,
              url: { notIn: parsedExistingImages },
            },
          });

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
                    update: realEstateDetails,
                  }
                : undefined,

              vehicleDetails: vehicleDetails
                ? {
                    update: vehicleDetails,
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

          reply.send({
            success: true,
            data: formatListingResponse(
              listing as unknown as ListingWithRelations,
            ),
            status: 200,
          });
        } catch (error) {
          console.error("Database error:", error);
          reply.code(500).send({
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
            reply.code(404).send({
              success: false,
              error: "Listing not found",
              status: 404,
              data: null,
            });
            return;
          }

          if (listing.userId !== userId) {
            reply.code(403).send({
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

          reply.send({
            success: true,
            data: null,
            status: 200,
          });
        } catch (error) {
          console.error("Error deleting listing:", error);
          reply.code(500).send({
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
