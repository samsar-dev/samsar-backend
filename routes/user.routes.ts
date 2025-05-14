import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../middleware/auth.js";
import {
  updateProfile,
  getUserProfile,
  getUserListings,
  getUserSettings,
  updateUserSettings,
  getUserPublicDetails,
  deleteUser,
} from "../controllers/user.controller.js";
import {
  processImagesMiddleware,
  uploadToR2,
} from "../middleware/upload.middleware.js";
import { MultipartFile } from "@fastify/multipart";

export default async function (fastify: FastifyInstance) {
  // Create Fastify-compatible handlers
  const createFastifyHandler = (controller: any) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Check if the controller is deleteUser to handle it specially
        if (controller.name === 'deleteUser') {
          console.log('Handling delete user request');
        }
        
        await controller(request, reply);
        
        // Don't log success for delete operations as they've already sent a response
        if (!reply.sent && controller.name !== 'deleteUser') {
          console.log("Operation completed successfully", controller.name);
        }
      } catch (error) {
        console.error(`Error in ${controller.name || 'controller'}:`, error);
        
        // Only send error response if reply hasn't been sent yet
        if (!reply.sent) {
          reply.code(500).send({
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
          });
        }
      }
    };
  };

  // Middleware to process profile picture
  const processProfilePicture = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      if (!request.isMultipart()) {
        return;
      }

      // Process the multipart form data
      const parts = await request.parts();
      let profilePictureFile: MultipartFile | null = null;
      const formData: Record<string, any> = {};

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "profilePicture") {
          // Store the profile picture file
          profilePictureFile = part;
          const buffer = await part.toBuffer();
          const fileObj = {
            fieldname: part.fieldname,
            originalname: part.filename || "profile.jpg",
            encoding: part.encoding,
            mimetype: part.mimetype,
            buffer: buffer,
            size: buffer.length,
          };

          try {
            const result = await uploadToR2(fileObj as any, "profilePictures");
            formData.profilePicture = result.url;
          } catch (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error("Failed to upload profile picture");
          }
        } else if (part.type === "field") {
          // Process form fields
          const fieldValue = await part.value;
          
          // Handle empty fields for optional profile data
          // Empty strings should be converted to undefined to remove the field
          const optionalFields = ['bio', 'phone', 'dateOfBirth', 'street', 'city'];
          
          if (optionalFields.includes(part.fieldname) && fieldValue === '') {
            // Set to undefined to remove the field completely
            formData[part.fieldname] = undefined;
          } else {
            formData[part.fieldname] = fieldValue;
          }
        }
      }

      // Attach the processed data to the request
      request.body = formData;
    } catch (error) {
      console.error("Profile picture processing error:", error);
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process profile picture",
      });
    }
  };

  const publicRoutes = ["/public-profile"];

  // Get user public details
  fastify.get(
    "/public-profile/:id",
    createFastifyHandler(getUserPublicDetails),
  );

  // Apply authentication to all routes below
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Check if the route starts with any public route
      const isPublic = publicRoutes.some((route) =>
        request.url.includes(route),
      );

      if (isPublic) {
        return; // skip authentication
      }

      await authenticate(request, reply);
    },
  );

  // Get user profile
  fastify.get("/profile", createFastifyHandler(getUserProfile));

  // Update profile (optional profile picture upload)
  fastify.put(
    "/profile",
    {
      preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
        if (request.isMultipart()) {
          await processProfilePicture(request, reply);
        }
      },
    },
    createFastifyHandler(updateProfile),
  );

  // Get user settings
  fastify.get("/settings", createFastifyHandler(getUserSettings));

  // Update settings
  fastify.post("/settings", createFastifyHandler(updateUserSettings));

  // Delete user account
  fastify.delete("/account", createFastifyHandler(deleteUser));

  // Get user's listings
  fastify.get("/listings", createFastifyHandler(getUserListings));
}
