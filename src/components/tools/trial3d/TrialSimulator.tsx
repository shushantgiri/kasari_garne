"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bike,
  Captions,
  Car,
  ChevronLeft,
  ChevronRight,
  Circle,
  Expand,
  Gamepad2,
  Pause,
  Play,
  RotateCcw,
  Shrink,
  Square,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Eye,
} from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { buildCourse, type Course, type TrialVehicleKind } from "@/lib/trial/course";
import { digits } from "@/lib/i18n";
import { buildWorld } from "./world";
import { buildVehicle } from "./vehicles";
import { applyFrame, CameraController, DemoDriver, PracticeDriver, type CameraMode, type DriveFrame, type PracticeInput, type PracticeNote } from "./controller";
import { NepaliVoiceGuide, TrialAudio } from "./audio";

/**
 * The trial in 3D: the course from the official trial map, with a car, motorcycle or scooter driving it
 * the way the examiners want to see — slow round the eight, a stop on each line, waiting for green, the
 * hill start, the reverse into the garage. Five camera views, Nepali subtitles and voice, engine sound,
 * and a practice mode to drive it yourself (keyboard or on-screen buttons) with notes when you touch a
 * line. Practice notes are feedback only; they are not the official marking.
 */

type Mode = "watch" | "practice";

const CAMERAS: { id: CameraMode; ne: string; en: string }[] = [
  { id: "follow", ne: "पछाडिबाट", en: "Follow" },
  { id: "overview", ne: "पूरा मैदान", en: "Overview" },
  { id: "top", ne: "माथिबाट", en: "Top" },
  { id: "side", ne: "छेउबाट", en: "Side" },
  { id: "driver", ne: "चालकको आँखा", en: "Driver" },
];

const VEHICLES: { id: TrialVehicleKind; ne: string; en: string; Icon: typeof Car }[] = [
  { id: "motorcycle", ne: "मोटरसाइकल", en: "Motorcycle", Icon: Bike },
  { id: "scooter", ne: "स्कुटर", en: "Scooter", Icon: Bike },
  { id: "car", ne: "कार / जिप", en: "Car / jeep", Icon: Car },
];

const SPEEDS = [0.5, 1, 2];

export default function TrialSimulator({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const ne = locale === "ne";
  const n = (v: number | string) => (ne ? digits(v as number, "ne") : String(v));

  const [kind, setKind] = useState<TrialVehicleKind>("motorcycle");
  const [mode, setMode] = useState<Mode>("watch");
  const [camera, setCamera] = useState<CameraMode>("follow");
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [voice, setVoice] = useState(true);
  const [subs, setSubs] = useState(true);
  const [subtitle, setSubtitle] = useState("");
  const [station, setStation] = useState(0);
  const [kmh, setKmh] = useState(0);
  const [finished, setFinished] = useState(false);
  const [notes, setNotes] = useState<PracticeNote[]>([]);
  const [tally, setTally] = useState({ line: 0, out: 0, feet: 0, red: false });
  const [lost, setLost] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [full, setFull] = useState(false);
  const [recording, setRecording] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  const cameraRef = useRef(camera);
  const inputRef = useRef<PracticeInput>({ throttle: 0, brake: 0, steer: 0 });
  const audioRef = useRef<TrialAudio | null>(null);
  const voiceRef = useRef<NepaliVoiceGuide | null>(null);
  const camCtlRef = useRef<CameraController | null>(null);
  const practiceRef = useRef<PracticeDriver | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const subTimer = useRef<number | null>(null);

  playingRef.current = playing;
  speedRef.current = speed;
  cameraRef.current = camera;

  if (!audioRef.current && typeof window !== "undefined") audioRef.current = new TrialAudio();
  if (!voiceRef.current && typeof window !== "undefined") voiceRef.current = new NepaliVoiceGuide();

  useEffect(() => {
    if (voiceRef.current) voiceRef.current.enabled = voice;
    if (!voice) voiceRef.current?.cancel();
  }, [voice]);
  useEffect(() => audioRef.current?.setMuted(muted), [muted]);
  useEffect(
    () => () => {
      audioRef.current?.stop();
      voiceRef.current?.cancel();
    },
    [],
  );

  const showSubtitle = useCallback((text: string) => {
    setSubtitle(text);
    voiceRef.current?.say(text, speedRef.current);
    if (subTimer.current) clearTimeout(subTimer.current);
    subTimer.current = window.setTimeout(() => setSubtitle(""), Math.max(3500, text.length * 110) / Math.max(1, speedRef.current));
  }, []);

  /* ---------- The scene: rebuilt when the vehicle, the mode or a restart changes ---------- */
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
    } catch {
      setWebgl(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "block h-full w-full touch-none";
    box.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;

    const c = buildCourse(kind);
    setCourse(c);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbcd7ec);
    scene.fog = new THREE.Fog(0xbcd7ec, 90, 240);
    const world = buildWorld(c);
    scene.add(world.group);
    const model = buildVehicle(kind);
    scene.add(model.root);

    // Daylight: soft sky light and a sun that casts shadows over the yard.
    scene.add(new THREE.HemisphereLight(0xdfefff, 0x6b7a52, 1.1));
    const sun = new THREE.DirectionalLight(0xfff2dc, 2.2);
    sun.position.set(world.center.x + 30, 45, world.center.z + 20);
    sun.target.position.copy(world.center);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const r = world.radius + 6;
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 140 });
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);

    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
    const camCtl = new CameraController(cam, world.center, world.radius);
    camCtlRef.current = camCtl;

    const resize = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    // Drivers.
    const demo = mode === "watch" ? new DemoDriver(c, model, showSubtitle) : null;
    const practice =
      mode === "practice"
        ? new PracticeDriver(c, model, (note) => {
            setNotes((ns) => [...ns.slice(-2), note]);
            window.setTimeout(() => setNotes((ns) => ns.filter((x) => x.id !== note.id)), 2600);
          })
        : null;
    practiceRef.current = practice;
    setFinished(false);
    setStation(0);
    setTally({ line: 0, out: 0, feet: 0, red: false });
    setLost(false);
    setNotes([]);
    setSubtitle("");

    let frame: DriveFrame | null = null;
    let raf = 0;
    let last = performance.now();
    let clock = 0;
    let hudAt = 0;
    let lastStation = -1;
    let lastBlink = false;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(box);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const real = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      const run = playingRef.current;
      const dt = run ? real * (demo ? speedRef.current : 1) : 0;
      clock += dt;

      // Sub-steps keep the motion smooth at 2× speed.
      if (run || !frame) {
        const steps = Math.max(1, Math.ceil(dt / 0.02));
        for (let i = 0; i < steps; i++) {
          frame = demo ? demo.update(dt / steps) : practice!.update(dt / steps, inputRef.current);
        }
      }
      const f = frame!;
      applyFrame(model, f, dt, clock);
      world.setLight(f.light);
      camCtl.update(cameraRef.current, model, f, real);
      renderer.render(scene, cam);

      // Sound: engine follows speed; squeal on hard braking; indicator ticks.
      const audio = audioRef.current;
      audio?.update(f.speed, f.throttle, run);
      if (run && f.accel < -1.6) audio?.brake(-f.accel);
      const blink = f.indicator !== 0 && Math.floor(clock * 2.6) % 2 === 0;
      if (run && blink !== lastBlink && f.indicator !== 0) audio?.tick();
      lastBlink = blink;

      // The screen: station, speed (a few times a second), the end.
      const st = c.stations.findIndex((s) => f.s >= s.from && f.s < s.to);
      const idx = st < 0 ? c.stations.length - 1 : st;
      if (idx !== lastStation) {
        lastStation = idx;
        setStation(idx);
      }
      if (now - hudAt > 250) {
        hudAt = now;
        setKmh(Math.round(Math.abs(f.speed) * 3.6));
        if (demo?.finished) setFinished(true);
        if (practice) {
          setTally({ line: practice.lineTouches, out: practice.outOfLane, feet: practice.feet, red: practice.redLight });
          setLost(practice.lost);
          if (practice.finished) setFinished(true);
        }
      }
    };
    raf = requestAnimationFrame(loop);

    // Drag to turn the overview.
    let dragX: number | null = null;
    const down = (e: PointerEvent) => (dragX = e.clientX);
    const move = (e: PointerEvent) => {
      if (dragX === null || cameraRef.current !== "overview") return;
      camCtl.orbit -= (e.clientX - dragX) * 0.008;
      dragX = e.clientX;
    };
    const up = () => (dragX = null);
    renderer.domElement.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.domElement.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      voiceRef.current?.cancel();
      world.dispose();
      model.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      practiceRef.current = null;
    };
  }, [kind, mode, runKey, showSubtitle]);

  /* ---------- Keyboard driving in practice ---------- */
  useEffect(() => {
    if (mode !== "practice") return;
    const keys = new Set<string>();
    const sync = () => {
      const i = inputRef.current;
      i.throttle = keys.has("ArrowUp") || keys.has("w") ? 1 : 0;
      i.brake = keys.has("ArrowDown") || keys.has("s") ? 1 : 0;
      i.steer = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
    };
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(k)) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
      keys.add(k);
      sync();
      if (!playingRef.current) begin();
    };
    const onUp = (e: KeyboardEvent) => {
      keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      sync();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      inputRef.current = { throttle: 0, brake: 0, steer: 0 };
    };
    // begin is stable enough for this listener; it only reads refs and setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /** Start (or resume): sound and voice can only begin from a tap or key press. */
  const begin = () => {
    audioRef.current?.start(kind);
    voiceRef.current?.unlock();
    setStarted(true);
    setPlaying(true);
  };

  const restart = () => {
    setRunKey((k) => k + 1);
    camCtlRef.current?.jump();
    setPlaying(true);
    setStarted(true);
    audioRef.current?.start(kind);
  };

  const switchTo = (k: TrialVehicleKind) => {
    if (k === kind) return;
    setKind(k);
    setPlaying(false);
    setStarted(false);
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setPlaying(false);
    setStarted(false);
    if (m === "practice" && camera === "overview") setCamera("follow");
  };

  const toggleFull = async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // Some phones (iPhone) don't allow it on page elements; the page layout still works.
    }
  };
  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  /** Record the 3D view as a video (MP4 where the browser can make it, otherwise WebM) and download it. */
  const toggleRecord = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === "undefined") return;
    const stream = canvas.captureStream(30);
    audioRef.current?.start(kind);
    audioRef.current?.captureStream()?.getAudioTracks().forEach((t) => stream.addTrack(t));
    const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
    const type = types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
    const rec = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 6_000_000 } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      recorderRef.current = null;
      setRecording(false);
      const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `trial-${kind}.${(rec.mimeType || "").includes("mp4") ? "mp4" : "webm"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    rec.start(500);
    recorderRef.current = rec;
    setRecording(true);
    if (!playingRef.current) begin();
  };
  useEffect(() => () => recorderRef.current?.stop(), []);

  /** Hold-to-press buttons for touch driving. */
  const hold = (apply: (on: boolean) => void) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      apply(true);
      if (!playingRef.current) begin();
    },
    onPointerUp: () => apply(false),
    onPointerCancel: () => apply(false),
    onLostPointerCapture: () => apply(false),
  });

  const stations = course?.stations ?? [];
  const canRecord = typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && "captureStream" in HTMLCanvasElement.prototype;
  const chip = (on: boolean) =>
    `inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${on ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-paper-line hover:text-ink"}`;
  const iconBtn = "grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/60";

  return (
    <div ref={shellRef} className={`animate-fade ${full ? "flex h-full flex-col overflow-auto bg-paper p-3" : ""}`}>
      {/* Title row. */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} aria-label={ne ? "अभ्यासमा फर्कनुहोस्" : "Back to practice"} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-warm hover:text-ink">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h2 className="min-w-0 flex-1 text-xl font-bold text-ink">{ne ? "३D ट्रायल" : "3D trial"}</h2>
        <button type="button" onClick={toggleFull} aria-label={full ? (ne ? "सानो बनाउनुहोस्" : "Exit full screen") : ne ? "पूरा स्क्रिन" : "Full screen"} className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-warm hover:text-ink">
          {full ? <Shrink className="h-5 w-5" aria-hidden="true" /> : <Expand className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Vehicle and mode. */}
      <div className="mt-3 flex rounded-xl bg-paper-warm p-1" role="tablist" aria-label={ne ? "सवारी" : "Vehicle"}>
        {VEHICLES.map(({ id, ne: l, en, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={kind === id}
            onClick={() => switchTo(id)}
            className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-1 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${kind === id ? "bg-white text-ink shadow-[0_1px_3px_rgba(27,34,48,.12)]" : "text-ink-soft hover:text-ink"}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{ne ? l : en}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {([
          ["watch", Eye, ne ? "हेर्नुहोस्" : "Watch"],
          ["practice", Gamepad2, ne ? "आफैँ चलाउनुहोस्" : "Drive it yourself"],
        ] as const).map(([m, Icon, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            aria-pressed={mode === m}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${mode === m ? "bg-brand text-white" : "bg-white text-ink-soft ring-1 ring-paper-line hover:text-ink"}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* The 3D view with its overlays. */}
      <div className={`relative mt-3 overflow-hidden rounded-3xl bg-[#bcd7ec] ${full ? "min-h-[60vh] flex-1" : "aspect-[4/5] sm:aspect-video"}`}>
        <div ref={boxRef} className="absolute inset-0" />

        {!webgl && (
          <div className="absolute inset-0 grid place-items-center bg-paper-warm p-6 text-center text-ink-soft">
            {ne ? "यो उपकरणमा ३D देखाउन सकिएन। अर्को ब्राउजरमा खोल्नुहोस्।" : "This device can't show 3D. Try another browser."}
          </div>
        )}

        {/* Top: where on the course, the speed, sound and voice. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-col gap-1.5">
            {stations[station] && (
              <span className="rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                {n(station + 1)}/{n(stations.length)} · {stations[station].name}
              </span>
            )}
            <span className="w-fit rounded-full bg-black/45 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">
              {n(kmh)} {ne ? "कि.मि./घण्टा" : "km/h"}
            </span>
          </div>
          <div className="pointer-events-auto flex gap-1.5">
            <button type="button" onClick={() => setMuted((m) => !m)} aria-pressed={!muted} aria-label={muted ? (ne ? "आवाज खोल्नुहोस्" : "Sound on") : ne ? "आवाज बन्द" : "Mute"} className={iconBtn}>
              {muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => setVoice((v) => !v)} aria-pressed={voice} aria-label={ne ? "नेपाली बोली" : "Nepali voice"} className={iconBtn}>
              {voice ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => setSubs((v) => !v)} aria-pressed={subs} aria-label={ne ? "उपशीर्षक" : "Subtitles"} className={`${iconBtn} ${subs ? "" : "opacity-60"}`}>
              <Captions className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Practice notes. */}
        {mode === "practice" && notes.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-1.5 px-3">
            {notes.map((nt) => (
              <span key={nt.id} className={`animate-pop rounded-full px-3.5 py-1.5 text-sm font-semibold text-white shadow ${nt.kind === "ok" ? "bg-ok" : "bg-warn"}`}>
                {nt.text}
              </span>
            ))}
          </div>
        )}

        {/* Subtitle. */}
        {subs && subtitle && mode === "watch" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
            <p lang="ne" className="max-w-xl animate-rise rounded-2xl bg-black/70 px-4 py-2.5 text-center text-[1.02rem] font-medium leading-relaxed text-white backdrop-blur">
              {subtitle}
            </p>
          </div>
        )}

        {/* On-screen driving buttons. */}
        {mode === "practice" && started && (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 select-none">
            <div className="flex gap-2">
              <button type="button" aria-label={ne ? "बायाँ" : "Left"} className="grid h-16 w-16 touch-none place-items-center rounded-2xl bg-black/45 text-white backdrop-blur active:bg-black/70" {...hold((on) => (inputRef.current.steer = on ? -1 : 0))}>
                <ChevronLeft className="h-8 w-8" aria-hidden="true" />
              </button>
              <button type="button" aria-label={ne ? "दायाँ" : "Right"} className="grid h-16 w-16 touch-none place-items-center rounded-2xl bg-black/45 text-white backdrop-blur active:bg-black/70" {...hold((on) => (inputRef.current.steer = on ? 1 : 0))}>
                <ChevronRight className="h-8 w-8" aria-hidden="true" />
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" aria-label={ne ? "ब्रेक / पछाडि" : "Brake / reverse"} className="grid h-16 w-16 touch-none place-items-center rounded-2xl bg-brand/80 text-white backdrop-blur active:bg-brand" {...hold((on) => (inputRef.current.brake = on ? 1 : 0))}>
                <ArrowDown className="h-7 w-7" aria-hidden="true" />
              </button>
              <button type="button" aria-label={ne ? "अगाडि" : "Accelerate"} className="grid h-16 w-16 touch-none place-items-center rounded-2xl bg-ok/85 text-white backdrop-blur active:bg-ok" {...hold((on) => (inputRef.current.throttle = on ? 1 : 0))}>
                <ArrowUp className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {mode === "practice" && lost && (
          <div className="absolute inset-0 grid place-items-center bg-black/30">
            <button type="button" onClick={() => practiceRef.current?.recover()} className="btn-primary min-h-[48px] px-5">
              {ne ? "मार्गमा फर्कनुहोस्" : "Back onto the route"}
            </button>
          </div>
        )}

        {/* Start, and the end. */}
        {(!started || finished) && webgl && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/50 via-black/10 to-transparent">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <button
                type="button"
                onClick={finished ? restart : begin}
                aria-label={finished ? (ne ? "फेरि" : "Again") : ne ? "सुरु गर्नुहोस्" : "Start"}
                className="grid h-20 w-20 place-items-center rounded-full bg-white text-ink shadow-xl transition-transform active:scale-95"
              >
                {finished ? <RotateCcw className="h-8 w-8" aria-hidden="true" /> : <Play className="ml-1 h-9 w-9" aria-hidden="true" />}
              </button>
              <p className="rounded-full bg-black/55 px-4 py-1.5 text-sm font-semibold text-white">
                {finished
                  ? ne
                    ? "ट्रायल पूरा भयो — फेरि हेर्नुहोस्"
                    : "Trial finished — play again"
                  : mode === "watch"
                    ? ne
                      ? "पूरा ट्रायल हेर्नुहोस्"
                      : "Watch the whole trial"
                    : ne
                      ? "↑ अगाडि · ↓ ब्रेक · ← → स्टेयरिङ"
                      : "↑ go · ↓ brake · ← → steer"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress along the stations. */}
      {stations.length > 0 && (
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {stations.map((s, i) => (
            <span key={s.name + i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < station ? "bg-ok" : i === station ? "bg-brand" : "bg-paper-line"}`} />
          ))}
        </div>
      )}

      {/* Playback and camera. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {mode === "watch" && (
          <button
            type="button"
            onClick={() => (playing ? setPlaying(false) : begin())}
            aria-label={playing ? (ne ? "रोक्नुहोस्" : "Pause") : ne ? "चलाउनुहोस्" : "Play"}
            className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white"
          >
            {playing ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />}
          </button>
        )}
        <button type="button" onClick={restart} aria-label={ne ? "सुरुदेखि" : "Restart"} className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink ring-1 ring-paper-line">
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>
        {mode === "watch" && (
          <div className="flex rounded-full bg-paper-warm p-1" role="group" aria-label={ne ? "गति" : "Speed"}>
            {SPEEDS.map((sp) => (
              <button key={sp} type="button" onClick={() => setSpeed(sp)} aria-pressed={speed === sp} className={`min-h-[34px] rounded-full px-3 text-sm font-semibold tabular-nums ${speed === sp ? "bg-white text-ink shadow-sm" : "text-ink-soft"}`}>
                {ne ? `${sp === 0.5 ? "०.५" : n(sp)}×` : `${sp}×`}
              </button>
            ))}
          </div>
        )}
        {canRecord && (
          <button type="button" onClick={toggleRecord} aria-pressed={recording} className={`ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-semibold ${recording ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-paper-line"}`}>
            {recording ? <Square className="h-4 w-4 fill-current" aria-hidden="true" /> : <Circle className="h-4 w-4 fill-brand text-brand" aria-hidden="true" />}
            {recording ? (ne ? "रोकेर सेभ" : "Stop & save") : ne ? "भिडियो" : "Video"}
          </button>
        )}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label={ne ? "क्यामेरा" : "Camera"}>
        {CAMERAS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCamera(c.id)} aria-pressed={camera === c.id} className={chip(camera === c.id)}>
            {ne ? c.ne : c.en}
          </button>
        ))}
      </div>

      {/* Practice: what happened so far. */}
      {mode === "practice" && started && (
        <div className="mt-3 rounded-2xl border border-paper-line bg-white p-4">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {[
              [ne ? "रेखा छोएको" : "Line touches", n(tally.line)],
              [ne ? "लेनबाहिर" : "Out of lane", n(tally.out)],
              ...(kind === "car" ? [] : [[ne ? "खुट्टा राखेको" : "Foot down", n(tally.feet)]]),
              [ne ? "रातो बत्ती" : "Red light", tally.red ? (ne ? "नाघ्यो" : "Crossed") : ne ? "ठीक" : "OK"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-paper-warm px-3 py-2">
                <p className="text-ink-faint">{label}</p>
                <p className="text-lg font-bold tabular-nums text-ink">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-faint">{ne ? "अभ्यासका लागि मात्र — यो कार्यालयको आधिकारिक नतिजा होइन।" : "Practice feedback only — not the office's official result."}</p>
        </div>
      )}
    </div>
  );
}
