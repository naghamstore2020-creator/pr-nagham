const COLOR_KEYWORDS = [
  "ابيض", "أبيض", "اسود", "أسود", "احمر", "أحمر", "ازرق", "أزرق",
  "اخضر", "أخضر", "اصفر", "أصفر", "بنفسجي", "برتقالي", "وردي", "زهري",
  "بني", "رمادي", "فضي", "ذهبي", "كحلي", "عنابي", "بيج", "موف",
  "زيتي", "نبيتي", "سكري", "بينك", "تيتانيوم", "تتيتايوم", "تيتنايوم",
  "كريمي", "كرستال", "تفاحي", "رصاصي", "سماوي", "جري", "بلو",
  "داكن", "غامق", "فاتح", "ثلجي", "سحابي", "فضائي",
  "white", "black", "red", "blue", "green", "yellow", "purple", "orange",
  "pink", "brown", "gray", "grey", "gold", "silver", "navy", "teal",
  "mint", "coral", "beige", "rose",
];

export function isColorValue(val: string | undefined): boolean {
  if (!val) return false;
  const lower = val.toLowerCase();
  return COLOR_KEYWORDS.some((c) => lower.includes(c));
}

export function detectColorOptions(
  entries: Array<{ option1?: string; option2?: string; option3?: string }>
): [boolean, boolean, boolean] {
  return [
    entries.some((e) => isColorValue(e.option1)),
    entries.some((e) => isColorValue(e.option2)),
    entries.some((e) => isColorValue(e.option3)),
  ];
}

export function getNonColorGroupKey(
  entry: { option1?: string; option2?: string; option3?: string },
  isColorOpt: [boolean, boolean, boolean]
): string {
  const parts: string[] = [];
  if (!isColorOpt[0]) parts.push(entry.option1 || "");
  if (!isColorOpt[1]) parts.push(entry.option2 || "");
  if (!isColorOpt[2]) parts.push(entry.option3 || "");
  return parts.join("||");
}

export function getColorLabel(
  entry: { option1?: string; option2?: string; option3?: string },
  isColorOpt: [boolean, boolean, boolean]
): string {
  const options = [entry.option1, entry.option2, entry.option3];
  for (let i = 0; i < 3; i++) {
    if (isColorOpt[i] && options[i]) return options[i]!;
  }
  return "";
}

export function formatGroupLabel(groupKey: string): string {
  if (!groupKey) return "المنتج";
  return groupKey.split("||").filter(Boolean).join(" + ") || "المنتج";
}
