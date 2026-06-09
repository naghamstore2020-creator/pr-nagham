import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 mb-2">
          <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">الصفحة غير موجودة</h1>
        <p className="text-sm text-zinc-400">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Link href="/dashboard">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white text-sm">
            العودة إلى الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
}
