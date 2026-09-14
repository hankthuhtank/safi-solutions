# Safi Solutions / project cabinet

This revision replaces the scrolling promotional homepage with a project-first portfolio. The left index exposes all 15 projects. A filtered collection opens individual project views; SafiStudios, About and Contact have dedicated hash routes. Browser Back restores routes and the collection's scroll position.

## Reference study

- https://jrands.com/ — inspected live: full-viewport personal footage and a compact persistent dock whose Work panel exposes the projects. Applied the principle of immediate navigation and project access; no footage, identity or artwork copied.
- https://www.brandon.wtf/ — inspected live: a persistent identity/navigation rail, real product imagery and a clear separation of work and personal information. Applied persistent orientation and project-specific views; no text or assets copied.
- https://www.krispuckett.com/ — opened, but its client-side application failed in the research browser. No claims about its unseen interactions.

## Assets

Retained original Safi logo and Helal portrait. Baker Precision, Elizabeth Aven, The Bench and VoltVisual use actual website captures from September 14, 2026. Other project covers use their existing identities, explicitly identified as such in the project detail, or straightforward linked titles. No invented website screenshot or blueprint stand-in.

New mockups are illustrative design studies with fictional data, not screenshots of shipped client installations. Both are displayed and labeled accordingly.

- `assets/showcase/coffee-counter.webp`: wide warm espresso/cream coffee workspace, order tickets, staff shifts, daily close and inventory.
- `assets/showcase/cedar-agenda.webp`: portrait dark forest/lime service workspace, horizontal navigation, chronological jobs with assignees, enquiries and invoices.

Built-in image generation used. Prompt set: a flat, readable, realistically buildable business UI; coffee image at 1536×1024 with cream/espresso/cinnamon palette and functional order queue, staff schedule, daily close and inventory; pest image at 1024×1536 with forest/lime palette, top navigation and chronological appointment agenda, enquiries and invoices. No maps, route optimization, unsupported analytics, 3D devices or oversized marketing elements. All names and data are fictional. Generated PNGs were converted to WebP without image alterations.

## Implementation and checks

No new runtime framework or third-party animation dependency. Native links/hash routing, native modal dialog, reduced-motion preference and keyboard-accessible controls. Original form action, honeypot and CAPTCHA setting retained. No form was submitted during testing.

`tools/check-portfolio.cjs` verifies routes, filters, project previews, asset presence, sample expansion, workflow switching, studio section links, contact configuration, mobile menu and motion settings using jsdom. Run with jsdom available in NODE_PATH. `node --check assets/studio.js` and `git diff --check` also pass.

Local file navigation is blocked by the Cloud browser URL policy. Public deployment inspection is performed separately; no browser restriction is bypassed.
