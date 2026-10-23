import { NEPALI_WORDS } from "./nepaliWords.ts";

/**
 * Romanised Nepali → Devanagari, in the scheme the common "Nepali unicode" converters use:
 * "a" is the inherent vowel, "aa" gives ा, "ee"/"ii" ी, "oo"/"uu" ू, capitals T D N for ट ड ण.
 * Two consonants together join ("ramro" → राम्रो); a consonant at the end of a word keeps
 * its inherent vowel ("ram" → राम). Anything that isn't Roman text passes through unchanged.
 */

/** Consonants, longest first so "chh" wins over "ch" and "c". */
const CONSONANTS: [string, string][] = [
  ["ksh", "क्ष"], ["chh", "छ"], ["gy", "ज्ञ"], ["NG", "ङ"],
  ["kh", "ख"], ["gh", "घ"], ["ch", "च"], ["jh", "झ"], ["Th", "ठ"], ["Dh", "ढ"], ["th", "थ"], ["dh", "ध"],
  ["ph", "फ"], ["bh", "भ"], ["Sh", "ष"], ["sh", "श"],
  ["k", "क"], ["g", "ग"], ["c", "च"], ["j", "ज"], ["T", "ट"], ["D", "ड"], ["N", "ण"], ["t", "त"], ["d", "द"],
  ["n", "न"], ["p", "प"], ["f", "फ"], ["b", "ब"], ["m", "म"], ["y", "य"], ["r", "र"], ["l", "ल"], ["w", "व"],
  ["v", "व"], ["s", "स"], ["h", "ह"], ["z", "ज"], ["q", "क"], ["x", "क्स"],
];

/** Vowels: [Roman, on its own, as a sign after a consonant]. */
const VOWELS: [string, string, string][] = [
  ["aa", "आ", "ा"], ["ai", "ऐ", "ै"], ["au", "औ", "ौ"], ["ou", "औ", "ौ"], ["ee", "ई", "ी"], ["ii", "ई", "ी"],
  ["oo", "ऊ", "ू"], ["uu", "ऊ", "ू"],
  ["A", "आ", "ा"], ["I", "ई", "ी"], ["U", "ऊ", "ू"], ["E", "ऐ", "ै"], ["O", "औ", "ौ"],
  ["a", "अ", ""], ["i", "इ", "ि"], ["u", "उ", "ु"], ["e", "ए", "े"], ["o", "ओ", "ो"],
];

/** Signs that follow a vowel: ~ for chandrabindu, M for anusvara, H for visarga. */
const SIGNS: Record<string, string> = { "~": "ँ", M: "ं", H: "ः" };

const DIGITS = "०१२३४५६७८९";

function match<T extends [string, ...string[]]>(list: T[], word: string, at: number): T | undefined {
  return list.find(([roman]) => word.startsWith(roman, at));
}

/** Converts one Roman word ("ramro") to Nepali ("राम्रो"). */
export function toNepali(word: string): string {
  let out = "";
  let afterConsonant = false;
  let i = 0;
  while (i < word.length) {
    // A capital that isn't part of the scheme (phones capitalise the first letter) reads as lower case.
    const lower = word[i] !== word[i].toLowerCase() && !"TDNSAIUEOMHG".includes(word[i]);
    const w = lower ? word.slice(0, i) + word[i].toLowerCase() + word.slice(i + 1) : word;

    const c = match(CONSONANTS, w, i);
    if (c) {
      if (afterConsonant) out += "्";
      out += c[1];
      afterConsonant = true;
      i += c[0].length;
      continue;
    }
    const v = match(VOWELS, w, i);
    if (v) {
      out += afterConsonant ? v[2] : v[1];
      afterConsonant = false;
      i += v[0].length;
      continue;
    }
    const ch = w[i];
    if (SIGNS[ch]) out += SIGNS[ch];
    else if (ch >= "0" && ch <= "9") out += DIGITS[Number(ch)];
    else out += ch;
    afterConsonant = false;
    i += 1;
  }
  return out;
}

/*
 * Suggestions. People rarely type "aa" for ा or "T" for ट, so a Roman word can mean several
 * spellings ("ram" → राम or रम). We try the usual mix-ups, turn each into Nepali, and put the
 * ones that are real words (from the site's word list) first.
 */

const TOKEN = /chh|ksh|kh|gh|ch|jh|Th|Dh|th|dh|ph|bh|Sh|sh|ng|aa|ai|au|ou|ee|ii|oo|uu|./g;

/** Spellings a Roman piece might have been meant as; the piece itself always comes first. */
const MIXUPS: Record<string, string[]> = {
  a: ["a", "aa"], i: ["i", "ii"], u: ["u", "uu"],
  ch: ["ch", "chh"], t: ["t", "T"], th: ["th", "Th"], d: ["d", "D"], dh: ["dh", "Dh"],
  s: ["s", "sh", "Sh"], sh: ["sh", "s", "Sh"], b: ["b", "v"], v: ["v", "b"],
  ng: ["ng", "NG"], // "gurung" → गुरुङ
};

const isConsonant = (piece: string) => /^[b-df-hj-np-tv-z]/i.test(piece);

let rankOf: Map<string, number> | undefined;
/** Position in the common-word list (lower = more common); undefined if it isn't a known word. */
function rank(word: string): number | undefined {
  rankOf ??= new Map(NEPALI_WORDS.map((w, i) => [w, i]));
  return rankOf.get(word);
}

/** Up to `limit` Nepali spellings for a Roman word, the likeliest first. */
export function suggestions(roman: string, limit = 5): string[] {
  const pieces = roman.match(TOKEN) ?? [];
  // Every combination of mix-ups, with how many pieces were changed (fewer changes = closer to what was typed).
  let variants: { text: string; changes: number }[] = [{ text: "", changes: 0 }];
  pieces.forEach((p, k) => {
    const options = MIXUPS[p] ?? [p];
    // Between two consonants a vowel is often left out when typing: "butwal" means बु-ट-वल.
    const gap = isConsonant(p) && k + 1 < pieces.length && isConsonant(pieces[k + 1]);
    const next: typeof variants = [];
    for (const v of variants)
      options.forEach((o, i) => {
        next.push({ text: v.text + o, changes: v.changes + (i > 0 ? 1 : 0) });
        if (gap) next.push({ text: v.text + o + "a", changes: v.changes + (i > 0 ? 1 : 0) + 1 });
      });
    // Keep the closest ones only, so long words stay quick.
    variants = next.sort((a, b) => a.changes - b.changes).slice(0, 400);
  });
  const seen = new Map<string, { known: number; changes: number }>();
  const add = (ne: string, changes: number) => {
    const known = rank(ne) ?? Infinity;
    const prev = seen.get(ne);
    if (!prev || changes < prev.changes) seen.set(ne, { known, changes });
  };
  for (const v of variants) {
    const ne = toNepali(v.text);
    add(ne, v.changes);
    // A known word that ends in a half letter: "garnuhos" → गर्नुहोस्.
    if (rank(ne + "्") !== undefined) add(ne + "्", v.changes);
  }
  return [...seen.entries()]
    .sort(([, a], [, b]) => a.known - b.known || a.changes - b.changes)
    .slice(0, limit)
    .map(([ne]) => ne);
}

/** The likeliest Nepali spelling of a Roman word. */
export const bestNepali = (roman: string) => suggestions(roman, 1)[0] ?? toNepali(roman);

/** True for a run of Roman letters (and the scheme's ~), the kind of word to convert. */
export const isRomanWord = (s: string) => /^[A-Za-z~]+$/.test(s);

/**
 * Called as someone types: when they've just typed a space, a new line or punctuation,
 * the Roman word right before it becomes Nepali, and a full stop becomes "।".
 * Returns the new text and where the cursor should go, or null when nothing changes.
 */
export function convertLastWord(text: string, caret: number): { text: string; caret: number } | null {
  const end = text[caret - 1];
  if (end === undefined || !/[\s.,?!;:)]/.test(end)) return null;
  const before = text.slice(0, caret - 1);
  const m = /[A-Za-z~]+$/.exec(before);
  if (!m) {
    // Still turn a lone full stop after Nepali text into "।".
    if (end === "." && /[ऀ-ॿ]$/.test(before)) return { text: before + "।" + text.slice(caret), caret };
    return null;
  }
  const converted = bestNepali(m[0]);
  const stop = end === "." ? "।" : end;
  const next = before.slice(0, m.index) + converted + stop + text.slice(caret);
  return { text: next, caret: m.index + converted.length + 1 };
}
