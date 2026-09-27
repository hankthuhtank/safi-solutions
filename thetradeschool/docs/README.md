# TradeSchool: how the app is put together

A static single-page app: no build step. `index.html` loads plain scripts **in this order** (order matters: later layers edit what earlier ones define):

| Order | File(s) | What it does |
|---|---|---|
| 1 | `js/content/base-data.js` | The six trades, units, concepts, standards list |
| 2 | `js/content/electrical.js`, `hvac-plumbing.js`, `industrial-welding-construction.js` | Topic content per trade |
| 3 | `js/content/v8-overrides.js`, `v10-visuals.js`, `v14-media-fill.js` | Earlier editorial passes: corrections, diagrams, media |
| 4 | `js/content/v15-media.js` → `v15-currency.js` → `v15-deboilerplate.js` | Media integrity, standards/currency updates, repeated-text removal |
| 5 | `js/content/v16-beginner.js`, `v16-context.js` | Beginner-first explanations and vocabulary |
| 6 | `js/core/app.js` | Router, views, search |
| 7 | `js/core/labs-v15.js`, `beginner-v16.js`, `v17-no-repeat.js`, `fieldcheck.js` | Interactive labs, beginner UI, de-duplication, field-decision drill |

Styles: `css/main.css` → `css/v15.css` → `css/v16-beginner.css` → `css/fieldcheck.css`.

Media credits and licences: `docs/CREDITS.md` and `docs/MEDIA_POLICY.md`. Media tooling lives in `tools/media/`; `tools/validate.js` checks the content data.
Earlier audit logs are kept in `docs/archive/`.
