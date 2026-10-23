import { ImageResponse } from "next/og";
import { getGuide } from "@/lib/content/repo";
import { OG_BACKGROUND, OG_SIZE, OgBrand, OgChip, OgIcon, ogFonts } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Kasari Garne guide";

/** The picture shown when a guide is shared: its question, three promises, and the service's icon. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  const question = guide?.question.en || guide?.title.en || "Government services in Nepal, step by step";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 60, padding: "70px 80px", background: OG_BACKGROUND, fontFamily: "Poppins" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", flex: 1 }}>
          <OgBrand />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.12, color: "#1B2230", letterSpacing: -1 }}>{question}</div>
            <div style={{ display: "flex", gap: 14 }}>
              <OgChip>Step by step</OgChip>
              <OgChip>Video</OgChip>
              <OgChip>Free</OgChip>
            </div>
          </div>
        </div>
        {guide && <OgIcon icon={guide.icon} />}
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
