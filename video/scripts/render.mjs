#!/usr/bin/env node
/**
 * Render tutorials to MP4 (+ a low-data 360p copy and .vtt captions).
 *
 *   node scripts/render.mjs driving-licence ne
 *   node scripts/render.mjs --all
 *   node scripts/render.mjs --guide ../exported/passport.json en
 *
 * Needs: this folder's npm install. FFmpeg ships with Remotion.
 * Set BROWSER=/path/to/chrome (and CHROME_MODE=headless-shell if needed) to use a specific Chromium.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const out = path.resolve("out");
mkdirSync(out, { recursive: true });
const browser = [
  ...(process.env.BROWSER ? ["--browser-executable", process.env.BROWSER] : []),
  ...(process.env.CHROME_MODE ? [`--chrome-mode=${process.env.CHROME_MODE}`] : []),
];
const remotion = path.resolve("node_modules/.bin/remotion");

function render(props, name) {
  const mp4 = path.join(out, `${name}.mp4`);
  const propsFile = path.join(out, `${name}.props.json`);
  writeFileSync(propsFile, JSON.stringify(props));
  console.log(`\n▶ ${name}`);
  execFileSync(remotion, ["render", "src/index.ts", "Tutorial", mp4, `--props=${propsFile}`, ...browser], { stdio: "inherit" });
  // Low-data copy: 360p, small bitrate, fast start for streaming.
  const low = path.join(out, `${name}.360p.mp4`);
  execFileSync(remotion, ["ffmpeg", "-y", "-i", mp4, "-vf", "scale=-2:360", "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-movflags", "+faststart", "-an", low], { stdio: "inherit" });
  console.log(`  ✓ ${mp4}\n  ✓ ${low}`);
}

if (args[0] === "--guide") {
  const guide = JSON.parse(readFileSync(args[1], "utf8"));
  const locale = args[2] ?? "ne";
  render({ slug: guide.slug, locale, guide }, `${guide.slug}.${locale}`);
} else if (args[0] === "--all") {
  for (const slug of ["driving-licence", "passport", "national-id"]) for (const locale of ["ne", "en"]) render({ slug, locale }, `${slug}.${locale}`);
} else {
  const [slug = "driving-licence", locale = "ne"] = args;
  render({ slug, locale }, `${slug}.${locale}`);
}
console.log("\nCaptions: run `npm run subtitles` in the project root to write matching .vtt files.");
