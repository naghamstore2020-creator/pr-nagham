"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { getRecentOperations, getDashboardStats, RecentOperation } from "@/actions/jobs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Activity,
  UploadCloud,
  CheckCircle,
  Database,
  BrainCircuit,
  Sparkles,
  Terminal,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ totalOperations: 0, totalProducts: 0, totalFiles: 0, successRate: 0, aiMatchingCount: 0, lastOperation: "—" });
  const [operations, setOperations] = useState<RecentOperation[]>([]);

  const isDemo = session?.user?.role === "DEMO";

  const loadData = useCallback(async () => {
    const [ops, statsData] = await Promise.all([
      getRecentOperations(),
      getDashboardStats(),
    ]);

    setOperations(ops);
    setStats({
      totalOperations: statsData.totalOperations,
      totalProducts: statsData.totalProducts,
      totalFiles: statsData.totalFiles,
      successRate: statsData.successRate,
      aiMatchingCount: statsData.aiMatchingCount ?? 0,
      lastOperation: statsData.latestDate
        ? new Date(statsData.latestDate).toLocaleString("ar-SA")
        : "—",
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statCards = [
    {
      title: "إجمالي العمليات",
      value: stats.totalOperations,
      description: "عمليات جرد وتسعير منفذة",
      icon: Activity,
      color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "المنتجات المؤرشفة",
      value: stats.totalProducts,
      description: "منتجات تمت معالجتها",
      icon: Database,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "الملفات المرفوعة",
      value: stats.totalFiles,
      description: "ملفات Excel مدخلة للنظام",
      icon: UploadCloud,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "نسبة نجاح المعالجة",
      value: `${stats.successRate}%`,
      description: "عمليات بدون أخطاء هيكلية",
      icon: CheckCircle,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
    {
      title: "عمليات المطابقة",
      value: stats.aiMatchingCount,
      description: "مطابقات أسماء منفذة",
      icon: BrainCircuit,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "آخر عملية معالجة",
      value: stats.lastOperation,
      description: "توقيت آخر نشاط على لوحة التحكم",
      icon: Clock,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-900/40 via-zinc-950 to-zinc-950 border border-zinc-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-56 h-56 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">مرحباً بك في نظام الإدارة الذكي</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            مرحباً، {session?.user?.name || "مستخدم تجريبي"} 👋
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            أداة التحكم المركزية للمطابقة، الجرد، والتسعير الذكي. ابدأ برفع منتجات المتجر وملف النظام (جرد أساسي) لمزامنة المخزون وتعديل الأسعار فوراً.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className="border-zinc-800 bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-900/60 transition-all duration-300 group"
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-zinc-400 text-xs font-medium">{card.title}</p>
                  <h3 className="text-2xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform duration-300 origin-right">
                    {card.value}
                  </h3>
                  <p className="text-[10px] text-zinc-500">{card.description}</p>
                </div>
                <div className={`p-3.5 rounded-xl border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grid: Recent operations & Console */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Operations */}
        <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">آخر العمليات</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              قائمة بالعمليات الأخيرة المنفذة على النظام وحالتها الحالية
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 pb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold">
                    <th className="pb-3 pr-4">العملية</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">التاريخ</th>
                    <th className="pb-3">المستخدم</th>
                    <th className="pb-3 pl-4 text-left">المدة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300">
                  {operations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-zinc-500 text-sm">
                        لا توجد عمليات مسجّلة بعد
                      </td>
                    </tr>
                  ) : (
                    operations.map((op) => (
                    <tr key={op.id} className="hover:bg-zinc-900/20 transition-colors group">
                      <td className="py-3.5 pr-4 font-medium text-white">{op.type}</td>
                      <td className="py-3.5">
                        <Badge
                          className={
                            op.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }
                          variant="outline"
                        >
                          {op.status === "completed" ? "مكتمل" : "فشل"}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-zinc-400 text-xs">{op.date}</td>
                      <td className="py-3.5 text-xs">{op.user}</td>
                      <td className="py-3.5 pl-4 text-left text-zinc-400 text-xs">{op.duration}</td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Terminal Status */}
        <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-400" />
              <CardTitle className="text-base font-bold text-white">حالة الخوادم</CardTitle>
            </div>
            <CardDescription className="text-zinc-400 text-xs">
              مراقبة خدمات المعالجة السحابية وقاعدة البيانات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Database indicator */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/40">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white">قاعدة البيانات</p>
                  <span className="text-[10px] text-zinc-500">PostgreSQL (SaaS)</span>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" variant="outline">
                متصل
              </Badge>
            </div>

            {/* Matching Engine indicator */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/40">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs font-bold text-white">محرك مطابقة الأسماء</p>
                  <span className="text-[10px] text-zinc-500">Local Engine v2</span>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" variant="outline">
                نشط
              </Badge>
            </div>

            {/* Processing Engine indicator */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs font-bold text-white">معالج ملفات Excel</p>
                  <span className="text-[10px] text-zinc-500">ExcelJS Streaming v4</span>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" variant="outline">
                نشط
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About Section — moved to /dashboard/about */}
    </div>
  );
}
