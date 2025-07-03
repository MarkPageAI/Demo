/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'steam-blue': '#007bff', // A common bootstrap blue, good for tech
        'steam-purple': '#6f42c1', // A common bootstrap purple, good for creativity
        'steam-yellow': '#ffc107', // A common bootstrap yellow, good for learning
        'steam-green': '#28a745', // A common bootstrap green, good for success/submit
      },
    },
  },
  plugins: [],
}
