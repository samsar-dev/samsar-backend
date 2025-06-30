import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prismaClient.js";
import { config } from "../config/config.js";

// Verify JWT token and check for admin role
const verifyAdminToken = (
  request: FastifyRequest,
  reply: FastifyReply,
): boolean => {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      reply.code(403).send({ error: "No token provided" });
      return false;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      reply.code(403).send({ error: "No token provided" });
      return false;
    }

    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      role: string;
    };

    // Check if user has admin role
    if (decoded.role !== "ADMIN") {
      reply.code(403).send({ error: "Admin access required" });
      return false;
    }

    // Attach user to request for further use if needed
    (request as any).user = decoded;
    return true;
  } catch (error) {
    console.error("Token verification error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      reply.code(401).send({ error: "Invalid token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      reply.code(401).send({ error: "Token expired" });
    } else {
      reply.code(500).send({ error: "Authentication failed" });
    }
    return false;
  }
};

type ContactFormData = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
};

export const submitContactForm = async (
  request: FastifyRequest<{ Body: ContactFormData }>,
  reply: FastifyReply,
) => {
  try {
    const { firstName, lastName, email, subject, message } = request.body;

    // Basic validation
    if (!firstName || !lastName || !email || !subject || !message) {
      return reply.status(400).send({ error: "All fields are required" });
    }

    // Email validation - using a simple regex that covers most cases
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.status(400).send({ error: "Invalid email format" });
    }

    // Save to database
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        subject,
        message,
      },
    });

    return { success: true, data: contact };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return reply.status(500).send({ error: "Failed to submit contact form" });
  }
};

export const getContactSubmissions = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // Verify admin access
  if (!verifyAdminToken(request, reply)) {
    return; // Response already handled by verifyAdminToken
  }

  try {
    const submissions = await prisma.contact.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: submissions };
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return reply
      .status(500)
      .send({ error: "Failed to fetch contact submissions" });
  }
};

export const markAsRead = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  // Verify admin access
  if (!verifyAdminToken(request, reply)) {
    return; // Response already handled by verifyAdminToken
  }

  try {
    const { id } = request.params;

    const updatedSubmission = await prisma.contact.update({
      where: { id },
      data: { read: true },
    });

    return { success: true, data: updatedSubmission };
  } catch (error) {
    console.error("Error marking submission as read:", error);
    return reply
      .status(500)
      .send({ error: "Failed to mark submission as read" });
  }
};
