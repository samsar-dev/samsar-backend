import { FastifyInstance, FastifyPluginOptions } from "fastify";
import * as contactController from "../controllers/contact.controller.js";

export default async function contactRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  // Public route for submitting contact form
  fastify.post("/api/contact", contactController.submitContactForm);

  // Admin routes (protected)
  fastify.get("/api/admin/contact", contactController.getContactSubmissions);
  fastify.patch("/api/admin/contact/:id/read", contactController.markAsRead);

  return Promise.resolve();
}
