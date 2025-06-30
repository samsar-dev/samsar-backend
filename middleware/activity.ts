import type {
  FastifyRequest,
  FastifyReply,
  HookHandlerDoneFunction,
} from "fastify";
import { PrismaClient } from "@prisma/client";

// This import ensures the Fastify type extensions are loaded
import type { UserPayload } from "../types/auth.js";

// Fastify types are extended in types/fastify.d.ts
// This ensures consistent typing across the application

const prisma = new PrismaClient();

/**
 * Middleware to update the user's last active timestamp
 */
export const updateLastActive = async (
  req: FastifyRequest,
  _reply: FastifyReply,
) => {
  try {
    // Only process if user is authenticated
    const userId = req.user?.id;
    if (!userId) {
      console.log("No user ID found in request");
      return;
    }

    const now = new Date();
    const timestamp = now.toISOString();
    console.log(`[${timestamp}] Updating last_active_at for user ${userId}`);

    try {
      // Update the timestamp using raw SQL
      const result = await prisma.$executeRaw`
        UPDATE "User" 
        SET "last_active_at" = ${timestamp}::timestamp 
        WHERE id = ${userId}
        RETURNING id, email, "last_active_at"
      `;

      console.log(`[${timestamp}] Update result for user ${userId}:`, result);

      // Verify the update
      const updatedUser = await prisma.$queryRaw`
        SELECT id, email, "last_active_at" 
        FROM "User" 
        WHERE id = ${userId}
      `;

      console.log(
        `[${timestamp}] Verified update for user ${userId}:`,
        updatedUser,
      );
    } catch (error) {
      console.error(
        `[${timestamp}] Error updating timestamp for user ${userId}:`,
        error,
      );
      // Don't rethrow the error to avoid breaking the request
    }

    console.log(
      `[${timestamp}] Successfully updated last_active_at for user ${userId}`,
    );
  } catch (error) {
    console.error("Unexpected error in updateLastActive:", error);
    // Don't throw to avoid breaking the request
  }
};

/**
 * Helper function to check if a user is currently online
 * @param lastActiveAt The last active timestamp from the database
 * @returns boolean indicating if the user is considered online
 */
export const isUserOnline = (lastActiveAt: Date | null): boolean => {
  if (!lastActiveAt) return false;
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return new Date(lastActiveAt) > fifteenMinutesAgo;
};
