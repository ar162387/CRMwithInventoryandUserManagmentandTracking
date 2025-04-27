const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'media', // or 'class'
  theme: {
    extend: {
      fontFamily: {
        primary: ['Inter', ...fontFamily.sans],
      },
      colors: {
        primary: {
          400: '#00E0F3',
          500: '#00c4fd',
        },
        dark: '#333333',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
