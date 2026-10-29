import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { PhotoResizer } from "@/components/tools/PhotoResizer";
import { ToolHero } from "@/components/tools/ToolHero";
import { ToolMore } from "@/components/tools/ToolGrid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "फोटो र कागजातको साइज मिलाउनुहोस्" : "Resize photos and documents",
    description: locale === "ne" ? "फारामले भनेको साइज र KB मा फोटो, हस्ताक्षर र स्क्यान मिलाउनुहोस्।" : "Fit photos, signatures and scans to the size and KB a form asks for.",
  };
}

export default async function PhotoToolPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <ToolHero
        locale={locale}
        tool="/tools/photo"
        first={ne ? "फोटो र कागजात" : "Photos and documents,"}
        second={ne ? "सही साइजमा" : "the right size"}
        text={ne ? "फारामले भनेको साइज र KB मा, सजिलै।" : "The exact size and KB a form asks for."}
      />
      <div className="container-page max-w-4xl py-6 sm:py-10">
        <PhotoResizer locale={locale} />
        <ToolMore locale={locale} current="/tools/photo" />
      </div>
    </>
  );
}
