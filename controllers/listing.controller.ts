import { Request, Response } from "express";
import {
  ListingStatus,
  ListingAction,
  Prisma,
  NotificationType,
  VehicleType,
  FuelType,
  TransmissionType,
  Condition,
} from "@prisma/client";
import prisma from "../src/lib/prismaClient.js";
import { uploadToR2, deleteFromR2 } from "../config/cloudflareR2.js";
import fs from "fs";
import { AuthRequest } from "../middleware/auth.middleware";
import { handleListingPriceUpdate } from "../src/services/notification.service.js";

interface ListingResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  mainCategory: string;
  subCategory: string;
  location: string;
  condition?: string;
  status: string;
  listingAction?: string;
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
    serviceHistory?: string;
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
}>;

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
    condition: listing.condition || undefined,
    status: listing.status,
    listingAction: listing.listingAction || undefined,
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
          vehicleType: listing.vehicleDetails.vehicleType,
          make: listing.vehicleDetails.make,
          model: listing.vehicleDetails.model,
          year: listing.vehicleDetails.year,
          mileage: listing.vehicleDetails.mileage || undefined,
          fuelType: listing.vehicleDetails.fuelType || undefined,
          transmissionType:
            listing.vehicleDetails.transmissionType || undefined,
          color: listing.vehicleDetails.color || undefined,
          condition: listing.vehicleDetails.condition || undefined,
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
          propertyType: listing.realEstateDetails.propertyType,
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

  return errors;
};

export const createListing = async (req: AuthRequest, res: Response) => {
  const prismaClient = prisma;
  try {
    const {
      title,
      description,
      price,
      mainCategory,
      subCategory,
      location,
      condition,
      attributes,
      features,
      details,
      listingAction,
    } = req.body;

    // Parse details if it's a string
    const parsedDetails =
      typeof details === "string" ? JSON.parse(details) : details;

    const errors = validateListingData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors,
        status: 400,
        data: null,
      });
    }

    // Start transaction
    const result = await prismaClient.$transaction(async (tx) => {
      // Create listing data
      const listingData: Prisma.ListingCreateInput = {
        title,
        description,
        price: parseFloat(price),
        mainCategory,
        subCategory,
        category: JSON.stringify({ mainCategory, subCategory }),
        location,
        condition,
        status: ListingStatus.ACTIVE,
        listingAction: listingAction || ListingAction.SELL,
        user: {
          connect: {
            id: req.user.id,
          },
        },
        images: {
          create:
            req.processedImages?.map((img) => ({
              url: img.url,
              order: img.order,
            })) || [],
        },
        vehicleDetails: parsedDetails?.vehicles
          ? {
              create: {
                vehicleType: parsedDetails.vehicles.vehicleType as VehicleType,
                make: parsedDetails.vehicles.make,
                model: parsedDetails.vehicles.model,
                year: parseInt(parsedDetails.vehicles.year),
                mileage: parsedDetails.vehicles.mileage
                  ? parseInt(parsedDetails.vehicles.mileage)
                  : null,
                fuelType: parsedDetails.vehicles.fuelType as FuelType | null,
                transmissionType: parsedDetails.vehicles
                  .transmissionType as TransmissionType | null,
                color: parsedDetails.vehicles.color || null,
                condition: parsedDetails.vehicles.condition as Condition | null,
              },
            }
          : undefined,
        realEstateDetails: parsedDetails?.realEstate
          ? {
              create: {
                propertyType: parsedDetails.realEstate.propertyType,
                size: parsedDetails.realEstate.size,
                yearBuilt: parsedDetails.realEstate.yearBuilt,
                bedrooms: parsedDetails.realEstate.bedrooms,
                bathrooms: parsedDetails.realEstate.bathrooms,
                condition: parsedDetails.realEstate.condition,
              },
            }
          : undefined,
        attributes: attributes
          ? {
              create: attributes,
            }
          : undefined,
        features: features
          ? {
              create: features,
            }
          : undefined,
      };

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

      // Create notification
      await prisma.notification.create({
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
    res.status(201).json({
      success: true,
      data: formattedListing,
      status: 201,
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create listing",
      status: 500,
      data: null,
    });
  }
};

// Simple in-memory cache for listings
const listingsCache = new Map<string, { data: any; etag: string; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds cache TTL

export const getListings = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Request query:", req.query);
    
    // Create a cache key from the request query parameters
    const cacheKey = JSON.stringify(req.query);
    const ifNoneMatch = req.headers['if-none-match'];
    
    // Check if we have a valid cache entry
    const cachedResponse = listingsCache.get(cacheKey);
    if (cachedResponse) {
      const isExpired = Date.now() - cachedResponse.timestamp > CACHE_TTL;
      
      // If the client sent an ETag that matches our cached ETag and the cache isn't expired
      if (ifNoneMatch === cachedResponse.etag && !isExpired) {
        // Return 304 Not Modified to tell the client to use its cached version
        console.log('Cache hit with matching ETag, returning 304');
        return res.status(304).end();
      }
      
      // If cache is still valid but client didn't send matching ETag
      if (!isExpired) {
        console.log('Cache hit, returning cached data');
        res.set('ETag', cachedResponse.etag);
        res.set('Cache-Control', 'private, max-age=60'); // Tell client to cache for 60 seconds
        return res.json(cachedResponse.data);
      }
      
      // Cache expired, will fetch new data
      console.log('Cache expired, fetching new data');
    }
    
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 12),
    );
    const search = (req.query.search as string) || "";
    const mainCategory = (req.query.mainCategory as string) || "";
    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice =
      parseFloat(req.query.maxPrice as string) || Number.MAX_SAFE_INTEGER;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder =
      (req.query.sortOrder as string)?.toLowerCase() === "asc" ? "asc" : "desc";

    // Year filter
    const year =
      req.query.year !== undefined &&
      req.query.year !== null &&
      req.query.year !== ""
        ? Number(req.query.year)
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
        orderBy: { [sortBy]: sortOrder },
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
      data: {
        listings: formattedListings,
        total,
        page,
        limit,
      },
      status: 200,
    };
    
    // Generate ETag (simple hash of the JSON response)
    const etag = `W/"${Buffer.from(JSON.stringify(responseData)).toString('base64').slice(0, 27)}"`; 
    
    // Store in cache
    listingsCache.set(cacheKey, {
      data: responseData,
      etag,
      timestamp: Date.now(),
    });
    
    // Set cache headers
    res.set('ETag', etag);
    res.set('Cache-Control', 'private, max-age=60'); // Tell client to cache for 60 seconds
    
    // Send response
    res.json(responseData);
  } catch (error) {
    console.error("Error getting listings:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    res.status(500).json({
      success: false,
      message: "Error getting listings",
    });
  }
};

export const getListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
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

        realEstateDetails: true,
      },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Create view notification if viewer is not the seller
    if (req.user && req.user.id !== listing.userId) {
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: NotificationType.LISTING_INTEREST,
          content: `${req.user.username} viewed your listing "${listing.title}"`,
          relatedListingId: listing.id,
        },
      });
    }

    res.json({
      success: true,
      data: formatListingResponse(listing as ListingWithRelations),
    });
  } catch (error) {
    console.error("Error getting listing:", error);
    res.status(500).json({
      success: false,
      message: "Error getting listing",
    });
  }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      mainCategory,
      subCategory,
      location,
      condition,
      attributes,
      features,
    } = req.body;

    const oldListing = await prisma.listing.findUnique({
      where: { id },
      select: { price: true, title: true, userId: true },
    });

    if (!oldListing) {
      return res.status(404).json({
        success: false,
        error: "Listing not found",
        status: 404,
        data: null,
      });
    }

    // Check if price has changed
    if (price && price !== oldListing.price) {
      await handleListingPriceUpdate(id, oldListing.price, price);
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        price: parseFloat(price),
        mainCategory,
        subCategory,
        location,
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
        images: req.processedImages
          ? {
              deleteMany: {},
              create: req.processedImages.map((img) => ({
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
      },
    });

    // Handle price update notifications
    if (price && oldListing.price !== parseFloat(price)) {
      // Notify the listing owner
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: NotificationType.PRICE_UPDATE,
          content: `The price of your listing "${oldListing.title}" has been updated from ${oldListing.price} to ${price}.`,
          relatedListingId: listing.id,
        },
      });

      // Notify users who have favorited the listing
      await handleListingPriceUpdate(
        listing.id,
        oldListing.price,
        parseFloat(price),
      );
    }

    res.json({
      success: true,
      data: formatListingResponse(listing as ListingWithRelations),
      status: 200,
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Error updating listing",
      status: 500,
      data: null,
    });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (listing.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this listing",
      });
    }

    // Delete images from storage
    for (const image of listing.images) {
      await deleteFromR2(image.url);
    }

    await prisma.listing.delete({ where: { id } });

    res.json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting listing:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting listing",
    });
  }
};

export const toggleSaveListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
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
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        listingId: id,
        userId: req.user.id,
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

    res.json({
      success: true,
      data: formatListingResponse(updatedListing as ListingWithRelations),
    });
  } catch (error) {
    console.error("Error toggling save listing:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling save listing",
    });
  }
};
