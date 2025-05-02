export default async function cacheControl(fastify: any, opts: any, next: () => void) {
  fastify.addHook('onRequest', async (request, reply) => {
    const { url, method } = request;

    // Apply only to safe, cacheable GET requests
    if (method !== 'GET') return;

    // Cache listing images for 1 year (immutable = won't change)
    if (url.startsWith('/uploads/') || url.includes('/listings/') && url.match(/\.(png|jpe?g|webp|svg)$/)) {
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Cache GET API data for 5 minutes
    if (url.startsWith('/api/') && !url.includes('/auth')) {
      reply.header('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
  });

  next();
}
