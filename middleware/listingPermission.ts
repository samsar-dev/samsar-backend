import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { UserRole } from "../types/auth.js";

const prisma = new PrismaClient();

interface UserWithListings {
  id: string;
  role: UserRole;
  maxListings: number | null;
  listingRestriction: string | null;
}

export const checkListingPermission = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // Skip permission check for non-authenticated users (they'll be caught by auth middleware)
    if (!request.user) {
      return;
    }

    const userId = request.user.id;
    const user = (await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        maxListings: true,
        listingRestriction: true,
      },
    })) as UserWithListings | null;

    if (!user) {
      reply.status(401).send({ error: "User not found" });
      return false;
    }

    const listingCount = await prisma.listing.count({
      where: { userId },
    });

    // Allow admins and moderators to bypass restrictions
    if (user.role === "ADMIN" || user.role === "MODERATOR") {
      return true;
    }

    // Check if user has reached their listing limit
    const maxAllowed = user.maxListings !== null ? user.maxListings : 1;
    if (listingCount >= maxAllowed) {
      reply.status(403).send({
        error: "Listing limit reached",
        code: "LISTING_LIMIT_REACHED",
        maxListings: maxAllowed,
        currentListings: listingCount,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking listing permission:", error);
    reply.status(500).send({ error: "Internal server error" });
    return false;
  }
};
