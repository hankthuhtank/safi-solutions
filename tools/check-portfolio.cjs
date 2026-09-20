const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));

const html = read('index.html');
const terms = read('terms.html');
const launch = read('LAUNCH_SWITCH.js');
const projects = read('assets/projects.js');
const studio = read('assets/studio.js');
const productsCss = read('assets/products.css');
const studioCss = read('assets/studio.css');

// Launch / checkout guardrails.
assert.match(launch, /salesEnabled:\s*false/);
assert.match(launch, /launchPricing:\s*true/);
assert.match(html, /LAUNCH_SWITCH\.js/);
assert.match(html, /assets\/store-config\.js/);
assert.match(html, /assets\/store\.js/);

// Customer contact destinations.
assert.match(html, /formsubmit\.co\/safihelal@gmail\.com/);
assert.match(read('support.html'), /formsubmit\.co\/safihelal@gmail\.com/);

// Requested website / sidebar presentation.
assert.match(html, /assets\/website-logos\/baker-precision\.png/);
for (const [n, name, id] of [
  ['09','Vellum','vellum'],['10','The Well','thewell'],['11','MotorAtlas','motoratlas'],['12','The Bench','thebench']
]) {
  const re = new RegExp(`data-project-link="${id}"[^>]*href="#${id}"[^>]*><span>${n}<\\/span>${name}`);
  assert.match(html, re);
}
assert.doesNotMatch(html, /motion-toggle|Motion on|Motion off/);
assert.doesNotMatch(studio, /motion-toggle|safi-cabinet-motion/);

// Permissive post-purchase software rights + original-purchaser support distinction.
assert.match(terms, /use, copy, modify, redistribute, or resell/i);
assert.match(terms, /original SafiSolutions purchaser/i);
assert.doesNotMatch(terms, /may not resell|may not.*redistribut/i);

// Mobile breakpoints present in the primary style sheets.
assert.match(studioCss, /@media\(max-width:520px\)/);
assert.match(productsCss, /@media\(max-width:420px\)/);
assert.match(productsCss, /@media\(max-width:600px\)/);

// Critical local files.
for (const p of [
  'assets/website-logos/baker-precision.png',
  'assets/images/logo.png',
  'assets/images/logo-lockup.png',
  'assets/products/padeff-1.webp',
  'assets/products/piktoor-1.webp',
  'assets/products/kwezeen-1.webp',
  'assets/products/doqcorp-1.webp',
  'assets/products/brandur-1.webp',
  'deploy/cloudflare/worker.js',
  'deploy/cloudflare/wrangler.toml.example',
  'docs/launch-checklist.md',
  'docs/fulfillment.md',
  'docs/security.md'
]) assert.ok(exists(p), `Missing ${p}`);

// No stale duplicate launch docs in repository root.
for (const p of [
  'CUSTOMER_SUPPORT_AND_UPDATES.md','FULFILLMENT_SETUP.md','LAUNCH_CHECKLIST.md',
  'PRESENTATION_FIXES.md','PRESENTATION_NOTES.md','PRODUCT_CHECKOUT_SETUP.md',
  'RELEASE_PROCESS.md','SECURITY.md'
]) assert.ok(!exists(p), `Stale root file should be removed: ${p}`);

console.log('PASS: launch switch, contact routing, licensing, sidebar, Baker logo, mobile breakpoints, critical files, and repository cleanup.');
