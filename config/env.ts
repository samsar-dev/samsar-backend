import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  JWT_SECRET: z.string().min(32, "JWT Secret must be at least 32 characters long"),
  JWT_EXPIRY: z.string().default("604800"),
  REFRESH_TOKEN_EXPIRY: z.string().default("2592000"),
  BCRYPT_SALT_ROUNDS: z.string().default("12"),
  CORS_ORIGIN: z.string().default("*"),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error("❌ Invalid environment variables:", 
    Object.entries(envParse.error.format())
      .filter(([key]) => key !== '_errors')
      .map(([key, value]) => `\n  ${key}: ${(value as any)._errors.join(', ')}`)
      .join('')
  );
  console.error("⚠️ Using default values for missing environment variables");
}

export const env = envParse.success ? envParse.data : {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: process.env.PORT || "3000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key",
  JWT_EXPIRY: "604800",
  REFRESH_TOKEN_EXPIRY: "2592000",
  BCRYPT_SALT_ROUNDS: "12",
  CORS_ORIGIN: "*"
};