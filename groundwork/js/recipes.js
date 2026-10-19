// The pass: the recipe library. Shelves of cups, a caffeine × milk map, a kitchen filter and recipe tickets.
import { $, $$, esc, store, sound, initChrome, clamp } from "./core.js";
import { BRANDS } from "./data/cafe.js";
import { cupSVG, swatch, vesselLabel, INK } from "./cups.js";
import { RECIPES, SHELVES, PANTRY, META, byId } from "./data/recipes.js";

initChrome();

const S = {
  q: "",
  shelf: "all",
  brand: "all",
  t: "all",
  view: "shelves",
  have: new Set(store.get("pantry", [])),
  us: store.get("us", false),
};
const requestedBrand = new URLSearchParams(location.search).get("brand");
if (Object.hasOwn(BRANDS, requestedBrand)) S.brand = requestedBrand;
$("#rxBrand").value = S.brand;
$("#rxBrand").addEventListener("change", (e) => {
  S.brand = e.target.value;
  const url = new URL(location.href);
  if (S.brand === "all") url.searchParams.delete("brand");
  else url.searchParams.set("brand", S.brand);
  history.replaceState(null, "", url);
  chips();
  draw();
});
$("#rxTotal").textContent = RECIPES.length;
const LABEL = Object.fromEntries(PANTRY.flatMap((g) => g.items));
Object.assign(LABEL, {
  shot: "espresso (machine, moka or AeroPress)",
  brewed: "a brewer",
  milk: "milk",
  foam: "a steam wand or frother",
});

/* ------------------------------------------------------------------ what can I make */
const has = (k) => (META[k] ? META[k].some((x) => S.have.has(x)) : S.have.has(k));
function missing(r) {
  return r.needs.filter((n) => !n.split("|").some(has));
}
const needLabel = (n) =>
  n
    .split("|")
    .map((k) => LABEL[k] || k)
    .join(" or ");

/* ------------------------------------------------------------------ filtering */
function matches(r) {
  if (S.brand !== "all" && r.brand !== S.brand) return false;
  if (S.shelf !== "all" && r.s !== S.shelf) return false;
  if (S.t !== "all" && r.t !== S.t) return false;
  if (S.q) {
    const hay = [r.n, r.o, r.note, r.s, BRANDS[r.brand] || "", ...r.spec.map((x) => x[2])]
      .join(" ")
      .toLowerCase();
    if (!S.q.split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ chips */
function chips() {
  const counts = Object.fromEntries(
    SHELVES.map((s) => [
      s.id,
      RECIPES.filter((r) => r.s === s.id && (S.brand === "all" || r.brand === S.brand)).length,
    ]),
  );
  $("#rxChips").innerHTML = [
    `<button class="chip" type="button" data-shelf="all" aria-pressed="${S.shelf === "all"}">All <span class="ct">${RECIPES.length}</span></button>`,
  ]
    .concat(
      SHELVES.map(
        (s) =>
          `<button class="chip" type="button" data-shelf="${s.id}" aria-pressed="${S.shelf === s.id}">${s.label} <span class="ct">${counts[s.id]}</span></button>`,
      ),
    )
    .join("");
}
$("#rxChips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-shelf]");
  if (!b) return;
  S.shelf = b.dataset.shelf;
  sound.click();
  chips();
  draw();
});
$$("[data-t]").forEach((b) =>
  b.addEventListener("click", () => {
    S.t = b.dataset.t;
    $$("[data-t]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    sound.click();
    draw();
  }),
);
$$("[data-view]").forEach((b) =>
  b.addEventListener("click", () => {
    S.view = b.dataset.view;
    $$("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    sound.click();
    draw();
  }),
);
let qt = 0;
$("#rxQ").addEventListener("input", (e) => {
  clearTimeout(qt);
  qt = setTimeout(() => {
    S.q = e.target.value.trim().toLowerCase();
    draw();
  }, 120);
});

/* ------------------------------------------------------------------ shelves */
const cupCache = new Map();
const art = (r) => {
  if (!cupCache.has(r.id)) cupCache.set(r.id, cupSVG(r));
  return cupCache.get(r.id);
};
function cupLink(r) {
  const miss = S.view === "pantry" ? missing(r) : [];
  const dim = S.view === "pantry" && miss.length > 1;
  const flag =
    S.view !== "pantry"
      ? ""
      : miss.length === 0
        ? '<span class="can" aria-hidden="true"></span>'
        : miss.length === 1
          ? `<span class="miss">+1</span>`
          : "";
  const sr =
    S.view !== "pantry"
      ? ""
      : miss.length === 0
        ? " (you can make this)"
        : ` (missing ${miss.map(needLabel).join(", ")})`;
  return `<li><a href="#${r.id}" data-id="${r.id}" class="${dim ? "dim" : ""}" title="${esc(r.n)}${miss.length === 1 ? " — needs " + esc(needLabel(miss[0])) : ""}">${art(r)}<b>${esc(r.n)}</b><small>${esc(shortOrigin(r.o))}</small>${flag}<span class="sr">${esc(sr)}</span></a></li>`;
}
const shortOrigin = (o) => o.split(/[·,(]/)[0].trim();
function drawShelves(list) {
  const out = SHELVES.map((s) => {
    let items = list.filter((r) => r.s === s.id);
    if (!items.length) return "";
    if (S.view === "pantry")
      items = items.slice().sort((a, b) => missing(a).length - missing(b).length);
    return `<section class="shelf" aria-labelledby="sh-${s.id}"><div class="shelf-head"><h2 id="sh-${s.id}">${s.label}</h2><p>${s.line}</p><span>${String(items.length).padStart(2, "0")}</span></div><ul class="cups">${items.map(cupLink).join("")}</ul></section>`;
  }).join("");
  $("#shelves").innerHTML =
    out ||
    `<p class="rx-empty">Nothing matches. Try another shop, shelf or temperature, or a shorter search.</p>`;
}

/* ------------------------------------------------------------------ pantry */
function drawPantry() {
  $("#pantryGroups").innerHTML = PANTRY.map(
    (g) =>
      `<h3>${g.group}</h3><div class="chips">${g.items.map(([k, l]) => `<button class="chip" type="button" data-have="${k}" aria-pressed="${S.have.has(k)}">${l}</button>`).join("")}</div>`,
  ).join("");
  const can = RECIPES.filter((r) => !missing(r).length).length,
    one = RECIPES.filter((r) => missing(r).length === 1).length;
  $("#canN").textContent = can;
  $("#almostN").textContent = one ? `${one} more are one thing away (marked +1).` : "";
}
$("#pantryGroups").addEventListener("click", (e) => {
  const b = e.target.closest("[data-have]");
  if (!b) return;
  const k = b.dataset.have;
  S.have.has(k) ? S.have.delete(k) : S.have.add(k);
  store.set("pantry", [...S.have]);
  sound.tick();
  draw();
});
$("#pTypical").addEventListener("click", () => {
  S.have = new Set([
    "pourover",
    "milk",
    "ice",
    "cocoa",
    "cinnamon",
    "honey",
    "brownsugar",
    "citrus",
    "vanilla",
    "eggs",
    "cream",
    "tea",
    "shaker",
  ]);
  store.set("pantry", [...S.have]);
  sound.click();
  draw();
});
$("#pClear").addEventListener("click", () => {
  S.have.clear();
  store.set("pantry", []);
  sound.click();
  draw();
});

/* ------------------------------------------------------------------ map: caffeine × milk */
function dominant(r) {
  const l = r.layers
    .filter((x) => !/[id]/.test(x[2] || "") && x[0] !== "crema")
    .sort((a, b) => b[1] - a[1])[0];
  return l ? swatch(l[0]) : "#7a4a2b";
}
function drawMap(list) {
  const W = 900,
    H = 440,
    pad = { l: 56, r: 20, t: 20, b: 46 };
  const X = (m) => pad.l + (m / 100) * (W - pad.l - pad.r),
    Y = (c) => H - pad.b - (c / 220) * (H - pad.t - pad.b);
  let g = "";
  for (let c = 0; c <= 200; c += 50)
    g += `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(c)}" y2="${Y(c)}"/><text class="ax" x="${pad.l - 10}" y="${Y(c) + 3}" text-anchor="end">${c}</text>`;
  for (let m = 0; m <= 100; m += 25)
    g += `<line class="grid" y1="${pad.t}" y2="${H - pad.b}" x1="${X(m)}" x2="${X(m)}"/><text class="ax" x="${X(m)}" y="${H - pad.b + 18}" text-anchor="middle">${m}%</text>`;
  g += `<text class="ax" x="${X(50)}" y="${H - 6}" text-anchor="middle">MILK →</text><text class="ax" x="14" y="${Y(110)}" text-anchor="middle" transform="rotate(-90 14 ${Y(110)})">CAFFEINE, MG</text>`;
  // jitter identical points a little so they stay clickable
  const seen = {};
  const pts = list.map((r) => {
    const k = Math.round(r.milk / 5) + ":" + Math.round(r.caf / 12);
    const n = (seen[k] = (seen[k] || 0) + 1) - 1;
    return {
      r,
      x: X(r.milk) + ((n % 3) - 1) * 9 * (n > 0),
      y: Y(r.caf) - Math.floor(n / 3) * 9 - (n > 0 ? 4 : 0),
    };
  });
  const labels = [
    "espresso",
    "cold-brew",
    "latte",
    "turkish",
    "qahwa",
    "ca-phe-sua-da",
    "flat-white",
    "bac-xiu",
  ];
  g += pts
    .map(
      ({ r, x, y }) =>
        `<circle class="pt" tabindex="0" role="button" aria-label="${esc(r.n)}: about ${r.caf} mg estimated caffeine, ${r.milk}% approximate milk" data-id="${r.id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="${dominant(r)}" stroke="#2a1a12" stroke-width="1.4"/>`,
    )
    .join("");
  g += pts
    .filter((p) => labels.includes(p.r.id))
    .map(
      ({ r, x, y }) =>
        `<text x="${x + 12}" y="${y + 4}" font-family="Familjen Grotesk, sans-serif" font-size="12" font-weight="600" fill="#2a1a12" paint-order="stroke" stroke="#fbf7ef" stroke-width="4">${esc(r.n)}</text>`,
    )
    .join("");
  $("#rxMap").innerHTML =
    `<p class="eyebrow" style="margin:4px 0 10px">Caffeine vs milk · ${list.length} drinks</p><svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Each drink plotted by caffeine and milk share">${g}</svg><div class="map-tip" id="tip" hidden></div><p class="muted" style="font-size:12.5px;margin-top:6px">Caffeine is a rough estimate per serving: about 63 mg per espresso shot and 95 mg per 8 oz of brewed coffee (USDA). Beans, dose and size move it a lot.</p>`;
  const tip = $("#tip"),
    box = $("#rxMap");
  box.querySelectorAll(".pt").forEach((p) => {
    const show = () => {
      const r = byId[p.dataset.id],
        b = box.getBoundingClientRect(),
        c = p.getBoundingClientRect();
      tip.hidden = false;
      tip.innerHTML = `${esc(r.n)}<small>~${r.caf} mg · ${r.milk}% milk</small>`;
      tip.style.left = c.left - b.left + c.width / 2 + "px";
      tip.style.top = c.top - b.top + "px";
    };
    p.addEventListener("pointerenter", show);
    p.addEventListener("focus", show);
    p.addEventListener("pointerleave", () => (tip.hidden = true));
    p.addEventListener("blur", () => (tip.hidden = true));
    p.addEventListener("click", () => open(p.dataset.id));
    p.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(p.dataset.id);
      }
    });
  });
}

/* ------------------------------------------------------------------ draw */
function draw() {
  const list = RECIPES.filter(matches);
  $("#rxCount").textContent = `${list.length} of ${RECIPES.length}`;
  $("#pantry").hidden = S.view !== "pantry";
  $("#rxMap").hidden = S.view !== "map";
  $("#shelves").hidden = S.view === "map";
  if (S.view === "pantry") drawPantry();
  if (S.view === "map") drawMap(list);
  else drawShelves(list);
}
$("#shelves").addEventListener("click", (e) => {
  const a = e.target.closest("a[data-id]");
  if (!a) return;
  e.preventDefault();
  open(a.dataset.id);
});

/* ------------------------------------------------------------------ ticket */
const dlg = $("#rx");
const INK_WORDS = [
  ["ice cream", "icecream"],
  ["whipped cream", "whip"],
  ["white chocolate", "vanilla"],
  ["espresso", "espresso"],
  ["ristretto", "espresso"],
  ["shot", "espresso"],
  ["condensed", "condensed"],
  ["half-and-half", "halfhalf"],
  ["cream", "cream"],
  ["gelato", "icecream"],
  ["milk tea", "milktea"],
  ["milk", "steamed"],
  ["chocolate", "chocolate"],
  ["cocoa", "cocoa"],
  ["caramel", "caramel"],
  ["vanilla", "vanilla"],
  ["honey", "honey"],
  ["maple", "maple"],
  ["cinnamon", "spice"],
  ["cardamom", "qahwa"],
  ["matcha", "matcha"],
  ["chai", "chai"],
  ["tonic", "tonic"],
  ["lemon", "lemon"],
  ["orange", "orange"],
  ["whiskey", "whiskey"],
  ["vodka", "vodka"],
  ["liqueur", "liqueur"],
  ["licor", "liqueur"],
  ["rum", "rum"],
  ["grappa", "grappa"],
  ["egg", "egg"],
  ["coconut", "coconut"],
  ["ube", "ube"],
  ["lavender", "lavender"],
  ["pistachio", "pistachio"],
  ["protein", "protein"],
  ["sugar", "sugar"],
  ["piloncillo", "brownsugar"],
  ["water", "water"],
  ["ice", "ice"],
  ["tea", "tea"],
  ["cheese", "cheese"],
  ["coffee", "coffee"],
  ["decoction", "coffee"],
  ["kopi", "kopi"],
  ["salt", "saltcream"],
];
const inkFor = (txt) => {
  const t = txt.toLowerCase();
  const hit = INK_WORDS.find(([w]) => t.includes(w));
  return hit ? swatch(hit[1]) : "#b9a68d";
};
const toUS = (a, u) => {
  if (!S.us) return [a, u];
  if (u === "ml") return [+(a / 29.57).toFixed(a < 60 ? 2 : 1), "fl oz"];
  if (u === "L") return [+(a * 33.8).toFixed(1), "fl oz"];
  if (u === "g") return [+(a / 28.3495).toFixed(a < 15 ? 2 : 1), "oz wt"];
  return [a, u];
};
const fmtAmt = (a, u) => {
  if (!a) return u ? u : "—";
  const [x, y] = toUS(a, u);
  return `${x}${y ? " " + y : ""}`;
};
const BAR = new Set(["espresso", "americano", "cortado", "flat-white", "cappuccino", "latte"]);
let lastFocus = null;
function open(id, push = true) {
  const r = byId[id];
  if (!r) return;
  if (!dlg.open) lastFocus = document.activeElement;
  const miss = missing(r);
  const shelf = SHELVES.find((s) => s.id === r.s);
  $("#rxIn").innerHTML = `
    <div class="rx-art"><span class="stamp">${shelf.label}</span><span class="temp">${r.t === "iced" ? "Iced" : "Hot"}</span>${cupSVG(r, { steam: true })}</div>
    <div class="rx-body">
      <p class="from">${esc(r.o)}</p>
      <h2 id="rxName">${esc(r.n)}</h2>
      <p class="note">${esc(r.note)}</p>
      ${r.serving ? `<p class="rx-serving">${esc(r.serving)}</p>` : ""}
      ${r.brand && r.brand !== "coffeehouse" ? `<p class="rx-adaptation">${esc(BRANDS[r.brand])}-inspired home version. Groundwork’s proportions; not an official recipe.</p>` : ""}
      <div class="rx-tabs"><p class="eyebrow">Spec</p><div class="seg" role="group" aria-label="Units"><button type="button" data-us="0" aria-pressed="${!S.us}">Metric</button><button type="button" data-us="1" aria-pressed="${S.us}">US</button></div></div>
      <ul class="spec">${r.spec.map(([a, u, i]) => `<li><i style="background:${inkFor(i)}"></i><span>${fmtAmt(a, u)}</span>${esc(i)}</li>`).join("")}</ul>
      <ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <p class="rx-caffeine">${esc(r.caffeineNote || "Caffeine is a rough estimate per serving. Beans, dose and brewing can change it considerably.")}</p>
      ${r.source ? `<p class="rx-source"><a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">Original drink / flavour reference ↗</a></p>` : ""}
      <div class="rx-meta"><span>${vesselLabel(r.v)}</span><span>~${r.caf} mg caffeine</span>${r.milk ? `<span>${r.milk}% milk</span>` : ""}${r.needs.length ? `<span>${S.have.size ? (miss.length ? "Missing: " + esc(miss.map(needLabel).join(", ")) : "You have everything") : "Needs: " + esc(r.needs.map(needLabel).join(", "))}</span>` : "<span>Just coffee & water</span>"}</div>
      <div class="row-btns" style="margin-top:16px">${BAR.has(r.id) ? `<a class="btn red small" href="/groundwork/">Make it on the machine</a>` : ""}${r.brew ? `<a class="btn red small" href="/groundwork/brew/#${r.brew}">Brew it with the timer</a>` : ""}</div>
      ${
        r.rel && r.rel.length
          ? `<div class="rx-rel"><h3>Try next</h3><div>${r.rel
              .map((x) => byId[x])
              .filter(Boolean)
              .map((x) => `<a class="chip" href="#${x.id}" data-rel="${x.id}">${esc(x.n)}</a>`)
              .join("")}</div></div>`
          : ""
      }
    </div>`;
  $("#rxIn")
    .querySelectorAll("[data-us]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        S.us = b.dataset.us === "1";
        store.set("us", S.us);
        open(r.id, false);
      }),
    );
  $("#rxIn")
    .querySelectorAll("[data-rel]")
    .forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        open(a.dataset.rel);
        dlg.scrollTop = 0;
      }),
    );
  if (!dlg.open) {
    dlg.showModal();
    sound.click();
  }
  if (push) history.replaceState(null, "", "#" + r.id);
  document.title = `${r.n} | Groundwork`;
}
function close() {
  if (dlg.open) dlg.close();
}
dlg.addEventListener("close", () => {
  history.replaceState(null, "", location.pathname + location.search);
  document.title = "Recipes | Groundwork";
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
});
dlg.addEventListener("click", (e) => {
  if (e.target === dlg || e.target.closest("[data-close]")) close();
});
addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (byId[id]) open(id, false);
  else close();
});

chips();
draw();
const start = location.hash.slice(1);
if (byId[start]) open(start, false);
