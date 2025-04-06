import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  JWT_SECRET: z.string().min(32, "JWT Secret must be at least 32 characters long"),
  JWT_EXPIRY: z.string().default("604800"), // 7 days in seconds
  REFRESH_TOKEN_EXPIRY: z.string().default("2592000"), // 30 days in seconds
  BCRYPT_SALT_ROUNDS: z.string().default("12"),
  CORS_ORIGIN: z.string().default("*"),
  // Cloudflare R2 config (optional)
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_BUCKET_NAME: z.string().optional(),
  CLOUDFLARE_ENDPOINT: z.string().url().optional(),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error("❌ Invalid environment variables:", 
    Object.entries(envParse.error.format())
      .filter(([key]) => key !== '_errors')
      .map(([key, value]) => `\n  ${key}: ${(value as any)._errors.join(', ')}`)
      .join('')
  );
  throw new Error("Invalid environment variables");
}

export const env = envParse.data;
