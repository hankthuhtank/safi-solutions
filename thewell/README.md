# The Well

A bartender's field guide — drinks as glasses, bottles as knowledge.

**Live:** https://www.safisolutions.org/thewell/

## What this folder contains

- `index.html` — GitHub Pages entry point. It currently loads the pinned compiled portfolio build from jsDelivr and adds SafiSolutions-specific runtime fixes.
- `404.html` — preserves deep links for the single-page app. Keep it.
- `images/bar-interior.jpg` — emergency image fallback.
- `images/cocktail-families/families.webp` — optimized local sprite for Cocktail Families artwork.
- `src/` — maintained React/Vite source and the full drinks, ingredients, families, lessons, components and routes.
- `package.json`, `vite.config.ts`, `tsconfig.json` — source/build configuration.

## Cleanup guardrails

Do not remove files from `src/` just because `index.html` currently loads a pinned compiled bundle. The local source remains internally connected and is the recoverable source of truth for a future rebuild.

Two easy-to-misidentify files are required:
- `src/data/drinks-more.ts` is imported by `src/data/drinks.ts`.
- `src/routeTree.gen.ts` is imported by `src/main.tsx`.

`node_modules/` and `dist/` are intentionally ignored build output and should not be committed.

## Modes

Library · Stock · Map · Lineage · Bottles · Learn · Service
