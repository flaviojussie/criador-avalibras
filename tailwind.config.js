/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens do projeto
        'surface-primary': '#1e1e1e',
        'surface-secondary': '#252526',
        'surface-tertiary': '#2d2d2d',
        'surface-quaternary': '#37373d',
        'border-color': '#444444',
        'text-primary': '#cccccc',
        'text-secondary': '#9ca3af',
        'text-tertiary': '#858585',
        'accent-primary': '#0e639c',
        'accent-primary-hover': '#1177bb',
        'statusbar-bg': '#007acc',
        'statusbar-border': '#005a9e',
        'error': '#dc2626',
        'error-hover': '#b91c1c',
      },
    },
  },
  plugins: [],
}

