"use server";

import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { parseStoreExcel, parseSystemExcel, parseShelfExcel } from "@/lib/excel/parser";
import { getFileBuffer, saveUploadedFile } from "@/lib/excel/file-store";
import { processDailyInventory } from "@/lib/inventory/daily-processor";
import { processFullInventory } from "@/lib/inventory/full-processor";
import { exportUpdatedStoreExcel, exportUpdatedShelfExcel, exportInventorySummary } from "@/lib/excel/exporter";
import { prisma } from "@/lib/prisma";
import { JobType } from "@prisma/client";
import { StoreProduct } from "@/types/excel";
import { InventoryResult } from "@/types/inventory";

export interface InventoryActionResult {
  success: boolean;
  jobId?: string;
  exportFileUrl?: string;
  summaryFileUrl?: string;
  stats?: {
    totalProcessed: number;
    totalDecreased: number;
    totalUnchanged: number;
    totalBlocked: number;
    totalZeroed: number;
    totalUpdated: number;
  };
  details?: InventoryResult[];
  error?: string;
}

export async function executeInventoryJob(
  storeFileUrl: string,
  systemFileUrl: string,
  type: "daily" | "full",
  shelfFileUrl?: string
): Promise<InventoryActionResult> {
  try {
    const perm = type === "daily" ? "inventory:daily" as const : "inventory:full" as const;
    const { username, role } = await requirePermission(perm).catch((e) => {
      throw new Error(e.message);
    });
    const jobType: JobType = type === "daily" ? JobType.DAILY_INVENTORY : JobType.FULL_INVENTORY;

    // 1. Read files
    const systemBuffer = await getFileBuffer(systemFileUrl);

    let storeProducts: StoreProduct[];
    let storeBuffer: Buffer;
    let useShelfFormat = false;

    if (shelfFileUrl) {
      // Use shelf file as source
      useShelfFormat = true;
      const shelfBuffer = await getFileBuffer(shelfFileUrl);
      storeBuffer = shelfBuffer;
      const parsedShelf = await parseShelfExcel(shelfBuffer, "shelf.xlsx");
      storeProducts = parsedShelf.data.map((s) => ({
        rowIndex: s.rowIndex,
        type: s.type,
        name: s.name,
        category: "",
        quantity: s.quantity,
        sellPrice: 0,
        sku: s.sku,
        costPrice: 0,
        option1: "",
        option2: "",
        option3: "",
      }));
    } else {
      // Use store file as source (existing behavior)
      storeBuffer = await getFileBuffer(storeFileUrl);
      const parsedStore = await parseStoreExcel(storeBuffer, "store.xlsx");
      storeProducts = parsedStore.data;
    }

    const parsedSystem = await parseSystemExcel(systemBuffer, "system.xlsx");

    // 3. Run matching and processing logic
    let processingResult;
    let updates;

    if (type === "daily") {
      const res = processDailyInventory(storeProducts, parsedSystem.data);
      processingResult = res.processingResult;
      updates = res.updates;
    } else {
      const res = processFullInventory(storeProducts, parsedSystem.data);
      processingResult = res.processingResult;
      updates = res.updates;
    }

    // 4. Write back to file
    let exportFileUrl: string;
    if (useShelfFormat) {
      const updatedShelfBuffer = await exportUpdatedShelfExcel(storeBuffer, updates);
      exportFileUrl = await saveUploadedFile(updatedShelfBuffer, `updated_shelf_${type}.xlsx`);
    } else {
      const updatedStoreBuffer = await exportUpdatedStoreExcel(storeBuffer, updates);
      exportFileUrl = await saveUploadedFile(updatedStoreBuffer, `updated_inventory_${type}.xlsx`);
    }

    // 4b. Generate summary export
    const summaryBuffer = await exportInventorySummary(
      processingResult.results.map(r => ({
        sku: r.sku,
        productName: r.productName,
        oldQuantity: r.oldQuantity,
        newQuantity: r.newQuantity,
        difference: r.difference,
      })),
      `inventory_summary_${type}.xlsx`
    );
    const summaryFileUrl = await saveUploadedFile(summaryBuffer, `inventory_summary_${type}.xlsx`);

    // 5. Try logging job to DB if user exists
    let jobId = `local-job-${Date.now()}`;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { username },
      });

      if (dbUser) {
        const job = await prisma.job.create({
          data: {
            type: jobType,
            status: "COMPLETED",
            progress: 100,
            totalItems: storeProducts.length,
            processedItems: storeProducts.length,
            storeFileUrl: shelfFileUrl || storeFileUrl,
            systemFileUrl,
            exportFileUrl,
            userId: dbUser.id,
            result: {
              stats: {
                totalProcessed: processingResult.totalProcessed,
                totalDecreased: processingResult.totalDecreased,
                totalUnchanged: processingResult.totalUnchanged,
                totalBlocked: processingResult.totalBlocked,
                totalZeroed: processingResult.totalZeroed,
                totalUpdated: processingResult.totalUpdated,
              },
              usedShelf: useShelfFormat,
            },
            inventoryLogs: {
              create: processingResult.results.map((r) => ({
                sku: r.sku,
                productName: r.productName,
                oldQuantity: r.oldQuantity,
                newQuantity: r.newQuantity,
                difference: r.difference,
                action: r.action,
              })),
            },
          },
        });
        jobId = job.id;
      }
    } catch (dbError) {
      console.warn("Could not save Job to database, running in DB-less mode:", dbError);
    }

    return {
      success: true,
      jobId,
      exportFileUrl,
      summaryFileUrl,
      stats: {
        totalProcessed: processingResult.totalProcessed,
        totalDecreased: processingResult.totalDecreased,
        totalUnchanged: processingResult.totalUnchanged,
        totalBlocked: processingResult.totalBlocked,
        totalZeroed: processingResult.totalZeroed,
        totalUpdated: processingResult.totalUpdated,
      },
      details: processingResult.results.map((r) => ({
        sku: r.sku,
        productName: r.productName,
        productType: r.productType,
        oldQuantity: r.oldQuantity,
        newQuantity: r.newQuantity,
        difference: r.difference,
        action: r.action,
      })),
    };
  } catch (error: any) {
    console.error("Execute inventory job action failed:", error);
    return {
      success: false,
      error: error.message || "حدث خطأ غير متوقع أثناء معالجة الجرد",
    };
  }
}
