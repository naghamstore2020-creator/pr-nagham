import { PricingResult } from "@/types/pricing";

/**
 * التحقق من صحة النتائج - تُرجع تحذيرات فقط (لا تمنع التنفيذ)
 */
export function validatePricingResults(results: PricingResult[]): string[] {
  const warnings: string[] = [];

  for (const result of results) {
    if (result.isExcluded) continue;
    if (!result.sku?.trim()) {
      warnings.push(`منتج بدون SKU: ${result.productName || "غير معروف"}`);
      continue;
    }

    if (result.newSellPrice === null || result.newSellPrice === undefined || Number.isNaN(result.newSellPrice)) {
      warnings.push(`SKU ${result.sku}: سعر البيع فارغ أو غير صالح`);
    } else if (result.newSellPrice < 0) {
      warnings.push(`SKU ${result.sku}: سعر البيع سالب (${result.newSellPrice})`);
    }

    if (result.newCostPrice !== null && result.newCostPrice !== undefined && result.newCostPrice < 0) {
      warnings.push(`SKU ${result.sku}: سعر التكلفة سالب (${result.newCostPrice})`);
    }
  }

  return warnings;
}
