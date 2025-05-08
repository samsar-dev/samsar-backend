import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

// Define validation schemas using Zod
export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  )
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const ListingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number(),
  category: z.string()
});

// Type exports for TypeScript
export type RegisterBody = z.infer<typeof RegisterSchema>;
export type LoginBody = z.infer<typeof LoginSchema>;
export type ListingBody = z.infer<typeof ListingSchema>;

// Validation middleware
export const validate = async (
  request: FastifyRequest,
  reply: FastifyReply,
  schema: any
) => {
  try {
    // Validate request body against schema
    await schema.parseAsync(request.body);
    return true;
  } catch (error: any) {
    reply.code(400).send({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        errors: error.errors
      }
    });
    return false;
  }
};
