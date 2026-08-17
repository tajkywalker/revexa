import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['var(--font-roboto)', 'sans-serif'],
        title: ['var(--font-oswald)', 'sans-serif'],
        mono:  ['monospace'],
      },
      colors: {
        // Aunaria design tokens — immersive, fantasy-game oriented
        void:     '#06060f',
        deep:     '#0a0a18',
        card:     '#0f0f1e',
        elevated: '#16162a',
        // Primary accent — violet/purple
        accent: {
          DEFAULT: '#7b52f4',
          dim:     'rgba(123,82,244,0.15)',
          glow:    'rgba(123,82,244,0.4)',
        },
        // Gold for VIP/premium
        gold: {
          DEFAULT: '#f5c842',
          dim:     'rgba(245,200,66,0.15)',
        },
        // Teal for secondary accents
        teal: {
          DEFAULT: '#3ecfcf',
          dim:     'rgba(62,207,207,0.15)',
        },
        emerald: {
          DEFAULT: '#3ecf8e',
        },
        crimson: '#e05252',
      },
      backgroundImage: {
        'hero-glow':    'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(123,82,244,0.20) 0%, transparent 60%)',
        'card-glow':    'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(123,82,244,0.08) 0%, transparent 60%)',
        'accent-glow':  'radial-gradient(ellipse at center, rgba(123,82,244,0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'accent':    '0 0 24px rgba(123,82,244,0.4)',
        'accent-lg': '0 0 60px rgba(123,82,244,0.3)',
        'card':      '0 4px 24px rgba(0,0,0,0.5)',
        'elevated':  '0 8px 48px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':      'fadeIn 0.3s ease',
        'slide-up':     'slideUp 0.4s ease',
        'float':        'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:   {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
