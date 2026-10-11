/* Moneywise: the rate strip under the header and the rate board on the home page, as HTML strings.
   Pure (no DOM), so the build script pre-renders them from the snapshot and the browser re-renders them from live data. */
import { asOf, pctPts, money } from './format.js';

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = (doc, id) => (doc && doc.series ? doc.series[id] : null);

// Latest number for a series (percent units as FRED publishes them); CPI returns its year-over-year change.
export function latest(doc, id) {
  const s = S(doc, id);
  if (!s) return null;
  if (id === 'CPIAUCSL') return s.yoy && s.yoy.latest ? s.yoy.latest.value : null;
  if (id === 'FEDTARGET') return s.latest ? s.latest.upper : null;
  return s.latest ? s.latest.value : null;
}
export function latestDate(doc, id) {
  const s = S(doc, id);
  if (!s) return '';
  const p = id === 'CPIAUCSL' ? s.yoy && s.yoy.latest : s.latest;
  return p ? asOf(p.date, id === 'CPIAUCSL' ? 'monthly' : s.asof || s.freq) : '';
}

// Signed change in percentage points against the same point a year earlier, e.g. "▲ 1.06 vs Oct '25"
function change(s, digits = 2, latestPt = s && s.latest, agoPt = s && s.yearAgo) {
  if (!latestPt || !agoPt) return '';
  const d = latestPt.value - agoPt.value, when = asOf(agoPt.date, 'monthly').replace(/ \d\d(\d\d)$/, " '$1");
  if (Math.abs(d) < Math.pow(10, -digits) / 2) return `same as ${when}`;
  return `${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(digits)} vs ${when}`;
}

export function stripItems(doc) {
  const items = [];
  const add = (id, label, value, date, title) => { if (value != null) items.push({ id, label, value, date, title }); };
  const s30 = S(doc, 'MORTGAGE30US'), s15 = S(doc, 'MORTGAGE15US'), fed = S(doc, 'FEDTARGET'), t10 = S(doc, 'DGS10');
  const cpi = S(doc, 'CPIAUCSL'), un = S(doc, 'UNRATE'), prime = S(doc, 'DPRIME'), card = S(doc, 'TERMCBCCALLNS'), sav = S(doc, 'SNDR');
  if (s30) add('MORTGAGE30US', '30-yr mortgage', pctPts(s30.latest.value), asOf(s30.latest.date), s30.label);
  if (s15) add('MORTGAGE15US', '15-yr mortgage', pctPts(s15.latest.value), asOf(s15.latest.date), s15.label);
  if (fed) add('FEDTARGET', 'Fed target', `${fed.latest.lower.toFixed(2)}–${fed.latest.upper.toFixed(2)}%`, `since ${asOf(fed.changed)}`, fed.label);
  if (t10) add('DGS10', '10-yr Treasury', pctPts(t10.latest.value), asOf(t10.latest.date), t10.label);
  if (prime) add('DPRIME', 'Prime rate', pctPts(prime.latest.value), asOf(prime.latest.date), prime.label);
  if (cpi && cpi.yoy) add('CPIAUCSL', 'Inflation', pctPts(cpi.yoy.latest.value, 1), asOf(cpi.yoy.latest.date, 'monthly'), 'Consumer prices, change from a year earlier');
  if (un) add('UNRATE', 'Unemployment', pctPts(un.latest.value, 1), asOf(un.latest.date, 'monthly'), un.label);
  if (card) add('TERMCBCCALLNS', 'Avg card APR', pctPts(card.latest.value), asOf(card.latest.date, 'monthly'), card.label);
  if (sav) add('SNDR', 'Avg savings', pctPts(sav.latest.value), asOf(sav.latest.date, 'monthly'), sav.label);
  return items;
}

export function badge(doc) {
  if (!doc) return { mode: 'none', text: 'Rates unavailable' };
  if (doc.mode === 'live') return { mode: doc.stale ? 'stale' : 'live', text: doc.stale ? 'Live feed (delayed)' : 'Live from FRED' };
  return { mode: 'snapshot', text: `Snapshot ${asOf(doc.generated.slice(0, 10))}` };
}

export function stripHTML(doc) {
  const b = badge(doc);
  const items = stripItems(doc).map(i => `<li data-id="${i.id}" title="${esc(i.title)}"><span class="rs-label">${esc(i.label)}</span><b class="rs-value">${esc(i.value)}</b><span class="rs-date">${esc(i.date)}</span></li>`).join('');
  return `<p class="rs-title"><span class="rs-dot rs-${b.mode}" aria-hidden="true"></span><span class="rs-mode">${esc(b.text)}</span></p><ul class="rs-list">${items}</ul><a class="rs-src" href="/moneywise/sources/#live">Sources</a>`;
}

// Sparkline path through the last n monthly points, scaled into w x h.
export function sparkPath(history, w = 120, h = 34, n = 24) {
  const pts = history.slice(-n);
  if (pts.length < 2) return { d: '', end: null };
  const vals = pts.map(p => p[1]);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  const x = i => 2 + i * (w - 4) / (pts.length - 1), y = v => h - 3 - (v - lo) / (hi - lo) * (h - 6);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[1]).toFixed(1)}`).join('');
  return { d, end: [x(pts.length - 1), y(vals[vals.length - 1])], first: pts[0][0], last: pts[pts.length - 1][0] };
}

const TILES = [
  { id: 'MORTGAGE30US', name: '30-year mortgage', note: 'Average rate on a new 30-year fixed loan', link: '/moneywise/mortgage/' },
  { id: 'MORTGAGE15US', name: '15-year mortgage', note: 'Higher payment, far less interest', link: '/moneywise/mortgage/' },
  { id: 'FEDTARGET', name: 'Fed target range', note: 'What banks charge each other overnight', link: '/moneywise/rates/', hist: 'DFEDTARU' },
  { id: 'DGS10', name: '10-year Treasury', note: 'The yield mortgage rates track', link: '/moneywise/rates/' },
  { id: 'CPIAUCSL', name: 'Inflation', note: 'Consumer prices vs a year earlier', link: '/moneywise/retirement/' },
  { id: 'UNRATE', name: 'Unemployment', note: 'Share of the labor force looking for work', link: '/moneywise/rates/' },
];

export function boardHTML(doc) {
  return TILES.map(t => {
    const s = S(doc, t.id);
    if (!s) return '';
    let value, date, delta = '', hist;
    if (t.id === 'FEDTARGET') {
      value = `${s.latest.lower.toFixed(2)}–${s.latest.upper.toFixed(2)}%`; date = `Set ${asOf(s.changed)}`;
      const u = S(doc, 'DFEDTARU'); hist = u ? u.history : []; delta = u ? change(u) : '';
    } else if (t.id === 'CPIAUCSL') {
      value = pctPts(s.yoy.latest.value, 1); date = asOf(s.yoy.latest.date, 'monthly'); hist = s.yoy.history;
      delta = change(s, 1, s.yoy.latest, s.yoy.yearAgo);
    } else {
      value = pctPts(s.latest.value, t.id === 'UNRATE' ? 1 : 2); date = asOf(s.latest.date, s.freq); hist = s.history; delta = change(s, t.id === 'UNRATE' ? 1 : 2);
    }
    const sp = sparkPath(hist || []);
    const spark = sp.d ? `<svg class="tile-spark" viewBox="0 0 120 34" aria-hidden="true"><path d="${sp.d}"/><circle cx="${sp.end[0].toFixed(1)}" cy="${sp.end[1].toFixed(1)}" r="3.2"/></svg>` : '';
    return `<a class="rate-tile" href="${t.link}" data-id="${t.id}"><span class="tile-name">${esc(t.name)}</span><b class="tile-value${t.id === 'FEDTARGET' ? ' range' : ''}">${esc(value)}</b><span class="tile-delta">${esc(delta)}</span>${spark}<span class="tile-note">${esc(t.note)}</span><span class="tile-date">${esc(date)} · ${esc(s.publisher.replace('Board of Governors of the Federal Reserve System', 'Federal Reserve'))}</span></a>`;
  }).join('');
}

// "Median home price $410,700 (Q2 2026)" style helper for prose and defaults
export function moneyFact(doc, id) {
  const s = S(doc, id);
  return s ? `${money(s.latest.value)} (${asOf(s.latest.date, s.freq)})` : '';
}
