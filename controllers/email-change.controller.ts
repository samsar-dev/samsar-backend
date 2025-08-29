import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../src/lib/prismaClient.js";
import { sendVerificationEmail as sendEmail } from "../utils/email.temp.utils.js";

// Send verification code for email change
export const sendEmailChangeVerification = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { newEmail } = request.body as { newEmail: string };
    const userId = (request as any).user?.sub;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!newEmail || !newEmail.trim()) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "New email is required",
        },
      });
    }

    const email = newEmail.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_EMAIL_FORMAT",
          message: "Invalid email format",
        },
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Check if new email is same as current
    if (user.email === email) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "SAME_EMAIL",
          message: "New email cannot be the same as current email",
        },
      });
    }

    // Check if new email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email is already registered",
        },
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code with expiry (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store the new email in the bio field temporarily (we'll use this as a workaround)
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationToken: verificationCode,
        verificationTokenExpires: expiresAt,
        // Store new email in location field temporarily as workaround
        location: `EMAIL_CHANGE:${email}`,
      },
    });

    // Send verification email to NEW email address
    const verificationInfo = {
      token: verificationCode,
      code: verificationCode
    };
    const emailSent = await sendEmail(email, verificationInfo);

    if (!emailSent) {
      return reply.status(500).send({
        success: false,
        error: {
          code: "EMAIL_SEND_FAILED",
          message: "Failed to send verification email",
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Verification code sent to new email address",
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to send verification code",
      },
    });
  }
};

// Change email with verification code
export const changeEmailWithVerification = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { verificationCode } = request.body as {
      verificationCode: string;
    };
    const userId = (request as any).user?.sub;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!verificationCode || !verificationCode.trim()) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_CODE",
          message: "Verification code is required",
        },
      });
    }

    // Find user with verification code
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Check if verification code matches
    if (user.verificationToken !== verificationCode.trim()) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_CODE",
          message: "Invalid verification code",
        },
      });
    }

    // Check if verification code has expired
    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "CODE_EXPIRED",
          message: "Verification code has expired",
        },
      });
    }

    // Extract pending email from location field
    if (!user.location || !user.location.startsWith("EMAIL_CHANGE:")) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "NO_PENDING_EMAIL",
          message: "No pending email change found",
        },
      });
    }

    const newEmail = user.location.replace("EMAIL_CHANGE:", "");

    // Check if new email is still available
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Email is already registered",
        },
      });
    }

    // Update email and clear verification data
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        location: null, // Clear the temporary storage
        verificationToken: null,
        verificationTokenExpires: null,
        emailVerified: true,
        updatedAt: new Date(),
      },
    });

    return reply.status(200).send({
      success: true,
      message: "Email changed successfully",
      newEmail: newEmail,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to change email",
      },
    });
  }
};
