"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/theme-provider";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  ClipboardList,
  RefreshCw,
  TrendingUp,
  Coins,
  BrainCircuit,
  Sliders,
  Users,
  FileText,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  DollarSign,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "الرئيسية",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "EDITOR", "DEMO"],
  },
  {
    title: "رفع الملفات",
    href: "/dashboard/upload",
    icon: Upload,
    roles: ["ADMIN", "EDITOR", "DEMO"],
  },
  {
    title: "الجرد اليومي",
    href: "/dashboard/inventory/daily",
    icon: ClipboardList,
    roles: ["ADMIN", "EDITOR", "DEMO"],
  },
  {
    title: "الجرد الكامل",
    href: "/dashboard/inventory/full",
    icon: RefreshCw,
    roles: ["ADMIN", "EDITOR", "DEMO"],
  },
  {
    title: "أسعار التكلفة",
    href: "/dashboard/pricing/cost",
    icon: Coins,
    roles: ["ADMIN", "EDITOR"],
  },
  {
    title: "أسعار البيع",
    href: "/dashboard/pricing/sell",
    icon: TrendingUp,
    roles: ["ADMIN", "EDITOR"],
  },
  {
    title: "تسعير كامل",
    href: "/dashboard/pricing/full",
    icon: TrendingUp,
    roles: ["ADMIN", "EDITOR"],
  },
  {
    title: "تحليل الأرباح",
    href: "/dashboard/profit",
    icon: DollarSign,
    roles: ["ADMIN", "EDITOR"],
  },
  {
    title: "مطابقة الأسماء",
    href: "/dashboard/ai-matching",
    icon: BrainCircuit,
    roles: ["ADMIN", "EDITOR"],
  },
  {
    title: "حول التطبيق",
    href: "/dashboard/about",
    icon: Info,
    roles: ["ADMIN", "EDITOR", "DEMO"],
  },
  {
    title: "سجل العمليات",
    href: "/dashboard/logs",
    icon: FileText,
    roles: ["ADMIN", "EDITOR", "DEMO"],
  },
  {
    title: "إدارة المستخدمين",
    href: "/dashboard/settings/users",
    icon: Users,
    roles: ["ADMIN"],
  },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const userRole = session?.user?.role || "DEMO";
  const username = session?.user?.username || "demo";
  const userFullName = session?.user?.name || "مستخدم تجريبي";

  const handleLogout = async () => {
    await logout();
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-l border-sidebar-border backdrop-blur-xl text-sidebar-foreground w-64 shrink-0 transition-transform duration-300",
        className
      )}
    >
      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <Image
          src="/nagham-logo.png"
          alt="شعار نغم"
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl bg-white object-contain p-1 shadow-md"
          priority
        />
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground leading-none">إدارة المنتجات</h1>
          <span className="text-[10px] text-sidebar-foreground/50">NAGHAMSTORE</span>
        </div>
      </div>

      {/* Nav Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-violet-600/10 text-violet-700 dark:text-white border-r-4 border-violet-500"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-violet-600 dark:text-violet-400" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile & settings */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar/50 space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent border border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sidebar-foreground/10 text-sidebar-foreground font-bold border border-sidebar-border">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-sidebar-foreground truncate">{userFullName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className={cn("w-3 h-3", userRole === "ADMIN" ? "text-violet-600 dark:text-violet-400" : "text-amber-600 dark:text-amber-500")} />
              <span className="text-[10px] text-sidebar-foreground/50 font-medium">
                {userRole === "ADMIN" ? "مدير النظام" : userRole === "EDITOR" ? "محرر" : "وضع العرض (Demo)"}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 border-sidebar-border bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent h-9"
            title="تغيير المظهر"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            className="flex-1 border-sidebar-border bg-sidebar-accent text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/20 h-9"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
