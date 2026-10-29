"use client";

import { useState } from "react";
import { ArrowRight, ChevronRight, Clock, Eye, FileCheck2 } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { EXAM } from "@/lib/content/licenceQuiz";
import { digits } from "@/lib/i18n";
import { ColorTest } from "./ColorTest";
import { MockExam } from "./MockExam";


/**
 * Practice for the driving licence: the mock written test (like the computer test at the office)
 * and the colour vision check.
 */
export function LicenceQuiz({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));
  const [mode, setMode] = useState<"menu" | "exam" | "color">("menu");

  if (mode === "exam") return <MockExam locale={locale} onExit={() => setMode("menu")} />;
  if (mode === "color") return <ColorTest locale={locale} onBack={() => setMode("menu")} />;

  return (
    <div className="space-y-3">
      {/* The mock exam: set up like the computer test at the office. */}
      <div className="overflow-hidden rounded-3xl bg-ink p-5 text-white shadow-[0_20px_40px_-24px_rgba(27,34,48,0.7)] sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10">
            <FileCheck2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold">{ne ? "नमुना लिखित परीक्षा" : "Mock written test"}</p>
            <p className="mt-0.5 text-sm text-white/70">{ne ? "कार्यालयको परीक्षाजस्तै, विभिन्न विषयका प्रश्न मिसाएर" : "Like the test at the office, with mixed questions"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1">{ne ? `${n(EXAM.questions)} प्रश्न` : `${EXAM.questions} questions`}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {ne ? `${n(EXAM.minutes)} मिनेट` : `${EXAM.minutes} minutes`}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1">{ne ? `पास: ${n(EXAM.passCorrect)} सही (६०%)` : `Pass: ${EXAM.passCorrect} right (60%)`}</span>
        </div>
        <button type="button" onClick={() => setMode("exam")} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white text-base font-semibold text-ink transition-transform active:scale-[.98] sm:w-auto sm:px-6">
          {ne ? "परीक्षा सुरु गर्नुहोस्" : "Start the test"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* The colour vision check, on its own. */}
      <p className="px-1 pt-4 text-sm font-semibold text-ink-faint">{ne ? "रङ पहिचान" : "Colour vision"}</p>
      <button
        type="button"
        onClick={() => setMode("color")}
        className="group flex w-full items-center gap-4 rounded-2xl border border-paper-line bg-white p-4 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-sky/30 hover:shadow-card sm:p-5"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-tint text-sky">
          <Eye className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-ink">{ne ? "रङ पहिचान जाँच" : "Colour vision check"}</span>
          <span className="block text-sm text-ink-faint">{ne ? "ट्राफिक बत्तीका रङ र अङ्क चिन्ने" : "Traffic-light colours and hidden numbers"}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint transition-colors group-hover:text-sky" aria-hidden="true" />
      </button>
    </div>
  );
}
