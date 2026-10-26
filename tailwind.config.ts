import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#faf9f6",
        "surface-low": "#f4f3f0",
        "surface-container": "#efeeeb",
        "surface-high": "#e9e8e5",
        "surface-highest": "#e3e2e0",
        "on-surface": "#1a1c1a",
        "on-surface-variant": "#44474b",
        outline: "#74777b",
        "outline-variant": "#c4c7cb",
        "rule": "#d8d2c6",
        ink: "#111c24",
        "body-ink": "#1b2b38",
        primary: "#000000",
        "primary-container": "#121d25",
        "on-primary": "#ffffff",
        secondary: "#3c6756",
        "secondary-container": "#beedd7",
        "civic-green": "#174334",
        "civic-green-mid": "#1f5a46",
        crimson: "#8b2525",
        "crimson-fill": "#b3261e",
        ochre: "#b37800",
        "ochre-fill": "#fdf4e2",
        redirect: "#1a3a5c",
      },
      fontFamily: {
        display: ["var(--font-display)", "Newsreader", "Georgia", "serif"],
        body: ["var(--font-body)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        label: ["var(--font-label)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        civic: "1160px",
      },
      borderRadius: {
        none: "0",
      },
    },
  },
  plugins: [],
} satisfies Config;
