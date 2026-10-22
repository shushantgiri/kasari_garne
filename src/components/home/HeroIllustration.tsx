/** A person following a tutorial on a phone, next to a simple form. Decorative. */
export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 260" className={className} aria-hidden="true" role="presentation">
      {/* ground */}
      <ellipse cx="170" cy="238" rx="132" ry="10" fill="#F1EDE6" />
      {/* form card */}
      <g transform="translate(150 34)">
        <rect width="150" height="176" rx="14" fill="#fff" stroke="#E7E3DC" strokeWidth="2" />
        <rect x="16" y="18" width="70" height="8" rx="4" fill="#1B2230" opacity=".85" />
        <rect x="16" y="42" width="118" height="22" rx="7" fill="#FAF8F5" stroke="#E7E3DC" />
        <rect x="16" y="74" width="118" height="22" rx="7" fill="#FAF8F5" stroke="#1F3F8F" strokeWidth="2" />
        <rect x="24" y="82" width="46" height="6" rx="3" fill="#1F3F8F" opacity=".5" />
        <rect x="16" y="106" width="118" height="22" rx="7" fill="#FAF8F5" stroke="#E7E3DC" />
        <rect x="16" y="142" width="64" height="22" rx="8" fill="#B4232C" />
        <rect x="28" y="150" width="40" height="6" rx="3" fill="#fff" />
        {/* check marks */}
        <circle cx="134" cy="53" r="8" fill="#1E7A4C" />
        <path d="M130 53l3 3 5-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* cursor */}
        <path d="M60 150l0 22 6-6 5 10 4-2-5-10 8 0z" fill="#1B2230" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {/* person */}
      <g transform="translate(36 52)">
        <circle cx="62" cy="34" r="22" fill="#8C5A3C" />
        <path d="M40 30c2-18 18-26 32-20 10 4 14 12 12 22-6-8-20-10-30-6-6 2-10 4-14 4z" fill="#1B2230" />
        <path d="M22 186c0-56 16-96 40-96s40 40 40 96z" fill="#1F3F8F" />
        <path d="M44 96c-14 8-22 30-18 52l14 2c0-14 4-28 12-36z" fill="#1F3F8F" />
        {/* phone in hand */}
        <rect x="74" y="96" width="34" height="58" rx="6" fill="#1B2230" />
        <rect x="78" y="102" width="26" height="40" rx="3" fill="#fff" />
        <polygon points="87,113 87,129 98,121" fill="#B4232C" />
        <path d="M70 140c6 6 14 8 20 6l-2-10c-6 0-10-2-14-6z" fill="#8C5A3C" />
      </g>
      {/* sparkle step dots */}
      <g fill="#B4232C">
        <circle cx="136" cy="30" r="4" />
        <circle cx="122" cy="44" r="3" opacity=".6" />
        <circle cx="112" cy="58" r="2" opacity=".35" />
      </g>
    </svg>
  );
}
