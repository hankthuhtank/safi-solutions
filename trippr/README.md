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

`npm run build` checks TypeScript, prepares the same-origin MapLibre worker, compiles the app, and copies the complete publishable output into this folder. Commit both the source changes and the regenerated `index.html`, `assets/`, `maplibre/`, `images/`, `favicon.svg`, and `config.js`. `build/` and `node_modules/` are temporary.

- `_source/components/trippr/`: map, itinerary, search, place details, layers, dialogs.
- `_source/lib/trippr/`: provider adapters, validation, routing geometry, local storage, PNG export, map styles, official reference records.
- `_source/lib/trippr/handler.ts`: host-neutral provider normalization and bounded caching, reused by the browser and optional backend.
- `public/`: maintained images, favicon, and optional backend configuration.
- `scripts/`: asset preparation, publication, and meaningful verification of storage, geometry, and provider failures.
- `backend/`: optional secret-bearing data service; GitHub Pages does not execute it.

## Core features

MapLibre atlas with satellite and light modes, a Leaflet fallback with standard OpenStreetMap tiles for browsers without WebGL2, up to 20 ordered stops, dates and notes, actual driving routes and leg estimates, 5–50 mile route-corridor discovery, official park and campground references, campground amenity filters, current modeled weather and forecasts, NWS alerts, NOAA river conditions, public-land polygons, local saved trips, EV preferences, and landscape, portrait, or clean-map PNG exports. Mobile sheets, text-size controls, keyboard search, focus states, and reduced motion are supported.

Drafts save in this browser's local storage. Saved trips retain stop order, dates, notes, saved places, and preferences. Unreadable storage and quota failures are reported instead of silently overwriting the original draft. Nothing is synced to an account.

## Data on GitHub Pages

Without configuration, the browser requests public, CORS-enabled endpoints directly: OSRM driving routes; Photon/OpenStreetMap search; Open-Meteo forecasts and modeled air quality; Overpass places; NWS alerts; NOAA NWPS river gauges; and USGS PAD-US reference boundaries. Each source can fail independently, and unavailable data is labeled. Missing markers never mean an area is safe or that a road is open.

The National Park Service reference snapshot contains 474 park records and 62 campground records, retrieved October 1, 2026. Reference descriptions, fees, facilities, and photographs are attributed and linked to their official source; they are not live operational status or reservation availability. Public-land boundaries do not imply camping permission. Driving times are estimates, not traffic predictions. EV discovery does not predict state of charge or guarantee a working charger.

## Optional enhanced data

Keep API keys out of public JavaScript. If enhanced data is needed, deploy `backend/worker.ts` to an existing compatible server environment with the desired secrets, then set its HTTPS endpoint as `apiUrl` in `public/config.js` and rebuild. The optional backend includes caching, request limits, input bounds, and CORS restricted to the Safi Solutions domain. It has not been provisioned automatically.

| Backend variable | Enables |
| --- | --- |
| `NPS_API_KEY` | Live NPS notices, visitor centers, and campground information |
| `OPENROUTESERVICE_API_KEY` | Enhanced routing and toll/highway/ferry avoidances |
| `GEOAPIFY_API_KEY` | Enhanced geocoding |
| `RIDB_API_KEY` | Recreation.gov campground facility discovery |
| `NREL_API_KEY` | Federal AFDC charging station records |
| `NASA_FIRMS_MAP_KEY` | Satellite heat detections, not confirmed wildfire perimeters |
| `AIRNOW_API_KEY` | Nearby observed air quality |
| `WZDX_FEED_URLS` | Comma-separated official HTTPS state work-zone feeds |

Unconfigured enhanced sources remain unavailable with an explanation. Standard routing continues to work when avoidances are off. Never paste secrets into `config.js` or commit `.dev.vars`.

Map attribution remains visible and is included in exported PNGs. Local park photographs are credited in `images/credits.json`; other reference images retain NPS credits. The map worker and shared module must be kept together in `maplibre/`.
