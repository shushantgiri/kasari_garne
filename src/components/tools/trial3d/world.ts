import * as THREE from "three";
import { COURSE_SIZES, heightAt, poseAt, type Course } from "@/lib/trial/course";

/**
 * The trial ground in 3D, built from the course data: the painted lanes with their yellow edge lines,
 * the stop lines, zebra crossing, traffic light, ramp, speed breaker, narrow plank or garage bay, and a
 * plain setting round it (fence, trees, the office building, hills) so it reads as a real ground.
 */

export type LightState = "red" | "amber" | "green";

export interface World {
  group: THREE.Group;
  /** Centre and half-size of the course, for the overview and top-down cameras. */
  center: THREE.Vector3;
  radius: number;
  setLight: (state: LightState) => void;
  dispose: () => void;
}

const COLORS = {
  grass: 0x86a86a,
  pad: 0xcfc8b8,
  asphalt: 0x4a4f57,
  yellow: 0xf2c230,
  white: 0xf4f4f0,
  plank: 0xa87b4f,
  rampSide: 0x9a9284,
};

/** A flat strip following the route from `from` to `to`, shifted sideways by `offset` (+ = right). */
function ribbon(course: Course, from: number, to: number, width: number | null, offset: number, lift: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const step = 0.25;
  const n = Math.max(1, Math.ceil((to - from) / step));
  for (let i = 0; i <= n; i++) {
    const s = from + ((to - from) * i) / n;
    const p = poseAt(course, s);
    const w = width ?? p.width;
    const nx = Math.cos(p.heading);
    const nz = Math.sin(p.heading);
    // Keep "right" the same side of the road when the route reverses.
    const o = p.reverse ? -offset : offset;
    const y = heightAt(course, s) + lift;
    pos.push(p.x + nx * (o - w / 2), y, p.z + nz * (o - w / 2));
    pos.push(p.x + nx * (o + w / 2), y, p.z + nz * (o + w / 2));
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A sign board with Nepali text drawn on a canvas (the browser's fonts shape Devanagari properly). */
function signBoard(text: string, color = "#1B2230"): THREE.Group {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 118);
  ctx.fillStyle = color;
  ctx.font = "bold 54px 'Noto Sans Devanagari', 'Mukta', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.04), [
    new THREE.MeshStandardMaterial({ color: 0xdddddd }),
    new THREE.MeshStandardMaterial({ color: 0xdddddd }),
    new THREE.MeshStandardMaterial({ color: 0xdddddd }),
    new THREE.MeshStandardMaterial({ color: 0xdddddd }),
    new THREE.MeshStandardMaterial({ map: tex }),
    new THREE.MeshStandardMaterial({ map: tex }),
  ]);
  board.position.y = 1.5;
  board.castShadow = true;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5), new THREE.MeshStandardMaterial({ color: 0x777777 }));
  pole.position.y = 0.75;
  g.add(board, pole);
  return g;
}

/** Stripes on a canvas, for the zebra crossing and the speed breaker. */
function stripes(a: string, b: string, count: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = i % 2 ? b : a;
    ctx.fillRect((256 / count) * i, 0, 256 / count + 1, 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Place an object beside the route at distance s, `side` metres right (negative = left), facing along it. */
function placeAt(course: Course, obj: THREE.Object3D, s: number, side: number, lift = 0) {
  const p = poseAt(course, s);
  obj.position.set(p.x + Math.cos(p.heading) * side, heightAt(course, s) + lift, p.z + Math.sin(p.heading) * side);
  obj.rotation.y = -p.heading;
}

function tree(scale: number): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 1.4 * scale, 6), new THREE.MeshStandardMaterial({ color: 0x6b4a32, flatShading: true }));
  trunk.position.y = 0.7 * scale;
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 * scale, 0), new THREE.MeshStandardMaterial({ color: 0x4f7d3a, flatShading: true }));
  leaves.position.y = 2 * scale;
  leaves.scale.y = 1.15;
  trunk.castShadow = leaves.castShadow = true;
  g.add(trunk, leaves);
  return g;
}

export function buildWorld(course: Course): World {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const mat = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });
    disposables.push(m);
    return m;
  };
  const add = (geo: THREE.BufferGeometry, material: THREE.Material, receive = true, cast = false) => {
    disposables.push(geo);
    const m = new THREE.Mesh(geo, material);
    m.receiveShadow = receive;
    m.castShadow = cast;
    group.add(m);
    return m;
  };

  // Bounds of the route.
  const box = new THREE.Box3();
  for (const p of course.samples) box.expandByPoint(new THREE.Vector3(p.x, 0, p.z));
  box.expandByScalar(5);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.z) / 2;

  // Grass, and the levelled ground of the trial yard.
  const grass = add(new THREE.PlaneGeometry(400, 400), mat(COLORS.grass));
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.02;
  const pad = add(new THREE.PlaneGeometry(size.x + 6, size.z + 6), mat(COLORS.pad));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(center.x, -0.01, center.z);

  // The lanes: asphalt with yellow edge lines.
  const asphalt = mat(COLORS.asphalt, { roughness: 0.95, side: THREE.DoubleSide });
  const yellow = mat(COLORS.yellow, { roughness: 0.6, side: THREE.DoubleSide });
  const white = mat(COLORS.white, { roughness: 0.6, side: THREE.DoubleSide });
  const narrow = course.features.find((f) => f.kind === "narrow");
  const bay = course.features.find((f) => f.kind === "bay");
  const reverseFrom = course.samples.find((p) => p.reverse)?.s ?? course.length;
  const segments: [number, number][] = narrow ? [[0, narrow.s], [narrow.until!, course.length]] : [[0, reverseFrom]];
  for (const [a, b] of segments) {
    add(ribbon(course, a, b, null, 0, 0.004), asphalt);
    for (const side of [-1, 1]) {
      const g = new THREE.BufferGeometry();
      // Edge line: a thin strip just inside each edge (width taken per point).
      const pos: number[] = [];
      const idx: number[] = [];
      const n = Math.ceil((b - a) / 0.25);
      for (let i = 0; i <= n; i++) {
        const s = a + ((b - a) * i) / n;
        const p = poseAt(course, s);
        const o = side * (p.width / 2 - 0.07);
        const nx = Math.cos(p.heading);
        const nz = Math.sin(p.heading);
        const y = heightAt(course, s) + 0.01;
        pos.push(p.x + nx * (o - 0.06), y, p.z + nz * (o - 0.06), p.x + nx * (o + 0.06), y, p.z + nz * (o + 0.06));
        if (i > 0) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2);
      }
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      add(g, yellow);
    }
  }

  // The narrow path: a raised wooden plank with the lane painted either side.
  if (narrow) {
    const s0 = narrow.s;
    const s1 = narrow.until!;
    const len = s1 - s0;
    const plank = add(new THREE.BoxGeometry(COURSE_SIZES.bike.narrowWidth, COURSE_SIZES.plankHeight, len), mat(COLORS.plank, { roughness: 0.8 }), true, true);
    placeAt(course, plank, (s0 + s1) / 2, 0);
    plank.position.y = COURSE_SIZES.plankHeight / 2;
    for (const side of [-1, 1]) {
      const edge = add(new THREE.BoxGeometry(0.1, 0.012, len), yellow);
      placeAt(course, edge, (s0 + s1) / 2, side * (COURSE_SIZES.bike.roadWidth / 2 - 0.1), 0.006);
      const ground = add(new THREE.BoxGeometry(COURSE_SIZES.bike.roadWidth, 0.006, len), asphalt);
      placeAt(course, ground, (s0 + s1) / 2, 0, 0.002);
    }
  }

  // The ramp: solid sides down to the ground.
  {
    const r = course.ramp;
    const sideMat = mat(COLORS.rampSide, { side: THREE.DoubleSide });
    for (const side of [-1, 1]) {
      const pos: number[] = [];
      const idx: number[] = [];
      const n = Math.ceil((r.end - r.start) / 0.25);
      for (let i = 0; i <= n; i++) {
        const s = r.start + ((r.end - r.start) * i) / n;
        const p = poseAt(course, s);
        const o = (side * p.width) / 2;
        const x = p.x + Math.cos(p.heading) * o;
        const z = p.z + Math.sin(p.heading) * o;
        pos.push(x, heightAt(course, s) + 0.004, z, x, 0, z);
        if (i > 0) idx.push((i - 1) * 2, (i - 1) * 2 + 1, i * 2, (i - 1) * 2 + 1, i * 2 + 1, i * 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      add(g, sideMat, true, true);
    }
  }

  // Stop lines (light, and both on the ramp) and the zebra crossing.
  const roadWidth = (s: number) => poseAt(course, s).width;
  for (const f of course.features) {
    if (f.kind === "light" || f.kind === "rampStop") {
      const line = add(new THREE.BoxGeometry(roadWidth(f.s) - 0.1, 0.012, 0.3), white);
      placeAt(course, line, f.s, 0, 0.008);
    }
    if (f.kind === "zebra") {
      const tex = stripes("#f4f4f0", "#4a4f57", 11);
      disposables.push(tex);
      const zm = mat(0xffffff, { map: tex });
      const z = add(new THREE.BoxGeometry(roadWidth(f.s) - 0.2, 0.012, 1.6), zm);
      placeAt(course, z, f.s + 0.8, 0, 0.008);
    }
    if (f.kind === "breaker") {
      const tex = stripes("#f2c230", "#1b2230", 8);
      disposables.push(tex);
      const w = roadWidth(f.s);
      // Half a cylinder lying across the road (its axis along local x), squashed to the breaker's height.
      const r = COURSE_SIZES.breaker.width / 2;
      const geo = new THREE.CylinderGeometry(r, r, w, 20, 1, false, 0, Math.PI);
      geo.rotateZ(Math.PI / 2);
      geo.scale(1, COURSE_SIZES.breaker.height / r, 1);
      const bump = add(geo, mat(0xffffff, { map: tex }), true, true);
      placeAt(course, bump, f.s, 0);
      bump.position.y = 0;
    }
    if (f.kind === "arrow") {
      const shape = new THREE.Shape();
      shape.moveTo(0, -0.9);
      shape.lineTo(0.45, -0.2);
      shape.lineTo(0.15, -0.2);
      shape.lineTo(0.15, 0.9);
      shape.lineTo(-0.15, 0.9);
      shape.lineTo(-0.15, -0.2);
      shape.lineTo(-0.45, -0.2);
      const g = new THREE.ShapeGeometry(shape);
      g.rotateX(-Math.PI / 2);
      const a = add(g, white);
      placeAt(course, a, f.s, 0, 0.012);
    }
  }

  // The garage bay for cars: painted box with cones at its mouth.
  if (bay) {
    const p = poseAt(course, bay.s);
    const bayGroup = new THREE.Group();
    bayGroup.position.set(p.x, 0.008, p.z);
    // p.heading is the direction of travel (reversing in), so the bay's back is further along it.
    bayGroup.rotation.y = -p.heading;
    const W = 2.6;
    const L = 5.4;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.004, L), asphalt);
    floor.position.z = -0.6;
    floor.receiveShadow = true;
    bayGroup.add(floor);
    for (const [w, d, x, z] of [
      [0.12, L, -W / 2, -0.6],
      [0.12, L, W / 2, -0.6],
      [W, 0.12, 0, -0.6 - L / 2],
    ] as const) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, d), white);
      l.position.set(x, 0.004, z);
      bayGroup.add(l);
    }
    const coneMat = mat(0xff6a1a, { roughness: 0.6 });
    for (const [x, z] of [[-W / 2 - 0.25, -0.6 + L / 2], [W / 2 + 0.25, -0.6 + L / 2], [-W / 2 - 0.25, -0.6 - L / 2], [W / 2 + 0.25, -0.6 - L / 2]]) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 12), coneMat);
      c.position.set(x, 0.25, z);
      c.castShadow = true;
      bayGroup.add(c);
    }
    group.add(bayGroup);
  }

  // The traffic light, on the right at the zebra crossing.
  const lamps: Record<LightState, THREE.MeshStandardMaterial> = {
    red: mat(0x3a0d0d, { emissive: 0xff2a1a, emissiveIntensity: 0 }),
    amber: mat(0x3a2a0d, { emissive: 0xffaa10, emissiveIntensity: 0 }),
    green: mat(0x0d3a1a, { emissive: 0x18e070, emissiveIntensity: 0 }),
  };
  const lightF = course.features.find((f) => f.kind === "light");
  if (lightF) {
    const tl = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3), mat(0x2b3038));
    pole.position.y = 1.5;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.95, 0.3), mat(0x1b1f25));
    head.position.y = 3.1;
    pole.castShadow = head.castShadow = true;
    tl.add(pole, head);
    (["red", "amber", "green"] as const).forEach((k, i) => {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), lamps[k]);
      // −z in the group's frame is the direction of travel; the vehicle comes from +z, so the lamps face +z.
      lamp.position.set(0, 3.4 - i * 0.3, 0.16);
      tl.add(lamp);
    });
    placeAt(course, tl, lightF.s + 0.8, roadWidth(lightF.s) / 2 + 0.6);
    group.add(tl);
  }
  const setLight = (state: LightState) => {
    for (const k of Object.keys(lamps) as LightState[]) lamps[k].emissiveIntensity = k === state ? 2.4 : 0;
  };
  setLight("green");

  // Station signs, on the left of the road just before each one.
  const signs: [string, number][] = course.stations.slice(1).map((st) => [st.name, st.from + 1]);
  for (const [text, s] of signs) {
    const sign = signBoard(text);
    placeAt(course, sign, s, -(roadWidth(s) / 2 + 1.1));
    group.add(sign);
  }

  // Setting: a fence round the yard, trees, the office building, and hills far off.
  const fenceMat = mat(0x8a8f96);
  const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
  disposables.push(postGeo);
  const fx = size.x / 2 + 3;
  const fz = size.z / 2 + 3;
  for (let x = -fx; x <= fx + 0.01; x += 3) {
    for (const z of [-fz, fz]) {
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(center.x + x, 0.6, center.z + z);
      group.add(post);
    }
  }
  for (let z = -fz; z <= fz + 0.01; z += 3) {
    for (const x of [-fx, fx]) {
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(center.x + x, 0.6, center.z + z);
      group.add(post);
    }
  }
  for (const [w, d, x, z] of [
    [fx * 2, 0.04, 0, -fz],
    [fx * 2, 0.04, 0, fz],
    [0.04, fz * 2, -fx, 0],
    [0.04, fz * 2, fx, 0],
  ]) {
    for (const y of [0.5, 1.05]) {
      const rail = add(new THREE.BoxGeometry(w, 0.04, d), fenceMat, false);
      rail.position.set(center.x + x, y, center.z + z);
    }
  }
  // A seeded scatter of trees outside the fence, so the scene looks the same every time.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = radius + 8 + rnd() * 30;
    const t = tree(0.8 + rnd() * 0.9);
    t.position.set(center.x + Math.cos(ang) * dist * (size.x / (2 * radius) + 0.3), 0, center.z + Math.sin(ang) * dist);
    group.add(t);
  }
  // The office building by the yard.
  {
    const office = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 6), mat(0xe9e2d0));
    walls.position.y = 2;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.3, 6.6), mat(0xb5432f));
    roof.position.y = 4.15;
    walls.castShadow = roof.castShadow = true;
    office.add(walls, roof);
    const glass = mat(0x5f7d95, { roughness: 0.3, metalness: 0.2 });
    for (let i = 0; i < 5; i++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.05), glass);
      win.position.set(-4.8 + i * 2.4, 2.5, 3.01);
      office.add(win);
    }
    office.position.set(center.x - fx - 9, 0, center.z + fz - 6);
    office.rotation.y = Math.PI / 2;
    group.add(office);
  }
  // Hills on the horizon.
  const hillMat = mat(0x6f8f7a, { flatShading: true });
  for (let i = 0; i < 9; i++) {
    const ang = (i / 9) * Math.PI * 2 + 0.3;
    const h = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), hillMat);
    h.scale.set(40 + (i % 3) * 14, 14 + (i % 4) * 6, 30);
    h.position.set(center.x + Math.cos(ang) * 150, -3, center.z + Math.sin(ang) * 150);
    group.add(h);
  }

  return {
    group,
    center,
    radius,
    setLight,
    dispose: () => {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material;
          (Array.isArray(m) ? m : [m]).forEach((x) => {
            (x as THREE.MeshStandardMaterial).map?.dispose();
            x.dispose();
          });
        }
      });
      disposables.forEach((d) => d.dispose());
    },
  };
}
