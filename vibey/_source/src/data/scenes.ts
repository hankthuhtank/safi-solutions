import type { Credit, Fx, SceneDef, Variation } from "../types";
import manifest from "../../../media/scenes/manifest.json";
import sources from "../../../scripts/media-sources.json";

export const DEFAULT_FX: Fx = {
  rain: 0,
  rainGlass: 0,
  glassFull: false,
  glassFocus: "scene",
  snow: 0,
  fog: 0,
  fogColor: [0.62, 0.66, 0.7],
  fogLow: 0,
  wind: 0.3,
  clouds: 0,
  mist: 0,
  water: 0,
  wet: 0,
  sway: 0,
  lightning: 0,
  stars: 0,
  starfield: 0,
  meteors: 0,
  aurora: 0,
  caustics: 0,
  lamps: 0,
  neon: 0,
  fire: 0,
  embers: 0,
  dust: 0,
  petals: 0,
  petalKind: "sakura",
  fireflies: 0,
  marine: 0,
  headlights: 0,
  splashes: 0,
  aircraft: 0,
  steam: 0,
  drift: 0.45,
  zoom: 0,
  exposure: 0,
  warmth: 0,
  reflection: 0,
};

type SourceEntry = { author: string; title?: string; license: string; licenseUrl: string; page: string; place?: string | null };
const SRC = sources as Record<string, SourceEntry>;

export interface ManifestEntry {
  kind: "photo" | "video";
  place: string | null;
  widths: number[];
  maps: boolean;
  glass: boolean;
  aspect: number;
  lqip: string;
  video?: { av1?: string; hevc?: string; h264?: string; width: number; height: number };
}
export const MANIFEST = manifest as unknown as Record<string, ManifestEntry>;

function credit(key: string): Credit {
  const s = SRC[key];
  if (!s) return { author: "Unknown", license: "", licenseUrl: "", page: "" };
  return { title: s.title, author: s.author, license: s.license, licenseUrl: s.licenseUrl, page: s.page };
}

/** Variation helper: media folder and credit both come from the key `scene/variation`. */
function v(key: string, label: string, opts: Partial<Variation> & { place?: string } = {}): Variation {
  const [scene, id] = key.split("/");
  const m = MANIFEST[key];
  return {
    id,
    label,
    place: opts.place ?? SRC[key]?.place ?? "",
    kind: (m?.kind as "photo" | "video") ?? "photo",
    dir: `${scene}/${id}`,
    maps: !!m?.maps,
    focus: opts.focus ?? [0.5, 0.5],
    fx: opts.fx ?? {},
    hearth: opts.hearth,
    hearthMode: opts.hearthMode,
    outsideOnly: opts.outsideOnly,
    road: opts.road,
    emberAt: opts.emberAt,
    sounds: opts.sounds,
    timeZone: opts.timeZone,
    coords: opts.coords,
    credit: credit(key),
  };
}

const ALL_SCENES: SceneDef[] = [
  {
    id: "tokyo-cafe",
    name: "Rainy Tokyo Café",
    freq: 88.1,
    categories: ["cozy", "urban", "weather"],
    blurb: "A window seat in a kissaten while the rain comes down on the street outside.",
    timeZone: "Asia/Tokyo",
    coords: [35.71, 139.79],
    variations: [
      v("tokyo-cafe/night", "Night", { road: [0.6, 0.82], focus: [0.5, 0.56] }),
      v("tokyo-cafe/dusk", "Dusk", { road: [0.62, 0.86], focus: [0.5, 0.58] }),
    ],
    fx: {
      rainGlass: 0.65,
      glassFull: true,
      rain: 0.3,
      splashes: 0.5,
      headlights: 0.55,
      reflection: 0.22,
      lamps: 0.35,
      neon: 0.25,
      wet: 0.5,
      drift: 0.4,
    },
    controls: ["rainGlass", "glassFocus", "rain", "lightning", "headlights", "drift", "light"],
    sounds: { "rain-window": 0.6, cafe: 0.24, thunder: 0.14, traffic: 0.1 },
    bands: ["kissa", "jazzcafe", "lofi"],
  },
  {
    id: "jazz-lounge",
    name: "Vintage Jazz Lounge",
    freq: 89.1,
    categories: ["cozy"],
    blurb: "Low lamps, a polished bar and a record turning somewhere in the back room.",
    timeZone: "",
    variations: [v("jazz-lounge/bar", "The bar", { place: "Lounge" }), v("jazz-lounge/backbar", "Back bar", { place: "Lounge" })],
    fx: { lamps: 0.7, fog: 0.14, fogColor: [0.32, 0.22, 0.14], dust: 0.35, drift: 0.35 },
    controls: ["fog", "dust", "drift", "light"],
    sounds: { bar: 0.3, vinyl: 0.35, glasses: 0.12, "rain-roof": 0 },
    bands: ["vintage", "jazzcafe", "kissa"],
  },
  {
    id: "library",
    name: "Quiet Library",
    freq: 90.1,
    categories: ["cozy"],
    blurb: "Tall shelves, warm lamps and the soft scratch of a page turning.",
    timeZone: "Europe/Amsterdam",
    coords: [52.36, 4.885],
    variations: [
      v("library/reading-hall", "Reading hall"),
      v("library/study", "Study", { timeZone: "Europe/London", coords: [55.6, -2.72] }),
    ],
    fx: { dust: 0.6, lamps: 0.45, fog: 0.05, fogColor: [0.6, 0.5, 0.36], drift: 0.3 },
    controls: ["dust", "drift", "light"],
    sounds: { "rain-roof": 0.3, pages: 0.2, clock: 0.14, room: 0.2 },
    bands: ["classical", "piano", "relaxing"],
  },
  {
    id: "fireplace-rain",
    name: "Fireplace and Rain",
    freq: 91.1,
    categories: ["cozy", "weather"],
    blurb: "A log cabin at night: the fire is lit and the rain will not let up.",
    timeZone: "",
    variations: [
      v("fireplace-rain/cabin-night", "Cabin", {
        place: "Log cabin",
        hearth: { x: 0.466, y: 0.402, w: 0.071, h: 0.112 },
        hearthMode: "over",
        outsideOnly: true,
      }),
    ],
    fx: { fire: 0.95, rainGlass: 0.55, lightning: 0.1, lamps: 0.25, drift: 0.3 },
    controls: ["fire", "rainGlass", "lightning", "drift", "light"],
    sounds: { fireplace: 0.6, "rain-window": 0.45, thunder: 0.2, room: 0.08 },
    bands: ["vintage", "piano", "acoustic"],
  },
  {
    id: "mountain-cabin",
    name: "Mountain Cabin",
    freq: 92.1,
    categories: ["cozy", "weather"],
    blurb: "A stove crackling in a lodge while snow drifts across the fjord outside.",
    timeZone: "Atlantic/Reykjavik",
    variations: [
      v("mountain-cabin/lodge", "Lodge", {
        hearth: { x: 0.222, y: 0.624, w: 0.114, h: 0.148 },
        hearthMode: "inside",
        outsideOnly: true,
        emberAt: { x: 0.24, y: 0.62, w: 0.08, h: 0.03 },
      }),
    ],
    fx: { fire: 0.85, snow: 0.6, wind: 0.45, lamps: 0.2, drift: 0.3 },
    controls: ["fire", "snow", "rain", "wind", "drift", "light"],
    sounds: { fireplace: 0.55, wind: 0.3, snowstorm: 0.14, room: 0.1 },
    bands: ["acoustic", "piano", "relaxing"],
  },
  {
    id: "countryside",
    name: "Countryside Cottage",
    freq: 93.1,
    categories: ["nature"],
    blurb: "Thatched roofs, long grass and clouds rolling over open fields.",
    timeZone: "Europe/Copenhagen",
    coords: [56.16, 10.2],
    variations: [
      v("countryside/cottage", "Cottage"),
      v("countryside/evening", "Evening fields", { fx: { fireflies: 0.55, clouds: 0.4 }, timeZone: "Europe/Minsk", sounds: { birds: 0.08, crickets: 0.2 } }),
    ],
    fx: { clouds: 0.65, sway: 0.5, wind: 0.35, drift: 0.5 },
    controls: ["clouds", "wind", "fireflies", "rain", "drift", "light"],
    sounds: { birds: 0.4, leaves: 0.2, wind: 0.12 },
    bands: ["acoustic", "nature", "relaxing"],
  },
  {
    id: "japanese-garden",
    name: "Japanese Garden",
    freq: 94.1,
    categories: ["nature", "water"],
    blurb: "Temple gardens in Kyoto: still ponds, maples and falling petals.",
    timeZone: "Asia/Tokyo",
    coords: [35.03, 135.71],
    variations: [
      v("japanese-garden/autumn", "Ninna-ji, autumn", { fx: { petalKind: "maple" } }),
      v("japanese-garden/maples", "Eikandō maples", { fx: { petalKind: "maple" }, coords: [35.015, 135.794] }),
      v("japanese-garden/sakura-night", "Sakura at night", { fx: { petalKind: "sakura", clouds: 0 }, sounds: { birds: 0, insects: 0.14 } }),
    ],
    fx: { water: 0.6, clouds: 0.35, sway: 0.3, petals: 0.45, wind: 0.25, drift: 0.4 },
    controls: ["petals", "water", "wind", "rain", "drift", "light"],
    sounds: { river: 0.22, birds: 0.28, chimes: 0.1, shishi: 0.2, bell: 0.16 },
    bands: ["piano", "nature", "meditation"],
  },
  {
    id: "alpine",
    name: "Alpine View",
    freq: 95.1,
    categories: ["nature", "weather"],
    blurb: "Peaks above a sea of cloud, pine forest and valleys filling with mist.",
    timeZone: "Europe/Berlin",
    coords: [47.55, 12.92],
    variations: [
      v("alpine/morning", "Morning, cloud sea", { fx: { mist: 0.85 }, focus: [0.62, 0.5] }),
      v("alpine/sunset", "Sunset", { fx: { mist: 0.4, warmth: 0.05 }, coords: [47.75, 12.25] }),
      v("alpine/cloudy", "Cloudy", { fx: { mist: 0.8, fog: 0.12 } }),
      v("alpine/stormy", "Stormy", { fx: { lightning: 0.3, rain: 0.25, fog: 0.15 }, timeZone: "Europe/Rome" }),
    ],
    fx: { clouds: 0.7, sway: 0.25, wind: 0.45, drift: 0.55 },
    controls: ["clouds", "fog", "wind", "rain", "lightning", "drift", "light"],
    sounds: { wind: 0.32, birds: 0.22 },
    bands: ["piano", "nature", "classical"],
  },
  {
    id: "snowy-forest",
    name: "Snowy Forest",
    freq: 96.1,
    categories: ["nature", "weather"],
    blurb: "Evergreens under fresh snow, with more on the way.",
    timeZone: "",
    variations: [
      v("snowy-forest/pines", "Pines", { place: "Pine forest" }),
      v("snowy-forest/dusk", "Dusk", { timeZone: "Europe/Kyiv", coords: [48.36, 24.4] }),
    ],
    fx: { snow: 0.7, wind: 0.25, sway: 0.12, fog: 0.12, fogColor: [0.82, 0.86, 0.92], drift: 0.45 },
    controls: ["snow", "wind", "fog", "drift", "light"],
    sounds: { wind: 0.3, snowstorm: 0.18 },
    bands: ["piano", "sleep", "ambient"],
  },
  {
    id: "rainforest",
    name: "Rainforest",
    freq: 97.1,
    categories: ["nature", "weather", "water"],
    blurb: "Moss, ferns and a stream running fast after the rain.",
    timeZone: "Australia/Hobart",
    coords: [-42.0, 146.0],
    variations: [
      v("rainforest/stream", "Stream"),
      v("rainforest/sunbeams", "Sunbeams", { fx: { rain: 0.15, dust: 0.55, fog: 0.15 }, timeZone: "", place: "Rainforest falls" }),
    ],
    fx: { rain: 0.5, water: 0.55, sway: 0.4, fog: 0.18, fogColor: [0.62, 0.7, 0.62], drift: 0.45 },
    controls: ["rain", "water", "fog", "wind", "drift", "light"],
    sounds: { "rain-leaves": 0.5, river: 0.35, birds: 0.18, frogs: 0.12 },
    bands: ["nature", "ambient", "meditation"],
  },
  {
    id: "waterfall",
    name: "Waterfall",
    freq: 98.1,
    categories: ["nature", "water"],
    blurb: "A waterfall pouring into a still green pool.",
    timeZone: "",
    variations: [
      v("waterfall/pool", "Pool", { place: "Waterfall pool" }),
      v("waterfall/cascade", "Cascade"),
    ],
    fx: { drift: 0.25 },
    controls: ["drift", "light"],
    sounds: { waterfall: 0.6, forest: 0.2, birds: 0.12 },
    bands: ["nature", "meditation", "ambient"],
  },
  {
    id: "lakeside",
    name: "Lakeside",
    freq: 99.1,
    categories: ["nature", "water"],
    blurb: "A mountain lake so still it holds the whole sky.",
    timeZone: "America/Los_Angeles",
    coords: [37.78, -119.13],
    variations: [
      v("lakeside/daybreak", "Daybreak"),
      v("lakeside/golden-hour", "Golden hour", { timeZone: "Europe/Stockholm", coords: [66.95, 17.7] }),
      v("lakeside/midday", "Midday", { timeZone: "Pacific/Auckland", coords: [-43.62, 171.05] }),
    ],
    fx: { water: 0.7, clouds: 0.5, sway: 0.22, wind: 0.25, drift: 0.5 },
    controls: ["water", "clouds", "wind", "rain", "fog", "drift", "light"],
    sounds: { lake: 0.4, birds: 0.24, wildlife: 0.08 },
    bands: ["piano", "ambient", "nature"],
  },
  {
    id: "ocean",
    name: "Oceanfront",
    freq: 100.1,
    categories: ["water", "nature"],
    blurb: "Waves rolling in over pale sand.",
    timeZone: "",
    variations: [
      v("ocean/tropical", "Tropical", { place: "Tropical shore" }),
      v("ocean/surf", "Open surf", { place: "Open beach" }),
      v("ocean/dawn", "Dawn", { place: "Shoreline at dawn" }),
    ],
    fx: { drift: 0.2 },
    controls: ["drift", "light"],
    sounds: { ocean: 0.7, seagulls: 0.12, wind: 0.18 },
    bands: ["ambient", "downtempo", "meditation"],
  },
  {
    id: "storm-sea",
    name: "Storm Over the Sea",
    freq: 101.1,
    categories: ["weather", "water"],
    blurb: "A storm cell walking across the water, lightning deep in the cloud.",
    timeZone: "",
    variations: [
      v("storm-sea/cell", "Storm cell", { place: "Open water" }),
      v("storm-sea/buoy", "Night swell", { place: "Open water" }),
    ],
    fx: { lightning: 0.5, rain: 0.45, wind: 0.65, drift: 0.2 },
    controls: ["lightning", "rain", "wind", "drift", "light"],
    sounds: { storm: 0.5, ocean: 0.35, thunder: 0.45, wind: 0.3 },
    bands: ["ambient", "space", "sleep"],
  },
  {
    id: "underwater",
    name: "Underwater",
    freq: 102.1,
    categories: ["water"],
    blurb: "Sunlight wavering across a reef, far below the surface.",
    timeZone: "",
    variations: [
      v("underwater/reef", "Reef", { place: "Coral reef" }),
      v("underwater/cenote", "Cenote", { place: "Cenote", fx: { caustics: 0.25 } }),
    ],
    fx: { caustics: 0.7, marine: 0.6, drift: 0.5 },
    controls: ["caustics", "drift", "light"],
    sounds: { underwater: 0.6 },
    bands: ["ambient", "space", "meditation"],
  },
  {
    id: "neon-tokyo",
    name: "Neon Tokyo",
    freq: 103.1,
    categories: ["urban", "weather"],
    blurb: "Rain on the signs and on the street, late enough that the crowds have gone.",
    timeZone: "Asia/Tokyo",
    coords: [35.694, 139.703],
    variations: [
      v("neon-tokyo/kabukicho", "Main street"),
      v("neon-tokyo/side-street", "Side street"),
      v("neon-tokyo/alley", "Alley"),
    ],
    fx: { rain: 0.45, splashes: 0.6, neon: 0.6, lamps: 0.25, wet: 0.6, fog: 0.06, fogColor: [0.45, 0.32, 0.4], drift: 0.45 },
    controls: ["rain", "lightning", "fog", "drift", "light"],
    sounds: { "rain-heavy": 0.32, tokyo: 0.3, "city-night": 0.18 },
    bands: ["synthwave", "lofi", "downtempo"],
  },
  {
    id: "rooftop-city",
    name: "Rooftop City",
    freq: 104.1,
    categories: ["urban"],
    blurb: "High above a city as the lights come on.",
    timeZone: "Asia/Taipei",
    variations: [
      v("rooftop-city/sunset", "Sunset"),
      v("rooftop-city/night", "Night", { timeZone: "Asia/Bangkok", coords: [13.74, 100.53] }),
    ],
    fx: { clouds: 0.45, aircraft: 0.6, lamps: 0.2, fog: 0.1, fogColor: [0.55, 0.45, 0.42], wind: 0.3, drift: 0.5 },
    controls: ["clouds", "fog", "rain", "drift", "light"],
    sounds: { "city-night": 0.4, wind: 0.24, traffic: 0.16 },
    bands: ["lofi", "chillhop", "synthwave"],
  },
  {
    id: "desert",
    name: "Desert Nights",
    freq: 105.1,
    categories: ["cosmic", "nature"],
    blurb: "The Milky Way over the Atacama, one of the darkest skies on Earth.",
    timeZone: "America/Santiago",
    coords: [-24.59, -70.19],
    variations: [v("desert/atacama", "Cerro Armazones"), v("desert/hills", "Paranal hills")],
    fx: { stars: 0.85, meteors: 0.6, wind: 0.2, drift: 0.35 },
    controls: ["stars", "meteors", "drift", "light"],
    sounds: { "desert-wind": 0.3, crickets: 0.1 },
    bands: ["space", "ambient", "sleep"],
  },
  {
    id: "aurora",
    name: "Northern Lights",
    freq: 106.1,
    categories: ["cosmic", "weather"],
    blurb: "Aurora pouring over snow and water above the Arctic Circle.",
    timeZone: "Europe/Oslo",
    coords: [68.2, 13.6],
    variations: [
      v("aurora/lofoten", "Lofoten", { fx: { water: 0.35 } }),
      v("aurora/vik", "Vík", { timeZone: "Atlantic/Reykjavik", coords: [63.42, -19.01] }),
    ],
    fx: { aurora: 0.65, stars: 0.6, wind: 0.2, drift: 0.4 },
    controls: ["aurora", "stars", "snow", "drift", "light"],
    sounds: { wind: 0.28, snowstorm: 0.08, lake: 0.12 },
    bands: ["space", "ambient", "sleep"],
  },
  {
    id: "observatory",
    name: "Galactic Observatory",
    freq: 107.1,
    categories: ["cosmic"],
    blurb: "Deep-space light gathered by Webb and Hubble, drifting slowly past.",
    timeZone: "",
    variations: [
      v("observatory/cosmic-cliffs", "Cosmic Cliffs"),
      v("observatory/whirlpool", "Whirlpool Galaxy"),
      v("observatory/westerlund", "Westerlund 2"),
    ],
    fx: { zoom: 0.8, starfield: 0.55, stars: 0.5, drift: 0.6, wind: 0 },
    controls: ["stars", "drift", "light"],
    sounds: { space: 0.5 },
    bands: ["space", "sleep", "meditation"],
  },
];

/** Only places whose media has been published (every one, once the asset build has run). */
export const SCENES: SceneDef[] = ALL_SCENES.map((s) => ({ ...s, variations: s.variations.filter((v) => MANIFEST[v.dir]) })).filter(
  (s) => s.variations.length > 0,
);

export const SCENE_BY_ID = new Map(SCENES.map((s) => [s.id, s]));

export function resolveFx(scene: SceneDef, variation: Variation, overrides: Partial<Fx> = {}): Fx {
  return { ...DEFAULT_FX, ...scene.fx, ...variation.fx, ...overrides };
}

export const CATEGORIES: { id: SceneDef["categories"][number]; label: string }[] = [
  { id: "cozy", label: "Cozy" },
  { id: "nature", label: "Nature" },
  { id: "urban", label: "Urban" },
  { id: "water", label: "Water" },
  { id: "cosmic", label: "Cosmic" },
  { id: "weather", label: "Weather" },
];
