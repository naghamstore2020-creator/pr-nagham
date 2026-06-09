"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">حول التطبيق</h1>
        <p className="text-zinc-400 text-xs mt-1">معلومات عن نظام إدارة المنتجات NAGHAMSTORE</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <CardTitle className="text-base font-bold text-white">حول التطبيق</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-xs text-zinc-300 leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">نبذة عن التطبيق</h3>
            <p>
              تم تطوير هذا التطبيق خصيصًا لصالح <strong className="text-violet-300">نغم ستور للاتصالات</strong> بهدف تبسيط إدارة المنتجات ومزامنة البيانات بين متجر سلة والنظام المحاسبي بطريقة عملية وفعالة، بعيدًا عن تعقيدات التكاملات البرمجية التقليدية التي تتطلب وقتًا وجهدًا وتكاليف تشغيل مرتفعة.
            </p>
            <p>
              يعتمد التطبيق على مبدأ المطابقة الذكية بين بيانات المنتجات المستخرجة من النظام المحاسبي وبيانات المنتجات الموجودة في المتجر الإلكتروني، مما يضمن تحديث المعلومات بسرعة ودقة مع تقليل الأخطاء البشرية وتحسين كفاءة العمل اليومية.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">أهداف التطبيق</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>توحيد بيانات المنتجات بين النظام المحاسبي والمتجر الإلكتروني.</li>
              <li>تحديث كميات المخزون بشكل سريع ودقيق.</li>
              <li>تعديل أسعار التكلفة وفق البيانات المعتمدة.</li>
              <li>تحديث أسعار البيع بناءً على المعطيات.</li>
              <li>تقليل الوقت المستغرق في عمليات الجرد والتحديث.</li>
              <li>الحد من الأخطاء الناتجة عن التعديل اليدوي.</li>
              <li>توفير حل عملي وسهل التشغيل دون الحاجة إلى مشاريع ربط تقنية معقدة.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">آلية العمل</h3>
            <p>يقوم التطبيق باستيراد ملفات الجرد من:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>النظام المحاسبي.</li>
              <li>متجر سلة الإلكتروني.</li>
            </ul>
            <p>بعد ذلك يتم إجراء عمليات المطابقة بين المنتجات اعتمادًا على رموز المنتجات والبيانات المتاحة، ثم تنفيذ العمليات المطلوبة مثل:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>تحديث الكميات.</li>
              <li>تعديل أسعار التكلفة.</li>
              <li>تعديل أسعار البيع.</li>
              <li>إجراء الجرد اليومي أو الجرد الكامل.</li>
              <li>مطابقة أسماء المنتجات.</li>
              <li>تنفيذ التحديثات الجماعية للمنتجات.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">المزايا الرئيسية</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>واجهة استخدام بسيطة وسهلة.</li>
              <li>معالجة سريعة لعدد كبير من المنتجات.</li>
              <li>تقارير واضحة لنتائج العمليات المنفذة.</li>
              <li>تقليل التدخل اليدوي في تحديث البيانات.</li>
              <li>دعم عمليات الجرد والتسعير بشكل مستقل أو متكامل.</li>
              <li>تصميم مخصص ليتوافق مع احتياجات نغم ستور التشغيلية.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-2">
            <h3 className="text-sm font-bold text-white">معلومات الإصدار</h3>
            <p><strong className="text-zinc-100">الإصدار الحالي:</strong> <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 mr-1" variant="outline">2.7</Badge></p>
            <p className="text-zinc-400">تم تطوير التطبيق لخدمة العمليات التشغيلية في نغم ستور للاتصالات وتعزيز كفاءة إدارة المنتجات والمخزون بين الأنظمة المختلفة.</p>
          </div>

          <div className="text-center pt-4 border-t border-zinc-800">
            <p className="text-zinc-400">
              <strong className="text-white">Mohammad Abdulrahim Otman</strong>
              <span className="mx-2">—</span>
              تم تطوير التطبيق لخدمة العمليات التشغيلية في <strong className="text-violet-300">نغم ستور للاتصالات</strong> وتعزيز كفاءة إدارة المنتجات والمخزون بين الأنظمة المختلفة.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
