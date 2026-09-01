/** @type {import('tailwindcss').Config} */
module.exports = {
  // Files Tailwind scans for className usage. If a file is not
  // listed here, its classes will be stripped out as "unused".
    content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  // Required: teaches Tailwind about React Native's limitations
  // (no hover, no float, different box model).
  presets: [require('nativewind/preset')],

  theme: {
    extend: {
      colors: {
        // LeafScan AI palette - agricultural greens
        leaf: {
          50: '#f0f9f0',
          100: '#dcf0dc',
          200: '#bbe1bb',
          300: '#8ccb8c',
          400: '#5aad5a',
          500: '#379137',
          600: '#2a752c',
          700: '#235d25',
          800: '#1f4a21',
          900: '#1a3e1d',
        },
        // Risk level colors, used on the Detection Result screen
        risk: {
          none: '#22c55e',
          low: '#84cc16',
          moderate: '#f59e0b',
          high: '#dc2626',
        },
      },
    },
  },

  plugins: [],
};