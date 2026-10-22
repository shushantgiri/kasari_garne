import type { Guide } from "../types";

const CHECKED = "2026-10-22";

export const drivingLicence: Guide = {
  slug: "driving-licence",
  icon: "car",
  departmentId: "dotm",
  status: "under_review",
  published: true,
  popular: true,

  title: { ne: "सवारी चालक अनुमतिपत्र (लाइसेन्स)", en: "Driving Licence" },
  question: { ne: "नेपालमा ड्राइभिङ लाइसेन्स कसरी बनाउने?", en: "How to get a driving licence in Nepal" },
  intro: {
    ne: "अनलाइन फाराम भर्नुहोस्, अनि तोकिएको दिन कार्यालय गएर कागजात जाँच र औँठाछाप, फोटो दिनुहोस्।",
    en: "Fill in the online form, then visit the office on your date for document checks, fingerprints and a photo.",
  },
  summary: { ne: "नयाँ लाइसेन्स वा वर्ग थपको अनलाइन फाराम", en: "Online form for a new licence or added category" },
  category: "transport",
  mode: "partly_online",
  visit: {
    text: {
      ne: "हो — विवरण रुजु, बायोमेट्रिक, लिखित र ट्रायल परीक्षाका लागि कार्यालय जानैपर्छ।",
      en: "Yes — you must visit the office for checks, biometrics, the written exam and the trial.",
    },
    check: "official",
    sourceIds: ["dotm-portal"],
  },
  whatNext: [
    {
      text: { ne: "तोकिएको दिन कार्यालयमा विवरण रुजु र बायोमेट्रिक हुन्छ।", en: "On your date, the office checks your details and takes biometrics." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "त्यसपछि लिखित र प्रयोगात्मक (ट्रायल) परीक्षा।", en: "Then the written and practical (trial) exams." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "स्मार्ट लाइसेन्स छापियो कि छैन \"License print check\" मा हेर्नुहोस्।", en: "Use \"License print check\" to see if your smart licence is printed." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
  ],

  officialPortal: {
    label: { ne: "सवारी चालक अनुमतिपत्र अनलाइन आवेदन", en: "Online Driving Licence System (DoTM)" },
    url: "https://applydlnew.dotm.gov.np",
    sourceIds: ["dotm-portal"],
  },
  statusCheck: {
    label: { ne: "लाइसेन्स छापियो कि छैन हेर्नुहोस् (License print check)", en: "Check if your smart licence is printed (License print check)" },
    url: "https://applydlnew.dotm.gov.np",
    sourceIds: ["dotm-portal"],
  },

  situations: [
    {
      id: "new",
      label: { ne: "नयाँ लाइसेन्स बनाउने", en: "Apply for a new licence" },
      hint: { ne: "अहिलेसम्म कुनै लाइसेन्स छैन भने।", en: "You don't have a licence yet." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      id: "add-category",
      label: { ne: "लाइसेन्समा वर्ग थप्ने", en: "Add a category to my licence" },
      hint: { ne: "लाइसेन्स छ, अर्को सवारीको वर्ग (जस्तै B) थप्ने भए।", en: "You have a licence and want another vehicle category (e.g. B)." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    // Not verified on an official page yet: offered as choices, with no steps.
    {
      id: "renew",
      label: { ne: "लाइसेन्स नवीकरण गर्ने", en: "Renew my licence" },
      hint: { ne: "लाइसेन्सको म्याद सकियो वा सकिँदैछ भने।", en: "Your licence has expired or is about to." },
      check: "needs_review",
      pending: true,
    },
    {
      id: "lost",
      label: { ne: "हराएको लाइसेन्स", en: "Replace a lost licence" },
      hint: { ne: "लाइसेन्स हरायो वा चोरी भयो भने।", en: "Your licence was lost or stolen." },
      check: "needs_review",
      pending: true,
    },
    {
      id: "damaged",
      label: { ne: "बिग्रिएको लाइसेन्स", en: "Replace a damaged licence" },
      hint: { ne: "कार्ड फुट्यो वा पढ्न नसकिने भयो भने।", en: "The card is broken or can't be read." },
      check: "needs_review",
      pending: true,
    },
    {
      id: "status",
      label: { ne: "अवस्था हेर्ने / लाइसेन्स लिने", en: "Check status or collect" },
      hint: { ne: "आवेदन दिइसक्नुभयो र कार्ड छापियो कि हेर्ने भए।", en: "You've applied and want to know if your card is printed." },
      check: "needs_review",
      pending: true,
    },
  ],

  eligibility: [
    {
      text: {
        ne: "मोटरसाइकल, स्कुटर (वर्ग A/K): १६ वर्ष पूरा",
        en: "Motorcycle, scooter (category A/K): 16 years completed",
      },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "कार, जिप, भ्यान (वर्ग B): १८ वर्ष पूरा", en: "Car, jeep, van (category B): 18 years completed" },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "अन्य सवारी: २१ वर्ष पूरा", en: "Other vehicles: 21 years completed" },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
  ],

  documents: [
    {
      text: { ne: "आफ्नै नाममा दर्ता भएको मोबाइल नम्बर", en: "A mobile number registered in your own name" },
      note: { ne: "यो नम्बर पछि फेर्न मिल्दैन।", en: "You cannot change this number later." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "नागरिकताको सक्कल प्रति स्क्यान गरेको फाइल", en: "Scanned copy of your original citizenship certificate" },
      note: { ne: "फोटोकपीको फोटो होइन, सक्कलको स्क्यान।", en: "A scan of the original, not of a photocopy." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "राहदानी वा पुरानो लाइसेन्सको स्क्यान", en: "Scan of passport or existing licence" },
      when: { ne: "भए मात्र / वर्ग थप गर्दा", en: "If you have one / when adding a category" },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "कार्यालय जाँदा: सक्कल नागरिकता", en: "When visiting the office: original citizenship" },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "कार्यालय जाँदा: सक्कल लाइसेन्स", en: "When visiting the office: original licence" },
      when: { ne: "वर्ग थपको हकमा", en: "When adding a category" },
      for: ["add-category"],
      check: "official",
      sourceIds: ["dotm-portal"],
    },
  ],

  fees: [
    {
      label: { ne: "आवेदन तथा परीक्षा दस्तुर", en: "Application and exam fees" },
      amount: null,
      check: "needs_review",
    },
  ],

  steps: [
    {
      id: "open",
      title: { ne: "आधिकारिक वेबसाइट खोल्नुहोस्", en: "Open the official website" },
      body: {
        ne: "ब्राउजरमा applydlnew.dotm.gov.np टाइप गर्नुहोस्। ठेगाना .gov.np मा सकिएको छ कि छैन हेर्नुहोस्।",
        en: "Type applydlnew.dotm.gov.np in your browser. Make sure the address ends in .gov.np.",
      },
      help: {
        simpler: { ne: "फोन वा कम्प्युटरको ब्राउजर (जस्तै Chrome) खोल्नुहोस्। माथिको ठेगाना लेख्ने ठाउँमा applydlnew.dotm.gov.np लेखेर Enter थिच्नुहोस्।", en: "Open a browser (like Chrome). In the address bar at the top, type applydlnew.dotm.gov.np and press Enter." },
        example: { ne: "ठेगाना ठीक: applydlnew.dotm.gov.np  ✓   नक्कली जस्तो: dotm-license-apply.com  ✗", en: "Correct: applydlnew.dotm.gov.np ✓   Looks fake: dotm-license-apply.com ✗" },
      },
      check: "official",
      sourceIds: ["dotm-portal"],
      demo: { kind: "browser", url: "applydlnew.dotm.gov.np", heading: { ne: "Online Driving License System", en: "Online Driving License System" } },
    },
    {
      id: "signup",
      title: { ne: "आफ्नो मोबाइल नम्बरले खाता खोल्नुहोस्", en: "Sign up with your mobile number" },
      body: {
        ne: "आफ्नै नाममा भएको मोबाइल नम्बर र चित्रमा देखिएका अक्षर (captcha) हाल्नुहोस्। एक जनाले एउटा मात्र खाता खोल्नुहोस्।",
        en: "Enter a mobile number in your own name and the letters shown in the picture (captcha). Create only one account per person.",
      },
      help: {
        simpler: { ne: "आफ्नै नाममा किनेको सिमको नम्बर लेख्नुहोस्। तस्बिरमा देखिएका अक्षर जस्ताको तस्तै टाइप गर्नुहोस्।", en: "Type the number of a SIM bought in your own name. Copy the letters in the picture exactly." },
        example: { ne: "मोबाइल: 98XXXXXXXX (नमूना)। तस्बिरमा AB12C देखिए AB12C नै लेख्ने।", en: "Mobile: 98XXXXXXXX (sample). If the picture shows AB12C, type AB12C." },
      },
      check: "official",
      sourceIds: ["dotm-portal"],
      demo: {
        kind: "form",
        url: "applydlnew.dotm.gov.np",
        heading: { ne: "मोबाइल नम्बर प्रविष्ट गर्नुहोस्", en: "Enter your mobile number" },
        fields: [
          { label: { ne: "मोबाइल नम्बर", en: "Mobile number" }, sample: "98XXXXXXXX" },
          { label: { ne: "Captcha", en: "Captcha" }, sample: "AB12C" },
        ],
        button: { ne: "अगाडि बढ्नुहोस्", en: "Continue" },
      },
    },
    {
      id: "details",
      title: { ne: "विवरण भर्नुहोस् र कागजात अपलोड गर्नुहोस्", en: "Fill in details and upload documents" },
      body: {
        ne: "नाम, थर, जन्ममिति र नागरिकता नम्बर नागरिकतामा जस्तै भर्नुहोस्। सक्कल नागरिकताको स्क्यान अपलोड गर्नुहोस्।",
        en: "Enter your name, date of birth and citizenship number exactly as on your citizenship. Upload a scan of the original.",
      },
      help: {
        simpler: { ne: "नागरिकता हातमा राखेर हेर्दै भर्नुहोस्। एउटा अक्षर पनि फरक नपरोस्।", en: "Keep your citizenship in front of you and copy from it. Not one letter should differ." },
        example: { ne: "नागरिकतामा \"राम बहादुर\" छ भने \"रामबहादुर\" वा \"राम ब.\" नलेख्नुहोस् (नमूना नाम)।", en: "If the citizenship says \"Ram Bahadur\", don't write \"Rambahadur\" or \"Ram B.\" (sample name)." },
      },
      check: "official",
      sourceIds: ["dotm-portal"],
      demo: {
        kind: "form",
        heading: { ne: "व्यक्तिगत विवरण", en: "Personal details" },
        fields: [
          { label: { ne: "नाम थर", en: "Full name" }, sample: "नमूना प्रयोगकर्ता" },
          { label: { ne: "जन्ममिति (वि.सं.)", en: "Date of birth (BS)" }, sample: "२०६०-०१-०१" },
          { label: { ne: "नागरिकता नं.", en: "Citizenship no." }, sample: "00-00-00-00000" },
        ],
        button: { ne: "Save", en: "Save" },
      },
    },
    {
      id: "category",
      title: { ne: "वर्ग, प्रदेश र कार्यालय छान्नुहोस्", en: "Choose category, province and office" },
      body: {
        ne: "लाइसेन्सको वर्ग (जस्तै A वा B), प्रदेश र नजिकको यातायात कार्यालय छान्नुहोस्। कोटा बाँकी भएमा मात्र मिति पाइन्छ।",
        en: "Choose the licence category (e.g. A or B), province and nearest transport office. You get a date only if quota remains.",
      },
      help: {
        simpler: { ne: "मोटरसाइकल/स्कुटरका लागि A, कारका लागि B। आफूलाई पायक पर्ने कार्यालय छान्नुहोस्।", en: "A for motorcycle/scooter, B for car. Pick an office convenient for you." },
      },
      check: "needs_review",
      sourceIds: ["ok-dl-guide", "dotm-portal"],
      demo: {
        kind: "form",
        heading: { ne: "लाइसेन्सको वर्ग", en: "Licence category" },
        fields: [
          { label: { ne: "वर्ग", en: "Category" }, sample: "A — मोटरसाइकल" },
          { label: { ne: "प्रदेश", en: "Province" }, sample: "लुम्बिनी" },
          { label: { ne: "कार्यालय", en: "Office" }, sample: "(नमूना कार्यालय)" },
        ],
        button: { ne: "अगाडि", en: "Next" },
      },
    },
    {
      id: "submit",
      title: { ne: "OTP हालेर पेस गर्नुहोस् र फाराम प्रिन्ट गर्नुहोस्", en: "Submit with the OTP and print the form" },
      body: {
        ne: "मोबाइलमा आएको OTP हालेर पेस गर्नुहोस्। देखिएको फाराम र कार्यालय जाने मिति प्रिन्ट गरेर राख्नुहोस्। OTP कसैलाई नदिनुहोस्।",
        en: "Enter the OTP sent to your phone and submit. Print the form with your office visit date. Never share your OTP.",
      },
      help: {
        simpler: { ne: "फोनमा SMS बाट आएको अङ्क (OTP) फाराममा हाल्नुहोस्। त्यसपछि आएको पृष्ठ प्रिन्ट गर्नुहोस् वा फोनमा सेभ गर्नुहोस्।", en: "Enter the number (OTP) sent by SMS. Then print the page that appears, or save it on your phone." },
      },
      check: "needs_review",
      sourceIds: ["ok-dl-guide"],
      demo: { kind: "message", heading: { ne: "आवेदन पेस भयो (नमूना)", en: "Application submitted (sample)" }, button: { ne: "Print", en: "Print" } },
    },
    {
      id: "visit",
      title: { ne: "तोकिएको दिन कार्यालय जानुहोस्", en: "Visit the office on your date" },
      body: {
        ne: "आइतबार–बुधबारमध्ये तोकिएको दिन सक्कल नागरिकता लिएर जानुहोस्। त्यहाँ विवरण रुजु र बायोमेट्रिक हुन्छ।",
        en: "Go on your given day (Sunday–Wednesday) with your original citizenship. Details are checked and biometrics taken there.",
      },
      help: {
        simpler: { ne: "फारामा लेखिएको दिन मात्र जानुहोस्। सक्कल नागरिकता नबिर्सनुहोस्।", en: "Go only on the date on your form. Don't forget your original citizenship." },
      },
      check: "official",
      sourceIds: ["dotm-portal"],
      demo: {
        kind: "list",
        heading: { ne: "साथमा लैजानुहोस्", en: "Take with you" },
        items: [
          { ne: "सक्कल नागरिकता", en: "Original citizenship" },
          { ne: "प्रिन्ट गरेको फाराम", en: "Printed form" },
          { ne: "सक्कल लाइसेन्स (वर्ग थप भए)", en: "Original licence (if adding category)" },
        ],
      },
    },
    {
      id: "exams",
      title: { ne: "लिखित र प्रयोगात्मक (ट्रायल) परीक्षा", en: "Written and practical (trial) exams" },
      body: {
        ne: "परीक्षामा मोबाइल लैजान पाइँदैन। ट्रायलको दिन जुत्ता लगाउनैपर्छ। फेल भए पहिलो पटकदेखि ९० दिनभित्र ३ पटकसम्म फेरि दिन सकिन्छ।",
        en: "Phones are not allowed at exams. Wear shoes on trial day. If you fail, you can retry up to 3 times within 90 days.",
      },
      help: {
        simpler: { ne: "मोबाइल घरमै छोड्नुहोस्। ट्रायलको दिन चप्पल होइन, जुत्ता लगाउनुहोस्।", en: "Leave your phone at home. On trial day wear shoes, not sandals." },
      },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      id: "check",
      title: { ne: "लाइसेन्स छापियो कि छैन हेर्नुहोस्", en: "Check if your licence is printed" },
      body: {
        ne: "सोही वेबसाइटमा \"License print check\" थिचेर स्मार्ट लाइसेन्स छापियो कि छैन हेर्न सकिन्छ।",
        en: "On the same website, use \"License print check\" to see whether your smart licence has been printed.",
      },
      check: "official",
      sourceIds: ["dotm-portal"],
      demo: { kind: "browser", url: "applydlnew.dotm.gov.np", heading: { ne: "License print check", en: "License print check" } },
    },
  ],

  mistakes: [
    {
      text: {
        ne: "नाम, थर, जन्ममिति, नागरिकता नम्बर वा मोबाइल नम्बर गलत भएमा फाराम रद्द हुन्छ। पेस गर्नुअघि नागरिकतासँग मिलाउनुहोस्।",
        en: "A wrong name, date of birth, citizenship number or mobile number cancels the form. Compare with your citizenship before submitting.",
      },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: {
        ne: "कार्यालय जाने दिन छुट्यो भने त्यो दिनदेखि १५ दिनपछि मात्र फेरि आवेदन दिन मिल्छ।",
        en: "If you miss your office visit date, you can reapply only 15 days after that date.",
      },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "अर्काको नाममा भएको सिमको नम्बर नहाल्नुहोस् — पछि फेर्न मिल्दैन।", en: "Don't use a SIM registered to someone else — it can't be changed later." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "एकभन्दा बढी खाता नखोल्नुहोस्।", en: "Don't create more than one account." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      text: { ne: "वर्ग थप गर्दा पहिले पाएको वर्ग गलत छान्यो भने पनि फाराम रद्द हुन्छ।", en: "When adding a category, choosing your existing category wrongly also cancels the form." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
  ],

  faqs: [
    {
      q: { ne: "फाराम कहिले खुल्छ?", en: "When does the form open?" },
      a: {
        ne: "नयाँ फाराम बिहान ७ बजे खुल्छ र कार्यालयको कोटा नसकिएसम्म भर्न सकिन्छ। कोटा सकिएमा अर्को पटक खुल्दा फेरि प्रयास गर्नुहोस्।",
        en: "New forms open at 7 AM and stay open until the office quota fills. If it is full, try again when it reopens.",
      },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      q: { ne: "कार्यालयले कुन दिन बायोमेट्रिक लिन्छ?", en: "Which days does the office take biometrics?" },
      a: {
        ne: "सार्वजनिक बिदा बाहेक आइतबार, सोमबार, मंगलबार र बुधबार।",
        en: "Sunday, Monday, Tuesday and Wednesday, except public holidays.",
      },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      q: { ne: "D, E, F, G वर्ग भएकाले अर्को वर्ग थप्दा के गर्नुपर्छ?", en: "I hold category D, E, F or G. What changes when I add a category?" },
      a: { ne: "लिखित परीक्षा अनिवार्य दिनुपर्छ।", en: "You must take the written exam." },
      check: "official",
      sourceIds: ["dotm-portal"],
    },
    {
      q: { ne: "दस्तुर कति लाग्छ?", en: "How much does it cost?" },
      a: {
        ne: "हामीले दस्तुर आधिकारिक स्रोतबाट पुष्टि गर्न सकेका छैनौँ। कार्यालय वा dotm.gov.np मा हेर्नुहोस्।",
        en: "We have not yet confirmed the fees from an official source. Check with the office or on dotm.gov.np.",
      },
      check: "needs_review",
    },
  ],

  sources: [
    {
      id: "dotm-portal",
      title: "DoTM — Online Driving License System: instructions on the sign-up page",
      url: "https://applydlnew.dotm.gov.np/login",
      official: true,
      checkedOn: CHECKED,
    },
    {
      id: "ok-dl-guide",
      title: "Onlinekhabar English — step-by-step guide to the new online system (not official)",
      url: "https://english.onlinekhabar.com/apply-nepal-driving-licence-online.html",
      official: false,
      checkedOn: CHECKED,
    },
  ],
  lastChecked: CHECKED,
  checkedBy: "Seed content (Claude), pending admin review",
  reviewNotes:
    "Rules, ages, documents and visit days come from the DoTM portal sign-up page. Screen-by-screen steps 4–5 (category/office selection, OTP, print) come from a news guide: confirm on the live portal and capture real screenshots before marking Verified. Fees not found on an official page.",

  video: { kind: "live" },
  keywords: [
    "license", "licence", "driving", "dl", "laisens", "laisen", "lisens", "lycense", "licens",
    "लाइसेन्स", "लाइसेंस", "लाईसेन्स", "सवारी", "चालक", "अनुमतिपत्र", "sawari", "chalak",
    "bike", "car", "trial", "ट्रायल", "dotm", "यातायात",
  ],
  related: ["national-id", "passport"],
  updatedAt: CHECKED,
};
