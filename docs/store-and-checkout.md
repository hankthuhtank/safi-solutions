# SafiSolutions storefront model

## Free tools
- Padeff
- Piktoor
- Brandur
- DoqDesk

These do not use Stripe. Their product pages call `/api/free-download?product=...` only after `freeDownloadsEnabled` is set to true in `LAUNCH_SWITCH.js`. Keep the R2 files private and return short-lived Worker URLs.

## Paid apps
- Kwezeen — $19 one-time
- DoqCorp — $19 one-time

Paid checkout uses the permanent $19 Stripe Payment Links. The checkout Worker also uses only these permanent prices; historical Price IDs remain valid for secure fulfillment and update access. Successful payment redirects to `download.html?session_id={CHECKOUT_SESSION_ID}` for verified private delivery.

## Product pages
Every desktop app has a dedicated page in `/products/` with a feature tour and the existing product screenshots.

