import { StoreProduct } from "@/types/excel";
import { groupProductsAndVariants } from "@/lib/pricing/variant-handler";

const SEPARATORS = [" > ", " / ", " - ", " | ", "\\", ">", "/"];

export interface CategoryNode {
  name: string;
  main: string;
  sub: string;
  fullPath: string;
  productCount: number;
}

export function parseHierarchy(rawCategories: string[]): { main: string; sub: string }[] {
  const seen = new Set<string>();
  const result: { main: string; sub: string }[] = [];

  for (const raw of rawCategories) {
    if (!raw) continue;
    const trimmed = raw.trim();
    let parts: string[] = [trimmed];

    for (const sep of SEPARATORS) {
      const split = trimmed.split(sep).map(s => s.trim()).filter(Boolean);
      if (split.length > 1) {
        parts = split;
        break;
      }
    }

    const main = parts[0];
    const sub = parts.length > 1 ? parts.slice(1).join(" > ") : main;
    const key = `${main}||${sub}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ main, sub });
    }
  }

  return result;
}

export function getMainCategories(categories: { main: string; sub: string }[]): string[] {
  return [...new Set(categories.map(c => c.main))].sort((a, b) => a.localeCompare(b, "ar"));
}

export function getSubCategories(main: string, categories: { main: string; sub: string }[]): string[] {
  return categories.filter(c => c.main === main).map(c => c.sub).sort((a, b) => a.localeCompare(b, "ar"));
}

export function getAllSelectedCategories(selectedMains: string[], selectedSubs: string[], allCategories: { main: string; sub: string }[]): string[] {
  const result = new Set<string>();

  for (const m of selectedMains) {
    const subs = allCategories.filter(c => c.main === m);
    for (const { main, sub } of subs) result.add(`${main}||${sub}`.toLowerCase());
  }

  for (const key of selectedSubs) {
    result.add(key.trim().toLowerCase());
  }

  return [...result];
}

export interface CategorizedProducts {
  byMain: Record<string, { main: string; subs: Record<string, StoreProduct[]> }>;
}

export function categorizeStoreProducts(storeProducts: StoreProduct[]): CategorizedProducts {
  const groups = groupProductsAndVariants(storeProducts);
  const byMain: CategorizedProducts["byMain"] = {};

  for (const group of groups) {
    const parent = group.parentProduct;
    if (!parent) continue;

    const raw = parent.category || "";
    const hierarchy = parseHierarchy([raw]);
    const entry = hierarchy[0] || { main: "غير مصنف", sub: "غير مصنف" };
    const { main, sub } = entry;

    if (!byMain[main]) byMain[main] = { main, subs: {} };
    if (!byMain[main].subs[sub]) byMain[main].subs[sub] = [];

    byMain[main].subs[sub].push(parent);

    for (const variant of group.variants) {
      if (!byMain[main].subs[sub].find(p => p.rowIndex === variant.rowIndex)) {
        byMain[main].subs[sub].push(variant);
      }
    }
  }

  return { byMain };
}
