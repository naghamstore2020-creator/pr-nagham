/**
 * تدقيق تشغيلي شامل لمنطق التطبيق
 * تشغيل: npx tsx tests/integration-audit.ts
 */

import { DEMO_STORE_PRODUCTS, DEMO_SYSTEM_PRODUCTS } from "../src/constants/demo-data";
import { processSellPricing } from "../src/lib/pricing/sell-calculator";
import { processFullUpdate } from "../src/lib/pricing/full-updater";
import { processCostUpdate } from "../src/lib/pricing/cost-updater";
import { groupProductsAndVariants } from "../src/lib/pricing/variant-handler";
import { parseHierarchy, categorizeStoreProducts, getAllSelectedCategories } from "../src/lib/excel/categories";
import { getCategoryKey } from "../src/lib/pricing/category-utils";
import { validatePricingResults } from "../src/lib/pricing/pricing-validation";
import { calculateSellPrice } from "../src/constants/pricing-formula";
import { processDailyInventory } from "../src/lib/inventory/daily-processor";
import { processFullInventory } from "../src/lib/inventory/full-processor";
import { parseStoreExcel } from "../src/lib/excel/parser";
import ExcelJS from "exceljs";
import type { StoreProduct } from "../src/types/excel";

interface Issue {
  severity: "critical" | "high" | "medium" | "low";
  area: string;
  title: string;
  detail: string;
}

const issues: Issue[] = [];
let checks = 0;
let passed = 0;

function check(condition: boolean, area: string, title: string, failDetail: string, severity: Issue["severity"] = "high") {
  checks++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${title}`);
  } else {
    console.log(`  ✗ ${title}`);
    issues.push({ severity, area, title, detail: failDetail });
  }
}

function section(name: string) {
  console.log(`\n=== ${name} ===`);
}

// ── 1. معادلة التسعير ──
section("معادلة التسعير");
{
  const r = calculateSellPrice(4200, 10);
  check(r.priceBeforeVAT > 4200, "pricing-formula", "السعر النهائي أكبر من التكلفة+الربح", `got ${r.priceBeforeVAT}`);
  check(Number.isFinite(r.finalPrice), "pricing-formula", "finalPrice رقم صالح", `got ${r.finalPrice}`);
  check(r.finalPrice === Math.ceil(r.total * 1.15), "pricing-formula", "التقريب لأعلى صحيح", `final=${r.finalPrice}, ceil=${Math.ceil(r.total * 1.15)}`);
}

// ── 2. تجميع المنتجات والخيارات ──
section("تجميع المنتجات والخيارات");
{
  const groups = groupProductsAndVariants(DEMO_STORE_PRODUCTS as StoreProduct[]);
  check(groups.length === 6, "variant-handler", "عدد المجموعات = 6", `got ${groups.length}`);

  const iphone = groups.find((g) => g.parentProduct?.sku === "IP15PM-256");
  check(!!iphone && iphone.variants.length === 2, "variant-handler", "iPhone له خياران", `variants=${iphone?.variants.length}`);

  const samsung = groups.find((g) => g.parentProduct?.sku === "SG-S24U");
  check(!!samsung && samsung.variants.length === 2, "variant-handler", "Samsung له خياران (سعة)", `variants=${samsung?.variants.length}`);
}

// ── 3. التصنيفات ──
section("التصنيفات");
{
  const flatCats = DEMO_STORE_PRODUCTS.map((p) => p.category);
  const hierarchy = parseHierarchy(flatCats);
  check(hierarchy.length === 4, "categories", "4 تصنيفات فريدة", `got ${hierarchy.length}`);

  const categorized = categorizeStoreProducts(DEMO_STORE_PRODUCTS as StoreProduct[]);
  const phonesCount = categorized.byMain["هواتف"]?.subs["هواتف"]?.length ?? 0;
  check(phonesCount >= 5, "categories", "تصنيف هواتف يشمل المنتجات والخيارات", `count=${phonesCount}`);

  const catKey = getCategoryKey(DEMO_STORE_PRODUCTS[1] as StoreProduct, DEMO_STORE_PRODUCTS[0] as StoreProduct);
  check(catKey === "هواتف||هواتف", "category-utils", "خيار يرث تصنيف المنتج الرئيسي", `catKey=${catKey}`);

  // تصنيف هرمي
  const hierarchical = parseHierarchy(["إلكترونيات > هواتف > آيفون"]);
  check(hierarchical[0].main === "إلكترونيات" && hierarchical[0].sub === "هواتف > آيفون", "categories", "تقسيم هرمي صحيح", JSON.stringify(hierarchical[0]));

  const subKey = getCategoryKey(
    { ...DEMO_STORE_PRODUCTS[0], category: "إلكترونيات > هواتف > آيفون" } as StoreProduct,
    null
  );
  check(subKey === "إلكترونيات||هواتف > آيفون", "category-utils", "مفتاح التصنيف = main||sub", `subKey=${subKey}`);
}

// ── 4. تسعير البيع ──
section("تسعير البيع (بدون فلتر تصنيف = الكل)");
{
  const { processingResult } = processSellPricing(DEMO_STORE_PRODUCTS as StoreProduct[], 10);
  check(processingResult.totalProcessed > 0, "sell-calculator", "معالجة منتجات", `processed=${processingResult.totalProcessed}`);
  check(processingResult.errors.length === 0, "sell-calculator", "لا أخطاء تحقق", processingResult.errors.join("; "));

  const iphoneParent = processingResult.results.find((r) => r.sku === "IP15PM-256" && !r.isVariant);
  const iphoneBlack = processingResult.results.find((r) => r.sku === "IP15PM-256-BLK");
  const iphoneGold = processingResult.results.find((r) => r.sku === "IP15PM-256-GLD");

  if (iphoneParent && iphoneBlack && iphoneGold) {
    check(
      iphoneBlack.newSellPrice === iphoneGold.newSellPrice,
      "sell-calculator",
      "توحيد ألوان iPhone (أعلى سعر)",
      `black=${iphoneBlack.newSellPrice}, gold=${iphoneGold.newSellPrice}`
    );
    check(
      iphoneParent.newSellPrice <= Math.min(iphoneBlack.newSellPrice, iphoneGold.newSellPrice) + 0.01,
      "sell-calculator",
      "سعر المنتج الرئيسي ≤ أقل خيار",
      `parent=${iphoneParent.newSellPrice}`
    );
  } else {
    issues.push({ severity: "critical", area: "sell-calculator", title: "نتائج iPhone مفقودة", detail: "لم تُعثر على نتائج iPhone" });
  }
}

// ── 5. فلترة التصنيفات ──
section("فلترة التصنيفات في تسعير البيع");
{
  const { processingResult: all } = processSellPricing(DEMO_STORE_PRODUCTS as StoreProduct[], 10, [], []);
  const { processingResult: phonesOnly } = processSellPricing(DEMO_STORE_PRODUCTS as StoreProduct[], 10, [], ["هواتف||هواتف"]);

  const excludedAirpods = phonesOnly.results.find((r) => r.sku === "AP-PRO2");
  check(excludedAirpods?.isExcluded === true, "sell-calculator", "AirPods مستثنى عند اختيار هواتف فقط", `isExcluded=${excludedAirpods?.isExcluded}`);

  const includedPhone = phonesOnly.results.find((r) => r.sku === "IP15PM-256" && !r.isVariant);
  check(includedPhone?.isExcluded === false, "sell-calculator", "iPhone مُعالج عند اختيار هواتف", `isExcluded=${includedPhone?.isExcluded}`);

  check(
    phonesOnly.totalExcluded > all.totalExcluded || phonesOnly.totalUpdated < all.totalUpdated,
    "sell-calculator",
    "الفلترة تُقلّل النتائج المعالجة",
    `all.excluded=${all.totalExcluded}, filtered.excluded=${phonesOnly.totalExcluded}`
  );
}

// ── 6. تصنيف هرمي + فلترة ──
section("مشكلة محتملة: تصنيف مسطح vs هرمي");
{
  const products: StoreProduct[] = [
    { rowIndex: 2, type: "product", name: "Prod A", category: "إلكترونيات > هواتف", quantity: 1, sellPrice: 100, sku: "A1", costPrice: 80, option1: "", option2: "", option3: "" },
    { rowIndex: 3, type: "product", name: "Prod B", category: "إلكترونيات > سماعات", quantity: 1, sellPrice: 100, sku: "B1", costPrice: 80, option1: "", option2: "", option3: "" },
  ];

  const { processingResult } = processSellPricing(products, 10, [], ["إلكترونيات||هواتف"]);
  const a = processingResult.results.find((r) => r.sku === "A1");
  const b = processingResult.results.find((r) => r.sku === "B1");

  check(a?.isExcluded === false, "category-filter", "منتج بتصنيف هرمي 'هواتف' يُعالج", `A excluded=${a?.isExcluded}`);
  check(b?.isExcluded === true, "category-filter", "منتج 'سماعات' مستثنى", `B excluded=${b?.isExcluded}`);

  // UI يرسل sub فقط — تحقق من تطابق getCategoryKey
  const keyA = getCategoryKey(products[0], null);
  check(keyA === "إلكترونيات||هواتف", "category-filter", "getCategoryKey يطابق main||sub المختار", `key=${keyA}`);
}

// ── 7. تصنيف فرعي مكرر تحت رئيسيين مختلفين ──
section("تصنيف فرعي مكرر تحت mains مختلفة");
{
  const products: StoreProduct[] = [
    { rowIndex: 2, type: "product", name: "P1", category: "إلكترونيات > عام", quantity: 1, sellPrice: 100, sku: "P1", costPrice: 80, option1: "", option2: "", option3: "" },
    { rowIndex: 3, type: "product", name: "P2", category: "أثاث > عام", quantity: 1, sellPrice: 100, sku: "P2", costPrice: 80, option1: "", option2: "", option3: "" },
  ];

  const { processingResult } = processSellPricing(products, 10, [], ["إلكترونيات||عام"]);
  const p1 = processingResult.results.find((r) => r.sku === "P1");
  const p2 = processingResult.results.find((r) => r.sku === "P2");

  check(p1?.isExcluded === false, "category-filter", "إلكترونيات > عام يُعالج عند اختياره فقط", `P1 excluded=${p1?.isExcluded}`);
  check(p2?.isExcluded === true, "category-filter", "أثاث > عام مستثنى عند اختيار إلكترونيات فقط", `P2 excluded=${p2?.isExcluded}`);
}

// ── 8. التحديث الكامل ──
section("التحديث الكامل (تكلفة + بيع)");
{
  const { processingResult, costUpdates, sellUpdates } = processFullUpdate(
    DEMO_STORE_PRODUCTS as StoreProduct[],
    DEMO_SYSTEM_PRODUCTS,
    10
  );

  check(processingResult.totalProcessed > 0, "full-updater", "معالجة التحديث الكامل", `processed=${processingResult.totalProcessed}`);
  check(costUpdates.length > 0, "full-updater", "تحديثات تكلفة موجودة", `costUpdates=${costUpdates.length}`);

  const mba = processingResult.results.find((r) => r.sku === "MBA-M3");
  check(mba?.newCostPrice === 3600, "full-updater", "MacBook تكلفة محدّثة من النظام", `cost=${mba?.newCostPrice}`);

  const sgParent = processingResult.results.find((r) => r.sku === "SG-S24U" && !r.isVariant);
  check(sgParent !== undefined, "full-updater", "Samsung parent موجود", "missing");
}

// ── 9. تحديث التكلفة فقط ──
section("تحديث التكلفة");
{
  const { processingResult, updates } = processCostUpdate(
    DEMO_STORE_PRODUCTS as StoreProduct[],
    DEMO_SYSTEM_PRODUCTS
  );
  check(updates.length > 0, "cost-updater", "تحديثات تكلفة", `updates=${updates.length}`);
  check(processingResult.totalExcluded === 0, "cost-updater", "لا استثناءات في تحديث التكلفة", `excluded=${processingResult.totalExcluded}`);
}

// ── 10. خيارات بلا منتج رئيسي ──
section("خيارات بدون منتج رئيسي");
{
  const orphanVariants: StoreProduct[] = [
    { rowIndex: 2, type: "variant", name: "Orphan Black", category: "هواتف", quantity: 1, sellPrice: 100, sku: "ORP-B", costPrice: 80, option1: "أسود", option2: "", option3: "" },
    { rowIndex: 3, type: "variant", name: "Orphan White", category: "هواتف", quantity: 1, sellPrice: 110, sku: "ORP-W", costPrice: 85, option1: "أبيض", option2: "", option3: "" },
  ];

  const { processingResult } = processSellPricing(orphanVariants, 10);
  check(processingResult.totalProcessed === 2, "variant-handler", "خيارات يتيمة تُعالج", `processed=${processingResult.totalProcessed}`);
  check(
    processingResult.results.every((r) => r.isVariant),
    "variant-handler",
    "النتائج marked as variant",
    ""
  );
}

// ── 11. SKU مستثنى ──
section("استثناء SKU");
{
  const { processingResult } = processSellPricing(DEMO_STORE_PRODUCTS as StoreProduct[], 10, ["AP-PRO2"]);
  const airpods = processingResult.results.find((r) => r.sku === "AP-PRO2");
  check(airpods?.isExcluded === true, "exclusions", "SKU مستثنى يُتخطى", `excluded=${airpods?.isExcluded}`);
}

// ── 12. منتج بلا SKU ──
section("منتج بلا SKU");
{
  const noSku: StoreProduct[] = [
    { rowIndex: 2, type: "product", name: "No SKU", category: "هواتف", quantity: 1, sellPrice: 100, sku: "", costPrice: 80, option1: "", option2: "", option3: "" },
  ];
  const errors = validatePricingResults(
    processSellPricing(noSku, 10, [], ["هواتف||هواتف"]).processingResult.results
  );
  check(errors.some((e) => e.includes("بدون SKU")), "validation", "تحذير SKU فارغ", errors.join("; "));
}

// ── 13. getAllSelectedCategories ──
section("getAllSelectedCategories");
{
  const hierarchy = parseHierarchy(["إلكترونيات > هواتف", "إلكترونيات > سماعات", "أثاث > مكاتب"]);
  const selected = getAllSelectedCategories(["إلكترونيات"], [], hierarchy);
  check(
    selected.includes("إلكترونيات||هواتف") && selected.includes("إلكترونيات||سماعات"),
    "categories",
    "تحديد main يُضمّ كل subs كمفاتيح main||sub",
    selected.join(",")
  );
  check(!selected.includes("مكاتب"), "categories", "main آخر لا يُضمّ", selected.join(","));
}

// ── 14. سعة بدون لون (Samsung demo) ──
section("خيارات سعة بدون لون");
{
  const { processingResult } = processSellPricing(DEMO_STORE_PRODUCTS as StoreProduct[], 10);
  const v256 = processingResult.results.find((r) => r.sku === "SG-S24U-256");
  const v512 = processingResult.results.find((r) => r.sku === "SG-S24U-512");

  if (v256 && v512) {
    check(v256.newSellPrice !== v512.newSellPrice, "variant-unifier", "سعات مختلفة = أسعار مختلفة (لا توحيد)", `256=${v256.newSellPrice}, 512=${v512.newSellPrice}`);
  }
}

// ── 15. الجرد اليومي ──
section("الجرد اليومي");
{
  const store = DEMO_STORE_PRODUCTS.map((p) => ({ ...p })) as StoreProduct[];
  const system = DEMO_SYSTEM_PRODUCTS.map((s) => ({ ...s, quantity: Math.max(0, (s.quantity || 0) - 2) }));

  const { processingResult } = processDailyInventory(store, system);
  check(processingResult.totalProcessed === store.length, "inventory", "معالجة كل منتجات المتجر", `processed=${processingResult.totalProcessed}`);
  check(processingResult.totalDecreased > 0, "inventory", "تخفيض كميات عند نقص النظام", `decreased=${processingResult.totalDecreased}`);

  const increasedSystem = DEMO_SYSTEM_PRODUCTS.map((s) => ({ ...s, quantity: (s.quantity || 0) + 100 }));
  const { processingResult: blocked } = processDailyInventory(store, increasedSystem);
  check(blocked.totalBlocked > 0, "inventory", "منع زيادة الكمية في الجرد اليومي", `blocked=${blocked.totalBlocked}`);
}

// ── 16. الجرد الكامل ──
section("الجرد الكامل");
{
  const store = DEMO_STORE_PRODUCTS.map((p) => ({ ...p })) as StoreProduct[];
  const system = DEMO_SYSTEM_PRODUCTS.map((s) => ({ ...s, quantity: (s.quantity || 0) + 50 }));

  const { processingResult } = processFullInventory(store, system);
  const increased = processingResult.results.filter((r) => r.difference > 0);
  check(increased.length > 0, "inventory", "الجرد الكامل يسمح بالزيادة", `increased=${increased.length}`);
}

// ── 17. اختلاف isAvailable بين sell و full ──
section("اختلاف منطق التوفر بين sell و full");
{
  const variantsOnly: StoreProduct[] = [
    { rowIndex: 2, type: "product", name: "Color Phone", category: "هواتف", quantity: 1, sellPrice: 100, sku: "CP", costPrice: 80, option1: "", option2: "", option3: "" },
    { rowIndex: 3, type: "variant", name: "Black", category: "هواتف", quantity: 0, sellPrice: 100, sku: "CP-B", costPrice: 80, option1: "أسود", option2: "", option3: "" },
    { rowIndex: 4, type: "variant", name: "White", category: "هواتف", quantity: 1, sellPrice: 110, sku: "CP-W", costPrice: 85, option1: "أبيض", option2: "", option3: "" },
  ];
  const systemNoQty = [
    { sku: "CP-B", name: "Black", quantity: 0, costPrice: 80 },
    { sku: "CP-W", name: "White", quantity: 5, costPrice: 85 },
  ];

  const sellRes = processSellPricing(variantsOnly, 10, [], ["هواتف||هواتف"]);
  const fullRes = processFullUpdate(variantsOnly, systemNoQty, 10, [], ["هواتف||هواتف"]);

  const sellBlack = sellRes.processingResult.results.find((r) => r.sku === "CP-B");
  const sellWhite = sellRes.processingResult.results.find((r) => r.sku === "CP-W");
  const fullBlack = fullRes.processingResult.results.find((r) => r.sku === "CP-B");
  const fullWhite = fullRes.processingResult.results.find((r) => r.sku === "CP-W");

  if (sellBlack && sellWhite && fullBlack && fullWhite) {
    const sellUnified = sellBlack.newSellPrice === sellWhite.newSellPrice;
    const fullUnified = fullBlack.newSellPrice === fullWhite.newSellPrice;
    if (sellUnified !== fullUnified) {
      issues.push({
        severity: "high",
        area: "variant-unifier",
        title: "توحيد الألوان يختلف بين sell و full عند كمية نظام = 0",
        detail: `sell: unified=${sellUnified} (black=${sellBlack.newSellPrice}, white=${sellWhite.newSellPrice}); full: unified=${fullUnified} (black=${fullBlack.newSellPrice}, white=${fullWhite.newSellPrice}). sell يستخدم costPrice>0 للتوفر، full يستخدم quantity>0&&cost>0`,
      });
      console.log("  ⚠ اختلاف توحيد الألوان بين sell و full");
    } else {
      passed++;
      checks++;
      console.log("  ✓ sell و full متسقان في توحيد الألوان");
    }
  }
}

// ── 18. فلترة التصنيفات في تحديث التكلفة ──
section("فلترة التصنيفات في تحديث التكلفة");
{
  const { processingResult } = processCostUpdate(
    DEMO_STORE_PRODUCTS as StoreProduct[],
    DEMO_SYSTEM_PRODUCTS,
    ["هواتف||هواتف"]
  );
  const airpods = processingResult.results.find((r) => r.sku === "AP-PRO2");
  const iphone = processingResult.results.find((r) => r.sku === "IP15PM-256");
  check(airpods?.isExcluded === true, "cost-updater", "AirPods مستثنى في تحديث التكلفة", `excluded=${airpods?.isExcluded}`);
  check(iphone?.isExcluded === false, "cost-updater", "iPhone مُعالج في تحديث التكلفة", `excluded=${iphone?.isExcluded}`);
}

async function runExcelOptionTest() {
  section("أعمدة الخيارات في Excel");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("test");
  ws.getRow(1).getCell(33).value = "opt1-test";
  ws.getRow(1).getCell(37).value = "opt2-test";
  ws.getRow(1).getCell(41).value = "opt3-test";
  ws.getRow(2).getCell(3).value = "Test Product";
  ws.getRow(2).getCell(33).value = "أسود";
  const buf = Buffer.from(await wb.xlsx.writeBuffer());
  const parsed = await parseStoreExcel(buf, "test.xlsx");
  check(parsed.data[0]?.option1 === "أسود", "excel-parser", "قراءة option1 من العمود AG (33)", `option1=${parsed.data[0]?.option1}`);
}

async function printSummary() {
  await runExcelOptionTest();

  console.log("\n" + "=".repeat(50));
  console.log(`النتيجة: ${passed}/${checks} فحص ناجح`);
  console.log(`المشاكل المكتشفة: ${issues.length}`);
  console.log("=".repeat(50));

  if (issues.length > 0) {
    console.log("\n📋 سجل المشاكل:\n");
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    issues.sort((a, b) => order[a.severity] - order[b.severity]);
    for (const [i, issue] of issues.entries()) {
      console.log(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.area}`);
      console.log(`   ${issue.title}`);
      console.log(`   → ${issue.detail}\n`);
    }
  }

  process.exit(issues.some((i) => i.severity === "critical" || i.severity === "high") ? 1 : 0);
}

printSummary();
