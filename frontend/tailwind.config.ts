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
          100: "#F5F3FE",
          200: "#EEE9FF", // middle chat bg
          300: "#DED3FF", // sidebar item bg, middle avatar font, chat bubbles
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
        grey: {
          100: "#fdfdfd", // widget bg
        },
      },
    },
  },
  plugins: [],
};
export default config;
