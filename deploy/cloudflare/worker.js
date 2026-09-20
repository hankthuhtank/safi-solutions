const PRODUCT_LABELS = {
  padeff: 'Padeff',
  piktoor: 'Piktoor',
  kwezeen: 'Kwezeen',
  doqcorp: 'DoqCorp',
  brandur: 'Brandur'
};

const BUNDLE3 = {
  ppk: ['padeff','piktoor','kwezeen'],
  ppd: ['padeff','piktoor','doqcorp'],
  ppb: ['padeff','piktoor','brandur'],
  pkd: ['padeff','kwezeen','doqcorp'],
  pkb: ['padeff','kwezeen','brandur'],
  pdb: ['padeff','doqcorp','brandur'],
  ikd: ['piktoor','kwezeen','doqcorp'],
  ikb: ['piktoor','kwezeen','brandur'],
  idb: ['piktoor','doqcorp','brandur'],
  kdb: ['kwezeen','doqcorp','brandur']
};

const PRICE_TO_PRODUCT = {
  // Individual launch + regular Stripe Price IDs
  price_1UGsqVJLh7fc6HG4s5gqHS0W: 'padeff',
  price_1UGsqYJLh7fc6HG4xfoorTgc: 'padeff',
  price_1UGsqbJLh7fc6HG4hdr08CtW: 'piktoor',
  price_1UGsqdJLh7fc6HG4ky11DzHj: 'piktoor',
  price_1UGsqfJLh7fc6HG4vlYl0Itw: 'kwezeen',
  price_1UGsqhJLh7fc6HG4KXkI7Htn: 'kwezeen',
  price_1UGsqjJLh7fc6HG4xwC1U4or: 'doqcorp',
  price_1UGsqmJLh7fc6HG4xJxOwx81: 'doqcorp',
  price_1UGsqoJLh7fc6HG4Nz67Xe7c: 'brandur',
  price_1UGsqqJLh7fc6HG4iVDlP0gF: 'brandur'
};

const BUNDLE3_PRICE_IDS = new Set([
  'price_1UGsqsJLh7fc6HG4te70gwRJ',
  'price_1UGsquJLh7fc6HG4vTQYREUm'
]);

const BUNDLE5_PRICE_IDS = new Set([
  'price_1UGsqwJLh7fc6HG4YTj7D2bf',
  'price_1UGsqzJLh7fc6HG44QSbyPwr'
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === 'GET' && url.pathname === '/api/health') return health(env);
      if (request.method === 'GET' && url.pathname === '/api/fulfill') return fulfill(url, env);
      if (request.method === 'GET' && url.pathname === '/api/file') return deliverFile(request, url, env);
      if (request.method === 'POST' && url.pathname === '/api/stripe-webhook') return stripeWebhook(request, env);
      return json({ error: 'Not found.' }, 404);
    } catch (err) {
      console.error('Worker error', err && err.stack ? err.stack : err);
      return json({ error: 'Secure delivery encountered an unexpected error.' }, 500);
    }
  }
};

function health(env) {
  const files = productFileMap(env);
  return json({
    ok: Boolean(env.STRIPE_SECRET_KEY && env.DOWNLOAD_SIGNING_SECRET && env.PRODUCTS),
    stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
    signingConfigured: Boolean(env.DOWNLOAD_SIGNING_SECRET),
    r2Configured: Boolean(env.PRODUCTS),
    filesConfigured: Object.fromEntries(Object.entries(files).map(([k,v]) => [k, Boolean(v)]))
  }, 200, { 'Cache-Control': 'no-store' });
}

async function fulfill(url, env) {
  const sessionId = url.searchParams.get('session_id') || '';
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ error: 'Invalid checkout session.' }, 400);
  requireFulfillmentConfig(env);

  const session = await retrieveCheckoutSession(sessionId, env.STRIPE_SECRET_KEY);
  if (!session || session.object !== 'checkout.session') return json({ error: 'Checkout session could not be verified.' }, 400);
  if (session.payment_status !== 'paid') return json({ error: 'This checkout session is not marked paid.' }, 402);
  if (session.mode && session.mode !== 'payment') return json({ error: 'Unsupported checkout type.' }, 400);

  const entitlements = determineEntitlements(session);
  if (!entitlements.length) return json({ error: 'Payment verified, but no matching SafiSolutions entitlement was found.' }, 403);

  const files = productFileMap(env);
  const ttl = clampInt(env.DOWNLOAD_TTL_SECONDS, 900, 7200, 3600);
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const downloads = [];

  for (const product of entitlements) {
    const path = files[product];
    if (!path) throw new Error(`Missing R2 object mapping for ${product}`);
    const token = await signToken({ sessionId, product, path, exp }, env.DOWNLOAD_SIGNING_SECRET);
    downloads.push({ product, label: PRODUCT_LABELS[product] || product, url: `/api/file?token=${encodeURIComponent(token)}` });
  }

  return json({ verified: true, expiresAt: exp, downloads }, 200, { 'Cache-Control': 'no-store' });
}

async function retrieveCheckoutSession(sessionId, secret) {
  const endpoint = new URL(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  endpoint.searchParams.append('expand[]', 'line_items.data.price');
  const res = await fetch(endpoint.toString(), {
    headers: { Authorization: `Bearer ${secret}` }
  });
  if (!res.ok) {
    console.error('Stripe retrieve failed', res.status, await res.text());
    return null;
  }
  return res.json();
}

function determineEntitlements(session) {
  const lineItems = session.line_items && Array.isArray(session.line_items.data) ? session.line_items.data : [];
  const priceIds = lineItems.map(item => item && item.price && item.price.id).filter(Boolean);
  const direct = [...new Set(priceIds.map(id => PRICE_TO_PRODUCT[id]).filter(Boolean))];
  if (direct.length) return direct;

  if (priceIds.some(id => BUNDLE5_PRICE_IDS.has(id))) return Object.keys(PRODUCT_LABELS);

  if (priceIds.some(id => BUNDLE3_PRICE_IDS.has(id))) {
    const combo = session.metadata && session.metadata.bundle_code;
    const apps = combo && BUNDLE3[combo];
    if (!apps) return [];
    const declared = String((session.metadata && session.metadata.bundle_apps) || '').split(',').map(x => x.trim()).filter(Boolean).sort();
    const expected = [...apps].sort();
    if (declared.length && declared.join('|') !== expected.join('|')) return [];
    return apps;
  }
  return [];
}

async function deliverFile(request, url, env) {
  requireFulfillmentConfig(env);
  const token = url.searchParams.get('token') || '';
  const payload = await verifyToken(token, env.DOWNLOAD_SIGNING_SECRET);
  if (!payload) return json({ error: 'Download link is invalid or expired.' }, 403);
  if (!PRODUCT_LABELS[payload.product]) return json({ error: 'Unknown product.' }, 403);

  const files = productFileMap(env);
  if (files[payload.product] !== payload.path) return json({ error: 'Download mapping changed. Request a fresh link.' }, 403);

  const object = await env.PRODUCTS.get(payload.path);
  if (!object) return json({ error: 'Product file is not available yet.' }, 404);

  const safeName = payload.path.split('/').pop().replace(/[^A-Za-z0-9._-]/g, '_');
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${safeName}"`);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { status: 200, headers });
}

async function stripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Webhook secret is not configured.' }, 503);
  const raw = await request.text();
  const signature = request.headers.get('Stripe-Signature') || '';
  if (!(await verifyStripeSignature(raw, signature, env.STRIPE_WEBHOOK_SECRET))) return json({ error: 'Invalid Stripe signature.' }, 400);

  const event = JSON.parse(raw);
  if (event.type === 'checkout.session.completed') {
    const session = event.data && event.data.object;
    if (session && session.payment_status === 'paid') await sendOrderEmail(session, event.id, env);
  }
  return json({ received: true });
}

async function sendOrderEmail(session, eventId, env) {
  if (!env.RESEND_API_KEY || !env.ORDER_FROM_EMAIL) return;
  const to = env.ORDER_TO_EMAIL || 'safihelal@gmail.com';
  const meta = session.metadata || {};
  const product = meta.product_slug || 'unknown';
  const bundleApps = meta.bundle_apps ? meta.bundle_apps.split(',').map(x => x.trim()).filter(Boolean) : [];
  const itemText = product === 'bundle5' ? Object.values(PRODUCT_LABELS).join(', ') : bundleApps.length ? bundleApps.map(x => PRODUCT_LABELS[x] || x).join(', ') : (PRODUCT_LABELS[product] || product);
  const customerEmail = (session.customer_details && session.customer_details.email) || session.customer_email || 'not supplied';
  const amount = typeof session.amount_total === 'number' ? `$${(session.amount_total / 100).toFixed(2)}` : 'unknown';
  const subject = `SafiSolutions order: ${itemText}`;
  const body = [
    'New paid SafiSolutions order',
    '',
    `Customer: ${customerEmail}`,
    `Amount: ${amount}`,
    `Products: ${itemText}`,
    `Checkout Session: ${session.id}`,
    `Stripe Event: ${eventId}`,
    '',
    'The download page will verify this same Checkout Session before releasing files.'
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.ORDER_FROM_EMAIL, to: [to], subject, text: body })
  });
  if (!res.ok) console.error('Order email failed', res.status, await res.text());
}

function productFileMap(env) {
  return {
    padeff: env.PRODUCT_FILE_PADEFF || '',
    piktoor: env.PRODUCT_FILE_PIKTOOR || '',
    kwezeen: env.PRODUCT_FILE_KWEZEEN || '',
    doqcorp: env.PRODUCT_FILE_DOQCORP || '',
    brandur: env.PRODUCT_FILE_BRANDUR || ''
  };
}

function requireFulfillmentConfig(env) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
  if (!env.DOWNLOAD_SIGNING_SECRET) throw new Error('DOWNLOAD_SIGNING_SECRET is not configured');
  if (!env.PRODUCTS) throw new Error('R2 PRODUCTS binding is not configured');
}

async function signToken(payload, secret) {
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacHex(body, secret);
  return `${body}.${sig}`;
}

async function verifyToken(token, secret) {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = await hmacHex(body, secret);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_) { return null; }
}

async function verifyStripeSignature(raw, header, secret) {
  const parts = header.split(',').map(x => x.trim());
  const timestamp = parts.find(x => x.startsWith('t='))?.slice(2);
  const signatures = parts.filter(x => x.startsWith('v1=')).map(x => x.slice(3));
  if (!timestamp || !signatures.length) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Math.floor(Date.now()/1000) - ts) > 300) return false;
  const expected = await hmacHex(`${timestamp}.${raw}`, secret);
  return signatures.some(sig => timingSafeEqual(sig, expected));
}

async function hmacHex(message, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i=0;i<a.length;i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function base64UrlEncode(bytes) {
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlDecode(text) {
  const padded = text.replace(/-/g,'+').replace(/_/g,'/') + '==='.slice((text.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value,10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max,n)) : fallback;
}
function json(data, status=200, extraHeaders={}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...extraHeaders } });
}
