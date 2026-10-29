import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { ToolHero } from "@/components/tools/ToolHero";
import { StatusHub } from "@/components/tools/StatusHub";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "तयार भयो? पासपोर्ट, लाइसेन्स, परिचयपत्र जाँच" : "Is it ready? Check passport, licence and ID status",
    description: locale === "ne" ? "पासपोर्ट, लाइसेन्स प्रिन्ट, राष्ट्रिय परिचयपत्र, प्यान र लोकसेवा नतिजा — सरकारी पेजमा सिधै।" : "Passport, licence print, National ID, PAN and PSC results — straight to the official page.",
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <ToolHero
        first={ne ? "काम तयार भयो?" : "Is it ready?"}
        second={ne ? "यहीँबाट जाँच्नुहोस्" : "Check it here"}
        text={ne ? "सरकारी पेजमा सिधै, के चाहिन्छ भनेर पनि।" : "Straight to the official page, with what to have ready."}
      />
      <div className="container-page max-w-4xl py-6 sm:py-10">
        <StatusHub locale={locale} />
      </div>
    </>
  );
}
