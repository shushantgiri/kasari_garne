import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p"); // plays everywhere, including old Android phones
Config.setOverwriteOutput(true);

// Reuse the website's components and Tailwind theme so videos match the site exactly.
Config.overrideWebpackConfig((config) => {
  const withTw = enableTailwind(config, { configLocation: path.join(process.cwd(), "tailwind.config.cjs") });
  return {
    ...withTw,
    resolve: {
      ...withTw.resolve,
      alias: { ...(withTw.resolve?.alias ?? {}), "@": path.join(process.cwd(), "..", "src") },
      // The site's components import lucide-react/react; resolve them from this folder.
      modules: [path.join(process.cwd(), "node_modules"), "node_modules"],
    },
  };
});
