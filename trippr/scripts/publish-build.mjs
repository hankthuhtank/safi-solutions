import { cp, readFile, rm } from "node:fs/promises";
import path from "node:path";

// GitHub Pages serves this folder as-is. Commit the compiled entry and assets.
const root = path.resolve(import.meta.dirname, "..");
await rm(path.join(root, "assets"), { recursive: true, force: true });
await rm(path.join(root, "fonts"), { recursive: true, force: true });
await rm(path.join(root, "data"), { recursive: true, force: true });
for (const name of ["index.html", "assets", "images", "maplibre", "fonts", "data", "favicon.svg", "favicon-mark.svg", "trippr-logo.webp", "trippr-mark.webp", "config.js"]) {
  await cp(path.join(root, "build", name), path.join(root, name), { recursive: true });
}
const html = await readFile(path.join(root, "index.html"), "utf8");
if (!html.includes('/trippr/assets/') || html.includes('/main.tsx')) {
  throw new Error("The published entry must reference compiled /trippr/ assets.");
}
console.log("Published compiled Trippr entry, map workers, images and assets into the project folder.");
