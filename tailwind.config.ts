import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", md: "2rem", lg: "3rem" },
      screens: { "2xl": "1240px" },
    },
    extend: {
      colors: {
        // AIWIZN brand palette (sourced from investor brief)
        teal: {
          DEFAULT: "#00A87A",
          dark: "#007A5E",
          dim: "rgba(0,168,122,0.10)",
        },
        gold: {
          DEFAULT: "#C8920A",
          dim: "rgba(200,146,10,0.09)",
        },
        orange: {
          DEFAULT: "#D94B12",
          dim: "rgba(217,75,18,0.09)",
        },
        purple: {
          DEFAULT: "#7C5CBF",
          dim: "rgba(124,92,191,0.08)",
        },
        ink: {
          DEFAULT: "#0A1826",
          2: "#3A4E62",
          3: "#6B7F94",
        },
        cream: {
          DEFAULT: "#F5EFE0",
          light: "#FBF8EF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "DM Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        label: "0.18em",
      },
      backgroundImage: {
        "brand-rule":
          "linear-gradient(90deg, #D94B12 0%, #00A87A 50%, #C8920A 100%)",
        "page-radial":
          "radial-gradient(1200px 600px at 50% -10%, rgba(0,168,122,0.10), transparent 60%)",
      },
      maxWidth: {
        prose: "62ch",
      },
    },
  },
  plugins: [],
};

export default config;
