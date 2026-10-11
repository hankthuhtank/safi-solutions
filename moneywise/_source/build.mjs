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
import { stripHTML, boardHTML, latest, latestDate, esc } from '../js/ratesview.js';
import { asOf } from '../js/format.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MW = path.resolve(HERE, '..');
const read = p => fs.readFileSync(path.join(MW, p), 'utf8');
const json = p => JSON.parse(read(p));

const rates = json('data/rates-snapshot.json');
const TAX = json('data/tax-2026.json');
const LIMITS = json('data/limits-2026.json');
const GLOSSARY = json('data/glossary.json').terms;

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

/* ------------------------------------------------ the sections, in tab order */
export const MODULES = [
  { slug: 'mortgage', no: '1', name: 'Mortgage', tab: 'Mortgage', q: 'What does the house really cost each month, and over thirty years?', miss: 'PMI drops off automatically at 78% of the original value, but you can ask for it at 80%.' },
  { slug: 'car', no: '2', name: 'Car loans', tab: 'Car loans', q: 'What will this car cost by the time it is paid off?', miss: 'Negotiating the monthly payment instead of the out-the-door price is how $5,000 of extras hide.' },
  { slug: 'rates', no: '3', name: 'Interest rates', tab: 'Rates', q: 'Why did my card rate go up the day the Fed met, but my mortgage quote moved on its own?', miss: 'Card APRs move with the Fed within a cycle or two; mortgage rates follow the 10-year Treasury instead.' },
  { slug: 'credit', no: '4', name: 'Credit', tab: 'Credit', q: 'Which debt should get the extra money, and what actually moves a score?', miss: 'Utilization is usually taken from your statement balance, even if you pay in full every month.' },
  { slug: 'insurance', no: '5', name: 'Health insurance', tab: 'Insurance', q: 'Which plan costs least for the year I am likely to have?', miss: 'The out-of-pocket maximum never includes your premiums, and out-of-network care may not count toward it.' },
  { slug: 'taxes', no: '6', name: 'Taxes', tab: 'Taxes', q: 'Where does my paycheck go, and what is my real tax rate?', miss: 'A raise can never shrink your take-home pay: only the dollars above a bracket line pay the higher rate.' },
  { slug: 'retirement', no: '7', name: 'Savings & retirement', tab: 'Retirement', q: 'How much will I have, and what is quietly eating it?', miss: 'Not contributing enough for the full match is turning down part of your pay.' },
];

/* ------------------------------------------------ helpers handed to page sources */
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
function makeKit() {
  const used = new Set();
  const kit = {
    rates, TAX, LIMITS, GLOSSARY, MODULES, ARROW, esc, asOf, SOURCES,
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
    part(n, id, title, html, aside = '') {
      const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'][n - 1];
      return `<section class="part" id="${id}" aria-labelledby="${id}-h"><h2 class="part-bar" id="${id}-h"><span>Part ${roman}</span><strong>${title}</strong>${aside ? `<em>${aside}</em>` : ''}</h2>${html}</section>`;
    },
    note(label, html) { return `<aside class="note"><b>${label}</b>${html}</aside>`; },
    // worked example: [{n, desc, sub, op, amt, neg, kind: 'total' | 'section'}]
    lines(rows, caption) {
      const body = rows.map(r => r.kind === 'section'
        ? `<tr class="section"><td colspan="4">${r.desc}</td></tr>`
        : `<tr${r.kind === 'total' ? ' class="total"' : ''}><td class="ln">${r.n ?? ''}</td><td class="desc">${r.desc}${r.sub ? `<small>${r.sub}</small>` : ''}</td><td class="op">${r.op ?? ''}</td><td class="amt${r.neg ? ' neg' : ''}">${r.amt ?? ''}</td></tr>`).join('');
      return `<table class="lines">${caption ? `<caption class="vh">${caption}</caption>` : ''}<tbody>${body}</tbody></table>`;
    },
    mistakes(list) {
      return `<ol class="mistakes">${list.map(m => `<li><span class="stamp" aria-hidden="true">Error</span><div><h3>${m.title}</h3><p>${m.why}</p></div><p class="fix"><b>The fix</b>${m.fix}</p></li>`).join('')}</ol>`;
    },
    /* tools: [{id, label, intro, boxes, tape: true}] -> tab list + panels. Results and charts are filled by the page script. */
    tools(list) {
      const tabs = list.length > 1 ? `<div class="tool-tabs" role="tablist" aria-label="Calculators">${list.map((t, i) => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="${t.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t.label}</button>`).join('')}</div>` : '';
      const panels = list.map((t, i) => `<div class="tool" id="${t.id}" role="${list.length > 1 ? 'tabpanel' : 'region'}" ${list.length > 1 ? `aria-labelledby="tab-${t.id}"` : `aria-label="${esc(t.label)}" data-solo`}${i && list.length > 1 ? ' hidden' : ''}>
  ${t.intro ? `<p class="tool-intro">${t.intro}</p>` : ''}
  <div class="tool-grid${t.tape === false ? ' no-tape' : ''}">
    <div class="tool-inputs"><div class="boxes${t.cols ? ' cols-' + t.cols : ''}">${t.boxes}</div>${t.foot ? `<p class="boxes-foot">${t.foot}</p>` : ''}</div>
    <div class="results" aria-live="polite"><div class="figs" data-figs></div><p class="verdict" data-verdict hidden></p><div data-charts></div></div>
    ${t.tape === false ? '' : '<div data-tape></div>'}
  </div>
  <noscript><p class="tool-intro">This calculator needs JavaScript. The worked example below walks through the same math with real numbers.</p></noscript>
</div>`).join('');
      return tabs + panels;
    },
    /* one W-2 style box. type: money | pct | num | sel | check | seg */
    box({ no, k, label, type = 'money', value, min, max, step, hint, wide, options, live, unit, dp }) {
      const id = 'f-' + k + '-' + Math.random().toString(36).slice(2, 6);
      const liveTag = live ? `<span class="live-tag" title="Starts at today's published rate">Today</span>` : '';
      const lab = `<label for="${id}"><span class="no">${no ?? ''}</span>${label}${hint ? ` <span class="hint">${hint}</span>` : ''}${liveTag}</label>`;
      const cls = `box${wide ? ' wide' : ''}${type === 'check' ? ' check' : ''}`;
      if (type === 'check') return `<div class="${cls}"><input type="checkbox" id="${id}" data-k="${k}" data-t="check"${value ? ' checked' : ''}><label for="${id}">${label}</label></div>`;
      if (type === 'sel') return `<div class="${cls}">${lab}<div class="box-input"><select id="${id}" data-k="${k}" data-t="sel">${options.map(o => `<option value="${o[0]}"${String(o[0]) === String(value) ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div></div>`;
      if (type === 'seg') return `<div class="${cls}"><span class="box-label"><span class="no">${no ?? ''}</span>${label}</span><div class="seg" data-k="${k}" role="group" aria-label="${esc(label)}">${options.map(o => `<button type="button" data-v="${o[0]}" aria-pressed="${String(o[0]) === String(value)}">${o[1]}</button>`).join('')}</div></div>`;
      const shown = type === 'money' ? Math.round(value).toLocaleString('en-US') : type === 'pct' && dp != null ? Number(value).toFixed(dp) : String(value);
      const pre = type === 'money' ? '<span class="unit">$</span>' : '';
      const post = type === 'pct' ? '<span class="unit">%</span>' : unit ? `<span class="unit">${unit}</span>` : '';
      const range = min != null ? `<input type="range" data-for="${k}" min="${min}" max="${max}" step="${step ?? 1}" value="${value}" aria-label="${esc(label)}" tabindex="-1">` : '';
      return `<div class="${cls}">${lab}<div class="box-input">${pre}<input type="text" inputmode="decimal" autocomplete="off" id="${id}" data-k="${k}" data-t="${type}" data-default="${type === 'pct' ? value / 100 : value}" value="${shown}"${live ? ` data-live="${live}"` : ''}${dp != null ? ` data-dp="${dp}"` : ''}>${post}</div>${range}</div>`;
    },
    group: title => `<div class="box-group-title">${title}</div>`,
    /* A whole form page: header block, the Parts rail and the five parts.
       today: [{label, value, sub}]; parts: [{id, short, title, html, aside}]; sources: ids from data/sources.json */
    module({ slug, lede, today, todaySrc, parts, sources = [] }) {
      const m = MODULES.find(x => x.slug === slug);
      const roman = i => ['I', 'II', 'III', 'IV', 'V', 'VI'][i];
      const rail = parts.map((p, i) => `<li><a href="#${p.id}"><span>Part ${roman(i)}</span>${p.short}</a></li>`).join('');
      const cited = sources.map(id => SOURCES.find(s => s.id === id)).filter(Boolean);
      const srcList = cited.length ? `<section class="form-sources" aria-label="Sources for this form"><h2 class="micro">Sources for this form</h2><ol>${cited.map(s => `<li><a href="${s.url}" rel="noopener" target="_blank">${esc(s.publisher)}</a>: ${esc(s.title)}${s.date && /^\d{4}/.test(s.date) ? ` (${s.date.length === 7 ? asOf(s.date + '-01', 'monthly') : s.date.length === 4 ? s.date : asOf(s.date)})` : ''}</li>`).join('')}</ol><p><a href="/moneywise/sources/">All sources and how the math is checked →</a></p></section>` : '';
      return `<div class="wrap">
  <header class="form-head">
    <div class="form-id"><span>Form</span><b>MW-${m.no}</b><small>Rev. ${asOf(TESTED_ON, 'monthly')}<br>Tax year ${TAX.taxYear}</small></div>
    <div class="form-title"><p class="dept">Moneywise · Department of Plain English</p><h1>${m.name}</h1><p class="lede">${lede}</p></div>
    <aside class="form-today" aria-labelledby="today-h"><h2 id="today-h">Today's numbers</h2><dl>${today.map(d => `<div><dt>${d.label}</dt><dd>${d.value}${d.sub ? `<small>${d.sub}</small>` : ''}</dd></div>`).join('')}</dl>${todaySrc ? `<p class="src">${todaySrc}</p>` : ''}</aside>
  </header>
  <div class="module-grid">
    <nav class="parts-rail" aria-label="Parts of this form"><ol>${rail}</ol><p class="rail-note">Dotted words open a plain-English definition.</p></nav>
    <div class="module-body">${parts.map((p, i) => kit.part(i + 1, p.id, p.title, p.html, p.aside)).join('')}${srcList}</div>
  </div>
</div>`;
    },
    used,
  };
  return kit;
}
const SOURCES = json('data/sources.json').sources;

/* ------------------------------------------------ shell */
const NAV = slug => MODULES.map(m => `<a href="/moneywise/${m.slug}/"${m.slug === slug ? ' aria-current="page"' : ''}><small>${m.no}</small>${m.tab}</a>`).join('');
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
    <nav class="mw-tabs" aria-label="Moneywise sections">${NAV(slug)}</nav>
    <a class="mw-gloss" href="/moneywise/glossary/"${slug === 'glossary' ? ' aria-current="page"' : ''}>${BOOK}Glossary</a>
  </div>
  <div class="rate-strip" id="rate-strip" aria-label="Today's rates">${stripHTML(rates)}</div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="mw-foot">
  <div class="wrap">
    <a href="/moneywise/" aria-label="Moneywise home"><img src="/moneywise/media/logo-reverse.webp" alt="Moneywise" width="960" height="216"></a>
    <nav aria-label="Moneywise footer"><a href="/moneywise/glossary/">Glossary</a><a href="/moneywise/sources/">Sources &amp; how we check the math</a><a href="/projects/#moneywise">About this project</a><a href="/">Safi Solutions</a></nav>
    <span></span>
    <p class="disclaim">Moneywise is education, not financial, tax or legal advice. Figures are for the United States, checked ${asOf(TESTED_ON)}; tax and limit tables are for ${TAX.taxYear}. Rates come from FRED (Federal Reserve Bank of St. Louis) and are averages, not offers. Your lender, insurer, employer and the IRS have the final word on your numbers.</p>
    <p class="micr" aria-hidden="true"><span><i></i>0410 ${TAX.taxYear}<i></i></span><span>MONEYWISE <i class="on-us"></i> SAFI SOLUTIONS</span><span>${TESTS.length} CHECKS PASSED <i class="on-us"></i> ${TESTED_ON.replace(/-/g, '')}</span></p>
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
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.mjs')).sort();
const written = [];
for (const f of files) {
  const mod = await import(pathToFileURL(path.join(pagesDir, f)).href);
  const kit = makeKit();
  const page = mod.default(kit, { TESTS, TESTED_ON, boardHTML });
  const out = page.slug === 'home' ? 'index.html' : `${page.slug}/index.html`;
  const html = shell({ ...page, used: kit.used, path: page.slug === 'home' ? '/moneywise/' : `/moneywise/${page.slug}/`, script: page.script || page.slug });
  fs.mkdirSync(path.dirname(path.join(MW, out)), { recursive: true });
  fs.writeFileSync(path.join(MW, out), html);
  written.push(`${out} (${(html.length / 1024).toFixed(1)} KB, ${kit.used.size} terms)`);
}
console.log('wrote\n  ' + written.join('\n  '));
