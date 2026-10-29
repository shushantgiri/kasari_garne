"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pause, Play } from "lucide-react";
import type { Locale, Localized } from "@/lib/content/types";
import type { TrialScene, TrialVehicle, TrialView } from "@/lib/content/trial";
import { digits, tr } from "@/lib/i18n";

/**
 * One trial station, played like a short clip: the vehicle moves along the real course markings,
 * slowly and smoothly, while the step it's on lights up in the list below. Driven by a clock in
 * JavaScript so the vehicle, the traffic light, the STOP badge and the captions stay in step.
 * It only runs while on screen, can be paused, and holds still when motion is turned off.
 *
 * How each station is driven follows what driving schools in Nepal describe: drive in to the eight
 * from outside at the START line, go round both loops on the blue line, and drive out; stop behind
 * the zebra crossing on red; stop between the lines halfway up and halfway down the ramp; drive past
 * the garage box, then reverse in. The "drone" view shows the whole ground from above, in order.
 */

const ROAD = "#3A4252";
const YELLOW = "#F2C94C";
const RED = "#D63A44";
const W = 320;
const H = 200;

/* ---------------- The courses ---------------- */

interface Phase {
  /** How long this part lasts, in ms. */
  ms: number;
  /** Which path the vehicle follows, and from/to how far along it (0 to 1). */
  path: string;
  from: number;
  to: number;
  /** Which step in the list this part belongs to. */
  step: number;
  /** Moving backwards (the car keeps facing the other way). */
  reverse?: boolean;
  /** Show the STOP badge. */
  stop?: boolean;
  /** Indicator blinking. */
  signal?: boolean;
  /** The traffic light's colour during this part. */
  light?: "red" | "amber" | "green";
}

interface Course {
  view: "top" | "side";
  /** Drawing size, if not the usual 320 × 200. */
  box?: [number, number];
  paths: Record<string, string>;
  phases: Phase[];
  steps: Localized[];
}

const o = (ne: string, en: string): Localized => ({ ne, en });

/** The eight, standing upright as on the official trial map: from its bottom, round both loops. */
const EIGHT = "M160 186.4 C 217.6 186.4, 210.4 120, 160 100 C 109.6 80, 102.4 13.6, 160 13.6 C 217.6 13.6, 210.4 80, 160 100 C 109.6 120, 102.4 186.4, 160 186.4";
/** In from outside at the bottom, round the eight one and a half times, then out at the top. */
const EIGHT_ROUTE =
  "M100 214 Q 100 186.4, 160 186.4 C 217.6 186.4, 210.4 120, 160 100 C 109.6 80, 102.4 13.6, 160 13.6 C 217.6 13.6, 210.4 80, 160 100 C 109.6 120, 102.4 186.4, 160 186.4 C 217.6 186.4, 210.4 120, 160 100 C 109.6 80, 102.4 13.6, 160 13.6 Q 220 13.6, 220 -14";

/* The whole trial ground from above (280 × 280), laid out like the official map: the eight at the
   bottom left; up the left road (the narrow path for motorcycles, a speed breaker for cars); round
   the U-turn at the top; down the right road past the zebra crossing (and, for motorcycles, a speed
   breaker), the traffic light, the ramp up and the ramp down; cars finish in the garage box.
   The points along the route (0 to 1) were measured from these paths. */
const DRONE_HEAD =
  "M40 282 Q 40 274.4, 70 274.4 C 89.2 274.4, 86.8 228.8, 70 215 C 53.2 201.2, 50.8 155.6, 70 155.6 C 89.2 155.6, 86.8 201.2, 70 215 C 53.2 228.8, 50.8 274.4, 70 274.4 C 89.2 274.4, 86.8 228.8, 70 215 C 53.2 201.2, 50.8 155.6, 70 155.6 Q 100 155.6, 100 137.6 L100 70 C 100 14, 210 14, 210 70";
const droneRoute = (vehicle: TrialVehicle) => `${DRONE_HEAD} L210 ${vehicle === "bike" ? 262 : 252}`;

/** Where each station sits along the drone route (0 to 1), and where its label goes. */
const DRONE_STOPS: Record<TrialVehicle, { scene: TrialScene; from: number; to: number; x: number; y: number }[]> = {
  bike: [
    { scene: "figure8", from: 0.036, to: 0.498, x: 128, y: 238 },
    { scene: "plank", from: 0.542, to: 0.589, x: 50, y: 116 },
    { scene: "uturn", from: 0.617, to: 0.788, x: 155, y: 50 },
    { scene: "breaker", from: 0.83, to: 0.845, x: 160, y: 112 },
    { scene: "light", from: 0.845, to: 0.87, x: 160, y: 136 },
    { scene: "ramp", from: 0.87, to: 0.96, x: 160, y: 186 },
  ],
  car: [
    { scene: "figure8", from: 0.037, to: 0.504, x: 128, y: 238 },
    { scene: "breaker", from: 0.548, to: 0.59, x: 52, y: 125 },
    { scene: "uturn", from: 0.623, to: 0.796, x: 155, y: 50 },
    { scene: "light", from: 0.81, to: 0.875, x: 160, y: 124 },
    { scene: "ramp", from: 0.875, to: 0.96, x: 160, y: 186 },
    { scene: "parking", from: 0.96, to: 1, x: 160, y: 250 },
  ],
};

function course(scene: TrialView, vehicle: TrialVehicle): Course | null {
  const bike = vehicle === "bike";
  switch (scene) {
    case "drone":
      return {
        view: "top",
        box: [280, 280],
        paths: { route: droneRoute(vehicle) },
        phases: bike
          ? [
              { ms: 900, path: "route", from: 0.025, to: 0.025, step: 0 },
              { ms: 9000, path: "route", from: 0.025, to: 0.498, step: 0 },
              { ms: 2800, path: "route", from: 0.498, to: 0.589, step: 0 },
              { ms: 800, path: "route", from: 0.589, to: 0.617, step: 0 },
              { ms: 2800, path: "route", from: 0.617, to: 0.788, step: 0, signal: true },
              { ms: 1800, path: "route", from: 0.788, to: 0.85, step: 0, light: "red" },
              { ms: 1600, path: "route", from: 0.85, to: 0.85, step: 0, light: "red", stop: true },
              { ms: 1500, path: "route", from: 0.85, to: 0.896, step: 0, light: "green" },
              { ms: 1000, path: "route", from: 0.896, to: 0.896, step: 0, light: "green", stop: true },
              { ms: 1300, path: "route", from: 0.896, to: 0.936, step: 0, light: "green" },
              { ms: 1000, path: "route", from: 0.936, to: 0.936, step: 0, light: "green", stop: true },
              { ms: 1400, path: "route", from: 0.936, to: 1, step: 0, light: "green" },
              { ms: 1400, path: "route", from: 1, to: 1, step: 0, light: "green" },
            ]
          : [
              { ms: 900, path: "route", from: 0.025, to: 0.025, step: 0 },
              { ms: 9000, path: "route", from: 0.025, to: 0.504, step: 0 },
              { ms: 1500, path: "route", from: 0.504, to: 0.555, step: 0 },
              { ms: 1300, path: "route", from: 0.555, to: 0.585, step: 0 },
              { ms: 900, path: "route", from: 0.585, to: 0.623, step: 0 },
              { ms: 2800, path: "route", from: 0.623, to: 0.796, step: 0, signal: true },
              { ms: 1800, path: "route", from: 0.796, to: 0.86, step: 0, light: "red" },
              { ms: 1600, path: "route", from: 0.86, to: 0.86, step: 0, light: "red", stop: true },
              { ms: 1400, path: "route", from: 0.86, to: 0.906, step: 0, light: "green" },
              { ms: 1000, path: "route", from: 0.906, to: 0.906, step: 0, light: "green", stop: true },
              { ms: 1300, path: "route", from: 0.906, to: 0.946, step: 0, light: "green" },
              { ms: 1000, path: "route", from: 0.946, to: 0.946, step: 0, light: "green", stop: true },
              { ms: 1600, path: "route", from: 0.946, to: 1, step: 0, light: "green" },
              { ms: 1600, path: "route", from: 1, to: 1, step: 0, light: "green", stop: true },
            ],
        steps: [],
      };
    case "figure8":
      return {
        view: "top",
        paths: { route: EIGHT_ROUTE },
        phases: [
          { ms: 1100, path: "route", from: 0.03, to: 0.03, step: 0, stop: true },
          { ms: 1700, path: "route", from: 0.03, to: 0.079, step: 0 },
          { ms: 3700, path: "route", from: 0.079, to: 0.36, step: 1 },
          { ms: 3700, path: "route", from: 0.36, to: 0.64, step: 2 },
          { ms: 3700, path: "route", from: 0.64, to: 0.921, step: 3 },
          { ms: 1700, path: "route", from: 0.921, to: 0.985, step: 4 },
          { ms: 800, path: "route", from: 0.985, to: 0.985, step: 4 },
        ],
        steps: [
          o("बाहिरबाट, START रेखाबाट बिस्तारै भित्र छिर्नुहोस्", "From outside, roll in slowly from the START line"),
          o("पहिलो घेरा: मोडतिर हेर्दै, एकनासे गति", "First loop: look into the turn, steady speed"),
          o("बीचबाट अर्को घेरा पूरा घुम्नुहोस्", "Cross the middle and go all round the other loop"),
          o("फेरि बीच पार गरी माथिसम्म आउनुहोस्", "Cross the middle again and come round to the top"),
          bike ? o("रेखा नछोई, खुट्टा नराखी माथिबाट बाहिर निस्कनुहोस्", "Ride out at the top without touching the line or putting a foot down") : o("रेखा नछोई, पछाडि नसारी माथिबाट बाहिर निस्कनुहोस्", "Drive out at the top without touching the line or reversing"),
        ],
      };
    case "plank":
      return {
        view: "side",
        paths: { road: "M-30 146 L350 146" },
        phases: [
          { ms: 2000, path: "road", from: 0, to: 0.22, step: 0 },
          { ms: 5600, path: "road", from: 0.22, to: 0.78, step: 1 },
          { ms: 1800, path: "road", from: 0.78, to: 1, step: 2 },
          { ms: 900, path: "road", from: 1, to: 1, step: 2 },
        ],
        steps: [
          o("पहिलो गियरमा बिस्तारै तख्तामा चढ्नुहोस्", "Ride onto the plank slowly in first gear"),
          o("आँखा तख्ताको अन्तिम छेउतिर, गति स्थिर", "Eyes on the far end, steady speed"),
          o("खुट्टा नराखी, तख्ताबाट नझरी पार गर्नुहोस्", "Cross without a foot down or riding off"),
        ],
      };
    case "light":
      return {
        view: "side",
        paths: { road: "M-30 160 L350 160" },
        phases: [
          { ms: 3200, path: "road", from: 0, to: 0.44, step: 0, light: "red" },
          { ms: 2600, path: "road", from: 0.44, to: 0.44, step: 1, light: "red", stop: true },
          { ms: 900, path: "road", from: 0.44, to: 0.44, step: 1, light: "amber", stop: true },
          { ms: 3200, path: "road", from: 0.44, to: 1, step: 2, light: "green" },
          { ms: 900, path: "road", from: 1, to: 1, step: 2, light: "green" },
        ],
        steps: [
          o("रातो बत्ती: जेब्रा क्रसिङभन्दा पछाडि रोकिनुहोस्", "Red light: stop behind the zebra crossing"),
          o("हरियो नहुन्जेल पर्खनुहोस्", "Wait until it turns green"),
          o("हरियो: बाटो हेरेर अघि बढ्नुहोस्", "Green: look, then move on"),
        ],
      };
    case "uturn":
      return {
        view: "top",
        paths: { u: "M110 210 V92 Q110 40 160 40 Q210 40 210 92 V210" },
        phases: [
          { ms: 1500, path: "u", from: 0, to: 0.04, step: 0, signal: true },
          { ms: 2200, path: "u", from: 0.04, to: 0.32, step: 0, signal: true },
          { ms: 3200, path: "u", from: 0.32, to: 0.68, step: 1, signal: true },
          { ms: 2600, path: "u", from: 0.68, to: 1, step: 2 },
          { ms: 800, path: "u", from: 1, to: 1, step: 2 },
        ],
        steps: [
          o("मोडिनुअघि इन्डिकेटर दिनुहोस्", "Turn the indicator on before the turn"),
          o("बिस्तारै, फराकिलो घेरामा घुम्नुहोस्", "Turn slowly, in a wide arc"),
          o("रेखा नछोई सिधा हुनुहोस्, इन्डिकेटर बन्द", "Straighten up without touching the line; indicator off"),
        ],
      };
    case "breaker":
      return {
        view: "side",
        paths: { road: "M-30 160 L122 160 Q160 132 198 160 L350 160" },
        phases: [
          { ms: 2400, path: "road", from: 0, to: 0.34, step: 0 },
          { ms: 3400, path: "road", from: 0.34, to: 0.62, step: 1 },
          { ms: 2200, path: "road", from: 0.62, to: 1, step: 2 },
          { ms: 800, path: "road", from: 1, to: 1, step: 2 },
        ],
        steps: [
          o("ब्रेकरअघि नै गति घटाउनुहोस्", "Slow down before the speed breaker"),
          o("बिस्तारै, एकनासे पार गर्नुहोस्", "Go over it slowly and smoothly"),
          bike ? o("खुट्टा नराखी, इन्जिन बन्द नगरी अघि बढ्नुहोस्", "Carry on without a foot down or stalling") : o("इन्जिन बन्द नगरी अघि बढ्नुहोस्", "Carry on without stalling"),
        ],
      };
    case "ramp":
      return {
        view: "side",
        paths: { road: "M-30 160 L90 160 L150 110 L190 110 L250 160 L350 160" },
        phases: [
          { ms: 3600, path: "road", from: 0, to: 0.382, step: 0 },
          { ms: 2200, path: "road", from: 0.382, to: 0.382, step: 1, stop: true },
          { ms: 3600, path: "road", from: 0.382, to: 0.666, step: 2 },
          { ms: 1800, path: "road", from: 0.666, to: 0.666, step: 2, stop: true },
          { ms: 2600, path: "road", from: 0.666, to: 1, step: 3 },
          { ms: 800, path: "road", from: 1, to: 1, step: 3 },
        ],
        steps: [
          o("उकालोमा पहेँलो रेखाबीच रोकिनुहोस्", "On the slope, stop between the yellow lines"),
          o("ब्रेक समातेर सङ्केत पर्खनुहोस्", "Hold the brake and wait for the signal"),
          o("पछाडि नगुडाई चढ्नुहोस्; ओरालोमा फेरि रोकिनुहोस्", "Climb without rolling back; stop again on the way down"),
          o("दुवै ब्रेक मिलाएर बिस्तारै झर्नुहोस्", "Come down slowly, using both brakes"),
        ],
      };
    case "parking":
      return {
        view: "top",
        paths: { ahead: "M-20 52 L228 52", back: "M228 52 Q160 52 160 108 L160 160" },
        phases: [
          { ms: 3600, path: "ahead", from: 0, to: 1, step: 0 },
          { ms: 1300, path: "ahead", from: 1, to: 1, step: 0, stop: true },
          { ms: 3400, path: "back", from: 0, to: 0.55, step: 1, reverse: true },
          { ms: 2800, path: "back", from: 0.55, to: 1, step: 2, reverse: true },
          { ms: 1800, path: "back", from: 1, to: 1, step: 3, reverse: true, stop: true },
        ],
        steps: [
          o("बक्सभन्दा अलि अगाडि गएर रोकिनुहोस्", "Drive a little past the box and stop"),
          o("ऐना हेर्दै, स्टेयरिङ घुमाउँदै बिस्तारै पछाडि", "Reverse slowly, watching the mirrors as you steer"),
          o("सिधा पारेर बक्सभित्र लैजानुहोस्", "Straighten up into the box"),
          o("कोन नछोई भित्रै रोकिनुहोस्", "Stop inside without touching the cones"),
        ],
      };
    default:
      return null;
  }
}

/* ---------------- Vehicles ---------------- */

function TopVehicle({ vehicle, signal, blinkOn }: { vehicle: TrialVehicle; signal?: boolean; blinkOn: boolean }) {
  return vehicle === "bike" ? (
    <g>
      <rect x="-13" y="-3" width="26" height="6" rx="3" fill="#1B2230" />
      <rect x="-8" y="-5" width="15" height="10" rx="4" fill={RED} />
      <circle cx="-1.5" cy="0" r="3.8" fill="#F6C66B" />
      {signal && blinkOn && <circle cx="9" cy="-6" r="2.8" fill="#FFB020" />}
    </g>
  ) : (
    <g>
      <rect x="-17" y="-10" width="34" height="20" rx="5" fill={RED} />
      <rect x="3" y="-8" width="8" height="16" rx="2" fill="#DCE8F5" />
      <rect x="-13" y="-8" width="7" height="16" rx="2" fill="#DCE8F5" />
      <rect x="15" y="-9" width="2.5" height="4" rx="1" fill="#FFF3C4" />
      <rect x="15" y="5" width="2.5" height="4" rx="1" fill="#FFF3C4" />
      {signal && blinkOn && <circle cx="15" cy="-11" r="3" fill="#FFB020" />}
    </g>
  );
}

/** Side view, facing right, wheels resting on y = 0. */
function SideVehicle({ vehicle }: { vehicle: TrialVehicle }) {
  return vehicle === "bike" ? (
    <g transform="scale(1.35)">
      <circle cx="-9" cy="-4" r="4" fill="#1B2230" />
      <circle cx="9" cy="-4" r="4" fill="#1B2230" />
      <path d="M-9 -4 L-3 -10 L5 -10 L9 -4" fill="none" stroke="#2B3242" strokeWidth="1.6" />
      <path d="M-5 -10 Q-1 -14 6 -12 L6 -9 L-4 -9 Z" fill={RED} />
      <path d="M-4 -11 L-1 -21" stroke="#1F3F8F" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M-1 -19 L5 -14" stroke="#1F3F8F" strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="-24" r="3.4" fill="#F6C66B" />
    </g>
  ) : (
    <g transform="scale(1.25)">
      <path d="M-22 -6 Q-22 -11 -17 -12 L-10 -13 L-4 -20 Q-2 -22 2 -22 L11 -22 Q14 -22 16 -19 L20 -13 Q24 -12 24 -8 L24 -4 Q24 -3 23 -3 L-21 -3 Q-22 -3 -22 -4 Z" fill={RED} />
      <path d="M-5 -13.5 L-0.5 -19.5 L6 -19.5 L6 -13.5 Z M8 -19.5 L12 -19.5 Q13.5 -19.5 14.5 -18 L17.5 -13.5 L8 -13.5 Z" fill="#DCE8F5" />
      <circle cx="-11" cy="-3" r="4.5" fill="#1B2230" />
      <circle cx="14" cy="-3" r="4.5" fill="#1B2230" />
    </g>
  );
}

/* ---------------- Backgrounds ---------------- */

function Backdrop({ scene, light, vehicle }: { scene: TrialView; light: "red" | "amber" | "green"; vehicle: TrialVehicle }) {
  const grass = <rect width={W} height={H} fill="#E7F0E1" />;
  const sky = (
    <>
      <rect width={W} height={H} fill="#EAF2FB" />
      <rect y="160" width={W} height="40" fill="#D3D9E2" />
    </>
  );
  switch (scene) {
    case "drone": {
      const route = droneRoute(vehicle);
      return (
        <>
          <rect width="280" height="280" fill="#E7F0E1" />
          <path d={route} fill="none" stroke={YELLOW} strokeWidth="22" strokeLinejoin="round" />
          <path d={route} fill="none" stroke={ROAD} strokeWidth="17" strokeLinejoin="round" />
          <path d={route} fill="none" stroke="#7CA4FF" strokeWidth="1.3" strokeDasharray="4 4" />
          {/* Left road: the narrow path (motorcycle) or a speed breaker (car). */}
          {vehicle === "bike" ? (
            <rect x="96" y="95" width="8" height="42" rx="2" fill="#B07A4A" />
          ) : (
            <g>
              {[121, 125, 129].map((y) => (
                <rect key={y} x="91" y={y} width="18" height="2" fill={YELLOW} />
              ))}
            </g>
          )}
          {/* Right road, top to bottom: zebra crossing, (motorcycle) speed breaker, light, ramp up, ramp down. */}
          {[90, 94, 98].map((y) => (
            <rect key={y} x="201" y={y} width="18" height="2.2" fill="#fff" />
          ))}
          {vehicle === "bike" &&
            [113, 117, 121].map((y) => <rect key={y} x="201" y={y} width="18" height="2" fill={YELLOW} />)}
          <rect x="201" y="127" width="18" height="1.6" fill="#fff" opacity=".8" />
          <rect x="187" y="122" width="2" height="14" fill="#6B7484" />
          <rect x="181" y="104" width="14" height="20" rx="3" fill="#1B2230" />
          <circle cx="188" cy="109" r="2.6" fill="#E5333F" opacity={light === "red" ? 1 : 0.2} />
          <circle cx="188" cy="114" r="2.6" fill="#F5B400" opacity={light === "amber" ? 1 : 0.2} />
          <circle cx="188" cy="119" r="2.6" fill="#22B060" opacity={light === "green" ? 1 : 0.2} />
          <rect x="201" y="150" width="18" height="28" fill="#AEB6C2" />
          <rect x="201" y="186" width="18" height="28" fill="#C9CED6" />
          <text x="210" y="171" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#fff">STOP</text>
          <text x="210" y="207" textAnchor="middle" fontSize="5.5" fontWeight="700" fill={ROAD}>STOP</text>
          {/* Cars finish in the garage box. */}
          {vehicle === "car" && (
            <>
              <rect x="198" y="234" width="24" height="34" fill="#D5DAE2" stroke={YELLOW} strokeWidth="2" />
              {[
                [198, 234],
                [222, 234],
                [198, 268],
                [222, 268],
              ].map(([x, y]) => (
                <path key={`${x}${y}`} d={`M${x - 3} ${y + 2} L${x} ${y - 4} L${x + 3} ${y + 2} Z`} fill="#F07B1D" />
              ))}
            </>
          )}
          {/* Start; finish flag for motorcycles at the end of the right road. */}
          <rect x="8" y="262" width="26" height="10" rx="2" fill="#fff" />
          <text x="21" y="269.5" textAnchor="middle" fontSize="6" fontWeight="700" fill={ROAD}>START</text>
          {vehicle === "bike" && (
            <g transform="translate(224 250)">
              <rect x="0" y="0" width="1.5" height="16" fill={ROAD} />
              {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={1.5 + c * 3} y={r * 3} width="3" height="3" fill={(r + c) % 2 ? "#fff" : ROAD} />))}
            </g>
          )}
        </>
      );
    }
    case "figure8":
      return (
        <>
          {grass}
          {/* The lane in (bottom) and out (top), with the upright eight over it; yellow edges, blue route line. */}
          <path d={EIGHT_ROUTE} fill="none" stroke={YELLOW} strokeWidth="36" strokeLinejoin="round" />
          <path d={EIGHT} fill="none" stroke={YELLOW} strokeWidth="36" strokeLinejoin="round" />
          <path d={EIGHT_ROUTE} fill="none" stroke={ROAD} strokeWidth="30" strokeLinejoin="round" />
          <path d={EIGHT_ROUTE} fill="none" stroke="#7CA4FF" strokeWidth="2" strokeDasharray="6 6" />
          <rect x="85" y="196" width="30" height="5" fill="#fff" />
          <text x="62" y="202" textAnchor="middle" fontSize="10" fontWeight="700" fill={ROAD}>START</text>
          <path d="M220 22 L220 8 M214 14 L220 7 L226 14" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "uturn":
      return (
        <>
          {grass}
          <path d="M110 210 V92 Q110 40 160 40 Q210 40 210 92 V210" fill="none" stroke={YELLOW} strokeWidth="44" />
          <path d="M110 210 V92 Q110 40 160 40 Q210 40 210 92 V210" fill="none" stroke={ROAD} strokeWidth="38" />
          <path d="M110 210 V92 Q110 40 160 40 Q210 40 210 92 V210" fill="none" stroke="#5B8CFF" strokeWidth="2" strokeDasharray="6 6" />
        </>
      );
    case "parking":
      return (
        <>
          {grass}
          <rect y="30" width={W} height="44" fill={ROAD} />
          <line x1="0" y1="52" x2={W} y2="52" stroke="#fff" strokeWidth="1.5" strokeDasharray="10 8" opacity=".6" />
          <rect x="138" y="86" width="44" height="100" fill="#D5DAE2" stroke={YELLOW} strokeWidth="3" />
          {[
            [136, 86],
            [184, 86],
            [136, 186],
            [184, 186],
          ].map(([x, y]) => (
            <path key={`${x}${y}`} d={`M${x - 6} ${y + 4} L${x} ${y - 8} L${x + 6} ${y + 4} Z`} fill="#F07B1D" stroke="#fff" strokeWidth="1" />
          ))}
          <text x="160" y="140" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7A8291">P</text>
        </>
      );
    case "plank":
      return (
        <>
          {sky}
          <rect x="70" y="146" width="180" height="14" rx="2" fill="#B07A4A" />
          <rect x="70" y="146" width="180" height="3" fill="#C99566" />
          <rect y="146" width="70" height="14" fill="#C9CED6" />
          <rect x="250" y="146" width="70" height="14" fill="#C9CED6" />
        </>
      );
    case "light":
      return (
        <>
          {sky}
          {/* Zebra crossing, seen side-on as stripes on the road, then the stop line before it. */}
          {[176, 186, 196, 206].map((x) => (
            <rect key={x} x={x} y="160" width="6" height="6" fill="#fff" />
          ))}
          <rect x="168" y="160" width="3" height="10" fill="#fff" />
          <rect x="236" y="70" width="4" height="90" fill="#6B7484" />
          <rect x="224" y="28" width="28" height="62" rx="7" fill="#1B2230" />
          <circle cx="238" cy="42" r="8" fill="#E5333F" opacity={light === "red" ? 1 : 0.15} />
          <circle cx="238" cy="59" r="8" fill="#F5B400" opacity={light === "amber" ? 1 : 0.15} />
          <circle cx="238" cy="76" r="8" fill="#22B060" opacity={light === "green" ? 1 : 0.15} />
        </>
      );
    case "breaker":
      return (
        <>
          {sky}
          <path d="M122 160 Q160 132 198 160 Z" fill={YELLOW} stroke="#1B2230" strokeWidth="1" />
          <path d="M134 154 L140 147 M152 146 L158 139 M170 146 L176 139 M186 152 L190 146" stroke="#1B2230" strokeWidth="3" />
        </>
      );
    case "ramp":
      return (
        <>
          {sky}
          <path d="M90 160 L150 110 L190 110 L250 160 Z" fill="#C9CED6" />
          {/* Stop lines halfway up and halfway down. */}
          <path d="M112 134 L120 144 M124 124 L132 134" stroke={YELLOW} strokeWidth="3" />
          <path d="M208 134 L200 144 M220 144 L212 154" stroke={YELLOW} strokeWidth="3" />
        </>
      );
    default:
      return null;
  }
}

/* ---------------- The player ---------------- */

/** Short station names for the drone map. */
const STOP_NAMES: Partial<Record<TrialScene, Localized>> = {
  figure8: o("आठ", "Eight"),
  plank: o("साँघुरो बाटो", "Narrow path"),
  parking: o("पार्किङ", "Parking"),
  light: o("बत्ती", "Light"),
  uturn: o("यू-टर्न", "U-turn"),
  breaker: o("ब्रेकर", "Breaker"),
  ramp: o("उकालो", "Ramp"),
};

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * `bare` drops the step list and controls (for previews). For the "drone" view, `onPick` is called
 * with a station when its label on the map is tapped.
 */
export function TrialPlayer({ scene, vehicle, locale, bare = false, onPick }: { scene: TrialView; vehicle: TrialVehicle; locale: Locale; bare?: boolean; onPick?: (scene: string) => void }) {
  const ne = locale === "ne";
  const c = useMemo(() => course(scene, vehicle), [scene, vehicle]);
  const total = c ? c.phases.reduce((a, p) => a + p.ms, 0) : 0;
  const [ms, setMs] = useState(c ? c.phases[0].ms + c.phases[1].ms * 0.6 : 0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [still, setStill] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce");
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    if (boxRef.current) io.observe(boxRef.current);
    return () => io.disconnect();
  }, []);

  // The clock: runs only while playing, on screen, and with motion allowed.
  useEffect(() => {
    if (!c || !playing || !visible || still) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      setMs((m) => (m + (now - last)) % total);
      last = now;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [c, playing, visible, still, total]);

  // Where we are in the course.
  let phase = c?.phases[0];
  let p = 0;
  if (c) {
    let t = ms;
    for (const ph of c.phases) {
      if (t <= ph.ms) {
        phase = ph;
        p = ph.ms ? t / ph.ms : 1;
        break;
      }
      t -= ph.ms;
    }
  }

  // The vehicle's position and heading along its path.
  const [pose, setPose] = useState({ x: 0, y: 0, a: 0 });
  useEffect(() => {
    if (!c || !phase) return;
    const el = pathRefs.current[phase.path];
    if (!el) return;
    const len = el.getTotalLength();
    const d = (phase.from + (phase.to - phase.from) * ease(p)) * len;
    const at = el.getPointAtLength(Math.min(len, Math.max(0, d)));
    const ahead = el.getPointAtLength(Math.min(len, d + 1));
    const behind = el.getPointAtLength(Math.max(0, d - 1));
    let a = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
    if (phase.reverse) a += 180;
    setPose({ x: at.x, y: at.y, a });
  }, [c, phase, p]);

  if (scene === "behaviour") return <Checklist vehicle={vehicle} locale={locale} bare={bare} />;
  if (!c || !phase) return null;

  const blinkOn = Math.floor(ms / 400) % 2 === 0;
  const [w, h] = c.box ?? [W, H];
  const drone = scene === "drone";
  // How far along its path the vehicle is now, for lighting up the station it's at.
  const along = phase.from + (phase.to - phase.from) * ease(p);
  const light = phase.light ?? "red";
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));

  return (
    <div ref={boxRef} className={bare ? "h-full" : undefined}>
      <div className={`relative ${bare ? "h-full" : drone ? "mx-auto aspect-square max-w-sm" : "aspect-[16/10]"} w-full overflow-hidden ${c.view === "top" ? "bg-[#E7F0E1]" : "bg-[#EAF2FB]"}`}>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden={drone ? undefined : true}>
          <Backdrop scene={scene} light={light} vehicle={vehicle} />
          {/* The paths, invisible, used to place the vehicle. */}
          {Object.entries(c.paths).map(([k, d]) => (
            <path
              key={k}
              d={d}
              fill="none"
              stroke="none"
              ref={(el) => {
                pathRefs.current[k] = el;
              }}
            />
          ))}
          <g transform={`translate(${pose.x} ${pose.y}) rotate(${c.view === "top" || pose.a !== 0 ? pose.a : 0})`}>
            {c.view === "top" ? <TopVehicle vehicle={scene === "parking" ? "car" : vehicle} signal={phase.signal} blinkOn={blinkOn} /> : <SideVehicle vehicle={scene === "plank" ? "bike" : vehicle} />}
          </g>
          {/* Drone view: each station's label; the one the vehicle is at lights up, and a tap opens it. */}
          {drone &&
            DRONE_STOPS[vehicle].map((d) => {
              const here = along >= d.from && along <= d.to;
              const label = tr(STOP_NAMES[d.scene] ?? o(d.scene, d.scene), locale);
              const wide = label.length * 5.4 + 14;
              return (
                <g
                  key={d.scene}
                  transform={`translate(${d.x} ${d.y})`}
                  onClick={() => onPick?.(d.scene)}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick?.(d.scene)}
                  className="cursor-pointer outline-none"
                >
                  <rect x={-wide / 2} y="-8" width={wide} height="16" rx="8" fill={here ? RED : "#fff"} stroke={here ? RED : "#CBD2DC"} strokeWidth="1" />
                  <text x="0" y="3.2" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={here ? "#fff" : ROAD}>{label}</text>
                </g>
              );
            })}
          {phase.stop && (
            <g transform={`translate(${pose.x} ${pose.y - (drone ? 20 : c.view === "top" ? 26 : 46)})`}>
              <rect x="-20" y="-9" width="40" height="18" rx="9" fill={RED} />
              <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">STOP</text>
            </g>
          )}
        </svg>
        {!bare && !still && (
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? (ne ? "रोक्नुहोस्" : "Pause") : ne ? "चलाउनुहोस्" : "Play"}
            className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-card backdrop-blur hover:bg-white"
          >
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      {!bare && !drone && (
        <ol className="space-y-1.5 px-5 pt-4" aria-label={ne ? "चरणहरू" : "Steps"}>
          {c.steps.map((s, i) => {
            const now = !still && i === phase!.step;
            const done = !still && i < phase!.step;
            return (
              <li
                key={i}
                className={`flex items-start gap-3 rounded-xl px-2.5 py-2 transition-colors duration-300 ${now ? "bg-brand-tint" : ""}`}
                aria-current={now ? "step" : undefined}
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-300 ${
                    now ? "bg-brand text-white" : done ? "bg-ok text-white" : "bg-paper-warm text-ink-soft"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : n(i + 1)}
                </span>
                <span className={`text-[0.98rem] leading-snug transition-colors duration-300 ${now ? "font-semibold text-ink" : "text-ink-soft"}`}>{tr(s, locale)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** Before setting off: the checks, ticked one after another (or all shown when motion is off). */
function Checklist({ vehicle, locale, bare }: { vehicle: TrialVehicle; locale: Locale; bare: boolean }) {
  const items =
    vehicle === "bike"
      ? [o("हेल्मेट लगाएर पट्टा लक", "Helmet on, strap locked"), o("ऐना मिलाउने", "Mirrors set"), o("ब्रेक जाँच", "Brakes checked")]
      : [o("सिटबेल्ट लगाउने", "Seatbelt on"), o("सिट मिलाउने", "Seat set"), o("ऐना मिलाउने", "Mirrors set")];
  return (
    <div className={`grid ${bare ? "h-full" : "aspect-[16/10]"} place-items-center bg-[#EAF2FB] px-6`}>
      <ul className="scene w-full max-w-[16rem] space-y-2.5">
        {items.map((c, i) => (
          <li key={c.en} className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5 shadow-card">
            <span className="trial-tick grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ok text-white" style={{ animationDelay: `${i * 0.8}s` }}>
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="font-semibold text-ink">{tr(c, locale)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
