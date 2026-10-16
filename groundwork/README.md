# Groundwork

Coffee, from the ground up: an espresso machine you can operate, every kind of coffee, the beans behind them, a brew guide with a timer and 84 recipes.

**Live:** https://www.safisolutions.org/groundwork/

## Pages

| Path | What it is | Script |
| --- | --- | --- |
| `/groundwork/` | The bar: grind, tamp, lock in, pull, steam, pour, serve. The shot is a teaching model (grind + dose → resistance → pressure, flow, extraction). | `js/bar.js` |
| `/groundwork/menu/` | Kinds of coffee: one cup that slides from espresso to latte (or to americano), the menu board, a caffeine ladder. | `js/menu.js` |
| `/groundwork/beans/` | Species, roast slider (with crack sounds), processing cutaway, coffee-belt map with USDA 2026/27 production. | `js/beans.js` |
| `/groundwork/brew/` | Grind ruler at particle scale, nine brewers, ratio calculator, guided brew timer. | `js/brew.js` |
| `/groundwork/recipes/` | The pass: 84 drinks drawn as cups, kitchen filter, caffeine × milk map, recipe tickets (`#id` deep links). | `js/recipes.js` |
| `/groundwork/sources/` | Every source and what it was used for. | none |

Shared: `css/groundwork.css`, `js/core.js` (sound, glossary pop-ups, helpers), `js/cups.js` (cutaway cup renderer), `js/data/recipes.js`, `js/data/belt.js` (map paths, Natural Earth 1:110m).

## Editing

Page HTML is generated. Edit `_source/pages/*.mjs`, then run:

```
node groundwork/_source/build.mjs
```

The builder writes each `index.html` with the shared header, footer, meta tags and cache-busting hashes. Recipes live in `js/data/recipes.js` (the layers draw the cup).

## Logo files (placeholders until the final artwork is added)

These are temporary stand-ins generated from the brand colours. Replace them with the real Groundwork logo, keeping the same names:

- `groundwork/media/logo.webp` — header logo (transparent background, wide; about 1200 px wide)
- `assets/project-logos/groundwork.webp` — Projects page tile (transparent background)
- `groundwork/media/og.jpg` — social share image, 1200 × 630
- `groundwork/media/favicon-64.png`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` — cup mark on a square

If the new header logo has a different shape, update the `width`/`height` on the `<img>` in `_source/build.mjs` and rebuild.
