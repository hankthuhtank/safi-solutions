/* Schedule G, Glossary: search, filter by form, and jump by letter. Every card is in the HTML; this only hides. */
import { boot, $, $$ } from "../ui.js";

boot();

const input = $("#gl-q"),
  empty = $(".gl-empty"),
  count = $("[data-gl-count]");
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
const cards = $$(".gl-card").map((c) => ({
  c,
  names: norm(c.dataset.names),
  text: norm(c.textContent),
  mod: c.dataset.module,
  letter: c.dataset.letter,
}));
const total = cards.length;
let mod = "all";

function apply() {
  const q = norm(input.value.trim());
  // a name match always counts; the definition text counts from three letters on, at the start of a word
  const word = q.length >= 3 ? new RegExp("\\b" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) : null;
  const seen = new Set();
  let shown = 0;
  for (const it of cards) {
    const ok =
      (mod === "all" || it.mod === mod) &&
      (!q || it.names.includes(q) || (word && word.test(it.text)));
    it.c.hidden = !ok;
    if (ok) {
      shown++;
      seen.add(it.letter);
    }
  }
  $$(".gl-letter").forEach((h) => (h.hidden = !seen.has(h.dataset.letter)));
  $$(".gl-letters a").forEach((a) => a.classList.toggle("off", !seen.has(a.dataset.letter)));
  empty.hidden = shown > 0;
  count.textContent = shown === total ? `${total} terms` : `${shown} of ${total} terms`;
}

input.addEventListener("input", apply);
$$(".gl-filter button").forEach((b) =>
  b.addEventListener("click", () => {
    mod = b.dataset.mod;
    $$(".gl-filter button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    apply();
  }),
);
$("[data-gl-reset]").addEventListener("click", () => {
  input.value = "";
  mod = "all";
  $$(".gl-filter button").forEach((x) =>
    x.setAttribute("aria-pressed", String(x.dataset.mod === "all")),
  );
  apply();
  input.focus();
});

// a link to a hidden card (from another page or a letter) clears the filters first
function reveal() {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id && document.getElementById(id);
  if (el && (el.hidden || el.closest("[hidden]"))) {
    input.value = "";
    mod = "all";
    $$(".gl-filter button").forEach((x) =>
      x.setAttribute("aria-pressed", String(x.dataset.mod === "all")),
    );
    apply();
    el.scrollIntoView();
  }
}
addEventListener("hashchange", reveal);
reveal();

// "/" jumps to the search box, the way it does on most reference sites
addEventListener("keydown", (e) => {
  if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
    e.preventDefault();
    input.focus();
  }
});
