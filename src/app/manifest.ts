import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "कसरी गर्ने? — Kasari Garne",
    short_name: "कसरी गर्ने?",
    description: "सरकारी काम, अब सजिलै। Simple guides to Nepal government online services.",
    start_url: "/ne",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#B4232C",
    lang: "ne",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
