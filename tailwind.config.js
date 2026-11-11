/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        abyss: '#0C1626',
        deep: '#14233A',
        tide: '#26405E',
        salt: '#F2F6F8',
        mist: '#9FB3C8',
        resin: '#F2A93B',
        lagoon: '#4FE3C8',
        coral: '#FF6B6B',
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'serif'],
        sans: ['"Manrope Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Two radii only: large for cards, small for inputs and buttons.
      borderRadius: {
        card: '1rem',
        ctl: '0.5rem',
      },
      keyframes: {
        'gallery-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'gallery-in': 'gallery-in 600ms ease-out both',
      },
    },
  },
  plugins: [],
}
