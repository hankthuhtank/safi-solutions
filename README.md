# Safi Solutions website

**Live:** [safisolutions.org](https://www.safisolutions.org) · Complicated tasks, made simpler.

This folder is the whole site: upload it as-is (GitHub Pages, Cloudflare Pages or Netlify). There is no build step
for the site itself. Every page is plain HTML, CSS and JavaScript.

## What's where

```
index.html            Landing page: the hero, the thread animation and seven doors into the site
products/             Desktop software shelf, plus one page per app (products/<app>.html)
projects/             All interactive projects as logo tiles; each tile opens a detail view (projects/#motoratlas)
websites/             Client websites (Elizabeth Aven and Baker Precision logos, plus the "also live" list)
tradingdesk/          TheTradingDesk: "Markets Simplified", linking out to thetradingdesk.org
studio/               SafiStudios: custom business software
about/                About Helal
contact/              Contact form (FormSubmit)
pricing.html  support.html  terms.html  privacy.html  refunds.html
download.html update.html   Customer download / update pages (not indexed)
404.html              Not-found page (also hands /thewell/* deep links back to The Well)

playbook/             Playbook: six sports explained from zero (formerly Sports Atlas)
motoratlas/           MotorAtlas: how a car works, in a 3D X-ray (with an Expand view button)
houseedge/            HouseEdge: casino games and the real math
voltvisual/           VoltVisual: industrial electrical systems
thetradeschool/       The TradeSchool: skilled trades
overtone/             Overtone: music theory you can hear
thebench/             The Bench: learn to code
thewell/              The Well: cocktails and bartending (see "The Well" below)
cardesk/              CarDesk: vehicle tools
movedesk/             MoveDesk: relocation planning
vellum/               Vellum
                      TheTradingDesk itself lives on its own domain (thetradingdesk.org) and isn't in this folder.

assets/
  site.css site.js threads.js    Main pages: styles, behaviour, the hero's thread animation
  images/                        Logo, portrait, social-share image (og.jpg)
  project-logos/                 One logo per project (The Well's header also loads thewell.jpg from here)
  website-logos/                 Client logos used on the Websites page
  showcase/                      Screenshots used on the project detail views
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

**Playbook logo.** Three files: `playbook/assets/logo.webp` (top-left of every Playbook page, shown 40 px tall),
`assets/project-logos/playbook.webp` (its tile on the Projects page) and `playbook/assets/img/favicon.png`.
Replace them keeping the names to update the logo everywhere.

**Add or edit a project, product or website on the main pages.** Edit the lists at the top of
`tools/build-pages.py`, then run `python3 tools/build-pages.py`. It rewrites the main pages (landing, projects,
products, websites, TheTradingDesk, studio, about, contact) and nothing else. A project needs a logo in
`assets/project-logos/`, a tile colour, and a 1280×800 screenshot in `assets/showcase/` for its detail view.

**Check before publishing.** `node tools/check-site.cjs` confirms every local link, image, script and sitemap URL
exists, and that the forms, store scripts and licence wording are in place.

**Playbook content.** Pages are generated: edit `playbook/_source/plans/<sport>.mjs`, then
`cd playbook && node _source/build.mjs`. Old `/sportsatlas/...` links are forwarded to `/playbook/...` by `404.html`.

**HouseEdge photographs.** They're renders of the 3D scenes in `houseedge/_source/scenes.js`
(serve the folder locally, open `/houseedge/_source/render.html?scene=blackjack&w=1600&h=1066` and save the canvas image).

## The Well

`thewell/` is intentionally minimal: it contains only the live entry page and favicon. `thewell/index.html` loads
the exact app version from the separate **the-well** repository through jsDelivr, pinned to one commit
(`cdn.jsdelivr.net/gh/hankthuhtank/the-well@<commit>/dist-portfolio/...`). Its top-left logo is
`/assets/project-logos/thewell.jpg` from this site, with `thewell.svg` as a fallback. The entry page keeps that logo
visible even if the pinned app bundle tries to replace the image. To publish a new version of The Well, build it in the
separate repository and update only the two pinned CDN URLs in `thewell/index.html`. Do not copy source/build folders
back into `thewell/`; they are not used by the live Safi Solutions page.

## Outside services the pages use

Google Fonts · FormSubmit (contact and support forms) · Stripe (checkout) · the Safi downloads worker on Cloudflare ·
jsDelivr (The Well) · the Elizabeth Aven logo, loaded from elizabethavenphotography.com ·
MoveDesk: Open-Meteo, OSRM, Overpass and OpenStreetMap tiles · CarDesk: NHTSA vPIC and recalls ·
Overtone: FluidR3 instrument samples (falls back to its built-in synth) · MotorAtlas: Wikimedia Commons reference photos.
Everything else, including three.js and Leaflet, is served from this folder.

Paths are root-absolute (`/assets/…`), so the site expects to be served from the domain root, as it is now.

## Writing style

Site copy avoids em dashes. Use a comma, colon, period or parentheses instead.

## September 2026 refresh: what changed

- **Landing page** is just the hero: "Complicated tasks. Made simpler." with seven doors in the order Products,
  Projects, Websites, TheTradingDesk, SafiStudios, About Me, Contact. About and Contact are their own pages, and
  TheTradingDesk has its own page again (also in the side rail, under SafiStudios).
- **Projects** uses the original logo-tile layout; clicking a tile opens its detail view with a screenshot,
  "Open live project" and "Add to phone". Old links such as `index.html#products`, `#thebench`, `#markets`,
  `#about` or `#contact` forward to the right page automatically.
- **Websites** shows the Elizabeth Aven and Baker Precision logos.
- **Playbook** (first published as Sports Atlas) finished: six sports, 3D stadiums, animated diagrams, glossary and
  2026 rule changes, with its own logo.
- **HouseEdge** rebuilt: rendered table photography, a live 3D roulette wheel, a basic strategy trainer, and
  calculators for a night's cost, pot odds, parlays and bookmaker margin (helpline 1-800-MY-RESET).
- **MotorAtlas / CarDesk**: shared 3D vehicle model; MotorAtlas adds an Expand view that fills the screen.
- **MoveDesk**: interstate-sign design, self-hosted map. **VoltVisual**: drawing-set design, seal-in ladder rung,
  across-the-line starter schematic, readable type. **Overtone**: playable overtone-series hero. **The Bench**: live
  code-trace hero, key points shown as term + definition. **The TradeSchool**: cleaned up for visitors (internal audit
  notes moved to `thetradeschool/docs/archive`).
- **The Well** is unchanged from the version before the refresh.
- Em dashes were removed from the text of every page.
- Every page checked at phone width (390 px) for layout and overflow.
