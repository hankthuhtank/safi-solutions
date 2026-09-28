# TradeSchool: how the app is put together

A static single-page app: no build step. `index.html` loads plain scripts **in this order** (order matters: later layers edit what earlier ones define):

| Order | File(s) | What it does |
|---|---|---|
| 1 | `js/content/base-data.js` | The six trades, units, concepts, standards list |
| 2 | `js/content/electrical.js`, `hvac-plumbing.js`, `industrial-welding-construction.js` | Topic content per trade |
| 3 | `js/content/v8-overrides.js`, `v10-visuals.js`, `v14-media-fill.js` | Earlier editorial passes: corrections, diagrams, media |
| 4 | `js/content/v15-media.js` → `v15-currency.js` → `v15-deboilerplate.js` | Media integrity, standards/currency updates, repeated-text removal |
| 5 | `js/content/v16-beginner.js`, `v16-context.js` | Beginner-first explanations and vocabulary (data only) |
| 6 | `js/content/v18-media.js`, `js/3d/rig-index.js` | Retires photos the 3D models replace; which model part every topic lives on |
| 7 | `js/core/app.js` | Router, views (home, trade, unit, topic), search, labs |
| 8 | `js/core/labs-v15.js`, `rig-ui.js`, `fieldcheck.js` | Rebuilt labs, the 3D plates, field-decision drill |

Styles: `css/main.css` → `css/v15.css` → `css/rig.css` → `css/v18.css` → `css/fieldcheck.css`.

## 3D models (V18)

Every trade is a procedural three.js model, built in code from real dimensions and colour codes, with 425 of the 428 topics placed on a named part. One WebGL renderer serves the whole app: the canvas moves from page to page.

| File | Job |
|---|---|
| `js/3d/engine.js` | The stage: camera framing, labels with leader lines, picking, unit focus, flows, modes, build layers |
| `js/3d/kit.js` | Geometry and material helpers shared by the models |
| `js/3d/models/<trade>.js` | One model per trade. `meta.systems` keys are the course unit ids; each part lists the topic ids it teaches |
| `js/core/rig-ui.js` | Mounts a plate for the page: `home` (cycles trades), `world` (unit chips), `unit` (follows the reader), `concept` (where it lives) |
| `tools/build-rig-index.mjs` | Regenerates `js/3d/rig-index.js` after a model changes. Also catches geometry errors (models build in Node) |
| `tools/render-stills.mjs` + `tools/rig-lab.html` | Renders `assets/renders/*.webp`: trade and unit stills for thumbnails, lab headers and the no-WebGL fallback |

After editing a model: `node thetradeschool/tools/build-rig-index.mjs`, then re-render stills, then `node thetradeschool/tools/validate.js`.

Media credits and licences: `docs/CREDITS.md` and `docs/MEDIA_POLICY.md`. Media tooling lives in `tools/media/`; `tools/validate.js` checks the content data.
Earlier audit logs are kept in `docs/archive/`.
