import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prismaClient.js";
import { env } from "../config/env.js";
import { AuthRequest, User } from "../types/auth.js";

// Add JWT payload type
interface JWTPayload {
  id: string;
  exp: number;
}

// Extend FastifyRequest with optional user property
declare module 'fastify' {
  interface FastifyRequest {
    getUserInfo?(): User | undefined;
    setUserInfo?(user: User): void;
  }
}

// Type guard for AuthRequest with more precise type checking
function hasUser(request: FastifyRequest): request is FastifyRequest & { getUserInfo(): User } {
  return request.getUserInfo !== undefined 
    && typeof request.getUserInfo === 'function';
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
  reply: FastifyReply
) => {
  // Add user info methods if not already present
  if (!request.getUserInfo) {
    let userInfo: User | undefined;
    
    request.getUserInfo = () => userInfo;
    request.setUserInfo = (user: User) => {
      userInfo = user;
    };
  }

  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No token provided",
        },
      });
    }

    const token = authHeader.split(" ")[1];
    const jwtSecret = env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          email: true, 
          username: true,
          role: true 
        },
      });

      if (!user) {
        return reply.status(401).send({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not found",
          },
        });
      }

      // Explicitly type the user object
      const authUser: User = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      };

      // Use setUserInfo method to attach user
      request.setUserInfo?.(authUser);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return reply.status(401).send({
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Token has expired",
          },
        });
      }

      return reply.status(401).send({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid token",
        },
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return reply.status(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

// Role middleware for Fastify
export const isAdmin = async (
  request: FastifyRequest, 
  reply: FastifyReply
) => {
  // Ensure request has user property with correct type
  if (!hasUser(request)) {
    return reply.status(401).send({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  }

  const user = request.getUserInfo();
  if (!user || user.role !== "ADMIN") {
    return reply.status(403).send({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Admin access required",
      },
    });
  }
};

// Listing ownership middleware for Fastify
export const isListingOwner = async (
  request: FastifyRequest, 
  reply: FastifyReply
) => {
  try {
    // Ensure request has user property with correct type
    if (!hasUser(request)) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const user = request.getUserInfo();
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Safely get listing ID with type assertion and default
    const listingId = request.params && typeof request.params === 'object' 
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