# Media Policy

## Goal

TradeSchool uses visuals to teach recognition, mechanism, comparison, procedure or practice. A visual that only makes a page look “technical” should not be included.

## Preferred media stack

### 0. The trade model — the default visual (V18)

Every trade has a procedural 3D model built from real dimensions and colour codes (NFPA 79 panel wiring, PEX red/blue, oxygen-green and fuel-red hoses, AHRI Guideline N refrigerant cylinder grey with the A2L red band, 16 in stud layout, ½ in anchor bolts at ≤ 6 ft). A topic's part on that model is its first visual: learners see the thing, where it sits and what it connects to. The models are schematic in detail but honest in proportion and placement; they are not photographs and do not claim to be a specific manufacturer's product.

A photo or diagram is added on top only when it teaches something the model cannot. Retired photos are listed with reasons in `js/content/v18-media.js`.

### 1. Wikimedia Commons — primary build-time source

Use Wikimedia Commons when a real component, installation, tool or field condition is needed. The MediaWiki `imageinfo` API can return URLs plus extended metadata such as author/credit and license information.

Every selected image must be reviewed on its original file page. Do not assume that all Wikimedia Commons files use the same license.

TradeSchool stores selected images locally and records attribution in `docs/CREDITS.md`. That keeps the deployed site fast and avoids depending on a third-party API at page load.

Use `tools/media/wikimedia_media.py` to search and inspect candidate files.

### 2. Openverse — optional discovery source

Openverse can be useful for discovering openly licensed media across multiple collections. Treat returned license data as a lead, not the final legal check: verify the license and attribution requirements at the original source before adding a file.

### 3. Manufacturer / standards / manual imagery

Do not bundle manufacturer manual pages, proprietary diagrams, paid standards, textbook figures or commercial photography just because they are useful. Link to the official resource or obtain appropriate permission/license.

Manufacturer product photography may be used only when its terms clearly permit the intended reuse.

### 4. Original technical diagrams

Original SVG/CSS diagrams are appropriate when they reveal a mechanism that a photo cannot show clearly — for example current path, refrigeration state, force path or a weld cross-section.

They should be schematic and honest about their abstraction. Do not create pseudo-realistic “characters,” fake technicians, cartoon equipment or decorative machinery to imply field realism.

## Required metadata

For every external image stored in the repository, record:

- local file path
- original title
- creator/author
- source URL
- license name
- license URL when available
- whether the file was cropped/resized/compressed

## Runtime rule

Do not auto-fetch random external images in the learner-facing site. Media selection is an editorial/build-time decision so quality, relevance, accessibility and licensing can be verified before deployment.
