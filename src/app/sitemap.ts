import type { MetadataRoute } from "next";
import { getGuides } from "@/lib/content/repo";
import { LETTERS } from "@/lib/content/letters";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guides = (await getGuides()).filter((g) => g.published && g.status !== "archived");
  const pages = ["", "/guides", "/tools", "/tools/photo", "/tools/pdf", "/tools/calendar", "/tools/status", "/tools/vehicle-tax", "/tools/letters", ...LETTERS.map((l) => `/tools/letters/${l.id}`), "/request", "/privacy", "/accessibility"];
  // Each page lists its other-language version too, so search shows the right one.
  const both = (path: string) => ({ languages: { ne: `${SITE}/ne${path}`, en: `${SITE}/en${path}` } });
  return ["ne", "en"].flatMap((l) => [
    ...pages.map((p) => ({ url: `${SITE}/${l}${p}`, changeFrequency: "weekly" as const, alternates: both(p) })),
    ...guides.map((g) => ({ url: `${SITE}/${l}/guide/${g.slug}`, lastModified: g.updatedAt, changeFrequency: "weekly" as const, priority: 0.8, alternates: both(`/guide/${g.slug}`) })),
  ]);
}
