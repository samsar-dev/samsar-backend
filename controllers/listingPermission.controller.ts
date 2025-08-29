import { FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types/auth.js";

const prisma = new PrismaClient();

interface UserWithListings {
  id: string;
  role: "FREE_USER" | "PREMIUM_USER" | "BUSINESS_USER" | "ADMIN" | "MODERATOR";
  maxListings: number | null;
  listingRestriction: string | null;
}

export const getListingPermission = async (
  request: AuthRequest,
  reply: FastifyReply,
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ error: "Unauthorized" });
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
      return reply.status(404).send({ error: "User not found" });
    }

    const listingCount = await prisma.listing.count({
      where: { userId },
    });

    // Temporarily allowing all users to create listings regardless of their role or listing count
    return {
      canCreate: true, // Always allow listing creation
      maxListings: user.maxListings || 1,
      currentListings: listingCount,
      userRole: user.role,
      listingRestriction: "NONE", // Temporarily removing all restrictions
    };
  } catch (error) {
    return reply.status(500).send({ error: "Internal server error" });
  }
};
