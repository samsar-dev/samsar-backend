import { FastifyInstance } from 'fastify';
import { diagnosticController } from '../controllers/diagnostic.controller.js';

export default async function diagnosticRoutes(fastify: FastifyInstance) {
  // Health check - accessible without authentication
  fastify.get('/health', diagnosticController.health);
  
  // Detailed headers for debugging - accessible without authentication
  fastify.get('/diagnostic-headers', diagnosticController.headers);
  
  // Syria-specific test endpoint
  fastify.get('/syria-test', diagnosticController.syriaTest);
  
  // Provider connectivity test
  fastify.get('/provider-test', diagnosticController.providerTest);
}
