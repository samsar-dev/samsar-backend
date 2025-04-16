import prismaClient from '../lib/prismaClient.js';
import { NotificationType } from '@prisma/client';

export const handleListingPriceUpdate = async (
  listingId: string,
  oldPrice: number,
  newPrice: number
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
        const preferences = favorite.user.preferences as { notifications?: { priceDrops?: boolean } } | null;
        
        // Only send notification if user has enabled price drop notifications
        if (preferences?.notifications?.priceDrops !== false) {
          await prismaClient.notification.create({
            data: {
              type: NotificationType.PRICE_UPDATE,
              content: `Price dropped by ${priceDifference.toFixed(1)}% on a listing you saved!`,
              userId: favorite.userId,
              relatedListingId: listingId
            }
          });
        }
      });

      await Promise.all(notificationPromises);
    }
  } catch (error) {
    console.error('Error handling listing price update:', error);
  }
};
