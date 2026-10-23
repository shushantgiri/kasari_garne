"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock, RotateCcw, X } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { EXAM, QUIZ, type QuizQuestion } from "@/lib/content/licenceQuiz";
import { digits, tr } from "@/lib/i18n";
import { RoadSign } from "./RoadSign";

interface ExamQuestion extends QuizQuestion {
  order: number[];
}

const shuffle = <T,>(xs: T[]) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** A fresh exam: questions drawn from every level, in a random order, with options shuffled too. */
const draw = (): ExamQuestion[] =>
  shuffle([...QUIZ.easy, ...QUIZ.medium, ...QUIZ.hard])
    .slice(0, EXAM.questions)
    .map((q) => ({ ...q, order: shuffle(q.options.map((_, i) => i)) }));

/**
 * The mock written test, laid out like a question paper: a header with full and pass marks and
 * the time, instructions, then every question numbered with answer-sheet bubbles to fill.
 * A countdown stays in view; answers can be changed; nothing is marked until it's handed in.
 * Then pass or fail, the marks, and every question reviewed with its right answer.
 */
export function MockExam({ locale, onExit }: { locale: Locale; onExit: () => void }) {
  const ne = locale === "ne";
  const n = (v: number | string) => (ne ? digits(v, "ne") : String(v));
  const [questions, setQuestions] = useState<ExamQuestion[]>(draw);
  const [picks, setPicks] = useState<(number | null)[]>(() => Array(EXAM.questions).fill(null));
  const [left, setLeft] = useState(EXAM.minutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // The countdown; at zero the exam hands itself in.
  useEffect(() => {
    if (submitted) return;
    if (left <= 0) {
      setSubmitted(true);
      return;
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, submitted]);

  const restart = () => {
    setQuestions(draw());
    setPicks(Array(EXAM.questions).fill(null));
    setLeft(EXAM.minutes * 60);
    setSubmitted(false);
    setConfirming(false);
  };

  const clock = (sec: number) => n(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`);
  const answered = picks.filter((p) => p !== null).length;
  const correct = picks.filter((p, i) => p === questions[i].answer).length;
  const passed = correct >= EXAM.passCorrect;
  const letters = ne ? ["क", "ख", "ग", "घ"] : ["A", "B", "C", "D"];

  /* ---------- Result ---------- */
  if (submitted) {
    return (
      <div ref={topRef} className="scroll-mt-24 animate-rise">
        <div className={`rounded-3xl p-6 text-center sm:p-8 ${passed ? "bg-ok-tint" : "bg-brand-tint"}`}>
          <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-white ${passed ? "bg-ok" : "bg-brand"}`}>
            {passed ? <Check className="h-8 w-8" strokeWidth={3} aria-hidden="true" /> : <X className="h-8 w-8" strokeWidth={3} aria-hidden="true" />}
          </span>
          <p className={`mt-4 text-3xl font-bold ${passed ? "text-ok" : "text-brand"}`}>{passed ? (ne ? "उत्तीर्ण" : "Passed") : ne ? "अनुत्तीर्ण" : "Not passed"}</p>
          <p className="mt-2 text-lg font-semibold text-ink">
            {ne ? `${n(correct)}/${n(EXAM.questions)} सही · ${n(correct * 4)} अङ्क` : `${correct}/${EXAM.questions} right · ${correct * 4} marks`}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {ne ? `पास गर्न ${n(EXAM.passCorrect)} सही (६० अङ्क) चाहिन्छ · लागेको समय ${clock(EXAM.minutes * 60 - left)}` : `${EXAM.passCorrect} right (60 marks) needed to pass · time used ${clock(EXAM.minutes * 60 - left)}`}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={restart} className="btn-primary">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {ne ? "नयाँ परीक्षा दिनुहोस्" : "Take a new exam"}
            </button>
            <button type="button" onClick={onExit} className="btn-secondary">{ne ? "अभ्यासमा फर्कनुहोस्" : "Back to practice"}</button>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-paper-line bg-white p-5 sm:p-6">
          <h2 className="font-bold text-ink">{ne ? "सबै प्रश्नको उत्तर" : "All answers"}</h2>
          <ol className="mt-3 divide-y divide-paper-line">
            {questions.map((q, i) => {
              const ok = picks[i] === q.answer;
              return (
                <li key={i} className="flex gap-3 py-3">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${ok ? "bg-ok" : "bg-brand"}`} aria-hidden="true">
                    {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{n(i + 1)}. {tr(q.q, locale)}</p>
                    {!ok && (
                      <p className="mt-0.5 text-sm text-brand">
                        {ne ? "तपाईंको उत्तर: " : "Your answer: "}
                        {picks[i] === null ? (ne ? "छुटेको" : "Not answered") : tr(q.options[picks[i]!], locale)}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm font-semibold text-ok">{tr(q.options[q.answer], locale)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  }

  /* ---------- The exam, laid out like a printed question paper ---------- */
  const low = left <= 120;
  const submit = () => (answered < EXAM.questions ? setConfirming(true) : setSubmitted(true));

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Exam bar: time left, how many answered, and Submit, kept in view while scrolling. */}
      <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between gap-3 border-b border-paper-line bg-white/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${low ? "animate-pulse bg-brand text-white" : "bg-paper-warm text-ink"}`} aria-live={low ? "polite" : "off"}>
          <Clock className="h-4 w-4" aria-hidden="true" />
          {clock(left)}
        </p>
        <p className="text-sm text-ink-soft">{ne ? `${n(answered)}/${n(EXAM.questions)} उत्तर` : `${answered}/${EXAM.questions} answered`}</p>
        <button type="button" onClick={submit} className="inline-flex min-h-[40px] items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          {ne ? "बुझाउनुहोस्" : "Submit"}
        </button>
      </div>

      {/* The question paper. */}
      <article lang="ne" className="mt-4 rounded-md border border-ink/15 bg-white px-5 py-7 shadow-[0_18px_40px_-28px_rgba(27,34,48,0.5)] sm:px-10 sm:py-10">
        <header className="text-center">
          <p className="text-lg font-bold text-ink sm:text-xl">{ne ? "सवारी चालक अनुमतिपत्र" : "Driving Licence"}</p>
          <p className="mt-0.5 font-semibold text-ink-soft">{ne ? "लिखित परीक्षा — नमुना प्रश्नपत्र" : "Written test — sample paper"}</p>
          <div className="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-1 border-y-2 border-ink/70 py-2 text-sm font-semibold text-ink">
            <span>{ne ? `पूर्णाङ्क: ${n(EXAM.questions * 4)}` : `Full marks: ${EXAM.questions * 4}`}</span>
            <span>{ne ? `उत्तीर्णाङ्क: ${n(EXAM.passCorrect * 4)}` : `Pass marks: ${EXAM.passCorrect * 4}`}</span>
            <span>{ne ? `समय: ${n(EXAM.minutes)} मिनेट` : `Time: ${EXAM.minutes} minutes`}</span>
          </div>
        </header>
        <p className="mt-4 text-[0.95rem] text-ink">
          <span className="font-bold">{ne ? "निर्देशन: " : "Instructions: "}</span>
          {ne
            ? `सबै प्रश्न अनिवार्य छन्। प्रत्येक प्रश्नको ${n(4)} अङ्क छ। सही उत्तरको गोलो भर्नुहोस्।`
            : "All questions are compulsory. Each carries 4 marks. Fill the circle of the right answer."}
        </p>

        <ol className="mt-6 space-y-7">
          {questions.map((q, i) => (
            <li key={i} id={`exam-q${i}`} className="scroll-mt-32">
              <p className="flex gap-2 font-semibold leading-snug text-ink">
                <span className="shrink-0 tabular-nums">{n(i + 1)}.</span>
                <span>{tr(q.q, locale)}</span>
              </p>
              <div className={`mt-3 pl-6 ${q.sign ? "flex flex-col gap-3 sm:flex-row sm:items-start" : ""}`}>
                {q.sign && (
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-md border border-ink/15">
                    <RoadSign name={q.sign} className="h-20 w-20" />
                  </div>
                )}
                <div className="grid flex-1 gap-x-6 gap-y-1 sm:grid-cols-2" role="radiogroup" aria-label={ne ? `प्रश्न ${n(i + 1)}` : `Question ${i + 1}`}>
                  {q.order.map((oi, k) => {
                    const on = picks[i] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setPicks((p) => p.map((v, j) => (j === i ? oi : v)))}
                        className="flex min-h-[44px] items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-paper-warm"
                      >
                        {/* An answer-sheet bubble: the letter inside, filled when chosen. */}
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-colors ${on ? "border-ink bg-ink text-white" : "border-ink/50 text-ink-soft"}`}>
                          {letters[k]}
                        </span>
                        <span className="min-w-0 text-[0.98rem] leading-snug text-ink">{tr(q.options[oi], locale)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 border-t-2 border-ink/70 pt-5">
          <button type="button" onClick={submit} className="btn-primary w-full">
            {ne ? "उत्तरपुस्तिका बुझाउनुहोस्" : "Hand in the paper"}
          </button>
          {confirming && (
            <div className="mt-3 animate-rise rounded-2xl bg-warn-tint px-4 py-3" role="alertdialog">
              <p className="font-semibold text-warn">
                {ne ? `अझै ${n(EXAM.questions - answered)} प्रश्नको उत्तर दिन बाँकी छ।` : `${EXAM.questions - answered} questions are still unanswered.`}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setSubmitted(true)} className="btn-primary min-h-[40px] flex-1 text-sm">{ne ? "तैपनि बुझाउनुहोस्" : "Submit anyway"}</button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    const first = picks.findIndex((p) => p === null);
                    if (first >= 0) document.getElementById(`exam-q${first}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="btn-secondary min-h-[40px] flex-1 text-sm"
                >
                  {ne ? "बाँकी प्रश्नमा जानुहोस्" : "Go to the unanswered"}
                </button>
              </div>
            </div>
          )}
        </div>
      </article>

      <button type="button" onClick={onExit} className="mx-auto mt-4 flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm text-ink-faint hover:bg-paper-warm hover:text-ink">
        <X className="h-4 w-4" aria-hidden="true" />
        {ne ? "परीक्षा छोड्नुहोस्" : "Leave the test"}
      </button>
    </div>
  );
}
