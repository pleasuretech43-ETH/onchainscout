import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f7f7f8',
          100: '#eeeef1',
          200: '#d9d9e0',
          300: '#b8b8c5',
          400: '#8a8a9c',
          500: '#5e5e72',
          600: '#3f3f54',
          700: '#2c2c3e',
          800: '#1c1c2a',
          900: '#0f0f1a',
        },
        accent: {
          DEFAULT: '#7c5cff',
          400: '#9d85ff',
          500: '#7c5cff',
          600: '#5e3fe6',
        },
        signal: {
          go: '#34d399',
          caution: '#fbbf24',
          stop: '#f87171',
          unknown: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
