import { FastifyRequest, FastifyReply } from "fastify";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../src/lib/prismaClient.js";
import { Prisma } from "@prisma/client";
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
    jwtSecret,
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: "refresh",
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days in seconds
    },
    jwtSecret,
  );

  return { accessToken, refreshToken };
};

// Register a New User
export const register = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // Get client IP for rate limiting
    const clientIp = request.ip || "unknown";

    // Initialize auth attempts for this IP if not exists
    if (!authAttempts.has(clientIp)) {
      authAttempts.set(clientIp, {
        loginCount: 0,
        registrationCount: 0,
        lastLoginAttempt: new Date(0),
        lastRegistrationAttempt: new Date(0),
      });
    }

    // Get current attempts
    const attempts = authAttempts.get(clientIp)!;

    // Check for registration rate limiting
    const timeSinceLastRegistration =
      Date.now() - attempts.lastRegistrationAttempt.getTime();

    // Check if too many registrations in a short period
    if (
      attempts.registrationCount >= AUTH_RATE_LIMITS.REGISTRATION_MAX_ATTEMPTS
    ) {
      const timeElapsed =
        Date.now() - attempts.lastRegistrationAttempt.getTime();

      if (timeElapsed < AUTH_RATE_LIMITS.COOLDOWN_PERIOD_MS) {
        const remainingTime = Math.ceil(
          (AUTH_RATE_LIMITS.COOLDOWN_PERIOD_MS - timeElapsed) / 60000,
        ); // minutes
        return reply.code(429).send({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Too many registration attempts. Please try again in ${remainingTime} minutes.`,
            retryAfter: new Date(
              Date.now() + (AUTH_RATE_LIMITS.COOLDOWN_PERIOD_MS - timeElapsed),
            ),
          },
        });
      } else {
        // Reset counter after cooldown period
        attempts.registrationCount = 0;
      }
    }

    // Check for throttling (minimum time between registrations)
    if (timeSinceLastRegistration < AUTH_RATE_LIMITS.REGISTRATION_THROTTLE_MS) {
      const waitTime = Math.ceil(
        (AUTH_RATE_LIMITS.REGISTRATION_THROTTLE_MS -
          timeSinceLastRegistration) /
          1000,
      );
      return reply.code(429).send({
        success: false,
        error: {
          code: "THROTTLED",
          message: `Please wait ${waitTime} seconds before trying to register again.`,
          retryAfter: new Date(
            Date.now() +
              (AUTH_RATE_LIMITS.REGISTRATION_THROTTLE_MS -
                timeSinceLastRegistration),
          ),
        },
      });
    }

    // Update registration attempt timestamp
    attempts.lastRegistrationAttempt = new Date();
    attempts.registrationCount += 1;
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

// Define extended user type with security fields
interface UserWithSecurity {
  id: string;
  email: string;
  username: string;
  password: string;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
  // Optional fields that may not exist in the database yet
  name?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  location?: string | null;
  // Security fields
  failedLoginAttempts: number;
  lastFailedLogin: Date | null;
  lastLoginAt: Date | null;
  accountLocked: boolean;
  accountLockedUntil: Date | null;
}

// Track authentication attempts (both login and registration)
const authAttempts = new Map<
  string,
  {
    loginCount: number;
    registrationCount: number;
    lastLoginAttempt: Date;
    lastRegistrationAttempt: Date;
  }
>();

// Rate limiting configuration
const AUTH_RATE_LIMITS = {
  LOGIN_MAX_ATTEMPTS: 5,
  REGISTRATION_MAX_ATTEMPTS: 3,
  COOLDOWN_PERIOD_MS: 15 * 60 * 1000, // 15 minutes
  REGISTRATION_THROTTLE_MS: 30 * 1000, // 30 seconds between registrations
};

// Login User with enhanced security
export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  // Get client IP for rate limiting
  const clientIp = request.ip || "unknown";

  // Initialize auth attempts for this IP if not exists
  if (!authAttempts.has(clientIp)) {
    authAttempts.set(clientIp, {
      loginCount: 0,
      registrationCount: 0,
      lastLoginAttempt: new Date(0),
      lastRegistrationAttempt: new Date(0),
    });
  }

  // Get current attempts
  const attempts = authAttempts.get(clientIp)!;

  // Check for too many failed login attempts from this IP
  if (attempts.loginCount >= AUTH_RATE_LIMITS.LOGIN_MAX_ATTEMPTS) {
    // Check if we're still in cooldown period
    const timeElapsed = Date.now() - attempts.lastLoginAttempt.getTime();

    if (timeElapsed < AUTH_RATE_LIMITS.COOLDOWN_PERIOD_MS) {
      const remainingTime = Math.ceil(
        (AUTH_RATE_LIMITS.COOLDOWN_PERIOD_MS - timeElapsed) / 60000,
      ); // minutes
      return reply.code(429).send({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many failed login attempts. Please try again in ${remainingTime} minutes.`,
          retryAfter: new Date(
            Date.now() + (AUTH_RATE_LIMITS.COOLDOWN_PERIOD_MS - timeElapsed),
          ),
        },
      });
    } else {
      // Reset counter after cooldown period
      attempts.loginCount = 0;
    }
  }

  const { email, password } = request.body as {
    email: string;
    password: string;
  };

  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Add a small delay to prevent timing attacks (helps hide if an email exists or not)
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );

    // Find the user by email - only select fields that definitely exist in the database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    // Create a security interface with default values since the fields don't exist in DB yet
    const userWithSecurity: UserWithSecurity | null = user
      ? {
          ...user,
          failedLoginAttempts: 0, // Default values since fields don't exist yet
          lastFailedLogin: null,
          lastLoginAt: null,
          accountLocked: false,
          accountLockedUntil: null,
        }
      : null;

    // Check if account is locked
    if (userWithSecurity?.accountLocked) {
      const now = new Date();
      if (
        userWithSecurity.accountLockedUntil &&
        userWithSecurity.accountLockedUntil > now
      ) {
        const minutesRemaining = Math.ceil(
          (userWithSecurity.accountLockedUntil.getTime() - now.getTime()) /
            60000,
        );
        return reply.code(401).send({
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: `Account is temporarily locked. Please try again in ${minutesRemaining} minutes.`,
            lockedUntil: userWithSecurity.accountLockedUntil,
          },
        });
      } else {
        // Skip unlocking account since security fields don't exist in DB yet
        // We'll implement this after migration
      }
    }

    // User not found - return generic error but track the attempt
    if (!user) {
      // Record failed attempt for this IP
      const currentAttempts = authAttempts.get(clientIp)!;
      currentAttempts.loginCount += 1;
      currentAttempts.lastLoginAttempt = new Date();

      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Record failed attempt for this IP
      const currentAttempts = authAttempts.get(clientIp)!;
      currentAttempts.loginCount += 1;
      currentAttempts.lastLoginAttempt = new Date();

      // Skip updating failed login attempts since security fields don't exist in DB yet
      // We'll track this in memory for now
      const failedAttempts = (userWithSecurity?.failedLoginAttempts || 0) + 1;

      // Just log the attempt for now
      console.log(
        `Failed login attempt for user ${user.email}. Count: ${failedAttempts}`,
      );

      // We'll implement account locking after migration

      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    // Skip resetting failed login attempts since security fields don't exist in DB yet
    // We'll implement this after migration
    console.log(
      `Successful login for user ${user.email}. Would reset security fields here.`,
    );

    // Reset login attempts counter for this IP on successful login
    const currentAttempts = authAttempts.get(clientIp)!;
    currentAttempts.loginCount = 0;

    // Generate JWT tokens with enhanced security
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

    // Log successful login for audit purposes
    console.log(
      `User ${user.id} (${user.email}) logged in successfully from IP ${clientIp}`,
    );

    return reply
      .setCookie("jwt", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // Enhanced from 'lax' to 'strict' for better security
        path: "/",
        maxAge: 60 * 15, // 15 minutes in seconds, matching token expiry
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
        message: "An error occurred during login. Please try again later.",
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
        username: true,
        role: true,
        name: true,
        profilePicture: true,
        bio: true,
        location: true,
        createdAt: true,
        updatedAt: true,
        // Additional profile fields
        phone: true,
        dateOfBirth: true,
        street: true,
        city: true,
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
  reply: FastifyReply,
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
        process.env.JWT_SECRET as string,
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
      process.env.JWT_SECRET as string,
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
