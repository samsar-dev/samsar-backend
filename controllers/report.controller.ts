import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, Prisma, ReportStatus, ReportType, ReportReason } from "@prisma/client";
import { APIResponse, APIError } from "../types/api.js";

// Re-export enums from Prisma
export { ReportStatus, ReportType, ReportReason };

// Type for report with relations
type ReportWithRelations = Prisma.ReportGetPayload<{
  include: {
    reporter: true;
    resolvedBy: true;
  };
}>;

// Type for report create input
type ReportCreateInput = Omit<Prisma.ReportCreateInput, 'reporter' | 'resolvedBy'> & {
  reporter: { connect: { id: string } };
};

// Type for report statistics
interface ReportStats {
  total: number;
  byStatus: { status: ReportStatus; count: number }[];
  byType: { type: ReportType; count: number }[];
  recent: ReportWithRelations[];
}

// Input types
interface CreateReportInput {
  type: ReportType;
  targetId: string;
  reason: ReportReason;
  notes?: string;
}

interface UpdateReportInput {
  status?: ReportStatus;
  notes?: string;
}

interface GetReportsQuery {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  type?: ReportType;
  targetId?: string;
  reporterId?: string;
  includeResolved?: boolean;
}

// Import the AuthRequest type
import { AuthRequest } from '../types/auth.js';

const prisma = new PrismaClient();

// Define the include type for report relations
const reportInclude = {
  reporter: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
  resolvedBy: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
} as const;

// Helper function to create API errors
function createError(message: string, code: string = 'INTERNAL_ERROR'): APIError {
  return { code, message };
}

export async function createReport(
  request: FastifyRequest<{ Body: CreateReportInput }>,
  reply: FastifyReply,
) {
  try {
    const { type, targetId, reason, notes } = request.body;
    const userId = request.user?.id;
    
    if (!userId) {
      reply.status(401);
      return {
        success: false,
        error: createError('Unauthorized', 'UNAUTHORIZED'),
        data: null,
        status: 401,
      };
    }

    // Check if user has already reported this target
    const existingReport = await prisma.$queryRaw`
      SELECT * FROM "Report"
      WHERE "reporterId" = ${userId}
      AND "targetId" = ${targetId}
      AND "type" = ${type}::"ReportType"
      AND "status" IN ('PENDING', 'INVESTIGATING')
      LIMIT 1
    `;

    if (existingReport) {
      reply.status(400);
      const errorResponse: APIResponse<ReportWithRelations> = {
        success: false,
        error: createError('You have already reported this target', 'DUPLICATE_REPORT'),
        data: null,
        status: 400,
      };
      return errorResponse;
    }

    // Create the report using raw SQL to avoid Prisma type issues
    const createdReport = await prisma.$queryRaw<ReportWithRelations[]>`
      WITH new_report AS (
        INSERT INTO "Report" ("type", "targetId", reason, notes, "reporterId", status, "createdAt", "updatedAt")
        VALUES (
          ${type}::"ReportType",
          ${targetId},
          ${reason}::"ReportReason",
          ${notes || null},
          ${userId},
          'PENDING'::"ReportStatus",
          NOW(),
          NOW()
        )
        RETURNING *
      )
      SELECT 
        r.*,
        json_build_object(
          'id', u1.id,
          'username', u1.username,
          'email', u1.email
        ) as reporter,
        CASE WHEN u2.id IS NOT NULL THEN 
          json_build_object(
            'id', u2.id,
            'username', u2.username,
            'email', u2.email
          )
        ELSE NULL END as "resolvedBy"
      FROM new_report r
      LEFT JOIN "User" u1 ON r."reporterId" = u1.id
      LEFT JOIN "User" u2 ON r."resolvedById" = u2.id
    `;

    if (!createdReport || createdReport.length === 0) {
      throw new Error('Failed to create report');
    }

    const response: APIResponse<ReportWithRelations> = {
      success: true,
      data: createdReport[0],
      status: 201,
    };
    return response;
  } catch (error: any) {
    console.error('Error creating report:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to create report';
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        statusCode = 409;
        errorMessage = 'A similar report already exists';
      } else if (error.code === 'P2003') {
        statusCode = 404;
        errorMessage = 'Referenced user or target not found';
      }
    }
    
    reply.status(statusCode);
    const errorResponse: APIResponse<ReportWithRelations> = {
      success: false,
      error: createError(errorMessage, 'REPORT_CREATION_ERROR'),
      data: null as never, // Using never type as a fallback for error cases
      status: statusCode,
    };
    return errorResponse;
  }
};

export async function getReports(
  request: FastifyRequest<{ Querystring: GetReportsQuery }>,
  reply: FastifyReply,
): Promise<APIResponse<{
  items: ReportWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>> {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      targetId,
      reporterId,
      includeResolved = false,
    } = request.query;

    const skip = (page - 1) * limit;
    // Build raw SQL where conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (reporterId) {
      conditions.push(`"reporterId" = $${paramIndex++}`);
      params.push(reporterId);
    }
    if (status) {
      conditions.push(`"status" = $${paramIndex++}::"ReportStatus"`);
      params.push(status);
    }
    if (type) {
      conditions.push(`"type" = $${paramIndex++}::"ReportType"`);
      params.push(type);
    }
    if (targetId) {
      conditions.push(`"targetId" = $${paramIndex++}`);
      params.push(targetId);
    }
    if (!includeResolved) {
      conditions.push(`("status" = 'PENDING' OR "status" = 'INVESTIGATING')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Use raw queries to bypass Prisma type issues
    const [items, totalResult] = await Promise.all([
      prisma.$queryRaw`
        SELECT r.*, 
               json_build_object(
                 'id', u1.id,
                 'username', u1.username,
                 'email', u1.email
               ) as reporter,
               CASE WHEN u2.id IS NOT NULL THEN 
                 json_build_object(
                   'id', u2.id,
                   'username', u2.username,
                   'email', u2.email
                 )
               ELSE NULL END as "resolvedBy"
        FROM "Report" r
        LEFT JOIN "User" u1 ON r."reporterId" = u1.id
        LEFT JOIN "User" u2 ON r."resolvedById" = u2.id
        ${Prisma.raw(whereClause)}
        ORDER BY r."createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "Report" r
        ${Prisma.raw(whereClause)}
      `,
    ]);

    const total = Number((totalResult as any)[0]?.count || 0);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        items: items as ReportWithRelations[],
        total,
        page,
        limit,
        totalPages,
      },
      status: 200,
    };
  } catch (error) {
    console.error('Error fetching reports:', error);
    reply.code(500);
    return {
      success: false,
      error: createError('Failed to fetch reports', 'REPORT_FETCH_ERROR'),
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      },
      status: 500,
    };
  }
};

export async function updateReportStatus(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { status: ReportStatus; notes?: string };
  }>,
  reply: FastifyReply,
): Promise<APIResponse<ReportWithRelations>> {
  try {
    const { id } = request.params;
    const { status, notes } = request.body;
    const userId = request.user?.id;

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      reply.status(403);
      const errorResponse: APIResponse<ReportWithRelations> = {
        success: false,
        error: createError('Only admins can update report status', 'UNAUTHORIZED'),
        data: null as never, // Using never type as a fallback for error cases
        status: 403,
      };
      return errorResponse;
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      reply.status(404);
      const notFoundResponse: APIResponse<ReportWithRelations> = {
        success: false,
        error: createError('Report not found', 'REPORT_NOT_FOUND'),
        data: null as never, // Using never type as a fallback for error cases
        status: 404,
      };
      return notFoundResponse;
    }

    // Update the report
    const updateData: Prisma.ReportUpdateInput = {
      status,
      ...(status === 'RESOLVED' || status === 'DISMISSED' 
        ? { 
            resolvedBy: { connect: { id: userId } },
            resolvedAt: new Date()
          } 
        : {}
      ),
      ...(notes ? { notes } : {}),
    };

    const updatedReport = await prisma.report.update({
      where: { id: report.id }, // Use report.id from the found report
      data: updateData,
      include: reportInclude,
    });

    const response: APIResponse<ReportWithRelations> = {
      success: true,
      data: updatedReport as ReportWithRelations,
      status: 200,
    };
    return response;
  } catch (error) {
    console.error('Error updating report status:', error);
    const errorResponse: APIResponse<ReportWithRelations> = {
      success: false,
      error: error instanceof Prisma.PrismaClientKnownRequestError
        ? createError('Database error', 'DATABASE_ERROR')
        : createError('Internal server error', 'INTERNAL_SERVER_ERROR'),
      data: null,
      status: 500,
    };
    reply.code(500);
    return errorResponse;
  }
};

export async function getReportStats(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<APIResponse<ReportStats>> {
  try {
    // Get report statistics using raw queries
    const [totalResult, byStatusResult, byTypeResult, recentResult] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "Report"`,
      prisma.$queryRaw`
        SELECT "status", COUNT(*) as count
        FROM "Report"
        GROUP BY "status"
      `,
      prisma.$queryRaw`
        SELECT "type", COUNT(*) as count
        FROM "Report"
        GROUP BY "type"
      `,
      prisma.$queryRaw`
        SELECT r.*, 
               json_build_object(
                 'id', u1.id,
                 'username', u1.username,
                 'email', u1.email
               ) as reporter,
               CASE WHEN u2.id IS NOT NULL THEN 
                 json_build_object(
                   'id', u2.id,
                   'username', u2.username,
                   'email', u2.email
                 )
               ELSE NULL END as "resolvedBy"
        FROM "Report" r
        LEFT JOIN "User" u1 ON r."reporterId" = u1.id
        LEFT JOIN "User" u2 ON r."resolvedById" = u2.id
        ORDER BY r."createdAt" DESC
        LIMIT 10
      `
    ]);

    const total = Number((totalResult as any)[0]?.count || 0);
    const byStatus = (byStatusResult as any[]).map(row => ({
      status: row.status as ReportStatus,
      _count: Number(row.count)
    }));
    const byType = (byTypeResult as any[]).map(row => ({
      type: row.type as ReportType,
      _count: Number(row.count)
    }));
    const recent = recentResult as unknown as ReportWithRelations[];

    // Transform the result to match the ReportStats type
    const stats: ReportStats = {
      total,
      byStatus: Object.values(ReportStatus).map(status => ({
        status,
        count: byStatus.find(s => s.status === status)?._count || 0,
      })),
      byType: Object.values(ReportType).map(type => ({
        type,
        count: byType.find(t => t.type === type)?._count || 0,
      })),
      recent,
    };

    const response: APIResponse<ReportStats> = {
      success: true,
      data: stats,
      status: 200,
    };
    return response;
  } catch (error: any) {
    console.error('Error getting report stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get report statistics';
    reply.code(500);
    const errorResponse: APIResponse<ReportStats> = {
      success: false,
      error: createError('Failed to get report statistics', 'REPORT_STATS_ERROR'),
      data: {
        total: 0,
        byStatus: [],
        byType: [],
        recent: []
      },
      status: 500,
    };
    return errorResponse;
  }
};
