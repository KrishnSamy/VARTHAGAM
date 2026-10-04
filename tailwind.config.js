/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Royal Crimson / Imperial Red Palette
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Radiant Metallic Gold Palette
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        chai: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Anek Tamil"',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ],
        tamil: [
          '"Anek Tamil"',
          '"Noto Sans Tamil"',
          'sans-serif'
        ],
        display: [
          '"Cinzel"',
          '"Anek Tamil"',
          'serif'
        ]
      },
      boxShadow: {
        'gold-sm': '0 2px 8px -1px rgba(245, 158, 11, 0.25)',
        'gold-md': '0 4px 16px -2px rgba(245, 158, 11, 0.35)',
        'gold-lg': '0 8px 24px -4px rgba(245, 158, 11, 0.45)',
        'crimson-md': '0 4px 16px -2px rgba(185, 28, 28, 0.4)',
      }
    },
  },
  plugins: [],
}
