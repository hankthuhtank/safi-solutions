# SafiSolutions Free Products

All six desktop apps are free: Kwezeen, DoqCorp, Padeff, Piktoor, Brandur and DoqDesk.

Product pages use `LAUNCH_SWITCH.js` and `assets/store.js` to request `/api/free-download?product=...` from the existing download Worker. The website no longer uses payment links, checkout or purchase verification.

## Pending server change

As of October 14, 2026, the deployed `safisolutions-downloads` Worker still lists Kwezeen and DoqCorp as paid and rejects them at the free-download endpoint. Its source is not in this repository. Add both products to the free endpoint using their existing R2 installer objects, then remove `downloadEnabled:false` for both entries in `LAUNCH_SWITCH.js` after verifying the downloads.

Remove the Worker checkout, payment verification and payment webhook routes and their payment secrets once no longer needed. The two former $19 product payment links and the SafiSolutions order webhook were disabled in Stripe on October 14, 2026. No active payment links remain in the associated account. The Cloudflare changes remain pending because its dashboard sign-in failed.
