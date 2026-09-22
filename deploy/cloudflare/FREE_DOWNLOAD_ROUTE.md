# Free download route needed before enabling the four free buttons

The website now expects:

`GET /api/free-download?product=padeff|piktoor|brandur|doqdesk`

Return JSON: `{ "url": "https://...short-lived-download..." }`.

Keep the R2 bucket private. The handler should allow only the four free product keys, map them to the file paths in `LAUNCH_SWITCH.js`, and return a short-lived signed `/api/file` URL or stream the file directly.

After that route is deployed and the four ZIPs exist in R2, set `freeDownloadsEnabled: true` in `/LAUNCH_SWITCH.js`.

Do not expose a permanent public R2 object URL just to make the free buttons work; the same private-bucket pattern used for paid fulfillment can serve the free files safely.
