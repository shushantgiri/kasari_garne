/**
 * Yearly vehicle tax (सवारी साधन कर) for private petrol and diesel vehicles, by province, and the
 * bluebook renewal fee. Each province sets these in its own Finance Act, so they change every year.
 *
 * Rates: FY 2083/84 from each province's Finance Act 2083 (Sudurpashchim: Finance Act 2082, its
 * 2083/84 rates weren't out yet), as compiled by kokil.com.np and cross-checked with merodafa.com.
 * Late-fine rules are from the provinces' Vehicle and Transport Management Acts as summarised there.
 * The result is an estimate: the transport office's bill is final.
 */

export const TAX_YEAR = "२०८३/८४";

export type ProvinceId = "koshi" | "madhesh" | "bagmati" | "gandaki" | "lumbini" | "karnali" | "sudurpashchim";
export type VehicleClass = "bike" | "car";

/** [up to this cc (Infinity for the last slab), yearly tax in rupees]. */
type Slabs = [number, number][];

export interface ProvinceTax {
  id: ProvinceId;
  ne: string;
  en: string;
  bike: Slabs;
  car: Slabs;
  /** Bluebook renewal fee: [bike, car]. */
  renewal: [number, number];
  /** Fine (percent of the tax) for paying late within the same fiscal year, step by step. */
  lateThisYear: { ne: string; en: string; pct: number }[];
  /** Fine (percent of that year's tax) for each whole year behind: index 0 = last year, 1 = the year before… */
  arrears: number[];
  /** Rates still from an older year. */
  note?: string;
}

const I = Infinity;
const steps = (a: number, b: number, c: number) => [
  { ne: `थोरै ढिलो (${a}%)`, en: `A little late (${a}%)`, pct: a },
  { ne: `अलि बढी ढिलो (${b}%)`, en: `Later (${b}%)`, pct: b },
  { ne: `असार मसान्तसम्म (${c}%)`, en: `By the end of Asar (${c}%)`, pct: c },
];

export const PROVINCES: ProvinceTax[] = [
  {
    id: "koshi",
    ne: "कोशी",
    en: "Koshi",
    bike: [[125, 3100], [150, 5100], [200, 6500], [250, 8000], [400, 11000], [I, 20000]],
    car: [[1000, 23000], [1500, 25000], [2000, 32000], [2500, 38000], [3000, 46000], [3500, 63000], [I, 70000]],
    renewal: [200, 400],
    lateThisYear: [
      { ne: "ढिलो (१०%)", en: "Late (10%)", pct: 10 },
      { ne: "धेरै ढिलो (२०%)", en: "Very late (20%)", pct: 20 },
    ],
    arrears: [20],
  },
  {
    id: "madhesh",
    ne: "मधेश",
    en: "Madhesh",
    bike: [[125, 3000], [160, 5000], [250, 6500], [400, 11000], [I, 20000]],
    car: [[1000, 22000], [1500, 25000], [2000, 27000], [2500, 37000], [3000, 50000], [I, 60000]],
    renewal: [300, 400],
    lateThisYear: [
      { ne: "म्याद नाघेको ३० दिनभित्र (५%)", en: "Within 30 days (5%)", pct: 5 },
      { ne: "७५ दिनभित्र (१०%)", en: "Within 75 days (10%)", pct: 10 },
      { ne: "असार मसान्तसम्म (२०%)", en: "By the end of Asar (20%)", pct: 20 },
    ],
    arrears: [30],
  },
  {
    id: "bagmati",
    ne: "बागमती",
    en: "Bagmati",
    bike: [[125, 3000], [150, 5000], [225, 6500], [400, 12000], [650, 25000], [I, 35000]],
    car: [[1000, 22000], [1500, 25000], [2000, 27000], [2500, 37000], [3000, 50000], [3500, 65000], [I, 70000]],
    renewal: [300, 500],
    lateThisYear: [
      { ne: "म्याद नाघेको ३० दिनभित्र (५%)", en: "Within 30 days (5%)", pct: 5 },
      { ne: "३१–४५ दिन (१०%)", en: "31–45 days (10%)", pct: 10 },
      { ne: "असार मसान्तसम्म (२०%)", en: "By the end of Asar (20%)", pct: 20 },
    ],
    arrears: [32],
  },
  {
    id: "gandaki",
    ne: "गण्डकी",
    en: "Gandaki",
    bike: [[125, 3000], [150, 5000], [225, 6500], [400, 11000], [650, 20000], [I, 30000]],
    car: [[1000, 22000], [1500, 25000], [2000, 27000], [2500, 37000], [3000, 50000], [3500, 60000], [I, 65000]],
    renewal: [300, 500],
    lateThisYear: steps(5, 10, 20),
    arrears: [40, 60, 80, 100],
  },
  {
    id: "lumbini",
    ne: "लुम्बिनी",
    en: "Lumbini",
    bike: [[125, 3000], [150, 5000], [225, 6500], [400, 11000], [650, 20000], [I, 30000]],
    car: [[1000, 22000], [1500, 25000], [2000, 27000], [2500, 37000], [3000, 50000], [3500, 60000], [I, 65000]],
    renewal: [300, 400],
    lateThisYear: [{ ne: "असार मसान्तसम्म (२०%)", en: "By the end of Asar (20%)", pct: 20 }],
    arrears: [40, 60, 80, 100, 120],
  },
  {
    id: "karnali",
    ne: "कर्णाली",
    en: "Karnali",
    bike: [[125, 2700], [150, 4300], [250, 5500], [400, 10000], [650, 16000], [I, 20000]],
    car: [[1000, 21000], [1500, 23000], [2000, 26000], [2500, 35000], [3000, 40000], [3500, 56000], [I, 62000]],
    renewal: [200, 500],
    lateThisYear: [{ ne: "आर्थिक वर्षभित्र (२०%)", en: "Within the fiscal year (20%)", pct: 20 }],
    arrears: [30],
  },
  {
    id: "sudurpashchim",
    ne: "सुदूरपश्चिम",
    en: "Sudurpashchim",
    bike: [[125, 2800], [150, 5000], [250, 6500], [400, 11000], [650, 20000], [I, 30000]],
    car: [[1000, 22000], [1500, 25000], [2000, 27000], [2500, 37000], [3000, 50000], [3500, 65000], [I, 70000]],
    renewal: [300, 500],
    lateThisYear: steps(5, 10, 20),
    arrears: [30],
    note: "२०८२/८३ को दर (२०८३/८४ को आर्थिक ऐन आउन बाँकी)",
  },
];

export function slabFor(slabs: Slabs, cc: number): { tax: number; from: number; to: number } {
  let from = 0;
  for (const [to, tax] of slabs) {
    if (cc <= to) return { tax, from: from + 1, to };
    from = to;
  }
  const last = slabs[slabs.length - 1];
  return { tax: last[1], from, to: last[0] };
}

export interface TaxInput {
  province: ProvinceId;
  vehicle: VehicleClass;
  cc: number;
  /** Index into lateThisYear, or -1 when paying on time. */
  late: number;
  /** Whole fiscal years left unpaid before this one (0–5). */
  yearsBehind: number;
}

export interface TaxResult {
  tax: number;
  fine: number;
  renewal: number;
  renewalLate: number;
  pastTax: number;
  pastFine: number;
  total: number;
  slab: { from: number; to: number };
}

/**
 * This year's tax and renewal, the fine if late, and any earlier unpaid years — each at today's rate
 * (older years' rates may have been a little lower). Late renewal adds 100% of the renewal fee per year late, up to 500%.
 */
export function vehicleTax(input: TaxInput): TaxResult {
  const p = PROVINCES.find((x) => x.id === input.province) ?? PROVINCES[2];
  const { tax, from, to } = slabFor(p[input.vehicle], Math.max(1, input.cc));
  const fee = p.renewal[input.vehicle === "bike" ? 0 : 1];
  const latePct = input.late >= 0 ? (p.lateThisYear[input.late]?.pct ?? 0) : 0;
  const fine = Math.round((tax * latePct) / 100);
  const years = Math.max(0, Math.min(5, Math.floor(input.yearsBehind)));
  let pastFine = 0;
  for (let i = 0; i < years; i++) pastFine += Math.round((tax * p.arrears[Math.min(i, p.arrears.length - 1)]) / 100);
  const pastTax = tax * years;
  const lateYears = years + (input.late >= 0 ? 1 : 0);
  const renewal = fee * (years + 1);
  const renewalLate = fee * Math.min(5, lateYears);
  return { tax, fine, renewal, renewalLate, pastTax, pastFine, total: tax + fine + renewal + renewalLate + pastTax + pastFine, slab: { from, to } };
}
