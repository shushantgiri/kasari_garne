import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dict, isLocale } from "@/lib/i18n";
import { RequestForm } from "@/components/guide/RequestForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? dict(locale).requestGuide : undefined };
}

export default async function RequestPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ service?: string; type?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { service = "", type } = await searchParams;
  const t = dict(locale);
  const correction = type === "correction";
  return (
    <div className="container-page max-w-2xl py-8 sm:py-10">
      <h1 className="page-title">{correction ? t.report : t.requestTitle}</h1>
      <p className="mb-6 mt-2 text-ink-soft">{correction ? (locale === "ne" ? "कुन गाइडमा के गलत छ, लेख्नुहोस्।" : "Tell us which guide is wrong and what changed.") : t.requestText}</p>
      <RequestForm locale={locale} service={service.slice(0, 200)} mode={correction ? "correction" : "request"} />
    </div>
  );
}
