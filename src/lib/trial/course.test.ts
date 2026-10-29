import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCourse, heightAt, nearest, poseAt, COURSE_SIZES } from "./course.ts";

for (const kind of ["car", "motorcycle"] as const) {
  const c = buildCourse(kind);

  test(`${kind}: route is continuous and finite`, () => {
    for (let i = 1; i < c.samples.length; i++) {
      const a = c.samples[i - 1];
      const b = c.samples[i];
      assert.ok(Number.isFinite(b.x) && Number.isFinite(b.z) && Number.isFinite(b.heading));
      assert.ok(b.s >= a.s, "distance never goes back");
      // No jumps: consecutive samples are at most one step apart.
      assert.ok(Math.hypot(b.x - a.x, b.z - a.z) < 0.3, `jump at ${b.s.toFixed(1)} m`);
    }
  });

  test(`${kind}: the eight passes through its waist and stays within its two loops`, () => {
    const R = kind === "car" ? COURSE_SIZES.car.eightRadius : COURSE_SIZES.bike.eightRadius;
    const eight = c.stations.find((s) => s.name === "आठ")!;
    let waist = 0;
    for (let s = eight.from; s <= eight.to; s += 0.2) {
      const p = poseAt(c, s);
      const toUpper = Math.hypot(p.x, p.z + R);
      const toLower = Math.hypot(p.x, p.z - R);
      assert.ok(Math.min(Math.abs(toUpper - R), Math.abs(toLower - R)) < 0.05, `off the loops at ${s.toFixed(1)} m`);
      if (Math.hypot(p.x, p.z) < 0.15) waist++;
    }
    assert.ok(waist >= 3, "crosses the waist at least three times");
  });

  test(`${kind}: ramp rises and falls back to the ground`, () => {
    assert.equal(heightAt(c, c.ramp.start - 1), 0);
    assert.ok(Math.abs(heightAt(c, (c.ramp.topStart + c.ramp.topEnd) / 2) - c.ramp.height) < 1e-9);
    assert.equal(heightAt(c, c.ramp.end + 1), 0);
  });

  test(`${kind}: nearest() finds the route from a point on it`, () => {
    const p = poseAt(c, c.length / 2);
    const n = nearest(c, p.x, p.z);
    assert.ok(n.dist < 0.15);
  });
}

test("car ends by reversing into the bay", () => {
  const c = buildCourse("car");
  assert.equal(poseAt(c, c.length - 0.5).reverse, true);
  assert.equal(poseAt(c, 10).reverse, false);
});
