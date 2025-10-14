/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        darkbg: "#0F1014",
        lightbg: "#F6F6F8",
        sidebarLight: "#F8F9FB",
        sidebarDark: "#131419",
      },
    },
  },
  plugins: [],
};
