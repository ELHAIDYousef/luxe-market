import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:      '#2b8cee',
        'bg-light':   '#FAF9F6',
        'bg-dark':    '#101922',
        cream:        '#FAF9F6',
        'cream-deep': '#F2EFE9',
        charcoal:     '#1A1A1A',
        stone:        '#8C8278',
        wood:         '#C4A882',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  // Never purge the icon class
  safelist: ['material-symbols-outlined'],
  plugins: [],
};

export default config;
