import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1B2230", soft: "#4A5363", faint: "#7A8291" },
        paper: { DEFAULT: "#FFFFFF", warm: "#FAF8F5", line: "#E7E3DC" },
        // Restrained crimson, a nod to the flag; AA contrast on white.
        brand: { DEFAULT: "#B4232C", dark: "#8E1A22", tint: "#FBEDEE" },
        // Flag-border blue, used sparingly for links and info.
        sky: { DEFAULT: "#1F3F8F", tint: "#EEF2FB" },
        ok: { DEFAULT: "#1E7A4C", tint: "#E9F5EE" },
        warn: { DEFAULT: "#8A5A00", tint: "#FFF5DD" },
      },
      fontFamily: {
        sans: ["Mukta", "Poppins", "system-ui", "sans-serif"],
        latin: ["Poppins", "Mukta", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "12px", "2xl": "14px" },
      boxShadow: { card: "0 1px 2px rgba(27,34,48,.05)", pop: "0 8px 24px rgba(27,34,48,.10)" },
      // One motion vocabulary for the whole site: short, eased, never blocking interaction.
      transitionTimingFunction: { soft: "cubic-bezier(.2,.8,.2,1)" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        pop: { from: { opacity: "0", transform: "translateY(-4px) scale(.98)" }, to: { opacity: "1", transform: "none" } },
        "step-next": { from: { opacity: "0", transform: "translateX(12px)" }, to: { opacity: "1", transform: "none" } },
        "step-back": { from: { opacity: "0", transform: "translateX(-12px)" }, to: { opacity: "1", transform: "none" } },
        breathe: { "0%, 100%": { boxShadow: "0 0 0 0 rgba(180,35,44,.28)" }, "50%": { boxShadow: "0 0 0 6px rgba(180,35,44,0)" } },
      },
      animation: {
        rise: "rise .32s cubic-bezier(.2,.8,.2,1) both",
        fade: "fade .2s ease-out both",
        pop: "pop .16s cubic-bezier(.2,.8,.2,1) both",
        "step-next": "step-next .24s cubic-bezier(.2,.8,.2,1) both",
        "step-back": "step-back .24s cubic-bezier(.2,.8,.2,1) both",
        breathe: "breathe 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
