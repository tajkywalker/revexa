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
        mono:  ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Serverix design tokens
        void:     '#06060f',
        deep:     '#0a0a1a',
        card:     '#0f0f20',
        elevated: '#181830',
        border:   'rgba(255,255,255,0.06)',
        accent: {
          DEFAULT: '#7b52f4',
          dim:     'rgba(123,82,244,0.15)',
          glow:    'rgba(123,82,244,0.4)',
        },
        teal: {
          DEFAULT: '#3ecfcf',
          dim:     'rgba(62,207,207,0.15)',
        },
        gold: {
          DEFAULT: '#f5c842',
          dim:     'rgba(245,200,66,0.15)',
        },
        green:  '#3ecf8e',
        red:    '#e05252',
        // Status colors
        status: {
          online:  '#3ecf8e',
          offline: '#6b7280',
          banned:  '#e05252',
          muted:   '#f5c842',
          warn:    '#fb923c',
        },
        // Ticket priority
        priority: {
          low:    '#3ecfcf',
          medium: '#f5c842',
          high:   '#fb923c',
          urgent: '#e05252',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'accent-glow': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(123,82,244,0.18) 0%, transparent 60%)',
      },
      boxShadow: {
        'accent':   '0 0 24px rgba(123,82,244,0.4)',
        'accent-lg':'0 0 48px rgba(123,82,244,0.3)',
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
        'elevated': '0 8px 40px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.2s ease',
        'slide-in':   'slideIn 0.25s ease',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
