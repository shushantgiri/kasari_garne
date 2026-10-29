import type { IconName } from "@/lib/content/types";
import { ServiceIcon } from "@/components/ui/ServiceIcon";

/**
 * A short, wide looping illustration for the top of a guide: traffic driving past the Himalayas,
 * a jet flying over a passport that gets stamped, an ID card being scanned.
 * Pure SVG + CSS (see "Guide header scenes" in globals.css), so it costs no JavaScript.
 * Every part has a sensible still pose, which is what people who turn motion off see.
 * Only one scene is on a page, so the gradient ids can be fixed.
 */
export function ServiceScene({ icon, className = "w-full" }: { icon: IconName; className?: string }) {
  const scene = SCENES[icon as keyof typeof SCENES];
  return (
    <div
      className={`scene relative aspect-[4/1] overflow-hidden rounded-3xl bg-sky-tint shadow-[0_16px_36px_-24px_rgba(27,34,48,0.5)] ring-1 ring-black/[0.06] ${className}`}
      aria-hidden="true"
    >
      {scene ? (
        // Scenes drawn 240 wide sit in the middle of the 480-wide strip.
        <svg viewBox={scene.wide ? "0 0 480 120" : "-120 0 480 120"} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <scene.Draw />
        </svg>
      ) : (
        <div className="grid h-full w-full place-items-center">
          <span className="scene-ring absolute h-14 w-14 rounded-full bg-brand/15" />
          <span className="scene-ring scene-ring-late absolute h-14 w-14 rounded-full bg-brand/15" />
          <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white">
            <ServiceIcon name={icon} className="h-7 w-7" />
          </span>
        </div>
      )}
    </div>
  );
}

const SCENES = {
  car: { Draw: RoadScene, wide: true },
  passport: { Draw: PassportScene, wide: false },
  idcard: { Draw: IdScene, wide: false },
};

/** Soft shadow under an object. */
function Blur() {
  return (
    <filter id="sc-blur" x="-20%" y="-150%" width="140%" height="400%">
      <feGaussianBlur stdDeviation="2.2" />
    </filter>
  );
}

/** A white cloud; it drifts slowly across. */
function Cloud({ x, y, s = 1, slow }: { x: number; y: number; s?: number; slow?: boolean }) {
  return (
    <g className={slow ? "scene-cloud scene-cloud-slow" : "scene-cloud"}>
      <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity=".92">
        <ellipse cx="0" cy="0" rx="13" ry="5.5" />
        <ellipse cx="7" cy="-3.5" rx="8" ry="6" />
        <ellipse cx="-6" cy="-2" rx="6.5" ry="4.5" />
      </g>
    </g>
  );
}

/* ---------------- Road: every vehicle drives across ---------------- */

/** A wheel whose centre is at (cx, cy): tyre, silver rim, spinning spokes. */
function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#15191F" />
      <circle cx={cx} cy={cy} r={r * 0.56} fill="url(#sc-rim)" />
      <g className="scene-wheel">
        {[0, 72, 144, 216, 288].map((a) => (
          <line
            key={a}
            x1={cx}
            y1={cy}
            x2={cx + r * 0.5 * Math.cos((a * Math.PI) / 180)}
            y2={cy + r * 0.5 * Math.sin((a * Math.PI) / 180)}
            stroke="#5B6474"
            strokeWidth=".6"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.14} fill="#3A4150" />
    </g>
  );
}

/** Dark wheel arch, so wheels sit inside the body instead of being stuck on. */
const Arch = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => <circle cx={cx} cy={cy} r={r + 1.1} fill="#000" opacity=".3" />;

/** Soft shadow on the road under a vehicle. */
const Shadow = ({ cx, w }: { cx: number; w: number }) => <ellipse cx={cx} cy="0.6" rx={w / 2} ry="1.8" fill="#000" opacity=".28" />;

/** Headlight with a faint glow. */
const Headlight = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r="3.2" fill="#FFE08A" opacity=".3" />
    <rect x={x - 1.4} y={y - 1} width="2.6" height="2" rx="1" fill="#FFF3C4" />
  </g>
);

/* Each vehicle faces right, drawn with its wheels resting on y = 0. */

function Car() {
  return (
    <g>
      <Shadow cx={23} w={50} />
      <path d="M0 -6 Q0 -11 5 -12 L12 -13 L18 -20 Q20 -22 24 -22 L33 -22 Q36 -22 38 -19 L42 -13 Q46 -12 46 -8 L46 -4 Q46 -3 45 -3 L1 -3 Q0 -3 0 -4 Z" fill="url(#sc-red)" />
      <path d="M0.5 -6.5 L45.6 -6.5 L46 -4 Q46 -3 45 -3 L1 -3 Q0 -3 0 -4 Z" fill="#000" opacity=".16" />
      <path d="M17 -13.5 L21.5 -19.5 L28 -19.5 L28 -13.5 Z M30 -19.5 L34 -19.5 Q35.5 -19.5 36.5 -18 L39.5 -13.5 L30 -13.5 Z" fill="url(#sc-glass)" />
      <path d="M22 -15 L25 -19 M33 -15 L35.5 -18.5" stroke="#fff" strokeWidth=".7" opacity=".6" />
      <path d="M5 -11.6 Q24 -13.8 43 -11.6" fill="none" stroke="#fff" strokeWidth=".7" opacity=".45" />
      <line x1="29" y1="-13" x2="29" y2="-5" stroke="#000" strokeWidth=".5" opacity=".2" />
      <rect x="31" y="-11" width="3.4" height=".9" rx=".45" fill="#000" opacity=".25" />
      <path d="M38.5 -14.5 L41.2 -15.2 L41.6 -13.2 L39 -13 Z" fill="#9C1C24" />
      <Headlight x={44.6} y={-9} />
      <rect x="0" y="-10" width="1.8" height="2.6" rx=".9" fill="#FF6B6F" />
      <Arch cx={11} cy={-3} r={4.6} />
      <Arch cx={36} cy={-3} r={4.6} />
      <Wheel cx={11} cy={-3} r={4.6} />
      <Wheel cx={36} cy={-3} r={4.6} />
    </g>
  );
}

function Bus() {
  return (
    <g>
      <Shadow cx={42} w={88} />
      <rect x="0" y="-32" width="84" height="27" rx="5" fill="url(#sc-blue)" />
      <rect x="2" y="-31.5" width="80" height="2" rx="1" fill="#fff" opacity=".25" />
      {[5, 18, 31, 44].map((x) => (
        <rect key={x} x={x} y="-28" width="10.5" height="8.5" rx="1.5" fill="url(#sc-glass)" />
      ))}
      <rect x="58" y="-28" width="7" height="21" rx="1.2" fill="url(#sc-glass)" opacity=".9" />
      <line x1="61.5" y1="-28" x2="61.5" y2="-7" stroke="#2453A8" strokeWidth=".6" />
      <rect x="70" y="-28" width="11.5" height="13" rx="2" fill="url(#sc-glass)" />
      <path d="M8 -26.5 L11 -21 M47 -26.5 L50 -21 M73 -26.5 L77 -17" stroke="#fff" strokeWidth=".7" opacity=".55" />
      <rect x="0" y="-15" width="57" height="3" fill="#F6C66B" />
      <rect x="0" y="-8" width="84" height="3" rx="1" fill="#000" opacity=".2" />
      <Headlight x={82.4} y={-10} />
      <rect x="0" y="-12" width="1.6" height="3" rx=".8" fill="#FF6B6F" />
      <Arch cx={16} cy={-4.5} r={5.4} />
      <Arch cx={68} cy={-4.5} r={5.4} />
      <Wheel cx={16} cy={-4.5} r={5.4} />
      <Wheel cx={68} cy={-4.5} r={5.4} />
    </g>
  );
}

/** A Nepali goods truck: green cab, painted cargo box. */
function Truck() {
  return (
    <g>
      <Shadow cx={38} w={80} />
      <rect x="0" y="-32" width="52" height="25" rx="2.5" fill="url(#sc-orange)" />
      <rect x="0" y="-28" width="52" height="2.6" fill="#D63A44" />
      <rect x="0" y="-15" width="52" height="2.6" fill="#1E7A4C" />
      {[10, 26, 42].map((x) => (
        <circle key={x} cx={x} cy="-21" r="2.4" fill="#fff" opacity=".55" />
      ))}
      <path d="M54 -7 L54 -24 Q54 -26 56 -26 L66 -26 Q69 -26 71 -22 L75 -15 L75 -7 Z" fill="url(#sc-green)" />
      <path d="M58 -23 L65 -23 L69 -16 L58 -16 Z" fill="url(#sc-glass)" />
      <path d="M61 -22 L63.5 -17" stroke="#fff" strokeWidth=".7" opacity=".6" />
      <rect x="0" y="-8.5" width="75" height="3" fill="#1B2230" />
      <Headlight x={73.6} y={-11} />
      <Arch cx={12} cy={-4} r={4.6} />
      <Arch cx={64} cy={-4} r={4.6} />
      <Wheel cx={12} cy={-4} r={4.6} />
      <Wheel cx={23.5} cy={-4} r={4.6} />
      <Wheel cx={64} cy={-4} r={4.6} />
    </g>
  );
}

/** A motorbike with a seated rider leaning slightly forward. */
function Motorbike() {
  return (
    <g>
      <Shadow cx={18} w={34} />
      {/* Exhaust, engine, frame */}
      <path d="M13 -7 L2 -8" stroke="#A8B0BC" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="13" y="-11" width="8" height="5" rx="1.2" fill="#4A5363" />
      <path d="M6 -4.5 L13 -9 M21 -9 L30 -4.5" stroke="#2B3242" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 -4.5 L26.5 -16.5" stroke="#3A4150" strokeWidth="1.5" strokeLinecap="round" />
      {/* Body: seat, tank, front mudguard */}
      <path d="M6 -11 Q6 -14 9 -14.5 L17 -15 L17 -12 L8 -10.5 Z" fill="#1B2230" />
      <path d="M16.5 -15 Q18 -18 23 -17 L25.5 -13 L17 -11.5 Z" fill="url(#sc-red)" />
      <path d="M26.5 -8.5 Q30 -10.5 33.5 -8" fill="none" stroke="#D63A44" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M26.5 -16.5 L24 -19.5" stroke="#2B3242" strokeWidth="1.4" strokeLinecap="round" />
      <Headlight x={28.3} y={-14} />
      {/* Rider: leg, body, arm, helmet */}
      <path d="M12 -15 L19.5 -12.5 L19 -7.5" fill="none" stroke="#2B3242" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 -15.5 L16 -25.5" stroke="url(#sc-jacket)" strokeWidth="4.6" strokeLinecap="round" />
      <path d="M16 -24 L23.5 -19.5" stroke="#2453A8" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="17.5" cy="-29" r="3.9" fill="url(#sc-helmet)" />
      <path d="M18.5 -30 L21.6 -30 Q21.8 -27.8 20.2 -26.8 L18.5 -26.8 Z" fill="#1B2230" opacity=".75" />
      <Wheel cx={6} cy={-4.5} r={4.5} />
      <Wheel cx={30} cy={-4.5} r={4.5} />
    </g>
  );
}

/**
 * One vehicle crossing the road from left to right. `x` is where it stands when motion is off;
 * vehicles in the same lane share a speed and start half a lap apart, so they never collide.
 */
function Drive({ x, y, scale = 1, secs, offset, children }: { x: number; y: number; scale?: number; secs: number; offset: number; children: React.ReactNode }) {
  return (
    <g
      className="scene-drive"
      style={{ "--x": x, animationDuration: `${secs}s`, animationDelay: `${-offset * secs}s` } as React.CSSProperties}
    >
      <g transform={`translate(${x} ${y}) scale(${scale})`}>{children}</g>
    </g>
  );
}

const grad = (id: string, from: string, to: string, horizontal?: boolean) => (
  <linearGradient id={id} x1="0" y1="0" x2={horizontal ? "1" : "0"} y2={horizontal ? "0" : "1"}>
    <stop offset="0" stopColor={from} />
    <stop offset="1" stopColor={to} />
  </linearGradient>
);

function RoadScene() {
  return (
    <>
      <defs>
        {grad("sc-sky", "#CBDDF3", "#FBF0E4")}
        {grad("sc-far", "#B3C1D7", "#DCE3EE")}
        {grad("sc-mid", "#8FA2BE", "#B9C6D8")}
        {grad("sc-hill", "#7FB08C", "#5E9470")}
        {grad("sc-road", "#323A4B", "#1C222D")}
        {grad("sc-red", "#E6505A", "#A91F28")}
        {grad("sc-blue", "#4580DE", "#2453A8")}
        {grad("sc-orange", "#F8BD55", "#E0871C")}
        {grad("sc-green", "#2F9462", "#1A6440")}
        {grad("sc-jacket", "#3A6AD0", "#1F3F8F")}
        {grad("sc-glass", "#EEF4FB", "#94AACA", true)}
        <radialGradient id="sc-rim">
          <stop offset="0" stopColor="#F4F5F7" />
          <stop offset="1" stopColor="#98A1AE" />
        </radialGradient>
        <radialGradient id="sc-helmet" cx=".35" cy=".35">
          <stop offset="0" stopColor="#FFE6A8" />
          <stop offset="1" stopColor="#E8A93A" />
        </radialGradient>
        <radialGradient id="sc-sun">
          <stop offset="0" stopColor="#FFE2A6" stopOpacity=".9" />
          <stop offset="1" stopColor="#FFE2A6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="480" height="120" fill="url(#sc-sky)" />
      <circle cx="404" cy="32" r="26" fill="url(#sc-sun)" />
      <circle cx="404" cy="32" r="8.5" fill="#FFD27A" />
      <Cloud x={90} y={22} s={0.9} slow />
      <Cloud x={280} y={16} s={0.75} />

      {/* The Himalayas, hills and street lamps stay still; only the traffic moves. */}
      <path d="M0 84 L30 58 L46 66 L80 34 L98 48 L112 42 L146 70 L170 56 L210 30 L226 44 L240 38 L282 66 L306 52 L346 28 L362 40 L376 34 L414 64 L440 52 L480 78 L480 84 Z" fill="url(#sc-far)" />
      <path d="M72 41 L80 34 L88 41 L84 40 L80 43 L76 40 Z M202 37 L210 30 L218 37 L214 36 L210 39 L206 36 Z M338 35 L346 28 L354 35 L350 34 L346 37 L342 34 Z" fill="#fff" />
      <path d="M0 86 L40 66 L60 72 L100 52 L130 72 L160 62 L196 80 L232 56 L262 70 L292 62 L330 78 L370 56 L400 68 L430 62 L480 82 V86 Z" fill="url(#sc-mid)" />
      <path d="M0 84 Q40 72 80 78 T160 76 T240 79 T320 74 T400 78 T480 81 V86 H0 Z" fill="url(#sc-hill)" />
      {[36, 122, 214, 300, 388, 452].map((x, i) => (
        <path key={x} d={`M${x - 3.5} ${80 - (i % 2)} L${x} ${70 - (i % 3)} L${x + 3.5} ${80 - (i % 2)} Z`} fill="#3F6E50" />
      ))}
      {[70, 190, 310, 430].map((x) => (
        <g key={x}>
          <line x1={x} y1="84" x2={x} y2="60" stroke="#6B7484" strokeWidth="1.3" />
          <path d={`M${x} 60.5 Q${x + 4} 58.5 ${x + 8} 60.5`} fill="none" stroke="#6B7484" strokeWidth="1.2" />
          <circle cx={x + 8} cy="61.5" r="1.4" fill="#FFE2A6" />
        </g>
      ))}

      {/* The road: a far lane and a near lane. */}
      <rect x="0" y="84" width="480" height="36" fill="url(#sc-road)" />
      <rect x="0" y="83" width="480" height="2" fill="#D5D9E0" />
      <line x1="0" y1="102.5" x2="480" y2="102.5" stroke="#fff" strokeWidth="1.4" strokeDasharray="14 12" opacity=".6" />

      {/* Far lane: smaller, for depth. */}
      <Drive x={70} y={98} scale={0.78} secs={20} offset={0}><Bus /></Drive>
      <Drive x={300} y={98} scale={0.78} secs={20} offset={0.5}><Truck /></Drive>
      {/* Near lane. */}
      <Drive x={200} y={116} secs={12} offset={0.2}><Car /></Drive>
      <Drive x={400} y={116} secs={12} offset={0.7}><Motorbike /></Drive>
    </>
  );
}

/* ---------------- Passport ---------------- */

function PassportScene() {
  // Starts and ends well outside the strip, so the jet never pops in or out in view.
  const flight = "M-150 56 C -30 0, 230 -8, 390 30";
  return (
    <>
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D3E2F6" />
          <stop offset="1" stopColor="#F7F9FC" />
        </linearGradient>
        <linearGradient id="sc-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B02A34" />
          <stop offset="1" stopColor="#63111A" />
        </linearGradient>
        <linearGradient id="sc-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBE3A0" />
          <stop offset=".5" stopColor="#E0B456" />
          <stop offset="1" stopColor="#B98A2E" />
        </linearGradient>
        <linearGradient id="sc-trail" gradientUnits="userSpaceOnUse" x1="-64" y1="0" x2="-6" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity=".95" />
        </linearGradient>
        <Blur />
      </defs>

      <rect x="-120" width="480" height="120" fill="url(#sc-sky)" />
      {/* A faint globe, for "travel". */}
      <g fill="none" stroke="#1F3F8F" strokeWidth=".8" opacity=".12">
        <circle cx="236" cy="124" r="62" />
        <ellipse cx="236" cy="124" rx="28" ry="62" />
        <ellipse cx="236" cy="124" rx="48" ry="62" />
        <path d="M174 108 H298 M178 88 H294 M190 70 H282" />
      </g>
      <Cloud x={-40} y={30} s={0.85} slow />
      <Cloud x={300} y={50} s={0.9} />

      {/* The jet's route, dotted, and the jet with its vapour trails flying along it. */}
      <path className="scene-route" d={flight} fill="none" stroke="#1F3F8F" strokeWidth="1.2" strokeDasharray="2 6" strokeLinecap="round" opacity=".3" />
      <g className="scene-plane" style={{ offsetPath: `path("${flight}")` }}>
        <path d="M-6 -6.5 L-64 -6.5 M-6 6.5 L-64 6.5" stroke="url(#sc-trail)" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M16 0 C16 -1.6 14 -2.2 11 -2.2 L3 -2.2 L-6 -13 L-9.5 -13 L-4.5 -2.2 L-11 -2.2 L-14.5 -6.5 L-17 -6.5 L-15 -0.8 L-15 0.8 L-17 6.5 L-14.5 6.5 L-11 2.2 L-4.5 2.2 L-9.5 13 L-6 13 L3 2.2 L11 2.2 C14 2.2 16 1.6 16 0 Z"
          fill="#2A52B0"
        />
      </g>

      <ellipse cx="124" cy="110" rx="40" ry="3.4" fill="#1B2230" opacity=".3" filter="url(#sc-blur)" />
      <g className="scene-float">
        {/* A boarding pass tucked behind. */}
        <g transform="rotate(10 156 66)">
          <rect x="120" y="46" width="72" height="38" rx="5" fill="#fff" stroke="#E2E6EE" strokeWidth=".8" />
          <path d="M120 51 Q120 46 125 46 L187 46 Q192 46 192 51 L192 55 L120 55 Z" fill="#1F3F8F" />
          <line x1="170" y1="55" x2="170" y2="84" stroke="#C9D0DC" strokeWidth=".8" strokeDasharray="2 2" />
          <rect x="126" y="60" width="22" height="3" rx="1.5" fill="#C9D0DC" />
          <rect x="126" y="67" width="34" height="3" rx="1.5" fill="#C9D0DC" />
          <rect x="126" y="74" width="16" height="3" rx="1.5" fill="#B4232C" opacity=".4" />
          <path d="M175 62 V78 M177.5 62 V78 M179 62 V78 M182 62 V78 M184 62 V78 M186.5 62 V78" stroke="#1B2230" strokeWidth="1" opacity=".55" />
        </g>
        {/* The passport: back cover, page edges, then the front cover with gold foil. */}
        <g transform="rotate(-8 112 72)">
          <rect x="89" y="37" width="54" height="70" rx="6" fill="#4A0C12" />
          <rect x="88.5" y="36" width="53" height="69" rx="5" fill="#F1E8D8" />
          <rect x="86" y="34" width="54" height="70" rx="6" fill="url(#sc-cover)" />
          <rect x="86" y="34" width="6" height="70" rx="3" fill="#000" opacity=".2" />
          <rect x="101" y="42" width="26" height="2.6" rx="1.3" fill="url(#sc-gold)" />
          <circle cx="114" cy="63" r="11" fill="none" stroke="url(#sc-gold)" strokeWidth="1.6" />
          <path d="M106.5 67 L111.5 59 L114 62.5 L116.5 59.5 L121.5 67 Z" fill="url(#sc-gold)" />
          <circle cx="117.5" cy="57.5" r="1.6" fill="url(#sc-gold)" />
          <rect x="99" y="80" width="30" height="2.8" rx="1.4" fill="url(#sc-gold)" />
          <rect x="108" y="88" width="12" height="8" rx="1.6" fill="none" stroke="url(#sc-gold)" strokeWidth="1" />
          <circle cx="114" cy="92" r="1.9" fill="none" stroke="url(#sc-gold)" strokeWidth="1" />
        </g>
      </g>

      {/* The approval stamp thumps down. */}
      <g className="scene-stamp">
        <g transform="rotate(-14 152 90)">
          <circle cx="152" cy="90" r="13" fill="#F1FAF4" fillOpacity=".92" stroke="#1E7A4C" strokeWidth="2" />
          <circle cx="152" cy="90" r="9.8" fill="none" stroke="#1E7A4C" strokeWidth=".7" strokeDasharray="1.6 1.6" />
          <path d="M146.5 90 L150.5 94 L158 85.5" fill="none" stroke="#1E7A4C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </>
  );
}

/* ---------------- National ID ---------------- */

function IdScene() {
  return (
    <>
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#DCE7F7" />
          <stop offset="1" stopColor="#F8FAFD" />
        </linearGradient>
        <linearGradient id="sc-band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2F5BC0" />
          <stop offset="1" stopColor="#1F3F8F" />
        </linearGradient>
        <linearGradient id="sc-holo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F9A8D4" />
          <stop offset=".35" stopColor="#A5B4FC" />
          <stop offset=".7" stopColor="#99F6E4" />
          <stop offset="1" stopColor="#FDE68A" />
        </linearGradient>
        <linearGradient id="sc-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sc-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E7A4C" stopOpacity="0" />
          <stop offset=".5" stopColor="#1E7A4C" stopOpacity=".22" />
          <stop offset="1" stopColor="#1E7A4C" stopOpacity="0" />
        </linearGradient>
        <clipPath id="sc-cardclip">
          <rect x="50" y="18" width="140" height="86" rx="9" />
        </clipPath>
        <Blur />
      </defs>

      <rect x="-120" width="480" height="120" fill="url(#sc-sky)" />
      <Cloud x={-50} y={26} s={0.75} slow />
      <Cloud x={300} y={84} s={0.65} />

      <ellipse cx="120" cy="109" rx="62" ry="3.6" fill="#1B2230" opacity=".25" filter="url(#sc-blur)" />
      <g className="scene-float">
        <rect x="50" y="18" width="140" height="86" rx="9" fill="#fff" stroke="#D8DFEA" strokeWidth="1" />
        <g clipPath="url(#sc-cardclip)">
          <rect x="50" y="18" width="140" height="17" fill="url(#sc-band)" />
          {/* Nepal's flag, small, then the card's title. */}
          <path d="M58 21 L58 33 L65.5 33 L61 27.5 L65.5 27.5 Z" fill="#DC143C" stroke="#fff" strokeWidth=".7" strokeLinejoin="round" />
          <rect x="71" y="23.5" width="44" height="3" rx="1.5" fill="#fff" opacity=".9" />
          <rect x="71" y="29" width="28" height="2.2" rx="1.1" fill="#fff" opacity=".55" />
          {/* Photo */}
          <rect x="60" y="42" width="34" height="44" rx="5" fill="#DDE6F4" />
          <circle cx="77" cy="58" r="8" fill="#6E84AE" />
          <path d="M63 86 Q77 66 91 86 Z" fill="#6E84AE" />
          {/* Chip */}
          <rect x="102" y="42" width="16" height="12" rx="2.5" fill="#E2BE66" />
          <path d="M102 48 H118 M110 42 V54 M106 42 V48 M114 48 V54" stroke="#A8822E" strokeWidth=".6" />
          {/* Details */}
          <rect x="124" y="44" width="54" height="4" rx="2" fill="#D3DAE6" />
          <rect x="124" y="51" width="38" height="4" rx="2" fill="#D3DAE6" />
          <rect x="102" y="61" width="76" height="4" rx="2" fill="#D3DAE6" />
          <rect x="102" y="69" width="58" height="4" rx="2" fill="#D3DAE6" />
          <rect x="102" y="77" width="40" height="4" rx="2" fill="#B4232C" opacity=".3" />
          <circle cx="176" cy="89" r="8" fill="url(#sc-holo)" opacity=".75" />
          {/* The scanner's light, then a glossy sheen, sweeping over the card. */}
          <g className="scene-scan">
            <rect x="46" y="54" width="148" height="12" fill="url(#sc-scan)" />
            <rect x="46" y="59.2" width="148" height="1.6" rx=".8" fill="#1E7A4C" opacity=".8" />
          </g>
          <path className="scene-sheen" d="M42 18 L58 18 L36 104 L20 104 Z" fill="url(#sc-shine)" />
        </g>
      </g>

      {/* Approved. */}
      <g className="scene-pop">
        <circle cx="188" cy="20" r="12" fill="#1E7A4C" stroke="#fff" strokeWidth="2" />
        <path d="M182.5 20 L186.5 24 L193.5 16.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  );
}
