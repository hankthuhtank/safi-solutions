/* OVERTONE · notation
   Whole notes on a strip of manuscript paper, spelled properly
   (B♭ in F major, F𝄪 in G♯ harmonic minor), with ledger lines and
   stacked chords. Each note carries data-i so playback can light it. */
import { spellMidi } from './music.js';
import { esc } from './util.js';

const ACC_GLYPH = { '-2': '𝄫', '-1': '♭', '1': '♯', '2': '𝄪' };
const stepOf = n => n.oct * 7 + n.letter;

export const Staff = {
  bottom(clef) { return clef === 'bass' ? 18 : 30; },
  auto(midis) { const avg = midis.reduce((a, b) => a + b, 0) / midis.length; return avg < 57 ? 'bass' : 'treble'; },
  /* notes: midi numbers or {midi, letter, acc, oct}. opts: clef, chord, alt, hints (spelling per note) */
  render(notes, opts = {}) {
    const sp = notes.map((n, i) => typeof n === 'number' ? spellMidi(n, opts.hints && opts.hints[i]) : n);
    const clef = opts.clef === 'auto' || !opts.clef ? Staff.auto(sp.map(n => n.midi)) : opts.clef;
    const gap = 10, top = 34, bottom = Staff.bottom(clef);
    const y = st => top + 4 * gap - (st - bottom) * gap / 2;
    const cols = opts.chord ? 1 : sp.length;
    const W = Math.max(opts.chord ? 150 : 220, 78 + cols * 38 + (opts.chord ? 30 : 0)), H = 128;
    let g = '';
    for (let i = 0; i < 5; i++) g += `<line x1="8" x2="${W - 8}" y1="${y(bottom + i * 2)}" y2="${y(bottom + i * 2)}" class="sl"/>`;
    g += `<line x1="8" x2="8" y1="${y(bottom + 8)}" y2="${y(bottom)}" class="sl"/><line x1="${W - 8}" x2="${W - 8}" y1="${y(bottom + 8)}" y2="${y(bottom)}" class="sl bar"/>`;
    g += clef === 'bass'
      ? `<text x="14" y="${y(bottom + 6) + 11}" class="clef bass">𝄢</text>`
      : `<text x="12" y="${y(bottom + 2) + 12}" class="clef">𝄞</text>`;
    const place = (n, x, i, shift = 0, accShift = 0) => {
      const st = stepOf(n), yy = y(st);
      let s = '';
      for (let l = bottom - 2; l >= st; l -= 2) s += `<line x1="${x - 11}" x2="${x + 11}" y1="${y(l)}" y2="${y(l)}" class="sl"/>`;
      for (let l = bottom + 10; l <= st; l += 2) s += `<line x1="${x - 11}" x2="${x + 11}" y1="${y(l)}" y2="${y(l)}" class="sl"/>`;
      const acc = n.acc ? `<text x="${x - 15 - accShift}" y="${yy + 5}" class="acc">${ACC_GLYPH[n.acc] || ''}</text>` : '';
      return `<g class="nt" data-i="${i}">${s}${acc}<ellipse cx="${x + shift}" cy="${yy}" rx="6.6" ry="4.6" class="head" transform="rotate(-22 ${x + shift} ${yy})"/><ellipse cx="${x + shift}" cy="${yy}" rx="3.4" ry="2" class="hole" transform="rotate(-50 ${x + shift} ${yy})"/></g>`;
    };
    if (opts.chord) {
      const order = sp.map((n, i) => ({ n, i })).sort((a, b) => stepOf(a.n) - stepOf(b.n));
      let prev = -99, flip = false, accN = 0;
      order.forEach(({ n, i }) => {
        const st = stepOf(n);
        flip = st - prev === 1 ? !flip : false; prev = st;
        g += place(n, 88, i, flip ? 13 : 0, n.acc ? (accN++ % 2) * 11 : 0);
      });
    } else sp.forEach((n, i) => { g += place(n, 70 + i * 38 + (n.acc ? 4 : 0), i); });
    return `<svg class="staff" viewBox="0 0 ${W} ${H}" style="max-width:${W * 1.25}px" role="img" aria-label="${esc(opts.alt || sp.map(n => n.name + n.oct).join(' '))}">${g}</svg>`;
  },
  /* light the i-th note of a rendered staff */
  light(root, i, on = true) {
    if (!root) return;
    root.querySelectorAll('.nt').forEach(el => { if (+el.dataset.i === i) el.classList.toggle('lit', on); else if (on) el.classList.remove('lit'); });
  }
};
