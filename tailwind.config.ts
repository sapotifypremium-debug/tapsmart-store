import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#050C1F", 900: "#0A1630", 800: "#10214A", 700: "#1A3066" },
        gold: { 300: "#EBCB8B", 400: "#D9AE5F", 500: "#C99A3E", 600: "#A87E2C" },
        ivory: "#F7F2E7",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
