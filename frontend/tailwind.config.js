/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/views/**/*.ejs', './src/client/**/*.ts'],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#059669', light: '#10b981', dark: '#047857' },
        source: { DEFAULT: '#b45309', light: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        generated: { DEFAULT: '#4338ca', light: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        panel: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 4px 16px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
