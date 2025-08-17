import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../src/lib/prismaClient.js";
import {
  createVerificationToken,
  sendVerificationEmail,
} from "../utils/email.utils.js";

// Resend verification email
export const resendVerification = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { email } = request.body as { email: string };

    if (!email) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email is required",
        },
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    if (user.emailVerified) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "EMAIL_ALREADY_VERIFIED",
          message: "Email is already verified",
        },
      });
    }

    // Generate new verification token and code
    const verificationInfo = await createVerificationToken(user.id);
    const emailSent = await sendVerificationEmail(user.email, verificationInfo);

    if (!emailSent) {
      return reply.code(500).send({
        success: false,
        error: {
          code: "EMAIL_SEND_FAILED",
          message: "Failed to send verification email",
        },
      });
    }

    return reply.code(200).send({
      success: true,
      data: {
        message: "Verification email sent successfully",
      },
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to resend verification email",
      },
    });
  }
};
