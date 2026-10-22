import { AbsoluteFill, Audio, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Guide, Locale } from "@/lib/content/types";
import { buildTutorial, sceneAt } from "@/lib/video/script";
import { SceneView } from "@/components/video/SceneView";

export const FPS = 30;

export interface TutorialProps {
  slug: string;
  locale: Locale;
  /** A full guide (e.g. exported from the admin editor); overrides slug. */
  guide?: Guide;
  /** Recorded narration file (public URL or path in /public). */
  narration?: string;
  /** Burn captions into the picture. Off by default — the site uses a .vtt track instead. */
  burnCaptions?: boolean;
}

const LABELS = {
  ne: { step: "चरण", demo: "नमूना — वास्तविक वेबसाइट होइन", unconfirmed: "पुष्टि हुन बाँकी", digits: "ne" as const },
  en: { step: "Step", demo: "Demo — not the real website", unconfirmed: "Not yet confirmed", digits: "en" as const },
};

export function Tutorial({ guide, locale, narration, burnCaptions }: TutorialProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!guide) return null;
  const script = buildTutorial(guide, locale);
  const ms = (frame / fps) * 1000;
  const { scene, progress, index } = sceneAt(script, ms);
  // Short cross-fade at scene edges.
  const fade = interpolate(ms - scene.start, [0, 250], [0, 1], { extrapolateRight: "clamp" });
  const chapters = script.chapters.length;

  return (
    <AbsoluteFill style={{ background: "#FAF8F5", fontFamily: "Mukta, Poppins, sans-serif" }}>
      <AbsoluteFill style={{ opacity: index === 0 ? 1 : fade }}>
        <SceneView scene={scene} progress={progress} labels={LABELS[locale]} />
      </AbsoluteFill>
      {/* Progress indicator */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, background: "#E7E3DC" }}>
        <div style={{ height: "100%", width: `${(ms / script.totalMs) * 100}%`, background: "#B4232C" }} />
      </div>
      <div style={{ position: "absolute", right: 28, top: 22, fontSize: 18, color: "#7A8291" }}>
        कसरी गर्ने? · {scene.chapter + 1}/{chapters}
      </div>
      {burnCaptions && (
        <div style={{ position: "absolute", left: 80, right: 80, bottom: 36, textAlign: "center" }}>
          <span style={{ background: "rgba(27,34,48,.88)", color: "#fff", fontSize: 30, lineHeight: 1.4, padding: "8px 18px", borderRadius: 10, display: "inline-block" }}>{scene.caption}</span>
        </div>
      )}
      {narration && <Audio src={narration} />}
    </AbsoluteFill>
  );
}
