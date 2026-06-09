import { StoreProduct } from "@/types/excel";
import { PricingResult, PricingProcessingResult } from "@/types/pricing";
import { calculateSellPrice } from "@/constants/pricing-formula";
import { groupProductsAndVariants } from "./variant-handler";
import { getCategoryKey } from "./category-utils";
import { unifyVariantSellPrices, VariantUnifyEntry } from "./variant-unifier";
import { validatePricingResults } from "./pricing-validation";
import { isProductAvailable } from "./system-utils";

export interface SellPricingResult {
  processingResult: PricingProcessingResult;
  updates: Array<{ rowIndex: number; sellPrice: number }>;
}

export function processSellPricing(
  storeProducts: StoreProduct[],
  profit: number,
  excludedSkus: string[] = [],
  selectedSubs: string[] = []
): SellPricingResult {
  const results: PricingResult[] = [];
  const updates: Array<{ rowIndex: number; sellPrice: number }> = [];
  const operationLogs: string[] = [];

  const exclSkusSet = new Set(excludedSkus.map((s) => s.trim().toLowerCase()));
  const selectedSubsSet =
    selectedSubs.length > 0 ? new Set(selectedSubs.map((c) => c.trim().toLowerCase())) : null;

  const groups = groupProductsAndVariants(storeProducts);

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalUnchanged = 0;
  let totalExcluded = 0;

  for (const group of groups) {
    const parent = group.parentProduct;
    const variants = group.variants;

    if (variants.length === 0) {
      if (!parent) continue;

      const sku = parent.sku ? parent.sku.trim() : "";
      const catKey = getCategoryKey(parent, null);
      const oldPrice = parent.sellPrice || 0;

      const isExcludedBySku = sku && exclSkusSet.has(sku.toLowerCase());
      const isInSelectedCategory = selectedSubsSet ? selectedSubsSet.has(catKey) : true;
      const skipProduct = isExcludedBySku || !isInSelectedCategory;

      if (skipProduct) {
        results.push({
          sku,
          productName: parent.name,
          oldCostPrice: parent.costPrice || 0,
          newCostPrice: parent.costPrice || 0,
          oldSellPrice: oldPrice,
          newSellPrice: oldPrice,
          priceBeforeVAT: oldPrice / 1.15,
          profit: 0,
          isVariant: false,
          isExcluded: skipProduct,
          action: "unchanged",
          option1: parent.option1,
          option2: parent.option2,
          option3: parent.option3,
        });
        if (isExcludedBySku || !isInSelectedCategory) totalExcluded++;
      } else if (!parent.costPrice) {
        results.push({
          sku,
          productName: parent.name,
          oldCostPrice: 0,
          newCostPrice: 0,
          oldSellPrice: oldPrice,
          newSellPrice: oldPrice,
          priceBeforeVAT: oldPrice / 1.15,
          profit: 0,
          isVariant: false,
          isExcluded: false,
          action: "unchanged",
          option1: parent.option1,
          option2: parent.option2,
          option3: parent.option3,
        });
        totalUnchanged++;
      } else {
        const calc = calculateSellPrice(parent.costPrice, profit);
        const newPrice = calc.priceBeforeVAT;

        results.push({
          sku,
          productName: parent.name,
          oldCostPrice: parent.costPrice,
          newCostPrice: parent.costPrice,
          oldSellPrice: oldPrice,
          newSellPrice: newPrice,
          priceBeforeVAT: newPrice,
          profit,
          isVariant: false,
          isExcluded: false,
          action: newPrice !== oldPrice ? "updated" : "unchanged",
          option1: parent.option1,
          option2: parent.option2,
          option3: parent.option3,
        });

        if (newPrice !== oldPrice) {
          updates.push({ rowIndex: parent.rowIndex, sellPrice: newPrice });
          totalUpdated++;
        } else {
          totalUnchanged++;
        }
      }
      totalProcessed++;
    } else {
      const tempResults: PricingResult[] = [];
      const unifyEntries: VariantUnifyEntry[] = [];
      const catKey = getCategoryKey(parent || variants[0], parent);
      const productName = parent?.name || variants[0]?.name || "منتج";

      for (const variant of variants) {
        const sku = variant.sku ? variant.sku.trim() : "";
        const oldPrice = variant.sellPrice || 0;

        const isExcludedBySku = sku && exclSkusSet.has(sku.toLowerCase());
        const isInSelectedCategory = selectedSubsSet ? selectedSubsSet.has(catKey) : true;
        const skipProduct = isExcludedBySku || !isInSelectedCategory;

        if (skipProduct) {
          unifyEntries.push({
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            priceBeforeVAT: null,
            isAvailable: false,
            isExcluded: true,
            canProcess: false,
          });
          tempResults.push({
            sku,
            productName: variant.name,
            oldCostPrice: variant.costPrice || 0,
            newCostPrice: variant.costPrice || 0,
            oldSellPrice: oldPrice,
            newSellPrice: oldPrice,
            priceBeforeVAT: oldPrice / 1.15,
            profit: 0,
            isVariant: true,
            isExcluded: skipProduct,
            action: "unchanged",
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
          });
          totalExcluded++;
        } else if (!variant.costPrice) {
          unifyEntries.push({
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            priceBeforeVAT: null,
            isAvailable: false,
            isExcluded: false,
            canProcess: false,
          });
          tempResults.push({
            sku,
            productName: variant.name,
            oldCostPrice: 0,
            newCostPrice: 0,
            oldSellPrice: oldPrice,
            newSellPrice: oldPrice,
            priceBeforeVAT: oldPrice / 1.15,
            profit: 0,
            isVariant: true,
            isExcluded: false,
            action: "unchanged",
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
          });
        } else {
          const calc = calculateSellPrice(variant.costPrice, profit);
          unifyEntries.push({
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            priceBeforeVAT: calc.priceBeforeVAT,
            isAvailable: isProductAvailable(variant.costPrice, variant.quantity),
            isExcluded: false,
            canProcess: true,
          });
          tempResults.push({
            sku,
            productName: variant.name,
            oldCostPrice: variant.costPrice,
            newCostPrice: variant.costPrice,
            oldSellPrice: oldPrice,
            newSellPrice: calc.priceBeforeVAT,
            priceBeforeVAT: calc.priceBeforeVAT,
            profit,
            isVariant: true,
            isExcluded: false,
            action: "updated",
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
          });
        }
      }

      const { unifiedPrices, parentPrice, operationLogs: groupLogs } = unifyVariantSellPrices(
        unifyEntries,
        productName
      );
      operationLogs.push(...groupLogs);

      for (let i = 0; i < variants.length; i++) {
        const unified = unifiedPrices[i];
        if (unified !== null && !tempResults[i].isExcluded && unifyEntries[i].canProcess) {
          tempResults[i].newSellPrice = unified;
          tempResults[i].priceBeforeVAT = unified;
        }
      }

      if (parent) {
        const sku = parent.sku ? parent.sku.trim() : "";
        const catKey = getCategoryKey(parent, null);
        const oldPrice = parent.sellPrice || 0;

        const isExcludedBySku = sku && exclSkusSet.has(sku.toLowerCase());
        const isInSelectedCategory = selectedSubsSet ? selectedSubsSet.has(catKey) : true;
        const skipProduct = isExcludedBySku || !isInSelectedCategory;

        if (skipProduct) {
          results.push({
            sku,
            productName: parent.name,
            oldCostPrice: parent.costPrice || 0,
            newCostPrice: parent.costPrice || 0,
            oldSellPrice: oldPrice,
            newSellPrice: oldPrice,
            priceBeforeVAT: oldPrice / 1.15,
            profit: 0,
            isVariant: false,
            isExcluded: skipProduct,
            action: "unchanged",
            option1: parent.option1,
            option2: parent.option2,
            option3: parent.option3,
          });
          if (isExcludedBySku || !isInSelectedCategory) totalExcluded++;
        } else {
          const parentNewPrice =
            parentPrice !== null
              ? parentPrice
              : parent.costPrice
                ? calculateSellPrice(parent.costPrice, profit).priceBeforeVAT
                : oldPrice;

          results.push({
            sku,
            productName: parent.name,
            oldCostPrice: parent.costPrice || 0,
            newCostPrice: parent.costPrice || 0,
            oldSellPrice: oldPrice,
            newSellPrice: parentNewPrice,
            priceBeforeVAT: parentNewPrice,
            profit,
            isVariant: false,
            isExcluded: false,
            action: parentNewPrice !== oldPrice ? "updated" : "unchanged",
            option1: parent.option1,
            option2: parent.option2,
            option3: parent.option3,
          });

          if (parentNewPrice !== oldPrice) {
            updates.push({ rowIndex: parent.rowIndex, sellPrice: parentNewPrice });
            totalUpdated++;
          } else {
            totalUnchanged++;
          }
        }
        totalProcessed++;
      }

      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const res = tempResults[i];

        if (res.isExcluded) {
          results.push(res);
          totalProcessed++;
          continue;
        }

        const oldPrice = variant.sellPrice || 0;
        res.action = res.newSellPrice !== oldPrice ? "updated" : "unchanged";

        if (res.newSellPrice !== oldPrice) {
          updates.push({ rowIndex: variant.rowIndex, sellPrice: res.newSellPrice });
          totalUpdated++;
        } else {
          totalUnchanged++;
        }
        results.push(res);
        totalProcessed++;
      }
    }
  }

  const validationErrors = validatePricingResults(results);

  const processingResult: PricingProcessingResult = {
    results,
    totalProcessed,
    totalUpdated,
    totalUnchanged,
    totalExcluded,
    errors: validationErrors,
    operationLogs,
  };

  return {
    processingResult,
    updates,
  };
}
