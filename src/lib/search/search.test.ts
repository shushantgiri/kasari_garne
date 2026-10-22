import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, detectPurpose, isAmbiguous, search, tokenize } from "./search.ts";
import { drivingLicence } from "../content/guides/driving-licence.ts";
import { passport } from "../content/guides/passport.ts";
import { nationalId } from "../content/guides/national-id.ts";
import { drafts } from "../content/guides/drafts.ts";

const index = buildIndex([drivingLicence, passport, nationalId, ...drafts]);
const top = (q: string) => search(index, q, { includeDrafts: true })[0]?.slug;

test("strips question words", () => {
  assert.deepEqual(tokenize("लाइसेन्स कसरी भर्ने?"), ["लाइसेन्स"]);
});

const cases: [string, string][] = [
  ["लाइसेन्स कसरी भर्ने?", "driving-licence"],
  ["लाईसेन्स", "driving-licence"],
  ["laisens", "driving-licence"],
  ["driving licence form", "driving-licence"],
  ["driving license", "driving-licence"],
  ["राहदानी बनाउन के चाहिन्छ?", "passport"],
  ["rahadani", "passport"],
  ["pasport renew", "passport"],
  ["पासपोर्ट", "passport"],
  ["राष्ट्रिय परिचयपत्र", "national-id"],
  ["NID card", "national-id"],
  ["parichaya patra", "national-id"],
  ["PAN नम्बर कसरी लिने?", "pan"],
  ["Police report कसरी निकाल्ने?", "police-clearance"],
  ["मतदाता", "voter-registration"],
  ["license kasari bharne?", "driving-licence"],
  ["passport documents Nepal", "passport"],
  ["police report kasari nikalne?", "police-clearance"],
  ["पासपोर्ट बनाउन के चाहिन्छ?", "passport"],
  ["पासपोर्ट कसरी बनाउने?", "passport"],
  ["license renew kasari garne?", "driving-licence"],
  ["राष्ट्रिय परिचयपत्र बनाउन के चाहिन्छ?", "national-id"],
  ["हराएको राहदानी", "passport"],
  ["police report online kasari line?", "police-clearance"],
];

for (const [q, want] of cases) {
  test(`"${q}" → ${want}`, () => assert.equal(top(q), want));
}

test("drafts hidden unless asked", () => {
  assert.equal(search(index, "PAN").length, 0);
});

test("nonsense returns nothing", () => {
  assert.equal(search(index, "zzzzqqq", { includeDrafts: true }).length, 0);
});

const ids = (g: { situations?: { id: string }[] }) => g.situations?.map((x) => x.id) ?? [];

test("purpose words pick the guide's matching purpose", () => {
  assert.equal(detectPurpose("passport renew garne", ids(passport)).id, "renew");
  assert.equal(detectPurpose("राहदानी नवीकरण", ids(passport)).id, "renew");
  assert.equal(detectPurpose("हराएको राहदानी", ids(passport)).id, "replace");
  assert.equal(detectPurpose("naya license", ids(drivingLicence)).id, "new");
  assert.equal(detectPurpose("पहिलो पटक पासपोर्ट", ids(passport)).id, "first");
  assert.equal(detectPurpose("license ma barga thapne", ids(drivingLicence)).id, "add-category");
});

test("licence purposes, and a purpose the guide doesn't cover is noticed but not invented", () => {
  assert.equal(detectPurpose("license renew kasari garne?", ids(drivingLicence)).id, "renew");
  assert.equal(detectPurpose("lost license", ids(drivingLicence)).id, "lost");
  assert.equal(detectPurpose("damaged license", ids(drivingLicence)).id, "damaged");
  assert.equal(detectPurpose("license print status", ids(drivingLicence)).id, "status");
  assert.equal(detectPurpose("damaged passport", ids(passport)).id, "replace"); // passport keeps one "replace"
  assert.deepEqual(detectPurpose("national id renew", ids(nationalId)), { id: undefined, asked: true });
  assert.deepEqual(detectPurpose("passport kasari banaune", ids(passport)), { asked: false });
});

test("close scores count as ambiguous", () => {
  assert.equal(isAmbiguous([{ slug: "a", score: 10 }, { slug: "b", score: 9 }]), true);
  assert.equal(isAmbiguous([{ slug: "a", score: 10 }, { slug: "b", score: 3 }]), false);
  assert.equal(isAmbiguous(search(index, "पासपोर्ट कसरी बनाउने?", { includeDrafts: true })), false);
  assert.equal(isAmbiguous(search(index, "license renew kasari garne?", { includeDrafts: true })), false);
});
