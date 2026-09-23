/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/views/**/*.ejs', './src/client/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: { DEFAULT: '#059669', light: '#10b981', dark: '#047857' },
        source: { DEFAULT: '#b45309', light: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        generated: { DEFAULT: '#4338ca', light: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        rise: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        rise: 'rise 0.7s ease-out both',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        panel: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 4px 16px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
