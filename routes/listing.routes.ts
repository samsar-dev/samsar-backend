import express, { Request, Response } from "express";
import { authenticate } from "../middleware/auth.js";
import prisma from "../src/lib/prismaClient.js";
import { Prisma } from "@prisma/client";
import { VehicleType, FuelType, TransmissionType, Condition } from "../types/enums.js";
import {
  upload,
  processImagesMiddleware,
  processImage,
} from "../middleware/upload.middleware.js";

// Extend Request type for authenticated requests
interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  processedImages?: Array<{
    url: string;
    order: number;
  }>;
}

// Type for sorting options
type SortOrder = 'asc' | 'desc';

// Define valid sort fields
const validSortFields = ['price', 'createdAt', 'favorites'] as const;
type SortField = typeof validSortFields[number];

// Helper function to build orderBy object
const buildOrderBy = (sortBy?: string, sortOrder?: string): Prisma.ListingOrderByWithRelationInput => {
  const order: SortOrder = (sortOrder?.toLowerCase() === 'desc') ? 'desc' : 'asc';
  
  if (sortBy === 'favorites') {
    return {
      favorites: {
        _count: order
      }
    };
  }
  
  if (sortBy === 'price') {
    return { price: order };
  }
  
  // Default sort by createdAt
  return { createdAt: 'desc' };
};

// Helper function to validate request user
const validateUser = (req: AuthRequest): string => {
  const userId = req.user?.id;
  if (!userId) {
    throw new Error('Unauthorized: User not found');
  }
  return userId;
};

import {
  ListingCreateInput,
  ListingUpdateInput,
  ListingWithRelations,
  ListingBase,
  ListingDetails,
} from "../types/shared.js";

const router = express.Router();

const formatListingResponse = (listing: any): ListingBase | null => {
  if (!listing) return null;

  const details: ListingDetails = {
    vehicles: listing.vehicleDetails ? {
      vehicleType: listing.vehicleDetails.vehicleType,
      make: listing.vehicleDetails.make,
      model: listing.vehicleDetails.model,
      year: listing.vehicleDetails.year,
      mileage: listing.vehicleDetails.mileage,
      fuelType: listing.vehicleDetails.fuelType,
      transmissionType: listing.vehicleDetails.transmissionType,
      color: listing.vehicleDetails.color,
      condition: listing.vehicleDetails.condition,
      features: listing.vehicleDetails.features || [],
      interiorColor: listing.vehicleDetails.interiorColor,
      engine: listing.vehicleDetails.engine,
      warranty: listing.vehicleDetails.warranty,
      serviceHistory: listing.vehicleDetails.serviceHistory,
      previousOwners: listing.vehicleDetails.previousOwners,
      registrationStatus: listing.vehicleDetails.registrationStatus,
      horsepower: listing.vehicleDetails.horsepower,
      torque: listing.vehicleDetails.torque
    } : undefined,
    realEstate: listing.realEstateDetails ? {
      propertyType: listing.realEstateDetails.propertyType,
      size: listing.realEstateDetails.size,
      bedrooms: listing.realEstateDetails.bedrooms,
      bathrooms: listing.realEstateDetails.bathrooms,
      condition: listing.realEstateDetails.condition,
      features: listing.realEstateDetails.features || []
    } : undefined,
  };

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
    details,
    listingAction: listing.listingAction,
    status: listing.status,
  };
};

// Public Routes
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { mainCategory, subCategory, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

    // Build where clause for filtering
    const where: Prisma.ListingWhereInput = {};
    if (mainCategory) {
      where.mainCategory = mainCategory as string;
    }
    if (subCategory) {
      where.subCategory = subCategory as string;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get total count for pagination
    const total = await prisma.listing.count({ where });

    // Get listings with pagination, sorting, and filtering
    const listings = await prisma.listing.findMany({
      where,
      take: Number(limit),
      skip,
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
        vehicleDetails: true,
        realEstateDetails: true,
      },
    });

    // Format listings for response
    const formattedListings = listings.map((listing) =>
      formatListingResponse(listing),
    );

    res.json({
      success: true,
      data: {
        items: formattedListings,
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: total > (Number(page) * Number(limit)),
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch listings",
      status: 500,
      data: null,
    });
  }
});

router.get("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, category, minPrice, maxPrice } = req.query;

    const where: Prisma.ListingWhereInput = {
      status: "ACTIVE",
      ...(query &&
        typeof query === "string" && {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }),
      ...(category && typeof category === "string" && { category }),
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice &&
                typeof minPrice === "string" && { gte: parseFloat(minPrice) }),
              ...(maxPrice &&
                typeof maxPrice === "string" && { lte: parseFloat(maxPrice) }),
            },
          }
        : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
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
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: listings.map((listing) => formatListingResponse(listing)),
        total,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        hasMore: total > (parseInt(req.query.limit as string) || 10),
      },
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Error searching listings",
      status: 500,
      data: null,
    });
  }
});

router.get("/trending", async (_req: Request, res: Response): Promise<void> => {
  try {
    const trendingListings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      include: {
        images: true,
        _count: {
          select: { favorites: true }
        }
      },
      orderBy: {
        favorites: {
          _count: "desc",
        },
      },
      take: 10,
    });

    res.json({
      success: true,
      data: { items: trendingListings },
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      success: false,
      error: errorMessage,
      status: 500,
      data: null,
    });
  }
});

// Protected Routes
router.use(authenticate);

// Helper function to handle authenticated routes
const handleAuthRoute = (handler: (req: AuthRequest, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      // Cast request to AuthRequest since it's been authenticated
      const authReq = req as AuthRequest;
      await handler(authReq, res);
    } catch (error) {
      console.error("Auth route error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
        status: 500,
        data: null,
      });
    }
  };
};

router.get("/saved", handleAuthRoute(async (req: AuthRequest, res: Response): Promise<void> => {
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

    res.json({
      success: true,
      data: { items: formattedListings },
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
      status: 500,
      data: null,
    });
  }
}));

router.post(
  "/",
  upload.array("images", 10),
  processImagesMiddleware,
  handleAuthRoute(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = validateUser(req);
      
      // Log request body for debugging
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { title, description, price, mainCategory, subCategory, location = "", listingAction, details } = req.body;

      // Validate required fields
      const missingFields: string[] = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!price) missingFields.push('price');
      if (!location) missingFields.push('location');
      if (!mainCategory) missingFields.push('mainCategory');
      if (!subCategory) missingFields.push('subCategory');

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          status: 400,
          data: null,
        });
        return;
      }

      // Get processed image URLs
      const imageUrls = req.processedImages?.map(img => img.url) || [];
      console.log('Processed image URLs:', imageUrls);

      // Parse details
      let parsedDetails;
      try {
        parsedDetails = JSON.parse(typeof details === 'string' ? details : JSON.stringify(details));
        console.log('Parsed details:', JSON.stringify(parsedDetails, null, 2));

        // Validate real estate details if present
        if (mainCategory === 'REAL_ESTATE' && parsedDetails.realEstate) {
          const realEstate = parsedDetails.realEstate;
          
          // Ensure propertyType is valid
          if (!realEstate.propertyType || !['HOUSE', 'APARTMENT', 'CONDO', 'LAND', 'COMMERCIAL', 'OTHER'].includes(realEstate.propertyType)) {
            throw new Error('Invalid property type');
          }

          // Convert numeric values to strings
          realEstate.size = realEstate.size?.toString();
          realEstate.yearBuilt = realEstate.yearBuilt?.toString();
          realEstate.bedrooms = realEstate.bedrooms?.toString();
          realEstate.bathrooms = realEstate.bathrooms?.toString();
        }
      } catch (error) {
        console.error('Error parsing/validating details:', error);
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : "Invalid details format",
          status: 400,
          data: null,
        });
        return;
      }

      // Create listing with images
      console.log("Details sent to DB:", JSON.stringify(parsedDetails, null, 2));
      
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
          userId,
          listingAction,
          vehicleDetails: parsedDetails.vehicles ? {
            create: {
              vehicleType: parsedDetails.vehicles.vehicleType,
              make: parsedDetails.vehicles.make,
              model: parsedDetails.vehicles.model,
              year: Number(parsedDetails.vehicles.year) || new Date().getFullYear(),
              mileage: parsedDetails.vehicles.mileage ? Number(parsedDetails.vehicles.mileage) : 0,
              fuelType: parsedDetails.vehicles.fuelType,
              transmissionType: parsedDetails.vehicles.transmissionType,
              color: typeof parsedDetails.vehicles.color === 'string' ? parsedDetails.vehicles.color : '#000000',
              condition: parsedDetails.vehicles.condition,
              interiorColor: typeof parsedDetails.vehicles.interiorColor === 'string' ? parsedDetails.vehicles.interiorColor : '#000000',
              engine: parsedDetails.vehicles.engine || '',
              warranty: parsedDetails.vehicles.warranty ? Number(parsedDetails.vehicles.warranty) : 0,
              serviceHistory: parsedDetails.vehicles.serviceHistory || 'none',
              previousOwners: parsedDetails.vehicles.previousOwners ? Number(parsedDetails.vehicles.previousOwners) : 0,
              registrationStatus: parsedDetails.vehicles.registrationStatus || 'unregistered',
              features: Array.isArray(parsedDetails.vehicles.features) ? parsedDetails.vehicles.features : [],
            }
          } : undefined,
          realEstateDetails: parsedDetails.realEstate ? {
            create: {
              propertyType: parsedDetails.realEstate.propertyType || 'HOUSE',
              size: parsedDetails.realEstate.size?.toString() || null,
              yearBuilt: parsedDetails.realEstate.yearBuilt?.toString() || null,
              bedrooms: parsedDetails.realEstate.bedrooms?.toString() || null,
              bathrooms: parsedDetails.realEstate.bathrooms?.toString() || null,
              condition: parsedDetails.realEstate.condition?.toString() || null,
            }
          } : undefined,
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
          vehicleDetails: true,
          realEstateDetails: true,
        },
      });

      res.status(201).json({
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
        console.error("Request body:", JSON.stringify(req.body, null, 2));
        
        // Log parsed details if available
        try {
          const details = req.body.details;
          console.error("Details:", typeof details === 'string' ? details : JSON.stringify(details, null, 2));
        } catch (e) {
          console.error("Error logging details:", e);
        }
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create listing",
        status: 500,
        data: null,
      });
    }
  })
);

router.get("/user", handleAuthRoute(async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 12 } = req.query;
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

    res.json({
      success: true,
      data: {
        listings: listings.map((listing) => formatListingResponse(listing)),
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: total > (Number(page) * Number(limit)),
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An error occurred while fetching user listings",
      },
    });
  }
}));

router.get("/favorites", handleAuthRoute(async (req: AuthRequest, res: Response): Promise<void> => {
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

    res.json({
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
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An error occurred while fetching favorite listings",
      },
    });
  }
}));

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
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
        vehicleDetails: true,  // This includes all vehicle details
        realEstateDetails: true, // This includes all real estate details
      },
    });

    if (!listing) {
      console.log(`Listing not found with ID: ${req.params.id}`);
      res.status(404).json({
        success: false,
        error: "Listing not found",
        status: 404,
        data: null,
      });
      return;
    }
    
    // Detailed logging
    console.log('Raw listing data:', JSON.stringify(listing, null, 2));
    if (listing.vehicleDetails) {
      console.log('Vehicle details found:', JSON.stringify(listing.vehicleDetails, null, 2));
      // Log all fields to check if advanced fields exist
      console.log('Vehicle detail fields:', Object.keys(listing.vehicleDetails));
    } else {
      console.log('No vehicle details found for this listing');
    }

    const formattedListing = formatListingResponse(listing);
    
    if (formattedListing && formattedListing.details && formattedListing.details.vehicles) {
      console.log('Formatted listing:', JSON.stringify(formattedListing, null, 2));
      console.log('Formatted vehicle details:', JSON.stringify(formattedListing.details.vehicles, null, 2));
    }
    
    res.json({
      success: true,
      data: formattedListing,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching listing:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch listing",
      status: 500,
      data: null,
    });
  }
});

router.put(
  "/:id",
  upload.array("images"),
  processImagesMiddleware,
  handleAuthRoute(async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        description,
        price,
        mainCategory,
        subCategory,
        location = "",
        features = [],
        vehicleDetails,
        realEstateDetails,
        listingAction,
        sellDescription,
        rentDescription
      } = req.body;

      const newImages = req.processedImages || [];
      const existingImages = req.body.existingImages || [];

      // First, delete removed images
      await prisma.image.deleteMany({
        where: {
          listingId: req.params.id,
          url: { notIn: existingImages },
        },
      });

      // Update the listing
      const listing = await prisma.listing.update({
        where: { id: req.params.id },
        data: {
          title,
          description,
          price: parseFloat(price),
          mainCategory,
          subCategory,
          location,
          listingAction,
          images: {
            create: newImages.map((image: any, index: number) => ({
              url: image.url,
              order: existingImages.length + index,
            })),
          },
          features: {
            deleteMany: {},
            create: features.map((feature: string) => ({
              name: feature,
              value: true
            })),
          },
          vehicleDetails: vehicleDetails ? {
            upsert: {
              create: {
                make: vehicleDetails.make || '',
                model: vehicleDetails.model || '',
                year: parseInt(vehicleDetails.year) || new Date().getFullYear(),
                mileage: parseInt(vehicleDetails.mileage) || 0,
                vehicleType: vehicleDetails.vehicleType || VehicleType.OTHER,
                fuelType: vehicleDetails.fuelType || null,
                transmissionType: vehicleDetails.transmissionType || null,
                color: vehicleDetails.color || '',
                condition: vehicleDetails.condition || null
              },
              update: {
                make: { set: vehicleDetails.make || '' },
                model: { set: vehicleDetails.model || '' },
                year: { set: parseInt(vehicleDetails.year) || new Date().getFullYear() },
                mileage: { set: parseInt(vehicleDetails.mileage) || 0 },
                vehicleType: vehicleDetails.vehicleType || VehicleType.OTHER,
                fuelType: vehicleDetails.fuelType || null,
                transmissionType: vehicleDetails.transmissionType || null,
                color: { set: vehicleDetails.color || '' },
                condition: vehicleDetails.condition || null
              }
            }
          } : undefined,
          realEstateDetails: realEstateDetails ? {
            upsert: {
              create: {
                propertyType: realEstateDetails.propertyType || 'OTHER',
                size: realEstateDetails.size,
                yearBuilt: realEstateDetails.yearBuilt,
                bedrooms: realEstateDetails.bedrooms,
                bathrooms: realEstateDetails.bathrooms,
                condition: realEstateDetails.condition ? (realEstateDetails.condition as Condition) : null
              },
              update: {
                propertyType: realEstateDetails.propertyType || 'OTHER',
                size: realEstateDetails.size,
                yearBuilt: realEstateDetails.yearBuilt,
                bedrooms: realEstateDetails.bedrooms,
                bathrooms: realEstateDetails.bathrooms,
                condition: realEstateDetails.condition ? (realEstateDetails.condition as Condition) : null
              }
            }
          } : undefined,
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
        },
      });

      if (!listing) {
        throw new Error('Failed to create listing');
      }

      res.json({
        success: true,
        data: formatListingResponse(listing),
        status: 200,
      });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create listing in database',
        status: 500,
        data: null
      });
    }
  })
);

router.delete("/:id", handleAuthRoute(async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = validateUser(req);
    
    // Find listing
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        images: true,
        favorites: true,
        vehicleDetails: true,
        realEstateDetails: true,
      },
    });

    // Check if listing exists and belongs to user
    if (!listing) {
      res.status(404).json({
        success: false,
        error: "Listing not found",
        status: 404,
        data: null,
      });
      return;
    }

    if (listing.userId !== userId) {
      res.status(403).json({
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

    res.json({
      success: true,
      data: null,
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete listing",
      status: 500,
      data: null,
    });
  }
}));

export default router;
