/**
 * The free chat helper. No AI and no outside service: it answers from the guide's own
 * content by recognising what the question is about (documents, fees, steps…).
 * Pure functions, so the answers are tested and work offline in the browser.
 */
import type { Department, Guide, Locale, Localized } from "../content/types.ts";
import { appliesTo } from "../content/situations.ts";
import { detectPurpose } from "../search/search.ts";

/** One guide, in one language, ready for the browser. */
export interface Knowledge {
  locale: Locale;
  name: string;
  office?: string;
  portal?: string;
  status?: { label: string; url: string };
  purposes: { id: string; label: string; pending: boolean }[];
  eligibility: string[];
  docs: { text: string; when?: string; note?: string; for?: string[] }[];
  fees: { label: string; amount: string }[];
  feesUnconfirmed: boolean;
  time?: string;
  visit?: string;
  steps: { title: string; body: string; bodyFor?: Record<string, string>; for?: string[] }[];
  mistakes: string[];
  next: string[];
  faqs: { q: string; a: string }[];
}

export function buildKnowledge(g: Guide, locale: Locale, dept?: Department): Knowledge {
  const tr = (l: Localized) => (locale === "en" && l.en ? l.en : l.ne);
  const ok = (c: string) => c === "official";
  const fees = g.fees.filter((f) => ok(f.check) && f.amount).map((f) => ({ label: tr(f.label), amount: tr(f.amount!) }));
  return {
    locale,
    name: tr(g.title),
    office: dept ? tr(dept.name) : undefined,
    portal: g.officialPortal?.url ?? dept?.url,
    status: g.statusCheck ? { label: tr(g.statusCheck.label), url: g.statusCheck.url } : undefined,
    purposes: (g.situations ?? []).map((s) => ({ id: s.id, label: tr(s.label), pending: !!s.pending })),
    eligibility: g.eligibility.filter((e) => ok(e.check)).map((e) => tr(e.text)),
    docs: g.documents.filter((d) => ok(d.check)).map((d) => ({ text: tr(d.text), when: d.when && tr(d.when), note: d.note && tr(d.note), for: d.for })),
    fees,
    feesUnconfirmed: !g.fees.length || g.fees.length > fees.length,
    time: g.estimatedTime && ok(g.estimatedTime.check) ? tr(g.estimatedTime.text) : undefined,
    visit: g.visit && ok(g.visit.check) ? tr(g.visit.text) : undefined,
    steps: g.steps.map((s) => ({
      title: tr(s.title),
      body: tr(s.body),
      for: s.for,
      bodyFor: s.bodyFor ? Object.fromEntries(Object.entries(s.bodyFor).map(([k, v]) => [k, tr(v)])) : undefined,
    })),
    mistakes: g.mistakes.filter((m) => ok(m.check)).map((m) => tr(m.text)),
    next: (g.whatNext ?? []).filter((n) => ok(n.check)).map((n) => tr(n.text)),
    faqs: g.faqs.filter((f) => ok(f.check)).map((f) => ({ q: tr(f.q), a: tr(f.a) })),
  };
}

type Topic = "greet" | "thanks" | "docs" | "fees" | "where" | "time" | "who" | "visit" | "after" | "mistakes" | "steps";

// Words in English, Romanized Nepali and Nepali. Checked in this order, so more specific topics come first.
const TOPICS: [Topic, string[]][] = [
  ["thanks", ["thank", "thanks", "dhanyabad", "dhanyabaad", "धन्यवाद", "धन्यबाद"]],
  ["fees", ["fee", "fees", "cost", "price", "charge", "pay", "money", "how much", "dastur", "sulka", "shulka", "paisa", "rupees", "दस्तुर", "शुल्क", "पैसा", "रुपैयाँ", "तिर्नु", "कति लाग्छ", "कति पर्छ"]],
  ["time", ["how long", "how many days", "time", "days", "weeks", "kati din", "kati samaya", "samaya", "कति दिन", "समय", "कहिले सम्म", "कति समय"]],
  ["docs", ["document", "documents", "paper", "papers", "bring", "need", "required", "require", "kagajat", "kagaj", "chahincha", "chaincha", "कागजात", "कागज", "चाहिन्छ", "चाहिने", "लैजानु"]],
  ["after", ["after", "next", "status", "track", "sms", "ready", "collect", "pachi", "awastha", "पछि", "अवस्था", "तयार", "लिन जानु"]],
  ["who", ["who can", "eligible", "eligibility", "age", "qualify", "can i apply", "kasle", "umer", "yogya", "कसले", "उमेर", "योग्य", "पाइन्छ"]],
  ["visit", ["office", "visit", "in person", "go there", "karyalaya", "karyalay", "कार्यालय", "जानुपर्छ", "जानु पर्छ"]],
  ["where", ["where", "website", "online", "link", "portal", "site", "apply", "form", "kaha", "kahaa", "aawedan", "awedan", "कहाँ", "वेबसाइट", "अनलाइन", "आवेदन", "फाराम", "लिंक"]],
  ["mistakes", ["mistake", "mistakes", "wrong", "avoid", "reject", "rejected", "problem", "galti", "गल्ती", "रद्द", "समस्या"]],
  ["steps", ["how", "step", "steps", "process", "procedure", "start", "kasari", "kasarī", "prakriya", "कसरी", "चरण", "प्रक्रिया", "सुरु"]],
  ["greet", ["hi", "hello", "hey", "namaste", "namaskar", "नमस्ते", "नमस्कार"]],
];

const fold = (s: string) => s.toLowerCase().replace(/[?!.,।॥:;"'“”‘’()]/g, " ").replace(/\s+/g, " ").trim();
const has = (q: string, w: string) => (/^[a-z ]+$/.test(w) ? ` ${q} `.includes(` ${w} `) || (w.length > 4 && q.includes(w)) : q.includes(w));

export function topicOf(question: string): Topic | undefined {
  const q = fold(question);
  return TOPICS.find(([, words]) => words.some((w) => has(q, w)))?.[0];
}

const STOP = new Set(["the", "a", "an", "is", "are", "do", "does", "can", "i", "my", "to", "of", "for", "in", "on", "it", "what", "how", "and", "or", "me", "you", "छ", "हो", "के", "मेरो", "म", "र", "पनि", "गर्न", "गर्ने"]);
const words = (s: string) => fold(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w));

/** The FAQ whose question shares the most words with the visitor's, when the overlap is clear. */
function bestFaq(k: Knowledge, question: string) {
  const qw = new Set(words(question));
  let best: { q: string; a: string } | undefined;
  let score = 0;
  for (const f of k.faqs) {
    const fw = words(f.q);
    const common = fw.filter((w) => qw.has(w)).length;
    const s = common / Math.max(fw.length, 1);
    if (common >= 2 && s > score) [best, score] = [f, s];
  }
  return score >= 0.4 ? best : undefined;
}

export interface Reply {
  text: string;
  /** The purpose the visitor is asking about, remembered for follow-up questions. */
  purpose?: string;
}

/** Answer one question. `purpose` is what the visitor asked about earlier, if anything. */
export function answer(k: Knowledge, question: string, purpose?: string): Reply {
  const ne = k.locale === "ne";
  const asked = detectPurpose(question, k.purposes.map((p) => p.id));
  const pid = asked.asked ? asked.id : purpose;
  const chosen = k.purposes.find((p) => p.id === pid);
  const site = k.portal ? (ne ? `आधिकारिक वेबसाइट: ${k.portal}` : `Official website: ${k.portal}`) : "";
  const unsure = ne ? "यो कुरा हामीले अहिलेसम्म आधिकारिक स्रोतमा पुष्टि गरेका छैनौँ।" : "We haven't confirmed this on an official source yet.";
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  const out = (...parts: (string | number | undefined | false)[]) => ({ text: parts.filter((p): p is string => typeof p === "string" && p !== "").join("\n\n"), purpose: chosen?.id });
  const forLine = chosen ? `(${chosen.label})` : "";
  const num = (n: number) => (ne ? String(n).replace(/\d/g, (d) => "०१२३४५६७८९"[Number(d)]) : String(n));

  const faq = bestFaq(k, question);
  const topic = topicOf(question);

  // A purpose with no verified guide yet: say so plainly instead of giving another purpose's steps.
  // Only when they just named it, or ask a follow-up that depends on it (documents, steps…).
  const dependsOnPurpose = !topic || topic === "docs" || topic === "steps" || topic === "time" || topic === "after";
  if (chosen?.pending && (asked.id === chosen.id || dependsOnPurpose) && topic !== "greet" && topic !== "thanks") {
    return out(
      ne ? `"${chosen.label}" को निर्देशिका अझै तयार हुँदैछ। यसका चरण र कागजात हामीले अहिलेसम्म पुष्टि गरेका छैनौँ।` : `The guide for "${chosen.label}" is still being prepared. We haven't confirmed its steps or documents yet.`,
      site && (ne ? `अहिलेलाई ${k.portal} हेर्नुहोस् वा कार्यालयमा सोध्नुहोस्।` : `For now, please check ${k.portal} or ask at the office.`),
    );
  }
  if (faq && (!topic || topic === "steps" || topic === "greet")) return out(faq.a);

  switch (topic) {
    case "greet":
      return out(ne ? `नमस्ते! ${k.name} बारे के जान्न चाहनुहुन्छ? कागजात, दस्तुर, कहाँ आवेदन दिने वा चरणबारे सोध्न सक्नुहुन्छ।` : `Hello! What would you like to know about ${k.name}? You can ask about documents, fees, where to apply or the steps.`);
    case "thanks":
      return out(ne ? "स्वागत छ! अरू केही सोध्नु छ भने सोध्नुहोस्।" : "You're welcome! Ask me anything else.");
    case "docs": {
      const docs = k.docs.filter((d) => appliesTo(d, chosen?.id ?? null));
      if (!docs.length) return out(unsure, site);
      const always = docs.filter((d) => !d.when).map((d) => d.text);
      const some = docs.filter((d) => d.when).map((d) => `${d.text} (${d.when})`);
      return out(
        `${ne ? "यी कागजात तयार राख्नुहोस्" : "Keep these documents ready"} ${forLine}:`.replace(" :", ":"),
        always.length && list(always),
        some.length && `${ne ? "लागू भएमा मात्र:" : "Only if it applies:"}\n${list(some)}`,
      );
    }
    case "fees":
      if (!k.fees.length) return out(ne ? "दस्तुर अहिलेसम्म पुष्टि भएको छैन। तिर्नुअघि आधिकारिक वेबसाइटमा हेर्नुहोस्।" : "The fee isn't confirmed yet. Please check the official website before you pay.", site);
      return out(
        list(k.fees.map((f) => `${f.label}: ${f.amount}`)),
        k.feesUnconfirmed && (ne ? "अरू दस्तुर पुष्टि भएका छैनन्। तिर्नुअघि आधिकारिक वेबसाइटमा हेर्नुहोस्।" : "Other fees aren't confirmed. Check the official website before you pay."),
      );
    case "time":
      return out(k.time ?? unsure, !k.time && site);
    case "who":
      return out(k.eligibility.length ? list(k.eligibility) : unsure, !k.eligibility.length && site);
    case "visit":
      return out(k.visit ?? unsure, k.office && (ne ? `जिम्मेवार कार्यालय: ${k.office}` : `Responsible office: ${k.office}`));
    case "where":
      return out(
        k.portal ? (ne ? `आवेदन आधिकारिक वेबसाइटमा दिनुहोस्: ${k.portal}` : `You apply on the official website: ${k.portal}`) : unsure,
        ne ? "कसरी गर्ने? ले आवेदन लिँदैन। ठेगाना .gov.np मा सकिएको जाँच्नुहोस्।" : "Kasari Garne doesn't take applications. Make sure the address ends in .gov.np.",
      );
    case "after":
      return out(
        k.next.length ? list(k.next) : unsure,
        k.status && (ne ? `अवस्था हेर्न: ${k.status.url}` : `Check your status: ${k.status.url}`),
      );
    case "mistakes":
      return out(k.mistakes.length ? `${ne ? "यी गल्ती नगर्नुहोस्:" : "Avoid these mistakes:"}\n${list(k.mistakes)}` : unsure);
    case "steps": {
      const steps = k.steps.filter((s) => appliesTo(s, chosen?.id ?? null));
      if (!steps.length) return out(unsure, site);
      return out(
        `${ne ? "चरणहरू" : "The steps"} ${forLine}:`.replace(" :", ":"),
        steps.map((s, i) => `${num(i + 1)}. ${s.title}: ${(chosen && s.bodyFor?.[chosen.id]) || s.body}`).join("\n"),
        ne ? "भिडियो निर्देशिकामा यी चरण हेर्न सकिन्छ।" : "You can watch these steps in the video guide.",
      );
    }
  }

  if (faq) return out(faq.a);
  if (asked.id && chosen)
    return out(ne ? `ठीक छ, "${chosen.label}" बारे। कागजात, दस्तुर, चरण वा कहाँ आवेदन दिने, के जान्न चाहनुहुन्छ?` : `Okay, "${chosen.label}". Would you like the documents, fees, steps or where to apply?`);
  return out(
    ne ? "माफ गर्नुहोस्, यो प्रश्न बुझिनँ। यस्तो सोध्नुहोस्: \"के-के कागजात चाहिन्छ?\", \"दस्तुर कति?\", \"आवेदन कहाँ दिने?\"" : "Sorry, I didn't understand that. Try asking: \"What documents do I need?\", \"How much is the fee?\" or \"Where do I apply?\"",
    site,
  );
}
