import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist", // 🔥 AQUÍ ESTÁ LA CLAVE
  },
});
