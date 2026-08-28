/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tcet: {
          navy: '#0b2545',    // TCET Deep Navy
          gold: '#e0a96d',    // TCET Accent Gold
          darkGold: '#a87c43',
          lightBg: '#f8fafc', // Clean background
          cardBg: '#ffffff',
          darkText: '#1e293b',
          mutedText: '#64748b'
        }
      }
    },
  },
  plugins: [],
}
