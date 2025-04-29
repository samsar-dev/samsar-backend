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

export const getNotifications = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!req.user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const page = Math.max(1, parseInt((req.query as any).page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(50, parseInt((req.query as any).limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await prisma.notification.count({
      where: {
        userId: req.user.id,
      },
    });

    reply.send({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    reply.code(500).send({
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

export const markAllAsRead = async (req: FastifyRequest, reply: FastifyReply) => {
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

export const deleteNotification = async (req: FastifyRequest, reply: FastifyReply) => {
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

export const clearAllNotifications = async (req: FastifyRequest, reply: FastifyReply) => {
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
