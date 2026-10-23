import type { SignName } from "@/lib/content/licenceQuiz";

/**
 * Road signs drawn as simple SVG, in the usual shapes and colours: red circles forbid,
 * blue circles instruct, red triangles warn, the octagon stops, the upside-down triangle gives way.
 */
const RED = "#C8102E";
const BLUE = "#1F5BB5";
const INK = "#1B2230";

export function RoadSign({ name, className = "h-32 w-32" }: { name: SignName; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {SIGNS[name]}
    </svg>
  );
}

const ring = (children: React.ReactNode) => (
  <>
    <circle cx="50" cy="50" r="46" fill="#fff" stroke={RED} strokeWidth="9" />
    {children}
  </>
);

const triangle = (children: React.ReactNode) => (
  <>
    <path d="M50 8 L94 86 Q95 90 91 90 L9 90 Q5 90 6 86 Z" fill="#fff" stroke={RED} strokeWidth="7" strokeLinejoin="round" />
    {children}
  </>
);

const car = (x: number, fill: string) => (
  <g transform={`translate(${x} 0)`}>
    <path d="M0 56 L3 46 Q4 43 8 43 L22 43 Q26 43 27 46 L30 56 Z" fill={fill} />
    <rect x="-1" y="55" width="32" height="7" rx="2" fill={fill} />
    <circle cx="6" cy="63" r="3" fill={INK} />
    <circle cx="24" cy="63" r="3" fill={INK} />
  </g>
);

const SIGNS: Record<SignName, React.ReactNode> = {
  stop: (
    <>
      <path d="M31 4 H69 L96 31 V69 L69 96 H31 L4 69 V31 Z" fill={RED} stroke="#fff" strokeWidth="3" />
      <text x="50" y="59" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="24" fill="#fff">STOP</text>
    </>
  ),
  giveWay: <path d="M8 14 Q5 10 10 10 L90 10 Q95 10 92 14 L52 86 Q50 90 48 86 Z" fill="#fff" stroke={RED} strokeWidth="8" strokeLinejoin="round" />,
  noEntry: (
    <>
      <circle cx="50" cy="50" r="47" fill={RED} />
      <rect x="18" y="42" width="64" height="16" rx="2" fill="#fff" />
    </>
  ),
  noHorn: ring(
    <>
      <path d="M26 44 H36 L56 32 V68 L36 56 H26 Z" fill={INK} />
      <path d="M62 40 Q68 50 62 60 M68 34 Q78 50 68 66" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="20" y1="80" x2="80" y2="20" stroke={RED} strokeWidth="8" />
    </>,
  ),
  noOvertaking: ring(
    <>
      {car(18, RED)}
      {car(52, INK)}
    </>,
  ),
  speed40: ring(<text x="50" y="63" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="36" fill={INK}>40</text>),
  school: triangle(
    <g fill={INK}>
      <circle cx="40" cy="45" r="5" />
      <path d="M35 52 H45 L46 68 H42 L40 80 H37 L36 68 H34 Z" />
      <circle cx="59" cy="49" r="4.2" />
      <path d="M55 55 H63 L64 69 H61 L59 79 H57 L56 69 H54 Z" />
    </g>,
  ),
  turnLeft: (
    <>
      <circle cx="50" cy="50" r="47" fill={BLUE} />
      <path d="M66 74 V48 Q66 40 58 40 H38 M38 40 L48 30 M38 40 L48 50" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  curve: triangle(<path d="M42 78 V62 Q42 54 50 52 Q58 50 58 42 V34 M58 34 L52 41 M58 34 L64 41" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />),
  pedestrian: (
    <>
      <rect x="4" y="4" width="92" height="92" rx="10" fill={BLUE} />
      <path d="M50 14 L86 82 H14 Z" fill="#fff" />
      <g fill={INK}>
        <circle cx="52" cy="40" r="5" />
        <path d="M48 47 L56 47 L60 60 L57 61 L54 53 L53 62 L58 74 L54 76 L49 64 L45 75 L41 74 L47 60 L46 54 L42 60 L39 58 Z" />
      </g>
      <g fill={INK}>
        {[24, 34, 44, 54, 64].map((x) => (
          <rect key={x} x={x} y="78" width="6" height="3" />
        ))}
      </g>
    </>
  ),
};
