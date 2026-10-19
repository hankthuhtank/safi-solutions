import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";

// Media lives once, in vibey/media/, and is served from there in production.
// In development this middleware serves the same folder so nothing is copied or duplicated.
function serveMedia(): Plugin {
  const root = path.resolve(import.meta.dirname, "media");
  const types: Record<string, string> = {
    ".avif": "image/avif",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".json": "application/json",
    ".svg": "image/svg+xml",
  };
  return {
    name: "vibey-media",
    configureServer(server) {
      server.middlewares.use("/vibey/favicon.svg", (_req, res) => {
        res.writeHead(200, { "Content-Type": "image/svg+xml" });
        createReadStream(path.resolve(import.meta.dirname, "favicon.svg")).pipe(res);
      });
      server.middlewares.use("/vibey/media", (req, res, next) => {
        const file = path.join(root, decodeURIComponent((req.url ?? "/").split("?")[0]));
        if (!file.startsWith(root)) return next();
        let size: number;
        try {
          size = statSync(file).size;
        } catch {
          return next();
        }
        const type = types[path.extname(file)] ?? "application/octet-stream";
        const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
        if (range) {
          const start = range[1] ? Number(range[1]) : 0;
          const end = range[2] ? Number(range[2]) : size - 1;
          res.writeHead(206, {
            "Content-Type": type,
            "Content-Range": `bytes ${start}-${end}/${size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": end - start + 1,
          });
          createReadStream(file, { start, end }).pipe(res);
          return;
        }
        res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  root: "_source",
  base: "/vibey/",
  publicDir: false,
  plugins: [react(), serveMedia()],
  build: { outDir: "../build", emptyOutDir: true, assetsDir: "assets", chunkSizeWarningLimit: 900 },
  // the manifests imported from ../media and ../scripts sit outside the Vite root
  server: { port: 5178, fs: { allow: [import.meta.dirname] } },
});
