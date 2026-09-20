# Safi Solutions

Production website repository for SafiSolutions.org.

## Launch switch

The one file you need for opening the store is:

`LAUNCH_SWITCH.js`

Before fulfillment is ready:

```js
salesEnabled: false,
```

When Cloudflare R2 + the Worker are deployed and tested, change it to:

```js
salesEnabled: true,
```

After publishing that change, product buttons stop showing **Launching soon** and resume their normal checkout actions (**Buy once**, **Choose 3**, and **Get 5**).

The same file also contains `launchPricing`. Leave it `true` for launch pricing; switch it to `false` later to use the regular prices and regular Stripe Payment Links already configured in `assets/store-config.js`.

## Repository layout

```text
/
├── index.html                 Main SafiSolutions site
├── LAUNCH_SWITCH.js          Simple public-store on/off switch
├── support.html              Customer support / update requests
├── download.html             Post-purchase secure fulfillment page
├── terms.html                Public terms
├── privacy.html              Public privacy policy
├── refunds.html              Public refund policy
├── assets/                   Shared styles, scripts, product media, logos
├── deploy/cloudflare/        R2 / Worker deployment files
├── docs/                     Launch, security, fulfillment, release notes
│   └── internal/            Development-only historical notes
├── tools/                    QA and release utilities
├── cardesk/                  Portfolio project
├── houseedge/                Portfolio project
├── motoratlas/               Portfolio project
├── movedesk/                 Portfolio project
├── overtone/                 Portfolio project
├── thebench/                 Portfolio project
├── thetradeschool/           Portfolio project
├── thewell/                  Portfolio project
├── vellum/                   Portfolio project
└── voltvisual/               Portfolio project
```

## Documentation

- `docs/launch-checklist.md` — final pre-launch checklist
- `docs/store-and-checkout.md` — Stripe pricing and checkout mapping
- `docs/fulfillment.md` — Cloudflare R2 + Worker deployment
- `docs/security.md` — secrets and download-security rules
- `docs/support-and-updates.md` — support/update model
- `docs/releases.md` — product release/version process

## Important

Do not set `salesEnabled: true` until all five products are in the private R2 bucket and `/api/fulfill` has been tested against paid Stripe Checkout Sessions.

All customer inquiries, support requests, and update requests route to `safihelal@gmail.com`.


## Final UI notes
- Motion follows the visitor's operating-system reduced-motion preference; there is no on-page motion toggle.
- Mobile layouts have a dedicated small-screen pass for products, projects, websites, support, and legal pages.
- The sidebar index keeps products 01-05 and selected projects at 09-12 (Vellum, The Well, MotorAtlas, The Bench).
