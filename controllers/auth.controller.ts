import { FastifyRequest, FastifyReply } from "fastify";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../src/lib/prismaClient.js";
// NOTE: Use Fastify's built-in schema validation or a plugin instead of express-validator
import { env } from "../config/env.js";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const generateTokens = (userId: string): AuthTokens => {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const accessTokenOptions: SignOptions = {
    expiresIn: "15m",
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: "7d",
  };

  const accessToken = jwt.sign({ id: userId }, jwtSecret, accessTokenOptions);
  const refreshToken = jwt.sign({ id: userId }, jwtSecret, refreshTokenOptions);

  return { accessToken, refreshToken };
};

// Register a New User
export const register = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // TODO: Add Fastify schema validation here
    // If validation fails, reply.code(400).send({ ... })
    const { email, password, name } = (request.body as any);

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
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens(user.id);

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
  try {
    const { email, password } = (request.body as any);

    // TODO: Add Fastify schema validation here
    if (!email || !password) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid credentials",
        },
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid credentials",
        },
      });
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Return user data (excluding password)
    const { password: _, ...userData } = user;

    return reply.send({
      success: true,
      data: {
        user: userData,
        tokens,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to login",
      },
    });
  }
};

// Refresh Token
export const refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { refreshToken } = (request.body as any);

    if (!refreshToken) {
      return reply.code(400).send({
        success: false,
        error: {
          code: "NO_TOKEN",
          message: "Refresh token is required",
        },
      });
    }

    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    try {
      const decoded = jwt.verify(refreshToken, jwtSecret) as { id: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid refresh token",
          },
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user.id);

      return reply.send({
        success: true,
        data: {
          user,
          tokens,
        },
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return reply.code(401).send({
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Refresh token has expired",
          },
        });
      }

      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid refresh token",
        },
      });
    }
  } catch (error) {
    console.error("Token refresh error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to refresh token",
      },
    });
  }
};

// Logout User
export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Since we're using JWT, we don't need to do anything server-side
    // The client should remove the tokens
    return reply.send({
      success: true,
      data: {
        message: "Logged out successfully",
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

// Get Authenticated User Info
export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // @ts-ignore: Assume user is attached by Fastify auth decorator
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        },
      });
    }

    // @ts-ignore: Assume user is attached by Fastify auth decorator
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      });
    }

    return reply.send({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user info error:", error);
    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to get user info",
      },
    });
  }
};
