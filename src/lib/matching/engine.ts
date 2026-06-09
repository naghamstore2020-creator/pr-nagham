// ──────────────────────────────────────────────────────
// Dictionaries
// ──────────────────────────────────────────────────────

const BRAND_ALIASES: [string, string][] = [
  ["ايفون","iphone"], ["iphone","apple"], ["ابل","apple"],
  ["سامسونج","samsung"], ["سامسونق","samsung"], ["samsung","samsung"],
  ["هواوي","huawei"], ["huawei","huawei"],
  ["هونر","honor"], ["honor","honor"],
  ["اوبو","oppo"], ["oppo","oppo"],
  ["ريلمي","realme"], ["realme","realme"],
  ["فيفو","vivo"], ["vivo","vivo"],
  ["شاومي","xiaomi"], ["xiaomi","xiaomi"],
  ["ريدمي","redmi"], ["redmi","redmi"],
  ["بوكو","poco"], ["poco","poco"],
  ["لينوفو","lenovo"], ["lenovo","lenovo"],
  ["انفنكس","infinix"], ["infinix","infinix"],
  ["تكنو","tecno"], ["tecno","tecno"],
  ["جبل","jbl"], ["jbl","jbl"],
  ["زد تي اي","zte"], ["zte","zte"],
  ["لافا","lava"], ["lava","lava"],
  ["موتورولا","motorola"], ["motorola","motorola"],
  ["نوكيا","nokia"], ["nokia","nokia"],
  ["دينكس","denx"], ["denx","denx"],
  ["وين ماكس","winmax"], ["winmax","winmax"],
  ["باورولوجي","powerology"], ["powerology","powerology"],
  ["بروميت","promate"], ["promate","promate"],
  ["اس بي","sp"], ["sp","sp"],
  ["بيسيوس","baseus"], ["baseus","baseus"],
  ["لينيس","lenyes"], ["lenyes","lenyes"],
  ["ساوند كور","soundcore"], ["soundcore","soundcore"],
  ["اوكي","aukey"], ["aukey","aukey"],
  ["ادموس","admos"], ["admos","admos"],
  ["لينك اب","linkup"], ["linkup","linkup"],
  ["فولت","volt"], ["volt","volt"],
  ["هاينو تيكو","haino teko"], ["haino teko","haino teko"],
  ["سيلولار لاين","cellularline"], ["cellularline","cellularline"],
  ["تيكو","teko"], ["teko","teko"],
  ["بلوكاما","plokama"], ["plokama","plokama"],
  ["جيبول","jeebeel"], ["jeebeel","jeebeel"],
  ["بلو فاير","bluefire"], ["bluefire","bluefire"],
  ["ريفو","rivo"], ["rivo","rivo"],
  ["google","google"], ["pixel","google"], ["oneplus","oneplus"],
  ["asus","asus"], ["acer","acer"], ["dell","dell"], ["hp","hp"],
  ["microsoft","microsoft"], ["surface","microsoft"],
  ["amazon","amazon"], ["kindle","amazon"], ["anker","anker"],
  ["bosch","bosch"], ["philips","philips"], ["sony","sony"], ["lg","lg"],
  ["toshiba","toshiba"],
];

const EDITION_MAP: Record<string, string> = {
  "برو":"pro","بروماكس":"pro max","promax":"pro max","pro max":"pro max",
  "ماكس":"max","الترا":"ultra","بلس":"plus","لايت":"lite",
  "ميني":"mini","اير":"air","نوت":"note","اف اي":"fe","اس اي":"se",
};



const PORT_MAP: Record<string, string> = {
  "تايب سي":"type-c","تايب سيب":"type-c","type-c":"type-c","type c":"type-c",
  "لايتنينج":"lightning","lightning":"lightning",
  "مايكرو":"micro-usb","micro usb":"micro-usb","micro-usb":"micro-usb",
  "c-c":"c-c","c to c":"c-c","c الي c":"c-c",
  "c-l":"c-l","c to l":"c-l","c الي l":"c-l",
  "u-c":"u-c","u to c":"u-c",
  "u-l":"u-l","u to l":"u-l",
  "u-m":"u-m","u to m":"u-m",
};

const STOP_WORDS = new Set([
  "جهاز","هاتف","جوال","الكتروني","إلكتروني","ذكي","اصدار","إصدار","نسخة",
  "جديد","أصلي","اصلي","ضمان","شريحة","شريحتين","احترافي","مميز","فاخر",
  "قوي","حديث","شفاف","مغناطيسي","بصمة","خصوصية","عدسة","تقليد",
  "هاي كوبي","high copy","درجة اولى","درجة أولى","نسخة مطورة","نسخة جديدة",
  "اللون","مقاس","حجم","سعة","موديل","رقم","نوع","معالج","ذاكرة",
  "خيار","منتج","عدد","قطعة","حبة","كرتونة","صندوق","علبة",
  "orig","code","new code","disc","brand","type","item","product",
  "unit","piece","box","pack","ال","في","مع","و","او","من","الى","التي",
]);

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

function normalizeText(text: string): string {
  let s = text.toLowerCase().trim();
  s = s.replace(/[أإآٱ]/g, "ا");
  s = s.replace(/[ى]/g, "ي");
  s = s.replace(/[ؤ]/g, "و");
  s = s.replace(/[ئ]/g, "ي");
  s = s.replace(/[ة]/g, "ه");
  s = s.replace(/[گ]/g, "ك");
  s = s.replace(/[\u064B-\u065F\u0670]/g, "");
  s = s.replace(/[^a-z0-9\u0600-\u06FF\s.\-:\/]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function tokenize(text: string): string[] {
  return normalizeText(text).split(/\s+/).filter((t) => t.length > 0);
}

function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOP_WORDS.has(t));
}

// ──────────────────────────────────────────────────────
// Entity extraction
// ──────────────────────────────────────────────────────

export interface ExtractedInfo {
  brand: string;
  model: string;
  storage: number | null;
  wattage: number | null;
  port: string;
  edition: string;
  productType: string;
  color: string;
}

function extractBrand(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, brand] of BRAND_ALIASES) {
    if (lower.includes(keyword)) return brand;
  }
  return "";
}

function extractModel(text: string): string {
  const norm = normalizeText(text);
  // Model patterns: alphanumeric with optional hyphens/dots
  const patterns = [
    // Product codes like SP-0003, DX410, RW56, 520BT, GT5-PRO
    /(?:^|\s)([a-z]{1,4}[-]?\d{2,4}[a-z0-9]*)/i,
    // Samsung/Android models: A56, S24, S24ULTRA, X8C, X200
    /(?:^|\s)([a-z]\d{2,3}[a-z]*(?:\s*(?:pro|ultra|plus|max|lite|fe|se))?)/i,
    // iPhone models: 15, 16, 14PRO, 15PLUS, 16PROMAX
    /(?:^|\s)(\d{2}\s*(?:pro\s*max|pro|plus|ultra))/i,
    // Model after brand
    /(?:^|\s)([a-z]{2,}\s*\d{2,4})/i,
  ];
  for (const pat of patterns) {
    const m = norm.match(pat);
    if (m) return m[1].replace(/\s+/g, "").toLowerCase();
  }
  return "";
}

function extractStorage(text: string): number | null {
  const lower = text.toLowerCase();
  const pat = /(\d+)\s*(?:gb|جيجا|جيجابايت|tb|تيرا|تيرابايت)\b/i;
  const m = lower.match(pat);
  if (!m) return null;
  const val = parseInt(m[1], 10);
  return m[0].toLowerCase().includes("tb") ? val * 1024 : val;
}

function extractWattage(text: string): number | null {
  const m = text.toLowerCase().match(/(\d+)\s*w\b/);
  return m ? parseInt(m[1], 10) : null;
}

function extractPort(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, port] of Object.entries(PORT_MAP)) {
    if (lower.includes(keyword)) return port;
  }
  return "";
}

function extractEdition(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, edition] of Object.entries(EDITION_MAP)) {
    if (lower.includes(keyword)) return edition;
  }
  return "";
}

function extractColor(text: string): string {
  const colors: [string, string][] = [
    ["اسود","black"], ["ابيض","white"], ["احمر","red"], ["ازرق","blue"],
    ["اخضر","green"], ["اصفر","yellow"], ["ذهبي","gold"], ["فضي","silver"],
    ["رمادي","gray"], ["بني","brown"], ["بنفسجي","purple"], ["برتقالي","orange"],
    ["نحاسي","copper"], ["وردي","pink"], ["بيج","beige"],
    ["black","black"], ["white","white"], ["red","red"], ["blue","blue"],
    ["green","green"], ["gold","gold"], ["silver","silver"], ["gray","gray"],
    ["purple","purple"], ["orange","orange"], ["pink","pink"],
  ];
  const lower = text.toLowerCase();
  for (const [keyword, color] of colors) {
    if (lower.includes(keyword)) return color;
  }
  return "";
}

function detectProductType(text: string): string {
  const lower = text.toLowerCase();
  // Phone keywords
  if (/هاتف|جوال|موبايل|iphone|samsung|galaxy|نوت|ريد مي|ريدمي/.test(lower)) return "phone";
  // Tablet keywords
  if (/تاب|تابلت|tab|ipad|pad\b|tablet/.test(lower)) return "tablet";
  // Watch keywords
  if (/ساعة|watch|smart.?watch/.test(lower)) return "watch";
  // Case / screen protector
  if (/كفر|غطاء|جراب|حافظة|شاشة.?حماية|كيس|جلد|سيليكون|cover|case\b/.test(lower)) return "case";
  // Screen protector (glass)
  if (/حماية.?شاشة|قلاست|glast|glass|ninja|حامي|حماية/.test(lower)) return "screen_protector";
  // Headphones / earphones
  if (/سماعة|سماعه|ايربودز|airpods|earphone|headphone|buds|earbuds|هاندز|هاندس/.test(lower)) return "headphone";
  // Charger
  if (/شاحن|شحن|charger|charging|adapter|adaptor/.test(lower)) return "charger";
  // Cable
  if (/كيبل|كابل|سلك|cable|usb|type.?c|لايتنينج|lightning|مايكرو/.test(lower)) return "cable";
  // Power bank
  if (/باور.?بانك|بطارية.?شحن|بوربانك|power.?bank/.test(lower)) return "powerbank";
  // Speaker
  if (/سبيكر|مكبر|صوت|متحرك|سماعة.?بلوتوث|speaker/.test(lower)) return "speaker";
  // Default: try to infer from brand
  const brand = extractBrand(lower);
  if (brand && /samsung|apple|xiaomi|honor|oppo|realme|vivo|nokia/.test(brand)) return "phone";
  return "other";
}

export function extractInfo(text: string): ExtractedInfo {
  return {
    brand: extractBrand(text),
    model: extractModel(text),
    storage: extractStorage(text),
    wattage: extractWattage(text),
    port: extractPort(text),
    edition: extractEdition(text),
    productType: detectProductType(text),
    color: extractColor(text),
  };
}

// ──────────────────────────────────────────────────────
// Similarity (Dice coefficient)
// ──────────────────────────────────────────────────────

function diceCoefficient(a: string, b: string): number {
  if (a === b) return 100;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
  }
  let overlap = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const count = bigrams.get(bg) || 0;
    if (count > 0) { overlap++; bigrams.set(bg, count - 1); }
  }
  return (2 * overlap) / (a.length - 1 + b.length - 1) * 100;
}

function tokenSetRatio(a: string, b: string): number {
  const ta = removeStopWords(tokenize(a));
  const tb = removeStopWords(tokenize(b));
  if (ta.length === 0 && tb.length === 0) return 100;
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  const jaccard = (intersection.size / union.size) * 100;
  const dice = diceCoefficient(normalizeText(a), normalizeText(b));
  return Math.round(jaccard * 0.5 + dice * 0.5);
}

// ──────────────────────────────────────────────────────
// Category-specific scoring
// ──────────────────────────────────────────────────────

function computePhoneScore(aInfo: ExtractedInfo, bInfo: ExtractedInfo, rawA: string, rawB: string): number {
  let score = 0;

  // Model 50%
  if (aInfo.model && bInfo.model) {
    const modelWeight = 50;
    if (aInfo.model === bInfo.model) {
      score += modelWeight;
      // Mandatory: exact model match → at least 95%
      return Math.max(95, score + computeRemaining(aInfo, bInfo, rawA, rawB, 50));
    }
  }

  // Brand 20%
  if (aInfo.brand && bInfo.brand && aInfo.brand === bInfo.brand) {
    score += 20;
  }

  // Storage 15%
  if (aInfo.storage !== null && bInfo.storage !== null && aInfo.storage === bInfo.storage) {
    score += 15;
  }

  // Color 5%
  if (aInfo.color && bInfo.color && aInfo.color === bInfo.color) {
    score += 5;
  }

  // Text similarity 10%
  const textScore = tokenSetRatio(rawA, rawB);
  score += Math.round(textScore * 0.1);

  return Math.min(100, Math.round(score));
}

function computeCaseScore(aInfo: ExtractedInfo, bInfo: ExtractedInfo, rawA: string, rawB: string): number {
  let score = 0;

  // Device model 40%
  if (aInfo.model && bInfo.model) {
    if (aInfo.model === bInfo.model) {
      score += 40;
      return Math.max(95, score + computeRemaining(aInfo, bInfo, rawA, rawB, 60));
    }
  }

  // Edition 30% (Pro/Max/Ultra etc.)
  if (aInfo.edition && bInfo.edition && aInfo.edition === bInfo.edition) {
    score += 30;
  }

  // Brand 20%
  if (aInfo.brand && bInfo.brand && aInfo.brand === bInfo.brand) {
    score += 20;
  }

  // Text similarity 10%
  score += Math.round(tokenSetRatio(rawA, rawB) * 0.1);

  return Math.min(100, Math.round(score));
}

function computeAccessoryScore(aInfo: ExtractedInfo, bInfo: ExtractedInfo, rawA: string, rawB: string): number {
  let score = 0;

  // Model code 60%
  if (aInfo.model && bInfo.model) {
    if (aInfo.model === bInfo.model) {
      score += 60;
      return Math.max(95, score + computeRemaining(aInfo, bInfo, rawA, rawB, 40));
    }
  }

  // Brand 25%
  if (aInfo.brand && bInfo.brand && aInfo.brand === bInfo.brand) {
    score += 25;
  }

  // Specs (port, wattage) — 15% combined
  if (aInfo.port && bInfo.port && aInfo.port === bInfo.port) score += 8;
  if (aInfo.wattage !== null && bInfo.wattage !== null && aInfo.wattage === bInfo.wattage) score += 7;

  return Math.min(100, Math.round(score));
}

function computeRemaining(aInfo: ExtractedInfo, bInfo: ExtractedInfo, rawA: string, rawB: string, remaining: number): number {
  let s = 0;
  const parts: Array<{ key: boolean; pts: number }> = [
    { key: !!(aInfo.brand && bInfo.brand && aInfo.brand === bInfo.brand), pts: Math.round(remaining * 0.35) },
    { key: !!(aInfo.storage !== null && bInfo.storage !== null && aInfo.storage === bInfo.storage), pts: Math.round(remaining * 0.25) },
    { key: !!(aInfo.edition && bInfo.edition && aInfo.edition === bInfo.edition), pts: Math.round(remaining * 0.2) },
    { key: !!(aInfo.color && bInfo.color && aInfo.color === bInfo.color), pts: Math.round(remaining * 0.1) },
  ];
  for (const p of parts) if (p.key) s += p.pts;
  // text remainder
  const textPortion = remaining - parts.reduce((a, p) => a + p.pts, 0);
  if (textPortion > 0) s += Math.round(tokenSetRatio(rawA, rawB) * (textPortion / 100));
  return Math.min(remaining, s);
}

// ──────────────────────────────────────────────────────
// Mandatory rule enforcement
// ──────────────────────────────────────────────────────

function applyMandatoryRules(aInfo: ExtractedInfo, bInfo: ExtractedInfo, confidence: number): number {
  let c = confidence;

  // Port mismatch → drastic reduction
  if (aInfo.port && bInfo.port && aInfo.port !== bInfo.port) {
    c = Math.min(c, 30);
  }

  // Wattage mismatch → consider different
  if (aInfo.wattage !== null && bInfo.wattage !== null && aInfo.wattage !== bInfo.wattage) {
    c = Math.min(c, 40);
  }

  return c;
}

function computeScore(rawA: string, rawB: string): number {
  const aInfo = extractInfo(rawA);
  const bInfo = extractInfo(rawB);
  const ptype = aInfo.productType === "other" ? bInfo.productType : aInfo.productType;

  let score: number;
  switch (ptype) {
    case "phone":
    case "tablet":
    case "watch":
      score = computePhoneScore(aInfo, bInfo, rawA, rawB);
      break;
    case "case":
    case "screen_protector":
      score = computeCaseScore(aInfo, bInfo, rawA, rawB);
      break;
    case "headphone":
    case "charger":
    case "cable":
    case "powerbank":
    case "speaker":
      score = computeAccessoryScore(aInfo, bInfo, rawA, rawB);
      break;
    default:
      score = computeAccessoryScore(aInfo, bInfo, rawA, rawB);
  }

  score = applyMandatoryRules(aInfo, bInfo, score);
  return Math.min(100, Math.max(0, Math.round(score)));
}

// ──────────────────────────────────────────────────────
// Public types and functions
// ──────────────────────────────────────────────────────

export interface MatchResult {
  storeName: string;
  storeOptions: string;
  systemName: string;
  storeSku: string;
  systemSku: string;
  confidence: number;
  status: "auto_matched" | "manual_review" | "rejected";
}

interface SystemProduct {
  name: string;
  sku: string;
}

export async function matchBySku(
  storeProducts: Array<{ name: string; sku: string; options?: string }>,
  systemProducts: SystemProduct[]
): Promise<{ matches: MatchResult[]; stats: { total: number; autoMatched: number; manualReview: number; rejected: number } }> {
  const systemBySku = new Map<string, SystemProduct>();
  for (const sys of systemProducts) {
    if (sys.sku) systemBySku.set(sys.sku.toLowerCase().trim(), sys);
  }

  const matches: MatchResult[] = [];

  for (const store of storeProducts) {
    if (!store.sku) continue;
    const sys = systemBySku.get(store.sku.toLowerCase().trim());
    if (!sys) continue;

    const fullName = store.options ? `${store.name} ${store.options}` : store.name;
    const confidence = computeScore(fullName, sys.name);

    let status: MatchResult["status"];
    if (confidence >= 95) status = "auto_matched";
    else if (confidence >= 80) status = "manual_review";
    else status = "rejected";

    matches.push({
      storeName: store.name,
      storeOptions: store.options || "",
      systemName: sys.name,
      storeSku: store.sku,
      systemSku: sys.sku,
      confidence,
      status,
    });
  }

  const stats = {
    total: matches.length,
    autoMatched: matches.filter((m) => m.status === "auto_matched").length,
    manualReview: matches.filter((m) => m.status === "manual_review").length,
    rejected: matches.filter((m) => m.status === "rejected").length,
  };

  return { matches, stats };
}
