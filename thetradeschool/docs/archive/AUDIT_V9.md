# TradeSchool V9 — Grok Systems Pass (updated)

## Intent
Truth-seeking content, fixed data integrity, modern field practice notes, and removal of robotic copy-paste deep fields.

## Content & information fixes
- **World assignment integrity**: Every concept now carries an explicit `world` property.
- **Recognize / Verify / Failure Clues**: The old genericDeep template produced near-identical text for dozens of concepts ("Look for the labels…", "Decide what normal behavior…"). Replaced with category-aware generators (measurement vs control vs power hardware) and solid concept-specific overrides for high-traffic items such as RMS voltage. HVAC defaults were rewritten to point at upstream/downstream context and the real diagnostic hierarchy.
- **Metering device / TXV**: Explicit warning that most "bad TXV" calls are airflow, charge, or restriction problems. High superheat alone is not diagnostic.
- **Welding PPE**: Updated to current ANSI Z49.1 / industry practice — local exhaust and respiratory protection are core controls for many processes.

## Practice labs
- **Load Path Continuity**: Rewritten purpose and teaching copy. The point is no longer "loads go down" (common sense). The lab now forces the learner to break one member or support and name the exact transfer point that is missing — the actual structural failure location.
- **Framing / Opening**: Teaching language tightened around headers + jack studs as the members that restore continuity around an opening.
- Strong labs (circuit, ladder, troubleshoot, refrigeration cycle, envelope water, weld parameter window, hydraulic force) left intact.

## Visual & media
- SVG typefaces aligned to site stack.
- Credits completed for crops and original technical diagrams.
- CSS focus-visible and subtle interaction polish retained.

## Grok principles
1. Prefer system understanding and physics over label memorization.
2. Surface the misdiagnoses that actually happen in the field.
3. Every visual and lab must teach a non-obvious relationship or decision.
4. Boilerplate text that only swaps the concept name is not education.

## Files touched this pass
- `js/content/electrical.js` — new category-aware genericDeep + RMS override + world fix
- `js/content/hvac-plumbing.js` — better default recognize/verify + TXV diagnostic depth
- `js/content/industrial-welding-construction.js` — welding-ppe modern emphasis
- `js/core/app.js` — loadpath & framing lab teaching copy
- `docs/AUDIT_V9.md`, `README.md`, `docs/CREDITS.md`, `css/main.css`, `index.html`
