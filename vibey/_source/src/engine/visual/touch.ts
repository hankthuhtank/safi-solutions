// Touching the picture. Every photograph already carries maps that say what each pixel is (sky,
// water, foliage, glass, a lamp, flames) and how far away it is. Keeping a small copy of those maps
// on the CPU lets a tap answer in kind: water rings, a branch shakes, a lamp stutters, a star falls.

import type { Decoded } from "./media";

/** What is under the pointer. */
export type TouchKind = "water" | "sky" | "foliage" | "light" | "fire" | "glass" | "ground" | "deep" | "space";
/** What the picture did about it (the app picks a sound to match). */
export type TouchAct = "ripple" | "star" | "strike" | "gust" | "shake" | "snowfall" | "blink" | "stoke" | "wipe" | "pulse" | "bubbles" | "nova";

export interface TouchHit {
  kind: TouchKind;
  act: TouchAct;
  /** screen position 0..1 */
  x: number;
  y: number;
  /** 0 far .. 1 near */
  near: number;
  /** a continuous gesture rather than a tap */
  drag: boolean;
}

export interface Sample {
  sky: number;
  water: number;
  foliage: number;
  glass: number;
  light: number;
  flame: number;
  wet: number;
  people: number;
  near: number;
  bend: number;
  grass: number;
  lightId: number;
}

const W = 192;
const H = 108;
let scratch: CanvasRenderingContext2D | null = null;

/** Low-resolution CPU copies of a place's four maps. */
export class Probe {
  private maps: (Uint8ClampedArray | null)[] = [null, null, null, null];

  set(i: number, img: Decoded) {
    try {
      if (!scratch) {
        const c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        scratch = c.getContext("2d", { willReadFrequently: true });
      }
      if (!scratch) return;
      scratch.clearRect(0, 0, W, H);
      scratch.drawImage(img, 0, 0, W, H);
      this.maps[i] = scratch.getImageData(0, 0, W, H).data;
    } catch {
      this.maps[i] = null; // a tainted or failed read: this place simply answers with the plain touch
    }
  }

  get ready() {
    return !!this.maps[0] && !!this.maps[2];
  }

  /** Classes and depth at an image coordinate (0..1), or null when the place has no maps. */
  at(u: number, v: number): Sample | null {
    if (!this.ready) return null;
    const x = Math.min(W - 1, Math.max(0, Math.round(u * (W - 1))));
    const y = Math.min(H - 1, Math.max(0, Math.round(v * (H - 1))));
    const i = (y * W + x) * 4;
    const [a, b, c, d] = this.maps;
    const g = (m: Uint8ClampedArray | null, o: number, fallback = 0) => (m ? m[i + o] / 255 : fallback);
    return {
      sky: g(a, 0),
      water: g(a, 1),
      foliage: g(a, 2),
      glass: g(b, 0),
      light: g(b, 1),
      flame: g(b, 2),
      wet: g(c, 0),
      people: g(c, 1),
      near: g(c, 2, 0.5),
      bend: g(d, 0),
      grass: g(d, 1),
      lightId: d ? d[i + 2] / 255 : -1,
    };
  }
}

/** Something thrown up or knocked loose by a touch, drawn as a handful of stateless particles. */
export interface Burst {
  kind: "burst" | "puff";
  x: number;
  y: number;
  t0: number;
  life: number;
  count: number;
  /** spread, gravity, size at 1080p, shape (0 glow, 1 bubble, 2 leaf, 3 droplet) */
  b: [number, number, number, number];
  /** tint rgb, share of the scene's own colour */
  c: [number, number, number, number];
  /** lift, wind carry, flutter, depth */
  d: [number, number, number, number];
}

type Spec = Omit<Burst, "x" | "y" | "t0" | "d"> & { lift: number; carry: number; flutter: number };

const SPECS = {
  droplets: { kind: "puff", life: 0.8, count: 16, b: [0.09, 0.62, 4.2, 3], c: [0.9, 0.95, 1, 0.35], lift: 1.25, carry: 0, flutter: 0 },
  leaves: { kind: "puff", life: 3.6, count: 16, b: [0.085, 0.08, 17, 2], c: [0.74, 0.6, 0.3, 0.62], lift: 0.3, carry: 1, flutter: 1 },
  petals: { kind: "puff", life: 3.8, count: 18, b: [0.085, 0.055, 14, 2], c: [1, 0.88, 0.92, 0.2], lift: 0.35, carry: 1, flutter: 1 },
  snow: { kind: "puff", life: 2.8, count: 52, b: [0.07, 0.2, 4.6, 3], c: [0.96, 0.98, 1, 0.1], lift: 0.1, carry: 0.6, flutter: 0.5 },
  sparks: { kind: "burst", life: 2.2, count: 48, b: [0.09, -0.075, 4.6, 0], c: [1, 0.5, 0.14, 0], lift: 1.5, carry: 0.2, flutter: 0.8 },
  stardust: { kind: "burst", life: 1.6, count: 24, b: [0.07, 0.02, 4.2, 0], c: [0.82, 0.9, 1, 0], lift: 0, carry: 0, flutter: 0.3 },
  nova: { kind: "burst", life: 2.6, count: 44, b: [0.17, 0, 5, 0], c: [0.9, 0.86, 1, 0.3], lift: 0, carry: 0, flutter: 0.2 },
  bubbles: { kind: "burst", life: 3.4, count: 12, b: [0.04, -0.16, 12, 1], c: [0.55, 0.8, 0.85, 0.2], lift: 0.6, carry: 0, flutter: 1 },
} satisfies Record<string, Spec>;

export type BurstName = keyof typeof SPECS;

export function makeBurst(name: BurstName, x: number, y: number, t0: number, near: number, scale = 1): Burst {
  const s: Spec = SPECS[name];
  // things nearer the lens are bigger and travel further across the frame
  const k = (0.45 + 0.75 * near) * scale;
  return {
    kind: s.kind,
    x,
    y,
    t0,
    life: s.life,
    count: Math.max(3, Math.round(s.count * Math.min(1, scale + 0.15))),
    b: [s.b[0] * k, s.b[1] * k, s.b[2] * k, s.b[3]],
    c: s.c,
    // drawn a touch in front of where it started, so it is not swallowed by its own branch
    d: [s.lift, s.carry, s.flutter, Math.min(1, near + 0.12)],
  };
}

/** A gust launched by a tap: quick to arrive, slow to die away. */
export function gustEnvelope(age: number) {
  if (age < 0 || age > 9) return 0;
  return (1 - Math.exp(-age * 3.2)) * Math.exp(-age * 0.62);
}
