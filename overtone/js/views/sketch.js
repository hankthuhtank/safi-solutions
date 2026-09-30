/* OVERTONE · Sketchpad
   Write a progression on a lead sheet, hear it with a band behind it
   (voice-led chords, a bass line, real drums), see what each chord is
   doing, and take it away as a MIDI file or a link. */
import { $, $$, esc, store, act, onInput, defineView, toast, clamp, rand, OT } from '../util.js';
import { A } from '../audio.js';
import { at, Loop, clearQueue } from '../clock.js';
import { KB } from '../keybed.js';
import { pc, midiOf, rootName, voiceLead, chordById, useKey, scaleById, romanForStep, setFlats } from '../music.js';
import { vhead, keyPicker, playBtn, setPlayBtn } from './shared.js';

const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
const TRI = { major: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'], minor: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'] };
const SEV = { major: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'], minor: ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'] };
const FUNC = { major: ['T', 'S', 'T', 'S', 'D', 'T', 'D'], minor: ['T', 'S', 'T', 'S', 'D', 'S', 'D'] };
const BORROW = {
  major: [[5, 'min', 'iv', 'from the minor key: the sad subdominant'], [8, 'maj', '♭VI', 'from minor: epic, cinematic lift'], [10, 'maj', '♭VII', 'from Mixolydian: the rock chord'], [3, 'maj', '♭III', 'from minor: a darker sidestep'], [2, '7', 'V/V', 'a secondary dominant pulling to V'], [9, '7', 'V/ii', 'a secondary dominant pulling to ii']],
  minor: [[7, 'maj', 'V', 'harmonic minor: a real leading tone'], [7, '7', 'V7', 'the dominant seventh that makes minor resolve'], [5, 'maj', 'IV', 'from Dorian: a brighter subdominant'], [1, 'maj', '♭II', 'the Neapolitan: a dramatic lean'], [0, 'maj', 'I', 'the Picardy third: a surprise major ending']]
};
const GROOVES = [['none', 'No drums'], ['rock', 'Rock'], ['four', 'Four on the floor'], ['funk', 'Funk'], ['boom', 'Boom bap'], ['bossa', 'Bossa'], ['reggae', 'One drop'], ['secondline', 'Second line'], ['trap', 'Trap']];
const STYLES = [['block', 'Block'], ['pulse', 'Pulse'], ['arp', 'Arpeggio'], ['strum', 'Strum'], ['pad', 'Pad']];
const FAMOUS = {
  major: [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [3, 4, 2, 5], [0, 3, 4, 3], [1, 4, 0, 0], [0, 5, 1, 4]],
  minor: [[0, 5, 2, 6], [0, 6, 5, 6], [0, 3, 4, 0], [0, 5, 3, 4], [0, 2, 6, 5]]
};
const fcol = { T: 'Tonic', S: 'Subdominant', D: 'Dominant', B: 'Borrowed' };

const S = {
  key: store.get('sk.key', 0), mode: store.get('sk.mode', 'major'), sev: store.get('sk.sev', false),
  slots: store.get('sk.slots', null), len: store.get('sk.len', 4), sel: 0,
  bpm: store.get('sk.bpm', 92), groove: store.get('sk.groove', 'rock'), style: store.get('sk.style', 'block'), bass: store.get('sk.bass', true),
  loop: null, name: store.get('sk.name', 'Untitled progression'),

  deg(i) { const iv = S.mode === 'major' ? MAJ : MIN; return { semi: iv[i], q: (S.sev ? SEV : TRI)[S.mode][i], roman: null, f: FUNC[S.mode][i], d: i }; },
  palette() {
    const dia = [0, 1, 2, 3, 4, 5, 6].map(i => S.deg(i));
    const bor = BORROW[S.mode].map(([semi, q, roman, why]) => ({ semi, q, roman, why, f: 'B' }));
    return { dia, bor };
  },
  ensure() {
    if (!S.slots || !S.slots.length) S.slots = FAMOUS[S.mode][0].map(i => { const d = S.deg(i); return { semi: d.semi, q: d.q }; });
    while (S.slots.length < S.len) S.slots.push({ ...S.slots[S.slots.length % 4] });
  },
  save() { ['key', 'mode', 'sev', 'slots', 'len', 'bpm', 'groove', 'style', 'bass', 'name'].forEach(k => store.set('sk.' + k, S[k])); },
  info(sl) {
    const ch = chordById(sl.q) || chordById('maj');
    const iv = S.mode === 'major' ? MAJ : MIN, di = iv.indexOf(pc(sl.semi));
    const diaQ = di > -1 ? [TRI[S.mode][di], SEV[S.mode][di]] : [];
    const borrowed = di < 0 || !diaQ.includes(sl.q);
    const b = BORROW[S.mode].find(x => x[0] === pc(sl.semi) && x[1] === sl.q);
    const roman = b ? b[2] : romanForStep([sl.semi, sl.q]);
    const name = (di < 0 ? rootName(S.key + sl.semi, S.flats() || roman.includes('♭')) : rootName(S.key + sl.semi, S.flats())) + ch.sym;
    return { name, roman, f: borrowed ? 'B' : FUNC[S.mode][di], ch, why: b ? b[3] : '' };
  },
  flats() { return S.mode === 'major' ? OT.FLAT_KEYS.includes(S.key) : [2, 7, 0, 5, 10, 3].includes(S.key); },

  mount(el) {
    el.innerHTML = vhead('Sketchpad', 'Write something. <em>Then hear why it works.</em>', 'Pick a key, fill the bars with chords from the key or borrowed from next door, and loop it with a band behind you. Your sketch saves on this device and travels as a link or a MIDI file.') + '<div id="skBody"></div>';
    S.render();
  },
  render() {
    S.ensure();
    useKey(S.key, scaleById(S.mode === 'major' ? 'ionian' : 'aeolian')); setFlats(S.flats());
    KB.setKey(S.key, S.mode === 'major' ? 'ionian' : 'aeolian');
    const { dia, bor } = S.palette();
    $('#skBody').innerHTML = `
      <section class="panel leadsheet">
        <div class="ls-head">
          <input class="ls-name" value="${esc(S.name)}" data-input="sk.name" aria-label="Sketch name" spellcheck="false">
          <span class="ls-meta">${esc(rootName(S.key, S.flats()))} ${S.mode} · ${S.bpm} BPM · ${S.len} bars</span>
          ${playBtn('sk.play', !!S.loop, 'Play loop', 'Stop', 'skBtn')}
        </div>
        <div class="bars bars-${S.len}" id="skBars">${S.slots.slice(0, S.len).map((sl, i) => { const n = S.info(sl); return `
          <button class="bar f${n.f} ${i === S.sel ? 'sel' : ''}" data-act="sk.sel" data-v="${i}" aria-label="Bar ${i + 1}: ${esc(n.name)}, ${esc(fcol[n.f])}">
            <span class="bar-n">${i + 1}</span><b>${esc(n.name)}</b><i>${esc(n.roman)}</i><small>${fcol[n.f]}</small><em class="bar-head"></em></button>`; }).join('')}</div>
        <div class="palette">
          <div><span class="plabel">In the key · fills bar ${S.sel + 1}</span><div class="pal-row">${dia.map(d => { const n = S.info(d); return `<button class="pal f${n.f}" data-act="sk.pick" data-semi="${d.semi}" data-q="${d.q}"><b>${esc(n.name)}</b><i>${esc(n.roman)}</i></button>`; }).join('')}</div></div>
          <div><span class="plabel">Borrowed</span><div class="pal-row">${bor.map(d => { const n = S.info(d); return `<button class="pal fB" data-act="sk.pick" data-semi="${d.semi}" data-q="${d.q}" title="${esc(d.why)}"><b>${esc(n.name)}</b><i>${esc(d.roman)}</i></button>`; }).join('')}</div></div>
        </div>
      </section>
      <div class="grid2 sk-lower">
        <section class="panel plain">
          <div class="sk-ctl"><span class="plabel">Key</span>${keyPicker(S.key, 'sk.key')}</div>
          <div class="row"><div class="seg seg-sm">${['major', 'minor'].map(m => `<button role="tab" data-act="sk.mode" data-v="${m}" aria-selected="${m === S.mode}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>
            <div class="seg seg-sm">${[4, 8].map(n => `<button role="tab" data-act="sk.len" data-v="${n}" aria-selected="${n === S.len}">${n} bars</button>`).join('')}</div>
            <button class="chip" data-act="sk.sev" aria-pressed="${S.sev}">Sevenths</button></div>
          <div class="slider-row" style="margin-top:14px"><span class="plabel">Tempo</span><input type="range" min="50" max="170" value="${S.bpm}" data-input="sk.bpm" aria-label="Tempo"><output id="skBpm">${S.bpm}</output></div>
          <div class="row" style="margin-top:12px"><span class="plabel">Chords</span><div class="seg seg-sm">${STYLES.map(([id, n]) => `<button role="tab" data-act="sk.style" data-v="${id}" aria-selected="${id === S.style}">${n}</button>`).join('')}</div></div>
          <div class="row" style="margin-top:12px"><span class="plabel">Drums</span><div class="chips-scroll">${GROOVES.map(([id, n]) => `<button class="chip pat" data-act="sk.groove" data-v="${id}" aria-pressed="${id === S.groove}">${n}</button>`).join('')}</div></div>
          <div class="row" style="margin-top:6px"><button class="chip" data-act="sk.bass" aria-pressed="${S.bass}">Bass line</button></div>
          <hr class="wire">
          <div class="row"><button class="btn btn-ghost btn-sm" data-act="sk.random">Fresh idea</button><button class="btn btn-ghost btn-sm" data-act="sk.midi">Download MIDI</button><button class="btn btn-ghost btn-sm" data-act="sk.share">Copy link</button><button class="btn btn-ghost btn-sm" data-act="sk.reset">Reset</button></div>
        </section>
        <section class="panel plain" id="skExplain">${S.explain()}</section>
      </div>`;
  },
  explain() {
    const seq = S.slots.slice(0, S.len).map(S.info);
    const romans = seq.map(x => x.roman).join(' → ');
    const notes = [];
    for (let i = 0; i < seq.length; i++) {
      const a = S.slots[i], b = S.slots[(i + 1) % seq.length], fa = seq[i], fb = seq[(i + 1) % seq.length];
      const up = pc(b.semi - a.semi);
      if (fa.f === 'D' && pc(b.semi) === 0 && /^(maj|min|maj7|m7)$/.test(b.q)) notes.push(`<b>${esc(fa.name)} → ${esc(fb.name)}</b> is a full cadence: the dominant resolving home, the strongest move in tonal music.`);
      else if (pc(a.semi) === 5 && pc(b.semi) === 0 && fa.f !== 'B') notes.push(`<b>${esc(fa.name)} → ${esc(fb.name)}</b> is the plagal “amen” move: home without the pull of a leading tone.`);
      else if (fa.f === 'D' && pc(b.semi) === (S.mode === 'major' ? 9 : 8)) notes.push(`<b>${esc(fa.name)} → ${esc(fb.name)}</b> is a deceptive cadence: the ear expects home and gets the relative chord instead.`);
      else if (up === 5 && i < seq.length - 1) notes.push(`<b>${esc(fa.name)} → ${esc(fb.name)}</b> falls by a fifth, the strongest root motion there is.`);
      if (fa.f === 'B' && fa.why) notes.push(`<b>${esc(fa.name)}</b> is borrowed, ${esc(fa.why)}.`);
    }
    const last = seq[seq.length - 1];
    if (last.f === 'D') notes.push(`The loop ends on <b>${esc(last.name)}</b>, a half cadence, so the repeat feels like a question being answered.`);
    const uniq = [...new Set(notes)].slice(0, 5);
    return `<p class="note-txt"><span class="kv">Roman numerals</span><b class="romans">${esc(romans)}</b></p>
      <p class="note-txt"><span class="kv">What the loop is doing</span>${uniq.length ? uniq.join('<br>') : 'This loop avoids strong cadences, so it floats instead of resolving. That is a choice: plenty of great songs never land.'}</p>
      <p class="note-txt"><span class="kv">Colour key</span><span class="fkey"><i class="fT"></i>tonic, home <i class="fS"></i>subdominant, moving away <i class="fD"></i>dominant, pulling back <i class="fB"></i>borrowed</span></p>
      <p class="note-txt"><span class="kv">Try this</span>Change one bar at a time. Keeping three chords and swapping the fourth is the fastest way to hear what each chord actually does.</p>`;
  },
  voicings() {
    let prev = null;
    return S.slots.slice(0, S.len).map(sl => {
      const ch = chordById(sl.q) || chordById('maj'), r = S.key + sl.semi;
      const v = voiceLead(prev, ch.iv.map(i => r + i), { center: 63, low: 52, high: 79 }); prev = v;
      const bass = midiOf(pc(r), 2) + (pc(r) >= 5 ? 0 : 12);
      return { v, bass, fifth: bass + 7 };
    });
  },
  toggle() {
    if (S.loop) { S.stop(); return; }
    A.resume(); A.loadKit();
    const V = S.voicings(), g = OT.RHYTHMS.find(r => r.id === S.groove);
    const spb = 60 / S.bpm, bars = S.len;
    const voice = S.style === 'pad' ? 'syn_pad' : S.style === 'strum' ? 'ks_steel' : A.voiceId;
    const bassVoice = 'electric_bass_finger'; A.load(bassVoice);
    S.loop = new Loop({ bpm: S.bpm, div: 4, onStep: (step, t) => {
      const bar = Math.floor(step / 16) % bars, pos = step % 16, x = V[bar];
      if (pos === 0) at(t, () => S.head(bar), S);
      const chord = (dur, vel, strum = .012) => A.chord(x.v, { at: t, dur, vel, strum, voice });
      if (S.style === 'block' || S.style === 'pad') { if (pos === 0) chord(spb * 3.9, .6); }
      else if (S.style === 'pulse') { if (pos % 4 === 0) chord(spb * .8, pos === 0 ? .6 : .46); }
      else if (S.style === 'arp') { if (pos % 2 === 0) { const tones = x.v.concat([x.v[0] + 12]); const order = [0, 1, 2, 3, 2, 1, 2, 3].map(k => tones[Math.min(k, tones.length - 1)]); A.play(order[pos / 2], { at: t, dur: spb * .9, vel: pos === 0 ? .66 : .52, voice, human: .7 }); } }
      else if (S.style === 'strum') {
        const pat = { 0: 1, 6: -1, 8: 1, 10: -1, 12: 1, 14: -1 };
        if (pat[pos]) { const ns = pat[pos] > 0 ? x.v : x.v.slice().reverse(); A.chord(ns, { at: t, dur: spb * 1.6, vel: pat[pos] > 0 ? .62 : .42, strum: .016, voice }); }
      }
      if (S.bass) { if (pos === 0) A.play(x.bass, { at: t, dur: spb * 1.8, vel: .7, voice: bassVoice }); if (pos === 8) A.play(x.fifth, { at: t, dur: spb * 1.4, vel: .55, voice: bassVoice }); if (pos === 14) A.play(x.bass, { at: t, dur: spb * .45, vel: .45, voice: bassVoice }); }
      if (g && g.k.length === 16) { ['k', 's', 'h'].forEach(l => { if (g[l][pos]) A.drum(l, t + (Math.random() - .5) * .006, (l === 'h' ? (pos % 4 === 0 ? .7 : .5) : .95) * (.9 + Math.random() * .15)); }); }
    } });
    A.begin('sketch', () => S.stop()); S.loop.start(); setPlayBtn($('#skBtn'), true, 'Play loop');
  },
  head(bar) {
    $$('#skBars .bar').forEach((b, i) => { b.classList.toggle('playing', i === bar); if (i === bar) { b.style.setProperty('--dur', (60 / S.bpm * 4) + 's'); const h = b.querySelector('.bar-head'); h.style.animation = 'none'; void h.offsetWidth; h.style.animation = ''; } });
  },
  stop() { if (S.loop) S.loop.stop(); S.loop = null; clearQueue(S); setPlayBtn($('#skBtn'), false, 'Play loop'); $$('#skBars .playing').forEach(b => b.classList.remove('playing')); },
  preview(sl) { A.resume(); const ch = chordById(sl.q), r = S.key + sl.semi; A.chord(voiceLead(null, ch.iv.map(i => r + i), { center: 63 }), { dur: 1.3, vel: .6 }); A.play(midiOf(pc(r), 2) + 12, { dur: 1.3, vel: .5 }); },
  restart() { if (S.loop) { S.stop(); S.toggle(); } },

  /* ---- MIDI file: chords, bass and drums on separate tracks ---- */
  midi() {
    const PPQ = 480, V = S.voicings(), g = OT.RHYTHMS.find(r => r.id === S.groove);
    const vlq = n => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
    const str = s => [...s].map(c => c.charCodeAt(0) & 0x7f);
    const track = evs => {
      evs.sort((a, b) => a.t - b.t || a.o - b.o);
      let last = 0; const out = [];
      evs.forEach(e => { out.push(...vlq(e.t - last), ...e.d); last = e.t; });
      out.push(0, 0xff, 0x2f, 0);
      return [...str('MTrk'), ...[24, 16, 8, 0].map(s => (out.length >> s) & 255), ...out];
    };
    const note = (evs, ch, n, t, d, v) => { evs.push({ t, o: 1, d: [0x90 | ch, n, v] }, { t: t + d, o: 0, d: [0x80 | ch, n, 0] }); };
    const bar = PPQ * 4, reps = 2, title = (S.name || 'Overtone sketch').replace(/[^\x20-\x7e]/g, '').slice(0, 60);
    const meta = [{ t: 0, o: 0, d: [0xff, 0x51, 3, ...[16, 8, 0].map(s => (Math.round(60000000 / S.bpm) >> s) & 255)] }, { t: 0, o: 0, d: [0xff, 0x58, 4, 4, 2, 24, 8] }, { t: 0, o: 0, d: [0xff, 0x03, title.length, ...str(title)] }];
    const ch = [{ t: 0, o: 0, d: [0xc0, 0] }], bs = [{ t: 0, o: 0, d: [0xc1, 33] }], dr = [];
    for (let r = 0; r < reps; r++) V.forEach((x, i) => {
      const t0 = (r * V.length + i) * bar;
      x.v.forEach(n => note(ch, 0, n, t0, bar - 20, 80));
      if (S.bass) { note(bs, 1, x.bass, t0, PPQ * 2 - 20, 96); note(bs, 1, x.fifth, t0 + PPQ * 2, PPQ * 2 - 20, 84); }
      if (g && g.k.length === 16) for (let p = 0; p < 16; p++) { const tt = t0 + p * PPQ / 4; if (g.k[p]) note(dr, 9, 36, tt, 60, 110); if (g.s[p]) note(dr, 9, 38, tt, 60, 100); if (g.h[p]) note(dr, 9, 42, tt, 40, 80); }
    });
    const tracks = [track(meta), track(ch), track(bs)].concat(dr.length ? [track(dr)] : []);
    const head = [...str('MThd'), 0, 0, 0, 6, 0, 1, 0, tracks.length, (PPQ >> 8) & 255, PPQ & 255];
    const blob = new Blob([new Uint8Array([...head, ...tracks.flat()])], { type: 'audio/midi' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (S.name || 'overtone-sketch').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.mid';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('MIDI saved: chords, bass and drums on separate tracks');
  },
  share() {
    const data = { k: S.key, m: S.mode === 'minor' ? 'n' : 'j', b: S.slots.slice(0, S.len).map(s => s.semi + '.' + s.q), t: S.bpm, g: S.groove, s: S.style, n: S.name, v: S.sev ? 1 : 0 };
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = location.origin + location.pathname + '#sketch/' + code;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('Link copied. Anyone who opens it hears this sketch.')).catch(() => { prompt('Copy this link', url); });
  },
  load(code) {
    try {
      const d = JSON.parse(decodeURIComponent(escape(atob(code.replace(/-/g, '+').replace(/_/g, '/')))));
      S.key = clamp(+d.k, 0, 11); S.mode = d.m === 'n' ? 'minor' : 'major';
      S.slots = d.b.map(x => { const [semi, q] = x.split('.'); return { semi: +semi, q: chordById(q) ? q : 'maj' }; });
      S.len = S.slots.length > 4 ? 8 : 4; S.bpm = clamp(+d.t || 92, 50, 170); S.groove = d.g || 'rock'; S.style = d.s || 'block'; S.name = String(d.n || 'Shared sketch').slice(0, 60); S.sev = !!d.v;
      S.save(); S.render(); toast('Loaded a shared sketch. Press play.');
    } catch (e) { toast('That sketch link could not be read.'); }
  }
};

act({
  'sk.play': () => S.toggle(),
  'sk.sel': el => { S.sel = +el.dataset.v; $$('#skBars .bar').forEach((b, i) => b.classList.toggle('sel', i === S.sel)); $('.palette .plabel').textContent = 'In the key · fills bar ' + (S.sel + 1); S.preview(S.slots[S.sel]); },
  'sk.pick': el => { const sl = { semi: +el.dataset.semi, q: el.dataset.q }; S.slots[S.sel] = sl; S.sel = (S.sel + 1) % S.len; S.save(); S.render(); S.preview(sl); S.restart(); },
  'sk.key': el => { S.key = +el.dataset.v; S.save(); S.render(); S.restart(); },
  'sk.mode': el => { if (S.mode === el.dataset.v) return; S.mode = el.dataset.v; S.slots = FAMOUS[S.mode][0].map(i => { const d = S.deg(i); return { semi: d.semi, q: d.q }; }); S.save(); S.render(); S.restart(); },
  'sk.len': el => { S.len = +el.dataset.v; S.ensure(); if (S.sel >= S.len) S.sel = 0; S.save(); S.render(); S.restart(); },
  'sk.sev': () => { S.sev = !S.sev; S.slots = S.slots.map(sl => { const iv = S.mode === 'major' ? MAJ : MIN, i = iv.indexOf(pc(sl.semi)); if (i < 0) return sl; const tri = TRI[S.mode][i], sev = SEV[S.mode][i]; if (S.sev && sl.q === tri) return { ...sl, q: sev }; if (!S.sev && sl.q === sev) return { ...sl, q: tri }; return sl; }); S.save(); S.render(); S.restart(); },
  'sk.style': el => { S.style = el.dataset.v; S.save(); $$('[data-act="sk.style"]').forEach(b => b.setAttribute('aria-selected', String(b === el))); S.restart(); },
  'sk.groove': el => { S.groove = el.dataset.v; S.save(); $$('[data-act="sk.groove"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); S.restart(); },
  'sk.bass': el => { S.bass = !S.bass; S.save(); el.setAttribute('aria-pressed', String(S.bass)); },
  'sk.random': () => {
    const pool = FAMOUS[S.mode];
    let degs = rand(pool);
    if (Math.random() < .4) degs = degs.map((d, i) => i === 2 ? rand([0, 1, 2, 3, 4, 5]) : d);
    S.slots = degs.map(i => { const d = S.deg(i); return { semi: d.semi, q: d.q }; });
    if (Math.random() < .35) { const b = rand(BORROW[S.mode]); S.slots[rand([1, 2, 3])] = { semi: b[0], q: b[1] }; }
    if (S.len === 8) S.slots = S.slots.concat(S.slots.map(x => ({ ...x })));
    S.save(); S.render(); S.restart(); if (!S.loop) S.preview(S.slots[0]);
  },
  'sk.reset': () => { S.stop(); S.key = 0; S.mode = 'major'; S.sev = false; S.len = 4; S.bpm = 92; S.groove = 'rock'; S.style = 'block'; S.bass = true; S.name = 'Untitled progression'; S.slots = null; S.sel = 0; S.save(); S.render(); },
  'sk.midi': () => S.midi(),
  'sk.share': () => S.share()
});
onInput({
  'sk.bpm': el => { S.bpm = +el.value; $('#skBpm').textContent = S.bpm; if (S.loop) S.loop.bpm = S.bpm; S.save(); },
  'sk.name': el => { S.name = el.value.slice(0, 60); store.set('sk.name', S.name); }
});

defineView('sketch', {
  mount: el => S.mount(el),
  show() {
    const imp = store.get('sketch.import', null);
    if (imp) {
      store.set('sketch.import', null);
      S.stop(); S.key = imp.key; S.mode = 'major'; S.bpm = imp.bpm || S.bpm; S.name = imp.name || 'From the Bench';
      S.slots = imp.steps.slice(0, 8).map(([semi, q]) => ({ semi, q }));
      S.len = S.slots.length > 4 ? 8 : 4; S.ensure(); S.sel = 0; S.save(); S.render(); toast('Loaded from the Bench');
    } else { KB.setKey(S.key, S.mode === 'major' ? 'ionian' : 'aeolian'); }
  },
  hide: () => S.stop(), stop: () => S.stop(),
  sub(code) { S.stop(); S.load(code); }
});
