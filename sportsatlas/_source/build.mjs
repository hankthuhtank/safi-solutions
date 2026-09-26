// Sports Atlas static build: node sportsatlas/_source/build.mjs
// Merges the original beginner-first content library with each sport's plan (periods, visuals, 2026 updates,
// corrections) and pre-renders crawlable HTML for every sport page plus the atlas home.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const original = JSON.parse(readFileSync(join(here, 'original-content.json'), 'utf8'));
const ORDER = ['football', 'baseball', 'basketball', 'soccer', 'volleyball', 'golf'];
const SITE = 'https://www.safisolutions.org/sportsatlas/';

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// light inline markup in plan text: **bold**
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

export const ICONS = {
  football: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.2 18.8c-2.6-2.6-1.3-8.4 2.9-12.6s10-5.5 12.6-2.9 1.3 8.4-2.9 12.6-10 5.5-12.6 2.9Z"/><path d="m9 15 6-6M10.5 10.5l3 3M12 9l3 3M9 12l3 3"/></svg>',
  baseball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6.2 5.2c2.3 2.6 2.3 11 0 13.6M17.8 5.2c-2.3 2.6-2.3 11 0 13.6"/></svg>',
  basketball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3.2 3.2 3.2 9.6 0 12.8M18.4 5.6c-3.2 3.2-3.2 9.6 0 12.8"/></svg>',
  soccer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m12 8 3.4 2.5-1.3 4h-4.2l-1.3-4L12 8ZM12 8V3.5M15.4 10.5l4.3-1.4M14.1 14.5l2.6 3.7M9.9 14.5l-2.6 3.7M8.6 10.5 4.3 9.1"/></svg>',
  volleyball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3c-1.5 4 0 7.5 3 9.5s6.2 1.6 6-0.5M12 12c-3.2 1.4-5.2 4.3-5.4 7.9M12 12c-2.8-2.1-6.3-2.5-9-1"/></svg>',
  golf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 20V3l9 4-9 4"/><ellipse cx="11" cy="20" rx="8" ry="2"/></svg>'
};
const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const FONTS = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,700;1,400&family=Big+Shoulders:opsz,wght@10..72,700..900&family=Martian+Mono:wght@400;600&display=swap';

function head({ title, desc, url, image, prefix }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#080b0a">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${prefix}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="${prefix}assets/css/atlas.css">
</head>`;
}
function topbar(active, prefix) {
  return `<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <!-- LOGO PLACEHOLDER — replace sportsatlas/assets/logo.svg with the final Sports Atlas logo (any aspect ratio; it is sized to 40px tall). -->
  <a class="brand" href="${prefix}" aria-label="Sports Atlas home"><img class="brand-logo" src="${prefix}assets/logo.svg" alt="Sports Atlas" width="168" height="40"></a>
  <nav class="sportnav" aria-label="Sports">${ORDER.map(k => `<a href="${prefix}${k}/"${k === active ? ' aria-current="page"' : ''}>${ICONS[k]}<span>${original[k].name}</span></a>`).join('')}</nav>
  <button class="searchbtn" type="button" data-open-search aria-label="Search this page">${SEARCH_ICON}<span class="lbl">Search</span><kbd>⌘K</kbd></button>
</header>`;
}
function palette(ph) {
  return `<div class="palette" role="dialog" aria-modal="true" aria-label="Search"><div class="palette-box"><input type="search" placeholder="${esc(ph)}" aria-label="Search terms and sections"><div class="palette-list" role="listbox"></div></div></div>`;
}
function footer(prefix) {
  return `<footer class="site-foot"><span>SPORTS ATLAS · A SAFI SOLUTIONS PROJECT · RULES CURRENT TO THE 2026 SEASON</span><span><a href="${prefix}">Atlas home</a> · <a href="https://www.safisolutions.org/">safisolutions.org</a></span></footer>`;
}

function vizBlock(v) {
  const [mod, name] = v.id.split('/');
  return `<figure class="viz" data-viz="${esc(v.id)}" id="viz-${mod}-${name}">
  <div class="viz-head"><h3>${esc(v.title)}</h3>${v.kicker ? `<span class="kicker">${esc(v.kicker)}</span>` : ''}</div>
  <div class="viz-body"><noscript><p class="empty on">This interactive visual needs JavaScript.</p></noscript></div>
  ${v.caption ? `<figcaption>${rich(v.caption)}</figcaption>` : ''}
</figure>`;
}
function termCards(rows, core) {
  return `<div class="terms">${rows.map(r => `<article class="term${core ? ' is-core' : ''}" id="t-${slug(r.term)}">${r.flag ? `<span class="flag">${esc(r.flag)}</span>` : ''}<h3>${esc(r.term)}</h3><p>${rich(r.desc)}</p></article>`).join('')}</div>`;
}
function table(t) {
  if (!t) return '';
  return `<div class="table-wrap"><table><thead><tr>${t.headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function section(sec, i, sport) {
  const per = sport.periods.find(p => p.id === sec.period);
  const blocks = [];
  for (const b of sec.blocks) {
    if (b.type === 'viz') blocks.push(vizBlock(b));
    if (b.type === 'terms') blocks.push((b.heading ? `<div class="lower-third"><b>${esc(b.heading)}</b><span>${esc(b.sub || '')}</span></div>` : '') + termCards(b.rows, sec.core));
    if (b.type === 'table') blocks.push((b.heading ? `<div class="lower-third"><b>${esc(b.heading)}</b><span>${esc(b.sub || '')}</span></div>` : '') + table(b.table));
    if (b.type === 'bullets') blocks.push((b.heading ? `<div class="lower-third"><b>${esc(b.heading)}</b><span>${esc(b.sub || '')}</span></div>` : '') + `<ul class="bullets">${b.items.map(x => `<li>${rich(x)}</li>`).join('')}</ul>`);
    if (b.type === 'steps') blocks.push((b.heading ? `<div class="lower-third"><b>${esc(b.heading)}</b><span>${esc(b.sub || '')}</span></div>` : '') + `<ol class="steps">${b.items.map(x => `<li><span>${rich(x)}</span></li>`).join('')}</ol>`);
    if (b.type === 'note') blocks.push(`<p class="note">${rich(b.text)}</p>`);
    if (b.type === 'html') blocks.push(b.html);
  }
  return `<section class="sec" id="${sec.id}" data-period="${sec.period}" aria-labelledby="${sec.id}-h">
  <header class="sec-head"><span class="sec-num" aria-hidden="true">${String(i).padStart(2, '0')}</span><div><p class="sec-period">${esc(per.code)} · ${esc(per.name)}</p><h2 id="${sec.id}-h">${esc(sec.title)}</h2>${sec.intro ? `<p class="sec-intro">${rich(sec.intro)}</p>` : ''}</div></header>
  ${blocks.join('\n  ')}
</section>`;
}

function sportPage(key, sport) {
  const prefix = '../';
  const url = SITE + key + '/';
  const conceptCount = sport.sections.reduce((a, s) => a + s.blocks.filter(b => b.type === 'terms').reduce((n, b) => n + b.rows.length, 0), 0);
  const vizCount = sport.sections.reduce((a, s) => a + s.blocks.filter(b => b.type === 'viz').length, 0);
  const gdata = {};
  for (const g of sport.glossary) gdata[g.term] = g.desc;
  for (const s of sport.sections) if (s.core) for (const b of s.blocks) if (b.type === 'terms') for (const r of b.rows) gdata[r.term] = r.desc;
  const toc = sport.periods.map(p => `<h2>${esc(p.code)} · ${esc(p.name)}</h2>` + sport.sections.map((s, i) => s.period === p.id ? `<a href="#${s.id}"><span>${String(i).padStart(2, '0')}</span>${esc(s.short || s.title)}</a>` : '').join('')).join('') + `<h2>Reference</h2><a href="#updates"><span>★</span>New for 2026</a><a href="#glossary"><span>A–Z</span>Glossary</a><a href="#sources"><span>§</span>Official sources</a>`;
  const others = ORDER.filter(k => k !== key);
  return `${head({ title: `${sport.name} — explained visually | Sports Atlas`, desc: sport.meta, url, image: `${SITE}assets/img/${key}-og.jpg`, prefix })}
<body data-sport="${key}">
${topbar(key, prefix)}
<main id="main">
<section class="hero" aria-labelledby="hero-title">
  <div class="hero-stage" data-field3d="${key}" style="background-image:url('${prefix}assets/img/${key}-hero.jpg')" role="img" aria-label="${esc(sport.heroAlt)}">
    <span class="hero-hint" aria-hidden="true">Drag to orbit · pinch to zoom</span>
  </div>
  <div class="hero-tools" aria-label="Camera views"></div>
  <div class="hero-inner">
    <div class="hero-copy">
      <p class="plate-no"><span>PLATE ${sport.plate}</span><em>${esc(sport.tagline)}</em></p>
      <h1 id="hero-title">${esc(sport.name)}</h1>
      <p class="lede">${rich(sport.lede)}</p>
      <div class="cta-row"><a class="btn btn-primary" href="#${sport.sections[0].id}">Start from zero ${ARROW}</a><a class="btn btn-ghost" href="#${sport.jump}">${esc(sport.jumpLabel)}</a></div>
    </div>
    <div class="scorebug" aria-label="Key facts">${sport.facts.map(([b, s]) => `<div><b>${esc(b)}</b><small>${esc(s)}</small></div>`).join('')}</div>
  </div>
</section>
<nav class="periodbar" aria-label="Your progress through ${esc(sport.name)}"><div class="periodbar-inner">${sport.periods.map(p => `<a class="period" href="#${sport.sections.find(s => s.period === p.id).id}" data-period="${p.id}"><span class="p-code">${esc(p.code)}</span><span class="p-name">${esc(p.name)}</span><span class="p-fill"><i></i></span></a>`).join('')}<span class="clock">READ <b>0/${sport.sections.length}</b></span></div></nav>
<div class="layout">
  <nav class="toc" aria-label="Sections">${toc}</nav>
  <div class="content">
${sport.sections.map((s, i) => section(s, i, sport)).join('\n')}
<section class="sec" id="updates" aria-labelledby="updates-h" data-no-jargon>
  <header class="sec-head"><span class="sec-num" aria-hidden="true">★</span><div><p class="sec-period">Rulebook watch</p><h2 id="updates-h">New for 2026</h2><p class="sec-intro">${rich(sport.updatesIntro)}</p></div></header>
  <div class="updates">${sport.updates.map(u => `<article class="update"><span class="when">${esc(u.when)}</span><div><h4>${esc(u.title)}</h4><p>${rich(u.text)}</p></div></article>`).join('')}</div>
</section>
<section class="sec" id="glossary" aria-labelledby="glossary-h" data-no-jargon>
  <header class="sec-head"><span class="sec-num" aria-hidden="true">A–Z</span><div><p class="sec-period">Reference</p><h2 id="glossary-h">${esc(sport.name)} glossary</h2><p class="sec-intro">Every term from this page in plain English. Dotted-underlined words anywhere above also explain themselves when you hover or tap them.</p></div></header>
  <div class="gloss-tools"><input class="gloss-search" type="search" placeholder="Filter ${sport.glossary.length} terms…" aria-label="Filter the glossary"><span class="gloss-count"></span></div>
  <dl class="gloss">${sport.glossary.slice().sort((a, b) => a.term.localeCompare(b.term)).map(g => `<div id="g-${slug(g.term)}"><dt>${esc(g.term)}</dt><dd>${rich(g.desc)}</dd></div>`).join('')}</dl>
  <p class="empty gloss-empty">No glossary term matches — try the ⌘K search for concepts.</p>
</section>
<section class="sec" id="sources" aria-labelledby="sources-h" data-no-jargon>
  <header class="sec-head"><span class="sec-num" aria-hidden="true">§</span><div><p class="sec-period">Reference</p><h2 id="sources-h">Official sources</h2><p class="sec-intro">Rules and dimensions on this page follow these documents. Video-game notes teach transferable logic rather than edition-specific tricks. Page stats: ${sport.sections.length} sections · ${conceptCount} explained concepts · ${vizCount} interactive visuals · ${sport.glossary.length} glossary terms.</p></div></header>
  <div class="sources">${sport.sources.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer"><b>${esc(t)}</b><span>${esc(u.replace(/^https?:\/\//, ''))}</span></a>`).join('')}</div>
  <div class="lower-third"><b>Next plate</b><span>Keep exploring the atlas</span></div>
  <div class="nextrail">${others.map(k => `<a href="${prefix}${k}/" style="background-image:url('${prefix}assets/img/${k}-card.jpg')"><span>PLATE ${plans[k].plate}</span><b>${original[k].name}</b></a>`).join('')}</div>
</section>
  </div>
</div>
</main>
${footer(prefix)}
${palette(`Search ${sport.name.toLowerCase()} terms, concepts and sections…`)}
<script type="application/json" id="glossary-data">${JSON.stringify(gdata).replace(/</g, '\\u003c')}</script>
<script type="module" src="${prefix}assets/js/atlas.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- plans
const plans = {};
const built = [];
for (const k of ORDER) { try { plans[k] = (await import(`./plans/${k}.mjs`)).default(original[k]); built.push(k); } catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; plans[k] = { name: original[k].name, plate: String(ORDER.indexOf(k) + 1).padStart(2, '0') }; } }

for (const k of built) {
  mkdirSync(join(root, k), { recursive: true });
  writeFileSync(join(root, k, 'index.html'), sportPage(k, plans[k]));
  console.log('wrote', k, plans[k].sections.length, 'sections');
}
// cross-sport search index for the ⌘K palette (fetched lazily; URLs are relative to the atlas root)
{
  const plainText = s => String(s ?? '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/<[^>]+>/g, '');
  const cut = s => { s = plainText(s); return s.length > 120 ? s.slice(0, 117).replace(/\s+\S*$/, '') + '…' : s; };
  const idx = [];
  for (const k of built) {
    const p = plans[k], seen = new Set();
    for (const s of p.sections) {
      idx.push({ s: k, k: 'Section', t: s.title, d: cut(s.intro), u: `${k}/#${s.id}` });
      for (const b of s.blocks) if (b.type === 'terms') for (const r of b.rows) { const key = r.term.toLowerCase(); if (seen.has(key)) continue; seen.add(key); idx.push({ s: k, k: 'Concept', t: r.term, d: cut(r.desc), u: `${k}/#t-${slug(r.term)}` }); }
    }
    for (const g of p.glossary) { const key = g.term.toLowerCase(); if (seen.has(key)) continue; seen.add(key); idx.push({ s: k, k: 'Glossary', t: g.term, d: cut(g.desc), u: `${k}/#g-${slug(g.term)}` }); }
  }
  writeFileSync(join(root, 'assets', 'atlas-index.json'), JSON.stringify(idx));
  console.log('wrote index', idx.length, 'entries');
}
try {
  const home = (await import('./home.mjs')).default;
  writeFileSync(join(root, 'index.html'), home({ plans, ORDER, head, topbar, footer, palette, esc, rich, ICONS, ARROW, SITE, original }));
  console.log('wrote home');
} catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
