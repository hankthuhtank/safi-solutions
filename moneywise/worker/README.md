# Moneywise live rates (Cloudflare Worker)

Moneywise shows FRED numbers (mortgage rates, the Fed's target range, the 10-year Treasury, inflation, unemployment and a few more). Browsers can't call FRED directly (no CORS, and the API key would be public), so this Worker sits in between:

- keeps the FRED API key server-side as a Worker secret
- returns every series in one response, cached at the edge for 24 hours
- serves the last good copy (`"stale": true`) if FRED is down
- only answers pages on `safisolutions.org`

Until the Worker is deployed and `apiUrl` is set, the site uses the bundled snapshot in `moneywise/data/rates-snapshot.json`, and every number says "Snapshot" with its date.

## Deploy (one time, about 5 minutes)

1. Get a free FRED API key: https://fred.stlouisfed.org/docs/api/api_key.html
2. From this folder:
   ```
   npx wrangler login
   npx wrangler secret put FRED_API_KEY      # paste the key when asked
   npx wrangler deploy
   ```
   Wrangler prints the address, e.g. `https://moneywise-rates.safisolutions.workers.dev`.
3. Check it: open `<address>/v1/rates` in a browser. You should see JSON with `"mode":"live"`.
4. Put the address in `moneywise/js/config.js` (`apiUrl`), commit and push.

## Refreshing the fallback snapshot

The snapshot is what visitors see if the Worker can't be reached. Refresh it whenever you like (no key needed):

```
node moneywise/tools/refresh-snapshot.mjs
```

(Behind a corporate proxy on Node 22, prefix it with `NODE_USE_ENV_PROXY=1`.)

## Files

- `worker.js`: the Worker (routing, CORS, cache, stale fallback)
- `series.js`: the series list and the JSON shape, shared with the snapshot script
- `wrangler.toml`: Worker name and settings
