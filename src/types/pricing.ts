export type PricingType = 'cost' | 'sell' | 'full';

export interface PricingResult {
  sku: string;
  productName: string;
  oldCostPrice: number;
  newCostPrice: number;
  oldSellPrice: number;
  newSellPrice: number;
  priceBeforeVAT: number;
  profit: number;
  isVariant: boolean;
  isExcluded: boolean;
  parentSku?: string;
  action?: 'updated' | 'unchanged';
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface PricingCalculation {
  base: number;
  fees: number;
  vat: number;
  total: number;
  finalPrice: number;
  priceBeforeVAT: number;
}

export interface PricingConfig {
  profit: number;
  feePercentage: number; // 6.99%
  fixedFee: number;      // 1.5 SAR
  vatPercentage: number; // 15%
  excludedSkus: string[];
  excludedCategories: string[];
}

export interface VariantGroup {
  parentSku: string;
  parentName: string;
  variants: VariantProduct[];
  highestPrice: number;
  lowestPrice: number;
}

export interface VariantProduct {
  sku: string;
  name: string;
  option1: string;
  option2: string;
  option3: string;
  costPrice: number;
  calculatedPrice: number;
}

export interface PricingProcessingResult {
  results: PricingResult[];
  totalProcessed: number;
  totalUpdated: number;
  totalUnchanged: number;
  totalExcluded: number;
  errors: string[];
  operationLogs?: string[];
}
