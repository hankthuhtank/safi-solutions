/* OVERTONE · music theory helpers
   Spelling (so F major shows B♭, not A♯), chord naming from any
   set of notes, voice leading, and the diatonic chord machinery. */
import { OT } from './util.js';

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const ACC_SIGN = { '-2': '𝄫', '-1': '♭', '0': '', '1': '♯', '2': '𝄪' };

export const pc = n => ((n % 12) + 12) % 12;
export const midiOf = (p, oct) => 12 * (oct + 1) + p;
export const freq = m => 440 * Math.pow(2, (m - 69) / 12);
export const octaveOf = m => Math.floor(m / 12) - 1;

/* loose-note spelling preference, set from whatever key is in view */
let flats = false;
let spellMap = null;           /* pc -> {letter, acc} for the key in view */
export function setFlats(v) { flats = !!v; }
export function useKey(rootPc, scaleOrNull) {
  spellMap = null;
  if (scaleOrNull) {
    const sp = spellScale(rootPc, scaleOrNull);
    spellMap = {};
    sp.forEach(n => { spellMap[n.pc] = n; });
    flats = sp.some(n => n.acc < 0) || (sp[0].acc === 0 && OT.FLAT_KEYS.includes(rootPc));
  } else flats = OT.FLAT_KEYS.includes(pc(rootPc));
}
export const prefersFlats = () => flats;

export function pcName(p, useFlats = flats) {
  const k = pc(p);
  if (spellMap && spellMap[k] && useFlats === flats) return spellMap[k].name;
  return (useFlats ? OT.FLAT : OT.SHARP)[k];
}
export const midiName = (m, useFlats) => pcName(m, useFlats) + octaveOf(m);

/* ---- spelling ---- */
const accFor = d => { const x = pc(d); return x > 6 ? x - 12 : x; };
const nameOf = (letter, acc) => LETTERS[letter] + ACC_SIGN[acc];

/* the two candidate spellings of a root: C♯ or D♭ */
function rootOptions(rootPc) {
  const out = [];
  LETTER_PC.forEach((lp, li) => { const a = accFor(rootPc - lp); if (Math.abs(a) <= 1) out.push({ letter: li, acc: a }); });
  return out;
}

/* degree labels ('♭3', '♯4', '5') tell us which letter each note gets */
function parseDeg(d) {
  const n = parseInt(String(d).replace(/[^0-9]/g, ''), 10) || 1;
  const alt = (String(d).match(/♯/g) || []).length - (String(d).match(/♭/g) || []).length;
  return { n, alt };
}

export function spellScale(rootPc, sc) {
  const degs = sc.deg || sc.iv.map((_, i) => String(i + 1));
  let best = null;
  for (const r of rootOptions(rootPc)) {
    let cost = Math.abs(r.acc), ok = true;
    const notes = sc.iv.map((iv, i) => {
      const { n } = parseDeg(degs[i]);
      const letter = (r.letter + (n - 1)) % 7;
      const target = pc(rootPc + iv);
      const acc = accFor(target - LETTER_PC[letter]);
      if (Math.abs(acc) > 2) ok = false;
      cost += Math.abs(acc) + (Math.abs(acc) === 2 ? 3 : 0);
      return { pc: target, letter, acc, name: nameOf(letter, acc) };
    });
    /* tie-break toward the key's conventional side */
    if (r.acc < 0 && OT.FLAT_KEYS.includes(rootPc)) cost -= .5;
    if (ok && (!best || cost < best.cost)) best = { cost, notes };
  }
  return best ? best.notes : sc.iv.map(iv => { const p = pc(rootPc + iv); return { pc: p, letter: 0, acc: 0, name: OT.SHARP[p] }; });
}

/* chord tones spelled from the root outward */
const IV_DEG = { 0: [1, 0], 1: [2, -1], 2: [2, 0], 3: [3, -1], 4: [3, 0], 5: [4, 0], 6: [5, -1], 7: [5, 0], 8: [5, 1], 9: [6, 0], 10: [7, -1], 11: [7, 0], 12: [1, 0], 13: [2, -1], 14: [2, 0], 15: [2, 1], 17: [4, 0], 18: [4, 1], 21: [6, 0] };
export function spellChord(rootPc, ivs, preferFlat = flats) {
  const opts = rootOptions(rootPc);
  const r = opts.find(o => o.acc === 0) || opts.find(o => preferFlat ? o.acc < 0 : o.acc > 0) || opts[0];
  return ivs.map(iv => {
    const [deg] = IV_DEG[iv] || IV_DEG[pc(iv)] || [1, 0];
    const letter = (r.letter + deg - 1) % 7;
    const acc = accFor(rootPc + iv - LETTER_PC[letter]);
    return Math.abs(acc) > 2 ? { letter: 0, acc: 0, name: pcName(rootPc + iv) } : { letter, acc, name: nameOf(letter, acc) };
  });
}
export function rootName(rootPc, preferFlat = flats) {
  if (spellMap && spellMap[pc(rootPc)]) return spellMap[pc(rootPc)].name;
  return (preferFlat ? OT.FLAT : OT.SHARP)[pc(rootPc)];
}

/* a midi note spelled as {letter, acc, oct} for the staff */
export function spellMidi(m, hint) {
  const s = hint || (spellMap && spellMap[pc(m)]) || null;
  let letter, acc;
  if (s) { letter = s.letter; acc = s.acc; }
  else {
    const name = pcName(m);
    letter = LETTERS.indexOf(name[0]); acc = name.includes('♯') ? 1 : name.includes('♭') ? -1 : 0;
  }
  const oct = Math.floor((m - acc) / 12) - 1;
  return { letter, acc, oct, midi: m, name: nameOf(letter, acc) };
}

/* ---- diatonic chords, derived from the scale itself ---- */
export function diatonic(iv, degIndex, size = 4) {
  const notes = [];
  for (let i = 0; i < size; i++) {
    const d = degIndex + i * 2;
    notes.push(iv[d % iv.length] + 12 * Math.floor(d / iv.length));
  }
  return notes.map(n => n - notes[0]);
}
const QUAL = { '4,7': '', '3,7': 'm', '3,6': '°', '4,8': '+', '4,7,11': 'maj7', '4,7,10': '7', '3,7,10': 'm7',
  '3,6,10': 'm7♭5', '3,6,9': '°7', '3,7,11': 'm(maj7)', '2,7': 'sus2', '5,7': 'sus4', '4,7,9': '6', '3,7,9': 'm6', '4,8,11': '+maj7', '4,8,10': '+7' };
export function nameQuality(rel) { const k = rel.slice(1).join(','); return QUAL[k] !== undefined ? QUAL[k] : '?'; }
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export function romanFor(degIndex, q) {
  let r = ROMAN[degIndex % 7];
  if (/^m|°/.test(q)) r = r.toLowerCase();
  if (q.includes('m7♭5')) return r + 'ø7';
  if (q.includes('°')) return r + (q.includes('7') ? '°7' : '°');
  if (q.startsWith('+')) return r + '+';
  if (q === 'maj7') return r + 'maj7';
  if (q.includes('7')) return r + '7';
  return r;
}
/* roman numeral for a progression step [semitones above tonic, chord id] */
const DEG_ROMAN = { 0: 'I', 1: '♭II', 2: 'II', 3: '♭III', 4: 'III', 5: 'IV', 6: '♯IV', 7: 'V', 8: '♭VI', 9: 'VI', 10: '♭VII', 11: 'VII' };
export function romanForStep([semi, cid]) {
  const ch = OT.CHORDS.find(c => c.id === cid) || { sym: '' };
  let r = DEG_ROMAN[pc(semi)] || '?';
  const minorish = /^m(?!aj)|°/.test(ch.sym);
  if (minorish) r = r.replace(/[IV]+/, x => x.toLowerCase());
  if (ch.sym === 'm7♭5') return r + 'ø7';
  if (ch.sym.startsWith('°')) return r + ch.sym;
  if (ch.sym === 'maj7') return r + 'maj7';
  if (/7|9/.test(ch.sym)) return r + (ch.sym.replace(/^m/, '') || '');
  return r;
}

/* ---- naming whatever is being held ---- */
const TYPES = [
  [[0, 4, 7], '', 'major triad'], [[0, 3, 7], 'm', 'minor triad'], [[0, 3, 6], '°', 'diminished triad'],
  [[0, 4, 8], '+', 'augmented triad'], [[0, 2, 7], 'sus2', 'suspended 2nd'], [[0, 5, 7], 'sus4', 'suspended 4th'],
  [[0, 7], '5', 'power chord'],
  [[0, 4, 7, 10], '7', 'dominant 7th'], [[0, 4, 7, 11], 'maj7', 'major 7th'], [[0, 3, 7, 10], 'm7', 'minor 7th'],
  [[0, 3, 6, 10], 'm7♭5', 'half-diminished 7th'], [[0, 3, 6, 9], '°7', 'diminished 7th'],
  [[0, 3, 7, 11], 'm(maj7)', 'minor-major 7th'], [[0, 4, 8, 10], '+7', 'augmented 7th'], [[0, 4, 8, 11], '+maj7', 'augmented major 7th'],
  [[0, 5, 7, 10], '7sus4', 'dominant 7th sus4'], [[0, 4, 7, 9], '6', 'major 6th'], [[0, 3, 7, 9], 'm6', 'minor 6th'],
  [[0, 2, 4, 7], 'add9', 'added 9th'], [[0, 2, 3, 7], 'm(add9)', 'minor added 9th'], [[0, 2, 4, 7, 9], '6/9', 'six-nine'],
  [[0, 2, 4, 7, 10], '9', 'dominant 9th'], [[0, 2, 4, 7, 11], 'maj9', 'major 9th'], [[0, 2, 3, 7, 10], 'm9', 'minor 9th'],
  [[0, 1, 4, 7, 10], '7♭9', 'dominant 7♭9'], [[0, 3, 4, 7, 10], '7♯9', 'dominant 7♯9'],
  [[0, 2, 4, 7, 9, 10], '13', 'dominant 13th'], [[0, 2, 5, 7, 10], '9sus4', '9sus4'],
  [[0, 4, 10], '7', 'dominant 7th, no 5th', 1], [[0, 4, 11], 'maj7', 'major 7th, no 5th', 1], [[0, 3, 10], 'm7', 'minor 7th, no 5th', 1],
  [[0, 2, 4, 10], '9', 'dominant 9th, no 5th', 1], [[0, 2, 4, 11], 'maj9', 'major 9th, no 5th', 1], [[0, 2, 3, 10], 'm9', 'minor 9th, no 5th', 1]
].map(([iv, sym, n, omit]) => ({ key: iv.join(','), sym, n, omit: !!omit }));
const TYPE_MAP = new Map(TYPES.map((t, i) => [t.key, { ...t, i }]));

export function detectChord(midis) {
  if (!midis || !midis.length) return null;
  const sorted = [...midis].sort((a, b) => a - b);
  const bass = pc(sorted[0]);
  const set = [...new Set(sorted.map(pc))];
  if (set.length === 1) return { name: pcName(set[0]), full: 'single note', root: set[0], bass, kind: 'note' };
  if (set.length === 2) {
    const d = pc(set[1] - set[0]), iv = pc(sorted[sorted.length - 1] - sorted[0]);
    if (d !== 7 && d !== 5) {
      const IV = OT.INTERVALS.find(x => x.s === (iv % 12 === 0 && iv ? 12 : iv % 12));
      return { name: IV ? IV.n : 'Interval', full: set.map(p => pcName(p)).join(' – '), root: bass, bass, kind: 'interval' };
    }
  }
  let best = null;
  for (const r of set) {
    const key = set.map(p => pc(p - r)).sort((a, b) => a - b).join(',');
    const t = TYPE_MAP.get(key);
    if (!t) continue;
    const score = (r === bass ? 10 : 0) - (t.omit ? 3 : 0) - t.i / 100;
    if (!best || score > best.score) best = { r, t, score };
  }
  if (!best) return { name: set.map(p => pcName(p)).join(' '), full: 'no common name', root: bass, bass, kind: 'cluster' };
  const slash = best.r !== bass ? '/' + pcName(bass) : '';
  return { name: pcName(best.r) + best.t.sym + slash, full: best.t.n + (slash ? ', ' + (bass === pc(best.r + 7) ? 'second' : 'first') + ' inversion' : ''), root: best.r, bass, sym: best.t.sym, kind: 'chord' };
}

/* roman numeral of a detected chord inside a key */
export function romanInKey(root, sym, keyRoot, scale) {
  if (!scale) return '';
  const k = scale.iv.indexOf(pc(root - keyRoot));
  if (k < 0) return '';
  return romanFor(k, sym || '');
}

/* ---- voice leading ----
   Pick the inversion and register of `pcs` that moves least from `prev`. */
export function voiceLead(prev, pcs, { center = 62, low = 50, high = 79 } = {}) {
  const uniq = [...new Set(pcs.map(pc))];
  const cands = [];
  for (let rot = 0; rot < uniq.length; rot++) {
    const order = uniq.slice(rot).concat(uniq.slice(0, rot));
    for (let base = low - 12; base <= high; base++) {
      if (pc(base) !== order[0]) continue;
      const v = [base];
      for (let i = 1; i < order.length; i++) { let n = v[i - 1] + 1; while (pc(n) !== order[i]) n++; v.push(n); }
      if (v[0] >= low && v[v.length - 1] <= high) cands.push(v);
    }
  }
  if (!cands.length) return uniq.map(p => midiOf(p, 4));
  const mid = v => v.reduce((a, b) => a + b, 0) / v.length;
  const cost = v => {
    let c = Math.abs(mid(v) - center) * .35;
    if (prev && prev.length) c += v.reduce((s, n) => s + Math.min(...prev.map(p => Math.abs(p - n))), 0)
      + prev.reduce((s, p) => s + Math.min(...v.map(n => Math.abs(p - n))), 0) * .5;
    return c;
  };
  return cands.reduce((b, v) => cost(v) < cost(b) ? v : b);
}

/* ---- lookups ---- */
export const scaleById = id => OT.SCALES.find(s => s.id === id);
export const chordById = id => OT.CHORDS.find(c => c.id === id);
export const progById = id => OT.PROGS.find(p => p.id === id);
export const isBlack = p => [1, 3, 6, 8, 10].includes(pc(p));
export const MAJOR_SCALE = MAJOR;
