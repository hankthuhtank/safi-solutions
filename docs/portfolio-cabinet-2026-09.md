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

## Follow-up: separated collections and faithful screenshots

The user approved the cabinet direction and requested separate Projects and Websites views. Projects now features actual Vellum and The Bench captures, followed by the other six tools; The Trading Desk has a compact section explaining Helal's market teaching. Websites features actual Elizabeth Aven and Baker captures, followed by three plain website links. Previous/next navigation stays within the relevant collection.

SafiStudios was simplified and its invented concept images removed from all active references. The replacement assets use the user's actual app screenshots as edit targets. Built-in image generation changes the fictional names/record labels while preserving the original layout and modules:

- `assets/showcase/java-workspace.webp` (1632×963): Java's original coffee workspace. Prompt: preserve the supplied screenshot; replace Mike with Java's Downtown, and three counter labels with fictional orders/customers. Preserve all modules, values, images, styling and positions. No interface redesign.
- `assets/showcase/cedar-workspace.webp` (1113×1413): Cedar's original service workspace. Prompt: preserve the supplied screenshot; replace John with Cedar service team, Route 001–005 with named local routes and generic jobs with four fictional customer/job labels. No interface redesign.

Images are labeled existing app layouts with sample records; they are edited screenshots, not a claim that they came from live customer data. CSS provides rounded clipping and subtle shadows. The modal supports fit and natural-size zoom with scrolling on small screens. Product prose is larger, limited to the visible examples and configuration offered, and highlights hospitality, retail, field services, contracting, operations and events. The previous automated workflow demonstrations are removed.

Responsive rules stack featured projects, website previews, product examples and the About/contact layouts, preserve full-width screenshots, provide a mobile navigation menu and use at least 16px form inputs. No contact form was submitted. Automated checks verify the new information architecture, routes, screenshots, zoom, market section, original contact destination and mobile-menu behavior.
