# SafiSolutions Free Products

All six desktop apps are free: Kwezeen, DoqCorp, Padeff, Piktoor, Brandur and DoqDesk.

Product pages use `LAUNCH_SWITCH.js` and `assets/store.js` to request `/api/free-download?product=...` from the existing download Worker. The website no longer uses payment links, checkout or purchase verification.

## Completed October 14, 2026

The all-free Worker is deployed to `safisolutions-downloads`, using the existing `PRODUCTS` binding and `safisolutions-products` R2 bucket. Its health endpoint reports all six products free and no Stripe integration. Kwezeen and DoqCorp signed download links were verified, and their website download buttons are active.

The former $19 product payment links and SafiSolutions order webhook are disabled in Stripe. No active payment links remain in the associated account. Old Stripe secrets may remain in Cloudflare but are unused by the replacement Worker.
