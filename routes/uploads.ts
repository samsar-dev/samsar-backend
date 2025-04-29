import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { upload } from "../middleware/upload.middleware.js";
import { uploadToR2, deleteFromR2 } from "../config/cloudflareR2.js";
import dotenv from "dotenv";
dotenv.config();

export default async function (fastify: FastifyInstance) {
  // Upload Image to Cloudflare R2
  fastify.post("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Note: Fastify file handling will need to be configured separately
      // This is a placeholder for the file upload handling
      const file = (request as any).file; // This will need proper Fastify multipart handling
      
      if (!file) {
        reply.code(400).send({ error: "No file uploaded" });
        return;
      }

      const body = request.body as any;
      const { category } = body; // Pass category from frontend ("avatar" or "listing")
      if (!category || (category !== "avatar" && category !== "listing")) {
        reply.code(400).send({ error: "Invalid category. Use 'avatar' or 'listing'." });
        return;
      }

      const result = await uploadToR2(file, category);
      reply.send({ imageUrl: result.url, key: result.key });
    } catch (error) {
      reply.code(500).send({
        error: "Image upload failed",
        details: (error as Error).message,
      });
    }
  });

  // DELETE Image from Cloudflare R2
  fastify.delete("/delete", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      const { key } = body;

      if (!key) {
        reply.code(400).send({ error: "No image key provided" });
        return;
      }

      await deleteFromR2(key);
      reply.send({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      reply.code(500).send({ 
        error: "Server error", 
        details: (error as Error).message 
      });
    }
  });
}
