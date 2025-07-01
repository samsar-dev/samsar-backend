import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  sendNewsletter,
  getNewsletterStats,
} from "../controllers/newsletterController.js";
import { authenticate, isAdmin } from "../middleware/auth.js";
import { UserPayload } from "../types/auth.js";

// Use the centralized UserPayload type from auth types
interface AuthenticatedRequest extends FastifyRequest {
  user: UserPayload;
}

// Define the request body schema for the newsletter
const newsletterSchema = {
  body: {
    type: "object",
    required: ["subject", "content", "isHtml"],
    properties: {
      subject: { type: "string" },
      content: { type: "string" },
      isHtml: { type: "boolean" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            totalRecipients: { type: "number" },
            sentCount: { type: "number" },
            failedCount: { type: "number" },
            failedEmails: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
    401: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
    500: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        error: { type: "string" },
      },
    },
  },
};

// Define the response schema for stats
const statsSchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            totalSubscribers: { type: "number" },
            lastNewsletterSent: { type: ["string", "null"] },
          },
        },
      },
    },
    500: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        error: { type: "string" },
      },
    },
  },
};

export default async function newsletterRoutes(fastify: FastifyInstance) {
  // Send newsletter endpoint
  fastify.post("/send", {
    schema: newsletterSchema,
    preHandler: [authenticate, isAdmin],
    handler: (req: FastifyRequest, reply) => sendNewsletter(req as any, reply),
  });

  // Get newsletter stats endpoint
  fastify.get("/stats", {
    schema: statsSchema,
    preHandler: [authenticate, isAdmin],
    handler: (req: FastifyRequest, reply) =>
      getNewsletterStats(req as any, reply),
  });
}
