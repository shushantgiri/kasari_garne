import type { Department } from "./types";

/**
 * Government departments. URLs for DoTM, DoP and DoNIDCR were opened on
 * 2026-10-22. The others are the departments' well-known home pages and
 * should be re-checked by an admin before their guides go live.
 */
export const departments: Department[] = [
  {
    id: "dotm",
    name: { ne: "यातायात व्यवस्था विभाग", en: "Department of Transport Management" },
    short: { ne: "यातायात", en: "Transport" },
    url: "https://dotm.gov.np",
  },
  {
    id: "dop",
    name: { ne: "राहदानी विभाग", en: "Department of Passports" },
    short: { ne: "राहदानी", en: "Passports" },
    url: "https://nepalpassport.gov.np",
  },
  {
    id: "donidcr",
    name: { ne: "राष्ट्रिय परिचयपत्र तथा पञ्जीकरण विभाग", en: "Department of National ID and Civil Registration" },
    short: { ne: "परिचयपत्र तथा पञ्जीकरण", en: "National ID & Registration" },
    url: "https://donidcr.gov.np",
  },
  {
    id: "ird",
    name: { ne: "आन्तरिक राजस्व विभाग", en: "Inland Revenue Department" },
    short: { ne: "आन्तरिक राजस्व", en: "Inland Revenue" },
    url: "https://ird.gov.np",
  },
  {
    id: "police",
    name: { ne: "नेपाल प्रहरी", en: "Nepal Police" },
    short: { ne: "प्रहरी", en: "Police" },
    url: "https://nepalpolice.gov.np",
  },
  {
    id: "election",
    name: { ne: "निर्वाचन आयोग", en: "Election Commission" },
    short: { ne: "निर्वाचन", en: "Elections" },
    url: "https://election.gov.np",
  },
];

export function getDepartment(id: string) {
  return departments.find((d) => d.id === id);
}
