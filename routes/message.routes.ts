import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { NextFunction } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  sendMessage,
  getMessages,
  deleteMessage,
  createConversation,
  getConversations,
  deleteConversation,
} from "../controllers/message.controller.js";

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
  // Apply authentication to all routes
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Authenticate using Fastify request/reply (adapt your middleware if needed)
    await authenticate(request, reply);
  });

  // Conversations routes
  fastify.get(
    "/conversations",
    createFastifyHandler(getConversations)
  );
  fastify.post(
    "/conversations",
    createFastifyHandler(createConversation)
  );
  fastify.delete(
    "/conversations/:conversationId",
    createFastifyHandler(deleteConversation)
  );

  // Messages routes
  fastify.post("/", createFastifyHandler(sendMessage));
  fastify.get(
    "/:conversationId",
    createFastifyHandler(getMessages)
  );
  fastify.delete(
    "/:messageId",
    createFastifyHandler(deleteMessage)
  );

  // Listing message routes
  fastify.post(
    "/listings/messages",
    createFastifyHandler(sendMessage)
  );
}
