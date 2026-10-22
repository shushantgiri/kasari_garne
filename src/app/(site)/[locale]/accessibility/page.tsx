import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "पहुँच · Accessibility" };

export default async function AccessibilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  const items = ne
    ? [
        "माथिको “अ+” बटनले अक्षर ठूलो बनाउँछ (दुई तह)। ब्राउजरको zoom पनि चल्छ।",
        "सबै भिडियोमा उपशीर्षक, लिखित रूप (transcript), गति नियन्त्रण र अध्याय छन्।",
        "किबोर्डको Tab ले सबै बटन र लिंकमा पुगिन्छ। “मुख्य भागमा जानुहोस्” लिंक पहिलो Tab मा देखिन्छ।",
        "स्क्रिन रिडरका लागि सबै बटनमा नाम छ, र भिडियो चल्दा उपशीर्षक पढिन्छ।",
        "तपाईंको फोनमा “कम चाल” (reduced motion) सेटिङ छ भने एनिमेसन घट्छ।",
        "कम डाटा: एनिमेटेड गाइड केही KB मात्र हुन्छ। MP4 भिडियोमा “कम डाटा” विकल्प छ।",
      ]
    : [
        "The “अ+” button in the header makes text larger (two levels). Browser zoom works too.",
        "Every tutorial has captions, a transcript, speed control and chapters.",
        "Everything is reachable with the Tab key. A “Skip to main content” link appears on the first Tab.",
        "All buttons have names for screen readers, and captions are announced while a tutorial plays.",
        "If your device asks for reduced motion, animations are reduced.",
        "Low data: animated tutorials are only a few KB; MP4 videos have a “Low data” option.",
      ];
  return (
    <div className="container-page max-w-2xl py-8 sm:py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">{ne ? "पहुँच (Accessibility)" : "Accessibility"}</h1>
      <ul className="mt-6 space-y-3">{items.map((i) => <li key={i} className="rounded-xl border border-paper-line bg-white p-4">{i}</li>)}</ul>
      <p className="mt-6 text-ink-soft">
        {ne ? "केही प्रयोग गर्न गाह्रो भयो? " : "Something hard to use? "}
        <a className="link" href={`/${locale}/request?type=correction`}>{ne ? "हामीलाई भन्नुहोस्" : "Tell us"}</a>.
      </p>
    </div>
  );
}
