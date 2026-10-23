import { test } from "node:test";
import assert from "node:assert/strict";
import { convertLastWord, toNepali } from "./translit.ts";

test("everyday names and words", () => {
  assert.equal(toNepali("raam"), "राम");
  assert.equal(toNepali("bahaadur"), "बहादुर");
  assert.equal(toNepali("ram"), "रम"); // plain "a" is the inherent vowel
  assert.equal(toNepali("thaapaa"), "थापा");
  assert.equal(toNepali("nepaal"), "नेपाल");
  assert.equal(toNepali("kasaree"), "कसरी");
  assert.equal(toNepali("butawal"), "बुतवल"); // lower-case t is त
  assert.equal(toNepali("buTawal"), "बुटवल");
});

test("consonants join, and word endings keep the inherent vowel", () => {
  assert.equal(toNepali("raamro"), "राम्रो");
  assert.equal(toNepali("shree"), "श्री");
  assert.equal(toNepali("garnuhos"), "गर्नुहोस");
  assert.equal(toNepali("chha"), "छ");
  assert.equal(toNepali("kshetra"), "क्षेत्र");
  assert.equal(toNepali("gyaan"), "ज्ञान");
});

test("vowels on their own, signs, digits", () => {
  assert.equal(toNepali("aama"), "आम");
  assert.equal(toNepali("aamaa"), "आमा");
  assert.equal(toNepali("u"), "उ");
  assert.equal(toNepali("hu~"), "हुँ");
  assert.equal(toNepali("ward5"), "वर्द५");
});

test("a capital from the phone's auto-capitalise reads as lower case", () => {
  assert.equal(toNepali("Raam"), "राम");
  assert.equal(toNepali("Bahaadur"), "बहादुर");
});

test("converts the word before a space, and a full stop becomes ।", () => {
  assert.deepEqual(convertLastWord("mero naam ", 10), { text: "mero नाम ", caret: 9 });
  assert.deepEqual(convertLastWord("chha.", 5), { text: "छ।", caret: 2 });
  assert.equal(convertLastWord("राम", 3), null);
  assert.equal(convertLastWord("राम ", 4), null);
});
