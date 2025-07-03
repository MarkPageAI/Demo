/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        'tech-blue': '#007bff', // Example: Bright blue
        'creative-purple': '#6f42c1', // Example: Vibrant purple
        'learning-yellow': '#ffc107', // Example: Warm yellow
        'steam-gray': {
          light: '#f8f9fa', // Light gray for backgrounds
          DEFAULT: '#6c757d', // Default gray for text/borders
          dark: '#343a40',   // Dark gray for darker elements
        },
      },
      fontFamily: {
        sans: ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        // Add a specific "STEAM" font if desired, e.g., a modern, clean sans-serif
        // steam: ['Roboto', 'sans-serif'],
      },
      spacing: {
        // Using Tailwind's default spacing scale, but can be customized here
        // e.g., 'xs': '0.25rem', 'sm': '0.5rem', etc.
        '128': '32rem', // Example custom spacing
        '144': '36rem',
      },
      fontSize: {
        // Example: Define a custom text size
        // 'h1-steam': '2.5rem',
      },
      fontWeight: {
        // Example: Define custom font weights
        // 'normal-steam': 400,
        // 'bold-steam': 700,
      }
    },
  },
  plugins: [],
}
