// Beans: roast slider with real crack sounds, coffee-cherry cutaway per process, the coffee belt.
import { $, $$, esc, sound, initChrome, clamp, lerp, mix, reduced } from "./core.js";
import BELT from "./data/belt.js";

initChrome();

/* ------------------------------------------------------------------ roast */
const ROAST = [
  {
    at: 0,
    t: 25,
    c: "#93a06f",
    n: "Green",
    d: "Raw seed: grassy, beany, hard as a pebble. Not drinkable yet.",
    b: [0, 0, 0, 0, 0],
  },
  {
    at: 15,
    t: 160,
    c: "#c8b26b",
    n: "Yellowing",
    d: "Drying out. Smells of hay and baking bread.",
    b: [10, 5, 5, 0, 10],
  },
  {
    at: 32,
    t: 200,
    c: "#a8693a",
    n: "First crack",
    d: "Pop! Steam and gas burst the bean. Light roasts are dropped soon after.",
    b: [90, 40, 25, 10, 95],
  },
  {
    at: 42,
    t: 208,
    c: "#8c5530",
    n: "Light",
    d: "Bright and floral: fruit, tea, citrus. The farm shines through.",
    b: [85, 55, 35, 15, 90],
  },
  {
    at: 55,
    t: 216,
    c: "#6a3e22",
    n: "Medium",
    d: "Balanced: caramel, nuts, chocolate. Most espresso lives here.",
    b: [55, 80, 60, 35, 60],
  },
  {
    at: 72,
    t: 225,
    c: "#4a2a17",
    n: "Second crack",
    d: "A quieter, faster crackle. Oils start to rise to the surface.",
    b: [30, 65, 80, 60, 35],
  },
  {
    at: 85,
    t: 233,
    c: "#33190e",
    n: "Dark",
    d: "Smoky, bittersweet, heavy. Roast flavour over origin.",
    b: [15, 45, 85, 80, 15],
  },
  {
    at: 100,
    t: 245,
    c: "#1e0f08",
    n: "Very dark",
    d: "Charred and thin. Very little of the farm left.",
    b: [5, 20, 60, 95, 5],
  },
];
const BARS = ["Acidity", "Sweetness", "Body", "Bitterness", "Origin"];
$("#roastBars").innerHTML = BARS.map(
  (n, i) =>
    `<div><span>${n}</span><span class="b"><i id="rb${i}" style="--v:0"></i></span><span class="num" id="rv${i}">0</span></div>`,
).join("");
const rb = $("#roastBean");
rb.innerHTML = `<defs><radialGradient id="rbSheen" cx="38%" cy="30%" r="40%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  <g id="rbG"><ellipse id="rbBody" cx="100" cy="100" rx="54" ry="74" transform="rotate(28 100 100)" stroke="#2a1a12" stroke-width="3"/>
  <path id="rbCrease" d="M72 152c26-22 8-62 58-104" fill="none" stroke-width="5" stroke-linecap="round"/>
  <ellipse id="rbOil" cx="84" cy="70" rx="22" ry="30" transform="rotate(28 100 100)" fill="url(#rbSheen)" opacity="0"/>
  <path id="rbChaff" d="M72 152c26-22 8-62 58-104" fill="none" stroke="#efe4c8" stroke-width="2" stroke-dasharray="3 6" opacity=".8"/></g>`;
let lastPos = 0;
function roast(pos) {
  let i = ROAST.findIndex((s) => s.at >= pos);
  if (i <= 0) i = 1;
  const a = ROAST[i - 1],
    b = ROAST[i],
    t = (pos - a.at) / (b.at - a.at || 1);
  const near = pos - a.at < b.at - pos ? a : b;
  const col = mix(a.c, b.c, t);
  $("#rbBody").setAttribute("fill", col);
  $("#rbCrease").setAttribute("stroke", mix(col, "#0d0603", 0.55));
  $("#rbOil").setAttribute("opacity", clamp((pos - 70) / 25, 0, 0.9));
  $("#rbChaff").setAttribute("opacity", clamp(1 - pos / 40, 0, 0.8));
  $("#rbG").setAttribute(
    "transform",
    `translate(100 100) scale(${1 + (pos / 100) * 0.28}) translate(-100 -100)`,
  );
  $("#roastStage").style.background = mix("#ece0cc", "#d9c3a3", pos / 100);
  $("#roastT").textContent = Math.round(lerp(a.t, b.t, t)) + " °C";
  $("#roastName").textContent = near.n;
  $("#roastNotes").textContent = near.d;
  BARS.forEach((_, k) => {
    const v = Math.round(lerp(a.b[k], b.b[k], t));
    $("#rb" + k).style.setProperty("--v", v);
    $("#rv" + k).textContent = v;
  });
  $("#roastRange").setAttribute(
    "aria-valuetext",
    `${near.n}, about ${Math.round(lerp(a.t, b.t, t))} degrees`,
  );
  // the cracks you can hear
  if (lastPos < 32 && pos >= 32) crackle(9, 1);
  if (lastPos < 72 && pos >= 72) crackle(14, 0.55);
  lastPos = pos;
}
function crackle(n, vol) {
  for (let k = 0; k < n; k++)
    setTimeout(
      () => {
        sound.pop();
        if (!reduced())
          $("#roastBean").animate(
            [
              { transform: "none" },
              { transform: `translate(${(Math.random() - 0.5) * 5}px, -3px)` },
              { transform: "none" },
            ],
            { duration: 90 },
          );
      },
      k * (vol < 1 ? 45 : 90) + Math.random() * 60,
    );
}
const rr = $("#roastRange");
rr.addEventListener("input", () => {
  rr.style.setProperty("--fill", rr.value + "%");
  roast(+rr.value);
});
rr.style.setProperty("--fill", "0%");
roast(0);

/* ------------------------------------------------------------------ process: cherry cutaway */
const LAYERS = [
  ["skin", "Skin", "#b3362b"],
  ["pulp", "Pulp", "#f0cfa8"],
  ["mucilage", "Mucilage", "#e3ac55"],
  ["parchment", "Parchment", "#efe3c4"],
  ["seed", "Seed", "#9aa27c"],
];
$("#cherry").innerHTML = `<svg viewBox="0 0 400 400">
  <defs><radialGradient id="chSkin" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#d4574a"/><stop offset=".6" stop-color="#b3362b"/><stop offset="1" stop-color="#7d1f18"/></radialGradient>
  <radialGradient id="chPulp" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#f7e3c6"/><stop offset="1" stop-color="#eec29a"/></radialGradient></defs>
  <g id="tank" opacity="0"><rect x="22" y="22" width="356" height="356" rx="40" fill="none" stroke="#2a1a12" stroke-width="3" stroke-dasharray="10 8"/><text x="200" y="16" text-anchor="middle" font-family="Martian Mono, monospace" font-size="12" fill="#2a1a12" letter-spacing="2">SEALED · NO O₂</text><g id="bubbles" fill="none" stroke="#7a4a2b" stroke-width="2"></g></g>
  <g class="layer" id="L-skin"><ellipse cx="200" cy="205" rx="150" ry="160" fill="url(#chSkin)" stroke="#2a1a12" stroke-width="3"/><path d="M200 46c6-14 18-24 34-28" fill="none" stroke="#5e6b45" stroke-width="6" stroke-linecap="round"/><ellipse cx="140" cy="120" rx="30" ry="16" fill="#fff" opacity=".22" transform="rotate(-30 140 120)"/></g>
  <g class="layer" id="L-pulp"><ellipse cx="200" cy="205" rx="128" ry="138" fill="url(#chPulp)"/></g>
  <g class="layer" id="L-mucilage"><ellipse cx="200" cy="205" rx="104" ry="114" fill="#e3ac55" opacity=".55"/><ellipse cx="200" cy="205" rx="104" ry="114" fill="none" stroke="#c8892e" stroke-width="2" stroke-dasharray="2 6"/></g>
  <g class="layer" id="L-parchment"><path d="M196 92Q120 96 112 205Q120 314 196 318Z" fill="#efe3c4" stroke="#2a1a12" stroke-width="2.4"/><path d="M204 92Q280 96 288 205Q280 314 204 318Z" fill="#efe3c4" stroke="#2a1a12" stroke-width="2.4"/></g>
  <g class="layer" id="L-seed"><path d="M190 104Q130 110 124 205Q130 300 190 306Z" fill="#9aa27c" stroke="#2a1a12" stroke-width="2.4"/><path d="M210 104Q270 110 276 205Q270 300 210 306Z" fill="#9aa27c" stroke="#2a1a12" stroke-width="2.4"/><path d="M180 130q-20 75 0 150M220 130q20 75 0 150" fill="none" stroke="#6e7652" stroke-width="2.4" stroke-linecap="round"/></g>
</svg>`;
const PROC = {
  washed: {
    n: "Washed",
    off: ["skin", "pulp", "mucilage"],
    line: "Fruit stripped off, the sticky layer fermented away and washed, then the seed dries in its parchment.",
    out: [
      ["Drying", "1–2 weeks"],
      ["Tastes", "Clean, bright, tea-like"],
      ["Water", "The most"],
    ],
  },
  honey: {
    n: "Honey",
    off: ["skin", "pulp"],
    line: "Skin and pulp come off; the sugary, sticky mucilage stays on while it dries. Turned every hour or two.",
    out: [
      ["Drying", "2–3 weeks"],
      ["Tastes", "Sweet, rounded, syrupy"],
      ["Water", "Little"],
    ],
  },
  natural: {
    n: "Natural",
    off: [],
    dried: true,
    line: "The whole cherry dries in the sun like a raisin, seed inside. Needs a dry climate and patience.",
    out: [
      ["Drying", "3–6 weeks"],
      ["Tastes", "Fruity, winey, heavy"],
      ["Water", "Almost none"],
    ],
  },
  anaerobic: {
    n: "Anaerobic",
    off: [],
    tank: true,
    line: "Cherries or seeds sealed in tanks without oxygen for a day or three, then dried. Experimental and loud.",
    out: [
      ["Ferments", "24–72 hours sealed"],
      ["Tastes", "Tropical, boozy, intense"],
      ["Water", "Varies"],
    ],
  },
};
let bubT = null;
function proc(id) {
  const p = PROC[id];
  LAYERS.forEach(([k]) => $("#L-" + k).classList.toggle("off", p.off.includes(k)));
  $("#L-skin ellipse").setAttribute(
    "fill",
    p.dried ? "#5a1f1a" : p.tank ? "#8e2820" : "url(#chSkin)",
  );
  $("#L-skin").style.transform = p.dried ? "scale(.93)" : "";
  $("#tank").setAttribute("opacity", p.tank ? 1 : 0);
  clearInterval(bubT);
  $("#bubbles").innerHTML = "";
  if (p.tank && !reduced())
    bubT = setInterval(() => {
      const g = $("#bubbles");
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const x = 60 + Math.random() * 280;
      c.setAttribute("cx", x);
      c.setAttribute("cy", 360);
      c.setAttribute("r", 3 + Math.random() * 6);
      g.appendChild(c);
      c.animate(
        [
          { transform: "translateY(0)", opacity: 0.8 },
          { transform: "translateY(-320px)", opacity: 0 },
        ],
        { duration: 2600, easing: "ease-in" },
      ).onfinish = () => c.remove();
    }, 220);
  $("#procName").textContent = p.n;
  $("#procLine").textContent = p.line;
  $("#layerKey").innerHTML =
    LAYERS.map(
      ([k, n, c]) =>
        `<span class="${p.off.includes(k) ? "gone" : ""}"><i style="background:${c}"></i>${n}</span>`,
    ).join("") +
    `<span class="muted">${p.off.length ? "Struck through: removed before drying" : "Everything stays on"}</span>`;
  $("#procOut").innerHTML = p.out
    .map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`)
    .join("");
  $$("#procTabs [data-p]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.p === id)),
  );
}
$("#procTabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-p]");
  if (!b) return;
  proc(b.dataset.p);
  sound.click();
});
proc("washed");

/* ------------------------------------------------------------------ coffee belt (USDA FAS, July 2026, forecast 2026/27, million 60-kg bags) */
const WORLD = 189.7;
const ORIGINS = [
  {
    id: "brazil",
    n: "Brazil",
    lon: -45,
    lat: -19.5,
    prod: 71.9,
    sp: "47.5 M arabica · 24.4 M robusta",
    alt: "800–1,300 m",
    d: "Nuts, milk chocolate, low acidity. The backbone of most espresso blends.",
  },
  {
    id: "vietnam",
    n: "Vietnam",
    lon: 108,
    lat: 12.7,
    prod: 32.5,
    sp: "31.4 M robusta",
    alt: "500–800 m",
    d: "Bold, dark chocolate, earthy. The world’s robusta engine, and the phin-drip at home.",
  },
  {
    id: "colombia",
    n: "Colombia",
    lon: -75.5,
    lat: 4.5,
    prod: 13.4,
    sp: "All arabica",
    alt: "1,200–2,000 m",
    d: "Caramel, red fruit, balanced. Many regions harvest twice a year.",
  },
  {
    id: "ethiopia",
    n: "Ethiopia",
    lon: 38.5,
    lat: 7,
    prod: 12.1,
    sp: "All arabica",
    alt: "1,500–2,200 m",
    d: "Jasmine, berries, citrus, tea. Arabica’s wild birthplace, with thousands of heirloom varieties.",
  },
  {
    id: "indonesia",
    n: "Indonesia",
    lon: 101.5,
    lat: -1.5,
    prod: 11.4,
    sp: "10.0 M robusta · 1.4 M arabica",
    alt: "Arabica 1,000–1,600 m",
    d: "Sumatra’s wet-hulled arabica: earthy, herbal, syrupy.",
  },
  {
    id: "uganda",
    n: "Uganda",
    lon: 32.3,
    lat: 1.3,
    prod: 7.2,
    sp: "6.0 M robusta · 1.1 M arabica",
    alt: "900–1,500 m",
    d: "Chocolatey robusta, some still wild. Excelsa is spreading here.",
  },
  {
    id: "india",
    n: "India",
    lon: 75.7,
    lat: 13.3,
    prod: 6.1,
    sp: "4.6 M robusta · 1.6 M arabica",
    alt: "Shade-grown, 600–1,600 m",
    d: "Spicy and low in acid. Home of monsooned Malabar.",
  },
  {
    id: "honduras",
    n: "Honduras",
    lon: -86.8,
    lat: 14.8,
    prod: 6.0,
    sp: "All arabica",
    alt: "1,000–1,700 m",
    d: "Caramel and stone fruit. Central America’s biggest grower.",
  },
  {
    id: "peru",
    n: "Peru",
    lon: -77,
    lat: -7,
    prod: 4.8,
    sp: "All arabica",
    alt: "1,200–2,000 m",
    d: "Mild, sweet and nutty; a leader in organic coffee.",
  },
  {
    id: "mexico",
    n: "Mexico",
    lon: -93,
    lat: 16.7,
    prod: 4.1,
    sp: "3.6 M arabica · 0.6 M robusta",
    alt: "900–1,700 m",
    d: "Light, nutty, cocoa. Chiapas, Veracruz, Oaxaca.",
  },
  {
    id: "guatemala",
    n: "Guatemala",
    lon: -90.5,
    lat: 15.2,
    prod: 3.3,
    sp: "Mostly arabica",
    alt: "1,300–2,000 m",
    d: "Chocolate, spice and bright acidity from volcanic soil.",
  },
  {
    id: "kenya",
    n: "Kenya",
    lon: 37,
    lat: -0.4,
    prod: 0.95,
    sp: "Arabica (SL28, SL34)",
    alt: "1,400–2,000 m",
    d: "Blackcurrant, grapefruit, juicy acidity.",
  },
  {
    id: "panama",
    n: "Panama",
    lon: -82.4,
    lat: 8.8,
    prod: null,
    sp: "Arabica, famous for Geisha",
    alt: "1,400–1,900 m",
    d: "Geisha tastes of jasmine and bergamot. A 2025 lot sold for $30,204 per kilo.",
  },
  {
    id: "yemen",
    n: "Yemen",
    lon: 44.2,
    lat: 15.3,
    prod: null,
    sp: "Arabica, on stone terraces",
    alt: "1,500–2,500 m",
    d: "Where coffee first became a drink, in the 1400s. The port of Mocha named the mocha.",
  },
  {
    id: "rwanda",
    n: "Rwanda",
    lon: 29.9,
    lat: -2,
    prod: null,
    sp: "Arabica",
    alt: "1,500–2,000 m",
    d: "Red fruit and black tea, from a country rebuilt partly on washing stations.",
  },
  {
    id: "jamaica",
    n: "Jamaica",
    lon: -76.7,
    lat: 18.1,
    prod: null,
    sp: "Arabica (Blue Mountain)",
    alt: "900–1,700 m",
    d: "Blue Mountain: mild, smooth and famously expensive.",
  },
];
const LABELS = [
  "brazil",
  "vietnam",
  "colombia",
  "ethiopia",
  "indonesia",
  "india",
  "peru",
  "yemen",
  "mexico",
  "kenya",
];
const X = (lon) => BELT.W / 2 + (lon - 20) * BELT.k,
  Y = (lat) => BELT.H / 2 - lat * BELT.k;
function drawBelt() {
  const ty = Y(23.44),
    by = Y(-23.44),
    ey = Y(0);
  let s = `<svg viewBox="0 0 ${BELT.W} ${BELT.H}" role="group" aria-label="Coffee-growing countries between the tropics, sized by production">
    <rect width="${BELT.W}" height="${BELT.H}" fill="#e7dcc8"/>
    <rect x="0" y="${ty}" width="${BELT.W}" height="${by - ty}" fill="#d9c9ad" opacity=".25"/>
    <path class="land" d="${BELT.land}"/>`;
  for (const [id, d] of Object.entries(BELT.countries))
    s += `<path class="grow" data-id="${id}" d="${d}"><title>${id.replace(/-/g, " ")}</title></path>`;
  s += `<line class="tropic" x1="0" x2="${BELT.W}" y1="${ty}" y2="${ty}"/><line class="tropic" x1="0" x2="${BELT.W}" y1="${by}" y2="${by}"/><line class="tropic" x1="0" x2="${BELT.W}" y1="${ey}" y2="${ey}" stroke-dasharray="1 5"/>
    <text class="tl" x="8" y="${ty - 4}">TROPIC OF CANCER</text><text class="tl" x="8" y="${ey - 4}">EQUATOR</text><text class="tl" x="8" y="${by + 11}">TROPIC OF CAPRICORN</text>`;
  ORIGINS.forEach((o) => {
    const r = o.prod ? Math.max(4, Math.sqrt(o.prod) * 3.1) : 3.4;
    s += `<circle class="bub" tabindex="0" role="button" aria-label="${o.n}${o.prod ? `: ${o.prod} million bags` : ""}" data-id="${o.id}" cx="${X(o.lon).toFixed(1)}" cy="${Y(o.lat).toFixed(1)}" r="${r.toFixed(1)}" ${o.prod ? "" : 'fill="#7a4a2b"'}/>`;
    if (LABELS.includes(o.id))
      s += `<text class="bl" x="${(X(o.lon) + r + 3).toFixed(1)}" y="${(Y(o.lat) + 3).toFixed(1)}">${o.n}</text>`;
  });
  $("#beltMap").innerHTML = s + "</svg>";
  $("#beltMap").addEventListener("click", (e) => {
    const t = e.target.closest("[data-id]");
    if (t && ORIGINS.some((o) => o.id === t.dataset.id)) pick(t.dataset.id);
  });
  $("#beltMap").addEventListener("keydown", (e) => {
    const t = e.target.closest(".bub");
    if (t && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      pick(t.dataset.id);
    }
  });
  $("#originList").innerHTML = ORIGINS.map(
    (o) =>
      `<button class="chip" type="button" data-o="${o.id}" aria-pressed="false">${o.n}</button>`,
  ).join("");
  $("#originList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-o]");
    if (b) pick(b.dataset.o);
  });
}
function pick(id) {
  const o = ORIGINS.find((x) => x.id === id);
  if (!o) return;
  $$("#beltMap .on").forEach((n) => n.classList.remove("on"));
  $$(`#beltMap [data-id="${id}"]`).forEach((n) => n.classList.add("on"));
  $$("#originList [data-o]").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.o === id)),
  );
  $("#originCard").innerHTML =
    `<div><h3>${esc(o.n)}</h3><p class="notes">${esc(o.d)}</p><div class="meta"><span>${esc(o.sp)}</span><span>${esc(o.alt)}</span></div></div>
    <div class="big">${o.prod ? `${o.prod} M<small>bags · ${((o.prod / WORLD) * 100).toFixed(o.prod < 2 ? 1 : 0)}% of world</small>` : `<small>small, prized crops</small>`}</div>`;
  sound.tick();
}
drawBelt();
pick("brazil");
