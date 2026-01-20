import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // 🔹 Dev-only config (unchanged)
  server: {
    proxy: {
      "/api": {
        target: "https://uat-core-api.algorooms.com",
        changeOrigin: true,
        secure: true,
      },
      "/backtest": {
        target: "https://backtest.algorooms.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },

  // 🔹 IMPORTANT: build output must match CRA
  build: {
    outDir: "build",
    emptyOutDir: true,

    assetsDir: "static",

    rollupOptions: {
      output: {
        entryFileNames: "static/js/[name].[hash].js",
        chunkFileNames: "static/js/[name].[hash].js",

        assetFileNames: ({ name }) => {
          if (name && name.endsWith(".css")) {
            return "static/css/[name].[hash][extname]";
          }
          return "static/media/[name].[hash][extname]";
        },
      },
    },
  },
});
