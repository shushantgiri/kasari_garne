import type { TrialVehicleKind } from "@/lib/trial/course";
import { nepaliVoiceAccepted, speakNepali, stopNepali, unlockAudio } from "@/lib/assist/nepaliVoice";

/**
 * Sound for the simulator, made in the browser with Web Audio (no sound files to download): an engine
 * whose pitch follows speed and throttle, a short tyre/brake squeal when stopping hard, an indicator
 * tick, and a quiet outdoor background with the odd bird. All of it starts on the first tap, as phones require.
 */
export class TrialAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private oscA: OscillatorNode | null = null;
  private oscB: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private noise: AudioBuffer | null = null;
  private lastSquealAt = 0;
  private birdTimer: number | null = null;
  private muted = false;
  private kind: TrialVehicleKind = "car";

  /** Call from a tap or key press. */
  start(kind: TrialVehicleKind) {
    this.kind = kind;
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(ctx.destination);

    // White noise, reused for the squeal and the background.
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Engine: two detuned oscillators through a low-pass filter.
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 600;
    this.filter.Q.value = 3;
    this.oscA = ctx.createOscillator();
    this.oscA.type = "sawtooth";
    this.oscB = ctx.createOscillator();
    this.oscB.type = "square";
    this.oscA.connect(this.filter);
    this.oscB.connect(this.filter);
    this.filter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.oscA.start();
    this.oscB.start();

    // Background: quiet low wind.
    const amb = ctx.createBufferSource();
    amb.buffer = this.noise;
    amb.loop = true;
    const ambF = ctx.createBiquadFilter();
    ambF.type = "lowpass";
    ambF.frequency.value = 380;
    const ambG = ctx.createGain();
    ambG.gain.value = 0.05;
    amb.connect(ambF).connect(ambG).connect(this.master);
    amb.start();
    this.birdTimer = window.setInterval(() => Math.random() < 0.4 && this.bird(), 3500);
  }

  /** The simulator's sound as a stream, for recording a video with sound. */
  captureStream(): MediaStream | null {
    if (!this.ctx || !this.master) return null;
    const dest = this.ctx.createMediaStreamDestination();
    this.master.connect(dest);
    return dest.stream;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  /** Each frame: speed (m/s) and throttle 0–1; idling when stopped, silent when paused. */
  update(speed: number, throttle: number, running: boolean) {
    const ctx = this.ctx;
    if (!ctx || !this.oscA || !this.oscB || !this.engineGain || !this.filter) return;
    const t = ctx.currentTime;
    const bike = this.kind !== "car";
    // Idle around 800 rpm; the note rises with speed (first gear on a trial ground) and throttle.
    const idle = bike ? 46 : 32;
    const base = idle + Math.abs(speed) * (bike ? 16 : 11) + throttle * (bike ? 26 : 14);
    this.oscA.frequency.setTargetAtTime(base, t, 0.08);
    this.oscB.frequency.setTargetAtTime(base * 0.502, t, 0.08);
    this.filter.frequency.setTargetAtTime(380 + base * 7 + throttle * 600, t, 0.1);
    const vol = running ? (bike ? 0.07 : 0.05) + throttle * 0.05 : 0;
    this.engineGain.gain.setTargetAtTime(vol, t, 0.12);
  }

  /** Brake squeal, at most once a second, louder for harder braking (decel in m/s²). */
  brake(decel: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise || decel < 1.6) return;
    const now = ctx.currentTime;
    if (now - this.lastSquealAt < 1) return;
    this.lastSquealAt = now;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600;
    bp.Q.value = 9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(Math.min(0.12, 0.03 * decel), now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    src.connect(bp).connect(g).connect(this.master);
    src.start(now);
    src.stop(now + 0.5);
  }

  /** One indicator click. */
  tick() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = 1700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    o.connect(g).connect(this.master);
    o.start(now);
    o.stop(now + 0.04);
  }

  private bird() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const o = ctx.createOscillator();
      o.type = "sine";
      const t = now + i * 0.16;
      o.frequency.setValueAtTime(3200, t);
      o.frequency.exponentialRampToValueAtTime(4600, t + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.015, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.14);
    }
  }

  stop() {
    if (this.birdTimer) clearInterval(this.birdTimer);
    void this.ctx?.close();
    this.ctx = null;
  }
}

/**
 * Nepali voice guidance. Uses the site's own Nepali voice when the person has already downloaded it
 * (the same one the helper chat uses), otherwise the device's speech voice for Nepali or Hindi if it has
 * one. With neither, the subtitles still carry every line.
 */
export class NepaliVoiceGuide {
  private audio: HTMLAudioElement | null = null;
  enabled = true;

  /** Call during a tap so phones allow sound later. */
  unlock() {
    if (!this.audio) this.audio = new Audio();
    if (nepaliVoiceAccepted()) unlockAudio(this.audio);
  }

  /** Whether any Nepali-capable voice is available on this device. */
  static deviceVoice(): SpeechSynthesisVoice | null {
    if (typeof speechSynthesis === "undefined") return null;
    const voices = speechSynthesis.getVoices();
    return voices.find((v) => v.lang.toLowerCase().startsWith("ne")) ?? voices.find((v) => v.lang.toLowerCase().startsWith("hi")) ?? null;
  }

  say(text: string, rate = 1) {
    if (!this.enabled) return;
    this.cancel();
    if (nepaliVoiceAccepted() && this.audio) {
      speakNepali(text, this.audio).catch(() => {});
      return;
    }
    const v = NepaliVoiceGuide.deviceVoice();
    if (!v) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v;
    u.lang = v.lang;
    u.rate = Math.min(1.3, 0.95 * rate);
    speechSynthesis.speak(u);
  }

  cancel() {
    stopNepali(this.audio);
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }
}
