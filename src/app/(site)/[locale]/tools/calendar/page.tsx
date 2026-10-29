import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { ToolHero } from "@/components/tools/ToolHero";
import { CalendarTool } from "@/components/tools/CalendarTool";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "मिति र बिदा — आज कार्यालय खुला छ?" : "Dates and holidays — are offices open today?",
    description: locale === "ne" ? "२०८३ सालका सरकारी बिदा, कार्यालय समय, र वि.सं. ↔ ई.सं. मिति बदल्ने।" : "2083 BS government holidays, office hours, and BS ↔ AD date converter.",
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <ToolHero
        first={ne ? "मिति र बिदा," : "Dates and holidays,"}
        second={ne ? "एकै ठाउँमा" : "in one place"}
        text={ne ? "आज कार्यालय खुला छ कि छैन, बिदाको पात्रो, र मिति बदल्ने।" : "Are offices open today, the holiday calendar, and a date converter."}
      />
      <div className="container-page max-w-xl py-6 sm:py-10">
        <CalendarTool locale={locale} />
      </div>
    </>
  );
}
