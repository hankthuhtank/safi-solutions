import { $, esc, store, clamp } from "./core.js";

const audio = new Audio();
audio.preload = "none";
let catalog;
let list = [];
let index = 0;
let active = false;
let failures = 0;
let request = 0;
const style = $("#musicStyle");
const volume = $("#musicVolume");
const play = $("#musicPlay");
style.value = ["jazzcafe", "lofi"].includes(store.get("musicStyle", "jazzcafe"))
  ? store.get("musicStyle", "jazzcafe")
  : "jazzcafe";
volume.value = clamp(Number(store.get("musicVolume", 25)) || 0, 0, 100);
audio.volume = Number(volume.value) / 100;

function state(playing) {
  active = playing;
  play.textContent = playing ? "Pause" : "Play";
  play.setAttribute("aria-pressed", String(playing));
  play.setAttribute("aria-label", `${playing ? "Pause" : "Play"} café music`);
}
async function loadList() {
  if (!catalog) {
    const response = await fetch("/groundwork/media/music/catalog.json");
    if (!response.ok) throw new Error("Music catalog unavailable");
    const data = await response.json();
    catalog = data.tracks;
  }
  list = catalog.filter(
    (t) =>
      t.s === "fma" &&
      t.b.includes(style.value) &&
      t.d >= 90 &&
      /^\/groundwork\/media\/music\/[a-z0-9]+\.mp3$/.test(t.u) &&
      (t.l === "CC0" || /^CC BY(?:-SA)? [\d.]+$/.test(t.l)),
  );
  if (!list.length) throw new Error("No tracks available");
  // A different first record each visit, followed by a full playlist.
  index = Math.floor(Math.random() * list.length);
}
function trackInfo(t) {
  audio.volume = clamp((Number(volume.value) / 100) * Math.pow(10, (t.g || 0) / 20), 0, 1);
  $("#musicStatus").textContent = `${t.t} · ${t.a}`;
  $("#musicCredit").innerHTML =
    `<a href="${esc(t.p)}" target="_blank" rel="noopener noreferrer">${esc(t.t)}</a> by ${esc(t.a)} · <a href="${esc(t.lu)}" target="_blank" rel="noopener noreferrer">${esc(t.l)}</a> · ${t.s === "fma" ? "Free Music Archive" : "Internet Archive"}. Volume adjusted. Same collection as <a href="/vibey/">Vibey</a>.`;
}
async function start(next = false) {
  const token = ++request;
  state(true);
  try {
    if (!list.length) {
      $("#musicStatus").textContent = "Finding a record…";
      await loadList();
    }
    if (token !== request || !active) return;
    if (next) index = (index + 1) % list.length;
    const t = list[index];
    if (!audio.src || next) {
      audio.src = t.u;
      trackInfo(t);
    }
    await audio.play();
    if (token !== request) return;
    failures = 0;
  } catch (e) {
    if (token !== request || e.name === "AbortError") return;
    if (e.name === "NotAllowedError") {
      state(false);
      $("#musicStatus").textContent = "Press Play to start the music.";
      return;
    }
    unavailable();
  }
}
function unavailable() {
  audio.pause();
  request++;
  state(false);
  $("#musicStatus").textContent = "This record could not load. Try Next or Play.";
  audio.removeAttribute("src");
  audio.load();
}
play.addEventListener("click", () => {
  if (active) {
    request++;
    audio.pause();
    state(false);
  } else start();
});
$("#musicNext").addEventListener("click", () => {
  failures = 0;
  start(true);
});
audio.addEventListener("ended", () => start(true));
audio.addEventListener("error", () => {
  if (!active) return;
  if (++failures >= 3) unavailable();
  else start(true);
});
style.addEventListener("change", () => {
  store.set("musicStyle", style.value);
  request++;
  const resume = active;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  list = [];
  if (resume) start();
  else $("#musicStatus").textContent = `${style.selectedOptions[0].text} · ready when you are.`;
});
volume.addEventListener("input", () => {
  store.set("musicVolume", Number(volume.value));
  const t = list[index];
  audio.volume = clamp((Number(volume.value) / 100) * Math.pow(10, (t?.g || 0) / 20), 0, 1);
});
// Page navigation keeps preferences; playback always starts with a deliberate click.
addEventListener("pagehide", () => {
  request++;
  audio.pause();
  state(false);
});

// Fetch the track list before Play so the first click can start audio promptly.
loadList().catch(() => {});
