// Moneywise: rebuild the offline fallback (data/rates-snapshot.json) from FRED.
// Run from the repository root:  node moneywise/tools/refresh-snapshot.mjs
// Uses FRED's public CSV download, so no key is needed. With FRED_API_KEY set it uses the official API instead.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERIES, buildRates, fromFredCsv, fromFredJson, HISTORY_YEARS } from '../worker/series.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '../data/rates-snapshot.json');
const key = process.env.FRED_API_KEY;
const start = new Date(); start.setUTCFullYear(start.getUTCFullYear() - HISTORY_YEARS - 1);
const startStr = start.toISOString().slice(0, 10);

async function get(id) {
  const url = key
    ? `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&observation_start=${startStr}&file_type=json&api_key=${key}`
    : `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${startStr}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const obs = key ? fromFredJson(await res.json()) : fromFredCsv(await res.text());
  return obs.filter(o => o.date >= startStr);
}

const raw = {};
for (const s of SERIES) {
  raw[s.id] = await get(s.id);
  const last = raw[s.id].filter(o => o.value != null).at(-1);
  console.log(`${s.id.padEnd(15)} ${String(raw[s.id].length).padStart(5)} obs   latest ${last ? `${last.date} ${last.value}` : 'none'}`);
}
const doc = buildRates(raw, { mode: 'snapshot' });
fs.writeFileSync(out, JSON.stringify(doc) + '\n');
console.log(`wrote ${path.relative(process.cwd(), out)} (${fs.statSync(out).size} bytes)`);
