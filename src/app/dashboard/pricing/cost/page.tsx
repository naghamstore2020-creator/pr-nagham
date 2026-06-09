"use client";

import { useEffect, useState } from "react";
import { executeCostPricingJob } from "@/actions/pricing";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PricingPreview from "@/components/pricing-preview";
import CategorySelect from "@/components/category-select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Download,
  CheckCircle,
  RefreshCw,
  Info,
  Coins,
} from "lucide-react";
import Link from "next/link";

interface FileState {
  fileUrl: string;
  fileName: string;
  rowCount: number;
}

export default function CostPricingPage() {
  const [storeFile, setStoreFile] = useState<FileState | null>(null);
  const [systemFile, setSystemFile] = useState<FileState | null>(null);

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
    try {
      const res = await executeCostPricingJob(storeFile.fileUrl, systemFile.fileUrl, selectedSub);

      if (res.success && res.exportFileUrl) {
        setResults(res);
        toast.success("تم تحديث أسعار التكلفة بنجاح في ملف المتجر!");
      } else {
        toast.error(res.error || "فشل تحديث أسعار التكلفة");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ غير متوقع أثناء معالجة الأسعار");
    } finally {
      setLoading(false);
    }
  };

  const isReady = storeFile && systemFile;
  const hasCategorySelection = selectedMain.length > 0 || selectedSub.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">تحديث أسعار التكلفة</h1>
        <p className="text-zinc-400 text-xs mt-1">
          يقوم هذا الخيار بتحديث حقل سعر التكلفة (Column L) في منتجات المتجر بناءً على أسعار التكلفة الجديدة الواردة من ملف النظام (جرد أساسي).
        </p>
      </div>

      {!isReady ? (
        <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
            <div>
              <h4 className="text-base font-bold text-white">ملفات البيانات غير متوفرة!</h4>
              <p className="text-zinc-400 text-xs mt-1">
                يرجى رفع منتجات المتجر وملف النظام (جرد أساسي) أولاً لتتمكن من تحديث أسعار التكلفة.
              </p>
            </div>
            <Link href="/dashboard/upload">
              <Button className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium text-xs">
                الذهاب لرفع الملفات
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* File summary card */}
          <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-white">الملفات المحددة لتحديث أسعار التكلفة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800">
                <FileSpreadsheet className="w-5 h-5 text-violet-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs text-zinc-500">منتجات المتجر</p>
                    <p className="text-xs font-bold text-white truncate">{storeFile.fileName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs text-zinc-500">ملف النظام (جرد أساسي)</p>
                    <p className="text-xs font-bold text-white truncate">{systemFile.fileName}</p>
                </div>
              </div>
            </CardContent>
            {!results && (
              <CardFooter className="border-t border-zinc-900 pt-4 flex flex-col gap-4">
                <div className="space-y-2 w-full">
                  <Label className="text-xs">التصنيفات المراد تعديلها</Label>
                  <p className="text-[10px] text-zinc-500">اختر التصنيفات التي تريد تحديث تكلفتها. التصنيفات غير المحددة ستبقى كما هي.</p>
                  <CategorySelect
                    storeFileUrl={storeFile.fileUrl}
                    selectedMain={selectedMain}
                    selectedSub={selectedSub}
                    onChange={(main, sub) => { setSelectedMain(main); setSelectedSub(sub); }}
                  />
                </div>
                <div className="flex justify-end">
                <Button
                  onClick={handleStartProcessing}
                  disabled={loading || !hasCategorySelection}
                  className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-xs px-6 py-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      جاري تحديث أسعار التكلفة...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 ml-2" />
                      بدء تحديث أسعار التكلفة
                    </>
                  )}
                </Button>
                </div>
              </CardFooter>
            )}
          </Card>

          {/* Results dashboard after execution */}
          {results && (
            <div className="space-y-6 animate-slide-up">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-zinc-500 text-[10px]">المنتجات المعالجة</p>
                      <h4 className="text-lg font-bold text-white mt-1">{results.stats.totalProcessed}</h4>
                    </div>
                    <CheckCircle className="w-5 h-5 text-violet-400" />
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-zinc-500 text-[10px]">أسعار تكلفة تم تحديثها</p>
                      <h4 className="text-lg font-bold text-white mt-1">{results.stats.totalUpdated}</h4>
                    </div>
                    <Coins className="w-5 h-5 text-emerald-400" />
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-zinc-500 text-[10px]">أسعار تكلفة لم تتغير</p>
                      <h4 className="text-lg font-bold text-white mt-1">{results.stats.totalUnchanged}</h4>
                    </div>
                    <Info className="w-5 h-5 text-zinc-400" />
                  </CardContent>
                </Card>
              </div>

              {/* Preview Table */}
              {results.details && results.details.length > 0 && (
                <PricingPreview details={results.details} showExcluded={true} mode="cost" />
              )}

              {/* Action Banner */}
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">ملف أسعار التكلفة جاهز للتنزيل!</p>
                      <span className="text-xs text-zinc-400">
                        تم كتابة أسعار التكلفة في العمود L بنجاح.
                      </span>
                    </div>
                  </div>
                  <a href={results.exportFileUrl} download>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                      <Download className="w-4 h-4 ml-2" />
                      تنزيل ملف الأسعار المحدث (.xlsx)
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Rules description alert */}
              <div className="flex gap-2.5 p-3 rounded-lg bg-zinc-900/20 border border-zinc-800 text-xs text-zinc-400">
                <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>ملاحظة حول تحديث أسعار التكلفة:</strong> يطابق هذا الإجراء المنتجات عبر رمز SKU ويحدث سعر التكلفة الفعلي. في حال عدم وجود المنتج في ملف النظام (جرد أساسي) أو عدم امتلاكه لرمز SKU، يحتفظ المنتج بسعر تكلفته الحالي دون تعديل لضمان استقرار الأسعار في متجرك.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
