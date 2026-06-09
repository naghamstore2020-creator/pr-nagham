"use client";

import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Menu, ShieldAlert, Wifi, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    setTime(format(new Date(), "pp", { locale: ar }));
    const timer = setInterval(() => {
      setTime(format(new Date(), "pp", { locale: ar }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isDemo = session?.user?.role === "DEMO";
  const todayStr = format(new Date(), "eeee، d MMMM yyyy", { locale: ar });

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40 backdrop-blur-xl h-16 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Button
          variant="outline"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* System name & Status */}
        <div className="hidden sm:flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-xs text-zinc-400 font-medium">النظام متصل بالسحابة</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Clock & Date */}
        <div className="hidden md:flex items-center gap-2.5 text-zinc-400 bg-zinc-900/30 border border-zinc-800/40 px-3 py-1.5 rounded-lg text-xs">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-medium text-zinc-300">{time}</span>
          <span className="text-zinc-600">|</span>
          <span className="font-medium">{todayStr}</span>
        </div>

        {/* Demo Warning Banner */}
        {isDemo && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>وضع العرض فقط (Demo Mode)</span>
          </div>
        )}
      </div>
    </header>
  );
}
