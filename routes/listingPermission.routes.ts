import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getListingPermission } from '../controllers/listingPermission.controller.js';

export default async function listingPermissionRoutes(fastify: FastifyInstance) {
  // Get listing creation permission
  fastify.get('/user/listing-permission', {
    preHandler: [authenticate],
    handler: getListingPermission
  });
}
