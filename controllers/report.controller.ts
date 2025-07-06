import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, Prisma } from "@prisma/client";
import { APIResponse } from "../types/api.js";

const prisma = new PrismaClient();

// Import the generated Prisma types
import type { PrismaClient as GeneratedPrismaClient } from '@prisma/client';

// Extend the Prisma client type to include the report model
interface CustomPrismaClient extends Omit<GeneratedPrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'> {
  report: any; // We'll use 'any' as a fallback since TypeScript can't infer the correct type
}

// Cast the Prisma client to our custom type
const prismaWithReport = prisma as unknown as CustomPrismaClient;



// Define enums as const objects for type safety
export const ReportType = {
  USER: 'USER',
  LISTING: 'LISTING',
  MESSAGE: 'MESSAGE',
  COMMENT: 'COMMENT'
} as const;
export type ReportType = typeof ReportType[keyof typeof ReportType];

export const ReportStatus = {
  PENDING: 'PENDING',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED'
} as const;
export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

export const ReportReason = {
  SPAM: 'SPAM',
  INAPPROPRIATE: 'INAPPROPRIATE',
  MISLEADING: 'MISLEADING',
  OFFENSIVE: 'OFFENSIVE',
  HARASSMENT: 'HARASSMENT',
  OTHER: 'OTHER'
} as const;
export type ReportReason = typeof ReportReason[keyof typeof ReportReason];

// Type for raw query results
interface StatusCount {
  status: ReportStatus;
  _count: number;
}

interface TypeStatusCount {
  type: ReportType;
  status: ReportStatus;
  _count: number;
}

interface CreateReportInput {
  type: ReportType;
  targetId: string;
  reason: ReportReason;
  notes?: string;
  createdById: string;
}

interface UpdateReportInput {
  status?: ReportStatus;
  notes?: string;
  resolvedById?: string;
  resolvedAt?: Date;
}

interface CreateReportBody {
  type: ReportType;
  targetId: string;
  reason: ReportReason;
  notes?: string | null;
}

export async function createReport(
  request: FastifyRequest<{ Body: CreateReportBody }> & { user?: { id: string } },
  reply: FastifyReply,
) {
  try {
    const { type, targetId, reason, notes } = request.body;
    const userId = (request as any).user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'User not authenticated',
        status: 401,
      });
    }

    // Validate report type
    if (!Object.values(ReportType).includes(type)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid report type',
        status: 400,
      });
    }

    // Validate reason
    if (!Object.values(ReportReason).includes(reason)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid report reason',
        status: 400,
      });
    }

    const report = await prismaWithReport.report.create({
      data: {
        type,
        targetId,
        reason,
        notes: notes || null,
        createdById: userId,
        status: 'PENDING' as const,
      },
      include: {
        createdBy: {
          select: { 
            id: true, 
            name: true, 
            email: true 
          }
        }
      }
    });

    return reply.code(201).send({
      success: true,
      data: report,
      status: 201,
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to create report';
    
    if (error.code === 'P2003') { // Foreign key constraint failed
      statusCode = 400;
      errorMessage = 'Invalid target ID or user ID';
    }
    
    return reply.code(statusCode).send({
      success: false,
      error: errorMessage,
      status: statusCode,
    });
  }
};

export async function getReports(
  request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      status?: ReportStatus;
      type?: ReportType;
    };
  }>,
  reply: FastifyReply,
) {
  try {
    const page = Number(request.query.page) || 1;
    const limit = Math.min(Number(request.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (request.query.status) where.report_status = request.query.status as ReportStatus;
    if (request.query.type) where.report_type = request.query.type as ReportType;

    const [items, total] = await Promise.all([
      prismaWithReport.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          resolvedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prismaWithReport.report.count({ where })
    ]);

    const reports = items.map(report => ({
      ...report,
      type: report.report_type as ReportType,
      status: report.report_status as ReportStatus,
      reason: report.report_reason as ReportReason
    }));

    reply.send({
      success: true,
      data: {
        items: reports,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    reply.code(500).send({
      success: false,
      error: 'Failed to fetch reports',
      status: 500,
    });
  }
};

export async function updateReportStatus(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { status: ReportStatus; notes?: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params;
    const { status, notes } = request.body;
    const userId = (request.user as any)?.id;

    const updateData: UpdateReportInput = { status };
    
    if (status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED) {
      updateData.resolvedById = userId;
      updateData.resolvedAt = new Date();
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prismaWithReport.report.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        resolvedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const report = {
      ...updated,
      type: updated.report_type as ReportType,
      status: updated.report_status as ReportStatus,
      reason: updated.report_reason as ReportReason
    };

    reply.send({
      success: true,
      data: report,
      status: 200,
    });
  } catch (error: any) {
    console.error('Error updating report status:', error);
    if (error.code === 'P2025') { // Record not found
      return reply.code(404).send({
        success: false,
        error: 'Report not found',
        status: 404,
      });
    }
    
    reply.code(500).send({
      success: false,
      error: 'Failed to update report',
      status: 500,
    });
  }
};

export async function getReportStats(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Get total counts by status with proper typing
    const statusCounts = await prisma.$queryRaw<StatusCount[]>`
      SELECT report_status as status, COUNT(*)::integer as _count
      FROM reports
      GROUP BY report_status
    `;

    // Get counts by type and status with proper typing
    const typeStatusCounts = await prisma.$queryRaw<TypeStatusCount[]>`
      SELECT report_type as type, report_status as status, COUNT(*)::integer as _count
      FROM reports
      GROUP BY report_type, report_status
    `;

    // Transform the data into the expected format
    const result = {
      statusCounts: {
        [ReportStatus.PENDING]: 0,
        [ReportStatus.INVESTIGATING]: 0,
        [ReportStatus.RESOLVED]: 0,
        [ReportStatus.DISMISSED]: 0,
      } as Record<ReportStatus, number>,
      typeStatusCounts: {} as Record<ReportType, Record<ReportStatus, number>>
    };

    // Initialize all type status combinations with 0
    Object.values(ReportType).forEach(type => {
      result.typeStatusCounts[type] = {
        [ReportStatus.PENDING]: 0,
        [ReportStatus.INVESTIGATING]: 0,
        [ReportStatus.RESOLVED]: 0,
        [ReportStatus.DISMISSED]: 0,
      };
    });

    // Fill in the status counts from the query
    statusCounts?.forEach(({ status, _count }) => {
      if (status && _count !== undefined && status in result.statusCounts) {
        result.statusCounts[status as ReportStatus] = _count;
      }
    });

    // Fill in the type status counts from the query
    typeStatusCounts?.forEach(({ type, status, _count }) => {
      if (type && status && _count !== undefined) {
        if (!result.typeStatusCounts[type as ReportType]) {
          result.typeStatusCounts[type as ReportType] = {} as Record<ReportStatus, number>;
        }
        result.typeStatusCounts[type as ReportType][status as ReportStatus] = _count;
      }
    });

    // Calculate totals for backward compatibility
    const total = Object.values(result.statusCounts).reduce((sum, count) => sum + count, 0);
    
    // Transform to the expected response format
    const response = {
      total,
      pending: result.statusCounts[ReportStatus.PENDING],
      investigating: result.statusCounts[ReportStatus.INVESTIGATING],
      resolved: result.statusCounts[ReportStatus.RESOLVED],
      dismissed: result.statusCounts[ReportStatus.DISMISSED],
      byType: Object.entries(ReportType).reduce((acc, [key, type]) => {
        const typeKey = type.toLowerCase() as keyof typeof ReportType;
        acc[typeKey] = {
          total: Object.values(result.typeStatusCounts[type] || {}).reduce((sum, count) => sum + count, 0),
          pending: result.typeStatusCounts[type]?.[ReportStatus.PENDING] || 0,
        };
        return acc;
      }, {} as Record<string, { total: number; pending: number }>)
    };

    reply.send({
      success: true,
      data: response,
      status: 200,
    });
  } catch (error: any) {
    console.error('Error getting report stats:', error);
    reply.code(500).send({
      success: false,
      error: 'Failed to get report statistics',
      status: 500,
    });
  }
};
