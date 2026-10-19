// App state: one small external store, persisted to localStorage (no accounts, nothing leaves the
// browser). Engines react to it from the components that own them.

import { useSyncExternalStore } from "react";
import type { Fx, Quality, Track } from "../types";
import { SCENES, SCENE_BY_ID, resolveFx } from "../data/scenes";
import { SOUND_BY_ID } from "../data/sounds";
import type { Repeat } from "../engine/audio/Music";

export type PanelId = "places" | "music" | "mix" | "scene" | "memory" | "timers" | "monitor" | "settings" | "credits" | "help";

export interface Preset {
  id: string;
  name: string;
  builtIn?: boolean;
  scene: string;
  variation: string;
  fx: Partial<Fx>;
  mix: Record<string, number>;
  playlist: string;
}

export interface SceneCycle {
  on: boolean;
  minutes: number;
  scope: string; // "all", a category id, or "favorites"
  order: "next" | "random";
  variations: boolean; // step through a place's variations before moving on
}

export interface MusicCycle {
  on: boolean;
  minutes: number;
  bands: string[];
}

export interface PresetCycle {
  on: boolean;
  minutes: number;
  ids: string[];
}

export interface SleepTimer {
  endsAt: number;
  minutes: number;
  fade: number; // minutes of fade at the end
  dim: boolean; // also dim the picture
}

export interface FocusTimer {
  phase: "focus" | "break" | "long";
  endsAt: number;
  pausedLeft: number | null;
  focus: number;
  short: number;
  long: number;
  round: number;
  rounds: number;
  chime: boolean;
}

export interface Settings {
  quality: "auto" | Quality;
  motion: "auto" | "full" | "reduced";
  clock24: boolean;
  /** the place's local time on the slate (and the date under the TV clock) */
  clockShow: "time" | "date" | "off";
  tvClock: boolean;
  tvNowPlaying: boolean;
  soundFollowsScene: boolean;
  mixFollowsScene: boolean;
  openverse: boolean;
  hideAfter: number;
}

export interface State {
  scene: string;
  variation: string;
  fx: Record<string, Partial<Fx>>; // per-place overrides
  mix: Record<string, number>;
  muted: Record<string, boolean>;
  shape: Record<string, number>; // per-sound distance (loops) or frequency (events), 0..1
  levels: { master: number; music: number; ambient: number };
  allMuted: boolean;
  playlist: string;
  shuffle: boolean;
  repeat: Repeat;
  crossfade: number;
  favorites: Track[];
  recent: Track[];
  favoritePlaces: string[];
  presets: Preset[];
  sceneCycle: SceneCycle;
  musicCycle: MusicCycle;
  presetCycle: PresetCycle;
  lastPreset: string | null;
  sleep: SleepTimer | null;
  focus: FocusTimer | null;
  settings: Settings;
  // session only
  panel: PanelId | null;
  tv: boolean;
  started: boolean;
  visitedBefore: boolean;
  asleep: boolean; // the sleep timer ran out: silent, picture dimmed, until someone stirs
  dim: number; // 0..1 picture dimming from a sleep fade
  /** 2 = the louder mix balance; older saves are lifted on load */
  mixVersion: number;
}

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: "p-rainy-jazz-cafe",
    name: "Rainy Jazz Café",
    builtIn: true,
    scene: "tokyo-cafe",
    variation: "night",
    fx: { rainGlass: 0.75, rain: 0.35 },
    mix: { "rain-window": 0.8, cafe: 0.54, thunder: 0.55, traffic: 0.42 },
    playlist: "band:kissa",
  },
  {
    id: "p-alpine-morning",
    name: "Alpine Morning",
    builtIn: true,
    scene: "alpine",
    variation: "morning",
    fx: {},
    mix: { wind: 0.56, birds: 0.57 },
    playlist: "band:piano",
  },
  {
    id: "p-ocean-meditation",
    name: "Ocean Meditation",
    builtIn: true,
    scene: "ocean",
    variation: "dawn",
    fx: {},
    mix: { ocean: 0.8, seagulls: 0.55, wind: 0.44 },
    playlist: "band:meditation",
  },
  {
    id: "p-late-night-cyberpunk",
    name: "Late Night Cyberpunk",
    builtIn: true,
    scene: "neon-tokyo",
    variation: "alley",
    fx: { rain: 0.6, fog: 0.12 },
    mix: { "rain-heavy": 0.65, tokyo: 0.54, "city-night": 0.5, thunder: 0.55 },
    playlist: "band:synthwave",
  },
  {
    id: "p-christmas-eve",
    name: "Christmas Eve",
    builtIn: true,
    scene: "christmas",
    variation: "zermatt",
    fx: { snow: 0.65 },
    mix: { "church-bells": 0.6, wind: 0.4, snowstorm: 0.45, fireplace: 0.4 },
    playlist: "band:christmas",
  },
  {
    id: "p-snowed-in",
    name: "Snowed In",
    builtIn: true,
    scene: "mountain-cabin",
    variation: "alps-night",
    fx: { snow: 0.55 },
    mix: { fireplace: 0.75, wind: 0.62, snowstorm: 0.45, room: 0.3 },
    playlist: "band:acoustic",
  },
  {
    id: "p-halloween-night",
    name: "Hallowe'en Night",
    builtIn: true,
    scene: "halloween",
    variation: "pumpkins",
    fx: { fog: 0.4 },
    mix: { graveyard: 0.55, owl: 0.6, crows: 0.5, wind: 0.5, leaves: 0.45 },
    playlist: "band:halloween",
  },
];

const KEY = "vibey:v1";

const DEFAULT: State = {
  scene: "tokyo-cafe",
  variation: "night",
  fx: {},
  mix: { ...SCENES[0].sounds },
  muted: {},
  shape: {},
  levels: { master: 0.8, music: 0.62, ambient: 0.9 },
  allMuted: false,
  playlist: "scene",
  shuffle: true,
  repeat: "all",
  crossfade: 6,
  favorites: [],
  recent: [],
  favoritePlaces: [],
  presets: BUILT_IN_PRESETS,
  sceneCycle: { on: false, minutes: 15, scope: "all", order: "next", variations: true },
  musicCycle: { on: false, minutes: 30, bands: ["kissa", "jazzcafe", "lofi", "piano"] },
  presetCycle: { on: false, minutes: 30, ids: BUILT_IN_PRESETS.map((p) => p.id) },
  lastPreset: null,
  sleep: null,
  focus: null,
  settings: {
    quality: "auto",
    motion: "auto",
    clock24: false,
    clockShow: "time",
    tvClock: true,
    tvNowPlaying: true,
    soundFollowsScene: true,
    mixFollowsScene: true,
    openverse: true,
    hideAfter: 5,
  },
  panel: null,
  tv: false,
  started: false,
  visitedBefore: false,
  asleep: false,
  dim: 0,
  mixVersion: 2,
};

const SESSION_ONLY: (keyof State)[] = ["panel", "tv", "started", "sleep", "visitedBefore", "asleep", "dim"];

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const saved = JSON.parse(raw) as Partial<State>;
    const s: State = {
      ...DEFAULT,
      ...saved,
      levels: { ...DEFAULT.levels, ...saved.levels },
      settings: { ...DEFAULT.settings, ...saved.settings },
      sceneCycle: { ...DEFAULT.sceneCycle, ...saved.sceneCycle },
      musicCycle: { ...DEFAULT.musicCycle, ...saved.musicCycle },
      presetCycle: { ...DEFAULT.presetCycle, ...saved.presetCycle },
      panel: null,
      tv: false,
      started: false,
      sleep: null,
      visitedBefore: true,
      asleep: false,
      dim: 0,
    };
    // built-in presets always reflect this version; the user's own are kept
    s.presets = [...BUILT_IN_PRESETS, ...(saved.presets ?? []).filter((p) => !p.builtIn)];
    if (!SCENE_BY_ID.has(s.scene)) {
      s.scene = DEFAULT.scene;
      s.variation = DEFAULT.variation;
    }
    if ((saved.mixVersion ?? 1) < 2) {
      // the first mixes sat far too low: take this place's new mix and lift the user's own memories
      s.mix = sceneMix(s.scene, s.variation);
      s.muted = {};
      s.presets = s.presets.map((p) => (p.builtIn ? p : { ...p, mix: liftMix(p.mix) }));
      s.mixVersion = 2;
    }
    if (s.focus && s.focus.pausedLeft == null && s.focus.endsAt < Date.now()) s.focus = null;
    return s;
  } catch {
    return { ...DEFAULT };
  }
}

function liftMix(m: Record<string, number>) {
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(m)) out[id] = v > 0.001 ? Math.min(0.8, Math.round((0.35 + v * 0.75) * 100) / 100) : 0;
  return out;
}

let state: State = load();
const listeners = new Set<() => void>();
let saveTimer = 0;

function save() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      const out: Partial<State> = { ...state };
      for (const k of SESSION_ONLY) delete out[k];
      localStorage.setItem(KEY, JSON.stringify(out));
    } catch {
      /* private mode or storage full: the session still works */
    }
  }, 400);
}

export function getState() {
  return state;
}

export function setState(p: Partial<State> | ((s: State) => Partial<State>)) {
  const patch = typeof p === "function" ? p(state) : p;
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
  save();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

// ---- derived -----------------------------------------------------------------------------------

/** Places and variations whose media is actually published. */
export function sceneOf(s: State = state) {
  const scene = SCENE_BY_ID.get(s.scene) ?? SCENES[0];
  const variation = scene.variations.find((v) => v.id === s.variation) ?? scene.variations[0];
  return { scene, variation };
}

export function currentFx(s: State = state): Fx {
  const { scene, variation } = sceneOf(s);
  return resolveFx(scene, variation, s.fx[scene.id] ?? {});
}

export function sceneMix(sceneId: string, variationId: string) {
  const scene = SCENE_BY_ID.get(sceneId)!;
  const v = scene.variations.find((x) => x.id === variationId);
  return { ...scene.sounds, ...(v?.sounds ?? {}) };
}

// ---- actions -----------------------------------------------------------------------------------

export function tune(sceneId: string, variationId?: string) {
  const scene = SCENE_BY_ID.get(sceneId);
  if (!scene) return;
  const variation = variationId && scene.variations.some((v) => v.id === variationId) ? variationId : scene.variations[0].id;
  if (sceneId === state.scene && variation === state.variation) return;
  setState((s) => {
    const patch: Partial<State> = { scene: sceneId, variation };
    if (s.settings.mixFollowsScene && (sceneId !== s.scene || variation !== s.variation)) {
      patch.mix = sceneMix(sceneId, variation);
      patch.muted = {};
    }
    return patch;
  });
}

export function stepStation(dir: 1 | -1, list = SCENES) {
  const i = list.findIndex((s) => s.id === state.scene);
  const next = list[(i + dir + list.length) % list.length];
  tune(next.id);
}

export function stepVariation(dir: 1 | -1 = 1) {
  const { scene } = sceneOf();
  const i = scene.variations.findIndex((v) => v.id === state.variation);
  tune(scene.id, scene.variations[(i + dir + scene.variations.length) % scene.variations.length].id);
}

// on-screen effect -> which sounds follow it, and what to bring in if the place has none yet
const FOLLOW_ADD: Partial<Record<keyof Fx, string>> = {
  rain: "rain-light",
  rainGlass: "rain-window",
  snow: "snowstorm",
  wind: "wind",
  lightning: "thunder",
  fire: "fireplace",
};

export function setFx<K extends keyof Fx>(key: K, value: Fx[K]) {
  const { scene, variation } = sceneOf();
  const before = currentFx();
  setState((s) => ({ fx: { ...s.fx, [scene.id]: { ...(s.fx[scene.id] ?? {}), [key]: value } } }));
  if (!state.settings.soundFollowsScene || typeof value !== "number") return;
  const base = resolveFx(scene, variation)[key] as number;
  const prev = before[key] as number;
  const defaults = sceneMix(scene.id, variation.id);
  const mix = { ...state.mix };
  let touched = false;
  for (const [id, level] of Object.entries(mix)) {
    const def = SOUND_BY_ID.get(id);
    if (def?.follows !== key) continue;
    const ref = defaults[id] ?? level;
    const scaled = base > 0.02 ? (ref * value) / base : prev > 0.02 ? (level * value) / prev : level;
    mix[id] = Math.max(0, Math.min(1, value <= 0.001 ? 0 : scaled));
    touched = true;
  }
  if (!touched && value > 0.02) {
    const add = FOLLOW_ADD[key];
    if (add && !(add in mix)) {
      mix[add] = Math.min(0.8, 0.3 + value * 0.6);
      touched = true;
    }
  }
  if (touched) setState({ mix });
}

export function resetScene() {
  const { scene, variation } = sceneOf();
  setState((s) => {
    const fx = { ...s.fx };
    delete fx[scene.id];
    return { fx, mix: sceneMix(scene.id, variation.id), muted: {} };
  });
}

export function setLevel(id: string, v: number) {
  setState((s) => ({ mix: { ...s.mix, [id]: Math.max(0, Math.min(1, v)) }, muted: { ...s.muted, [id]: false } }));
}

export function toggleMute(id: string) {
  setState((s) => ({ muted: { ...s.muted, [id]: !s.muted[id] } }));
}

export function setShape(id: string, v: number) {
  setState((s) => ({ shape: { ...s.shape, [id]: Math.max(0, Math.min(1, v)) } }));
}

export function setLevels(p: Partial<State["levels"]>) {
  setState((s) => ({ levels: { ...s.levels, ...p } }));
}

export function setSettings(p: Partial<Settings>) {
  setState((s) => ({ settings: { ...s.settings, ...p } }));
}

export function openPanel(p: PanelId | null) {
  setState((s) => ({ panel: s.panel === p ? null : p }));
}

export function toggleFavoriteTrack(t: Track) {
  setState((s) => ({
    favorites: s.favorites.some((x) => x.id === t.id) ? s.favorites.filter((x) => x.id !== t.id) : [t, ...s.favorites].slice(0, 300),
  }));
}

export function pushRecent(t: Track) {
  setState((s) => ({ recent: [t, ...s.recent.filter((x) => x.id !== t.id)].slice(0, 60) }));
}

export function toggleFavoritePlace(id: string) {
  setState((s) => ({
    favoritePlaces: s.favoritePlaces.includes(id) ? s.favoritePlaces.filter((x) => x !== id) : [...s.favoritePlaces, id],
  }));
}

// ---- presets ("memory") ------------------------------------------------------------------------

export function storePreset(name: string) {
  const { scene, variation } = sceneOf();
  const p: Preset = {
    id: `u-${Date.now().toString(36)}`,
    name: name.trim().slice(0, 40) || `${scene.name}`,
    scene: scene.id,
    variation: variation.id,
    fx: { ...(state.fx[scene.id] ?? {}) },
    mix: Object.fromEntries(Object.entries(state.mix).filter(([id, v]) => v > 0.001 && !state.muted[id])),
    playlist: state.playlist,
  };
  setState((s) => ({ presets: [...s.presets, p] }));
  return p;
}

export function recallPreset(id: string) {
  const p = state.presets.find((x) => x.id === id);
  if (!p || !SCENE_BY_ID.has(p.scene)) return null;
  setState((s) => ({
    scene: p.scene,
    variation: p.variation,
    fx: { ...s.fx, [p.scene]: { ...p.fx } },
    mix: { ...p.mix },
    muted: {},
    playlist: p.playlist,
    lastPreset: p.id,
  }));
  return p;
}

export function renamePreset(id: string, name: string) {
  setState((s) => ({ presets: s.presets.map((p) => (p.id === id && !p.builtIn ? { ...p, name: name.slice(0, 40) } : p)) }));
}

export function deletePreset(id: string) {
  setState((s) => ({
    presets: s.presets.filter((p) => p.id !== id || p.builtIn),
    presetCycle: { ...s.presetCycle, ids: s.presetCycle.ids.filter((x) => x !== id) },
  }));
}

/** A random place, a fitting band and the place's own sounds. */
export function randomAtmosphere() {
  const pool = SCENES.filter((s) => s.id !== state.scene);
  const scene = pool[Math.floor(Math.random() * pool.length)];
  const variation = scene.variations[Math.floor(Math.random() * scene.variations.length)];
  const band = scene.bands[Math.floor(Math.random() * scene.bands.length)];
  setState((s) => ({
    scene: scene.id,
    variation: variation.id,
    mix: sceneMix(scene.id, variation.id),
    muted: {},
    playlist: s.playlist === "scene" ? "scene" : `band:${band}`,
  }));
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith("vibey:")) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
  state = { ...DEFAULT, started: state.started, visitedBefore: true };
  for (const fn of listeners) fn();
}
