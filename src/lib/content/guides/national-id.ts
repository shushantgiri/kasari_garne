import type { Guide } from "../types";

const CHECKED = "2026-10-22";

export const nationalId: Guide = {
  slug: "national-id",
  icon: "idcard",
  departmentId: "donidcr",
  status: "under_review",
  published: true,
  popular: true,

  title: { ne: "राष्ट्रिय परिचयपत्र", en: "National ID Card" },
  question: { ne: "राष्ट्रिय परिचयपत्रका लागि कसरी दर्ता गर्ने?", en: "How do I register for the National ID card?" },
  intro: {
    ne: "पहिले अनलाइन पूर्व-दर्ता (Pre-Enrollment) फाराम भर्नुहोस्। त्यसपछि छानेको कार्यालयमा गएर फोटो, औँठाछाप र आँखाको विवरण दिनुहोस्।",
    en: "First fill in the online Pre-Enrollment form. Then go to the office you chose to give your photo, fingerprints and iris scan.",
  },
  summary: { ne: "अनलाइन पूर्व-दर्ता र कार्यालयमा बायोमेट्रिक", en: "Online pre-enrollment, then biometrics at an office" },
  category: "identity",
  mode: "partly_online",
  visit: {
    text: {
      ne: "हो — फोटो, औँठाछाप र आँखाको विवरण दिन कार्यालय जानैपर्छ।",
      en: "Yes — you must visit an office to give your photo, fingerprints and iris scan.",
    },
    check: "needs_review",
    sourceIds: ["gibl-blog", "notary-guide"],
  },
  whatNext: [
    {
      text: { ne: "आफ्नो राष्ट्रिय परिचयपत्र नम्बर विभागको \"NID Search\" मा हेर्न सकिन्छ।", en: "You can look up your National ID number with the Department's \"NID Search\"." },
      check: "official",
      sourceIds: ["donidcr-home"],
    },
  ],

  officialPortal: {
    label: { ne: "राष्ट्रिय परिचयपत्रको अनलाइन आवेदन", en: "National ID online application (Pre-Enrollment)" },
    url: "https://enrollment.donidcr.gov.np/PreEnrollment/",
    sourceIds: ["donidcr-home"],
  },
  statusCheck: {
    label: { ne: "NID नम्बर खोज्नुहोस् (NID Search)", en: "Find your NID number (NID Search)" },
    url: "https://citizenportal.donidcr.gov.np/ne/check-national-id-number",
    sourceIds: ["donidcr-home"],
  },

  eligibility: [
    {
      text: { ne: "१६ वर्ष पूरा भएको र नेपाली नागरिकताको प्रमाणपत्र भएको व्यक्ति", en: "Aged 16 or over, with a Nepali citizenship certificate" },
      check: "official",
      sourceIds: ["dao-kaski-faq"],
    },
  ],

  documents: [
    {
      text: { ne: "सक्कल नागरिकताको प्रमाणपत्र", en: "Original citizenship certificate" },
      check: "needs_review",
      sourceIds: ["gibl-blog"],
    },
    {
      text: { ne: "पूर्व-दर्ता फारामको प्रिन्ट", en: "Printout of the pre-enrollment form" },
      check: "needs_review",
      sourceIds: ["gibl-blog"],
    },
    {
      text: { ne: "बसाइँसराइ प्रमाणपत्र", en: "Migration certificate" },
      when: { ne: "ठेगाना सरेको भए", en: "If you have moved district" },
      check: "needs_review",
      sourceIds: ["gibl-blog"],
    },
    {
      text: { ne: "विवाह दर्ता प्रमाणपत्र", en: "Marriage registration certificate" },
      when: { ne: "विवाहित भए र नागरिकतामा उल्लेख नभए", en: "If married and not shown on your citizenship" },
      check: "needs_review",
      sourceIds: ["gibl-blog"],
    },
  ],

  fees: [
    {
      label: { ne: "पहिलो पटक परिचयपत्र", en: "First-time card" },
      amount: null,
      check: "needs_review",
    },
  ],

  steps: [
    {
      id: "open",
      title: { ne: "आधिकारिक पूर्व-दर्ता वेबसाइट खोल्नुहोस्", en: "Open the official pre-enrollment website" },
      body: {
        ne: "donidcr.gov.np मा \"राष्ट्रिय परिचयपत्रको अनलाईन आवेदन\" थिच्नुहोस्, वा सिधै enrollment.donidcr.gov.np खोल्नुहोस्।",
        en: "On donidcr.gov.np click \"National ID online application\", or open enrollment.donidcr.gov.np directly.",
      },
      help: {
        simpler: { ne: "ब्राउजरमा enrollment.donidcr.gov.np लेख्नुहोस्। ठेगाना .gov.np मा सकिनुपर्छ।", en: "Type enrollment.donidcr.gov.np in a browser. The address must end in .gov.np." },
      },
      check: "official",
      sourceIds: ["donidcr-home"],
      demo: { kind: "browser", url: "enrollment.donidcr.gov.np", heading: { ne: "NID Pre-Enrollment", en: "NID Pre-Enrollment" } },
    },
    {
      id: "login",
      title: { ne: "मोबाइल नम्बरले लगइन गर्नुहोस्", en: "Log in with your mobile number" },
      body: {
        ne: "आफ्नो मोबाइल नम्बर हालेर मोबाइलमा आएको OTP प्रविष्ट गर्नुहोस्। OTP कसैलाई नभन्नुहोस्।",
        en: "Enter your mobile number, then the OTP sent to your phone. Never tell anyone your OTP.",
      },
      help: {
        simpler: { ne: "आफ्नो फोन नम्बर लेख्नुहोस्। SMS मा आएको अङ्क (OTP) त्यहीँ हाल्नुहोस्।", en: "Type your phone number. Enter the number (OTP) that arrives by SMS." },
      },
      check: "needs_review",
      sourceIds: ["gibl-blog", "notary-guide"],
      demo: {
        kind: "form",
        heading: { ne: "Login", en: "Login" },
        fields: [
          { label: { ne: "मोबाइल नम्बर", en: "Mobile number" }, sample: "98XXXXXXXX" },
          { label: { ne: "OTP", en: "OTP" }, sample: "••••••" },
        ],
        button: { ne: "Login", en: "Login" },
      },
    },
    {
      id: "new",
      title: { ne: "New Enrollment थिच्नुहोस्", en: "Click New Enrollment" },
      body: {
        ne: "ड्यासबोर्डमा \"New Enrollment\" थिचेर फाराम खोल्नुहोस्। सुरुमा देखिने सूचना ध्यानले पढ्नुहोस्।",
        en: "On the dashboard click \"New Enrollment\" to open the form. Read the notice shown first.",
      },
      check: "needs_review",
      sourceIds: ["gibl-blog", "ok-nid"],
      demo: { kind: "browser", url: "enrollment.donidcr.gov.np", heading: { ne: "Dashboard", en: "Dashboard" }, button: { ne: "New Enrollment", en: "New Enrollment" } },
    },
    {
      id: "fill",
      title: { ne: "आफ्नो र परिवारको विवरण भर्नुहोस्", en: "Fill in your and your family's details" },
      body: {
        ne: "नाम, जन्ममिति, नागरिकता नम्बर, ठेगाना र बुबा-आमाको नाम नागरिकतामा जस्तै भर्नुहोस्।",
        en: "Enter your name, date of birth, citizenship number, address and parents' names exactly as on your citizenship.",
      },
      help: {
        simpler: { ne: "नागरिकता हेर्दै भर्नुहोस्। आफ्नो, बुबा, आमाको नाम नागरिकतामा जस्तै लेख्नुहोस्।", en: "Copy from your citizenship. Write your own and your parents' names as they appear there." },
      },
      check: "needs_review",
      sourceIds: ["ok-nid", "notary-guide"],
      demo: {
        kind: "form",
        heading: { ne: "व्यक्तिगत विवरण", en: "Personal details" },
        fields: [
          { label: { ne: "नाम थर", en: "Full name" }, sample: "नमूना प्रयोगकर्ता" },
          { label: { ne: "नागरिकता नं.", en: "Citizenship no." }, sample: "00-00-00-00000" },
          { label: { ne: "बुबाको नाम", en: "Father's name" }, sample: "नमूना" },
        ],
        button: { ne: "Next", en: "Next" },
      },
    },
    {
      id: "appointment",
      title: { ne: "कार्यालय र मिति छान्नुहोस्", en: "Choose the office and date" },
      body: {
        ne: "नजिकको दर्ता गर्ने कार्यालय (जिल्ला/इलाका प्रशासन कार्यालय) र जाने मिति छान्नुहोस्।",
        en: "Choose the nearest enrollment office (District/Area Administration Office) and a date to visit.",
      },
      check: "needs_review",
      sourceIds: ["notary-guide"],
    },
    {
      id: "submit",
      title: { ne: "जाँचेर पेस गर्नुहोस् र प्रिन्ट गर्नुहोस्", en: "Check, submit and print" },
      body: {
        ne: "Preview मा सबै विवरण जाँचेर मात्र Submit गर्नुहोस्। आएको फाराम/टोकन प्रिन्ट गरेर राख्नुहोस्।",
        en: "Check everything in the preview before you Submit. Print the form/token you receive.",
      },
      help: {
        simpler: { ne: "Submit गर्नुअघि सबै विवरण एकपटक पढ्नुहोस्। आएको पृष्ठ प्रिन्ट वा फोनमा सेभ गर्नुहोस्।", en: "Read everything once before Submit. Print or save the page you get." },
      },
      check: "needs_review",
      sourceIds: ["ok-nid", "notary-guide"],
      demo: { kind: "message", heading: { ne: "Preview (नमूना)", en: "Preview (sample)" }, button: { ne: "Submit", en: "Submit" } },
    },
    {
      id: "biometric",
      title: { ne: "कार्यालयमा बायोमेट्रिक दिनुहोस्", en: "Give biometrics at the office" },
      body: {
        ne: "तोकिएको दिन सक्कल नागरिकता र प्रिन्ट लिएर जानुहोस्। फोटो, दश औँलाको छाप र आँखाको विवरण लिइन्छ।",
        en: "Go on your date with your original citizenship and printout. Your photo, ten fingerprints and iris are captured.",
      },
      check: "needs_review",
      sourceIds: ["gibl-blog", "notary-guide"],
    },
    {
      id: "check",
      title: { ne: "आफ्नो NID नम्बर हेर्नुहोस्", en: "Look up your NID number" },
      body: {
        ne: "विभागको वेबसाइटको \"NID Search\" बाट आफ्नो राष्ट्रिय परिचयपत्र नम्बर हेर्न सकिन्छ।",
        en: "Use \"NID Search\" on the Department's website to find your National ID number.",
      },
      check: "official",
      sourceIds: ["donidcr-home"],
      demo: { kind: "browser", url: "citizenportal.donidcr.gov.np", heading: { ne: "NID Search", en: "NID Search" } },
    },
  ],

  mistakes: [
    {
      text: {
        ne: "नागरिकतामा भन्दा फरक हिज्जे वा जन्ममिति नलेख्नुहोस् — पछि सच्याउन झन्झट हुन्छ।",
        en: "Don't use spellings or dates different from your citizenship — corrections later are a hassle.",
      },
      check: "needs_review",
      sourceIds: ["notary-guide"],
    },
    {
      text: {
        ne: ".gov.np नभएका वेबसाइटमा नागरिकता नम्बर वा OTP नहाल्नुहोस्।",
        en: "Never enter your citizenship number or OTP on a site that isn't .gov.np.",
      },
      check: "official",
      sourceIds: ["donidcr-home"],
    },
    {
      text: {
        ne: "बायोमेट्रिकको दिन सक्कल नागरिकता बिर्सनुहुन्न।",
        en: "Don't forget your original citizenship on biometrics day.",
      },
      check: "needs_review",
      sourceIds: ["gibl-blog"],
    },
  ],

  faqs: [
    {
      q: { ne: "कसले राष्ट्रिय परिचयपत्र लिन पाउँछ?", en: "Who can get a National ID?" },
      a: { ne: "१६ वर्ष पूरा भएका, नेपाली नागरिकता भएका व्यक्तिले।", en: "Anyone 16 or older with Nepali citizenship." },
      check: "official",
      sourceIds: ["dao-kaski-faq"],
    },
    {
      q: { ne: "सहायताका लागि कहाँ फोन गर्ने?", en: "Where can I call for help?" },
      a: { ne: "विभागको टोल फ्री नम्बर ११४७।", en: "The Department's toll-free number 1147." },
      check: "official",
      sourceIds: ["donidcr-home"],
    },
    {
      q: { ne: "शुल्क लाग्छ?", en: "Is there a fee?" },
      a: {
        ne: "पहिलो पटक निःशुल्क भनिएको छ, तर हामीले यो आधिकारिक पृष्ठबाट अझै पुष्टि गरेका छैनौँ। कार्यालयमा सोध्नुहोस्।",
        en: "It is reported to be free the first time, but we have not yet confirmed this on an official page. Ask at the office.",
      },
      check: "needs_review",
      sourceIds: ["notary-guide"],
    },
  ],

  sources: [
    { id: "donidcr-home", title: "DoNIDCR — home page: online services (online application, NID Search) and toll-free 1147", url: "https://donidcr.gov.np/", official: true, checkedOn: CHECKED },
    { id: "dao-kaski-faq", title: "District Administration Office, Kaski — National ID FAQ (PDF)", url: "https://daokaski.moha.gov.np/assets/8/faq_nin.pdf/file", official: true, checkedOn: CHECKED },
    { id: "gibl-blog", title: "Global IME Bank blog — How to get a National ID card (not official)", url: "https://www.globalimebank.com/blog/national-id-card-in-nepal-for-banking/", official: false, checkedOn: CHECKED },
    { id: "ok-nid", title: "Onlinekhabar English — How to apply for the national identity card (not official)", url: "https://english.onlinekhabar.com/how-to-nepal-national-identity-card.html", official: false, checkedOn: CHECKED },
    { id: "notary-guide", title: "Notary Nepal — National ID registration guide 2026 (not official)", url: "https://notarynepal.com/blog/national-id-registration-in-nepal", official: false, checkedOn: CHECKED },
  ],
  lastChecked: CHECKED,
  checkedBy: "Seed content (Claude), pending admin review",
  reviewNotes:
    "Official: the two portal links, toll-free 1147 (DoNIDCR home page) and the 16+ with citizenship rule (DAO Kaski FAQ). Everything about the screens, documents to bring and fees comes from non-official guides — open the pre-enrollment portal, the DoNIDCR FAQ page and citizen charter, then confirm or correct each item before marking Verified.",

  video: { kind: "live" },
  keywords: [
    "nid", "national id", "national identity", "id card", "parichaya patra", "parichayapatra", "rastriya",
    "राष्ट्रिय", "परिचयपत्र", "परिचय पत्र", "परिचय", "एनआइडी", "biometric", "बायोमेट्रिक", "donidcr",
  ],
  related: ["passport", "driving-licence"],
  updatedAt: CHECKED,
};
