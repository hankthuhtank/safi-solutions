# TradeSchool V8 — Media + Content Integrity Pass

## What changed
- Replaced the old unit-level recycled diagram block with **field-reference clusters**.
- Added **concept-specific media overrides** for repeated problem spots:
  - motor nameplate close-up
  - hydraulic pressure system visual
  - cylinder area/force technical visual
  - welding PPE system visual
  - helmet lens close-up
  - building envelope opening detail
  - framing/header crop
  - rebar crop
- Added **duplicate-asset suppression inside unit pages** so the same image is not shown over and over in one scroll.
- Added **context cards** for topics that do not need a separate image, filling empty space with useful learning support instead of filler.
- Simplified concept-level visual sections so they only render when a visual is genuinely useful.

## Why this pass exists
V7 improved structure, but still repeated too many images and left some empty or low-value visual areas. V8 focuses on content integrity: each visual should either help recognition, show a critical detail, or clarify a relationship.

## Files added
- `js/content/v8-overrides.js`
- `assets/reference/electrical/motor_nameplate_crop.jpg`
- `assets/reference/welding/helmet_lens_closeup.jpg`
- `assets/reference/industrial/hydraulic_pressure_system.svg`
- `assets/reference/industrial/cylinder_area_force.svg`
- `assets/reference/construction/building_envelope_detail.svg`
- `assets/reference/welding/welding_ppe_reference.svg`
- supporting crop images for framing, rebar, hydraulic cylinder, and water heater details

## Safe deployment notes
- Static-site friendly for GitHub Pages
- No server dependencies added
- Existing folder structure preserved
