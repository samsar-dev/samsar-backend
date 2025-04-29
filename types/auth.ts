import { FastifyRequest } from "fastify";
import { MultipartFile } from "@fastify/multipart";

// Core user payload decoded from JWT
export interface UserPayload {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  exp: number; // expires at
}

// Used for routes with JSON body (non-file routes)
export type AuthRequest<
  Body = unknown,
  Query = unknown,
  Params = unknown
> = FastifyRequest<{
  Body: Body;
  Querystring: Query;
  Params: Params;
}> & {
  user: UserPayload;
  processedImages?: Array<{ url: string; order: number }>;
};

// Used for multipart/form-data routes (e.g., file/image uploads)
// DO NOT override `.file` or `.files`, they are methods, not props
export type MultipartAuthRequest = FastifyRequest & {
  user: UserPayload;
  processedImages?: Array<{ url: string; order: number }>;
};

// Optional shared User type
export interface User {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  name?: string;
  profilePicture?: string;
  bio?: string;
  location?: string;
  city?: string;
  dateOfBirth?: string;
  postalCode?: string;
  street?: string;
  preferences?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional raw file helper (for buffer-based uploads)
export interface FastifyFile {
  filename: string;
  mimetype: string;
  data: Buffer;
  size: number;
  encoding: string;
  tempFilePath?: string;
}

// Type guard (safe casting)
export function isAuthRequest(req: FastifyRequest): req is AuthRequest {
  return (
    "user" in req &&
    typeof req.user === "object" &&
    req.user !== null &&
    "id" in req.user &&
    "email" in req.user &&
    "username" in req.user &&
    "role" in req.user &&
    ["USER", "ADMIN"].includes((req.user as any).role)
  );
}

export function castToAuthRequest(req: FastifyRequest): AuthRequest {
  if (!isAuthRequest(req)) {
    throw new Error("Request is not an authenticated request");
  }
  return req as AuthRequest;
}

// Route-specific types
export interface CreateConversationBody {
  participantIds: string[];
  initialMessage?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface SendMessageBody {
  recipientId: string;
  content: string;
  listingId?: string;
}

export interface ParamWithConversationId {
  conversationId: string;
}

export interface ParamWithMessageId {
  messageId: string;
}
