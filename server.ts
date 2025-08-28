// src/server.ts

import compress from "@fastify/compress";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart, { FastifyMultipartBaseOptions } from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
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

  try {
    // Try to get token from multiple sources
    let token: string | null = null;
    
    // 1. Check authorization header
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader) {
      token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    }
    
    // 2. Check auth object
    if (!token && socket.handshake.auth.token) {
      const authToken = socket.handshake.auth.token;
      token = authToken.startsWith("Bearer ") ? authToken.split(" ")[1] : authToken;

    }
    
    // 3. Check query parameters
    if (!token && socket.handshake.query.token) {
      const queryToken = socket.handshake.query.token as string;
      token = queryToken.startsWith("Bearer ") ? queryToken.split(" ")[1] : queryToken;

    }
    
    // 4. Check cookies (most important for our case)
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie;
      const sessionTokenMatch = cookies.match(/session_token=([^;]+)/);
      if (sessionTokenMatch) {
        token = sessionTokenMatch[1];

      }
    }

    if (!token) {
      console.log("❌ No token found in any source:", {
        hasAuthHeader: !!socket.handshake.headers.authorization,
        hasAuthToken: !!socket.handshake.auth.token,
        hasQueryToken: !!socket.handshake.query.token,
        hasCookie: !!socket.handshake.headers.cookie,
      });
      return next(new Error("Token missing"));
    }



    // Verify and decode JWT token
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
    if (!decoded) {
      return next(new Error("Authentication error: Invalid token"));
    }
    (socket as AuthSocket).user = decoded;
    next();
  } catch (error) {

    next(error as ExtendedError);
  }
});

// -----------------
// Register middlewares
// -----------------
await fastify.register(helmet);
// Configure compression with Flutter-compatible settings
await fastify.register(compress, {
  global: true,
  encodings: ["gzip", "deflate"], // Removed 'br' (Brotli) as it can cause issues with some mobile clients
  threshold: 1024, // Only compress responses larger than 1KB
  customTypes: /^text\/|application\/json$|application\/javascript$/, // Only compress text and JSON
  removeContentLengthHeader: false, // Keep content-length header for better compatibility
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

fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Let jwtVerify() handle both Authorization header AND cookie authentication
    // It will automatically check Authorization header first, then fall back to cookie
    await request.jwtVerify();
  } catch (err) {
    // Send a clear 401 response on verification failure
    reply.status(401).send({ message: 'Unauthorized' });
  }
});

// Add ETag support for efficient caching
await fastify.register(import("@fastify/etag"), {
  weak: true, // Use weak ETags for better compatibility
});

// CORS - Allow all origins for testing
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://samsardeal.com',
  'https://www.samsardeal.com',
  'https://samsar-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean) as string[];

await fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    // Allow Vercel preview URLs dynamically
    if (origin.endsWith('.vercel.app') && origin.includes('samsar')) {
      callback(null, true);
      return;
    }

    // Allow localhost with any port for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      callback(null, true);
      return;
    }


    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "X-Kuma-Revision"],
  maxAge: 600,
});

// Logging (only development)
if (process.env.NODE_ENV === "development") {
  fastify.addHook("onRequest", async (request) => {

  });

  // Comment out the onSend hook for logging to prevent conflicts
  fastify.addHook("onSend", async (request, reply, payload) => {

    return payload; // Return payload unchanged
  });
}

// Health route with Syria diagnostic info
fastify.get("/api/health", async (request, reply) => {
  const headers = request.headers;
  const ip = request.ip;
  
  reply.status(200).send({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    server: "Railway Backend",
    clientInfo: {
      ip: ip,
      realIp: headers['cf-connecting-ip'] || headers['x-forwarded-for'] || ip,
      country: headers['cf-ipcountry'] || 'Unknown',
      userAgent: headers['user-agent'],
      ray: headers['cf-ray'] || 'No Cloudflare'
    },
    syriaTest: {
      isFromSyria: headers['cf-ipcountry'] === 'SY',
      accessible: true,
      message: headers['cf-ipcountry'] === 'SY' ? 
        '✅ Railway backend is accessible from Syria!' : 
        '✅ Backend is accessible from your location'
    }
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
import fcmRoutes from "./routes/fcm.routes.js";
import { NewMessageData } from "./types/socket.js";
import { PriceChangeData } from "./types/socket.js";

// Add cache middleware
await fastify.register(cacheControl);

// Add version endpoint to test deployment
fastify.get('/api/version', async (request, reply) => {
  return {
    version: '2.0.0-smart-registration',
    timestamp: new Date().toISOString(),
    message: 'Smart registration flow active'
  };
});

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

// Register FCM routes
await fastify.register(fcmRoutes, { prefix: "/api/fcm" });

// Register location routes
import locationRoutes from "./routes/location.routes.js";
await fastify.register(locationRoutes);

// Register diagnostic routes for Syria connectivity testing
import diagnosticRoutes from "./routes/diagnostic.routes.js";
await fastify.register(diagnosticRoutes, { prefix: "/api" });

// Register vehicle routes
import vehicleRoutes from "./routes/vehicle.routes.js";
await fastify.register(vehicleRoutes, { prefix: "/api/vehicles" });

// Register vehicle stats routes
import vehicleStatsRoutes from "./routes/vehicle-stats.routes.js";
await fastify.register(vehicleStatsRoutes, { prefix: "/api/vehicles" });

// Error handling
fastify.setErrorHandler((error, _, reply) => {

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


    const port = Number(process.env.PORT || 5000);
    await fastify.listen({ port, host: "0.0.0.0" });




    // Socket.io handlers
    io.on("connection", (socket: AuthSocket) => {
      const user = socket.user;
      usersSocketId.set(user.sub, socket.id);




      socket.on(NEW_MESSAGE, (data: NewMessageData) => {

        newMessages(data);
      });

      socket.on(PRICE_CHANGE, (data: PriceChangeData) => {

        handlePriceChange(data);
      });

      socket.on("join", (data) => {

      });

      socket.on("disconnect", () => {
        // usersSocketId.delete(user.id);

      });
    });
  } catch (error) {

    process.exit(1);
  }
}

startServer();
