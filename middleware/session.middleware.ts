import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { SignOptions, Secret } from "jsonwebtoken";
import prisma from "../src/lib/prismaClient.js";

type JWTExpiresIn = "24h" | "7d" | number;

export const SESSION_COOKIE_NAME = "session_token";
export const REFRESH_COOKIE_NAME = "refresh_token";

// Helper to append a cookie without overriding existing Set-Cookie headers
const appendSetCookie = (reply: FastifyReply, cookie: string) => {
  const existing = reply.raw.getHeader("Set-Cookie");

  if (!existing) {
    reply.raw.setHeader("Set-Cookie", cookie);

  } else if (Array.isArray(existing)) {
    reply.raw.setHeader("Set-Cookie", [...existing, cookie]);

  } else {
    reply.raw.setHeader("Set-Cookie", [existing as string, cookie]);

  }

};

export const setSessionCookie = (
  reply: FastifyReply,
  token: string,
  maxAge: number,
) => {
  // Session cookie being set

  // Debug environment variables for production detection


  // Determine if we're actually in production based on environment
  const isActualProduction =
    process.env.NODE_ENV === "production" &&
    (process.env.RAILWAY_ENVIRONMENT === "production" ||
      process.env.VERCEL_ENV === "production" ||
      process.env.PRODUCTION === "true");



  const options = {
    path: "/",
    domain: isActualProduction ? undefined : "localhost", // Set domain for development
    secure: isActualProduction,
    httponly: true,
    samesite: isActualProduction ? "None" : "Lax",
    "max-age": maxAge,
  } as const;



  const cookie = `${SESSION_COOKIE_NAME}=${token}; ${Object.entries(options)
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([k, v]) => (typeof v === "boolean" ? k : `${k}=${v}`))
    .join("; ")}`;


  appendSetCookie(reply, cookie);

};

export const setRefreshCookie = (
  reply: FastifyReply,
  token: string,
  maxAge: number,
) => {
  // Setting refresh cookie

  // Use same production detection logic
  const isActualProduction =
    process.env.NODE_ENV === "production" &&
    (process.env.RAILWAY_ENVIRONMENT === "production" ||
      process.env.VERCEL_ENV === "production" ||
      process.env.PRODUCTION === "true");



  const options = {
    path: "/auth/refresh",
    domain: isActualProduction ? undefined : "localhost", // Set domain for development
    secure: isActualProduction,
    httponly: true,
    samesite: isActualProduction ? "None" : "Lax", // Use Lax for development
    "max-age": maxAge,
  } as const;



  const cookie = `${REFRESH_COOKIE_NAME}=${token}; ${Object.entries(options)
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([k, v]) => (typeof v === "boolean" ? k : `${k}=${v}`))
    .join("; ")}`;

  appendSetCookie(reply, cookie);
};

export const clearSessionCookies = (reply: FastifyReply) => {


  // Use same production detection logic
  const isActualProduction =
    process.env.NODE_ENV === "production" &&
    (process.env.RAILWAY_ENVIRONMENT === "production" ||
      process.env.VERCEL_ENV === "production" ||
      process.env.PRODUCTION === "true");

  const options = {
    path: "/",
    httponly: true,
    secure: isActualProduction,
    samesite: isActualProduction ? "None" : "Lax",
  };



  // Clear session cookie
  const sessionCookie = `${SESSION_COOKIE_NAME}=; Max-Age=0; ${Object.entries(
    options,
  )
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([k, v]) => (typeof v === "boolean" ? k : `${k}=${v}`))
    .join("; ")}`;

  appendSetCookie(reply, sessionCookie);

  // Clear refresh cookie
  const refreshOptions = {
    Path: "/auth/refresh",
    HttpOnly: true,
    Secure: isActualProduction,
    SameSite: "Lax",
    ...(isActualProduction && { Domain: ".samsar.app" }),
  };



  const refreshCookie = `${REFRESH_COOKIE_NAME}=; Max-Age=0; ${Object.entries(
    refreshOptions,
  )
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([k, v]) => (typeof v === "boolean" ? k : `${k}=${v}`))
    .join("; ")}`;

  appendSetCookie(reply, refreshCookie);
};

export const generateToken = (
  payload: any,
  expiresIn: JWTExpiresIn,
): string => {
  const options: SignOptions = {
    expiresIn: typeof expiresIn === "number" ? expiresIn : expiresIn,
    algorithm: "HS256" as const,
  };
  const secret: Secret = config.jwtSecret;
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      [key: string]: any;
    };
    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Session invalidation utilities for security and user management
 */

/**
 * Invalidates all sessions for a specific user
 * This should be called when:
 * - User is deleted
 * - User account is suspended
 * - Security breach is detected
 * - User requests to logout from all devices
 */
export const invalidateAllUserSessions = async (userId: string): Promise<void> => {
  try {
    console.log(`🔒 Invalidating all sessions for user: ${userId}`);
    
    // Clear all refresh tokens for the user
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "refreshToken" = null, 
          "refreshTokenExpiresAt" = null
      WHERE id = ${userId}
    `;
    
    console.log(`✅ Successfully invalidated all sessions for user: ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to invalidate sessions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Invalidates sessions for multiple users (bulk operation)
 * Useful for admin operations or security incidents
 */
export const invalidateMultipleUserSessions = async (userIds: string[]): Promise<void> => {
  try {
    console.log(`🔒 Invalidating sessions for ${userIds.length} users`);
    
    // Clear refresh tokens for multiple users
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "refreshToken" = null, 
          "refreshTokenExpiresAt" = null
      WHERE id = ANY(${userIds})
    `;
    
    console.log(`✅ Successfully invalidated sessions for ${userIds.length} users`);
  } catch (error) {
    console.error(`❌ Failed to invalidate sessions for users:`, error);
    throw error;
  }
};

/**
 * Checks if a user's session should be invalidated based on security policies
 */
export const shouldInvalidateUserSession = async (userId: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailVerified: true,
        // @ts-ignore - accountStatus exists in the Prisma schema
        accountStatus: true,
      },
    });

    if (!user) {
      console.log(`❌ User ${userId} not found - session should be invalidated`);
      return true;
    }

    if (user.accountStatus !== "ACTIVE") {
      console.log(`❌ User ${userId} account not active - session should be invalidated`);
      return true;
    }

    if (!user.emailVerified) {
      console.log(`❌ User ${userId} email not verified - session should be invalidated`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error checking session validity for user ${userId}:`, error);
    // On error, err on the side of caution and invalidate
    return true;
  }
};

/**
 * Cleanup expired refresh tokens (maintenance function)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    console.log('🧹 Cleaning up expired refresh tokens...');
    
    const result = await prisma.$executeRaw`
      UPDATE "User" 
      SET "refreshToken" = null, 
          "refreshTokenExpiresAt" = null
      WHERE "refreshTokenExpiresAt" < NOW()
        AND "refreshToken" IS NOT NULL
    `;
    
    console.log(`✅ Cleaned up expired tokens for ${result} users`);
    return result as number;
  } catch (error) {
    console.error('❌ Failed to cleanup expired tokens:', error);
    throw error;
  }
};
