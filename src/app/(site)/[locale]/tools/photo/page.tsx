import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { PhotoResizer } from "@/components/tools/PhotoResizer";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "फोटो र कागजातको साइज मिलाउनुहोस्" : "Resize photos and documents",
    description: locale === "ne" ? "फारामले भनेको साइज र KB मा फोटो, हस्ताक्षर र स्क्यान मिलाउनुहोस्। फोटो कतै पठाइँदैन।" : "Fit photos, signatures and scans to the size and KB a form asks for. Nothing is uploaded.",
  };
}

export default async function PhotoToolPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <section className="mesh-bg grain overflow-hidden border-b border-paper-line">
        <div className="container-page py-10 text-center sm:py-12">
          <h1 className="animate-rise text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]">
            {ne ? "फोटो र कागजात" : "Photos and documents,"}{" "}
            <span className="block bg-gradient-to-r from-[#D63A44] to-brand-dark bg-clip-text py-[0.12em] text-transparent">{ne ? "सही साइजमा" : "the right size"}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md animate-rise text-balance text-ink-soft [animation-delay:60ms] sm:text-lg">
            {ne ? "फारामले भनेको साइज र KB मा, सजिलै। साइबर जानु पर्दैन।" : "The exact size and KB a form asks for, in seconds. No cyber café needed."}
          </p>
        </div>
      </section>
      <div className="container-page max-w-4xl py-8 sm:py-10">
        <PhotoResizer locale={locale} />
      </div>
    </>
  );
}
