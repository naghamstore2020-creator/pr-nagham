export type InventoryType = 'daily' | 'full';

export interface InventoryResult {
  sku: string;
  productName: string;
  productType: string;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  action: 'decreased' | 'unchanged' | 'increase_blocked' | 'zeroed' | 'updated';
}

export interface InventoryProcessingResult {
  results: InventoryResult[];
  totalProcessed: number;
  totalDecreased: number;
  totalUnchanged: number;
  totalBlocked: number;
  totalZeroed: number;
  totalUpdated: number;
  errors: string[];
}

export interface InventoryProgress {
  current: number;
  total: number;
  percentage: number;
  currentProduct: string;
  estimatedTimeRemaining: number; // seconds
}
