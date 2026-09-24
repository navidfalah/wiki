const colors = require('tailwindcss/colors');

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
        // Warm brand palette (matches the landing page): amber is the brand
        // accent, `gray` is swapped wholesale for `stone` so every existing
        // bg-gray-*/text-gray-*/border-gray-* class site-wide (app-shell,
        // cards, borders, chart gridlines, the toast surface, ...) reads warm
        // without having to touch each of those class names individually.
        gray: colors.stone,
        accent: { DEFAULT: '#b45309', light: '#d97706', dark: '#92400e' },
        // Cited-source badges: kept in the warm family but shifted to rust/
        // orange so they stay visually distinct from the amber brand accent
        // (the two used to collide when accent was still emerald-adjacent).
        source: { DEFAULT: '#9a3412', light: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
        // LLM-generated badges: unchanged indigo -- a deliberate cool
        // counterpoint to the warm accent/source hues.
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
