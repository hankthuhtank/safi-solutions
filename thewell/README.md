# The Well

A bartender’s field guide — drinks as glasses, bottles as knowledge.

**Live:** [safisolutions.org/thewell](https://www.safisolutions.org/thewell/)

## Folder

```
thewell/
  index.html      live site
  app.js
  app.css
  favicon.svg
  src/            full source
    data/         drinks, ingredients, families, lessons
    components/   glasses, tickets, shell
    routes/       library, stock, map, lineage, bottles, learn, service
```

`index.html` / `app.js` / `app.css` are what the site serves — the bundle is self-hosted, nothing loads from a CDN. Everything else is source.

## Build

```bash
npm install
npm run build          # vite → dist/app.js + dist/app.css
cp dist/app.js dist/app.css .
```

`index.html` is kept by hand and already points at `/thewell/app.js` and `/thewell/app.css`; `npm run dev` swaps in `src/main.tsx` for local work.
Deep links such as `/thewell/d/negroni` survive a refresh because the site's root `404.html` hands `/thewell/*` paths back to the app.

## Modes

- **Library** — drinks as glasses on the rail
- **Stock** — I have this
- **Map** — flavor field
- **Lineage** — family trees
- **Bottles** — spirits broken down
- **Learn** — technique
- **Service** — glanceable bartender mode
