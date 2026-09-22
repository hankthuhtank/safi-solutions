# SafiSolutions site rebuild — 2026-09-22

## Public product model

### Free
- Padeff
- Piktoor
- Brandur
- DoqDesk

### Paid
- Kwezeen — $29 launch / $39 regular, one-time
- DoqCorp — $29 launch / $39 regular, one-time

The old multi-app bundle storefront has been removed.

## Site changes

- Added dedicated product capability pages for all six desktop apps under `/products/`.
- Product pages use the existing product screenshots and put the complete capability summary above the screenshots.
- Elevated TheTradingDesk to the second primary navigation position and moved its full homepage feature directly after Products.
- Reworked Products messaging around four free utilities and two focused paid products.
- Rewrote Terms so open/shareable software rights no longer conflict with purchaser-specific support/update access.
- Updated Refunds, Support, Privacy, Update and Download copy to match the new model.
- Replaced low fixed-price SafiStudios/custom-software packages with scope-based quotes.
- Removed old bundle checkout UI/config/docs.
- Added all six product pages to `sitemap.xml`.

## Free-download activation

The website archive supplied for this rebuild did not include the four installer ZIPs or the source of the currently deployed Cloudflare checkout/download Worker. The site therefore does not invent public file URLs.

To activate the free buttons:
1. Upload the four installer ZIPs to R2 using the object paths in `LAUNCH_SWITCH.js`.
2. Merge `deploy/cloudflare/free-download-route-snippet.js` into the deployed Worker.
3. Verify `GET /api/free-download?product=<slug>` for each free app.
4. Change `freeDownloadsEnabled` to `true` in `LAUNCH_SWITCH.js`.

Until then, the storefront JavaScript changes free download buttons to a setup-pending state rather than sending visitors to a broken file.
