/* OVERTONE · The Library
   Every term in plain language, filed like a card catalogue. Where a
   term is something you can hear, the card can play it. */
import { $, $$, esc, act, onInput, defineView, OT } from '../util.js';
import { A } from '../audio.js';
import { KB } from '../keybed.js';
import { vhead } from './shared.js';
import { openModal, go } from '../shell.js';
import { openBench } from './bench.js';

const L = {
  cat: 'all', q: '',
  mount(el) {
    el.innerHTML = vhead('The Library', 'Every term, <em>in plain language.</em>', 'What it is, why it matters, and the thing people get wrong about it. Terms you can hear come with a sound.')
      + `<div class="lib-bar"><label class="search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg><input type="search" placeholder="Search ${OT.ENCYCLOPEDIA.length} terms…" data-input="lib.q" aria-label="Search terms"></label>
        <div class="chips-scroll">${OT.ENC_CATS.map(([v, n]) => `<button class="chip" data-act="lib.cat" data-v="${v}" aria-pressed="${v === L.cat}">${esc(n)}</button>`).join('')}</div></div>
      <div class="catalog" id="libGrid"></div><p class="count" id="libCount"></p>`;
    L.render();
  },
  list() { const q = L.q.toLowerCase(); return OT.ENCYCLOPEDIA.filter(e => (L.cat === 'all' || e.cat === L.cat) && (!q || (e.t + ' ' + e.tag + ' ' + e.def + ' ' + e.why).toLowerCase().includes(q))); },
  render() {
    const l = L.list();
    $('#libGrid').innerHTML = l.map((e, k) => { const i = OT.ENCYCLOPEDIA.indexOf(e); return `
      <button class="icard" data-act="lib.open" data-v="${i}" style="--tilt:${((i * 37) % 7 - 3) * .18}deg">
        <span class="ic-no">${String(i + 1).padStart(3, '0')} · ${esc((OT.ENC_CATS.find(c => c[0] === e.cat) || [, e.cat])[1])}</span>
        <h4>${esc(e.t)}</h4><span class="ic-tag">${esc(e.tag)}</span><p>${esc(e.def)}</p>${L.sound(e) ? '<span class="ic-hear">♪ hear it</span>' : ''}<i class="ic-hole"></i></button>`; }).join('') || `<p class="note-txt">No card matches “${esc(L.q)}”. Try a shorter word.</p>`;
    $('#libCount').textContent = `${l.length} of ${OT.ENCYCLOPEDIA.length} cards`;
  },
  /* terms that have a sound in the app */
  sound(e) {
    const t = e.t.toLowerCase();
    const iv = OT.INTERVALS.find(x => t === x.n.toLowerCase() || t.startsWith(x.n.toLowerCase()));
    if (iv) return { kind: 'interval', iv };
    const ch = OT.CHORDS.find(c => t.includes(c.n.toLowerCase()) && c.n.length > 4);
    if (ch) return { kind: 'chord', ch };
    const sc = OT.SCALES.find(s => t.includes(s.n.toLowerCase().split(' (')[0]) && s.n.length > 4);
    if (sc) return { kind: 'scale', sc };
    if (/harmonic series|overtone/.test(t)) return { kind: 'series' };
    if (/octave/.test(t)) return { kind: 'interval', iv: OT.INTERVALS.find(x => x.s === 12) };
    if (/swing|syncopation|backbeat|groove|clave|polyrhythm|tempo|meter|time signature/.test(t)) return { kind: 'rhythm' };
    return null;
  },
  hear(e) {
    const s = L.sound(e); if (!s) return; A.resume(); A.begin('library');
    if (s.kind === 'interval') { A.play(60, { dur: 1, vel: .7 }); A.play(60 + s.iv.s, { dur: 1.2, vel: .7, when: .55 }); A.chord([60, 60 + s.iv.s], { dur: 1.4, vel: .55, when: 1.3 }); }
    else if (s.kind === 'chord') A.chord(s.ch.iv.map(i => 57 + i), { dur: 1.8, vel: .62 });
    else if (s.kind === 'scale') A.seq(s.sc.iv.map(i => 60 + i).concat([72]), { gap: .2, dur: .45, vel: .7 });
    else if (s.kind === 'series') [1, 2, 3, 4, 5, 6].forEach((n, k) => A.sine(130.81 * n, { when: k * .35, dur: 1.4, gain: .18 }));
    else if (s.kind === 'rhythm') { A.loadKit(); const t0 = A.ctx.currentTime + .05; [0, 3, 6, 10, 12].forEach(k => A.drum('c', t0 + k * .15, .8)); [0, 8].forEach(k => A.drum('k', t0 + k * .15, .8)); [4, 12].forEach(k => A.drum('s', t0 + k * .15, .7)); }
  },
  open(i) {
    const e = OT.ENCYCLOPEDIA[i], s = L.sound(e);
    openModal('The Library', `<div class="icard-open"><span class="ic-no">${String(i + 1).padStart(3, '0')}</span><h3>${esc(e.t)}</h3><p class="msub">${esc(e.tag)}</p>
      <div class="mrow"><span class="k">What it is</span><span class="v">${esc(e.def)}</span></div>
      <div class="mrow"><span class="k">Why it matters</span><span class="v">${esc(e.why)}</span></div>
      <div class="mrow"><span class="k">Worth knowing</span><span class="v"><b>${esc(e.watch)}</b></span></div>
      ${s ? `<div class="row" style="margin-top:18px"><button class="btn btn-brass btn-sm" data-act="lib.hear" data-v="${i}">♪ Hear it</button>${s.kind === 'scale' ? `<button class="btn btn-ghost btn-sm" data-act="lib.bench" data-v="${s.sc.id}">Open on the Bench</button>` : ''}${s.kind === 'rhythm' ? `<button class="btn btn-ghost btn-sm" data-act="go" data-v="rhythm">Rhythm Room</button>` : ''}${s.kind === 'series' ? `<a class="btn btn-ghost btn-sm" href="#home">See the series</a>` : ''}</div>` : ''}</div>`);
    if (s) setTimeout(() => L.hear(e), 250);
  }
};

act({
  'lib.cat': el => { L.cat = el.dataset.v; $$('[data-act="lib.cat"]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); L.render(); },
  'lib.open': el => L.open(+el.dataset.v),
  'lib.hear': el => L.hear(OT.ENCYCLOPEDIA[+el.dataset.v]),
  'lib.bench': el => { document.getElementById('modal').close(); openBench({ scale: el.dataset.v, root: 0 }); }
});
onInput({ 'lib.q': el => { L.q = el.value.trim(); L.render(); } });

defineView('library', { mount: el => L.mount(el), show() { KB.setKey(0, null); } });
