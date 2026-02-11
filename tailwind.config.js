/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Brown: 50–300 = neutral grays (no yellow/cream); 400–900 = chocolate brown
        brown: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#5C4033",
          500: "#4A3528",
          600: "#3D2C22",
          700: "#332619",
          800: "#2D2119",
          900: "#1A1814",
        },
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

