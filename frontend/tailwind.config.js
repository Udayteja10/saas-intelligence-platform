/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#05060A",
          900: "#0B0D19",
          800: "#13162B",
          700: "#1E2243",
          600: "#2B305C",
          500: "#3D447F",
        },
        brand: {
          blue: "#2563EB",
          indigo: "#4F46E5",
          cyan: "#06B6D4",
          purple: "#9333EA",
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
