// The music player. Two decks (audio elements routed through Web Audio) so one track can fade
// into the next; each track's loudness is matched from the catalog so nothing jumps out.
// Sources: the bundled catalog (Free Music Archive and Internet Archive, every licence checked),
// plus optional live finds from Openverse (Jamendo / ccMixter / Wikimedia, CC0 / BY / BY-SA only).

import { audio } from "./AudioEngine";
import type { Track } from "../../types";

export type Repeat = "off" | "all" | "one";

export interface MusicState {
  track: Track | null;
  playing: boolean;
  loading: boolean;
  playlist: string; // "band:lofi", "scene", "favorites", "recent"
  shuffle: boolean;
  repeat: Repeat;
  crossfade: number; // seconds, 0 = straight cut
  notice: string | null; // short message such as a skipped track
  upNext: Track[];
}

type Listener = (s: MusicState) => void;

class Deck {
  el: HTMLAudioElement;
  gain: GainNode | null = null;
  track: Track | null = null;
  private src: MediaElementAudioSourceNode | null = null;

  constructor() {
    this.el = new Audio();
    this.el.crossOrigin = "anonymous";
    this.el.preload = "auto";
  }

  /** Created lazily: Web Audio needs a user gesture first. */
  connect(ctx: AudioContext, out: AudioNode) {
    if (this.src) return;
    this.src = ctx.createMediaElementSource(this.el);
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.src.connect(this.gain).connect(out);
  }

  load(t: Track) {
    this.track = t;
    this.el.src = t.u;
    this.el.load();
  }

  clear() {
    this.track = null;
    this.el.pause();
    this.el.removeAttribute("src");
    this.el.load();
  }
}

const shuffleArr = <T>(a: T[]) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

export const dbToGain = (db: number) => Math.pow(10, db / 20);

export class Music {
  private decks = [new Deck(), new Deck()];
  private active = 0;
  private list: Track[] = []; // playlist in play order
  private index = -1;
  private history: Track[] = [];
  private failed = new Set<string>();
  private failStreak = 0;
  private listeners = new Set<Listener>();
  private timer = 0;
  private stallTimer = 0;
  private fading = false;
  private wantPlay = false;
  private noticeTimer = 0;

  state: MusicState = {
    track: null,
    playing: false,
    loading: false,
    playlist: "scene",
    shuffle: true,
    repeat: "all",
    crossfade: 5,
    notice: null,
    upNext: [],
  };

  /** Called whenever a track starts, so the app can keep "recently played". */
  onTrackStart: (t: Track) => void = () => {};

  constructor() {
    for (const [i, d] of this.decks.entries()) {
      d.el.addEventListener("error", () => this.onDeckError(i));
      d.el.addEventListener("waiting", () => i === this.active && this.armStall());
      d.el.addEventListener("playing", () => {
        if (i !== this.active) return;
        clearTimeout(this.stallTimer);
        this.failStreak = 0;
        this.set({ loading: false, playing: true });
      });
      d.el.addEventListener("ended", () => i === this.active && !this.fading && this.advance(false));
    }
    this.timer = window.setInterval(() => this.tick(), 250);
    this.mediaSession();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private set(p: Partial<MusicState>) {
    this.state = { ...this.state, ...p };
    for (const fn of this.listeners) fn(this.state);
  }

  private notice(msg: string) {
    clearTimeout(this.noticeTimer);
    this.set({ notice: msg });
    this.noticeTimer = window.setTimeout(() => this.set({ notice: null }), 6000);
  }

  get deck() {
    return this.decks[this.active];
  }

  /** Position and length of the current track, in seconds. */
  time() {
    const el = this.deck.el;
    const d = isFinite(el.duration) && el.duration > 0 ? el.duration : this.deck.track?.d ?? 0;
    return { position: el.currentTime || 0, duration: d };
  }

  private ensureGraph() {
    const ctx = audio.ctx;
    if (!ctx) return false;
    for (const d of this.decks) d.connect(ctx, audio.musicBus);
    return true;
  }

  /**
   * Replace the playlist. With `smooth`, the current track fades into the new list's first track;
   * otherwise the new list simply takes over after the current track.
   */
  setPlaylist(key: string, tracks: Track[], opts: { start?: boolean; smooth?: boolean; startWith?: Track } = {}) {
    const usable = tracks.filter((t) => !this.failed.has(t.id));
    let order = this.state.shuffle ? shuffleArr(usable) : usable.slice();
    if (opts.startWith) order = [opts.startWith, ...order.filter((t) => t.id !== opts.startWith!.id)];
    else if (this.state.shuffle) {
      // keep things fresh: tracks heard recently go to the back
      const recent = new Set(this.history.slice(-30).map((t) => t.id));
      order = [...order.filter((t) => !recent.has(t.id)), ...order.filter((t) => recent.has(t.id))];
    }
    this.list = order;
    this.index = -1;
    this.set({ playlist: key, upNext: this.list.slice(0, 5) });
    if (opts.start || (opts.smooth && this.state.playing)) this.advance(true);
  }

  /** Extend the current playlist (e.g. with live Openverse finds) without interrupting it. */
  append(tracks: Track[]) {
    const have = new Set(this.list.map((t) => t.id));
    const add = tracks.filter((t) => !have.has(t.id) && !this.failed.has(t.id));
    if (!add.length) return;
    const rest = this.list.slice(this.index + 1);
    const merged = this.state.shuffle ? shuffleArr([...rest, ...add]) : [...rest, ...add];
    this.list = [...this.list.slice(0, this.index + 1), ...merged];
    this.set({ upNext: this.list.slice(this.index + 1, this.index + 6) });
  }

  playTrack(t: Track) {
    const at = this.list.findIndex((x) => x.id === t.id);
    if (at >= 0) this.index = at - 1;
    else {
      this.list.splice(this.index + 1, 0, t);
    }
    this.advance(true);
  }

  async play() {
    this.wantPlay = true;
    if (!audio.ctx) await audio.unlock();
    if (!this.ensureGraph()) return;
    if (!this.deck.track) {
      if (!this.list.length) return;
      this.advance(true);
      return;
    }
    this.fadeDeck(this.active, 1, 0.6);
    this.deck.el.play().then(
      () => this.set({ playing: true }),
      () => this.set({ playing: false }),
    );
    this.updateSession();
  }

  pause() {
    this.wantPlay = false;
    const i = this.active;
    this.fadeDeck(i, 0, 0.35);
    window.setTimeout(() => {
      if (!this.wantPlay) this.decks[i].el.pause();
    }, 380);
    // a deck that was fading out goes quiet too
    const other = this.decks[1 - i];
    if (other.track) other.el.pause();
    this.fading = false;
    this.set({ playing: false });
    this.updateSession();
  }

  toggle() {
    if (this.state.playing) this.pause();
    else this.play();
  }

  next() {
    this.advance(true);
  }

  prev() {
    const { position } = this.time();
    if (position > 4 || this.history.length < 2) {
      this.seek(0);
      return;
    }
    this.history.pop(); // the current track
    const t = this.history.pop()!;
    this.list.splice(this.index + 1, 0, t);
    this.advance(true);
  }

  seek(sec: number) {
    const el = this.deck.el;
    if (!isFinite(el.duration)) return;
    el.currentTime = Math.max(0, Math.min(el.duration - 0.5, sec));
  }

  setShuffle(on: boolean) {
    if (on === this.state.shuffle) return;
    const rest = this.list.slice(this.index + 1);
    this.list = [...this.list.slice(0, this.index + 1), ...(on ? shuffleArr(rest) : rest)];
    this.set({ shuffle: on, upNext: this.list.slice(this.index + 1, this.index + 6) });
  }

  setRepeat(r: Repeat) {
    this.set({ repeat: r });
  }

  setCrossfade(s: number) {
    this.set({ crossfade: Math.max(0, Math.min(12, s)) });
  }

  /** Move to the next track. `user` = asked for, so it fades quickly instead of waiting for the end. */
  private advance(user: boolean) {
    if (!this.ensureGraph()) {
      // not unlocked yet: remember the intent; play() will pick it up
      this.wantPlay = true;
      return;
    }
    let t: Track | undefined;
    if (!user && this.state.repeat === "one" && this.deck.track) t = this.deck.track;
    else {
      this.index++;
      if (this.index >= this.list.length) {
        if (this.state.repeat === "off" && !user) {
          this.pause();
          return;
        }
        this.list = this.state.shuffle ? shuffleArr(this.list) : this.list;
        this.index = 0;
      }
      t = this.list[this.index];
    }
    if (!t) return;
    this.wantPlay = true;
    const fade = user ? Math.min(1.6, Math.max(0.4, this.state.crossfade * 0.4)) : this.state.crossfade;
    this.start(t, fade);
  }

  private start(t: Track, fade: number) {
    const from = this.active;
    const to = 1 - from;
    const next = this.decks[to];
    next.load(t);
    if (next.gain && audio.ctx) {
      // a fade may still be running on this deck: cancel it rather than setting .value over it
      const now = audio.ctx.currentTime;
      next.gain.gain.cancelScheduledValues(now);
      next.gain.gain.setValueAtTime(0, now);
    }
    this.active = to;
    this.fading = fade > 0 && !!this.decks[from].track;
    this.set({ track: t, loading: true, upNext: this.list.slice(this.index + 1, this.index + 6) });
    this.history.push(t);
    if (this.history.length > 200) this.history.splice(0, 50);
    this.armStall();
    next.el.play().then(
      () => {
        if (this.active !== to) return;
        this.fadeDeck(to, 1, Math.max(0.05, fade));
        this.fadeDeck(from, 0, Math.max(0.05, fade));
        window.setTimeout(() => {
          if (this.active === to) {
            this.decks[from].clear();
            this.fading = false;
          }
        }, fade * 1000 + 200);
        this.onTrackStart(t);
      },
      (e: DOMException) => {
        if (e?.name === "NotAllowedError") this.set({ playing: false, loading: false });
        // other failures surface through the element's error event
      },
    );
    this.updateSession();
  }

  private fadeDeck(i: number, to: number, secs: number) {
    const d = this.decks[i];
    const ctx = audio.ctx;
    if (!d.gain || !ctx) return;
    const target = to * dbToGain(d.track?.g ?? 0);
    const g = d.gain.gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    const from = g.value;
    // equal-power curve so the overlap does not dip in the middle
    const steps = 32;
    const curve = new Float32Array(steps);
    for (let k = 0; k < steps; k++) {
      const p = k / (steps - 1);
      curve[k] = to > 0 ? from + (target - from) * Math.sin((p * Math.PI) / 2) : target + (from - target) * Math.cos((p * Math.PI) / 2);
    }
    try {
      g.setValueCurveAtTime(curve, now, secs);
    } catch {
      g.setValueAtTime(target, now);
    }
  }

  private tick() {
    const el = this.deck.el;
    if (!this.state.playing || this.fading || el.paused || !isFinite(el.duration)) return;
    const left = el.duration - el.currentTime;
    const xf = this.state.crossfade;
    if (xf > 0 && left <= xf && el.duration > xf * 3) this.advance(false);
  }

  private armStall() {
    clearTimeout(this.stallTimer);
    this.stallTimer = window.setTimeout(() => {
      if (this.deck.el.readyState < 3 && this.wantPlay) this.skipBroken("took too long to load");
    }, 15000);
  }

  private onDeckError(i: number) {
    if (i !== this.active) return;
    this.skipBroken("could not be played");
  }

  private skipBroken(why: string) {
    const t = this.deck.track;
    if (t) this.failed.add(t.id);
    this.failStreak++;
    if (!navigator.onLine) {
      this.set({ loading: false, playing: false });
      this.notice("You're offline. Music will pick up again when you reconnect.");
      window.addEventListener("online", () => this.wantPlay && this.advance(true), { once: true });
      return;
    }
    if (this.failStreak >= 6) {
      this.set({ loading: false, playing: false });
      this.notice("The music sources aren't answering right now. Try again in a little while.");
      this.failStreak = 0;
      return;
    }
    if (t) this.notice(`"${t.t}" ${why}, skipped.`);
    this.fading = false;
    this.advance(true);
  }

  // ---- lock screen / media keys ------------------------------------------------------------
  artwork: string | null = null;

  private mediaSession() {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const on = (a: MediaSessionAction, fn: MediaSessionActionHandler) => {
      try {
        ms.setActionHandler(a, fn);
      } catch {
        /* unsupported action */
      }
    };
    on("play", () => this.play());
    on("pause", () => this.pause());
    on("nexttrack", () => this.next());
    on("previoustrack", () => this.prev());
    on("seekto", (d) => d.seekTime != null && this.seek(d.seekTime));
  }

  updateSession() {
    if (!("mediaSession" in navigator)) return;
    const t = this.state.track;
    const ms = navigator.mediaSession;
    ms.playbackState = this.state.playing || this.wantPlay ? "playing" : "paused";
    if (!t || typeof MediaMetadata === "undefined") return;
    ms.metadata = new MediaMetadata({
      title: t.t,
      artist: t.a,
      album: t.al ?? "Vibey",
      artwork: this.artwork ? [{ src: this.artwork, sizes: "640x360", type: "image/webp" }] : [],
    });
  }

  dispose() {
    clearInterval(this.timer);
    for (const d of this.decks) d.clear();
  }
}

export const music = new Music();
