"use client";

import { useEffect, useState, useMemo } from "react";
import { executeMatchingJob, saveAcceptedMatch } from "@/actions/ai-matching";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  AlertTriangle, Play, CheckCircle, BrainCircuit, Check, X, Filter, Search,
} from "lucide-react";
import Link from "next/link";
import { MatchResult } from "@/types/ai";

interface FileState {
  fileUrl: string;
  fileName: string;
  rowCount: number;
}

type FilterMode = "all" | "auto_matched" | "manual_review" | "rejected" | "accepted";
type SortMode = "confidence_desc" | "confidence_asc" | "store_name" | "system_name" | "store_sku";

const statusConfig: Record<string, { label: string; color: string }> = {
  auto_matched: { label: "مطابق تلقائياً", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  manual_review: { label: "يحتاج مراجعة", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  rejected: { label: "غير متطابق", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  accepted: { label: "مقبول", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

export default function AiMatchingPage() {
  const [storeFile, setStoreFile] = useState<FileState | null>(null);
  const [systemFile, setSystemFile] = useState<FileState | null>(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("confidence_desc");
  const [stats, setStats] = useState<{ total: number; autoMatched: number; manualReview: number; rejected: number } | null>(null);

  useEffect(() => {
    const savedStore = sessionStorage.getItem("storeFile");
    const savedSystem = sessionStorage.getItem("systemFile");
    if (savedStore) setStoreFile(JSON.parse(savedStore));
    if (savedSystem) setSystemFile(JSON.parse(savedSystem));
  }, []);

  const handleStartMatching = async () => {
    if (!storeFile || !systemFile) return;
    setLoading(true);
    setMatches([]);
    setStats(null);
    try {
      const res = await executeMatchingJob(storeFile.fileUrl, systemFile.fileUrl);
      if (res.success && res.matches) {
        setMatches(res.matches);
        setStats(res.stats || null);
        if (res.matches.length === 0) {
          toast.info("لا توجد نتائج مطابقة. تأكد من أن ملفات المتجر والنظام تحتوي على رموز SKU متطابقة.");
        } else {
          toast.success(`تم إتمام مطابقة الأسماء بنجاح!`);
        }
      } else {
        toast.error(res.error || "فشلت عملية المطابقة");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (storeSku: string, systemSku: string, systemName: string, storeName: string) => {
    setMatches((prev) => prev.map((m) =>
      m.storeSku === storeSku && m.systemSku === systemSku ? { ...m, status: "accepted" as const } : m
    ));
    const res = await saveAcceptedMatch(storeSku, systemSku, systemName, storeName);
    if (res.success) toast.success("تم حفظ المطابقة في قاعدة البيانات");
    else toast.error(res.error || "فشل حفظ المطابقة");
  };

  const handleReject = async (storeSku: string, systemSku: string, systemName: string, storeName: string) => {
    setMatches((prev) => prev.map((m) =>
      m.storeSku === storeSku && m.systemSku === systemSku ? { ...m, status: "rejected" as const } : m
    ));
    const res = await saveAcceptedMatch(storeSku, systemSku, systemName, storeName, "REJECTED");
    if (res.success) toast.success("تم رفض المطابقة");
    else toast.error(res.error || "فشل رفض المطابقة");
  };

  const handleAcceptAll = async () => {
    const toAccept = matches.filter((m) => m.status === "manual_review");
    setMatches((prev) => prev.map((m) => (m.status === "manual_review" ? { ...m, status: "accepted" as const } : m)));
    const results = await Promise.allSettled(
      toAccept.map((m) => saveAcceptedMatch(m.storeSku, m.systemSku, m.systemName, m.storeName))
    );
    const saved = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    toast.success(`تم قبول ${toAccept.length} مطابقة وحفظ ${saved} في قاعدة البيانات`);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...matches];
    if (filter !== "all") {
      result = result.filter((m) => m.status === filter);
    }
    switch (sort) {
      case "confidence_desc": result.sort((a, b) => b.confidence - a.confidence); break;
      case "confidence_asc": result.sort((a, b) => a.confidence - b.confidence); break;
      case "store_name": result.sort((a, b) => a.storeName.localeCompare(b.storeName)); break;
      case "system_name": result.sort((a, b) => a.systemName.localeCompare(b.systemName)); break;
      case "store_sku": result.sort((a, b) => (a.storeSku || "").localeCompare(b.storeSku || "")); break;
    }
    return result;
  }, [matches, filter, sort]);

  const isReady = storeFile && systemFile;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">مطابقة الأسماء</h1>
        <p className="text-zinc-400 text-xs mt-1">
          مطابقة أسماء منتجات المتجر مع المنتجات المتوفرة في ملف النظام (جرد أساسي) عن طريق رمز التخزين (SKU).
        </p>
      </div>

      {!isReady ? (
        <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
            <div>
              <h4 className="text-base font-bold text-white">ملفات البيانات غير متوفرة!</h4>
              <p className="text-zinc-400 text-xs mt-1">يرجى رفع منتجات المتجر وملف النظام أولاً</p>
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
                <FileSummaryIcon />
                <div>
                  <p className="text-sm text-zinc-400">
                    ملف المتجر: <span className="text-white font-bold">{storeFile.fileName}</span>
                    {" | "}ملف النظام: <span className="text-white font-bold">{systemFile.fileName}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {storeFile.rowCount} منتج في المتجر | {systemFile.rowCount} منتج في النظام
                    {stats && ` | ${stats.total} منتج بحاجة لمطابقة`}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleStartMatching}
                disabled={loading}
                className="bg-linear-to-r from-violet-600 to-blue-600 text-white"
              >
                <Play className="w-4 h-4 ml-2" />
                {loading ? "جاري المطابقة..." : "بدء مطابقة الأسماء"}
              </Button>
            </CardContent>
          </Card>

          {loading && (
            <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
              <CardContent className="p-8 flex flex-col items-center gap-4">
                <Search className="w-8 h-8 text-violet-400 animate-pulse" />
                <p className="text-zinc-400 text-sm">جاري مطابقة الأسماء محلياً...</p>
              </CardContent>
            </Card>
          )}

          {matches.length > 0 && (
            <div className="space-y-6 animate-slide-up">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-4 gap-3">
                  <StatCard label="الإجمالي" value={stats.total} color="text-violet-400" />
                  <StatCard label="مطابق تلقائياً" value={stats.autoMatched} color="text-emerald-400" />
                  <StatCard label="يحتاج مراجعة" value={stats.manualReview} color="text-amber-400" />
                  <StatCard label="غير متطابق" value={stats.rejected} color="text-red-400" />
                </div>
              )}

              {/* Controls */}
              <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-zinc-300">تصفية:</span>
                      <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>الكل ({matches.length})</FilterBtn>
                      <FilterBtn active={filter === "auto_matched"} onClick={() => setFilter("auto_matched")}>مطابق تلقائياً ({matches.filter(m => m.status === "auto_matched").length})</FilterBtn>
                      <FilterBtn active={filter === "manual_review"} onClick={() => setFilter("manual_review")}>يحتاج مراجعة ({matches.filter(m => m.status === "manual_review").length})</FilterBtn>
                      <FilterBtn active={filter === "rejected"} onClick={() => setFilter("rejected")}>غير متطابق ({matches.filter(m => m.status === "rejected").length})</FilterBtn>
                      <FilterBtn active={filter === "accepted"} onClick={() => setFilter("accepted")}>مقبول ({matches.filter(m => m.status === "accepted").length})</FilterBtn>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">ترتيب:</span>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortMode)}
                        className="bg-zinc-800 text-white text-xs border border-zinc-700 rounded px-2 py-1"
                      >
                        <option value="confidence_desc">نسبة المطابقة (الأعلى)</option>
                        <option value="confidence_asc">نسبة المطابقة (الأقل)</option>
                        <option value="store_name">اسم المتجر</option>
                        <option value="system_name">اسم النظام</option>
                        <option value="store_sku">رمز المنتج</option>
                      </select>
                    </div>
                  </div>
                  {matches.filter(m => m.status === "manual_review").length > 0 && (
                    <div className="flex gap-2">
                      <Button onClick={handleAcceptAll} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs">
                        <Check className="w-3 h-3 ml-1" /> قبول جميع المعلقات
                      </Button>
                    </div>
                  )}
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
                          <TableHead className="text-[11px] text-zinc-500">اسم المنتج في المتجر</TableHead>
                          <TableHead className="text-[11px] text-zinc-500">خيارات المنتج</TableHead>
                          <TableHead className="text-[11px] text-zinc-500">اسم المنتج في النظام</TableHead>
                          <TableHead className="text-[11px] text-zinc-500 text-center">نسبة التطابق</TableHead>
                          <TableHead className="text-[11px] text-zinc-500 text-center">الحالة</TableHead>
                          <TableHead className="text-[11px] text-zinc-500 text-center">الإجراءات</TableHead>
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
                          filteredAndSorted.map((m, idx) => (
                            <TableRow key={idx} className="border-zinc-800/50 hover:bg-zinc-800/20">
                              <TableCell className="text-[11px] font-mono">{m.storeSku || m.systemSku || "-"}</TableCell>
                              <TableCell className="text-[11px] max-w-[180px] truncate" title={m.storeName}>{m.storeName}</TableCell>
                              <TableCell className="text-[11px] max-w-[120px] truncate text-zinc-400" title={m.storeOptions}>{m.storeOptions || "-"}</TableCell>
                              <TableCell className="text-[11px] max-w-[180px] truncate" title={m.systemName}>{m.systemName || "—"}</TableCell>
                              <TableCell className="text-[11px] text-center font-bold">
                                <span className={!m.systemName ? "text-red-400" : m.confidence >= 95 ? "text-emerald-400" : m.confidence >= 80 ? "text-amber-400" : "text-red-400"}>
                                  {!m.systemName ? "—" : `${m.confidence}%`}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusConfig[m.status]?.color || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"} variant="outline">
                                  {statusConfig[m.status]?.label || m.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex gap-1 justify-center items-center">
                                  <Button size="icon" variant="outline" className={`h-7 w-7 ${m.status === "accepted" ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" : "border-emerald-700 text-emerald-400 hover:bg-emerald-950/30"}`} onClick={() => handleAccept(m.storeSku, m.systemSku, m.systemName, m.storeName)} title="قبول">
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button size="icon" variant="outline" className={`h-7 w-7 ${m.status === "rejected" ? "bg-red-500/20 border-red-500 text-red-300" : "border-red-700 text-red-400 hover:bg-red-950/30"}`} onClick={() => handleReject(m.storeSku, m.systemSku, m.systemName, m.storeName)} title="رفض">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
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

function FileSummaryIcon() { return <BrainCircuit className="w-6 h-6 text-violet-400" />; }

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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
      <CardContent className="p-4 text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-[11px] text-zinc-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
