import { FastifyInstance } from "fastify";
import {
  updateFCMToken,
  removeFCMToken,
  sendTestNotification,
  getFCMTokenStatus,
} from "../controllers/fcm.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

export default async function fcmRoutes(fastify: FastifyInstance) {
  // All FCM routes require authentication
  fastify.addHook("preHandler", authMiddleware);

  // Update FCM token
  fastify.post("/token", {
    preHandler: [authMiddleware],
    handler: updateFCMToken
  });

  // Remove FCM token
  fastify.delete("/token", {
    preHandler: [authMiddleware],
    handler: removeFCMToken
  });

  // Get FCM token status
  fastify.get("/token/status", {
    preHandler: [authMiddleware],
    handler: getFCMTokenStatus
  });

  // Send test notification
  fastify.post("/test", {
    preHandler: [authMiddleware],
    handler: sendTestNotification
  });
}
