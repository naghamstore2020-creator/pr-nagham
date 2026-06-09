"use server";

import { auth } from "@/lib/auth";
import { parseStoreExcel, parseSystemExcel } from "@/lib/excel/parser";
import { requirePermission } from "@/lib/permissions";
import { getFileBuffer, saveUploadedFile } from "@/lib/excel/file-store";
import { exportMatchSummary } from "@/lib/excel/exporter";
import { matchBySku, MatchResult as EngineMatchResult } from "@/lib/matching/engine";
import { prisma } from "@/lib/prisma";
import { JobType, MatchStatus } from "@prisma/client";
import { MatchResult } from "@/types/ai";

export interface MatchingActionResult {
  success: boolean;
  matches?: MatchResult[];
  stats?: { total: number; autoMatched: number; manualReview: number; rejected: number };
  jobId?: string;
  summaryFileUrl?: string;
  error?: string;
}

export async function executeMatchingJob(
  storeFileUrl: string,
  systemFileUrl: string,
): Promise<MatchingActionResult> {
  try {
    const { username } = await requirePermission("ai:match");

    const storeBuffer = await getFileBuffer(storeFileUrl);
    const systemBuffer = await getFileBuffer(systemFileUrl);

    const parsedStore = await parseStoreExcel(storeBuffer, "store.xlsx");
    const parsedSystem = await parseSystemExcel(systemBuffer, "system.xlsx");

    // Fetch previously accepted matches from DB + filesystem cache
    const cachedMatches = new Map<string, { systemSku: string; systemName: string }>();

    // 1. Try filesystem cache
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const cacheDir = path.join(process.cwd(), ".cache", "accepted-matches");
      const files = await fs.readdir(cacheDir).catch(() => []);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const content = await fs.readFile(path.join(cacheDir, file), "utf-8");
        const entry = JSON.parse(content);
        if (entry.status === "ACCEPTED" && entry.storeSku) {
          cachedMatches.set(entry.storeSku.toLowerCase().trim(), {
            systemSku: entry.systemSku || "",
            systemName: entry.systemName || "",
          });
        }
      }
    } catch (e) {
      console.warn("Could not load filesystem cache:", e);
    }

    // 2. Also try DB cache (may fail in some dev modes)
    try {
      const accepted = await prisma.aiMatch.findMany({
        where: { status: "ACCEPTED" },
        select: { storeSku: true, systemSku: true, systemName: true },
      });
      for (const m of accepted) {
        if (m.storeSku) cachedMatches.set(m.storeSku.toLowerCase().trim(), { systemSku: m.systemSku || "", systemName: m.systemName });
      }
    } catch (e) {
      console.warn("Could not load DB cached matches:", e);
    }

    const storeProductsToMatch = parsedStore.data
      .filter((p) => p.sku)
      .map((p) => ({
        name: p.name,
        sku: p.sku,
        options: [p.option1, p.option2, p.option3].filter(Boolean).join(" - "),
      }));

    if (storeProductsToMatch.length === 0) {
      return { success: true, matches: [], stats: { total: 0, autoMatched: 0, manualReview: 0, rejected: 0 } };
    }

    const systemProductsCandidates = parsedSystem.data.map((p) => ({
      name: p.name,
      sku: p.sku,
    }));

    // Run computation for products not in cache
    // Build system SKU set for determining unmatched products
    const systemSkuSet = new Set(systemProductsCandidates.map((p) => p.sku.toLowerCase().trim()));

    // Products already in cache → 100% auto_matched
    const cachedResults = storeProductsToMatch
      .filter((p) => cachedMatches.has(p.sku.toLowerCase().trim()))
      .map((p) => {
        const cached = cachedMatches.get(p.sku.toLowerCase().trim())!;
        const result: MatchResult = {
          storeName: p.name,
          storeOptions: p.options || "",
          systemName: cached.systemName,
          storeSku: p.sku,
          systemSku: cached.systemSku,
          confidence: 100,
          status: "auto_matched",
        };
        return result;
      });

    // Products to compute (not cached)
    const toCompute = storeProductsToMatch.filter((p) => !cachedMatches.has(p.sku.toLowerCase().trim()));

    let computedMatches: MatchResult[] = [];
    let stats = { total: 0, autoMatched: 0, manualReview: 0, rejected: 0 };

    if (toCompute.length > 0) {
      const computed = await matchBySku(toCompute, systemProductsCandidates);
      computedMatches = computed.matches;
      stats = computed.stats;
    }

    // Unmatched products (store SKU not found in system at all)
    const matchedSkuSet = new Set<string>();
    for (const m of cachedResults) matchedSkuSet.add(m.storeSku.toLowerCase().trim());
    for (const m of computedMatches) matchedSkuSet.add(m.storeSku.toLowerCase().trim());

    const unmatchedEntries: MatchResult[] = storeProductsToMatch
      .filter((p) => !matchedSkuSet.has(p.sku.toLowerCase().trim()))
      .map((p) => ({
        storeName: p.name,
        storeOptions: p.options || "",
        systemName: "",
        storeSku: p.sku,
        systemSku: "",
        confidence: 0,
        status: "rejected" as const,
      }));

    const allMatches = [...cachedResults, ...computedMatches, ...unmatchedEntries];
    const totalStats = {
      total: allMatches.length,
      autoMatched: allMatches.filter((m) => m.status === "auto_matched").length,
      manualReview: allMatches.filter((m) => m.status === "manual_review").length,
      rejected: allMatches.filter((m) => m.status === "rejected").length,
    };

    let jobId = `local-match-job-${Date.now()}`;
    try {
      const dbUser = await prisma.user.findUnique({ where: { username } });
      if (dbUser) {
        const job = await prisma.job.create({
          data: {
            type: JobType.AI_MATCHING,
            status: "COMPLETED",
            progress: 100,
            totalItems: allMatches.length,
            processedItems: allMatches.length,
            storeFileUrl,
            systemFileUrl,
            userId: dbUser.id,
            aiMatches: {
              create: allMatches.map((m) => {
                let status: MatchStatus = MatchStatus.MANUAL_REVIEW;
                if (m.status === "auto_matched") status = MatchStatus.AUTO_MATCHED;
                if (m.status === "rejected") status = MatchStatus.REJECTED;
                return {
                  storeName: m.storeName,
                  systemName: m.systemName,
                  confidence: m.confidence,
                  status,
                  storeSku: m.storeSku || null,
                  systemSku: m.systemSku || null,
                };
              }),
            },
          },
        });
        jobId = job.id;
      }
    } catch (dbError) {
      console.warn("Could not save job to database:", dbError);
    }

    let summaryFileUrl: string | undefined;
    try {
      const summaryBuffer = await exportMatchSummary(allMatches, "match_summary.xlsx");
      summaryFileUrl = await saveUploadedFile(summaryBuffer, "match_summary.xlsx");
    } catch (e) {
      console.warn("Could not generate match summary:", e);
    }

    return { success: true, matches: allMatches, stats: totalStats, jobId, summaryFileUrl };
  } catch (error: any) {
    console.error("Matching job failed:", error);
    return { success: false, error: error.message || "حدث خطأ غير متوقع أثناء عملية المطابقة" };
  }
}

export async function saveAcceptedMatch(storeSku: string, systemSku: string, systemName: string, storeName?: string, status?: "ACCEPTED" | "REJECTED"): Promise<{ success: boolean; error?: string }> {
  const newStatus = status || "ACCEPTED";

  // Save to filesystem cache (fallback if DB unavailable)
  let fileCacheOk = false;
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const cacheDir = path.join(process.cwd(), ".cache", "accepted-matches");
    await fs.mkdir(cacheDir, { recursive: true });
    const key = `${storeSku}__${systemSku || "__no_match__"}`.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, "_");
    const payload = JSON.stringify({
      storeSku, systemSku, systemName, status: newStatus,
      confidence: newStatus === "ACCEPTED" ? 100 : 0,
      timestamp: Date.now(),
    });
    await fs.writeFile(path.join(cacheDir, `${key}.json`), payload, "utf-8");
    fileCacheOk = true;
  } catch { /* file cache best-effort */ }

  // Save to DB
  try {
    const session = await auth();
    if (!session) return { success: false, error: "غير مصرح" };
    const dbUser = await prisma.user.findUnique({ where: { username: session.user?.username } });
    if (!dbUser) return { success: false, error: "المستخدم غير موجود" };

    // Find by storeSku only (one SKU = one product)
    const existing = await prisma.aiMatch.findFirst({
      where: { storeSku },
    });
    if (existing) {
      await prisma.aiMatch.update({
        where: { id: existing.id },
        data: { status: newStatus, systemSku: systemSku || null, systemName, storeName: storeName || existing.storeName },
      });
    } else {
      // Reuse a recent AI_MATCHING Job for this user instead of creating one per match
      let matchJob = await prisma.job.findFirst({
        where: { type: JobType.AI_MATCHING, userId: dbUser.id },
        orderBy: { createdAt: "desc" },
      });
      if (!matchJob) {
        matchJob = await prisma.job.create({
          data: {
            type: JobType.AI_MATCHING,
            status: "COMPLETED",
            progress: 100,
            totalItems: 1,
            processedItems: 1,
            userId: dbUser.id,
          },
        });
      }
      await prisma.aiMatch.create({
        data: {
          storeName: storeName || storeSku || "",
          systemName, storeSku,
          systemSku: systemSku || null,
          status: newStatus,
          confidence: newStatus === "ACCEPTED" ? 100 : 0,
          jobId: matchJob.id,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    if (fileCacheOk) return { success: true };
    return { success: false, error: error.message || "فشل حفظ المطابقة" };
  }
}
