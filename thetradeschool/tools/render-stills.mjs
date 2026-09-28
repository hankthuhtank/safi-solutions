/* Renders WebP stills of every trade model and every course unit from the live 3D engine.
   Used for the course-outline thumbnails, trade cards, lab headers and as the no-WebGL fallback.
     1. serve the repo root:   npx http-server -p 8080 -c-1 .
     2. run:                    node thetradeschool/tools/render-stills.mjs
   Needs Playwright (npm i -D playwright, or a global install). Writes thetradeschool/assets/renders/. */
import { createRequire } from 'module';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
// a project install or a global one (NODE_PATH) both work
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
const OUT = join(here, '../assets/renders');
const BASE = process.env.BASE || 'http://localhost:8080';
const only = process.argv[2];
mkdirSync(OUT, { recursive: true });
// read the unit ids straight from the generated rig index
const idx = JSON.parse(readFileSync(join(here, '../js/3d/rig-index.js'), 'utf8').replace(/^[\s\S]*?window\.TRADE_RIG=/, '').replace(/;\s*$/, ''));

const jobs = [];
for (const [w, m] of Object.entries(idx.models)) {
  if (only && only !== w) continue;
  jobs.push({ file: `${w}.webp`, w: 1200, h: 750, qs: `model=${w}`, q: 0.8 });
  for (const sys of Object.keys(m.systems)) jobs.push({ file: `${w}--${sys}.webp`, w: 560, h: 350, qs: `model=${w}&focus=${sys}`, q: 0.72 });
}
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
for (const j of jobs) {
  await page.setViewportSize({ width: j.w, height: j.h });
  await page.goto(`${BASE}/thetradeschool/tools/rig-lab.html?capture=1&labels=0&${j.qs}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 90000 });
  await page.waitForTimeout(600);
  const data = await page.evaluate(q => { window.__stage.renderOnce(); return window.__stage.canvas.toDataURL('image/webp', q); }, j.q);
  writeFileSync(join(OUT, j.file), Buffer.from(data.split(',')[1], 'base64'));
  console.log('wrote', j.file);
}
await browser.close();
