import { cp, readFile, rm } from "node:fs/promises";
import path from "node:path";

// GitHub Pages serves vibey/ as-is: copy the compiled entry and hashed assets next to media/.
const root = path.resolve(import.meta.dirname, "..");
await rm(path.join(root, "assets"), { recursive: true, force: true });
for (const name of ["index.html", "assets"]) {
  await cp(path.join(root, "build", name), path.join(root, name), { recursive: true });
}
const html = await readFile(path.join(root, "index.html"), "utf8");
if (!html.includes("/vibey/assets/") || html.includes("/src/main.tsx")) {
  throw new Error("The published entry must reference compiled /vibey/assets/ files.");
}
console.log("Published the compiled Vibey entry and assets into the project folder.");
