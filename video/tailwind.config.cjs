/* Same theme as the website, scanning the shared scene templates. */
const path = require("node:path");
module.exports = {
  content: [path.join(__dirname, "src/**/*.{ts,tsx}"), path.join(__dirname, "../src/components/video/**/*.{ts,tsx}")],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1B2230", soft: "#4A5363", faint: "#7A8291" },
        paper: { DEFAULT: "#FFFFFF", warm: "#FAF8F5", line: "#E7E3DC" },
        brand: { DEFAULT: "#B4232C", dark: "#8E1A22", tint: "#FBEDEE" },
        sky: { DEFAULT: "#1F3F8F", tint: "#EEF2FB" },
        ok: { DEFAULT: "#1E7A4C", tint: "#E9F5EE" },
        warn: { DEFAULT: "#8A5A00", tint: "#FFF5DD" },
      },
      boxShadow: { card: "0 1px 2px rgba(27,34,48,.04), 0 4px 16px rgba(27,34,48,.05)" },
    },
  },
};
