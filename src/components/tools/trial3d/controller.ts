import * as THREE from "three";
import { curvatureAt, heightAt, nearest, poseAt, type Course, type CourseEvent } from "@/lib/trial/course";
import type { LightState } from "./world";
import type { VehicleModel } from "./vehicles";

/**
 * Moving the vehicle. The demonstration drives along the route with a smooth speed profile: it speeds up
 * and brakes at limited rates, slows for the eight and the breaker, and comes to a stop exactly at each
 * stop line, so it never jumps. Practice mode instead takes the person's controls and steers with a
 * simple bicycle model, and notes when the vehicle touches or leaves the lane.
 */

const G = 9.81;

/** What one frame of driving produced, for the model, the camera, the sound and the screen. */
export interface DriveFrame {
  x: number;
  z: number;
  y: number;
  /** The way the vehicle faces (radians, 0 = north, clockwise). */
  yaw: number;
  /** Signed speed along the way it faces (negative when reversing). */
  speed: number;
  /** Forward acceleration, m/s². */
  accel: number;
  throttle: number;
  steer: number;
  lean: number;
  pitch: number;
  braking: boolean;
  indicator: -1 | 0 | 1;
  /** Distance reached along the route. */
  s: number;
  light: LightState;
  stoppedFoot: boolean;
}

/** Shared by both drivers: the traffic light turns red as the vehicle comes up to it, green once it has waited. */
class LightCycle {
  state: LightState = "green";
  private timer = 0;
  done = false;

  update(dt: number, s: number, stopAt: number, waitingAtLine: boolean) {
    if (this.done) return;
    this.timer += dt;
    if (this.state === "green" && s > stopAt - 16) {
      this.state = "amber";
      this.timer = 0;
    } else if (this.state === "amber" && this.timer > 1.4) {
      this.state = "red";
      this.timer = 0;
    } else if (this.state === "red" && waitingAtLine && this.timer > 3) {
      this.state = "green";
      this.done = true;
    }
  }
}

function stopLine(course: Course): number {
  return course.features.find((f) => f.kind === "light")!.s;
}

function slopePitch(course: Course, s: number, half: number): number {
  return Math.atan2(heightAt(course, s + half) - heightAt(course, s - half), half * 2);
}

/* ---------------- The demonstration ---------------- */

export class DemoDriver {
  s = 0;
  v = 0;
  private holdLeft = 0;
  private holding: CourseEvent | null = null;
  private passed = new Set<CourseEvent>();
  private said = new Set<CourseEvent>();
  private light = new LightCycle();
  private steer = 0;
  private lean = 0;
  finished = false;

  constructor(
    private course: Course,
    private model: VehicleModel,
    private onSay: (text: string) => void,
  ) {
    this.s = course.samples[0].s;
  }

  update(dt: number): DriveFrame {
    const c = this.course;
    const lightS = stopLine(c);
    let accel = 0;
    let throttle = 0;

    // Spoken lines as the vehicle reaches them.
    for (const e of c.events) {
      if (e.say && !this.said.has(e) && this.s >= e.s - 0.05) {
        this.said.add(e);
        this.onSay(e.say);
      }
    }

    if (this.holding) {
      // Waiting at a stop line: a set time, or until the light turns green.
      this.v = 0;
      if (this.holding.stop === "light") {
        if (this.light.state === "green") this.release();
      } else if ((this.holdLeft -= dt) <= 0) {
        this.release();
      }
    } else if (!this.finished) {
      const next = c.events.find((e) => e.stop !== undefined && !this.passed.has(e) && e.s >= this.s - 0.01);
      let target = c.speedAt(this.s);
      if (next) {
        // Brake so as to stop on the line: v² = 2·a·d.
        const d = Math.max(0, next.s - this.s);
        target = Math.min(target, Math.sqrt(2 * 1.3 * d) + (d > 0.02 ? 0.05 : 0));
      }
      const dv = THREE.MathUtils.clamp(target - this.v, -2.6 * dt, 1.1 * dt);
      this.v = Math.max(0, this.v + dv);
      accel = dv / Math.max(dt, 1e-4);
      throttle = accel > 0.05 ? 0.35 + accel / 1.1 * 0.6 : this.v > 0.2 ? 0.2 : 0;
      this.s += this.v * dt;
      if (next && this.s >= next.s - 0.015) {
        this.s = next.s;
        this.v = 0;
        this.holding = next;
        this.holdLeft = typeof next.stop === "number" ? next.stop : 0;
        if (next.stop === 99) this.finished = true;
      }
    }

    this.light.update(dt, this.s, lightS, this.holding?.stop === "light");
    return this.frame(dt, accel, throttle);
  }

  private release() {
    if (this.holding) this.passed.add(this.holding);
    this.holding = null;
  }

  private frame(dt: number, accel: number, throttle: number): DriveFrame {
    const c = this.course;
    const p = poseAt(c, this.s);
    const k = curvatureAt(c, this.s);
    const two = this.model.kind !== "car";
    const reverse = p.reverse;
    // Steering follows the bend ahead; reversing, the front wheels turn the other way.
    const targetSteer = Math.atan(k * this.model.wheelbase) * (reverse ? -1 : 1);
    const ease = 1 - Math.exp(-dt * 6);
    this.steer += (targetSteer - this.steer) * ease;
    const targetLean = two ? Math.atan((this.v * this.v * k) / G) : 0;
    this.lean += (targetLean - this.lean) * ease;
    const signal = c.events.find((e) => e.signalUntil !== undefined && this.s >= e.s && this.s <= e.signalUntil);
    return {
      x: p.x,
      z: p.z,
      y: heightAt(c, this.s),
      yaw: reverse ? p.heading + Math.PI : p.heading,
      speed: reverse ? -this.v : this.v,
      accel,
      throttle,
      steer: this.steer,
      lean: this.lean,
      pitch: slopePitch(c, this.s, this.model.wheelbase / 2) * (reverse ? -1 : 1),
      braking: accel < -0.3 || (this.v < 0.01 && this.holding !== null),
      indicator: signal ? (curvatureAt(c, signal.s + 3) >= 0 ? 1 : -1) : 0,
      s: this.s,
      light: this.light.state,
      stoppedFoot: two && this.v < 0.02,
    };
  }
}

/* ---------------- Practice ---------------- */

export interface PracticeInput {
  throttle: number;
  brake: number;
  /** -1 full left … 1 full right. */
  steer: number;
}

/** A practice note: what happened and where. Practice feedback only, not an official result. */
export interface PracticeNote {
  id: number;
  text: string;
  kind: "warn" | "ok";
}

export class PracticeDriver {
  x: number;
  z: number;
  yaw: number;
  v = 0;
  private steer = 0;
  private lean = 0;
  private index = 0;
  private best = 0;
  private light = new LightCycle();
  private touching = false;
  private outside = false;
  private footDown = false;
  private rampStops = new Map<number, boolean>();
  private noteId = 0;
  lineTouches = 0;
  outOfLane = 0;
  feet = 0;
  redLight = false;
  finished = false;
  lost = false;

  constructor(
    private course: Course,
    private model: VehicleModel,
    private onNote: (n: PracticeNote) => void,
  ) {
    const start = course.events[0]?.s ?? 1;
    const p = poseAt(course, start);
    this.x = p.x;
    this.z = p.z;
    this.yaw = p.heading;
    this.index = nearest(course, p.x, p.z).index;
    this.best = start;
    for (const f of course.features) if (f.kind === "rampStop") this.rampStops.set(f.s, false);
  }

  private note(text: string, kind: PracticeNote["kind"] = "warn") {
    this.onNote({ id: ++this.noteId, text, kind });
  }

  /** Back to the route at the furthest point reached, stopped. */
  recover() {
    const p = poseAt(this.course, Math.max(0, this.best - 2));
    this.x = p.x;
    this.z = p.z;
    this.yaw = p.reverse ? p.heading + Math.PI : p.heading;
    this.v = 0;
    this.index = nearest(this.course, p.x, p.z).index;
    this.lost = false;
  }

  update(dt: number, input: PracticeInput): DriveFrame {
    const c = this.course;
    const m = this.model;
    const car = m.kind === "car";
    const maxV = car ? 5 : 4.5;

    // Throttle forward; the brake slows, and from a standstill a car backs up (two-wheelers don't reverse).
    let a = 0;
    if (input.throttle > 0) a = this.v < 0 ? 4 : 1.6 * input.throttle;
    if (input.brake > 0) {
      if (this.v > 0.05) a = -4 * input.brake;
      else if (car) a = -1.1 * input.brake;
      else a = this.v < 0 ? 4 : 0;
    }
    // Rolling resistance.
    if (input.throttle === 0 && input.brake === 0) a = -Math.sign(this.v) * Math.min(Math.abs(this.v) / dt, 0.6);
    const before = this.v;
    this.v = THREE.MathUtils.clamp(this.v + a * dt, car ? -1.6 : 0, maxV);
    if (!car && input.brake > 0 && this.v < 0.05) this.v = 0;
    const accel = (this.v - before) / Math.max(dt, 1e-4);

    const maxSteer = car ? 0.62 : 0.7;
    const ease = 1 - Math.exp(-dt * 7);
    this.steer += (input.steer * maxSteer - this.steer) * ease;
    // Bicycle model: turning rate = v / wheelbase × tan(steer).
    const yawRate = (this.v / m.wheelbase) * Math.tan(this.steer);
    this.yaw += yawRate * dt;
    this.x += Math.sin(this.yaw) * this.v * dt;
    this.z -= Math.cos(this.yaw) * this.v * dt;

    // Where are we on the route?
    const n = nearest(c, this.x, this.z, this.index);
    this.index = n.index;
    const sample = c.samples[n.index];
    const s = sample.s;
    if (s > this.best && s < this.best + 6) this.best = s;
    const half = sample.width / 2;
    const touching = n.dist > half - m.halfWidth;
    const outside = n.dist > half + m.halfWidth;
    if (touching && !this.touching && !outside) {
      this.lineTouches++;
      this.note(car ? "पहेँलो रेखा छोयो — बीचमा राख्नुहोस्।" : "पहेँलो रेखा छोयो — बीचमा रहनुहोस्।");
    }
    if (outside && !this.outside) {
      this.outOfLane++;
      this.note("लेनबाहिर निस्कियो।");
    }
    this.touching = touching;
    this.outside = outside;
    if (n.dist > 7) this.lost = true;

    // Two-wheelers: stopping in the eight means a foot down.
    const eight = c.stations[1];
    const stopped = Math.abs(this.v) < 0.05;
    if (!car && stopped && s > eight.from + 1 && s < eight.to && !this.footDown) {
      this.feet++;
      this.note("आठमा रोकियो — खुट्टा भुइँमा राख्नुपर्‍यो।");
    }
    this.footDown = !car && stopped && s > eight.from + 1 && s < eight.to;

    // Stop lines on the ramp: did the vehicle stop within a metre of each?
    for (const [at, done] of this.rampStops) {
      if (!done && stopped && Math.abs(s - at) < 1) {
        this.rampStops.set(at, true);
        this.note("स्टप लाइनमा रोकियो।", "ok");
      }
      if (!done && s > at + 2 && s < at + 6) {
        this.rampStops.set(at, true);
        this.note("र्‍याम्पको स्टप लाइनमा रोकिएन।");
      }
    }

    // The light: red as you come up to it; going past the line on red is noted.
    const lineS = stopLine(c);
    this.light.update(dt, s, lineS, stopped && s > lineS - 4 && s <= lineS + 0.3);
    if (this.light.state === "red" && !this.redLight && s > lineS + 0.4 && s < lineS + 3) {
      this.redLight = true;
      this.note("रातो बत्तीमा अगाडि बढ्यो।");
    }

    // The end: past the finish line, or (car) parked in the bay.
    if (!this.finished && s > c.length - (car ? 0.8 : 1) && stopped) {
      this.finished = true;
      this.note(car ? "ग्यारेजमा पार्क भयो।" : "ट्रायल मार्ग पूरा भयो।", "ok");
    }

    const two = !car;
    const targetLean = two ? Math.atan((this.v * yawRate) / G) : 0;
    this.lean += (targetLean - this.lean) * (1 - Math.exp(-dt * 5));
    const onRoad = n.dist < half + 0.6;
    return {
      x: this.x,
      z: this.z,
      y: onRoad ? heightAt(c, s) : 0,
      yaw: this.yaw,
      speed: this.v,
      accel,
      throttle: input.throttle,
      steer: this.steer,
      lean: this.lean,
      // The route's slope, nose up when facing uphill.
      pitch: onRoad ? slopePitch(c, s, m.wheelbase / 2) * (Math.cos(this.yaw - sample.heading) >= 0 ? 1 : -1) : 0,
      braking: input.brake > 0,
      indicator: 0,
      s,
      light: this.light.state,
      stoppedFoot: two && stopped,
    };
  }
}

/* ---------------- Putting a frame on the model ---------------- */

export function applyFrame(model: VehicleModel, f: DriveFrame, dt: number, clock: number) {
  model.root.position.set(f.x, f.y, f.z);
  // Heading, then nose-up on a climb; the body leans right on a right turn (negative z rotation).
  model.root.rotation.set(f.pitch, -f.yaw, 0, "YXZ");
  model.body.rotation.z = -f.lean;
  for (const w of model.wheels) w.mesh.rotation.x -= (f.speed * dt) / w.radius;
  for (const s of model.steer) s.rotation.y = -f.steer;
  model.setBrake(f.braking);
  model.setIndicator(f.indicator, Math.floor(clock * 2.6) % 2 === 0);
  if (model.footLeg) {
    // The left foot goes down to the ground at a stop.
    const target = f.stoppedFoot ? -0.55 : 0;
    model.footLeg.rotation.z += (target - model.footLeg.rotation.z) * (1 - Math.exp(-dt * 8));
  }
}

/* ---------------- Cameras ---------------- */

export type CameraMode = "overview" | "follow" | "side" | "top" | "driver";

export class CameraController {
  private pos = new THREE.Vector3();
  private look = new THREE.Vector3();
  private first = true;
  /** Turned by dragging, for the overview. */
  orbit = 0.7;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private center: THREE.Vector3,
    private radius: number,
  ) {}

  jump() {
    this.first = true;
  }

  update(mode: CameraMode, model: VehicleModel, f: DriveFrame, dt: number) {
    const cam = this.camera;
    const at = new THREE.Vector3(f.x, f.y, f.z);
    const fwd = new THREE.Vector3(Math.sin(f.yaw), 0, -Math.cos(f.yaw));
    const right = new THREE.Vector3(Math.cos(f.yaw), 0, Math.sin(f.yaw));
    const car = model.kind === "car";
    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();
    let k = 3;

    if (mode === "driver") {
      // In the seat: from the eyes, looking ahead (and a little down to see the lines).
      model.root.updateMatrixWorld(true);
      const eye = model.body.localToWorld(model.eye.clone());
      cam.position.copy(eye);
      const ahead = eye.clone().addScaledVector(fwd, f.speed < -0.05 ? -6 : 6);
      ahead.y = f.y + (car ? 0.2 : 0);
      cam.up.set(0, 1, 0);
      cam.lookAt(ahead);
      // Two-wheelers: the view tilts with the lean.
      if (!car) cam.rotateZ(-f.lean * 0.6);
      cam.fov = car ? 70 : 74;
      cam.near = 0.05;
      cam.updateProjectionMatrix();
      this.first = true;
      return;
    }
    cam.fov = 50;
    cam.near = 0.1;

    if (mode === "overview") {
      const r = this.radius;
      pos.set(this.center.x + Math.sin(this.orbit) * r * 1.35, r * 1.05, this.center.z + Math.cos(this.orbit) * r * 1.35);
      look.copy(this.center).lerp(at, 0.35);
      k = 2;
    } else if (mode === "top") {
      const fit = this.radius / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / Math.min(1, cam.aspect);
      pos.set(this.center.x, fit * 1.05, this.center.z);
      look.copy(this.center);
      k = 4;
    } else if (mode === "follow") {
      const back = f.speed < -0.05 ? -1 : 1;
      pos.copy(at).addScaledVector(fwd, (car ? -7 : -4.6) * back).add(new THREE.Vector3(0, car ? 3.2 : 2.4, 0));
      look.copy(at).addScaledVector(fwd, 2.5 * back).add(new THREE.Vector3(0, 0.8, 0));
      k = 3.5;
    } else {
      // Side: beside the vehicle, low, as a friend watching from the edge would see it.
      pos.copy(at).addScaledVector(right, car ? 7 : 5.5).addScaledVector(fwd, 1).add(new THREE.Vector3(0, 1.5, 0));
      look.copy(at).add(new THREE.Vector3(0, 0.7, 0));
      k = 3;
    }

    if (this.first) {
      this.pos.copy(pos);
      this.look.copy(look);
      this.first = false;
    } else {
      const e = 1 - Math.exp(-dt * k);
      this.pos.lerp(pos, e);
      this.look.lerp(look, e);
    }
    cam.position.copy(this.pos);
    // Looking straight down, north is the top of the screen.
    if (mode === "top") cam.up.set(0, 0, -1);
    else cam.up.set(0, 1, 0);
    cam.lookAt(this.look);
    cam.updateProjectionMatrix();
  }
}
