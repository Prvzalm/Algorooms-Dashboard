/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Custom responsive breakpoints mapped to requested device ranges
      screens: {
        xs: { max: "360px" }, // Extra Small phones
        smm: { min: "361px", max: "480px" }, // Small mobile standard
        mdp: { min: "600px", max: "768px" }, // Tablet portrait
        lgt: { min: "768px", max: "1024px" }, // Tablet / small desktop
        laptop: { min: "1024px", max: "1280px" }, // Extra large / laptops
        desktop: { min: "1280px", max: "1536px" }, // 2XL large desktop
        ultrawide: { min: "1921px" }, // Ultra wide / 4K monitors
      },
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
