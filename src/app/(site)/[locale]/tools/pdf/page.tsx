import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { ToolHero } from "@/components/tools/ToolHero";
import { ToolMore } from "@/components/tools/ToolGrid";
import { DocToPdf } from "@/components/tools/DocToPdf";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "कागजात PDF बनाउनुहोस् — अपलोडका लागि सानो साइज" : "Make a PDF of your documents — small enough to upload",
    description: locale === "ne" ? "कागजातको फोटोबाट एउटै PDF, फारामले भनेको साइजभित्र (जस्तै १ MB)।" : "Photos of documents into one PDF, under the size a form allows (like 1 MB).",
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <ToolHero
        locale={locale}
        tool="/tools/pdf"
        width="max-w-4xl"
        first={ne ? "कागजातको फोटो," : "Document photos,"}
        second={ne ? "सानो PDF मा" : "into a small PDF"}
        text={ne ? "अनलाइन फारामले भनेको साइजभित्र, फोनबाटै।" : "Under the size an online form allows, from your phone."}
      />
      <div className="container-page max-w-4xl py-6 sm:py-10">
        <DocToPdf locale={locale} />
        <ToolMore locale={locale} current="/tools/pdf" />
      </div>
    </>
  );
}
