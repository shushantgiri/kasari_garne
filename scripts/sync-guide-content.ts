/**
 * Adds the new purpose fields (and the simpler titles) from the bundled guides to the guides
 * already in Supabase, without overwriting anything edited in the admin.
 *
 *   npm run sync-guides            # preview only: shows what would change, writes nothing
 *   npm run sync-guides -- --apply # backs up the current rows to backups/, then updates them
 *
 * What it changes, per guide that exists in both places:
 *  - situations: purposes missing from the database guide are added (matched by id)
 *  - situationsGap: added when missing; the old licence note is removed when unchanged
 *  - documents: `for` tags added to the document with the same Nepali text, if it has none
 *  - steps: `for` / `bodyFor` added to the step with the same id, if it has none
 *  - question / intro: replaced only when the database still has the old bundled wording
 * It never touches status, published, sources, dates or any other field.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { drivingLicence } from "../src/lib/content/guides/driving-licence.ts";
import { passport } from "../src/lib/content/guides/passport.ts";
import { nationalId } from "../src/lib/content/guides/national-id.ts";
import type { Guide, Localized } from "../src/lib/content/types.ts";

/** The wording these guides shipped with before, so admin edits are recognised and kept. */
const PREVIOUS: Record<string, { question: Localized; intro: Localized }> = {
  passport: {
    question: { ne: "राहदानी बनाउन के चाहिन्छ र कसरी आवेदन दिने?", en: "What do I need for a passport, and how do I apply?" },
    intro: {
      ne: "पहिले अनलाइन फाराम भरेर भेट्ने मिति (appointment) लिनुहोस्। त्यसपछि तोकिएको दिन कार्यालयमा कागजात लिएर फोटो र औँठाछाप दिन जानुहोस्।",
      en: "First fill in the online form and book an appointment. Then go to the office on that day with your documents for photo and fingerprints.",
    },
  },
  "driving-licence": {
    question: { ne: "Driving Licence को फाराम कसरी भर्ने?", en: "How to apply for a driving licence online?" },
    intro: {
      ne: "नयाँ लाइसेन्स वा वर्ग थपका लागि पहिले अनलाइन फाराम भर्नुपर्छ। त्यसपछि तोकिएको दिन कार्यालय गएर विवरण रुजु र बायोमेट्रिक (औँठाछाप, फोटो) दिनुपर्छ।",
      en: "For a new licence or an added category, you first fill in the online form. Then you visit the office on your given date for document checks and biometrics (fingerprints, photo).",
    },
  },
};

const PREVIOUS_GAP: Record<string, Localized> = {
  "driving-licence": { ne: "नवीकरण वा हराएको लाइसेन्सको गाइड अझै तयार छैन।", en: "Renewal and lost-licence guides aren't ready yet." },
};

const same = (a?: Localized, b?: Localized) => !!a && !!b && a.ne === b.ne && (a.en ?? "") === (b.en ?? "");

function merge(db: Guide, seed: Guide): { data: Guide; changes: string[] } {
  const changes: string[] = [];
  const data: Guide = structuredClone(db);
  const prev = PREVIOUS[seed.slug];
  if (prev && same(db.question, prev.question) && !same(db.question, seed.question)) {
    data.question = seed.question;
    changes.push("title");
  }
  if (prev && same(db.intro, prev.intro) && !same(db.intro, seed.intro)) {
    data.intro = seed.intro;
    changes.push("intro");
  }
  // Purposes: add the ones the database doesn't have yet (matched by id); never touch edited ones.
  const have = new Set((db.situations ?? []).map((x) => x.id));
  const missing = (seed.situations ?? []).filter((x) => !have.has(x.id));
  if (missing.length) {
    data.situations = [...(db.situations ?? []), ...missing];
    changes.push(`purposes added (${missing.map((x) => x.id).join(", ")})`);
  }
  if (seed.situationsGap && !db.situationsGap) {
    data.situationsGap = seed.situationsGap;
    changes.push("not-covered note");
  }
  // The old "renewal and lost guides aren't ready" note is replaced by "coming soon" choices.
  if (!seed.situationsGap && db.situationsGap && same(db.situationsGap, PREVIOUS_GAP[seed.slug])) {
    delete data.situationsGap;
    changes.push("old not-covered note removed");
  }
  for (const sd of seed.documents) {
    if (!sd.for?.length) continue;
    const d = data.documents.find((x) => x.text.ne === sd.text.ne);
    if (d && !d.for?.length) {
      d.for = sd.for;
      changes.push(`document “${sd.text.en ?? sd.text.ne}” → ${sd.for.join(", ")}`);
    }
  }
  for (const ss of seed.steps) {
    const st = data.steps.find((x) => x.id === ss.id);
    if (!st) continue;
    if (ss.for?.length && !st.for?.length) {
      st.for = ss.for;
      changes.push(`step “${ss.id}” purposes`);
    }
    if (ss.bodyFor && !st.bodyFor) {
      st.bodyFor = ss.bodyFor;
      changes.push(`step “${ss.id}” wording per purpose`);
    }
  }
  return { data, changes };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (npm run sync-guides reads .env.local).");
  process.exit(1); // nothing is open yet, so exiting here is safe
}
const apply = process.argv.includes("--apply");
const db = createClient(url, key, { auth: { persistSession: false } });
const seeds = [drivingLicence, passport, nationalId];

const { data: rows, error } = await db.from("guides").select("slug,data").in("slug", seeds.map((g) => g.slug));
if (error) throw error;

const plan = seeds
  .map((seed) => {
    const row = rows?.find((r) => r.slug === seed.slug);
    if (!row) return { slug: seed.slug, missing: true as const };
    return { slug: seed.slug, missing: false as const, ...merge(row.data as Guide, seed) };
  });

for (const p of plan) {
  if (p.missing) console.log(`- ${p.slug}: not in the database (skipped; use npm run seed for new guides)`);
  else if (!p.changes.length) console.log(`- ${p.slug}: already up to date`);
  else console.log(`- ${p.slug}:\n    ${p.changes.join("\n    ")}`);
}

const todo = plan.filter((p) => !p.missing && p.changes.length);
if (!apply) {
  console.log(todo.length ? "\nPreview only. Nothing was written. Run with --apply to update." : "\nNothing to update.");
} else if (todo.length) {
  mkdirSync("backups", { recursive: true });
  const file = `backups/guides-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(rows, null, 2));
  console.log(`\nBacked up ${rows?.length ?? 0} rows to ${file}`);
  for (const p of todo) {
    if (p.missing) continue;
    const { error: e } = await db.from("guides").update({ data: p.data }).eq("slug", p.slug);
    if (e) throw e;
    console.log(`✓ updated ${p.slug}`);
  }
  console.log("Done. Reload the guide pages (they refresh within 5 minutes, or restart the dev server).");
}
