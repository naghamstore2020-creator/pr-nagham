"use client";

import Image from "next/image";
import { useActionState, startTransition } from "react";
import { authenticate } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-radial from-slate-900 via-zinc-950 to-black px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center justify-center text-center">
          <Image
            src="/nagham-logo.png"
            alt="شعار نغم"
            width={64}
            height={64}
            className="mb-4 h-16 w-16 rounded-2xl bg-white object-contain p-1.5 shadow-lg shadow-violet-500/20"
            priority
          />
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            نظام إدارة المنتجات
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            أداة ذكية للمطابقة وتحديث المخزون والأسعار
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl font-bold text-white">تسجيل الدخول</CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              أدخل بيانات حسابك للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-300 text-sm">اسم المستخدم</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="admin أو demo"
                    required
                    className="pr-10 border-zinc-800 bg-zinc-950/40 text-white placeholder-zinc-500 focus-visible:ring-violet-500 focus-visible:border-violet-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300 text-sm">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Werasdzxc1@ أو demo"
                    required
                    className="pr-10 border-zinc-800 bg-zinc-950/40 text-white placeholder-zinc-500 focus-visible:ring-violet-500 focus-visible:border-violet-500"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-violet-600/25 transition-all duration-300"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
              <div className="text-center text-xs text-zinc-500">
                الحساب التجريبي: <span className="text-zinc-400 select-all font-mono">demo</span> / <span className="text-zinc-400 select-all font-mono">demo</span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
