import type { Locale, Localized } from "./content/types";
import NepaliDateModule from "nepali-date-converter";

// The package is UMD: bundlers hand over the class itself, plain Node hands over { default }.
const NepaliDate = (NepaliDateModule as unknown as { default?: typeof NepaliDateModule }).default ?? NepaliDateModule;

export function isLocale(v: string): v is Locale {
  return v === "ne" || v === "en";
}

/** Pick the right language, falling back to Nepali. */
export function tr(text: Localized | undefined | null, locale: Locale): string {
  if (!text) return "";
  return (locale === "en" ? text.en : text.ne) || text.ne;
}

const NE_DIGITS = "०१२३४५६७८९";
export function digits(n: number | string, locale: Locale): string {
  const s = String(n);
  return locale === "ne" ? s.replace(/[0-9]/g, (d) => NE_DIGITS[Number(d)]) : s;
}

const NE_MONTHS = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats an ISO date as Bikram Sambat first, with the AD date in brackets,
 * e.g. "५ कार्तिक २०८३ (२२ अक्टोबर २०२६)" or "5 Kartik 2083 BS (22 Oct 2026)".
 * The BS date comes from nepali-date-converter (checked against known New Year dates);
 * if it can't convert a date, only the AD date is shown.
 */
export function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const ad = locale === "ne" ? `${digits(d, "ne")} ${NE_MONTHS[m - 1]} ${digits(y, "ne")}` : `${d} ${EN_MONTHS[m - 1]} ${y}`;
  try {
    const bs = new NepaliDate(new Date(y, m - 1, d));
    return locale === "ne"
      ? `${digits(bs.getDate(), "ne")} ${bs.format("MMMM", "np")} ${digits(bs.getYear(), "ne")} (${ad})`
      : `${bs.getDate()} ${bs.format("MMMM", "en")} ${bs.getYear()} BS (${ad})`;
  } catch {
    return ad;
  }
}

export const ui = {
  ne: {
    siteName: "कसरी गर्ने?",
    tagline: "सरकारी काम, अब सजिलै।",
    skip: "मुख्य भागमा जानुहोस्",
    home: "गृहपृष्ठ",
    allGuides: "सबै गाइड",
    requestGuide: "गाइड माग्नुहोस्",
    switchLang: "English",
    heroTitle: "सरकारी काम कसरी गर्ने?",
    /** Headline split so the key word can carry the hand-drawn underline. */
    heroParts: ["सरकारी काम ", "कसरी", " गर्ने?"] as const,
    heroText: "फाराम भर्नेदेखि कागजात तयार गर्नेसम्म, सजिलो भाषामा सिक्नुहोस्।",
    searchPlaceholder: "तपाईं के गर्न चाहनुहुन्छ?",
    searchButton: "गाइड खोज्नुहोस्",
    searchLabel: "सेवा खोज्नुहोस्",
    popularSearches: "धेरै खोजिएका",
    popularServices: "लोकप्रिय सेवाहरू",
    viewGuide: "गाइड हेर्नुहोस्",
    comingSoon: "छिट्टै आउँदैछ",
    requestThis: "यो गाइड माग्नुहोस्",
    howItWorks: "कसरी काम गर्छ?",
    how1: "सेवा छान्नुहोस्।",
    how2: "भिडियो हेर्नुहोस्।",
    how3: "चरणहरू पछ्याउनुहोस्।",
    recentlyUpdated: "भर्खरै जाँचिएका गाइड",
    tutorials: "भिडियो गाइड",
    byDepartment: "विभागअनुसार",
    guidesCount: (n: number) => `${digits(n, "ne")} गाइड`,
    requestTitle: "चाहिएको गाइड भेटिएन?",
    requestText: "कुन सरकारी कामको गाइड चाहिन्छ, हामीलाई भन्नुहोस्।",
    disclaimerTitle: "हामी सरकारी वेबसाइट होइनौँ",
    disclaimer:
      "कसरी गर्ने? एउटा स्वतन्त्र जानकारी मञ्च हो। हामी नेपाल सरकारसँग आबद्ध छैनौँ र यहाँबाट कुनै आवेदन दिन मिल्दैन। आवेदन सधैँ .gov.np मा सकिने आधिकारिक वेबसाइटमा मात्र दिनुहोस्। दस्तुर र म्याद आवेदन दिनुअघि आधिकारिक स्रोतमा जाँच्नुहोस्।",
    // Guide page
    department: "विभाग",
    lastChecked: "स्रोत जाँचिएको मिति",
    officialSite: "आधिकारिक वेबसाइट",
    openOfficial: "आधिकारिक वेबसाइट खोल्नुहोस्",
    checkStatus: "अवस्था हेर्नुहोस्",
    whatYouNeed: "के चाहिन्छ?",
    whoCanApply: "को योग्य छ?",
    documents: "कागजात",
    fees: "दस्तुर",
    feeUnknown: "आधिकारिक वेबसाइटमा हेर्नुहोस्",
    time: "लाग्ने समय",
    whatToDo: "के गर्ने?",
    watchVideo: "भिडियो हेर्नुहोस्",
    steps: "चरणहरू",
    step: "चरण",
    mistakes: "यी गल्ती नगर्नुहोस्",
    faq: "प्रायः सोधिने प्रश्न",
    sources: "स्रोतहरू",
    official: "आधिकारिक",
    unofficial: "अनौपचारिक",
    needsReview: "पुष्टि हुन बाँकी",
    needsReviewHint: "यो कुरा आधिकारिक पृष्ठमा अझै पुष्टि भएको छैन।",
    when: "कहिले",
    related: "सम्बन्धित सेवा",
    report: "गलत जानकारी भेट्नुभयो?",
    reportButton: "जानकारी गलत छ भनी रिपोर्ट गर्नुहोस्",
    printSteps: "चरणहरू प्रिन्ट / सेभ गर्नुहोस्",
    jumpTo: "यो चरणमा जानुहोस्",
    status: {
      draft: "मस्यौदा",
      under_review: "समीक्षामा",
      verified: "प्रमाणित",
      needs_update: "अद्यावधिक चाहिने",
      archived: "संग्रहित",
    },
    statusHelp: {
      draft: "यो गाइड तयार हुँदैछ।",
      under_review:
        "यस गाइडका स्रोत जाँचिएका छन्, तर केही चरण आधिकारिक वेबसाइटमा पुष्टि हुन बाँकी छन्। ती चरणमा “पुष्टि हुन बाँकी” लेखिएको छ।",
      verified: "यस गाइडका सबै विवरण आधिकारिक स्रोतसँग जाँचिएका छन्।",
      needs_update: "प्रक्रिया बदलिएको हुन सक्छ। आधिकारिक वेबसाइट हेर्नुहोस्।",
      archived: "यो गाइड अब प्रयोगमा छैन।",
    },
    // Video
    play: "चलाउनुहोस्",
    pause: "रोक्नुहोस्",
    replay: "फेरि हेर्नुहोस्",
    speed: "गति",
    subtitles: "उपशीर्षक",
    lowData: "कम डाटा",
    demoLabel: "नमूना — वास्तविक वेबसाइट होइन",
    videoIntro: "यो भिडियोमा सिक्नुहोस्:",
    videoEnd: "पेस गर्नुअघि सबै विवरण फेरि जाँच्नुहोस्।",
    videoEndSub: "आवेदन आधिकारिक .gov.np वेबसाइटमा मात्र दिनुहोस्।",
    checklist: "कागजात तयार राख्नुहोस्",
    warnings: "ध्यान दिनुहोस्",
    summary: "सारांश",
    // Search
    results: "नतिजा",
    noResults: "कुनै गाइड भेटिएन।",
    noResultsHint: "अर्को शब्द प्रयोग गर्नुहोस्, वा यो गाइड माग्नुहोस्।",
    searchFor: (q: string) => `“${q}” को नतिजा`,
    // Forms
    sending: "पठाउँदै…",
    send: "पठाउनुहोस्",
    thanks: "धन्यवाद! हामी जाँच गर्नेछौँ।",
    formError: "पठाउन सकिएन। फेरि प्रयास गर्नुहोस्।",
    reportWhat: "के गलत छ?",
    reportWhatHint: "जस्तै: चरण ३ को बटनको नाम फेरिएको छ।",
    reportWhere: "सही जानकारी कहाँ भेटियो? (लिंक, ऐच्छिक)",
    noPersonal: "नागरिकता नम्बर, पासवर्ड वा OTP जस्ता व्यक्तिगत विवरण यहाँ नलेख्नुहोस्।",
    requestService: "कुन सेवाको गाइड चाहिन्छ?",
    requestDetails: "थप कुरा (ऐच्छिक)",
    close: "बन्द गर्नुहोस्",
    loading: "लोड हुँदैछ…",
    errorTitle: "केही गडबड भयो",
    errorRetry: "फेरि प्रयास गर्नुहोस्",
    notFound: "यो पृष्ठ भेटिएन",
    backHome: "गृहपृष्ठमा फर्कनुहोस्",
    offline: "इन्टरनेट छैन। पहिले हेरेका पृष्ठ मात्र खुल्छन्।",
  },
  en: {
    siteName: "Kasari Garne",
    tagline: "Government Services, Made Simple.",
    skip: "Skip to main content",
    home: "Home",
    allGuides: "All guides",
    requestGuide: "Request a guide",
    switchLang: "नेपाली",
    heroTitle: "Government work, step by step",
    heroParts: ["Government work, ", "step by step", ""] as const,
    heroText: "From filling in forms to preparing documents, learn it in simple words.",
    searchPlaceholder: "What do you want to do?",
    searchButton: "Find a guide",
    searchLabel: "Find a service",
    popularSearches: "Popular searches",
    popularServices: "Popular services",
    viewGuide: "View guide",
    comingSoon: "Coming soon",
    requestThis: "Request this guide",
    howItWorks: "How it works",
    how1: "Pick a service.",
    how2: "Watch the video.",
    how3: "Follow the steps.",
    recentlyUpdated: "Recently checked guides",
    tutorials: "Video guides",
    byDepartment: "Browse by department",
    guidesCount: (n: number) => `${n} guide${n === 1 ? "" : "s"}`,
    requestTitle: "Can't find what you need?",
    requestText: "Tell us which government task you need a guide for.",
    disclaimerTitle: "We are not a government website",
    disclaimer:
      "Kasari Garne is an independent information platform. We are not affiliated with the Government of Nepal and you cannot apply for anything here. Always apply on the official website ending in .gov.np. Check fees and deadlines on the official source before applying.",
    department: "Department",
    lastChecked: "Sources checked on",
    officialSite: "Official website",
    openOfficial: "Open the official website",
    checkStatus: "Check status",
    whatYouNeed: "What do I need?",
    whoCanApply: "Who can apply?",
    documents: "Documents",
    fees: "Fees",
    feeUnknown: "Check the official website",
    time: "Time needed",
    whatToDo: "What should I do?",
    watchVideo: "Watch the video",
    steps: "Steps",
    step: "Step",
    mistakes: "Avoid these mistakes",
    faq: "Frequently asked questions",
    sources: "Sources",
    official: "Official",
    unofficial: "Unofficial",
    needsReview: "Not yet confirmed",
    needsReviewHint: "This has not yet been confirmed on an official page.",
    when: "When",
    related: "Related services",
    report: "Found something wrong?",
    reportButton: "Report incorrect information",
    printSteps: "Print / save the steps",
    jumpTo: "Jump to this step",
    status: {
      draft: "Draft",
      under_review: "Under review",
      verified: "Verified",
      needs_update: "Needs update",
      archived: "Archived",
    },
    statusHelp: {
      draft: "This guide is being prepared.",
      under_review:
        "This guide's sources have been checked, but some steps still need confirming on the official website. Those steps are marked “Not yet confirmed”.",
      verified: "Every detail in this guide was checked against an official source.",
      needs_update: "The process may have changed. Please check the official website.",
      archived: "This guide is no longer maintained.",
    },
    play: "Play",
    pause: "Pause",
    replay: "Replay",
    speed: "Speed",
    subtitles: "Subtitles",
    lowData: "Low data",
    demoLabel: "Demo — not the real website",
    videoIntro: "In this video:",
    videoEnd: "Check every detail again before submitting.",
    videoEndSub: "Apply only on the official .gov.np website.",
    checklist: "Have these documents ready",
    warnings: "Watch out",
    summary: "Summary",
    results: "Results",
    noResults: "No guides found.",
    noResultsHint: "Try another word, or request this guide.",
    searchFor: (q: string) => `Results for “${q}”`,
    sending: "Sending…",
    send: "Send",
    thanks: "Thank you! We will check it.",
    formError: "Could not send. Please try again.",
    reportWhat: "What is wrong?",
    reportWhatHint: "e.g. the button name in step 3 has changed.",
    reportWhere: "Where did you find the correct information? (link, optional)",
    noPersonal: "Don't write personal details like citizenship numbers, passwords or OTPs here.",
    requestService: "Which service do you need a guide for?",
    requestDetails: "More details (optional)",
    close: "Close",
    loading: "Loading…",
    errorTitle: "Something went wrong",
    errorRetry: "Try again",
    notFound: "Page not found",
    backHome: "Back to home",
    offline: "You are offline. Only pages you visited before will open.",
  },
} as const;

export type UI = (typeof ui)["ne"] | (typeof ui)["en"];
export function dict(locale: Locale): UI {
  return ui[locale];
}
