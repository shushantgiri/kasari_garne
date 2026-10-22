import type { Guide } from "../types";

const CHECKED = "2026-10-22";

export const passport: Guide = {
  slug: "passport",
  icon: "passport",
  departmentId: "dop",
  status: "under_review",
  published: true,
  popular: true,

  title: { ne: "राहदानी (ई-पासपोर्ट)", en: "Passport (e-Passport)" },
  question: { ne: "नेपालमा राहदानी कसरी बनाउने?", en: "How to get a passport in Nepal" },
  intro: {
    ne: "अनलाइन फाराम भरेर भेट्ने मिति लिनुहोस्, अनि त्यस दिन कागजात लिएर फोटो र औँठाछाप दिन कार्यालय जानुहोस्।",
    en: "Fill in the online form, book an appointment, then go to the office that day with your documents for photo and fingerprints.",
  },
  summary: { ne: "नयाँ, नवीकरण वा हराएको राहदानीको अनलाइन फाराम", en: "Online form for a new, renewed or lost passport" },
  category: "identity",
  mode: "partly_online",
  visit: {
    text: {
      ne: "हो — फोटो र औँठाछाप दिन तोकिएको दिन कार्यालय जानैपर्छ।",
      en: "Yes — you must go to the office on your appointment day for photo and fingerprints.",
    },
    check: "official",
    sourceIds: ["dop-in-nepal", "br-embassy-pdf"],
  },
  whatNext: [
    {
      text: { ne: "कार्यालयमा फोटो र औँठाछाप लिइन्छ।", en: "Your photo and fingerprints are taken at the office." },
      check: "official",
      sourceIds: ["br-embassy-pdf"],
    },
    {
      text: { ne: "राहदानी कार्यालयमा आइपुगेपछि मोबाइलमा SMS आउँछ।", en: "You get an SMS when the passport reaches the office." },
      check: "official",
      sourceIds: ["dop-home"],
    },
  ],
  estimatedTime: {
    text: {
      ne: "जिल्ला/इलाका प्रशासन कार्यालयबाट (साधारण सेवा): प्रायः १० देखि ३० दिन",
      en: "Through a District/Area Administration Office (regular service): usually 10 to 30 days",
    },
    note: {
      ne: "कार्यालय राहदानी विभागबाट कति टाढा छ भन्नेमा फरक पर्छ।",
      en: "It depends on how far the office is from the Department of Passports.",
    },
    check: "official",
    sourceIds: ["dop-in-nepal"],
  },

  officialPortal: {
    label: { ne: "राहदानी विभाग — Apply for Passport", en: "Department of Passports — Apply for Passport" },
    url: "https://nepalpassport.gov.np",
    sourceIds: ["dop-in-nepal", "br-embassy-steps"],
  },
  statusCheck: {
    label: { ne: "राहदानीको अवस्था: विभागको वेबसाइट वा Nepal ePassport एप", en: "Status: Department website or the Nepal ePassport app" },
    url: "https://nepalpassport.gov.np",
    sourceIds: ["dop-in-nepal", "br-embassy-steps"],
  },

  situations: [
    {
      id: "first",
      label: { ne: "पहिलो पटक राहदानी बनाउने", en: "Apply for the first time" },
      hint: { ne: "कहिल्यै राहदानी बनाउनुभएको छैन भने।", en: "You have never had a passport." },
      check: "official",
      sourceIds: ["dop-process", "in-embassy"],
    },
    {
      id: "renew",
      label: { ne: "राहदानी नवीकरण गर्ने", en: "Renew my passport" },
      hint: { ne: "पुरानो वा म्याद सकिएको राहदानी छ भने।", en: "You have an old or expired passport." },
      check: "official",
      sourceIds: ["dop-process", "in-embassy"],
    },
    {
      id: "replace",
      label: { ne: "हराएको वा बिग्रिएको राहदानी", en: "Replace a lost or damaged passport" },
      hint: { ne: "राहदानी हरायो, चोरी भयो वा बिग्रियो भने।", en: "Your passport was lost, stolen or damaged." },
      check: "official",
      sourceIds: ["dop-process", "in-embassy"],
    },
  ],

  eligibility: [
    {
      text: { ne: "नेपाली नागरिकताको प्रमाणपत्र भएको व्यक्ति", en: "A person with a Nepali citizenship certificate" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      text: { ne: "१६ वर्षमुनिका नाबालकका लागि नाबालक परिचयपत्र", en: "For minors under 16: a Minor Identity Card" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
  ],

  documents: [
    {
      text: { ne: "अनलाइन फाराम (बारकोड र QR कोड भएको) — प्रिन्ट गरेको भए राम्रो", en: "The online form with barcode and QR code — preferably printed" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      text: { ne: "सक्कल नागरिकता (वा सक्कल नाबालक परिचयपत्र)", en: "Original citizenship (or original Minor Identity Card)" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      text: { ne: "पुरानो वा म्याद सकिएको राहदानी", en: "Your current or expired passport" },
      when: { ne: "पहिले राहदानी बनाएको भए", en: "If you had a Nepali passport before" },
      for: ["renew", "replace"],
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      text: { ne: "राष्ट्रिय परिचयपत्र वा राष्ट्रिय परिचयपत्र नम्बर", en: "National ID card or National ID number" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      text: { ne: "दस्तुर तिरेको बैंक भौचर वा नगद रसिद", en: "Bank voucher or cash receipt for the fee" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      text: { ne: "विवाह दर्ता प्रमाणपत्र र पतिको नागरिकता", en: "Marriage registration certificate and husband's citizenship" },
      when: { ne: "विवाहित महिलाले पतिको थर थप्न चाहेमा", en: "If a married woman wants to add her husband's surname" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      text: { ne: "SLC/SEE वा माथिको शैक्षिक प्रमाणपत्र", en: "SLC/SEE or higher education certificate" },
      when: { ne: "शैक्षिक प्रमाणपत्रको जन्ममिति राख्न चाहेमा", en: "If you want the date of birth from your education certificate" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
  ],

  fees: [
    {
      label: { ne: "साधारण सेवा (३४ वा ६६ पेज)", en: "Regular service (34 or 66 pages)" },
      amount: null,
      check: "needs_review",
      sourceIds: ["dop-in-nepal"],
    },
    {
      label: { ne: "छिटो (आकस्मिक) सेवाको थप दस्तुर — ३४ पेज", en: "Extra fee for emergency service — 34 pages" },
      amount: { ne: "रु. ७,०००", en: "NPR 7,000" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      label: { ne: "छिटो (आकस्मिक) सेवाको थप दस्तुर — ६६ पेज", en: "Extra fee for emergency service — 66 pages" },
      amount: { ne: "रु. १२,०००", en: "NPR 12,000" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
  ],

  steps: [
    {
      id: "open",
      title: { ne: "राहदानी विभागको वेबसाइट खोल्नुहोस्", en: "Open the Department of Passports website" },
      body: {
        ne: "nepalpassport.gov.np खोलेर तल \"Apply for Passport\" थिच्नुहोस्। सुरु गर्नुअघि फोन/कम्प्युटरको समय नेपाल (UTC+5:45) मा मिलाउनुहोस्।",
        en: "Open nepalpassport.gov.np and click \"Apply for Passport\". Before you start, set your phone/computer time zone to Nepal (UTC+5:45).",
      },
      help: {
        simpler: { ne: "ब्राउजरमा nepalpassport.gov.np लेख्नुहोस्। पृष्ठको तलतिर \"Apply for Passport\" लेखिएको बटन खोज्नुहोस्।", en: "Type nepalpassport.gov.np in a browser. Scroll down to the button that says \"Apply for Passport\"." },
      },
      check: "official",
      sourceIds: ["br-embassy-steps", "ca-embassy"],
      demo: { kind: "browser", url: "nepalpassport.gov.np", heading: { ne: "Department of Passports", en: "Department of Passports" }, button: { ne: "Apply for Passport", en: "Apply for Passport" } },
    },
    {
      id: "type",
      title: { ne: "आवेदनको प्रकार छान्नुहोस्", en: "Choose the application type" },
      body: {
        ne: "नयाँका लागि First Issuance, नवीकरणका लागि Renewal, हराएको भए Replacement (Lost/Stolen), बिग्रिएको भए Damaged छान्नुहोस्।",
        en: "Choose First Issuance for new, Renewal to renew, Replacement (Lost/Stolen) if lost, or Damaged if damaged.",
      },
      bodyFor: {
        first: { ne: "First Issuance छान्नुहोस्।", en: "Choose First Issuance." },
        renew: { ne: "Renewal छान्नुहोस्।", en: "Choose Renewal." },
        replace: { ne: "हराएको वा चोरी भएको भए Replacement (Lost/Stolen), बिग्रिएको भए Damaged छान्नुहोस्।", en: "Choose Replacement (Lost/Stolen) if it was lost or stolen, or Damaged if it is damaged." },
      },
      help: {
        simpler: { ne: "कहिल्यै राहदानी बनाउनुभएको छैन भने First Issuance। पुरानो राहदानी छ भने Renewal।", en: "Never had a passport? First Issuance. Have an old one? Renewal." },
        example: { ne: "उदाहरण: २०७० सालमा बनाएको राहदानीको म्याद सकियो → Renewal।", en: "Example: your 2013 passport expired → Renewal." },
      },
      check: "official",
      sourceIds: ["dop-process", "in-embassy"],
      demo: {
        kind: "list",
        url: "nepalpassport.gov.np",
        heading: { ne: "आवेदनको प्रकार", en: "Application type" },
        items: [
          { ne: "First Issuance — पहिलो पटक", en: "First Issuance — first time" },
          { ne: "Renewal — नवीकरण", en: "Renewal" },
          { ne: "Replacement (Lost/Stolen) — हराएको", en: "Replacement (Lost/Stolen)" },
          { ne: "Replacement (Damaged) — बिग्रिएको", en: "Replacement (Damaged)" },
        ],
      },
    },
    {
      id: "pages",
      title: { ne: "३४ वा ६६ पेज छान्नुहोस्", en: "Choose 34 or 66 pages" },
      body: {
        ne: "निर्देशन पढेर Ordinary 34 pages वा 66 pages छान्नुहोस् र Proceed थिच्नुहोस्।",
        en: "Read the instructions, choose Ordinary 34 pages or 66 pages and click Proceed.",
      },
      help: {
        simpler: { ne: "धेरै विदेश यात्रा नगर्ने हो भने ३४ पेज प्रायः पुग्छ।", en: "If you don't travel abroad often, 34 pages is usually enough." },
      },
      check: "official",
      sourceIds: ["dop-process", "br-embassy-steps"],
      demo: { kind: "form", heading: { ne: "राहदानीको प्रकार", en: "Passport type" }, fields: [{ label: { ne: "प्रकार", en: "Type" }, sample: "Ordinary 34 pages" }], button: { ne: "Proceed", en: "Proceed" } },
    },
    {
      id: "appointment",
      title: { ne: "कार्यालय र भेट्ने मिति छान्नुहोस्", en: "Pick the office and appointment" },
      body: {
        ne: "नेपालमा: नागरिकता बनेको जिल्ला वा इलाका प्रशासन कार्यालय छान्नुहोस्। छिटो सेवाका लागि मात्र त्रिपुरेश्वरको राहदानी विभाग छान्नुहोस्।",
        en: "In Nepal: choose the District or Area Administration Office that issued your citizenship. Choose the Department in Tripureshwor only for emergency service.",
      },
      help: {
        simpler: { ne: "आफ्नो नागरिकता जुन जिल्ला/इलाकाबाट बनेको हो, त्यही कार्यालय छान्नुहोस्।", en: "Choose the same district/area office that issued your citizenship." },
        example: { ne: "नागरिकता रूपन्देहीबाट बनेको (नमूना) → जिल्ला प्रशासन कार्यालय, रूपन्देही।", en: "Citizenship from Rupandehi (sample) → District Administration Office, Rupandehi." },
      },
      check: "official",
      sourceIds: ["dop-in-nepal", "br-embassy-steps"],
      demo: {
        kind: "form",
        heading: { ne: "Book your Appointment", en: "Book your Appointment" },
        fields: [
          { label: { ne: "जिल्ला", en: "District" }, sample: "(नमूना जिल्ला)" },
          { label: { ne: "कार्यालय", en: "Location" }, sample: "जिल्ला प्रशासन कार्यालय" },
          { label: { ne: "मिति र समय", en: "Date & time" }, sample: "—" },
        ],
        button: { ne: "Next", en: "Next" },
      },
    },
    {
      id: "form",
      title: { ne: "विवरण भर्नुहोस्", en: "Fill in your details" },
      body: {
        ne: "* चिन्ह भएका कुनै पनि ठाउँ खाली नछोड्नुहोस्। नागरिकता नम्बर लेख्दा - र / नराख्नुहोस्; १४ अङ्कभन्दा लामो भए दायाँबाट १४ अङ्क लेख्नुहोस्।",
        en: "Don't leave any * field blank. Type the citizenship number without - or /; if it is longer than 14 digits, enter the last 14 digits.",
      },
      help: {
        simpler: { ne: "तारा (*) भएका सबै खाली ठाउँ भर्नुहोस्। नागरिकता नम्बरमा अङ्क मात्र लेख्नुहोस्।", en: "Fill every box marked with a star (*). Use only digits in the citizenship number." },
        example: { ne: "072-312-13792/432796 → 31213792432796 (दायाँबाट १४ अङ्क)", en: "072-312-13792/432796 → 31213792432796 (last 14 digits)" },
      },
      check: "official",
      sourceIds: ["dop-home", "br-embassy-steps"],
      demo: {
        kind: "form",
        heading: { ne: "Demographic Information", en: "Demographic Information" },
        fields: [
          { label: { ne: "Surname *", en: "Surname *" }, sample: "NAMUNA" },
          { label: { ne: "Given name *", en: "Given name *" }, sample: "PRAYOGKARTA" },
          { label: { ne: "Citizenship No. *", en: "Citizenship No. *" }, sample: "00000000000000" },
        ],
        button: { ne: "Next", en: "Next" },
      },
    },
    {
      id: "upload",
      title: { ne: "कागजात अपलोड गर्नुहोस्", en: "Upload your documents" },
      body: {
        ne: "नयाँका लागि नागरिकताको अगाडि र पछाडि। नवीकरण/हराएको/बिग्रिएकोमा राहदानीको पनि। सक्कलको फोटो/स्क्यान हाल्नुहोस्, फोटोकपीको होइन।",
        en: "For new: citizenship front and back. For renewal/lost/damaged: passport pages too. Use images of originals, not photocopies.",
      },
      bodyFor: {
        first: { ne: "नागरिकताको अगाडि र पछाडि अपलोड गर्नुहोस्। सक्कलको फोटो/स्क्यान हाल्नुहोस्, फोटोकपीको होइन।", en: "Upload your citizenship, front and back. Use images of originals, not photocopies." },
        renew: { ne: "नागरिकताको अगाडि र पछाडि, र राहदानीका पेज अपलोड गर्नुहोस्। सक्कलको फोटो/स्क्यान हाल्नुहोस्, फोटोकपीको होइन।", en: "Upload your citizenship, front and back, and your passport pages. Use images of originals, not photocopies." },
        replace: { ne: "नागरिकताको अगाडि र पछाडि, र राहदानीका पेज अपलोड गर्नुहोस्। सक्कलको फोटो/स्क्यान हाल्नुहोस्, फोटोकपीको होइन।", en: "Upload your citizenship, front and back, and your passport pages. Use images of originals, not photocopies." },
      },
      help: {
        simpler: { ne: "सक्कल नागरिकताको दुवैतर्फको सफा फोटो खिच्नुहोस् र एक-एक गरी अपलोड गर्नुहोस्।", en: "Take clear photos of both sides of your original citizenship and upload them one by one." },
      },
      check: "official",
      sourceIds: ["br-embassy-steps", "br-embassy-pdf"],
      demo: {
        kind: "list",
        heading: { ne: "अपलोड", en: "Upload" },
        items: [
          { ne: "नागरिकता — अगाडि", en: "Citizenship — front" },
          { ne: "नागरिकता — पछाडि", en: "Citizenship — back" },
          { ne: "पुरानो राहदानी (नवीकरण भए)", en: "Old passport (renewal)" },
        ],
      },
    },
    {
      id: "review",
      title: { ne: "जाँचेर Save गर्नुहोस् र फाराम प्रिन्ट गर्नुहोस्", en: "Review, save and print the form" },
      body: {
        ne: "Application Summary मा सबै विवरण जाँच्नुहोस्। Save र Finish थिचेपछि PDF डाउनलोड गरेर A4 मा प्रिन्ट गर्नुहोस्।",
        en: "Check everything on the Application Summary. After Save and Finish, download the PDF and print it on A4.",
      },
      help: {
        simpler: { ne: "सारांशमा नाम र जन्ममिति फेरि पढ्नुहोस्। ठीक भए Save, अनि PDF लाई A4 कागजमा प्रिन्ट गर्नुहोस्।", en: "Read your name and date of birth again on the summary. If correct, Save, then print the PDF on A4 paper." },
      },
      check: "official",
      sourceIds: ["br-embassy-steps"],
      demo: { kind: "message", heading: { ne: "Application Summary (नमूना)", en: "Application Summary (sample)" }, button: { ne: "Download PDF", en: "Download PDF" } },
    },
    {
      id: "visit",
      title: { ne: "दस्तुर तिरेर तोकिएको दिन कार्यालय जानुहोस्", en: "Pay the fee and go on your appointment day" },
      body: {
        ne: "दस्तुर तिरेको भौचर, प्रिन्ट गरेको फाराम र सक्कल कागजात लिएर जानुहोस्। त्यहाँ फोटो र औँठाछाप लिइन्छ। राहदानी आएपछि SMS आउँछ।",
        en: "Take the fee voucher, printed form and original documents. Your photo and fingerprints are taken there. You get an SMS when the passport arrives.",
      },
      help: {
        simpler: { ne: "बैंकमा दस्तुर तिरेर भौचर लिनुहोस्। तोकिएको दिन फाराम, भौचर र सक्कल कागजात लिएर जानुहोस्।", en: "Pay the fee at the bank and keep the voucher. On your day, take the form, voucher and original documents." },
      },
      check: "official",
      sourceIds: ["dop-in-nepal", "dop-home"],
    },
  ],

  mistakes: [
    {
      text: {
        ne: "छापिएको राहदानीमा गल्ती भए नयाँ दस्तुर तिरेर फेरि सुरुदेखि आवेदन दिनुपर्छ। फाराम पेस गर्नुअघि अक्षर-अक्षर जाँच्नुहोस्।",
        en: "A mistake in the printed passport means paying again and starting over. Check every letter before you submit.",
      },
      check: "official",
      sourceIds: ["dop-process"],
    },
    {
      text: {
        ne: "छिटो सेवा लिँदा पनि कहिलेकाहीँ ढिला हुन सक्छ। राहदानी हातमा आएपछि मात्र टिकट काट्नुहोस्।",
        en: "Even emergency service can be delayed. Book tickets only after you have the passport.",
      },
      check: "official",
      sourceIds: ["dop-home"],
    },
    {
      text: {
        ne: "जिल्ला/इलाका प्रशासन कार्यालयमा छिटो सेवा पाइँदैन, र राहदानी विभागमा साधारण सेवा पाइँदैन।",
        en: "District/Area offices don't offer emergency service, and the Department doesn't offer regular service.",
      },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
    {
      text: {
        ne: "फोटोकपीको फोटो अपलोड नगर्नुहोस् — सक्कल कागजातको मात्र।",
        en: "Don't upload pictures of photocopies — only of the originals.",
      },
      check: "official",
      sourceIds: ["br-embassy-steps"],
    },
    {
      text: {
        ne: "अनलाइन फाराम लामो समय खुला छोडे सत्र (session) सकिन सक्छ। कागजातका फोटो पहिल्यै तयार राख्नुहोस्।",
        en: "The online session can expire if left open too long. Have your document photos ready first.",
      },
      check: "official",
      sourceIds: ["us-embassy"],
    },
  ],

  faqs: [
    {
      q: { ne: "छिटो सेवामा कति दिन लाग्छ?", en: "How long does emergency service take?" },
      a: {
        ne: "त्रिपुरेश्वरको राहदानी विभागमा फोटो/औँठाछाप दिएपछि प्रायः दुई कार्यदिनमा। विवरण रुजु गर्न बाँकी भए ढिला हुन सक्छ।",
        en: "Usually two working days after enrollment at the Department in Tripureshwor. It can take longer if details need verifying.",
      },
      check: "official",
      sourceIds: ["dop-in-nepal", "dop-home"],
    },
    {
      q: { ne: "काठमाडौं उपत्यकाबाहिर कति दिन लाग्छ?", en: "How long outside Kathmandu Valley?" },
      a: {
        ne: "उपत्यकाका तीन जिल्लामा करिब एक हप्ता। महेन्द्र राजमार्ग आसपास र हवाई सेवा भएका जिल्लामा करिब १५ दिन।",
        en: "About a week in the three Valley districts; about 15 days along the Mahendra Highway and in districts with air service.",
      },
      check: "official",
      sourceIds: ["dop-home"],
    },
    {
      q: { ne: "साधारण सेवाको दस्तुर कति हो?", en: "What is the regular-service fee?" },
      a: {
        ne: "विभागको \"Revenue for passport\" पृष्ठमा हेर्नुहोस्। हामीले यो रकम अझै आधिकारिक पृष्ठबाट पुष्टि गर्न सकेका छैनौँ।",
        en: "See the Department's \"Revenue for passport\" page. We have not yet confirmed this amount on the official page.",
      },
      check: "needs_review",
      sourceIds: ["dop-in-nepal"],
    },
    {
      q: { ne: "विभागको सम्पर्क नम्बर के हो?", en: "How do I contact the Department?" },
      a: { ne: "सोधपुछ: ०१-५९७०३३० वा info@nepalpassport.gov.np", en: "Enquiry: 01-5970330 or info@nepalpassport.gov.np" },
      check: "official",
      sourceIds: ["dop-in-nepal"],
    },
  ],

  sources: [
    { id: "dop-in-nepal", title: "Department of Passports — \"If you are in Nepal\" (where to apply, documents, emergency fee)", url: "https://nepalpassport.gov.np/en/process/process-20", official: true, checkedOn: CHECKED },
    { id: "dop-process", title: "Department of Passports — Passport application process", url: "https://nepalpassport.gov.np/en/process/process-23", official: true, checkedOn: CHECKED },
    { id: "dop-home", title: "Department of Passports — home page notices (processing times, citizenship-number rule)", url: "https://nepalpassport.gov.np/", official: true, checkedOn: CHECKED },
    { id: "br-embassy-steps", title: "Embassy of Nepal, Brasília — Guidelines to apply for the e-Passport", url: "https://br.nepalembassy.gov.np/?p=2466", official: true, checkedOn: CHECKED },
    { id: "br-embassy-pdf", title: "Embassy of Nepal, Brasília — Step-by-step guide to the online form (PDF)", url: "https://br.nepalembassy.gov.np/wp-content/uploads/2023/11/Step-by-Step-Guide-to-fill-in-the-online-form.pdf", official: true, checkedOn: CHECKED },
    { id: "in-embassy", title: "Embassy of Nepal, New Delhi — e-Passport pre-enrollment", url: "https://in.nepalembassy.gov.np/pages/Passport-2/", official: true, checkedOn: CHECKED },
    { id: "ca-embassy", title: "Embassy of Nepal, Ottawa — set time zone to UTC+5:45", url: "https://ca.nepalembassy.gov.np/pages/passport-5/", official: true, checkedOn: CHECKED },
    { id: "us-embassy", title: "Embassy of Nepal, Washington DC — online session time limit", url: "https://us.nepalembassy.gov.np/pages/e-passport-1/", official: true, checkedOn: CHECKED },
  ],
  lastChecked: CHECKED,
  checkedBy: "Seed content (Claude), pending admin review",
  reviewNotes:
    "Documents, where to apply, processing times and the emergency surcharge come from the Department of Passports. Form steps come from Nepali embassy guides (official, but written for applicants abroad) — confirm the in-Nepal screens on the live portal. Regular-service fee NOT confirmed: the 'Revenue for passport' page blocked automated reading and secondary sources disagree. The pre-enrollment URL also differs between sources (emrtds. vs online.) — so the guide links to nepalpassport.gov.np's own 'Apply for Passport' button.",

  video: { kind: "live" },
  keywords: [
    "passport", "pasport", "pass port", "e-passport", "epassport", "rahadani", "rahdani", "rahadaani",
    "राहदानी", "पासपोर्ट", "पास्पोर्ट", "renew", "renewal", "नवीकरण", "dop", "tripureshwor",
  ],
  related: ["national-id", "driving-licence"],
  updatedAt: CHECKED,
};
