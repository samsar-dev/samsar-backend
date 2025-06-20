import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prismaClient.js";
import { env } from "../config/env.js";
import { AuthRequest, User, UserPayload, UserRole } from "../types/auth.js";
import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

// Export the JWTPayload type for use in other files
export type JWTPayload = UserPayload;

// Fastify types are now extended in types/fastify.d.ts
// This ensures consistent typing across the application



// Type guard to check if user is authenticated
function isAuthenticated(
  request: FastifyRequest
): request is FastifyRequest & { user: UserPayload } {
  return !!request.user && 
         'id' in request.user && 
         'email' in request.user && 
         'role' in request.user;
}

// Rate limiter options for Fastify
export const loginLimiterConfig = {
  max: env.NODE_ENV === "development" ? 100 : 5,
  timeWindow: env.NODE_ENV === "development" ? 1000 : 15 * 60 * 1000,
  errorResponseBuilder: () => ({
    success: false,
    error: {
      code: "RATE_LIMIT",
      message:
        env.NODE_ENV === "development"
          ? "Rate limit hit (development mode)"
          : "Too many login attempts, please try again later",
    },
  }),
};

// Auth middleware for Fastify
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // First check Authorization header
    let token: string | undefined;
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // If no token in header, check cookies as fallback
    if (!token) {
      token = request.cookies.jwt;
    }

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No token provided",
        },
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    ) as JWTPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        name: true,
        profilePicture: true,
        bio: true,
        location: true,
        city: true,
        dateOfBirth: true,
        street: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not found",
        },
      });
    }

    // If we get here, the token is valid
    // Attach the user to the request object
    (request as any).user = user;

    // Update last active timestamp
    try {
      if (user?.id) {
        await prismaClient.user.update({
          where: { id: user.id },
          data: { last_active_at: new Date() },
        });
      }
    } catch (error) {
      console.error('Error updating last_active_at:', error);
      // Don't fail the request if this update fails
    }

    // Set UserPayload for controllers that use req.user
    request.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      exp: decoded.exp,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return reply.code(401).send({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid token",
      },
    });
  }
};

// Role middleware for Fastify
export const isAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  // Ensure request has user property with correct type
  if (!isAuthenticated(request)) {
    return reply.status(401).send({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      },
    });
  }

  const user = request.user;
  if (user.role !== "ADMIN") {
    return reply.status(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Admin privileges required",
      },
    });
  }
};

// Listing ownership middleware for Fastify
export const isListingOwner = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // Ensure request has user property with correct type
    if (!isAuthenticated(request)) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        },
      });
    }

    const user = request.user;

    // Safely get listing ID with type assertion and default
    const listingId =
      request.params && typeof request.params === "object"
        ? (request.params as Record<string, string>).id
        : undefined;

    if (!listingId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Listing ID is required",
        },
      });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Listing not found",
        },
      });
    }

    if (listing.userId !== user.id && user.role !== "ADMIN") {
      return reply.status(403).send({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You don't have permission to modify this listing",
        },
      });
    }
  } catch (error) {
    console.error("isListingOwner middleware error:", error);
    return reply.status(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};
