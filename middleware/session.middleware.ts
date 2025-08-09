import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { SignOptions, Secret } from "jsonwebtoken";

type JWTExpiresIn = "24h" | "7d" | number;

// Use environment variables for cookie names with fallbacks
export const SESSION_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "session_token";
export const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "refresh_token";

// Helper to append a cookie without overriding existing Set-Cookie headers
const appendSetCookie = (reply: FastifyReply, cookie: string) => {
  const existing = reply.raw.getHeader("Set-Cookie");
  console.log("📋 appendSetCookie called:", {
    cookiePreview: cookie.substring(0, 50) + "...",
    existingHeaders: existing,
  });

  if (!existing) {
    reply.raw.setHeader("Set-Cookie", cookie);
    console.log("✅ Set new Set-Cookie header");
  } else if (Array.isArray(existing)) {
    reply.raw.setHeader("Set-Cookie", [...existing, cookie]);
    console.log("✅ Appended to existing Set-Cookie array");
  } else {
    reply.raw.setHeader("Set-Cookie", [existing as string, cookie]);
    console.log("✅ Converted to array and appended");
  }

  console.log(
    "📋 Final Set-Cookie headers:",
    reply.raw.getHeader("Set-Cookie"),
  );
};

export const setSessionCookie = (
  reply: FastifyReply,
  token: string,
  maxAge: number,
) => {
  console.log("🔑 setSessionCookie called:", {
    tokenLength: token.length,
    maxAge,
    nodeEnv: process.env.NODE_ENV,
  });

  // Determine if we're actually in production based on environment
  const isActualProduction =
    process.env.NODE_ENV === "production" &&
    (process.env.RAILWAY_ENVIRONMENT === "production" ||
      process.env.VERCEL_ENV === "production" ||
      process.env.PRODUCTION === "true");

  const options = {
    path: "/",
    secure: isActualProduction,
    httponly: true,
    samesite: isActualProduction ? "None" : "Lax",
    "max-age": maxAge,
  } as const;

  console.log("🍪 Cookie options:", options);

  const cookie = `${SESSION_COOKIE_NAME}=${token}; ${Object.entries(options)
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([k, v]) => (typeof v === "boolean" ? k : `${k}=${v}`))
    .join("; ")}`;

  console.log("🍪 Generated session cookie:", cookie.substring(0, 100) + "...");
  appendSetCookie(reply, cookie);
  console.log("✅ Session cookie appended to response");
};

export const setRefreshCookie = (
  reply: FastifyReply,
  token: string,
  maxAge: number,
) => {
  console.log("🔄 setRefreshCookie called:", {
    tokenLength: token.length,
    maxAge,
    nodeEnv: process.env.NODE_ENV,
  });

  // Use same production detection logic
  const isActualProduction =
    process.env.NODE_ENV === "production" &&
    (process.env.RAILWAY_ENVIRONMENT === "production" ||
      process.env.VERCEL_ENV === "production" ||
      process.env.PRODUCTION === "true");

  const options = {
    path: "/auth/refresh",
    secure: isActualProduction,
    httponly: true,
    samesite: "None",
    "max-age": maxAge,
  } as const;

  console.log("🔄 Refresh cookie options:", options);

  const cookie = `${REFRESH_COOKIE_NAME}=${token}; ${Object.entries(options)
    .filter(([, v]) => v !== false && v !== undefined && v !== null)
    .map(([k, v]) => (typeof v === "boolean" ? k : `${k}=${v}`))
    .join("; ")}`;

  appendSetCookie(reply, cookie);
};

export const clearSessionCookies = (reply: FastifyReply) => {
  console.log("🧹 clearSessionCookies called");

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

  console.log("🧹 Clear session cookie options:", options);

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

  console.log("🧹 Clear refresh cookie options:", refreshOptions);

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
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const options: SignOptions = {
    expiresIn: typeof expiresIn === "number" ? expiresIn : expiresIn,
    algorithm: "HS256" as const,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

export const verifyToken = (token: string): any => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET) as { [key: string]: any };
  } catch (error) {
    throw error;
  }
};
