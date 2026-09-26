# TradeSchool V15 — audit and rebuild

Reviewed August 2026. This document records what was wrong, what changed, and
what is still outstanding. Numbers here are produced by the code, not estimated:
`node tools/validate.js` and the browser console both report them at load.

---

## 1. The finding that mattered most

`js/content/v13-modernity.js` wrote every one of its additions to `c.deep.*`.

Nothing in the codebase has ever read `.deep`:

```
$ grep -c "\.deep" js/core/app.js
0
```

So the entire "modern field relevance" pass documented in `AUDIT_V13.md` —
refrigerant transition, lead-free plumbing, arc-flash PPE, VFD stored energy,
welding fume — **never rendered a single character on a single page**. Two of its
target ids (`refrigeration-cycle`, `true-rms`) do not exist as concepts either.

That is the honest answer to "is the information still true": the modern layer
was not wrong, it was absent. The file is now retired to
`js/legacy/v13-modernity.js.disabled` and replaced by `js/content/v15-currency.js`,
which writes to the fields the renderer actually uses. `tools/validate.js` now
fails the build if it is ever loaded again.

---

## 2. Images that did not show what they claimed

19 files removed. The reason for each is stored as data in
`js/content/v15-media.js` (`D.removedMedia`) so it survives in the repo rather
than only in a changelog. The worst offenders:

| File | Was labelled | What it actually is |
|---|---|---|
| `hvac/compressor.jpg` | "Refrigeration compressor" | A sectioned marine machine in a museum, behind red rope barriers, with a ship's wheel in frame |
| `industrial/hydraulic_cylinder.jpg` | "Hydraulic cylinder", **and the Industrial world hero** | A yellow bottle jack photographed against a pink wall |
| `openverse/electrical/photoeye.jpg` | "Photoelectric sensor" | A watermarked commercial vendor advertisement with URLs and a company logo |
| `openverse/industrial/hyd_pump.jpg` | Hydraulic pump | A photograph of a brick building |
| `openverse/industrial/hydraulic_flickr.jpg` | Hydraulics | Electrical connectors and cordsets |
| `openverse/industrial/gearbox.jpg` | Gearbox | A CGI stock render, which violates the project's own no-fake-visuals rule |
| `openverse/electrical/plc_flickr.jpg` | "PLC I/O module" | A bare relay board held in someone's hand |
| `construction/header_opening_crop.jpg` | Header opening | Byte-identical framing to `light_framing.jpg`, with no header visible |
| `electrical/contactor_principle.jpg`, `plumbing/copper_pipe.jpg` | — | Corrupt. Not decodable as images at all |

Also removed: the Spanish-labelled contactor that `AUDIT_V12.md` claimed had
already been replaced (it was still on disk), a 1941 archival water-meter photo,
two blown-out welding shots, and three useless detail crops.

### Replacements

Ten original technical diagrams, built by `tools/media/build_diagrams.py` and
committed as SVG. Per `docs/MEDIA_POLICY.md`, an original diagram is the correct
substitute when it reveals a mechanism a photo cannot:

- `hvac/compressor_types.svg` — reciprocating vs scroll, with true involute
  curves rather than stacked arcs
- `diagrams/refrigerant_transition.svg` — R-22 / R-410A / A2L with the actual
  regulatory dates
- `electrical/plc_architecture.svg` — left-to-right scan path, field devices to
  input module to CPU to output module to loads
- `electrical/photoeye_modes.svg` — through-beam, retroreflective, diffuse
- `industrial/cylinder_anatomy.svg` — bore, rod, ports, seals, and why extend
  and retract are not symmetric
- `industrial/belt_drive_ratio.svg`, `industrial/gear_reduction.svg`
- `construction/header_framing.svg` — king, jack, header, cripples, load arrows
- `welding/arc_processes.svg` — SMAW / GMAW / FCAW / GTAW compared
- `plumbing/water_service.svg` — curb stop through main shutoff

Result: 122 concepts carry a checked visual, and `node tools/validate.js`
reports zero missing assets.

Two surviving photos were re-captioned rather than deleted, because the photo
was real and only the caption was wrong: the DIN-rail panel that was labelled
"limit switch" is now labelled as panel context, and the centrifugal pump
cutaway got a caption that names its parts.

---

## 3. Playground tools

V10 deleted most labs for "looking like toys". Correct diagnosis, wrong fix — it
left **Industrial Maintenance with zero labs and an empty Practice tab**, and the
survivors still had geometry that could not physically exist.

| Lab | Defect | Now |
|---|---|---|
| Trap + Vent | Trap U did not meet the drain line; the vent stack crossed *through* the drain and continued below it | Connected, plumbable branch in SVG. Trap seal drawn to scale against a nominal 2″ trap, with the code range stated |
| Ladder Logic | Instructions floated with no rung wire. STOP was not in the demo rung, so the toggle did nothing. No seal-in | Real L1/L2 rails, working three-wire start/stop/overload with a seal-in branch you can remove to see what it does |
| Weld Parameter Window | Bead floated above the plate, "DEPTH" clipped off-canvas, work angle changed nothing, no heat input shown | Bead clipped into the section so it cannot float. Live kJ/in from the real equation: (V × A × 60) ÷ ipm |
| Envelope Water | Abstract colour bars and an unlabelled square marked WINDOW | Named assembly layers, drainage gap, head flashing, water that follows the layers it is given |
| Hydraulic Power | Delisted, and TANK and LOAD were unconnected floating boxes | Rebuilt as a connected circuit with a working relief valve, and **restored to the Industrial catalog** |

Every readout is now computed from the relationship being taught. The hydraulic
lab derives effective area from bore and rod, so extend and retract genuinely
differ at identical settings, and pushing the load past the relief setting stops
motion and says where the energy went.

Rebuilt labs live in `js/core/labs-v15.js` and register through `window.TS.labs`,
so `app.js` gained one small dispatch hook rather than a rewrite.

---

## 4. Filler content

The V7–V10 passes filled every concept's schema to 100%. That validates clean
and reads as padding. Measured before this pass:

| Field | Worst repeat |
|---|---|
| `verify` | one 3-line block on **213** concepts |
| `steps` | one 3-line block on **108** concepts |
| `safety` | one identical sentence on **104** concepts |
| `recognize` | one block on **107** concepts |
| `misconceptions` | one block on **108** concepts |
| `analogy` | one sentence on **60** concepts |

`js/content/v15-deboilerplate.js` counts every string across every concept and
removes any long one that recurs on more than 8 concepts. It is data-driven, not
a list of regexes, so filler introduced later gets caught automatically. Short
entries are protected — `where: "Conveyors"` legitimately repeats.

**Knowledge checks were the worst case.** 416 of 428 checks shared just three
option sets; 96 concepts asked literally *"What best shows you understand
&lt;title&gt;?"* with the same four answers. That is a shape that looks like
assessment while proving nothing. Those are now removed. **12 concept-specific
checks survive.**

---

## 5. Information currency

`js/content/v15-currency.js` writes real, dated content to 22 concepts and
publishes a standards register at `#/standards`, linked from every page footer.
Verified against published sources, August 2026:

- **AIM Act Technology Transitions Rule** — since 1 Jan 2026, new residential and
  light commercial systems cannot be installed above roughly 700 GWP. Manufacture
  of new R-410A residential systems ended 1 Jan 2025. Existing R-410A equipment
  remains legal to service indefinitely.
- **ASHRAE 34** — R-454B (≈466 GWP) and R-32 (≈675 GWP) are A2L. They cannot be
  charged into equipment built for R-410A.
- **EPA Section 608** — still required. A2L-specific training and A2L-rated
  recovery, gauges and leak detection are what actually changed.
- **NFPA 70 (NEC)** — 2026 edition published; adoption lags by jurisdiction.
- **NFPA 70E** — 2024 edition, paired with IEEE 1584-2018.
- **NSF/ANSI/CAN 372** — lead-free is 0.25% weighted average across wetted
  surfaces, 0.2% for solder and flux.
- **AWS D1.1/D1.1M:2025** — 25th edition, approved March 2025, supersedes 2020.
- **OSHA Cr(VI) PEL** — 5 µg/m³ 8-hour TWA; local exhaust at the source is the
  control that moves the number.

---

## 6. Design

The previous look was near-black plus a single acid-green accent — a default,
not a decision, and it said nothing about trades.

**Concept: the equipment data plate.** Every trade here starts a job the same
way: find the plate, tag, marker or stamp, and read it before touching anything.
Motor nameplate, valve tag, ASME A13.1 pipe marker, arc-flash label, WPS number.
So the concept header is now a plate — engraved rows, brushed ground, corner
fasteners — carrying trade, unit, class, definition, where you meet it, and how
you prove it, in a data plate's reading order.

**Palette from real field colour coding**, not a trend: arc-flash label yellow
for electrical, refrigerant cylinder rose for HVAC, ASME A13.1 potable green for
plumbing, machine-guard orange for industrial, oxide red for welding, chalk-line
blue for construction. Status colours follow ANSI Z535.

**Type:** Saira Condensed for display (condensed gothic is the class actually
silkscreened onto equipment and stencilled onto signage), Saira for body, IBM
Plex Mono for every computed value — it was drawn for engineering documentation,
which is what these readouts are.

One accessory removed, per Chanel: the ambient particle canvas is gone. It was
atmosphere that said nothing about the subject.

Layout defects fixed: the home hero collage that overlapped its own captions is
now a three-up strip; the concept "Visual reference" panel no longer renders as a
white slab (`main.css` had `background:#e8ebe9` behind an `object-fit:contain`
image); portrait heroes no longer blow the world hero to ~800px; the empty
"How this is built" section now carries the real audit numbers; and the concept
hero no longer clips the nameplate.

---

## 7. What is still outstanding

Stripping the filler exposed a real content gap that was previously hidden
behind generic text. This is the honest state of the curriculum:

| Gap | Count |
|---|---|
| Concepts with no concept-specific knowledge check | 416 of 428 |
| Concepts with no `misconceptions` | 210 |
| Concepts with no `verify` | 86 |
| Concepts with no `recognize` | 14 |
| Concepts with no visual | 306 |

These sections now simply do not render when empty, which is better than filler
but is not the same as being finished. The highest-value next pass is writing
real `verify` lines and real knowledge checks for the highest-traffic concepts,
one trade at a time.

Also outstanding:

- The remaining photo set is thin. Wikimedia and Openverse are not reachable from
  the build environment, so no new photography could be sourced this pass — the
  gap was filled with original diagrams instead. Use
  `tools/media/wikimedia_media.py` offline to add photos, and record attribution
  in `docs/CREDITS.md`.
- Fonts load from Google Fonts. For an offline or air-gapped deployment, self-host
  Saira, Saira Condensed and IBM Plex Mono.
- Six labs are rebuilt. Several legacy labs still exist as deep-link-only render
  functions (`airflow`, `pressure-flow`, `water-heater-lab`, `shaft-alignment`,
  `pneumatic-lab`, `bearing-lab`, `conveyor-lab`, `joint-lab`, `defect-lab`,
  `blueprint-lab`, `framing-lab`, `loadpath-lab`). They are not in any catalog.
  They should each be either rebuilt to the V15 standard or deleted outright.

---

## Verification

```bash
node tools/validate.js     # concepts, ids, related links, assets, load-order drift
python3 -m http.server 8080
```

The validator now loads the same ten content files in the same order as
`index.html`, and fails if the two ever drift apart.
