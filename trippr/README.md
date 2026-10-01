# Trippr

Trippr is the Safi Solutions road-trip planner at **https://www.safisolutions.org/trippr/**.

This is a self-contained project folder in `hankthuhtank/safi-solutions`, alongside the other projects. GitHub Pages serves `index.html` and the committed compiled assets directly; no server, account, or separate website is required for the core application.

## Maintain and rebuild

Requires Node 22.13 or newer.

```sh
cd trippr
npm install
npm run dev
npm run verify
npm run build
```

`npm run build` checks TypeScript, prepares the same-origin MapLibre worker, compiles the app, and copies the complete publishable output into this folder. Commit both the source changes and the regenerated `index.html`, `assets/`, `maplibre/`, `images/`, `fonts/`, logos, favicons, and `config.js`. `build/` and `node_modules/` are temporary.

- `_source/components/trippr/`: map, trip panel (Route / Detours / Conditions), place card, search, map controls, dialogs.
- `_source/lib/trippr/`: provider adapters, validation, routing geometry, local storage, share links, PNG export, map styles, official reference records (`parks.json` index plus lazily loaded `park-details.json`).
- `_source/lib/trippr/handler.ts`: host-neutral provider normalization and bounded caching, reused by the browser and optional backend.
- `public/`: maintained images, logos, the National Park display font (with its OFL license), favicon, and optional backend configuration.
- `scripts/`: asset preparation, publication, and meaningful verification of storage, geometry, routing, sharing, and provider failures.
- `backend/`: optional secret-bearing data service; GitHub Pages does not execute it.

## How it's organized

Trippr opens on a blank trip (the sample is one click away) and "Clear trip" in the panel footer starts over, with Undo. Clicking open map proposes a spot in a small preview without moving the map; "Details" opens the full card, the next click dismisses it, and double-click zoom never drops a spot.

One map, one trip panel (a bottom sheet with three heights on phones), and three sections:

- **Route** — the itinerary drawn as a TripTik strip: numbered mile-marker stops on a two-lane road, leg miles and drive times, a "Find a break" shortcut on drives over eight hours, dates, notes, overnight flags, drag or arrow reordering.
- **Detours** — places along the route (5–50 mile corridor) or in the map view. Everyday kinds first; more behind "More". National parks appear instantly from the bundled NPS records; the rest come from OpenStreetMap on request.
- **Conditions** — forecast, sunset and air quality at every stop, NWS alerts, NIFC wildfires and NOAA high-water gauges within 30 miles of the route. It checks itself when opened; map overlays show only while it's open.

The dashboard shows a rolling odometer (total miles), drive time, and a fuel or charging cost estimate from the vehicle settings. Tapping the map drops a pin that is named by reverse geocoding and can become a stop. Place cards add weather, air quality, nearby Wikipedia articles, park hours and fees, campground amenities, and a Google Maps directions hand-off.

Design language comes from the road itself: MUTCD sign families (green destinations, brown recreation, blue motorist services, yellow and orange warning diamonds), Overpass (the open interpretation of FHWA Highway Gothic) for the interface, and the National Park typeface (based on routed wooden park signs; SIL OFL, Design Outside Studio) for display. "Night drive" is the default theme; "Day atlas" is a paper road-atlas theme. New routes are traced on with a highlighter pass, like an AAA TripTik.

## Core features

MapLibre atlas with shaded relief, satellite (with road and place labels) and 3D terrain, a Leaflet fallback with standard OpenStreetMap tiles for browsers without WebGL2, up to 20 ordered stops, dates and notes, actual driving routes and leg estimates, toll/highway/ferry avoidance, 5–50 mile route-corridor discovery, official park and campground references, campground amenity filters, forecasts with sunrise and sunset, modeled air quality, NWS alerts, wildfire incidents, NOAA river conditions, public-land polygons, local saved trips, share links, EV preferences, fuel and charging cost estimates, and landscape, story, or clean-map PNG exports. Mobile bottom sheet, text-size controls, keyboard search (⌘K / Ctrl+K), focus states, and reduced motion are supported.

Drafts save in this browser's local storage. Saved trips retain stop order, dates, notes, saved places, and preferences. Unreadable storage and quota failures are reported instead of silently overwriting the original draft. Nothing is synced to an account. A share link carries the stops, order and dates inside the URL fragment (compressed); nothing is uploaded.

## Data on GitHub Pages

Without configuration, the browser requests public, CORS-enabled endpoints directly: OSRM driving routes (Valhalla as a fallback); FOSSGIS Valhalla when road preferences are on (long trips are split under its 1,500 km per-request limit and one-call-per-second policy); Photon/OpenStreetMap search and reverse geocoding; Open-Meteo forecasts, sunrise/sunset and modeled air quality; Overpass places (overpass-api.de, then the private.coffee and VK Maps mirrors when one is busy); NWS alerts; NIFC WFIGS current wildfire incidents; NOAA NWPS river gauges; USGS PAD-US reference boundaries; and Wikipedia geosearch for nearby articles. Each source can fail independently, and unavailable data is labeled. Missing markers never mean an area is safe or that a road is open.

The National Park Service reference snapshot contains 474 park records and 62 campground records, retrieved October 1, 2026. Reference descriptions, fees, facilities, and photographs are attributed and linked to their official source; they are not live operational status or reservation availability. Public-land boundaries do not imply camping permission. Driving times are estimates, not traffic predictions. EV discovery does not predict state of charge or guarantee a working charger. Fuel and charging costs are estimates from the vehicle settings (defaults: 28 mpg at $4.25/gal, the September 2026 U.S. average; 3.3 mi/kWh at $0.50/kWh, typical 2026 public fast charging).

## Optional enhanced data (no backend required)

Trippr needs no server. Everything above works with no keys. To add more sources, paste free keys into `publicKeys` in `public/config.js` (and the published copy `config.js`, which is read at runtime, so no rebuild is needed). These keys are visible to anyone, so use only free, rate-limited keys and restrict them to safisolutions.org where the provider allows it. If one is abused, the worst case is that source pausing until its quota resets; Trippr then falls back to the keyless behavior.

| `publicKeys` entry | Enables | Free tier |
| --- | --- | --- |
| `NPS_API_KEY` | Live park alerts, campgrounds, visitor centers | 1,000 requests/hour (api.data.gov) |
| `NREL_API_KEY` | Federal EV charger directory | 1,000 requests/hour (api.data.gov) |
| `AIRNOW_API_KEY` | Observed (not modeled) air quality | 500 requests/hour |
| `RIDB_API_KEY` | Recreation.gov campground facilities | Free |
| `GEOAPIFY_API_KEY` | Alternative address search (restrict the key to your domain) | 3,000 requests/day |
| `OPENROUTESERVICE_API_KEY` | Alternative routing | 2,000 routes/day |

Only these names are read from `config.js`; anything else is ignored. Two sources can't be called from a browser and would need the optional `backend/worker.ts` (a single Cloudflare Worker with secrets): `NASA_FIRMS_MAP_KEY` (satellite heat detections — wildfires already come keyless from NIFC) and `WZDX_FEED_URLS` (state work-zone feeds). If you ever deploy it, set its HTTPS address as `apiUrl` and keep those values as Worker secrets, never in `config.js`.

Map attribution remains visible and is included in exported PNGs. Local park photographs are credited in `images/credits.json`; other reference images retain NPS credits. The map worker and shared module must be kept together in `maplibre/`.
