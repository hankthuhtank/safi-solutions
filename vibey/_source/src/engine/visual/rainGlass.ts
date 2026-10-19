// Rain on a window pane. Drops land, sit, merge, and once heavy enough run down the glass,
// leaving beads behind and wiping the fine mist they pass through. The result is drawn into a
// canvas as a normal map (r,g = surface normal, b = thickness, a = coverage) that the glass shader
// uses to refract the scene.

interface Drop {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  stick: number; // seconds before it may move again
  trail: number; // distance until the next bead is left behind
  sliding: boolean;
  dead: boolean;
}

const MAX_DROPS = 900;

export class RainGlass {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly mist: HTMLCanvasElement;
  private readonly mistCtx: CanvasRenderingContext2D;
  private readonly sprite: HTMLCanvasElement;
  private drops: Drop[] = [];
  private grid = new Map<number, Drop[]>();
  private mistTimer = 0;
  private fadeTimer = 0;
  private scale = 1;
  intensity = 0.6;

  constructor(width: number, height: number) {
    this.canvas = document.createElement("canvas");
    this.mist = document.createElement("canvas");
    this.sprite = makeSprite(64);
    const ctx = this.canvas.getContext("2d", { alpha: true });
    const mistCtx = this.mist.getContext("2d", { alpha: true });
    if (!ctx || !mistCtx) throw new Error("2D canvas is not available");
    this.ctx = ctx;
    this.mistCtx = mistCtx;
    this.resize(width, height);
  }

  get width() {
    return this.canvas.width;
  }
  get height() {
    return this.canvas.height;
  }

  resize(width: number, height: number) {
    width = Math.max(64, Math.round(width));
    height = Math.max(36, Math.round(height));
    if (width === this.canvas.width && height === this.canvas.height) return;
    const sx = width / Math.max(1, this.canvas.width);
    const sy = height / Math.max(1, this.canvas.height);
    for (const d of this.drops) {
      d.x *= sx;
      d.y *= sy;
      d.r *= sy;
    }
    this.canvas.width = this.mist.width = width;
    this.canvas.height = this.mist.height = height;
    this.scale = height / 720;
  }

  /** Fill the pane straight away so a scene never opens on dry glass. */
  prime(seconds = 6) {
    for (let i = 0; i < seconds * 10; i++) this.step(0.1);
  }

  step(dt: number) {
    dt = Math.min(dt, 0.1);
    const k = this.scale;
    // drops per second over the whole pane; sizes already scale with the canvas, so the count must not
    const rate = 6 + 110 * this.intensity * this.intensity;
    let spawn = rate * dt;
    while (spawn > 0) {
      if (Math.random() < spawn && this.drops.length < MAX_DROPS) {
        const big = Math.random() < 0.18 + this.intensity * 0.25;
        const r = (big ? 4.5 + Math.random() * 6 : 1.6 + Math.random() * 3.2) * k;
        this.drops.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height * 1.05 - this.height * 0.05,
          r,
          vy: 0,
          vx: 0,
          stick: Math.random() * 2,
          trail: 0,
          sliding: false,
          dead: false,
        });
      }
      spawn -= 1;
    }

    // fine mist builds up between the bigger drops
    this.mistTimer += dt * (4 + 46 * this.intensity);
    const m = this.mistCtx;
    m.globalCompositeOperation = "source-over";
    while (this.mistTimer > 1) {
      this.mistTimer -= 1;
      const r = (0.7 + Math.random() * 1.9) * k;
      m.globalAlpha = 0.85;
      m.drawImage(this.sprite, Math.random() * this.width - r, Math.random() * this.height - r, r * 2, r * 2);
    }
    m.globalAlpha = 1;
    // the mist slowly evaporates so it never saturates during long sessions
    this.fadeTimer += dt;
    if (this.fadeTimer > 0.5) {
      this.fadeTimer = 0;
      m.globalCompositeOperation = "destination-out";
      m.fillStyle = `rgba(0,0,0,${0.02 + 0.03 * (1 - this.intensity)})`;
      m.fillRect(0, 0, this.width, this.height);
    }

    const slideAt = 5.2 * k;
    const g = 2400 * k;
    m.globalCompositeOperation = "destination-out";
    m.fillStyle = "#000";
    for (const d of this.drops) {
      if (d.dead) continue;
      if (d.stick > 0) {
        d.stick -= dt;
        continue;
      }
      if (!d.sliding && d.r > slideAt && Math.random() < dt * 1.6) d.sliding = true;
      if (!d.sliding) continue;
      const pull = (d.r - slideAt * 0.8) / (12 * k);
      d.vy = Math.min(d.vy + g * pull * dt * 0.06, 260 * k * (0.6 + pull));
      if (Math.random() < dt * 0.9) {
        d.vy *= 0.2; // catches on the glass for a moment
        d.stick = Math.random() * 0.5;
      }
      d.vx += (Math.random() - 0.5) * 40 * k * dt;
      d.vx *= 0.92;
      const dy = d.vy * dt;
      d.y += dy;
      d.x += d.vx * dt;
      d.trail -= dy;
      if (d.trail <= 0) {
        d.trail = (8 + Math.random() * 22) * k;
        if (d.r > 3 * k && this.drops.length < MAX_DROPS) {
          const br = d.r * (0.16 + Math.random() * 0.14);
          this.drops.push({
            x: d.x + (Math.random() - 0.5) * d.r * 0.4,
            y: d.y - d.r * 1.1,
            r: br,
            vy: 0,
            vx: 0,
            stick: 0,
            trail: 0,
            sliding: false,
            dead: false,
          });
          d.r = Math.sqrt(Math.max(0, d.r * d.r - br * br * 0.6));
        }
      }
      // wipe the mist along the path
      m.beginPath();
      m.arc(d.x, d.y, d.r * 0.9, 0, Math.PI * 2);
      m.fill();
      if (d.y - d.r > this.height || d.r < 1 * k) d.dead = true;
    }
    this.merge();
    this.drops = this.drops.filter((d) => !d.dead);
  }

  private merge() {
    const cell = 24 * this.scale;
    const grid = this.grid;
    grid.clear();
    const key = (cx: number, cy: number) => cx * 4096 + cy;
    for (const d of this.drops) {
      if (d.dead) continue;
      const k = key(Math.floor(d.x / cell), Math.floor(d.y / cell));
      let list = grid.get(k);
      if (!list) grid.set(k, (list = []));
      list.push(d);
    }
    for (const d of this.drops) {
      if (d.dead || !d.sliding) continue;
      const cx = Math.floor(d.x / cell);
      const cy = Math.floor(d.y / cell);
      for (let ox = -1; ox <= 1; ox++)
        for (let oy = -1; oy <= 1; oy++) {
          const list = grid.get(key(cx + ox, cy + oy));
          if (!list) continue;
          for (const o of list) {
            if (o === d || o.dead) continue;
            const dx = o.x - d.x;
            const dy = o.y - d.y;
            const reach = (d.r + o.r) * 0.72;
            if (dx * dx + dy * dy < reach * reach) {
              const [big, small] = d.r >= o.r ? [d, o] : [o, d];
              big.r = Math.min(Math.sqrt(big.r * big.r + small.r * small.r), 14 * this.scale);
              big.vy = Math.max(big.vy, small.vy) * 1.05 + 10 * this.scale;
              big.sliding = true;
              small.dead = true;
            }
          }
        }
    }
  }

  draw() {
    const c = this.ctx;
    c.globalCompositeOperation = "source-over";
    c.clearRect(0, 0, this.width, this.height);
    c.globalAlpha = 0.9;
    c.drawImage(this.mist, 0, 0);
    c.globalAlpha = 1;
    for (const d of this.drops) {
      if (d.dead) continue;
      const stretch = d.sliding ? Math.min(0.35, d.vy / (900 * this.scale)) : 0;
      const w = d.r * 2 * (1 - stretch * 0.4);
      const h = d.r * 2 * (1 + stretch);
      c.drawImage(this.sprite, d.x - w / 2, d.y - h * 0.62, w, h);
    }
  }

  clear() {
    this.drops = [];
    this.mistCtx.clearRect(0, 0, this.width, this.height);
  }
}

/** A drop seen from the front: its surface normal packed into colour. */
function makeSprite(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  const img = ctx.createImageData(size, size);
  const half = size / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5 - half) / half;
      const ny = (y + 0.5 - half) / half;
      // slightly flattened bottom, like a drop held by surface tension
      const d2 = nx * nx + (ny > 0 ? ny * ny * 1.15 : ny * ny);
      const i = (y * size + x) * 4;
      if (d2 >= 1) {
        img.data[i + 3] = 0;
        continue;
      }
      const nz = Math.sqrt(1 - d2);
      img.data[i] = Math.round((nx * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round(nz * 255);
      img.data[i + 3] = Math.round(Math.min(1, (1 - d2) * 3.2) * 255);
    }
  ctx.putImageData(img, 0, 0);
  return c;
}
