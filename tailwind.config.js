/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff8ff",
          100: "#dbeffe",
          500: "#1d7fcc",
          600: "#0b68b3",
          700: "#07518e",
          900: "#0b3157",
        },
        ink: "#172033",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 45, 80, 0.12)",
      },
    },
  },
  plugins: [],
};
