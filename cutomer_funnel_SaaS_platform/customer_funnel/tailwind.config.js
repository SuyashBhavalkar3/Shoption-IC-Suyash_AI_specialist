/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight: '#081120',
        ink: '#111827',
        mist: '#e5eefb',
        aurora: '#6ee7f9',
        ember: '#fb7185',
        gold: '#fbbf24',
      },
      boxShadow: {
        glow: '0 24px 80px rgba(14, 165, 233, 0.18)',
        soft: '0 1px 3px rgba(0, 0, 0, 0.08)',
        'subtle': '0 2px 6px rgba(0, 0, 0, 0.06)',
        'button': '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
