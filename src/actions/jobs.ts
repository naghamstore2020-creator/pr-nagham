"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobType, JobStatus } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import * as XLSX from "xlsx";

export interface RecentOperation {
  id: string;
  type: string;
  status: string;
  date: string;
  user: string;
  duration: string;
}

export interface JobLog {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  totalItems: number;
  processedItems: number;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
  user: { username: string };
}

interface JobFilters {
  type?: JobType;
  status?: JobStatus;
  fromDate?: string;
  toDate?: string;
}

export async function getJobLogs(page = 1, limit = 20, filters: JobFilters = {}) {
  await requirePermission("logs:view");

  try {
    const where: any = {};

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate + "T23:59:59.999Z");
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { username: true } } },
    });
    const total = await prisma.job.count({ where });
    return { success: true, jobs, total, page, limit };
  } catch (error) {
    console.warn("Could not fetch jobs from DB:", error);
    return {
      success: true,
      jobs: [],
      total: 0,
      page: 1,
      limit: 20,
    };
  }
}

const JOB_TYPE_LABELS_MAP: Record<string, string> = {
  DAILY_INVENTORY: "جرد يومي",
  FULL_INVENTORY: "جرد كامل",
  COST_UPDATE: "تحديث تكلفة",
  SELL_UPDATE: "تحديث بيع",
  FULL_UPDATE: "تسعير كامل",
  AI_MATCHING: "مطابقة الأسماء",
};

export async function getDashboardStats() {
  try {
    const [totalOperations, latest, completedCount, filesWithUrl] = await Promise.all([
      prisma.job.count(),
      prisma.job.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.job.findMany({
        where: { NOT: { storeFileUrl: null } },
        select: { storeFileUrl: true },
        distinct: ["storeFileUrl"],
      }),
    ]);
    return {
      totalOperations,
      latestDate: latest?.createdAt.toISOString() ?? null,
      successRate: totalOperations > 0 ? +((completedCount / totalOperations) * 100).toFixed(1) : 0,
      totalFiles: filesWithUrl.length,
    };
  } catch {
    return { totalOperations: 0, latestDate: null, successRate: 0, totalFiles: 0 };
  }
}

export async function getRecentOperations(): Promise<RecentOperation[]> {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { username: true } } },
    });
    return jobs.map((j) => {
      const durationMs = j.completedAt
        ? new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()
        : 0;
      const duration =
        durationMs < 1000
          ? "حالاً"
          : durationMs < 60000
            ? `${Math.round(durationMs / 1000)} ثانية`
            : `${Math.round(durationMs / 60000)} دقيقة`;
      return {
        id: j.id,
        type: JOB_TYPE_LABELS_MAP[j.type] || j.type,
        status: j.status === "COMPLETED" ? "completed" : "failed",
        date: new Date(j.createdAt).toLocaleString("ar-SA"),
        user: j.user?.username || "—",
        duration,
      };
    });
  } catch {
    return [];
  }
}

const JOB_TYPE_LABELS: Record<string, string> = {
  DAILY_INVENTORY: "جرد يومي",
  FULL_INVENTORY: "جرد كامل",
  COST_UPDATE: "تحديث تكلفة",
  SELL_UPDATE: "تحديث بيع",
  FULL_UPDATE: "تسعير كامل",
  AI_MATCHING: "مطابقة الأسماء",
};

const JOB_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  PROCESSING: "قيد المعالجة",
  COMPLETED: "مكتمل",
  FAILED: "فشل",
  RETRYING: "إعادة محاولة",
};

export async function exportJobsExcel(filters: JobFilters = {}) {
  await requirePermission("logs:view");

  try {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate + "T23:59:59.999Z");
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    });

    const data = jobs.map((job) => ({
      "نوع العملية": JOB_TYPE_LABELS[job.type] || job.type,
      "الحالة": JOB_STATUS_LABELS[job.status] || job.status,
      "التاريخ": new Date(job.createdAt).toLocaleString("ar-SA"),
      "المستخدم": job.user?.username || "—",
      "التقدم": `${job.processedItems}/${job.totalItems}`,
      "الملاحظات": job.errorMessage || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "سجل العمليات");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return { success: true, buffer: Buffer.from(buffer).toString("base64") };
  } catch (error) {
    console.warn("Could not export jobs:", error);
    return { success: false, error: "فشل تصدير السجل" };
  }
}
