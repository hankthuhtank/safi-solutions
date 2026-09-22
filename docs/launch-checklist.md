# SafiSolutions Launch Checklist — September 22, 2026 model

## Prepared in this package

- [x] Six desktop products presented on the site
- [x] Padeff, Piktoor, Brandur and DoqDesk moved to the free tier
- [x] Kwezeen and DoqCorp retained as the only paid desktop products
- [x] Paid launch/regular pricing centralized ($29 / $39)
- [x] Existing Stripe fallback links retained only for Kwezeen and DoqCorp
- [x] Bundle checkout removed from the storefront
- [x] Dedicated capability page created for every desktop product
- [x] TheTradingDesk elevated in navigation and homepage hierarchy
- [x] Terms, refunds, support and update copy aligned with the new model
- [x] Licensing language separates software redistribution rights from SafiSolutions branding and purchaser-specific support
- [x] SafiStudios/custom software moved away from low fixed-price packages to scope-based quoting
- [x] Secure paid-download page retained for Kwezeen and DoqCorp
- [x] Free-download Worker route handoff included

## Needed before the four free download buttons can go live

- [ ] Upload Padeff 1.0.zip, Piktoor 1.0.zip, Brandur 1.0.zip and DoqDesk 1.0.zip to R2 at the paths in `LAUNCH_SWITCH.js`
- [ ] Merge `deploy/cloudflare/free-download-route-snippet.js` into the deployed checkout/download Worker
- [ ] Deploy the Worker and verify the four free-download routes
- [ ] Set `freeDownloadsEnabled: true` in `LAUNCH_SWITCH.js`

## Paid-product QA

- [ ] Confirm Kwezeen and DoqCorp Price IDs / checkout routing in the deployed Worker
- [ ] Test one Kwezeen purchase end-to-end
- [ ] Test one DoqCorp purchase end-to-end
- [ ] Verify paid download links expire
- [ ] Verify a tampered product/session query cannot expose another paid file
- [ ] Verify support and update requests arrive correctly

## Release QA

- [ ] Scan final installers with Windows Defender / your preferred malware scanner
- [ ] Record SHA-256 hashes for the final release files
- [ ] Review public Terms / Privacy / Refund wording
- [ ] Publish

## After launch

- Keep the exact version in every uploaded filename.
- Never replace a file with different bytes while leaving the same version number.
- Keep prior major-version installers when practical.
- Treat recurring support issues as candidates for the next maintenance release.
