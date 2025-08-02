import { FastifyRequest, FastifyReply } from "fastify";

export default async function cacheControl(fastify: any, opts: any) {
  fastify.addHook(
    "onRequest",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { url, method } = request;

      // Apply only to safe, cacheable GET requests
      if (method === "GET") {
        // Cache static assets (JS, CSS, images, fonts) for 1 month (30 days)
        if (
          url.match(
            /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$/,
          ) ||
          url.startsWith("/uploads/") ||
          url.startsWith("/static/") ||
          url.startsWith("/assets/")
        ) {
          reply.header("Cache-Control", "public, max-age=2592000, immutable"); // 30 days
          reply.header(
            "Cloudflare-CDN-Cache-Control",
            "public, max-age=2592000",
          );
          reply.header("CDN-Cache-Control", "public, max-age=2592000");
        }

        // Cache listing images for 1 year (immutable = won't change)
        if (
          url.includes("/listings/") &&
          url.match(/\.(png|jpe?g|webp|svg)$/)
        ) {
          reply.header("Cache-Control", "public, max-age=31536000, immutable");
          reply.header(
            "Cloudflare-CDN-Cache-Control",
            "public, max-age=31536000",
          );
        }

        // Cache GET API data based on authentication status
        if (url.startsWith("/api/")) {
          // Check if user is authenticated
          const isAuthenticated = (request as any).user?.id;

          if (isAuthenticated) {
            // Private cache for authenticated users - no cache
            reply.header("Cache-Control", "private, no-store");
          } else {
            // Public cache for non-authenticated users - 5 minutes
            reply.header("Cache-Control", "public, max-age=300");
            reply.header("Cloudflare-CDN-Cache-Control", "public, max-age=300");
          }
        }

        // Cache Cloudflare beacon and analytics scripts for 1 month
        if (url.includes("cloudflare") || url.includes("beacon")) {
          reply.header("Cache-Control", "public, max-age=2592000"); // 30 days
          reply.header(
            "Cloudflare-CDN-Cache-Control",
            "public, max-age=2592000",
          );
        }
      }
    },
  );

  return;
}
