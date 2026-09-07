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
        calm: {
          'forest-dusk': '#3D4138',
          'deep-moss': '#263128',
          'moss': '#596A55',
          'fern': '#8FA083',
          'lichen': '#C6D6B4',
          'pollen': '#EED596',
          'fog': '#EEF2EB',
          'morning-mist': '#F4F6F1',
          'warm-ivory': '#FAF8F2',
          'paper-white': '#FFFFFF',
          'ink': '#222A23',
          'muted-ink': '#667066',
          'ai-lavender': '#A8A2C4',
          'success-leaf': '#6EA080',
          'warning-earth': '#C4996C',
          'danger-clay': '#C97970',
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(52, 65, 53, 0.08)",
        glass: "0 8px 32px 0 rgba(52, 65, 53, 0.05)",
        card: "0 2px 10px 0 rgba(52, 65, 53, 0.03)",
        'calm-hover': "0 12px 30px -4px rgba(52, 65, 53, 0.12)",
      },
      borderRadius: {
        xl: "1rem",
        '2xl': "1.25rem",
        '3xl': "1.75rem", // 28px
        '4xl': "2.25rem", // 36px
        'full': "9999px",
      }
    },
  },
  plugins: [],
};
export default config;
