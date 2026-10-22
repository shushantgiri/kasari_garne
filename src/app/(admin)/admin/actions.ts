"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Department, Guide } from "@/lib/content/types";
import { canReview, getAdmin } from "@/lib/admin/auth";
import { validateGuide } from "@/lib/admin/validate";

export type AdminResult = { ok: true; message?: string } | { ok: false; demo?: boolean; errors: string[] };

const DEMO: AdminResult = { ok: false, demo: true, errors: ["Demo mode: connect Supabase to save. Use “Export JSON” to keep your work."] };

export async function saveGuide(guide: Guide): Promise<AdminResult> {
  const admin = await getAdmin();
  const { errors } = validateGuide(guide);
  if (errors.length) return { ok: false, errors };
  if (!admin.live) return DEMO;

  // Only reviewers can mark verified or approve video; editors' attempts are downgraded, not silently kept.
  if (!canReview(admin.role)) {
    const { data: prev } = await admin.db.from("guides").select("status,video_review").eq("slug", guide.slug).maybeSingle();
    if (guide.status === "verified" && prev?.status !== "verified") return { ok: false, errors: ["Only a reviewer can mark a guide as Verified. Set it to Under Review and assign a reviewer."] };
    if (guide.video.review === "approved" && prev?.video_review !== "approved") return { ok: false, errors: ["Only a reviewer can approve a video."] };
  }

  const today = new Date().toISOString().slice(0, 10);
  const data: Guide = { ...guide, updatedAt: today, published: guide.status === "archived" ? false : guide.published };
  const { error } = await admin.db.from("guides").upsert({
    slug: data.slug,
    department_id: data.departmentId,
    status: data.status,
    published: data.published,
    coming_soon: !data.published && data.status === "draft" && !!data.popular,
    data,
    last_checked: data.lastChecked || null,
    recheck_by: data.recheckBy || null,
    video_review: data.video.review ?? "pending",
  });
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Saved." };
}

export async function decideVideo(slug: string, decision: "approved" | "rejected"): Promise<AdminResult> {
  const admin = await getAdmin();
  if (!admin.live) return DEMO;
  if (!canReview(admin.role)) return { ok: false, errors: ["Only reviewers can approve or reject videos."] };
  const { data: row, error: e1 } = await admin.db.from("guides").select("data").eq("slug", slug).single();
  if (e1 || !row) return { ok: false, errors: [e1?.message ?? "Guide not found"] };
  const data = row.data as Guide;
  data.video = { ...data.video, review: decision, approvedBy: admin.name, approvedOn: new Date().toISOString().slice(0, 10) };
  const { error } = await admin.db.from("guides").update({ data, video_review: decision }).eq("slug", slug);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: decision === "approved" ? "Video approved and now public." : "Video rejected." };
}

export async function setReportState(id: string, state: string, note: string): Promise<AdminResult> {
  const admin = await getAdmin();
  if (!admin.live) return DEMO;
  if (!["new", "in_progress", "resolved", "rejected"].includes(state)) return { ok: false, errors: ["Bad state"] };
  const { error } = await admin.db.from("reports").update({ state, admin_note: note.slice(0, 1000) || null }).eq("id", id);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function flagForUpdate(slug: string): Promise<AdminResult> {
  const admin = await getAdmin();
  if (!admin.live) return DEMO;
  const { data: row } = await admin.db.from("guides").select("data").eq("slug", slug).single();
  if (!row) return { ok: false, errors: ["Guide not found"] };
  const data = { ...(row.data as Guide), status: "needs_update" as const };
  const { error } = await admin.db.from("guides").update({ status: "needs_update", data }).eq("slug", slug);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Guide flagged as Needs Update — visitors now see a warning." };
}

export async function setRequestState(id: string, state: string): Promise<AdminResult> {
  const admin = await getAdmin();
  if (!admin.live) return DEMO;
  if (!["new", "planned", "done", "rejected"].includes(state)) return { ok: false, errors: ["Bad state"] };
  const { error } = await admin.db.from("guide_requests").update({ state }).eq("id", id);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveDepartment(d: Department): Promise<AdminResult> {
  const admin = await getAdmin();
  if (!/^[a-z0-9-]{2,40}$/.test(d.id) || !d.name.ne.trim() || !/^https:\/\//.test(d.url)) return { ok: false, errors: ["Id, Nepali name and an https:// URL are required."] };
  if (!admin.live) return DEMO;
  const { error } = await admin.db.from("departments").upsert(d);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Saved." };
}

/** Publish or unpublish from the guide list. Same rules as saving the whole guide. */
export async function setPublished(slug: string, published: boolean): Promise<AdminResult> {
  const admin = await getAdmin();
  if (!admin.live) return DEMO;
  const { data: row, error: e1 } = await admin.db.from("guides").select("data,status").eq("slug", slug).single();
  if (e1 || !row) return { ok: false, errors: [e1?.message ?? "Guide not found"] };
  const data: Guide = { ...(row.data as Guide), status: row.status as Guide["status"], published, updatedAt: new Date().toISOString().slice(0, 10) };
  const { errors } = validateGuide(data);
  if (errors.length) return { ok: false, errors };
  const { error } = await admin.db
    .from("guides")
    .update({ published, data, coming_soon: !published && data.status === "draft" && !!data.popular })
    .eq("slug", slug);
  if (error) return { ok: false, errors: [error.message] };
  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: published ? "Published. Visitors can now see this guide." : "Unpublished. The guide is hidden from visitors." };
}

export async function signOut() {
  const admin = await getAdmin();
  if (admin.live) await admin.db.auth.signOut();
  redirect("/admin/login");
}
