import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import prisma from "../src/lib/prismaClient.js";
import {
  login,
  register,
  logout,
  getMe,
  refresh,
  verifyToken,
  verifyEmailCode,
  sendPasswordChangeVerification,
  changePasswordWithVerification,
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
import { authRateLimit, rateLimitConfig, rateLimitPlugin } from "../middleware/rateLimit.js";

// Request type definitions
interface RegisterRequest extends FastifyRequest {
  body: RegisterBody;
}

interface LoginRequest extends FastifyRequest {
  body: LoginBody;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Apply global rate limiting to all auth routes
  fastify.register(rateLimitPlugin, rateLimitConfig);

  // Register route with schema validation and stricter rate limiting
  fastify.post<{ Body: RegisterBody }>(
    "/register",
    {
      config: {
        rateLimit: {
          ...authRateLimit,
          timeWindow: '1 hour', // 1 hour window for registration
          max: 5 // Only 5 registration attempts per hour
        }
      },
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

  // Login route with schema validation and rate limiting
  fastify.post<{ Body: LoginBody }>(
    "/login",
    {
      config: {
        rateLimit: {
          ...authRateLimit,
          timeWindow: '15 minutes',
          max: 10 // 10 login attempts per 15 minutes
        }
      },
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

  // Password reset request with rate limiting
  fastify.post(
    "/forgot-password",
    {
      config: {
        rateLimit: {
          ...authRateLimit,
          timeWindow: '1 hour',
          max: 3 // Only 3 password reset attempts per hour
        }
      },
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const isValid = await validate(request, reply, LoginSchema);
        if (!isValid) return reply;
      } catch (error: any) {
        reply.code(500).send({
          success: false,
          error: {
            code: "PASSWORD_RESET_ERROR",
            message: error.message || "Failed to reset password",
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

  // Logout route - no authentication required to allow logout with expired tokens
  fastify.post("/logout", logout);

  // Verify email with code route
  fastify.post(
    "/verify-email/code",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            code: { type: "string", minLength: 6, maxLength: 6 },
            email: { type: "string", format: "email" },
          },
          required: ["code", "email"],
        },
      },
    },
    verifyEmailCode,
  );

  // Send verification code for password change
  fastify.post(
    "/send-password-change-verification",
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
    sendPasswordChangeVerification,
  );

  // Change password with verification code
  fastify.post(
    "/change-password",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string", minLength: 8 },
            verificationCode: { type: "string", minLength: 6, maxLength: 6 },
            email: { type: "string", format: "email" },
          },
          oneOf: [
            {
              required: ["currentPassword", "newPassword", "verificationCode"],
              not: { required: ["email"] },
            },
            {
              required: ["email", "newPassword", "verificationCode"],
              not: { required: ["currentPassword"] },
            },
          ],
        },
      },
    },
    changePasswordWithVerification,
  );

  // Email verification with token
  fastify.get(
    "/verify-email",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            token: { type: "string" },
          },
          required: ["token"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { token } = request.query as { token: string };

        if (!token) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "MISSING_TOKEN",
              message: "Verification token is required",
            },
          });
        }

        // Find user by verification token
        const user = await prisma.user.findFirst({
          where: { verificationToken: token },
        });

        if (!user) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "INVALID_TOKEN",
              message: "Invalid or expired verification token",
            },
          });
        }

        // Check if token is expired
        if (
          user.verificationTokenExpires &&
          new Date() > user.verificationTokenExpires
        ) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "TOKEN_EXPIRED",
              message: "Verification token has expired",
            },
          });
        }

        // Check if already verified
        if (user.emailVerified) {
          return reply.status(200).send({
            success: true,
            message: "Email is already verified",
          });
        }

        // Update user as verified
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            verificationToken: null,
            verificationCode: null,
            verificationTokenExpires: null,
            lastVerifiedAt: new Date(),
            accountStatus: "ACTIVE", // Ensure account is activated
          } as any,
        });

        return reply.status(200).send({
          success: true,
          message: "Email verified successfully",
          data: {
            email: updatedUser.email,
            emailVerified: updatedUser.emailVerified,
          },
        });
      } catch (error) {
        console.error("Error verifying email with token:", error);
        return reply.status(500).send({
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to verify email. Please try again later.",
          },
        });
      }
    },
  );

  // Resend verification email with rate limiting
  fastify.post(
    "/resend-verification",
    {
      config: {
        rateLimit: {
          ...authRateLimit,
          timeWindow: '1 hour',
          max: 3 // Only 3 verification email requests per hour
        }
      },
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
