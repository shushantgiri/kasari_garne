import "server-only";
import { cache } from "react";
import type { Department, Guide } from "./types";
import { departments as seedDepartments } from "./departments";
import { drivingLicence } from "./guides/driving-licence";
import { passport } from "./guides/passport";
import { nationalId } from "./guides/national-id";
import { drafts } from "./guides/drafts";
import { supabasePublic, supabaseServer } from "../supabase/server";

/** Bundled content: used as-is without Supabase, and as the seed for the database. */
export const seedGuides: Guide[] = [drivingLicence, passport, nationalId, ...drafts];
export { seedDepartments };

interface GuideRow {
  slug: string;
  data: Guide;
  status: Guide["status"];
  published: boolean;
  last_checked: string | null;
  updated_at: string;
  views: number | null;
}

function fromRow(r: GuideRow): Guide {
  return {
    ...r.data,
    slug: r.slug,
    status: r.status,
    published: r.published,
    lastChecked: r.last_checked ?? r.data.lastChecked,
    updatedAt: r.updated_at?.slice(0, 10) ?? r.data.updatedAt,
    views: r.views ?? undefined,
  };
}

/**
 * All guides the public may see: published guides plus unpublished drafts
 * (drafts only ever render as "coming soon" cards, never with steps).
 */
export const getGuides = cache(async (): Promise<Guide[]> => {
  const db = supabasePublic();
  if (!db) return seedGuides;
  const { data, error } = await db
    .from("guides")
    .select("slug,data,status,published,last_checked,updated_at,views")
    .order("updated_at", { ascending: false });
  if (error || !data) {
    console.error("[repo] falling back to seed content:", error?.message);
    return seedGuides;
  }
  if (data.length === 0) {
    // Connected but empty — most often supabase/seed.sql hasn't been run yet.
    // Keep the public site useful instead of showing blank sections.
    console.warn("[repo] Supabase 'guides' table is empty — showing bundled content. Run supabase/seed.sql in the SQL Editor.");
    return seedGuides;
  }
  // RLS lets anonymous visitors read rows that are published or flagged coming_soon.
  return (data as GuideRow[]).map(fromRow);
});

export const getGuide = cache(async (slug: string): Promise<Guide | undefined> => {
  return (await getGuides()).find((g) => g.slug === slug);
});

export const getDepartments = cache(async (): Promise<Department[]> => {
  const db = supabasePublic();
  if (!db) return seedDepartments;
  const { data, error } = await db.from("departments").select("id,name,short,url").order("id");
  if (error || !data?.length) return seedDepartments;
  return data as Department[];
});

/** Admin reads: every guide with full data, through the signed-in session. */
export async function getGuidesForAdmin(): Promise<{ guides: Guide[]; live: boolean; problem?: string }> {
  const db = await supabaseServer();
  if (!db) return { guides: seedGuides, live: false };
  const { data, error } = await db
    .from("guides")
    .select("slug,data,status,published,last_checked,updated_at,views")
    .order("updated_at", { ascending: false });
  if (error || !data) {
    return { guides: seedGuides, live: false, problem: `Couldn't read the guides table: ${error?.message ?? "no data"}. Has supabase/migrations/0001_init.sql been run?` };
  }
  if (data.length === 0) {
    return { guides: [], live: true, problem: "The guides table is empty, so the public site is showing the bundled content. Run supabase/seed.sql in the Supabase SQL Editor." };
  }
  return { guides: (data as GuideRow[]).map(fromRow), live: true };
}

/** Services people asked for most (real submissions only; empty without a database). */
export const getTopRequests = cache(async (): Promise<{ service: string; count: number }[]> => {
  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db.rpc("top_requests", { max_rows: 6 });
  if (error || !data) return [];
  return data as { service: string; count: number }[];
});