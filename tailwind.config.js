/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        surface: "#1a1a2e",
        panel:   "#16213e",
        accent:  "#e94560",
        muted:   "#a0a0b0",
        canvas:  "#f3f4f6",
        card:    "#ffffff",
      },
    },
  },
  plugins: [],
};
