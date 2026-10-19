import { $, esc, sound } from "./core.js";
import { cupSVG } from "./cups.js";
import { byId } from "./data/recipes.js";
import { BRANDS } from "./data/cafe.js";

const picks = [
  "sb-iced-caramel-macchiato",
  "db-golden-eagle",
  "dd-caramel-craze",
  "iced-spanish-latte",
  "brown-sugar-shaken",
  "sb-vanilla-sweet-cream",
  "sb-peppermint-mocha",
  "dd-butter-pecan",
  "mc-mocha-frappe",
  "iced-honey-oat",
  "sb-pumpkin-cream-brew",
  "db-caramelizer",
  "coconut-iced-latte",
  "dd-blueberry-crisp",
  "sb-cinnamon-dolce",
  "affogato",
  "maple-cream-brew",
  "db-kicker",
  "hazelnut-mocha",
  "sb-iced-white-mocha",
  "dd-turtle-latte",
  "espresso-tonic",
  "mc-caramel-frappe",
  "orange-espresso",
  "ca-phe-sua-da",
  "sb-caramel-blended",
  "honey-latte",
  "db-annihilator",
];

const dayNumber = (d = new Date()) =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
let day = dayNumber();
let selected = day % picks.length;

function daily(shuffled = false) {
  const r = byId[picks[selected]];
  $("#dailyLabel").textContent = shuffled ? "Another to try" : "Recipe of the day";
  $("#dailyDate").dateTime = new Date().toLocaleDateString("en-CA");
  $("#dailyDate").textContent = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  $("#dailyRecipe").innerHTML = `
    <a class="daily-art" href="/groundwork/recipes/#${r.id}" aria-label="Open ${esc(r.n)} recipe">${cupSVG(r, { steam: r.t === "hot" })}<span>${r.blended ? "Blended & chilled" : r.t === "hot" ? "Served warm" : "Over ice"}</span></a>
    <div class="daily-copy"><p class="daily-origin">${esc(r.o)}</p><h2 id="daily-h">${esc(r.n)}</h2><p>${esc(r.note)}</p>
    <div class="daily-spec"><div><h3>In your cup</h3><ul>${r.spec.map(([a, u, i]) => `<li><b>${a ? `${a} ${esc(u)}` : ""}</b> ${esc(i)}</li>`).join("")}</ul></div>
    <div><h3>Make it</h3><ol>${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div></div>
    <a class="btn red" href="/groundwork/recipes/#${r.id}">Open recipe & measurements →</a></div>`;
}
daily();
$("#dailyShuffle").addEventListener("click", () => {
  selected = (selected + 1 + Math.floor(Math.random() * (picks.length - 1))) % picks.length;
  sound.click();
  daily(true);
});
setInterval(() => {
  if (day === dayNumber()) return;
  day = dayNumber();
  selected = day % picks.length;
  daily();
}, 60000);

const showcases = {
  starbucks: [
    "sb-iced-caramel-macchiato",
    "sb-vanilla-sweet-cream",
    "sb-pumpkin-cream-brew",
    "sb-iced-white-mocha",
  ],
  dunkin: ["dd-caramel-craze", "dd-cocoa-mocha", "dd-butter-pecan", "dd-turtle-latte"],
  dutch: ["db-golden-eagle", "db-caramelizer", "db-kicker", "db-annihilator"],
  mccafe: ["mc-caramel-frappe", "mc-mocha-frappe", "mc-iced-mocha", "mc-caramel-macchiato"],
  coffeehouse: ["iced-spanish-latte", "iced-honey-oat", "orange-espresso", "hazelnut-mocha"],
};
function showBrand(brand) {
  $("#cafeBrands").innerHTML = Object.entries(BRANDS)
    .map(
      ([id, name]) =>
        `<button type="button" class="chip" data-brand="${id}" aria-pressed="${id === brand}">${esc(name)}</button>`,
    )
    .join("");
  $("#cafePicks").innerHTML = showcases[brand]
    .map((id) => {
      const r = byId[id];
      return `<li><a href="/groundwork/recipes/#${id}">${cupSVG(r)}<span>${esc(r.n)}</span><small>${r.t === "iced" ? "Iced" : "Hot"} · Open recipe →</small></a></li>`;
    })
    .join("");
}
showBrand("starbucks");
$("#cafeBrands").addEventListener("click", (e) => {
  const b = e.target.closest("[data-brand]");
  if (!b) return;
  const brand = b.dataset.brand;
  showBrand(brand);
  // Retain focus after replacing the filter row.
  $(`[data-brand="${brand}"]`).focus({ preventScroll: true });
  sound.click();
});
