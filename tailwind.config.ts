import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#1a3a5c',
          600: '#14304f',
          700: '#0e2642',
          800: '#091c33',
          900: '#051224',
        },
        gold: {
          100: '#fdf3d7',
          300: '#f5d98a',
          400: '#f0c84a',
          500: '#d4a017',
          600: '#b8880e',
          700: '#9a7010',
        },
        cream: '#f9f6f0',
      },
      fontFamily: {
        vazir: ['Vazirmatn', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
