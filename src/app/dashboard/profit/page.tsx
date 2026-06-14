"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { analyzeProfits, exportProfitExcel, ProfitItem } from "@/actions/profit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertTriangle, Play, BrainCircuit, Filter, Download, Search,
} from "lucide-react";
import Link from "next/link";

interface FileState {
  fileUrl: string;
  fileName: string;
  rowCount: number;
}

type SortKey = "madaProfit_desc" | "madaProfit_asc" | "visaProfit_desc" | "visaProfit_asc" | "tamaraProfit_desc" | "tamaraProfit_asc";
type FilterMode = "all" | "highest" | "lowest" | "positive" | "negative" | "below_threshold";

const PROFIT_ROUND = 2;

function fmt(n: number): string { return n.toFixed(PROFIT_ROUND); }

export default function ProfitPage() {
  const [storeFile, setStoreFile] = useState<FileState | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ProfitItem[]>([]);
  const [sort, setSort] = useState<SortKey>("madaProfit_desc");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [threshold, setThreshold] = useState("10");
  const [discountPercent, setDiscountPercent] = useState("5.8");

  useEffect(() => {
    const saved = sessionStorage.getItem("storeFile");
    if (saved) setStoreFile(JSON.parse(saved));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!storeFile) return;
    setLoading(true);
    setItems([]);
    try {
      const dp = parseFloat(discountPercent) || 0;
      const res = await analyzeProfits(storeFile.fileUrl, dp);
      if (res.success && res.items) {
        setItems(res.items);
        if (res.items.length === 0) toast.info("لا توجد منتجات بأسعار تكلفة وبيع صالحة للتحليل");
        else toast.success(`تم تحليل ${res.items.length} منتج`);
      } else {
        toast.error(res.error || "فشل التحليل");
      }
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }, [storeFile]);

  const handleExportExcel = useCallback(async () => {
    const res = await exportProfitExcel(items);
    if (res.buffer) {
      const a = document.createElement("a");
      a.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + res.buffer;
      a.download = `تحليل_الأرباح_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      toast.success("تم تصدير Excel");
    } else {
      toast.error(res.error || "فشل التصدير");
    }
  }, [items]);

  const handleExportCSV = useCallback(() => {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [
      "رمز المنتج", "اسم المنتج", "خيارات المنتج",
      "سعر التكلفة", "سعر البيع",
      "التكلفة بعد الضريبة", "سعر البيع بعد الضريبة",
      "صافي مدى", "ربح مدى",
      "صافي فيزا", "ربح فيزا",
      "صافي تمارا", "ربح تمارا",
    ];
    const rows = items.map((i) => [
      esc(i.sku), esc(i.productName), esc(i.options),
      esc(i.costPrice), esc(i.sellPrice),
      esc(i.breakdown.costAfterVAT), esc(i.breakdown.sellAfterVAT),
      esc(i.breakdown.madaNet), esc(i.breakdown.madaProfit),
      esc(i.breakdown.visaNet), esc(i.breakdown.visaProfit),
      esc(i.breakdown.tamaraNet), esc(i.breakdown.tamaraProfit),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `تحليل_الأرباح_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("تم تصدير CSV");
  }, [items]);

  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const avg = (key: (i: ProfitItem) => number) =>
      items.reduce((s, i) => s + key(i), 0) / items.length;
    const madaProfits = items.map((i) => i.breakdown.madaProfit);
    const visaProfits = items.map((i) => i.breakdown.visaProfit);
    const tamaraProfits = items.map((i) => i.breakdown.tamaraProfit);
    const highestIdx = madaProfits.indexOf(Math.max(...madaProfits));
    const lowestIdx = madaProfits.indexOf(Math.min(...madaProfits));
    return {
      total: items.length,
      avgMada: avg((i) => i.breakdown.madaProfit),
      avgVisa: avg((i) => i.breakdown.visaProfit),
      avgTamara: avg((i) => i.breakdown.tamaraProfit),
      highest: items[highestIdx],
      lowest: items[lowestIdx],
    };
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let result = [...items];
    switch (filter) {
      case "highest":
        result.sort((a, b) => b.breakdown.madaProfit - a.breakdown.madaProfit);
        result = result.slice(0, Math.max(10, Math.ceil(result.length * 0.1)));
        break;
      case "lowest":
        result.sort((a, b) => a.breakdown.madaProfit - b.breakdown.madaProfit);
        result = result.slice(0, Math.max(10, Math.ceil(result.length * 0.1)));
        break;
      case "positive":
        result = result.filter((i) => i.breakdown.madaProfit > 0 && i.breakdown.visaProfit > 0 && i.breakdown.tamaraProfit > 0);
        break;
      case "negative":
        result = result.filter((i) => i.breakdown.madaProfit <= 0 || i.breakdown.visaProfit <= 0 || i.breakdown.tamaraProfit <= 0);
        break;
      case "below_threshold": {
        const th = parseFloat(threshold) || 10;
        result = result.filter((i) => i.breakdown.madaProfit < th || i.breakdown.visaProfit < th || i.breakdown.tamaraProfit < th);
        break;
      }
    }
    switch (sort) {
      case "madaProfit_desc": result.sort((a, b) => b.breakdown.madaProfit - a.breakdown.madaProfit); break;
      case "madaProfit_asc": result.sort((a, b) => a.breakdown.madaProfit - b.breakdown.madaProfit); break;
      case "visaProfit_desc": result.sort((a, b) => b.breakdown.visaProfit - a.breakdown.visaProfit); break;
      case "visaProfit_asc": result.sort((a, b) => a.breakdown.visaProfit - b.breakdown.visaProfit); break;
      case "tamaraProfit_desc": result.sort((a, b) => b.breakdown.tamaraProfit - a.breakdown.tamaraProfit); break;
      case "tamaraProfit_asc": result.sort((a, b) => a.breakdown.tamaraProfit - b.breakdown.tamaraProfit); break;
    }
    return result;
  }, [items, filter, sort, threshold]);

  const isReady = !!storeFile;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">تحليل أرباح المنتجات</h1>
        <p className="text-zinc-400 text-xs mt-1">
          تحليل ربحية المنتجات بعد احتساب الضريبة ورسوم وسائل الدفع (مدى، فيزا، تمارا).
        </p>
      </div>

      {!isReady ? (
        <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
            <div>
              <h4 className="text-base font-bold text-white">ملف المتجر غير مرفوع!</h4>
              <p className="text-zinc-400 text-xs mt-1">يرجى رفع ملف منتجات المتجر أولاً</p>
            </div>
            <Link href="/dashboard/upload">
              <Button className="bg-linear-to-r from-violet-600 to-blue-600 text-white">الذهاب لرفع الملفات</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrainCircuit className="w-6 h-6 text-violet-400" />
                <div>
                  <p className="text-sm text-zinc-400">
                    ملف المتجر: <span className="text-white font-bold">{storeFile.fileName}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{storeFile.rowCount} منتج</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-zinc-400 whitespace-nowrap">كود خصم %</Label>
                  <Input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-20 h-8 text-xs bg-zinc-800 border-zinc-700 text-white text-center"
                    placeholder="5.8"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
                <Button onClick={handleAnalyze} disabled={loading} className="bg-linear-to-r from-violet-600 to-blue-600 text-white">
                  <Play className="w-4 h-4 ml-2" />
                  {loading ? "جاري التحليل..." : "تحليل الأرباح"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading && (
            <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <Search className="w-8 h-8 text-violet-400 animate-pulse" />
                <p className="text-zinc-400 text-sm">جاري تحليل أرباح المنتجات...</p>
              </CardContent>
            </Card>
          )}

          {items.length > 0 && (
            <div className="space-y-6 animate-slide-up">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="إجمالي المنتجات" value={stats.total} color="text-violet-400" />
                  <StatCard label="متوسط ربح مدى" value={fmt(stats.avgMada)} color="text-emerald-400" />
                  <StatCard label="متوسط ربح فيزا" value={fmt(stats.avgVisa)} color="text-blue-400" />
                  <StatCard label="متوسط ربح تمارا" value={fmt(stats.avgTamara)} color="text-amber-400" />
                  <StatCard label="أعلى ربح" value={`${fmt(stats.highest.breakdown.madaProfit)} - ${stats.highest.productName}`} color="text-emerald-400" small />
                  <StatCard label="أقل ربح" value={`${fmt(stats.lowest.breakdown.madaProfit)} - ${stats.lowest.productName}`} color="text-red-400" small />
                </div>
              )}

              {/* Controls */}
              <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Filter className="w-4 h-4 text-violet-400" />
                    <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>الكل ({items.length})</FilterBtn>
                    <FilterBtn active={filter === "highest"} onClick={() => setFilter("highest")}>الأعلى ربحية</FilterBtn>
                    <FilterBtn active={filter === "lowest"} onClick={() => setFilter("lowest")}>الأقل ربحية</FilterBtn>
                    <FilterBtn active={filter === "positive"} onClick={() => setFilter("positive")}>ربح موجب</FilterBtn>
                    <FilterBtn active={filter === "negative"} onClick={() => setFilter("negative")}>ربح سالب</FilterBtn>
                    <div className="flex items-center gap-1">
                      <FilterBtn active={filter === "below_threshold"} onClick={() => setFilter("below_threshold")}>أقل من</FilterBtn>
                      <Input
                        type="number"
                        value={threshold}
                        onChange={(e) => { setThreshold(e.target.value); setFilter("below_threshold"); }}
                        className="w-16 h-7 text-xs bg-zinc-800 border-zinc-700 text-white"
                        placeholder="10"
                      />
                      <span className="text-xs text-zinc-500">ريال</span>
                    </div>
                    <div className="mr-auto flex items-center gap-2">
                      <span className="text-xs text-zinc-500">ترتيب:</span>
                      <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
                        className="bg-zinc-800 text-white text-xs border border-zinc-700 rounded px-2 py-1">
                        <option value="madaProfit_desc">ربح مدى (الأعلى)</option>
                        <option value="madaProfit_asc">ربح مدى (الأقل)</option>
                        <option value="visaProfit_desc">ربح فيزا (الأعلى)</option>
                        <option value="visaProfit_asc">ربح فيزا (الأقل)</option>
                        <option value="tamaraProfit_desc">ربح تمارا (الأعلى)</option>
                        <option value="tamaraProfit_asc">ربح تمارا (الأقل)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleExportExcel} size="sm" variant="outline" className="border-zinc-700 text-zinc-300 text-xs">
                      <Download className="w-3 h-3 ml-1" /> تصدير Excel
                    </Button>
                    <Button onClick={handleExportCSV} size="sm" variant="outline" className="border-zinc-700 text-zinc-300 text-xs">
                      <Download className="w-3 h-3 ml-1" /> تصدير CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-[11px] text-zinc-500">رمز المنتج</TableHead>
                          <TableHead className="text-[11px] text-zinc-500">اسم المنتج + الخيارات</TableHead>
                          <TableHead className="text-[11px] text-zinc-500 text-center">سعر التكلفة</TableHead>
                          <TableHead className="text-[11px] text-zinc-500 text-center">سعر البيع</TableHead>
                          <TableHead className="text-[11px] text-zinc-500 text-center">ربح مدى</TableHead>
                          <TableHead className="text-[11px] text-zinc-500 text-center">ربح فيزا</TableHead>
                          <TableHead className="text-[11px] text-zinc-500 text-center">ربح تمارا</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSorted.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-zinc-500 text-xs py-8">
                              لا توجد نتائج تطابق الفلتر المحدد
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAndSorted.map((item, idx) => {
                            const displayName = item.options ? `${item.productName} - ${item.options}` : item.productName;
                            return (
                              <TableRow key={idx} className="border-zinc-800/50 hover:bg-zinc-800/20">
                                <TableCell className="text-[11px] font-mono">{item.sku || "-"}</TableCell>
                                <TableCell className="text-[11px] max-w-[250px] truncate" title={displayName}>
                                  {displayName}
                                </TableCell>
                                <TableCell className="text-[11px] text-center">{fmt(item.costPrice)}</TableCell>
                                <TableCell className="text-[11px] text-center">{fmt(item.sellPrice)}</TableCell>
                                <TableCell className={`text-[11px] text-center font-bold ${item.breakdown.madaProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {item.breakdown.madaProfit >= 0 ? "+" : ""}{fmt(item.breakdown.madaProfit)}
                                </TableCell>
                                <TableCell className={`text-[11px] text-center font-bold ${item.breakdown.visaProfit >= 0 ? "text-blue-400" : "text-red-400"}`}>
                                  {item.breakdown.visaProfit >= 0 ? "+" : ""}{fmt(item.breakdown.visaProfit)}
                                </TableCell>
                                <TableCell className={`text-[11px] text-center font-bold ${item.breakdown.tamaraProfit >= 0 ? "text-amber-400" : "text-red-400"}`}>
                                  {item.breakdown.tamaraProfit >= 0 ? "+" : ""}{fmt(item.breakdown.tamaraProfit)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
        active ? "bg-violet-600 border-violet-500 text-white" : "border-zinc-700 text-zinc-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, color, small }: { label: string; value: string | number; color: string; small?: boolean }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
      <CardContent className="p-3 text-center">
        <p className={`${small ? "text-xs" : "text-lg"} font-bold ${color} truncate`}>{value}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
