# कसरी गर्ने? — Kasari Garne

**सरकारी काम, अब सजिलै।** · *Government services, made simple.*

A mobile-first, Nepali-first guide to Nepal government online services: short animated tutorials, step-by-step instructions, and a straight path to the official website. Kasari Garne is an independent information platform — not a government website, and no application is ever submitted here.

---

## What's in the box

| Area | What works today |
|---|---|
| **Homepage** | Hero search with live suggestions, popular service cards (with availability), how it works, recently checked guides, categories, request-a-guide, disclaimer. "Most-watched" and "frequently requested" appear only when there is real data. |
| **Search** | Nepali, English, Romanized Nepali and mixed queries (`license kasari bharne?`, `Police report कसरी निकाल्ने?`), spelling folding (लाइसेन्स/लाईसेन्स/laisens), typo tolerance. 22 tests in `src/lib/search/search.test.ts`. |
| **Guide page** | Status, last-checked date, process type (online / partly online / in person), official-site CTA, "Before you start" checklist (saved on the device only, printable), video with chapters/captions/transcript/speed, numbered steps with **यो बुझिनँ** help, prev/next, mistakes, finish & what-next, FAQ, feedback (**यो गाइड उपयोगी भयो?**), correction reports, sources marked official/unofficial, related guides. |
| **Tutorial player** | Live animation built from the guide's data (a few KB, works on 2G), or an approved MP4 with a low-data rendition and `.vtt` captions. Steps can jump the video to their chapter. Falls back to the animation if an MP4 fails. |
| **Video pipeline** | `video/` — Remotion project that renders the **same scene templates** (`src/components/video/SceneView.tsx`) to MP4 + a 360p copy. `npm run subtitles` writes matching captions, chapters and a narration script. |
| **Admin** (`/admin`) | Supabase-auth login; dashboard with status counts, re-check queue, unconfirmed-item counts; visual guide editor (bilingual fields, steps, demo screens, sources, review); media upload; video preview + reviewer approval; correction reports, feedback, requests; departments; revision history. |
| **Trust rules (enforced)** | A guide can't be **Verified** unless every item is confirmed on an official page, there's an official source and a check date — enforced in the editor, the save action and a database constraint/trigger. Only reviewers can verify or approve videos. Unconfirmed eligibility/documents/fees/times are **not shown**; visitors get a "check the official site" notice instead. |
| **Privacy** | No accounts for visitors, no IPs stored, no trackers. Messages that look like they contain citizenship/passport/mobile numbers, passwords or OTPs are refused. |
| **PWA** | Manifest, icons, a service worker that keeps visited pages available offline, offline banner. |
| **Accessibility** | Skip link, keyboard focus styles, screen-reader labels, live captions announced, text-size control (अ+), reduced-motion support, 44–48px tap targets. |

## The three example guides — and what is (not) verified

All three are **Under review**, checked against sources on **22 October 2026**. Each fact is tagged `official` (read on a government page) or `needs_review`. Details are in each guide's `reviewNotes`.

| Guide | Confirmed from official pages | Still needs an admin to confirm |
|---|---|---|
| Driving licence | Portal, age limits, documents to upload/carry, office visit days, quota/7 AM opening, 15-day rule after a missed visit, retrial rule, exam rules, cancellation rules (DoTM portal) | Screens for choosing category/office, OTP and print (from a news guide); fees |
| Passport | Where to apply, 10–30 day regular time, 2-day emergency service + NPR 7,000 / 12,000 surcharge, documents, citizenship-number rule, application types and form steps (DoP + Nepali embassies) | **Regular-service fee** (official page blocked automated reading; secondary sources disagree); in-Nepal screens |
| National ID | Portal links, NID Search, toll-free 1147, 16+ with citizenship | Login/OTP screens, documents, fee, SMS lookup (all from non-official guides) |

PAN, Police Clearance and Voter Registration appear as **"coming soon"** cards only; no procedure is published for them. Department URLs for IRD, Nepal Police and the Election Commission should be checked before those guides are written.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 → /ne
npm test             # search tests
npm run build        # production build
```

With no environment variables the site runs on the bundled content in `src/lib/content/` and `/admin` opens in **read-only demo mode** (the editor works; "Export JSON" saves your edits as a file).

## Connect Supabase

1. Create a Supabase project. In the SQL editor, run `supabase/migrations/0001_init.sql` (tables, RLS policies, triggers, `tutorials` storage bucket).
2. Copy `.env.example` to `.env.local` and fill in the URL, anon key and service-role key. **The service-role key is server-only** — it's used solely by server actions for public submissions.
3. Load the content: `npm run seed` (with the two env vars set).
4. Create your user in Supabase Auth, then make it an owner:
   ```sql
   insert into admins (user_id, display_name, role) values ('<auth user id>', 'Your name', 'owner');
   ```
   Roles: `editor` (edit, can't verify/approve), `reviewer` and `owner` (can verify guides and approve videos).
5. Sign in at `/admin/login`.

## Making videos

Every guide already has a tutorial: the website animates it live from the guide's steps and demo screens. To produce MP4s:

```bash
cd video && npm install
npm run studio                                   # preview and tweak in the browser
node scripts/render.mjs driving-licence ne       # → out/driving-licence.ne.mp4 + .360p.mp4
node scripts/render.mjs --guide ../my-guide.json en   # render a guide exported from the admin editor
cd .. && npm run subtitles                       # matching .vtt captions, chapters, narration script
```

Then in the admin editor → **Video**: upload the MP4, the 360p copy and the `.vtt` files, preview, and have a reviewer **Approve**. Until then the public keeps seeing the live animation.

- **Templates** (`SceneView.tsx`): title, document checklist, official portal, browser walkthrough, form-field demo with typing + cursor + click, warning, progress / what next, summary, source & check date. Each demo screen carries a permanent "नमूना — वास्तविक वेबसाइट होइन" label.
- **Narration**: record a human voice-over from the narration script and upload it (it plays in sync with the live animation, or pass `narration` to the Remotion props). If you try a local TTS engine (e.g. Piper), have a native speaker check pronunciation before publishing.
- **Screen recordings** of the real portal: use fictional data, never submit a real application, blur anything personal, and set each step's "starts at" time so chapters line up.
- Costs: the tools are open source, but hosting, storage, recording, voice work and review time still cost money and effort.

## Keeping guides honest

- `npm run check-links` — checks every portal and source URL. A working link doesn't prove the steps are still right; it tells you which guides to re-open first. Run weekly.
- The dashboard lists guides **due for a re-check** (past their re-check date, or sources older than 120 days).
- A correction report can flag a guide **Needs update** in one click; visitors immediately see a warning.

## Project structure

```
src/
  app/(site)/[locale]/     public pages: home, guide/[slug], guides, search, request, privacy, accessibility
  app/(admin)/admin/       dashboard, guide editor, reports, feedback, requests, departments, server actions
  app/actions.ts           public submissions (report, request, feedback, view count)
  components/              layout, home, guide, search, video (TutorialPlayer, SceneView), admin, ui
  lib/content/             types, departments, categories, guides (seed), repo (Supabase or seed)
  lib/search/              search engine + tests
  lib/video/script.ts      guide → scenes, timing, chapters, captions (shared by site, Remotion, scripts)
  lib/admin/               auth guard, validation rules
supabase/migrations/       schema + RLS
video/                     Remotion renderer
scripts/                   subtitles, link checker, Supabase seed
```

## Before launch — owner to-do

- Confirm every `needs_review` item on the live portals (the editor lists them per guide), then have a reviewer mark guides Verified.
- Capture real portal screenshots/recordings with fictional data where they're clearer than mockups.
- Have a native speaker review all Nepali text, and the English translations.
- Add a public contact email on the privacy page (marked `TODO(owner)`).
- Set `NEXT_PUBLIC_SITE_URL` for correct sitemap and social links.
- Test on a low-end Android phone on a slow connection.
