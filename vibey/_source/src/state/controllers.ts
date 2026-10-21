// Wires the store to the audio engines, and runs the clocks: sleep and focus timers, place, music
// and preset cycling.

import { audio } from "../engine/audio/AudioEngine";
import { ambience } from "../engine/audio/Ambience";
import { music } from "../engine/audio/Music";
import { BAND_BY_ID, loadCatalog, openverse, tracksFor } from "../data/music";
import { CATEGORIES, SCENES } from "../data/scenes";
import type { Track } from "../types";
import { currentFx, getState, pushRecent, recallPreset, sceneOf, setState, subscribe, tune, type State } from "./store";

let catalog: Track[] = [];
let ovAbort: AbortController | null = null;
let applying = "";
let starting: Promise<void> | null = null;

export function playlistName(key: string, s: State = getState()) {
  if (key === "scene") return `${sceneOf(s).scene.name} mix`;
  if (key === "favorites") return "Favourites";
  if (key === "recent") return "Recently played";
  if (key.startsWith("band:")) return BAND_BY_ID.get(key.slice(5))?.name ?? key.slice(5);
  return key;
}

async function tracksForKey(key: string): Promise<Track[]> {
  const s = getState();
  if (key === "favorites") return s.favorites;
  if (key === "recent") return s.recent;
  if (!catalog.length) catalog = await loadCatalog();
  if (key.startsWith("band:")) return tracksFor(catalog, [key.slice(5)]);
  return tracksFor(catalog, sceneOf(s).scene.bands);
}

/** Load the store's playlist into the player. */
export async function applyPlaylist(opts: { start?: boolean; smooth?: boolean; startWith?: Track } = {}) {
  const s = getState();
  const key = s.playlist;
  const tag = key === "scene" ? `scene:${s.scene}` : key;
  applying = tag;
  let tracks: Track[];
  try {
    tracks = await tracksForKey(key);
  } catch {
    music.state.notice = null;
    setState({});
    return;
  }
  if (applying !== tag) return;
  if (!tracks.length && !opts.startWith) return;
  music.setPlaylist(key, tracks, opts);
  // live finds from Openverse extend a band once its catalog list is loaded
  const bandId = key.startsWith("band:") ? key.slice(5) : key === "scene" ? sceneOf(s).scene.bands[0] : null;
  const band = bandId ? BAND_BY_ID.get(bandId) : undefined;
  if (band && s.settings.openverse && key !== "favorites" && key !== "recent") {
    ovAbort?.abort();
    ovAbort = new AbortController();
    openverse(band, ovAbort.signal)
      .then((t) => applying === tag && music.append(t))
      .catch(() => {
        /* offline or rate limited: the catalog alone is plenty */
      });
  }
}

export function choosePlaylist(key: string, startWith?: Track) {
  setState({ playlist: key });
  void applyPlaylist({ smooth: true, start: getState().started, startWith });
}

/** The first gesture: unlock audio, bring in the room sound, then the music. */
export function start(): Promise<void> {
  if (getState().started) return Promise.resolve();
  if (starting) return starting;
  starting = (async () => {
    await audio.unlock();
    setState({ started: true });
    syncAudio(getState());
    await applyPlaylist({ start: false });
    music.play();
  })().finally(() => { starting = null; });
  return starting;
}

function syncAudio(s: State) {
  audio.setLevels({ master: s.allMuted ? 0 : s.levels.master, music: s.levels.music, ambient: s.levels.ambient });
  if (!s.started || s.asleep) return;
  ambience.set(s.mix, s.muted);
  ambience.setShape(s.shape);
  ambience.setThunderFromLightning(currentFx(s).lightning > 0.001);
}

export function wake() {
  const s = getState();
  if (!s.asleep && s.dim === 0) return;
  setState({ asleep: false, dim: 0 });
  audio.setFade(1, 2.5);
  syncAudio(getState());
}

// ---- timers ------------------------------------------------------------------------------------

export const clocks = { scene: 0, music: 0, preset: 0 };

function nextPlace(s: State) {
  const { scene } = sceneOf(s);
  const c = s.sceneCycle;
  if (c.variations) {
    const i = scene.variations.findIndex((v) => v.id === s.variation);
    if (i < scene.variations.length - 1) return { scene: scene.id, variation: scene.variations[i + 1].id };
  }
  let pool = SCENES;
  if (c.scope === "favorites" && s.favoritePlaces.length) pool = SCENES.filter((x) => s.favoritePlaces.includes(x.id));
  else if (CATEGORIES.some((k) => k.id === c.scope)) pool = SCENES.filter((x) => x.categories.includes(c.scope as never));
  if (!pool.length) pool = SCENES;
  let next;
  if (c.order === "random") {
    const others = pool.filter((x) => x.id !== scene.id);
    next = (others.length ? others : pool)[Math.floor(Math.random() * (others.length || pool.length))];
  } else {
    const i = pool.findIndex((x) => x.id === scene.id);
    next = pool[(i + 1) % pool.length];
  }
  return { scene: next.id, variation: next.variations[0].id };
}

function tick() {
  const now = Date.now();
  const s = getState();

  if (s.sleep) {
    const left = s.sleep.endsAt - now;
    const fadeMs = Math.max(1, s.sleep.fade * 60000);
    if (left <= 0) {
      music.pause();
      ambience.stopAll();
      audio.setFade(0, 1.5);
      setState({ sleep: null, asleep: true, dim: s.sleep.dim ? 1 : 0, panel: null });
    } else if (left < fadeMs) {
      const f = left / fadeMs;
      audio.setFade(f * f, 1.1);
      if (s.sleep.dim) setState({ dim: Math.round((1 - f) * 100) / 100 });
    }
  }

  const f = s.focus;
  if (f && f.pausedLeft == null && now >= f.endsAt) {
    let next: typeof f;
    if (f.phase === "focus") {
      const long = (f.round + 1) % f.rounds === 0;
      next = { ...f, phase: long ? "long" : "break", endsAt: now + (long ? f.long : f.short) * 60000 };
    } else {
      next = { ...f, phase: "focus", round: f.round + 1, endsAt: now + f.focus * 60000 };
    }
    if (f.chime) audio.chime(next.phase === "focus" ? 2 : 1);
    setState({ focus: next });
  }

  if (s.asleep) return;

  const sc = s.sceneCycle;
  if (sc.on && now - clocks.scene >= sc.minutes * 60000) {
    clocks.scene = now;
    const n = nextPlace(s);
    tune(n.scene, n.variation);
  }
  const mc = s.musicCycle;
  if (mc.on && mc.bands.length && now - clocks.music >= mc.minutes * 60000) {
    clocks.music = now;
    const cur = s.playlist.startsWith("band:") ? s.playlist.slice(5) : "";
    const i = mc.bands.indexOf(cur);
    choosePlaylist(`band:${mc.bands[(i + 1) % mc.bands.length]}`);
  }
  const pc = s.presetCycle;
  if (pc.on && pc.ids.length && now - clocks.preset >= pc.minutes * 60000) {
    clocks.preset = now;
    const i = s.lastPreset ? pc.ids.indexOf(s.lastPreset) : -1;
    recallPreset(pc.ids[(i + 1) % pc.ids.length]);
  }
}

export function initControllers() {
  const s0 = getState();
  music.setShuffle(s0.shuffle);
  music.setRepeat(s0.repeat);
  music.setCrossfade(s0.crossfade);
  music.onTrackStart = (t) => pushRecent(t);
  const now = Date.now();
  clocks.scene = clocks.music = clocks.preset = now;

  let prev = s0;
  subscribe(() => {
    const s = getState();
    if (s === prev) return;
    const p = prev;
    prev = s;
    if (s.levels !== p.levels || s.allMuted !== p.allMuted) audio.setLevels({ master: s.allMuted ? 0 : s.levels.master, music: s.levels.music, ambient: s.levels.ambient });
    if (s.started && !s.asleep && (s.mix !== p.mix || s.muted !== p.muted || s.started !== p.started || s.asleep !== p.asleep)) ambience.set(s.mix, s.muted);
    if (s.shape !== p.shape) ambience.setShape(s.shape);
    if (s.fx !== p.fx || s.scene !== p.scene || s.variation !== p.variation) ambience.setThunderFromLightning(currentFx(s).lightning > 0.001);
    if (s.shuffle !== p.shuffle) music.setShuffle(s.shuffle);
    if (s.repeat !== p.repeat) music.setRepeat(s.repeat);
    if (s.crossfade !== p.crossfade) music.setCrossfade(s.crossfade);
    // the place's own mix follows the place
    if (s.playlist === "scene" && s.scene !== p.scene && SCENES.find((x) => x.id === s.scene)?.bands.join() !== SCENES.find((x) => x.id === p.scene)?.bands.join()) {
      void applyPlaylist({ smooth: true });
    }
    // a preset or random atmosphere switched the playlist
    if (s.playlist !== p.playlist && s.playlist !== music.state.playlist) void applyPlaylist({ smooth: true, start: s.started });
    // manual changes restart the cycle clocks
    if (s.sceneCycle !== p.sceneCycle) clocks.scene = Date.now();
    if (s.musicCycle !== p.musicCycle) clocks.music = Date.now();
    if (s.presetCycle !== p.presetCycle) clocks.preset = Date.now();
  });

  window.setInterval(tick, 1000);
  void applyPlaylist();
}
