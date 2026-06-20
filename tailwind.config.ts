import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0f172a", // Slate-900 for a professional dark look
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#60a5fa", // Blue-400 for a softer, modern sky blue accent
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#f1f5f9", // Slate-100 for subtle backgrounds
          foreground: "#0f172a",
        },
        // We redefine the old named colors to fit the modern palette
        gold: "#60a5fa", // Mapped to primary blue accent
        emerald: "#1e293b", // Mapped to a slate shade instead of dark green
        cream: "#ffffff", // Pure white for modern cards and backgrounds
      },
      fontFamily: {
        amiri: ["var(--font-inter)", "sans-serif"], // Replaced Amiri with modern sans
        poppins: ["var(--font-inter)", "sans-serif"], // Replaced Poppins with modern sans
      },
    },
  },
  plugins: [],
};
export default config;
