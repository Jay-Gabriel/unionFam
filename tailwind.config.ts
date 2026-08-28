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
        brand: {
          50: "#f0f4ff",
          100: "#e0e9fe",
          200: "#c7d7fe",
          300: "#a4bcfd",
          400: "#7c98fb",
          500: "#586bf6",
          600: "#3d46ec",
          700: "#3135d7",
          800: "#2a2cb0",
          900: "#272a8c",
          950: "#181852",
        },
        sidebar: {
          bg: "#fafaff",
          activeBg: "#1e2474",
          activeText: "#ffffff",
          hoverBg: "#f0f2fe",
          text: "#475569",
        },
        card: {
          bg: "#ffffff",
          border: "#eef2ff",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(99, 102, 241, 0.08)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        card: "0 2px 10px 0 rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        xl: "1rem",
        '2xl': "1.25rem",
        '3xl': "1.5rem",
      }
    },
  },
  plugins: [],
};
export default config;
