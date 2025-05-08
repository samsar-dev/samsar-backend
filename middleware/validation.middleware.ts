import { FastifyRequest, FastifyReply } from "fastify";

// List of disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "throwawaymail.com",
  "mailinator.com",
  "guerrillamail.com",
  "trashmail.com",
  "yopmail.com",
  "sharklasers.com",
  "temp-mail.org",
  "dispostable.com",
  "maildrop.cc",
  "10minutemail.com",
  "mailnesia.com",
];

// List of reserved usernames that shouldn't be used
const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "system",
  "support",
  "help",
  "root",
  "webmaster",
  "info",
  "contact",
  "security",
  "staff",
  "official",
  "moderator",
  "mod",
];

// Define validation schemas compatible with Fastify
export const RegisterSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 2,
      maxLength: 50,
      pattern: "^[\p{L}\s'\-\.]+$", // Allow letters, spaces, apostrophes, hyphens, and periods
    },
    email: {
      type: "string",
      format: "email",
      maxLength: 100,
    },
    username: {
      type: "string",
      minLength: 3,
      maxLength: 30,
      pattern: "^[a-zA-Z0-9_\-\.]+$", // Alphanumeric plus underscore, hyphen, period
    },
    password: {
      type: "string",
      minLength: 8,
      maxLength: 100,
      pattern:
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
    },
    captchaToken: {
      type: "string",
    },
  },
  required: ["name", "email", "username", "password", "captchaToken"],
};

export const LoginSchema = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string" },
  },
  required: ["email", "password"],
};

// Custom validator function for additional security checks
export const validateRegistration = (
  data: any,
): { valid: boolean; error?: string } => {
  // Check for disposable email domains
  const emailDomain = data.email.split("@")[1].toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    return {
      valid: false,
      error: "Disposable email addresses are not allowed",
    };
  }

  // Check for reserved usernames
  const lowercaseUsername = data.username.toLowerCase();
  if (RESERVED_USERNAMES.includes(lowercaseUsername)) {
    return {
      valid: false,
      error: "This username is reserved and cannot be used",
    };
  }

  // Additional password strength check
  if (
    data.password.includes(data.username) ||
    data.password.includes(data.email.split("@")[0])
  ) {
    return {
      valid: false,
      error: "Password cannot contain your username or email",
    };
  }

  return { valid: true };
};

export const ListingSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 3 },
    description: { type: "string", minLength: 10 },
    price: { type: "number" },
    category: { type: "string" },
  },
  required: ["title", "description", "price", "category"],
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
  schema: any,
) => {
  try {
    // Check if request body exists
    if (!request.body) {
      throw new Error("Missing request body");
    }

    // Fastify automatically validates against the schema
    // This is just an additional check for specific validations
    const body = request.body as Record<string, any>;
    const errors: ValidationErrorDetail[] = [];

    // Perform custom validations if needed
    if (schema === RegisterSchema && body.email) {
      // Additional email validation beyond format
      if (body.email.includes("admin") || body.email.includes("root")) {
        errors.push({
          field: "email",
          message: "Email contains reserved terms",
          value: body.email,
        });
      }

      // Check for common disposable email domains
      const disposableDomains = [
        "tempmail.com",
        "throwaway.com",
        "mailinator.com",
      ];
      const domain = body.email.split("@")[1];
      if (domain && disposableDomains.includes(domain)) {
        errors.push({
          field: "email",
          message: "Please use a non-disposable email address",
          value: domain,
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
          details: errors,
        },
      });
      return false;
    }

    return true;
  } catch (error: any) {
    // Enhanced error handling with more specific messages
    const errorMessage = error.message || "Invalid input data";
    const errorCode = errorMessage.includes("pattern")
      ? "INVALID_FORMAT"
      : "VALIDATION_ERROR";

    reply.code(400).send({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage.includes("pattern")
          ? "Password must include uppercase, lowercase, numbers, and be at least 8 characters"
          : "Invalid input data",
        details: error.message,
      },
    });
    return false;
  }
};
