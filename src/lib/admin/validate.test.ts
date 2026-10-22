import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGuide, unconfirmedFacts } from "./validate.ts";
import { looksPersonal } from "../privacy.ts";
import { drivingLicence } from "../content/guides/driving-licence.ts";
import { passport } from "../content/guides/passport.ts";
import { nationalId } from "../content/guides/national-id.ts";
import { buildTutorial } from "../video/script.ts";

test("seed guides are valid as saved", () => {
  for (const g of [drivingLicence, passport, nationalId]) assert.deepEqual(validateGuide(g).errors, [], g.slug);
});

test("a guide with unconfirmed items cannot be marked Verified", () => {
  const r = validateGuide({ ...nationalId, status: "verified" });
  assert.ok(r.errors.some((e) => e.startsWith("Verified needs every item confirmed")));
  assert.ok(unconfirmedFacts(nationalId).length > 0);
});

test("archived guides cannot stay published", () => {
  assert.ok(validateGuide({ ...passport, status: "archived", published: true }).errors.length > 0);
});

test("personal numbers, OTPs and passwords are refused", () => {
  assert.equal(looksPersonal("मेरो नागरिकता नं 12-01-75-01234 हो"), true);
  assert.equal(looksPersonal("OTP: 482913"), true);
  assert.equal(looksPersonal("call me on 9841234567"), true);
  assert.equal(looksPersonal("चरण ३ को बटनको नाम फेरिएको छ"), false);
  assert.equal(looksPersonal("The fee changed to NPR 7,000 on 2026-10-01"), false);
});

test("tutorial only shows officially-sourced documents and flags unconfirmed steps", () => {
  const s = buildTutorial(nationalId, "ne");
  assert.equal(s.scenes.find((x) => x.id === "prep"), undefined); // NID documents all need review
  assert.ok(s.scenes.some((x) => x.unconfirmed));
  assert.equal(s.chapters.length, nationalId.steps.length + 2);
  assert.ok(s.totalMs > 60_000 && s.totalMs < 240_000);
});

test("choosing a purpose shows only the documents and wording for it", async () => {
  const { appliesTo, stepBody } = await import("../content/situations.ts");
  const oldPassport = passport.documents.find((d) => d.for?.includes("renew"))!;
  assert.equal(appliesTo(oldPassport, "first"), false);
  assert.equal(appliesTo(oldPassport, "renew"), true);
  assert.equal(appliesTo(oldPassport, null), true); // nothing chosen yet: show everything
  const type = passport.steps.find((s) => s.id === "type")!;
  assert.equal(stepBody(type, "renew").en, "Choose Renewal.");
  assert.equal(stepBody(type, null), type.body);
  // Verified purposes are confirmed; "coming soon" ones carry no documents or steps.
  assert.ok(drivingLicence.situations?.filter((x) => !x.pending).every((x) => x.check === "official"));
  const pending = new Set(drivingLicence.situations?.filter((x) => x.pending).map((x) => x.id));
  assert.deepEqual([...pending].sort(), ["damaged", "lost", "renew", "status"]);
  assert.ok([...drivingLicence.documents, ...drivingLicence.steps].every((x) => !(x.for ?? []).some((id) => pending.has(id))));
});

test("purpose references must exist and every purpose needs steps", () => {
  const bad = { ...passport, documents: [...passport.documents, { text: { ne: "x" }, check: "official" as const, for: ["nope"] }] };
  assert.ok(validateGuide(bad).errors.some((e) => e.includes('Unknown purpose id "nope"')));
  const orphan = { ...passport, steps: passport.steps.map((s) => ({ ...s, for: ["first"] })) };
  assert.ok(validateGuide(orphan).errors.some((e) => e.includes('Purpose "renew" has no steps')));
});

test("attention rules behind the admin badges", async () => {
  const a = await import("./attention.ts");
  const today = new Date("2026-10-22");
  assert.equal(a.awaitingReview(passport), true); // seed status: under_review
  assert.equal(a.awaitingReview({ ...passport, status: "verified" }), false);
  assert.equal(a.verificationOverdue({ ...passport, recheckBy: "2026-10-01" }, today), true);
  assert.equal(a.verificationDueSoon({ ...passport, recheckBy: "2026-11-10" }, today), true);
  assert.equal(a.verificationDueSoon({ ...passport, recheckBy: "2027-06-01" }, today), false);
  assert.equal(a.missingOfficialSource({ ...passport, sources: [] }), true);
  assert.equal(a.videoAwaitingReview({ ...passport, video: { kind: "uploaded", src: "/x.mp4" } }), true);
  assert.equal(a.videoAwaitingReview({ ...passport, video: { kind: "uploaded", src: "/x.mp4", review: "approved" } }), false);
  assert.equal(a.hasEnglish(passport), true);
  const bad = { ...passport, sources: [{ id: "x", title: "", url: "not a url", official: true, checkedOn: "" }] };
  assert.deepEqual(a.sourceProblems(bad, today).map((p) => p.problem), ["Not a valid URL", "Missing description", "No checked date"]);
  assert.deepEqual(a.sourceProblems(passport, today), []);
});

test("each purpose gets its own video, built from its own steps", async () => {
  const { appliesTo, stepBody } = await import("../content/situations.ts");
  const forSit = (id: string) => ({
    ...passport,
    documents: passport.documents.filter((d) => appliesTo(d, id)),
    steps: passport.steps.filter((s) => appliesTo(s, id)).map((s) => ({ ...s, body: stepBody(s, id) })),
  });
  const renew = buildTutorial(forSit("renew"), "en");
  const first = buildTutorial(forSit("first"), "en");
  assert.ok(renew.scenes.some((s) => s.caption.includes("Choose Renewal.")));
  assert.ok(first.scenes.some((s) => s.caption.includes("Choose First Issuance.")));
  assert.ok(!first.scenes.some((s) => s.caption.includes("Choose Renewal.")));
});

test("free helper: answers from the guide only, never invents", async () => {
  const { buildKnowledge, answer, topicOf } = await import("../assist/answer.ts");
  const dl = buildKnowledge(drivingLicence, "en");
  assert.equal(topicOf("What documents do I need?"), "docs");
  assert.equal(topicOf("kati paisa lagcha"), "fees");
  assert.equal(topicOf("आवेदन कहाँ दिने?"), "where");
  assert.ok(answer(dl, "Where do I apply?").text.includes("https://applydlnew.dotm.gov.np"));
  assert.ok(answer(dl, "How much is the fee?").text.toLowerCase().includes("confirm")); // licence fees aren't verified
  const lost = answer(dl, "I lost my licence, what documents?");
  assert.equal(lost.purpose, "lost");
  assert.ok(lost.text.includes("still being prepared")); // pending purpose: no made-up steps
  assert.ok(answer(dl, "Where do I apply?", "lost").text.includes("https://applydlnew.dotm.gov.np")); // remembered pending purpose doesn't block general answers
  assert.ok(answer(dl, "what documents?", "lost").text.includes("still being prepared"));
  assert.ok(answer(dl, "asdf qwerty").text.startsWith("Sorry"));
  const pp = buildKnowledge(passport, "en");
  assert.ok(answer(pp, "how much does it cost").text.includes("NPR 7,000"));
  const ne = buildKnowledge(passport, "ne");
  assert.ok(answer(ne, "के-के कागजात चाहिन्छ?").text.includes("कागजात"));
  assert.ok(answer(ne, "नवीकरण कसरी गर्ने?").text.includes("१. ")); // Nepali digits
});
