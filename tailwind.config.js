/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['IBM Plex Sans', 'Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        paper: 'var(--paper)',
        surface: {
          DEFAULT: 'var(--surface)',
          sunk: 'var(--surface-sunk)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          border: 'var(--surface-border)',
          'border-light': 'var(--surface-border-light)',
        },
        ink: {
          900: 'var(--ink-900)',
          700: 'var(--ink-700)',
          500: 'var(--ink-500)',
          300: 'var(--ink-300)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          wash: 'var(--primary-wash)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          wash: 'var(--accent-wash)',
        },
        // Legacy alias compatibility
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#818cf8',
          400: '#6366f1',
          500: '#0F5C4C', // mapped to primary emerald
          600: '#0C4A3D',
          700: '#09382e',
        },
        gold: {
          300: '#fcd34d',
          400: '#B8862E', // mapped to accent gold
          500: '#9C7126',
          600: '#7c591b',
        },
        text: {
          primary: 'var(--ink-900)',
          secondary: 'var(--ink-700)',
          muted: 'var(--ink-500)',
        },
        success: {
          DEFAULT: 'var(--success)',
          wash: 'var(--success-wash)',
          light: '#2ecc71',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          wash: 'var(--warning-wash)',
          light: '#f39c12',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          wash: 'var(--danger-wash)',
          light: '#e74c3c',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.12)',
        glow: '0 0 20px rgba(15, 92, 76, 0.25)',
        'glow-gold': '0 0 20px rgba(184, 134, 46, 0.25)',
        modal: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        'fade-up': 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slide-down 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
};
