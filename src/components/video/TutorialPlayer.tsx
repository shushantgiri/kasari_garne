"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Captions, FileText, ListVideo, Pause, Play, RotateCcw, Wifi, WifiLow } from "lucide-react";
import type { Locale, VideoAsset } from "@/lib/content/types";
import { dict, tr } from "@/lib/i18n";
import { sceneAt, type TutorialScript } from "@/lib/video/script";
import { SceneView } from "./SceneView";
import { countView } from "@/app/actions";

const SPEEDS = [0.75, 1, 1.25, 1.5];

interface Props {
  locale: Locale;
  script: TutorialScript;
  video: VideoAsset;
}

/**
 * One player for both kinds of tutorial:
 *  - an approved MP4 (uploaded or rendered), with captions and a low-data option
 *  - otherwise, the same tutorial animated live from guide data (a few KB, works on slow connections)
 *
 * Steps elsewhere on the page can ask it to jump to their chapter by dispatching
 * `window.dispatchEvent(new CustomEvent("kg:seek", { detail: { stepId } }))`.
 */
export function TutorialPlayer({ locale, script, video }: Props) {
  const useFile = (video.kind === "uploaded" || video.kind === "generated") && !!video.src && video.review === "approved";
  return useFile ? <FilePlayer locale={locale} script={script} video={video} /> : <LivePlayer locale={locale} script={script} video={video} />;
}

/* ---------------- Shared bits ---------------- */

function useSeekListener(onSeek: (stepId: string) => void) {
  useEffect(() => {
    const h = (e: Event) => {
      const id = (e as CustomEvent<{ stepId: string }>).detail?.stepId;
      if (id) onSeek(id);
    };
    window.addEventListener("kg:seek", h);
    return () => window.removeEventListener("kg:seek", h);
  }, [onSeek]);
}

function fmt(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Slightly smaller on phones so the whole control bar fits on one line. */
function ControlButton({ label, onClick, pressed, className = "", children }: { label: string; onClick: () => void; pressed?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`grid h-10 min-w-10 shrink-0 place-items-center rounded-xl px-1.5 text-ink hover:bg-paper-warm sm:h-11 sm:min-w-11 sm:px-2 ${pressed ? "bg-sky-tint text-sky" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function ChaptersAndTranscript({
  locale,
  script,
  chapters,
  current,
  onJump,
  showChapters,
  showTranscript,
}: {
  locale: Locale;
  script: TutorialScript;
  chapters: { title: string; start: number }[];
  current: number;
  onJump: (ms: number) => void;
  showChapters: boolean;
  showTranscript: boolean;
}) {
  const ne = locale === "ne";
  return (
    <>
      {showChapters && (
        <nav aria-label={ne ? "अध्यायहरू" : "Chapters"} className="border-t border-paper-line p-2">
          <ol className="max-h-64 overflow-auto">
            {chapters.map((c, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onJump(c.start)}
                  aria-current={i === current ? "step" : undefined}
                  className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-[0.95rem] ${i === current ? "bg-brand-tint font-semibold text-brand-dark" : "hover:bg-paper-warm"}`}
                >
                  <span className="latin w-10 shrink-0 text-xs text-ink-faint">{fmt(c.start)}</span>
                  {c.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {showTranscript && (
        <div className="border-t border-paper-line p-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-faint">{ne ? "लिखित रूप (Transcript)" : "Transcript"}</h3>
          <div className="max-h-72 space-y-3 overflow-auto text-[0.95rem]">
            {script.scenes.map((s) => (
              <p key={s.id}>
                <button type="button" onClick={() => onJump(s.start)} className="latin mr-2 text-xs text-sky hover:underline">{fmt(s.start)}</button>
                {s.stepNumber ? <strong>{s.stepNumber}. {s.heading} — </strong> : <strong>{s.heading} — </strong>}
                {s.caption}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Live (animated from data) ---------------- */

function LivePlayer({ locale, script, video }: Props) {
  const t = dict(locale);
  const [ms, setMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [captions, setCaptions] = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const narration = video.narrationAudio?.[locale];

  const { scene, progress } = sceneAt(script, ms);
  const ended = ms >= script.totalMs;
  const chapterIdx = scene.chapter;

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      if (last.current != null) {
        const dt = (now - last.current) * speed;
        setMs((m) => {
          const n = m + dt;
          if (n >= script.totalMs) {
            setPlaying(false);
            return script.totalMs;
          }
          return n;
        });
      }
      last.current = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [playing, speed, script.totalMs]);

  // Keep optional recorded narration in step with the animation.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = speed;
    if (playing) a.play().catch(() => {});
    else a.pause();
  }, [playing, speed]);

  const seek = useCallback(
    (to: number) => {
      const v = Math.max(0, Math.min(script.totalMs, to));
      setMs(v);
      if (audioRef.current) audioRef.current.currentTime = v / 1000;
    },
    [script.totalMs],
  );

  useSeekListener(
    useCallback(
      (stepId: string) => {
        const c = script.chapters.find((x) => x.stepId === stepId);
        if (!c) return;
        seek(c.start);
        setPlaying(true);
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      [script.chapters, seek],
    ),
  );

  const counted = useRef(false);
  const toggle = () => {
    if (ended) seek(0);
    if (!counted.current) {
      counted.current = true;
      countView(script.slug).catch(() => {});
    }
    setPlaying((p) => !p);
  };

  // "kg:play": start this tutorial from the beginning (sent when someone picks their purpose).
  useEffect(() => {
    const h = () => {
      seek(0);
      if (!counted.current) {
        counted.current = true;
        countView(script.slug).catch(() => {});
      }
      setPlaying(true);
    };
    window.addEventListener("kg:play", h);
    return () => window.removeEventListener("kg:play", h);
  }, [seek, script.slug]);

  // "kg:pause": the player was hidden (e.g. someone switched to the written steps).
  useEffect(() => {
    const h = () => setPlaying(false);
    window.addEventListener("kg:pause", h);
    return () => window.removeEventListener("kg:pause", h);
  }, []);

  const labels = { step: t.step, demo: t.demoLabel, unconfirmed: t.needsReview, digits: locale };
  const ne = locale === "ne";

  return (
    <div ref={rootRef} className="card overflow-hidden">
      <div
        className="relative aspect-[4/3] w-full cursor-pointer select-none bg-paper-warm sm:aspect-video"
        onClick={toggle}
        role="group"
        aria-roledescription={ne ? "भिडियो" : "video"}
        aria-label={script.title}
      >
        <SceneView scene={scene} progress={progress} labels={labels} />

        {/* Thumbnail set in the admin, shown until the first play. */}
        {video.poster && !playing && ms === 0 && (
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded URL from any host; a plain img keeps it simple and lazy.
          <img src={video.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        )}

        {!playing && (
          <div className={`absolute inset-0 grid place-items-center ${video.poster && ms === 0 ? "bg-ink/20" : "bg-white/40"}`}>
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-white shadow-card sm:h-20 sm:w-20">
              {ended ? <RotateCcw className="h-8 w-8" aria-hidden="true" /> : <Play className="ml-1 h-8 w-8" aria-hidden="true" fill="currentColor" />}
            </span>
            <span className="sr-only">{ended ? t.replay : t.play}</span>
          </div>
        )}
      </div>

      {/* Captions sit under the picture so they never cover the demo screen. */}
      {captions && (
        <p className="min-h-[3.6rem] border-t border-paper-line bg-ink px-4 py-2.5 text-center text-[1.02rem] leading-snug text-white" aria-hidden="true">
          {(playing || ms > 0) && !ended ? scene.caption : <span className="text-white/60">{script.title}</span>}
        </p>
      )}
      {/* Screen readers get the caption text as it changes. */}
      <p className="sr-only" aria-live="polite">{playing ? `${scene.heading}. ${scene.caption}` : ""}</p>

      <div className="px-3 pt-2">
        <label className="sr-only" htmlFor={`seek-${script.slug}`}>{ne ? "भिडियोको समय" : "Video position"}</label>
        <input
          id={`seek-${script.slug}`}
          type="range"
          min={0}
          max={script.totalMs}
          step={100}
          value={ms}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-11 w-full cursor-pointer accent-brand"
          aria-valuetext={`${fmt(ms)} / ${fmt(script.totalMs)}`}
        />
      </div>

      <div className="flex items-center gap-0.5 px-1.5 pb-2 sm:gap-1 sm:px-2">
        <ControlButton label={playing ? t.pause : ended ? t.replay : t.play} onClick={toggle}>
          {playing ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
        </ControlButton>
        <ControlButton label={t.replay} onClick={() => { seek(0); setPlaying(true); }} className="hidden sm:grid">
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </ControlButton>
        <span className="latin min-w-0 truncate px-1 text-xs tabular-nums text-ink-soft sm:text-sm">{fmt(ms)} / {fmt(script.totalMs)}</span>
        <span className="flex-1" />
        <label className="sr-only" htmlFor={`speed-${script.slug}`}>{t.speed}</label>
        <select
          id={`speed-${script.slug}`}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="latin h-10 shrink-0 rounded-xl border border-paper-line bg-white px-1.5 text-sm sm:h-11 sm:px-2"
          title={t.speed}
        >
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
        <ControlButton label={t.subtitles} pressed={captions} onClick={() => setCaptions((c) => !c)}>
          <Captions className="h-5 w-5" aria-hidden="true" />
        </ControlButton>
        <ControlButton label={ne ? "अध्यायहरू" : "Chapters"} pressed={showChapters} onClick={() => setShowChapters((c) => !c)}>
          <ListVideo className="h-5 w-5" aria-hidden="true" />
        </ControlButton>
        <ControlButton label={ne ? "लिखित रूप" : "Transcript"} pressed={showTranscript} onClick={() => setShowTranscript((c) => !c)}>
          <FileText className="h-5 w-5" aria-hidden="true" />
        </ControlButton>
      </div>


      <ChaptersAndTranscript
        locale={locale}
        script={script}
        chapters={script.chapters}
        current={chapterIdx}
        onJump={(m) => { seek(m); setPlaying(true); }}
        showChapters={showChapters}
        showTranscript={showTranscript}
      />
      {narration && <audio ref={audioRef} src={narration} preload="none" />}
    </div>
  );
}

/* ---------------- MP4 ---------------- */

function FilePlayer({ locale, script, video }: Props) {
  const t = dict(locale);
  const ne = locale === "ne";
  const ref = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [lowData, setLowData] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const [failed, setFailed] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    // Default to the small file on slow or data-saver connections.
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (video.lowSrc && c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType ?? ""))) setLowData(true);
  }, [video.lowSrc]);

  const chapters = useMemo(
    () =>
      video.chapters?.length
        ? video.chapters.map((c) => ({ title: tr(c.title, locale), start: c.at * 1000, stepId: c.stepId }))
        : script.chapters.map((c) => ({ title: c.title, start: c.start, stepId: c.stepId })),
    [video.chapters, script.chapters, locale],
  );
  const current = Math.max(0, chapters.findLastIndex((c) => c.start <= time * 1000));

  const jump = useCallback((ms: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = ms / 1000;
    v.play().catch(() => {});
  }, []);

  useSeekListener(
    useCallback(
      (stepId: string) => {
        const c = chapters.find((x) => x.stepId === stepId);
        if (!c) return;
        jump(c.start);
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      [chapters, jump],
    ),
  );

  useEffect(() => {
    const h = () => jump(0);
    window.addEventListener("kg:play", h);
    return () => window.removeEventListener("kg:play", h);
  }, [jump]);

  useEffect(() => {
    const h = () => ref.current?.pause();
    window.addEventListener("kg:pause", h);
    return () => window.removeEventListener("kg:pause", h);
  }, []);

  const src = lowData && video.lowSrc ? video.lowSrc : video.src!;

  if (failed) {
    // Fall back to the live animation if the file can't play.
    return (
      <div>
        <p role="status" className="mb-2 rounded-xl bg-warn-tint px-4 py-2.5 text-sm text-warn">
          {ne ? "भिडियो चल्न सकेन। यसको सट्टा एनिमेसन देखाइएको छ।" : "The video couldn't play. Showing the animation instead."}
        </p>
        <LivePlayer locale={locale} script={script} video={video} />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="card overflow-hidden">
      <div className="relative">
      <video
        ref={ref}
        key={src}
        className="aspect-video w-full bg-ink"
        controls
        playsInline
        preload="metadata"
        poster={video.poster}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = speed;
          if (time) e.currentTarget.currentTime = time;
        }}
        onError={() => setFailed(true)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onPause={() => setBuffering(false)}
      >
        <source src={src} type="video/mp4" />
        {video.subtitles?.ne && <track kind="captions" src={video.subtitles.ne} srcLang="ne" label="नेपाली" default={locale === "ne"} />}
        {video.subtitles?.en && <track kind="captions" src={video.subtitles.en} srcLang="en" label="English" default={locale === "en"} />}
      </video>
      {buffering && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3" role="status">
          <span className="flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5 text-sm text-white">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
            {t.loading}
          </span>
        </div>
      )}
      </div>
      <div className="flex items-center gap-0.5 px-1.5 py-2 sm:gap-1 sm:px-2">
        <ControlButton label={t.replay} onClick={() => jump(0)}>
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </ControlButton>
        <label className="sr-only" htmlFor={`fspeed-${script.slug}`}>{t.speed}</label>
        <select
          id={`fspeed-${script.slug}`}
          value={speed}
          onChange={(e) => {
            const s = Number(e.target.value);
            setSpeed(s);
            if (ref.current) ref.current.playbackRate = s;
          }}
          className="latin h-10 shrink-0 rounded-xl border border-paper-line bg-white px-1.5 text-sm sm:h-11 sm:px-2"
        >
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
        {video.lowSrc && (
          <ControlButton label={t.lowData} pressed={lowData} onClick={() => setLowData((v) => !v)}>
            <span className="flex items-center gap-1 text-sm">{lowData ? <WifiLow className="h-5 w-5" aria-hidden="true" /> : <Wifi className="h-5 w-5" aria-hidden="true" />}<span className="hidden sm:inline">{t.lowData}</span></span>
          </ControlButton>
        )}
        <span className="flex-1" />
        <ControlButton label={ne ? "अध्यायहरू" : "Chapters"} pressed={showChapters} onClick={() => setShowChapters((c) => !c)}>
          <ListVideo className="h-5 w-5" aria-hidden="true" />
        </ControlButton>
        <ControlButton label={ne ? "लिखित रूप" : "Transcript"} pressed={showTranscript} onClick={() => setShowTranscript((c) => !c)}>
          <FileText className="h-5 w-5" aria-hidden="true" />
        </ControlButton>
      </div>
      <ChaptersAndTranscript
        locale={locale}
        script={script}
        chapters={chapters}
        current={current}
        onJump={jump}
        showChapters={showChapters}
        showTranscript={showTranscript}
      />
    </div>
  );
}
