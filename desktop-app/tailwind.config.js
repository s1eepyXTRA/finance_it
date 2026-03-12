/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF7',
        'bg-secondary': '#F0F0EB',
        border: '#E5E5E0',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B65',
        accent: '#D4A574',
        'accent-hover': '#C4955F',
        success: '#4A9B6E',
        danger: '#C75450',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
