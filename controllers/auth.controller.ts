import { FastifyRequest, FastifyReply } from "fastify";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../src/lib/prismaClient.js";
import { env } from "../config/env.js";

// Add to the imports
import { verify } from "jsonwebtoken";

// Define JWT user interface
interface JWTUser {
  sub: string;
  email?: string;
  username?: string;
  role?: "USER" | "ADMIN";
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const generateTokens = (user: {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
}): AuthTokens => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Get current timestamp
  const CurrentDate = new Date();
  const now = Math.floor(CurrentDate.getTime() / 1000);

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      type: "access",
      iat: now,
      exp: now + 60 * 15, // 15 minutes in seconds
    },
    jwtSecret
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: "refresh",
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days in seconds
    },
    jwtSecret
  );

  return { accessToken, refreshToken };
};

// Register a New User
export const register = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // TODO: Add Fastify schema validation here
    // If validation fails, reply.code(400).send({ ... })
    // Handle both multipart form data and JSON
    let email, password, name;
    if (request.headers["content-type"]?.includes("multipart/form-data")) {
      const data = await request.file();
      if (!data?.fields) {
        throw new Error("No form data received");
      }
      // Extract form data from multipart fields
      const formData: Record<string, string> = {};
      for (const [key, field] of Object.entries(data.fields)) {
        const fieldValue = Array.isArray(field) ? field[0] : field;
        if (
          fieldValue &&
          typeof fieldValue === "object" &&
          "value" in fieldValue
        ) {
          formData[key] = String(fieldValue.value);
        }
      }
      if (!formData.email || !formData.password || !formData.name) {
        return reply.code(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email, password, and name are required",
          },
        });
      }
      email = formData.email;
      password = formData.password;
      name = formData.name;
    } else {
      const body = request.body as any;
      email = body.email;
      password = body.password;
      name = body.name;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "USER_EXISTS",
          message: "User already exists with this email",
        },
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: email.split("@")[0], // Use email prefix as default username
        password: hashedPassword,
        name,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        phone: true,
        profilePicture: true,
        bio: true,
        dateOfBirth: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens with the actual user ID
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Update user with the correct refresh token
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Using raw SQL to update the user with the refresh token
    // This is a workaround for the Prisma type issues
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "refreshToken" = ${tokens.refreshToken}, 
          "refreshTokenExpiresAt" = ${expiryDate}
      WHERE id = ${user.id}
    `;

    return reply.code(201).send({
      success: true,
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to register user",
      },
    });
  }
};

// Login User
export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = request.body as {
    email: string;
    password: string;
  };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePicture: true,
        bio: true,
        dateOfBirth: true,
        password: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    // Generate JWT tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Store refresh token in user using raw SQL
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.$executeRaw`
      UPDATE "User" 
      SET "refreshToken" = ${tokens.refreshToken}, 
          "refreshTokenExpiresAt" = ${expiryDate}
      WHERE id = ${user.id}
    `;

    return reply
      .setCookie("jwt", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })
      .send({
        success: true,
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
  } catch (error) {
    console.error("Login error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred during login",
      },
    });
  }
};

// Get Authenticated User Info
export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Get the user from the request
    const user = request.user;
    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userId = user.id;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        role: true,
        name: true,
        profilePicture: true,
        bio: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existingUser) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not found",
        },
      });
    }

    return reply.send({
      success: true,
      data: existingUser,
    });
  } catch (error) {
    console.error("Get me error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An error occurred fetching user profile",
      },
    });
  }
};

// Refresh Token
export const verifyToken = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "TOKEN_MISSING",
          message: "No token provided",
        },
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JWTUser;
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "User not found",
          },
        });
      }

      return reply.send({
        success: true,
        data: { valid: true },
      });
    } catch (error) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token is invalid or expired",
        },
      });
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

export const refresh = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { refreshToken } = request.body as { refreshToken: string };

    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET as string
    ) as JWTUser;

    // Find the user with matching refresh token
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        profilePicture: true,
        bio: true,
        dateOfBirth: true,
        username: true,
        role: true,
        refreshToken: true,
        refreshTokenExpiresAt: true,
      },
    });

    if (!user || user.refreshToken !== refreshToken) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid refresh token",
        },
      });
    }

    // Check if refresh token has expired
    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Refresh token has expired",
        },
      });
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Update user with new refresh token
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "refreshToken" = ${tokens.refreshToken}, 
          "refreshTokenExpiresAt" = ${expiryDate}
      WHERE id = ${user.id}
    `;

    return reply.send({
      success: true,
      data: {
        tokens,
      },
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return reply.code(401).send({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid refresh token",
      },
    });
  }
};

// Logout
export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      });
    }

    // Clear refresh token
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "refreshToken" = null, 
          "refreshTokenExpiresAt" = null
      WHERE id = ${request.user.id}
    `;

    // Clear the JWT cookie
    reply.clearCookie("jwt", { path: "/" });

    return reply.send({
      success: true,
      data: {
        message: "Successfully logged out",
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to logout",
      },
    });
  }
};
