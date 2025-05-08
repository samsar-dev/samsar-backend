import { FastifyRequest, FastifyReply } from "fastify";

// Define validation schemas compatible with Fastify
export const RegisterSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' },
    username: { type: 'string', minLength: 3 },
    password: {
      type: 'string',
      minLength: 8,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,}$'
    }
  },
  required: ['name', 'email', 'username', 'password']
};

export const LoginSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string' }
  },
  required: ['email', 'password']
};

export const ListingSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 3 },
    description: { type: 'string', minLength: 10 },
    price: { type: 'number' },
    category: { type: 'string' }
  },
  required: ['title', 'description', 'price', 'category']
};

// Type definitions for TypeScript
export interface RegisterBody {
  name: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ListingBody {
  title: string;
  description: string;
  price: number;
  category: string;
}

// Custom validation error interface for better error reporting
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

// Validation middleware with enhanced error handling
export const validate = async (
  request: FastifyRequest,
  reply: FastifyReply,
  schema: any
) => {
  try {
    // Check if request body exists
    if (!request.body) {
      throw new Error('Missing request body');
    }

    // Fastify automatically validates against the schema
    // This is just an additional check for specific validations
    const body = request.body as Record<string, any>;
    const errors: ValidationErrorDetail[] = [];

    // Perform custom validations if needed
    if (schema === RegisterSchema && body.email) {
      // Additional email validation beyond format
      if (body.email.includes('admin') || body.email.includes('root')) {
        errors.push({
          field: 'email',
          message: 'Email contains reserved terms',
          value: body.email
        });
      }

      // Check for common disposable email domains
      const disposableDomains = ['tempmail.com', 'throwaway.com', 'mailinator.com'];
      const domain = body.email.split('@')[1];
      if (domain && disposableDomains.includes(domain)) {
        errors.push({
          field: 'email',
          message: 'Please use a non-disposable email address',
          value: domain
        });
      }
    }

    // If there are custom validation errors, return them
    if (errors.length > 0) {
      reply.code(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: errors
        }
      });
      return false;
    }

    return true;
  } catch (error: any) {
    // Enhanced error handling with more specific messages
    const errorMessage = error.message || "Invalid input data";
    const errorCode = errorMessage.includes("pattern") ? "INVALID_FORMAT" : "VALIDATION_ERROR";
    
    reply.code(400).send({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage.includes("pattern") ? 
          "Password must include uppercase, lowercase, numbers, and be at least 8 characters" : 
          "Invalid input data",
        details: error.message
      }
    });
    return false;
  }
};
