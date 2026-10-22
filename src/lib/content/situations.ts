import type { GuideStep, Localized } from "./types";

/** True when an item tagged with `for` applies to the chosen purpose. No choice yet = show everything. */
export function appliesTo(item: { for?: string[] }, situation: string | null): boolean {
  return !situation || !item.for?.length || item.for.includes(situation);
}

/** A step's wording for the chosen purpose, falling back to the general wording. */
export function stepBody(step: Pick<GuideStep, "body" | "bodyFor">, situation: string | null): Localized {
  return (situation && step.bodyFor?.[situation]) || step.body;
}
