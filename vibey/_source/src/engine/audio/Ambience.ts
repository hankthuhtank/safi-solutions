// Ambient layers. Long field recordings loop by cross-fading two streaming <audio> elements (cheap on
// memory, no audible seam); short sounds such as thunder, owls or page turns are decoded once and
// fired at random, irregular intervals with small changes in pitch, level and position so they never
// fall into a pattern.

import { audio, AudioEngine } from "./AudioEngine";
import { SOUND_BY_ID, type SoundDef } from "../../data/sounds";

const BASE = "/vibey/media/sounds/";
const XFADE = 4;

class MediaLoop {
  private els: HTMLAudioElement[] = [];
  private gains: GainNode[] = [];
  private active = 0;
  private timer = 0;
  private stopped = false;
  private failures = 0;

  constructor(
    private readonly ctx: AudioContext,
    private readonly url: string,
    out: AudioNode,
  ) {
    for (let i = 0; i < 2; i++) {
      const el = new Audio();
      el.preload = "auto";
      el.loop = false;
      el.src = url;
      el.addEventListener("error", () => this.onError());
      const src = ctx.createMediaElementSource(el);
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g).connect(out);
      this.els.push(el);
      this.gains.push(g);
    }
  }

  private onError() {
    // a dropped connection: try again a little later instead of falling silent for good
    if (this.stopped || ++this.failures > 4) return;
    setTimeout(() => {
      if (this.stopped) return;
      for (const el of this.els) {
        el.src = this.url;
        el.load();
      }
      this.start(true);
    }, 4000 * this.failures);
  }

  start(randomOffset = true) {
    this.stopped = false;
    const el = this.els[this.active];
    const begin = () => {
      if (randomOffset && el.duration > 20) el.currentTime = Math.random() * el.duration * 0.6;
      el.play().catch(() => {});
      this.ramp(this.active, 1, 2.5);
    };
    if (el.readyState >= 1) begin();
    else el.addEventListener("loadedmetadata", begin, { once: true });
    clearInterval(this.timer);
    this.timer = window.setInterval(() => this.tick(), 250);
  }

  private ramp(i: number, to: number, secs: number) {
    const g = this.gains[i].gain;
    const t = this.ctx.currentTime;
    const from = g.value;
    g.cancelScheduledValues(t);
    // equal-power-ish curve: sine in, cosine out (it starts from the current value itself)
    const steps = 24;
    const curve = new Float32Array(steps);
    for (let k = 0; k < steps; k++) {
      const p = k / (steps - 1);
      curve[k] = to > from ? from + (to - from) * Math.sin((p * Math.PI) / 2) : to + (from - to) * Math.cos((p * Math.PI) / 2);
    }
    g.setValueCurveAtTime(curve, t, Math.max(0.05, secs));
  }

  private tick() {
    if (this.stopped) return;
    const el = this.els[this.active];
    if (!el.duration || !isFinite(el.duration)) return;
    if (el.currentTime >= el.duration - XFADE - 0.3 || el.ended) {
      const next = 1 - this.active;
      const n = this.els[next];
      n.currentTime = n.duration > 40 ? Math.random() * Math.min(12, n.duration * 0.2) : 0;
      n.play().catch(() => {});
      this.ramp(next, 1, XFADE);
      this.ramp(this.active, 0, XFADE);
      const old = this.active;
      setTimeout(() => {
        if (this.active !== old) this.els[old].pause();
      }, XFADE * 1000 + 300);
      this.active = next;
    }
  }

  stop(secs = 1.5) {
    this.stopped = true;
    clearInterval(this.timer);
    for (let i = 0; i < 2; i++) this.ramp(i, 0, secs);
    setTimeout(() => this.els.forEach((e) => e.pause()), secs * 1000 + 100);
  }

  dispose() {
    this.stop(0.05);
    setTimeout(() => {
      for (const el of this.els) {
        el.removeAttribute("src");
        el.load();
      }
      this.gains.forEach((g) => g.disconnect());
    }, 300);
  }
}

const bufferCache = new Map<string, Promise<AudioBuffer>>();
function loadBuffer(ctx: AudioContext, url: string) {
  let p = bufferCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${url}`);
        return r.arrayBuffer();
      })
      .then((b) => ctx.decodeAudioData(b));
    p.catch(() => bufferCache.delete(url));
    bufferCache.set(url, p);
  }
  return p;
}

class EventLayer {
  private timer = 0;
  private running = false;
  private buffers: AudioBuffer[] = [];
  rate = 1; // multiplies how often events happen

  constructor(
    private readonly ctx: AudioContext,
    private readonly def: SoundDef,
    private readonly out: AudioNode,
  ) {
    Promise.all(def.files.map((f) => loadBuffer(ctx, BASE + f).catch(() => null))).then((bs) => {
      this.buffers = bs.filter((b): b is AudioBuffer => !!b);
    });
  }

  start(scheduler = true) {
    this.running = true;
    if (scheduler) this.schedule(true);
  }

  private schedule(first = false) {
    clearTimeout(this.timer);
    if (!this.running) return;
    const e = this.def.events!;
    const mean = e.mean / Math.max(0.15, this.rate);
    // exponential gaps feel natural; a floor stops two landing on top of each other
    let wait = e.min + -Math.log(1 - Math.random()) * mean;
    if (first) wait = Math.min(wait, e.min + Math.random() * mean * 0.5);
    this.timer = window.setTimeout(() => {
      this.fire();
      this.schedule();
    }, wait * 1000);
  }

  fire(level = 1, delay = 0) {
    if (!this.buffers.length) return;
    const e = this.def.events!;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.buffers[Math.floor(Math.random() * this.buffers.length)];
    src.playbackRate.value = 1 + (Math.random() * 2 - 1) * (e.rate ?? 0.04);
    const g = ctx.createGain();
    const jitter = (Math.random() * 2 - 1) * (e.jitterDb ?? 3);
    g.gain.value = Math.pow(10, jitter / 20) * level;
    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * (e.pan ?? 0.6);
    src.connect(g).connect(pan).connect(this.out);
    src.start(ctx.currentTime + delay);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
      pan.disconnect();
    };
  }

  stop() {
    this.running = false;
    clearTimeout(this.timer);
  }

  dispose() {
    this.stop();
  }
}

/** Procedural layers: a slow space drone, smooth brown noise and a record's surface noise. */
class SynthLayer {
  private nodes: AudioNode[] = [];
  private oscs: OscillatorNode[] = [];
  private timer = 0;
  private sources: AudioBufferSourceNode[] = [];

  constructor(
    private readonly ctx: AudioContext,
    private readonly kind: "space" | "brown" | "vinyl",
    private readonly out: AudioNode,
  ) {}

  start() {
    if (this.kind === "brown") return this.startBrown();
    if (this.kind === "vinyl") return this.startVinyl();
    this.startSpace();
  }

  /** Surface noise of an old record: soft hiss, a low rumble, and crackle that never repeats exactly. */
  private startVinyl() {
    const ctx = this.ctx;
    const secs = 23; // a prime-ish length so the loop point never lines up with anything
    const len = Math.floor(ctx.sampleRate * secs);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    const sr = ctx.sampleRate;
    const l = buf.getChannelData(0);
    const r = buf.getChannelData(1);
    let rumble = 0;
    let hissL = 0;
    let hissR = 0;
    for (let i = 0; i < len; i++) {
      // rumble: very low, slow
      rumble = rumble * 0.9995 + (Math.random() * 2 - 1) * 0.0005;
      // hiss: high-passed white noise
      const wl = Math.random() * 2 - 1;
      const wr = Math.random() * 2 - 1;
      const hl = wl - hissL;
      const hr = wr - hissR;
      hissL = wl * 0.6 + hissL * 0.4;
      hissR = wr * 0.6 + hissR * 0.4;
      l[i] = rumble * 2.2 + hl * 0.012;
      r[i] = rumble * 2.2 + hr * 0.012;
    }
    // crackle: sparse clicks of random size, occasional louder pops, mostly centred
    const clicks = Math.floor(secs * 26);
    for (let k = 0; k < clicks; k++) {
      const at = Math.floor(Math.random() * (len - 200));
      const pop = Math.random() < 0.05;
      const amp = (pop ? 0.35 + Math.random() * 0.35 : Math.pow(Math.random(), 3) * 0.22) * (Math.random() < 0.5 ? 1 : -1);
      const width = pop ? 18 + Math.random() * 30 : 2 + Math.random() * 6;
      const pan = (Math.random() * 2 - 1) * 0.35;
      for (let j = 0; j < width * 3; j++) {
        const e = Math.exp(-j / width) * (j % 2 ? -0.6 : 1);
        l[at + j] += amp * e * (1 - pan);
        r[at + j] += amp * e * (1 + pan);
      }
    }
    // the record's rotation: a faint swell every 1.8 s (33⅓ rpm)
    for (let i = 0; i < len; i++) {
      const w = 0.92 + 0.08 * Math.sin((2 * Math.PI * i) / (sr * 1.8));
      l[i] *= w;
      r[i] *= w;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 9000;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 30;
    src.connect(hp).connect(lp).connect(this.out);
    src.start(0, Math.random() * secs);
    this.sources.push(src);
    this.nodes.push(lp, hp);
  }

  private noiseBuffer(seconds: number, brown: boolean) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.5;
        } else d[i] = w;
      }
      // make the buffer circular so looping it has no seam
      const fade = Math.floor(ctx.sampleRate * 0.5);
      for (let i = 0; i < fade; i++) {
        const a = i / fade;
        d[i] = d[i] * a + d[len - fade + i] * (1 - a);
      }
    }
    return buf;
  }

  private startBrown() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(6, true);
    src.loop = true;
    src.loopEnd = src.buffer.duration - 0.5;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    src.connect(lp).connect(this.out);
    src.start();
    this.sources.push(src);
    this.nodes.push(lp);
  }

  private startSpace() {
    const ctx = this.ctx;
    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(6);
    const wet = ctx.createGain();
    wet.gain.value = 0.8;
    const dry = ctx.createGain();
    dry.gain.value = 0.35;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.Q.value = 0.4;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.03;
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    lp.connect(dry).connect(this.out);
    lp.connect(verb).connect(wet).connect(this.out);
    // a faint wash of filtered noise, like distance
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuffer(6, false);
    n.loop = true;
    n.loopEnd = n.buffer.duration - 0.5;
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.value = 420;
    nf.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.02;
    n.connect(nf).connect(ng).connect(lp);
    n.start();
    this.sources.push(n);
    this.oscs.push(lfo);
    this.nodes.push(verb, wet, dry, lp, lfoGain, nf, ng);
    const scale = [73.42, 110, 146.83, 164.81, 185, 220, 246.94, 293.66, 329.63];
    const chord = () => {
      const t = ctx.currentTime;
      const picks = [scale[Math.floor(Math.random() * 3)], scale[3 + Math.floor(Math.random() * 3)], scale[5 + Math.floor(Math.random() * 4)]];
      for (const f of picks) {
        for (const [type, detune, level] of [
          ["sine", -4, 0.06],
          ["triangle", 5, 0.025],
        ] as const) {
          const o = ctx.createOscillator();
          o.type = type;
          o.frequency.value = f;
          o.detune.value = detune;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(level, t + 9);
          g.gain.setValueAtTime(level, t + 22);
          g.gain.linearRampToValueAtTime(0, t + 34);
          o.connect(g).connect(lp);
          o.start(t);
          o.stop(t + 35);
          o.onended = () => {
            o.disconnect();
            g.disconnect();
          };
        }
      }
    };
    chord();
    this.timer = window.setInterval(chord, 20000);
  }

  private impulse(seconds: number) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  stop() {
    clearInterval(this.timer);
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    for (const o of this.oscs) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
    setTimeout(() => this.nodes.forEach((n) => n.disconnect()), 200);
  }

  dispose() {
    this.stop();
  }
}

interface Layer {
  def: SoundDef;
  gain: GainNode;
  tone: BiquadFilterNode; // distance: a far sound loses its top end
  loop?: MediaLoop;
  events?: EventLayer;
  synth?: SynthLayer;
  level: number;
  idleSince: number;
}

export class Ambience {
  private layers = new Map<string, Layer>();
  private links: Record<string, number> = {};
  private shape: Record<string, number> = {};
  private thunderFromLightning = false;
  private sweep = 0;

  constructor() {
    // free layers that have been silent for a while so long sessions do not hold memory
    this.sweep = window.setInterval(() => this.collect(), 20000);
  }

  private ctx() {
    return audio.ctx;
  }

  /** Apply the mixer: level 0..1 per sound id. */
  set(levels: Record<string, number>, muted: Record<string, boolean>) {
    const ctx = this.ctx();
    if (!ctx) return;
    const now = performance.now();
    for (const [id, raw] of Object.entries(levels)) {
      const def = SOUND_BY_ID.get(id);
      if (!def) continue;
      const level = muted[id] ? 0 : raw;
      let layer = this.layers.get(id);
      if (!layer && level > 0.001) layer = this.create(ctx, def);
      if (!layer) continue;
      layer.level = level;
      if (level <= 0.001) layer.idleSince = layer.idleSince || now;
      else layer.idleSince = 0;
      this.applyGain(layer);
      if (layer.events) {
        layer.events.rate = this.eventRate(id, level);
        const driven = id === "thunder" && this.thunderFromLightning;
        if (level > 0.001 && !driven) layer.events.start();
        else layer.events.stop();
      }
    }
    // anything not mentioned is off
    for (const [id, layer] of this.layers) {
      if (!(id in levels) && layer.level > 0) {
        layer.level = 0;
        layer.idleSince = now;
        this.applyGain(layer);
        layer.events?.stop();
      }
    }
  }

  private eventRate(id: string, level: number) {
    // the second control on an event sound is "how often": 0.5 = as designed
    const often = Math.pow(4, ((this.shape[id] ?? 0.5) - 0.5) * 2);
    return (0.4 + level * 1.2) * (this.links[id] ?? 1) * often;
  }

  /** Per-sound distance (loops: 1 near, 0 far) or frequency (events). */
  setShape(shape: Record<string, number>) {
    this.shape = shape;
    const ctx = this.ctx();
    for (const [id, layer] of this.layers) {
      if (layer.events) layer.events.rate = this.eventRate(id, layer.level);
      else if (ctx) {
        const near = this.shape[id] ?? 1;
        const hz = near >= 0.99 ? 20000 : 380 * Math.pow(20000 / 380, Math.pow(near, 1.6));
        layer.tone.frequency.setTargetAtTime(hz, ctx.currentTime, 0.15);
      }
    }
  }

  /** Scene intensity coupling (e.g. heavier rain on screen, louder rain), 1 = as designed. */
  setLinks(links: Record<string, number>) {
    this.links = links;
    for (const layer of this.layers.values()) this.applyGain(layer);
  }

  /** When the scene shows lightning, thunder follows the flashes instead of its own clock. */
  setThunderFromLightning(on: boolean) {
    this.thunderFromLightning = on;
    const t = this.layers.get("thunder");
    if (!t?.events) return;
    if (on) t.events.stop();
    else if (t.level > 0.001) t.events.start();
  }

  /** A flash on screen: thunder arrives after the light, later and softer when it is far away. */
  lightning(strength: number, distance: number) {
    const t = this.layers.get("thunder");
    if (!t?.events || t.level <= 0.001) return;
    const delay = 0.6 + distance * 6.5 + Math.random() * 0.8;
    t.events.fire(strength * (1.15 - distance * 0.6), delay);
  }

  private create(ctx: AudioContext, def: SoundDef): Layer {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.Q.value = 0.5;
    const near = def.kind === "events" ? 1 : (this.shape[def.id] ?? 1);
    tone.frequency.value = near >= 0.99 ? 20000 : 380 * Math.pow(20000 / 380, Math.pow(near, 1.6));
    gain.connect(tone).connect(audio.ambientBus);
    const layer: Layer = { def, gain, tone, level: 0, idleSince: 0 };
    if (def.kind === "loop") {
      layer.loop = new MediaLoop(ctx, BASE + def.files[0], gain);
      layer.loop.start(true);
    } else if (def.kind === "events") {
      layer.events = new EventLayer(ctx, def, gain);
    } else {
      layer.synth = new SynthLayer(ctx, def.synth ?? "brown", gain);
      layer.synth.start();
    }
    this.layers.set(def.id, layer);
    return layer;
  }

  private applyGain(layer: Layer) {
    const ctx = this.ctx();
    if (!ctx) return;
    const link = this.links[layer.def.id] ?? 1;
    const target = AudioEngine.curve(layer.level) * layer.def.gain * Math.sqrt(Math.max(0, link));
    const g = layer.gain.gain;
    const t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(target, t + 0.6);
  }

  private collect() {
    const now = performance.now();
    for (const [id, layer] of this.layers) {
      if (layer.idleSince && now - layer.idleSince > 45000) {
        layer.loop?.dispose();
        layer.events?.dispose();
        layer.synth?.dispose();
        setTimeout(() => {
          layer.gain.disconnect();
          layer.tone.disconnect();
        }, 400);
        this.layers.delete(id);
      }
    }
  }

  stopAll() {
    for (const layer of this.layers.values()) {
      layer.loop?.dispose();
      layer.events?.dispose();
      layer.synth?.dispose();
      layer.gain.disconnect();
      layer.tone.disconnect();
    }
    this.layers.clear();
  }

  dispose() {
    clearInterval(this.sweep);
    this.stopAll();
  }
}

export const ambience = new Ambience();
