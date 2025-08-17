import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import prisma from "../src/lib/prismaClient.js";
import { sendPasswordChangeEmail } from "../utils/passwordEmail.utils.js";
// Email utilities
import {
  createVerificationToken as verifyTokenTemp,
  sendVerificationEmail as sendEmail,
  sendUserLoginEmail,
} from "../utils/email.temp.utils.js";
// Session management
import {
  setSessionCookie,
  setRefreshCookie,
  clearSessionCookies,
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "../middleware/session.middleware.js";

// Define JWT user interface
interface JWTUser {
  sub: string;
  email?: string;
  username?: string;
  role?: "FREE_USER" | "PREMIUM_USER" | "BUSINESS_USER" | "ADMIN" | "MODERATOR";
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Enhanced token generation with security options
const generateTokens = (user: {
  id: string;
  email: string;
  username: string;
  role: "FREE_USER" | "PREMIUM_USER" | "BUSINESS_USER" | "ADMIN" | "MODERATOR";
}): AuthTokens => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Get current timestamp
  const CurrentDate = new Date();
  const now = Math.floor(CurrentDate.getTime() / 1000);

  // Access token with 30-day expiry
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      type: "access",
      iat: now,
      exp: now + 60 * 60 * 24 * 30, // 30 days in seconds
    },
    jwtSecret,
    {
      algorithm: "HS256",
      audience: "samsar-app",
      issuer: "samsar-api",
    },
  );

  // Refresh token with 60-day expiry
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: "refresh",
      iat: now,
      exp: now + 60 * 60 * 24 * 60, // 60 days in seconds
    },
    jwtSecret,
    {
      algorithm: "HS256",
      audience: "samsar-app",
      issuer: "samsar-api",
    },
  );

  // Set secure, httpOnly cookie with SameSite=None and Secure flags for production
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : ("lax" as const),
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    path: "/",
  };

  // In your login/register response, you'll need to set this cookie
  // Example: reply.setCookie('jwt', refreshToken, cookieOptions);

  return { accessToken, refreshToken };
};

// Register a New User - Updated with smart registration flow
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
      select: {
        id: true,
        email: true,
        emailVerified: true,
        // @ts-ignore - accountStatus exists in the Prisma schema
        accountStatus: true,
        verificationTokenExpires: true,
        createdAt: true,
      },
    });

    if (existingUser) {
      // If user is already verified and active, they cannot register again
      if (existingUser.emailVerified && existingUser.accountStatus === "ACTIVE") {
        return reply.code(400).send({
          success: false,
          error: {
            code: "USER_ALREADY_VERIFIED",
            message: "An account with this email is already verified. Please log in instead.",
          },
        });
      }

      // If user exists but is pending verification, allow fresh re-registration with rate limiting
      if (existingUser.accountStatus === "PENDING" && !existingUser.emailVerified) {
        // Check if enough time has passed since last registration attempt (1 minute)
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        if (existingUser.createdAt > oneMinuteAgo) {
          const remainingTime = Math.ceil((existingUser.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000);
          return reply.code(429).send({
            success: false,
            error: {
              code: "REGISTRATION_RATE_LIMITED",
              message: `Please wait ${remainingTime} seconds before requesting a new verification code.`,
              retryAfter: remainingTime,
            },
          });
        }

        // Delete the existing pending user to allow fresh registration
        try {
          await prisma.user.delete({
            where: { id: existingUser.id },
          });
          console.log(`Deleted pending user with email: ${existingUser.email} for fresh re-registration`);
        } catch (deleteError) {
          console.error("Failed to delete pending user:", deleteError);
          return reply.code(500).send({
            success: false,
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to process re-registration. Please try again.",
            },
          });
        }

        // Continue with normal registration flow below (user will be created fresh)
      } else {
        // For any other case (shouldn't happen, but safety check)
        return reply.code(400).send({
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "User already exists with this email",
          },
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with verification fields and set account status to 'PENDING'
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: email.split("@")[0], // Use email prefix as default username
        password: hashedPassword,
        name,
        role: "FREE_USER",
        emailVerified: false,
        // Add account status to indicate pending verification
        // @ts-ignore - accountStatus exists in the Prisma schema
        accountStatus: "PENDING",
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

    // Generate verification token and send verification email
    try {
      // Using temporary email utilities
      const verificationInfo = await verifyTokenTemp(user.id);
      const emailSent = await sendEmail(user.email, verificationInfo);

      if (!emailSent) {
        // If email sending fails, delete the user and return an error
        await prisma.user.delete({
          where: { id: user.id },
        });

        return reply.code(500).send({
          success: false,
          error: {
            code: "EMAIL_SEND_FAILED",
            message: "Failed to send verification email. Please try again.",
          },
        });
      }

      console.log(`Verification email sent to ${user.email}`);

      // Respond success without generating tokens until email is verified
      return reply.code(201).send({
        success: true,
        message:
          "Registration successful. Please check your email to verify your account before logging in.",
      });
    } catch (emailError) {
      // If verification process fails, delete the user and return an error
      await prisma.user.delete({
        where: { id: user.id },
      });

      console.error("Failed to send verification email:", emailError);
      return reply.code(500).send({
        success: false,
        error: {
          code: "EMAIL_SEND_FAILED",
          message: "Failed to send verification email. Please try again.",
        },
      });
    }

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

    // Set session cookies using middleware
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      path: "/",
      domain: isProduction ? ".samsar.app" : undefined,
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
    } as const;

    // Set access token cookie
    setSessionCookie(reply, tokens.accessToken, 15 * 60);
    // Set refresh token cookie
    setRefreshCookie(reply, tokens.refreshToken, 7 * 24 * 60 * 60);

    // // Still return tokens in response for backward compatibility
    // return reply.code(201).send({
    //   success: true,
    //   data: {
    //     user,
    //     tokens,
    //     message:
    //       "Registration successful. Please check your email for verification instructions.",
    //   },
    // });
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
  role: "FREE_USER" | "PREMIUM_USER" | "BUSINESS_USER" | "ADMIN" | "MODERATOR";
  createdAt: Date;
  updatedAt: Date;
  name?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  location?: string | null;
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
  LOGIN_MAX_ATTEMPTS: 10,
  REGISTRATION_MAX_ATTEMPTS: 10,
  COOLDOWN_PERIOD_MS: 5 * 60 * 1000, // 5 minutes
  REGISTRATION_THROTTLE_MS: 3 * 1000, // 3 seconds between registrations
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
    // ?
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
        street: true,
        city: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        allowMessaging: true,
        listingNotifications: true,
        messageNotifications: true,
        loginNotifications: true,
        showEmail: true,
        showOnlineStatus: true,
        showPhoneNumber: true,
        privateProfile: true,
        emailVerified: true,
        // @ts-ignore - accountStatus exists in the Prisma schema
        accountStatus: true,
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

    // Enforce email verification before allowing login
    if (user && !user.emailVerified) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "EMAIL_NOT_VERIFIED",
          message:
            "Please verify your email before logging in. Check your inbox for a verification email or request a new one.",
        },
      });
    }

    // Enforce account status check
    // @ts-ignore - accountStatus exists in the Prisma schema
    if (user && user.accountStatus === "PENDING") {
      return reply.code(401).send({
        success: false,
        error: {
          code: "ACCOUNT_PENDING",
          message:
            "Your account is pending email verification. Please check your inbox for a verification email.",
        },
      });
    }

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

    // Get full user data including verification status
    const fullUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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
        street: true,
        city: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        allowMessaging: true,
        listingNotifications: true,
        messageNotifications: true,
        loginNotifications: true,
        showEmail: true,
        showOnlineStatus: true,
        showPhoneNumber: true,
        privateProfile: true,
        emailVerified: true,
        // @ts-ignore - accountStatus exists in the Prisma schema
        accountStatus: true,
      },
    });

    if (!fullUser) {
      return reply.code(404).send({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "Invalid email or password",
        },
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, fullUser.password);
    if (!isValidPassword) {
      return reply.code(401).send({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    // Generate tokens
    const tokens = generateTokens({
      id: fullUser.id,
      email: fullUser.email,
      username: fullUser.username,
      role: fullUser.role,
    });

    // Periodic verification check removed
    // Users no longer need to re-verify their email periodically

    // Store refresh token in user
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.user.update({
      where: { id: fullUser.id },
      data: {
        refreshToken: tokens.refreshToken,
        refreshTokenExpiresAt: expiryDate,
      },
    });

    // Reset login attempts counter for this IP on successful login
    const currentAttempts = authAttempts.get(clientIp)!;
    currentAttempts.loginCount = 0;

    // Log successful login for audit purposes
    console.log(
      `User ${fullUser.id} (${fullUser.email}) logged in successfully from IP ${clientIp}`,
    );

    // Set session cookies using our middleware
    console.log("🍪 Setting session cookies for user:", fullUser.id);
    console.log("🔑 Access token length:", tokens.accessToken.length);
    console.log("🔄 Refresh token length:", tokens.refreshToken.length);

    setSessionCookie(reply, tokens.accessToken, 15 * 60); // 15 minutes
    setRefreshCookie(reply, tokens.refreshToken, 7 * 24 * 60 * 60); // 7 days

    console.log("✅ Session cookies set successfully");
    console.log(
      "📋 Response headers after setting cookies:",
      reply.raw.getHeaders(),
    );

    if (fullUser.loginNotifications)
      sendUserLoginEmail({
        name: fullUser.name,
        username: fullUser.username,
        email: fullUser.email,
      });

    return reply.code(200).send({
      success: true,
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        user: {
          id: fullUser.id,
          email: fullUser.email,
          username: fullUser.username,
          role: fullUser.role,
          createdAt: fullUser.createdAt,
          updatedAt: fullUser.updatedAt,
          phone: fullUser.phone,
          profilePicture: fullUser.profilePicture,
          bio: fullUser.bio,
          name: fullUser.name,
          dateOfBirth: fullUser.dateOfBirth,
          street: fullUser.street,
          city: fullUser.city,

          // Settings related fields
          allowMessaging: fullUser.allowMessaging,
          listingNotifications: fullUser.listingNotifications,
          messageNotifications: fullUser.messageNotifications,
          loginNotifications: fullUser.loginNotifications,
          showEmail: fullUser.showEmail,
          showOnlineStatus: fullUser.showOnlineStatus,
          showPhoneNumber: fullUser.showPhoneNumber,
          privateProfile: fullUser.privateProfile,
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
        allowMessaging: true,
        listingNotifications: true,
        messageNotifications: true,
        showEmail: true,
        showOnlineStatus: true,
        showPhoneNumber: true,
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

// Verify Token
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

    // Update user with new refresh token (60-day expiry)
    const refreshTokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "refreshToken" = ${tokens.refreshToken}, 
          "refreshTokenExpiresAt" = ${refreshTokenExpiry}
      WHERE "id" = ${user.id}
    `;

    // Set session cookies using middleware
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      path: "/",
      domain: isProduction ? ".samsar.app" : undefined,
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
    } as const;

    // Set access token cookie
    setSessionCookie(reply, tokens.accessToken, 15 * 60);
    // Set refresh token cookie
    setRefreshCookie(reply, tokens.refreshToken, 7 * 24 * 60 * 60);

    return reply.send({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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
    console.log("🚪 Logout request received", {
      hasUser: !!request.user,
      cookies: request.cookies,
      headers: {
        authorization: request.headers.authorization,
        cookie: request.headers.cookie,
      },
    });

    // If user is authenticated, clear their refresh token from database
    if (request.user) {
      try {
        await prisma.$executeRaw`
          UPDATE "User" 
          SET "refreshToken" = null, 
              "refreshTokenExpiresAt" = null
          WHERE id = ${request.user.id}
        `;
        console.log("✅ Cleared refresh token for user:", request.user.id);
      } catch (dbError) {
        console.error("❌ Error clearing refresh token:", dbError);
        // Don't fail logout if database update fails
      }
    }

    // Always clear session cookies, even if user is not authenticated
    // This handles cases where cookies exist but are invalid/expired
    clearSessionCookies(reply);
    console.log("✅ Session cookies cleared");

    return reply.send({
      success: true,
      data: {
        message: "Successfully logged out",
      },
    });
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, try to clear cookies
    try {
      clearSessionCookies(reply);
    } catch (cookieError) {
      console.error(
        "Error clearing cookies during error handling:",
        cookieError,
      );
    }

    return reply.code(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to logout",
      },
    });
  }
};

// Verify Email with Code
export const verifyEmailCode = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { code } = request.body as { code: string };
    const { email } = request.body as { email: string };

    if (!code || !email) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Verification code and email are required",
        },
      });
    }

    // Find user by email
    const user = (await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationToken: true,
        verificationCode: true,
        verificationTokenExpires: true,
      },
    })) as {
      id: string;
      email: string;
      emailVerified: boolean | null;
      verificationToken: string | null;
      verificationCode: string | null;
      verificationTokenExpires: Date | null;
    };

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    if (user.emailVerified) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "ALREADY_VERIFIED",
          message: "Email is already verified",
        },
      });
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_CODE",
          message: "Invalid verification code",
        },
      });
    }

    if (
      user.verificationTokenExpires &&
      new Date() > user.verificationTokenExpires
    ) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "CODE_EXPIRED",
          message: "Verification code has expired",
        },
      });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationToken: null,
        verificationTokenExpires: null,
        lastVerifiedAt: new Date(),
        accountStatus: "ACTIVE", // activate account after successful code verification
      } as any,
    });

    return reply.status(200).send({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Error verifying email code:", error);
    return reply.status(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to verify email",
      },
    });
  }
};

// Send verification code for password change
export const sendPasswordChangeVerification = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // Get email from request body
    const { email } = request.body as { email: string };

    if (!email) {
      return reply.status(400).send({
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
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "No account found with this email",
        },
      });
    }

    // Generate a verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // Store the verification code in the database
    await prisma.user.update({
      where: { email },
      data: {
        verificationCode,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send password change verification email
    const emailSent = await sendPasswordChangeEmail(email, verificationCode);

    if (!emailSent) {
      return reply.status(500).send({
        success: false,
        error: {
          code: "EMAIL_SEND_FAILED",
          message: "Failed to send verification email. Please try again later.",
        },
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Error sending password change verification:", error);
    return reply.status(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to send verification email",
      },
    });
  }
};

// Change password with verification code
export const changePasswordWithVerification = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // Get request body
    const { currentPassword, newPassword, verificationCode, email } =
      request.body as {
        currentPassword?: string;
        newPassword: string;
        verificationCode: string;
        email?: string;
      };

    let userToUpdate;

    // Check if this is a password reset (unauthenticated) or password change (authenticated)
    if (email) {
      // Password reset flow - find user by email and verification code
      userToUpdate = await prisma.user.findFirst({
        where: {
          email,
          verificationCode,
        },
      });
    } else {
      // Password change flow - find user by ID and verification code
      const authenticatedUser = request.user as { id: string; email: string };
      if (!authenticatedUser?.id) {
        return reply.status(401).send({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to change your password",
          },
        });
      }

      userToUpdate = await prisma.user.findFirst({
        where: {
          id: authenticatedUser.id,
          verificationCode,
        },
      });

      // For authenticated users, verify current password
      if (userToUpdate && currentPassword) {
        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          userToUpdate.password,
        );

        if (!isPasswordValid) {
          return reply.status(400).send({
            success: false,
            error: {
              code: "INVALID_PASSWORD",
              message: "Current password is incorrect",
            },
          });
        }
      }
    }

    if (!userToUpdate || !userToUpdate.verificationCode) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "INVALID_CODE",
          message: "Invalid verification code",
        },
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password, clear verification code, and mark as verified
    await prisma.user.update({
      where: { id: userToUpdate.id },
      data: {
        password: hashedPassword,
        verificationCode: null,
        emailVerified: true,
        accountStatus: "ACTIVE",
        updatedAt: new Date(), // Use updatedAt to track password change time
      },
    });

    return reply.status(200).send({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password with verification:", error);
    return reply.status(500).send({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to change password",
      },
    });
  }
};
