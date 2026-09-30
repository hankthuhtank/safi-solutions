/* OVERTONE · the keybed
   A piano docked under every view. Mouse, touch (many fingers at once),
   the computer keyboard and any MIDI keyboard all play it. It names
   whatever chord you hold, lights up anything the app plays, and shows
   the current key as inlays at the bottom of the keys. */
import { A } from './audio.js';
import { at } from './clock.js';
import { $, $$, esc, store, toast, act, clamp } from './util.js';
import { pc, midiOf, midiName, pcName, detectChord, romanInKey, scaleById, diatonic } from './music.js';

const WHITE = [0, 2, 4, 5, 7, 9, 11], BLACK_AFTER = [0, 1, 3, 4, 5];
const MAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17 };

export const KB = {
  oct: store.get('kb.oct', 3), spans: 3, labels: store.get('kb.labels', 'names'),
  root: 0, scale: null, hold: false, chordMode: false, snap: false,
  srcs: new Map(),          /* source id -> midis it is sounding */
  latched: new Set(),
  midiAccess: null,

  octaves() { const w = innerWidth; return w < 560 ? 2 : w < 1180 ? 3 : 4; },
  lbl(m) {
    if (KB.labels === 'off') return '';
    if (KB.labels === 'deg') {
      const sc = KB.scale && scaleById(KB.scale); if (!sc) return '';
      const k = sc.iv.indexOf(pc(m - KB.root)); return k > -1 ? sc.deg[k] : '';
    }
    return pc(m) === 0 ? midiName(m) : pcName(m);
  },
  render() {
    const k = $('#keys'); if (!k) return;
    KB.spans = KB.octaves();
    if (KB.oct + KB.spans > 8) KB.oct = 8 - KB.spans;
    const wc = KB.spans * 7;
    let whites = '', blacks = '';
    for (let o = 0; o < KB.spans; o++) {
      WHITE.forEach(w => { const m = midiOf(w, KB.oct + o); whites += `<div class="wk" data-m="${m}"><span class="lbl">${esc(KB.lbl(m))}</span></div>`; });
      BLACK_AFTER.forEach(bi => {
        const m = midiOf(WHITE[bi] + 1, KB.oct + o), left = ((o * 7 + bi + 1) / wc) * 100;
        blacks += `<div class="bk" data-m="${m}" style="left:calc(${left}% - ${(100 / wc) * .3}%);width:${(100 / wc) * .6}%"><span class="lbl">${esc(KB.labels === 'names' ? pcName(m) : KB.lbl(m))}</span></div>`;
      });
    }
    k.innerHTML = whites + blacks;
    $('#octLbl').textContent = 'C' + KB.oct;
    KB.paint(); KB.sync();
  },
  tones: null,
  paint() {
    const sc = KB.scale && scaleById(KB.scale);
    const pcs = KB.tones || (sc ? sc.iv.map(i => pc(KB.root + i)) : null);
    $$('#keys [data-m]').forEach(el => {
      const m = +el.dataset.m;
      el.classList.toggle('in', !!pcs && pcs.includes(pc(m)));
      el.classList.toggle('tonic', !!pcs && pc(m) === pc(KB.root));
      el.classList.toggle('latched', KB.latched.has(m));
    });
  },
  sync() {
    const set = (id, on) => { const b = $('#' + id); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    set('susBtn', A.sustain); set('holdBtn', KB.hold); set('chordBtn', KB.chordMode); set('snapBtn', KB.snap);
    const lb = $('#labBtn'); if (lb) lb.textContent = { names: 'Names', deg: 'Degrees', off: 'No labels' }[KB.labels];
  },
  /* the key the rest of the app is currently looking at */
  setKey(rootPc, scaleId) { KB.root = pc(rootPc); KB.scale = scaleId || null; KB.tones = null; KB.paint(); if (KB.labels !== 'names') KB.render(); },
  /* light an arbitrary set of pitch classes (a chord's tones) */
  setTones(rootPc, pcs) { KB.root = pc(rootPc); KB.scale = null; KB.tones = pcs.map(pc); KB.paint(); },

  fit(m) {
    if (!KB.snap || !KB.scale) return m;
    const pcs = scaleById(KB.scale).iv.map(i => pc(KB.root + i));
    for (let d = 0; d <= 6; d++) { if (pcs.includes(pc(m - d))) return m - d; if (pcs.includes(pc(m + d))) return m + d; }
    return m;
  },
  chordFor(m) {
    const sc = KB.scale && scaleById(KB.scale);
    if (!sc || sc.iv.length !== 7) return [m, m + 4, m + 7];
    const k = sc.iv.indexOf(pc(m - KB.root));
    if (k < 0) return [m, m + 4, m + 7];
    return diatonic(sc.iv, k, 3).map(r => m + r);
  },

  press(src, m, vel = .75) {
    A.resume();
    m = KB.fit(m);
    if (KB.hold) {
      const notes = KB.chordMode ? KB.chordFor(m) : [m];
      const on = !KB.latched.has(m);
      notes.forEach(n => { if (on) { A.noteOn(n, vel); } else { A.noteOff(n, true); } });
      if (on) KB.latched.add(m); else KB.latched.delete(m);
      KB.paint(); KB.flash(m); KB.readout();
      return;
    }
    KB.release(src);
    const notes = KB.chordMode ? KB.chordFor(m) : [m];
    notes.forEach(n => A.noteOn(n, vel));
    KB.srcs.set(src, notes);
    notes.forEach(n => KB.keyEl(n)?.classList.add('down'));
    KB.readout();
  },
  release(src) {
    const notes = KB.srcs.get(src); if (!notes) return;
    KB.srcs.delete(src);
    notes.forEach(n => {
      const still = [...KB.srcs.values()].some(v => v.includes(n));
      if (!still) { A.noteOff(n); KB.keyEl(n)?.classList.remove('down'); }
    });
    KB.readout();
  },
  keyEl(m) { return $(`#keys [data-m="${m}"]`); },
  flash(m, ms = 180) { const el = KB.keyEl(m); if (el) { el.classList.add('down'); setTimeout(() => el.classList.remove('down'), ms); } },
  heldNotes() { const s = new Set(KB.latched); KB.srcs.forEach(v => v.forEach(n => s.add(n))); return [...s]; },
  readout(notes) {
    const held = notes || KB.heldNotes();
    const nm = $('#nowName'), sub = $('#nowSub'); if (!nm) return;
    if (!held.length) return;
    const c = detectChord(held);
    if (!c) return;
    const sc = KB.scale && scaleById(KB.scale);
    const rn = c.kind === 'chord' ? romanInKey(c.root, c.sym, KB.root, sc) : '';
    nm.textContent = c.name;
    sub.textContent = c.kind === 'note' ? midiName(held[0]) : (c.full + (rn ? ' · ' + rn + ' in ' + pcName(KB.root) + ' ' + (sc.n.split(' (')[0]).toLowerCase() : ''));
  },

  bind() {
    const keys = $('#keys');
    const target = e => { const el = document.elementFromPoint(e.clientX, e.clientY); const k = el && el.closest && el.closest('#keys [data-m]'); return k || null; };
    const velOf = (e, el) => { const r = el.getBoundingClientRect(); return clamp(.38 + ((e.clientY - r.top) / r.height) * .6, .3, 1); };
    const cur = new Map();
    keys.addEventListener('pointerdown', e => {
      const el = target(e); if (!el) return;
      e.preventDefault(); keys.setPointerCapture?.(e.pointerId);
      cur.set(e.pointerId, +el.dataset.m);
      KB.press('p' + e.pointerId, +el.dataset.m, velOf(e, el));
    });
    keys.addEventListener('pointermove', e => {
      if (!cur.has(e.pointerId)) return;
      const el = target(e); if (!el) return;
      const m = +el.dataset.m;
      if (m !== cur.get(e.pointerId)) { cur.set(e.pointerId, m); if (!KB.hold) KB.press('p' + e.pointerId, m, velOf(e, el)); }
    });
    const up = e => { if (!cur.has(e.pointerId)) return; cur.delete(e.pointerId); KB.release('p' + e.pointerId); };
    keys.addEventListener('pointerup', up); keys.addEventListener('pointercancel', up); keys.addEventListener('lostpointercapture', up);

    const typing = e => /^(input|select|textarea)$/i.test(e.target.tagName) || e.target.isContentEditable || document.querySelector('dialog[open]');
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      if (e.code === 'Space') {
        if (e.target.closest && e.target.closest('button,a,[role=slider]')) return;
        e.preventDefault(); if (!A.sustain) { A.setSustain(true); KB.sync(); } return;
      }
      if (e.repeat) return;
      if (e.key === 'z') { KB.shift(-1); return; }
      if (e.key === 'x') { KB.shift(1); return; }
      const off = MAP[e.key.toLowerCase()]; if (off == null) return;
      e.preventDefault();
      KB.press('k' + e.key.toLowerCase(), midiOf(0, KB.oct + 1) + off, .72);
    });
    addEventListener('keyup', e => {
      if (e.code === 'Space') { if (A.sustain) { A.setSustain(false); KB.sync(); } return; }
      const off = MAP[e.key.toLowerCase()]; if (off != null) KB.release('k' + e.key.toLowerCase());
    });
    addEventListener('blur', () => { [...KB.srcs.keys()].forEach(KB.release); if (A.sustain) { A.setSustain(false); KB.sync(); } });

    /* anything the app plays lights its key while it sounds */
    A.on('note', ({ midi, at: t, dur }) => {
      at(t, () => { const el = KB.keyEl(midi); if (el) { el.classList.add('sound'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('sound'), Math.max(140, Math.min(900, (dur || .5) * 700))); } });
    });
    /* name chords the app plays too */
    let bucket = [], bucketT = 0;
    A.on('note', ({ midi, at: t }) => {
      if (Math.abs(t - bucketT) > .05) { bucket = []; bucketT = t; }
      bucket.push(midi);
      const snap = [...bucket];
      at(t + .01, () => { if (!KB.srcs.size && !KB.latched.size && snap.length >= 1) KB.readout(snap); });
    });

    if (navigator.permissions && navigator.requestMIDIAccess) {
      navigator.permissions.query({ name: 'midi' }).then(p => { if (p.state === 'granted' && store.get('midi', false)) KB.midi(true); }).catch(() => {});
    }
    let last = KB.octaves();
    addEventListener('resize', () => { if (KB.octaves() !== last) { last = KB.octaves(); KB.render(); } }, { passive: true });
  },
  shift(d) { KB.oct = clamp(KB.oct + d, 1, 8 - KB.spans); store.set('kb.oct', KB.oct); KB.render(); },

  /* ---- MIDI keyboards ---- */
  midi(quiet) {
    if (!navigator.requestMIDIAccess) { if (!quiet) toast('This browser cannot talk to MIDI keyboards. Chrome, Edge and Firefox can.'); return; }
    navigator.requestMIDIAccess().then(acc => {
      KB.midiAccess = acc; store.set('midi', true);
      const hook = () => {
        const names = [];
        acc.inputs.forEach(inp => { names.push(inp.name); inp.onmidimessage = KB.onMidi; });
        const st = $('#midiState'), b = $('#midiBtn');
        if (st) { st.hidden = !names.length; st.textContent = names.length ? 'MIDI · ' + names[0] : ''; }
        if (b) b.setAttribute('aria-pressed', names.length ? 'true' : 'false');
        if (!quiet) toast(names.length ? 'Connected: ' + names.join(', ') : 'MIDI is on. Plug in a keyboard and it will appear.');
      };
      acc.onstatechange = hook; hook();
    }).catch(() => { if (!quiet) toast('MIDI access was not allowed.'); });
  },
  onMidi(ev) {
    const [s, d1, d2] = ev.data, type = s & 0xf0;
    if (type === 0x90 && d2 > 0) { KB.press('m' + d1, d1, d2 / 127); KB.flash(d1, 120); }
    else if (type === 0x80 || (type === 0x90 && d2 === 0)) KB.release('m' + d1);
    else if (type === 0xb0 && d1 === 64) { A.setSustain(d2 >= 64); KB.sync(); }
  }
};

act({
  'kb.oct': el => KB.shift(+el.dataset.v),
  'kb.sustain': () => { A.setSustain(!A.sustain); KB.sync(); toast(A.sustain ? 'Pedal down. Tip: hold the space bar instead.' : 'Pedal up'); },
  'kb.hold': () => { KB.hold = !KB.hold; if (!KB.hold) { KB.latched.forEach(m => A.noteOff(m, true)); KB.latched.clear(); KB.paint(); } KB.sync(); toast(KB.hold ? 'Hold: keys stay down until you press them again' : 'Hold off'); },
  'kb.chord': () => { KB.chordMode = !KB.chordMode; KB.sync(); toast(KB.chordMode ? 'Chord mode: each key plays its chord in the current key' : 'Single notes'); },
  'kb.snap': () => { KB.snap = !KB.snap; KB.sync(); toast(KB.snap ? (KB.scale ? 'Snap: every key bends to the nearest note of the scale' : 'Snap works once a scale is chosen on the Bench') : 'Snap off'); },
  'kb.labels': () => { KB.labels = { names: 'deg', deg: 'off', off: 'names' }[KB.labels]; store.set('kb.labels', KB.labels); KB.render(); },
  'kb.midi': () => KB.midi(false),
  'kb.toggle': el => {
    const kb = $('#keybed'), hid = kb.classList.toggle('hide');
    el.textContent = hid ? 'Show' : 'Hide'; el.setAttribute('aria-expanded', String(!hid));
    document.documentElement.style.setProperty('--kb-space', hid ? '44px' : '');
    store.set('kb.hidden', hid);
  }
});
