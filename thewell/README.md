# The Well

A bartender’s field guide — drinks as glasses, bottles as knowledge.

Live at [safisolutions.org/thewell](https://www.safisolutions.org/thewell/).

## What’s in this folder

The files at the root (`index.html`, `assets/`, `404.html`) are the live GitHub Pages site.

Full source is in [`source/`](./source) — recipes, glasses, bottles, map, lineage, learn, and service mode.

## Modes

- **Library** — every drink as a glass on the rail
- **Stock** — “I have this” bottle wall
- **Map** — flavor field
- **Lineage** — drink family trees
- **Bottles** — spirits broken down
- **Learn** — technique
- **Service** — glanceable bartender mode

## Run locally

```bash
cd source
npm install
npm run dev
```

Production build (from `source/`):

```bash
npm run build
```

Copy `source/dist/` over this folder to update the live site. Client-side routes use GitHub Pages’ `404.html` fallback.

## Stack

React 19 · TanStack Router · Tailwind CSS v4 · Vite
