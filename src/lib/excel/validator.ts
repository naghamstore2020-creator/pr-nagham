import { FileValidationResult, FileType } from "@/types/excel";
import { FILE_LIMITS } from "@/constants/excel-columns";
import ExcelJS from "exceljs";

export async function validateExcelFile(
  buffer: Buffer,
  type: FileType
): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    rowCount: 0,
    columnCount: 0,
  };

  if (buffer.length > FILE_LIMITS.MAX_SIZE_BYTES) {
    result.isValid = false;
    result.errors.push(`حجم الملف يتجاوز الحد الأقصى المسموح به (${FILE_LIMITS.MAX_SIZE_MB} ميجابايت)`);
    return result;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      result.isValid = false;
      result.errors.push("ملف Excel فارغ أو لا يحتوي على صفحات عمل");
      return result;
    }

    result.rowCount = worksheet.rowCount;
    result.columnCount = worksheet.columnCount;

    if (result.rowCount < 2) {
      result.isValid = false;
      result.errors.push("ملف Excel يجب أن يحتوي على صف رأس وصف بيانات واحد على الأقل");
      return result;
    }

    if (result.rowCount > FILE_LIMITS.MAX_ROWS) {
      result.isValid = false;
      result.errors.push(`عدد الصفوف (${result.rowCount}) يتجاوز الحد الأقصى المسموح به (${FILE_LIMITS.MAX_ROWS} صف)`);
    }

    // Validate headers/required columns (ExcelJS is 1-based index)
    const headerRow = worksheet.getRow(1);
    
    if (type === "store") {
      const missingColumns: string[] = [];

      // B (2), C (3), D (4), G (7), H (8), K (11), L (12)
      if (!headerRow.getCell(2).value) missingColumns.push("نوع المنتج (B)");
      if (!headerRow.getCell(3).value) missingColumns.push("اسم المنتج (C)");
      if (!headerRow.getCell(4).value) missingColumns.push("التصنيف (D)");
      if (!headerRow.getCell(7).value) missingColumns.push("الكمية (G)");
      if (!headerRow.getCell(8).value) missingColumns.push("سعر البيع (H)");
      if (!headerRow.getCell(11).value) missingColumns.push("SKU (K)");
      if (!headerRow.getCell(12).value) missingColumns.push("سعر التكلفة (L)");

      if (missingColumns.length > 0) {
        result.isValid = false;
        result.errors.push(`أعمدة مطلوبة مفقودة في ملف المتجر: ${missingColumns.join("، ")}`);
      }
    } else if (type === "shelf") {
      const missingColumns: string[] = [];

      // B (2), C (3), D (4), F (6)
      if (!headerRow.getCell(2).value) missingColumns.push("نوع المنتج (B)");
      if (!headerRow.getCell(3).value) missingColumns.push("اسم المنتج (C)");
      if (!headerRow.getCell(4).value) missingColumns.push("رمز المنتج (D)");
      if (!headerRow.getCell(6).value) missingColumns.push("الكمية (F)");

      if (missingColumns.length > 0) {
        result.isValid = false;
        result.errors.push(`أعمدة مطلوبة مفقودة في ملف الرف: ${missingColumns.join("، ")}`);
      }
    } else if (type === "system") {
      const missingColumns: string[] = [];

      // A (1), B (2), C (3), D (4)
      if (!headerRow.getCell(1).value) missingColumns.push("SKU (A)");
      if (!headerRow.getCell(2).value) missingColumns.push("اسم المنتج (B)");
      if (!headerRow.getCell(3).value) missingColumns.push("الكمية (C)");
      if (!headerRow.getCell(4).value) missingColumns.push("سعر التكلفة (D)");

      if (missingColumns.length > 0) {
        result.isValid = false;
        result.errors.push(`أعمدة مطلوبة مفقودة في ملف النظام: ${missingColumns.join("، ")}`);
      }
    }
  } catch (error: any) {
    result.isValid = false;
    result.errors.push(`فشل قراءة الملف: ${error.message || "خطأ غير معروف"}`);
  }

  return result;
}
