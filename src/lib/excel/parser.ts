import { StoreProduct, SystemProduct, ShelfProduct, ParsedExcelData } from "@/types/excel";
import { parseNumber, sanitizeString } from "./sanitizer";
import ExcelJS from "exceljs";

function getCellValueString(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return "";
  if (typeof cell.value === "object") {
    if ("richText" in cell.value && Array.isArray(cell.value.richText)) {
      return cell.value.richText.map((t: any) => t.text).join("");
    }
    if ("text" in cell.value) {
      return String(cell.value.text);
    }
    if ("result" in cell.value) {
      return String(cell.value.result);
    }
    return JSON.stringify(cell.value);
  }
  return String(cell.value);
}

export async function parseStoreExcel(
  buffer: Buffer,
  fileName: string
): Promise<ParsedExcelData<StoreProduct>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  
  const worksheet = workbook.worksheets[0];
  const data: StoreProduct[] = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    
    const type = sanitizeString(getCellValueString(row.getCell(2))); // B (2)
    const name = sanitizeString(getCellValueString(row.getCell(3))); // C (3)
    const category = sanitizeString(getCellValueString(row.getCell(4))); // D (4)
    const quantity = Math.round(parseNumber(getCellValueString(row.getCell(7)))); // G (7)
    const sellPrice = parseNumber(getCellValueString(row.getCell(8))); // H (8)
    const sku = sanitizeString(getCellValueString(row.getCell(11))); // K (11)
    const costPrice = parseNumber(getCellValueString(row.getCell(12))); // L (12)
    
    // Columns: AG (33), AK (37), AO (41) - representing option variants
    const option1 = sanitizeString(getCellValueString(row.getCell(33))); 
    const option2 = sanitizeString(getCellValueString(row.getCell(37))); 
    const option3 = sanitizeString(getCellValueString(row.getCell(41))); 

    if (name) {
      data.push({
        rowIndex: rowNumber,
        type,
        name,
        category,
        quantity,
        sellPrice,
        sku,
        costPrice,
        option1,
        option2,
        option3,
      });
    }
  });

  return {
    data,
    totalRows: worksheet.rowCount - 1,
    fileName,
  };
}

export async function parseShelfExcel(
  buffer: Buffer,
  fileName: string
): Promise<ParsedExcelData<ShelfProduct>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  
  const worksheet = workbook.worksheets[0];
  const data: ShelfProduct[] = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    
    const type = sanitizeString(getCellValueString(row.getCell(2))); // B (2)
    const name = sanitizeString(getCellValueString(row.getCell(3))); // C (3)
    const sku = sanitizeString(getCellValueString(row.getCell(4))); // D (4)
    const quantity = Math.round(parseNumber(getCellValueString(row.getCell(6)))); // F (6)
    
    if (name || sku) {
      data.push({
        rowIndex: rowNumber,
        type,
        name,
        sku,
        quantity,
      });
    }
  });

  return {
    data,
    totalRows: worksheet.rowCount - 1,
    fileName,
  };
}

export async function parseSystemExcel(
  buffer: Buffer,
  fileName: string
): Promise<ParsedExcelData<SystemProduct>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  
  const worksheet = workbook.worksheets[0];
  const data: SystemProduct[] = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    
    const sku = sanitizeString(getCellValueString(row.getCell(1))); // A (1)
    const name = sanitizeString(getCellValueString(row.getCell(2))); // B (2)
    const quantity = Math.round(parseNumber(getCellValueString(row.getCell(3)))); // C (3)
    const costPrice = parseNumber(getCellValueString(row.getCell(4))); // D (4)
    
    if (sku || name) {
      data.push({
        sku,
        name,
        quantity,
        costPrice,
      });
    }
  });

  return {
    data,
    totalRows: worksheet.rowCount - 1,
    fileName,
  };
}
