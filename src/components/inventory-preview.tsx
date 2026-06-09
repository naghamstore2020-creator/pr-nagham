"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InventoryResult } from "@/types/inventory";
import { Filter } from "lucide-react";

interface Props {
  details: InventoryResult[];
  mode?: "daily" | "full";
}

type FilterMode = "all" | "modified" | "unchanged" | "decreased" | "increased";

function rowClass(difference: number): string {
  if (difference < 0) return "bg-red-300/[0.06] border-red-300/20";
  if (difference > 0) return "bg-cyan-300/[0.09] border-cyan-300/30";
  return "bg-emerald-300/[0.06] border-emerald-300/20";
}

export default function InventoryPreview({ details, mode = "daily" }: Props) {
  const [filter, setFilter] = useState<FilterMode>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return details;
    if (filter === "modified") return details.filter((d) => d.action !== "unchanged");
    if (filter === "unchanged") return details.filter((d) => d.action === "unchanged");
    if (filter === "decreased") return details.filter((d) => d.difference < 0);
    if (filter === "increased") return details.filter((d) => d.difference > 0);
    return details;
  }, [details, filter]);

  const modifiedCount = details.filter((d) => d.action !== "unchanged").length;
  const unchangedCount = details.filter((d) => d.action === "unchanged").length;
  const decreasedCount = details.filter((d) => d.difference < 0).length;
  const increasedCount = details.filter((d) => d.difference > 0).length;
  const isDaily = mode === "daily";

  return (
    <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Filter className="w-4 h-4 text-violet-400" />
          معاينة النتائج
        </CardTitle>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={`text-[11px] h-7 px-3 ${filter === "all" ? "bg-violet-600 hover:bg-violet-500" : "border-zinc-800 hover:text-white"}`}
          >
            الكل ({details.length})
          </Button>
          <Button
            variant={filter === "modified" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("modified")}
            className={`text-[11px] h-7 px-3 ${filter === "modified" ? "bg-blue-600 hover:bg-blue-500" : "border-zinc-800 hover:text-white"}`}
          >
            المعدلة ({modifiedCount})
          </Button>
          <Button
            variant={filter === "unchanged" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unchanged")}
            className={`text-[11px] h-7 px-3 ${filter === "unchanged" ? "bg-emerald-600 hover:bg-emerald-500" : "border-zinc-800 hover:text-white"}`}
          >
            المتطابقة ({unchangedCount})
          </Button>
          {isDaily ? (
            <Button
              variant={filter === "decreased" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("decreased")}
              className={`text-[11px] h-7 px-3 ${filter === "decreased" ? "bg-red-600 hover:bg-red-500" : "border-zinc-800 hover:text-white"}`}
            >
              قلت الكمية ({decreasedCount})
            </Button>
          ) : (
            <>
              <Button
                variant={filter === "decreased" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("decreased")}
                className={`text-[11px] h-7 px-3 ${filter === "decreased" ? "bg-red-600 hover:bg-red-500" : "border-zinc-800 hover:text-white"}`}
              >
                نقص ({decreasedCount})
              </Button>
              <Button
                variant={filter === "increased" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("increased")}
                className={`text-[11px] h-7 px-3 ${filter === "increased" ? "bg-cyan-600 hover:bg-cyan-500" : "border-zinc-800 hover:text-white"}`}
              >
                زيادة ({increasedCount})
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-[11px] text-zinc-500 w-8">رمز المنتج</TableHead>
                <TableHead className="text-[11px] text-zinc-500">اسم المنتج</TableHead>
                <TableHead className="text-[11px] text-zinc-500 text-center">الكمية القديمة</TableHead>
                <TableHead className="text-[11px] text-zinc-500 text-center">الكمية الجديدة</TableHead>
                <TableHead className="text-[11px] text-zinc-500 text-center">الفرق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500 text-xs py-8">
                    لا توجد نتائج تطابق الفلتر المحدد
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, idx) => (
                  <TableRow key={idx} className={`border-zinc-800/50 ${rowClass(item.difference)}`}>
                    <TableCell className="text-[11px] font-mono">{item.sku || "-"}</TableCell>
                    <TableCell className="text-[11px] max-w-[200px] truncate" title={item.productName}>
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-[11px] text-center">{item.oldQuantity}</TableCell>
                    <TableCell className="text-[11px] text-center font-bold">{item.newQuantity}</TableCell>
                    <TableCell className="text-[11px] text-center font-bold">
                      {item.difference > 0 ? "+" : ""}{item.difference}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
