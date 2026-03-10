/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0c0e14",
        surface: "#151821",
        "surface-alt": "#1c2030",
        border: "#282d42",
        accent: "#c9a24d",
        "accent-bg": "rgba(201,162,77,0.1)",
        "text-main": "#e8e6e1",
        "text-dim": "#9a97a0",
        "text-muted": "#5e5b68",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
