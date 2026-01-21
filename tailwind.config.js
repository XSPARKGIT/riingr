/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        "4.5": "1.125rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

