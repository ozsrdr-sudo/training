import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'media',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        bg: {
          primary: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
          info: 'var(--color-background-info)',
        },
        fg: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          info: 'var(--color-text-info)',
          success: 'var(--color-text-success)',
          danger: 'var(--color-text-danger)',
        },
        brand: {
          spot: '#378ADD',
          strike: '#7F77DD',
          be: '#EF9F27',
          point: '#3C3489',
          t0: '#D85A30',
          orig: '#888780',
          curr: '#1D9E75',
          profit: '#10b981',
          loss: '#ef4444',
        },
        border: {
          tertiary: 'var(--color-border-tertiary)',
          secondary: 'var(--color-border-secondary)',
          info: 'var(--color-border-info)',
        },
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
