import { StoreProduct, SystemProduct } from "@/types/excel";
import { PricingResult, PricingProcessingResult } from "@/types/pricing";
import { groupProductsAndVariants } from "./variant-handler";
import { getCategoryKey } from "./category-utils";

export interface CostUpdateResult {
  processingResult: PricingProcessingResult;
  updates: Array<{ rowIndex: number; costPrice: number }>;
}

function buildCategoryKeyMap(products: StoreProduct[]): Map<number, string> {
  const map = new Map<number, string>();
  const groups = groupProductsAndVariants(products);

  for (const group of groups) {
    const catKey = getCategoryKey(group.parentProduct || group.variants[0], group.parentProduct);
    if (group.parentProduct) map.set(group.parentProduct.rowIndex, catKey);
    for (const variant of group.variants) {
      map.set(variant.rowIndex, catKey);
    }
  }

  return map;
}

export function processCostUpdate(
  storeProducts: StoreProduct[],
  systemProducts: SystemProduct[],
  selectedSubs: string[] = []
): CostUpdateResult {
  const results: PricingResult[] = [];
  const updates: Array<{ rowIndex: number; costPrice: number }> = [];

  const systemMap = new Map<string, SystemProduct>();
  for (const sys of systemProducts) {
    if (sys.sku) {
      systemMap.set(sys.sku.trim().toLowerCase(), sys);
    }
  }

  const selectedSubsSet =
    selectedSubs.length > 0 ? new Set(selectedSubs.map((c) => c.trim().toLowerCase())) : null;
  const categoryKeyMap = buildCategoryKeyMap(storeProducts);

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalUnchanged = 0;
  let totalExcluded = 0;

  for (const storeProd of storeProducts) {
    const sku = storeProd.sku ? storeProd.sku.trim() : "";
    const storeCost = storeProd.costPrice || 0;
    const catKey = categoryKeyMap.get(storeProd.rowIndex) ?? "";
    const isInSelectedCategory = selectedSubsSet ? selectedSubsSet.has(catKey) : true;

    if (!isInSelectedCategory) {
      results.push({
        sku,
        productName: storeProd.name,
        oldCostPrice: storeCost,
        newCostPrice: storeCost,
        oldSellPrice: storeProd.sellPrice || 0,
        newSellPrice: storeProd.sellPrice || 0,
        priceBeforeVAT: 0,
        profit: 0,
        isVariant: storeProd.type === "variant",
        isExcluded: true,
        action: "unchanged",
        option1: storeProd.option1,
        option2: storeProd.option2,
        option3: storeProd.option3,
      });
      totalExcluded++;
      totalProcessed++;
      continue;
    }

    if (!sku) {
      results.push({
        sku: "",
        productName: storeProd.name,
        oldCostPrice: storeCost,
        newCostPrice: storeCost,
        oldSellPrice: storeProd.sellPrice || 0,
        newSellPrice: storeProd.sellPrice || 0,
        priceBeforeVAT: 0,
        profit: 0,
        isVariant: storeProd.type === "variant",
        isExcluded: false,
        action: "unchanged",
        option1: storeProd.option1,
        option2: storeProd.option2,
        option3: storeProd.option3,
      });
      totalUnchanged++;
      totalProcessed++;
      continue;
    }

    const systemProd = systemMap.get(sku.toLowerCase());

    if (!systemProd) {
      results.push({
        sku,
        productName: storeProd.name,
        oldCostPrice: storeCost,
        newCostPrice: storeCost,
        oldSellPrice: storeProd.sellPrice || 0,
        newSellPrice: storeProd.sellPrice || 0,
        priceBeforeVAT: 0,
        profit: 0,
        isVariant: storeProd.type === "variant",
        isExcluded: false,
        action: "unchanged",
        option1: storeProd.option1,
        option2: storeProd.option2,
        option3: storeProd.option3,
      });
      totalUnchanged++;
      totalProcessed++;
      continue;
    }

    const sysCost = systemProd.costPrice || 0;

    if (sysCost !== storeCost) {
      results.push({
        sku,
        productName: storeProd.name,
        oldCostPrice: storeCost,
        newCostPrice: sysCost,
        oldSellPrice: storeProd.sellPrice || 0,
        newSellPrice: storeProd.sellPrice || 0,
        priceBeforeVAT: 0,
        profit: 0,
        isVariant: storeProd.type === "variant",
        isExcluded: false,
        action: "updated",
        option1: storeProd.option1,
        option2: storeProd.option2,
        option3: storeProd.option3,
      });
      updates.push({ rowIndex: storeProd.rowIndex, costPrice: sysCost });
      totalUpdated++;
    } else {
      results.push({
        sku,
        productName: storeProd.name,
        oldCostPrice: storeCost,
        newCostPrice: storeCost,
        oldSellPrice: storeProd.sellPrice || 0,
        newSellPrice: storeProd.sellPrice || 0,
        priceBeforeVAT: 0,
        profit: 0,
        isVariant: storeProd.type === "variant",
        isExcluded: false,
        action: "unchanged",
        option1: storeProd.option1,
        option2: storeProd.option2,
        option3: storeProd.option3,
      });
      totalUnchanged++;
    }
    totalProcessed++;
  }

  const processingResult: PricingProcessingResult = {
    results,
    totalProcessed,
    totalUpdated,
    totalUnchanged,
    totalExcluded,
    errors: [],
  };

  return {
    processingResult,
    updates,
  };
}
