import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { MultipartAuthRequest, UserPayload } from "../types/auth";

// Fastify Middleware
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    // Allow public access to GET requests on listings if publicAccess parameter is true
    if (
      request.url.includes("/listings") &&
      request.method === "GET" &&
      (request.query as any)?.publicAccess === "true"
    ) {
      return;
    }

    // Try to get token from cookies first
    const cookies = request.headers.cookie;
    let token: string | undefined;

    if (cookies) {
      const cookieMatch = cookies.match(/jwt=([^;]+)/);
      if (cookieMatch) {
        token = decodeURIComponent(cookieMatch[1]);
      }
    }

    // If no token in cookies, try Authorization header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token) {
      // For non-listings routes or listing mutations, require authentication
      if (!request.url.includes("/listings") || request.method !== "GET") {
        reply.code(401).send({
          success: false,
          error: "Please authenticate",
          status: 401,
          data: null,
        });
        return;
      }
      return; // Allow public access to GET listings without token
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;

      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        reply.code(401).send({
          success: false,
          error: "Token expired",
          status: 401,
          data: null,
        });
        return;
      }

      (request as MultipartAuthRequest).user = decoded;
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      reply.code(401).send({
        success: false,
        error: "Invalid or expired token",
        status: 401,
        data: null,
      });
      return;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    // Only return 401 if this is not a public listings request
    if (
      !request.url.includes("/listings") ||
      (request.query as any)?.publicAccess !== "true" ||
      request.method !== "GET"
    ) {
      reply.code(401).send({
        success: false,
        error: error instanceof Error ? error.message : "Please authenticate",
        status: 401,
        data: null,
      });
    }
  }
};

// Export default as well for compatibility
export default authenticate;
