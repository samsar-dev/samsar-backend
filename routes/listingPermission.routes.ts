import { FastifyInstance, FastifyReply, FastifyRequest, RouteHandlerMethod } from "fastify";
import { authenticate } from "../middleware/auth.js";
import { getListingPermission } from "../controllers/listingPermission.controller.js";

// Import the AuthRequest type from your auth types
import type { AuthRequest } from "../types/auth.js";

// Define the response type
interface ListingPermissionResponse {
  canCreate: boolean;
  maxListings: number;
  currentListings: number;
  userRole: string;
  listingRestriction: string;
}

// Define the route options type
interface RouteOptions {
  method: 'GET';
  url: string;
  preHandler: any[];
  handler: RouteHandlerMethod;
  schema: {
    response: {
      200: {
        type: string;
        properties: {
          canCreate: { type: string };
          maxListings: { type: string };
          currentListings: { type: string };
          userRole: { type: string };
          listingRestriction: { type: string };
        };
      };
      500: {
        type: string;
        properties: {
          error: { type: string };
        };
      };
    };
  };
}

export default async function listingPermissionRoutes(
  fastify: FastifyInstance,
) {
  // Create the handler with proper type assertion
  const handler: RouteHandlerMethod = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await getListingPermission(request as unknown as AuthRequest, reply);
      return result;
    } catch (error) {
      request.log.error(error);
      throw error;
    }
  };

  // Define route options
  const routeOptions: RouteOptions = {
    method: 'GET',
    url: "/user/listing-permission",
    preHandler: [authenticate],
    handler,
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            canCreate: { type: 'boolean' },
            maxListings: { type: 'number' },
            currentListings: { type: 'number' },
            userRole: { type: 'string' },
            listingRestriction: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  };

  // Register the route
  fastify.route(routeOptions);
}
