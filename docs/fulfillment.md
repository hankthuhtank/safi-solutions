# SafiSolutions Secure Fulfillment Setup

This package already contains the storefront, Stripe Payment Links, secure `download.html`, and a Cloudflare Worker implementation. The only launch-critical pieces that still require your Cloudflare account and the actual installer files are deployment/configuration.

## What the Worker does

- Accepts the Stripe Checkout Session ID after payment.
- Retrieves that Checkout Session directly from Stripe using a server-side secret.
- Requires `payment_status=paid`.
- Ignores `product=` and `combo=` browser query parameters as proof of ownership.
- Derives the purchased product from Stripe Price IDs and verified bundle metadata.
- Creates a short-lived signed token for each entitled product.
- Streams the private file from R2 through `/api/file`.
- Never exposes R2 credentials or permanent public object URLs.
- Includes a verified Stripe webhook endpoint for optional itemized order emails.

## 1. Create the private bucket

Create an R2 bucket named:

`safisolutions-products`

Keep the bucket private.

Suggested object layout:

```text
padeff/Padeff-1.0.zip
piktoor/Piktoor-1.0.zip
kwezeen/Kwezeen-1.0.zip
doqcorp/DoqCorp-1.0.zip
brandur/Brandur-1.0.zip
```

The filenames do not have to match those examples. After upload, put the exact object keys into `deploy/cloudflare/wrangler.toml`.

## 2. Prepare the Worker

Inside the `deploy/cloudflare` folder:

1. Copy `wrangler.toml.example` to `wrangler.toml`.
2. Confirm the R2 bucket name and object paths.
3. Install/use Cloudflare Wrangler.
4. Add production secrets with Wrangler. Do **not** type the real secrets into the website files.

Required secrets:

```text
STRIPE_SECRET_KEY
DOWNLOAD_SIGNING_SECRET
```

For webhook order email automation, also add:

```text
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
```

`DOWNLOAD_SIGNING_SECRET` should be a long random value used only for SafiSolutions.

## 3. Deploy the Worker

Deploy `deploy/cloudflare/worker.js` with the `/api/*` routes from the example Wrangler config.

After deployment, this URL should return JSON showing the configuration state:

`https://www.safisolutions.org/api/health`

Do not enable storefront checkout until it reports the required fulfillment pieces as configured.

## 4. Stripe webhook

After the Worker is live, create a Stripe webhook endpoint:

`https://www.safisolutions.org/api/stripe-webhook`

Subscribe to:

`checkout.session.completed`

Copy the webhook signing secret into the Worker as `STRIPE_WEBHOOK_SECRET`.

The Worker can send the itemized order email to:

`safihelal@gmail.com`

The included example uses Resend for email delivery. `ORDER_FROM_EMAIL` must be a sender/domain that Resend allows you to send from.

## 5. Test before launch

Test at least:

- one individual app purchase
- one Choose-3 combination
- the All-5 bundle
- tampering with `product=` or `combo=` in the URL
- an unpaid/canceled Checkout Session
- an expired download token
- a support request
- an update request

A tampered browser URL must never change the entitlements returned by `/api/fulfill`.

## 6. Turn sales on

Only after the above succeeds, open:

`LAUNCH_SWITCH.js`

Change only this line:

```js
salesEnabled: false,
```

to:

```js
salesEnabled: true,
```

That activates every existing live Stripe checkout button at once.
