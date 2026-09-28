# TradeSchool Content Architecture

## Loading order
`index.html` loads content before the UI engine:
1. `js/content/base-data.js` — original worlds and core concepts
2. `js/content/electrical.js` — Electrical deep-content expansion and references
3. `js/content/hvac-plumbing.js` — HVAC + Plumbing deep-content expansion and references
4. `js/content/industrial-welding-construction.js` — remaining three world expansions and references
5. `js/core/app.js` — rendering, navigation, labs, search and progress

## Concept schema
Every concept can contain:
- `world`, `id`, `category`, `title`, `eyebrow`
- `oneLine`, `plain`, `analogy`
- `why`
- `steps[]`
- `recognize[]`
- `where[]`
- `failures[]`
- `verify[]`
- `fieldScenario`
- `misconceptions[]`
- `safety`
- `related[]`
- `lesson`
- `check { q, options[], answer, explain }`

The shared concept renderer uses this schema across every trade, which lets future content be added without creating a bespoke HTML page for each term.

## Visual assets
A topic's first visual is its part on the trade's 3D model (`js/3d/models/<trade>.js`): each part lists the concept IDs it teaches, and `js/3d/rig-index.js` is the generated lookup. `TRADE_DATA.visualAssets` still maps concept IDs to bundled photos and diagrams under `assets/reference/<trade>/`; since V18 a photo stays only when it adds something the model cannot (a real, current, clearly shot piece of equipment) and a diagram stays when it explains a relationship (ratios, sequences, P-T behaviour). `js/content/v18-media.js` records every retired photo and why.

## Text the views leave out
The concept data carries fill-in-the-blank sentences from earlier content passes ("Choose a measurement or observation that directly tests X…"). `app.js` hides any long sentence that is word-for-word identical across five or more topics once the topic's own name is removed, plus the eight templated "why it matters" lines. Write concept-specific text and it will show.

## Adding another trade
1. Add the world metadata.
2. Add its categories under `worldCategories`.
3. Add concept objects using the shared schema.
4. Add learning paths under `worldLearningPaths`.
5. Add any field-reference assets under a trade-specific asset folder.
6. Add a model in `js/3d/models/` whose `meta.systems` keys are the new unit ids, place each topic on a part, and rebuild the rig index and stills.
7. Add custom diagrams or labs only where interaction materially improves learning.

The goal is to reuse the education engine and build custom interaction only where it explains something better than text/diagram alone.
