"use client";

import { useState, useEffect } from "react";
import { uploadExcelFile } from "@/actions/upload";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  BrainCircuit,
  Settings,
  Trash2,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface FileState {
  fileUrl: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
}

export default function UploadPage() {
  const [storeFile, setStoreFile] = useState<FileState | null>(null);
  const [systemFile, setSystemFile] = useState<FileState | null>(null);
  const [shelfFile, setShelfFile] = useState<FileState | null>(null);
  
  const [storeUploading, setStoreUploading] = useState(false);
  const [systemUploading, setSystemUploading] = useState(false);
  const [shelfUploading, setShelfUploading] = useState(false);

  // Load saved state from sessionStorage
  useEffect(() => {
    const savedStore = sessionStorage.getItem("storeFile");
    const savedSystem = sessionStorage.getItem("systemFile");
    const savedShelf = sessionStorage.getItem("shelfFile");
    if (savedStore) setStoreFile(JSON.parse(savedStore));
    if (savedSystem) setSystemFile(JSON.parse(savedSystem));
    if (savedShelf) setShelfFile(JSON.parse(savedShelf));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "store" | "system" | "shelf") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "store") setStoreUploading(true);
    else if (type === "shelf") setShelfUploading(true);
    else setSystemUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadExcelFile(formData, type);

      if (result.success && result.fileUrl) {
        const fileState: FileState = {
          fileUrl: result.fileUrl,
          fileName: result.fileName || file.name,
          rowCount: result.rowCount || 0,
          columnCount: result.columnCount || 0,
        };

        if (type === "store") {
          setStoreFile(fileState);
          sessionStorage.setItem("storeFile", JSON.stringify(fileState));
          toast.success("تم رفع منتجات المتجر بنجاح والتحقق من الهيكل!");
        } else if (type === "shelf") {
          setShelfFile(fileState);
          sessionStorage.setItem("shelfFile", JSON.stringify(fileState));
          toast.success("تم رفع ملف الكميات من المتجر بنجاح والتحقق من الهيكل!");
        } else {
          setSystemFile(fileState);
          sessionStorage.setItem("systemFile", JSON.stringify(fileState));
          toast.success("تم رفع ملف النظام (جرد أساسي) بنجاح والتحقق من الهيكل!");
        }
      } else {
        toast.error(result.error || "فشل رفع الملف والتحقق منه");
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع أثناء الرفع");
    } finally {
      if (type === "store") setStoreUploading(false);
      else if (type === "shelf") setShelfUploading(false);
      else setSystemUploading(false);
    }
  };

  const clearFile = (type: "store" | "system" | "shelf") => {
    if (type === "store") {
      setStoreFile(null);
      sessionStorage.removeItem("storeFile");
    } else if (type === "shelf") {
      setShelfFile(null);
      sessionStorage.removeItem("shelfFile");
    } else {
      setSystemFile(null);
      sessionStorage.removeItem("systemFile");
    }
    toast.info("تم إزالة الملف");
  };

  const handleDemoFill = () => {
    const demoStore: FileState = {
      fileUrl: "/uploads/demo_store.xlsx",
      fileName: "ملف_المتجر_التجريبي.xlsx",
      rowCount: 10,
      columnCount: 42,
    };
    const demoSystem: FileState = {
      fileUrl: "/uploads/demo_system.xlsx",
      fileName: "ملف_النظام_التجريبي.xlsx",
      rowCount: 10,
      columnCount: 4,
    };
    const demoShelf: FileState = {
      fileUrl: "/uploads/demo_shelf.xlsx",
      fileName: "ملف_الرف_التجريبي.xlsx",
      rowCount: 10,
      columnCount: 4,
    };

    setStoreFile(demoStore);
    setSystemFile(demoSystem);
    setShelfFile(demoShelf);
    sessionStorage.setItem("storeFile", JSON.stringify(demoStore));
    sessionStorage.setItem("systemFile", JSON.stringify(demoSystem));
    sessionStorage.setItem("shelfFile", JSON.stringify(demoShelf));
    toast.success("تم تعبئة الملفات التجريبية لوضع العرض (Demo)!");
  };

  const isBothUploaded = (storeFile || shelfFile) && systemFile;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">رفع ملفات البيانات</h1>
          <p className="text-zinc-400 text-xs mt-1">
            قم برفع ملفات Excel الخاصة بالمتجر ونظام المبيعات للبدء في عمليات الجرد أو التسعير.
          </p>
        </div>

        <Button
          onClick={handleDemoFill}
          variant="outline"
          className="border-violet-500/30 text-violet-400 hover:text-white hover:bg-violet-600/10 text-xs"
        >
          تعبئة بيانات تجريبية (Demo)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Store File Card */}
        <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold text-white">1. منتجات المتجر (Store Export)</CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-1">
                  الملف المصدر من سلة أو متجرك الإلكتروني (XLSX).
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-zinc-800 text-zinc-400 text-xs">
                مطلوب
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!storeFile ? (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-800 hover:border-violet-500/50 rounded-xl cursor-pointer bg-zinc-950/20 hover:bg-zinc-950/40 transition-all duration-300 group">
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                  {storeUploading ? (
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                  )}
                  <p className="text-sm font-semibold text-white">اضغط للرفع أو اسحب الملف هنا</p>
                  <p className="text-xs text-zinc-500">XLSX فقط (بحد أقصى 50 ميجابايت / 100,000 صف)</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => handleUpload(e, "store")}
                  disabled={storeUploading}
                />
              </label>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white max-w-[200px] truncate" title={storeFile.fileName}>
                      {storeFile.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                      <span>{storeFile.rowCount} صف</span>
                      <span>•</span>
                      <span>{storeFile.columnCount} عمود</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => clearFile("store")}
                  variant="outline"
                  size="icon"
                  className="border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-[11px] text-zinc-500 border-t border-zinc-900 pt-4 mt-auto">
            مواصفات الهيكل: يجب أن يحتوي على أعمدة (B: نوع المنتج، C: الاسم، D: التصنيف، G: الكمية، H: سعر البيع، K: SKU، L: سعر التكلفة)
          </CardFooter>
        </Card>

        {/* System File Card */}
        <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold text-white">2. ملف النظام (جرد أساسي)</CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-1">
                  الملف المصدر من الكاشير أو المخازن أو نظام المبيعات (XLSX).
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-zinc-800 text-zinc-400 text-xs">
                مطلوب
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!systemFile ? (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-800 hover:border-violet-500/50 rounded-xl cursor-pointer bg-zinc-950/20 hover:bg-zinc-950/40 transition-all duration-300 group">
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                  {systemUploading ? (
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                  )}
                  <p className="text-sm font-semibold text-white">اضغط للرفع أو اسحب الملف هنا</p>
                  <p className="text-xs text-zinc-500">XLSX فقط (بحد أقصى 50 ميجابايت / 100,000 صف)</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => handleUpload(e, "system")}
                  disabled={systemUploading}
                />
              </label>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white max-w-[200px] truncate" title={systemFile.fileName}>
                      {systemFile.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                      <span>{systemFile.rowCount} صف</span>
                      <span>•</span>
                      <span>{systemFile.columnCount} عمود</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => clearFile("system")}
                  variant="outline"
                  size="icon"
                  className="border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-[11px] text-zinc-500 border-t border-zinc-900 pt-4 mt-auto">
            مواصفات الهيكل: يجب أن يحتوي على أعمدة (A: SKU، B: اسم المنتج، C: الكمية، D: سعر التكلفة)
          </CardFooter>
        </Card>

        {/* Shelf File Card */}
        <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-col justify-between">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-bold text-white">3. ملف الكميات من المتجر (Shelf Qty)</CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-1">
                  ملف يحتوي كميات المنتجات الفعلية من الرفوف (XLSX).
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                اختياري (للجرد)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!shelfFile ? (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-xl cursor-pointer bg-zinc-950/20 hover:bg-zinc-950/40 transition-all duration-300 group">
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                  {shelfUploading ? (
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                  ) : (
                    <Upload className="w-10 h-10 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                  )}
                  <p className="text-sm font-semibold text-white">اضغط للرفع أو اسحب الملف هنا</p>
                  <p className="text-xs text-zinc-500">XLSX فقط (بحد أقصى 50 ميجابايت / 100,000 صف)</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => handleUpload(e, "shelf")}
                  disabled={shelfUploading}
                />
              </label>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white max-w-[200px] truncate" title={shelfFile.fileName}>
                      {shelfFile.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                      <span>{shelfFile.rowCount} صف</span>
                      <span>•</span>
                      <span>{shelfFile.columnCount} عمود</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => clearFile("shelf")}
                  variant="outline"
                  size="icon"
                  className="border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-[11px] text-zinc-500 border-t border-zinc-900 pt-4 mt-auto">
            مواصفات الهيكل: يجب أن يحتوي على أعمدة (B: نوع المنتج، C: اسم المنتج، D: رمز المنتج، F: الكمية)
          </CardFooter>
        </Card>
      </div>

      {/* Action shortcuts after uploading */}
      {isBothUploaded && (
        <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md animate-slide-up">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-base font-bold text-white">كل الملفات جاهزة الآن!</h4>
                  <p className="text-zinc-400 text-xs">
                    {shelfFile ? "تم رفع منتجات المتجر وملف النظام (جرد أساسي) وملف الكميات من المتجر بنجاح." : "تم رفع منتجات المتجر وملف النظام (جرد أساسي) بنجاح."} اختر إحدى العمليات للبدء:
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                <Link href="/dashboard/inventory/daily">
                  <Button className="bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 text-xs">
                    <ArrowLeftRight className="w-4 h-4 ml-2" />
                    الجرد اليومي
                  </Button>
                </Link>
                <Link href="/dashboard/inventory/full">
                  <Button className="bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 text-xs">
                    <ArrowLeftRight className="w-4 h-4 ml-2" />
                    الجرد الكامل
                  </Button>
                </Link>
                <Link href="/dashboard/pricing/sell">
                  <Button className="bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 text-xs">
                    <TrendingUp className="w-4 h-4 ml-2" />
                    تحديث أسعار البيع
                  </Button>
                </Link>
                <Link href="/dashboard/ai-matching">
                  <Button className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs">
                    <BrainCircuit className="w-4 h-4 ml-2" />
                    مطابقة الأسماء
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
