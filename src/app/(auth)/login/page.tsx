"use client";

import Image from "next/image";
import { useActionState, startTransition } from "react";
import { authenticate } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/nagham-logo.png"
            alt="شعار نغم"
            width={72}
            height={72}
            className="mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-gray-900">
            نظام إدارة المنتجات
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            NAGHAMSTORE
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-gray-700 text-sm font-medium">
              اسم المستخدم
            </Label>
            <Input
              id="username"
              name="username"
              required
              autoFocus
              className="h-11 border-gray-300 bg-white text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:border-gray-900"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
              كلمة المرور
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="h-11 border-gray-300 bg-white text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:border-gray-900"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
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
        </form>
      </div>
    </div>
  );
}
