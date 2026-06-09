"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter } from "lucide-react";

interface PricingDetail {
  sku: string;
  productName: string;
  oldCostPrice: number;
  newCostPrice: number;
  oldSellPrice: number;
  newSellPrice: number;
  isVariant: boolean;
  isExcluded: boolean;
  action?: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

interface Props {
  details: PricingDetail[];
  showExcluded?: boolean;
  mode?: "cost" | "sell" | "full";
}

type FilterMode = "all" | "modified" | "unchanged" | "decreased" | "increased" | "cost_down" | "cost_up" | "sell_down" | "sell_up";

const btnClass = (active: boolean, color: string) =>
  `text-[11px] h-7 px-3 ${active ? color : "border-zinc-800 hover:text-white"}`;

function rowClass(diff: number): string {
  if (diff < 0) return "bg-red-300/[0.06] border-red-300/20";
  if (diff > 0) return "bg-cyan-300/[0.09] border-cyan-300/30";
  return "bg-emerald-300/[0.06] border-emerald-300/20";
}

export default function PricingPreview({ details, showExcluded = true, mode = "sell" }: Props) {
  const [filter, setFilter] = useState<FilterMode>("all");

  const visibleDetails = useMemo(() => {
    return showExcluded ? details : details.filter((d) => !d.isExcluded);
  }, [details, showExcluded]);

  const filtered = useMemo(() => {
    if (filter === "all") return visibleDetails;
    if (filter === "modified") return visibleDetails.filter((d) => d.action !== "unchanged");
    if (filter === "unchanged") return visibleDetails.filter((d) => d.action === "unchanged");
    if (filter === "decreased") return visibleDetails.filter((d) => (mode === "full" ? d.newCostPrice - d.oldCostPrice < 0 || d.newSellPrice - d.oldSellPrice < 0 : (mode === "cost" ? d.newCostPrice - d.oldCostPrice : d.newSellPrice - d.oldSellPrice) < 0));
    if (filter === "increased") return visibleDetails.filter((d) => (mode === "full" ? d.newCostPrice - d.oldCostPrice > 0 || d.newSellPrice - d.oldSellPrice > 0 : (mode === "cost" ? d.newCostPrice - d.oldCostPrice : d.newSellPrice - d.oldSellPrice) > 0));
    if (filter === "cost_down") return visibleDetails.filter((d) => d.newCostPrice - d.oldCostPrice < 0);
    if (filter === "cost_up") return visibleDetails.filter((d) => d.newCostPrice - d.oldCostPrice > 0);
    if (filter === "sell_down") return visibleDetails.filter((d) => d.newSellPrice - d.oldSellPrice < 0);
    if (filter === "sell_up") return visibleDetails.filter((d) => d.newSellPrice - d.oldSellPrice > 0);
    return visibleDetails;
  }, [visibleDetails, filter, mode]);

  const modifiedCount = visibleDetails.filter((d) => d.action !== "unchanged").length;
  const unchangedCount = visibleDetails.filter((d) => d.action === "unchanged").length;
  const decreasedCount = visibleDetails.filter((d) => (mode === "full" ? d.newCostPrice - d.oldCostPrice < 0 || d.newSellPrice - d.oldSellPrice < 0 : (mode === "cost" ? d.newCostPrice - d.oldCostPrice : d.newSellPrice - d.oldSellPrice) < 0)).length;
  const increasedCount = visibleDetails.filter((d) => (mode === "full" ? d.newCostPrice - d.oldCostPrice > 0 || d.newSellPrice - d.oldSellPrice > 0 : (mode === "cost" ? d.newCostPrice - d.oldCostPrice : d.newSellPrice - d.oldSellPrice) > 0)).length;
  const costDownCount = visibleDetails.filter((d) => d.newCostPrice - d.oldCostPrice < 0).length;
  const costUpCount = visibleDetails.filter((d) => d.newCostPrice - d.oldCostPrice > 0).length;
  const sellDownCount = visibleDetails.filter((d) => d.newSellPrice - d.oldSellPrice < 0).length;
  const sellUpCount = visibleDetails.filter((d) => d.newSellPrice - d.oldSellPrice > 0).length;

  const isCost = mode === "cost";
  const oldLabel = isCost ? "سعر التكلفة القديم" : "سعر البيع القديم";
  const newLabel = isCost ? "سعر التكلفة الجديد" : "سعر البيع الجديد";
  const diffLabel = "الفرق";

  const filters = (
    <div className="flex gap-1.5 flex-wrap">
      <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}
        className={btnClass(filter === "all", "bg-violet-600 hover:bg-violet-500")}>الكل ({visibleDetails.length})</Button>
      <Button variant={filter === "modified" ? "default" : "outline"} size="sm" onClick={() => setFilter("modified")}
        className={btnClass(filter === "modified", "bg-blue-600 hover:bg-blue-500")}>المعدلة ({modifiedCount})</Button>
      <Button variant={filter === "unchanged" ? "default" : "outline"} size="sm" onClick={() => setFilter("unchanged")}
        className={btnClass(filter === "unchanged", "bg-emerald-600 hover:bg-emerald-500")}>المتطابقة ({unchangedCount})</Button>
      {mode === "full" ? (
        <>
          <Button variant={filter === "cost_down" ? "default" : "outline"} size="sm" onClick={() => setFilter("cost_down")}
            className={btnClass(filter === "cost_down", "bg-red-600 hover:bg-red-500")}>نقص تكلفة ({costDownCount})</Button>
          <Button variant={filter === "cost_up" ? "default" : "outline"} size="sm" onClick={() => setFilter("cost_up")}
            className={btnClass(filter === "cost_up", "bg-cyan-600 hover:bg-cyan-500")}>زيادة تكلفة ({costUpCount})</Button>
          <Button variant={filter === "sell_down" ? "default" : "outline"} size="sm" onClick={() => setFilter("sell_down")}
            className={btnClass(filter === "sell_down", "bg-orange-600 hover:bg-orange-500")}>نقص بيع ({sellDownCount})</Button>
          <Button variant={filter === "sell_up" ? "default" : "outline"} size="sm" onClick={() => setFilter("sell_up")}
            className={btnClass(filter === "sell_up", "bg-cyan-600 hover:bg-cyan-500")}>زيادة بيع ({sellUpCount})</Button>
        </>
      ) : (
        <>
          <Button variant={filter === "decreased" ? "default" : "outline"} size="sm" onClick={() => setFilter("decreased")}
            className={btnClass(filter === "decreased", "bg-red-600 hover:bg-red-500")}>نقص ({decreasedCount})</Button>
          <Button variant={filter === "increased" ? "default" : "outline"} size="sm" onClick={() => setFilter("increased")}
            className={btnClass(filter === "increased", "bg-cyan-600 hover:bg-cyan-500")}>زيادة ({increasedCount})</Button>
        </>
      )}
    </div>
  );

  if (mode === "full") {
    return (
      <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="w-4 h-4 text-violet-400" />
            معاينة النتائج
          </CardTitle>
          {filters}
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-[11px] text-zinc-500 w-8">رمز المنتج</TableHead>
                  <TableHead className="text-[11px] text-zinc-500">اسم المنتج</TableHead>
                  <TableHead className="text-[11px] text-zinc-500">الخيارات</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">التكلفة القديم</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">التكلفة الجديد</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">فرق التكلفة</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">البيع القديم</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">البيع الجديد</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">فرق البيع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-zinc-500 text-xs py-8">لا توجد نتائج</TableCell></TableRow>
                ) : (
                  filtered.map((item, idx) => {
                    const cd = item.newCostPrice - item.oldCostPrice;
                    const sd = item.newSellPrice - item.oldSellPrice;
                    const options = [item.option1, item.option2, item.option3].filter(Boolean).join(" / ");
                    return (
                      <TableRow key={idx} className={`border-zinc-800/50 ${rowClass(cd < 0 || sd < 0 ? -1 : cd > 0 || sd > 0 ? 1 : 0)}`}>
                        <TableCell className="text-[11px] font-mono">{item.sku || "-"}</TableCell>
                        <TableCell className="text-[11px] max-w-[150px] truncate" title={item.productName}>{item.productName}</TableCell>
                        <TableCell className="text-[11px] max-w-[120px] truncate text-zinc-400" title={options}>{options || "-"}</TableCell>
                        <TableCell className="text-[11px] text-center">{item.oldCostPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-[11px] text-center font-bold">{item.newCostPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-[11px] text-center font-bold">{cd > 0 ? "+" : ""}{cd.toFixed(2)}</TableCell>
                        <TableCell className="text-[11px] text-center">{item.oldSellPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-[11px] text-center font-bold">{item.newSellPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-[11px] text-center font-bold">{sd > 0 ? "+" : ""}{sd.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Filter className="w-4 h-4 text-violet-400" />
          معاينة النتائج
        </CardTitle>
        {filters}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-[11px] text-zinc-500 w-8">رمز المنتج</TableHead>
                  <TableHead className="text-[11px] text-zinc-500">اسم المنتج</TableHead>
                  <TableHead className="text-[11px] text-zinc-500">الخيارات</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">{oldLabel}</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">{newLabel}</TableHead>
                  <TableHead className="text-[11px] text-zinc-500 text-center">{diffLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-zinc-500 text-xs py-8">لا توجد نتائج</TableCell></TableRow>
                ) : (
                  filtered.map((item, idx) => {
                    const diff = isCost ? item.newCostPrice - item.oldCostPrice : item.newSellPrice - item.oldSellPrice;
                    const options = [item.option1, item.option2, item.option3].filter(Boolean).join(" / ");
                    return (
                      <TableRow key={idx} className={`border-zinc-800/50 ${rowClass(diff)}`}>
                        <TableCell className="text-[11px] font-mono">{item.sku || "-"}</TableCell>
                        <TableCell className="text-[11px] max-w-[200px] truncate" title={item.productName}>{item.productName}</TableCell>
                        <TableCell className="text-[11px] max-w-[120px] truncate text-zinc-400" title={options}>{options || "-"}</TableCell>
                        <TableCell className="text-[11px] text-center">{isCost ? item.oldCostPrice.toFixed(2) : item.oldSellPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-[11px] text-center font-bold">{isCost ? item.newCostPrice.toFixed(2) : item.newSellPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-[11px] text-center font-bold">{diff > 0 ? "+" : ""}{diff.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
