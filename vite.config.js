import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

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

  build: {
    outDir: "build",
    emptyOutDir: true,
    assetsDir: "static",

    rollupOptions: {
      output: {
        // 🔹 Controlled chunking
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "vendor-react";
            if (id.includes("chart")) return "vendor-charts";
            if (id.includes("lodash")) return "vendor-lodash";
            return "vendor";
          }
        },

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

    // 🔹 Warn when chunks are too big
    chunkSizeWarningLimit: 500, // KB
  },
});
