# SafiSolutions storefront model

## Free tools
- Padeff
- Piktoor
- Brandur
- DoqDesk

These do not use Stripe. Their product pages call `/api/free-download?product=...` only after `freeDownloadsEnabled` is set to true in `LAUNCH_SWITCH.js`. Keep the R2 files private and return short-lived Worker URLs.

## Paid apps
- Kwezeen — $29 launch / $39 regular
- DoqCorp — $29 launch / $39 regular

No bundles are offered. Paid checkout continues through the SafiSolutions checkout Worker with the existing Stripe Payment Links as a browser fallback. Successful payment redirects to `download.html?session_id={CHECKOUT_SESSION_ID}` for verified private delivery.

## Product pages
Every desktop app has a dedicated page in `/products/` with a feature tour and the existing product screenshots.
