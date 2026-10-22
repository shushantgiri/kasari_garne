import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartments, getGuides } from "@/lib/content/repo";
import { categories } from "@/lib/content/categories";
import { dict, isLocale, tr } from "@/lib/i18n";
import { ServiceCard } from "@/components/home/ServiceCard";
import { SearchBox } from "@/components/search/SearchBox";
import { toTeasers } from "@/lib/search/teaser";

export const revalidate = 300;

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
  const pill = (active: boolean) => `pill ${active ? "pill-active" : ""}`;

  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="page-title">{activeCat ? tr(activeCat.name, locale) : activeDept ? tr(activeDept.name, locale) : t.allGuides}</h1>

      <div className="mt-4 max-w-xl">
        <SearchBox locale={locale} teasers={toTeasers(guides, departments)} size="md" />
      </div>

      <nav aria-label={ne ? "विषय" : "Categories"} className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Link href={`/${locale}/guides`} className={pill(!category && !department)}>{ne ? "सबै" : "All"}</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/${locale}/guides?category=${c.id}`} className={pill(category === c.id)} aria-current={category === c.id ? "page" : undefined}>
            {tr(c.name, locale)}
          </Link>
        ))}
      </nav>
      <nav aria-label={t.byDepartment} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-faint">{t.byDepartment}:</span>
        {departments.map((d) => (
          <Link key={d.id} href={`/${locale}/guides?department=${d.id}`} className={`inline-flex min-h-[44px] items-center rounded-md px-2 ${department === d.id ? "bg-sky-tint font-semibold text-sky" : "text-ink-soft hover:text-ink"}`}>
            {tr(d.short, locale)}
          </Link>
        ))}
      </nav>

      {visible.length > 0 ? (
        <ul className="stagger mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {visible.map((g) => <li key={g.slug}><ServiceCard guide={g} locale={locale} /></li>)}
        </ul>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-paper-line p-8 text-center">
          <p className="font-semibold">{ne ? "यस विषयमा गाइड अझै छैन।" : "No guides in this category yet."}</p>
          <p className="mt-1 text-ink-soft">{ne ? "अर्को विषय हेर्नुहोस्, वा गाइड माग्नुहोस्।" : "Try another category, or request a guide."}</p>
          <Link href={`/${locale}/request`} className="btn-primary mt-4">{t.requestGuide}</Link>
        </div>
      )}
    </div>
  );
}
