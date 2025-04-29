import { FastifyRequest } from "fastify";
import { UserPayload } from "./auth";

// Extend FastifyRequest with custom properties
declare module "fastify" {
  interface FastifyRequest {
    jwtUser?: UserPayload;
    user?: UserPayload;
    getUserInfo?(): UserPayload | undefined;
    setUserInfo?(user: UserPayload): void;
  }
}
