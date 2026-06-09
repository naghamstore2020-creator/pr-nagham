import { StoreProduct } from "@/types/excel";
import { parseHierarchy } from "@/lib/excel/categories";

export function toCategoryKey(main: string, sub: string): string {
  return `${main}||${sub}`.trim().toLowerCase();
}

export function getCategoryKey(
  product: StoreProduct,
  parentProduct: StoreProduct | null
): string {
  const raw = (parentProduct?.category || product.category || "").trim();
  if (!raw) return toCategoryKey("غير مصنف", "غير مصنف");

  const hierarchy = parseHierarchy([raw]);
  const entry = hierarchy[0] || { main: "غير مصنف", sub: "غير مصنف" };
  return toCategoryKey(entry.main, entry.sub);
}
