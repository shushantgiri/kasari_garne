/**
 * Small, dependency-free search tuned for how people actually type in Nepal:
 * Nepali, Romanized Nepali, English, or a mix ("Police report कसरी निकाल्ने?"),
 * with informal spellings (लाइसेन्स / लाईसेन्स / laisens).
 *
 * Runs the same on the server and in the browser.
 */

export interface Searchable {
  slug: string;
  title: { ne: string; en?: string };
  question: { ne: string; en?: string };
  keywords: string[];
  published: boolean;
  departmentNames?: string[];
}

export interface SearchHit {
  slug: string;
  score: number;
}

const STOP_RAW = [
  // Nepali
  "कसरि", "कसरी", "गर्ने", "गर्नु", "गर्न", "के", "चाहिन्छ", "चाहिने", "बनाउन", "बनाउने", "लिने", "लिन", "भर्ने", "भर्न",
  "निकाल्ने", "निकाल्न", "को", "का", "कि", "मा", "लागि", "र", "पनि", "हो", "छ", "मेरो", "आफ्नो", "कहाँ", "कति", "दिने", "दिन",
  "पाउने", "हुन्छ", "नयाँ", "अनलाइन", "फाराम", "फारम",
  // Romanized
  "kasari", "kasri", "garne", "garna", "ke", "chahincha", "chahinchha", "banauna", "line", "bharne", "nikalne", "ko", "ma",
  // English
  "how", "to", "do", "i", "get", "apply", "make", "the", "a", "an", "for", "my", "what", "need", "online", "form", "new", "in", "of", "is", "can",
];

/** Map common Devanagari spelling variants onto one form. */
function foldDevanagari(s: string): string {
  return s
    .replace(/[‌‍]/g, "") // ZWNJ / ZWJ
    .replace(/़/g, "") // nukta
    .replace(/ँ/g, "ं") // chandrabindu → anusvara
    .replace(/ई/g, "इ")
    .replace(/ऊ/g, "उ")
    .replace(/ी/g, "ि") // ी → ि
    .replace(/ू/g, "ु") // ू → ु
    .replace(/ष|श/g, "स")
    .replace(/व/g, "ब");
}

/** Loosen Romanized spellings: aa→a, ee→i, licence/license, ph→f… */
function foldLatin(s: string): string {
  return s
    .replace(/aa+/g, "a")
    .replace(/ee+|ii+/g, "i")
    .replace(/oo+|uu+/g, "u")
    .replace(/ph/g, "f")
    .replace(/ence\b/g, "ense")
    .replace(/([a-z])\1+/g, "$1");
}

export function normalize(input: string): string {
  return foldDevanagari(input.normalize("NFC").toLowerCase())
    .replace(/[?？!।॥,.;:"'“”‘’()\[\]{}/\\|_+=*&^%$#@~`<>-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function foldTokens(input: string): string[] {
  return normalize(input)
    .split(" ")
    .map((t) => (/^[a-z0-9]+$/.test(t) ? foldLatin(t) : t))
    .filter((t) => t.length > 0);
}

/** Stopwords go through the same folding as queries, so variants match. */
const STOPWORDS = new Set(STOP_RAW.flatMap(foldTokens));

export function tokenize(input: string): string[] {
  return foldTokens(input).filter((t) => !STOPWORDS.has(t));
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let rowMin = i;
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
      rowMin = Math.min(rowMin, prev[j]);
    }
    if (rowMin > max) return max + 1;
  }
  return prev[b.length];
}

interface IndexEntry {
  slug: string;
  published: boolean;
  /** Distinct tokens with a weight (keywords and titles weigh more). */
  tokens: Map<string, number>;
  phrases: string[];
}

export function buildIndex(items: Searchable[]): IndexEntry[] {
  return items.map((g) => {
    const tokens = new Map<string, number>();
    const add = (text: string, weight: number) => {
      for (const t of tokenize(text)) tokens.set(t, Math.max(tokens.get(t) ?? 0, weight));
    };
    g.keywords.forEach((k) => add(k, 3));
    add(g.title.ne, 3);
    add(g.title.en ?? "", 3);
    add(g.question.ne, 2);
    add(g.question.en ?? "", 2);
    (g.departmentNames ?? []).forEach((d) => add(d, 1));
    const phrases = [...g.keywords, g.title.ne, g.title.en ?? ""].map(normalize).filter((p) => p.includes(" "));
    return { slug: g.slug, published: g.published, tokens, phrases };
  });
}

function tokenScore(q: string, entry: IndexEntry): number {
  let best = 0;
  const latin = /^[a-z0-9]+$/.test(q);
  for (const [t, w] of entry.tokens) {
    let s = 0;
    if (t === q) s = w * 1.0;
    else if (q.length >= 2 && t.startsWith(q)) s = w * 0.8;
    else if (q.length >= 3 && t.includes(q)) s = w * 0.5;
    else if (q.length >= 4 && t.length >= 3) {
      const max = latin ? (q.length >= 7 ? 2 : 1) : 1;
      if (editDistance(q, t, max) <= max) s = w * 0.6;
    }
    if (s > best) best = s;
  }
  return best;
}

export function search(index: IndexEntry[], query: string, opts: { includeDrafts?: boolean; limit?: number } = {}): SearchHit[] {
  const all = tokenize(query);
  // Purpose words ("renew", "हराएको") say what to do, not which service; ignore them when other words are present.
  const service = all.filter((t) => !PURPOSE_WORDS.some((p) => p.words.has(t)));
  const qTokens = service.length ? service : all;
  if (qTokens.length === 0) return [];
  const qNorm = normalize(query);
  const hits: SearchHit[] = [];
  for (const entry of index) {
    if (!opts.includeDrafts && !entry.published) continue;
    let score = 0;
    let matched = 0;
    for (const q of qTokens) {
      const s = tokenScore(q, entry);
      if (s > 0) matched++;
      score += s;
    }
    if (score === 0) continue;
    // Reward queries where most words matched, and exact phrase hits.
    score *= 0.5 + 0.5 * (matched / qTokens.length);
    if (entry.phrases.some((p) => qNorm.includes(p))) score += 2;
    if (entry.published) score += 0.1;
    hits.push({ slug: entry.slug, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, opts.limit ?? 10);
}

/**
 * Purpose words people use ("renew", "हराएको", "naya"), mapped onto the situation ids
 * a guide may define. Reusable across services: a guide only gets a purpose it defines.
 */
const PURPOSES: { ids: string[]; words: string[] }[] = [
  { ids: ["renew"], words: ["renew", "renewal", "renewing", "नवीकरण", "नविकरण", "nawikaran", "navikaran", "nabikaran", "nawikarn", "म्याद"] },
  // Status before the others: "license print status" is about checking, not applying.
  { ids: ["status"], words: ["status", "print", "printed", "collect", "collection", "अवस्था", "स्थिति", "छापियो", "chapiyo", "awastha"] },
  // Lost and damaged are separate where a guide separates them, otherwise both mean "replace".
  { ids: ["lost", "replace"], words: ["lost", "stolen", "duplicate", "हराएको", "हरायो", "हराए", "harayeko", "harayo", "चोरी", "chori"] },
  { ids: ["damaged", "replace"], words: ["damaged", "damage", "broken", "बिग्रिएको", "बिग्रियो", "bigriyeko", "फुटेको", "replace", "replacement"] },
  { ids: ["add-category"], words: ["category", "वर्ग", "barga", "warga", "varga"] },
  { ids: ["first", "new"], words: ["new", "first", "naya", "nayan", "नयाँ", "पहिलो", "pahilo", "fresh"] },
];
const PURPOSE_WORDS = PURPOSES.map((p) => ({ ids: p.ids, words: new Set(p.words.flatMap(foldTokens)) }));

/**
 * Which of a guide's purposes the query asks for.
 * `asked` is true when the query names a purpose at all, even one the guide doesn't cover.
 */
export function detectPurpose(query: string, situationIds: string[] = []): { id?: string; asked: boolean } {
  const toks = foldTokens(query);
  for (const p of PURPOSE_WORDS) {
    if (!toks.some((t) => p.words.has(t))) continue;
    return { id: p.ids.find((x) => situationIds.includes(x)), asked: true };
  }
  return { asked: false };
}

/** True when the top two results are too close to pick one: ask the visitor instead of guessing. */
export function isAmbiguous(hits: SearchHit[]): boolean {
  return hits.length > 1 && hits[1].score >= hits[0].score * 0.85;
}

/** Suggested queries shown under the search box. */
export const POPULAR_QUERIES = {
  ne: ["लाइसेन्स कसरी भर्ने?", "राहदानी बनाउन के चाहिन्छ?", "राष्ट्रिय परिचयपत्र", "PAN नम्बर कसरी लिने?", "Police report कसरी निकाल्ने?"],
  en: ["Driving licence form", "Passport documents", "National ID registration", "PAN number", "Police report"],
} as const;
