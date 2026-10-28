import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        text: "var(--text)",
        muted: "var(--muted)",
        red: "var(--red)",
        blue: "var(--blue)",
        grey: "var(--grey)",
        gold: "var(--gold)",
        green: "var(--green)",
        teal: "var(--teal)",
        pink: "var(--accent-pink)",
        lilac: "var(--accent-lilac)",
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
