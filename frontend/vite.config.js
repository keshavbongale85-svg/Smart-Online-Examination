import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:5000";

// Proxy /api and /uploads to the Express backend during development
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": { target: proxyTarget, changeOrigin: true },
      "/uploads": { target: proxyTarget, changeOrigin: true },
      "/socket.io": {
        target: proxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
