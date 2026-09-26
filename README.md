# Safi Solutions — website

**Live:** [safisolutions.org](https://www.safisolutions.org) · Complicated tasks, made simpler.

This folder is the whole site: upload it as-is (GitHub Pages, Cloudflare Pages or Netlify). There is no build step
for the site itself — every page is plain HTML, CSS and JavaScript.

## What's where

```
index.html            Landing page — the hero threads, recent work, about, contact form
projects/             All interactive projects (filterable)
products/             Desktop software shelf + one page per app (products/<app>.html)
websites/             Client websites
studio/               SafiStudios — custom business software
pricing.html  support.html  terms.html  privacy.html  refunds.html
download.html update.html   Customer download / update pages (not indexed)
404.html              Not-found page (also hands /thewell/* deep links back to The Well)

sportsatlas/          Sports Atlas — six sports explained from zero (new)
motoratlas/           MotorAtlas — how a car works, in a 3D X-ray
houseedge/            HouseEdge — casino games and the real math
voltvisual/           VoltVisual — industrial electrical systems
thetradeschool/       The TradeSchool — skilled trades
overtone/             Overtone — music theory you can hear
thebench/             The Bench — learn to code
thewell/              The Well — cocktails & bartending (React app; source in thewell/src)
cardesk/              CarDesk — vehicle tools
movedesk/             MoveDesk — relocation planning
vellum/               Vellum (unchanged)
                      TheTradingDesk lives on its own domain (thetradingdesk.org) and isn't in this folder.

assets/
  site.css site.js threads.js    Main pages: styles, behaviour, the hero's thread animation
  images/                        Logo, portrait, social-share image (og.jpg)
  project-logos/                 One logo per project — sportsatlas.svg is a placeholder
  showcase/                      Screenshots used on the landing and projects pages
  products/                      Desktop app screenshots
  js/machine3d.js                Shared 3D car model (MotorAtlas + CarDesk)
  vendor/                        three.js r186 and Leaflet 1.9.4, self-hosted
  store.js store-config.js       Checkout / download buttons (with LAUNCH_SWITCH.js)
  product-page.css studio.css    Styles for the product pages and pricing / support pages
LAUNCH_SWITCH.js     Store switches: sales on/off, launch pricing, free downloads
docs/                Internal notes (store, fulfilment, releases, security)
tools/               check-site.cjs · build-pages.py · hash-releases.ps1
```

## Everyday tasks

**Swap in the Sports Atlas logo.** Replace these two files, keeping the names:
`sportsatlas/assets/logo.svg` (top-left of every Sports Atlas page, shown 40 px tall) and
`assets/project-logos/sportsatlas.svg` (projects page). PNG works too — update the file extension where it's referenced.

**Add or edit a project, product or website on the main pages.** Edit the lists at the top of
`tools/build-pages.py`, then run `python3 tools/build-pages.py`. It rewrites the five main pages
(landing, projects, products, websites, studio) and nothing else. Add a 1280×800 screenshot to `assets/showcase/`
and a logo to `assets/project-logos/`.

**Check before publishing.** `node tools/check-site.cjs` — confirms every local link, image, script and sitemap URL
exists, and that the forms, store scripts and licence wording are in place.

**Sports Atlas content.** Pages are generated: edit `sportsatlas/_source/plans/<sport>.mjs`, then
`cd sportsatlas && node _source/build.mjs`.

**The Well.** `cd thewell && npm install && npm run build && cp dist/app.js dist/app.css .`

**HouseEdge photographs.** They're renders of the 3D scenes in `houseedge/_source/scenes.js`
(serve the folder locally, open `/houseedge/_source/render.html?scene=blackjack&w=1600&h=1066` and save the canvas image).

## Outside services the pages use

Google Fonts · FormSubmit (contact + support forms) · Stripe (checkout) · the Safi downloads worker on Cloudflare ·
MoveDesk: Open-Meteo, OSRM, Overpass and OpenStreetMap tiles · CarDesk: NHTSA vPIC and recalls ·
Overtone: FluidR3 instrument samples (falls back to its built-in synth) · MotorAtlas: Wikimedia Commons reference photos.
Everything else — including three.js, Leaflet and The Well's bundle — is served from this folder.

Paths are root-absolute (`/assets/…`), so the site expects to be served from the domain root, as it is now.

## September 2026 refresh — what changed

- **New landing page** and a split into Projects, Products, Websites and SafiStudios pages, sharing one rail
  and menu. Old links such as `index.html#products` or `#thebench` forward to the new pages automatically.
- **Sports Atlas** finished: six sports, 3D stadiums, animated diagrams, glossary and 2026 rule changes.
- **HouseEdge** rebuilt: rendered table photography, a live 3D roulette wheel, a basic-strategy trainer, and
  calculators for a night's cost, pot odds, parlays and bookmaker margin (helpline updated to 1-800-MY-RESET).
- **MotorAtlas / CarDesk**: shared 3D vehicle model. **MoveDesk**: interstate-sign design, self-hosted map.
- **VoltVisual**: drawing-set design, seal-in ladder rung, across-the-line starter schematic, readable type.
- **Overtone**: playable overtone-series hero. **The Bench**: live code-trace hero. **The TradeSchool**: cleaned up
  for visitors (internal audit notes moved to `thetradeschool/docs/archive`). **The Well**: built from source and
  self-hosted instead of loading from a CDN.
- Every page checked at phone width (390 px) for layout and overflow.
