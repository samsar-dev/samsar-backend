import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { MultipartAuthRequest } from "../types/auth";

// ✅ Fastify Middleware
export const auth = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new Error();

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      username: string;
      role: "USER" | "ADMIN";
    };

    (request as MultipartAuthRequest).user = decoded;
  } catch (error) {
    reply.code(401).send({
      success: false,
      error: "Please authenticate",
      status: 401,
      data: null,
    });
  }
};
