/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{tsx,ts}",
    "./components/**/*.{tsx,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#6b7280",
        accent: "#f59e0b",
        danger: "#dc2626"
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"]
      }
    }
  },
  plugins: [],
  darkMode: "media" // Soporte para modo oscuro automático
};
