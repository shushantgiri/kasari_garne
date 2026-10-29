import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartments, getGuides } from "@/lib/content/repo";
import { categories } from "@/lib/content/categories";
import { dict, isLocale, tr } from "@/lib/i18n";
import { ServiceCard } from "@/components/home/ServiceCard";
import { SearchBox } from "@/components/search/SearchBox";
import { toTeasers } from "@/lib/search/teaser";
import { RotatingWord } from "@/components/ui/RotatingWord";

export const revalidate = 300;

/** Short everyday names for the rotating word in the title; guides not listed here are left out. */
const SHORT: Record<string, { ne: string; en: string }> = {
  "driving-licence": { ne: "लाइसेन्स", en: "driving licence" },
  passport: { ne: "राहदानी", en: "passport" },
  "national-id": { ne: "राष्ट्रिय परिचयपत्र", en: "national ID" },
  pan: { ne: "प्यान नम्बर", en: "PAN number" },
  "police-clearance": { ne: "चारित्रिक प्रमाणपत्र", en: "police report" },
  "voter-registration": { ne: "मतदाता परिचयपत्र", en: "voter ID" },
};

/** Red gradient text; the vertical padding keeps Devanagari marks inside the clip. */
const GRADIENT = "text-brand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? dict(locale).allGuides : undefined };
}

export default async function GuidesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; department?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { category, department } = await searchParams;
  const t = dict(locale);
  const ne = locale === "ne";
  const [guides, departments] = await Promise.all([getGuides(), getDepartments()]);

  const visible = guides
    .filter((g) => g.status !== "archived")
    .filter((g) => !category || g.category === category)
    .filter((g) => !department || g.departmentId === department)
    .sort((a, b) => Number(b.published) - Number(a.published));

  const activeCat = categories.find((c) => c.id === category);
  const activeDept = departments.find((d) => d.id === department);

  // Short names of the ready guides, for the rotating word in the title.
  const rotating = visible.filter((g) => g.published && SHORT[g.slug]).map((g) => SHORT[g.slug][locale]);

  return (
    <>
      {/* Header: the same soft colour mesh as the homepage, a centred title, a count, and search. */}
      <section className="mesh-bg grain overflow-hidden border-b border-paper-line">
        <div className="container-page py-10 text-center sm:py-14">
          <h1 className="animate-rise text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.75rem]">
            {activeCat ? (
              tr(activeCat.name, locale)
            ) : activeDept ? (
              tr(activeDept.name, locale)
            ) : rotating.length > 0 ? (
              // "How to get a / [licence → passport → national ID]"; in Nepali the word comes first.
              <>
                {!ne && <span className="block">How to get a</span>}
                <span className="block">
                  <RotatingWord words={rotating} className={GRADIENT} />
                </span>
                {ne && <span className="block">कसरी बनाउने?</span>}
              </>
            ) : (
              t.allGuides
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-md animate-rise text-balance text-ink-soft [animation-delay:60ms] sm:text-lg">
            {ne ? "सजिलो भाषामा, चरण-चरण मार्गदर्शन।" : "Step-by-step help, in simple words."}
          </p>
          <div className="relative z-20 mx-auto mt-7 max-w-xl animate-rise text-left [animation-delay:120ms]">
            <div className="relative">
              <SearchBox locale={locale} teasers={toTeasers(guides, departments)} size="lg" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
      {visible.length > 0 ? (
        <ul className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {visible.map((g) => <li key={g.slug}><ServiceCard guide={g} locale={locale} /></li>)}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-paper-line p-8 text-center">
          <p className="font-semibold">{ne ? "यस विषयमा निर्देशिका अझै छैन।" : "No guides in this category yet."}</p>
          <p className="mt-1 text-ink-soft">{ne ? "अर्को विषय हेर्नुहोस्, वा निर्देशिका माग्नुहोस्।" : "Try another category, or request a guide."}</p>
          <Link href={`/${locale}/request`} className="btn-primary mt-4">{t.requestGuide}</Link>
        </div>
      )}
      </div>
    </>
  );
}
