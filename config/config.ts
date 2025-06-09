import { env } from "./env.js";

const jwtSecret = env.JWT_SECRET;

if (!jwtSecret) {
  console.warn("⚠️ JWT_SECRET is missing from environment variables.");
}

// Debug log environment variables
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  EMAIL_FROM: process.env.EMAIL_FROM,
  HAS_RESEND_API_KEY: !!process.env.RESEND_API_KEY
});

export const config = {
  jwtSecret: jwtSecret || "fallback-secret", // local fallback only
  cloudflare: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
    bucketName: env.CLOUDFLARE_BUCKET_NAME,
    endpoint: env.CLOUDFLARE_ENDPOINT,
  },
  database: {
    url: env.DATABASE_URL || "fallback-db-url", // optional
  },
  server: {
    port: env.PORT || "5000", // optional
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || env.EMAIL_FROM || 'noreply@samsar.app',
  },
};
