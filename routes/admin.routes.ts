import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { authenticate, isAdmin } from "../middleware/auth.js";
import { getAllUsersAdmin, updateUserRoleAdmin } from "../controllers/user.controller.js";

export default async function adminRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  // List all users
  fastify.get(
    "/users",
    { preHandler: [authenticate, isAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return getAllUsersAdmin(request, reply);
    },
  );

  // Update user role
  fastify.put(
    "/users/:id/role",
    { preHandler: [authenticate, isAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return updateUserRoleAdmin(request as any, reply);
    },
  );

  return Promise.resolve();
}
