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
      // Proxy for backtest service to avoid CORS in dev
      "/backtest": {
        target: "https://backtest.algorooms.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
