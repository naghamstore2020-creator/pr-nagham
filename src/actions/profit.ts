"use server";

import { parseStoreExcel } from "@/lib/excel/parser";
import { getFileBuffer, saveUploadedFile } from "@/lib/excel/file-store";
import { calculateProfit, ProfitBreakdown } from "@/lib/profit/calculator";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";

export interface ProfitItem {
  sku: string;
  productName: string;
  options: string;
  costPrice: number;
  sellPrice: number;
  breakdown: ProfitBreakdown;
}

export interface ProfitResult {
  success: boolean;
  items?: ProfitItem[];
  error?: string;
}

export async function analyzeProfits(storeFileUrl: string): Promise<ProfitResult> {
  try {
    const buffer = await getFileBuffer(storeFileUrl);
    const parsed = await parseStoreExcel(buffer, "store.xlsx");

    const items: ProfitItem[] = parsed.data
      .filter((p) => p.costPrice > 0 && p.sellPrice > 0)
      .map((p) => {
        const options = [p.option1, p.option2, p.option3].filter(Boolean).join(" - ");
        const breakdown = calculateProfit({ costPrice: p.costPrice, sellPrice: p.sellPrice });
        return {
          sku: p.sku || "",
          productName: p.name,
          options,
          costPrice: p.costPrice,
          sellPrice: p.sellPrice,
          breakdown,
        };
      });

    return { success: true, items };
  } catch (error: any) {
    console.error("Profit analysis failed:", error);
    return { success: false, error: error.message || "فشل تحليل الأرباح" };
  }
}

export async function exportProfitExcel(items: ProfitItem[]): Promise<{ buffer?: string; error?: string }> {
  try {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("تحليل الأرباح");

    const headers = [
      "رمز المنتج", "اسم المنتج", "خيارات المنتج",
      "سعر التكلفة", "سعر البيع",
      "التكلفة بعد الضريبة", "سعر البيع بعد الضريبة",
      "صافي مدى", "ربح مدى",
      "صافي فيزا", "ربح فيزا",
      "صافي تمارا", "ربح تمارا",
    ];
    const headerRow = ws.addRow(headers);
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
    headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };

    for (const item of items) {
      ws.addRow([
        item.sku, item.productName, item.options,
        item.costPrice, item.sellPrice,
        item.breakdown.costAfterVAT, item.breakdown.sellAfterVAT,
        item.breakdown.madaNet, item.breakdown.madaProfit,
        item.breakdown.visaNet, item.breakdown.visaProfit,
        item.breakdown.tamaraNet, item.breakdown.tamaraProfit,
      ]);
    }

    ws.columns.forEach((col) => { if (col) col.width = 20; });

    const buf = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buf as any).toString("base64");
    return { buffer: base64 };
  } catch (error: any) {
    return { error: error.message || "فشل تصدير Excel" };
  }
}
