// Encodes processed scene photos into the files the app loads.
//
//   node scripts/build-media.mjs <maps-dir> [only-key ...]
//
// <maps-dir> holds one folder per variation (named scene__variation) produced by scene-maps.py:
// master.jpg (3840x2160), maps-a.png, maps-b.png, maps-c.png and stats.json.
// Writes media/scenes/<scene>/<variation>/ and refreshes media/scenes/manifest.json.

import { mkdir, readFile, readdir, writeFile, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "media", "scenes");
const [mapsDir, ...only] = process.argv.slice(2);
if (!mapsDir) throw new Error("usage: node scripts/build-media.mjs <maps-dir> [keys...]");

const AVIF = [
  [3840, 58],
  [2560, 56],
  [1600, 55],
];
const WEBP = [
  [2560, 80],
  [1600, 80],
];

// depth and semantic maps mean nothing for deep-space images: render them flat
const NO_MAPS = new Set(["observatory/cosmic-cliffs", "observatory/whirlpool", "observatory/westerlund"]);
const sources = JSON.parse(await readFile(path.join(root, "scripts", "media-sources.json"), "utf8"));

const manifestPath = path.join(out, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8").catch(() => "{}"));

const folders = (await readdir(mapsDir)).filter((f) => f.includes("__"));
for (const folder of folders) {
  const key = folder.replace("__", "/");
  if (only.length && !only.includes(key)) continue;
  const src = path.join(mapsDir, folder);
  const master = path.join(src, "master.jpg");
  try {
    await stat(master);
  } catch {
    continue;
  }
  if (key === "tokyo-cafe/reflection") {
    await mkdir(path.join(root, "media", "fx"), { recursive: true });
    await sharp(master)
      .resize(960, 540)
      .blur(18)
      .modulate({ brightness: 0.85 })
      .webp({ quality: 70 })
      .toFile(path.join(root, "media", "fx", "cafe-reflection.webp"));
    console.log("reflection layer written");
    continue;
  }
  const dest = path.join(out, key);
  await mkdir(dest, { recursive: true });
  const t0 = Date.now();
  for (const [w, q] of AVIF) {
    await sharp(master)
      .resize(w, Math.round((w * 9) / 16), { kernel: "lanczos3" })
      .avif({ quality: q, effort: 5 })
      .toFile(path.join(dest, `${w}.avif`));
  }
  for (const [w, q] of WEBP) {
    await sharp(master)
      .resize(w, Math.round((w * 9) / 16), { kernel: "lanczos3" })
      .webp({ quality: q, effort: 5 })
      .toFile(path.join(dest, `${w}.webp`));
  }
  await sharp(master).resize(640, 360, { kernel: "lanczos3" }).webp({ quality: 78 }).toFile(path.join(dest, "thumb.webp"));
  const lqip = await sharp(master).resize(32, 18).jpeg({ quality: 60 }).toBuffer();
  let maps = !NO_MAPS.has(key);
  for (const m of maps ? ["maps-a", "maps-b", "maps-c"] : []) {
    try {
      await sharp(path.join(src, `${m}.png`)).png({ compressionLevel: 9, effort: 10 }).toFile(path.join(dest, `${m}.png`));
    } catch {
      maps = false;
    }
  }
  const stats = JSON.parse(await readFile(path.join(src, "stats.json"), "utf8").catch(() => "{}"));
  manifest[key] = {
    kind: "photo",
    place: sources[key]?.place ?? null,
    widths: AVIF.map(([w]) => w),
    maps,
    glass: (stats.coverage?.glass ?? 0) > 0.02,
    aspect: 16 / 9,
    lqip: `data:image/jpeg;base64,${lqip.toString("base64")}`,
    stats: {
      coverage: stats.coverage,
      skyColor: stats.skyColor,
      horizonColor: stats.horizonColor,
      farColor: stats.farColor,
      luma: stats.luma,
    },
  };
  console.log(`${key}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await writeFile(manifestPath, JSON.stringify(sortKeys(manifest), null, 1));
}
// video loops (built by build-video.sh): register whatever is on disk
for (const scene of await readdir(out)) {
  const sdir = path.join(out, scene);
  if (!(await stat(sdir)).isDirectory()) continue;
  for (const v of await readdir(sdir)) {
    const dir = path.join(sdir, v);
    const key = `${scene}/${v}`;
    const has = async (f) => stat(path.join(dir, f)).then(() => true, () => false);
    if (!(await has("loop-av1.mp4")) || !(await has("loop-hevc.mp4")) || !(await has("poster.webp"))) continue;
    const probe = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join(dir, "loop-av1.mp4")])
      .toString()
      .trim()
      .split(",")
      .map(Number);
    const lqip = await sharp(path.join(dir, "poster.webp")).resize(32, 18).jpeg({ quality: 60 }).toBuffer();
    manifest[key] = {
      kind: "video",
      place: sources[key]?.place ?? null,
      widths: [],
      maps: false,
      glass: false,
      aspect: probe[0] / probe[1],
      lqip: `data:image/jpeg;base64,${lqip.toString("base64")}`,
      video: { av1: "loop-av1.mp4", hevc: "loop-hevc.mp4", width: probe[0], height: probe[1] },
    };
  }
}
await writeFile(manifestPath, JSON.stringify(sortKeys(manifest), null, 1));

function sortKeys(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
}
