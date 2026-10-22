/**
 * Writes captions, chapter markers and the narration script for every guide:
 *   public/subtitles/<slug>.<locale>.vtt
 *   public/subtitles/<slug>.<locale>.chapters.vtt
 *   video/out/<slug>.<locale>.narration.txt   (for recording a human voice-over)
 *
 * These match the MP4s rendered by /video exactly, because both come from buildTutorial().
 * Run: npm run subtitles
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { buildTutorial, toTranscript, toVtt } from "../src/lib/video/script.ts";
import { drivingLicence } from "../src/lib/content/guides/driving-licence.ts";
import { passport } from "../src/lib/content/guides/passport.ts";
import { nationalId } from "../src/lib/content/guides/national-id.ts";

mkdirSync("public/subtitles", { recursive: true });
mkdirSync("video/out", { recursive: true });
for (const g of [drivingLicence, passport, nationalId]) {
  for (const locale of ["ne", "en"] as const) {
    const script = buildTutorial(g, locale);
    const { captions, chapters } = toVtt(script);
    writeFileSync(`public/subtitles/${g.slug}.${locale}.vtt`, captions);
    writeFileSync(`public/subtitles/${g.slug}.${locale}.chapters.vtt`, chapters);
    writeFileSync(`video/out/${g.slug}.${locale}.narration.txt`, toTranscript(script));
    console.log(`${g.slug}.${locale}: ${script.scenes.length} scenes, ${Math.round(script.totalMs / 1000)}s`);
  }
}
