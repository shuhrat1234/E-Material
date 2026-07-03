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
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
