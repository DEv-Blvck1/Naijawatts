import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Clash Display'", "'Outfit'", "sans-serif"],
        body: ["'Outfit'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        watts: {
          bg: "#080c12",
          surface: "#0f1420",
          card: "#131927",
          border: "#1d2535",
          accent: "#00e5a0",
          warn: "#f59e0b",
          danger: "#ef4444",
          text: "#f0f4ff",
          muted: "#5b6a8a",
          subtle: "#8896b0",
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "count-up": "count-up 0.6s ease-out forwards",
      },
      keyframes: {
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%,100%": { boxShadow: "0 0 20px rgba(0,229,160,0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(0,229,160,0.35)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
