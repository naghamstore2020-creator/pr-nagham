export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">جاري التحميل...</p>
      </div>
    </div>
  );
}
