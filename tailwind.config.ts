import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // 6 surface tones — gives the chrome real depth
        bg: {
          DEFAULT: '#07090f',
          900: '#07090f',
          800: '#0b0e16',
          700: '#11151f',
          600: '#171c2a',
          500: '#1f2536',
          400: '#2a3146',
        },
        // 4 text tones — proper hierarchy for the chrome
        ink: {
          DEFAULT: '#e6e8ee',
          50: '#f5f6fa',
          100: '#dcdfe7',
          200: '#b0b6c6',
          300: '#7e8597',
          400: '#5a6173',
          500: '#3f4555',
        },
        // Brand accent — cyan, distinctive and consistent with intelligence-tool aesthetic
        accent: {
          DEFAULT: '#22d3ee',
          400: '#67e8f9',
          500: '#22d3ee',
          600: '#06b6d4',
          700: '#0e7490',
        },
        // Semantic status dots / pills
        signal: {
          go: '#10b981',
          caution: '#f59e0b',
          stop: '#ef4444',
          unknown: '#71717a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 0 1px rgb(34 211 238 / 0.18), 0 0 24px -8px rgb(34 211 238 / 0.35)',
        'soft': '0 1px 0 rgb(255 255 255 / 0.04) inset, 0 8px 24px -8px rgb(0 0 0 / 0.4)',
        'card-hover': '0 0 0 1px rgb(34 211 238 / 0.2), 0 12px 32px -12px rgb(34 211 238 / 0.25)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgb(255 255 255 / 0.025) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.025) 1px, transparent 1px)',
        'dot-pattern':
          'radial-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-32': '32px 32px',
        'dots-24': '24px 24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(2px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
