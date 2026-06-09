"use server";

import { requirePermission } from "@/lib/permissions";
import { parseStoreExcel, parseSystemExcel } from "@/lib/excel/parser";
import { getFileBuffer, saveUploadedFile } from "@/lib/excel/file-store";
import { processCostUpdate } from "@/lib/pricing/cost-updater";
import { processSellPricing } from "@/lib/pricing/sell-calculator";
import { processFullUpdate } from "@/lib/pricing/full-updater";
import { exportUpdatedStoreExcel, exportCostSummary, exportSellSummary, exportFullPricingSummary } from "@/lib/excel/exporter";
import { prisma } from "@/lib/prisma";
import { JobType } from "@prisma/client";

import { PricingResult } from "@/types/pricing";

function requireSelectedCategories(selectedSubs: string[]): void {
  if (!selectedSubs || selectedSubs.length === 0) {
    throw new Error("يرجى اختيار تصنيف واحد على الأقل لتعديل أسعاره");
  }
}

async function persistPricingJob(params: {
  username: string;
  type: JobType;
  storeFileUrl: string;
  systemFileUrl?: string;
  exportFileUrl: string;
  totalItems: number;
  stats: {
    totalProcessed: number;
    totalUpdated: number;
    totalUnchanged: number;
    totalExcluded: number;
  };
  results: PricingResult[];
  profit?: number;
  operationLogs?: string[];
  validationErrors?: string[];
}): Promise<string> {
  let jobId = `local-${params.type.toLowerCase()}-job-${Date.now()}`;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { username: params.username },
    });

    if (dbUser) {
      const job = await prisma.job.create({
        data: {
          type: params.type,
          status: "COMPLETED",
          progress: 100,
          totalItems: params.totalItems,
          processedItems: params.totalItems,
          storeFileUrl: params.storeFileUrl,
          systemFileUrl: params.systemFileUrl,
          exportFileUrl: params.exportFileUrl,
          userId: dbUser.id,
          result: {
            stats: params.stats,
            operationLogs: params.operationLogs ?? [],
            validationErrors: params.validationErrors ?? [],
          },
          pricingLogs: {
            create: params.results.map((r) => ({
              sku: r.sku,
              productName: r.productName,
              oldCostPrice: r.oldCostPrice,
              newCostPrice: r.newCostPrice,
              oldSellPrice: r.oldSellPrice,
              newSellPrice: r.newSellPrice,
              profit: params.profit,
              isVariant: r.isVariant,
              isExcluded: r.isExcluded,
            })),
          },
        },
      });
      jobId = job.id;

      if (params.operationLogs && params.operationLogs.length > 0) {
        await prisma.auditLog.create({
          data: {
            userId: dbUser.id,
            action: params.type,
            details: {
              jobId: job.id,
              operationLogs: params.operationLogs,
              validationErrors: params.validationErrors ?? [],
              stats: params.stats,
            },
          },
        });
      }
    }
  } catch (dbError) {
    console.warn("Could not save Job to DB:", dbError);
  }

  return jobId;
}

function mapPricingDetails(results: PricingResult[]): PricingResult[] {
  return results.map((r) => ({
    sku: r.sku,
    productName: r.productName,
    oldCostPrice: r.oldCostPrice,
    newCostPrice: r.newCostPrice,
    oldSellPrice: r.oldSellPrice,
    newSellPrice: r.newSellPrice,
    priceBeforeVAT: r.priceBeforeVAT,
    profit: r.profit,
    isVariant: r.isVariant,
    isExcluded: r.isExcluded,
    parentSku: r.parentSku,
    action: r.action,
    option1: r.option1,
    option2: r.option2,
    option3: r.option3,
  }));
}

export interface PricingActionResult {
  success: boolean;
  jobId?: string;
  exportFileUrl?: string;
  summaryFileUrl?: string;
  stats?: {
    totalProcessed: number;
    totalUpdated: number;
    totalUnchanged: number;
    totalExcluded: number;
  };
  details?: PricingResult[];
  operationLogs?: string[];
  validationErrors?: string[];
  error?: string;
}

export async function executeCostPricingJob(
  storeFileUrl: string,
  systemFileUrl: string,
  selectedSubs: string[] = []
): Promise<PricingActionResult> {
  try {
    const { username } = await requirePermission("pricing:cost");
    requireSelectedCategories(selectedSubs);

    const storeBuffer = await getFileBuffer(storeFileUrl);
    const systemBuffer = await getFileBuffer(systemFileUrl);

    const parsedStore = await parseStoreExcel(storeBuffer, "store.xlsx");
    const parsedSystem = await parseSystemExcel(systemBuffer, "system.xlsx");

    const { processingResult, updates } = processCostUpdate(
      parsedStore.data,
      parsedSystem.data,
      selectedSubs
    );

    const updatedStoreBuffer = await exportUpdatedStoreExcel(storeBuffer, updates);
    const exportFileUrl = await saveUploadedFile(updatedStoreBuffer, "updated_costs.xlsx");

    const summaryBuffer = await exportCostSummary(
      processingResult.results.map(r => ({
        sku: r.sku,
        productName: r.productName,
        oldCost: r.oldCostPrice,
        newCost: r.newCostPrice,
        diff: r.newCostPrice - r.oldCostPrice,
      })),
      "cost_summary.xlsx"
    );
    const summaryFileUrl = await saveUploadedFile(summaryBuffer, "cost_summary.xlsx");

    let jobId = `local-cost-job-${Date.now()}`;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { username },
      });

      if (dbUser) {
        const job = await prisma.job.create({
          data: {
            type: JobType.COST_UPDATE,
            status: "COMPLETED",
            progress: 100,
            totalItems: parsedStore.data.length,
            processedItems: parsedStore.data.length,
            storeFileUrl,
            systemFileUrl,
            exportFileUrl,
            userId: dbUser.id,
            result: {
              stats: {
                totalProcessed: processingResult.totalProcessed,
                totalUpdated: processingResult.totalUpdated,
                totalUnchanged: processingResult.totalUnchanged,
                totalExcluded: processingResult.totalExcluded,
              }
            },
            pricingLogs: {
              create: processingResult.results.map((r) => ({
                sku: r.sku,
                productName: r.productName,
                oldCostPrice: r.oldCostPrice,
                newCostPrice: r.newCostPrice,
                oldSellPrice: r.oldSellPrice,
                newSellPrice: r.newSellPrice,
                isVariant: r.isVariant,
                isExcluded: r.isExcluded,
              })),
            },
          },
        });
        jobId = job.id;
      }
    } catch (dbError) {
      console.warn("Could not save Job to DB:", dbError);
    }

    return {
      success: true,
      jobId,
      exportFileUrl,
      summaryFileUrl,
      stats: {
        totalProcessed: processingResult.totalProcessed,
        totalUpdated: processingResult.totalUpdated,
        totalUnchanged: processingResult.totalUnchanged,
        totalExcluded: processingResult.totalExcluded,
      },
      details: processingResult.results.map((r) => ({
        sku: r.sku,
        productName: r.productName,
        oldCostPrice: r.oldCostPrice,
        newCostPrice: r.newCostPrice,
        oldSellPrice: r.oldSellPrice,
        newSellPrice: r.newSellPrice,
        priceBeforeVAT: r.priceBeforeVAT,
        profit: r.profit,
        isVariant: r.isVariant,
        isExcluded: r.isExcluded,
        parentSku: r.parentSku,
        action: r.action,
        option1: r.option1,
        option2: r.option2,
        option3: r.option3,
      })),
    };
  } catch (error: unknown) {
    console.error("Execute cost job failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء تحديث أسعار التكلفة",
    };
  }
}

export async function executeSellPricingJob(
  storeFileUrl: string,
  profit: number,
  excludedSkus: string[] = [],
  selectedSubs: string[] = []
): Promise<PricingActionResult> {
  try {
    const { username } = await requirePermission("pricing:sell");
    requireSelectedCategories(selectedSubs);

    const storeBuffer = await getFileBuffer(storeFileUrl);
    const parsedStore = await parseStoreExcel(storeBuffer, "store.xlsx");

    const { processingResult, updates } = processSellPricing(
      parsedStore.data,
      profit,
      excludedSkus,
      selectedSubs
    );

    const updatedStoreBuffer = await exportUpdatedStoreExcel(storeBuffer, updates);
    const exportFileUrl = await saveUploadedFile(updatedStoreBuffer, "updated_sell_prices.xlsx");

    const summaryBuffer = await exportSellSummary(
      processingResult.results.map(r => ({
        sku: r.sku,
        productName: r.productName,
        oldSell: r.oldSellPrice,
        newSell: r.newSellPrice,
        diff: r.newSellPrice - r.oldSellPrice,
      })),
      "sell_summary.xlsx"
    );
    const summaryFileUrl = await saveUploadedFile(summaryBuffer, "sell_summary.xlsx");

    const stats = {
      totalProcessed: processingResult.totalProcessed,
      totalUpdated: processingResult.totalUpdated,
      totalUnchanged: processingResult.totalUnchanged,
      totalExcluded: processingResult.totalExcluded,
    };

    const jobId = await persistPricingJob({
      username,
      type: JobType.SELL_UPDATE,
      storeFileUrl,
      exportFileUrl,
      totalItems: parsedStore.data.length,
      stats,
      results: processingResult.results,
      profit,
      operationLogs: processingResult.operationLogs,
      validationErrors: processingResult.errors,
    });

    return {
      success: true,
      jobId,
      exportFileUrl,
      summaryFileUrl,
      stats,
      details: mapPricingDetails(processingResult.results),
      operationLogs: processingResult.operationLogs,
      validationErrors: processingResult.errors,
    };
  } catch (error: unknown) {
    console.error("Execute sell job failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء تحديث أسعار البيع",
    };
  }
}

export async function executeFullUpdateJob(
  storeFileUrl: string,
  systemFileUrl: string,
  profit: number,
  excludedSkus: string[] = [],
  selectedSubs: string[] = []
): Promise<PricingActionResult> {
  try {
    const { username } = await requirePermission("pricing:full");
    requireSelectedCategories(selectedSubs);

    const storeBuffer = await getFileBuffer(storeFileUrl);
    const systemBuffer = await getFileBuffer(systemFileUrl);

    const parsedStore = await parseStoreExcel(storeBuffer, "store.xlsx");
    const parsedSystem = await parseSystemExcel(systemBuffer, "system.xlsx");

    const { processingResult, costUpdates, sellUpdates } = processFullUpdate(
      parsedStore.data,
      parsedSystem.data,
      profit,
      excludedSkus,
      selectedSubs
    );

    // دمج تحديثات التكلفة والبيع لنفس الصف في كائن واحد لتجنب التعارض عند الكتابة
    const mergedUpdatesMap = new Map<number, { rowIndex: number; costPrice?: number; sellPrice?: number }>();
    for (const u of costUpdates) {
      mergedUpdatesMap.set(u.rowIndex, { rowIndex: u.rowIndex, costPrice: u.costPrice });
    }
    for (const u of sellUpdates) {
      const existing = mergedUpdatesMap.get(u.rowIndex);
      if (existing) {
        existing.sellPrice = u.sellPrice;
      } else {
        mergedUpdatesMap.set(u.rowIndex, { rowIndex: u.rowIndex, sellPrice: u.sellPrice });
      }
    }
    const allUpdates = Array.from(mergedUpdatesMap.values());
    const updatedStoreBuffer = await exportUpdatedStoreExcel(storeBuffer, allUpdates);
    const exportFileUrl = await saveUploadedFile(updatedStoreBuffer, "updated_full.xlsx");

    const summaryBuffer = await exportFullPricingSummary(
      processingResult.results.map(r => ({
        sku: r.sku,
        productName: r.productName,
        oldCost: r.oldCostPrice,
        newCost: r.newCostPrice,
        costDiff: r.newCostPrice - r.oldCostPrice,
        oldSell: r.oldSellPrice,
        newSell: r.newSellPrice,
        sellDiff: r.newSellPrice - r.oldSellPrice,
      })),
      "full_summary.xlsx"
    );
    const summaryFileUrl = await saveUploadedFile(summaryBuffer, "full_summary.xlsx");

    const stats = {
      totalProcessed: processingResult.totalProcessed,
      totalUpdated: processingResult.totalUpdated,
      totalUnchanged: processingResult.totalUnchanged,
      totalExcluded: processingResult.totalExcluded,
    };

    const jobId = await persistPricingJob({
      username,
      type: JobType.FULL_UPDATE,
      storeFileUrl,
      systemFileUrl,
      exportFileUrl,
      totalItems: parsedStore.data.length,
      stats,
      results: processingResult.results,
      profit,
      operationLogs: processingResult.operationLogs,
      validationErrors: processingResult.errors,
    });

    return {
      success: true,
      jobId,
      exportFileUrl,
      summaryFileUrl,
      stats,
      details: mapPricingDetails(processingResult.results),
      operationLogs: processingResult.operationLogs,
      validationErrors: processingResult.errors,
    };
  } catch (error: unknown) {
    console.error("Execute full pricing job failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء تحديث التسعير الكامل",
    };
  }
}
