import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import path from "node:path";

export default defineConfig({
  root: "_source",
  base: "/trippr/",
  publicDir: "../public",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "_source") } },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: "../build", emptyOutDir: true, chunkSizeWarningLimit: 1500 },
});
