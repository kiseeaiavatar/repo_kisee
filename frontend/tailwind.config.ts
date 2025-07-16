import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: "#F5F3FE", // middle chat bg
          200: "#EEE9FF", // widget bg
          300: "#DED3FF", // sidebar item bg, middle avatar font
          400: "#733AF9", // sidebar bg
          500: "#3E0BB6", // middle avatar bg, button bg, font sidebar, font chat
        },
        secondary: {
          500: "#22F56E",
        },
        green: {
          500: "#0DDC57",
          800: "#085724",
        },
      },
    },
  },
  plugins: [],
};
export default config;
