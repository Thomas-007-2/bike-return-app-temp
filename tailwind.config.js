/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
    50: '#fef2f2',
    500: '#F15E57',
    600: '#e11d48',
    700: '#be123c'
        }
      }
    },
  },
  plugins: [],
}