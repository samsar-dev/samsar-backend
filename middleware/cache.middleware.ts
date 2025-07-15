import { FastifyRequest, FastifyReply } from 'fastify';

export default async function cacheControl(fastify: any, opts: any) {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const { url, method } = request;

    // Apply only to safe, cacheable GET requests
    if (method === 'GET') {
      // Cache listing images for 1 year (immutable = won't change)
      if (
        url.startsWith('/uploads/') ||
        (url.includes('/listings/') && url.match(/\.(png|jpe?g|webp|svg)$/))
      ) {
        reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      }

      // Cache GET API data based on authentication status
      if (url.startsWith('/api/')) {
        // Check if user is authenticated
        const isAuthenticated = (request as any).user?.id;
        
        if (isAuthenticated) {
          // Private cache for authenticated users
          reply.header('Cache-Control', 'private, no-store');
        } else {
          // Public cache for non-authenticated users
          reply.header('Cache-Control', 'public, max-age=300'); // 5 minutes
        }
      }
    }
  });

  return;
}
