/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base:    '#0A0A0F',
        surface: '#10101A',
        border:  '#1E1E30',
        violet:  '#5227FF',
        rose:    '#FF9FFC',
        lavender:'#B19EEF',
        safe:    '#22C55E',
        danger:  '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-border': 'pulseBorder 1.5s ease-in-out infinite',
        'slide-up':     'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':      'fadeIn 0.4s ease',
        'shimmer':      'shimmer 2s linear infinite',
      },
      keyframes: {
        pulseBorder: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
