/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#221d18',
          container: '#38322c',
          fixed: '#ece1d8',
          'fixed-dim': '#cfc5bc',
        },
        secondary: {
          DEFAULT: '#526168',
          container: '#d2e2ea',
        },
        tertiary: {
          DEFAULT: '#2f1900',
          container: '#4c2c00',
        },
        surface: {
          DEFAULT: '#fdf8f7',
          dim: '#ddd9d7',
          bright: '#fdf8f7',
          variant: '#e6e1e0',
          'container-lowest': '#ffffff',
          'container-low': '#f7f3f1',
          container: '#f2edeb',
          'container-high': '#ece7e6',
          'container-highest': '#e6e1e0',
        },
        outline: {
          DEFAULT: '#7e766e',
          variant: '#cfc5bc',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#a39a92',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#56656c',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#c79152',
        'on-surface': '#1c1b1b',
        'on-surface-variant': '#4c463f',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        'on-background': '#1c1b1b',
        'inverse-surface': '#32302f',
        'inverse-on-surface': '#f5f0ee',
        'inverse-primary': '#cfc5bc',
        // App-specific tokens
        'app-bg': '#D8CFC0',
        'card-bg': '#E2DACF',
        'accent-amber': '#c79152',
      },
    },
  },
  plugins: [],
};
