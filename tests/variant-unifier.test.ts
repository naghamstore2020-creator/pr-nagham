import { calculateSellPrice } from "../src/constants/pricing-formula";
import { unifyVariantSellPrices, VariantUnifyEntry } from "../src/lib/pricing/variant-unifier";

const EPSILON = 0.01;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ PASS: ${message}`);
  }
}

function assertClose(actual: number, expected: number, message: string): void {
  assert(Math.abs(actual - expected) < EPSILON, `${message} (expected ${expected}, got ${actual})`);
}

function priceFromCost(cost: number, profit = 0): number {
  return calculateSellPrice(cost, profit).priceBeforeVAT;
}

// ========== Test 1: Color only — single available color ==========
{
  const entries: VariantUnifyEntry[] = [
    { option1: "أسود", priceBeforeVAT: priceFromCost(100), isAvailable: true, isExcluded: false, canProcess: true },
    { option1: "أبيض", priceBeforeVAT: priceFromCost(105), isAvailable: false, isExcluded: false, canProcess: true },
    { option1: "أزرق", priceBeforeVAT: priceFromCost(110), isAvailable: false, isExcluded: false, canProcess: true },
  ];

  const { unifiedPrices, parentPrice } = unifyVariantSellPrices(entries, "منتج تجريبي");
  const blackPrice = priceFromCost(100);

  assertClose(unifiedPrices[0]!, blackPrice, "أسود يحتفظ بسعره");
  assertClose(unifiedPrices[1]!, blackPrice, "أبيض يوحّد على سعر الأسود");
  assertClose(unifiedPrices[2]!, blackPrice, "أزرق يوحّد على سعر الأسود");
  assertClose(parentPrice!, blackPrice, "السعر الرئيسي = أقل سعر");
}

// ========== Test 2: Color only — multiple available colors ==========
{
  const p100 = priceFromCost(100);
  const p105 = priceFromCost(105);
  const p110 = priceFromCost(110);

  const entries: VariantUnifyEntry[] = [
    { option1: "أسود", priceBeforeVAT: p100, isAvailable: true, isExcluded: false, canProcess: true },
    { option1: "أبيض", priceBeforeVAT: p105, isAvailable: true, isExcluded: false, canProcess: true },
    { option1: "أزرق", priceBeforeVAT: p110, isAvailable: true, isExcluded: false, canProcess: true },
  ];

  const { unifiedPrices, parentPrice } = unifyVariantSellPrices(entries, "منتج ألوان");
  const maxPrice = Math.max(p100, p105, p110);

  assertClose(unifiedPrices[0]!, maxPrice, "أسود = أعلى سعر");
  assertClose(unifiedPrices[1]!, maxPrice, "أبيض = أعلى سعر");
  assertClose(unifiedPrices[2]!, maxPrice, "أزرق = أعلى سعر");
  assertClose(parentPrice!, maxPrice, "السعر الرئيسي = أقل سعر (= أعلى موحّد)");
}

// ========== Test 3: Capacity + color — independent groups ==========
{
  const p128Black = priceFromCost(1000);
  const p128White = priceFromCost(1050);
  const p256Black = priceFromCost(1200);
  const p256White = priceFromCost(1250);

  const entries: VariantUnifyEntry[] = [
    { option1: "128GB", option2: "أسود", priceBeforeVAT: p128Black, isAvailable: true, isExcluded: false, canProcess: true },
    { option1: "128GB", option2: "أبيض", priceBeforeVAT: p128White, isAvailable: true, isExcluded: false, canProcess: true },
    { option1: "256GB", option2: "أسود", priceBeforeVAT: p256Black, isAvailable: true, isExcluded: false, canProcess: true },
    { option1: "256GB", option2: "أبيض", priceBeforeVAT: p256White, isAvailable: true, isExcluded: false, canProcess: true },
  ];

  const { unifiedPrices, parentPrice } = unifyVariantSellPrices(entries, "iPhone");
  const max128 = Math.max(p128Black, p128White);
  const max256 = Math.max(p256Black, p256White);

  assertClose(unifiedPrices[0]!, max128, "128GB أسود");
  assertClose(unifiedPrices[1]!, max128, "128GB أبيض");
  assertClose(unifiedPrices[2]!, max256, "256GB أسود");
  assertClose(unifiedPrices[3]!, max256, "256GB أبيض");
  assertClose(parentPrice!, Math.min(max128, max256), "السعر الرئيسي = أقل مجموعة");
}

// ========== Test 4: No color — no unification, parent = min ==========
{
  const p256 = priceFromCost(3800);
  const p512 = priceFromCost(4200);

  const entries: VariantUnifyEntry[] = [
    { option1: "256GB", priceBeforeVAT: p256, isAvailable: true, isExcluded: false, canProcess: true },
    { option1: "512GB", priceBeforeVAT: p512, isAvailable: true, isExcluded: false, canProcess: true },
  ];

  const { unifiedPrices, parentPrice } = unifyVariantSellPrices(entries, "Samsung");

  assertClose(unifiedPrices[0]!, p256, "256GB unchanged");
  assertClose(unifiedPrices[1]!, p512, "512GB unchanged");
  assertClose(parentPrice!, p256, "Parent = min");
}

// ========== Test 5: Operation logs generated ==========
{
  const entries: VariantUnifyEntry[] = [
    { option1: "أسود", priceBeforeVAT: priceFromCost(100), isAvailable: true, isExcluded: false, canProcess: true },
    { option1: "أبيض", priceBeforeVAT: priceFromCost(110), isAvailable: true, isExcluded: false, canProcess: true },
  ];

  const { operationLogs } = unifyVariantSellPrices(entries, "Test Product");
  assert(operationLogs.length >= 2, "At least 2 operation logs (unify + parent)");
  assert(operationLogs.some((l) => l.includes("أعلى سعر")), "Log mentions max price");
  assert(operationLogs.some((l) => l.includes("أقل سعر")), "Log mentions min parent price");
}

console.log("\nAll variant unifier tests completed.");
if (process.exitCode) {
  console.error("Some tests FAILED.");
} else {
  console.log("All tests PASSED.");
}
