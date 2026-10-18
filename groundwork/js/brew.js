// Brew: grind ruler at particle scale, brewer cards, ratio calculator and a guided timer.
import { $, $$, esc, sound, initChrome, clamp, store, reduced } from "./core.js";

initChrome();

const ICONS = {
  v60: '<path d="M14 18h36l-12 20H26z"/><path d="M22 18l6 20M42 18l-6 20M32 18v20"/><path d="M27 38v4h10v-4"/><path d="M18 46h28v8a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z"/>',
  chemex:
    '<path d="M20 8h24L34 30l10 22a4 4 0 0 1-4 6H24a4 4 0 0 1-4-6l10-22z"/><path d="M27 26h10l-2 8h-6z" fill="var(--s,#2a1a12)"/>',
  aeropress:
    '<rect x="22" y="14" width="20" height="36" rx="2"/><path d="M18 50h28v4H18zM26 8h12v6H26z"/><path d="M22 30h20" stroke-dasharray="2 3"/>',
  press:
    '<path d="M18 16h26v38a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z"/><path d="M31 6v20M24 26h14M44 22h6v20h-6"/><path d="M18 40h26" stroke-dasharray="2 3"/>',
  moka: '<path d="M22 32h20l4 22H18z"/><path d="M24 32l-2-14h20l-2 14M22 18h20l-2-6H24z"/><path d="M42 22h6l-2 14"/>',
  cezve:
    '<path d="M18 26h22l-2 26a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z"/><path d="M40 30l18-10"/><path d="M16 26l-4-3"/>',
  phin: '<path d="M14 26h36v3H14zM20 12h24v14H20zM26 8h12v4H26z"/><path d="M18 32h28l-2 24H20z"/>',
  siphon:
    '<circle cx="32" cy="42" r="12"/><path d="M24 8h16l-2 18H26z"/><path d="M32 26v6"/><path d="M22 56h20"/>',
  coldbrew:
    '<rect x="18" y="14" width="28" height="42" rx="4"/><path d="M18 22h28"/><path d="M40 6a8 8 0 1 0 6 10 6 6 0 0 1-6-10z"/>',
};
const M = [
  {
    id: "v60",
    n: "Pour-over (V60)",
    line: "Paper filter, slow spiral pours. Clean, bright, shows off light roasts.",
    dose: 15,
    water: 250,
    g: [450, 700],
    like: "sea salt",
    temp: "93–96 °C",
    time: "~3:00",
    rx: "pour-over",
    steps: [
      [0, "Bloom", "Pour to the target and swirl so every ground is wet.", 0.2],
      [45, "Pour", "Slow circles from the centre outward.", 0.4],
      [60, "Pour", "Keep the level steady.", 0.6],
      [75, "Pour", "Gentle, low pour.", 0.8],
      [90, "Last pour", "Then one gentle swirl to flatten the bed.", 1],
      [105, "Draw down", "Let it drain. A flat bed means even extraction.", 1],
      [180, "Done", "Lift the dripper and taste.", 1],
    ],
  },
  {
    id: "chemex",
    n: "Chemex",
    line: "A thick filter for the cleanest, lightest-bodied cup. Brews big.",
    dose: 30,
    water: 500,
    g: [600, 900],
    like: "coarse sand",
    temp: "94 °C",
    time: "4:00–4:30",
    rx: "chemex",
    steps: [
      [0, "Bloom", "Pour to the target and wait.", 0.12],
      [45, "Pour", "Steady circles.", 0.5],
      [90, "Pour", "Keep it moving.", 0.8],
      [135, "Last pour", "Fill to the final weight.", 1],
      [150, "Draw down", "The thick paper drains slowly.", 1],
      [255, "Done", "Lift the filter and swirl the carafe.", 1],
    ],
  },
  {
    id: "aeropress",
    n: "AeroPress",
    line: "Immersion plus a gentle press. Forgiving, fast, travel-proof.",
    dose: 11,
    water: 200,
    g: [400, 800],
    like: "table salt",
    temp: "90–99 °C",
    time: "~3:00",
    rx: "aeropress",
    steps: [
      [0, "Add water", "All of it at once. No stirring needed.", 1],
      [120, "Swirl", "Swirl gently to settle the grounds.", 1],
      [150, "Press", "Slow and light, about 30 s.", 1],
      [180, "Done", "Stop at the hiss.", 1],
    ],
  },
  {
    id: "press",
    n: "French press",
    line: "Full, oily, rich. Patience gives a cleaner cup.",
    dose: 30,
    water: 500,
    g: [800, 1100],
    like: "coarse sea salt",
    temp: "Just off the boil",
    time: "9:00",
    rx: "french-press",
    steps: [
      [0, "Pour", "All the water at once. Do not stir.", 1],
      [240, "Break the crust", "Stir the top; scoop off the foam.", 1],
      [540, "Plunge", "Press just to the surface and pour gently.", 1],
    ],
  },
  {
    id: "moka",
    n: "Moka pot",
    line: "Steam pressure on the stove. Strong, near-espresso coffee.",
    dose: 17,
    water: 170,
    g: [300, 600],
    like: "fine salt",
    temp: "Start with hot water",
    time: "~4:30",
    rx: "moka",
    steps: [
      [0, "Heat", "Hot water to the valve, basket level, medium heat, lid open.", 1],
      [150, "Flow", "Coffee rises honey-thick. Turn the heat down.", 1],
      [240, "Sputter", "Off the heat; cool the base under the tap.", 1],
      [260, "Done", "Stir and pour.", 1],
    ],
  },
  {
    id: "cezve",
    n: "Cezve (Turkish)",
    line: "Powder-fine coffee heated slowly in water. Unfiltered, thick, foamy.",
    dose: 7,
    water: 70,
    g: [100, 200],
    like: "flour",
    temp: "Cold water start",
    time: "~3:00",
    rx: "turkish",
    steps: [
      [0, "Stir once", "Coffee, sugar, cold water. Low heat.", 1],
      [120, "Watch", "Foam gathers at the edges.", 1],
      [160, "Pull", "Off the heat before it boils. Foam into the cup first.", 1],
      [180, "Done", "Pour slowly. Let it settle a minute.", 1],
    ],
  },
  {
    id: "phin",
    n: "Phin (Vietnam)",
    line: "A slow metal drip, usually robusta, onto condensed milk.",
    dose: 20,
    water: 90,
    g: [600, 900],
    like: "coarse sand",
    temp: "Just off the boil",
    time: "~5:00",
    rx: "ca-phe-sua-da",
    steps: [
      [0, "Bloom", "A splash of water; wait 30 s.", 0.22],
      [30, "Fill", "Fill to the top; lid on.", 1],
      [60, "Drip", "About a drop a second.", 1],
      [300, "Done", "Stir into condensed milk; pour over ice.", 1],
    ],
  },
  {
    id: "siphon",
    n: "Siphon",
    line: "Vapour pressure pushes water up, then pulls coffee down. Theatre and clarity.",
    dose: 20,
    water: 300,
    g: [500, 700],
    like: "sand",
    temp: "~92 °C",
    time: "~3:00",
    rx: "pour-over",
    steps: [
      [0, "Heat", "Water climbs into the top globe.", 1],
      [30, "Add coffee", "Stir to wet it all.", 1],
      [90, "Kill the heat", "One more stir.", 1],
      [120, "Draw down", "The coffee is sucked back through the filter.", 1],
      [180, "Done", "Pour. Clean and tea-like.", 1],
    ],
  },
  {
    id: "coldbrew",
    n: "Cold brew",
    line: "Coarse coffee steeped cold overnight. Smooth and low in acid.",
    dose: 100,
    water: 1000,
    g: [1000, 1500],
    like: "peppercorns",
    temp: "Cold",
    time: "12–18 h",
    rx: "cold-brew",
    long: true,
    steps: [
      [0, "Mix", "Stir coarse coffee into cold water.", 1],
      [50400, "Strain", "After about 14 h in the fridge, strain through paper.", 1],
      [50460, "Serve", "Dilute 1:1 over ice. Keeps about a week.", 1],
    ],
  },
];
const RULER = [{ id: "espresso", n: "Espresso", g: [180, 380] }].concat(
  M.filter((m) => !["siphon", "phin"].includes(m.id)).map((m) => ({
    id: m.id,
    n: m.id === "chemex" ? "Chemex · Phin" : m.n.replace(/ \(.+\)/, ""),
    g: m.g,
  })),
);
const MAX = 1600;

/* ------------------------------------------------------------------ grind ruler */
function drawRuler() {
  const cv = $("#grCanvas"),
    dpr = Math.min(2, devicePixelRatio || 1),
    w = cv.clientWidth,
    h = cv.clientHeight;
  cv.width = w * dpr;
  cv.height = h * dpr;
  const c = cv.getContext("2d");
  c.scale(dpr, dpr);
  let seed = 9;
  const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pxPerUm = Math.min(0.05, (64 / MAX) * 1.1);
  for (let x = 4; x < w; x += 2.2) {
    const um = (x / w) * MAX,
      s = Math.max(1, um * pxPerUm * (0.6 + R() * 0.7));
    if (R() > 0.55 + (um / MAX) * 0.35) continue;
    const y = 8 + R() * (h - 16),
      sides = 5 + Math.floor(R() * 3);
    c.beginPath();
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2,
        rr = (s / 2) * (0.7 + R() * 0.5);
      c[k ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    const t = R();
    c.fillStyle = `rgba(${200 + t * 40},${150 + t * 40},${100 + t * 30},${0.55 + R() * 0.35})`;
    c.fill();
  }
  $("#grAxis").innerHTML = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600]
    .map(
      (v) =>
        `<span style="left:${(v / MAX) * 100}%;${v === 0 ? "transform:none" : v === MAX ? "transform:translateX(-100%)" : ""}">${v}${v === MAX ? " µm" : ""}</span>`,
    )
    .join("");
}
function lanes() {
  const rows = [];
  RULER.slice()
    .sort((a, b) => a.g[0] - b.g[0])
    .forEach((m) => {
      let r = rows.find((row) => row.at(-1).g[1] + 10 < m.g[0]);
      if (!r) rows.push((r = []));
      r.push(m);
    });
  $("#grMethods").innerHTML = rows
    .map(
      (row) =>
        `<div class="gr-row">${row.map((m) => `<button type="button" data-m="${m.id}" style="left:${(m.g[0] / MAX) * 100}%;width:${((m.g[1] - m.g[0]) / MAX) * 100}%" title="${m.n}: ${m.g[0]}–${m.g[1]} µm">${m.n}</button>`).join("")}</div>`,
    )
    .join("");
}
$("#grMethods").addEventListener("click", (e) => {
  const b = e.target.closest("[data-m]");
  if (!b) return;
  if (b.dataset.m === "espresso") {
    location.href = "/groundwork/";
    return;
  }
  pick(b.dataset.m, true);
});
let rt = 0;
addEventListener("resize", () => {
  clearTimeout(rt);
  rt = setTimeout(drawRuler, 150);
});

/* ------------------------------------------------------------------ methods + calculator */
let cur = M[0],
  strength = 1,
  water = 250;
$("#methods").innerHTML = M.map(
  (m) =>
    `<button class="method" type="button" data-m="${m.id}" aria-pressed="false"><svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="var(--s,#2a1a12)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[m.id]}</svg><b>${m.n}</b><span class="m-meta">1:${(m.water / m.dose).toFixed(0)} · ${m.time}</span></button>`,
).join("");
$("#methods").addEventListener("click", (e) => {
  const b = e.target.closest("[data-m]");
  if (b) pick(b.dataset.m, false);
});
$$("#bStrength [data-k]").forEach((b) =>
  b.addEventListener("click", () => {
    strength = +b.dataset.k;
    $$("#bStrength [data-k]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    sound.tick();
    calc();
  }),
);
const wIn = $("#bWater");
wIn.addEventListener("input", () => {
  water = +wIn.value;
  calc();
});

function pick(id, scroll, quiet) {
  const m = M.find((x) => x.id === id);
  if (!m) return;
  cur = m;
  stopTimer(true);
  $$("#methods [data-m]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.m === id)),
  );
  $$("#grMethods [data-m]").forEach((b) => b.classList.toggle("on", b.dataset.m === id));
  $("#bName").textContent = m.n;
  $("#bLine").textContent = m.line;
  $("#bSpec").innerHTML = [
    ["Ratio", `1:${(m.water / m.dose).toFixed(1).replace(".0", "")}`],
    ["Grind", `${m.g[0]}–${m.g[1]} µm`],
    ["Water", m.temp],
    ["Time", m.time],
  ]
    .map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`)
    .join("");
  const lo = m.long ? 500 : Math.max(60, Math.round((m.water * 0.4) / 10) * 10),
    hi = m.long ? 2000 : Math.min(1000, Math.round((m.water * 3) / 10) * 10);
  wIn.min = lo;
  wIn.max = hi;
  wIn.step = m.water < 120 ? 10 : 10;
  water = m.water;
  wIn.value = water;
  $("#bRecipe").href = "/groundwork/recipes/#" + m.rx;
  calc();
  drawTimer();
  if (scroll)
    $("#brewer").scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  if (!quiet) {
    history.replaceState(null, "", "#" + id);
    sound.click();
  }
}
function calc() {
  const ratio = (cur.water / cur.dose) * strength,
    coffee = water / ratio;
  wIn.style.setProperty("--fill", ((water - wIn.min) / (wIn.max - wIn.min)) * 100 + "%");
  $("#bWaterV").textContent = `${water} g`;
  const kept = cur.id === "cezve" || cur.id === "moka" ? 1.2 : 2;
  $("#bCoffee").textContent = `${coffee < 20 ? coffee.toFixed(1) : Math.round(coffee)} g`;
  $("#bOut").textContent =
    `coffee · ${water} g water · ≈ ${Math.round(water - coffee * kept)} ml in the cup`;
  drawTimer(true);
}

/* ------------------------------------------------------------------ guided timer */
let T = { on: false, t: 0, last: 0, raf: 0, step: -1 };
const mmss = (s) =>
  s >= 3600
    ? `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function drawTimer(keep) {
  const m = cur,
    end = m.steps.at(-1)[0];
  const box = $("#timer");
  if (!keep || !box.firstChild) {
    box.innerHTML = `<svg class="ring" viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="104" fill="none" stroke="var(--paper-3)" stroke-width="14"/><circle id="tRing" cx="120" cy="120" r="104" fill="none" stroke="var(--cherry)" stroke-width="14" stroke-linecap="round" stroke-dasharray="653.5" stroke-dashoffset="653.5" transform="rotate(-90 120 120)"/>
      ${m.steps
        .map(([s]) => {
          const a = (s / end) * Math.PI * 2 - Math.PI / 2;
          return `<circle cx="${120 + Math.cos(a) * 104}" cy="${120 + Math.sin(a) * 104}" r="4" fill="var(--ink)"/>`;
        })
        .join("")}
      <text id="tClock" x="120" y="128" text-anchor="middle" font-family="Martian Mono, monospace" font-size="38" fill="var(--ink)">0:00</text><text id="tScale" x="120" y="156" text-anchor="middle" font-family="Martian Mono, monospace" font-size="12" fill="var(--muted)"></text></svg>
      <div class="t-step"><b id="tTitle">Ready</b><span id="tDetail">${m.long ? "Cold brew takes hours: use the steps, not the clock." : "Coffee in, scale tared, kettle hot. Press start."}</span></div>
      <div class="row-btns">${m.long ? "" : `<button class="btn red" type="button" id="tGo">Start</button><button class="btn ghost small" type="button" id="tReset">Reset</button>`}</div>
      <ol id="tList">${m.steps.map(([s, n], i) => `<li data-i="${i}"><span>${mmss(s)}</span><span>${n}</span><span class="tw"></span></li>`).join("")}</ol>`;
    if (!m.long) {
      $("#tGo").addEventListener("click", () => (T.on ? stopTimer() : startTimer()));
      $("#tReset").addEventListener("click", () => {
        stopTimer(true);
        drawTimer();
      });
    }
  }
  $$("#tList li").forEach((li, i) => {
    const f = m.steps[i][3];
    li.querySelector(".tw").textContent = f ? `${Math.round(water * f)} g` : "";
  });
  paint();
}
function paint() {
  const m = cur,
    end = m.steps.at(-1)[0];
  $("#tRing") &&
    $("#tRing").setAttribute(
      "stroke-dashoffset",
      (653.5 * (1 - clamp(T.t / end, 0, 1))).toFixed(1),
    );
  $("#tClock") && ($("#tClock").textContent = mmss(T.t));
  let i = -1;
  m.steps.forEach(([s], k) => {
    if (T.t >= s) i = k;
  });
  if (i !== T.step && T.on) {
    if (T.step >= 0 || i > 0) sound.chime();
    T.step = i;
  }
  const st = i >= 0 ? m.steps[i] : null;
  if (st && (T.on || T.t > 0)) {
    $("#tTitle").textContent = st[1];
    $("#tDetail").textContent = st[2];
    $("#tScale").textContent = st[3] ? `pour to ${Math.round(water * st[3])} g` : "";
  }
  $$("#tList li").forEach((li, k) => {
    li.classList.toggle("on", k === i && (T.on || T.t > 0));
    li.classList.toggle("done", k < i);
  });
}
function startTimer() {
  if (T.t >= cur.steps.at(-1)[0]) {
    T.t = 0;
    T.step = -1;
  }
  T.on = true;
  T.last = performance.now();
  $("#tGo").textContent = "Pause";
  $("#tGo").classList.remove("red");
  if (T.t === 0) {
    T.step = -1;
    sound.chime();
  }
  const end = cur.steps.at(-1)[0];
  const tick = (now) => {
    if (!T.on) return;
    T.t += (now - T.last) / 1000;
    T.last = now;
    paint();
    if (T.t >= end) {
      T.t = end;
      paint();
      stopTimer();
      $("#tGo").textContent = "Again";
      return;
    }
    T.raf = requestAnimationFrame(tick);
  };
  T.raf = requestAnimationFrame(tick);
}
function stopTimer(reset) {
  T.on = false;
  cancelAnimationFrame(T.raf);
  if (reset) {
    T.t = 0;
    T.step = -1;
  }
  const g = $("#tGo");
  if (g) {
    g.textContent = reset ? "Start" : T.t > 0 ? "Resume" : "Start";
    g.classList.add("red");
  }
}

lanes();
drawRuler();
const start = location.hash.slice(1);
pick(M.some((m) => m.id === start) ? start : "v60", false, true);
if (M.some((m) => m.id === start))
  setTimeout(() => $("#brewer").scrollIntoView({ block: "start" }), 60);
