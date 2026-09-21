/*
  SAFISOLUTIONS STORE CONTROL

  Edit THIS file in GitHub for sales, pricing, and current product versions.
  salesEnabled: false/true
  pricingMode: "launch" or "regular"
  For updates: upload the new ZIP to R2, then change version + filePath below.

  The website AND Cloudflare Worker use this same file.
*/
window.SAFI_STORE_CONTROL = {
  "_instructions": {
    "salesEnabled": "Set true to open production checkout. Keep false while testing.",
    "pricingMode": "Use launch or regular. This changes BOTH displayed price and actual Stripe checkout amount.",
    "priceEdits": "Edit launchPrice or regularPrice numbers here. No Stripe Payment Link edit is required.",
    "bundleNote": "bundle3 and bundle5 eligibleApps control which products customers can choose.",
    "updates": "For a new app version, upload the new ZIP to R2 then change that product's version + filePath here. No Worker redeploy is needed."
  },
  "salesEnabled": true,
  "pricingMode": "launch",
  "checkoutWorker": "https://safisolutions-downloads.safisolutions.workers.dev",
  "testWorker": "https://safisolutions-downloads-test.safisolutions.workers.dev",
  "products": {
    "padeff": {
      "label": "Padeff",
      "launchPrice": 29,
      "regularPrice": 39,
      "version": "1.0",
      "filePath": "padeff/Padeff 1.0.zip"
    },
    "piktoor": {
      "label": "Piktoor",
      "launchPrice": 29,
      "regularPrice": 39,
      "version": "1.0",
      "filePath": "piktoor/Piktoor 1.0.zip"
    },
    "kwezeen": {
      "label": "Kwezeen",
      "launchPrice": 29,
      "regularPrice": 39,
      "version": "1.0",
      "filePath": "kwezeen/Kwezeen 1.0.zip"
    },
    "doqcorp": {
      "label": "DoqCorp",
      "launchPrice": 29,
      "regularPrice": 39,
      "version": "1.0",
      "filePath": "doqcorp/DoqCorp 1.0.zip"
    },
    "brandur": {
      "label": "Brandur",
      "launchPrice": 29,
      "regularPrice": 39,
      "version": "1.0",
      "filePath": "brandur/Brandur 1.0.zip"
    },
    "doqdesk": {
      "label": "DoqDesk",
      "launchPrice": 29,
      "regularPrice": 39,
      "version": "1.0",
      "filePath": "doqdesk/DoqDesk 1.0.zip"
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
      "brandur",
      "doqdesk"
    ]
  },
  "bundle5": {
    "label": "Any 5 Bundle",
    "launchPrice": 99,
    "regularPrice": 149,
    "eligibleApps": [
      "padeff",
      "piktoor",
      "kwezeen",
      "doqcorp",
      "brandur",
      "doqdesk"
    ]
  }
};
