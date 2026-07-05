/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b132b',
          slate: '#1c2541',
          blue: '#3a506b',
          light: '#f4f6f9',
          border: '#e2e8f0',
          text: '#1e293b',
          muted: '#64748b',
          success: '#0d9488',
          danger: '#e11d48',
          warning: '#d97706',
          successLight: '#f0fdfa',
          dangerLight: '#fff1f2',
          warningLight: '#fffbeb',
          primary: '#2563eb',
          primaryLight: '#eff6ff',
          primarySoft: '#dbeafe',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px -8px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 4px 10px rgba(15, 23, 42, 0.07), 0 12px 32px -8px rgba(15, 23, 42, 0.12)',
        pop: '0 12px 32px -6px rgba(15, 23, 42, 0.14)',
      },
      borderRadius: {
        xl2: '1.25rem',
      }
    },
  },
  plugins: [],
}
