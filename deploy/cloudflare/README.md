# SafiSolutions Cloudflare Worker

This Worker is the backend for the desktop software storefront.

## Routes
- POST /api/checkout
- GET /api/fulfill?session_id=...
- POST /api/update-access
- GET /api/free-download?product=...
- GET /api/file?...signed token...
- GET /api/health

## Required Worker secrets
- STRIPE_SECRET_KEY
- DOWNLOAD_SIGNING_SECRET

## R2 binding
- Binding: PRODUCTS
- Bucket: safisolutions-products

## Paid Stripe price IDs
Kwezeen:
- launch: price_1UGsqfJLh7fc6HG4vlYl0Itw
- regular: price_1UGsqhJLh7fc6HG4KXkI7Htn

DoqCorp:
- launch: price_1UGsqjJLh7fc6HG4xwC1U4or
- regular: price_1UGsqmJLh7fc6HG4xJxOwx81

## Expected R2 object keys
- padeff/Padeff 1.0.zip
- piktoor/Piktoor 1.0.zip
- kwezeen/Kwezeen 1.0.zip
- doqcorp/DoqCorp 1.0.zip
- brandur/Brandur 1.0.zip
- doqdesk/DoqDesk 1.0.zip

Keep the bucket private. All downloads are streamed through expiring Worker URLs.
