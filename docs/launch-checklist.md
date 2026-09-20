# SafiSolutions Final Launch Checklist

## Already prepared in this package

- [x] Five products presented on the site
- [x] Launch and regular pricing centralized
- [x] Live Stripe Payment Links mapped for all products
- [x] Dedicated Choose-3 links for all 10 combinations
- [x] All-5 checkout linked
- [x] Obsolete generic Choose-3 Stripe links deactivated
- [x] Customer support page
- [x] Update-request flow
- [x] All inquiries route to `safihelal@gmail.com`
- [x] Terms page
- [x] Privacy page
- [x] Refund policy
- [x] Fake teaching Stripe-key example made obviously fake
- [x] Support-form honeypots
- [x] Secure download page prepared
- [x] Cloudflare Worker fulfillment code prepared
- [x] `salesEnabled: false` safety switch added

## Needs your Cloudflare/product files

- [ ] Upload the five final product packages to private R2
- [ ] Set exact R2 object paths in Wrangler config
- [ ] Add Stripe secret to Worker secrets
- [ ] Add a long random download-signing secret
- [ ] Deploy Worker and verify `/api/health`
- [ ] Create Stripe webhook after Worker URL exists
- [ ] Add Resend settings if you want detailed order emails

## Final QA

- [ ] Test one individual live purchase end-to-end
- [ ] Test one 3-app purchase end-to-end
- [ ] Test All-5 end-to-end
- [ ] Verify wrong/tampered product query does not expose another file
- [ ] Verify download links expire
- [ ] Verify support form arrives at Gmail
- [ ] Verify update request arrives at Gmail
- [ ] Verify Stripe successful-payment notifications are enabled for your Stripe user
- [ ] Scan final installers with Windows Defender / your preferred malware scanner
- [ ] Record SHA-256 hashes for final release files
- [ ] Review public Terms / Privacy / Refund wording
- [ ] Set `salesEnabled: true` in `LAUNCH_SWITCH.js`
- [ ] Publish

## After launch

- Keep the exact version in every uploaded filename.
- Never replace a file with different bytes while leaving the same version number.
- Keep prior major-version installers when practical for existing customers.
- Record support issues that repeat; those become the next maintenance release.
