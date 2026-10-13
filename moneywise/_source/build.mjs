// Moneywise: builds every page from _source/pages/*.mjs inside one shared shell.
// Run from the repository root:  node moneywise/_source/build.mjs
// It runs the math tests first and refuses to build if any fail; the result is printed on the Sources page.
// Today's numbers come from data/rates-snapshot.json (refresh with tools/refresh-snapshot.mjs) and are printed
// into the HTML, so pages read correctly before any script runs; js/live.js swaps in live numbers when it can.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { latest, latestDate, esc } from '../js/ratesview.js';
import { asOf } from '../js/format.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MW = path.resolve(HERE, '..');
const read = p => fs.readFileSync(path.join(MW, p), 'utf8');
const json = p => JSON.parse(read(p));

const rates = json('data/rates-snapshot.json');
const TAX = json('data/tax-2026.json');
const LIMITS = json('data/limits-2026.json');
const GLOSSARY = json('data/glossary.json').terms;
const SOURCES = json('data/sources.json').sources;

/* ------------------------------------------------ tests first */
const testFile = path.join(MW, 'tests/calc.test.mjs');
const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', testFile], { encoding: 'utf8' });
const tap = run.stdout || '';
const TESTS = [...tap.matchAll(/^(not ok|ok) \d+ - (.+)$/gm)].map(m => ({ ok: m[1] === 'ok', name: m[2] }));
if (run.status !== 0 || !TESTS.length || TESTS.some(t => !t.ok)) {
  console.error(tap.slice(-3000));
  console.error('\nTests failed: not building.');
  process.exit(1);
}
const TESTED_ON = new Date().toISOString().slice(0, 10);
console.log(`tests: ${TESTS.length} passed`);

/* ------------------------------------------------ cache-busting version from every asset */
const ASSETS = ['css/moneywise.css', ...fs.readdirSync(path.join(MW, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
  ...(fs.existsSync(path.join(MW, 'js/pages')) ? fs.readdirSync(path.join(MW, 'js/pages')).map(f => 'js/pages/' + f) : [])];
const V = crypto.createHash('sha1').update(ASSETS.map(read).join('')).digest('hex').slice(0, 8);

/* ------------------------------------------------ the topics, in tab order */
export const MODULES = [
  { slug: 'mortgage', name: 'Mortgage', tab: 'Mortgage', q: 'What will the house really cost?' },
  { slug: 'car', name: 'Car loans', tab: 'Car loans', q: 'What will this car really cost?' },
  { slug: 'rates', name: 'Interest rates', tab: 'Rates', q: 'How do rates change my bills?' },
  { slug: 'credit', name: 'Credit & debt', tab: 'Credit', q: 'Which debt should I pay first?' },
  { slug: 'insurance', name: 'Health insurance', tab: 'Insurance', q: 'Which plan costs me the least?' },
  { slug: 'taxes', name: 'Taxes', tab: 'Taxes', q: 'Where does my paycheck go?' },
  { slug: 'retirement', name: 'Savings & retirement', tab: 'Retirement', q: 'Am I saving enough?' },
];

/* ------------------------------------------------ helpers handed to page sources */
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const TAPE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>';
const dateOf = d => (d && /^\d{4}/.test(d) ? ` (${d.length === 7 ? asOf(d + '-01', 'monthly') : d.length === 4 ? d : asOf(d)})` : '');

function makeKit() {
  const used = new Set();
  const kit = {
    rates, TAX, LIMITS, GLOSSARY, MODULES, SOURCES, ARROW, esc, asOf,
    // a glossary word in running text: links to the glossary without JS, opens an index card with it
    t(key, text) {
      const g = GLOSSARY[key];
      if (!g) throw new Error(`glossary term missing: ${key}`);
      used.add(key);
      // mid-sentence default: the abbreviation if there is one, otherwise the term in lower case (proper nouns kept)
      const shown = text ?? g.abbr ?? (g.proper ? g.term : g.term.charAt(0).toLowerCase() + g.term.slice(1));
      return `<a class="term" href="/moneywise/glossary/#${key}" data-term="${key}">${shown}</a>`;
    },
    // a live number printed from the snapshot, refreshed in the browser when the live feed answers
    rate(id, digits = 2) { const v = latest(rates, id); return `<span data-rate="${id}" data-digits="${digits}">${v == null ? '\u2013' : v.toFixed(digits) + '%'}</span>`; },
    asof(id) { return `<span data-asof="${id}">${latestDate(rates, id)}</span>`; },
    val: id => latest(rates, id),

    // worked example: [{n, desc, sub, op, amt, neg, kind: 'total' | 'section'}]
    lines(rows, caption) {
      const body = rows.map(r => r.kind === 'section'
        ? `<tr class="section"><td colspan="4">${r.desc}</td></tr>`
        : `<tr${r.kind === 'total' ? ' class="total"' : ''}><td class="ln">${r.n ?? ''}</td><td class="desc">${r.desc}${r.sub ? `<small>${r.sub}</small>` : ''}</td><td class="op">${r.op ?? ''}</td><td class="amt${r.neg ? ' neg' : ''}">${r.amt ?? ''}</td></tr>`).join('');
      return `<table class="lines">${caption ? `<caption class="vh">${caption}</caption>` : ''}<tbody>${body}</tbody></table>`;
    },

    /* one input. type: money | pct | num | sel | check | seg */
    box({ k, label, type = 'money', value, min, max, step, hint, wide, options, live, unit, dp }) {
      const id = 'f-' + k + '-' + Math.random().toString(36).slice(2, 6);
      const liveTag = live ? `<span class="live-tag" title="Starts at today's published rate">Today</span>` : '';
      const lab = `<label for="${id}">${label}${hint ? ` <span class="hint">${hint}</span>` : ''}${liveTag}</label>`;
      const cls = `box${wide ? ' wide' : ''}${type === 'check' ? ' check' : ''}`;
      if (type === 'check') return `<div class="${cls}"><input type="checkbox" id="${id}" data-k="${k}" data-t="check"${value ? ' checked' : ''}><label for="${id}">${label}</label></div>`;
      if (type === 'sel') return `<div class="${cls}">${lab}<div class="box-input"><select id="${id}" data-k="${k}" data-t="sel">${options.map(o => `<option value="${o[0]}"${String(o[0]) === String(value) ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div></div>`;
      if (type === 'seg') return `<div class="${cls}"><span class="box-label">${label}</span><div class="seg" data-k="${k}" role="group" aria-label="${esc(label)}">${options.map(o => `<button type="button" data-v="${o[0]}" aria-pressed="${String(o[0]) === String(value)}">${o[1]}</button>`).join('')}</div></div>`;
      const shown = type === 'money' ? Math.round(value).toLocaleString('en-US') : type === 'pct' && dp != null ? Number(value).toFixed(dp) : String(value);
      const pre = type === 'money' ? '<span class="unit">$</span>' : '';
      const post = type === 'pct' ? '<span class="unit">%</span>' : unit ? `<span class="unit">${unit}</span>` : '';
      const range = min != null ? `<input type="range" data-for="${k}" min="${min}" max="${max}" step="${step ?? 1}" value="${value}" aria-label="${esc(label)}" tabindex="-1">` : '';
      return `<div class="${cls}">${lab}<div class="box-input">${pre}<input type="text" inputmode="decimal" autocomplete="off" id="${id}" data-k="${k}" data-t="${type}" data-default="${type === 'pct' ? value / 100 : value}" value="${shown}"${live ? ` data-live="${live}"` : ''}${dp != null ? ` data-dp="${dp}"` : ''}>${post}</div>${range}</div>`;
    },
    group: title => `<div class="box-group-title">${title}</div>`,

    /* One calculator: the few inputs that matter (the rest folded under "More options"), the answer, and the
       calculator tape folded away until "Show the math". t: {id, label, intro, boxes, more, moreLabel, foot, cols} */
    tool(t, { solo = false, hidden = false } = {}) {
      return `<div class="tool${solo ? ' tool-hero' : ''}" id="${t.id}"${solo ? ' data-solo' : ''} role="region" aria-label="${esc(t.label)}"${hidden ? ' hidden' : ''}>
  ${t.intro ? `<p class="tool-intro">${t.intro}</p>` : ''}
  <div class="tool-grid">
    <div class="tool-inputs">
      <div class="fields${t.cols ? ' cols-' + t.cols : ''}">${t.boxes}</div>
      ${t.more ? `<details class="more-opts"><summary>${t.moreLabel || 'More options'}</summary><div class="fields two${t.cols ? ' cols-' + t.cols : ''}">${t.more}</div></details>` : ''}
      ${t.foot ? `<p class="boxes-foot">${t.foot}</p>` : ''}
    </div>
    <div class="results" aria-live="polite"><div class="figs" data-figs></div><p class="verdict" data-verdict hidden></p><div data-charts></div>
      <button type="button" class="math-btn" aria-expanded="false" aria-controls="${t.id}-tape">${TAPE}<span>Show the math</span></button></div>
    <div class="tape-slot" id="${t.id}-tape" hidden><div data-tape></div></div>
  </div>
  <noscript><p class="tool-intro">This calculator needs JavaScript. The worked example at the bottom of the page shows the same math.</p></noscript>
</div>`;
    },

    /* Flashcards: a big number and one line on the front, the reason on the back. Plain text only (a card is a button). */
    cards(list) {
      return `<ul class="cards">${list.map(c => `<li><button type="button" class="fc" aria-pressed="false"><span class="fc-face fc-front">${c.tag ? `<span class="fc-tag">${c.tag}</span>` : ''}<span class="fc-big">${c.big}</span><span class="fc-line">${c.line}</span><span class="fc-turn" aria-hidden="true">Why?</span></span><span class="fc-face fc-back" aria-hidden="true"><span class="fc-text">${c.back}</span><span class="fc-turn" aria-hidden="true">Back</span></span></button></li>`).join('')}</ul>`;
    },

    /* Costly mistakes: what it costs on the right, the fix one tap away. */
    slips(list) {
      return `<ul class="slips">${list.map(s => `<li><details><summary><span class="slip-t">${s.title}</span>${s.cost ? `<span class="slip-cost">${s.cost}</span>` : ''}</summary><p class="slip-fix"><b>Instead</b>${s.fix}</p></details></li>`).join('')}</ul>`;
    },

    fold(summary, html) { return `<details class="fold"><summary>${summary}</summary><div class="fold-body">${html}</div></details>`; },
    srcList(ids) {
      const cited = ids.map(id => SOURCES.find(s => s.id === id)).filter(Boolean);
      return `<ol class="src-list">${cited.map(s => `<li><a href="${s.url}" rel="noopener" target="_blank">${esc(s.publisher)}</a>: ${esc(s.title)}${dateOf(s.date)}</li>`).join('')}</ol>`;
    },
    head({ title, sub, chip }) {
      return `<header class="t-head"><h1>${title}</h1>${sub ? `<p class="t-sub">${sub}</p>` : ''}${chip ? `<p class="t-chip">${chip}</p>` : ''}</header>`;
    },

    /* A topic page: title and one-line promise, the main calculator, four flashcards, the costly mistakes, the other
       calculators on demand, and the worked example and sources folded at the end. */
    topic({ slug, sub, chip, hero, cards, slips, more = [], example, folds = [], sources = [] }) {
      const m = MODULES.find(x => x.slug === slug);
      const n = sources.filter(id => SOURCES.some(s => s.id === id)).length;
      return `<div class="wrap topic">
  ${kit.head({ title: m.name, sub, chip })}
  <section class="t-hero" aria-label="Calculator">${kit.tool(hero, { solo: true })}</section>
  <section class="t-sec" aria-labelledby="know-h"><h2 id="know-h">${cards.length} things to know</h2>${kit.cards(cards)}</section>
  <section class="t-sec" aria-labelledby="slips-h"><h2 id="slips-h">Costly mistakes</h2>${kit.slips(slips)}</section>
  ${more.length ? `<section class="t-sec" aria-labelledby="more-h"><h2 id="more-h">More calculators</h2><div class="chips">${more.map(x => `<button type="button" class="chip" aria-expanded="false" aria-controls="${x.id}"><b>${x.label}</b>${x.hint ? `<small>${x.hint}</small>` : ''}</button>`).join('')}</div>${more.map(x => kit.tool(x, { hidden: true })).join('')}</section>` : ''}
  <section class="t-folds" aria-label="Details">
    ${example ? kit.fold('Every number, worked out', example) : ''}
    ${folds.map(f => kit.fold(f.summary, f.html)).join('')}
    ${n ? kit.fold(`Sources (${n})`, kit.srcList(sources) + '<p class="fold-more"><a href="/moneywise/sources/">How the math is checked</a></p>') : ''}
  </section>
</div>`;
    },
    used,
  };
  return kit;
}

/* ------------------------------------------------ shell */
const NAV = slug => MODULES.map(m => `<a href="/moneywise/${m.slug}/"${m.slug === slug ? ' aria-current="page"' : ''}>${m.tab}</a>`).join('');
const BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8M8 11h6"/></svg>';

function shell({ slug, path: urlPath, title, description, body, used, script, bodyClass = '' }) {
  const url = 'https://www.safisolutions.org' + urlPath;
  const terms = {};
  for (const key of [...used].sort()) terms[key] = { term: GLOSSARY[key].term, abbr: GLOSSARY[key].abbr, short: GLOSSARY[key].short, seen: GLOSSARY[key].seen };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f3eee3">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Safi Solutions">
<meta property="og:image" content="https://www.safisolutions.org/moneywise/media/og.jpg">
<meta property="og:image:alt" content="Moneywise logo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="https://www.safisolutions.org/moneywise/media/og.jpg">
<link rel="icon" href="/moneywise/media/favicon-64.png" type="image/png">
<link rel="apple-touch-icon" href="/moneywise/media/apple-touch-icon.png">
<link rel="manifest" href="/moneywise/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400..900;1,400..900&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Public+Sans:ital,wght@0,300..800;1,400..600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/moneywise/css/moneywise.css?v=${V}">
</head>
<body class="mw page-${slug}${bodyClass ? ' ' + bodyClass : ''}">
<a class="skip" href="#main">Skip to content</a>
<header class="mw-top">
  <div class="mw-top-row">
    <a class="mw-brand" href="/moneywise/" aria-label="Moneywise home"><img src="/moneywise/media/logo.webp" alt="Moneywise" width="960" height="216"></a>
    <nav class="mw-tabs" aria-label="Topics">${NAV(slug)}</nav>
    <a class="mw-gloss" href="/moneywise/glossary/"${slug === 'glossary' ? ' aria-current="page"' : ''}>${BOOK}Glossary</a>
  </div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="mw-foot">
  <div class="wrap">
    <a href="/moneywise/" aria-label="Moneywise home"><img src="/moneywise/media/logo-reverse.webp" alt="Moneywise" width="960" height="216"></a>
    <nav aria-label="Moneywise footer"><a href="/moneywise/glossary/">Glossary</a><a href="/moneywise/sources/">Sources</a><a href="/projects/#moneywise">About</a><a href="/">Safi Solutions</a></nav>
    <p class="disclaim">Education, not financial advice. U.S. figures, checked ${asOf(TESTED_ON)}. Rates are national averages from the Federal Reserve Bank of St. Louis, not offers.</p>
  </div>
</footer>
<script type="application/json" id="mw-terms">${JSON.stringify(terms).replace(/</g, '\\u003c')}</script>
<script type="module" src="/moneywise/js/pages/${script}.js?v=${V}"></script>
</body>
</html>
`;
  if (html.includes('\u2014')) throw new Error(`em dash in ${urlPath}`);
  return stackLabels(html);
}

/* Tables marked "stack" turn into one block per row on phones; each cell borrows its column heading as a label. */
function stackLabels(html) {
  return html.replace(/<table class="([^"]*\bstack\b[^"]*)">([\s\S]*?)<\/table>/g, (all, cls, inner) => {
    const heads = [...(inner.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] ?? '').matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/"/g, '&quot;').trim());
    const body = inner.replace(/<tr>([\s\S]*?)<\/tr>/g, (row, cells) => {
      if (cells.includes('<th')) return row;
      let i = 0;
      return '<tr>' + cells.replace(/<td(\s[^>]*)?>/g, (td, attrs = '') => `<td${attrs} data-label="${heads[i++] ?? ''}">`) + '</tr>';
    });
    return `<table class="${cls}">${body}</table>`;
  });
}

/* ------------------------------------------------ build every page */
const pagesDir = path.join(HERE, 'pages');
// MW_ONLY=mortgage builds just the pages whose file name contains that word (handy while editing one page)
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.mjs') && (!process.env.MW_ONLY || f.includes(process.env.MW_ONLY))).sort();
const written = [];
for (const f of files) {
  const mod = await import(pathToFileURL(path.join(pagesDir, f)).href);
  const kit = makeKit();
  const page = mod.default(kit, { TESTS, TESTED_ON });
  const out = page.slug === 'home' ? 'index.html' : `${page.slug}/index.html`;
  const html = shell({ ...page, used: kit.used, path: page.slug === 'home' ? '/moneywise/' : `/moneywise/${page.slug}/`, script: page.script || page.slug });
  fs.mkdirSync(path.dirname(path.join(MW, out)), { recursive: true });
  fs.writeFileSync(path.join(MW, out), html);
  written.push(`${out} (${(html.length / 1024).toFixed(1)} KB, ${kit.used.size} terms)`);
}
console.log('wrote\n  ' + written.join('\n  '));
