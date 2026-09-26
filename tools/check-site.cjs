// Safi Solutions — site check. Run from the repository root:  node tools/check-site.cjs
// 1. Every local link, script, stylesheet and image referenced by an HTML page exists.
// 2. Every URL in sitemap.xml exists.
// 3. Guardrails: contact/support forms, checkout switch, licensing language, mobile breakpoints, key assets.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const problems = [];
const fail = msg => problems.push(msg);

// ---------------------------------------------------------------- collect pages
const SKIP = new Set(['node_modules', 'src', '_source', '.git', 'docs']);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const pages = walk(root);

// ---------------------------------------------------------------- 1. local references resolve
function resolveLocal(fromFile, ref) {
  let clean = ref.split('#')[0].split('?')[0];
  if (!clean) return null;
  try { clean = decodeURI(clean); } catch (e) { /* keep as is */ }
  const abs = clean.startsWith('/') ? path.join(root, clean) : path.join(path.dirname(fromFile), clean);
  if (clean.endsWith('/')) return path.join(abs, 'index.html');
  return abs;
}
let refs = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, m => (/\bsrc=/.test(m.slice(0, m.indexOf('>'))) ? m.slice(0, m.indexOf('>') + 1) : ''));
  for (const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const ref = m[1].trim();
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|\{|\$)/i.test(ref) || ref.includes('${')) continue;
    const target = resolveLocal(file, ref); if (!target) continue;
    refs++;
    if (!fs.existsSync(target) && !(fs.existsSync(target.replace(/index\.html$/, '')) && fs.statSync(target.replace(/index\.html$/, '')).isFile())) {
      // /thewell/* deep links are served by the app via 404.html
      if (/[\\/]thewell[\\/]./.test(path.relative(root, target)) && !/\.(js|css|svg|png|jpg|webp)$/.test(target)) continue;
      fail(`missing: ${path.relative(root, file)} → ${ref}`);
    }
  }
}

// ---------------------------------------------------------------- 2. sitemap
for (const m of read('sitemap.xml').matchAll(/<loc>https:\/\/www\.safisolutions\.org([^<]*)<\/loc>/g)) {
  const u = m[1], p = path.join(root, u.endsWith('/') ? u + 'index.html' : u);
  if (!fs.existsSync(p)) fail(`sitemap URL has no page: ${u}`);
}

// ---------------------------------------------------------------- 3. guardrails
const must = (cond, msg) => { if (!cond) fail(msg); };
const home = read('index.html');
must(/formsubmit\.co\/safihelal@gmail\.com/.test(home), 'home contact form must post to FormSubmit');
must(/formsubmit\.co\/safihelal@gmail\.com/.test(read('support.html')), 'support form must post to FormSubmit');
must(/\/assets\/threads\.js/.test(home), 'home must load the hero threads');
const launch = read('LAUNCH_SWITCH.js');
must(/salesEnabled:\s*(true|false)/.test(launch) && /pricingMode:\s*"(launch|regular)"/.test(launch), 'LAUNCH_SWITCH.js must define salesEnabled and pricingMode');
for (const p of ['kwezeen', 'doqcorp', 'padeff', 'piktoor', 'brandur', 'doqdesk']) {
  const page = read(`products/${p}.html`);
  must(/LAUNCH_SWITCH\.js/.test(page) && /store\.js/.test(page), `products/${p}.html must load the store scripts`);
}
const terms = read('terms.html');
must(/use, copy, modify, redistribute(,)? (or|and) resell/i.test(terms), 'terms: open/shareable licence wording');
must(!/may not resell|may not.*redistribut/i.test(terms), 'terms: must not forbid resale/redistribution');
const siteCss = read('assets/site.css');
for (const bp of ['max-width: 1180px', 'max-width: 999px', 'max-width: 640px']) must(siteCss.includes(bp), `site.css missing breakpoint ${bp}`);
for (const p of ['assets/images/logo-lockup.png', 'assets/images/logo-mark.png', 'assets/images/og.jpg', 'assets/project-logos/sportsatlas.svg', 'assets/vendor/three.min.js', 'assets/vendor/leaflet/leaflet.js']) must(fs.existsSync(path.join(root, p)), `missing asset ${p}`);
must(/\/thewell\//.test(read('404.html')), '404.html must hand /thewell/* deep links back to the app');

// ---------------------------------------------------------------- report
console.log(`Checked ${pages.length} pages and ${refs} local references.`);
if (problems.length) { console.log(`\n${problems.length} problem(s):`); problems.forEach(p => console.log(' - ' + p)); process.exitCode = 1; }
else console.log('All good.');
