module.exports = {
  purge: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Changed from false to 'class'
  theme: {
    extend: {
      colors: {
        'tech-blue': '#3B82F6',
        'creative-purple': '#8B5CF6',
        'learning-yellow': '#F59E0B',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
