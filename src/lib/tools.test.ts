import { test } from "node:test";
import assert from "node:assert/strict";
import { slabFor, vehicleTax, PROVINCES } from "./content/vehicleTax.ts";
import { officeDay, officeHours, HOLIDAYS_2083 } from "./content/holidays.ts";
import { imagesToPdf } from "./pdf.ts";

test("vehicle tax: slabs pick the right band", () => {
  const bagmati = PROVINCES.find((p) => p.id === "bagmati")!;
  assert.equal(slabFor(bagmati.bike, 110).tax, 3000);
  assert.equal(slabFor(bagmati.bike, 125).tax, 3000);
  assert.equal(slabFor(bagmati.bike, 126).tax, 5000);
  assert.equal(slabFor(bagmati.bike, 1200).tax, 35000);
  assert.equal(slabFor(bagmati.car, 1197).tax, 25000);
});

test("vehicle tax: matches a published worked example (Bagmati, 150 cc, a little late)", () => {
  // Tax 5,000 + 5% fine 250 + renewal 300 + late renewal 300 = 5,850.
  const r = vehicleTax({ province: "bagmati", vehicle: "bike", cc: 150, late: 0, yearsBehind: 0 });
  assert.equal(r.total, 5850);
});

test("vehicle tax: on time is just tax and renewal", () => {
  const r = vehicleTax({ province: "koshi", vehicle: "car", cc: 1500, late: -1, yearsBehind: 0 });
  assert.equal(r.total, 25000 + 400);
});

test("vehicle tax: years behind add each year's tax and fine", () => {
  const r = vehicleTax({ province: "gandaki", vehicle: "bike", cc: 125, late: -1, yearsBehind: 2 });
  // 3 years of tax, fines 40% and 60% on the two old years, 3 renewals, late renewal for 2 years.
  assert.equal(r.total, 3000 * 3 + 1200 + 1800 + 300 * 3 + 300 * 2);
});

test("holidays: Saturdays closed, Dashain closed, Republic Day services open", () => {
  // Kartik 14 2083 is a Saturday (gazette).
  assert.equal(officeDay(2083, 7, 14, 6).kind, "weekend");
  assert.equal(officeDay(2083, 7, 15, 0).kind, "weekend");
  assert.equal(officeDay(2083, 7, 3, 1).kind, "holiday");
  assert.equal(officeDay(2083, 2, 15, 5).kind, "servicesOpen");
  const teej = officeDay(2083, 5, 29, 1);
  assert.equal(teej.kind, "open");
  assert.ok(teej.kind === "open" && teej.partial.length === 1);
});

test("office hours follow the season and Fridays", () => {
  assert.deepEqual(officeHours(1, 5, 1), [9, 17]);
  assert.deepEqual(officeHours(7, 16, 5), [9, 17]);
});

test("holiday list has valid dates", () => {
  for (const h of HOLIDAYS_2083) assert.ok(h.month >= 1 && h.month <= 12 && h.day >= 1 && h.day <= 32, h.name);
});

test("pdf: structure and xref offsets", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);
  const pdf = imagesToPdf([{ jpeg, width: 100, height: 200 }, { jpeg, width: 300, height: 100 }]);
  const text = new TextDecoder("latin1").decode(pdf);
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.ok(text.trimEnd().endsWith("%%EOF"));
  assert.match(text, /\/Count 2/);
  const xrefAt = Number(text.match(/startxref\n(\d+)/)![1]);
  assert.equal(text.slice(xrefAt, xrefAt + 4), "xref");
  // Every object offset points at "n 0 obj".
  const entries = text.slice(xrefAt).split("\n").slice(3, 9);
  entries.forEach((e, i) => {
    const off = Number(e.slice(0, 10));
    assert.equal(text.slice(off, off + `${i + 1} 0 obj`.length), `${i + 1} 0 obj`);
  });
});
