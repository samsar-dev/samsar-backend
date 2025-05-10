import prisma from "../src/lib/prismaClient.js";
import { io } from "../server.js";
import { usersSocketId } from "../server.js";
import { PRICE_CHANGE } from "../constants/socketEvent.js";

interface PriceChangeData {
  listingId: string;
  title: string;
  oldPrice: number;
  newPrice: number;
  percentReduction: number;
  userId: string;
}

export const handlePriceChange = async ({
  listingId,
  title,
  oldPrice,
  newPrice,
  percentReduction,
  userId,
}: PriceChangeData) => {
  console.log("Price change data:", {
    listingId,
    title,
    oldPrice,
    newPrice,
    percentReduction,
    userId,
  });

  try {
    // Find users who have saved this listing
    const favorites = await prisma.favorite.findMany({
      where: {
        listingId: listingId, // Using the correct field name from Prisma schema
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${favorites.length} users who saved this listing`);

    // Create notifications for each user who saved the listing
    for (const favorite of favorites) {
      // Skip notification for the user who made the price change
      if (favorite.userId === userId) continue;

      // Create notification in the database
      const notification = await prisma.notification.create({
        data: {
          type: "PRICE_UPDATE",
          message: `The price for "${title}" has been reduced by ${percentReduction}% (from $${oldPrice} to $${newPrice})`, // Using message instead of title/content
          userId: favorite.userId,
          targetId: listingId, // Using targetId instead of relatedId
          targetType: "listing",
          read: false,
        },
        include: {
          user: true,
        },
      });

      console.log(`Created notification for user ${favorite.userId}:`, notification);

      // Send real-time notification to the user if they are online
      const recipientSocketId = usersSocketId.get(favorite.userId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit(PRICE_CHANGE, {
          notification,
          listingId,
          title,
          oldPrice,
          newPrice,
          percentReduction,
        });
        console.log(`Sent real-time notification to user ${favorite.userId}`);
      }
    }

    return { success: true, message: "Price change notifications sent" };
  } catch (error) {
    console.error("Error handling price change:", error);
    return { success: false, error: "Failed to process price change notifications" };
  }
};
