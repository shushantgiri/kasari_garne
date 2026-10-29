import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isLocale } from "@/lib/i18n";
import { LicenceQuiz } from "@/components/tools/LicenceQuiz";

/** Test practice exists for the driving licence only. */
const PRACTICE = new Set(["driving-licence"]);

export function generateStaticParams() {
  return ["ne", "en"].map((locale) => ({ locale, slug: "driving-licence" }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !PRACTICE.has(slug)) return {};
  return {
    title: locale === "ne" ? "लाइसेन्स परीक्षाको अभ्यास" : "Driving licence test practice",
    description: locale === "ne" ? "लिखित परीक्षाका अभ्यास प्रश्न, सडक चिह्न र रङ पहिचान जाँच।" : "Practice questions for the written test, road signs and a colour vision check.",
  };
}

export default async function PracticePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !PRACTICE.has(slug)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <section className="mesh-bg grain overflow-hidden border-b border-paper-line">
        <div className="container-page max-w-2xl py-8 sm:py-10">
          <Link href={`/${locale}/guide/${slug}`} className="muted inline-flex min-h-[44px] items-center gap-1.5 transition-colors hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {ne ? "लाइसेन्स निर्देशिका" : "Licence guide"}
          </Link>
          <h1 className="mt-2 animate-rise text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.5rem]">
            {ne ? "लाइसेन्स परीक्षाको" : "Licence test"}{" "}
            <span className="text-brand">{ne ? "अभ्यास" : "practice"}</span>
          </h1>
          <p className="mt-2 animate-rise text-ink-soft [animation-delay:60ms] sm:text-lg">
            {ne ? "कार्यालयको जस्तै नमुना परीक्षा, र रङ पहिचान जाँच।" : "A mock test like the one at the office, and a colour check."}
          </p>
        </div>
      </section>
      <div className="container-page max-w-2xl py-6 sm:py-8">
        <LicenceQuiz locale={locale} />
      </div>
    </>
  );
}
