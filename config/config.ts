import { env } from "./env.js";

const jwtSecret = env.JWT_SECRET;

if (!jwtSecret) {
  console.warn("⚠️ JWT_SECRET is missing from environment variables.");
}

export const config = {
  jwtSecret: jwtSecret || "fallback-secret",
  cloudflare: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
    bucketName: env.CLOUDFLARE_BUCKET_NAME,
    endpoint: env.CLOUDFLARE_ENDPOINT,
  },
  database: {
    url: env.DATABASE_URL,
  },
  server: {
    port: env.PORT,
  },
};