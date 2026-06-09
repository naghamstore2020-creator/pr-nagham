/**
 * توليد ملفات Excel التجريبية في public/uploads
 * تشغيل: npx tsx scripts/generate-demo-files.ts
 */
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { DEMO_STORE_PRODUCTS, DEMO_SYSTEM_PRODUCTS } from "../src/constants/demo-data";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function buildStoreWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("منتجات المتجر");

  ws.getRow(1).values = [
    , "نوع المنتج", "اسم المنتج", "التصنيف", , , "الكمية", "سعر البيع", , , "SKU", "سعر التكلفة",
  ];

  for (const p of DEMO_STORE_PRODUCTS) {
    const row = ws.getRow(p.rowIndex);
    row.getCell(2).value = p.type;
    row.getCell(3).value = p.name;
    row.getCell(4).value = p.category;
    row.getCell(7).value = p.quantity;
    row.getCell(8).value = p.sellPrice;
    row.getCell(11).value = p.sku;
    row.getCell(12).value = p.costPrice;
    row.getCell(33).value = p.option1;
    row.getCell(37).value = p.option2;
    row.getCell(41).value = p.option3;
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function buildSystemWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("النظام");
  ws.getRow(1).values = ["SKU", "اسم المنتج", "الكمية", "سعر التكلفة"];

  DEMO_SYSTEM_PRODUCTS.forEach((p, i) => {
    const row = ws.getRow(i + 2);
    row.getCell(1).value = p.sku;
    row.getCell(2).value = p.name;
    row.getCell(3).value = p.quantity;
    row.getCell(4).value = p.costPrice;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function buildShelfWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("الرف");
  ws.getRow(1).values = [, "نوع المنتج", "اسم المنتج", "SKU", , "الكمية"];

  const shelfItems = DEMO_STORE_PRODUCTS.filter((p) => p.type === "product" || p.type === "variant");
  shelfItems.forEach((p, i) => {
    const row = ws.getRow(i + 2);
    row.getCell(2).value = p.type === "variant" ? "خيار" : "منتج";
    row.getCell(3).value = p.name;
    row.getCell(4).value = p.sku;
    row.getCell(6).value = p.quantity;
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function main() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const files: Array<{ name: string; buffer: Buffer }> = [
    { name: "demo_store.xlsx", buffer: await buildStoreWorkbook() },
    { name: "demo_system.xlsx", buffer: await buildSystemWorkbook() },
    { name: "demo_shelf.xlsx", buffer: await buildShelfWorkbook() },
  ];

  for (const { name, buffer } of files) {
    const filePath = path.join(UPLOAD_DIR, name);
    await fs.promises.writeFile(filePath, buffer);
    console.log(`✓ ${name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
