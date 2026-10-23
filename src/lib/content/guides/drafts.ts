import type { CategoryId, Guide, IconName, Localized } from "../types";

/**
 * Placeholders for services that appear on the homepage but don't have a
 * researched guide yet. They are unpublished drafts: the site shows them as
 * "coming soon" and never renders procedural content for them.
 */
function draft(
  slug: string,
  icon: IconName,
  departmentId: string,
  category: CategoryId,
  title: Localized,
  question: Localized,
  summary: Localized,
  keywords: string[],
): Guide {
  return {
    slug,
    icon,
    departmentId,
    status: "draft",
    published: false,
    popular: true,
    title,
    question,
    intro: { ne: "यो निर्देशिका तयार हुँदैछ।", en: "This guide is being prepared." },
    summary,
    category,
    mode: "awaiting_verification",
    eligibility: [],
    documents: [],
    fees: [],
    steps: [],
    mistakes: [],
    faqs: [],
    sources: [],
    lastChecked: "",
    video: { kind: "live" },
    keywords,
    related: [],
    updatedAt: "2026-10-22",
  };
}

export const drafts: Guide[] = [
  draft("pan", "receipt", "ird", "tax", { ne: "प्यान (PAN) दर्ता", en: "PAN Registration" }, { ne: "PAN नम्बर कसरी लिने?", en: "How to get a PAN number?" }, { ne: "व्यक्तिगत स्थायी लेखा नम्बर", en: "Permanent Account Number" }, [
    "pan", "pan card", "pan number", "प्यान", "पान", "tax", "कर", "ird", "राजस्व",
  ]),
  draft("police-clearance", "shield", "police", "police", { ne: "प्रहरी चारित्रिक प्रमाणपत्र", en: "Police Clearance" }, { ne: "Police report कसरी निकाल्ने?", en: "How to get a police clearance report?" }, { ne: "विदेश वा जागिरका लागि प्रहरी रिपोर्ट", en: "Police report for jobs or going abroad" }, [
    "police", "police report", "police clearance", "clearance", "character", "charitrik", "प्रहरी", "पुलिस", "चारित्रिक", "रिपोर्ट",
  ]),
  draft("voter-registration", "vote", "election", "civic", { ne: "मतदाता दर्ता", en: "Voter Registration" }, { ne: "मतदाता नामावलीमा नाम कसरी दर्ता गर्ने?", en: "How to register as a voter?" }, { ne: "मतदाता नामावलीमा नाम दर्ता", en: "Get your name on the voter list" }, [
    "voter", "vote", "voter id", "election", "matadata", "मतदाता", "मत", "निर्वाचन", "नामावली",
  ]),
];
