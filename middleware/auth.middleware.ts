import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { UserPayload } from "../types/auth";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./session.middleware";
import prisma from "../src/lib/prismaClient.js";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  { path: "/listings", method: "GET" },
  { path: "/auth/login", method: "POST" },
  { path: "/auth/register", method: "POST" },
  { path: "/auth/refresh", method: "POST" },
];

// Helper to check if route is public
const isPublicRoute = (path: string, method: string): boolean => {
  return PUBLIC_ROUTES.some(
    (route) => path.includes(route.path) && method === route.method,
  );
};

// Helper to extract token from request
const extractToken = (request: FastifyRequest): string | null => {
  // Try Authorization header first
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try session cookie next
  const cookies = request.headers.cookie;
  if (cookies) {
    const match = cookies.match(`${SESSION_COOKIE_NAME}=([^;]+)`);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
};

// Fastify Middleware
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    console.log(`🔐 Auth middleware - ${request.method} ${request.url}`);
    
    // Check if route is public
    if (isPublicRoute(request.url, request.method)) {
      console.log(`✅ Public route, skipping auth`);
      return;
    }

    // Get token
    const token = extractToken(request);
    console.log(`🔑 Token extracted: ${token ? `${token.substring(0, 20)}...` : 'null'}`);
    
    if (!token) {
      console.log(`❌ No token provided`);
      throw new Error("No authentication token provided");
    }

    try {
      // Verify token
      console.log(`🔍 Verifying token with secret: ${config.jwtSecret ? 'present' : 'missing'}`);
      console.log(`🔍 Token to verify: ${token}`);
      const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
      console.log(`✅ Token decoded successfully:`, decoded);
      console.log(`✅ User ID from token: ${decoded.sub || decoded.id}`);

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && now >= decoded.exp) {
        console.log(`❌ Token expired - now: ${now}, exp: ${decoded.exp}`);
        throw new Error("Token has expired");
      }

      // CRITICAL: Verify user still exists in database
      const userId = decoded.sub || decoded.id;
      if (!userId) {
        console.log(`❌ No user ID in token`);
        throw new Error("Invalid token payload");
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          // @ts-ignore - accountStatus exists in the Prisma schema
          accountStatus: true,
          emailVerified: true,
        },
      });

      if (!existingUser) {
        console.log(`❌ User ${userId} not found in database - token invalid`);
        throw new Error("User no longer exists");
      }

      // Check if account is active
      if (existingUser.accountStatus !== "ACTIVE") {
        console.log(`❌ User ${userId} account not active: ${existingUser.accountStatus}`);
        throw new Error("Account is not active");
      }

      // Check if email is verified
      if (!existingUser.emailVerified) {
        console.log(`❌ User ${userId} email not verified`);
        throw new Error("Email not verified");
      }

      // Attach user to request with fresh data from database
      (request as any).user = {
        ...decoded,
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        role: existingUser.role,
      };
      console.log(`✅ User attached to request:`, (request as any).user);
    } catch (jwtError) {
      console.log(`❌ JWT Verification Error:`, jwtError);
      // Handle specific JWT errors
      if (jwtError instanceof jwt.TokenExpiredError) {
        reply.code(401).send({
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Authentication token has expired",
          },
        });
        return;
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        reply.code(401).send({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid authentication token",
          },
        });
        return;
      }

      // Generic JWT error
      throw jwtError;
    }
  } catch (error) {
    // Handle all other errors
    reply.code(401).send({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message:
          error instanceof Error ? error.message : "Authentication failed",
      },
    });
  }
};

// Export default as well for compatibility
export default authenticate;
