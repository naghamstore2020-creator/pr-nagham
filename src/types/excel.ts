// هيكلة بيانات ملف المتجر
export interface StoreProduct {
  rowIndex: number;
  type: string;           // العمود B - نوع المنتج
  name: string;           // العمود C - اسم المنتج
  category: string;       // العمود D - التصنيف
  quantity: number;       // العمود G - الكمية
  sellPrice: number;      // العمود H - سعر البيع
  sku: string;            // العمود K - SKU
  costPrice: number;      // العمود L - سعر التكلفة
  option1: string;        // العمود AG - الخيار 1
  option2: string;        // العمود AK - الخيار 2
  option3: string;        // العمود AO - الخيار 3
}

// هيكلة بيانات ملف الرف (الجرد اليدوي)
export interface ShelfProduct {
  rowIndex: number;
  type: string;           // العمود B - نوع المنتج (منتج - خيار)
  name: string;           // العمود C - اسم المنتج
  sku: string;            // العمود D - رمز المنتج
  quantity: number;       // العمود F - الكمية
}

// هيكلة بيانات ملف النظام (ERP/POS)
export interface SystemProduct {
  sku: string;            // العمود A - SKU
  name: string;           // العمود B - اسم المنتج
  quantity: number;       // العمود C - الكمية
  costPrice: number;      // العمود D - سعر التكلفة
}

// أعمدة ملف المتجر (0-indexed)
export const STORE_COLUMNS = {
  TYPE: 1,        // B
  NAME: 2,        // C
  CATEGORY: 3,    // D
  QUANTITY: 6,    // G
  SELL_PRICE: 7,  // H
  SKU: 10,        // K
  COST_PRICE: 11, // L
  OPTION1: 32,    // AG
  OPTION2: 36,    // AK
  OPTION3: 40,    // AO
} as const;

// أعمدة ملف الرف (0-indexed)
export const SHELF_COLUMNS = {
  TYPE: 1,        // B
  NAME: 2,        // C
  SKU: 3,         // D
  QUANTITY: 5,    // F
} as const;

// أعمدة ملف النظام (0-indexed)
export const SYSTEM_COLUMNS = {
  SKU: 0,         // A
  NAME: 1,        // B
  QUANTITY: 2,    // C
  COST_PRICE: 3,  // D
} as const;

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
}

export interface ParsedExcelData<T> {
  data: T[];
  totalRows: number;
  fileName: string;
}

export type FileType = 'store' | 'system' | 'shelf';
