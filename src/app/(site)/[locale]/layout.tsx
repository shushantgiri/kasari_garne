import "@fontsource/mukta/devanagari-400.css";
import "@fontsource/mukta/devanagari-600.css";
import "@fontsource/mukta/devanagari-700.css";
import "@fontsource/mukta/latin-400.css";
import "@fontsource/mukta/latin-700.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "../../globals.css";

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { dict, isLocale } from "@/lib/i18n";
import { LOCALES } from "@/lib/content/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = dict(locale);
  return {
    metadataBase: new URL(SITE),
    title: { default: `${t.siteName} — ${t.tagline}`, template: `%s · ${t.siteName}` },
    description: t.heroText,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg", apple: "/icon-192.png" },
    alternates: { languages: { ne: "/ne", en: "/en" } },
    openGraph: { siteName: "Kasari Garne", locale: locale === "ne" ? "ne_NP" : "en_US", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#B4232C", width: "device-width", initialScale: 1 };

/** Applies saved text size before first paint, to avoid a jump. */
const textSizeScript = `try{var s=localStorage.getItem("kg-text");if(s)document.documentElement.dataset.text=s}catch(e){}`;

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: textSizeScript }} />
      </head>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <PwaRegister offlineText={dict(locale).offline} />
        <SiteHeader locale={locale} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
