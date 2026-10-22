import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { dict } from "@/lib/i18n";
import { Logo } from "./Logo";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const ne = locale === "ne";
  const groups = [
    {
      title: ne ? "गाइड" : "Guides",
      links: [
        { href: `/${locale}/guides`, label: t.allGuides },
        { href: `/${locale}/request`, label: t.requestGuide },
        { href: `/${locale}/request?type=correction`, label: ne ? "गलत जानकारी रिपोर्ट" : "Report an error" },
      ],
    },
    {
      title: ne ? "जानकारी" : "About",
      links: [
        { href: `/${locale}/privacy`, label: ne ? "गोपनीयता" : "Privacy" },
        { href: `/${locale}/accessibility`, label: ne ? "पहुँच" : "Accessibility" },
        { href: `/${locale}/privacy#contact`, label: ne ? "सम्पर्क" : "Contact" },
      ],
    },
  ];
  return (
    <footer className="mt-16 border-t border-paper-line bg-paper-warm">
      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo locale={locale} />
            <p className="mt-3 text-base leading-relaxed text-ink-soft">{t.tagline}</p>
          </div>
          <nav aria-label={ne ? "फुटर लिंक" : "Footer links"} className="contents">
            <div className="grid grid-cols-2 gap-6 md:contents">
              {groups.map((g) => (
                <div key={g.title}>
                  <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-faint">{g.title}</h2>
                  <ul className="mt-2">
                    {g.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="group inline-flex min-h-[44px] items-center gap-1 text-base font-medium text-ink-soft transition-colors hover:text-brand"
                        >
                          {l.label}
                          <ArrowUpRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-paper-line pt-5 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kasari Garne</p>
          <p>{ne ? "स्वतन्त्र मार्गदर्शन · सरकारी वेबसाइट होइन" : "Independent guide · Not a government website"}</p>
        </div>
      </div>
    </footer>
  );
}
