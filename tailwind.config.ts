import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          800: '#004D40',
          900: '#00382f',
        },
        brand: {
          50: '#F0F9F5',
          100: '#DCF3E9',
          200: '#B6E5D3',
          300: '#83D1B5',
          400: '#38A983',
          500: '#158064',
          600: '#0F624C',
          700: '#0B4D3C',
          800: '#083B2F',
          900: '#05271F',
          950: '#021813'
        }
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 3px -1px rgba(15, 23, 42, 0.04)',
        'nav': '0 -4px 20px -2px rgba(15, 23, 42, 0.06)',
        'btn-emerald': '0 4px 14px 0 rgba(15, 98, 76, 0.35)',
        'pill': '0 1px 2px rgba(0,0,0,0.04)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
};
export default config;
