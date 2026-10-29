import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { ToolHero } from "@/components/tools/ToolHero";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { OfficeToday } from "@/components/tools/OfficeToday";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "उपयोगी उपकरण — निवेदन, फोटो, PDF, सवारी कर, बिदा" : "Handy tools — applications, photos, PDF, vehicle tax, holidays",
    description: locale === "ne" ? "सरकारी काममा चाहिने साना उपकरण, फोनमै: निवेदन, फोटो साइज, कागजात PDF, सवारी कर, बिदाको पात्रो र स्थिति जाँच।" : "Small tools for government errands, on your phone: applications, photo size, document PDF, vehicle tax, holidays and status checks.",
  };
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <ToolHero first={ne ? "सरकारी कामका" : "Handy tools"} second={ne ? "साना उपकरण" : "for government work"} text={ne ? "फोनमै, सजिलै — साइबर जानु पर्दैन।" : "On your phone, in seconds — no cyber café needed."} />
      <div className="container-page max-w-4xl space-y-5 py-6 sm:py-10">
        <OfficeToday locale={locale} compact />
        <ToolGrid locale={locale} />
      </div>
    </>
  );
}
