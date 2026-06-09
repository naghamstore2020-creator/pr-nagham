"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, ClipboardList } from "lucide-react";

interface Props {
  validationErrors?: string[];
  operationLogs?: string[];
}

export default function PricingOperationPanel({ validationErrors = [], operationLogs = [] }: Props) {
  if (validationErrors.length === 0 && operationLogs.length === 0) return null;

  return (
    <div className="space-y-4">
      {validationErrors.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              تنبيهات التحقق ({validationErrors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs space-y-1 list-disc list-inside text-amber-200/90">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {operationLogs.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-violet-400" />
              سجل العمليات ({operationLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px] px-4 pb-4">
              <ul className="text-xs space-y-2">
                {operationLogs.map((log, i) => (
                  <li key={i} className="text-zinc-300 leading-relaxed border-b border-zinc-800/50 pb-2 last:border-0">
                    {log}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
