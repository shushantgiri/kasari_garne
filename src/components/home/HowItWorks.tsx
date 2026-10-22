import { ListChecks, MousePointerClick, PlayCircle } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { dict, digits } from "@/lib/i18n";

export function HowItWorks({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const steps = [
    { Icon: MousePointerClick, text: t.how1 },
    { Icon: PlayCircle, text: t.how2 },
    { Icon: ListChecks, text: t.how3 },
  ];
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map(({ Icon, text }, i) => (
        <li key={i} className="flex items-center gap-4 rounded-2xl border border-paper-line bg-white p-4">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper-warm">
            <Icon className="h-7 w-7 text-ink" aria-hidden="true" strokeWidth={1.6} />
            <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-brand text-xs font-bold text-white">{digits(i + 1, locale)}</span>
          </span>
          <span className="text-lg font-semibold">{text}</span>
        </li>
      ))}
    </ol>
  );
}
