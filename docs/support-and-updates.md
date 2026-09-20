# SafiSolutions customer support + updates

## Immediate support path
- `support.html` contains a Product Support form and Update Request form.
- Both send directly to the existing SafiSolutions FormSubmit email.
- Customers use the same email used at Stripe checkout so the order can be matched manually.

## Recommended fulfillment/update model
1. Stripe creates a Customer record for each purchase and retains the purchase email.
2. Cloudflare Worker receives `checkout.session.completed`.
3. Worker records purchased product(s), purchase email, Stripe session ID, purchase date and entitlement.
4. R2 stores versioned private product packages, for example `padeff/Padeff-1.0.0.zip`.
5. `download.html` calls `/api/fulfill` with the Stripe Checkout Session ID.
6. The Worker verifies the paid Stripe session and returns short-lived signed Worker download URLs for only the entitled product files.
7. `support.html` remains the manual fallback for support and update requests.

No customer account or subscription is required.

## Order notification
Enable Stripe account email notification for successful payments in Stripe Communication preferences. The included Cloudflare Worker also contains a verified `checkout.session.completed` webhook handler that can send an itemized order email to `safihelal@gmail.com` once Resend is configured.
