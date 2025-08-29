import DOMPurify from "dompurify";
import { FilterXSS } from "xss";
import validator from "validator";
import { FastifyRequest, FastifyReply } from "fastify";

type SanitizablePrimitive = string | number | boolean | null | undefined;
type Sanitizable =
  | SanitizablePrimitive
  | Sanitizable[]
  | {
      [key: string]:
        | SanitizablePrimitive
        | Sanitizable[]
        | { [key: string]: unknown };
    };

// XSS Protection
export const sanitizeHtml = (input: string): string => {
  if (!input) return "";
  try {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // Remove all HTML tags
      ALLOWED_ATTR: [], // Remove all attributes
      FORBID_TAGS: ["style", "script", "iframe", "object", "embed"],
      FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
    });
  } catch (error) {
    return ""; // Return empty string on error
  }
};

// Input Sanitization
// Type-safe sanitizeInput function
export function sanitizeInput<T>(input: T): T {
  // If input is not an object or array, return as is
  if (input === null || input === undefined || typeof input !== "object") {
    // Handle string sanitization
    if (typeof input === "string") {
      try {
        // Remove null bytes and trim
        let sanitized = input.replace(/\0/g, "").trim();
        // Basic XSS protection
        const xssFilter = new FilterXSS({
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
        });
        return xssFilter.process(sanitized) as unknown as T;
      } catch (error) {
        return "" as unknown as T;
      }
    }
    return input;
  }
  // Handle arrays
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)) as unknown as T;
  }

  // Handle plain objects
  const result = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(input)) {
    result[key] = sanitizeInput(value);
  }
  return result as unknown as T;
}

// Email Validation
export const isValidEmail = (email: string): boolean => {
  return (
    validator.isEmail(email) &&
    !/^(admin|root|system)/i.test(email) &&
    !/@(example\.com|test\.com|localhost)$/i.test(email)
  );
};

// Password Validation
export const isStrongPassword = (password: string): boolean => {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

// SQL Injection Protection
export const sanitizeSql = (input: string): string => {
  if (typeof input !== "string") return input;
  return input.replace(/['"\;\-\-\s]/g, "");
};

// Request Sanitization Middleware
export const requestSanitizer = async (
  request: FastifyRequest,
  reply: FastifyReply,
  next: (err?: Error) => void,
): Promise<void> => {
  try {
    // Sanitize request body if it exists and is an object
    if (
      request.body &&
      typeof request.body === "object" &&
      !Buffer.isBuffer(request.body)
    ) {
      request.body = sanitizeInput(request.body as Record<string, unknown>);
    }

    // Sanitize query parameters
    if (request.query && typeof request.query === "object") {
      request.query = sanitizeInput(request.query as Record<string, unknown>);
    }

    // Sanitize URL parameters
    if (request.params && typeof request.params === "object") {
      request.params = sanitizeInput(request.params as Record<string, unknown>);
    }

    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error during request sanitization";
    request.log.error("Error in request sanitization:", error);

    // Send error response without exposing internal details
    await reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Invalid request data",
    });
  }
};
