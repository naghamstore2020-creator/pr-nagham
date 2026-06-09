import { StoreProduct, SystemProduct } from "@/types/excel";
import { InventoryResult, InventoryProcessingResult } from "@/types/inventory";

export interface DailyInventoryResult {
  processingResult: InventoryProcessingResult;
  updates: Array<{ rowIndex: number; quantity: number }>;
}

export function processDailyInventory(
  storeProducts: StoreProduct[],
  systemProducts: SystemProduct[]
): DailyInventoryResult {
  const results: InventoryResult[] = [];
  const updates: Array<{ rowIndex: number; quantity: number }> = [];
  
  const systemMap = new Map<string, SystemProduct>();
  for (const sys of systemProducts) {
    if (sys.sku) {
      systemMap.set(sys.sku.trim().toLowerCase(), sys);
    }
  }

  let totalDecreased = 0;
  let totalUnchanged = 0;
  let totalBlocked = 0;
  let totalZeroed = 0;
  let totalUpdated = 0;

  for (const storeProd of storeProducts) {
    const sku = storeProd.sku ? storeProd.sku.trim() : "";
    const storeQty = storeProd.quantity || 0;
    
    // Rule 5: Products without SKU = Quantity becomes 0
    if (!sku) {
      const newQty = 0;
      const diff = newQty - storeQty;
      results.push({
        sku: "",
        productName: storeProd.name,
        productType: storeProd.type,
        oldQuantity: storeQty,
        newQuantity: newQty,
        difference: diff,
        action: "zeroed",
      });
      updates.push({ rowIndex: storeProd.rowIndex, quantity: newQty });
      totalZeroed++;
      totalUpdated++;
      continue;
    }

    const systemProd = systemMap.get(sku.toLowerCase());

    // Rule 6: Products not present in System = Quantity becomes 0
    if (!systemProd) {
      const newQty = 0;
      const diff = newQty - storeQty;
      results.push({
        sku,
        productName: storeProd.name,
        productType: storeProd.type,
        oldQuantity: storeQty,
        newQuantity: newQty,
        difference: diff,
        action: "zeroed",
      });
      updates.push({ rowIndex: storeProd.rowIndex, quantity: newQty });
      totalZeroed++;
      totalUpdated++;
      continue;
    }

    const sysQty = systemProd.quantity || 0;

    if (sysQty < storeQty) {
      // Rule 2: Update decrease (system qty < store qty)
      const newQty = sysQty;
      const diff = newQty - storeQty;
      results.push({
        sku,
        productName: storeProd.name,
        productType: storeProd.type,
        oldQuantity: storeQty,
        newQuantity: newQty,
        difference: diff,
        action: "decreased",
      });
      updates.push({ rowIndex: storeProd.rowIndex, quantity: newQty });
      totalDecreased++;
      totalUpdated++;
    } else if (sysQty > storeQty) {
      // Rule 3 & 4: Prevent increase - quantity remains storeQty
      results.push({
        sku,
        productName: storeProd.name,
        productType: storeProd.type,
        oldQuantity: storeQty,
        newQuantity: storeQty,
        difference: 0,
        action: "increase_blocked",
      });
      totalBlocked++;
      totalUnchanged++;
    } else {
      // Unchanged
      results.push({
        sku,
        productName: storeProd.name,
        productType: storeProd.type,
        oldQuantity: storeQty,
        newQuantity: storeQty,
        difference: 0,
        action: "unchanged",
      });
      totalUnchanged++;
    }
  }

  const processingResult: InventoryProcessingResult = {
    results,
    totalProcessed: storeProducts.length,
    totalDecreased,
    totalUnchanged,
    totalBlocked,
    totalZeroed,
    totalUpdated,
    errors: [],
  };

  return {
    processingResult,
    updates,
  };
}
