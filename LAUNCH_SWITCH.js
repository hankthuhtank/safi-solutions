/*
  SAFISOLUTIONS STORE CONTROL

  Edit THIS file in GitHub for sales and pricing.
  salesEnabled: false/true
  pricingMode: "launch" or "regular"
  Change any launchPrice/regularPrice below as needed.

  The website AND Cloudflare Worker use this same file, so the
  displayed price and the actual Stripe charge stay synchronized.
*/
window.SAFI_STORE_CONTROL = {
  "_instructions": {
    "salesEnabled": "Set true to open production checkout. Keep false while testing.",
    "pricingMode": "Use launch or regular. This changes BOTH displayed price and actual Stripe checkout amount.",
    "priceEdits": "Edit launchPrice or regularPrice numbers here. No Stripe Payment Link edit is required.",
    "bundleNote": "bundle3 eligibleApps and bundle5 apps control which products are included."
  },
  "salesEnabled": false,
  "pricingMode": "launch",
  "checkoutWorker": "https://safisolutions-downloads.safisolutions.workers.dev",
  "testWorker": "https://safisolutions-downloads-test.safisolutions.workers.dev",
  "products": {
    "padeff": {
      "label": "Padeff",
      "launchPrice": 29,
      "regularPrice": 39
    },
    "piktoor": {
      "label": "Piktoor",
      "launchPrice": 29,
      "regularPrice": 39
    },
    "kwezeen": {
      "label": "Kwezeen",
      "launchPrice": 29,
      "regularPrice": 39
    },
    "doqcorp": {
      "label": "DoqCorp",
      "launchPrice": 29,
      "regularPrice": 39
    },
    "brandur": {
      "label": "Brandur",
      "launchPrice": 29,
      "regularPrice": 39
    },
    "doqdesk": {
      "label": "DoqDesk",
      "launchPrice": 29,
      "regularPrice": 39
    }
  },
  "bundle3": {
    "label": "Any 3 Bundle",
    "launchPrice": 79,
    "regularPrice": 100,
    "eligibleApps": [
      "padeff",
      "piktoor",
      "kwezeen",
      "doqcorp",
      "brandur"
    ]
  },
  "bundle5": {
    "label": "All 5 Bundle",
    "launchPrice": 99,
    "regularPrice": 149,
    "apps": [
      "padeff",
      "piktoor",
      "kwezeen",
      "doqcorp",
      "brandur"
    ]
  }
};