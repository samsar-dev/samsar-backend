import { FastifyRequest, FastifyReply } from "fastify";
import { Prisma, NotificationType } from "@prisma/client";
import prisma from "../src/lib/prismaClient.js";
import { Server } from "socket.io";
import { UserPayload } from "../types/auth.js";

// Extend Fastify JWT interface to include user properties
declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: UserPayload;
  }
}

const validateNotificationType = (type: string): type is NotificationType => {
  return Object.values(NotificationType).includes(type as NotificationType);
};

export const createNotification = async (
  io: Server,
  userId: string,
  type: NotificationType,
  relatedId: string,
  content: string,
) => {
  try {
    if (!validateNotificationType(type)) {
      throw new Error("Invalid notification type");
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        content,
        relatedId,
        read: false,
      },
    });

    io.to(userId).emit("notification", notification);

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const getNotifications = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return reply.code(401).send({
        success: false,
        error: "Unauthorized"
      });
    }

    // Parse pagination parameters with safe defaults
    const page = Math.max(1, parseInt((req.query as any).page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(50, parseInt((req.query as any).limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    // Log request information for debugging
    console.log(`Fetching notifications for user ${req.user.id}, page ${page}, limit ${limit}`);

    try {
      // Fetch notifications from database
      const notifications = await prisma.notification.findMany({
        where: {
          userId: req.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        include: {
          relatedListing: {
            select: {
              id: true,
              title: true,
            },
          },
          relatedUser: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      // Count total notifications for pagination
      const total = await prisma.notification.count({
        where: {
          userId: req.user.id,
        },
      });

      console.log(`Found ${notifications.length} notifications out of ${total} total`);

      // Transform notifications to match frontend types
      const transformedNotifications = notifications.map(notification => {
        // Generate a title based on notification type and related entities
        let title = "Notification";
        if (notification.relatedListing?.title) {
          title = notification.relatedListing.title;
        } else if (notification.relatedUser?.username) {
          title = `Message from ${notification.relatedUser.username}`;
        } else if (notification.type === "NEW_MESSAGE") {
          title = "New Message";
        } else if (notification.type === "PRICE_UPDATE") {
          title = "Price Update";
        } else if (notification.type === "LISTING_SOLD") {
          title = "Listing Sold";
        } else if (notification.type === "LISTING_INTEREST") {
          title = "Listing Interest";
        }

        return {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: title,
          message: notification.content,
          listingId: notification.relatedListingId,
          read: notification.read,
          createdAt: notification.createdAt.toISOString(),
          // Use only createdAt since updatedAt might not be available in the Prisma schema
          updatedAt: notification.createdAt.toISOString(),
          targetId: notification.relatedId,
          targetType: notification.type,
        };
      });

      // Send successful response
      return reply.send({
        success: true,
        data: {
          items: transformedNotifications,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (dbError) {
      // Handle database-specific errors
      console.error("Database error fetching notifications:", dbError);
      return reply.code(500).send({
        success: false,
        error: "Database error while fetching notifications",
      });
    }
  } catch (error) {
    // Handle any other unexpected errors
    console.error("Unexpected error in getNotifications:", error);
    return reply.code(500).send({
      success: false,
      error: "Failed to get notifications",
    });
  }
};

export const markAsRead = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!req.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { id } = req.params as { id: string };

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return reply.code(404).send({
        success: false,
        error: "Notification not found",
      });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    reply.send({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    reply.code(500).send({
      success: false,
      error: "Failed to mark notification as read",
    });
  }
};

export const markAllAsRead = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    if (!req.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    reply.send({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    reply.code(500).send({
      success: false,
      error: "Failed to mark all notifications as read",
    });
  }
};

export const deleteNotification = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    if (!req.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { id } = req.params as { id: string };
    const notification = await prisma.notification.delete({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return reply.code(404).send({
        success: false,
        error: "Notification not found",
      });
    }

    reply.send({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    reply.code(500).send({
      success: false,
      error: "Failed to delete notification",
    });
  }
};

export const clearAllNotifications = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    if (!req.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const result = await prisma.notification.deleteMany({
      where: { userId: req.user.id },
    });

    reply.send({
      success: true,
      message: "All notifications cleared",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Clear all notifications error:", error);
    reply.code(500).send({
      success: false,
      error: "Failed to clear all notifications",
    });
  }
};
