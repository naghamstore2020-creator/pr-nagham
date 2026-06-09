"use client";

import { useEffect, useState, useCallback } from "react";
import { getJobLogs, exportJobsExcel, JobLog } from "@/actions/jobs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, FileText, Clock, User, AlertCircle, Download, Filter } from "lucide-react";

const JOB_TYPE_LABELS: Record<string, string> = {
  DAILY_INVENTORY: "جرد يومي",
  FULL_INVENTORY: "جرد كامل",
  COST_UPDATE: "تحديث أسعار التكلفة",
  SELL_UPDATE: "تحديث أسعار البيع",
  FULL_UPDATE: "تحديث كامل",
  AI_MATCHING: "مطابقة الأسماء",
};

const JOB_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
  RETRYING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const JOB_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  PROCESSING: "قيد المعالجة",
  COMPLETED: "مكتمل",
  FAILED: "فشل",
  RETRYING: "إعادة محاولة",
};

export default function LogsPage() {
  const [jobs, setJobs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const buildFilters = useCallback(() => {
    const f: any = {};
    if (filterType && filterType !== "all") f.type = filterType;
    if (filterStatus && filterStatus !== "all") f.status = filterStatus;
    if (filterFrom) f.fromDate = filterFrom;
    if (filterTo) f.toDate = filterTo;
    return f;
  }, [filterType, filterStatus, filterFrom, filterTo]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getJobLogs(page, limit, buildFilters());
      if (res.success) {
        setJobs(res.jobs as JobLog[]);
        setTotal(res.total);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page, buildFilters]);

  useEffect(() => { loadJobs() }, [loadJobs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportJobsExcel(buildFilters());
      if (res.success && res.buffer) {
        const a = document.createElement("a");
        a.href = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + res.buffer;
        a.download = `سجل_العمليات_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
      }
    } catch {} finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">سجل العمليات</h1>
          <p className="text-zinc-400 text-xs mt-1">جميع عمليات الجرد والتسعير والمطابقة المنفذة على النظام.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white text-xs" disabled={exporting}>
            <Download className="w-4 h-4 ml-2" />
            {exporting ? "جاري التصدير..." : "تصدير Excel"}
          </Button>
          <Button onClick={loadJobs} variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white text-xs" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-violet-400" />
            <CardTitle className="text-sm font-bold text-white">تصفية</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-zinc-500 text-[10px]">نوع العملية</Label>
              <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all" className="text-xs">الكل</SelectItem>
                  {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-500 text-[10px]">الحالة</Label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all" className="text-xs">الكل</SelectItem>
                  {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-500 text-[10px]">من تاريخ</Label>
              <Input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }} className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-500 text-[10px]">إلى تاريخ</Label>
              <Input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }} className="bg-zinc-950/60 border-zinc-800 text-white text-xs h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-white">جميع العمليات</CardTitle>
          <CardDescription className="text-zinc-400 text-xs">إجمالي {total} عملية</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">لا توجد عمليات مسجلة بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold">
                    <th className="pb-3 pr-4">نوع العملية</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3">التاريخ</th>
                    <th className="pb-3">المستخدم</th>
                    <th className="pb-3">التقدم</th>
                    <th className="pb-3 pl-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                          <span className="font-medium text-white">{JOB_TYPE_LABELS[job.type] || job.type}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <Badge className={JOB_STATUS_COLORS[job.status]} variant="outline">
                          {JOB_STATUS_LABELS[job.status] || job.status}
                        </Badge>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Clock className="w-3 h-3" />
                          {new Date(job.createdAt).toLocaleString("ar-SA")}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <User className="w-3 h-3 text-zinc-500" />
                          {job.user?.username || "—"}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="text-xs text-zinc-400">
                          {job.processedItems}/{job.totalItems}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4">
                        {job.errorMessage ? (
                          <div className="flex items-center gap-1 text-xs text-red-400" title={job.errorMessage}>
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[150px]">{job.errorMessage}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {total > limit && (
        <div className="flex justify-center gap-2">
          <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="outline" className="border-zinc-800 text-xs">
            السابق
          </Button>
          <span className="flex items-center text-xs text-zinc-500 px-2">
            الصفحة {page} من {Math.ceil(total / limit)}
          </span>
          <Button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)} variant="outline" className="border-zinc-800 text-xs">
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
