import type { Department, Guide, IconName, Localized } from "../content/types";
import type { Searchable } from "./search";

/** The small slice of a guide that the browser needs for instant search. */
export interface GuideTeaser extends Searchable {
  icon: IconName;
  summary: Localized;
  /** Purposes the guide offers, so search can open it with the right one chosen. */
  situations?: { id: string; label: Localized; pending?: boolean }[];
}

export function toTeasers(guides: Guide[], departments: Department[]): GuideTeaser[] {
  return guides
    .filter((g) => g.status !== "archived")
    .map((g) => {
      const d = departments.find((x) => x.id === g.departmentId);
      return {
        slug: g.slug,
        title: g.title,
        question: g.question,
        summary: g.summary,
        keywords: g.keywords,
        published: g.published,
        icon: g.icon,
        departmentNames: d ? [d.name.ne, d.name.en ?? "", d.short.ne, d.short.en ?? ""] : [],
        situations: g.situations?.map((x) => ({ id: x.id, label: x.label, pending: x.pending })),
      };
    });
}
