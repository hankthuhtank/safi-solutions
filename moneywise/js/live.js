/* Moneywise live data: ask the Worker for today's FRED numbers, fall back to the bundled snapshot.
   Pages are built with the snapshot already printed in, so this only changes what you see when the live feed
   answers with something newer. */
import { CONFIG } from './config.js';
import { latest, latestDate } from './ratesview.js';

const KEY = 'mw:rates:v1';
let pending = null;

async function fetchJson(url, ms) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const doc = await res.json();
    if (!doc || !doc.series) throw new Error('bad shape');
    return doc;
  } finally { clearTimeout(t); }
}

export function getRates() {
  if (pending) return pending;
  pending = (async () => {
    try {
      const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (c && Date.now() - c.at < 3600e3) return c.doc;
    } catch { /* storage blocked */ }
    if (CONFIG.apiUrl) {
      try {
        const doc = await fetchJson(CONFIG.apiUrl.replace(/\/$/, '') + '/v1/rates', CONFIG.timeoutMs);
        try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), doc })); } catch { /* ignore */ }
        return doc;
      } catch { /* fall through to the snapshot */ }
    }
    return fetchJson('/moneywise/data/rates-snapshot.json', 8000);
  })();
  return pending;
}

// Repaint everything on the page that shows a live number. Called only when the live feed answered.
export function applyRates(doc) {
  document.querySelectorAll('[data-asof]').forEach(n => { const d = latestDate(doc, n.dataset.asof); if (d) n.textContent = d; });
  document.querySelectorAll('[data-rate]').forEach(n => {
    const v = latest(doc, n.dataset.rate);
    if (v != null) n.textContent = v.toFixed(Number(n.dataset.digits || 2)) + (n.dataset.unit ?? '%');
  });
  document.querySelectorAll('[data-mode]').forEach(n => { n.textContent = doc.mode === 'live' ? 'Live from FRED' : 'Snapshot'; });
  document.dispatchEvent(new CustomEvent('mw:rates', { detail: doc }));
}

export function startLive() {
  if (!CONFIG.apiUrl) return;
  getRates().then(doc => { if (doc.mode === 'live') applyRates(doc); }).catch(() => {});
}
