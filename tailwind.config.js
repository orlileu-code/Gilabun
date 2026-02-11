/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        tabit: {
          bg: "#f4f5f7",
          panel: "#ffffff",
          "panel-2": "#fafbfc",
          border: "#d9dde3",
          text: "#1f2937",
          muted: "#6b7280",
          primary: "#2e7d32",
          "primary-2": "#43a047",
          orange: "#fb8c00",
          red: "#e53935"
        },
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#2e7d32",
          600: "#43a047"
        }
      }
    }
  },
  plugins: []
};

