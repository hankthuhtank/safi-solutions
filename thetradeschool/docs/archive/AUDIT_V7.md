# TradeSchool V7 — Full Product Audit

## Executive finding

V6 had a strong content inventory and a recognizable visual style, but the interface was optimized around **showing that content existed**, not around helping a learner form a mental model. The result was too many cards, too many repeated sections, too many clicks, and diagrams that often inherited a category template even when that template did not actually explain the selected topic.

V7 changes the product model from **interactive glossary** to **field-first course + reference system**.

## 1. Content audit

The V6 library contains 428 concepts. Programmatic duplicate checks found repeated prose that made pages feel generated rather than authored:

- the same Plumbing analogy appeared **60 times**
- the same HVAC analogy appeared **47 times**
- the same generic safety paragraph appeared **104 times**
- several field scenarios and lesson structures were reused with only nouns changed

This content is not deleted from the data model yet; V7 suppresses the known boilerplate from the primary course view so it no longer dominates the learning experience. The next editorial pass should rewrite units as coherent lessons rather than rewriting each record independently.

### New presentation rule

A topic should normally answer four questions in one continuous flow:

1. **What is it / why does it matter?**
2. **What would I actually see, measure or notice in the field?**
3. **How does it behave in the larger system?**
4. **What evidence would distinguish normal operation from a fault or bad installation?**

Safety is shown when there is topic-specific information to teach. A repeated generic disclaimer belongs at the platform level, not on 100+ topics.

## 2. Navigation audit

### V6 problem

The learner repeatedly moved through world → category → concept card → multiple concept panels → tabs → playground. This creates interaction cost without adding learning value.

### V7 change

The primary path is now:

**Trade → Course unit → continuous topic lesson → unit checkpoint**

All topics in a unit are on one page. A sticky desktop table of contents becomes horizontal chips on mobile. The full searchable concept index remains for technicians or learners who need quick reference rather than a course.

## 3. Visual audit

### Failure observed in the supplied screenshots

The Construction “Roof Rafter” page displayed a generic framing/opening diagram whose headline described load transfer around a wall opening. The drawing was not wrong as a framing idea, but it was the wrong visual for a roof-rafter concept. It also had multiple SVG labels occupying the same top band, causing obvious overlap.

The Welding Arc/Puddle playground looked like a stylized torch floating over a glowing blob. It suggested realism without actually modeling a real welding process, which makes it decorative rather than instructional.

### V7 visual policy

A visual is shown only when it does at least one of these jobs:

- **Recognition:** shows what the real component/assembly looks like
- **Mechanism:** reveals something difficult to see in real life
- **Comparison:** makes two states, failures or configurations meaningfully different
- **Procedure:** shows an action or sequence at the point it matters
- **Practice:** lets the learner make a decision and receive evidence-based feedback

If a generic category diagram does not explain a topic, it is omitted. Empty space is preferable to a misleading visual.

Construction and Welding diagram eligibility is now explicitly whitelisted by concept instead of automatically inherited by an entire category. SVGs are container-scaled, long labels were reduced/repositioned, and the design no longer relies on character/glyph “illustrations.”

## 4. Practice/playground audit

V6 exposed many small demos. The quantity made the platform look feature-rich, but several did not have a defensible skill outcome.

V7 exposes a curated practice set for each sector. Every visible lab must state:

- what the learner is trying to learn
- what evidence to watch
- what the learner should be able to explain afterward
- whether the model is conceptual or intended to resemble a real procedure

The Welding lab was specifically rebuilt as a transparent **parameter-direction model**. It shows relative heat-input, width and penetration tendencies in a section view and explicitly warns that actual results depend on process, polarity, consumable, shielding, joint, material, position and qualified procedure.

## 5. Sector personalization

The six trades no longer share one generic visual metaphor.

### Electrical

Visual language: panels, conductors, logic state, meters, power/control separation. Learning emphasis: source → control decision → load → measurement → fault isolation.

### HVAC

Visual language: actual equipment, refrigeration loop, temperature/pressure state, airflow. Learning emphasis: move heat, prove airflow, understand sequence before replacing parts.

### Plumbing

Visual language: piping assemblies, fixtures, pressure/flow, drainage and vent paths. Learning emphasis: supply energy, restriction, gravity, trap seals, water management.

### Industrial Maintenance

Visual language: rotating equipment, couplings, bearings, pumps, hydraulic components. Learning emphasis: force/motion, condition evidence, failure mechanisms, reliability.

### Welding

Visual language: real welds/joints plus honest cross-sections and symbols. Learning emphasis: process window, fit-up, fusion, heat effects, defect evidence. No cartoon welders or pseudo-realistic torch characters.

### Construction

Visual language: field framing, plans, details, load paths, layers/interfaces. Learning emphasis: translate information into an assembly, sequence it correctly, verify before work becomes hidden.

## 6. Educational-product research applied

The redesign borrows several patterns from strong learning products without copying their visual design:

- **Brilliant:** direct manipulation should build intuition, not merely decorate the page; introduce the simple model first, provide immediate feedback, then increase complexity.
- **Khan Academy:** organize around units and mastery evidence rather than “visited/completed” checkboxes; review should return later instead of being one-and-done.
- **iFixit:** use action-oriented, close-up, consistent real photos where the image can communicate a physical step or part better than prose.
- **Interplay Learning:** skilled-trade simulation is valuable when it resembles field decisions and troubleshooting, and when guided training can transition into challenge/practice mode.

V7 implements the information architecture required for those ideas. Full mastery scoring and challenge-mode assessment should be a later product layer, not simulated with a fake “Mark complete” button.

## 7. GitHub/mobile audit

V7 remains a static site. It requires no runtime API key, no server-side rendering, no database and no bundler. Relative assets + hash routing make project-site hosting straightforward. `.nojekyll` is included.

Responsive fixes include:

- continuous unit layouts collapse to one column
- sticky unit navigation becomes horizontal
- diagrams use `width: 100%` with no forced minimum canvas width
- field-photo pairs become one column
- practice cards stack on phones
- hero photography is cropped with `object-fit` rather than overflowing
- diagram captions stop forcing two competing columns on small screens

## 8. What should happen next

The **next work should be editorial depth, not more UI**. Pick one unit at a time, ideally starting with Electrical Fundamentals / Controls or HVAC Refrigeration, and rewrite it as an authored lesson with real examples, field photos, measurements, worked troubleshooting cases and assessment questions. Keep the 428-record library as the reference layer, while the course layer becomes the genuinely teachable product.
