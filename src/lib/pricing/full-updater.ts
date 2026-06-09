import { StoreProduct, SystemProduct } from "@/types/excel";
import { PricingResult, PricingProcessingResult } from "@/types/pricing";
import { calculateSellPrice } from "@/constants/pricing-formula";
import { groupProductsAndVariants } from "./variant-handler";
import { getCategoryKey } from "./category-utils";
import { buildSystemMap, hasSystemCost, isSystemAvailable } from "./system-utils";
import { unifyVariantSellPrices, VariantUnifyEntry } from "./variant-unifier";
import { validatePricingResults } from "./pricing-validation";

export interface FullUpdateResult {
  processingResult: PricingProcessingResult;
  costUpdates: Array<{ rowIndex: number; costPrice: number }>;
  sellUpdates: Array<{ rowIndex: number; sellPrice: number }>;
}

export function processFullUpdate(
  storeProducts: StoreProduct[],
  systemProducts: SystemProduct[],
  profit: number,
  excludedSkus: string[] = [],
  selectedSubs: string[] = []
): FullUpdateResult {
  const results: PricingResult[] = [];
  const costUpdates: Array<{ rowIndex: number; costPrice: number }> = [];
  const sellUpdates: Array<{ rowIndex: number; sellPrice: number }> = [];
  const operationLogs: string[] = [];

  const systemMap = buildSystemMap(systemProducts);
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
      const catKey = getCategoryKey(parent, null);
      processSingleProduct(
        parent,
        results,
        costUpdates,
        sellUpdates,
        systemMap,
        exclSkusSet,
        selectedSubsSet,
        catKey,
        profit,
        (upd) => {
          if (upd) totalUpdated++;
          else totalUnchanged++;
        },
        (exc) => {
          if (exc) totalExcluded++;
        }
      );
      totalProcessed++;
    } else {
      const tempResults: PricingResult[] = [];
      const unifyEntries: VariantUnifyEntry[] = [];
      const catKey = getCategoryKey(parent || variants[0], parent);
      const productName = parent?.name || variants[0]?.name || "منتج";

      for (const variant of variants) {
        const sku = variant.sku ? variant.sku.trim() : "";
        const oldSell = variant.sellPrice || 0;
        const oldCost = variant.costPrice || 0;

        const isExcludedBySku = sku && exclSkusSet.has(sku.toLowerCase());
        const isInSelectedCategory = selectedSubsSet ? selectedSubsSet.has(catKey) : true;
        const skip = isExcludedBySku || !isInSelectedCategory;

        if (skip) {
          unifyEntries.push({
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            priceBeforeVAT: null,
            isAvailable: false,
            isExcluded: true,
            canProcess: false,
          });
          // Still update cost if system match exists (regardless of category)
          const sysProd = sku ? systemMap.get(sku.toLowerCase()) : undefined;
          const newCost = sysProd?.costPrice ?? oldCost;
          tempResults.push({
            sku,
            productName: variant.name,
            oldCostPrice: oldCost,
            newCostPrice: newCost,
            oldSellPrice: oldSell,
            newSellPrice: oldSell,
            priceBeforeVAT: oldSell / 1.15,
            profit: 0,
            isVariant: true,
            isExcluded: skip,
            action: newCost !== oldCost ? "updated" : "unchanged",
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
          });
          if (newCost !== oldCost && sysProd?.costPrice) {
            costUpdates.push({ rowIndex: variant.rowIndex, costPrice: sysProd.costPrice });
          }
          if (isExcludedBySku || !isInSelectedCategory) totalExcluded++;
        } else {
          const sysProd = sku ? systemMap.get(sku.toLowerCase()) : undefined;
          const canProcess = hasSystemCost(sysProd);

          if (canProcess) {
            const calc = calculateSellPrice(sysProd!.costPrice, profit);
            unifyEntries.push({
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
              priceBeforeVAT: calc.priceBeforeVAT,
              isAvailable: isSystemAvailable(sysProd),
              isExcluded: false,
              canProcess: true,
            });
            tempResults.push({
              sku,
              productName: variant.name,
              oldCostPrice: oldCost,
              newCostPrice: sysProd!.costPrice,
              oldSellPrice: oldSell,
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
            if (sysProd!.costPrice !== oldCost) {
              costUpdates.push({ rowIndex: variant.rowIndex, costPrice: sysProd!.costPrice });
            }
          } else {
            // In selected category but no system match: update cost only if system product exists
            const sysCost = sysProd?.costPrice;
            const newCost = sysCost ?? oldCost;
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
              oldCostPrice: oldCost,
              newCostPrice: newCost,
              oldSellPrice: oldSell,
              newSellPrice: oldSell,
              priceBeforeVAT: oldSell / 1.15,
              profit: 0,
              isVariant: true,
              isExcluded: false,
              action: newCost !== oldCost ? "updated" : "unchanged",
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
            });
            if (newCost !== oldCost && sysCost) {
              costUpdates.push({ rowIndex: variant.rowIndex, costPrice: sysCost });
            }
          }
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
        const oldParentSell = parent.sellPrice || 0;
        const oldParentCost = parent.costPrice || 0;
        const sku = parent.sku ? parent.sku.trim() : "";
        const isExcludedBySku = sku && exclSkusSet.has(sku.toLowerCase());
        const isInSelectedCategory = selectedSubsSet ? selectedSubsSet.has(catKey) : true;
        const skip = isExcludedBySku || !isInSelectedCategory;

        // Always try to update cost from system file (regardless of category selection)
        const sysProd = sku ? systemMap.get(sku.toLowerCase()) : undefined;
        const sysCost = sysProd?.costPrice;
        const updatedCost = sysCost ?? oldParentCost;

        if (skip) {
          results.push({
            sku,
            productName: parent.name,
            oldCostPrice: oldParentCost,
            newCostPrice: updatedCost,
            oldSellPrice: oldParentSell,
            newSellPrice: oldParentSell,
            priceBeforeVAT: oldParentSell / 1.15,
            profit: 0,
            isVariant: false,
            isExcluded: skip,
            action: updatedCost !== oldParentCost ? "updated" : "unchanged",
            option1: parent.option1,
            option2: parent.option2,
            option3: parent.option3,
          });
          if (updatedCost !== oldParentCost && sysCost) {
            costUpdates.push({ rowIndex: parent.rowIndex, costPrice: sysCost });
          }
          if (isExcludedBySku || !isInSelectedCategory) totalExcluded++;
        } else {
          let newParentSell = oldParentSell;

          if (parentPrice !== null) {
            newParentSell = parentPrice;
          } else if (hasSystemCost(sysProd)) {
            newParentSell = calculateSellPrice(sysProd!.costPrice, profit).priceBeforeVAT;
          }

          const costChanged = updatedCost !== oldParentCost;
          const sellChanged = newParentSell !== oldParentSell;
          const updated = costChanged || sellChanged;

          results.push({
            sku,
            productName: parent.name,
            oldCostPrice: oldParentCost,
            newCostPrice: updatedCost,
            oldSellPrice: oldParentSell,
            newSellPrice: newParentSell,
            priceBeforeVAT: newParentSell,
            profit: hasSystemCost(sysProd) || parentPrice !== null ? profit : 0,
            isVariant: false,
            isExcluded: false,
            action: updated ? "updated" : "unchanged",
            option1: parent.option1,
            option2: parent.option2,
            option3: parent.option3,
          });

          if (sellChanged) {
            sellUpdates.push({ rowIndex: parent.rowIndex, sellPrice: newParentSell });
          }
          if (costChanged && sysCost) {
            costUpdates.push({ rowIndex: parent.rowIndex, costPrice: sysCost });
          }
          if (updated) totalUpdated++;
          else totalUnchanged++;
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

        const oldSell = variant.sellPrice || 0;
        res.action = res.newSellPrice !== oldSell ? "updated" : "unchanged";
        if (res.newSellPrice !== oldSell) {
          sellUpdates.push({ rowIndex: variant.rowIndex, sellPrice: res.newSellPrice });
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

  return { processingResult, costUpdates, sellUpdates };
}

function processSingleProduct(
  product: StoreProduct,
  results: PricingResult[],
  costUpdates: Array<{ rowIndex: number; costPrice: number }>,
  sellUpdates: Array<{ rowIndex: number; sellPrice: number }>,
  systemMap: Map<string, SystemProduct>,
  exclSkusSet: Set<string>,
  selectedSubsSet: Set<string> | null,
  catKey: string,
  profit: number,
  trackUpdate: (updated: boolean) => void,
  trackExcluded: (excluded: boolean) => void
): boolean {
  const sku = product.sku ? product.sku.trim() : "";
  const oldCost = product.costPrice || 0;
  const oldSell = product.sellPrice || 0;

  const isExcludedBySku = sku && exclSkusSet.has(sku.toLowerCase());
  const isInSelectedCategory = selectedSubsSet ? selectedSubsSet.has(catKey) : true;
  const skip = isExcludedBySku || !isInSelectedCategory;

  if (!sku) {
    results.push({
      sku: "",
      productName: product.name,
      oldCostPrice: oldCost,
      newCostPrice: oldCost,
      oldSellPrice: oldSell,
      newSellPrice: oldSell,
      priceBeforeVAT: oldSell / 1.15,
      profit: 0,
      isVariant: product.type === "variant",
      isExcluded: false,
      action: "unchanged",
      option1: product.option1,
      option2: product.option2,
      option3: product.option3,
    });
    trackUpdate(false);
    return false;
  }

  const sysProd = systemMap.get(sku.toLowerCase());
  const sysCost = sysProd?.costPrice;
  const updatedCost = sysCost ?? oldCost;

  if (skip) {
    results.push({
      sku,
      productName: product.name,
      oldCostPrice: oldCost,
      newCostPrice: updatedCost,
      oldSellPrice: oldSell,
      newSellPrice: oldSell,
      priceBeforeVAT: oldSell / 1.15,
      profit: 0,
      isVariant: product.type === "variant",
      isExcluded: skip,
      action: updatedCost !== oldCost ? "updated" : "unchanged",
      option1: product.option1,
      option2: product.option2,
      option3: product.option3,
    });
    if (updatedCost !== oldCost && sysCost) {
      costUpdates.push({ rowIndex: product.rowIndex, costPrice: sysCost });
    }
    if (isExcludedBySku || !isInSelectedCategory) trackExcluded(true);
    return false;
  }

  if (!hasSystemCost(sysProd)) {
    results.push({
      sku,
      productName: product.name,
      oldCostPrice: oldCost,
      newCostPrice: updatedCost,
      oldSellPrice: oldSell,
      newSellPrice: oldSell,
      priceBeforeVAT: oldSell / 1.15,
      profit: 0,
      isVariant: product.type === "variant",
      isExcluded: false,
      action: updatedCost !== oldCost ? "updated" : "unchanged",
      option1: product.option1,
      option2: product.option2,
      option3: product.option3,
    });
    if (updatedCost !== oldCost && sysCost) {
      costUpdates.push({ rowIndex: product.rowIndex, costPrice: sysCost });
    }
    trackUpdate(false);
    return false;
  }

  const newCost = sysProd!.costPrice;
  const newSell = calculateSellPrice(newCost, profit).priceBeforeVAT;
  const costChanged = newCost !== oldCost;
  const sellChanged = newSell !== oldSell;
  const updated = costChanged || sellChanged;

  results.push({
    sku,
    productName: product.name,
    oldCostPrice: oldCost,
    newCostPrice: newCost,
    oldSellPrice: oldSell,
    newSellPrice: newSell,
    priceBeforeVAT: newSell,
    profit,
    isVariant: product.type === "variant",
    isExcluded: false,
    action: updated ? "updated" : "unchanged",
    option1: product.option1,
    option2: product.option2,
    option3: product.option3,
  });

  if (costChanged) costUpdates.push({ rowIndex: product.rowIndex, costPrice: newCost });
  if (sellChanged) sellUpdates.push({ rowIndex: product.rowIndex, sellPrice: newSell });

  trackUpdate(updated);
  return updated;
}
