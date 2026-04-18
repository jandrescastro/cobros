import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#123347",
        sand: "#EEF4F7",
        peach: "#DCE8EF",
        mint: "#E6EEF2",
        coral: "#2F6F91",
        slate: "#5D7281"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(18, 51, 71, 0.10)"
      },
      borderRadius: {
        card: "1.5rem"
      },
      backgroundImage: {
        "app-gradient":
          "radial-gradient(circle at top left, rgba(18,51,71,0.06), transparent 26%), linear-gradient(180deg, #f9fcfe 0%, #edf5f8 100%)"
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-heading)", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
