#!/usr/bin/env node
/* Dependency-free repository integrity checks for TradeSchool. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
/* V15: validate the SAME stack index.html loads, in the same order. Validating
   only the base four gave false failures for assets the later media layer had
   already remapped, and would have missed anything the later layers break. */
const LOAD_ORDER = [
  'js/content/base-data.js',
  'js/content/electrical.js',
  'js/content/hvac-plumbing.js',
  'js/content/industrial-welding-construction.js',
  'js/content/v8-overrides.js',
  'js/content/v10-visuals.js',
  'js/content/v14-media-fill.js',
  'js/content/v15-media.js',
  'js/content/v15-currency.js',
  'js/content/v15-deboilerplate.js',
  'js/content/v16-beginner.js',
  'js/content/v16-context.js',
  'js/content/v18-media.js',
  'js/3d/rig-index.js'
];
context.console = { log(){}, warn(){}, error(){} };
for (const rel of LOAD_ORDER) {
  vm.runInContext(fs.readFileSync(path.join(root, rel), 'utf8'), context, { filename: rel });
}

const D = context.window.TRADE_DATA;
const concepts = D.concepts || [];
const ids = new Set();
const problems = [];
for (const c of concepts) {
  if (!c.id) problems.push('Concept missing id');
  else if (ids.has(c.id)) problems.push(`Duplicate concept id: ${c.id}`);
  else ids.add(c.id);
}
for (const c of concepts) {
  for (const r of c.related || []) if (!ids.has(r)) problems.push(`Broken related link: ${c.id} -> ${r}`);
}
for (const [id, asset] of Object.entries(D.visualAssets || {})) {
  if (!asset?.src || /^https?:/.test(asset.src)) continue;
  if (!fs.existsSync(path.join(root, asset.src))) problems.push(`Missing visual asset for ${id}: ${asset.src}`);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const rel of LOAD_ORDER) {
  if (!html.includes(rel)) problems.push(`index.html does not load ${rel} (validator and page would disagree)`);
}
/* V18: every trade model, every unit still, and every placed topic must line up */
const RIG = context.window.TRADE_RIG;
if (!RIG) problems.push('js/3d/rig-index.js did not define TRADE_RIG (run tools/build-rig-index.mjs)');
else {
  for (const [cid, [w]] of Object.entries(RIG.parts)) if (!ids.has(cid)) problems.push(`3D part points at unknown topic: ${cid} (${w})`);
  for (const w of D.worlds.map(x => x.id)) {
    if (!RIG.models[w]) { problems.push(`No 3D model for trade: ${w}`); continue; }
    if (!fs.existsSync(path.join(root, `assets/renders/${w}.webp`))) problems.push(`Missing model still: assets/renders/${w}.webp`);
    for (const cat of (D.worldCategories || {})[w] || []) {
      if (!RIG.models[w].systems[cat.id]) problems.push(`Unit ${w}/${cat.id} has no system on the 3D model`);
      if (!fs.existsSync(path.join(root, `assets/renders/${w}--${cat.id}.webp`))) problems.push(`Missing unit still: assets/renders/${w}--${cat.id}.webp`);
    }
  }
  for (const [w, m] of Object.entries(D.worldMedia || {})) if (!fs.existsSync(path.join(root, m.image))) problems.push(`Missing trade hero: ${m.image}`);
}
for (const rel of ['js/3d/engine.js', 'js/3d/kit.js', 'js/core/rig-ui.js', 'css/rig.css', 'css/v18.css']) {
  if (!fs.existsSync(path.join(root, rel))) problems.push(`Missing V18 file: ${rel}`);
}
if (/<script[^>]*v13-modernity\.js/.test(html)) problems.push('v13-modernity.js is loaded again: it writes to c.deep.*, which nothing renders');

const app = fs.readFileSync(path.join(root, 'js/core/app.js'), 'utf8');
for (const m of app.matchAll(/assets\/(?:hero|reference)\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp)/g)) {
  if (!fs.existsSync(path.join(root, m[0]))) problems.push(`Missing UI asset: ${m[0]}`);
}

if (problems.length) {
  console.error(`TradeSchool validation failed (${problems.length}):`);
  for (const p of problems) console.error(' -', p);
  process.exit(1);
}
const counts = {};
for (const c of concepts) counts[c.world || 'electrical'] = (counts[c.world || 'electrical'] || 0) + 1;
console.log('TradeSchool validation passed.');
console.log(`Concepts: ${concepts.length}`);
console.log(counts);
