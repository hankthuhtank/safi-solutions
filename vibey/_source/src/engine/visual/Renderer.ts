// The scene engine: one WebGL2 canvas that composites the current place (and the next one during a
// change) from a photo or video plus depth and semantic maps, real-time weather and light, particles
// and wet glass.

import type { Fx, Quality, Rect, Variation } from "../../types";
import { FINAL_FS, GLASS_FS, compositeFS, flagKey, type SceneFlags } from "./shaders";
import { Particles, type ParticleUniforms } from "./particles";
import { RainGlass } from "./rainGlass";
import { FULLSCREEN_VS, Program, Target, dynamicTexture, solidTexture, uploadTexture, type GL, type Texture } from "./gl";
import {
  decodeImage,
  disposeVideo,
  imageUrl,
  makeVideo,
  release,
  sizeOf,
  waitForVideo,
  type VariationMedia,
} from "./media";

export interface ShowRequest {
  key: string;
  variation: Variation;
  media: VariationMedia;
  fx: Fx;
}

export interface RendererStats {
  fps: number;
  width: number;
  height: number;
  scale: number;
  quality: Quality;
}

export interface RendererEvents {
  onLightning?: (strength: number, distance: number) => void;
  onStats?: (s: RendererStats) => void;
  onError?: (e: unknown) => void;
  onShown?: (key: string) => void;
}

// minScale/floorFps: how far the renderer may lower its own resolution, and the frame rate it
// defends. Ultra is a deliberate choice, so it keeps (nearly) full resolution and accepts a lower
// frame rate before it gives any back.
const TIERS: Record<Quality, { maxWidth: number; density: number; fps: number; sharpen: number; glassDiv: number; maxScale: number; minScale: number; floorFps: number }> = {
  performance: { maxWidth: 1920, density: 0.38, fps: 30, sharpen: 0, glassDiv: 3, maxScale: 0.8, minScale: 0.5, floorFps: 24 },
  balanced: { maxWidth: 2560, density: 0.7, fps: 60, sharpen: 0.18, glassDiv: 2, maxScale: 1, minScale: 0.6, floorFps: 40 },
  ultra: { maxWidth: 3840, density: 1, fps: 60, sharpen: 0.28, glassDiv: 2, maxScale: 1, minScale: 0.85, floorFps: 24 },
};

// ?fps=N caps the frame rate: a debugging aid for slow software renderers (and headless tests)
const FPS_CAP = Number(new URLSearchParams(location.search).get("fps")) || Infinity;

const FIRE_VIDEO = [
  { src: "/vibey/media/fx/fire-av1.mp4", type: 'video/mp4; codecs="av01.0.05M.08"' },
  { src: "/vibey/media/fx/fire-h264.mp4", type: 'video/mp4; codecs="avc1.640028"' },
];

class Instance {
  base: Texture | null = null;
  baseDynamic: WebGLTexture | null = null;
  video: HTMLVideoElement | null = null;
  fireVideo: HTMLVideoElement | null = null;
  fireTex: WebGLTexture | null = null;
  maps: (Texture | null)[] = [null, null, null, null];
  reflect: Texture | null = null;
  target: Target;
  glassTarget: Target | null = null;
  program: Program | null = null;
  flags!: SceneFlags;
  flash = 0;
  flashX = 0.5;
  private flashes: { at: number; power: number }[] = [];
  private nextFlash = 0;
  meteor = { x: 0, y: 0, dx: 0, dy: 0, start: -1, dur: 1, bright: 0 };
  private nextMeteor = 0;
  aircraft = { x: 0, y: 0, dx: 0, dy: 0, start: -1, dur: 1 };
  private nextAircraft = 0;
  imageAspect = 16 / 9;
  videoTime = -1;
  fireTime = -1;
  born: number;

  constructor(
    readonly gl: GL,
    readonly req: ShowRequest,
    width: number,
    height: number,
    now: number,
  ) {
    this.target = new Target(gl, width, height, true);
    this.born = now;
    this.nextFlash = now + 4 + Math.random() * 6;
    this.nextMeteor = now + 8 + Math.random() * 10;
    this.nextAircraft = now + 12 + Math.random() * 20;
  }

  get fx() {
    return this.req.fx;
  }

  get needsGlass() {
    return this.fx.rainGlass > 0.01 && (this.fx.glassFull || !!this.req.media.glass);
  }

  /** Lightning: strokes cluster into flashes; returns true when a new flash starts. */
  updateLightning(t: number, onLightning?: (s: number, d: number) => void) {
    const rate = this.fx.lightning;
    if (rate > 0.001 && t >= this.nextFlash) {
      const power = 0.45 + Math.random() * 0.55;
      const strokes = 1 + Math.floor(Math.random() * 3.5);
      let at = t;
      for (let i = 0; i < strokes; i++) {
        this.flashes.push({ at, power: power * (i === 0 ? 1 : 0.5 + Math.random() * 0.5) });
        at += 0.06 + Math.random() * 0.22;
      }
      this.flashX = 0.15 + Math.random() * 0.7;
      const mean = 60 / (rate * 7);
      this.nextFlash = t + Math.max(4, -Math.log(1 - Math.random()) * mean);
      onLightning?.(power, 0.25 + Math.random() * 0.75);
    }
    let f = 0;
    this.flashes = this.flashes.filter((s) => t - s.at < 1.2);
    for (const s of this.flashes) {
      const d = t - s.at;
      if (d >= 0) f += s.power * Math.exp(-d * 11) * (d < 0.03 ? d / 0.03 : 1);
    }
    this.flash = Math.min(1.4, f);
  }

  updateSky(t: number) {
    if (this.fx.meteors > 0.001 && t >= this.nextMeteor) {
      const fromLeft = Math.random() < 0.5;
      this.meteor = {
        x: 0.15 + Math.random() * 0.7,
        y: 0.04 + Math.random() * 0.25,
        dx: (fromLeft ? 1 : -1) * (0.12 + Math.random() * 0.12),
        dy: 0.06 + Math.random() * 0.08,
        start: t,
        dur: 0.45 + Math.random() * 0.6,
        bright: 0.55 + Math.random() * 0.45,
      };
      this.nextMeteor = t + Math.max(6, -Math.log(1 - Math.random()) * (34 / this.fx.meteors));
    }
    if (this.fx.aircraft > 0.001 && t >= this.nextAircraft) {
      const ltr = Math.random() < 0.5;
      this.aircraft = { x: ltr ? -0.05 : 1.05, y: 0.06 + Math.random() * 0.18, dx: ltr ? 1.1 : -1.1, dy: (Math.random() - 0.5) * 0.06, start: t, dur: 75 + Math.random() * 40 };
      this.nextAircraft = t + this.aircraft.dur + 30 + Math.random() * 90 / this.fx.aircraft;
    }
  }

  dispose() {
    const gl = this.gl;
    if (this.base) gl.deleteTexture(this.base.tex);
    if (this.baseDynamic) gl.deleteTexture(this.baseDynamic);
    for (const m of this.maps) if (m) gl.deleteTexture(m.tex);
    if (this.reflect) gl.deleteTexture(this.reflect.tex);
    if (this.fireTex) gl.deleteTexture(this.fireTex);
    disposeVideo(this.video);
    disposeVideo(this.fireVideo);
    this.target.dispose();
    this.glassTarget?.dispose();
  }
}

export class Renderer {
  private readonly gl: GL;
  private readonly composite = new Map<string, Program>();
  private readonly glassProgram: Program;
  private readonly finalProgram: Program;
  private readonly particles: Particles;
  private readonly blank: WebGLTexture;
  private readonly blankMaps: WebGLTexture;
  private readonly rain: RainGlass;
  private rainTex: WebGLTexture;
  private current: Instance | null = null;
  private next: Instance | null = null;
  private transition = { start: 0, dur: 2.6 };
  private loading: AbortController | null = null;
  private request: ShowRequest | null = null;
  private disposed = false;
  private raf = 0;
  private last = 0;
  private time = 0;
  private quality: Quality = "balanced";
  private scale = 1;
  private frameTimes: number[] = [];
  private lowFor = 0;
  private highFor = 0;
  private readonly atlases = new Map<string, Texture | null>();
  private settleUntil = 0; // place changes decode and upload 4K textures: their hitches are not load
  private statsAt = 0;
  private pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  private motion = true;
  private reducedMotion = false;
  private visible = true;
  private lastDraw = 0;
  private rainPrimed = false;
  private rainClock = 0;
  private rainUploaded = false;
  /** True when WebGL runs on the CPU: the app keeps everything lighter. */
  readonly software: boolean;

  static supported() {
    try {
      const c = document.createElement("canvas");
      return !!c.getContext("webgl2");
    } catch {
      return false;
    }
  }

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly events: RendererEvents = {},
  ) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is not available");
    this.gl = gl;
    // no GPU (a VM, a remote desktop, a blocklisted driver): Chrome falls back to a CPU renderer
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    this.software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
    this.glassProgram = new Program(gl, FULLSCREEN_VS, GLASS_FS, "glass");
    this.finalProgram = new Program(gl, FULLSCREEN_VS, FINAL_FS, "final");
    this.particles = new Particles(gl);
    this.blank = solidTexture(gl, [0, 0, 0, 255]);
    this.blankMaps = solidTexture(gl, [0, 0, 128, 255]);
    this.rain = new RainGlass(960, 540);
    this.rainTex = dynamicTexture(gl);
    canvas.addEventListener("webglcontextlost", this.onLost, false);
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(this.raf);
    this.events.onError?.(new Error("The graphics context was lost"));
  };

  setQuality(q: Quality) {
    this.quality = q;
    this.scale = TIERS[q].maxScale;
    this.settle(3000);
    this.resize();
  }

  setMotion(enabled: boolean, reduced: boolean) {
    this.motion = enabled;
    this.reducedMotion = reduced;
    for (const v of [this.current?.video, this.next?.video, this.current?.fireVideo, this.next?.fireVideo]) {
      if (!v) continue;
      if (enabled && this.visible) v.play().catch(() => {});
      else v.pause();
    }
  }

  setPointer(nx: number, ny: number) {
    this.pointer.x = Math.max(-1, Math.min(1, nx));
    this.pointer.y = Math.max(-1, Math.min(1, ny));
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v) this.settle(3000);
    const vids = [this.current?.video, this.next?.video, this.current?.fireVideo, this.next?.fireVideo];
    for (const vid of vids) {
      if (!vid) continue;
      if (v && this.motion) vid.play().catch(() => {});
      else vid.pause();
    }
  }

  /** Live effect changes from the scene controls. */
  update(key: string, fx: Fx) {
    if (this.request?.key === key) this.request.fx = fx;
    for (const inst of [this.current, this.next]) {
      if (inst?.req.key === key) inst.req.fx = fx;
    }
    this.ensurePrograms();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cssW = this.canvas.clientWidth || window.innerWidth;
    const cssH = this.canvas.clientHeight || window.innerHeight;
    const tier = TIERS[this.quality];
    // cap by pixel count so a portrait phone keeps full sharpness while a TV is held to the tier
    const maxPixels = tier.maxWidth * tier.maxWidth * 0.5625;
    const k = Math.min(1, Math.sqrt(maxPixels / Math.max(1, cssW * dpr * cssH * dpr)));
    const w = cssW * dpr * k;
    const h = cssH * dpr * k;
    this.canvas.width = Math.max(2, Math.round(w));
    this.canvas.height = Math.max(2, Math.round(h));
    this.resizeTargets();
  }

  private renderSize() {
    return {
      w: Math.max(2, Math.round(this.canvas.width * this.scale)),
      h: Math.max(2, Math.round(this.canvas.height * this.scale)),
    };
  }

  private resizeTargets() {
    const { w, h } = this.renderSize();
    for (const inst of [this.current, this.next]) {
      if (!inst) continue;
      inst.target.resize(w, h);
      inst.glassTarget?.resize(w, h);
    }
    const div = TIERS[this.quality].glassDiv;
    // never below 640 wide, or the drops lose their edges
    this.rain.resize(Math.max(640, Math.min(1920, w / div)), Math.max(360, Math.min(1080, h / div)));
  }

  /** Load a place and fade to it. Resolves once it is on screen (or the request was superseded). */
  async show(req: ShowRequest, opts: { instant?: boolean } = {}) {
    if (this.disposed) return;
    this.loading?.abort();
    const ctrl = new AbortController();
    this.loading = ctrl;
    this.request = req;
    this.settle(6000);
    const { w, h } = this.renderSize();
    const inst = new Instance(this.gl, req, w, h, this.time);
    try {
      await this.load(inst, ctrl.signal);
      if (!ctrl.signal.aborted) this.ensureProgram(inst);
    } catch (e) {
      inst.dispose();
      if ((e as DOMException)?.name === "AbortError") return;
      this.events.onError?.(e);
      throw e;
    }
    if (ctrl.signal.aborted) {
      inst.dispose();
      return;
    }
    this.loading = null;
    if (this.next) {
      // a change was still underway: settle it before starting the new one
      this.current?.dispose();
      this.current = this.next;
      this.next = null;
    }
    if (!this.current || opts.instant) {
      this.current?.dispose();
      this.current = inst;
    } else {
      this.next = inst;
      this.transition = { start: this.time, dur: this.reducedMotion ? 0.9 : 2.6 };
    }
    if (inst.needsGlass && !this.rainPrimed) {
      this.rain.intensity = inst.fx.rainGlass;
      this.rain.prime(8);
      this.rainPrimed = true;
    }
    this.events.onShown?.(req.key);
  }

  private async load(inst: Instance, signal: AbortSignal) {
    const gl = this.gl;
    const m = inst.req.media;
    const { w, h } = this.renderSize();
    const jobs: Promise<void>[] = [];
    if (m.kind === "video" && m.video) {
      // AV1 where the browser has it, HEVC for Safari without AV1 hardware; the poster as a still otherwise
      const v = makeVideo([
        ...(m.video.av1 ? [{ src: m.video.av1, type: 'video/mp4; codecs="av01.0.08M.08"' }] : []),
        ...(m.video.hevc ? [{ src: m.video.hevc, type: 'video/mp4; codecs="hvc1.1.6.L123.90"' }] : []),
        ...(m.video.h264 ? [{ src: m.video.h264, type: 'video/mp4; codecs="avc1.4d4028"' }] : []),
      ]);
      inst.imageAspect = m.video.width / m.video.height;
      const still = () =>
        decodeImage(`${m.dir}/poster.webp`, signal).then((img) => {
          const { w: iw, h: ih } = sizeOf(img);
          inst.base = uploadTexture(gl, img, iw, ih, { mips: true });
          release(img);
        });
      if (!v.firstChild) jobs.push(still());
      else {
        inst.video = v;
        inst.baseDynamic = dynamicTexture(gl);
        jobs.push(
          waitForVideo(v, signal).then(
            async () => {
              if (this.motion && this.visible) await v.play().catch(() => {});
              gl.bindTexture(gl.TEXTURE_2D, inst.baseDynamic);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
            },
            (e) => {
              if ((e as DOMException)?.name === "AbortError") throw e;
              disposeVideo(v);
              inst.video = null;
              gl.deleteTexture(inst.baseDynamic);
              inst.baseDynamic = null;
              return still();
            },
          ),
        );
      }
    } else {
      jobs.push(
        imageUrl(m, Math.max(w, h * m.aspect) * 1.08)
          .then((url) => decodeImage(url, signal))
          .then((img) => {
            const { w: iw, h: ih } = sizeOf(img);
            inst.imageAspect = iw / ih;
            inst.base = uploadTexture(gl, img, iw, ih, { mips: true });
            release(img);
          }),
      );
    }
    if (m.maps) {
      (m.motion ? ["a", "b", "c", "d"] : ["a", "b", "c"]).forEach((k, i) =>
        jobs.push(
          decodeImage(`${m.dir}/maps-${k}.png`, signal).then((img) => {
            const { w: iw, h: ih } = sizeOf(img);
            inst.maps[i] = uploadTexture(gl, img, iw, ih, { mips: false });
            release(img);
          }),
        ),
      );
    }
    if (inst.fx.reflection > 0) {
      jobs.push(
        decodeImage("/vibey/media/fx/cafe-reflection.webp", signal)
          .then((img) => {
            const { w: iw, h: ih } = sizeOf(img);
            inst.reflect = uploadTexture(gl, img, iw, ih);
            release(img);
          })
          .catch(() => {}),
      );
    }
    if (inst.req.variation.hearth) {
      const fv = makeVideo(FIRE_VIDEO);
      inst.fireVideo = fv;
      inst.fireTex = dynamicTexture(gl);
      jobs.push(
        waitForVideo(fv, signal)
          .then(() => (this.motion && this.visible ? fv.play().catch(() => {}) : undefined))
          .catch(() => {
            disposeVideo(fv);
            inst.fireVideo = null;
          }),
      );
    }
    // Finish every decode before disposing a failed or superseded scene. A late upload must not
    // recreate textures after Instance.dispose() has already freed them.
    const results = await Promise.allSettled(jobs);
    const failure = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failure) throw failure.reason;
  }

  private flagsFor(inst: Instance): SceneFlags {
    const fx = inst.fx;
    const maps = inst.req.media.maps;
    return {
      maps,
      clouds: maps && (fx.clouds > 0 || fx.mist > 0),
      water: maps && (fx.water > 0 || fx.wet > 0),
      // trees move only outdoors, and only where the motion map knows which pixels are trees
      sway: maps && !!inst.req.media.motion && !inst.req.variation.interior && (fx.sway > 0 || fx.wind > 0.02),
      fog: fx.fog > 0,
      flash: fx.lightning > 0,
      stars: fx.stars > 0,
      aurora: fx.aurora > 0,
      caustics: fx.caustics > 0,
      lamps: maps && fx.lamps > 0,
      neon: maps && fx.neon > 0,
      fire: !!inst.req.variation.hearth && fx.fire > 0,
      night: fx.night > 0.01 || fx.glow > 0.01,
      twinkle: fx.twinkle > 0.01,
    };
  }

  private ensureProgram(inst: Instance) {
    const flags = this.flagsFor(inst);
    const key = flagKey(flags);
    let p = this.composite.get(key);
    if (!p) {
      p = new Program(this.gl, FULLSCREEN_VS, compositeFS(flags), `composite:${key}`);
      this.composite.set(key, p);
    }
    inst.program = p;
    inst.flags = flags;
  }

  private ensurePrograms() {
    for (const inst of [this.current, this.next]) if (inst) this.ensureProgram(inst);
  }

  private cover(inst: Instance, w: number, h: number, t: number): [number, number, number, number] {
    const ia = inst.imageAspect;
    const va = w / h;
    let sx = 1;
    let sy = 1;
    if (va > ia) sy = ia / va;
    else sx = va / ia;
    const fx = inst.fx;
    // overscan for parallax plus the very slow push used for space
    let zoom = 1 + 0.03 * fx.drift;
    if (fx.zoom > 0 && this.motion) zoom += fx.zoom * 0.06 * (0.5 - 0.5 * Math.cos((t - inst.born) / 90));
    sx /= zoom;
    sy /= zoom;
    const [fxp, fyp] = inst.req.variation.focus;
    const x0 = Math.min(Math.max(fxp - sx / 2, 0), 1 - sx);
    const y0 = Math.min(Math.max(fyp - sy / 2, 0), 1 - sy);
    return [sx, sy, x0, y0];
  }

  private frame = (nowMs: number) => {
    this.raf = requestAnimationFrame(this.frame);
    if (!this.visible) {
      this.last = nowMs;
      return;
    }
    const tier = TIERS[this.quality];
    const minGap = 1000 / Math.min(tier.fps, FPS_CAP, this.software ? 24 : Infinity) - 2;
    if (nowMs - this.lastDraw < minGap) return;
    const dtMs = this.last ? nowMs - this.last : 16;
    this.last = nowMs;
    this.lastDraw = nowMs;
    const dt = Math.min(0.1, dtMs / 1000);
    if (this.motion) this.time += dt;
    this.adapt(dtMs, tier.fps);
    try {
      this.draw(dt);
    } catch (e) {
      cancelAnimationFrame(this.raf);
      this.events.onError?.(e);
    }
  };

  private settle(ms: number) {
    this.settleUntil = Math.max(this.settleUntil, performance.now() + ms);
    this.frameTimes.length = 0;
    this.lowFor = 0;
    this.highFor = 0;
  }

  /** Scanned-leaf atlases, shared by every place and loaded the first time one is needed. */
  private atlas(kind: string) {
    if (this.disposed) return null;
    if (this.atlases.has(kind)) return this.atlases.get(kind) ?? null;
    this.atlases.set(kind, null);
    decodeImage(`/vibey/media/fx/leaves-${kind}.webp`)
      .then((img) => {
        if (this.disposed) return release(img);
        const { w, h } = sizeOf(img);
        this.atlases.set(kind, uploadTexture(this.gl, img, w, h, { mips: true }));
        release(img);
      })
      .catch(() => this.atlases.delete(kind));
    return null;
  }

  private adapt(dtMs: number, targetFps: number) {
    const ft = this.frameTimes;
    const tier = TIERS[this.quality];
    const now = performance.now();
    // during a change (loading, cross-fading two places) and for a moment after, just watch
    const settling = now < this.settleUntil || !!this.next || !!this.loading;
    if (settling) {
      if (this.next || this.loading) this.settleUntil = Math.max(this.settleUntil, now + 1500);
      this.lowFor = 0;
      this.highFor = 0;
    } else if (dtMs < 250) {
      // one long frame is a hitch (a tab switch, a decode), not a slow machine
      ft.push(dtMs);
      if (ft.length > 40) ft.shift();
    }
    const avg = ft.length ? ft.reduce((a, b) => a + b, 0) / ft.length : 1000 / targetFps;
    const budget = 1000 / targetFps;
    const floor = 1000 / Math.min(targetFps, tier.floorFps);
    if (!settling && ft.length >= 30 && avg > Math.max(budget * 1.35, floor)) {
      this.lowFor += dtMs;
      this.highFor = 0;
    } else if (!settling && avg < budget * 1.08) {
      this.highFor += dtMs;
      this.lowFor = 0;
    }
    const maxScale = tier.maxScale;
    if (this.lowFor > 4000 && this.scale > tier.minScale) {
      this.scale = Math.max(tier.minScale, this.scale - 0.1);
      this.lowFor = 0;
      ft.length = 0;
      this.resizeTargets();
    } else if (this.highFor > 5000 && this.scale < maxScale) {
      this.scale = Math.min(maxScale, this.scale + 0.1);
      this.highFor = 0;
      ft.length = 0;
      this.resizeTargets();
    }
    if (now - this.statsAt > 1000) {
      this.statsAt = now;
      const { w, h } = this.renderSize();
      this.events.onStats?.({ fps: Math.round(1000 / avg), width: w, height: h, scale: this.scale, quality: this.quality });
    }
  }

  private draw(dt: number) {
    const gl = this.gl;
    const t = this.time;
    // the camera drifts slowly and leans a little toward the pointer
    const p = this.pointer;
    const ease = 1 - Math.exp(-dt * 1.4);
    p.sx += (p.x - p.sx) * ease;
    p.sy += (p.y - p.sy) * ease;

    const anyGlass = [this.current, this.next].some((i) => i?.needsGlass);
    if (anyGlass) {
      // the drops move slowly: thirty updates a second is plenty and keeps 4K uploads cheap
      this.rainClock += dt;
      if (this.rainClock >= 1 / 30 || !this.rainUploaded) {
        const inst = this.next?.needsGlass ? this.next : this.current;
        this.rain.intensity = inst?.fx.rainGlass ?? 0.5;
        if (this.motion) this.rain.step(this.rainClock);
        this.rainClock = 0;
        this.rain.draw();
        gl.bindTexture(gl.TEXTURE_2D, this.rainTex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.rain.canvas);
        this.rainUploaded = true;
      }
    } else {
      this.rainUploaded = false;
      this.rainPrimed = false;
    }

    const insts = [this.current, this.next].filter((i): i is Instance => !!i);
    for (const inst of insts) this.renderInstance(inst, t);

    // final pass to the screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const a = this.current;
    const b = this.next;
    let mix = 0;
    if (b) {
      mix = Math.min(1, (t - this.transition.start) / this.transition.dur);
      if (!this.motion) mix = 1;
    }
    const outA = a ? (a.glassTarget && a.needsGlass ? a.glassTarget : a.target) : null;
    const outB = b ? (b.glassTarget && b.needsGlass ? b.glassTarget : b.target) : null;
    const blurA = b && !this.reducedMotion ? Math.sin(Math.min(1, mix * 1.4) * Math.PI * 0.5) * 3.2 : 0;
    const blurB = b && !this.reducedMotion ? (1 - Math.min(1, mix * 1.25)) * 3.4 : 0;
    if (blurA > 0.01) outA?.mipmap();
    if (blurB > 0.01) outB?.mipmap();
    const tier = TIERS[this.quality];
    const fp = this.finalProgram.use();
    fp.tex("uA", 0, outA?.tex ?? this.blank)
      .tex("uB", 1, outB?.tex ?? this.blank)
      .f("uMix", b ? mix : 0)
      .f("uBlurA", blurA)
      .f("uBlurB", blurB)
      .f("uGrain", 1)
      .f("uVignette", 0.22)
      .f("uTime", t)
      .f("uRes", this.canvas.width, this.canvas.height)
      .f("uSharpen", this.scale >= 0.99 ? tier.sharpen : tier.sharpen * 0.5)
      .f("uTexel", 1 / (outA?.width ?? 1), 1 / (outA?.height ?? 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (b && mix >= 1) {
      a?.dispose();
      this.current = b;
      this.next = null;
    }
  }

  private renderInstance(inst: Instance, t: number) {
    const gl = this.gl;
    const fx = inst.fx;
    const target = inst.target;
    const { w, h } = { w: target.width, h: target.height };
    if (inst.video && inst.baseDynamic && inst.video.readyState >= 2 && inst.video.currentTime !== inst.videoTime) {
      inst.videoTime = inst.video.currentTime;
      gl.bindTexture(gl.TEXTURE_2D, inst.baseDynamic);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inst.video);
    }
    if (inst.fireVideo && inst.fireTex && inst.fireVideo.readyState >= 2 && inst.fireVideo.currentTime !== inst.fireTime) {
      inst.fireTime = inst.fireVideo.currentTime;
      gl.bindTexture(gl.TEXTURE_2D, inst.fireTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, inst.fireVideo);
    }
    if (this.motion) {
      inst.updateLightning(t, inst === (this.next ?? this.current) ? this.events.onLightning : undefined);
      inst.updateSky(t);
    }
    const cover = this.cover(inst, w, h, t);
    const drift = this.motion && !this.reducedMotion ? fx.drift : 0;
    const cam: [number, number] = [
      drift * (0.006 * Math.sin(t * 0.047) + 0.0035 * this.pointer.sx),
      drift * (0.004 * Math.sin(t * 0.031 + 1.3) + 0.0025 * this.pointer.sy),
    ];
    const windAngle = 0.25 * Math.sin(t * 0.021);
    const wind: [number, number] = [fx.wind * Math.cos(windAngle) * (0.6 + 0.4 * Math.sin(t * 0.09)), fx.wind * Math.sin(windAngle)];
    const baseTex = inst.base?.tex ?? inst.baseDynamic ?? this.blank;
    const mapsA = inst.maps[0]?.tex ?? this.blank;
    const mapsB = inst.maps[1]?.tex ?? this.blank;
    const mapsC = inst.maps[2]?.tex ?? this.blankMaps;
    const mapsD = inst.maps[3]?.tex ?? this.blank;

    const glass = inst.needsGlass;
    if (glass && !inst.glassTarget) inst.glassTarget = new Target(gl, w, h, true);

    target.bind();
    const p = inst.program!.use();
    const fireRect = inst.req.variation.hearth ?? { x: 0, y: 0, w: 0, h: 0 };
    const fireGlow = 0.62 + 0.26 * noise1(t * 2.1) + 0.14 * noise1(t * 6.3 + 7);
    p.tex("uBase", 0, baseTex)
      .tex("uMapsA", 1, mapsA)
      .tex("uMapsB", 2, mapsB)
      .tex("uMapsC", 3, mapsC)
      .tex("uFireTex", 4, inst.fireTex ?? this.blank)
      .tex("uMapsD", 5, mapsD)
      .f("uCover", ...cover)
      .f("uRes", w, h)
      .f("uImgAspect", inst.imageAspect)
      .f("uTime", t)
      .f("uCam", cam[0], cam[1])
      .f("uParallax", 1)
      .f("uWind", wind[0], wind[1])
      .f("uClouds", fx.clouds)
      .f("uWater", Math.max(fx.water, fx.wet))
      .f("uWaterFlow", ...(inst.req.variation.waterFlow ?? [0, 0]))
      .f("uWet", fx.wet)
      .f("uSway", Math.min(1.8, (0.3 + fx.sway) * fx.wind * 2.6) * (this.reducedMotion ? 0.3 : 1))
      .f("uStorm", Math.min(1, Math.max(fx.rain * 0.9, fx.lightning * 0.65)))
      .f("uFog", fx.fog)
      .f("uFogLow", fx.fogLow)
      .f("uFogColor", ...fx.fogColor)
      .f("uStars", fx.stars)
      .f("uAurora", fx.aurora)
      .f("uCaustics", fx.caustics)
      .f("uLamps", fx.lamps)
      .f("uNeon", fx.neon)
      .f("uFire", inst.fireVideo ? fx.fire : fx.fire * 0.4)
      .f("uFireGlow", fireGlow)
      .f("uFireRect", fireRect.x, fireRect.y, fireRect.w, fireRect.h)
      .f("uFireMode", inst.req.variation.hearthMode === "inside" ? 1 : 0)
      .f("uMist", fx.mist)
      .f("uFlash", inst.flash * Math.min(1, fx.lightning * 2 + 0.3))
      .f("uFlashX", inst.flashX)
      .f("uFlashColor", 0.78, 0.84, 1.0)
      .f("uNight", fx.night)
      .f("uTwinkle", fx.twinkle)
      .f("uGlow", fx.glow)
      .f("uInterior", inst.req.variation.interior ? 1 : 0)
      .f("uWindows", inst.req.variation.litWindows ? 1 : 0)
      .f("uGlowAt", ...(inst.req.variation.glowAt ?? [0.5, 1.15]))
      .f("uExposure", fx.exposure)
      .f("uWarmth", fx.warmth);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // particles over the composite
    const tier = TIERS[this.quality];
    const density = tier.density * (this.reducedMotion ? 0.5 : 1);
    const u: ParticleUniforms = {
      nearMax: inst.req.variation.outsideOnly ? 0.16 : 1,
      time: t,
      res: [w, h],
      cover,
      wind,
      cam,
      hasMaps: inst.req.media.maps,
      occlusion: 0.06,
      // after dark, falling things are lit by the night, not by the daytime photograph
      light: 1 - 0.68 * fx.night,
      base: baseTex,
      mapsA,
      mapsC,
    };
    const speed = this.motion ? 1 : 0;
    const P = this.particles;
    const withSpeed = (s: number) => (prog: Program) => prog.f("uSpeed", s * speed);
    if (fx.rain > 0) P.draw("rain", fx.rain, density, u, withSpeed(0.85 + fx.rain * 0.3));
    if (fx.splashes > 0 && fx.rain > 0) P.draw("splashes", fx.splashes * fx.rain, density, u, withSpeed(0.6 + fx.rain));
    if (fx.snow > 0) P.draw("snow", fx.snow, density, u, withSpeed(0.8 + fx.wind * 0.6));
    if (fx.petals > 0) {
      if (fx.petalKind === "sakura") P.draw("petals", fx.petals, density, u, withSpeed(1));
      else {
        const atlas = this.atlas(fx.petalKind);
        if (atlas) P.draw("maple", fx.petals, density, u, (prog) => prog.f("uSpeed", speed).tex("uAtlas", 4, atlas.tex));
      }
    }
    if (fx.dust > 0) P.draw("dust", fx.dust, density, u);
    if (fx.fireflies > 0) P.draw("fireflies", fx.fireflies, density, u);
    if (fx.marine > 0) P.draw("marine", fx.marine, density, u);
    if (fx.starfield > 0) P.draw("stars", fx.starfield, density, u);
    if (fx.embers > 0 && inst.req.variation.emberAt) {
      const r = imageRectToScreen(inst.req.variation.emberAt, cover);
      P.draw("embers", fx.embers, density, u, (prog) => prog.f("uEmitter", r.x, r.y, r.w, r.h));
    }
    if (fx.headlights > 0 && inst.req.variation.road) {
      const [y0, y1] = inst.req.variation.road;
      const s0 = (y0 - cover[3]) / cover[1];
      const s1 = (y1 - cover[3]) / cover[1];
      P.draw("headlights", fx.headlights, Math.max(0.6, density), u, (prog) => prog.f("uRoad", s0, s1));
    }
    const m = inst.meteor;
    if (m.start >= 0 && t - m.start < m.dur) {
      const prog = (t - m.start) / m.dur;
      const fade = Math.sin(prog * Math.PI);
      P.draw("streaks", 1, 1, u, (pr) =>
        pr.f("uStreakA", m.x, m.y, m.dx, m.dy).f("uStreakB", prog, m.bright * fade * fx.meteors, 0, 0.09),
      );
    }
    const ac = inst.aircraft;
    if (ac.start >= 0 && t - ac.start < ac.dur) {
      const prog = (t - ac.start) / ac.dur;
      P.draw("streaks", 1, 1, u, (pr) =>
        pr.f("uStreakA", ac.x, ac.y, ac.dx, ac.dy).f("uStreakB", prog, 0.9 * fx.aircraft, 1, 0),
      );
    }

    if (glass && inst.glassTarget) {
      target.mipmap();
      inst.glassTarget.bind();
      const g = this.glassProgram.use();
      g.tex("uScene", 0, target.tex)
        .tex("uDrops", 1, this.rainTex)
        .tex("uMask", 2, mapsB)
        .tex("uReflect", 3, inst.reflect?.tex ?? this.blank)
        .f("uCover", ...cover)
        .f("uFull", fx.glassFull ? 1 : 0)
        .f("uFocusGlass", fx.glassFocus === "glass" ? 1 : 0)
        .f("uRefract", 0.022)
        .f("uReflection", inst.reflect ? fx.reflection : 0)
        .f("uFogGlass", 0.35 + fx.rainGlass * 0.4)
        .f("uTexel", 1 / w, 1 / h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  get gpuBytes() {
    let b = 0;
    for (const inst of [this.current, this.next]) {
      if (!inst) continue;
      b += inst.base?.bytes ?? 0;
      for (const m of inst.maps) b += m?.bytes ?? 0;
      b += inst.target.bytes + (inst.glassTarget?.bytes ?? 0);
    }
    return b;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.loading?.abort();
    this.current?.dispose();
    this.next?.dispose();
    for (const p of this.composite.values()) p.dispose();
    this.glassProgram.dispose();
    this.finalProgram.dispose();
    this.particles.dispose();
    for (const t of this.atlases.values()) if (t) this.gl.deleteTexture(t.tex);
    this.gl.deleteTexture(this.blank);
    this.gl.deleteTexture(this.blankMaps);
    this.gl.deleteTexture(this.rainTex);
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
  }
}

function imageRectToScreen(r: Rect, cover: [number, number, number, number]) {
  return {
    x: (r.x - cover[2]) / cover[0],
    y: (r.y - cover[3]) / cover[1],
    w: r.w / cover[0],
    h: r.h / cover[1],
  };
}

function noise1(x: number) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash1(i), hash1(i + 1), u);
}
function hash1(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
