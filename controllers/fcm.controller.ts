import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../src/lib/prismaClient.js";
import { firebaseNotificationService } from "../services/firebase-admin.service.js";

interface UpdateFCMTokenBody {
  fcmToken: string;
}

interface SendTestNotificationBody {
  title: string;
  body: string;
  data?: { [key: string]: string };
}

export const updateFCMToken = async (
  req: FastifyRequest<{ Body: UpdateFCMTokenBody }>,
  reply: FastifyReply,
) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return reply.code(400).send({
        success: false,
        error: { message: "FCM token is required" },
      });
    }

    // Validate the FCM token
    const isValidToken = await firebaseNotificationService.validateToken(fcmToken);
    if (!isValidToken) {
      return reply.code(400).send({
        success: false,
        error: { message: "Invalid FCM token" },
      });
    }

    // Update user's FCM token
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fcmToken,
        fcmTokenUpdatedAt: new Date(),
      },
      select: {
        id: true,
        fcmToken: true,
        fcmTokenUpdatedAt: true,
      },
    });

    return reply.send({
      success: true,
      data: {
        message: "FCM token updated successfully",
        user: updatedUser,
      },
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: { message: "Failed to update FCM token" },
    });
  }
};

export const removeFCMToken = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        fcmToken: null,
        fcmTokenUpdatedAt: null,
      },
    });

    return reply.send({
      success: true,
      data: { message: "FCM token removed successfully" },
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: { message: "Failed to remove FCM token" },
    });
  }
};

export const sendTestNotification = async (
  req: FastifyRequest<{ Body: SendTestNotificationBody }>,
  reply: FastifyReply,
) => {
  try {
    const { title, body, data } = req.body;
    const userId = req.user.id;

    if (!title || !body) {
      return reply.code(400).send({
        success: false,
        error: { message: "Title and body are required" },
      });
    }

    // Get user's FCM token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) {
      return reply.code(400).send({
        success: false,
        error: { message: "No FCM token found for user" },
      });
    }

    // Send test notification
    const success = await firebaseNotificationService.sendToDevice(
      user.fcmToken,
      { title, body, data }
    );

    if (success) {
      return reply.send({
        success: true,
        data: { message: "Test notification sent successfully" },
      });
    } else {
      return reply.code(500).send({
        success: false,
        error: { message: "Failed to send test notification" },
      });
    }
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: { message: "Failed to send test notification" },
    });
  }
};

export const getFCMTokenStatus = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        fcmToken: true,
        fcmTokenUpdatedAt: true,
      },
    });

    const hasToken = !!user?.fcmToken;
    let isValid = false;

    if (user?.fcmToken) {
      isValid = await firebaseNotificationService.validateToken(user.fcmToken);
    }

    return reply.send({
      success: true,
      data: {
        hasToken,
        isValid,
        lastUpdated: user?.fcmTokenUpdatedAt,
      },
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: { message: "Failed to get FCM token status" },
    });
  }
};
