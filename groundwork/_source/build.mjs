// Groundwork page builder. Writes every page from one shell so the header, footer and meta stay identical.
//   node groundwork/_source/build.mjs
// Edit the page bodies in _source/pages/*.mjs, never the generated index.html files.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const SITE = "https://www.safisolutions.org";
const hash = (f) =>
  crypto
    .createHash("sha1")
    .update(fs.readFileSync(path.join(root, f)))
    .digest("hex")
    .slice(0, 8);
const V_CSS = hash("css/groundwork.css");

const ICON = {
  bar: '<path d="M3 8.5h12v2.5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M15 9.8h6"/><path d="M7.5 15v3.5M10.5 15v3.5"/><path d="M5 5.5h8"/>',
  menu: '<path d="M4 9.5h13v3.5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8.5 3c-1 1.5 1 2.5 0 4M12.5 3c-1 1.5 1 2.5 0 4"/>',
  beans:
    '<ellipse cx="12" cy="12" rx="6.2" ry="8.8" transform="rotate(35 12 12)"/><path d="M8.3 17.2c3.2-2.2 1.2-6.8 7.4-10.4"/>',
  brew: '<path d="M4.5 5.5h15l-5.2 9h-4.6z"/><path d="M10 14.5v2.2h4v-2.2"/><path d="M5 20h14"/><path d="M8 5.5 7 3.5M16 5.5l1-2"/>',
  recipes:
    '<path d="M5.5 3h13v18l-2.2-1.4-2.1 1.4-2.2-1.4-2.2 1.4-2.1-1.4-2.2 1.4z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
};
const NAV = [
  ["bar", "Bar", "/groundwork/"],
  ["menu", "Menu", "/groundwork/menu/"],
  ["beans", "Beans", "/groundwork/beans/"],
  ["brew", "Brew", "/groundwork/brew/"],
  ["recipes", "Recipes", "/groundwork/recipes/"],
];

function shell(p) {
  const url = SITE + p.url;
  const title =
    p.id === "bar" ? "Groundwork | Coffee, from the ground up" : `${p.title} | Groundwork`;
  const nav = NAV.map(
    ([id, label, href]) =>
      `<a href="${href}"${id === p.id ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[id]}</svg>${label}</a>`,
  ).join("");
  const v = p.script ? hash("js/" + p.script) : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f5eee2">
<title>${title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Safi Solutions">
<meta property="og:image" content="https://www.safisolutions.org/groundwork/media/og.jpg" />
<meta property="og:image:secure_url" content="https://www.safisolutions.org/groundwork/media/og.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Groundwork logo" />
<meta name="twitter:image" content="https://www.safisolutions.org/groundwork/media/og.jpg" />
<meta name="twitter:image:alt" content="Groundwork logo" />

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${p.desc}">

<link rel="icon" href="/groundwork/media/favicon-64.png" type="image/png">
<link rel="apple-touch-icon" href="/groundwork/media/apple-touch-icon.png">
<link rel="manifest" href="/groundwork/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:ital,wght@0,400..700;1,400..700&family=Martian+Mono:wght@300..650&family=Young+Serif&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/groundwork/css/groundwork.css?v=${V_CSS}">
</head>
<body class="gw page-${p.id}">
<a class="skip" href="#main">Skip to content</a>
<header class="gw-top">
  <a class="gw-brand" href="/groundwork/" aria-label="Groundwork home"><img src="/groundwork/media/logo.webp" alt="Groundwork" width="1199" height="221"></a>
  <nav class="gw-nav" aria-label="Groundwork">${nav}</nav>
  <button class="gw-sound" type="button" aria-pressed="true" aria-label="Sound"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path class="wave" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="x" d="M16 9.5l5 5M21 9.5l-5 5"/></svg><span>Sound</span></button>
</header>
<main id="main" tabindex="-1">
${p.body.trim()}
</main>
<aside class="cafe-radio" aria-label="Café music">
  <div class="radio-row"><span class="radio-name">♫ Café radio</span><button type="button" id="musicPlay" aria-pressed="false" aria-label="Play café music">Play</button><button type="button" id="musicNext" aria-label="Next music track">Next →</button><details class="radio-details"><summary aria-label="Music settings">Settings</summary><div class="radio-settings"><label>Music style<select id="musicStyle"><option value="jazzcafe">Café jazz</option><option value="lofi">Lo-fi</option></select></label><label>Volume<input id="musicVolume" type="range" min="0" max="100" value="25"></label><p id="musicCredit">From Vibey’s licensed music collection.</p></div></details></div>
  <p class="radio-status" id="musicStatus" role="status">A little coffee-shop atmosphere.</p>
</aside>
<footer class="gw-foot">
  <div class="gw-foot-in">
    <p class="big">Coffee, from<br>the ground up.</p>
    <nav aria-label="Groundwork footer"><a href="/groundwork/">Bar</a><a href="/groundwork/menu/">Menu</a><a href="/groundwork/beans/">Beans</a><a href="/groundwork/brew/">Brew</a><a href="/groundwork/recipes/">Recipes</a><a href="/groundwork/sources/">Sources</a><a href="/projects/#groundwork">About</a><a href="/">Safi Solutions</a></nav>
    <small>Groundwork is a Safi Solutions project. Brewing guides and references from USDA, NCA, SCA and the other <a href="/groundwork/sources/">sources</a>. Every coffee and every machine is a little different: use these as starting points, then trust your taste.</small>
  </div>
</footer>
<script type="module" src="/groundwork/js/music.js?v=${hash("js/music.js")}"></script>
${p.script ? `<script type="module" src="/groundwork/js/${p.script}?v=${v}"></script>` : '<script type="module">import { initChrome } from "/groundwork/js/core.js"; initChrome();</script>'}
</body>
</html>
`;
}

const pagesDir = path.join(here, "pages");
const files = fs
  .readdirSync(pagesDir)
  .filter((f) => f.endsWith(".mjs"))
  .sort();
for (const f of files) {
  const p = (await import(pathToFileURL(path.join(pagesDir, f)).href)).default;
  const out = path.join(root, p.url.replace(/^\/groundwork\/?/, ""), "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, shell(p));
  console.log("wrote", path.relative(root, out));
}
