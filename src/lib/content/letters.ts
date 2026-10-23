import type { Localized } from "./types";

/**
 * Ready-to-fill application letters (निवेदन) in the layout government offices' own samples use:
 * the date top right; "श्रीमान् … ज्यू," with the office and its address; the subject as one
 * short phrase; "महोदय,"; a body opening "प्रस्तुत विषयमा …" that says who is writing and what
 * they need, then the request opening "अतः …"; then "निवेदक" with signature, full name, address
 * and phone, and attached documents listed at the bottom.
 * The truthfulness line comes from official forms (citizenship, ID, recommendations, petitions);
 * ordinary letters such as leave don't carry it, so it's optional and only on by default where it fits.
 * These are common general formats, not official forms; where an office has its own form,
 * people should use that (the editor says so). Letters are written in Nepali, as offices expect.
 * `{key}` in the text is replaced with what the person types; empty ones show as dots.
 * `{ko}` is "को" or "की" and `{child}` "छोरा" or "छोरी", so the words agree with the applicant.
 */

export interface LetterField {
  key: string;
  label: Localized;
  /** A fictional example, shown as the placeholder. */
  example: string;
  /** Typed as-is (numbers), never turned from Roman into Nepali. */
  plain?: boolean;
}

export interface LetterTemplate {
  id: string;
  title: Localized;
  /** When to use it, in a few words. */
  use: Localized;
  to: string[];
  subject: string;
  /** Paragraphs are separated by a blank line. */
  body: string;
  /** Whether the truthfulness line is ticked to begin with (people can turn it on or off). */
  declaration?: boolean;
  /** Asks which documents are attached, listed at the bottom ("संलग्न कागजात"). */
  attachments?: boolean;
  /** Extra lines in the applicant's block, after the name (e.g. position or class). */
  signer?: string[];
  fields: LetterField[];
}

/** The truthfulness line, worded as on official forms. */
export const DECLARATION = "यसमा लेखिएको व्यहोरा ठीक साँचो हो, झुट्टा ठहरे कानूनबमोजिम सहुँला बुझाउँला।";

/** Asked in every letter, for the applicant's block. */
export const SIGNER_FIELDS: LetterField[] = [
  { key: "name", label: { ne: "तपाईंको नाम थर", en: "Your full name" }, example: "राम बहादुर थापा" },
  { key: "address", label: { ne: "तपाईंको ठेगाना", en: "Your address" }, example: "बुटवल-५, रुपन्देही" },
  { key: "phone", label: { ne: "सम्पर्क नम्बर", en: "Phone number" }, example: "९८XXXXXXXX", plain: true },
];

/** Asked when a letter lists attached documents. */
export const ATTACHMENTS_FIELD: LetterField = {
  key: "attachments",
  label: { ne: "संलग्न कागजात", en: "Documents attached" },
  example: "नागरिकताको प्रतिलिपि, जग्गाधनी प्रमाणपत्रको प्रतिलिपि",
};

export const LETTERS: LetterTemplate[] = [
  {
    id: "ward-recommendation",
    title: { ne: "वडा कार्यालयबाट सिफारिस", en: "Recommendation from the ward office" },
    use: { ne: "नागरिकता, राहदानी, बैंक आदिका लागि सिफारिस", en: "For citizenship, passport, bank and more" },
    to: ["श्रीमान् वडाध्यक्ष ज्यू,", "{municipality},", "वडा नं. {ward} को कार्यालय, {district}।"],
    subject: "{purpose}का लागि सिफारिस पाऊँ।",
    body:
      "प्रस्तुत विषयमा {district} जिल्ला, {municipality} वडा नं. {ward} मा स्थायी बसोबास गर्ने {parent}{ko} {child} म {name}लाई {purpose}का लागि सिफारिस आवश्यक परेकाले सम्बन्धित कागजातका प्रतिलिपिसहित यो निवेदन पेस गरे{ko} छु।\n\nअतः उक्त सिफारिस गरिदिनुहुन विनम्र अनुरोध गर्दछु।",
    declaration: true,
    attachments: true,
    fields: [
      { key: "municipality", label: { ne: "नगरपालिका / गाउँपालिका", en: "Municipality" }, example: "बुटवल उपमहानगरपालिका" },
      { key: "ward", label: { ne: "वडा नम्बर", en: "Ward number" }, example: "५", plain: true },
      { key: "district", label: { ne: "जिल्ला", en: "District" }, example: "रुपन्देही" },
      { key: "parent", label: { ne: "बुबा वा आमाको नाम थर", en: "Father's or mother's full name" }, example: "हरि बहादुर थापा" },
      { key: "purpose", label: { ne: "केका लागि?", en: "What for?" }, example: "नागरिकता प्रमाणपत्र" },
    ],
  },
  {
    id: "leave",
    title: { ne: "बिदा निवेदन", en: "Leave application" },
    use: { ne: "कार्यालय वा विद्यालयबाट बिदा माग्न", en: "Ask for leave from work or school" },
    to: ["श्रीमान् {recipient} ज्यू,", "{organization},", "{orgAddress}।"],
    subject: "बिदा पाऊँ।",
    body:
      "प्रस्तुत विषयमा म {reason}का कारण मिति {from} देखि {until} सम्म जम्मा {days} दिन उपस्थित हुन नसक्ने भए{ko} छु।\n\nअतः उक्त अवधिको बिदा स्वीकृत गरिदिनुहुन विनम्र अनुरोध गर्दछु।",
    signer: ["पद / कक्षा: {position}"],
    fields: [
      { key: "recipient", label: { ne: "कसलाई? (पद)", en: "To whom? (position)" }, example: "प्रधानाध्यापक" },
      { key: "organization", label: { ne: "कार्यालय / विद्यालयको नाम", en: "Office or school" }, example: "श्री जनता माध्यमिक विद्यालय" },
      { key: "orgAddress", label: { ne: "कार्यालयको ठेगाना", en: "Its address" }, example: "बुटवल, रुपन्देही" },
      { key: "reason", label: { ne: "कारण", en: "Reason" }, example: "बिरामी" },
      { key: "from", label: { ne: "मिति देखि", en: "From date" }, example: "२०८३/०७/१०", plain: true },
      { key: "until", label: { ne: "मिति सम्म", en: "Until date" }, example: "२०८३/०७/१२", plain: true },
      { key: "days", label: { ne: "जम्मा दिन", en: "Number of days" }, example: "३", plain: true },
      { key: "position", label: { ne: "तपाईंको पद / कक्षा", en: "Your position or class" }, example: "कक्षा १०" },
    ],
  },
  {
    id: "lost-document",
    title: { ne: "कागजात हराएको सूचना", en: "Report a lost document" },
    use: { ne: "नागरिकता, लाइसेन्स आदि हराउँदा प्रहरीमा", en: "To the police, when a document is lost" },
    to: ["श्रीमान् प्रहरी प्रमुख ज्यू,", "{policeOffice},", "{district}।"],
    subject: "{document} हराएको सम्बन्धमा।",
    body:
      "प्रस्तुत विषयमा मेरो नाममा जारी भएको {document} (नं. {docNumber}) मिति {lostDate} मा {lostPlace} वरपर हराएको छ। धेरै खोजी गर्दा पनि फेला पर्न सकेन।\n\nअतः उक्त कागजात हराएको व्यहोरा अभिलेख गरी सोको प्रमाणित गरिदिनुहुन विनम्र अनुरोध गर्दछु।",
    declaration: true,
    fields: [
      { key: "policeOffice", label: { ne: "प्रहरी कार्यालय", en: "Police office" }, example: "जिल्ला प्रहरी कार्यालय" },
      { key: "district", label: { ne: "जिल्ला", en: "District" }, example: "रुपन्देही" },
      { key: "document", label: { ne: "के हराएको?", en: "What was lost?" }, example: "नागरिकता प्रमाणपत्र" },
      { key: "docNumber", label: { ne: "कागजातको नम्बर", en: "Document number" }, example: "XX-XX-XX-XXXXX", plain: true },
      { key: "lostDate", label: { ne: "हराएको मिति", en: "Date lost" }, example: "२०८३/०७/०१", plain: true },
      { key: "lostPlace", label: { ne: "कहाँ हराएको?", en: "Where?" }, example: "बुटवल बसपार्क" },
    ],
  },
  {
    id: "correction",
    title: { ne: "विवरण संशोधन गर्ने निवेदन", en: "Correct a detail" },
    use: { ne: "नाम, थर, जन्ममिति गलत भएमा", en: "When a name or date of birth is wrong" },
    to: ["श्रीमान् प्रमुख ज्यू,", "{office},", "{officeAddress}।"],
    subject: "{document}मा {field} संशोधन गरिपाऊँ।",
    body:
      "प्रस्तुत विषयमा मेरो {document}मा {field} \"{right}\" हुनुपर्नेमा त्रुटिवश \"{wrong}\" उल्लेख हुन गएको छ। सही विवरण पुष्टि हुने कागजातको प्रतिलिपि यसैसाथ संलग्न गरे{ko} छु।\n\nअतः उक्त विवरण संशोधन गरिदिनुहुन विनम्र अनुरोध गर्दछु।",
    declaration: true,
    attachments: true,
    fields: [
      { key: "office", label: { ne: "कार्यालयको नाम", en: "Office" }, example: "जिल्ला प्रशासन कार्यालय" },
      { key: "officeAddress", label: { ne: "कार्यालयको ठेगाना", en: "Office address" }, example: "रुपन्देही" },
      { key: "document", label: { ne: "कुन कागजातमा?", en: "Which document?" }, example: "नागरिकता प्रमाणपत्र" },
      { key: "field", label: { ne: "के गलत छ?", en: "What is wrong?" }, example: "जन्ममिति" },
      { key: "wrong", label: { ne: "अहिले लेखिएको (गलत)", en: "Written now (wrong)" }, example: "२०५५/०३/१२", plain: true },
      { key: "right", label: { ne: "हुनुपर्ने (सही)", en: "Should be (right)" }, example: "२०५५/०३/२१", plain: true },
    ],
  },
  {
    id: "copy",
    title: { ne: "प्रतिलिपि माग्ने निवेदन", en: "Request a copy" },
    use: { ne: "प्रमाणपत्र, लाइसेन्स आदिको प्रतिलिपि", en: "A copy of a certificate or card" },
    to: ["श्रीमान् प्रमुख ज्यू,", "{office},", "{officeAddress}।"],
    subject: "{document}को प्रतिलिपि पाऊँ।",
    body:
      "प्रस्तुत विषयमा यस कार्यालयबाट मेरो नाममा जारी भएको {document} {reason} भएकाले सोको प्रतिलिपि आवश्यक परेको छ।\n\nअतः नियमानुसार लाग्ने दस्तुर बुझाउने गरी उक्त कागजातको प्रतिलिपि उपलब्ध गराइदिनुहुन विनम्र अनुरोध गर्दछु।",
    declaration: true,
    attachments: true,
    fields: [
      { key: "office", label: { ne: "कार्यालयको नाम", en: "Office" }, example: "जिल्ला प्रशासन कार्यालय" },
      { key: "officeAddress", label: { ne: "कार्यालयको ठेगाना", en: "Office address" }, example: "रुपन्देही" },
      { key: "document", label: { ne: "कुन कागजात?", en: "Which document?" }, example: "नागरिकता प्रमाणपत्र" },
      { key: "reason", label: { ne: "किन चाहियो?", en: "Why?" }, example: "पुरानो भई च्यातिएको" },
    ],
  },
  {
    id: "general",
    title: { ne: "सामान्य निवेदन", en: "General application" },
    use: { ne: "आफ्नै विषय र कुरा लेख्न", en: "Any request, in your own words" },
    to: ["श्रीमान् {recipient} ज्यू,", "{office},", "{officeAddress}।"],
    subject: "{subjectText}",
    body: "प्रस्तुत विषयमा {message}\n\nअतः उक्त विषयमा आवश्यक व्यवस्था गरिदिनुहुन विनम्र अनुरोध गर्दछु।",
    fields: [
      { key: "recipient", label: { ne: "कसलाई? (पद)", en: "To whom? (position)" }, example: "प्रमुख" },
      { key: "office", label: { ne: "कार्यालयको नाम", en: "Office" }, example: "नगरपालिकाको कार्यालय" },
      { key: "officeAddress", label: { ne: "कार्यालयको ठेगाना", en: "Office address" }, example: "बुटवल, रुपन्देही" },
      { key: "subjectText", label: { ne: "विषय", en: "Subject" }, example: "... सम्बन्धमा।" },
      { key: "message", label: { ne: "के भएको हो?", en: "What happened?" }, example: "म ... भएकाले ..." },
    ],
  },
];

export const getLetter = (id: string) => LETTERS.find((l) => l.id === id);

/** Puts the person's words into a line of the template; empty ones become dots to fill by hand. */
export function fillLetter(text: string, values: Record<string, string>): string {
  const woman = values.ko === "की";
  return text.replace(/\{(\w+)\}/g, (_, k: string) =>
    k === "ko" ? (woman ? "की" : "को") : k === "child" ? (woman ? "छोरी" : "छोरा") : values[k]?.trim() || "............",
  );
}
