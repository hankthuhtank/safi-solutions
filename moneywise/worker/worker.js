/* Moneywise live rates: a small Cloudflare Worker between the site and FRED.
   - The FRED API key stays here as a Worker secret (FRED_API_KEY); the browser never sees it.
   - One combined response for every series, cached for 24 hours at the edge.
   - If FRED is down, the last good copy is served with "stale": true; the site falls back to its own snapshot after that.
   GET /v1/rates  ->  same JSON shape as moneywise/data/rates-snapshot.json, with mode "live". */
import { SERIES, buildRates, fromFredJson, HISTORY_YEARS } from './series.js';

const ALLOWED = ['https://www.safisolutions.org', 'https://safisolutions.org'];
const DAY = 86400;

function cors(origin, env) {
  const local = env.ALLOW_LOCALHOST === 'true' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
  const allow = ALLOWED.includes(origin) || local ? origin : ALLOWED[0];
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Vary': 'Origin' };
}

async function fetchAll(env) {
  const start = new Date(); start.setUTCFullYear(start.getUTCFullYear() - HISTORY_YEARS - 1);
  const startStr = start.toISOString().slice(0, 10);
  const raw = {};
  await Promise.all(SERIES.map(async s => {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&observation_start=${startStr}&file_type=json&api_key=${env.FRED_API_KEY}`;
    const res = await fetch(url, { cf: { cacheTtl: 3600 } });
    if (!res.ok) throw new Error(`FRED ${s.id} ${res.status}`);
    raw[s.id] = fromFredJson(await res.json());
  }));
  return buildRates(raw, { mode: 'live' });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    if (origin && !ALLOWED.includes(origin) && !(env.ALLOW_LOCALHOST === 'true' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      return new Response('Origin not allowed', { status: 403 });
    }
    const headers = cors(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers });
    const url = new URL(request.url);
    if (url.pathname !== '/v1/rates') return new Response('Not found', { status: 404, headers });
    if (!env.FRED_API_KEY) return new Response('FRED_API_KEY is not set', { status: 500, headers });

    const cache = caches.default;
    const key = new Request('https://moneywise-rates.internal/v1/rates');
    const hit = await cache.match(key);
    if (hit) {
      const fetched = hit.headers.get('X-Fetched') || '';
      const age = (Date.now() - Date.parse(fetched || 0)) / 1000;
      if (age < DAY) return new Response(hit.body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', 'X-Fetched': fetched, ...headers } });
    }
    try {
      const doc = await fetchAll(env);
      const body = JSON.stringify(doc);
      const fresh = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=3600`, 'X-Fetched': new Date().toUTCString() };
      // keep the stored copy for a week so it can stand in if FRED is unavailable later
      ctx.waitUntil(cache.put(key, new Response(body, { headers: { ...fresh, 'Cache-Control': `public, max-age=${7 * DAY}` } })));
      return new Response(body, { headers: { ...fresh, ...headers } });
    } catch (err) {
      if (hit) {
        const doc = await hit.json();
        doc.stale = true;
        return new Response(JSON.stringify(doc), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=600', ...headers } });
      }
      return new Response(JSON.stringify({ error: 'upstream', message: String(err.message || err) }), { status: 502, headers: { 'Content-Type': 'application/json', ...headers } });
    }
  },
};
