import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/auth-provider";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "نظام إدارة المنتجات | NAGHAMSTORE",
  description: "لوحة تحكم احترافية لإدارة المنتجات والأسعار والمخزون",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider defaultTheme="light" storageKey="inventory-theme">
              {children}
              <Toaster position="top-center" />
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
