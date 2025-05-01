import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { NextFunction } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  updateProfile,
  getUserProfile,
  getUserListings,
  getUserSettings,
  updateUserSettings,
  getUserPublicDetails,
} from "../controllers/user.controller.js";
import {
  upload,
  processImage,
  uploadToR2,
} from "../middleware/upload.middleware.js";
import { MultipartAuthRequest } from "../types/auth.js";

export default async function (fastify: FastifyInstance) {
  // Create Fastify-compatible handlers
  const createFastifyHandler = (controller: any) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await controller(request, reply);
      } catch (error) {
        reply.code(500).send({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    };
  };

  // Middleware to process profile picture
  const processProfilePicture = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const authReq = request as unknown as MultipartAuthRequest;
      if (authReq.file) {
        // Upload processed image to R2
        const body = authReq.body as any;
        body.profilePicture = await uploadToR2(authReq.file as any, "avatar");
      }
    } catch (error) {
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process profile picture",
      });
    }
  };

  // Get user public details
  fastify.get(
    "/public-profile/:id",
    createFastifyHandler(getUserPublicDetails),
  );

  // Apply authentication to all routes below
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Authenticate using Fastify request/reply (adapt your middleware if needed)
      await authenticate(request, reply);
    },
  );

  // Get user profile
  fastify.get("/profile", createFastifyHandler(getUserProfile));

  // Update profile (optional profile picture upload)
  // Note: Fastify file upload handling will need to be configured separately
  fastify.put(
    "/profile",
    {
      preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
        await processProfilePicture(request, reply);
      },
    },
    createFastifyHandler(updateProfile),
  );

  // Get user settings
  fastify.get("/settings", createFastifyHandler(getUserSettings));

  // Update settings
  fastify.post("/settings", createFastifyHandler(updateUserSettings));

  // Get user's listings
  fastify.get("/listings", createFastifyHandler(getUserListings));
}
