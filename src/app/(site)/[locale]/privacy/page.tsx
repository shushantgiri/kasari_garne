import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "गोपनीयता नीति · Privacy" };

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  const items = ne
    ? [
        ["हामी के सङ्कलन गर्दैनौँ", "खाता, नाम, नागरिकता नम्बर, राहदानी नम्बर, पासवर्ड, OTP वा कागजातका प्रति हामी माग्दैनौँ र राख्दैनौँ। यहाँ कुनै सरकारी फाराम भरिँदैन।"],
        ["तपाईंले पठाएमा", "गलत जानकारीको रिपोर्ट, गाइडको माग र “उपयोगी भयो?” प्रतिक्रियामा तपाईंले लेखेको सन्देश, कुन गाइड, भाषा र मिति मात्र सुरक्षित हुन्छ। IP ठेगाना राखिँदैन। व्यक्तिगत नम्बर जस्तो देखिने सन्देश स्वीकार गरिँदैन।"],
        ["तपाईंकै फोनमा", "चेकलिस्टमा लगाएको चिन्ह र अक्षरको साइज तपाईंकै ब्राउजरमा (localStorage) मात्र रहन्छ। ब्राउजरको डाटा मेटाउँदा यो पनि मेटिन्छ।"],
        ["गणना", "भिडियो कति पटक चलाइयो भन्ने एउटा सङ्ख्या मात्र गनिन्छ — कसले हेर्‍यो भन्ने होइन। तेस्रो पक्षको ट्र्याकर वा विज्ञापन छैन।"],
        ["सहयोगीसँग कुरा गर्दा", "गाइडको “सोध्नुहोस्” सहयोगीले तपाईंकै ब्राउजरमा गाइडबाट जवाफ खोज्छ। प्रश्न कतै पठाइँदैन र सुरक्षित गरिँदैन। अन्तिम जानकारी सधैँ आधिकारिक वेबसाइटमै हेर्नुहोस्।"],
        ["बोलेर खोज्दा", "माइक्रोफोन थिचेर बोल्दा तपाईंको ब्राउजरको आफ्नै आवाज-पहिचान सेवाले (जस्तै Chrome मा Google) शब्द बुझ्छ। हामी आवाज रेकर्ड वा सुरक्षित गर्दैनौँ। नचाहे टाइप गरेर खोज्नुहोस्।"],
        ["आधिकारिक वेबसाइट", "“आधिकारिक वेबसाइट खोल्नुहोस्” थिचेपछि तपाईं सरकारी वेबसाइटमा पुग्नुहुन्छ। त्यहाँको गोपनीयता नियम सम्बन्धित निकायको हो।"],
      ]
    : [
        ["What we don't collect", "We never ask for or store accounts, names, citizenship or passport numbers, passwords, OTPs or copies of documents. No government form is filled in here."],
        ["When you send us something", "For correction reports, guide requests and “Was this useful?” feedback we store only your message, the guide, language and date. No IP addresses. Messages that look like they contain personal numbers are refused."],
        ["On your own device", "Checklist ticks and text size stay in your browser (localStorage) only. Clearing your browser data removes them."],
        ["Counting", "We count how many times a tutorial is played — a single number, not who watched it. No third-party trackers or ads."],
        ["Chat helper", "The guide's “Ask” helper finds answers in the guide, right in your browser. Your questions are not sent anywhere or saved. Always confirm on the official website."],
        ["Voice search", "When you tap the microphone, your browser's own speech service (for example Google, in Chrome) turns your words into text. We don't record or store your voice. You can always type instead."],
        ["Official websites", "When you open an official website you leave Kasari Garne; that agency's privacy rules apply there."],
      ];
  return (
    <div className="container-page max-w-2xl py-8 sm:py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">{ne ? "गोपनीयता नीति" : "Privacy policy"}</h1>
      <div className="mt-6 space-y-6">
        {items.map(([h, p]) => (
          <section key={h}><h2 className="text-lg font-bold">{h}</h2><p className="mt-1 text-ink-soft">{p}</p></section>
        ))}
        <section id="contact" className="scroll-mt-20 rounded-2xl border border-paper-line bg-white p-5">
          <h2 className="text-lg font-bold">{ne ? "सम्पर्क" : "Contact"}</h2>
          <p className="mt-1 text-ink-soft">
            {ne ? "गाइडसम्बन्धी कुरा भए " : "For anything about a guide, use "}
            <a className="link" href={`/${locale}/request?type=correction`}>{ne ? "रिपोर्ट फाराम" : "the report form"}</a>
            {ne ? " प्रयोग गर्नुहोस्।" : "."}
            {/* TODO(owner): add the project's public contact email here before launch. */}
          </p>
        </section>
      </div>
    </div>
  );
}
