import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../middleware/auth.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

// Define Fastify handler types
type FastifyHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

// Create Fastify-compatible handlers
const createFastifyHandler = (controller: any): FastifyHandler => {
  return async (request, reply) => {
    // Add Express-compatible methods to Fastify objects
    await controller(request, reply);
  };
};

export default async function (fastify: FastifyInstance) {
  // All notification routes should be protected
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Authenticate using Fastify request/reply
    await authenticate(request, reply);
    const user = request.getUserInfo?.();
    if (!user) {
      reply.code(401).send({ success: false, error: "Unauthorized: User not found" });
      return;
    }
    request.user = user;
  });

  fastify.get("/", createFastifyHandler(getNotifications));
  fastify.put("/:id/read", createFastifyHandler(markAsRead));
  fastify.put("/read-all", createFastifyHandler(markAllAsRead));
}
