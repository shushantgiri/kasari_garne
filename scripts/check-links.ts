/**
 * Checks that every official link and source in the bundled guides still responds.
 * A working URL does NOT prove the instructions are still correct — it only
 * tells you which guides to open and re-check first.
 *
 * Run: node --experimental-strip-types scripts/check-links.ts
 * (Schedule it weekly, e.g. with a GitHub Action, and review failures.)
 */
import { drivingLicence } from "../src/lib/content/guides/driving-licence.ts";
import { passport } from "../src/lib/content/guides/passport.ts";
import { nationalId } from "../src/lib/content/guides/national-id.ts";
import { departments } from "../src/lib/content/departments.ts";

type Row = { guide: string; url: string; status: string };
const rows: Row[] = [];
const urls = new Map<string, string>();
for (const g of [drivingLicence, passport, nationalId]) {
  if (g.officialPortal) urls.set(g.officialPortal.url, g.slug);
  if (g.statusCheck) urls.set(g.statusCheck.url, g.slug);
  g.sources.forEach((s) => urls.set(s.url, g.slug));
}
departments.forEach((d) => urls.set(d.url, `dept:${d.id}`));

await Promise.all(
  [...urls].map(async ([url, guide]) => {
    try {
      const ctrl = AbortSignal.timeout(20000);
      let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl });
      if (res.status === 405 || res.status === 403) res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000) });
      rows.push({ guide, url, status: String(res.status) });
    } catch (e) {
      rows.push({ guide, url, status: `ERROR ${(e as Error).message}` });
    }
  }),
);

rows.sort((a, b) => a.guide.localeCompare(b.guide));
for (const r of rows) console.log(`${/^2|^3/.test(r.status) ? "ok " : "!! "} ${r.status.padEnd(6)} ${r.guide.padEnd(18)} ${r.url}`);
const bad = rows.filter((r) => !/^2|^3/.test(r.status));
if (bad.length) {
  console.log(`\n${bad.length} link(s) need attention. Re-check those guides and set them to "Needs update" if the process changed.`);
  process.exitCode = 1;
}
