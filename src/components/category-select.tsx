"use client";

import { useEffect, useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, ChevronDown, ChevronLeft, Eye, Table2, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toCategoryKey } from "@/lib/pricing/category-utils";

interface CategorySelectProps {
  storeFileUrl: string;
  selectedMain: string[];
  selectedSub: string[];
  onChange: (selectedMain: string[], selectedSub: string[]) => void;
}

export default function CategorySelect({ storeFileUrl, selectedMain, selectedSub, onChange }: CategorySelectProps) {
  const [mains, setMains] = useState<string[]>([]);
  const [subsByMain, setSubsByMain] = useState<Record<string, string[]>>({});
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [previewProducts, setPreviewProducts] = useState<Array<{
    rowIndex: number;
    name: string;
    sku: string;
    category: string;
    sellPrice: number;
    costPrice: number;
    isVariant: boolean;
  }> | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [totalSelected, setTotalSelected] = useState(0);

  const categoryKey = (main: string, sub: string) => toCategoryKey(main, sub);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    import("@/actions/categories").then(({ getStoreCategories }) =>
      getStoreCategories(storeFileUrl).then((res) => {
        if (cancelled) return;
        setLoading(false);
        if (res.success) {
          setMains(res.mains);
          setSubsByMain(res.subsByMain);
          setProductCounts(res.productCounts || {});
          setExpanded(new Set(res.mains));
        }
      })
    );
    return () => { cancelled = true; };
  }, [storeFileUrl]);

  useEffect(() => {
    let count = 0;
    for (const key of selectedSub) {
      count += productCounts[key] || 0;
    }
    setTotalSelected(count);
  }, [selectedSub, productCounts]);

  const filteredMains = mains.filter((m) => m.toLowerCase().includes(search.toLowerCase()));

  const allKeys = Object.entries(subsByMain).flatMap(([m, subs]) =>
    subs.map((s) => categoryKey(m, s))
  );
  const allSubsSelected = allKeys.length > 0 && allKeys.every((k) => selectedSub.includes(k));

  const handleSelectAll = () => {
    if (allSubsSelected) {
      onChange([], []);
    } else {
      onChange(mains, allKeys);
    }
  };

  const toggleMain = (main: string) => {
    const subs = subsByMain[main] || [];
    const keys = subs.map((s) => categoryKey(main, s));
    const allSel = keys.length > 0 && keys.every((k) => selectedSub.includes(k));
    if (allSel) {
      onChange(
        selectedMain.filter((m) => m !== main),
        selectedSub.filter((k) => !keys.includes(k))
      );
    } else {
      const newKeys = [...selectedSub];
      for (const k of keys) {
        if (!newKeys.includes(k)) newKeys.push(k);
      }
      onChange([...selectedMain.filter((m) => m !== main), main], newKeys);
    }
  };

  const toggleSub = (main: string, sub: string) => {
    const key = categoryKey(main, sub);
    if (selectedSub.includes(key)) {
      onChange(selectedMain, selectedSub.filter((k) => k !== key));
    } else {
      onChange(selectedMain, [...selectedSub, key]);
    }
  };

  const isMainAllSelected = (main: string) => {
    const subs = subsByMain[main] || [];
    const keys = subs.map((s) => categoryKey(main, s));
    return keys.length > 0 && keys.every((k) => selectedSub.includes(k));
  };

  const isMainSomeSelected = (main: string) => {
    const subs = subsByMain[main] || [];
    const keys = subs.map((s) => categoryKey(main, s));
    return keys.some((k) => selectedSub.includes(k)) && !isMainAllSelected(main);
  };

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const { getCategoryProducts } = await import("@/actions/categories");
      const res = await getCategoryProducts(storeFileUrl, selectedMain, selectedSub);
      if (res.success) {
        setPreviewProducts(res.products);
      }
    } catch {} finally {
      setPreviewLoading(false);
    }
  }, [storeFileUrl, selectedMain, selectedSub]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-400 py-4">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        جاري تحميل التصنيفات...
      </div>
    );
  }

  if (mains.length === 0) {
    return <p className="text-xs text-zinc-500 py-2">لا توجد تصنيفات في منتجات المتجر</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="text-xs h-7 px-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 shrink-0"
        >
          {allSubsSelected ? (
            <><X className="w-3 h-3 ml-1" /> إلغاء الكل</>
          ) : (
            <><CheckCheck className="w-3 h-3 ml-1" /> تحديد الكل</>
          )}
        </Button>
        <div className="relative flex-1">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-950/60 border-zinc-800 text-white text-xs pr-8 h-7"
            placeholder="بحث عن تصنيف..."
          />
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar border border-zinc-800 rounded-lg p-1.5">
        {filteredMains.map((main) => {
          const subs = subsByMain[main] || [];
          const isExpanded = expanded.has(main);
          const allSel = isMainAllSelected(main);
          const someSel = isMainSomeSelected(main);

          return (
            <div key={main}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/30 text-xs">
                <div
                  className="flex items-center gap-1.5 flex-1 cursor-pointer min-w-0"
                  onClick={() => {
                    const next = new Set(expanded);
                    if (isExpanded) next.delete(main); else next.add(main);
                    setExpanded(next);
                  }}
                >
                  {subs.length > 0 ? (
                    isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> : <ChevronLeft className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  ) : <span className="w-3.5 shrink-0" />}
                  <span className="text-zinc-300 font-medium truncate">{main}</span>
                  <span className="text-[10px] text-zinc-500 mr-auto shrink-0">{subs.length} أقسام</span>
                </div>
                {subs.length > 0 && (
                  <div onClick={() => toggleMain(main)} className="cursor-pointer shrink-0">
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      allSel ? "bg-violet-600 border-violet-600" : someSel ? "bg-violet-600/40 border-violet-500" : "border-zinc-600 hover:border-zinc-500"
                    )}>
                      {allSel && <CheckCheck className="w-3 h-3 text-white" />}
                      {someSel && <span className="w-2 h-0.5 bg-white rounded" />}
                    </div>
                  </div>
                )}
              </div>

              {isExpanded && subs.map((sub) => {
                const key = categoryKey(main, sub);
                const isSelected = selectedSub.includes(key);
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex items-center gap-2 px-7 py-1 rounded hover:bg-zinc-800/20 cursor-pointer",
                      isSelected && "bg-violet-500/5"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSub(main, sub)}
                      className="border-zinc-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                    />
                    <span className={cn(
                      "text-xs text-zinc-400 flex-1 truncate",
                      isSelected && "text-violet-400"
                    )}>
                      {sub}
                    </span>
                    <span className="text-[10px] text-zinc-600 shrink-0">
                      {productCounts[key] || 0}
                    </span>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>

      {selectedSub.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-zinc-500">
            المحدد: {selectedSub.length} {selectedSub.length > 2 ? "تصنيفات" : selectedSub.length > 1 ? "تصنيفين" : "تصنيف"}
            {" — "}
            <span className="text-violet-400 font-medium">{totalSelected} منتج</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPreview}
            disabled={previewLoading}
            className="text-[10px] text-violet-400 hover:text-violet-300 h-6 px-2"
          >
            {previewLoading ? (
              <Loader2 className="w-3 h-3 animate-spin ml-1" />
            ) : (
              <Eye className="w-3 h-3 ml-1" />
            )}
            معاينة
          </Button>
        </div>
      )}

      {previewProducts && (
        <Card className="border-zinc-800 bg-zinc-950/40">
          <CardContent className="p-2 max-h-40 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Table2 className="w-3 h-3" />
                {previewProducts.length} منتج
              </span>
              <button onClick={() => setPreviewProducts(null)} className="text-[10px] text-zinc-600 hover:text-zinc-400">إغلاق</button>
            </div>
            <table className="w-full text-right text-[10px]">
              <thead>
                <tr className="text-zinc-600 border-b border-zinc-800">
                  <th className="pb-1 pl-1">الاسم</th>
                  <th className="pb-1 pl-1">SKU</th>
                  <th className="pb-1 pl-1">التصنيف</th>
                  <th className="pb-1">التكلفة</th>
                  <th className="pb-1">البيع</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {previewProducts.map((p) => (
                  <tr key={p.rowIndex} className="border-b border-zinc-900/50">
                    <td className="py-0.5 pl-1 truncate max-w-[120px]">{p.name}</td>
                    <td className="py-0.5 pl-1">{p.sku || "—"}</td>
                    <td className="py-0.5 pl-1 truncate max-w-[80px]">{p.category}</td>
                    <td className="py-0.5">{p.costPrice || 0}</td>
                    <td className="py-0.5">{p.sellPrice || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
