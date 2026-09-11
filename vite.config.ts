import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/link": path.resolve(__dirname, "./src/lib/router.tsx"),
      "next/navigation": path.resolve(__dirname, "./src/lib/router.tsx"),
      "next/image": path.resolve(__dirname, "./src/lib/router.tsx"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
