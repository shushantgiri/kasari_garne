/**
 * The driving licence trial courses, as data, for the 3D simulator.
 *
 * Layout and order follow the official trial map shown at transport offices (कार, जिपको / मोटरसाइकल,
 * स्कुटरको ट्रायल नक्सा): the upright figure of eight at the bottom left; up the left road (a speed
 * breaker for cars, the narrow path for motorcycles); the U-turn at the top; down the right road past the
 * zebra crossing, (motorcycles: a speed breaker), the traffic light, the ramp up and the ramp down; cars
 * then reverse into the garage bay.
 *
 * The map has no measurements, so every size below is an assumption kept in one place (COURSE_SIZES)
 * and easy to change. Units are metres. x points east, z points south (as on the map, top = north).
 * A heading of 0 is north; it grows clockwise.
 */

export type TrialVehicleKind = "car" | "motorcycle" | "scooter";

/** Sizes assumed for the courses (the official map gives none). Change them here. */
export const COURSE_SIZES = {
  car: { eightRadius: 5.5, eightWidth: 3.2, roadWidth: 3.6, uturnRadius: 9, leftRoad: 22, rightRoad: 44 },
  bike: { eightRadius: 4, eightWidth: 1.9, roadWidth: 2.6, uturnRadius: 8, leftRoad: 22, rightRoad: 46, narrowWidth: 0.9 },
  ramp: { up: 8, top: 3, down: 8, height: 1.2 },
  breaker: { height: 0.09, width: 0.6 },
  /** The motorcycle narrow path is drawn as a raised plank this high. */
  plankHeight: 0.08,
} as const;

export interface Sample {
  x: number;
  z: number;
  /** Direction of travel (radians, 0 = north, clockwise). */
  heading: number;
  /** Distance along the route, metres. */
  s: number;
  /** Lane width here. */
  width: number;
  /** The vehicle is reversing here (it faces the other way to its travel). */
  reverse: boolean;
}

/** Something on the course a vehicle meets at a point along the route. */
export interface CourseFeature {
  kind: "start" | "finish" | "zebra" | "breaker" | "light" | "rampStop" | "narrow" | "bay" | "arrow";
  s: number;
  /** For features that span a stretch (narrow path). */
  until?: number;
}

/** What happens at a point along the route in the demonstration. */
export interface CourseEvent {
  s: number;
  /** Stop here (vehicle centre), and for how long; "light" waits for green. */
  stop?: number | "light";
  /** Nepali line for the subtitle and voice. */
  say?: string;
  /** Indicator on until this distance. */
  signalUntil?: number;
}

/** A station of the trial, for the progress bar. */
export interface Station {
  name: string;
  from: number;
  to: number;
}

export interface Course {
  kind: TrialVehicleKind;
  samples: Sample[];
  length: number;
  features: CourseFeature[];
  events: CourseEvent[];
  stations: Station[];
  /** Ramp elevation profile along the route. */
  ramp: { start: number; topStart: number; topEnd: number; end: number; height: number };
  /** Speed the demonstration aims for along the route (m/s). */
  speedAt: (s: number) => number;
}

/* ---------------- A small path builder: straight lines and arcs ---------------- */

const STEP = 0.2;

class Path {
  samples: Sample[] = [];
  x: number;
  z: number;
  heading: number;
  s = 0;
  reverse = false;
  marks: Record<string, number> = {};

  private width: number;

  constructor(x: number, z: number, heading: number, width: number) {
    this.width = width;
    this.x = x;
    this.z = z;
    this.heading = heading;
    this.push();
  }

  private push() {
    this.samples.push({ x: this.x, z: this.z, heading: this.heading, s: this.s, width: this.width, reverse: this.reverse });
  }

  /** Remember the distance here under a name. */
  mark(name: string) {
    this.marks[name] = this.s;
    return this;
  }

  setWidth(w: number) {
    this.width = w;
    return this;
  }

  line(len: number) {
    const n = Math.max(1, Math.round(len / STEP));
    for (let i = 0; i < n; i++) {
      this.x += Math.sin(this.heading) * (len / n);
      this.z -= Math.cos(this.heading) * (len / n);
      this.s += len / n;
      this.push();
    }
    return this;
  }

  /** Turn along a circle: "R" clockwise, "L" anticlockwise, by `deg` degrees. */
  arc(radius: number, deg: number, dir: "L" | "R") {
    const sign = dir === "R" ? 1 : -1;
    // Centre: to the right of travel for a right turn, to the left for a left turn.
    const cx = this.x + sign * radius * Math.cos(this.heading);
    const cz = this.z + sign * radius * Math.sin(this.heading);
    const total = (deg * Math.PI) / 180;
    const len = radius * total;
    const n = Math.max(2, Math.round(len / STEP));
    const start = this.heading;
    for (let i = 1; i <= n; i++) {
      this.heading = start + sign * (total * i) / n;
      this.x = cx - sign * radius * Math.cos(this.heading);
      this.z = cz - sign * radius * Math.sin(this.heading);
      this.s += len / n;
      this.push();
    }
    return this;
  }

  /** Stop and drive the other way from here (reversing): the vehicle keeps facing as it was. */
  turnAround() {
    this.heading += Math.PI;
    this.reverse = !this.reverse;
    // A second sample at the same distance, so headings never blend across the turnaround.
    this.push();
    return this;
  }
}

/* ---------------- The two courses ---------------- */

export function buildCourse(kind: TrialVehicleKind): Course {
  const car = kind === "car";
  const z = car ? COURSE_SIZES.car : COURSE_SIZES.bike;
  const R = z.eightRadius;
  const ramp = COURSE_SIZES.ramp;

  // The eight is two loops of radius R touching at the origin: upper loop centred (0, −R), lower (0, R).
  // In from the south along the west side of the lower loop, round to the waist.
  const p = new Path(-R, R + 7, 0, z.roadWidth);
  p.line(1).mark("start").line(6);
  p.setWidth(z.eightWidth).arc(R, 90, "R").mark("eight");
  // The whole upper loop (anticlockwise), the whole lower loop (clockwise), then half the upper loop again…
  p.arc(R, 360, "L").arc(R, 360, "R").arc(R, 180, "L").mark("eightEnd");
  // …and out of the top of the eight, turning north.
  p.setWidth(z.roadWidth).arc(R, 90, "R");

  // Left road, north: a speed breaker (car) or the narrow path (motorcycle) halfway up.
  p.line(4).mark("left");
  if (car) {
    p.line(z.leftRoad / 2 - 4).mark("breakerL").line(z.leftRoad / 2);
  } else {
    p.line(3).mark("narrow").setWidth(COURSE_SIZES.bike.narrowWidth).line(z.leftRoad - 10).mark("narrowEnd").setWidth(z.roadWidth).line(3);
  }

  // The U-turn at the top, then south down the right road.
  p.mark("uturn").arc(z.uturnRadius, 180, "R").mark("uturnEnd");
  // The stop line, the zebra crossing just past it with the light beside it.
  p.line(car ? 8 : 4);
  if (!car) p.mark("breakerR").line(5);
  p.mark("lightStop").line(1.6).mark("zebra").line(4);
  p.mark("rampStart").line(ramp.up / 2).mark("rampUpStop").line(ramp.up / 2).mark("rampTop").line(ramp.top).mark("rampTopEnd");
  p.line(ramp.down / 2).mark("rampDownStop").line(ramp.down / 2).mark("rampEnd");

  if (car) {
    // Garage parking: drive past the bay, stop, then reverse round into it (bay on the east side).
    p.line(9).mark("bayStop").turnAround();
    p.arc(4.5, 90, "R").line(2.5).mark("bayIn");
  } else {
    p.line(8).mark("finish");
  }

  const m = p.marks;
  const length = p.s;
  const lightSay = "रातो बत्तीमा जेब्रा क्रसिङअघि रोकिनुहोस्। हरियो भएपछि मात्र अगाडि बढ्नुहोस्।";

  const features: CourseFeature[] = [
    { kind: "start", s: m.start },
    { kind: "zebra", s: m.zebra },
    { kind: "light", s: m.lightStop },
    { kind: "rampStop", s: m.rampUpStop },
    { kind: "rampStop", s: m.rampDownStop },
    car ? { kind: "breaker", s: m.breakerL } : { kind: "breaker", s: m.breakerR },
    car ? { kind: "bay", s: m.bayIn } : { kind: "finish", s: m.finish },
    ...(car ? [] : [{ kind: "narrow" as const, s: m.narrow, until: m.narrowEnd }]),
    // Direction arrows on the straights.
    { kind: "arrow", s: m.left + 1 },
    { kind: "arrow", s: m.uturnEnd + 1.5 },
    { kind: "arrow", s: m.rampEnd + 2 },
  ];

  const events: CourseEvent[] = [
    { s: m.start, stop: 2.5, say: car ? "अब ट्रायल सुरु गर्नुहोस्। सिटबेल्ट लगाउनुहोस् र ऐना मिलाउनुहोस्।" : "अब ट्रायल सुरु गर्नुहोस्। हेल्मेटको पट्टा लक गर्नुहोस्।" },
    { s: m.eight - 1, say: car ? "आठ आकारको भागमा रेखा नछोई बिस्तारै घुम्नुहोस्।" : "आठ आकारको भाग पार गर्दा सन्तुलन कायम राख्नुहोस्, खुट्टा नराख्नुहोस्।" },
    car
      ? { s: m.breakerL - 4, say: "स्पिड ब्रेकरमा बिस्तारै जानुहोस्, नरोकिनुहोस्।" }
      : { s: m.narrow - 2, say: "साँघुरो बाटोमा सवारीसाधनलाई निर्धारित मार्गभित्र राख्नुहोस्।" },
    { s: m.uturn - 3, say: "यू-टर्नमा इन्डिकेटर दिनुहोस् र सावधानीपूर्वक मोड लिनुहोस्।", signalUntil: m.uturnEnd },
    ...(car ? [] : [{ s: m.breakerR - 3, say: "स्पिड ब्रेकरमा बिस्तारै जानुहोस्, नरोकिनुहोस्।" }]),
    { s: m.lightStop - 3.5, say: lightSay },
    { s: m.lightStop, stop: "light" as const },
    { s: m.rampUpStop, stop: 2.5, say: "उकालोमा स्टप लाइनमा सही तरिकाले रोक्नुहोस्, पछाडि नगुडाउनुहोस्।" },
    { s: m.rampDownStop, stop: 2, say: "ओरालोमा पनि स्टप लाइनमा रोक्नुहोस्।" },
    ...(car
      ? [
          { s: m.bayStop, stop: 1.5, say: "अब ऐना हेर्दै बिस्तारै पछाडि ग्यारेजमा पार्क गर्नुहोस्।" },
          { s: m.bayIn, stop: 99, say: "अब ट्रायल पूरा भएको छ।" },
        ]
      : [{ s: m.finish, stop: 99, say: "अब ट्रायल पूरा भएको छ।" }]),
  ].sort((a, b) => a.s - b.s);

  const stations: Station[] = [
    { name: "सुरु", from: 0, to: m.eight },
    { name: "आठ", from: m.eight, to: m.eightEnd },
    car ? { name: "ब्रेकर", from: m.eightEnd, to: m.uturn } : { name: "साँघुरो बाटो", from: m.eightEnd, to: m.uturn },
    { name: "यू-टर्न", from: m.uturn, to: m.uturnEnd },
    ...(car ? [] : [{ name: "ब्रेकर", from: m.uturnEnd, to: m.breakerR + 2 }]),
    { name: "बत्ती", from: car ? m.uturnEnd : m.breakerR + 2, to: m.rampStart },
    { name: "उकालो/ओरालो", from: m.rampStart, to: m.rampEnd },
    car ? { name: "पार्किङ", from: m.rampEnd, to: length } : { name: "अन्त्य", from: m.rampEnd, to: length },
  ];

  const speedAt = (s: number) => {
    if (s < m.eight) return 1.8;
    if (s < m.eightEnd) return car ? 2.2 : 2.4;
    if (!car && s >= m.narrow - 1 && s <= m.narrowEnd) return 1.5;
    const breaker = car ? m.breakerL : m.breakerR;
    if (Math.abs(s - breaker) < 3) return 1.3;
    if (s >= m.uturn && s <= m.uturnEnd) return 2.6;
    if (s >= m.rampStart && s <= m.rampEnd) return 1.8;
    if (car && s > m.bayStop) return 0.9;
    return car ? 4.2 : 3.8;
  };

  return {
    kind,
    samples: p.samples,
    length,
    features,
    events,
    stations,
    ramp: { start: m.rampStart, topStart: m.rampTop, topEnd: m.rampTopEnd, end: m.rampEnd, height: ramp.height },
    speedAt,
  };
}

/* ---------------- Reading a course ---------------- */

/** Position and heading at a distance along the route (interpolated between samples). */
export function poseAt(course: Course, s: number): Sample {
  const ss = course.samples;
  const d = Math.min(course.length, Math.max(0, s));
  let lo = 0;
  let hi = ss.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ss[mid].s <= d) lo = mid;
    else hi = mid;
  }
  const a = ss[lo];
  const b = ss[hi];
  const t = b.s > a.s ? (d - a.s) / (b.s - a.s) : 0;
  let dh = b.heading - a.heading;
  if (dh > Math.PI) dh -= 2 * Math.PI;
  if (dh < -Math.PI) dh += 2 * Math.PI;
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, heading: a.heading + dh * t, s: d, width: a.width, reverse: b.reverse };
}

/** Height of the road at a distance along the route (the ramp, and the speed breaker's bump). */
export function heightAt(course: Course, s: number): number {
  const r = course.ramp;
  let h = 0;
  if (s > r.start && s < r.topStart) h = ((s - r.start) / (r.topStart - r.start)) * r.height;
  else if (s >= r.topStart && s <= r.topEnd) h = r.height;
  else if (s > r.topEnd && s < r.end) h = (1 - (s - r.topEnd) / (r.end - r.topEnd)) * r.height;
  const narrow = course.features.find((f) => f.kind === "narrow");
  if (narrow && s >= narrow.s && s <= (narrow.until ?? narrow.s)) h += COURSE_SIZES.plankHeight;
  const breaker = course.features.find((f) => f.kind === "breaker");
  if (breaker) {
    const d = Math.abs(s - breaker.s);
    const half = COURSE_SIZES.breaker.width / 2 + 0.25;
    if (d < half) h += COURSE_SIZES.breaker.height * Math.cos((d / half) * (Math.PI / 2)) ** 2;
  }
  return h;
}

/** How sharply the route bends here (1 / radius), signed: positive = turning right. */
export function curvatureAt(course: Course, s: number): number {
  const a = poseAt(course, s - 0.5);
  const b = poseAt(course, s + 0.5);
  let dh = b.heading - a.heading;
  if (dh > Math.PI) dh -= 2 * Math.PI;
  if (dh < -Math.PI) dh += 2 * Math.PI;
  return a.reverse !== b.reverse ? 0 : dh;
}

/** The nearest point of the route to (x, z), searching around a previous index for speed. */
export function nearest(course: Course, x: number, z: number, around = -1): { index: number; dist: number; side: number } {
  const ss = course.samples;
  const from = around < 0 ? 0 : Math.max(0, around - 120);
  const to = around < 0 ? ss.length : Math.min(ss.length, around + 120);
  let best = from;
  let bestD = Infinity;
  for (let i = from; i < to; i++) {
    const d = (ss[i].x - x) ** 2 + (ss[i].z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const p = ss[best];
  // Which side of the line: + right of travel, − left.
  const side = Math.cos(p.heading) * (x - p.x) + Math.sin(p.heading) * (z - p.z);
  return { index: best, dist: Math.sqrt(bestD), side };
}
