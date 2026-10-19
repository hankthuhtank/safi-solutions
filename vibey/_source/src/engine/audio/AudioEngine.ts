// One AudioContext for the whole app: music and ambience each have a bus, both feed a gentle
// limiter so stacked layers never clip, and an analyser drives the level meter.

export type AudioState = "locked" | "running" | "suspended";

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicBus!: GainNode;
  ambientBus!: GainNode;
  private limiter!: DynamicsCompressorNode;
  private analyser!: AnalyserNode;
  private meterData = new Float32Array(1024);
  private listeners = new Set<(s: AudioState) => void>();
  private levels = { master: 0.8, music: 0.7, ambient: 0.8 };
  private fade = 1;

  get state(): AudioState {
    if (!this.ctx) return "locked";
    return this.ctx.state === "running" ? "running" : "suspended";
  }

  onState(fn: (s: AudioState) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this.state);
  }

  /** Must run inside a user gesture the first time (browser autoplay rules). */
  async unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx({ latencyHint: "playback" });
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.musicBus = ctx.createGain();
      this.ambientBus = ctx.createGain();
      this.limiter = ctx.createDynamicsCompressor();
      this.limiter.threshold.value = -8;
      this.limiter.knee.value = 8;
      this.limiter.ratio.value = 6;
      this.limiter.attack.value = 0.004;
      this.limiter.release.value = 0.3;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.meterData = new Float32Array(this.analyser.fftSize);
      this.musicBus.connect(this.master);
      this.ambientBus.connect(this.master);
      this.master.connect(this.limiter);
      this.limiter.connect(this.analyser);
      this.analyser.connect(ctx.destination);
      this.applyLevels(0);
      ctx.addEventListener("statechange", () => this.emit());
    }
    if (this.ctx.state !== "running") await this.ctx.resume().catch(() => {});
    this.emit();
  }

  async suspend() {
    await this.ctx?.suspend().catch(() => {});
    this.emit();
  }

  /** Perceptual volume curve: slider 0..1 to gain. */
  static curve(v: number) {
    v = Math.max(0, Math.min(1, v));
    return v * v * (0.25 + 0.75 * v) * 1.15;
  }

  setLevels(l: Partial<{ master: number; music: number; ambient: number }>, ramp = 0.25) {
    Object.assign(this.levels, l);
    this.applyLevels(ramp);
  }

  /** Sleep timer and transitions: scales everything without touching the user's levels. */
  setFade(f: number, ramp: number) {
    this.fade = Math.max(0, Math.min(1, f));
    this.applyLevels(ramp);
  }

  private applyLevels(ramp: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const set = (p: AudioParam, v: number) => {
      p.cancelScheduledValues(t);
      p.setValueAtTime(p.value, t);
      if (ramp <= 0) p.setValueAtTime(v, t);
      else p.linearRampToValueAtTime(v, t + ramp);
    };
    set(this.master.gain, AudioEngine.curve(this.levels.master) * this.fade);
    set(this.musicBus.gain, AudioEngine.curve(this.levels.music));
    set(this.ambientBus.gain, AudioEngine.curve(this.levels.ambient));
  }

  /** RMS level of the final mix, 0..1, for the VU needle. */
  meter() {
    if (!this.ctx || this.ctx.state !== "running") return 0;
    this.analyser.getFloatTimeDomainData(this.meterData);
    let s = 0;
    for (let i = 0; i < this.meterData.length; i++) s += this.meterData[i] * this.meterData[i];
    return Math.sqrt(s / this.meterData.length);
  }

  get now() {
    return this.ctx?.currentTime ?? 0;
  }

  // ---- the receiver's own sounds ---------------------------------------------------------------

  private hiss: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

  /** Inter-station hiss while the dial is between places, 0..1. */
  setStatic(level: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    if (!this.hiss) {
      if (level <= 0.001) return;
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 900;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 6500;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(hp).connect(lp).connect(gain).connect(this.master);
      src.start();
      this.hiss = { src, gain };
    }
    this.hiss.gain.gain.setTargetAtTime(Math.min(1, level) * 0.05, ctx.currentTime, 0.04);
  }

  /** The soft detent of the dial landing on a station. */
  click() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.035);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.08);
    o.onended = () => g.disconnect();
  }

  /** A small bell for the focus timer: a few inharmonic partials, long decay. */
  chime(times = 1) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    for (let n = 0; n < times; n++) {
      const t = ctx.currentTime + n * 0.9;
      for (const [ratio, amp, decay] of [
        [1, 0.09, 3.2],
        [2.76, 0.035, 1.6],
        [5.4, 0.018, 0.9],
        [8.93, 0.008, 0.5],
      ]) {
        const o = ctx.createOscillator();
        o.frequency.value = 660 * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(amp, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        o.connect(g).connect(this.limiterInput);
        o.start(t);
        o.stop(t + decay + 0.05);
        o.onended = () => g.disconnect();
      }
    }
  }

  /** Sits after the master fader so chimes still sound while a sleep fade is running. */
  private get limiterInput() {
    return this.limiter;
  }
}

export const audio = new AudioEngine();
