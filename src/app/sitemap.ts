import type { MetadataRoute } from "next";
import { getGuides } from "@/lib/content/repo";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guides = (await getGuides()).filter((g) => g.published && g.status !== "archived");
  const pages = ["", "/guides", "/request", "/privacy", "/accessibility"];
  return ["ne", "en"].flatMap((l) => [
    ...pages.map((p) => ({ url: `${SITE}/${l}${p}`, changeFrequency: "weekly" as const })),
    ...guides.map((g) => ({ url: `${SITE}/${l}/guide/${g.slug}`, lastModified: g.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ]);
}
