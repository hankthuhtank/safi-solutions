/* Moneywise: read a number and its date out of the rates document (the live feed or the snapshot).
   Pure (no DOM), so the build script prints numbers from the snapshot and the browser refreshes them from live data. */
import { asOf } from './format.js';

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
