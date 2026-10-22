/**
 * Loads the bundled departments and guides into Supabase (upsert).
 * Run once after applying supabase/migrations/0001_init.sql:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node --experimental-strip-types scripts/seed-supabase.ts
 */
import { createClient } from "@supabase/supabase-js";
import { departments } from "../src/lib/content/departments.ts";
import { drivingLicence } from "../src/lib/content/guides/driving-licence.ts";
import { passport } from "../src/lib/content/guides/passport.ts";
import { nationalId } from "../src/lib/content/guides/national-id.ts";
import { drafts } from "../src/lib/content/guides/drafts.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const d = await db.from("departments").upsert(departments);
if (d.error) throw d.error;

for (const g of [drivingLicence, passport, nationalId, ...drafts]) {
  const { error } = await db.from("guides").upsert({
    slug: g.slug,
    department_id: g.departmentId,
    status: g.status,
    published: g.published,
    coming_soon: !g.published && g.status === "draft" && !!g.popular,
    data: g,
    last_checked: g.lastChecked || null,
    recheck_by: g.recheckBy ?? null,
    video_review: g.video.review ?? "pending",
  });
  if (error) throw error;
  console.log(`✓ ${g.slug}`);
}
console.log("Done. Now add yourself as an admin: insert into admins (user_id, display_name, role) values ('<auth user id>', 'Your name', 'owner');");
