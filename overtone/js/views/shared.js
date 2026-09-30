/* OVERTONE · pieces shared between views */
import { esc, store } from '../util.js';
import { pcName } from '../music.js';

export const SECTIONS_META = [
  ['home', 'Home', 'Start here', ''],
  ['bench', 'The Bench', 'Scales · chords · keys', 'Any scale, chord or progression in all twelve keys, the circle of fifths, and the overtone series the site is named after.'],
  ['chords', 'Chord Book', 'Guitar · ukulele · mandolin · bass', 'Where the fingers go, with every shape strummed on a modelled string.'],
  ['ear', 'Ear Training', 'Seven drills', 'Intervals, chords, modes, progressions, meters and notes, with streaks that stay on this device.'],
  ['rhythm', 'Rhythm Room', 'Metronome · drum machine', 'A swinging pendulum metronome and a drum machine with real kits and forty grooves.'],
  ['practice', 'Practice Room', 'Rudiments · gap click', 'Sticking patterns, a click that disappears to test your time, polyrhythms and a subdivision ladder.'],
  ['tuner', 'Tuner & Drone', 'Microphone tuner', 'Tune by microphone with a brass needle, or sing and play against a tanpura drone.'],
  ['sketch', 'Sketchpad', 'Write · loop · export', 'Write a chord progression, hear it with a band behind it, and take it away as MIDI.'],
  ['world', 'Around the World', 'Twelve traditions', 'Twelve musical traditions, with real recordings and phrases you can play.'],
  ['library', 'The Library', 'Plain-language reference', 'Every term, what it is, why it matters, and what people get wrong about it.'],
  ['path', 'The Path', 'Ten stages', 'Ten stages from sound itself to reading the language, in the order they build on each other.']
];

export const PATH = [
  ['Sound, pitch and rhythm', 'What sound physically is, why pitch is frequency, and how the harmonic series quietly decides everything that follows.', 'If you can clap a beat and hum a pitch, you already speak the language.', 'home'],
  ['The keyboard as a map', 'Twelve notes, the repeating pattern, and where the half-steps hide. The fastest way to make theory visible.', 'The keyboard is a ruler for pitch. Learn the map and everything else becomes readable.', 'bench'],
  ['Intervals', 'Naming and hearing the distance between any two notes. The single highest-leverage skill in this whole list.', 'An interval is a relationship, not a note. Hear relationships and songs start talking.', 'ear'],
  ['Scales and modes', 'Major, minor, the seven modes and the pentatonics: how the same notes rearranged produce completely different weather.', 'A scale is a palette. Modes are that palette under different light.', 'bench'],
  ['Chords and harmony', 'Triads, sevenths, inversions and where chords come from. Roman numerals so a progression works in any key.', 'Harmony is melody stacked vertically. When notes agree, emotion multiplies.', 'bench'],
  ['Progressions and cadences', 'How chords move, why some motions feel like gravity, and what a cadence is actually doing to the listener.', 'Function beats memorisation. Learn why V pulls to I and you can build your own.', 'sketch'],
  ['Rhythm, time and groove', 'Time signatures, subdivision, syncopation and swing, plus why perfectly quantised music often feels dead.', 'Groove lives in the spaces between beats as much as on them.', 'rhythm'],
  ['Your instrument, mapped', 'Taking all of the above onto the fretboard, the keys or the voice, so theory becomes something under your fingers.', 'Theory you cannot play is trivia. Put every idea on the instrument.', 'chords'],
  ['Ear training and transcription', 'Recognising intervals, chord quality and progressions by ear, then writing down music you love.', 'Your ear is the final instrument. Train it and the other tools become optional.', 'ear'],
  ['Form, style and listening', 'Song structure, motif, arrangement, production choices, and how to take apart anything you hear.', 'Great music feels inevitable because the structure is invisible. Learn to see it.', 'world']
];
export const EAR_DRILLS = [['interval', 'Intervals'], ['chord', 'Chord quality'], ['scale', 'Scales & modes'], ['prog', 'Progressions'], ['meter', 'Time signatures'], ['read', 'Read the staff'], ['pitch', 'Name the note']];

export function progress() {
  const done = store.get('path', []);
  const open = PATH.findIndex((_, i) => !done.includes(i));
  const best = Math.max(0, ...EAR_DRILLS.map(([id]) => store.get('best.' + id, 0)));
  return { done, total: PATH.length, pct: Math.round(done.length / PATH.length * 100), next: PATH[open === -1 ? PATH.length - 1 : open], best };
}

export function vhead(eyebrow, title, lede) {
  return `<header class="vhead"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2>${lede ? `<p>${lede}</p>` : ''}</header>`;
}

/* a one-octave keyboard for choosing a key */
const WHITE = [0, 2, 4, 5, 7, 9, 11], BLACK = [[1, 1], [3, 2], [6, 4], [8, 5], [10, 6]];
export function keyPicker(sel, action, label = 'Key') {
  const w = WHITE.map(p => `<button class="w" data-act="${action}" data-v="${p}" aria-pressed="${p === sel}" aria-label="${label} ${esc(pcName(p, false))}">${esc(pcName(p, false))}</button>`).join('');
  const b = BLACK.map(([p, pos]) => `<button class="b" style="left:${(pos / 7) * 100}%" data-act="${action}" data-v="${p}" aria-pressed="${p === sel}" aria-label="${label} ${esc(pcName(p, true))}">${esc(pcName(p, [1, 3, 8, 10].includes(p)))}</button>`).join('');
  return `<div class="keypick" role="group" aria-label="${label}">${w}${b}</div>`;
}

/* play / stop button markup */
export const playBtn = (act, on, label = 'Play', stopLabel = 'Stop', id = '') =>
  `<button class="btn ${on ? 'live' : 'btn-brass'}" data-act="${act}" ${id ? `id="${id}"` : ''} aria-pressed="${!!on}">${on ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>${stopLabel}` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>${label}`}</button>`;
export function setPlayBtn(el, on, label = 'Play', stopLabel = 'Stop') {
  if (!el) return;
  el.className = 'btn ' + (on ? 'live' : 'btn-brass');
  el.setAttribute('aria-pressed', String(!!on));
  el.innerHTML = on ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>${stopLabel}` : `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12-7.5z"/></svg>${label}`;
}
