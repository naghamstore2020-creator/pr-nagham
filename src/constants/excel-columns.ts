import { STORE_COLUMNS, SYSTEM_COLUMNS, SHELF_COLUMNS } from '@/types/excel';

// أسماء الأعمدة المطلوبة لملف المتجر
export const STORE_REQUIRED_COLUMNS = {
  [STORE_COLUMNS.TYPE]: 'نوع المنتج (B)',
  [STORE_COLUMNS.NAME]: 'اسم المنتج (C)',
  [STORE_COLUMNS.CATEGORY]: 'التصنيف (D)',
  [STORE_COLUMNS.QUANTITY]: 'الكمية (G)',
  [STORE_COLUMNS.SELL_PRICE]: 'سعر البيع (H)',
  [STORE_COLUMNS.SKU]: 'SKU (K)',
  [STORE_COLUMNS.COST_PRICE]: 'سعر التكلفة (L)',
} as const;

// أسماء الأعمدة المطلوبة لملف النظام
export const SYSTEM_REQUIRED_COLUMNS = {
  [SYSTEM_COLUMNS.SKU]: 'SKU (A)',
  [SYSTEM_COLUMNS.NAME]: 'اسم المنتج (B)',
  [SYSTEM_COLUMNS.QUANTITY]: 'الكمية (C)',
  [SYSTEM_COLUMNS.COST_PRICE]: 'سعر التكلفة (D)',
} as const;

// أسماء الأعمدة المطلوبة لملف الرف
export const SHELF_REQUIRED_COLUMNS = {
  [SHELF_COLUMNS.TYPE]: 'نوع المنتج (B)',
  [SHELF_COLUMNS.NAME]: 'اسم المنتج (C)',
  [SHELF_COLUMNS.SKU]: 'رمز المنتج (D)',
  [SHELF_COLUMNS.QUANTITY]: 'الكمية (F)',
} as const;

// حدود الملفات
export const FILE_LIMITS = {
  MAX_SIZE_MB: 50,
  MAX_SIZE_BYTES: 50 * 1024 * 1024,
  MAX_ROWS: 100000,
  MAX_PRODUCTS: 50000,
  ALLOWED_EXTENSIONS: ['.xlsx'],
  ALLOWED_MIME_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// حدود وقت التنفيذ
export const EXECUTION_LIMITS = {
  MAX_EXECUTION_TIME_MS: 15 * 60 * 1000, // 15 دقيقة
  FILE_LOAD_TIMEOUT_MS: 10 * 1000,       // 10 ثوان
  ANALYSIS_TIMEOUT_MS: 2 * 60 * 1000,    // 2 دقيقة
  EXPORT_TIMEOUT_MS: 1 * 60 * 1000,      // 1 دقيقة
} as const;
