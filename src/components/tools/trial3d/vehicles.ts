import * as THREE from "three";
import type { TrialVehicleKind } from "@/lib/trial/course";

/**
 * The three vehicles, built from simple shapes at real-world sizes (metres): a small hatchback like the
 * ones driving schools use, a 150 cc motorcycle and a scooter, each with a rider for the two-wheelers.
 * Every model faces −z with its wheels touching y = 0, so the controller only sets position and heading.
 */

export interface VehicleModel {
  kind: TrialVehicleKind;
  /** Moves and turns with the route. */
  root: THREE.Group;
  /** Tilts for lean (two-wheelers) and pitch (ramp). */
  body: THREE.Group;
  /** Wheels to spin, with their radius. */
  wheels: { mesh: THREE.Object3D; radius: number }[];
  /** Turned by the steering angle. */
  steer: THREE.Object3D[];
  /** The rider's left leg, put down to the ground at a stop. */
  footLeg?: THREE.Object3D;
  wheelbase: number;
  halfWidth: number;
  /** Where the driver's eyes are, in the body's frame. */
  eye: THREE.Vector3;
  setBrake: (on: boolean) => void;
  /** -1 left, 1 right, 0 off; `blink` is the on/off phase. */
  setIndicator: (side: -1 | 0 | 1, blink: boolean) => void;
  dispose: () => void;
}

function std(color: number, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
}

function shadowAll(o: THREE.Object3D) {
  o.traverse((c) => {
    if (c instanceof THREE.Mesh) c.castShadow = true;
  });
}

/** A wheel for a car: tyre, rim and hub, turning about the x axis. */
function carWheel(r: number, w: number, tyre: THREE.Material, rim: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 24), tyre);
  t.rotation.z = Math.PI / 2;
  const rimMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.01, 10), rim);
  rimMesh.rotation.z = Math.PI / 2;
  // A spoke bar so the spin is visible.
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, r * 1.1, 0.05), tyre);
  g.add(t, rimMesh, spoke);
  return g;
}

/** A spoked two-wheeler wheel. */
function bikeWheel(r: number, tyre: THREE.Material, rim: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.TorusGeometry(r - 0.045, 0.05, 10, 28), tyre);
  t.rotation.y = Math.PI / 2;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r * 0.72, 0.03, 18), rim);
  disc.rotation.z = Math.PI / 2;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 10), tyre);
  hub.rotation.z = Math.PI / 2;
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.035, r * 1.3, 0.04), tyre);
  g.add(t, disc, hub, spoke);
  return g;
}

/** A seated rider in a helmet; `upright` for the scooter. Returns the left leg so it can step down. */
function rider(upright: boolean, jacket: number): { group: THREE.Group; leftLeg: THREE.Group } {
  const g = new THREE.Group();
  const skin = std(0xc58c63);
  const cloth = std(jacket);
  const pants = std(0x2c3440);
  const helmet = std(0xd8261c, { roughness: 0.3, metalness: 0.1 });
  const visor = std(0x101418, { roughness: 0.15 });
  const lean = upright ? 0.12 : 0.38;

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 4, 10), cloth);
  torso.position.set(0, 1.12, 0.12);
  torso.rotation.x = -lean;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), helmet);
  head.position.set(0, 1.5, upright ? 0.02 : -0.08);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(0.152, 18, 10, -Math.PI / 2.4, Math.PI / 1.2, Math.PI / 2.6, Math.PI / 4), visor);
  shield.position.copy(head.position);
  shield.rotation.y = Math.PI;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1), skin);
  neck.position.set(0, 1.38, 0.02);
  g.add(torso, head, shield, neck);

  for (const side of [-1, 1]) {
    // Arms reach forward to the handlebar.
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.42, 4, 8), cloth);
    arm.position.set(side * 0.21, 1.17, upright ? -0.12 : -0.2);
    arm.rotation.x = upright ? -1.0 : -1.15;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), skin);
    hand.position.set(side * 0.24, 1.0, upright ? -0.36 : -0.43);
    g.add(arm, hand);

    // Legs: thigh forward along the seat, shin down to the footrest (or the floorboard).
    const leg = new THREE.Group();
    leg.position.set(side * 0.16, 0.86, 0.12);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.36, 4, 8), pants);
    thigh.rotation.x = Math.PI / 2 - 0.15;
    thigh.position.set(0, -0.03, -0.2);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.38, 4, 8), pants);
    shin.position.set(0, -0.3, upright ? -0.42 : -0.38);
    shin.rotation.x = upright ? 0.15 : -0.25;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.22), std(0x1a1a1a));
    shoe.position.set(0, -0.53, upright ? -0.5 : -0.43);
    leg.add(thigh, shin, shoe);
    g.add(leg);
    if (side === -1) {
      shadowAll(g);
      g.userData.leftLeg = leg;
    }
  }
  shadowAll(g);
  return { group: g, leftLeg: g.userData.leftLeg as THREE.Group };
}

function buildCar(): VehicleModel {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const paint = std(0xf2f4f6, { roughness: 0.35, metalness: 0.25 });
  const trim = std(0x22262c, { roughness: 0.7 });
  const glass = std(0x223040, { roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.88 });
  const tyre = std(0x15171a, { roughness: 0.95 });
  const rim = std(0xb8bec6, { metalness: 0.7, roughness: 0.3 });

  // Body: the side profile of a hatchback, extruded across its width (1.62 m), 3.75 m long.
  const W = 1.62;
  const profile = new THREE.Shape();
  profile.moveTo(-1.86, 0.3);
  profile.lineTo(1.84, 0.3);
  profile.quadraticCurveTo(1.92, 0.32, 1.9, 0.62);
  profile.lineTo(1.82, 0.78);
  profile.quadraticCurveTo(1.6, 0.92, 1.12, 0.96);
  profile.lineTo(0.38, 1.44);
  profile.quadraticCurveTo(0.2, 1.5, -0.2, 1.5);
  profile.lineTo(-1.3, 1.47);
  profile.quadraticCurveTo(-1.72, 1.42, -1.84, 1.0);
  profile.lineTo(-1.88, 0.5);
  profile.closePath();
  const shellGeo = new THREE.ExtrudeGeometry(profile, { depth: W, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 10 });
  shellGeo.translate(0, 0, -W / 2);
  shellGeo.rotateY(Math.PI / 2);
  const shell = new THREE.Mesh(shellGeo, paint);
  body.add(shell);

  // Glass: the greenhouse, a touch wider than the body so it shows on the sides.
  const gh = new THREE.Shape();
  gh.moveTo(1.08, 0.99);
  gh.lineTo(0.37, 1.42);
  gh.lineTo(-1.27, 1.41);
  gh.quadraticCurveTo(-1.65, 1.36, -1.78, 1.0);
  gh.closePath();
  const ghGeo = new THREE.ExtrudeGeometry(gh, { depth: W + 0.1, bevelEnabled: false });
  ghGeo.translate(0, 0, -(W + 0.1) / 2);
  ghGeo.rotateY(Math.PI / 2);
  body.add(new THREE.Mesh(ghGeo, glass));
  // Pillars so the glass reads as windows.
  for (const z of [-0.05, 0.75]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.42, 0.08), paint);
    pillar.position.set(0, 1.2, z);
    body.add(pillar);
  }
  // Bumpers, sills and the red Nepali number plates.
  const front = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.2, 0.12), trim);
  front.position.set(0, 0.38, -1.9);
  const rear = front.clone();
  rear.position.z = 1.92;
  const sill = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.1, 2.3), trim);
  sill.position.set(0, 0.34, 0);
  const plateMat = std(0xc8102e, { roughness: 0.4 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.02), plateMat);
  plate.position.set(0, 0.55, -1.94);
  const plateR = plate.clone();
  plateR.position.z = 1.96;
  body.add(front, rear, sill, plate, plateR);

  // Lights: headlights, brake lights (brighter when braking) and indicators.
  const head = std(0xffffff, { emissive: 0xfff6dd, emissiveIntensity: 0.6 });
  const brake = std(0x7a0c0c, { emissive: 0xff1a1a, emissiveIntensity: 0.25 });
  const amberL = std(0x7a4a0c, { emissive: 0xffa21a, emissiveIntensity: 0 });
  const amberR = amberL.clone();
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.05), head);
    h.position.set(side * 0.55, 0.74, -1.88);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.05), brake);
    b.position.set(side * 0.62, 0.86, 1.86);
    const ind = side < 0 ? amberL : amberR;
    const fi = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.05), ind);
    fi.position.set(side * 0.78, 0.62, -1.86);
    const ri = fi.clone();
    ri.position.z = 1.88;
    ri.position.y = 0.7;
    // Side mirrors.
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.1), trim);
    mirror.position.set(side * (W / 2 + 0.1), 1.02, -0.62);
    body.add(h, b, fi, ri, mirror);
  }
  // Inside: the seats and steering wheel for the driver's view (right-hand drive, as in Nepal).
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.12), trim);
  seat.position.set(0.36, 0.95, 0.15);
  const seatL = seat.clone();
  seatL.position.x = -0.36;
  const dash = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.18, 0.4), trim);
  dash.position.set(0, 0.98, -0.82);
  const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 24), trim);
  wheelRing.position.set(0.36, 1.06, -0.52);
  wheelRing.rotation.x = -0.35;
  body.add(seat, seatL, dash, wheelRing);

  const wheels: VehicleModel["wheels"] = [];
  const steer: THREE.Object3D[] = [];
  const r = 0.3;
  for (const [x, z, isFront] of [[-0.7, -1.2, true], [0.7, -1.2, true], [-0.7, 1.15, false], [0.7, 1.15, false]] as const) {
    const pivot = new THREE.Group();
    pivot.position.set(x, r, z);
    const w = carWheel(r, 0.19, tyre, rim);
    pivot.add(w);
    root.add(pivot);
    wheels.push({ mesh: w, radius: r });
    if (isFront) steer.push(pivot);
  }
  shadowAll(root);

  return {
    kind: "car",
    root,
    body,
    wheels,
    steer,
    wheelbase: 2.35,
    halfWidth: 0.82,
    eye: new THREE.Vector3(0.36, 1.25, 0.05),
    setBrake: (on) => (brake.emissiveIntensity = on ? 2.2 : 0.25),
    setIndicator: (side, blink) => {
      amberL.emissiveIntensity = side === -1 && blink ? 2.5 : 0;
      amberR.emissiveIntensity = side === 1 && blink ? 2.5 : 0;
    },
    dispose: () => dispose(root),
  };
}

function buildTwoWheeler(kind: "motorcycle" | "scooter"): VehicleModel {
  const scooter = kind === "scooter";
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const paint = std(scooter ? 0x1f7ac2 : 0xc81e2a, { roughness: 0.3, metalness: 0.35 });
  const dark = std(0x1d2026, { roughness: 0.7 });
  const chrome = std(0xc9ced6, { metalness: 0.85, roughness: 0.25 });
  const tyre = std(0x141619, { roughness: 0.95 });
  const r = scooter ? 0.24 : 0.31;
  const wb = scooter ? 1.26 : 1.34;
  const fz = -wb / 2;
  const rz = wb / 2;

  const wheels: VehicleModel["wheels"] = [];
  // Front: fork, handlebar, headlight and wheel all turn together.
  const front = new THREE.Group();
  front.position.set(0, 0, fz);
  const fWheel = bikeWheel(r, tyre, chrome);
  fWheel.position.y = r;
  front.add(fWheel);
  wheels.push({ mesh: fWheel, radius: r });
  for (const side of [-1, 1]) {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, scooter ? 0.62 : 0.7), chrome);
    fork.position.set(side * 0.08, r + 0.32, 0.1);
    fork.rotation.x = -0.42;
    front.add(fork);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.66), dark);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, scooter ? 1.0 : 0.98, 0.3);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), std(0xffffff, { emissive: 0xfff4d6, emissiveIntensity: 0.7 }));
  lamp.position.set(0, scooter ? 0.88 : 0.82, scooter ? 0.02 : 0.06);
  front.add(bar, lamp);
  // Indicators on the handlebar ends.
  const amberL = std(0x7a4a0c, { emissive: 0xffa21a, emissiveIntensity: 0 });
  const amberR = amberL.clone();
  for (const side of [-1, 1]) {
    const ind = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), side < 0 ? amberL : amberR);
    ind.position.set(side * 0.2, scooter ? 0.86 : 0.8, 0.1);
    front.add(ind);
    const mirror = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 12), chrome);
    mirror.rotation.x = Math.PI / 2;
    mirror.position.set(side * 0.26, (scooter ? 1.0 : 0.98) + 0.2, 0.32);
    front.add(mirror);
  }
  body.add(front);

  // Rear wheel.
  const rWheel = bikeWheel(r, tyre, chrome);
  rWheel.position.set(0, r, rz);
  body.add(rWheel);
  wheels.push({ mesh: rWheel, radius: r });

  if (scooter) {
    // Step-through scooter: front shield, floorboard, rounded rear body and seat.
    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.1), paint);
    shield.position.set(0, 0.62, fz + 0.24);
    shield.rotation.x = -0.25;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.55), dark);
    floor.position.set(0, 0.3, -0.08);
    const rearBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 6, 14), paint);
    rearBody.rotation.x = Math.PI / 2;
    rearBody.position.set(0, 0.52, 0.38);
    rearBody.scale.set(1, 1, 0.9);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.62), dark);
    seat.position.set(0, 0.79, 0.3);
    body.add(shield, floor, rearBody, seat);
  } else {
    // Motorcycle: tank, seat, engine, frame tubes and exhaust.
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.3, 6, 14), paint);
    tank.rotation.x = Math.PI / 2 - 0.15;
    tank.position.set(0, 0.84, -0.22);
    tank.scale.set(1.15, 1, 0.85);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.08, 0.62), dark);
    seat.position.set(0, 0.84, 0.25);
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.38), std(0x3a3f47, { metalness: 0.5, roughness: 0.4 }));
    engine.position.set(0, 0.42, -0.05);
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9), dark);
    frame.rotation.x = Math.PI / 2 + 0.35;
    frame.position.set(0, 0.62, -0.1);
    const swing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.55), dark);
    swing.position.set(0.1, r + 0.05, rz - 0.28);
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.7, 12), chrome);
    exhaust.rotation.x = Math.PI / 2 - 0.12;
    exhaust.position.set(0.17, 0.36, 0.35);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.3), paint);
    tail.position.set(0, 0.86, 0.62);
    body.add(tank, seat, engine, frame, swing, exhaust, tail);
  }
  // Brake light and plate at the back.
  const brake = std(0x7a0c0c, { emissive: 0xff1a1a, emissiveIntensity: 0.25 });
  const bl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.04), brake);
  bl.position.set(0, scooter ? 0.72 : 0.84, rz - (scooter ? 0.3 : 0.05) + 0.24);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.02), std(0xc8102e));
  plate.position.set(0, bl.position.y - 0.12, bl.position.z + 0.02);
  body.add(bl, plate);

  const { group: person, leftLeg } = rider(scooter, scooter ? 0x3c6e4f : 0x2d4a73);
  person.position.z = scooter ? 0.22 : 0.18;
  person.position.y = scooter ? -0.04 : 0;
  body.add(person);
  shadowAll(root);

  return {
    kind,
    root,
    body,
    wheels,
    steer: [front],
    footLeg: leftLeg,
    wheelbase: wb,
    halfWidth: 0.38,
    eye: new THREE.Vector3(0, 1.52, scooter ? 0.15 : 0.05),
    setBrake: (on) => (brake.emissiveIntensity = on ? 2.4 : 0.25),
    setIndicator: (side, blink) => {
      amberL.emissiveIntensity = side === -1 && blink ? 2.5 : 0;
      amberR.emissiveIntensity = side === 1 && blink ? 2.5 : 0;
    },
    dispose: () => dispose(root),
  };
}

function dispose(root: THREE.Object3D) {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    }
  });
}

export function buildVehicle(kind: TrialVehicleKind): VehicleModel {
  return kind === "car" ? buildCar() : buildTwoWheeler(kind);
}
