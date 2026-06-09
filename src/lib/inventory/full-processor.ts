import { StoreProduct, SystemProduct } from "@/types/excel";
import { InventoryResult, InventoryProcessingResult } from "@/types/inventory";

export interface FullInventoryResult {
  processingResult: InventoryProcessingResult;
  updates: Array<{ rowIndex: number; quantity: number }>;
}

export function processFullInventory(
  storeProducts: StoreProduct[],
  systemProducts: SystemProduct[]
): FullInventoryResult {
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
  const totalBlocked = 0; // 0 since all updates (including increases) are allowed
  let totalZeroed = 0;
  let totalUpdated = 0;

  for (const storeProd of storeProducts) {
    const sku = storeProd.sku ? storeProd.sku.trim() : "";
    const storeQty = storeProd.quantity || 0;
    
    // Rule: Products without SKU = 0
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

    // Rule: Products not present in System = 0
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
    const diff = sysQty - storeQty;

    if (sysQty !== storeQty) {
      const action = sysQty < storeQty ? "decreased" : "updated";
      results.push({
        sku,
        productName: storeProd.name,
        productType: storeProd.type,
        oldQuantity: storeQty,
        newQuantity: sysQty,
        difference: diff,
        action,
      });
      updates.push({ rowIndex: storeProd.rowIndex, quantity: sysQty });
      totalUpdated++;
      if (sysQty < storeQty) {
        totalDecreased++;
      }
    } else {
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
