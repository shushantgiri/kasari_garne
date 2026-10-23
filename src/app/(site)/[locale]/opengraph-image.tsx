import { ImageResponse } from "next/og";
import { OG_BACKGROUND, OG_SIZE, OgBrand, OgChip, OgIcon, ogFonts } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Kasari Garne: government services in Nepal, step by step";

/** The picture shown when the site (or any page without its own) is shared. */
export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "70px 80px", background: OG_BACKGROUND, fontFamily: "Poppins" }}>
        <OgBrand />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 28, flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, color: "#1B2230" }}>
              <span>Government work,</span>
              <span style={{ color: "#B4232C" }}>step by step</span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <OgChip>Licence</OgChip>
              <OgChip>Passport</OgChip>
              <OgChip>National ID</OgChip>
            </div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <OgIcon icon="car" size={130} />
            <OgIcon icon="passport" size={130} />
            <OgIcon icon="idcard" size={130} />
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
