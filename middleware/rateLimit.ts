import { FastifyRequest, FastifyReply } from "fastify";
import rateLimitPlugin from "@fastify/rate-limit";

// Extend Fastify types
declare module "fastify" {
  interface FastifyRequest {
    rateLimit: () => Promise<{
      limit: number;
      current: number;
      remaining: number;
      ttl: number;
    }>;
  }
}

// Helper to create rate limit configs
const createRateLimitConfig = (overrides = {}) => {
  const defaultConfig = {
    // Default rate limiting (configurable via environment variables)
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
    ban: 5,
    // Generate key based on IP address
    keyGenerator: (req: FastifyRequest) => {
      const forwarded = req.headers["x-forwarded-for"];
      const ip = (
        Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded || req.socket.remoteAddress
      ) as string;
      return ip?.split(",")[0].trim() || "unknown-ip";
    },
    // Error response
    errorResponse: (req: FastifyRequest, context: any) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Rate limit exceeded, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
    }),
  };

  return { ...defaultConfig, ...overrides };
};

// Global rate limit config
export const rateLimitConfig = createRateLimitConfig();

// Stricter rate limiting for authentication endpoints
export const authRateLimit = createRateLimitConfig({
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10', 10),
  timeWindow: process.env.AUTH_RATE_LIMIT_WINDOW || '15 minutes',
  ban: 2,
  errorResponse: () => ({
    statusCode: 429,
    error: "Too Many Requests",
    message: "Too many login attempts, please try again later",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  }),
});

// Rate limiting middleware
export const rateLimit = (fastify: any) => {
  fastify.register(rateLimitPlugin, rateLimitConfig);
};

// Export plugin for direct usage
export { rateLimitPlugin };
