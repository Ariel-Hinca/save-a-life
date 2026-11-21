/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#C8102E',
        ink: '#1C1917',
        muted: '#78716C',
        accent: '#0F766E',
        success: '#15803D',
        surface: '#F7F3EE',
        paper: '#FFFCFA',
        line: '#E7E0D8',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(28, 25, 23, 0.04), 0 12px 32px -16px rgba(28, 25, 23, 0.18)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
