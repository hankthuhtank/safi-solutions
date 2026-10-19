import type { Credit, Fx } from "../types";
import manifest from "../../../media/sounds/manifest.json";

export type SoundGroup = "weather" | "water" | "nature" | "indoors" | "town" | "tones";

export interface SoundDef {
  id: string;
  name: string;
  group: SoundGroup;
  /** loop: one long recording; events: one-shots at random intervals; synth: generated live */
  kind: "loop" | "events" | "synth";
  files: string[];
  /** balance at full level, so every slider at the same height sounds about as loud */
  gain: number;
  events?: {
    mean: number; // average seconds between events at full intensity
    min: number; // never closer than this
    jitterDb?: number;
    pan?: number;
    rate?: number; // +- playback-rate spread
  };
  synth?: "space" | "brown" | "vinyl";
  /** on-screen effect this sound rises and falls with when "sound follows scene" is on */
  follows?: keyof Fx;
  credits: Credit[];
}

type Entry = { files: string[]; durations: number[]; credits: Credit[] };
const M = manifest as Record<string, Entry>;

function s(id: string, name: string, group: SoundGroup, gain: number, extra: Partial<SoundDef> = {}): SoundDef {
  const m = M[id];
  return {
    id,
    name,
    group,
    kind: extra.kind ?? (m && m.files.length > 1 ? "events" : "loop"),
    files: m?.files ?? [],
    gain,
    credits: m?.credits ?? [],
    ...extra,
  };
}

const ev = (mean: number, min: number, o: Omit<NonNullable<SoundDef["events"]>, "mean" | "min"> = {}) => ({
  kind: "events" as const,
  events: { mean, min, ...o },
});

const ALL: SoundDef[] = [
  s("rain-light", "Light rain", "weather", 1.0, { follows: "rain" }),
  s("rain-heavy", "Heavy rain", "weather", 0.95, { follows: "rain" }),
  s("rain-window", "Rain on glass", "weather", 1.0, { follows: "rainGlass" }),
  s("rain-roof", "Rain on the roof", "weather", 1.0, { follows: "rain" }),
  s("rain-leaves", "Rain on leaves", "weather", 1.0, { follows: "rain" }),
  s("storm", "Thunderstorm", "weather", 0.95, { follows: "rain" }),
  s("thunder", "Distant thunder", "weather", 1.3, { ...ev(32, 8, { jitterDb: 4, pan: 0.7, rate: 0.07 }), follows: "lightning" }),
  s("wind", "Wind", "weather", 1.25, { follows: "wind" }),
  s("snowstorm", "Snowstorm", "weather", 1.0, { follows: "snow" }),
  s("desert-wind", "Desert wind", "weather", 1.05, { follows: "wind" }),

  s("ocean", "Ocean waves", "water", 1.0),
  s("river", "Flowing river", "water", 1.0, { follows: "water" }),
  s("lake", "Lake shore", "water", 1.0, { follows: "water" }),
  s("waterfall", "Waterfall", "water", 0.95),
  s("underwater", "Underwater", "water", 1.0),
  s("seagulls", "Gulls", "water", 1.6, ev(10, 2, { jitterDb: 5, pan: 0.85, rate: 0.05 })),

  s("birds", "Birdsong", "nature", 1.0),
  s("forest", "Forest", "nature", 1.0),
  s("leaves", "Rustling leaves", "nature", 1.2, { follows: "wind" }),
  s("crickets", "Crickets", "nature", 0.9),
  s("insects", "Night insects", "nature", 0.9),
  s("frogs", "Frogs", "nature", 0.95),
  s("wildlife", "Distant wildlife", "nature", 1.3, ev(24, 5, { jitterDb: 5, pan: 0.85, rate: 0.03 })),

  s("fireplace", "Fireplace", "indoors", 1.05, { follows: "fire" }),
  s("vinyl", "Vinyl crackle", "indoors", 1.1, { kind: "synth", synth: "vinyl" }),
  s("cafe", "Café conversation", "indoors", 1.0),
  s("bar", "Lounge murmur", "indoors", 1.0),
  s("glasses", "Glasses", "indoors", 1.7, ev(12, 3, { jitterDb: 5, pan: 0.5, rate: 0.06 })),
  s("pages", "Page turns", "indoors", 2.2, ev(16, 4, { jitterDb: 4, pan: 0.35, rate: 0.06 })),
  s("typing", "Typing", "indoors", 1.05),
  s("clock", "Clock", "indoors", 1.25),
  s("room", "Room tone", "indoors", 0.9),
  s("fan", "Fan", "indoors", 0.95),

  s("traffic", "Distant traffic", "town", 1.0),
  s("city-night", "City at night", "town", 1.0),
  s("tokyo", "Tokyo side street", "town", 1.0),
  s("chimes", "Wind chimes", "town", 1.1),
  s("shishi", "Shishi-odoshi", "town", 1.2, ev(22, 8, { jitterDb: 2, pan: 0.3, rate: 0.02 })),
  s("bell", "Temple bell", "town", 1.4, ev(60, 20, { jitterDb: 3, pan: 0.4, rate: 0.015 })),

  s("space", "Deep-space drone", "tones", 1.0, { kind: "synth", synth: "space" }),
  s("brown", "Brown noise", "tones", 0.4, { kind: "synth", synth: "brown" }),
];

/** Sounds whose recordings are published (all of them, once the asset build has run). */
export const SOUNDS = ALL.filter((d) => d.kind === "synth" || d.files.length > 0);

export const SOUND_BY_ID = new Map(SOUNDS.map((d) => [d.id, d]));

export const SOUND_GROUPS: { id: SoundGroup; label: string }[] = [
  { id: "weather", label: "Weather" },
  { id: "water", label: "Water" },
  { id: "nature", label: "Nature" },
  { id: "indoors", label: "Indoors" },
  { id: "town", label: "Town & temple" },
  { id: "tones", label: "Tones" },
];
