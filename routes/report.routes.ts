import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyPluginOptions,
} from "fastify";
import { authenticate, isAdmin } from "../middleware/auth.js";
import {
  createReport,
  getReports,
  updateReportStatus,
  getReportStats,
  ReportStatus,
  ReportType,
} from "../controllers/report.controller.js";
import { UserRole } from "../types/auth.js";

// Extend FastifyRequest type to include user
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    exp: number; // JWT expiration timestamp
  };
}

interface GetReportsQuery {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  type?: ReportType;
}

interface UpdateReportParams {
  id: string;
}

interface UpdateReportBody {
  status: ReportStatus;
  notes?: string;
}

export default async function reportRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
) {
  // Add authentication to all report routes
  fastify.addHook("onRequest", authenticate);

  // Create a new report (no admin required)
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["type", "targetId", "reason"],
          properties: {
            type: {
              type: "string",
              enum: ["USER", "LISTING", "MESSAGE", "COMMENT"] as const,
            },
            targetId: {
              type: "string",
              minLength: 1,
            },
            reason: {
              type: "string",
              enum: [
                "SPAM",
                "INAPPROPRIATE",
                "MISLEADING",
                "OFFENSIVE",
                "HARASSMENT",
                "OTHER",
              ] as const,
            },
            notes: {
              type: ["string", "null"],
              default: null,
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "object" },
              status: { type: "number" },
            },
          },
          401: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              status: { type: "number" },
            },
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "string" },
              status: { type: "number" },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    createReport as any,
  );

  // Get all reports with pagination and filtering (admin only)
  fastify.get<{ Querystring: GetReportsQuery }>(
    "/",
    {
      preHandler: [isAdmin],
      schema: {
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            limit: { type: "number", minimum: 1, maximum: 100, default: 10 },
            status: {
              type: "string",
              enum: ["PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED"],
            },
            type: {
              type: "string",
              enum: ["USER", "LISTING", "MESSAGE", "COMMENT"],
            },
          },
        },
      },
    },
    getReports,
  );

  // Update report status (admin only)
  fastify.patch<{ Params: UpdateReportParams; Body: UpdateReportBody }>(
    "/:id/status",
    {
      preHandler: [isAdmin],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["PENDING", "INVESTIGATING", "RESOLVED", "DISMISSED"],
            },
            notes: { type: "string" },
          },
        },
      },
    },
    updateReportStatus,
  );

  // Get report statistics (admin only)
  fastify.get("/stats", {
    preHandler: [isAdmin],
    handler: (request: FastifyRequest, reply: FastifyReply) =>
      getReportStats(request, reply),
  });

  return Promise.resolve();
}
