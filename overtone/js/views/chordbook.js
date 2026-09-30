/* OVERTONE · Chord Book
   Guitar, ukulele, mandolin and bass. Hand-written open shapes first,
   then the two barre families, then a search along the neck. Every
   diagram is drawn as a piece of rosewood fretboard and strummed on a
   modelled string. */
import { $, $$, esc, store, act, defineView, OT } from '../util.js';
import { A } from '../audio.js';
import { at } from '../clock.js';
import { KB } from '../keybed.js';
import { pc, midiOf, rootName, spellChord, chordById, setFlats } from '../music.js';
import { vhead, keyPicker } from './shared.js';

const INSTS = [['guitar', 'Guitar', [4, 9, 2, 7, 11, 4], [2, 2, 3, 3, 3, 4]], ['ukulele', 'Ukulele', [7, 0, 4, 9], [4, 4, 4, 4]],
  ['mandolin', 'Mandolin', [7, 2, 9, 4], [3, 4, 4, 5]], ['bass', 'Bass', [4, 9, 2, 7], [1, 1, 2, 2]]];
const QUALS = [['maj', 'Major', ''], ['min', 'Minor', 'm'], ['7', 'Dominant 7th', '7'], ['m7', 'Minor 7th', 'm7'], ['maj7', 'Major 7th', 'maj7'],
  ['sus4', 'Sus4', 'sus4'], ['sus2', 'Sus2', 'sus2'], ['dim', 'Diminished', '°'], ['aug', 'Augmented', '+'], ['6', 'Sixth', '6'], ['m7b5', 'Half-dim', 'm7♭5'], ['9', 'Ninth', '9'], ['add9', 'Add 9', 'add9']];
const SOUNDS = [['ks_steel', 'Steel'], ['ks_nylon', 'Nylon'], ['voice', 'Current voice']];

const C = {
  inst: store.get('cb.inst', 'guitar'), root: store.get('cb.root', 0), q: 'maj', sound: store.get('cb.sound', 'ks_steel'), shapes: [],
  meta() { return INSTS.find(i => i[0] === C.inst); },
  sym() { return (QUALS.find(q => q[0] === C.q) || [, , ''])[2]; },
  flat() { return OT.FLAT_KEYS.includes(C.root); },
  name() { return rootName(C.root, C.flat()) + C.sym(); },
  pcs() { const c = chordById(C.q); return c ? c.iv.map(i => pc(C.root + i)) : [C.root, C.root + 4, C.root + 7].map(pc); },
  key(nm) { return nm.replace('♯', '#').replace('♭', 'b'); },

  find() {
    const out = [], seen = new Set();
    const add = sh => { const k = sh.f.join(','); if (seen.has(k)) return; seen.add(k); out.push(sh); };
    const names = [OT.SHARP[C.root] + C.sym(), OT.FLAT[C.root] + C.sym()].map(C.key);
    if (C.inst === 'guitar') {
      for (const n of names) { const o = OT.GUITAR_OPEN[n]; if (o) { add({ ...o, f: o.f.slice(), label: 'Open position', base: 1 }); break; } }
      OT.GUITAR_MOVABLE.filter(m => m.q === C.q).map(m => { let fret = pc(C.root - [4, 9, 2, 7, 11, 4][m.rootStr]); if (fret === 0) fret = 12; return { m, fret }; }).sort((a, b) => a.fret - b.fret).map(x => x.m).forEach(m => {
        let fret = pc(C.root - [4, 9, 2, 7, 11, 4][m.rootStr]); if (fret === 0) fret = 12;
        add({ f: m.f.map(x => x < 0 ? -1 : x + fret), fi: [...m.fi], base: fret, barre: fret, label: m.name.replace(' sh.', ' shape') + ' · fret ' + fret });
      });
    } else if (C.inst === 'ukulele') {
      for (const n of names) { const o = OT.UKE_OPEN[n]; if (o) { add({ ...o, f: o.f.slice(), label: 'Open position', base: 1 }); break; } }
    }
    [0, 3, 5, 7, 9].forEach(pos => { if (out.length < 4) { const g = C.search(pos); if (g) add(g); } });
    return out.slice(0, 4);
  },
  /* one chord tone per string inside a four-fret window, root included */
  search(from) {
    const m = C.meta(), pcs = C.pcs();
    for (let pos = from; pos <= 12; pos++) {
      const f = []; let ok = 0, hasRoot = false;
      m[2].forEach(openPc => {
        let found = -1;
        for (let fr = pos === 0 ? 0 : pos; fr <= pos + 3; fr++) if (pcs.includes(pc(openPc + fr))) { found = fr; break; }
        if (found > -1) { ok++; if (pc(openPc + found) === pc(C.root)) hasRoot = true; }
        f.push(found);
      });
      const covered = new Set(f.map((fr, i) => fr < 0 ? -1 : pc(m[2][i] + fr)).filter(x => x >= 0));
      if (ok >= Math.min(4, m[2].length) && hasRoot && covered.size >= Math.min(3, pcs.length)) {
        const played = f.filter(x => x > 0), base = played.length ? Math.min(...played) : 1;
        const order = [...new Set(played)].sort((a, b) => a - b);
        return { f, fi: f.map(x => x > 0 ? Math.min(4, order.indexOf(x) + 1) : 0), base: Math.max(1, base), label: (base <= 1 ? 'First position' : 'Position ' + base) };
      }
    }
    return null;
  },
  diagram(sh, i) {
    const m = C.meta(), n = m[2].length, frets = 5, gap = 30, fh = 30, x0 = 34, y0 = 46;
    const W = x0 * 2 + gap * (n - 1), H = y0 + frets * fh + 28;
    const lo = sh.base > 2 ? sh.base : 1;
    let g = `<rect x="${x0 - 14}" y="${y0}" width="${gap * (n - 1) + 28}" height="${frets * fh}" rx="3" class="cd-wood"/>`;
    [3, 5, 7, 9, 12].forEach(f => { const r = f - lo + 1; if (r >= 1 && r <= frets) g += `<circle cx="${x0 + gap * (n - 1) / 2}" cy="${y0 + (r - .5) * fh}" r="5" class="cd-inlay"/>`; });
    for (let r = 0; r <= frets; r++) g += r === 0 && lo === 1 ? `<rect x="${x0 - 14}" y="${y0 - 6}" width="${gap * (n - 1) + 28}" height="7" rx="1.5" class="cd-nut"/>` : `<line x1="${x0 - 14}" x2="${x0 + gap * (n - 1) + 14}" y1="${y0 + r * fh}" y2="${y0 + r * fh}" class="cd-fret"/>`;
    for (let s = 0; s < n; s++) g += `<line x1="${x0 + s * gap}" x2="${x0 + s * gap}" y1="${y0 - 6}" y2="${y0 + frets * fh}" class="cd-str" data-s="${s}" style="stroke-width:${2.2 - s * (1.3 / (n - 1))}"/>`;
    if (lo > 1) g += `<text x="${x0 - 22}" y="${y0 + fh * .5 + 4}" class="cd-base">${lo}</text>`;
    if (sh.barre && sh.barre >= lo) {
      const first = sh.f.findIndex(x => x === sh.barre), last = sh.f.lastIndexOf(sh.barre);
      if (first > -1 && last > first) { const y = y0 + (sh.barre - lo + .5) * fh; g += `<rect x="${x0 + first * gap - 11}" y="${y - 10}" width="${(last - first) * gap + 22}" height="20" rx="10" class="cd-barre"/>`; }
    }
    sh.f.forEach((fr, s) => {
      const x = x0 + s * gap, open = m[2][s];
      if (fr < 0) { g += `<text x="${x}" y="${y0 - 16}" class="cd-x">×</text>`; return; }
      if (fr === 0) { g += `<circle cx="${x}" cy="${y0 - 20}" r="6" class="cd-o"/>`; return; }
      const r = fr - lo + 1; if (r < 1 || r > frets) return;
      const y = y0 + (r - .5) * fh, root = pc(open + fr) === pc(C.root);
      g += `<circle cx="${x}" cy="${y}" r="11" class="cd-dot ${root ? 'root' : ''}"/>`;
      if (sh.fi && sh.fi[s]) g += `<text x="${x}" y="${y + 4.5}" class="cd-fi">${sh.fi[s]}</text>`;
    });
    const names = sh.f.map((fr, s) => fr < 0 ? '·' : rootName(m[2][s] + fr, C.flat()));
    g += names.map((nm, s) => `<text x="${x0 + s * gap}" y="${H - 6}" class="cd-nm">${esc(nm)}</text>`).join('');
    return `<svg class="cdia" id="cd${i}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(C.name())}, ${esc(sh.label)}">${g}</svg>`;
  },
  midis(sh) { const m = C.meta(); return sh.f.map((fr, s) => fr >= 0 ? midiOf(m[2][s], m[3][s]) + fr : null); },
  strum(i, dir) {
    const sh = C.shapes[i]; if (!sh) return;
    A.resume(); A.begin('chords');
    const voice = C.sound === 'voice' ? A.voiceId : C.sound;
    const notes = C.midis(sh).map((m, s) => ({ m, s })).filter(x => x.m != null);
    const order = dir === 1 ? notes.slice().reverse() : notes;
    const gap = dir === 2 ? .19 : .024, t0 = A.ctx.currentTime + .03;
    order.forEach(({ m, s }, k) => {
      const t = t0 + k * gap;
      A.play(m, { at: t, voice, dur: dir === 2 ? 1.2 : 2.8, vel: .78 * (dir === 1 && s < 2 ? .8 : 1), human: .5 });
      at(t, () => { const l = $(`#cd${i} .cd-str[data-s="${s}"]`); if (l) { l.classList.remove('vib'); void l.getBBox(); l.classList.add('vib'); } });
    });
  },
  render() {
    setFlats(C.flat());
    KB.setTones(C.root, C.pcs());
    C.shapes = C.find();
    const sp = spellChord(C.root, (chordById(C.q) || { iv: [0, 4, 7] }).iv, C.flat());
    $('#cbBody').innerHTML = `
      <div class="cb-controls panel plain">
        <div class="cb-row"><span class="plabel">Instrument</span><div class="seg" role="tablist">${INSTS.map(([id, n]) => `<button role="tab" data-act="cb.inst" data-v="${id}" aria-selected="${id === C.inst}">${n}</button>`).join('')}</div>
          <span class="plabel" style="margin-left:auto">Strings</span><div class="seg seg-sm" role="tablist">${SOUNDS.map(([id, n]) => `<button role="tab" data-act="cb.sound" data-v="${id}" aria-selected="${id === C.sound}">${n}</button>`).join('')}</div></div>
        <div class="cb-row"><span class="plabel">Root</span>${keyPicker(C.root, 'cb.root', 'Root')}</div>
        <div class="cb-row"><span class="plabel">Type</span><div class="row">${QUALS.map(([id, n]) => `<button class="chip" data-act="cb.q" data-v="${id}" aria-pressed="${id === C.q}">${n}</button>`).join('')}</div></div>
      </div>
      <div class="cb-title"><h3>${esc(C.name())}</h3><p>${sp.map(n => esc(n.name)).join(' · ')}</p></div>
      <div class="cb-grid">
        ${C.shapes.length ? C.shapes.map((sh, i) => `
          <article class="cb-card">
            <span class="plabel">${esc(sh.label)}</span>
            ${C.diagram(sh, i)}
            <div class="row cb-strum">
              <button class="btn btn-brass btn-sm" data-act="cb.strum" data-v="${i}" data-d="0">Strum ↓</button>
              <button class="btn btn-ghost btn-sm" data-act="cb.strum" data-v="${i}" data-d="1" aria-label="Strum up">↑</button>
              <button class="btn btn-ghost btn-sm" data-act="cb.strum" data-v="${i}" data-d="2">Pick</button>
            </div>
          </article>`).join('') : `<p class="note-txt">No playable shape found for that combination on this instrument. Try another root or type.</p>`}
      </div>
      <section class="panel plain cb-read">
        <div class="grid2 even">
          <p class="note-txt"><span class="kv">Reading a chord box</span>The vertical lines are the strings, thickest on the left. The horizontal lines are the frets, and the thick bone bar at the top is the nut. A number inside a dot is the finger to use: <b>1 index, 2 middle, 3 ring, 4 little finger</b>. Pearl-green dots are the root. A circle above the nut means play the string open; a cross means leave it silent. A bar across several strings is a barre, one finger laid flat. A number beside the box means the shape starts at that fret.</p>
          <p class="note-txt"><span class="kv">Why there is more than one shape</span>The same chord lives in several places on the neck. Open shapes ring brighter because open strings are involved; barre shapes sound tighter and slide to any key without changing the fingering. Learn one open and one barre shape per type and you can play in all twelve keys.<br><br><span class="kv">Try this</span>Keep the root, then click Major, Minor and Dominant 7th and strum each one. One or two fingers move and the whole character changes. That is harmony in one experiment.</p>
        </div>
      </section>`;
  }
};

act({
  'cb.inst': el => { C.inst = el.dataset.v; store.set('cb.inst', C.inst); if (C.inst !== 'guitar' && C.sound === 'ks_steel' && C.inst === 'ukulele') C.sound = 'ks_nylon'; C.render(); C.strum(0, 0); },
  'cb.root': el => { C.root = +el.dataset.v; store.set('cb.root', C.root); C.render(); C.strum(0, 0); },
  'cb.q': el => { C.q = el.dataset.v; C.render(); C.strum(0, 0); },
  'cb.sound': el => { C.sound = el.dataset.v; store.set('cb.sound', C.sound); $$('[data-act="cb.sound"]').forEach(b => b.setAttribute('aria-selected', String(b === el))); if (C.sound === 'voice') A.load(A.voiceId); C.strum(0, 0); },
  'cb.strum': el => C.strum(+el.dataset.v, +el.dataset.d)
});

defineView('chords', {
  mount(el) {
    el.innerHTML = vhead('Chord Book', 'Where to put <em>your fingers.</em>', 'Guitar, ukulele, mandolin and bass. Pick a chord, read the diagram, hear it strummed on a modelled string.') + '<div id="cbBody"></div>';
    C.render();
  },
  show() { KB.setTones(C.root, C.pcs()); setFlats(C.flat()); }
});
