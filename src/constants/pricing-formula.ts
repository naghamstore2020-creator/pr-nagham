import type { PricingConfig } from '@/types/pricing';

// معادلة التسعير الافتراضية
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  profit: 0,               // يتم تحديده من المستخدم
  feePercentage: 0.0699,   // 6.99%
  fixedFee: 1.5,           // 1.5 ريال
  vatPercentage: 0.15,     // 15%
  excludedSkus: [],
  excludedCategories: [],
};

/**
 * حساب سعر البيع النهائي
 * 
 * المعادلة:
 * 1. Base = CostPrice + Profit
 * 2. Fees = Base × 0.0699 + 1.5
 * 3. VAT = Fees × 0.15
 * 4. Total = Base + Fees + VAT
 * 5. Final = ⌈Total × 1.15⌉ (تقريب لأعلى)
 * 6. PriceBeforeVAT = Final / 1.15
 */
export function calculateSellPrice(costPrice: number, profit: number) {
  const base = Number(costPrice) + Number(profit);
  const fees = base * DEFAULT_PRICING_CONFIG.feePercentage + DEFAULT_PRICING_CONFIG.fixedFee;
  const vat = fees * DEFAULT_PRICING_CONFIG.vatPercentage;
  const total = base + fees + vat;

  const finalPrice = Math.ceil(total * 1.15);

  const priceBeforeVAT = finalPrice / 1.15;

  return {
    base,
    fees,
    vat,
    total,
    finalPrice,
    priceBeforeVAT,
  };
}
