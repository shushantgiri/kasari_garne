import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { IconName } from "./content/types";

/**
 * Shared pieces for the link-preview pictures (WhatsApp, Facebook, Viber…).
 * The picture renderer can't join Devanagari letters correctly, so the pictures carry
 * English text and visuals only; the Nepali title and description still show beside them.
 */

export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFonts() {
  const font = (f: string) => readFile(join(process.cwd(), "src/assets/fonts", f));
  return [
    { name: "Poppins", data: await font("poppins-latin-700-normal.woff"), weight: 700 as const },
    { name: "Poppins", data: await font("poppins-latin-600-normal.woff"), weight: 600 as const },
  ];
}

/** Soft red-to-blue wash, like the site's headers (layered radial gradients crash the renderer). */
export const OG_BACKGROUND = "linear-gradient(135deg, #FBEDEE 0%, #FBFAF8 45%, #FBF4E6 75%, #EEF2FB 100%)";

/** The red "?" mark and the name. */
export function OgBrand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "#B4232C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 700 }}>?</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#1B2230" }}>Kasari Garne</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#7A8291", letterSpacing: 2 }}>GOVERNMENT SERVICES, SIMPLY</div>
      </div>
    </div>
  );
}

export function OgChip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "10px 22px", borderRadius: 999, background: "#fff", border: "2px solid #E7E3DC", fontSize: 24, fontWeight: 600, color: "#4A5363" }}>
      {children}
    </div>
  );
}

/** The site's service icons as plain paths (24×24, from Lucide): the picture renderer can't draw the icon components. */
const ICON_PATHS: Record<IconName, string[]> = {
  car: ["M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2", "M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0", "M9 17h6", "M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"],
  passport: ["M12 21V7", "m16 12 2 2 4-4", "M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3"],
  idcard: ["M16 10h2", "M16 14h2", "M6.17 15a3 3 0 0 1 5.66 0", "M7 11a2 2 0 1 0 4 0a2 2 0 1 0 -4 0", "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"],
  receipt: ["M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z", "M14 8H8", "M16 12H8", "M13 16H8"],
  shield: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "m9 12 2 2 4-4"],
  vote: ["m9 12 2 2 4-4", "M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z", "M22 19H2"],
  baby: ["M9 12h.01", "M15 12h.01", "M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5", "M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"],
  landmark: ["M3 22H21", "M6 18V11", "M10 18V11", "M14 18V11", "M18 18V11", "M12 2L20 7H4Z"],
  briefcase: ["M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", "M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"],
  graduation: ["M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z", "M22 10v6", "M6 12.5V16a6 3 0 0 0 12 0v-3.5"],
};

/** A large service icon on a white tile with a soft shadow. */
export function OgIcon({ icon, size = 300 }: { icon: IconName; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: "#fff", border: "2px solid #E7E3DC", boxShadow: "0 30px 60px -30px rgba(27,34,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "#B4232C" }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none" stroke="#B4232C" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {(ICON_PATHS[icon] ?? ICON_PATHS.landmark).map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </div>
  );
}
