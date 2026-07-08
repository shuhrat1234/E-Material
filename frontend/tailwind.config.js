/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: 'rgb(var(--gov-navy) / <alpha-value>)',
          slate: 'rgb(var(--gov-slate) / <alpha-value>)',
          blue: 'rgb(var(--gov-blue) / <alpha-value>)',
          light: 'rgb(var(--gov-light) / <alpha-value>)',
          surface: 'rgb(var(--gov-surface) / <alpha-value>)',
          border: 'rgb(var(--gov-border) / <alpha-value>)',
          text: 'rgb(var(--gov-text) / <alpha-value>)',
          muted: 'rgb(var(--gov-muted) / <alpha-value>)',
          success: 'rgb(var(--gov-success) / <alpha-value>)',
          danger: 'rgb(var(--gov-danger) / <alpha-value>)',
          warning: 'rgb(var(--gov-warning) / <alpha-value>)',
          successLight: 'rgb(var(--gov-successLight) / <alpha-value>)',
          dangerLight: 'rgb(var(--gov-dangerLight) / <alpha-value>)',
          warningLight: 'rgb(var(--gov-warningLight) / <alpha-value>)',
          primary: 'rgb(var(--gov-primary) / <alpha-value>)',
          primaryLight: 'rgb(var(--gov-primaryLight) / <alpha-value>)',
          primarySoft: 'rgb(var(--gov-primarySoft) / <alpha-value>)',
          info: 'rgb(var(--gov-info) / <alpha-value>)',
          infoLight: 'rgb(var(--gov-infoLight) / <alpha-value>)',
          cyan: 'rgb(var(--gov-cyan) / <alpha-value>)',
          cyanLight: 'rgb(var(--gov-cyanLight) / <alpha-value>)',
          pink: 'rgb(var(--gov-pink) / <alpha-value>)',
          pinkLight: 'rgb(var(--gov-pinkLight) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        pop: 'var(--shadow-pop)',
      },
      borderRadius: {
        xl2: '1.25rem',
      }
    },
  },
  plugins: [],
}
