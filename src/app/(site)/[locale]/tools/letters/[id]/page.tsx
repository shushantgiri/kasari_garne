import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LOCALES } from "@/lib/content/types";
import { isLocale, tr } from "@/lib/i18n";
import { LETTERS, getLetter } from "@/lib/content/letters";
import { LetterEditor } from "@/components/tools/LetterEditor";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => LETTERS.map((l) => ({ locale, id: l.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const letter = getLetter(id);
  if (!isLocale(locale) || !letter) return {};
  return { title: tr(letter.title, locale), description: tr(letter.use, locale) };
}

export default async function LetterPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const letter = getLetter(id);
  if (!isLocale(locale) || !letter) notFound();
  const ne = locale === "ne";
  return (
    <div className="container-page max-w-5xl py-6 sm:py-8">
      <div className="no-print">
        <Link href={`/${locale}/tools/letters`} className="muted inline-flex min-h-[44px] items-center gap-1.5 transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {ne ? "सबै निवेदन" : "All letters"}
        </Link>
        <h1 className="mt-1 text-[1.75rem] font-bold leading-tight tracking-[-0.01em] sm:text-[2.2rem]">{tr(letter.title, locale)}</h1>
        <p className="mt-1 text-ink-soft">{tr(letter.use, locale)}</p>
      </div>
      <div className="mt-6">
        <LetterEditor locale={locale} template={letter} />
      </div>
    </div>
  );
}
