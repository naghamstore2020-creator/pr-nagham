# تقرير تدقيق المشروع — نظام إدارة المنتجات NAGHAMSTORE

**تاريخ التدقيق:** 8 يونيو 2026  
**النسخة:** 2.7  
**حالة البناء:** ✅ ناجح — 0 أخطاء، 40 تحذير (ESLint)  
**عدد ملفات المصدر:** ~95 ملف  
**إجمالي سطور الكود:** ~12,000 سطر  

---

## المشاكل الحرجة (يجب التعديل فوراً)

### 1. storeName يخزن SKU بدلاً من اسم المنتج الفعلي
| الملف | السطر |
|---|---|
| `src/actions/ai-matching.ts` | 245 |

```typescript
// عند إنشاء AiMatch جديد في saveAcceptedMatch():
create: {
  storeName: storeSku || "", // ❌ اسم المنتج مخزّن كـ SKU
  systemName, storeSku,
  ...
}
```

**التأثير:** عند قبول/رفض مطابقة، يُحفظ "رمز SKU" كاسم المنتج في قاعدة البيانات. لاحقاً عند عرض السجلات، يظهر SKU بدلاً من اسم المنتج الفعلي.

**الحل:** يجب تمرير `storeName` الفعلي إلى دالة `saveAcceptedMatch()` واستخدامه بدلاً من `storeSku`.

---

### 2. كل قبول/رفض ينشئ سجل Job مستقل — مشكلة أداء
| الملف | السطر |
|---|---|
| `src/actions/ai-matching.ts` | 235-253 |

```typescript
// saveAcceptedMatch() ينشئ Job جديد لكل مطابقة
await prisma.job.create({
  data: {
    type: JobType.AI_MATCHING,
    status: "COMPLETED",
    ...
    aiMatches: { create: { ... } },
  },
});
```

**التأثير:** قبول 1000 مطابقة = 1000 سجل Job منفصل. هذا يسبب:
- بطء شديد في `handleAcceptAll()` لأنها ترسل كل طلب بتسلسل
- فوضى في صفحة سجل العمليات
- استهلاك غير ضروري للمساحة في قاعدة البيانات

**الحل:** 
- إما استخدام `prisma.aiMatch.upsert()` مباشرة (تجنب إنشاء Job لكل مطابقة فردية)
- أو جمع الدفعات وإرسالها كـ `createMany` في Job واحد

---

### 3. عدم الهروب من الفواصل والاقتباسات في تصدير CSV
| الملف | السطر |
|---|---|
| `src/app/dashboard/profit/page.tsx` | 93 |

```typescript
const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
const blob = new Blob(["\uFEFF" + csv], ...);
```

**التأثير:** إذا كان اسم المنتج أو الخيارات يحتوي على فاصلة `,` أو علامة اقتباس `"`، يصبح ملف CSV تالفاً وغير قابل للفتح في Excel.

**الحل:** استخدام دالة escape صحيحة لحقول CSV:
```typescript
function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
```

---

### 4. تداخل regex في اكتشاف نوع المنتج — `قلاست` يطابق الحالتين
| الملف | السطر |
|---|---|
| `src/lib/matching/engine.ts` | 208, 210 |

```typescript
// Case:  يشمل "قلاست"
if (/...|قلاست|...|case\b/.test(lower)) return "case";

// Screen protector: يشمل "قلاست" أيضاً
if (/...|قلاست|glast|glass|.../.test(lower)) return "screen_protector";
```

**التأثير:** لأن `case` يُفحص أولاً، أي واقي شاشة زجاجي (glass) يُصنف كـ "case" (جراب/كفر) بدلاً من "screen_protector". هذا يؤثر على خوارزمية التسجيل في محرك المطابقة ويعطي نتائج غير دقيقة.

**الحل:** إزالة `قلاست` من regex الجرابات (case) أو إعادة ترتيب الفحوصات.

---

### 5. استخدام مسافة بدلاً من سلسلة فارغة في فلاتر سجل العمليات
| الملف | السطر |
|---|---|
| `src/app/dashboard/logs/page.tsx` | 125 |

```typescript
<SelectItem value=" " className="text-xs">الكل</SelectItem>
```

**التأثير:** عند اختيار "الكل"، تُرسل قيمة `" "` (مسافة) كـ `filterType` إلى السيرفر. دالة `buildFilters()` تتضمن `{ type: " " }` مما قد يؤدي إلى عدم تصفية السجلات بشكل صحيح.

**الحل:** تغيير القيمة إلى `""` (سلسلة فارغة) والتأكد من أن `buildFilters()` تتعامل معها بشكل صحيح (تتجاهل السلسلة الفارغة).

---

### 6. قبول جميع المعلقات يتم بتسلسل — بطء شديد
| الملف | السطر |
|---|---|
| `src/app/dashboard/ai-matching/page.tsx` | 96-98 |

```typescript
const handleAcceptAll = async () => {
  const toAccept = matches.filter((m) => m.status === "manual_review");
  for (const m of toAccept) {
    const res = await saveAcceptedMatch(m.storeSku, m.systemSku, m.systemName);
    if (res.success) saved++;
  }
};
```

**التأثير:** 100 مطابقة تحتاج مراجعة = 100 طلب متسلسل. هذا يستغرق وقتاً طويلاً ويعطي تجربة مستخدم سيئة. أيضاً فشل مطابقة واحدة لا يوقف الباقي لكن لا توجد معالجة للأخطاء المجمعة.

**الحل:** استخدام `Promise.allSettled()` للتزامن وإنشاء Job واحد بكل المطابقات المقبولة.

---

### 7. عدم تحديث systemSku عند تحديث مطابقة موجودة
| الملف | السطر |
|---|---|
| `src/actions/ai-matching.ts` | 226-234 |

```typescript
const existing = await prisma.aiMatch.findFirst({
  where: { storeSku, systemSku: systemSku || null },
});
if (existing) {
  await prisma.aiMatch.update({
    where: { id: existing.id },
    data: { status: newStatus, systemName }, // ❌ systemSku لا يتم تحديثه
  });
}
```

**التأثير:** إذا غيّر المستخدم المطابقة من systemA إلى systemB، يتم إنشاء سجل جديد بدلاً من تحديث القديم، مما يؤدي إلى ازدواجية في البيانات.

**الحل:** إما تحديث `systemSku` أيضاً، أو استخدام `upsert` مع `storeSku` فقط كمفتاح.

---

## المشاكل التي يجب الانتباه لها

### 8. `CAPACITY_MAP` غير مستخدمة
| الملف | السطر |
|---|---|
| `src/lib/matching/engine.ts` | 57-59 |

`CAPACITY_MAP` معرفة ولكن لا تستخدم في أي مكان. كانت مخصصة لتطبيع مصطلحات السعة (جيجا/تيرا) لكن `extractStorage()` تستخدم regex مباشرة.

### 9. `maxScore` غير مستخدمة في `computePhoneScore`
| الملف | السطر |
|---|---|
| `src/lib/matching/engine.ts` | 281 |

```typescript
function computePhoneScore(...): number {
  let score = 0;
  let maxScore = 100; // ❌ معلنة ولكن لا تستخدم أبداً
  ...
}
```

### 10. `storeName` غائب عند قبول/رفض — معلومات ناقصة
عند استدعاء `saveAcceptedMatch()` في الصفحة، يتم تمرير `storeSku`, `systemSku`, `systemName` فقط. لكن اسم المنتج الفعلي (`storeName`) لا يُحفظ في قاعدة البيانات للمطابقات الجديدة.

### 11. عدم توافق مثال الأرباح المتوقع مع الصيغة الحالية
النظام يطبق الصيغة التالية (في `pricing-formula.ts`):
- Base = Cost + Profit
- Fees = Base × 6.99% + 1.5
- VAT = Fees × 15%
- Total = Base + Fees + VAT
- Final = ⌈Total × 1.15⌉
- PriceBeforeVAT = Final / 1.15

مثال المستخدم: 1000 ريال ← مدى 987.35  
لكن الحسابات الحالية تعطي نتائج مختلفة. يجب التحقق من صحة الصيغ.

### 12. `let` بدلاً من `const` لمتغيرات غير معاد تعيينها
| الملف | السطر |
|---|---|
| `src/lib/inventory/full-processor.ts` | 25 |
| `src/lib/matching/engine.ts` | 281 |

يتوقع ESLint استخدام `const` لأن هذه المتغيرات لا يعاد تعيينها أبداً.

### 13. تعليقات eslint-disable غير ضرورية في prisma.ts
| الملف | السطر |
|---|---|
| `src/lib/prisma.ts` | 13, 17, 25, 28 |

```typescript
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaLibSql } = require('@prisma/adapter-libsql')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
return new (PrismaClient as any)({ adapter }) as PrismaClient
```

هذه التحذيرات لم تعد تُبلغ (ربما بسبب تحديث ESLint أو `@typescript-eslint`). يمكن إزالة التعليقات.

### 14. `!` غير ضروري في استدعاء `sysProd`
| الملف | السطر |
|---|---|
| `src/lib/pricing/full-updater.ts` | 119 |

```typescript
const calc = calculateSellPrice(sysProd!.costPrice, profit);
```

بما أن `hasSystemCost(sysProd)` يتحقق من وجود `sysProd` ووجود `costPrice` قبله، استخدم `sysProd!` مؤكد. هذا ليس خطأ فادحاً لكنه قد يخفي أخطاء إذا تغيرت المنطق مستقبلاً.

---

## المشاكل البسيطة / تحسينات

### 15. استخدام أعمدة "A", "B", "C" كترويسة جدول
| الملفات |
|---|
| `src/components/inventory-preview.tsx` (سطر 110-114) |
| `src/components/pricing-preview.tsx` (سطر 121-128, 188-194) |

ترويسة الصف الأول تستخدم "A", "B", "C"... وهي أسماء أعمدة Excel عامة. الصف الثاني يحتوي التسميات العربية الفعلية. يمكن دمج الصفين في صف واحد للتسميات العربية فقط.

### 16. `category-select.tsx` كبير الحجم — 304 سطر
مكون واحد كبير يحتوي كل منطق اختيار التصنيفات. يمكن تقسيمه إلى مكونات أصغر.

### 17. `full-updater.ts` — 435 سطر مع دوال متداخلة معقدة
دالة `processFullUpdate()` كبيرة جداً وتحتوي على دوال متداخلة (`processSingleProduct`). صعبة القراءة والصيانة.

### 18. صلاحية المستخدمين EXPORT غير مستخدمة
`Permission.EXPORT` معرف في `user.ts` لكنه لا يستخدم فعلياً في أي مكان (لا توجد عملية تصدير تتحقق من الصلاحية).

### 19. عدم وجود اختبارات
لا يوجد ملف اختبارات فعلي (`tests/integration-audit.ts` هو سكريبت تدقيق وليس اختبار). لا يوجد `jest` أو `vitest` أو `playwright` في `package.json`.

### 20. رسائل الخطأ مكررة عبر الملفات
أنماط معالجة الأخطاء مكررة بين `executeInventoryJob`, `executeMatchingJob`, وكل دوال `pricing.ts`. يمكن استخراج نمط مشترك.

### 21. sessionStorage يُستخدم كقاعدة بيانات مؤقتة
جميع الصفحات تقرأ من `sessionStorage` لتحميل حالة الملفات. هذا يعني أن تحديث الصفحة يفقد البيانات. يمكن استخدام `localStorage` بدلاً منه للاستمرارية.

### 22. عدم استخدام `next-auth` middleware بشكل صحيح
ملف `proxy.ts` (في src/) يستخدم middleware لحماية المسارات. لكن بعض الصفحات لا تتحقق من الجلسة بشكل صحيح في الجانب العميل (مثل صفحة الرفع).

### 23. تحذيرات `@typescript-eslint/no-unused-vars`
```
src/lib/matching/engine.ts:57   - 'CAPACITY_MAP' معرف ولكن غير مستخدم
src/lib/matching/engine.ts:281  - 'maxScore' معرف ولكن غير مستخدم
tests/integration-audit.ts:182  - 'sellUpdates' معرف ولكن غير مستخدم
```

### 24. عدم وجود constant للـ VAT
نسبة VAT (0.15) مكررة في:
- `src/lib/profit/calculator.ts` (سطر 17)
- `src/constants/pricing-formula.ts` (سطر 8)

يمكن استخراجها إلى constant واحد.

---

## ملخص البناء

```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 3.6s
✓ TypeScript check passed
✓ 18 صفحة تم بناؤها
- 0 أخطاء بناء
- 3 أخطاء ESLint (prefer-const ×2, unused-var ×1)
- 40 تحذير ESLint
```

## توصيات عاجلة

| # | المشكلة | الأولوية | الجهد | الملف المتأثر |
|---|---|---|---|---|
| 1 | storeName يُخزّن SKU | 🔴 حرجة | سهل | `ai-matching.ts` |
| 2 | إنشاء Job لكل مطابقة فردية | 🔴 حرجة | متوسط | `ai-matching.ts` |
| 3 | CSV بدون escape | 🔴 حرجة | سهل | `profit/page.tsx` |
| 4 | تداخل regex قلاست | 🔴 حرجة | سهل | `engine.ts` |
| 5 | فلتر مسافة في logs | 🟡 متوسطة | سهل | `logs/page.tsx` |
| 6 | handleAcceptAll تسلسلي | 🟡 متوسطة | سهل | `ai-matching/page.tsx` |
| 7 | عدم تحديث systemSku | 🟡 متوسطة | سهل | `ai-matching.ts` |
| 8-14 | مشاكل يجب الانتباه | 🟢 منخفضة | متنوع | متعدد |

---

*تم إنشاء هذا التقرير آلياً بواسطة أداة التدقيق.*
