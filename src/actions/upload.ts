"use server";

import { validateExcelFile } from "@/lib/excel/validator";
import { saveUploadedFile } from "@/lib/excel/file-store";
import { FileType } from "@/types/excel";
import { requirePermission } from "@/lib/permissions";

export interface UploadActionResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  rowCount?: number;
  columnCount?: number;
  error?: string;
}

const PERMISSION_MAP: Record<FileType, "upload:store" | "upload:system" | "upload:shelf"> = {
  store: "upload:store",
  system: "upload:system",
  shelf: "upload:shelf",
};

export async function uploadExcelFile(
  formData: FormData,
  type: FileType
): Promise<UploadActionResult> {
  try {
    await requirePermission(PERMISSION_MAP[type]);
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "لم يتم تحديد أي ملف" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file structure and columns using ExcelJS
    const validation = await validateExcelFile(buffer, type);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join("، ") };
    }

    // Save file locally to public/uploads
    const fileUrl = await saveUploadedFile(buffer, file.name);

    return {
      success: true,
      fileUrl,
      fileName: file.name,
      rowCount: validation.rowCount,
      columnCount: validation.columnCount,
    };
  } catch (error: any) {
    console.error("File upload action failed:", error);
    return {
      success: false,
      error: error.message || "حدث خطأ غير متوقع أثناء رفع الملف",
    };
  }
}
