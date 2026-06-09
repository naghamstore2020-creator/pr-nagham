"use client";

import { useEffect, useState } from "react";
import { executeFullUpdateJob } from "@/actions/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PricingPreview from "@/components/pricing-preview";
import CategorySelect from "@/components/category-select";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Download,
  CheckCircle,
  RefreshCw,
  Info,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface FileState {
  fileUrl: string;
  fileName: string;
  rowCount: number;
}

export default function FullPricingPage() {
  const [storeFile, setStoreFile] = useState<FileState | null>(null);
  const [systemFile, setSystemFile] = useState<FileState | null>(null);

  const [profit, setProfit] = useState("0");
  const [excludedSkusText, setExcludedSkusText] = useState<string>("");
  const [selectedMain, setSelectedMain] = useState<string[]>([]);
  const [selectedSub, setSelectedSub] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const savedStore = sessionStorage.getItem("storeFile");
    const savedSystem = sessionStorage.getItem("systemFile");
    if (savedStore) setStoreFile(JSON.parse(savedStore));
    if (savedSystem) setSystemFile(JSON.parse(savedSystem));
  }, []);

  const handleStartProcessing = async () => {
    if (!storeFile || !systemFile) return;
    if (selectedMain.length === 0 && selectedSub.length === 0) {
      toast.error("يرجى اختيار تصنيف واحد على الأقل لتعديل أسعاره");
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const profitVal = parseFloat(profit) || 0;
      const excludedSkus = excludedSkusText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      console.log("Full pricing: profit =", profitVal, "selectedSubs =", selectedSub);

      const res = await executeFullUpdateJob(
        storeFile.fileUrl,
        systemFile.fileUrl,
        profitVal,
        excludedSkus,
        selectedSub
      );

      if (res.success && res.exportFileUrl) {
        setResults(res);
        toast.success(`تم تحديث التكلفة وأسعار البيع بنجاح! (الربح: ${profitVal} ريال)`);
      } else {
        toast.error(res.error || "فشل تحديث التسعير الكامل");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const hasCategorySelection = selectedMain.length > 0 || selectedSub.length > 0;

  if (!storeFile || !systemFile) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تسعير كامل</h1>
          <p className="text-xs mt-1">يقوم بتحديث أسعار التكلفة (من ملف النظام) وأسعار البيع (بناءً على نسبة الربح) في عملية واحدة.</p>
        </div>
        <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
            <div>
              <h4 className="text-base font-bold">ملفات البيانات غير متوفرة!</h4>
              <p className="text-xs mt-1">يرجى رفع منتجات المتجر وملف النظام (جرد أساسي) أولاً.</p>
            </div>
            <Link href="/dashboard/upload">
              <Button className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 font-medium text-xs">
                الذهاب لرفع الملفات
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">تسعير كامل</h1>
        <p className="text-xs mt-1">
يقوم بتحديث أسعار التكلفة (من ملف النظام (جرد أساسي)) وأسعار البيع (بناءً على نسبة الربح) في عملية واحدة.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
          <CardContent className="p-5 space-y-5">
            {/* Files info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800">
                <FileSpreadsheet className="w-5 h-5 text-violet-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs">منتجات المتجر</p>
                  <p className="text-xs font-medium">{storeFile.fileName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs">ملف النظام (جرد أساسي)</p>
                  <p className="text-xs font-medium">{systemFile.fileName}</p>
                </div>
              </div>
            </div>

            {/* Profit + Category side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profit" className="text-xs">نسبة الربح (ريال)</Label>
                <Input
                  id="profit"
                  type="number"
                  min="0"
                  step="0.5"
                  value={profit}
                  onChange={e => setProfit(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">استبعاد رموز تخزين (SKUs)</Label>
                <textarea
                  rows={2}
                  value={excludedSkusText}
                  onChange={(e) => setExcludedSkusText(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 text-xs p-2.5 placeholder-zinc-600 focus:outline-hidden focus:ring-1 focus:ring-violet-500 resize-none"
                  placeholder="أدخل كل رمز SKU في سطر منفصل..."
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-xs">التصنيفات المراد تعديلها</Label>
              <p className="text-[10px]">اختر التصنيفات التي تريد تعديل أسعارها. التصنيفات غير المحددة ستبقى كما هي.</p>
              {storeFile && (
                <CategorySelect
                  storeFileUrl={storeFile.fileUrl}
                  selectedMain={selectedMain}
                  selectedSub={selectedSub}
                  onChange={(main, sub) => { setSelectedMain(main); setSelectedSub(sub) }}
                />
              )}
            </div>

            {/* Action */}
            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <Button
                onClick={handleStartProcessing}
                disabled={loading || !hasCategorySelection}
                className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 font-bold text-xs px-6"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 ml-2" />
                    بدء التسعير الكامل
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px]">المنتجات المعالجة</p>
                    <h4 className="text-lg font-bold mt-1">{results.stats.totalProcessed}</h4>
                  </div>
                  <CheckCircle className="w-5 h-5 text-violet-400" />
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px]">تم تحديثها</p>
                    <h4 className="text-lg font-bold mt-1">{results.stats.totalUpdated}</h4>
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px]">لم تتغير</p>
                    <h4 className="text-lg font-bold mt-1">{results.stats.totalUnchanged}</h4>
                  </div>
                  <Info className="w-5 h-5" />
                </CardContent>
              </Card>
            </div>

            {results.details && results.details.length > 0 && (
              <PricingPreview details={results.details} showExcluded={true} mode="full" />
            )}

            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">الملف جاهز للتنزيل!</p>
                    <span className="text-xs">
                      تم تحديث التكلفة وأسعار البيع في ملف واحد.
                    </span>
                  </div>
                </div>
                <a href={results.exportFileUrl} download>
                  <Button className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs">
                    <Download className="w-4 h-4 ml-2" />
                    تنزيل الملف المحدث (.xlsx)
                  </Button>
                </a>
              </CardContent>
            </Card>

            <div className="flex gap-2.5 p-3 rounded-lg bg-zinc-900/20 border border-zinc-800 text-xs">
              <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>التسعير الكامل:</strong> ملف النظام هو المصدر الوحيد للأسعار. يتم مطابقة SKU، تحديث التكلفة من النظام، حساب سعر البيع، توحيد الألوان داخل كل مجموعة (سعة/مقاس)، ثم تعيين السعر الرئيسي = أقل سعر بين الخيارات.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
