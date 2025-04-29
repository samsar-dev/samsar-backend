import { FastifyInstance, FastifyRequest, FastifyReply, RouteOptions } from "fastify";
import {
  login,
  register,
  logout,
  getMe,
  refresh,
  verifyToken,
} from "../controllers/auth.controller.js";
import {
  validateRegistration,
  validate,
} from "../middleware/validation.middleware.js";
// To enable rate limiting, register @fastify/rate-limit in your Fastify server setup.
import { authenticate } from "../middleware/auth.js";

export default async function authRoutes(fastify: FastifyInstance) {
  // Wrapper for async controller functions
  const handler =
    (fn: any) => async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await fn(request, reply);
      } catch (error) {
        reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

  // Public routes
  const registerRouteOptions: RouteOptions = {
    preHandler: validate,
    method: "POST",
    url: "/register",
    handler: handler(register)
  };
  fastify.post("/register", registerRouteOptions);

  // If you want to enable per-route rate limiting, use Fastify's addHook or plugin options in your main server file.
  const loginRouteOptions: RouteOptions = {
    method: "POST",
    url: "/login",
    handler: handler(login)
  };
  fastify.post("/login", loginRouteOptions);

  fastify.post("/refresh", handler(refresh));

  // Token verification endpoint
  const verifyTokenRouteOptions: RouteOptions = {
    method: "GET",
    url: "/verify-token",
    handler: handler(verifyToken)
  };
  fastify.get("/verify-token", verifyTokenRouteOptions);

  // Protected routes
  const logoutRouteOptions: RouteOptions = {
    method: "POST",
    url: "/logout",
    preHandler: [authenticate],
    handler: handler(logout)
  };
  fastify.post("/logout", logoutRouteOptions);

  const getMeRouteOptions: RouteOptions = {
    method: "GET",
    url: "/me",
    preHandler: [authenticate],
    handler: handler(getMe)
  };
  fastify.get("/me", getMeRouteOptions);
}
