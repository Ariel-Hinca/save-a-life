/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#DC2626',
        accent: '#2563EB',
        success: '#16A34A',
        surface: '#F8FAFC',
      },
      boxShadow: {
        card: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
