"use server";

import { parseStoreExcel } from "@/lib/excel/parser";
import { getFileBuffer } from "@/lib/excel/file-store";
import { requirePermission } from "@/lib/permissions";
import { parseHierarchy, getMainCategories, getSubCategories, categorizeStoreProducts } from "@/lib/excel/categories";

export async function getStoreCategories(storeFileUrl: string) {
  await requirePermission("pricing:sell");

  try {
    const buffer = await getFileBuffer(storeFileUrl);
    const parsed = await parseStoreExcel(buffer, "store.xlsx");

    const rawCategories = parsed.data.map(p => p.category).filter(Boolean);
    const hierarchy = parseHierarchy(rawCategories);
    const mains = getMainCategories(hierarchy);

    const subsByMain: Record<string, string[]> = {};
    for (const m of mains) {
      subsByMain[m] = getSubCategories(m, hierarchy);
    }

    const categorized = categorizeStoreProducts(parsed.data);
    const productCounts: Record<string, number> = {};
    for (const [main, group] of Object.entries(categorized.byMain)) {
      for (const [sub, products] of Object.entries(group.subs)) {
        productCounts[`${main}||${sub}`.toLowerCase()] = products.length;
      }
    }

    return { success: true, mains, subsByMain, productCounts };
  } catch (error: any) {
    console.error("Failed to extract categories:", error);
    return { success: false, mains: [], subsByMain: {}, productCounts: {}, error: "فشل استخراج التصنيفات من منتجات المتجر" };
  }
}

export async function getCategoryProducts(storeFileUrl: string, selectedMains: string[], selectedSubs: string[]) {
  await requirePermission("pricing:sell");

  try {
    const buffer = await getFileBuffer(storeFileUrl);
    const parsed = await parseStoreExcel(buffer, "store.xlsx");
    const categorized = categorizeStoreProducts(parsed.data);

    const allSelected = new Set<string>();
    for (const m of selectedMains) {
      if (categorized.byMain[m]) {
        for (const sub of Object.keys(categorized.byMain[m].subs)) {
          allSelected.add(`${m}||${sub}`.toLowerCase());
        }
      }
    }
    for (const key of selectedSubs) {
      allSelected.add(key.trim().toLowerCase());
    }

    const products: Array<{ rowIndex: number; name: string; sku: string; category: string; sellPrice: number; costPrice: number; isVariant: boolean }> = [];

    for (const [m, group] of Object.entries(categorized.byMain)) {
      for (const [sub, prods] of Object.entries(group.subs)) {
        if (allSelected.has(`${m}||${sub}`.toLowerCase())) {
          for (const p of prods) {
            products.push({
              rowIndex: p.rowIndex,
              name: p.name,
              sku: p.sku,
              category: p.category,
              sellPrice: p.sellPrice,
              costPrice: p.costPrice,
              isVariant: p.type === "variant",
            });
          }
        }
      }
    }

    return { success: true, products, total: products.length };
  } catch (error: any) {
    console.error("Failed to get category products:", error);
    return { success: false, products: [], total: 0, error: "فشل تحميل المنتجات" };
  }
}
