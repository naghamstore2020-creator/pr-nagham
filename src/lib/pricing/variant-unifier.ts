import {
  detectColorOptions,
  formatGroupLabel,
  getColorLabel,
  getNonColorGroupKey,
} from "./color-detector";

export interface VariantUnifyEntry {
  option1?: string;
  option2?: string;
  option3?: string;
  priceBeforeVAT: number | null;
  isAvailable: boolean;
  isExcluded: boolean;
  canProcess: boolean;
}

export interface VariantUnifyResult {
  unifiedPrices: (number | null)[];
  parentPrice: number | null;
  operationLogs: string[];
}

function formatPrice(price: number): string {
  return Number.isInteger(price) ? `${price}` : price.toFixed(2);
}

/**
 * توحيد أسعار الخيارات حسب المواصفات:
 * - تجميع حسب الخيارات غير اللونية (سعة، مقاس، إصدار...)
 * - داخل كل مجموعة: توحيد الألوان (لون واحد متوفر → سعره للجميع، عدة ألوان → أعلى سعر)
 * - سعر المنتج الرئيسي = أقل سعر نهائي بين جميع الخيارات المعالجة
 */
export function unifyVariantSellPrices(
  entries: VariantUnifyEntry[],
  productName: string
): VariantUnifyResult {
  const operationLogs: string[] = [];
  const unifiedPrices: (number | null)[] = entries.map((entry) =>
    entry.canProcess && !entry.isExcluded ? entry.priceBeforeVAT : null
  );

  const processableEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.canProcess && !entry.isExcluded && entry.priceBeforeVAT !== null);

  if (processableEntries.length === 0) {
    return { unifiedPrices, parentPrice: null, operationLogs };
  }

  const isColorOpt = detectColorOptions(entries);
  const hasColor = isColorOpt.some(Boolean);

  if (hasColor) {
    const groups = new Map<string, number[]>();

    for (const { entry, index } of processableEntries) {
      const key = getNonColorGroupKey(entry, isColorOpt);
      const group = groups.get(key) ?? [];
      group.push(index);
      groups.set(key, group);
    }

    for (const [groupKey, indices] of groups) {
      const available = indices.filter((i) => entries[i].isAvailable && unifiedPrices[i] !== null);

      if (available.length === 0) continue;

      let targetPrice: number;

      if (available.length === 1) {
        const sourceIndex = available[0];
        targetPrice = unifiedPrices[sourceIndex]!;
        const colorLabel = getColorLabel(entries[sourceIndex], isColorOpt);
        const groupLabel = formatGroupLabel(groupKey);

        if (indices.length === 1) {
          operationLogs.push(
            `تم اعتماد اللون ${colorLabel || "المتوفر"} كمصدر للسعر (${formatPrice(targetPrice)} ريال) لمنتج ${productName} لأن بقية الألوان غير متوفرة.`
          );
        } else {
          operationLogs.push(
            `تم توحيد ألوان مجموعة ${groupLabel} لمنتج ${productName} على سعر اللون ${colorLabel || "المتوفر"} (${formatPrice(targetPrice)} ريال) لأن بقية الألوان غير متوفرة.`
          );
        }
      } else {
        const availablePrices = available.map((i) => unifiedPrices[i]!);
        targetPrice = Math.max(...availablePrices);
        const groupLabel = formatGroupLabel(groupKey);

        operationLogs.push(
          `تم اختيار أعلى سعر داخل مجموعة ${groupLabel} لمنتج ${productName} وهو ${formatPrice(targetPrice)} ريال، وتم توحيد جميع الألوان على هذا السعر.`
        );
      }

      for (const index of indices) {
        unifiedPrices[index] = targetPrice;
      }
    }
  }

  const finalPrices = unifiedPrices.filter(
    (price, index) =>
      price !== null &&
      price > 0 &&
      entries[index].canProcess &&
      !entries[index].isExcluded
  ) as number[];

  const parentPrice = finalPrices.length > 0 ? Math.min(...finalPrices) : null;

  if (parentPrice !== null) {
    operationLogs.push(
      `تم تعيين السعر الرئيسي لمنتج ${productName} على ${formatPrice(parentPrice)} ريال لأنه أقل سعر بين الخيارات.`
    );
  }

  return { unifiedPrices, parentPrice, operationLogs };
}
