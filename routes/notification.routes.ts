import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../middleware/auth.js";
import { updateLastActive } from "../middleware/activity.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  sendSystemAnnouncement,
} from "../controllers/notification.controller.js";

// Define Fastify handler types
type FastifyHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<void>;

// Create Fastify-compatible handlers
const createFastifyHandler = (controller: any): FastifyHandler => {
  return async (request, reply) => {
    // Add Express-compatible methods to Fastify objects
    await controller(request, reply);
  };
};

export default async function (fastify: FastifyInstance) {
  // All notification routes should be protected
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Authenticate using Fastify request/reply
        await authenticate(request, reply);
        if (!request.user) {
          reply
            .code(401)
            .send({ success: false, error: "Unauthorized: User not found" });
          return reply;
        }
      } catch (error) {
        // If an error occurs during authentication, send a response and return
        if (!reply.sent) {
          reply
            .code(401)
            .send({ success: false, error: "Authentication failed" });
        }
        return reply;
      }
    },
  );

  // Get all notifications for the authenticated user
  fastify.get("/", {
    preHandler: [authenticate, updateLastActive],
    handler: createFastifyHandler(getNotifications),
  });

  // Mark a specific notification as read
  fastify.put("/:id/read", {
    preHandler: [authenticate, updateLastActive],
    handler: createFastifyHandler(markAsRead),
  });

  // Mark all notifications as read
  fastify.put("/read-all", {
    preHandler: [authenticate, updateLastActive],
    handler: createFastifyHandler(markAllAsRead),
  });

  // Delete a specific notification
  fastify.delete("/:id", createFastifyHandler(deleteNotification));

  // Clear all notifications
  fastify.delete("/", createFastifyHandler(clearAllNotifications));

  // Send system announcement (admin only)
  fastify.post(
    "/system-announcement",
    createFastifyHandler(sendSystemAnnouncement),
  );
}
