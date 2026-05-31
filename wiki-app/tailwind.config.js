/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#059669',
          light: '#10b981',
          dark: '#047857',
        },
      },
      fontFamily: {
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'pulse-soft': 'pulse-soft 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.35s ease-out',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'progress-indeterminate': 'progress-indeterminate 1.4s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '50%': { opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.06)',
        panel: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 4px 16px -2px rgb(0 0 0 / 0.06)',
      },
      backgroundImage: {
        'shimmer-gradient':
          'linear-gradient(90deg, rgb(245 245 245) 0%, rgb(229 229 229) 50%, rgb(245 245 245) 100%)',
      },
    },
  },
  plugins: [],
};
