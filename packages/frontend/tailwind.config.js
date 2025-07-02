/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tech-blue': '#00A9E0',
        'creative-purple': '#8A2BE2',
        'learning-yellow': '#FFD700',
      },
    },
  },
  plugins: [],
}
