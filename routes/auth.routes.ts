import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  login,
  register,
  logout,
  getMe,
  refresh,
  verifyToken,
  verifyEmailCode,
} from "../controllers/auth.controller.js";
import { resendVerification } from "../controllers/resend-verification.controller.js";
import {
  validate,
  RegisterSchema,
  LoginSchema,
  type RegisterBody,
  type LoginBody,
} from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.js";

// Request type definitions
interface RegisterRequest extends FastifyRequest {
  body: RegisterBody;
}

interface LoginRequest extends FastifyRequest {
  body: LoginBody;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Register route with schema validation
  fastify.post<{ Body: RegisterBody }>(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 2 },
            email: { type: "string", format: "email" },
            username: { type: "string", minLength: 3 },
            password: {
              type: "string",
              minLength: 8,
              pattern:
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$",
            },
          },
          required: ["name", "email", "username", "password"],
        },
      },
      preHandler: async (request: RegisterRequest, reply) => {
        const isValid = await validate(request, reply, RegisterSchema);
        if (!isValid) return reply;
      },
    },
    async (request, reply) => {
      try {
        await register(request, reply);
      } catch (error: any) {
        reply.code(500).send({
          success: false,
          error: {
            code: "REGISTRATION_ERROR",
            message: error.message || "Registration failed",
          },
        });
      }
    },
  );

  // Login route with schema validation
  fastify.post<{ Body: LoginBody }>(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
          required: ["email", "password"],
        },
      },
      preHandler: async (request: LoginRequest, reply) => {
        const isValid = await validate(request, reply, LoginSchema);
        if (!isValid) return reply;
      },
    },
    async (request, reply) => {
      try {
        await login(request, reply);
      } catch (error: any) {
        reply.code(401).send({
          success: false,
          error: {
            code: "LOGIN_ERROR",
            message: error.message || "Invalid credentials",
          },
        });
      }
    },
  );

  // Token refresh route
  fastify.post(
    "/refresh",
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        await refresh(request, reply);
      } catch (error: any) {
        reply.code(401).send({
          success: false,
          error: {
            code: "REFRESH_ERROR",
            message: error.message || "Token refresh failed",
          },
        });
      }
    },
  );

  // Token verification endpoint
  fastify.get(
    "/verify-token",
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        await verifyToken(request, reply);
      } catch (error: any) {
        reply.code(401).send({
          success: false,
          error: {
            code: "TOKEN_VERIFICATION_ERROR",
            message: error.message || "Token verification failed",
          },
        });
      }
    },
  );

  // Protected routes
  fastify.post("/logout", { preHandler: authenticate }, logout);

  // Verify email with code route
  fastify.post("/verify-email/code", {
    schema: {
      body: {
        type: "object",
        properties: {
          code: { type: "string", minLength: 6, maxLength: 6 },
          email: { type: "string", format: "email" }
        },
        required: ["code", "email"]
      }
    }
  }, verifyEmailCode);

  // Add resend verification route
  fastify.post(
    "/resend-verification",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
          },
          required: ["email"],
        },
      },
    },
    async (request, reply) => {
      try {
        await resendVerification(request, reply);
      } catch (error: any) {
        reply.code(500).send({
          success: false,
          error: {
            code: "EMAIL_VERIFICATION_ERROR",
            message: error.message || "Failed to resend verification email",
          },
        });
      }
    },
  );

  fastify.get(
    "/me",
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        await getMe(request, reply);
      } catch (error: any) {
        reply.code(500).send({
          success: false,
          error: {
            code: "PROFILE_ERROR",
            message: error.message || "Failed to get profile",
          },
        });
      }
    },
  );
}
