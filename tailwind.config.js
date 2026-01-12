/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#050510',
          cyan: '#00f3ff',
          magenta: '#ff00ff',
          glass: 'rgba(255, 255, 255, 0.05)',
          glassBorder: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00f3ff, 0 0 20px #00f3ff',
        'neon-magenta': '0 0 10px #ff00ff, 0 0 20px #ff00ff',
      }
    },
  },
  plugins: [],
}
