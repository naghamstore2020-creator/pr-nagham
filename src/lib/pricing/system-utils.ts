import { SystemProduct } from "@/types/excel";

export function buildSystemMap(systemProducts: SystemProduct[]): Map<string, SystemProduct> {
  const map = new Map<string, SystemProduct>();
  for (const sys of systemProducts) {
    if (sys.sku) {
      map.set(sys.sku.trim().toLowerCase(), sys);
    }
  }
  return map;
}

/** متوفر: كمية > 0 وتكلفة > 0 */
export function isProductAvailable(costPrice: number, quantity: number): boolean {
  return (costPrice ?? 0) > 0 && (quantity ?? 0) > 0;
}

/** متوفر في ملف النظام: كمية > 0 وتكلفة > 0 */
export function isSystemAvailable(sys: SystemProduct | undefined): boolean {
  if (!sys) return false;
  return isProductAvailable(sys.costPrice, sys.quantity);
}

export function hasSystemCost(sys: SystemProduct | undefined): boolean {
  return !!sys && (sys.costPrice ?? 0) > 0;
}
