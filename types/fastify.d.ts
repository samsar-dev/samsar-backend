import { FastifyRequest } from "fastify";
import { UserPayload } from "./auth";

// Extend FastifyRequest with custom properties
declare module "fastify" {
  interface FastifyRequest {
    user?: UserPayload;
  }
}
