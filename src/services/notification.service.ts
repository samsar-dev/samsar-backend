import prismaClient from "../lib/prismaClient.js";
import { NotificationType } from "../types/enums.js";
import { NotificationType as PrismaNotificationType } from "@prisma/client";

/**
 * Helper function to convert our custom NotificationType to Prisma's NotificationType
 * This is needed because Prisma's generated types might not be up-to-date with our schema changes
 */
const toPrismaNotificationType = (type: NotificationType): any => {
  // Using type assertion to bypass type checking
  // This is safe because we've already updated the Prisma schema
  return type as any;
};

/**
 * Handle price updates for listings and notify users who have favorited the listing
 */
export const handleListingPriceUpdate = async (
  listingId: string,
  oldPrice: number,
  newPrice: number,
) => {
  try {
    // Get all users who have favorited this listing
    const favorites = await prismaClient.favorite.findMany({
      where: {
        listingId,
      },
      include: {
        user: {
          select: {
            id: true,
            preferences: true,
          },
        },
      },
    });

    // Calculate price difference percentage
    const priceDifference = ((oldPrice - newPrice) / oldPrice) * 100;

    // Only notify if price has decreased by 5% or more
    if (priceDifference >= 5) {
      // Send notifications to users who have favorited this listing and have price drop notifications enabled
      const notificationPromises = favorites.map(async (favorite) => {
        const preferences = favorite.user.preferences as {
          notifications?: { priceDrops?: boolean };
        } | null;

        // Only send notification if user has enabled price drop notifications
        if (preferences?.notifications?.priceDrops !== false) {
          await prismaClient.notification.create({
            data: {
              type: toPrismaNotificationType(NotificationType.PRICE_UPDATE),
              content: `Price dropped by ${priceDifference.toFixed(1)}% on a listing you saved!`,
              userId: favorite.userId,
              relatedListingId: listingId,
            },
          });
        }
      });

      await Promise.all(notificationPromises);
    }
  } catch (error) {
    console.error("Error handling listing price update:", error);
  }
};

/**
 * Send a notification when a new listing matches a user's saved search criteria
 */
export const handleNewListingMatch = async (
  listingId: string,
  matchingUserIds: string[],
  searchCriteriaId?: string,
) => {
  try {
    if (!matchingUserIds.length) return;

    // Get the listing details
    const listing = await prismaClient.listing.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        price: true,
        category: true,
      },
    });

    if (!listing) {
      console.error(`Listing with ID ${listingId} not found`);
      return;
    }

    // Create notifications for each matching user
    const notificationPromises = matchingUserIds.map((userId) => {
      return prismaClient.notification.create({
        data: {
          type: toPrismaNotificationType(NotificationType.NEW_LISTING_MATCH),
          content: `New ${listing.category.toLowerCase()} listing matches your saved search: ${listing.title}`,
          userId,
          relatedListingId: listingId,
        },
      });
    });

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error sending new listing match notifications:", error);
  }
};

/**
 * Send an account warning notification to a user
 */
export const sendAccountWarning = async (
  userId: string,
  warningMessage: string,
  relatedListingId?: string,
) => {
  try {
    await prismaClient.notification.create({
      data: {
        type: toPrismaNotificationType(NotificationType.ACCOUNT_WARNING),
        content: warningMessage,
        userId,
        relatedListingId,
      },
    });
  } catch (error) {
    console.error("Error sending account warning notification:", error);
  }
};

/**
 * Send a system announcement to all users or a specific group of users
 */
export const sendSystemAnnouncement = async (
  message: string,
  title: string,
  targetUserIds?: string[],
) => {
  try {
    // If no target users specified, get all users who haven't opted out
    if (!targetUserIds || targetUserIds.length === 0) {
      const users = await prismaClient.user.findMany({
        where: {
          // Only include users who haven't opted out of system announcements
          NOT: {
            preferences: {
              path: ["notifications", "systemAnnouncements"],
              equals: false,
            },
          },
        },
        select: { id: true },
      });

      targetUserIds = users.map((user) => user.id);
    }

    // Create notifications for each user
    const notificationPromises = targetUserIds.map((userId) => {
      return prismaClient.notification.create({
        data: {
          type: toPrismaNotificationType(NotificationType.SYSTEM_ANNOUNCEMENT),
          content: message,
          userId,
        },
      });
    });

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error sending system announcement:", error);
  }
};
