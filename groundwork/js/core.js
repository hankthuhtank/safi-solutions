// Groundwork shared helpers: DOM, motion, storage, sound and the glossary pop-ups.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem("gw:" + k);
      return v == null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem("gw:" + k, JSON.stringify(v));
    } catch (e) {
      /* private mode */
    }
  },
};

// Animate a value from 0→1 over ms; fn(t eased). Resolves when done. Reduced motion jumps to the end.
export function tween(ms, fn, ease = easeInOut) {
  return new Promise((res) => {
    if (reduced() || ms <= 0) {
      fn(1);
      res();
      return;
    }
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / ms, 0, 1);
      fn(ease(t));
      if (t < 1) requestAnimationFrame(step);
      else res();
    };
    requestAnimationFrame(step);
  });
}
export const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 60) : ms));

// Hex colour mix for illustration (t = 0 → a, 1 → b)
export function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a),
    B = p(b);
  return (
    "#" +
    A.map((v, i) =>
      Math.round(lerp(v, B[i], t))
        .toString(16)
        .padStart(2, "0"),
    ).join("")
  );
}

/* ------------------------------------------------------------------ sound (synthesised, no files) */
let ctx = null,
  master = null,
  noiseBuf = null;
export const sound = {
  on: store.get("sound", true),
  ready() {
    if (!this.on) return null;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.55;
        master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  },
  set(on) {
    this.on = on;
    store.set("sound", on);
    if (!on && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
    else if (on && master) master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.02);
  },
  _noise() {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    return s;
  },
  _filter(type, f, q = 0.7) {
    const b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  },
  _gain(v) {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  },
  // a one-shot envelope helper
  _blip({ type = "sine", f = 440, f2, dur = 0.12, vol = 0.2, noise = false, filt, q }) {
    const c = this.ready();
    if (!c) return;
    const t = c.currentTime;
    const g = this._gain(0);
    g.connect(master);
    let src;
    if (noise) {
      src = this._noise();
      const fl = this._filter(filt || "bandpass", f, q || 1);
      src.connect(fl);
      fl.connect(g);
    } else {
      src = c.createOscillator();
      src.type = type;
      src.frequency.setValueAtTime(f, t);
      if (f2) src.frequency.exponentialRampToValueAtTime(f2, t + dur);
      src.connect(g);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.start(t);
    src.stop(t + dur + 0.05);
  },
  // a sustained layer; returns { set(level), stop() }
  _loop(build) {
    const c = this.ready();
    if (!c) return { set() {}, stop() {}, mode() {} };
    const out = this._gain(0);
    out.connect(master);
    const parts = build(c, out);
    out.gain.setTargetAtTime(1, c.currentTime, 0.04);
    return {
      mode: (m) => parts.mode && parts.mode(m),
      set: (v) => out.gain.setTargetAtTime(v, c.currentTime, 0.05),
      stop: () => {
        out.gain.setTargetAtTime(0, c.currentTime, 0.06);
        setTimeout(() => {
          parts.nodes.forEach((n) => {
            try {
              n.stop();
            } catch (e) {}
          });
          parts.end && parts.end();
          out.disconnect();
        }, 400);
      },
    };
  },
  click() {
    this._blip({ type: "triangle", f: 1900, dur: 0.035, vol: 0.06 });
  },
  tick() {
    this._blip({ type: "square", f: 2600, dur: 0.02, vol: 0.03 });
  },
  knock() {
    this._blip({ f: 90, f2: 38, dur: 0.3, vol: 0.6 });
    this._blip({ noise: true, f: 700, filt: "lowpass", dur: 0.08, vol: 0.35 });
  },
  tamp() {
    this._blip({ f: 140, f2: 60, dur: 0.16, vol: 0.35 });
    this._blip({ noise: true, f: 400, filt: "lowpass", dur: 0.06, vol: 0.2 });
  },
  clunk() {
    this._blip({ type: "square", f: 320, f2: 180, dur: 0.06, vol: 0.08 });
    setTimeout(() => this._blip({ type: "square", f: 240, f2: 150, dur: 0.08, vol: 0.1 }), 110);
    this._blip({ noise: true, f: 2400, dur: 0.05, vol: 0.12, q: 4 });
  },
  pop() {
    this._blip({
      noise: true,
      f: 1800 + Math.random() * 1600,
      dur: 0.03 + Math.random() * 0.03,
      vol: 0.5,
      q: 1.4,
    });
  },
  chime() {
    this._blip({ f: 880, dur: 1.2, vol: 0.12 });
    this._blip({ f: 1320, dur: 0.9, vol: 0.06 });
    this._blip({ f: 1760, dur: 0.5, vol: 0.03 });
  },
  purge() {
    this._blip({ noise: true, f: 2600, filt: "highpass", dur: 0.7, vol: 0.22 });
  },
  grind() {
    return this._loop((c, out) => {
      const n = this._noise(),
        bp = this._filter("bandpass", 1300, 0.9),
        ng = this._gain(0.5);
      const lfo = c.createOscillator(),
        lg = this._gain(0.25);
      lfo.frequency.value = 37;
      lfo.connect(lg);
      lg.connect(ng.gain);
      const m = c.createOscillator();
      m.type = "sawtooth";
      m.frequency.value = 96;
      const lp = this._filter("lowpass", 380),
        mg = this._gain(0.12);
      n.connect(bp);
      bp.connect(ng);
      ng.connect(out);
      m.connect(lp);
      lp.connect(mg);
      mg.connect(out);
      [n, lfo, m].forEach((x) => x.start());
      return { nodes: [n, lfo, m] };
    });
  },
  pump() {
    return this._loop((c, out) => {
      const o = c.createOscillator();
      o.type = "square";
      o.frequency.value = 50;
      const lp = this._filter("lowpass", 210),
        og = this._gain(0.16);
      const n = this._noise(),
        bp = this._filter("bandpass", 520, 0.6),
        ng = this._gain(0.12);
      o.connect(lp);
      lp.connect(og);
      og.connect(out);
      n.connect(bp);
      bp.connect(ng);
      ng.connect(out);
      o.start();
      n.start();
      return { nodes: [o, n] };
    });
  },
  pour(bright = false) {
    return this._loop((c, out) => {
      const n = this._noise(),
        lp = this._filter("bandpass", bright ? 1500 : 800, 0.8),
        g = this._gain(0.18);
      const lfo = c.createOscillator(),
        lg = this._gain(0.08);
      lfo.frequency.value = 7;
      lfo.connect(lg);
      lg.connect(g.gain);
      n.connect(lp);
      lp.connect(g);
      g.connect(out);
      n.start();
      lfo.start();
      return { nodes: [n, lfo] };
    });
  },
  steam() {
    let timer = null,
      mode = "stretch";
    return this._loop((c, out) => {
      const n = this._noise(),
        hp = this._filter("highpass", 2400),
        hg = this._gain(0.16);
      const n2 = this._noise(),
        bp = this._filter("bandpass", 650, 0.7),
        rg = this._gain(0.0);
      const n3 = this._noise(),
        cp = this._filter("bandpass", 1700, 3),
        cg = this._gain(0);
      n.connect(hp);
      hp.connect(hg);
      hg.connect(out);
      n2.connect(bp);
      bp.connect(rg);
      rg.connect(out);
      n3.connect(cp);
      cp.connect(cg);
      cg.connect(out);
      [n, n2, n3].forEach((x) => x.start());
      const chirp = () => {
        if (mode === "stretch") {
          const t = c.currentTime;
          cg.gain.cancelScheduledValues(t);
          cg.gain.setValueAtTime(0.32, t);
          cg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        }
        timer = setTimeout(chirp, 55 + Math.random() * 90);
      };
      chirp();
      const setMode = (m) => {
        mode = m;
        rg.gain.setTargetAtTime(m === "spin" ? 0.2 : 0, c.currentTime, 0.1);
        hg.gain.setTargetAtTime(m === "spin" ? 0.08 : 0.16, c.currentTime, 0.1);
      };
      return {
        nodes: [n, n2, n3],
        mode: setMode,
        end: () => clearTimeout(timer),
      };
    });
  },
};

/* ------------------------------------------------------------------ glossary */
export const TERMS = {
  dose: ["Dose", "The dry coffee that goes in. 18 g is a common double shot."],
  yield: [
    "Yield",
    "The liquid espresso that comes out, weighed on a scale. Grams, not millilitres, because crema is mostly air.",
  ],
  ratio: ["Brew ratio", "Dose to yield. 18 g in, 36 g out is 1:2, the usual starting point."],
  crema: [
    "Crema",
    "The tan foam on espresso: CO₂ from fresh roasted coffee, emulsified oils and fine solids. Pretty, a little bitter, not proof of a good shot.",
  ],
  extraction: [
    "Extraction",
    "How much of the ground coffee dissolved into the cup. Too little tastes sour and thin; too much tastes bitter and dry. 18–22% is a common reference range, not a rule; taste is the final guide.",
  ],
  tds: [
    "Strength (TDS)",
    "Total dissolved solids: how concentrated the drink is. Espresso is roughly 8–12%; filter coffee is about 1.2–1.5%.",
  ],
  channeling: [
    "Channeling",
    "Water finds a weak path through the puck and rushes through it. Part of the coffee over-extracts, the rest barely extracts, so the shot is sour and bitter at once.",
  ],
  tamp: [
    "Tamp",
    "Pressing the grounds flat and level. Level matters more than force: a tilted bed lets water run down the low side.",
  ],
  wdt: [
    "WDT",
    "Weiss Distribution Technique: stirring the grounds with fine needles to break clumps before tamping, so water flows evenly.",
  ],
  puck: ["Puck", "The spent cake of coffee left in the basket after a shot."],
  portafilter: [
    "Portafilter",
    "The handle with the basket that holds the coffee and locks into the machine.",
  ],
  group: [
    "Group head",
    "Where the portafilter locks in and hot water comes down through a shower screen.",
  ],
  purge: [
    "Purge / flush",
    "A short burst of water or steam to clear old grounds, condensed water or stale heat before you start.",
  ],
  preinfusion: [
    "Pre-infusion",
    "A few seconds of low pressure that wets the puck before full pressure, so it swells evenly and channels less.",
  ],
  bar: [
    "Bar (pressure)",
    "1 bar is close to atmospheric pressure at sea level. Espresso machines commonly brew near 9 bar above atmospheric pressure; recipes and machines vary.",
  ],
  ristretto: [
    "Ristretto",
    'A "restricted" shot: same dose, cut short at about 1:1 to 1:1.5. Usually more concentrated; sweetness and bitterness depend on the coffee and extraction.',
  ],
  lungo: [
    "Lungo",
    'A "long" shot run to about 1:3 or more. Thinner, more bitter, more caffeine extracted.',
  ],
  microfoam: [
    "Microfoam",
    "Milk with bubbles so small you cannot see them. Glossy like wet paint, and well suited to pouring latte art.",
  ],
  stretch: [
    "Stretching",
    "Keeping the steam tip at the surface to pull air into the milk. It makes a soft tearing sound. Do it early, while the milk is still cool.",
  ],
  texture: [
    "Texturing",
    "Sinking the tip so the milk spins in a whirlpool. Big bubbles break into microfoam and the milk heats evenly.",
  ],
  firstcrack: [
    "First crack",
    "The popcorn-like crack as water vapour and gas burst through the bean, at roughly 196–205 °C. Light roasts are dropped soon after.",
  ],
  secondcrack: [
    "Second crack",
    "A quieter, faster crackle around 224 °C as the bean structure breaks down and oils rise to the surface. Dark roast territory.",
  ],
  bloom: [
    "Bloom",
    "The first small pour on fresh grounds. Trapped CO₂ bubbles out, so the rest of the water can extract evenly.",
  ],
  arabica: [
    "Arabica",
    "Coffea arabica: about 56% of the world crop. Grown high, sweeter and more acidic, about half the caffeine of robusta.",
  ],
  robusta: [
    "Robusta",
    "Coffea canephora: about 44% of the world crop. Grown low and hot, hardy, bitter and chocolatey, high in caffeine. Vietnam grows most of it.",
  ],
  washed: ["Washed", "The fruit is stripped off before drying. Clean, bright, tea-like cups."],
  natural: [
    "Natural",
    "The whole cherry dries around the seed. Fruity, heavy, sometimes wine-like.",
  ],
  honey: [
    "Honey",
    "Skin off, sticky fruit layer left on to dry. Sweet and rounded, between washed and natural.",
  ],
  anaerobic: [
    "Anaerobic",
    "Fermented in sealed, oxygen-free tanks before drying. Loud tropical, boozy flavours; loved or hated.",
  ],
  altitude: [
    "Altitude",
    "Higher farms are cooler, so cherries ripen slowly and pack in more sugar and acidity. Some countries grade beans by it.",
  ],
  dial: [
    "Dialing in",
    "Adjusting grind (and sometimes dose) shot by shot until a coffee tastes right. Every new bag needs it.",
  ],
  burr: [
    "Burr grinder",
    "Two toothed rings that crush beans to an even size. Blade grinders chop unevenly, which muddies the cup.",
  ],
  tiger: [
    "Tiger striping",
    'The dark and light mottling in a stream of espresso mid-shot. As the shot runs on, the stream pales ("blonding"), a cue to stop.',
  ],
};

let pop = null,
  popFor = null;
function ensurePop() {
  if (pop) return pop;
  pop = document.createElement("div");
  pop.className = "gw-pop";
  pop.setAttribute("role", "tooltip");
  pop.id = "gw-pop";
  if ("popover" in HTMLElement.prototype) pop.setAttribute("popover", "auto");
  else pop.hidden = true;
  document.body.appendChild(pop);
  pop.addEventListener("toggle", (e) => {
    if (e.newState === "closed") popFor = null;
  });
  return pop;
}
function placePop(btn) {
  const r = btn.getBoundingClientRect(),
    p = pop.getBoundingClientRect();
  let x = r.left + r.width / 2 - p.width / 2;
  x = clamp(x, 12, innerWidth - p.width - 12);
  let y = r.bottom + 10;
  if (y + p.height > innerHeight - 12) y = r.top - p.height - 10;
  pop.style.left = x + "px";
  pop.style.top = Math.max(12, y) + "px";
}
export function showTerm(btn) {
  const t = TERMS[btn.dataset.term];
  if (!t) return;
  ensurePop();
  if (popFor === btn) {
    hideTerm();
    return;
  }
  pop.innerHTML = `<b>${t[0]}</b>${t[1]}`;
  if (pop.showPopover) {
    try {
      pop.hidePopover();
    } catch (e) {}
    pop.showPopover();
  } else pop.hidden = false;
  popFor = btn;
  placePop(btn);
}
export function hideTerm() {
  if (!pop) return;
  if (pop.hidePopover) {
    try {
      pop.hidePopover();
    } catch (e) {}
  } else pop.hidden = true;
  popFor = null;
}
export const term = (key, label) =>
  `<button type="button" class="term" data-term="${key}">${label || TERMS[key][0]}</button>`;

/* ------------------------------------------------------------------ chrome */
export function initChrome() {
  $$(".gw-sound").forEach((b) => {
    b.setAttribute("aria-pressed", String(sound.on));
    b.addEventListener("click", () => {
      sound.set(!sound.on);
      b.setAttribute("aria-pressed", String(sound.on));
      if (sound.on) sound.click();
    });
  });
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".term");
    if (t) {
      e.preventDefault();
      showTerm(t);
      return;
    }
    if (pop && !e.target.closest(".gw-pop") && !pop.showPopover) hideTerm();
  });
  addEventListener(
    "scroll",
    () => {
      if (popFor && !pop.showPopover) hideTerm();
    },
    { passive: true },
  );
  addEventListener("resize", () => popFor && placePop(popFor));
  $$("[data-year]").forEach((n) => (n.textContent = new Date().getFullYear()));
}
