import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_BUCKET_NAME: z.string().optional(),
  CLOUDFLARE_ENDPOINT: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  JWT_SECRET: z.string().optional().default("fallback-jwt-secret-key"),
  JWT_EXPIRY: z.string().default("604800"),
  REFRESH_TOKEN_EXPIRY: z.string().default("2592000"),
  BCRYPT_SALT_ROUNDS: z.string().default("12"),
  CORS_ORIGIN: z.string().default("*"),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error(
    "❌ Invalid environment variables:",
    Object.entries(envParse.error.format())
      .filter(([key]) => key !== "_errors")
      .map(([key, value]) => `\n  ${key}: ${(value as any)._errors.join(", ")}`)
      .join(""),
  );
  console.warn("⚠️ Using default values for missing environment variables");
}

// Use process.env directly with fallbacks
export const env = {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: process.env.PORT || "3000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_EXPIRY: process.env.JWT_EXPIRY || "604800",
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "2592000",
  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || "12",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  CLOUDFLARE_BUCKET_NAME: process.env.CLOUDFLARE_BUCKET_NAME,
  CLOUDFLARE_ENDPOINT: process.env.CLOUDFLARE_ENDPOINT,
};
