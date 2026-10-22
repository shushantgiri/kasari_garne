/**
 * A real Nepali voice on every phone, for free.
 *
 * Many phones (all iPhones, many Androids) have no Nepali voice built in. When that happens we use
 * Piper, an open-source voice engine that runs inside the browser, with its Nepali voice
 * (ne_NP-google-medium, about 77 MB). It is downloaded once, only after the visitor agrees,
 * and kept in the browser's private storage. Only the voice files are downloaded; the answer
 * text never leaves the phone.
 */
const VOICE = "ne_NP-google-medium";
export const NEPALI_VOICE_MB = 77;
const STORE_KEY = "kg-ne-voice-m";

type Piper = typeof import("@mintplex-labs/piper-tts-web");
type Session = Awaited<ReturnType<Piper["TtsSession"]["create"]>>;
let lib: Promise<Piper> | null = null;
let session: Promise<Session> | null = null;
const load = () => (lib ??= import("@mintplex-labs/piper-tts-web"));

/** True when the visitor already agreed and downloaded the voice on this device. */
export function nepaliVoiceAccepted(): boolean {
  try {
    return localStorage.getItem(STORE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Download the voice (once). Progress is 0–100. */
export async function prepareNepaliVoice(onProgress?: (pct: number) => void): Promise<void> {
  const t = await load();
  session ??= t.TtsSession.create({
    voiceId: VOICE,
    progress: (p) => {
      if (p.total && p.url.endsWith(".onnx")) onProgress?.(Math.min(100, Math.round((p.loaded / p.total) * 100)));
    },
  });
  try {
    await session;
  } catch (e) {
    session = null;
    throw e;
  }
  try {
    localStorage.setItem(STORE_KEY, "1");
  } catch {}
}

/** Short pieces so the first words play quickly instead of waiting for the whole answer. */
export function splitForSpeech(text: string): string[] {
  return text
    .split(/(?<=[।?!.])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => /[ऀ-ॿ]/.test(s) || /\w/.test(s));
}

let playing = 0;

/** Stop whatever is being read. */
export function stopNepali(audio?: HTMLAudioElement | null) {
  playing++;
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
  }
}

/**
 * Read text aloud with the Piper Nepali voice through `audio` (an element unlocked by a tap,
 * so phones allow it to play). Each piece is made while the previous one plays.
 */
export async function speakNepali(text: string, audio: HTMLAudioElement): Promise<void> {
  const run = ++playing;
  await prepareNepaliVoice();
  const s = await session!;
  const parts = splitForSpeech(text);
  let next = parts.length ? s.predict(parts[0]) : null;
  for (let i = 0; i < parts.length && next; i++) {
    const blob = await next;
    if (run !== playing) return;
    next = i + 1 < parts.length ? s.predict(parts[i + 1]) : null;
    const url = URL.createObjectURL(blob);
    audio.src = url;
    await new Promise<void>((resolve) => {
      const done = () => {
        audio.removeEventListener("ended", done);
        audio.removeEventListener("error", done);
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.addEventListener("ended", done);
      audio.addEventListener("error", done);
      audio.play().catch(done);
    });
    if (run !== playing) return;
  }
}

/** A tiny silent clip played during a tap, so the phone lets this element play sound later. */
export function unlockAudio(audio: HTMLAudioElement) {
  try {
    audio.muted = true;
    audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    void audio.play().then(() => {
      audio.pause();
      audio.muted = false;
    }).catch(() => {
      audio.muted = false;
    });
  } catch {}
}
