# SafiSolutions Checkout Setup

Stripe is configured with live-mode products, launch prices, regular prices, and Payment Links for:

- Padeff
- Piktoor
- Kwezeen
- DoqCorp
- Brandur
- Any 3 bundle
- All 5 bundle

## Pre-launch checkout safety

`LAUNCH_SWITCH.js` contains:

```js
salesEnabled: false,
```

Leave this `false` until the Cloudflare R2 bucket, Worker, Stripe verification, and end-to-end test are complete. Then switch it to `true` to activate all checkout buttons.

## Easy price management

Open `LAUNCH_SWITCH.js`.

To end launch pricing everywhere on the website, change:

```js
launchPricing: true,
```

to:

```js
launchPricing: false,
```

That switches the displayed prices and all checkout buttons from the launch Stripe links to the regular-price Stripe links.

If pricing changes again later, create the new Stripe Price/Payment Link and update only `assets/store-config.js`.

## Bundle behavior

The $79 Any 3 flow is selected on SafiSolutions before Stripe. The chooser maps the selected three apps to one of 10 dedicated Stripe Payment Links, each with bundle metadata.

The $99 All 5 checkout includes all five apps automatically.

## Remaining fulfillment backend

Stripe currently redirects successful payments to:

`https://www.safisolutions.org/download.html?session_id={CHECKOUT_SESSION_ID}&product=...`

`download.html` is included so the route exists, but secure delivery is not connected yet.

When the installers are available on the desktop PC:

1. Upload installers/ZIPs to a private Cloudflare R2 bucket.
2. Add the small server-side endpoint that verifies the Stripe Checkout Session.
3. Map the purchased product/bundle to the correct R2 objects.
4. Return short-lived signed download tokens that stream only the purchased R2 object(s).
5. Deploy the included `deploy/cloudflare/worker.js` and route `/api/*` to it.
6. Test individual, Choose-3, and All-5 purchases before setting `salesEnabled: true` in `LAUNCH_SWITCH.js`.


## Simple price management
Checkout URLs and price amounts are centralized in `assets/store-config.js`; launch controls are in `LAUNCH_SWITCH.js`.
- `launchPricing: true` = launch prices/links
- `launchPricing: false` = regular prices/links
- The Choose 3 flow uses the `bundle3.combinations` map so buyers select their three apps on SafiSolutions before Stripe.
