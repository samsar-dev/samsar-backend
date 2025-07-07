// src/server.ts

import compress from "@fastify/compress";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart, { FastifyMultipartBaseOptions } from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import Fastify from "fastify";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { ExtendedError, Server as SocketIOServer } from "socket.io";
import { config } from "./config/config.js";
import prisma from "./src/lib/prismaClient.js";
import { getDirname } from "./utils/path.utils.js";
import {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  PRICE_CHANGE,
} from "./constants/socketEvent.js";
import { newMessages } from "./controllers_sockets/newMessages.js";
import { handlePriceChange } from "./controllers_sockets/priceChange.js";
import { updateLastActive } from "./middleware/activity.js";

// Store connected users

interface MessageData {
  content: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  createdAt: Date;
}

const __dirname = getDirname(import.meta.url);

// Load environment variables
dotenv.config();
console.log("✅ JWT_SECRET from process.env:", process.env.JWT_SECRET);

// -----------------
// Create HTTP server manually
// -----------------
const httpServer = createServer();

// Create Fastify instance using existing HTTP server
const fastify = Fastify({
  logger: process.env.NODE_ENV === "development",
  serverFactory: (handler) => {
    httpServer.on("request", handler);
    return httpServer;
  },
});

// Attach Socket.IO to httpServer
export const io = new SocketIOServer(httpServer, {
  serveClient: false,
  pingTimeout: 30000,
  pingInterval: 25000,
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// BEFORE listen, decorate Fastify
fastify.decorate("io", io);

io.use((socket, next) => {
  console.log("Incoming socket headers:", socket.handshake.headers);
  try {
    const tokenWithBearer =
      socket.handshake.headers.authorization ||
      socket.handshake.auth.token ||
      socket.handshake.query.token;

    if (!tokenWithBearer) {
      return next(new Error("Token missing"));
    }

    const token = tokenWithBearer.startsWith("Bearer ")
      ? tokenWithBearer.split(" ")[1]
      : tokenWithBearer;

    console.log("🚀 ~ file: server.ts:78 ~ io.use ~ token:", token);

    // Verify and decode JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
    if (!decoded) {
      return next(new Error("Authentication error: Invalid token"));
    }
    (socket as AuthSocket).user = decoded;
    next();
  } catch (error) {
    console.log("🚀 ~ file: server.ts:78 ~ io.use ~ error:", error);
    next(error as ExtendedError);
  }
});

// -----------------
// Register middlewares
// -----------------
await fastify.register(helmet);
// Configure compression with specific settings
await fastify.register(compress, {
  global: true,
  encodings: ["gzip", "deflate", "br"],
  threshold: 1024,
});
await fastify.register(cookie);
await fastify.register(import("@fastify/formbody"));
await fastify.register(multipart, {
  attachFieldsToBody: false, // Changed from true to false to handle files manually
  limits: {
    fieldSize: 5 * 1024 * 1024, // 5MB
    files: 10,
    fileSize: 10 * 1024 * 1024, // 10MB
  },
} as FastifyMultipartBaseOptions); // Add multipart file upload support

// JWT
await fastify.register(import("@fastify/jwt"), {
  secret: process.env.JWT_SECRET || "your-secret-key",
  cookie: {
    cookieName: "jwt",
    signed: false,
  },
});

// Rate Limiting - Global default
await fastify.register(rateLimit, {
  global: true,
  max: 1000,
  timeWindow: "1 minute",
  skipOnError: false,
  addHeaders: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
    "retry-after": true,
  },
});

// Additional strict rate limits for sensitive endpoints
fastify.after(() => {
  // Auth endpoints (login, register, password reset)
  fastify.route({
    url: "/auth/*",
    method: ["POST"],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "5 minutes",
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: "Too Many Requests",
          message: "Too many login attempts, please try again later",
        }),
      },
    },
    handler: (_, reply) => reply.send(),
  });

  // Profile update endpoints
  fastify.route({
    url: "/users/profile",
    method: ["PUT", "PATCH"],
    config: {
      rateLimit: {
        max: 20,
        timeWindow: "10 minutes",
      },
    },
    handler: (_, reply) => reply.send(),
  });
});

// Add activity tracking middleware
fastify.addHook("onRequest", async (request, reply) => {
  await updateLastActive(request, reply);
});

// Add ETag support for efficient caching
await fastify.register(import("@fastify/etag"), {
  weak: true, // Use weak ETags for better compatibility
});

// CORS
await fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [
      // Production
      "https://samsar.app",
      "https://www.samsar.app",
      "https://samsar-frontend.vercel.app",
      // Development
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600,
});

// Logging (only development)
if (process.env.NODE_ENV === "development") {
  fastify.addHook("onRequest", async (request) => {
    console.log(`📥 ${request.method} ${request.url}`);
  });

  // Comment out the onSend hook for logging to prevent conflicts
  fastify.addHook("onSend", async (request, reply, payload) => {
    console.log(`📤 Response ${reply.statusCode}`);
    return payload; // Return payload unchanged
  });
}

// Health route
fastify.get("/api/health", async (_, reply) => {
  reply.status(200).send({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// -----------------
// Import routes
// -----------------
import { AuthSocket, UserPayload } from "./types/auth.js";
import cacheControl from "./middleware/cache.middleware.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import uploadRoutes from "./routes/uploads.js";
import userRoutes from "./routes/user.routes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import reportRoutes from "./routes/report.routes.js";
import { NewMessageData } from "./types/socket.js";
import { PriceChangeData } from "./types/socket.js";

// Add cache middleware
await fastify.register(cacheControl);

// Attach routes
await fastify.register(authRoutes, { prefix: "/api/auth" });
await fastify.register(listingRoutes, { prefix: "/api/listings" });
await fastify.register(userRoutes, { prefix: "/api/users" });
await fastify.register(messageRoutes, { prefix: "/api/messages" });
await fastify.register(uploadRoutes, { prefix: "/api/uploads" });
await fastify.register(notificationRoutes, { prefix: "/api/notifications" });
await fastify.register(adminRoutes, { prefix: "/api/admin" });
await fastify.register(newsletterRoutes, { prefix: "/api/admin/newsletter" });
await fastify.register(reportRoutes, { prefix: "/api/reports" });

// Register location routes
import locationRoutes from "./routes/location.routes.js";
await fastify.register(locationRoutes);

// Error handling
fastify.setErrorHandler((error, _, reply) => {
  console.error(error);
  reply.status(error.statusCode || 500).send({
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Something went wrong",
    },
  });
});

fastify.setNotFoundHandler((_, reply) => {
  reply.status(404).send({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

// -----------------
// Start server
// -----------------

export const usersSocketId = new Map<string, string>();

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to database");

    // Register contact routes
    const { default: contactRoutes } = await import(
      "./routes/contact.routes.js"
    );
    await fastify.register(contactRoutes);

    // Register listing permission routes
    const { default: listingPermissionRoutes } = await import(
      "./routes/listingPermission.routes.js"
    );
    await fastify.register(listingPermissionRoutes, { prefix: "/api" });
    console.log("✅ Contact routes registered");

    const port = Number(process.env.PORT || 5000);
    await fastify.listen({ port, host: "0.0.0.0" });

    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log("✅ all user sockets:", usersSocketId);

    // Socket.io handlers
    io.on("connection", (socket: AuthSocket) => {
      const user = socket.user;
      usersSocketId.set(user.sub, socket.id);
      console.log("✅ New socket connected:", socket.id);
      console.log("User payload:", socket.user);
      console.log("all user sockets:", usersSocketId);

      socket.on(NEW_MESSAGE, (data: NewMessageData) => {
        console.log("newMessages");
        newMessages(data);
      });

      socket.on(PRICE_CHANGE, (data: PriceChangeData) => {
        console.log("Price change data:", data);
        handlePriceChange(data);
      });

      socket.on("join", (data) => {
        console.log("User joined:", data);
      });

      socket.on("disconnect", () => {
        // usersSocketId.delete(user.id);
        console.log("User disconnected:", socket.id);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();