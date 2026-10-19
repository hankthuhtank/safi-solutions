// Bands (genres), the bundled catalog and live finds from Openverse.

import type { Track } from "../types";

export interface Band {
  id: string;
  name: string;
  note: string;
  /** Openverse search used to extend the band with live finds */
  query: string;
}

export const BANDS: Band[] = [
  {
    id: "kissa",
    name: "Kissa Jazz",
    note: "Small-group jazz for a Tokyo listening café. Modern Creative Commons recordings played in the spirit of the kissaten, not Japanese releases.",
    query: "japanese jazz",
  },
  { id: "jazzcafe", name: "Jazz Café", note: "Easy, unhurried jazz for a rainy afternoon.", query: "jazz cafe" },
  {
    id: "vintage",
    name: "Vintage 78s",
    note: "Genuine jazz and dance-band records from 1920 to 1925, public domain in the United States. Surface noise included.",
    query: "swing jazz",
  },
  { id: "lofi", name: "Lo-fi", note: "Dusty beats and warm tape for studying.", query: "lofi" },
  { id: "chillhop", name: "Chillhop", note: "Head-nodding instrumental hip-hop.", query: "chillhop" },
  { id: "piano", name: "Piano", note: "Solo piano, from Satie to Chopin to quiet originals.", query: "piano relaxing" },
  { id: "classical", name: "Classical", note: "Bach, Chopin and Satie in free recordings.", query: "classical piano" },
  { id: "acoustic", name: "Soft Acoustic", note: "Guitar, keys and gentle hands.", query: "acoustic guitar instrumental" },
  { id: "ambient", name: "Ambient Electronic", note: "Slow electronics with room to think.", query: "ambient electronic" },
  { id: "downtempo", name: "Downtempo", note: "Unhurried grooves.", query: "downtempo" },
  { id: "synthwave", name: "Chill Synthwave", note: "Night drives and neon.", query: "synthwave" },
  { id: "space", name: "Space Ambient", note: "Drift between the stars.", query: "space ambient" },
  { id: "meditation", name: "Meditation", note: "Long, still pieces for breathing.", query: "meditation" },
  { id: "nature", name: "Nature Instrumentals", note: "Music named for, and drawn from, the natural world.", query: "nature instrumental" },
  { id: "sleep", name: "Sleep", note: "Low, soft and slow.", query: "sleep ambient" },
  { id: "relaxing", name: "Relaxing Instrumentals", note: "Calm instrumental music for any time.", query: "relaxing instrumental" },
  {
    id: "christmas",
    name: "Christmas",
    note: "Carols old and new: Kevin MacLeod's arrangements and genuine records from 1906 to 1925, public domain in the United States. Surface noise included.",
    query: "christmas carol instrumental",
  },
  {
    id: "halloween",
    name: "Hallowe'en",
    note: "Eerie, slow and a little theatrical: Kevin MacLeod's darker pieces and 1920s records of Danse Macabre and the Hall of the Mountain King.",
    query: "spooky halloween",
  },
];

export const BAND_BY_ID = new Map(BANDS.map((b) => [b.id, b]));

let catalog: Promise<Track[]> | null = null;

export function loadCatalog(): Promise<Track[]> {
  if (!catalog) {
    catalog = fetch("/vibey/media/music/catalog.json")
      .then((r) => {
        if (!r.ok) throw new Error(`catalog ${r.status}`);
        return r.json() as Promise<{ tracks: Track[] }>;
      })
      .then((c) => c.tracks)
      .catch((e) => {
        catalog = null;
        throw e;
      });
  }
  return catalog;
}

export function tracksFor(all: Track[], bands: string[]) {
  if (bands.length === 1) return all.filter((t) => t.b.includes(bands[0]));
  // a scene's mix: interleave its bands so none dominates
  const lists = bands.map((b) => all.filter((t) => t.b.includes(b)));
  const out: Track[] = [];
  const seen = new Set<string>();
  for (let i = 0; lists.some((l) => i < l.length); i++) {
    for (const l of lists) {
      const t = l[i];
      if (t && !seen.has(t.id)) {
        seen.add(t.id);
        out.push(t);
      }
    }
  }
  return out;
}

// ---- Openverse ---------------------------------------------------------------------------------
// Anonymous requests are rate limited, so results are cached for a day and only fetched when a
// band is actually chosen. Only licences that allow playback anywhere are kept (CC0, BY, BY-SA, PDM).

interface OVResult {
  id: string;
  title: string;
  creator: string | null;
  url: string;
  foreign_landing_url: string;
  license: string;
  license_version: string | null;
  license_url: string | null;
  duration: number | null;
  source: string;
  category: string | null;
  mature: boolean;
  audio_set?: { title?: string } | null;
}

const OV_CACHE = "vibey:ov:";
const DAY = 86400000;

function ovLicence(r: OVResult) {
  if (r.license === "cc0") return "CC0";
  if (r.license === "pdm") return "Public Domain Mark";
  return `CC ${r.license.toUpperCase()} ${r.license_version ?? ""}`.trim();
}

export async function openverse(band: Band, signal?: AbortSignal): Promise<Track[]> {
  const key = OV_CACHE + band.id;
  try {
    const hit = JSON.parse(localStorage.getItem(key) ?? "null") as { at: number; tracks: Track[] } | null;
    if (hit && Date.now() - hit.at < DAY) return hit.tracks;
  } catch {
    /* storage unavailable */
  }
  const q = new URLSearchParams({
    q: band.query,
    category: "music",
    license: "cc0,by,by-sa,pdm",
    source: "jamendo,ccmixter,wikimedia_audio",
    page_size: "20", // the most an anonymous request may ask for
    mature: "false",
  });
  const res = await fetch(`https://api.openverse.org/v1/audio/?${q}`, { signal });
  if (!res.ok) throw new Error(`Openverse ${res.status}`);
  const data = (await res.json()) as { results: OVResult[] };
  const tracks: Track[] = data.results
    .filter((r) => r.url && !r.mature && (r.duration ?? 0) >= 90000 && (r.duration ?? 0) <= 1500000)
    .map((r) => ({
      id: `ov-${r.id}`,
      t: r.title || "Untitled",
      a: r.creator || "Unknown artist",
      al: r.audio_set?.title || undefined,
      b: [band.id],
      d: Math.round((r.duration ?? 0) / 1000),
      u: r.url,
      p: r.foreign_landing_url,
      l: ovLicence(r),
      lu: r.license_url ?? "https://creativecommons.org/licenses/",
      g: -4, // commercial-style masters run hot; meet the catalog roughly where it sits
      s: `openverse/${r.source}`,
    }));
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), tracks }));
  } catch {
    /* storage full or unavailable */
  }
  return tracks;
}

export const SOURCE_NAMES: Record<string, string> = {
  fma: "Free Music Archive",
  ia: "Internet Archive",
  "openverse/jamendo": "Jamendo via Openverse",
  "openverse/ccmixter": "ccMixter via Openverse",
  "openverse/wikimedia_audio": "Wikimedia Commons via Openverse",
};
