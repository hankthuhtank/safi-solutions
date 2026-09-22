# SafiSolutions Security Notes

## Frontend

The public website may contain Stripe Payment Link URLs. Those are public checkout URLs and are safe to expose.

The public website must **never** contain:

- Stripe secret keys (`sk_live_...`)
- Stripe webhook signing secrets (`whsec_...`)
- R2 access credentials
- Resend API keys
- download-signing secrets

Real secrets belong only in Cloudflare Worker secrets/environment configuration.

## Download authorization

Do not authorize downloads using browser query parameters such as `product=`, filenames, hidden form fields, or JavaScript values.

The included Worker retrieves the Checkout Session directly from Stripe, checks that it is paid, and derives entitlement from Stripe Price IDs for Kwezeen or DoqCorp.

## R2

Keep the product bucket private. Do not turn on public object URLs for paid installers.

The included Worker streams R2 objects only after a signed short-lived download token is validated.

## Repository hygiene

`.gitignore` excludes `.env`, `.dev.vars`, and Wrangler state. Never commit a file after inserting a real secret just because it is later deleted; rotate any secret that reaches Git history.

## Reporting

Security issues can be reported to `safihelal@gmail.com`.
