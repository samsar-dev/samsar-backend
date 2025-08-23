import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticate, isAdmin } from "../middleware/auth.js";
import {
  updateProfile,
  getUserProfile,
  getUserListings,
  getUserSettings,
  updateUserSettings,
  getUserPublicDetails,
  deleteUser,
  getAllUsersAdmin,
} from "../controllers/user.controller.js";
import {
  processImagesMiddleware,
} from "../middleware/upload.middleware.js";
import { uploadToR2 } from "../config/cloudflareR2.js";
import { MultipartFile } from "@fastify/multipart";
import prisma from "../src/lib/prismaClient.js";
import { deleteFromR2 } from "../config/cloudflareR2.js";

export default async function (fastify: FastifyInstance) {
  // Create Fastify-compatible handlers
  const createFastifyHandler = (controller: any) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Check if the controller is deleteUser to handle it specially
        if (controller.name === "deleteUser") {
          console.log("Handling delete user request");
        }

        await controller(request, reply);

        // Don't log success for delete operations as they've already sent a response
        if (!reply.sent && controller.name !== "deleteUser") {
          console.log("Operation completed successfully", controller.name);
        }
      } catch (error) {
        console.error(`Error in ${controller.name || "controller"}:`, error);

        // Only send error response if reply hasn't been sent yet
        if (!reply.sent) {
          reply.code(500).send({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
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

      // Get the authenticated user ID
      const userId = (request as any).user?.id;
      if (!userId) {
        throw new Error("User authentication required");
      }

      // Process the multipart form data
      const parts = await request.parts();
      let profilePictureFile: MultipartFile | null = null;
      const formData: Record<string, any> = {};
      let hasError = false;

      for await (const part of parts) {
        try {
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

            // First, get the current user to find the old profile picture
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { profilePicture: true },
            });

            // Upload the new profile picture
            const result = await uploadToR2(fileObj as any, "avatar", {
              userId,
              originalName: fileObj.originalname,
            });

            if (result && result.url) {
              console.log('✅ Profile picture uploaded successfully:', result.url);
              // Store the new URL in the form data
              formData.profilePicture = result.url;

              // If there was a previous profile picture, delete it
              if (user?.profilePicture) {
                try {
                  // Extract the key from the URL if it's a full URL
                  const url = new URL(user.profilePicture);
                  const key = url.pathname.substring(1); // Remove leading slash
                  await deleteFromR2(key);
                  console.log(`Deleted old profile picture: ${key}`);
                } catch (deleteError) {
                  console.error(
                    "Error deleting old profile picture:",
                    deleteError,
                  );
                  // Don't fail the request if deletion fails
                }
              }
            } else {
              throw new Error(
                "Failed to upload profile picture: No URL returned",
              );
            }
          } else if (part.type === "field") {
            // Process form fields
            const fieldValue = await part.value;

            // Handle empty fields for optional profile data
            // Empty strings should be converted to undefined to remove the field
            const optionalFields = [
              "bio",
              "phone",
              "dateOfBirth",
              "street",
              "city",
            ];

            if (optionalFields.includes(part.fieldname) && fieldValue === "") {
              // Set to undefined to remove the field completely
              formData[part.fieldname] = undefined;
            } else {
              formData[part.fieldname] = fieldValue;
            }
          }
        } catch (error) {
          console.error(
            `Error processing part ${part?.fieldname || "unknown"}:`,
            error,
          );
          hasError = true;
          // Continue processing other parts but mark that there was an error
        }
      }

      if (hasError) {
        throw new Error("Error processing one or more form fields");
      }

      console.log('📦 Final form data to attach to request:', formData);
      // Attach the processed data to the request
      request.body = formData;
    } catch (error) {
      console.error("Profile picture processing error:", error);
      reply.status(500).send({
        success: false,
        status: 500,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process profile picture",
        data: null,
      });
      // Make sure to return to prevent further processing
      return reply;
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

  // Get user profile (compression disabled for Flutter compatibility)
  fastify.get(
    "/profile", 
    {
      config: {
        compress: false // Disable compression for this route
      }
    },
    createFastifyHandler(getUserProfile)
  );

  // Update profile (optional profile picture upload, compression disabled for Flutter compatibility)
  fastify.put(
    "/profile",
    {
      config: {
        compress: false // Disable compression for this route
      },
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

  // (admin users list handled in separate admin.routes)
}
