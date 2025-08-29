import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  createVerificationToken,
  sendVerificationEmail,
  verifyEmail,
} from "../../utils/email.temp.utils";
import prisma from "../../src/lib/prismaClient";

// Extended User type with verification fields
interface UserWithVerification {
  id: string;
  email: string;
  username: string;
  emailVerified?: boolean;
  lastVerifiedAt?: Date | null;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  [key: string]: any; // Allow other properties
}

interface VerifyEmailParams {
  token: string;
}


interface VerifyEmailWithCodeParams {
  code: string;
  email: string;
}

export default async function (fastify: FastifyInstance) {
  // Verify email endpoint with token (via URL)
  fastify.get<{ Querystring: VerifyEmailParams }>(
    "/verify-email",
    async (request, reply) => {
      try {
        const { token } = request.query;

        if (!token) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "INVALID_TOKEN",
              message: "Verification token is required",
            },
          });
        }

        const verified = await verifyEmail(token);

        if (!verified) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "INVALID_TOKEN",
              message: "Invalid or expired verification token",
            },
          });
        }

        return reply.code(200).send({
          success: true,
          message: "Email verified successfully",
        });
      } catch (error) {
        console.error("Error verifying email:", error);
        return reply.code(500).send({
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to verify email",
          },
        });
      }
    },
  );

  // Verify email with code (via POST)
  fastify.post<{ Body: VerifyEmailWithCodeParams }>(
    "/verify-email/code",
    async (request, reply) => {
      try {
        const { code, email } = request.body;

        if (!code || !email) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "INVALID_INPUT",
              message: "Verification code and email are required",
            },
          });
        }

        // Find user by email first
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            verificationToken: true,
            // @ts-ignore - verificationCode exists in the Prisma schema
            verificationCode: true,
            verificationTokenExpires: true,
          },
        });

        if (!user) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User not found with this email",
            },
          });
        }

        // Verify with the code
        const verified = await verifyEmail("", code);

        if (!verified) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "INVALID_CODE",
              message: "Invalid or expired verification code",
            },
          });
        }

        return reply.code(200).send({
          success: true,
          message: "Email verified successfully",
        });
      } catch (error) {
        console.error("Error verifying email with code:", error);
        return reply.code(500).send({
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "An error occurred while verifying your email",
          },
        });
      }
    },
  );

  // Resend verification email endpoint 
  fastify.post<{ Body: { email: string } }>(
    "/resend-verification",
    async (request, reply) => {
      try {
        const { email } = request.body;

        if (!email) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "MISSING_EMAIL",
              message: "Email is required",
            },
          });
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Return success even if user doesn't exist to prevent email enumeration
          return reply.code(200).send({
            success: true,
            message:
              "If your email exists in our system, a verification email has been sent",
          });
        }

        // Check if user is already verified and verification is recent
        // Use raw SQL to check verification status
        const verificationData = await prisma.$queryRaw<UserWithVerification[]>`
        SELECT "emailVerified", "lastVerifiedAt"
        FROM "User"
        WHERE id = ${user.id}
        LIMIT 1
      `;

        const verificationStatus =
          verificationData && verificationData.length > 0
            ? verificationData[0]
            : null;

        if (
          verificationStatus?.emailVerified &&
          verificationStatus?.lastVerifiedAt
        ) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          if (verificationStatus.lastVerifiedAt > sevenDaysAgo) {
            return reply.code(200).send({
              success: true,
              message: "Your email is already verified",
            });
          }
        }

        // Generate new verification token
        const token = await createVerificationToken(user.id);

        // Send verification email
        await sendVerificationEmail(user.email, token);

        return reply.code(200).send({
          success: true,
          message:
            "If your email exists in our system, a verification email has been sent",
        });
      } catch (error) {
        console.error("Error resending verification email:", error);
        return reply.code(500).send({
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to resend verification email",
          },
        });
      }
    },
  );
}
