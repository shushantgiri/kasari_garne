/**
 * We ask people not to type ID numbers, passwords or OTPs. If a message looks
 * like it contains one anyway, refuse it rather than store it.
 */
export function looksPersonal(text: string): boolean {
  const s = text.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)));
  if (/\b\d{2,3}[-/ ]\d{2}[-/ ]\d{2}[-/ ]\d{3,6}\b/.test(s)) return true; // citizenship-style numbers
  if (/\b(otp|password|पासवर्ड)\b\s*[:=-]?\s*\S{4,}/i.test(s)) return true;
  if (/\b(?:\+?977[- ]?)?9[78]\d{8}\b/.test(s)) return true; // mobile numbers
  if (/\b[A-Z]{1,2}\d{6,9}\b/.test(s)) return true; // passport-style numbers
  return false;
}
