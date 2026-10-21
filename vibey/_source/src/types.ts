export type Category = "cozy" | "nature" | "urban" | "water" | "cosmic" | "weather";
export type Quality = "performance" | "balanced" | "ultra";

/** Every live, scene-level effect. 0 switches an effect off. */
export interface Fx {
  rain: number; // falling rain streaks
  rainGlass: number; // drops forming and sliding on window glass
  glassFull: boolean; // true: the whole frame is seen through glass; false: only the masked window
  glassFocus: "scene" | "glass"; // camera focus while looking through wet glass
  snow: number;
  fog: number;
  fogColor: [number, number, number];
  fogLow: number; // 0 even haze, 1 settles in valleys
  wind: number; // drives rain slant, snow drift, cloud speed and foliage sway
  clouds: number; // sky drift
  mist: number; // let low cloud or a fog sea (water-labelled) drift like sky
  water: number; // ripples and shimmer on lakes and ponds
  wet: number; // the same shimmer on rain-soaked ground
  sway: number; // foliage movement
  lightning: number; // average flashes per minute / 2
  stars: number; // twinkle
  starfield: number; // parallax star layers (space)
  meteors: number;
  aurora: number;
  caustics: number;
  lamps: number; // warm lamp flicker
  neon: number; // sign flicker
  fire: number; // composited hearth fire and room glow
  embers: number;
  dust: number; // motes in light
  petals: number;
  petalKind: "sakura" | "maple" | "autumn";
  fireflies: number;
  marine: number; // drifting particles underwater
  headlights: number; // out-of-focus traffic passing beyond the glass
  splashes: number; // rain rings on wet ground
  aircraft: number;
  steam: number;
  drift: number; // slow camera drift and parallax ("movement")
  zoom: number; // very slow push in (space)
  exposure: number; // -1..1 ambient light
  warmth: number; // -1..1
  reflection: number; // warm interior reflection on the glass
  twinkle: number; // small bright lights (fairy lights, distant windows) sparkle
  night: number; // 0..1 after dark: day-for-night grade, lights and lit windows keep their glow
  glow: number; // firelight pool from glowAt (a hearth in or just out of frame)
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Credit {
  title?: string;
  author: string;
  license: string;
  licenseUrl: string;
  page: string;
  note?: string;
}

export interface Variation {
  id: string;
  label: string;
  place: string;
  kind: "photo" | "video";
  /** media folder relative to /vibey/media/scenes/ */
  dir: string;
  maps: boolean;
  focus: [number, number]; // object-fit focal point
  /** Water current in image UV per second; banks and rocks stay anchored by the water mask. */
  waterFlow?: [number, number];
  fx: Partial<Fx>;
  /** where the composited hearth fire sits, in image UV */
  hearth?: Rect;
  hearthMode?: "over" | "inside"; // "inside": the photo already shows flames behind bars
  outsideOnly?: boolean; // weather happens beyond a window, so particles stay small and far
  /** band of road for passing headlights, in image UV (y range) */
  road?: [number, number];
  steamAt?: [number, number];
  emberAt?: Rect;
  /** where firelight comes from, in image UV (may lie outside 0..1 for a fire just out of frame) */
  glowAt?: [number, number];
  /** an interior: after dark the room goes warm and dim, the view outside goes to moonlight */
  interior?: boolean;
  /** seen from outside: after dark the windowpanes the segmenter found glow warm */
  litWindows?: boolean;
  /** ambience overrides for this variation (e.g. night insects instead of birds) */
  sounds?: Record<string, number>;
  timeZone?: string;
  coords?: [number, number];
  credit: Credit;
}

export type ControlId =
  | "rain"
  | "rainGlass"
  | "glassFocus"
  | "snow"
  | "fog"
  | "wind"
  | "clouds"
  | "water"
  | "lightning"
  | "stars"
  | "meteors"
  | "aurora"
  | "caustics"
  | "night"
  | "twinkle"
  | "glow"
  | "fire"
  | "embers"
  | "dust"
  | "petals"
  | "fireflies"
  | "headlights"
  | "drift"
  | "light";

export interface SceneDef {
  id: string;
  name: string;
  freq: number;
  categories: Category[];
  blurb: string;
  timeZone: string;
  coords?: [number, number];
  variations: Variation[];
  fx: Partial<Fx>;
  controls: ControlId[];
  /** suggested ambience levels 0..1 */
  sounds: Record<string, number>;
  /** suggested music bands, first is the default */
  bands: string[];
}

export interface Track {
  id: string;
  t: string; // title
  a: string; // artist
  al?: string; // album
  y?: number; // year for historical recordings
  b: string[]; // bands
  d: number; // seconds
  u: string; // stream url
  p: string; // source page
  l: string; // licence name
  lu: string; // licence url
  g: number; // loudness match gain in dB
  s: string; // source key
  local?: boolean;
}
