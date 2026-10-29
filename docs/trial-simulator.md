# 3D driving trial simulator

A browser 3D simulation of the Nepal driving licence trial (ट्रायल), built with three.js. It lives on the
licence practice page: `/ne/guide/driving-licence/practice` → **३D ट्रायल — हेर्नुहोस् वा आफैँ चलाउनुहोस्**.

## Running it

```bash
npm install        # three@0.170.0 and @types/three are in package.json
npm run dev        # then open http://localhost:3000/ne/guide/driving-licence/practice
npm test           # includes src/lib/trial/course.test.ts (course geometry checks)
```

The simulator is loaded with `next/dynamic` (`ssr: false`), so three.js is only downloaded when someone
opens it. Nothing else on the page changes.

## What it does

| Feature | Where |
| --- | --- |
| Course data (both layouts, sizes, stops, Nepali lines, stations) | `src/lib/trial/course.ts` |
| Course geometry tests | `src/lib/trial/course.test.ts` |
| 3D ground: lanes, edge lines, stop lines, zebra, traffic light, ramp, breaker, plank, garage bay, signs, setting | `src/components/tools/trial3d/world.ts` (TrialCourse) |
| Car, motorcycle, scooter models (steering wheels, spinning wheels, lean, brake lights, indicators, rider) | `src/components/tools/trial3d/vehicles.ts` |
| Demo driver, practice driver, camera controller | `src/components/tools/trial3d/controller.ts` (VehicleController, PracticeMode, CameraController) |
| Engine, brake, indicator and ambience sound; Nepali voice | `src/components/tools/trial3d/audio.ts` (AudioControls, NepaliVoiceGuide) |
| Screen: vehicle and mode, HUD, subtitles, playback, cameras, touch controls, video recording | `src/components/tools/trial3d/TrialSimulator.tsx` (TrialHUD) |

- **Vehicles:** car / jeep (car layout), motorcycle and scooter (two-wheeler layout).
- **Watch mode:** the vehicle drives the whole course with a smooth speed profile. Acceleration and braking are rate-limited, so the vehicle never jumps. It:
  - slows for the eight and the breaker
  - stops exactly on each stop line
  - waits at the light until it turns green
  - stops halfway up and halfway down the ramp
  - (car) stops past the bay and reverses into it
- **How the vehicles move:**
  - Two-wheelers lean into turns with `lean = atan(v²·κ / g)`.
  - The car's front wheels steer with `atan(κ · wheelbase)`.
  - Vehicles pitch on the ramp, and a rider's left foot goes down at stops.
- **Cameras:** पछाडिबाट (follow), पूरा मैदान (overview, drag to turn), माथिबाट (top-down), छेउबाट (side), चालकको आँखा (driver's eye; it tilts with the lean on two-wheelers).
- **Playback:** play/pause, restart, 0.5× / 1× / 2×. The motion is sub-stepped, so 2× stays smooth.
- **Nepali subtitles and voice:** each instruction is shown as a subtitle and spoken.
  - The voice is the site's own Nepali voice (Piper, `src/lib/assist/nepaliVoice.ts`), if the person has already downloaded it in the helper chat.
  - Otherwise it uses the device's Nepali (or Hindi) speech voice.
  - Otherwise there are subtitles only.
  - Sound, voice and subtitles each have their own on/off button.
- **Sound:** made with Web Audio, with no files to download:
  - an engine note that follows speed and throttle
  - a brake squeal on hard stops
  - the indicator tick
  - soft wind and birds
- **Practice mode (आफैँ चलाउनुहोस्):** drive with ↑ ↓ ← → or W A S D, or the on-screen buttons on phones.
  - A bicycle steering model moves the vehicle.
  - The distance to the route centre line is checked against the lane's half-width, minus the vehicle's half-width. It notes:
    - each time a yellow line is touched
    - each time the vehicle leaves the lane
    - (two-wheelers) a stop inside the eight (foot down)
    - stopping or not stopping at the ramp stop lines
    - going past the light on red
  - If you go far off the route, a button puts you back at the furthest point reached.
  - It is labelled **practice feedback only — not the office's official result**. No pass/fail is given.
- **Video:** the "भिडियो" button records the 3D view (with engine sound) and downloads it.
  - It is MP4 where the browser supports MP4 recording (recent Chrome and Edge, Safari), otherwise WebM.
  - The spoken voice is not in the recording, because the browser's speech can't be captured. Subtitles are on screen only, not burned in.

## Course: what's from the official map and what's assumed

**From the official trial map (कार, जिपको / मोटरसाइकल, स्कुटरको ट्रायल नक्सा):**
- the upright figure of eight at the start
- the left road with the speed breaker (car) or the narrow path (two-wheelers)
- the U-turn at the top
- the right road with the zebra crossing, the traffic light and the ramp (up, then down)
- the garage (L-back) parking at the end for cars
- the order of stations for each vehicle

**Assumed (the map has no measurements; every value is in `COURSE_SIZES` in `course.ts`, easy to change):**

| Item | Car | Two-wheeler |
| --- | --- | --- |
| Eight loop radius (centre line) | 5.5 m | 4 m |
| Eight lane width | 3.2 m | 1.9 m |
| Road width | 3.6 m | 2.6 m |
| U-turn radius | 9 m | 8 m |
| Narrow path / plank | — | 0.9 m wide, 8 cm high |
| Ramp | 8 m up, 3 m flat, 8 m down, 1.2 m high | same |
| Speed breaker | 0.6 m wide, 9 cm high | same |
| Garage bay | 2.6 m × 5.4 m, reversed into from the right road | — |

Other assumptions:
- Exact distances between stations.
- The side of the road the bay is on.
- Where the stop line sits relative to the zebra crossing.
- That the light turns red as the vehicle approaches and green after about 3 s of waiting. Real offices run their own timing.

Offices differ: some grounds are laid out differently, and sizes vary. Change `COURSE_SIZES` and `buildCourse()` to match a particular office.

## Rules and scoring

- The instructions spoken in watch mode are good practice taken from the station descriptions on the existing trial page (`src/lib/content/trial.ts`):
  - don't touch the lines
  - no foot down in the eight
  - indicate at the U-turn
  - stop at the stop line and wait for green
  - don't roll back on the ramp
- The points on that page (100 total, 70 to pass) come from driving-school descriptions, **not an official DoTM document**.
- The simulator therefore gives no score and no pass/fail. Practice mode only notes events.

## Limitations

- **Models:** vehicles and the ground are built from simple shapes in code, not detailed 3D models (no Blender assets). They are to scale, but they are not photorealistic.
- **Physics:**
  - Watch mode follows the route exactly, using the speed profile and limited acceleration.
  - Practice mode uses a kinematic bicycle model with no tyre slip, clutch or stalling.
  - Two-wheelers can't fall over or reverse.
- **Feedback:** line-touch detection uses the vehicle's half-width, not each tyre. On the car's reverse into the bay, the route overlaps the road beside it, so feedback there is approximate.
- **Video:** MP4 export is in-browser screen recording. There is no offline rendering pipeline, and the voice is not included.
- **Voice:**
  - The device voice depends on the phone or computer. Many have no Nepali voice, and Hindi is used as a fallback where present.
  - The site's Piper Nepali voice (77 MB, downloaded once from the helper chat) sounds best.
- **Hardware:** a WebGL-capable browser is needed. Very old phones may run slowly; shadows can be turned off in `TrialSimulator.tsx` (`renderer.shadowMap.enabled`).
