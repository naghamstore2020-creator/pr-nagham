export function sanitizeString(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function cleanText(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .replace(/\s+/g, " "); // collapse multiple spaces
}

export function normalizeArabic(text: string): string {
  if (!text) return "";
  let cleaned = text.trim().toLowerCase();
  
  // Normalize Arabic characters to help match names
  cleaned = cleaned
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/[-_\/]/g, " ") // normalize separators to space
    .replace(/\s+/g, " "); // collapse spaces
    
  return cleaned;
}

export function parseNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}
