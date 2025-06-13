import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { APIError } from "../types/api";

interface CustomError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Typed error handler
const errorHandler: ErrorRequestHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("💥 Error Handler:", err.stack);

  const error: APIError = {
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "Internal Server Error",
    details: err.details || undefined
  };

  res.status(err.status || 500).json({
    success: false,
    error,
    status: err.status || 500
  });
};

export default errorHandler;
