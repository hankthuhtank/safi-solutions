/* OVERTONE · Around the World
   Twelve traditions. Each one opens with real recordings (public domain
   or openly licensed, credited in place), then phrases performed on the
   tradition's own instruments with its drone or percussion underneath,
   phrased like a player would: accents on strong beats, a lift toward
   the high notes, a softer last note, and nothing exactly on the grid. */
import { $, $$, esc, store, act, onInput, defineView, OT, toast } from '../util.js';
import { A } from '../audio.js';
import { at, clearQueue, audibleNow } from '../clock.js';
import { KB } from '../keybed.js';
import { pc, midiOf, rootName, scaleById, spellScale, useKey } from '../music.js';
import { vhead } from './shared.js';
import { openModal, onModalClose, go } from '../shell.js';
import { RECORDINGS, LICENCE_URL } from '../data/recordings.js';
import { openBench } from './bench.js';

/* ---- two phrases for the regions that had none ---- */
OT.MOTIFS.push(
  { id: 'e-pelog', kind: 'etude', n: 'Balungan in Pelog', dev: 'A skeleton melody marked off by gongs', scale: 'pelog', root: 0, bpm: 84, inst: 'tinkle_bell', meter: 4,
    mel: [[3, 1], [7, 1], [8, 1], [7, 1], [3, 1], [1, 1], [0, 1], [1, 1], [3, 1], [7, 1], [8, 1], [7, 1], [3, 1], [1, 1], [0, 2]],
    bass: [],
    note: 'Gamelan music is built around a plain “skeleton” melody like this one, which the other instruments elaborate. The big gong closes each cycle; the smaller kenong marks every four beats.' },
  { id: 'e-montuno', kind: 'etude', n: 'Montuno over Clave', dev: 'Syncopated piano over a tumbao bass', scale: 'ionian', root: 0, bpm: 188, inst: 'piano', meter: 4,
    mel: [[16, .5], [19, .5], [null, .5], [24, .5], [null, .5], [19, .5], [16, .5], [19, .5], [17, .5], [21, .5], [null, .5], [24, .5], [null, .5], [21, .5], [17, .5], [21, .5],
      [14, .5], [19, .5], [null, .5], [23, .5], [null, .5], [19, .5], [14, .5], [19, .5], [17, .5], [21, .5], [null, .5], [24, .5], [null, .5], [21, .5], [17, .5], [16, .5]],
    bass: [[null, 1.5], [0, 1], [7, 1.5], [null, 1.5], [5, 1], [0, 1.5], [null, 1.5], [7, 1], [2, 1.5], [null, 1.5], [5, 1], [0, 1.5]],
    note: 'The piano repeats a syncopated figure, the montuno, while the bass plays the tumbao: it skips beat one and lands on the “and” of two and on four. Both lock to the clave underneath.' }
);
const addMotif = (rid, mid) => { const w = OT.WORLD.find(x => x.id === rid); if (w && !w.motifs.includes(mid)) w.motifs.unshift(mid); };
addMotif('indonesia', 'e-pelog'); addMotif('cuba', 'e-montuno');

/* ---- how each phrase is performed ---- */
const MAQSUM = { k: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], s: [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0], h: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0] };
const PALMAS = { k: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], s: [], h: [], p: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0] };
const PERFORM = {
  'e-majpent': { inst: 'marimba', perc: 'afrobeat', kit: 'Bongos', bassVoice: 'acoustic_bass' },
  'e-hijaz': { inst: 'acoustic_guitar_nylon', pattern: PALMAS, kit: 'Bongos', bassVoice: 'acoustic_guitar_nylon' },
  't-hava': { inst: 'clarinet', pattern: MAQSUM, kit: 'Bongos', bassVoice: 'accordion' },
  'e-bhairav': { inst: 'shanai', drone: true },
  'e-insen': { inst: 'koto' },
  't-sakura': { inst: 'koto', echo: 'shakuhachi' },
  'e-pelog': { inst: 'tinkle_bell', echo: 'vibraphone', gong: true },
  'e-romanian': { inst: 'clarinet', bassVoice: 'accordion', perc: 'rock', kit: 'Bongos' },
  'e-phryg': { inst: 'acoustic_guitar_nylon', pattern: PALMAS, kit: 'Bongos', bassVoice: 'acoustic_guitar_nylon' },
  't-greensleeves': { inst: 'orchestral_harp', bassVoice: 'orchestral_harp', meter: 3 },
  't-scarborough': { inst: 'whistle', bassVoice: 'orchestral_harp', meter: 3 },
  'e-montuno': { inst: 'piano', perc: 'son-clave', kit: 'Bongos', bassVoice: 'acoustic_bass' },
  'e-251': { inst: 'acoustic_guitar_nylon', perc: 'bossa', kit: 'acoustic-kit', bassVoice: 'acoustic_bass' },
  'e-blues': { inst: 'electric_guitar_clean', swing: .6, perc: 'jazzswing', kit: 'acoustic-kit', bassVoice: 'acoustic_bass' },
  't-amazing': { inst: 'acoustic_guitar_steel', bassVoice: 'acoustic_bass', meter: 3 },
  't-house': { inst: 'acoustic_guitar_steel', bassVoice: 'acoustic_bass', meter: 3 },
  't-odejoy': { inst: 'string_ensemble_1', bassVoice: 'cello' },
  't-canon': { inst: 'cello', bassVoice: 'cello' },
  'e-harm': { inst: 'church_organ', bassVoice: 'church_organ' }
};
const LABEL = { westafrica: '#8e3b1f', northafrica: '#1f5a57', india: '#9a5a12', japan: '#7a1f24', indonesia: '#2d4a2a', balkans: '#5a2230', iberia: '#1a1a1a', britain: '#23443a', cuba: '#8a2a18', brazil: '#26502c', usa: '#141414', 'europe-art': '#3a2a12' };

const W = {
  cont: 'all', rate: 1, loop: false, playing: null, rec: null, audio: null,
  mount(el) {
    el.innerHTML = vhead('Around the World', 'Twelve traditions, <em>and what each one solved.</em>', 'Every region below found its own answer to the same questions: how to organise pitch, how to organise time. Open one to hear real recordings from it, its scales, its grooves and phrases played on its own instruments.')
      + '<div id="worldBody"></div>';
    W.render();
  },
  render() {
    const conts = ['all', ...new Set(OT.WORLD.map(w => w.cont.split(' · ')[0]))];
    const list = OT.WORLD.filter(w => W.cont === 'all' || w.cont.startsWith(W.cont));
    $('#worldBody').innerHTML = `
      <div class="chips-scroll" style="margin-bottom:22px">${conts.map(c => `<button class="chip" data-act="world.cont" data-v="${c}" aria-pressed="${c === W.cont}">${esc(c === 'all' ? 'Everywhere' : c)}</button>`).join('')}</div>
      <div class="crate">${list.map(w => { const recs = RECORDINGS[w.id] || []; return `
        <button class="wcard" data-act="world.open" data-v="${w.id}" style="--label:${LABEL[w.id] || '#3a2a12'}">
          <span class="sleeve" aria-hidden="true"><span class="disc"><span class="lbl"><b>${esc(w.region.split(' ')[0].replace(/&|,/g, ''))}</b><i>${esc(recs[0] ? (recs[0].who.match(/\b(1[89]\d\d|20\d\d)\b/) || ['78 rpm'])[0] : '78 rpm')}</i></span></span></span>
          <span class="wc-body"><span class="wc-cont">${esc(w.cont)}</span><h4>${esc(w.region)}</h4><p>${esc(w.blurb)}</p>
          <span class="tagrow">${recs.length ? `<span class="tg has-rec">${recs.length} recording${recs.length > 1 ? 's' : ''}</span>` : ''}<span class="tg">${w.scales.length} scales</span><span class="tg">${w.rhythms.length} grooves</span>${w.motifs.length ? `<span class="tg">${w.motifs.length} to play</span>` : ''}</span></span>
        </button>`; }).join('')}</div>
      <section class="panel plain world-note">
        <div class="grid2 even">
          <p class="note-txt"><span class="kv">Before you browse</span>These are doorways, not summaries. Every tradition here has centuries of practice, regional variation and living teachers behind it. Treat what follows as a reason to go and listen to the real thing, which is why each one starts with real recordings.</p>
          <p class="note-txt"><span class="kv">On the tuning</span>Several of these traditions do not use the twelve equal semitones this site is built on. Arabic and Turkish makam and Javanese gamelan contain intervals that fall between a piano’s keys. The phrases here are translations; the recordings are the originals.</p>
        </div>
      </section>`;
  },

  /* ---------------- a region ---------------- */
  open(id) {
    const w = OT.WORLD.find(x => x.id === id); if (!w) return;
    const recs = RECORDINGS[id] || [];
    openModal(w.region, `
      <header class="wm-head" style="--label:${LABEL[id] || '#3a2a12'}"><span class="wc-cont">${esc(w.cont)}</span><h3>${esc(w.region)}</h3><p>${esc(w.blurb)}</p></header>
      <div class="mrow"><span class="k">The big idea</span><span class="v"><b>${esc(w.idea)}</b></span></div>
      <div class="mrow"><span class="k">Instruments</span><span class="v">${esc(w.inst)}</span></div>
      ${recs.length ? `<section class="recs" style="--label:${LABEL[id] || '#3a2a12'}"><h4 class="wm-h">Listen to the real thing</h4>${recs.map((r, i) => `
        <div class="rec" data-i="${i}">
          <button class="rec-play" data-act="world.rec" data-id="${id}" data-i="${i}" aria-label="Play ${esc(r.t)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
          <span class="rec-disc" aria-hidden="true"><i></i></span>
          <div class="rec-main"><b>${esc(r.t)}</b><span class="rec-who">${esc(r.who)}</span>
            <div class="rec-bar" data-act="world.seek" data-i="${i}"><i></i></div>
            <p class="rec-note">${esc(r.note)}</p>
            <span class="rec-lic"><span class="rec-time">0:00</span> · <a href="${esc(r.page)}" target="_blank" rel="noopener">Wikimedia Commons ↗</a> · <a href="${esc(LICENCE_URL[r.lic] || r.page)}" target="_blank" rel="noopener">${esc(r.lic)}</a></span></div>
        </div>`).join('')}</section>` : ''}
      ${w.motifs.length ? `<section><h4 class="wm-h">Phrases to play</h4><p class="hint" style="margin-bottom:10px">Performed on this tradition’s instruments. Where a phrase is original it says so; traditional melodies are public domain.</p>${w.motifs.map(mid => W.motifHtml(mid)).join('')}</section>` : ''}
      <div class="mrow"><span class="k">Its scales</span><span class="v"><div class="row">${w.scales.map(sid => { const sc = scaleById(sid); return sc ? `<button class="chip" data-act="world.scale" data-v="${sid}" data-r="${id}">${esc(sc.n)} ▸</button>` : ''; }).join('')}</div></span></div>
      <div class="mrow"><span class="k">Its grooves</span><span class="v"><div class="row">${w.rhythms.map(rid => { const r = OT.RHYTHMS.find(x => x.id === rid); return r ? `<button class="chip pat" data-act="world.groove" data-v="${rid}">${esc(r.n)} · ${esc(r.sig)} ▸</button>` : ''; }).join('')}</div><p class="hint" style="margin-top:8px">Opens in the Rhythm Room on a real kit.</p></span></div>`);
    Object.values(PERFORM).forEach(p => { if (p.inst) A.load(p.inst); });
    w.motifs.forEach(mid => { const p = PERFORM[mid] || {}, m = OT.MOTIFS.find(x => x.id === mid); [p.inst || (m && m.inst), p.bassVoice, p.echo].filter(Boolean).forEach(v => A.load(v)); if (p.kit) A.loadKit(p.kit); });
  },

  /* ---------------- recordings ---------------- */
  playRec(id, i) {
    const r = RECORDINGS[id][i], row = $(`.rec[data-i="${i}"]`);
    if (!W.audio) {
      W.audio = new Audio(); W.audio.preload = 'none';
      W.audio.addEventListener('timeupdate', W.tick); W.audio.addEventListener('ended', () => W.recUI(false));
      W.audio.addEventListener('error', () => { W.recUI(false); toast('That recording could not be reached right now. The Commons link still works.'); });
      W.audio.addEventListener('waiting', () => W.cur && W.cur.classList.add('buffer'));
      W.audio.addEventListener('playing', () => W.cur && W.cur.classList.remove('buffer'));
    }
    if (W.rec === id + i && !W.audio.paused) { W.audio.pause(); W.recUI(false); return; }
    W.stopMotif(); A.stopAll();
    if (W.rec !== id + i) { W.audio.src = r.src; W.rec = id + i; }
    W.cur = row;
    W.audio.play().then(() => W.recUI(true)).catch(() => W.recUI(false));
    W.recUI(true);
  },
  recUI(on) {
    $$('.rec').forEach(r => { const me = r === W.cur && on; r.classList.toggle('on', me); r.querySelector('.rec-play').innerHTML = me ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'; });
  },
  tick() {
    const a = W.audio, r = W.cur; if (!r || !a.duration) return;
    r.querySelector('.rec-bar i').style.width = (a.currentTime / a.duration * 100) + '%';
    const f = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    r.querySelector('.rec-time').textContent = f(a.currentTime) + ' / ' + f(a.duration);
  },
  stopRec() { if (W.audio) { W.audio.pause(); } W.recUI(false); },

  /* ---------------- phrases ---------------- */
  motifHtml(id) {
    const m = OT.MOTIFS.find(x => x.id === id); if (!m) return '';
    const p = PERFORM[id] || {};
    const pitches = m.mel.filter(n => n[0] !== null).map(n => n[0]);
    const lo = Math.min(...pitches), hi = Math.max(...pitches), span = Math.max(1, hi - lo);
    const total = m.mel.reduce((a, n) => a + Math.abs(n[1]), 0);
    let t = 0;
    const roll = m.mel.map((n, i) => { const x = t / total * 100, w = Math.abs(n[1]) / total * 100; t += Math.abs(n[1]); if (n[0] === null) return ''; const y = 88 - (n[0] - lo) / span * 76; return `<i data-n="${i}" style="left:${x}%;width:calc(${w}% - 2px);top:${y}%"></i>`; }).join('');
    const voiceName = (id2 => { const o = document.querySelector(`#voiceSel option[value="${id2}"]`); return o ? o.textContent : id2.replace(/_/g, ' '); })(p.inst || m.inst || 'piano');
    const tag = m.kind === 'trad' ? `<span class="badge">Traditional · ${esc(m.origin || 'public domain')}</span>` : `<span class="badge orig">Original · written for this site</span>`;
    return `<div class="motif" data-motif="${id}">
      <div class="motif-h"><h5>${esc(m.n)}</h5>${tag}</div>
      <div class="roll" id="roll-${id}">${roll}<b class="roll-head"></b></div>
      <div class="motif-ctl">
        <button class="btn btn-brass btn-sm" data-act="world.motif" data-v="${id}" id="mp-${id}">Play</button>
        <button class="chip" data-act="world.loop" aria-pressed="${W.loop}">Loop</button>
        <div class="slider-row"><span class="plabel">Tempo</span><input type="range" min="50" max="150" value="${Math.round(W.rate * 100)}" data-input="world.rate" data-v="${id}" aria-label="Tempo"><output id="mb-${id}">${Math.round(m.bpm * W.rate)}</output></div>
        <span class="hint">${esc(voiceName)}${p.drone ? ' · drone' : ''}${p.perc || p.pattern ? ' · percussion' : ''}${p.gong ? ' · gongs' : ''}</span>
      </div>
      <p class="note-txt"><span class="kv">${esc(m.dev || 'The device')}</span>${esc(m.note)}</p>
      ${m.scale ? `<button class="chip" data-act="world.bench" data-v="${id}">Open ${esc((scaleById(m.scale) || {}).n || '')} on the Bench</button>` : ''}
    </div>`;
  },
  playMotif(id, again) {
    const m = OT.MOTIFS.find(x => x.id === id); if (!m) return;
    if (W.playing === id && !again) { W.stopMotif(); return; }
    if (!again) { W.stopMotif(); W.stopRec(); }
    A.resume();
    const p = PERFORM[id] || {};
    const spb = 60 / ((m.bpm || 100) * W.rate), root = midiOf(m.root || 0, 4), meter = p.meter || m.meter || 4;
    const inst = p.inst || m.inst || 'piano';
    const t0 = A.ctx.currentTime + .12;
    W.playing = id;
    const btn = $('#mp-' + id); if (btn) { btn.textContent = 'Stop'; btn.className = 'btn live btn-sm'; }
    const pitches = m.mel.filter(n => n[0] !== null).map(n => n[0]), hi = Math.max(...pitches), lo = Math.min(...pitches);
    const plucked = /guitar|harp|koto|marimba|bell|piano|kalimba|sitar|banjo|dulcimer/.test(inst);
    let beat = 0, lastIdx = -1;
    m.mel.forEach((n, i) => { if (n[0] !== null) lastIdx = i; });
    m.mel.forEach((n, i) => {
      const beats = Math.abs(n[1]);
      if (n[0] !== null) {
        const down = Math.abs(beat % meter) < .01, onBeat = Math.abs(beat % 1) < .01;
        let vel = .6 + (down ? .14 : onBeat ? .06 : -.03) + (n[0] - lo) / Math.max(1, hi - lo) * .1;
        let start = beat * spb;
        if (p.swing && Math.abs(beat % 1 - .5) < .01) start += spb * p.swing * .33;
        if (i === lastIdx) { vel *= .82; start += spb * .06; }
        const dur = beats * spb * (plucked ? 1.25 : .97);
        A.play(root + n[0], { at: t0 + start, dur, vel, voice: inst, human: .9 });
        if (p.echo) A.play(root + n[0] - 12, { at: t0 + start + .012, dur, vel: vel * .55, voice: p.echo, human: .6 });
        at(t0 + start, () => { const r = $('#roll-' + id); if (!r) return; r.querySelectorAll('i').forEach(el => el.classList.toggle('on', +el.dataset.n === i)); }, W);
      }
      beat += beats;
    });
    const totalBeats = beat;
    /* the accompaniment */
    let bb = 0;
    const bassVoice = p.bassVoice || (m.inst === 'cello' ? 'cello' : 'acoustic_bass');
    (m.bass || []).forEach(n => { const beats = Math.abs(n[1]); if (n[0] !== null) A.play(root - 12 + n[0] - (bassVoice === 'acoustic_bass' || bassVoice === 'cello' ? 12 : 0), { at: t0 + bb * spb, dur: beats * spb * .95, vel: .5, voice: bassVoice, human: .6 }); bb += beats; });
    if (p.drone) {
      const sa = root - 12, plucks = [sa - 5, sa, sa, sa - 12];
      for (let k = 0; k * 1.1 < totalBeats * spb; k++) A.play(plucks[k % 4], { at: t0 + k * 1.1, voice: 'ks_steel', dur: 3.8, vel: .42, human: .5 });
      [sa - 12, sa - 5].forEach((d, k) => A.play(d, { at: t0, voice: 'syn_pad', dur: totalBeats * spb + .6, vel: k ? .16 : .26 }));
    }
    const pat = p.pattern || (p.perc && OT.RHYTHMS.find(r => r.id === p.perc));
    if (pat) {
      const steps = pat.k.length, perBeat = steps === 16 ? 4 : steps / (pat.beats || 4);
      for (let s = 0; s < totalBeats * perBeat; s++) {
        const k = s % steps, t = t0 + (s / perBeat) * spb + (p.swing && s % 2 ? spb / perBeat * p.swing * .66 : 0);
        ['k', 's', 'h', 'p'].forEach(l => { if (pat[l] && pat[l][k]) A.drum(l, t + (Math.random() - .5) * .008, (l === 'h' ? .5 : l === 'p' ? .7 : .8) * (.85 + Math.random() * .2), p.kit || 'acoustic-kit'); });
      }
    }
    if (p.gong) for (let b = 0; b <= totalBeats; b += 4) A.play(root - (b % 16 === 0 || b >= totalBeats ? 36 : 24), { at: t0 + b * spb, voice: 'syn_bell', dur: b % 16 === 0 ? 5 : 2, vel: b % 16 === 0 ? .7 : .38 });
    /* the playhead */
    const r = $('#roll-' + id), head = r && r.querySelector('.roll-head');
    if (head) { head.style.transition = 'none'; head.style.left = '0%'; at(t0, () => { head.style.transition = `left ${totalBeats * spb}s linear`; head.style.left = '100%'; }, W); }
    at(t0 + totalBeats * spb + .25, () => {
      if (W.playing !== id) return;
      if (W.loop) W.playMotif(id, true);
      else W.stopMotif();
    }, W);
  },
  stopMotif() {
    clearQueue(W);
    if (W.playing) { A.stopAll(); const b = $('#mp-' + W.playing); if (b) { b.textContent = 'Play'; b.className = 'btn btn-brass btn-sm'; } }
    W.playing = null;
    $$('.roll i.on').forEach(e => e.classList.remove('on'));
    $$('.roll-head').forEach(h => { h.style.transition = 'none'; h.style.left = '0%'; });
  },
  hearScale(sid, rid) {
    A.resume(); W.stopMotif(); W.stopRec();
    const sc = scaleById(sid);
    const root = { bhairav: 2, insen: 2, hijaz: 4, pelog: 0, phrygdom: 4, romanian: 2 }[sid] ?? 0;
    const inst = { india: 'shanai', japan: 'koto', indonesia: 'tinkle_bell', northafrica: 'clarinet', balkans: 'clarinet', iberia: 'acoustic_guitar_nylon', britain: 'fiddle', westafrica: 'marimba', cuba: 'piano', brazil: 'acoustic_guitar_nylon', usa: 'electric_guitar_clean', 'europe-art': 'string_ensemble_1' }[rid] || 'piano';
    A.load(inst);
    const base = midiOf(root, 4), notes = sc.iv.map(i => base + i).concat([base + 12]);
    const t0 = A.ctx.currentTime + .08, gap = .3;
    if (rid === 'india' || rid === 'japan') A.play(base - 12, { at: t0, voice: 'syn_pad', dur: notes.length * gap + 1.2, vel: .3 });
    notes.forEach((m, k) => A.play(m, { at: t0 + k * gap, dur: gap * 1.6, vel: .7, voice: inst, human: .8 }));
    toast(`${spellScale(root, sc)[0].name} ${sc.n}${sc.culture ? ' · ' + sc.culture : ''}`);
  }
};

act({
  'world.cont': el => { W.cont = el.dataset.v; W.render(); },
  'world.open': el => W.open(el.dataset.v),
  'world.rec': el => W.playRec(el.dataset.id, +el.dataset.i),
  'world.seek': (el, e) => { const a = W.audio; if (!a || !a.duration || !el.closest('.rec.on')) return; const r = el.getBoundingClientRect(); a.currentTime = (e.clientX - r.left) / r.width * a.duration; },
  'world.motif': el => W.playMotif(el.dataset.v),
  'world.loop': el => { W.loop = !W.loop; $$('[data-act="world.loop"]').forEach(b => b.setAttribute('aria-pressed', String(W.loop))); },
  'world.scale': el => W.hearScale(el.dataset.v, el.dataset.r),
  'world.groove': el => { W.stopMotif(); W.stopRec(); document.getElementById('modal').close(); go('rhythm/' + el.dataset.v); },
  'world.bench': el => { const m = OT.MOTIFS.find(x => x.id === el.dataset.v); if (!m) return; document.getElementById('modal').close(); openBench({ root: m.root || 0, scale: m.scale }); }
});
onInput({ 'world.rate': el => { W.rate = +el.value / 100; const m = OT.MOTIFS.find(x => x.id === el.dataset.v); const o = $('#mb-' + el.dataset.v); if (m && o) o.textContent = Math.round(m.bpm * W.rate); } });
onModalClose(() => { W.stopMotif(); W.stopRec(); });

defineView('world', { mount: el => W.mount(el), show() { KB.setKey(0, null); }, hide() { W.stopMotif(); W.stopRec(); }, stop() { W.stopMotif(); W.stopRec(); } });
