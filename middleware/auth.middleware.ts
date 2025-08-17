import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { UserPayload } from "../types/auth";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./session.middleware";

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
      const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
      console.log(`✅ Token decoded successfully - User ID: ${decoded.id}`);

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && now >= decoded.exp) {
        console.log(`❌ Token expired - now: ${now}, exp: ${decoded.exp}`);
        throw new Error("Token has expired");
      }

      // Attach user to request
      (request as any).user = decoded;
      console.log(`✅ User attached to request`);
    } catch (jwtError) {
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
