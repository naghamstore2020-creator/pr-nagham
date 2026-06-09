"use client";

import { useEffect, useState } from "react";
import { executeInventoryJob } from "@/actions/inventory";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InventoryPreview from "@/components/inventory-preview";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Download,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  XCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import Link from "next/link";

interface FileState {
  fileUrl: string;
  fileName: string;
  rowCount: number;
}

export default function FullInventoryPage() {
  const [storeFile, setStoreFile] = useState<FileState | null>(null);
  const [systemFile, setSystemFile] = useState<FileState | null>(null);
  const [shelfFile, setShelfFile] = useState<FileState | null>(null);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const savedStore = sessionStorage.getItem("storeFile");
    const savedSystem = sessionStorage.getItem("systemFile");
    const savedShelf = sessionStorage.getItem("shelfFile");
    if (savedStore) setStoreFile(JSON.parse(savedStore));
    if (savedSystem) setSystemFile(JSON.parse(savedSystem));
    if (savedShelf) setShelfFile(JSON.parse(savedShelf));
  }, []);

  const handleStartProcessing = async () => {
    const sourceFile = shelfFile || storeFile;
    if (!sourceFile || !systemFile) return;

    setLoading(true);
    try {
      const res = await executeInventoryJob(
        sourceFile.fileUrl,
        systemFile.fileUrl,
        "full",
        shelfFile ? shelfFile.fileUrl : undefined
      );

      if (res.success && res.exportFileUrl) {
        setResults(res);
        toast.success("تم إتمام معالجة الجرد الكامل بنجاح وتحديث كافة الكميات!");
      } else {
        toast.error(res.error || "فشل معالجة الجرد الكامل");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ غير متوقع أثناء معالجة الجرد");
    } finally {
      setLoading(false);
    }
  };

  const isReady = (storeFile || shelfFile) && systemFile;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">معالجة الجرد الكامل</h1>
        <p className="text-zinc-400 text-xs mt-1">
          يقوم هذا الخيار بتحديث كافة كميات المنتجات (زيادة أو نقصان) بناءً على الكميات الحقيقية المتوفرة في ملف النظام.
        </p>
      </div>

      {!isReady ? (
        <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
            <div>
              <h4 className="text-base font-bold text-white">ملفات البيانات غير متوفرة!</h4>
              <p className="text-zinc-400 text-xs mt-1">
                يرجى رفع منتجات المتجر أو ملف الكميات من المتجر وملف النظام (جرد أساسي) أولاً لتتمكن من تشغيل عملية الجرد الكامل.
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
              <CardTitle className="text-sm font-bold text-white">الملفات المحددة للجرد</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shelfFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">ملف الكميات من المتجر</p>
                    <p className="text-xs font-bold text-white truncate">{shelfFile.fileName}</p>
                  </div>
                </div>
              ) : storeFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800">
                  <FileSpreadsheet className="w-5 h-5 text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">منتجات المتجر</p>
                    <p className="text-xs font-bold text-white truncate">{storeFile.fileName}</p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/40 border border-zinc-800">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                    <p className="text-xs text-zinc-500">ملف النظام (جرد أساسي)</p>
                    <p className="text-xs font-bold text-white truncate">{systemFile.fileName}</p>
                </div>
              </div>
            </CardContent>
            {!results && (
              <CardFooter className="border-t border-zinc-900 pt-4 flex justify-end">
                <Button
                  onClick={handleStartProcessing}
                  disabled={loading}
                  className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-xs px-6 py-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                      جاري معالجة الجرد الكامل...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 ml-2" />
                      بدء معالجة الجرد الكامل
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Results dashboard after execution */}
          {results && (
            <div className="space-y-6 animate-slide-up">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <p className="text-zinc-500 text-[10px]">منتجات انخفضت كميتها</p>
                      <h4 className="text-lg font-bold text-white mt-1">{results.stats.totalDecreased}</h4>
                    </div>
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-zinc-500 text-[10px]">منتجات زادت كميتها</p>
                      <h4 className="text-lg font-bold text-white mt-1">{results.stats.totalUpdated}</h4>
                    </div>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-zinc-500 text-[10px]">منتجات مفقودة صفرت</p>
                      <h4 className="text-lg font-bold text-white mt-1">{results.stats.totalZeroed}</h4>
                    </div>
                    <XCircle className="w-5 h-5 text-zinc-400" />
                  </CardContent>
                </Card>
              </div>

              {/* Preview Table */}
              {results.details && results.details.length > 0 && (
                <InventoryPreview details={results.details} mode="full" />
              )}

              {/* Action Banner */}
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">الملف المحدث جاهز للتنزيل!</p>
                      <span className="text-xs text-zinc-400">
                        تمت المزامنة الكاملة للكميات مع خوادم النظام.
                      </span>
                    </div>
                  </div>
                  <a href={results.exportFileUrl} download>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                      <Download className="w-4 h-4 ml-2" />
                      تنزيل ملف الجرد الكامل المحدث (.xlsx)
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Rules description alert */}
              <div className="flex gap-2.5 p-3 rounded-lg bg-zinc-900/20 border border-zinc-800 text-xs text-zinc-400">
                <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>ملاحظة حول الجرد الكامل:</strong> على عكس الجرد اليومي، يُحدث الجرد الكامل كافة الحقول الخاصة بالكمية في متجرك لتطابق المخازن بدقة، بما يشمل أي كميات متزايدة. المنتجات التي لا تحتوي على SKU أو غير موجودة في النظام يتم تصفيرها بالكامل لضمان تطابق المخزون الفعلي 100%.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
