import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#800020',
          50: '#fdf2f4',
          100: '#fbe6ea',
          200: '#f5c0ca',
          300: '#ef9aaa',
          400: '#e34e6a',
          500: '#800020',
          600: '#73001d',
          700: '#600018',
          800: '#4d0013',
          900: '#3d000f',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#fdf8eb',
          100: '#faefc7',
          200: '#f5de8a',
          300: '#e8c94d',
          400: '#D4AF37',
          500: '#b8941c',
          600: '#9a7a15',
          700: '#7c6111',
          800: '#654e0e',
          900: '#52400b',
        },
        dark: {
          DEFAULT: '#1a0b2e',
          50: '#f5f0ff',
          100: '#ebe0ff',
          200: '#d4bfff',
          300: '#b794ff',
          400: '#8b5cf6',
          500: '#1a0b2e',
          600: '#150929',
          700: '#110723',
          800: '#0d051e',
          900: '#0a0318',
        },
      },
      animation: {
        'glow-pulse': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.5)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
