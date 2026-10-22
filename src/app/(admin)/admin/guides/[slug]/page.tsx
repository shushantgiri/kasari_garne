import { notFound } from "next/navigation";
import { canReview, getAdmin } from "@/lib/admin/auth";
import { getDepartments, getGuidesForAdmin } from "@/lib/content/repo";
import type { Guide } from "@/lib/content/types";
import { GuideEditor, type Revision } from "@/components/admin/GuideEditor";

const blank = (): Guide => ({
  slug: "",
  icon: "landmark",
  departmentId: "",
  status: "draft",
  published: false,
  title: { ne: "", en: "" },
  question: { ne: "", en: "" },
  intro: { ne: "", en: "" },
  summary: { ne: "", en: "" },
  category: "identity",
  mode: "awaiting_verification",
  eligibility: [],
  documents: [],
  fees: [],
  steps: [],
  mistakes: [],
  faqs: [],
  whatNext: [],
  sources: [],
  lastChecked: "",
  video: { kind: "live" },
  keywords: [],
  related: [],
  updatedAt: new Date().toISOString().slice(0, 10),
});

export default async function EditGuidePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const admin = await getAdmin();
  const [{ guides }, departments] = await Promise.all([getGuidesForAdmin(), getDepartments()]);
  const isNew = slug === "new";
  const guide = isNew ? blank() : guides.find((g) => g.slug === slug);
  if (!guide) notFound();

  let revisions: Revision[] = [];
  if (admin.live && !isNew) {
    const { data } = await admin.db.from("guide_revisions").select("id,status,published,edited_at").eq("slug", slug).order("edited_at", { ascending: false }).limit(20);
    revisions = (data ?? []) as Revision[];
  }

  return <GuideEditor initial={guide} departments={departments} isNew={isNew} canReview={canReview(admin.role)} live={admin.live} revisions={revisions} initialTab={tab} />;
}
