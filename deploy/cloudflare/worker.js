const SITE_ORIGIN = "https://www.safisolutions.org";

const PAID_PRODUCTS = {
  kwezeen: {
    label: "Kwezeen",
    version: "1.0",
    file: "kwezeen/Kwezeen 1.0.zip",
    prices: {
      launch: "price_1UGsqfJLh7fc6HG4vlYl0Itw",
      regular: "price_1UGsqhJLh7fc6HG4KXkI7Htn"
    }
  },
  doqcorp: {
    label: "DoqCorp",
    version: "1.0",
    file: "doqcorp/DoqCorp 1.0.zip",
    prices: {
      launch: "price_1UGsqjJLh7fc6HG4xwC1U4or",
      regular: "price_1UGsqmJLh7fc6HG4xJxOwx81"
    }
  }
};

const FREE_PRODUCTS = {
  padeff: { label: "Padeff", version: "1.0", file: "padeff/Padeff 1.0.zip" },
  piktoor: { label: "Piktoor", version: "1.0", file: "piktoor/Piktoor 1.0.zip" },
  brandur: { label: "Brandur", version: "1.0", file: "brandur/Brandur 1.0.zip" },
  doqdesk: { label: "DoqDesk", version: "1.0", file: "doqdesk/DoqDesk 1.0.zip" }
};

const PRICE_TO_PRODUCT = Object.fromEntries(
  Object.entries(PAID_PRODUCTS).flatMap(([key, product]) =>
    Object.values(product.prices).map(price => [price, key])
  )
);

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));

      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({
          ok: true,
          stripe: Boolean(env.STRIPE_SECRET_KEY),
          signing: Boolean(env.DOWNLOAD_SIGNING_SECRET),
          bucket: Boolean(env.PRODUCTS),
          pricingMode: env.PRICING_MODE === "regular" ? "regular" : "launch",
          paidProducts: Object.keys(PAID_PRODUCTS),
          freeProducts: Object.keys(FREE_PRODUCTS)
        });
      }

      if (url.pathname === "/api/checkout" && request.method === "POST") {
        return await createCheckout(request, env);
      }

      if (url.pathname === "/api/fulfill" && request.method === "GET") {
        return await fulfillPurchase(request, env);
      }

      if (url.pathname === "/api/update-access" && request.method === "POST") {
        return await updateAccess(request, env);
      }

      if (url.pathname === "/api/free-download" && request.method === "GET") {
        return await freeDownload(request, env);
      }

      if (url.pathname === "/api/file" && request.method === "GET") {
        return await serveSignedFile(request, env);
      }

      return json({ error: "Not found." }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: error?.message || "Server error." }, Number(error?.status) || 500);
    }
  }
};

async function createCheckout(request, env) {
  requireSecrets(env);
  const body = await readJson(request);
  const productKey = String(body.product || "").toLowerCase();
  const product = PAID_PRODUCTS[productKey];
  if (!product) return json({ error: "Unknown paid product." }, 400);

  const requestedMode = body.pricing === "regular" ? "regular" : "launch";
  const serverMode = env.PRICING_MODE === "regular" ? "regular" : "launch";
  const pricingMode = serverMode === "regular" ? "regular" : requestedMode;
  const price = product.prices[pricingMode];

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("line_items[0][price]", price);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", `${SITE_ORIGIN}/download.html?session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${SITE_ORIGIN}/products/${productKey}.html`);
  form.set("client_reference_id", productKey);
  form.set("metadata[product]", productKey);
  form.set("metadata[pricing_mode]", pricingMode);
  form.set("submit_type", "pay");

  const session = await stripeRequest(env, "/v1/checkout/sessions", {
    method: "POST",
    body: form
  });

  return json({ url: session.url });
}

async function fulfillPurchase(request, env) {
  requireSecrets(env);
  const url = new URL(request.url);
  const sessionId = String(url.searchParams.get("session_id") || "");
  if (!sessionId.startsWith("cs_")) return json({ error: "Invalid purchase reference." }, 400);

  const entitlement = await verifySession(sessionId, env);
  if (!entitlement.products.length) return json({ error: "No supported product entitlement was found." }, 403);

  const downloads = [];
  const unavailable = [];

  for (const key of entitlement.products) {
    const product = PAID_PRODUCTS[key];
    const object = await env.PRODUCTS.head(product.file);
    if (!object) {
      unavailable.push(product.label);
      continue;
    }
    downloads.push({
      product: key,
      label: product.label,
      version: product.version,
      url: await signedFileUrl(request, env, key, product.file, 10 * 60)
    });
  }

  return json({
    paid: true,
    purchase_email: entitlement.email,
    downloads,
    unavailable
  });
}

async function updateAccess(request, env) {
  requireSecrets(env);
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const reference = extractSessionId(body.reference);
  if (!email || !reference) return json({ error: "Enter the purchase email and a valid purchase reference." }, 400);

  const entitlement = await verifySession(reference, env);
  if (!entitlement.email || normalizeEmail(entitlement.email) !== email) {
    return json({ error: "That email does not match the original Stripe purchase." }, 403);
  }

  const downloads = [];
  const unavailable = [];
  for (const key of entitlement.products) {
    const product = PAID_PRODUCTS[key];
    const object = await env.PRODUCTS.head(product.file);
    if (!object) {
      unavailable.push(product.label);
      continue;
    }
    downloads.push({
      product: key,
      label: product.label,
      version: product.version,
      url: await signedFileUrl(request, env, key, product.file, 10 * 60)
    });
  }

  return json({ downloads, unavailable });
}

async function freeDownload(request, env) {
  if (!env.PRODUCTS || !env.DOWNLOAD_SIGNING_SECRET) {
    return json({ error: "Free downloads are not configured yet." }, 503);
  }

  const url = new URL(request.url);
  const productKey = String(url.searchParams.get("product") || "").toLowerCase();
  const product = FREE_PRODUCTS[productKey];
  if (!product) return json({ error: "Unknown free product." }, 404);

  const object = await env.PRODUCTS.head(product.file);
  if (!object) return json({ error: "Free build is not uploaded yet." }, 404);

  return json({
    url: await signedFileUrl(request, env, productKey, product.file, 10 * 60),
    product: productKey,
    label: product.label,
    version: product.version
  });
}

async function serveSignedFile(request, env) {
  if (!env.PRODUCTS || !env.DOWNLOAD_SIGNING_SECRET) {
    return json({ error: "Downloads are not configured." }, 503);
  }

  const url = new URL(request.url);
  const product = String(url.searchParams.get("product") || "").toLowerCase();
  const key = String(url.searchParams.get("key") || "");
  const exp = Number(url.searchParams.get("exp") || 0);
  const sig = String(url.searchParams.get("sig") || "");

  if (!product || !key || !Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return json({ error: "This download link has expired." }, 403);
  }

  const known = PAID_PRODUCTS[product] || FREE_PRODUCTS[product];
  if (!known || known.file !== key) return json({ error: "Invalid download." }, 403);

  const expected = await sign(env.DOWNLOAD_SIGNING_SECRET, `${product}|${key}|${exp}`);
  if (!timingSafeEqual(sig, expected)) return json({ error: "Invalid download signature." }, 403);

  const object = await env.PRODUCTS.get(key);
  if (!object) return json({ error: "File not found." }, 404);

  const filename = key.split("/").pop() || "download.zip";
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/zip");
  headers.set("Content-Disposition", `attachment; filename="${filename.replace(/"/g, "")}"`);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("X-Content-Type-Options", "nosniff");

  return cors(new Response(object.body, { headers }));
}

async function verifySession(sessionId, env) {
  const session = await stripeRequest(env, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session.payment_status !== "paid") throw httpError("Payment has not been completed.", 403);

  const lineItems = await stripeRequest(
    env,
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}/line_items?limit=20`
  );

  const products = [...new Set(
    (lineItems.data || [])
      .map(item => PRICE_TO_PRODUCT[item.price?.id])
      .filter(Boolean)
  )];

  return {
    products,
    email: session.customer_details?.email || session.customer_email || ""
  };
}

async function stripeRequest(env, path, options = {}) {
  if (!env.STRIPE_SECRET_KEY) throw httpError("Stripe is not configured.", 503);

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${env.STRIPE_SECRET_KEY}`);
  if (options.body instanceof URLSearchParams) {
    headers.set("Content-Type", "application/x-www-form-urlencoded");
  }

  const response = await fetch(`https://api.stripe.com${path}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Stripe error", data);
    throw httpError(data?.error?.message || "Stripe request failed.", response.status);
  }
  return data;
}

async function signedFileUrl(request, env, product, key, ttlSeconds) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = await sign(env.DOWNLOAD_SIGNING_SECRET, `${product}|${key}|${exp}`);
  const origin = new URL(request.url).origin;
  const url = new URL("/api/file", origin);
  url.searchParams.set("product", product);
  url.searchParams.set("key", key);
  url.searchParams.set("exp", String(exp));
  url.searchParams.set("sig", sig);
  return url.toString();
}

async function sign(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(new Uint8Array(signature));
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function extractSessionId(value) {
  const raw = String(value || "").trim();
  const direct = raw.match(/cs_[A-Za-z0-9_]+/);
  return direct ? direct[0] : "";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

function requireSecrets(env) {
  if (!env.STRIPE_SECRET_KEY || !env.DOWNLOAD_SIGNING_SECRET || !env.PRODUCTS) {
    throw httpError("Fulfillment is not fully configured.", 503);
  }
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function json(data, status = 200) {
  return cors(new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  }));
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", SITE_ORIGIN);
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type,Accept");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
