import { BookOpenCheck, Briefcase, Car, GraduationCap, IdCard, Landmark, ReceiptText, ShieldCheck, Baby, Vote } from "lucide-react";
import type { IconName } from "@/lib/content/types";

const MAP = {
  car: Car,
  passport: BookOpenCheck,
  idcard: IdCard,
  receipt: ReceiptText,
  shield: ShieldCheck,
  vote: Vote,
  baby: Baby,
  landmark: Landmark,
  briefcase: Briefcase,
  graduation: GraduationCap,
} satisfies Record<IconName, unknown>;

export function ServiceIcon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const Icon = MAP[name] ?? Landmark;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}
