import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/thewell/",
  plugins: [
    tailwindcss(),
    viteReact(),
    {
      name: "dev-entry",
      transformIndexHtml(html, ctx) {
        if (!ctx.server) return html;
        return html
          .replace("/thewell/app.js", "/src/main.tsx")
          .replace(/<link rel="stylesheet"[^>]*href="\/thewell\/app\.css"[^>]*>/, "");
      },
    },
  ],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "src") },
  },
  publicDir: false,
  server: { port: 5173 },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "app.js",
        assetFileNames: (info) => {
          const name = (info.names?.[0] ?? info.name ?? "") as string;
          if (name.endsWith(".css")) return "app.css";
          return "[name][extname]";
        },
      },
    },
  },
});
