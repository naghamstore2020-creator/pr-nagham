import ExcelJS from "exceljs";

export async function exportUpdatedShelfExcel(
  originalShelfBuffer: Buffer,
  updates: Array<{
    rowIndex: number;
    quantity: number;
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(originalShelfBuffer as any);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("ملف الرف فارغ أو لا يحتوي على صفحات عمل");
  }

  for (const update of updates) {
    const row = worksheet.getRow(update.rowIndex);
    row.getCell(6).value = update.quantity;
    row.commit();
  }

  const outputBuffer = await workbook.xlsx.writeBuffer();
  return outputBuffer as unknown as Buffer;
}

export async function exportUpdatedStoreExcel(
  originalStoreBuffer: Buffer,
  updates: Array<{
    rowIndex: number;
    quantity?: number;
    costPrice?: number;
    sellPrice?: number;
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(originalStoreBuffer as any);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("ملف المتجر فارغ أو لا يحتوي على صفحات عمل");
  }

  for (const update of updates) {
    const row = worksheet.getRow(update.rowIndex);
    
    if (update.quantity !== undefined) {
      row.getCell(7).value = update.quantity;
    }
    
    if (update.sellPrice !== undefined) {
      row.getCell(8).value = update.sellPrice;
    }

    if (update.costPrice !== undefined) {
      row.getCell(12).value = update.costPrice;
    }
    
    row.commit();
  }

  const outputBuffer = await workbook.xlsx.writeBuffer();
  return outputBuffer as unknown as Buffer;
}

interface InventoryRow {
  sku: string;
  productName: string;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
}

async function buildSummaryWorkbook(headers: string[], rows: any[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("ملخص");

  const headerRow = ws.addRow(headers);
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };

  for (const rowData of rows) {
    ws.addRow(rowData);
  }

  ws.columns.forEach((col) => { if (col) col.width = 22; });

  const buf = await workbook.xlsx.writeBuffer();
  return buf as unknown as Buffer;
}

export async function exportInventorySummary(
  results: InventoryRow[],
  fileName: string
): Promise<Buffer> {
  const headers = ["رمز المنتج", "اسم المنتج", "الكمية القديمة", "الكمية الجديدة", "الفرق"];
  const rows = results.map((r) => [r.sku, r.productName, r.oldQuantity, r.newQuantity, r.difference]);
  return buildSummaryWorkbook(headers, rows);
}

interface CostRow {
  sku: string;
  productName: string;
  oldCost: number;
  newCost: number;
  diff: number;
}

export async function exportCostSummary(results: CostRow[], fileName: string): Promise<Buffer> {
  const headers = ["رمز المنتج", "اسم المنتج", "سعر التكلفة القديم", "سعر التكلفة الجديد", "الفرق"];
  const rows = results.map((r) => [r.sku, r.productName, r.oldCost, r.newCost, r.diff]);
  return buildSummaryWorkbook(headers, rows);
}

interface SellRow {
  sku: string;
  productName: string;
  oldSell: number;
  newSell: number;
  diff: number;
}

export async function exportSellSummary(results: SellRow[], fileName: string): Promise<Buffer> {
  const headers = ["رمز المنتج", "اسم المنتج", "سعر البيع القديم", "سعر البيع الجديد", "الفرق"];
  const rows = results.map((r) => [r.sku, r.productName, r.oldSell, r.newSell, r.diff]);
  return buildSummaryWorkbook(headers, rows);
}

interface FullPricingRow {
  sku: string;
  productName: string;
  oldCost: number;
  newCost: number;
  costDiff: number;
  oldSell: number;
  newSell: number;
  sellDiff: number;
}

export async function exportFullPricingSummary(results: FullPricingRow[], fileName: string): Promise<Buffer> {
  const headers = [
    "رمز المنتج", "اسم المنتج",
    "سعر التكلفة القديم", "سعر التكلفة الجديد", "الفرق بين سعري التكلفة",
    "سعر البيع القديم", "سعر البيع الجديد", "الفرق بين سعري البيع",
  ];
  const rows = results.map((r) => [r.sku, r.productName, r.oldCost, r.newCost, r.costDiff, r.oldSell, r.newSell, r.sellDiff]);
  return buildSummaryWorkbook(headers, rows);
}

interface MatchRow {
  storeSku: string;
  storeName: string;
  systemName: string;
  confidence: number;
}

export async function exportMatchSummary(results: MatchRow[], fileName: string): Promise<Buffer> {
  const headers = ["رمز المنتج", "اسم المنتج في المتجر", "اسم المنتج في جرد النظام", "نسبة المطابقة"];
  const rows = results.map((r) => [r.storeSku, r.storeName, r.systemName, r.confidence]);
  return buildSummaryWorkbook(headers, rows);
}
