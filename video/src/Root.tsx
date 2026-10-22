import "./style.css";
import { Composition } from "remotion";
import { buildTutorial } from "@/lib/video/script";
import type { Guide, Locale } from "@/lib/content/types";
import { Tutorial, FPS, type TutorialProps } from "./Tutorial";
import { seedGuides } from "./guides";

const resolve = (p: TutorialProps): Guide => p.guide ?? seedGuides.find((g) => g.slug === p.slug) ?? seedGuides[0];

export function Root() {
  return (
    <Composition
      id="Tutorial"
      component={Tutorial}
      fps={FPS}
      width={1280}
      height={720}
      durationInFrames={FPS * 60}
      defaultProps={{ slug: "driving-licence", locale: "ne" as Locale } satisfies TutorialProps}
      calculateMetadata={({ props }) => {
        const script = buildTutorial(resolve(props), props.locale);
        return { durationInFrames: Math.ceil((script.totalMs / 1000) * FPS), props: { ...props, guide: resolve(props) } };
      }}
    />
  );
}
