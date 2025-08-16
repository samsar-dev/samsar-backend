import { FastifyReply } from "fastify";
import { createSuccessResponse } from "middleware/listing.validation.middleware.js";

// Standard error codes for consistent API responses
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_TOKEN = "INVALID_TOKEN",
  
  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  
  // Resource Management
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  
  // Business Logic
  LISTING_NOT_AVAILABLE = "LISTING_NOT_AVAILABLE",
  PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  
  // System
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // File Operations
  FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
  };
  status: number;
  data: null;
}

// Success response interface
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  status: number;
  timestamp?: string;
}

// Custom application error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode: ErrorCode,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, ErrorCode.RESOURCE_NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, ErrorCode.RESOURCE_CONFLICT, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed", details?: any) {
    super(message, 500, ErrorCode.DATABASE_ERROR, details, false);
  }
}

// Error handler utility functions
export class ErrorHandler {
  
  static createErrorResponse(
    error: Error | AppError,
    path?: string
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
          details: error.details,
          timestamp,
          path,
        },
        status: error.statusCode,
        data: null,
      };
    }

    // Handle Prisma errors
    if (error.message.includes('Prisma')) {
      return {
        success: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: "Database operation failed",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp,
          path,
        },
        status: 500,
        data: null,
      };
    }

    // Handle validation errors from express-validator or similar
    if (error.message.includes('validation')) {
      return {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: error.message,
          timestamp,
          path,
        },
        status: 400,
        data: null,
      };
    }

    // Default internal server error
    return {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : "An unexpected error occurred",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp,
        path,
      },
      status: 500,
      data: null,
    };
  }

  static createSuccessResponse<T>(
    data: T,
    status: number = 200
  ): SuccessResponse<T> {
    return {
      success: true,
      data,
      status,
      timestamp: new Date().toISOString(),
    };
  }

  static sendError(
    reply: FastifyReply,
    error: Error | AppError,
    path?: string
  ): void {
    const errorResponse = this.createErrorResponse(error, path);
    
    // Log error for debugging (but don't expose sensitive info)
    console.error(`Error ${errorResponse.error.code}:`, {
      message: error.message,
      path,
      timestamp: errorResponse.error.timestamp,
      ...(error instanceof AppError && error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });

    reply.code(errorResponse.status).send(errorResponse);
  }

  static sendSuccess<T>(
    reply: FastifyReply,
    data: T,
    status: number = 200
  ): void {
    const successResponse = this.createSuccessResponse(data, status);
    reply.code(status).send(successResponse);
  }

  // Async error wrapper for route handlers
  static asyncHandler(fn: Function) {
    return (req: any, reply: any) => {
      Promise.resolve(fn(req, reply)).catch((error: Error) => {
        this.sendError(reply, error, req.url);
      });
    };
  }

  // Validation error helper
  static validationError(errors: string[] | string): ValidationError {
    const message = Array.isArray(errors) 
      ? `Validation failed: ${errors.join(', ')}`
      : errors;
    
    return new ValidationError(message, Array.isArray(errors) ? errors : [errors]);
  }

  // Helper to check if error is operational (expected) vs programming error
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }
}

// Middleware for handling uncaught errors
export function globalErrorHandler(
  error: Error,
  request: any,
  reply: any
): void {
  ErrorHandler.sendError(reply, error, request.url);
}

// Response helpers for common scenarios
export const ResponseHelpers = {
  // Success responses
  ok: <T>(reply: FastifyReply, data: T) => 
    ErrorHandler.sendSuccess(reply, data, 200),
    
  created: <T>(reply: FastifyReply, data: T) => 
    ErrorHandler.sendSuccess(reply, createSuccessResponse(data, 201)),
    
  noContent: (reply: FastifyReply) => 
    reply.code(204).send(),

  // Error responses
  badRequest: (reply: FastifyReply, message: string, details?: any) =>
    ErrorHandler.sendError(reply, new ValidationError(message, details)),
    
  unauthorized: (reply: FastifyReply, message?: string) =>
    ErrorHandler.sendError(reply, new UnauthorizedError(message)),
    
  forbidden: (reply: FastifyReply, message?: string) =>
    ErrorHandler.sendError(reply, new ForbiddenError(message)),
    
  notFound: (reply: FastifyReply, resource?: string) =>
    ErrorHandler.sendError(reply, new NotFoundError(resource)),
    
  conflict: (reply: FastifyReply, message: string, details?: any) =>
    ErrorHandler.sendError(reply, new ConflictError(message, details)),
    
  internal: (reply: FastifyReply, error: Error) =>
    ErrorHandler.sendError(reply, error),
};

export default ErrorHandler;
