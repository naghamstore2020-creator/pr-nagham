import { StoreProduct } from "@/types/excel";

export interface VariantGroup {
  parentProduct: StoreProduct | null;
  variants: StoreProduct[];
}

export function groupProductsAndVariants(products: StoreProduct[]): VariantGroup[] {
  const groups: VariantGroup[] = [];
  let currentGroup: VariantGroup | null = null;

  for (const product of products) {
    const type = product.type ? product.type.trim().toLowerCase() : "";

    // Normalize Arabic type names to English equivalents
    const isParent = type === "product" || type === "main" || type === "" || type === "منتج";
    const isVariant = type === "variant" || type === "options" || type === "خيار";

    if (isParent) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        parentProduct: product,
        variants: [],
      };
    } else if (isVariant) {
      if (currentGroup) {
        currentGroup.variants.push(product);
      } else {
        currentGroup = {
          parentProduct: null,
          variants: [product],
        };
      }
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}
