/* Moneywise live data: which FRED series we show, and how raw observations become the JSON the pages read.
   Shared by the Cloudflare Worker (worker.js) and the snapshot script (../tools/refresh-snapshot.mjs), so the live
   feed and the offline fallback always have the same shape. */

export const SERIES = [
  { id: 'MORTGAGE30US', short: '30-yr mortgage', label: '30-year fixed mortgage rate, U.S. average', units: '%', freq: 'weekly', publisher: 'Freddie Mac Primary Mortgage Market Survey' },
  { id: 'MORTGAGE15US', short: '15-yr mortgage', label: '15-year fixed mortgage rate, U.S. average', units: '%', freq: 'weekly', publisher: 'Freddie Mac Primary Mortgage Market Survey' },
  { id: 'DFEDTARU', short: 'Fed target, upper', label: 'Federal funds target range, upper limit', units: '%', freq: 'daily', publisher: 'Board of Governors of the Federal Reserve System' },
  { id: 'DFEDTARL', short: 'Fed target, lower', label: 'Federal funds target range, lower limit', units: '%', freq: 'daily', publisher: 'Board of Governors of the Federal Reserve System' },
  { id: 'FEDFUNDS', short: 'Effective fed funds', label: 'Effective federal funds rate, monthly average', units: '%', freq: 'monthly', publisher: 'Board of Governors of the Federal Reserve System' },
  { id: 'DGS10', short: '10-yr Treasury', label: '10-year Treasury constant maturity yield', units: '%', freq: 'daily', publisher: 'Board of Governors of the Federal Reserve System (H.15)' },
  { id: 'CPIAUCSL', short: 'Inflation (CPI)', label: 'Consumer Price Index for All Urban Consumers, seasonally adjusted', units: 'index', freq: 'monthly', publisher: 'U.S. Bureau of Labor Statistics', yoy: true },
  { id: 'UNRATE', short: 'Unemployment', label: 'Unemployment rate', units: '%', freq: 'monthly', publisher: 'U.S. Bureau of Labor Statistics' },
  { id: 'DPRIME', short: 'Prime rate', label: 'Bank prime loan rate', units: '%', freq: 'daily', publisher: 'Board of Governors of the Federal Reserve System (H.15)' },
  { id: 'TERMCBCCALLNS', short: 'Card APR', label: 'Credit card interest rate, all accounts, commercial banks', units: '%', freq: 'quarterly', asof: 'monthly', publisher: 'Board of Governors of the Federal Reserve System (G.19)' },
  { id: 'TERMCBCCINTNS', short: 'Card APR, paying interest', label: 'Credit card interest rate, accounts assessed interest, commercial banks', units: '%', freq: 'quarterly', asof: 'monthly', publisher: 'Board of Governors of the Federal Reserve System (G.19)' },
  { id: 'TERMCBAUTO48NS', short: 'New-car loan', label: '48-month new car loan rate, commercial banks', units: '%', freq: 'quarterly', asof: 'monthly', publisher: 'Board of Governors of the Federal Reserve System (G.19)' },
  { id: 'TERMCBPER24NS', short: 'Personal loan', label: '24-month personal loan rate, commercial banks', units: '%', freq: 'quarterly', asof: 'monthly', publisher: 'Board of Governors of the Federal Reserve System (G.19)' },
  { id: 'SNDR', short: 'Avg savings rate', label: 'National average rate on savings accounts', units: '%', freq: 'monthly', publisher: 'Federal Deposit Insurance Corporation' },
  { id: 'DTB3', short: '3-mo T-bill', label: '3-month Treasury bill, secondary market rate', units: '%', freq: 'daily', publisher: 'Board of Governors of the Federal Reserve System (H.15)' },
  { id: 'MSPUS', short: 'Median home price', label: 'Median sales price of houses sold in the United States', units: '$', freq: 'quarterly', publisher: 'U.S. Census Bureau and U.S. Department of Housing and Urban Development' },
];

export const HISTORY_YEARS = 10;

// observations: [{date: 'YYYY-MM-DD', value: number | null}] in date order
function latestPoints(obs) {
  const ok = obs.filter(o => o.value != null);
  const latest = ok[ok.length - 1] || null, previous = ok[ok.length - 2] || null;
  let yearAgo = null;
  if (latest) {
    const d = new Date(latest.date + 'T00:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() - 1);
    const target = d.toISOString().slice(0, 10);
    for (const o of ok) { if (o.date <= target) yearAgo = o; else break; }
  }
  return { latest, previous, yearAgo };
}

// Monthly averages ['YYYY-MM', value] for the last HISTORY_YEARS years.
function monthly(obs, since) {
  const sums = new Map();
  for (const o of obs) {
    if (o.value == null || o.date < since) continue;
    const k = o.date.slice(0, 7), s = sums.get(k) || [0, 0];
    s[0] += o.value; s[1]++; sums.set(k, s);
  }
  return [...sums].map(([k, [t, n]]) => [k, Math.round(t / n * 1000) / 1000]);
}

// Year-over-year percent change of a monthly index (CPI), skipping months the agency did not publish.
function yoy(obs) {
  const byMonth = new Map(obs.filter(o => o.value != null).map(o => [o.date.slice(0, 7), o.value]));
  const out = [];
  for (const [k, v] of byMonth) {
    const [y, m] = k.split('-').map(Number), prev = byMonth.get(`${y - 1}-${String(m).padStart(2, '0')}`);
    if (prev) out.push({ date: `${k}-01`, value: Math.round((v / prev - 1) * 10000) / 100 });
  }
  return out;
}

/* raw: { [seriesId]: observations }. Returns the document served at /v1/rates and saved as data/rates-snapshot.json. */
export function buildRates(raw, { mode, generated = new Date().toISOString() }) {
  const since = new Date(generated); since.setUTCFullYear(since.getUTCFullYear() - HISTORY_YEARS);
  const sinceStr = since.toISOString().slice(0, 10);
  const series = {};
  for (const s of SERIES) {
    const obs = raw[s.id];
    if (!obs || !obs.length) continue;
    const entry = { id: s.id, short: s.short, label: s.label, units: s.units, freq: s.freq, asof: s.asof || s.freq, publisher: s.publisher, url: `https://fred.stlouisfed.org/series/${s.id}`, ...latestPoints(obs), history: monthly(obs, sinceStr) };
    if (s.yoy) {
      const y = yoy(obs);
      entry.yoy = { ...latestPoints(y), history: monthly(y, sinceStr), note: 'Percent change from the same month a year earlier.' };
      const missing = obs.filter(o => o.value == null && o.date >= sinceStr).map(o => o.date.slice(0, 7));
      if (missing.length) entry.missing = missing;
    }
    series[s.id] = entry;
  }
  // The Fed sets a range; keep both ends together with the date it last moved.
  const up = raw.DFEDTARU, lo = raw.DFEDTARL;
  if (up && lo && up.length && lo.length) {
    const u = up.filter(o => o.value != null), l = lo.filter(o => o.value != null);
    let changed = u[0].date;
    for (let i = 1; i < u.length; i++) if (u[i].value !== u[i - 1].value) changed = u[i].date;
    series.FEDTARGET = { id: 'FEDTARGET', short: 'Fed target range', label: 'Federal funds target range', units: '%', publisher: 'Board of Governors of the Federal Reserve System', url: 'https://fred.stlouisfed.org/series/DFEDTARU', latest: { date: u[u.length - 1].date, lower: l[l.length - 1].value, upper: u[u.length - 1].value }, changed };
  }
  return { source: 'FRED, Federal Reserve Bank of St. Louis', sourceUrl: 'https://fred.stlouisfed.org/', mode, generated, series };
}

// FRED API JSON (series/observations) -> observations
export function fromFredJson(json) {
  return (json.observations || []).map(o => ({ date: o.date, value: o.value === '.' || o.value === '' ? null : Number(o.value) }));
}
// fredgraph.csv (no key needed) -> observations
export function fromFredCsv(text) {
  return text.trim().split(/\r?\n/).slice(1).map(line => {
    const [date, v] = line.split(',');
    return { date, value: v === '' || v === '.' || v == null ? null : Number(v) };
  });
}
