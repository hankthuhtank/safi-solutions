// The bar: grind → tamp → lock in → pull → (water | steam → pour) → serve.
// The shot is simulated: grind size and dose set puck resistance, resistance sets pressure and flow,
// and ratio + resistance + channeling set extraction and strength. Change the grind, taste the change.
import {
  $,
  $$,
  clamp,
  lerp,
  tween,
  wait,
  mix,
  sound,
  term,
  initChrome,
  store,
  reduced,
  easeOut,
  esc,
} from "./core.js";
import { cupSVG } from "./cups.js";

initChrome();

const NS = "http://www.w3.org/2000/svg";
const svg = $("#scene"),
  wrap = $("#sceneWrap"),
  panel = $("#panel"),
  rail = $("#rail"),
  cap = $("#sceneCap");
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const status = document.createElement("p");
status.className = "sr";
status.setAttribute("aria-live", "polite");
document.body.appendChild(status);
const say = (t) => {
  status.textContent = "";
  setTimeout(() => (status.textContent = t), 30);
};

/* ------------------------------------------------------------------ the coffee on the grinder (changes daily) */
const BEANS = [
  {
    name: "Huila",
    country: "Colombia",
    meta: "Washed · medium",
    ideal: 10,
    notes: "panela, red apple, cocoa",
    roast: "#4a2c1d",
  },
  {
    name: "Sidama",
    country: "Ethiopia",
    meta: "Natural · light",
    ideal: 8,
    notes: "blueberry, jasmine, cacao nib",
    roast: "#6a4128",
  },
  {
    name: "Sul de Minas",
    country: "Brazil",
    meta: "Pulped natural · medium-dark",
    ideal: 12,
    notes: "hazelnut, milk chocolate, brown sugar",
    roast: "#3d2418",
  },
  {
    name: "Huehuetenango",
    country: "Guatemala",
    meta: "Washed · medium",
    ideal: 10,
    notes: "toffee, orange, almond",
    roast: "#4a2c1d",
  },
  {
    name: "Nyeri",
    country: "Kenya",
    meta: "Washed · light",
    ideal: 8,
    notes: "blackcurrant, grapefruit, cane sugar",
    roast: "#6a4128",
  },
  {
    name: "Lâm Đồng",
    country: "Vietnam",
    meta: "Fine robusta · medium-dark",
    ideal: 13,
    notes: "dark chocolate, malt, roasted peanut",
    roast: "#35200f",
  },
];
const bean = BEANS[Math.floor(Date.now() / 864e5) % BEANS.length];
$("#bb-name").textContent = bean.name;
$("#bb-country").textContent = bean.country;
$("#bb-meta").textContent = bean.meta.toUpperCase();

/* ------------------------------------------------------------------ drinks this bar can make */
const DRINKS = {
  espresso: {
    n: "Espresso",
    sub: "1:2 · 36 g",
    flow: ["order", "grind", "tamp", "lock", "pull", "serve"],
    rx: "espresso",
    v: "demitasse",
    layers: [
      ["espresso", 30],
      ["crema", 8],
    ],
    k: 0.52,
  },
  americano: {
    n: "Americano",
    sub: "shot + water",
    flow: ["order", "grind", "tamp", "lock", "pull", "water", "serve"],
    rx: "americano",
    v: "glassmug",
    layers: [
      ["americano", 180],
      ["crema", 6],
    ],
    k: 0.9,
  },
  cortado: {
    n: "Cortado",
    sub: "1:1 milk",
    flow: ["order", "grind", "tamp", "lock", "pull", "steam", "pour", "serve"],
    rx: "cortado",
    v: "gibraltar",
    layers: [
      ["espresso", 36],
      ["steamed", 50, "b"],
      ["microfoam", 12, "f"],
    ],
    foam: [5, 16],
    art: "heart",
    k: 0.66,
  },
  flatwhite: {
    n: "Flat white",
    sub: "thin microfoam",
    flow: ["order", "grind", "tamp", "lock", "pull", "steam", "pour", "serve"],
    rx: "flat-white",
    v: "fw",
    layers: [
      ["espresso", 36],
      ["steamed", 100, "b"],
      ["microfoam", 14, "f"],
    ],
    foam: [7, 17],
    art: "tulip",
    k: 0.8,
  },
  cappuccino: {
    n: "Cappuccino",
    sub: "deep foam",
    flow: ["order", "grind", "tamp", "lock", "pull", "steam", "pour", "serve"],
    rx: "cappuccino",
    v: "cap",
    layers: [
      ["espresso", 36],
      ["steamed", 70, "b"],
      ["foam", 60, "f"],
    ],
    foam: [30, 60],
    art: "heart",
    k: 0.9,
  },
  latte: {
    n: "Latte",
    sub: "more milk",
    flow: ["order", "grind", "tamp", "lock", "pull", "steam", "pour", "serve"],
    rx: "latte",
    v: "latte",
    layers: [
      ["espresso", 36],
      ["steamed", 220, "b"],
      ["microfoam", 20, "f"],
    ],
    foam: [14, 28],
    art: "rosetta",
    k: 1,
  },
};
const STEP = {
  order: ["Order", "Pick"],
  grind: ["Grind", "Dose"],
  tamp: ["Tamp", "Level"],
  lock: ["Lock in", "Flush"],
  pull: ["Pull", "Shot"],
  water: ["Water", "Dilute"],
  steam: ["Steam", "Milk"],
  pour: ["Pour", "Art"],
  serve: ["Serve", "Taste"],
};

/* ------------------------------------------------------------------ state */
const fresh = () => ({
  dose: 0,
  wdt: false,
  tilt: 0,
  press: 0,
  tamped: false,
  flushed: false,
  locked: false,
  tared: false,
  shot: null,
  steam: null,
  pour: null,
  water: 0,
  clean: {},
});
const S = Object.assign(
  {
    drink: store.get("drink", "flatwhite"),
    i: 0,
    grind: store.get("grind:" + bean.name, bean.ideal + 4),
    shots: [],
    milk: "whole",
    no: 400 + Math.floor(Math.random() * 500),
  },
  fresh(),
);
if (!DRINKS[S.drink]) S.drink = "flatwhite";
const D = () => DRINKS[S.drink];
const stepId = () => D().flow[S.i];

/* ------------------------------------------------------------------ camera */
const CAMS = {
  wide: [0, 0, 1200, 720],
  prep: [20, 150, 760, 456],
  group: [458, 262, 570, 342],
  steam: [780, 296, 420, 252],
  serve: [0, 0, 1200, 720],
};
let cam = CAMS.wide.slice();
function camTo(name, ms = 900) {
  const to = CAMS[name],
    from = cam.slice();
  return tween(ms, (t) => {
    cam = from.map((v, i) => lerp(v, to[i], t));
    svg.setAttribute("viewBox", cam.map((n) => n.toFixed(1)).join(" "));
  });
}
$("#camWide").addEventListener("click", () => {
  const z = cam[2] > 1100;
  camTo(z ? camFor(stepId()) : "wide", 700);
});
const camFor = (id) =>
  ({ grind: "prep", tamp: "prep", lock: "group", pull: "group", water: "group", steam: "steam" })[
    id
  ] || "wide";

/* ------------------------------------------------------------------ seven-segment displays */
const SEG = {
  0: "abcdef",
  1: "bc",
  2: "abged",
  3: "abgcd",
  4: "fgbc",
  5: "afgcd",
  6: "afgedc",
  7: "abc",
  8: "abcdefg",
  9: "abcdfg",
  "-": "g",
  " ": "",
};
function seg(g, text, { w = 22, h = 36, t = 4.5, gap = 9, on = "#ffb04a" } = {}) {
  let html = "",
    x = 0;
  const chars = [];
  for (const c of String(text)) {
    if (c === "." && chars.length) chars[chars.length - 1].dp = true;
    else chars.push({ c, dp: false });
  }
  for (const { c, dp } of chars) {
    const lit = SEG[c] ?? "";
    const r = (k, X, Y, W, H) =>
      (html += `<rect x="${(x + X).toFixed(1)}" y="${Y.toFixed(1)}" width="${W.toFixed(1)}" height="${H.toFixed(1)}" rx="${(t / 2.4).toFixed(1)}" fill="${on}" opacity="${lit.includes(k) ? 1 : 0.08}"/>`);
    const vh = h / 2 - t * 1.1;
    r("a", t * 0.6, 0, w - t * 1.2, t);
    r("g", t * 0.6, h / 2 - t / 2, w - t * 1.2, t);
    r("d", t * 0.6, h - t, w - t * 1.2, t);
    r("f", 0, t * 0.6, t, vh);
    r("b", w - t, t * 0.6, t, vh);
    r("e", 0, h / 2 + t * 0.5, t, vh);
    r("c", w - t, h / 2 + t * 0.5, t, vh);
    html += `<rect x="${(x + w + gap * 0.25).toFixed(1)}" y="${(h - t).toFixed(1)}" width="${t.toFixed(1)}" height="${t.toFixed(1)}" rx="${(t / 2).toFixed(1)}" fill="${on}" opacity="${dp ? 1 : 0.08}"/>`;
    x += w + gap;
  }
  g.innerHTML = `<g transform="skewX(-6)">${html}</g>`;
}
const timerSeg = $("#timerSeg"),
  doseSeg = $("#doseSeg"),
  scaleSeg = $("#scaleSeg");
const fmt1 = (v) => (Math.max(0, v) < 10 ? " " : "") + Math.max(0, v).toFixed(1);
const showTimer = (s) => seg(timerSeg, fmt1(Math.min(99.9, s)), { w: 26, h: 36, t: 5, gap: 12 });
const showDose = (g) => seg(doseSeg, fmt1(Math.min(99.9, g)), { w: 13, h: 18, t: 2.6, gap: 5 });
const showScale = (g) =>
  seg(scaleSeg, g >= 100 ? String(Math.round(g)).padStart(3, " ") : fmt1(g), {
    w: 11,
    h: 12,
    t: 2,
    gap: 6,
    on: "#ffb04a",
  });
showTimer(0);
showDose(0);
showScale(0);

/* ------------------------------------------------------------------ static scene dressing */
(function dress() {
  // gauge ticks: angle(bar) = -135 + bar * 270/16
  const gt = $("#gaugeTicks");
  let h = "";
  for (let b = 0; b <= 16; b++) {
    const a = ((-135 + (b * 270) / 16) * Math.PI) / 180,
      major = b % 4 === 0,
      r1 = 41,
      r2 = major ? 33 : 37;
    h += `<line x1="${585 + Math.sin(a) * r1}" y1="${330 - Math.cos(a) * r1}" x2="${585 + Math.sin(a) * r2}" y2="${330 - Math.cos(a) * r2}" stroke-width="${major ? 2 : 1.1}"/>`;
    if (major)
      h += `<text x="${585 + Math.sin(a) * 25}" y="${330 - Math.cos(a) * 25 + 3}" text-anchor="middle" font-family="Martian Mono, monospace" font-size="7.5" fill="#2a1a12" stroke="none">${b}</text>`;
  }
  gt.innerHTML = h;
  const arc = (b0, b1, r) => {
    const p = (b) => {
      const a = ((-135 + (b * 270) / 16) * Math.PI) / 180;
      return [585 + Math.sin(a) * r, 330 - Math.cos(a) * r];
    };
    const [x0, y0] = p(b0),
      [x1, y1] = p(b1);
    return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  $("#gaugeZone").setAttribute("d", arc(8, 10, 38));
  // grinder dial ticks
  let d = "";
  for (let i = 0; i < 30; i++) {
    const a = (i * 12 * Math.PI) / 180,
      r2 = i % 5 === 0 ? 26 : 30;
    d += `<line x1="${150 + Math.sin(a) * 34}" y1="${320 - Math.cos(a) * 34}" x2="${150 + Math.sin(a) * r2}" y2="${320 - Math.cos(a) * r2}"/>`;
  }
  $("#dialTicks").innerHTML = d;
  // beans in the hopper
  const hb = $("#hopperBeans");
  let s = "";
  let seed = 3;
  const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 120; i++) {
    const y = 118 + R() * 118,
      x = 86 + R() * 128,
      rot = R() * 180;
    s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6.4" ry="4.6" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${mix(bean.roast, "#1a0d07", R() * 0.4)}" stroke="#120b08" stroke-width=".8"/><path d="M${(x - 4).toFixed(1)} ${y.toFixed(1)}h8" stroke="#120b08" stroke-width=".8" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  hb.innerHTML = s;
  setDial();
})();
function setDial() {
  $("#grindDial").setAttribute("transform", `rotate(${-(S.grind - 1) * 12} 150 320)`);
}
function setNeedle(bar) {
  $("#needle").setAttribute(
    "transform",
    `rotate(${-135 + (clamp(bar, 0, 16) * 270) / 16} 585 330)`,
  );
}

/* ------------------------------------------------------------------ portafilter + tamper positions */
const POS = {
  grinder: [150, 516, 1],
  mat: [350, 557, -1],
  group: [740, 438, 1],
  knock: [1142, 492, 1],
};
let pfAt = POS.grinder.slice(),
  pfRot = 0;
function pfSet([x, y, sx], rot = 0) {
  pfAt = [x, y, sx];
  pfRot = rot;
  $("#pf").setAttribute(
    "transform",
    `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sx.toFixed(3)} 1)`,
  );
}
function pfMove(to, ms = 750, lift = 70) {
  const from = pfAt.slice(),
    r0 = pfRot;
  return tween(ms, (t) => {
    const y = lerp(from[1], to[1], t) - Math.sin(t * Math.PI) * lift;
    pfSet([lerp(from[0], to[0], t), y, lerp(from[2], to[2], t)], lerp(r0, 0, t));
  });
}
pfSet(POS.grinder);
const spouts = $("#pfSpouts");
function setMound(dose, { flat = false, smooth = false } = {}) {
  const m = $("#mound"),
    tex = $("#moundTex"),
    pt = $("#puckTop");
  if (flat) {
    m.setAttribute("d", "M-42 0Q0 0 42 0Z");
    tex.innerHTML = "";
    pt.setAttribute("opacity", 1);
    pt.setAttribute("y", clamp(8 - (dose - 18) * 0.9, 1, 14));
    return;
  }
  pt.setAttribute("opacity", 0);
  const H = clamp((dose / 18) * 17, 0, 30),
    w = 40;
  m.setAttribute(
    "d",
    `M-${w} 1Q-${w * 0.55} ${-H * (smooth ? 0.9 : 1.1)} 0 ${-H}Q${w * 0.55} ${-H * (smooth ? 0.9 : 1.1)} ${w} 1Z`,
  );
  let s = "";
  if (!smooth && dose > 1)
    for (let i = 0; i < Math.min(28, dose * 1.4); i++) {
      const x = (Math.random() - 0.5) * 64,
        y = -Math.random() * H * (1 - Math.abs(x) / 44);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + Math.random() * 1.6).toFixed(1)}"/>`;
    }
  tex.innerHTML = s;
}
setMound(0);
const TAMP_IDLE = [446, 600];
function tamperSet(x, y, rot = 0) {
  $("#tamper").setAttribute(
    "transform",
    `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`,
  );
}

/* ------------------------------------------------------------------ fx: particles + puffs */
const fx = $("#fx");
let particles = [];
let fxRun = false;
function fxLoop() {
  if (fxRun) return;
  fxRun = true;
  let last = performance.now();
  const step = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    particles = particles.filter((p) => {
      p.t += dt;
      p.vy += (p.g ?? 900) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.grow) p.r += p.grow * dt;
      const done = p.t > p.life || (p.floor && p.y > p.floor);
      if (done) {
        p.n.remove();
        p.onLand && p.onLand();
        return false;
      }
      p.n.setAttribute("cx", p.x.toFixed(1));
      p.n.setAttribute("cy", p.y.toFixed(1));
      if (p.grow) p.n.setAttribute("r", p.r.toFixed(1));
      if (p.fade) p.n.setAttribute("opacity", (1 - p.t / p.life) * (p.o ?? 1));
      return true;
    });
    if (particles.length) requestAnimationFrame(step);
    else fxRun = false;
  };
  requestAnimationFrame(step);
}
function spawn(o) {
  if (reduced() && particles.length > 30) return;
  const n = el("circle", { r: o.r, fill: o.fill, opacity: o.o ?? 1 }, o.layer || fx);
  if (o.filter) n.setAttribute("filter", o.filter);
  particles.push(Object.assign({ t: 0, vx: 0, vy: 0, n }, o));
  fxLoop();
}
function puff(x, y, n = 6, big = false) {
  for (let i = 0; i < n; i++)
    spawn({
      x: x + (Math.random() - 0.5) * 10,
      y,
      vx: (Math.random() - 0.5) * 60,
      vy: -40 - Math.random() * 80,
      g: -30,
      r: big ? 10 : 5,
      grow: big ? 40 : 22,
      life: big ? 1.4 : 0.9,
      fill: "#ffffff",
      o: 0.55,
      fade: true,
      filter: "url(#f-soft)",
    });
}

/* ------------------------------------------------------------------ hold-to-act helper */
function holdable(node, { start, end }) {
  let on = false;
  node._hold = true;
  const stop = () => {
    if (!on) return;
    on = false;
    removeEventListener("pointerup", stop);
    removeEventListener("blur", stop);
    end();
  };
  const go = (e) => {
    if (on) return;
    on = true;
    e && e.preventDefault();
    addEventListener("pointerup", stop);
    addEventListener("blur", stop);
    start();
  };
  node.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    try {
      node.setPointerCapture(e.pointerId);
    } catch (x) {}
    go(e);
  });
  node.addEventListener("pointerup", stop);
  node.addEventListener("pointercancel", stop);
  node.addEventListener("lostpointercapture", stop);
  node.addEventListener("keydown", (e) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) go(e);
  });
  node.addEventListener("keyup", (e) => {
    if (e.key === " " || e.key === "Enter") stop();
  });
  node.addEventListener("contextmenu", (e) => e.preventDefault());
  return { stop };
}
// Space anywhere outside a control presses the current step's main button.
// (When the button itself has focus, its own handlers or native activation do the work.)
let mainBtn = null;
document.addEventListener("keydown", (e) => {
  if (e.key !== " " || e.repeat || !mainBtn || !document.contains(mainBtn) || mainBtn.disabled)
    return;
  const t = e.target;
  if (t !== document.body && !svg.contains(t)) return;
  e.preventDefault();
  mainBtn.focus();
  if (mainBtn._hold) mainBtn.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
  else mainBtn.click();
});

/* ------------------------------------------------------------------ rail + captions */
function drawRail() {
  rail.innerHTML = D()
    .flow.map(
      (id, i) =>
        `<li><div class="tk${i < S.i ? " done" : i > S.i ? " later" : ""}"${i === S.i ? ' aria-current="step"' : ""}><span>${String(i + 1).padStart(2, "0")} · ${STEP[id][1]}</span><b>${STEP[id][0]}</b></div></li>`,
    )
    .join("");
  const cur = rail.querySelector("[aria-current]");
  if (cur)
    cur.parentElement.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: reduced() ? "auto" : "smooth",
    });
}
function caption() {
  const bits = [`${bean.name} · <b>${bean.meta.split(" · ")[1]}</b>`, `Grind <b>${S.grind}</b>`];
  if (S.dose) bits.push(`Dose <b>${S.dose.toFixed(1)} g</b>`);
  if (S.shot && S.shot.done)
    bits.push(`Shot <b>${S.shot.y.toFixed(1)} g · ${S.shot.t.toFixed(1)} s</b>`);
  cap.innerHTML = bits.map((b) => `<span>${b}</span>`).join("");
}

/* ------------------------------------------------------------------ panel shell */
const ICO = {
  next: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  redo: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg>',
};
function render(title, body, { why = "", next = "Next", canNext = false, back = true } = {}) {
  const n = D().flow.length;
  panel.innerHTML = `<div class="t-no"><span>Ticket ${S.no} · ${esc(D().n)}</span><span>${S.i + 1}/${n}</span></div>
    <h2>${title}</h2>${body}
    ${why ? `<details class="why"><summary>Why</summary><p>${why}</p></details>` : ""}
    <div class="foot">${back && S.i > 0 ? `<button class="btn ghost small" type="button" data-act="back">${ICO.back}Back</button>` : "<span></span>"}
    ${next ? `<button class="btn${canNext ? " red" : ""}" type="button" data-act="next"${canNext ? "" : " disabled"}>${next}${ICO.next}</button>` : ""}</div>`;
  const nb = panel.querySelector('[data-act="next"]');
  if (nb) nb.addEventListener("click", () => go(S.i + 1));
  const bb = panel.querySelector('[data-act="back"]');
  if (bb) bb.addEventListener("click", () => go(S.i - 1, true));
}
const enableNext = (on = true) => {
  const b = panel.querySelector('[data-act="next"]');
  if (b) {
    b.disabled = !on;
    b.classList.toggle("red", on);
  }
};
const q = (s) => panel.querySelector(s);

/* ------------------------------------------------------------------ navigation */
let leaving = null;
async function go(i, backwards = false) {
  if (leaving) leaving();
  leaving = null;
  mainBtn = null;
  const flow = D().flow;
  S.i = clamp(i, 0, flow.length - 1);
  const id = flow[S.i];
  if (backwards) rewind(id);
  drawRail();
  caption();
  wrap.classList.toggle("top-view", id === "pour" || id === "serve");
  if (id !== "pour" && id !== "serve") camTo(camFor(id));
  STEPS[id]();
}
// stepping back resets what the later steps did, so the scene and state stay honest
function rewind(id) {
  const order = ["order", "grind", "tamp", "lock", "pull", "water", "steam", "pour", "serve"];
  const at = order.indexOf(id);
  if (at <= order.indexOf("pour")) S.pour = null;
  if (at <= order.indexOf("steam")) {
    S.steam = null;
    resetPitcher();
  }
  if (at <= order.indexOf("water")) {
    S.water = 0;
    setMug(0, 0);
    $("#mug").setAttribute("opacity", 0);
  }
  if (at <= order.indexOf("pull")) {
    S.shot = null;
    setShot(0, 0);
    showTimer(0);
    setNeedle(0);
  }
  if (at <= order.indexOf("lock")) {
    S.locked = S.tared = S.flushed = false;
    $("#cup").setAttribute("opacity", 0);
    showScale(0);
    if (at < order.indexOf("lock")) {
    }
  }
  if (at <= order.indexOf("tamp")) {
    S.tamped = false;
    S.wdt = false;
    S.tilt = 0;
    S.press = 0;
    pfSet(at <= order.indexOf("grind") ? POS.grinder : POS.mat);
    setMound(S.dose);
    spouts.style.opacity = at <= order.indexOf("grind") ? 1 : 0;
  }
  if (at <= order.indexOf("grind")) {
    pfSet(POS.grinder);
    spouts.style.opacity = 1;
  }
}

/* ================================================================== steps */
const STEPS = {};

STEPS.order = () => {
  const cards = Object.entries(DRINKS)
    .map(
      ([k, d]) =>
        `<button type="button" data-d="${k}" aria-pressed="${k === S.drink}">${cupSVG({ id: "pick-" + k, n: d.n, v: d.v, layers: d.layers })}<b>${d.n}</b><small>${d.sub}</small></button>`,
    )
    .join("");
  render(
    "What are we making?",
    `<p class="say">Every one starts with the same <b>double shot</b>. Milk drinks add steaming and a pour.</p><div class="drinks-pick">${cards}</div>`,
    {
      why: "Espresso is the base of the whole menu. A cortado, flat white, cappuccino and latte are the same shot with more milk and different foam.",
      next: "Start",
      canNext: true,
      back: false,
    },
  );
  panel.querySelectorAll(".drinks-pick button").forEach((b) =>
    b.addEventListener("click", () => {
      S.drink = b.dataset.d;
      store.set("drink", S.drink);
      sound.click();
      panel
        .querySelectorAll(".drinks-pick button")
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      panel.querySelector(".t-no span").textContent = `Ticket ${S.no} · ${D().n}`;
      panel.querySelector(".t-no span:last-child").textContent = `1/${D().flow.length}`;
      drawRail();
    }),
  );
};

STEPS.grind = () => {
  render(
    "Grind & dose",
    `<p class="say">Set the ${term("burr", "grind")}, then hold to grind <b>18 g</b> into the basket.</p>
    <div><label class="range-ends" for="grindIn"><span>Finer</span><span>Grind <b class="num" id="gNum">${S.grind}</b></span><span>Coarser</span></label>
    <input class="dial" id="grindIn" type="range" min="1" max="30" step="1" value="${S.grind}" aria-label="Grind setting, 1 finest to 30 coarsest"></div>
    <div class="readouts"><div id="roDose"><small>Dose</small><b><span id="doseV">${S.dose.toFixed(1)}</span><i>g</i></b></div><div><small>Target</small><b>18.0<i>g</i></b></div><div><small>Like</small><b style="font-size:13px;line-height:1.35;margin-top:5px">fine table salt</b></div></div>
    <div class="row-btns"><button class="btn hold" type="button" id="grindGo">Hold to grind <kbd>Space</kbd></button><button class="btn ghost small" type="button" id="dump">Dump</button></div>
    <p class="muted" id="gMsg" style="font-size:14px;min-height:1.5em"></p>`,
    {
      why: "Finer grounds slow the water and extract more; coarser lets it run faster and extract less. A new bag almost never pulls right on the first try, so you will taste and adjust.",
      canNext: S.dose > 14,
    },
  );
  const gi = q("#grindIn");
  const fill = () => gi.style.setProperty("--fill", ((S.grind - 1) / 29) * 100 + "%");
  fill();
  gi.addEventListener("input", () => {
    S.grind = +gi.value;
    q("#gNum").textContent = S.grind;
    fill();
    setDial();
    caption();
    store.set("grind:" + bean.name, S.grind);
    sound.tick();
  });
  const btn = q("#grindGo");
  mainBtn = btn;
  let snd = null,
    raf = 0,
    last = 0,
    jig = 0;
  const msg = () => {
    const d = S.dose,
      m = q("#gMsg");
    const ro = q("#roDose");
    ro.className = Math.abs(d - 18) <= 0.3 ? "ok" : d > 19 || (d < 17 && d > 0) ? "warn" : "";
    m.textContent =
      d === 0
        ? ""
        : Math.abs(d - 18) <= 0.3
          ? "Right on. 18 g is a standard double."
          : d < 17
            ? `${(18 - d).toFixed(1)} g short. A light dose runs fast and thin.`
            : d > 19.5
              ? "Too much. An overfull basket hits the shower screen and chokes."
              : d > 18.3
                ? "A touch heavy: it will run a little slower."
                : "Close enough. Pros aim for ±0.2 g.";
    enableNext(d > 14);
  };
  const hopper = $("#hopperBeans");
  holdable(btn, {
    start() {
      btn.classList.add("on");
      snd = sound.grind();
      last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        S.dose = Math.min(26, S.dose + dt * 2.7);
        showDose(S.dose);
        setMound(S.dose);
        q("#doseV").textContent = S.dose.toFixed(1);
        btn.style.setProperty("--p", clamp(S.dose / 18, 0, 1));
        hopper.setAttribute(
          "transform",
          `translate(${(Math.random() - 0.5) * 1.4} ${(Math.random() - 0.5) * 1.2})`,
        );
        if ((jig += dt) > 0.016) {
          jig = 0;
          for (let k = 0; k < 2; k++)
            spawn({
              x: 150 + (Math.random() - 0.5) * 10,
              y: 494,
              vy: 40,
              vx: (Math.random() - 0.5) * 30,
              r: 0.9 + Math.random() * 1.3,
              fill: Math.random() < 0.5 ? "#4a2c1d" : "#6a4128",
              floor: 516 - S.dose * 0.9,
              life: 1,
              layer: $("#groundsFall"),
            });
        }
        caption();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
    end() {
      cancelAnimationFrame(raf);
      btn.classList.remove("on");
      snd && snd.stop();
      hopper.removeAttribute("transform");
      msg();
      say(`Dose ${S.dose.toFixed(1)} grams`);
    },
  });
  q("#dump").addEventListener("click", () => {
    S.dose = 0;
    setMound(0);
    showDose(0);
    q("#doseV").textContent = "0.0";
    btn.style.setProperty("--p", 0);
    msg();
    sound.knock();
  });
  $("#grindBtn").onpointerdown = (e) => {
    btn.dispatchEvent(new PointerEvent("pointerdown", e));
  };
  $("#grindBtn").onpointerup = (e) => {
    btn.dispatchEvent(new PointerEvent("pointerup", e));
  };
  msg();
};

STEPS.tamp = async () => {
  render(
    "Distribute & tamp",
    `<p class="say">${term("wdt", "Stir out clumps")}, then hold to press. Let go when the bubble is <b>in the green</b>.</p>
    <div class="level" id="level" style="--b:.5" aria-hidden="true"><i></i></div>
    <div><div class="meter" aria-hidden="true"><span class="zone" style="left:55%;width:35%"></span><i id="pressV"></i></div><div class="meter-l"><span>Pressure</span><span>firm ≈ 15–20 kg</span></div></div>
    <div class="row-btns"><button class="btn ghost small" type="button" id="wdt">${S.wdt ? "Stirred ✓" : "Stir (WDT)"}</button><button class="btn hold" type="button" id="tampGo">Hold to tamp <kbd>Space</kbd></button></div>
    <p class="muted" id="tMsg" style="font-size:14px;min-height:1.5em"></p>`,
    {
      why: "Water takes the easiest path. A tilted or clumpy bed creates a channel, so part of the puck over-extracts while the rest barely gets wet. Level beats force: about 15–20 kg is plenty, and leaning harder changes little.",
      canNext: S.tamped,
    },
  );
  if (pfAt[0] !== POS.mat[0]) {
    spouts.style.opacity = 0;
    await pfMove(POS.mat, 800, 90);
  }
  const btn = q("#tampGo");
  mainBtn = btn;
  let raf = 0,
    t0 = 0,
    b = 0.5;
  const lvl = q("#level"),
    pv = q("#pressV");
  q("#wdt").addEventListener("click", async (e) => {
    const w = e.currentTarget;
    if (S.wdt) return;
    w.disabled = true;
    sound.click();
    const tool = el("g", {}, fx);
    tool.innerHTML =
      '<path d="M0 -60V0M-4 -60V-4M4 -60V-4" stroke="#55504c" stroke-width="1.2"/><rect x="-9" y="-80" width="18" height="22" rx="5" fill="#b3362b" stroke="#2a1a12" stroke-width="1.6"/>';
    await tween(
      1300,
      (t) => {
        const a = t * Math.PI * 6;
        tool.setAttribute(
          "transform",
          `translate(${350 + Math.cos(a) * 26} ${555 + Math.sin(a) * 3})`,
        );
        if (Math.random() < 0.3) sound.tick();
      },
      (x) => x,
    );
    tool.remove();
    S.wdt = true;
    setMound(S.dose, { smooth: true });
    w.textContent = "Stirred ✓";
    say("Grounds stirred evenly");
  });
  holdable(btn, {
    start() {
      t0 = performance.now();
      btn.classList.add("on");
      const ph = Math.random() * 6;
      tween(
        180,
        (t) =>
          tamperSet(
            lerp(TAMP_IDLE[0], 350, t),
            lerp(TAMP_IDLE[1], 552, t) - Math.sin(t * Math.PI) * 60,
          ),
        (x) => x,
      );
      const tick = (now) => {
        const s = (now - t0) / 1000;
        S.press = clamp(s / 1.1, 0, 1.2);
        b = 0.5 + 0.3 * Math.sin(s * 1.25 + ph) + 0.1 * Math.sin(s * 2.7 + ph * 2);
        lvl.style.setProperty("--b", b.toFixed(3));
        pv.parentElement.style.setProperty("--v", clamp(S.press / 1.2, 0, 1));
        pv.style.width = clamp(S.press / 1.2, 0, 1) * 100 + "%";
        btn.style.setProperty("--p", clamp(S.press, 0, 1));
        if (s > 0.18) tamperSet(350, 552 + Math.min(8, S.press * 8), (b - 0.5) * 18);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
    async end() {
      cancelAnimationFrame(raf);
      btn.classList.remove("on");
      sound.tamp();
      const off = Math.abs(b - 0.5);
      S.tilt = clamp((off - 0.04) * 2.2, 0, 1);
      S.tamped = true;
      setMound(S.dose, { flat: true });
      const m = q("#tMsg");
      m.textContent =
        S.press < 0.55
          ? "Too light: the bed is still loose. Press longer."
          : off <= 0.12
            ? `Level${S.wdt ? " and even" : ""}. Water will flow through evenly.`
            : off <= 0.22
              ? "Slight tilt. Expect a little uneven flow."
              : "Tilted. Water will rush down the low side.";
      say(m.textContent);
      enableNext(true);
      await tween(
        380,
        (t) =>
          tamperSet(
            lerp(350, TAMP_IDLE[0], t),
            lerp(560, TAMP_IDLE[1], t) - Math.sin(t * Math.PI) * 60,
            lerp((b - 0.5) * 18, 0, t),
          ),
        (x) => x,
      );
    },
  });
  $("#tamperHit").onpointerdown = (e) => btn.dispatchEvent(new PointerEvent("pointerdown", e));
  $("#tamperHit").onpointerup = (e) => btn.dispatchEvent(new PointerEvent("pointerup", e));
  leaving = () => {
    $("#tamperHit").onpointerdown = $("#tamperHit").onpointerup = null;
  };
};

STEPS.lock = () => {
  const tick = (k) => (S[k] ? " ✓" : "");
  render(
    "Flush & lock in",
    `<p class="say">${term("purge", "Flush")} the ${term("group", "group")}, lock the ${term("portafilter")} in, then set the cup on the scale and tare.</p>
    <div class="row-btns" style="flex-direction:column;align-items:stretch">
      <button class="btn ghost" type="button" id="flushB">1 · Flush the group${tick("flushed")}</button>
      <button class="btn ghost" type="button" id="lockB">2 · Lock it in${tick("locked")}</button>
      <button class="btn ghost" type="button" id="tareB" ${S.locked ? "" : "disabled"}>3 · Cup on, tare to zero${tick("tared")}</button>
    </div>`,
    {
      why: "Flushing rinses old grounds off the shower screen and settles the temperature. Taring zeroes the scale so it counts only the espresso, not the cup. Then pull straight away: a puck sitting under a hot group starts to cook.",
      canNext: S.locked && S.tared,
    },
  );
  q("#flushB").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    const p = sound.pump();
    $("#flush").setAttribute("opacity", 1);
    if (S.locked) {
      /* flushing with the portafilter in just wets the puck */
    }
    await wait(1400);
    $("#flush").setAttribute("opacity", 0);
    p.stop();
    S.flushed = true;
    b.textContent = "1 · Flush the group ✓";
    b.disabled = false;
    say("Group flushed");
  });
  q("#lockB").addEventListener("click", async (e) => {
    if (S.locked) return;
    const b = e.currentTarget;
    b.disabled = true;
    sound.click();
    await pfMove([POS.group[0], POS.group[1] + 14, 1], 900, 80);
    await tween(260, (t) => pfSet([POS.group[0], POS.group[1] + 14 - 14 * t, 1], -9 * (1 - t)));
    sound.clunk();
    spouts.style.opacity = 1;
    S.locked = true;
    b.textContent = "2 · Lock it in ✓";
    b.disabled = false;
    q("#tareB").disabled = false;
    say("Portafilter locked in");
  });
  q("#tareB").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    const c = $("#cup");
    await tween(380, (t) => {
      c.setAttribute("opacity", t);
      c.setAttribute("transform", `translate(0 ${(-20 * (1 - t)).toFixed(1)})`);
    });
    showScale(94.6);
    sound.tick();
    await wait(500);
    showScale(0);
    sound.click();
    S.tared = true;
    b.textContent = "3 · Cup on, tare to zero ✓";
    b.disabled = false;
    enableNext(S.locked);
    say("Scale tared");
  });
  // the paddle is also a shortcut to the pull once everything is ready
};

/* --------------------------------------------- the shot */
function setShot(y, crema, blond = 0) {
  const h = clamp(y / 62, 0, 1) * 58,
    top = 563 - h;
  const L = $("#shotLiquid"),
    T = $("#shotTiger");
  L.setAttribute("y", top.toFixed(1));
  L.setAttribute("height", h.toFixed(1));
  const ct = h ? clamp(crema / h, 0, 0.6) : 0;
  $("#shot-crema").setAttribute("offset", ct.toFixed(3));
  $("#shot-top").setAttribute("stop-color", mix("#c88a4c", "#e2bf8a", blond));
  T.setAttribute("y", top.toFixed(1));
  T.setAttribute("height", (h * ct).toFixed(1));
}
function shotModel() {
  // resistance: 1 = this coffee at its ideal grind with 18 g and a level, even bed
  const r =
    Math.exp(-(S.grind - bean.ideal) * 0.12) *
    Math.pow(Math.max(S.dose, 8) / 18, 1.4) *
    (1 - 0.35 * channel());
  return { r, P: 9 * clamp(0.45 + 0.55 * r, 0.38, 1.08), t0: 3 + 4.5 * r, q0: 1.85 / r };
}
const channel = () => clamp(S.tilt * 0.9 + (S.wdt ? 0 : 0.12) + (S.press < 0.55 ? 0.18 : 0), 0, 1);
function evaluate(shot) {
  const R = shot.y / Math.max(S.dose, 1),
    m = shotModel();
  const ch = channel();
  const EY = 20 + 5 * Math.log(R / 2) + 5 * Math.log(m.r) - 2.4 * ch;
  const TDS = (EY * S.dose) / Math.max(shot.y, 1);
  let v;
  if (shot.y < 8)
    v = {
      k: "bad",
      t: "Barely a shot.",
      d: "Almost nothing came through. The grind is far too fine: go a few steps coarser.",
      fix: Math.min(30, S.grind + 4),
    };
  else if (ch >= 0.4)
    v = {
      k: "bad",
      t: "Sour and bitter at once.",
      d: "That is channeling: water rushed through a weak spot. Keep the grind, fix the puck: stir and tamp level.",
      fix: S.grind,
    };
  else if (EY < 18)
    v = {
      k: "bad",
      t: "Sour and thin.",
      d: `Under-extracted${shot.t < 23 ? ": it ran fast" : ""}. Grind finer to slow it down and pull out more sweetness.`,
      fix: Math.max(1, S.grind - Math.max(1, Math.round((18.8 - EY) / 1.1))),
    };
  else if (EY > 22.2)
    v = {
      k: "bad",
      t: "Bitter and drying.",
      d: `Over-extracted${shot.t > 34 ? ": it ran slow" : ""}. Grind coarser so water passes faster, or stop earlier.`,
      fix: Math.min(30, S.grind + Math.max(1, Math.round((EY - 21.4) / 1.1))),
    };
  else if (TDS > 12.8)
    v = {
      k: "good",
      t: "Rich and syrupy.",
      d: `A ${term("ristretto", "ristretto")}-style shot: intense, sweet, short. Lovely under milk.`,
      fix: S.grind,
    };
  else if (TDS < 7.6)
    v = {
      k: "",
      t: "Balanced but thin.",
      d: `Extracted well, just watery: a ${term("lungo", "lungo")}. Stop nearer 36 g for more body.`,
      fix: S.grind,
    };
  else
    v = {
      k: "good",
      t: "Sweet and balanced.",
      d: `Dialed in. Tastes like ${bean.notes}.`,
      fix: S.grind,
    };
  const score = Math.round(
    clamp(
      100 - Math.abs(EY - 20) * 11 - Math.max(0, Math.abs(TDS - 10) - 1.6) * 7 - ch * 30,
      0,
      100,
    ),
  );
  return Object.assign({ R, EY, TDS, ch, score }, v);
}
function compass(list) {
  const X = (e) => 20 + ((clamp(e, 14, 26) - 14) / 12) * 160,
    Y = (t) => 180 - ((clamp(t, 5, 15) - 5) / 10) * 160;
  let dots = "";
  list.forEach((s, i) => {
    const last = i === list.length - 1;
    if (i)
      dots += `<line x1="${X(list[i - 1].ev.EY)}" y1="${Y(list[i - 1].ev.TDS)}" x2="${X(s.ev.EY)}" y2="${Y(s.ev.TDS)}" stroke="#2a1a12" stroke-opacity=".3" stroke-dasharray="3 3"/>`;
    dots += `<circle cx="${X(s.ev.EY)}" cy="${Y(s.ev.TDS)}" r="${last ? 7 : 4}" fill="${last ? "#b3362b" : "#2a1a12"}" fill-opacity="${last ? 1 : 0.35}" stroke="#fbf7ef" stroke-width="2"/>`;
  });
  return `<svg class="compass" viewBox="0 0 200 200" role="img" aria-label="Shot on the espresso compass: extraction ${list.at(-1).ev.EY.toFixed(1)} percent, strength ${list.at(-1).ev.TDS.toFixed(1)} percent">
    <rect x="20" y="20" width="160" height="160" rx="10" fill="#fbf7ef" stroke="#2a1a12" stroke-opacity=".2"/>
    <rect x="${X(18)}" y="${Y(12)}" width="${X(22) - X(18)}" height="${Y(8) - Y(12)}" rx="6" fill="#5e6b45" fill-opacity=".22" stroke="#5e6b45" stroke-opacity=".5"/>
    <line x1="100" y1="22" x2="100" y2="178" stroke="#2a1a12" stroke-opacity=".12"/><line x1="22" y1="100" x2="178" y2="100" stroke="#2a1a12" stroke-opacity=".12"/>
    <g font-family="Martian Mono, monospace" font-size="8" fill="#6b5546" letter-spacing="1"><text x="100" y="14" text-anchor="middle">STRONG</text><text x="100" y="196" text-anchor="middle">WEAK</text><text x="8" y="103" text-anchor="middle" transform="rotate(-90 8 100)">SOUR</text><text x="192" y="103" text-anchor="middle" transform="rotate(90 192 100)">BITTER</text></g>
    ${dots}</svg>`;
}

let pump = null,
  simRaf = 0;
STEPS.pull = () => {
  const done = S.shot && S.shot.done;
  render(
    "Pull the shot",
    `<p class="say">Start the pump. Aim for <b>36 g</b> in about <b>25–30 s</b>. You decide when to stop.</p>
    <div class="readouts" id="ro"><div id="roT"><small>Time</small><b><span id="vT">0.0</span><i>s</i></b></div><div id="roY"><small>Yield</small><b><span id="vY">0.0</span><i>g</i></b></div><div id="roP"><small>Pressure</small><b><span id="vP">0.0</span><i>bar</i></b></div></div>
    <p class="muted" id="cue" style="font-size:14.5px;min-height:1.5em">Watch for the first drips, then ${term("tiger", "tiger striping")}.</p>
    <div class="row-btns"><button class="btn red" type="button" id="pullGo">${done ? "Pull again" : "Start shot"} <kbd>Space</kbd></button></div>
    <div id="result"></div>`,
    {
      why: `Espresso is roughly 9 ${term("bar", "bar")} pushing 90–96 °C water through the puck. The ${term("ratio", "ratio")} sets strength; grind sets how much flavour comes out in that time (${term("extraction")}).`,
      canNext: !!done,
    },
  );
  const btn = q("#pullGo");
  mainBtn = btn;
  btn.addEventListener("click", () => (S.shot && S.shot.running ? stopShot() : startShot()));
  $("#paddleHit").onclick = () => btn.click();
  if (done) showResult();
  leaving = () => {
    $("#paddleHit").onclick = null;
    if (S.shot && S.shot.running) stopShot(true);
  };
};
function startShot() {
  const m = shotModel();
  S.shot = { t: 0, y: 0, p: 0, running: true, done: false, m, stopAt: null, cream: 0 };
  setShot(0, 0);
  q("#result").innerHTML = "";
  enableNext(false);
  const btn = q("#pullGo");
  btn.innerHTML = "Stop <kbd>Space</kbd>";
  btn.classList.remove("red");
  tween(240, (t) =>
    $("#paddle").setAttribute("transform", `translate(740 236) rotate(${lerp(-38, 38, t)})`),
  );
  sound.click();
  pump = sound.pump();
  say("Shot started");
  let last = performance.now();
  const L = $("#streamL"),
    R = $("#streamR"),
    A = $("#st-a"),
    B = $("#st-b"),
    drips = $("#drips");
  const SPEED = 1.5;
  const tick = (now) => {
    const sh = S.shot;
    if (!sh) return;
    const dt = Math.min(0.05, (now - last) / 1000) * SPEED;
    last = now;
    const { r, P, t0, q0 } = sh.m;
    if (sh.running) sh.t += dt;
    const ts = sh.t;
    // pressure: pre-infusion to 3 bar, then ramp to the puck's peak; decays after stop
    let target =
      ts < 4
        ? (3 * ts) / 4
        : ts < 7
          ? lerp(3, P, (ts - 4) / 3)
          : P * (1 - 0.012 * Math.max(0, ts - 18));
    if (!sh.running) target = 0;
    sh.p = lerp(sh.p, target, clamp(dt * (sh.running ? 6 : 4), 0, 1));
    // flow: nothing until first drips, then ramps; channeling adds spurts
    let flow = 0;
    if (ts > t0)
      flow =
        q0 *
        clamp((ts - t0) / 2.5, 0, 1) *
        (1 + 0.012 * (ts - t0)) *
        (1 + channel() * 0.5 * (Math.random() < 0.08 ? 3 : 1));
    if (!sh.running) flow *= clamp(sh.p / 3, 0, 1);
    sh.y += flow * dt;
    // visuals
    setNeedle(sh.p);
    showTimer(sh.t);
    showScale(sh.y);
    q("#vT") && (q("#vT").textContent = sh.t.toFixed(1));
    q("#vY") && (q("#vY").textContent = sh.y.toFixed(1));
    q("#vP") && (q("#vP").textContent = sh.p.toFixed(1));
    const prog = ((sh.y / Math.max(S.dose, 1)) * Math.pow(r, -0.3)) / 2.5;
    const base =
      prog < 0.15
        ? "#2a120a"
        : prog < 0.65
          ? mix("#2a120a", "#7a3f1c", (prog - 0.15) / 0.5)
          : mix("#7a3f1c", "#d1a06a", clamp((prog - 0.65) / 0.5, 0, 1));
    const tig = prog > 0.2 && prog < 0.9;
    A.setAttribute("stop-color", tig && Math.random() < 0.5 ? mix(base, "#e0a868", 0.4) : base);
    B.setAttribute("stop-color", tig && Math.random() < 0.5 ? mix(base, "#1a0904", 0.4) : base);
    const surf = 563 - clamp(sh.y / 62, 0, 1) * 58;
    const w = flow > 0.35 ? clamp(0.8 + flow * 1.3, 1, 5.5) : 0;
    const wob = (Math.random() - 0.5) * 1.4;
    [L, R].forEach((s, i) => {
      const x = i ? 747 : 733;
      s.setAttribute("d", `M${x} 486Q${x + wob} ${(486 + surf) / 2} ${x + (i ? -2 : 2)} ${surf}`);
      s.setAttribute("stroke-width", w.toFixed(2));
    });
    if (flow > 0.02 && flow <= 0.35 && Math.random() < flow * 1.5)
      [733, 747].forEach((x) =>
        spawn({ x, y: 488, vy: 60, r: 1.8, fill: base, floor: surf, life: 1, layer: drips }),
      );
    if (channel() > 0.3 && flow > 0.5 && Math.random() < 0.05)
      spawn({
        x: 740,
        y: 488,
        vx: (Math.random() - 0.5) * 220,
        vy: -30,
        r: 1.4,
        fill: base,
        floor: 566,
        life: 0.8,
      });
    sh.cream = clamp(4 + sh.y * 0.16, 0, 14) * (prog > 1 ? 0.8 : 1);
    setShot(sh.y, sh.cream, clamp(prog - 0.7, 0, 1));
    // coaching cue
    const cue = q("#cue");
    if (cue && sh.running)
      cue.textContent =
        ts < t0
          ? ts < 4
            ? `${"Pre-infusion"}: soaking the puck at low pressure…`
            : "Pressure building…"
          : sh.y < 4
            ? "First drips. Dark and slow is good."
            : prog < 0.65
              ? "Tiger striping: the good part."
              : prog < 0.95
                ? "Turning blonde. Get ready to stop."
                : "Pale and watery now. Stop!";
    const roY = q("#roY");
    if (roY)
      roY.className = Math.abs(sh.y - S.dose * 2) <= 2 ? "ok" : sh.y > S.dose * 2 + 6 ? "warn" : "";
    const roT = q("#roT");
    if (roT) roT.className = sh.t >= 25 && sh.t <= 31 ? "ok" : sh.t > 36 ? "warn" : "";
    if (sh.running && (sh.y > 70 || sh.t > 70)) {
      stopShot();
      return;
    }
    if (!sh.running && sh.p < 0.15 && flow < 0.02) {
      finishShot();
      return;
    }
    simRaf = requestAnimationFrame(tick);
  };
  simRaf = requestAnimationFrame(tick);
}
function stopShot(silent) {
  const sh = S.shot;
  if (!sh || !sh.running) return;
  sh.running = false;
  pump && pump.stop();
  pump = null;
  tween(240, (t) =>
    $("#paddle").setAttribute("transform", `translate(740 236) rotate(${lerp(38, -38, t)})`),
  );
  if (silent) {
    cancelAnimationFrame(simRaf);
    finishShot(true);
  }
  const btn = q("#pullGo");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Settling…";
  }
}
function finishShot(silent) {
  cancelAnimationFrame(simRaf);
  const sh = S.shot;
  sh.done = true;
  sh.running = false;
  ["#streamL", "#streamR"].forEach((s) => $(s).setAttribute("stroke-width", 0));
  setNeedle(0);
  sh.ev = evaluate(sh);
  S.shots.push({ t: sh.t, y: sh.y, ev: sh.ev, grind: S.grind });
  caption();
  // crema settles
  tween(1600, (t) => setShot(sh.y, lerp(sh.cream, sh.cream * 0.7, t), clamp(t * 0.3, 0, 0.3)));
  if (!silent) {
    showResult();
    say(`${sh.y.toFixed(1)} grams in ${sh.t.toFixed(1)} seconds. ${sh.ev.t}`);
    sound.chime();
  }
}
function showResult() {
  const sh = S.shot,
    ev = sh.ev,
    box = q("#result");
  if (!box) return;
  const btn = q("#pullGo");
  btn.disabled = false;
  btn.innerHTML = "Pull again <kbd>Space</kbd>";
  btn.classList.remove("red");
  box.innerHTML = `<div class="verdict ${ev.k}" style="margin-top:4px"><span class="dot"></span><div><b>${ev.t}</b><p>${ev.d}</p></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;margin-top:12px">
      ${compass(S.shots.slice(-5))}
      <div class="num" style="font-size:12px;line-height:1.9">Ratio <b>1:${ev.R.toFixed(1)}</b><br>${term("extraction", "Extraction")} <b>${ev.EY.toFixed(1)}%</b><br>${term("tds", "Strength")} <b>${ev.TDS.toFixed(1)}%</b><br>Score <b>${ev.score}</b></div>
    </div>
    <div style="margin-top:12px"><label class="range-ends" for="regrind"><span>Finer</span><span>Next grind <b class="num" id="rgN">${ev.fix}</b>${ev.fix !== S.grind ? " (suggested)" : ""}</span><span>Coarser</span></label>
    <input class="dial" id="regrind" type="range" min="1" max="30" value="${ev.fix}" aria-label="Grind for the next shot"></div>`;
  const rg = q("#regrind");
  const fill = () => rg.style.setProperty("--fill", ((rg.value - 1) / 29) * 100 + "%");
  fill();
  rg.addEventListener("input", () => {
    q("#rgN").textContent = rg.value;
    fill();
    sound.tick();
  });
  btn.onclick = null;
  btn.replaceWith(btn.cloneNode(true));
  const nb = q("#pullGo");
  mainBtn = nb;
  nb.addEventListener("click", () => repull(+q("#regrind").value));
  $("#paddleHit").onclick = () => nb.click();
  enableNext(true);
  const next = panel.querySelector('[data-act="next"]');
  if (next) next.innerHTML = (ev.k === "bad" ? "Use it anyway" : "Continue") + ICO.next;
}
async function repull(g) {
  // knock out, re-grind the same dose, tamp the same way, lock in, go
  S.grind = g;
  store.set("grind:" + bean.name, g);
  setDial();
  caption();
  const nb = q("#pullGo");
  nb.disabled = true;
  nb.textContent = "Knocking out…";
  await pfMove(POS.knock, 700, 60);
  sound.knock();
  addPuck();
  setShot(0, 0);
  showScale(0);
  showTimer(0);
  await pfMove(POS.grinder, 700, 60);
  spouts.style.opacity = 1;
  nb.textContent = "Grinding…";
  const sg = sound.grind();
  const d = S.dose;
  await tween(
    900,
    (t) => {
      setMound(d * t);
      showDose(d * t);
    },
    (x) => x,
  );
  sg.stop();
  nb.textContent = "Tamping…";
  spouts.style.opacity = 0;
  await pfMove(POS.mat, 600, 60);
  setMound(d, { flat: true });
  sound.tamp();
  await wait(250);
  await pfMove(POS.group, 700, 60);
  spouts.style.opacity = 1;
  sound.clunk();
  STEPS.pull();
  startShot();
}
function addPuck() {
  const g = $("#pucks");
  const n = g.childElementCount;
  if (n > 5) g.firstElementChild.remove();
  el("ellipse", { cx: 1124 + (n % 3) * 18, cy: 552 - Math.floor(n / 3) * 6, rx: 16, ry: 6 }, g);
}

/* --------------------------------------------- americano: water */
function setMug(water, coffee) {
  const total = water + coffee,
    h = clamp(total / 230, 0, 1) * 52,
    top = 563 - h;
  const W = $("#mugWater"),
    L = $("#mugLiquid");
  // water alone is pale; once the shot goes in, the whole mug turns americano-brown
  W.setAttribute("y", top.toFixed(1));
  W.setAttribute("height", (coffee ? 0 : h).toFixed(1));
  L.setAttribute("y", top.toFixed(1));
  L.setAttribute("height", (coffee ? h : 0).toFixed(1));
  L.setAttribute("fill", mix("#cfe1e6", "#4b2b19", clamp(coffee / 30, 0, 1)));
}
STEPS.water = () => {
  render(
    "Add hot water",
    `<p class="say">Hold for about <b>120 g</b> of hot water, then add the shot on top.</p>
    <div class="readouts"><div id="roW"><small>Water</small><b><span id="vW">${Math.round(S.water)}</span><i>g</i></b></div><div><small>Shot</small><b>${S.shot ? S.shot.y.toFixed(0) : 0}<i>g</i></b></div><div><small>Ratio</small><b id="vWr">–</b></div></div>
    <div class="row-btns"><button class="btn hold" type="button" id="waterGo">Hold for water <kbd>Space</kbd></button><button class="btn ghost small" type="button" id="addShot" ${S.water > 40 ? "" : "disabled"}>Add the shot</button></div>`,
    {
      why: 'An americano dilutes a shot about 1:3 to 1:4 with hot water: drip-coffee strength with espresso flavour. Water first, shot on top is a "long black", which keeps more crema.',
      canNext: !!S.pour,
    },
  );
  const mug = $("#mug");
  if (+mug.getAttribute("opacity") < 1) tween(300, (t) => mug.setAttribute("opacity", t));
  const btn = q("#waterGo");
  mainBtn = btn;
  let raf = 0,
    last = 0,
    snd = null;
  const ws = $("#waterStream");
  holdable(btn, {
    start() {
      btn.classList.add("on");
      snd = sound.pour(true);
      last = performance.now();
      $("#waterKnobRot").setAttribute("transform", "rotate(70 600 402)");
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        S.water = Math.min(200, S.water + dt * 32);
        setMug(S.water, 0);
        ws.setAttribute("stroke-width", 3.5);
        ws.setAttribute("d", `M600 474V${(563 - clamp(S.water / 230, 0, 1) * 52).toFixed(1)}`);
        q("#vW").textContent = Math.round(S.water);
        q("#vWr").textContent = S.shot ? "1:" + (S.water / S.shot.y).toFixed(1) : "–";
        q("#roW").className = S.water >= 100 && S.water <= 150 ? "ok" : S.water > 170 ? "warn" : "";
        btn.style.setProperty("--p", clamp(S.water / 120, 0, 1));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
    end() {
      cancelAnimationFrame(raf);
      btn.classList.remove("on");
      snd && snd.stop();
      ws.setAttribute("stroke-width", 0);
      $("#waterKnobRot").removeAttribute("transform");
      q("#addShot").disabled = S.water < 40;
    },
  });
  q("#addShot").addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    const c = $("#cup");
    await tween(700, (t) =>
      c.setAttribute(
        "transform",
        `translate(${-140 * t} ${-40 * Math.sin(t * Math.PI)}) rotate(${-50 * t} 740 530)`,
      ),
    );
    const p = sound.pour();
    await tween(900, (t) => setMug(S.water, S.shot.y * t));
    p.stop();
    c.setAttribute("opacity", 0);
    c.removeAttribute("transform");
    setShot(0, 0);
    S.pour = { done: true };
    enableNext(true);
    say("Americano ready");
  });
};

/* --------------------------------------------- steam */
const MILKS = {
  whole: {
    n: "Whole",
    f: 1,
    heat: 1,
    note: "Most forgiving. Fat and protein make glossy, stable foam.",
  },
  oat: {
    n: "Oat",
    f: 0.92,
    heat: 1.05,
    note: "Use a barista blend; it foams almost like whole milk.",
  },
  skim: {
    n: "Skim",
    f: 1.3,
    heat: 1,
    note: "Foams huge and stiff, but dry and quick to collapse.",
  },
};
const PIT_IDLE = [1300, 600]; // off to the right until it is needed
let pit = PIT_IDLE.slice(),
  pitRot = 0;
function pitSet(x, y, rot = 0) {
  pit = [x, y];
  pitRot = rot;
  $("#pitcher").setAttribute(
    "transform",
    `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`,
  );
}
function milkDraw(st) {
  const base = 40,
    foam = st ? st.foam : 0,
    surf = -(base * (1 + (foam / 100) * 0.9));
  const fth = Math.max(2.5, ((base * foam) / 100) * 1.1);
  $("#milkBody").setAttribute("y", surf.toFixed(1));
  $("#milkBody").setAttribute("height", (-surf).toFixed(1));
  $("#milkFoam").setAttribute("y", surf.toFixed(1));
  $("#milkFoam").setAttribute("height", fth.toFixed(1));
  $("#milkBody").setAttribute(
    "fill",
    st ? mix("#f2e8d8", "#f6ecdc", clamp(st.T / 65, 0, 1)) : "#f2e8d8",
  );
  const bub = $("#milkBubbles");
  const coarse = st ? st.coarse : 0;
  if (st && foam > 2) {
    let s = "";
    const n = Math.round(4 + coarse * 18);
    for (let i = 0; i < n; i++)
      s += `<circle cx="${((Math.random() - 0.5) * 52).toFixed(1)}" cy="${(surf + Math.random() * fth).toFixed(1)}" r="${(0.6 + coarse * 2.6 * Math.random()).toFixed(1)}"/>`;
    bub.innerHTML = s;
  } else bub.innerHTML = "";
  $("#thermoNeedle").setAttribute(
    "transform",
    `rotate(${-130 + (clamp(st ? st.T : 5, 0, 90) / 90) * 260} 18 -108)`,
  );
  return surf;
}
function resetPitcher() {
  pitSet(...PIT_IDLE);
  milkDraw(null);
  $("#swirl").setAttribute("opacity", 0);
}
let steamSnd = null;
STEPS.steam = async () => {
  const st =
    S.steam ||
    (S.steam = {
      on: false,
      mode: "stretch",
      T: 5,
      foam: 0,
      coarse: 0,
      spun: 0,
      purged: false,
      done: false,
    });
  const [f0, f1] = D().foam;
  render(
    "Steam the milk",
    `<p class="say">Air in early (${term("stretch", "stretch")}), then ${term("texture", "spin")}. Stop around <b>60 °C</b>. Target for a ${D().n.toLowerCase()}: <b>+${f0}–${f1}%</b> foam.</p>
    <div class="seg" role="group" aria-label="Milk">${Object.entries(MILKS)
      .map(
        ([k, m]) =>
          `<button type="button" data-m="${k}" aria-pressed="${k === S.milk}">${m.n}</button>`,
      )
      .join("")}</div>
    <div class="readouts"><div id="roTemp"><small>Temp</small><b><span id="vTemp">${Math.round(st.T)}</span><i>°C</i></b></div><div id="roFoam"><small>Foam</small><b>+<span id="vFoam">${Math.round(st.foam)}</span><i>%</i></b></div><div id="roTex"><small>Texture</small><b id="vTex" style="font-size:15px;margin-top:6px">–</b></div></div>
    <div class="seg" role="group" aria-label="Wand tip" style="align-self:flex-start"><button type="button" data-tip="stretch" aria-pressed="${st.mode === "stretch"}">Tip up · stretch</button><button type="button" data-tip="spin" aria-pressed="${st.mode === "spin"}">Tip down · spin</button></div>
    <div class="row-btns"><button class="btn ghost small" type="button" id="purgeB">${st.purged ? "Purged ✓" : "Purge wand"}</button><button class="btn red" type="button" id="steamGo">${st.on ? "Steam off" : "Steam on"} <kbd>Space</kbd></button></div>
    <p class="muted" id="sMsg" style="font-size:14px;min-height:1.5em">${MILKS[S.milk].note}</p>`,
    {
      why: 'Stretching pulls air in (that soft "tsss"); spinning folds it into microfoam and heats the milk evenly. Lactose tastes sweetest around 55–65 °C. Past about 70 °C milk turns flat and cooked.',
      next: "Pour",
      canNext: st.done,
    },
  );
  panel.querySelectorAll("[data-m]").forEach((b) =>
    b.addEventListener("click", () => {
      if (st.T > 8) return;
      S.milk = b.dataset.m;
      panel
        .querySelectorAll("[data-m]")
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      q("#sMsg").textContent = MILKS[S.milk].note;
      sound.click();
    }),
  );
  const tipBtns = panel.querySelectorAll("[data-tip]");
  const setTip = (m) => {
    st.mode = m;
    tipBtns.forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.tip === m)));
    steamSnd && steamSnd.mode(m);
    $("#swirl").setAttribute("opacity", m === "spin" && st.on ? 0.9 : 0);
    sound.tick();
  };
  tipBtns.forEach((b) => b.addEventListener("click", () => setTip(b.dataset.tip)));
  q("#purgeB").addEventListener("click", (e) => {
    sound.purge();
    puff(1037, 545, 10, true);
    st.purged = true;
    e.currentTarget.textContent = "Purged ✓";
    say("Wand purged");
  });
  const btn = q("#steamGo");
  mainBtn = btn;
  const onKey = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setTip("stretch");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setTip("spin");
    }
  };
  document.addEventListener("keydown", onKey);
  btn.addEventListener("click", () => (st.on ? steamOff() : steamOn()));
  $("#steamKnob").onclick = () => btn.click();
  leaving = () => {
    document.removeEventListener("keydown", onKey);
    $("#steamKnob").onclick = null;
    if (st.on) steamOff(true);
  };
  // move the pitcher to the wand
  if (pit[0] !== 1030) {
    milkDraw(st);
    await tween(800, (t) =>
      pitSet(lerp(PIT_IDLE[0], 1030, t), lerp(PIT_IDLE[1], 574, t) - Math.sin(t * Math.PI) * 90, 0),
    );
  }
  updSteam();

  let raf = 0,
    last = 0,
    puffT = 0;
  function steamOn() {
    st.on = true;
    btn.innerHTML = "Steam off <kbd>Space</kbd>";
    btn.classList.remove("red");
    steamSnd = sound.steam();
    steamSnd.mode(st.mode);
    $("#steamKnobRot").setAttribute("transform", "rotate(90 920 330)");
    last = performance.now();
    $("#swirl").setAttribute("opacity", st.mode === "spin" ? 0.9 : 0);
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000) * 1.35;
      last = now;
      const mk = MILKS[S.milk];
      st.T += dt * 2.6 * mk.heat;
      if (st.mode === "stretch") {
        st.foam = Math.min(85, st.foam + dt * 7 * mk.f * (st.T > 50 ? 0.5 : 1));
        if (st.T > 40) st.coarse = Math.min(1.5, st.coarse + dt * 0.3);
      } else {
        st.spun += dt;
        st.coarse = Math.max(0, st.coarse - dt * 0.14);
      }
      if (S.milk === "skim") st.coarse = Math.max(st.coarse, st.foam / 100);
      if ((puffT += dt) > 0.12) {
        puffT = 0;
        puff(1030 + (Math.random() - 0.5) * 50, pit[1] - 92, 1);
      }
      updSteam();
      raf = requestAnimationFrame(tick);
      if (st.T >= 82) {
        steamOff();
        q("#sMsg").textContent = "Screaming hot. The milk is scalded: it will taste cooked.";
      }
    };
    raf = requestAnimationFrame(tick);
  }
  function steamOff(silent) {
    cancelAnimationFrame(raf);
    st.on = false;
    steamSnd && steamSnd.stop();
    steamSnd = null;
    $("#swirl").setAttribute("opacity", 0);
    $("#steamKnobRot").removeAttribute("transform");
    if (silent) return;
    btn.innerHTML = "Steam on <kbd>Space</kbd>";
    btn.classList.add("red");
    st.done = st.T > 30;
    enableNext(st.done);
    const m = q("#sMsg");
    const v = steamVerdict(st);
    m.innerHTML = `<b>${v.t}</b> ${v.d}`;
    say(v.t);
    puff(1037, 545, 6);
  }
  function updSteam() {
    const surf = milkDraw(st);
    const depth = st.mode === "stretch" ? 3 : 16;
    const ty = 539 - surf - depth;
    pitSet(1030, lerp(pit[1], ty, 0.2), st.mode === "spin" ? -4 : 0);
    const sw = $("#swirl");
    sw.setAttribute(
      "transform",
      `translate(0 ${(surf + 10).toFixed(1)}) rotate(${(performance.now() / 6) % 360} 0 -30) scale(1 .3)`,
    );
    const vt = q("#vTemp");
    if (!vt) return;
    vt.textContent = Math.round(st.T);
    q("#vFoam").textContent = Math.round(st.foam);
    q("#vTex").textContent =
      st.foam < 2 ? "–" : st.coarse < 0.3 ? "Silky" : st.coarse < 0.7 ? "Some bubbles" : "Bubbly";
    q("#roTemp").className = st.T >= 55 && st.T <= 66 ? "ok" : st.T > 70 ? "warn" : "";
    q("#roFoam").className = st.foam >= f0 && st.foam <= f1 ? "ok" : st.foam > f1 + 8 ? "warn" : "";
    q("#roTex").className = st.foam >= 2 && st.coarse < 0.3 ? "ok" : st.coarse >= 0.7 ? "warn" : "";
  }
};
function steamVerdict(st) {
  const [f0, f1] = D().foam;
  const out = [];
  if (st.T < 50) out.push("a bit cool (aim ~60 °C)");
  else if (st.T > 70) out.push("too hot, the sweetness is gone");
  if (st.foam < f0) out.push("not enough air for this drink");
  else if (st.foam > f1 + 6) out.push("too much foam for this drink");
  if (st.coarse >= 0.7) out.push("big bubbles: stretch earlier, while it is cool");
  else if (st.spun < 2 && st.foam > 4) out.push("spin longer to fold the foam in");
  const d = out.join("; ");
  return out.length
    ? { t: "Close.", d: d[0].toUpperCase() + d.slice(1) + "." }
    : { t: "Glossy microfoam.", d: "Like wet paint. Swirl it and pour." };
}

/* --------------------------------------------- pour (top view) */
const ct = (id) => document.getElementById(id);
function topCup(kind) {
  const d = D(),
    k = d.k;
  ct("ct-g").setAttribute("transform", `translate(300 180) scale(${k}) translate(-300 -180)`);
  ct("ct-handle").style.display = d.v === "gibraltar" || d.v === "latte" ? "none" : "";
  const glass = d.v === "gibraltar" || d.v === "latte";
  ct("ct-cup").setAttribute("fill", glass ? "#e9e4dc" : "#f7f1e6");
  ct("ct-liquid").setAttribute("fill", kind === "americano" ? "#5a3220" : "url(#ct-espresso)");
  ct("ct-tigerc").setAttribute("opacity", kind === "americano" ? 0.25 : 0.8);
  ct("ct-mixed").setAttribute("opacity", 0);
  ct("ct-art").innerHTML = "";
  ct("ct-specks").innerHTML = "";
  ct("ct-spill").innerHTML = "";
  ct("ct-pour").setAttribute("opacity", 0);
  ct("ct-steam").setAttribute("opacity", 0);
}
const P = (x, y) => [300 + (x - 300) * D().k, 180 + (y - 180) * D().k];
function heartPath(t, cx, cy, r) {
  // circle (t=0) → heart (t=1), same command structure so it can morph
  const L = (a, b) => a + (b - a) * t,
    c = 0.5523 * r;
  const top = [cx, L(cy - r, cy - r * 0.55)],
    bot = [cx, L(cy + r, cy + r * 1.12)],
    lft = [L(cx - r, cx - r * 1.02), L(cy, cy - r * 0.35)],
    rgt = [L(cx + r, cx + r * 1.02), L(cy, cy - r * 0.35)];
  return (
    `M${top[0]} ${top[1]}C${L(cx + c, cx + r * 0.2)} ${L(cy - r, cy - r * 1.15)} ${L(cx + r, cx + r * 1.15)} ${L(cy - c, cy - r * 0.95)} ${rgt[0]} ${rgt[1]}` +
    `C${L(cx + r, cx + r * 0.95)} ${L(cy + c, cy + r * 0.3)} ${L(cx + c, cx + r * 0.35)} ${L(cy + r, cy + r * 0.8)} ${bot[0]} ${bot[1]}` +
    `C${L(cx - c, cx - r * 0.35)} ${L(cy + r, cy + r * 0.8)} ${L(cx - r, cx - r * 0.95)} ${L(cy + c, cy + r * 0.3)} ${lft[0]} ${lft[1]}` +
    `C${L(cx - r, cx - r * 1.15)} ${L(cy - c, cy - r * 0.95)} ${L(cx - c, cx - r * 0.2)} ${L(cy - r, cy - r * 1.15)} ${top[0]} ${top[1]}Z`
  );
}
function drawArt(pat, grow, cut, q2) {
  // grow 0..1 (phase 2), cut 0..1 (phase 3). q2 = { silk, foam }
  const art = ct("ct-art");
  const white = "#fffaf1";
  const op = clamp(0.35 + q2.foam / 18, 0.4, 1);
  ct("ct-art").setAttribute("filter", q2.silk > 0.6 ? "url(#ct-soft)" : "url(#ct-blob)");
  let s = "";
  if (pat === "heart") {
    const r = 10 + grow * (D().v === "cap" ? 62 : 52),
      cy = 200 - grow * 24;
    s += `<path d="${heartPath(cut, 300, cy, r)}" fill="${white}" opacity="${op}"/>`;
    if (q2.foam > 30)
      s += `<path d="${heartPath(cut, 300, cy, r * 0.62)}" fill="#f1e2c8" opacity=".35"/>`;
  } else if (pat === "tulip") {
    const n = grow < 0.34 ? 1 : grow < 0.67 ? 2 : 3,
      sub = (grow * 3) % 1 || 1;
    for (let i = 0; i < n; i++) {
      const g = i === n - 1 ? sub : 1,
        r = (38 - i * 8) * (0.3 + 0.7 * g),
        cy = 228 - i * 30 - (i === 0 ? 0 : 0);
      const squash = i < n - 1 ? 0.62 : 1;
      s += `<ellipse cx="300" cy="${cy}" rx="${r * 1.12}" ry="${r * squash}" fill="${white}" opacity="${op}"/>`;
      if (i < n - 1)
        s += `<ellipse cx="300" cy="${cy - r * 0.55}" rx="${r * 0.9}" ry="${r * 0.42}" fill="#b98457"/>`;
    }
    if (cut > 0)
      s += `<path d="M300 ${150 - 8} L300 ${150 + cut * 112}" stroke="#b98457" stroke-width="${3.2 - cut}" stroke-linecap="round"/>`;
  } else {
    const leaves = Math.round(grow * 13);
    // stacked crescents, convex toward the front of the cup, biggest first
    for (let i = 0; i < leaves; i++) {
      const y = 236 - i * 9.2,
        w = 66 * (1 - i / 15) * (0.62 + 0.38 * Math.min(1, (leaves - i) / 3)),
        sway = (i % 2 ? 1 : -1) * 2.5,
        th = clamp(9 - i * 0.4, 4, 9);
      s += `<path d="M${300 - w + sway} ${y - 6} Q300 ${y + 16 + th} ${300 + w + sway} ${y - 6} Q300 ${y + 10} ${300 - w + sway} ${y - 6}Z" fill="${white}" opacity="${op}"/>`;
    }
    if (leaves)
      s += `<circle cx="300" cy="${236 - leaves * 9.2 + 2}" r="${7 + grow * 3}" fill="${white}" opacity="${op}"/>`;
    if (cut > 0)
      s += `<path d="M300 ${236 - leaves * 9.2 - 6} L300 ${236 - leaves * 9.2 - 6 + cut * (leaves * 9.2 + 34)}" stroke="${white}" stroke-width="3.4" stroke-linecap="round" opacity="${op}"/>`;
  }
  if (q2.silk < 0.45)
    for (let i = 0; i < 18; i++)
      s += `<circle cx="${(250 + Math.random() * 100).toFixed(0)}" cy="${(150 + Math.random() * 110).toFixed(0)}" r="${(1 + Math.random() * 2).toFixed(1)}" fill="#b98457" opacity=".6"/>`;
  art.innerHTML = s;
}
STEPS.pour = () => {
  const st = S.steam || { foam: 10, coarse: 0 };
  const pr = S.pour || (S.pour = { phase: 1, fill: 0, grow: 0, cut: 0, pat: D().art, done: false });
  const q2 = { silk: 1 - clamp(st.coarse, 0, 1), foam: st.foam };
  topCup("milk");
  const labels = {
    1: "Hold: pour high, blend",
    2: "Hold: drop close, draw",
    3: "Tap: lift & cut through",
  };
  render(
    "Pour",
    `<p class="say">High and slow to blend. Then tip close so the foam floats and draws. Finish with a cut through the middle.</p>
    <div class="seg" role="group" aria-label="Pattern">${["heart", "tulip", "rosetta"].map((p) => `<button type="button" data-p="${p}" aria-pressed="${p === pr.pat}">${p[0].toUpperCase() + p.slice(1)}</button>`).join("")}</div>
    <div><div class="meter"><span class="zone" style="left:85%;width:15%"></span><i id="fillV" style="width:${pr.fill * 100}%"></i></div><div class="meter-l"><span>Cup</span><span id="phaseL">Phase ${Math.min(pr.phase, 3)} of 3</span></div></div>
    <div class="row-btns"><button class="btn hold" type="button" id="pourGo">${labels[Math.min(pr.phase, 3)]} <kbd>Space</kbd></button></div>
    <p class="muted" id="pMsg" style="font-size:14px;min-height:1.5em"></p>`,
    {
      why: "From high up, milk dives under the crema and mixes into a brown canvas. Bring the pitcher close and the foam floats on top and paints. The final cut drags the shape into its point.",
      next: "Serve",
      canNext: pr.done,
    },
  );
  panel.querySelectorAll("[data-p]").forEach((b) =>
    b.addEventListener("click", () => {
      if (pr.phase > 1) return;
      pr.pat = b.dataset.p;
      panel
        .querySelectorAll("[data-p]")
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      sound.click();
    }),
  );
  const btn = q("#pourGo");
  mainBtn = btn;
  const fillV = q("#fillV");
  let raf = 0,
    last = 0,
    snd = null;
  const pp = ct("ct-pp"),
    ring = ct("ct-ring"),
    pg = ct("ct-pour");
  const setPt = (x, y) => {
    const [a, b] = P(x, y);
    pp.setAttribute("cx", a);
    pp.setAttribute("cy", b);
    ring.setAttribute("cx", a);
    ring.setAttribute("cy", b);
  };
  const refresh = () => {
    ct("ct-mixed").setAttribute("opacity", (clamp(pr.fill / 0.55, 0, 1) * 0.7).toFixed(2));
    fillV.style.width = Math.min(1, pr.fill) * 100 + "%";
    drawArt(pr.pat, pr.grow, pr.cut, q2);
  };
  refresh();
  if (pr.done) {
    q("#pMsg").textContent = pourMsg(pr, q2);
  }
  const nextPhase = () => {
    pr.phase++;
    btn.innerHTML = `${labels[Math.min(pr.phase, 3)]} <kbd>Space</kbd>`;
    q("#phaseL").textContent = `Phase ${Math.min(pr.phase, 3)} of 3`;
    btn.style.setProperty("--p", 0);
  };
  holdable(btn, {
    async start() {
      if (pr.done) return;
      if (pr.phase === 3) {
        btn.disabled = true;
        sound.click();
        await tween(
          650,
          (t) => {
            pr.cut = t;
            refresh();
          },
          easeOut,
        );
        pr.done = true;
        q("#pMsg").textContent = pourMsg(pr, q2);
        say(q("#pMsg").textContent);
        btn.textContent = "Poured ✓";
        enableNext(true);
        ct("ct-steam").setAttribute("opacity", 1);
        return;
      }
      btn.classList.add("on");
      snd = sound.pour();
      pg.setAttribute("opacity", 1);
      last = performance.now();
      const tick = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const tt = now / 1000;
        if (pr.phase === 1) {
          pr.fill = Math.min(0.75, pr.fill + dt * 0.22);
          setPt(300 + Math.sin(tt * 5) * 16, 180 + Math.cos(tt * 4) * 10);
          ring.setAttribute("r", 8 + Math.sin(tt * 18) * 3);
          if (Math.random() < 0.2) {
            const s = el(
              "circle",
              {
                cx: P(240 + Math.random() * 120, 0)[0],
                cy: P(0, 120 + Math.random() * 120)[1],
                r: 2 + Math.random() * 4,
                fill: "#c9976a",
                opacity: 0.5,
              },
              ct("ct-specks"),
            );
            if (ct("ct-specks").childElementCount > 60) ct("ct-specks").firstElementChild.remove();
          }
          btn.style.setProperty("--p", clamp(pr.fill / 0.55, 0, 1));
        } else if (pr.phase === 2) {
          pr.grow = Math.min(1.15, pr.grow + dt * 0.34);
          pr.fill = Math.min(1.1, pr.fill + dt * 0.16);
          const y = pr.pat === "rosetta" ? 240 - pr.grow * 118 : 214 - pr.grow * 20;
          setPt(300 + (pr.pat === "rosetta" ? Math.sin(tt * 16) * 10 : 0), y);
          btn.style.setProperty("--p", clamp(pr.grow, 0, 1));
          if (pr.fill >= 1.08) {
            ct("ct-spill").innerHTML =
              '<ellipse cx="402" cy="250" rx="18" ry="9"/><ellipse cx="380" cy="282" rx="10" ry="5"/>';
          }
        }
        refresh();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
    end() {
      if (pr.done || pr.phase === 3) return;
      cancelAnimationFrame(raf);
      btn.classList.remove("on");
      snd && snd.stop();
      pg.setAttribute("opacity", 0);
      const m = q("#pMsg");
      if (pr.phase === 1) {
        if (pr.fill >= 0.4) {
          m.textContent =
            pr.fill > 0.65
              ? "Very full already: there is little room left to draw."
              : "Good canvas. Now drop close.";
          nextPhase();
        } else m.textContent = "Keep blending until the cup is about half full.";
      } else if (pr.phase === 2) {
        if (pr.grow > 0.25) {
          m.textContent =
            pr.fill >= 1.08 ? "Overflowing! Cut through now." : "Now lift and cut through.";
          nextPhase();
        } else m.textContent = "Hold a little longer to let the white spread.";
      }
    },
  });
};
function pourMsg(pr, q2) {
  if (q2.foam < 4)
    return "The white sank: the milk had almost no foam. Stretch a little longer next time.";
  if (q2.silk < 0.45)
    return "Blobby edges and specks: big bubbles in the milk. Stretch earlier and spin longer.";
  if (pr.fill >= 1.08) return "A little spill on the saucer. Wipe it and nobody saw.";
  if (pr.grow < 0.45) return "A small, shy pattern. Push more milk before the cut.";
  return {
    heart: "A clean heart. Café-ready.",
    tulip: "Three stacks and a point. Nice tulip.",
    rosetta: "Leaves and a stem. That is a rosetta.",
  }[pr.pat];
}

/* --------------------------------------------- serve */
STEPS.serve = () => {
  const d = D(),
    sh = S.shot,
    ev = sh ? sh.ev : null,
    st = S.steam;
  if (S.drink === "espresso" || S.drink === "americano") {
    topCup(S.drink);
    ct("ct-steam").setAttribute("opacity", 1);
  } else if (!S.pour || !S.pour.done) {
    topCup("milk");
  }
  const row = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`;
  const rc = `<div class="receipt" aria-label="Your order">
    <h4>Groundwork bar</h4><div style="text-align:center;opacity:.7">Ticket ${S.no} · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div><hr>
    ${row(d.n.toUpperCase(), "1")}${row("Bean", bean.name + ", " + bean.country)}${row("Grind · dose", S.grind + " · " + S.dose.toFixed(1) + " g")}
    ${sh ? row("Shot", `${sh.y.toFixed(1)} g · ${sh.t.toFixed(1)} s · 1:${ev.R.toFixed(1)}`) + row("Extraction", `${ev.EY.toFixed(1)}%`) + row("Strength", `${ev.TDS.toFixed(1)}%`) : ""}
    ${S.drink === "americano" ? row("Water", Math.round(S.water) + " g") : ""}
    ${st ? row("Milk", `${MILKS[S.milk].n.toLowerCase()} · ${Math.round(st.T)} °C · +${Math.round(st.foam)}%`) : ""}
    ${S.pour && S.pour.pat ? row("Art", S.pour.pat) : ""}<hr>
    ${row("SHOT SCORE", ev ? ev.score + "/100" : "–")}<hr>
    <div style="text-align:center">${ev ? esc(ev.t) : ""}<br>Tasting: ${bean.notes}.</div></div>`;
  render(
    "Order up",
    `${rc}
    <div><p class="eyebrow" style="margin-bottom:8px">Clean as you go</p><div class="row-btns">
      <button class="btn ghost small" type="button" data-c="knock">${S.clean.knock ? "Knocked ✓" : "Knock out the puck"}</button>
      <button class="btn ghost small" type="button" data-c="flush">${S.clean.flush ? "Flushed ✓" : "Flush the group"}</button>
      ${st ? `<button class="btn ghost small" type="button" data-c="wand">${S.clean.wand ? "Wiped ✓" : "Purge & wipe the wand"}</button>` : ""}</div></div>
    <div class="row-btns"><button class="btn red" type="button" id="again">${ICO.redo}Make another</button><a class="btn ghost" href="/groundwork/recipes/#${d.rx}">Full recipe</a></div>`,
    {
      why: "Baristas knock, flush and wipe after every drink. Old grounds turn rancid on the screen and milk bakes onto a hot wand within seconds.",
      next: "",
    },
  );
  panel.querySelectorAll("[data-c]").forEach((b) =>
    b.addEventListener("click", async () => {
      const c = b.dataset.c;
      if (S.clean[c]) return;
      b.disabled = true;
      wrap.classList.remove("top-view");
      await camTo("wide", 600);
      if (c === "knock") {
        await pfMove(POS.knock, 700, 60);
        sound.knock();
        addPuck();
        setMound(0);
        await wait(200);
        await pfMove(POS.group, 700, 60);
        sound.clunk();
        b.textContent = "Knocked ✓";
      }
      if (c === "flush") {
        const p = sound.pump();
        $("#flush").setAttribute("opacity", 1);
        await wait(1200);
        $("#flush").setAttribute("opacity", 0);
        p.stop();
        b.textContent = "Flushed ✓";
      }
      if (c === "wand") {
        await tween(500, (t) =>
          pitSet(
            lerp(pit[0], PIT_IDLE[0], t),
            lerp(pit[1], PIT_IDLE[1], t) - Math.sin(t * Math.PI) * 60,
          ),
        );
        sound.purge();
        puff(1037, 545, 10, true);
        b.textContent = "Wiped ✓";
      }
      S.clean[c] = true;
      b.disabled = false;
      say(b.textContent);
    }),
  );
  q("#again").addEventListener("click", () => {
    Object.assign(S, fresh());
    S.no++;
    resetScene();
    go(0);
  });
  ct("ct-steam").setAttribute("opacity", 1);
  say(`${d.n} served. Score ${ev ? ev.score : ""}.`);
};
function resetScene() {
  pfSet(POS.grinder);
  spouts.style.opacity = 1;
  setMound(0);
  showDose(0);
  showScale(0);
  showTimer(0);
  setNeedle(0);
  setShot(0, 0);
  $("#cup").setAttribute("opacity", 0);
  $("#cup").removeAttribute("transform");
  $("#mug").setAttribute("opacity", 0);
  setMug(0, 0);
  resetPitcher();
  wrap.classList.remove("top-view");
}

/* ------------------------------------------------------------------ go */
caption();
go(0);
