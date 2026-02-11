/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Brown: 50–300 = light brown/tan; 400–900 = chocolate brown
        brown: {
          50: "#F7F4F0",
          100: "#EDE7E0",
          200: "#E0D6CC",
          300: "#C9B8A8",
          400: "#8B6F47",
          500: "#6B5344",
          600: "#5C4033",
          700: "#4A3528",
          800: "#3D2C22",
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

