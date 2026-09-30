/* OVERTONE · audio engine
   ---------------------------------------------------------------
   Voices
     salamander  Yamaha C5 grand, Salamander Grand Piano samples
                 (Alexander Holm, CC-BY 3.0) via tonejs.github.io
     sf          General MIDI instruments from the MusyngKite set
                 (CC-BY-SA 3.0) with FluidR3 as a per-note fallback
     ks          Karplus–Strong plucked string, computed here
     osc/pad/fm  small subtractive and FM synths
   Drums: real kits from the Tone.js sample library, synthesised
   fallbacks if the network is unavailable.
   Signal: voices → master → (dry + convolution room) → glue
   compressor → output → speakers, with an analyser on the output.
   --------------------------------------------------------------- */
import { store, clamp, toast } from './util.js';
import { freq, pc } from './music.js';

const SALAMANDER = 'https://tonejs.github.io/audio/salamander/';
const SF_MAIN = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/';
const SF_BACK = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';
const KIT_BASE = 'https://tonejs.github.io/audio/drum-samples/';

export const VOICES = [
  { id: 'piano', n: 'Concert grand', g: 'Keys', kind: 'salamander', rel: .45, gain: 1.05 },
  { id: 'electric_piano_1', n: 'Electric piano', g: 'Keys', kind: 'sf', rel: .4 },
  { id: 'harpsichord', n: 'Harpsichord', g: 'Keys', kind: 'sf', rel: .25 },
  { id: 'church_organ', n: 'Pipe organ', g: 'Keys', kind: 'sf', rel: .35, gain: .7 },
  { id: 'celesta', n: 'Celesta', g: 'Keys', kind: 'sf', rel: .6 },
  { id: 'music_box', n: 'Music box', g: 'Keys', kind: 'sf', rel: .8 },
  { id: 'ks_steel', n: 'Steel string · modelled', g: 'Plucked', kind: 'ks', bright: .92, body: 1, gain: .9 },
  { id: 'ks_nylon', n: 'Nylon string · modelled', g: 'Plucked', kind: 'ks', bright: .42, body: 1.2, gain: 1.1 },
  { id: 'acoustic_guitar_steel', n: 'Acoustic guitar', g: 'Plucked', kind: 'sf', rel: .3 },
  { id: 'acoustic_guitar_nylon', n: 'Classical guitar', g: 'Plucked', kind: 'sf', rel: .3 },
  { id: 'electric_guitar_clean', n: 'Clean electric', g: 'Plucked', kind: 'sf', rel: .3 },
  { id: 'overdriven_guitar', n: 'Overdriven guitar', g: 'Plucked', kind: 'sf', rel: .25, gain: .65 },
  { id: 'orchestral_harp', n: 'Harp', g: 'Plucked', kind: 'sf', rel: .9 },
  { id: 'koto', n: 'Koto', g: 'Plucked', kind: 'sf', rel: .5, scoop: 18 },
  { id: 'sitar', n: 'Sitar', g: 'Plucked', kind: 'sf', rel: .6, gain: .8, scoop: 45 },
  { id: 'acoustic_bass', n: 'Upright bass', g: 'Plucked', kind: 'sf', rel: .25 },
  { id: 'electric_bass_finger', n: 'Electric bass', g: 'Plucked', kind: 'sf', rel: .2 },
  { id: 'marimba', n: 'Marimba', g: 'Mallets', kind: 'sf', rel: .3 },
  { id: 'vibraphone', n: 'Vibraphone', g: 'Mallets', kind: 'sf', rel: .9 },
  { id: 'kalimba', n: 'Kalimba', g: 'Mallets', kind: 'sf', rel: .5 },
  { id: 'steel_drums', n: 'Steel pan', g: 'Mallets', kind: 'sf', rel: .5 },
  { id: 'violin', n: 'Violin', g: 'Bowed & voice', kind: 'sf', rel: .3, gain: .75, vib: 16, scoop: 22 },
  { id: 'cello', n: 'Cello', g: 'Bowed & voice', kind: 'sf', rel: .3, gain: .8, vib: 13, scoop: 18 },
  { id: 'string_ensemble_1', n: 'String section', g: 'Bowed & voice', kind: 'sf', rel: .5, gain: .75, vib: 5 },
  { id: 'choir_aahs', n: 'Choir', g: 'Bowed & voice', kind: 'sf', rel: .5, gain: .75, vib: 7, scoop: 10 },
  { id: 'flute', n: 'Flute', g: 'Winds', kind: 'sf', rel: .2, gain: .8, vib: 9, scoop: 12 },
  { id: 'pan_flute', n: 'Pan flute', g: 'Winds', kind: 'sf', rel: .3, gain: .8, vib: 7, scoop: 28 },
  { id: 'shakuhachi', n: 'Shakuhachi', g: 'Winds', kind: 'sf', rel: .35, gain: .75, vib: 14, scoop: 55 },
  { id: 'clarinet', n: 'Clarinet', g: 'Winds', kind: 'sf', rel: .2, gain: .75, vib: 6, scoop: 14 },
  { id: 'alto_sax', n: 'Alto sax', g: 'Winds', kind: 'sf', rel: .2, gain: .7, vib: 13, scoop: 30 },
  { id: 'trumpet', n: 'Trumpet', g: 'Winds', kind: 'sf', rel: .2, gain: .7, vib: 8, scoop: 18 },
  { id: 'french_horn', n: 'French horn', g: 'Winds', kind: 'sf', rel: .3, gain: .75, vib: 5, scoop: 10 },
  { id: 'shanai', n: 'Shehnai', g: 'World', kind: 'sf', rel: .25, gain: .62, vib: 18, scoop: 45 },
  { id: 'shamisen', n: 'Shamisen', g: 'World', kind: 'sf', rel: .3, scoop: 20 },
  { id: 'fiddle', n: 'Fiddle', g: 'World', kind: 'sf', rel: .25, gain: .72, vib: 14, scoop: 25 },
  { id: 'bagpipe', n: 'Bagpipes', g: 'World', kind: 'sf', rel: .15, gain: .55 },
  { id: 'accordion', n: 'Accordion', g: 'World', kind: 'sf', rel: .2, gain: .6, vib: 4 },
  { id: 'banjo', n: 'Banjo', g: 'World', kind: 'sf', rel: .3 },
  { id: 'dulcimer', n: 'Hammered dulcimer', g: 'World', kind: 'sf', rel: .7 },
  { id: 'whistle', n: 'Tin whistle', g: 'World', kind: 'sf', rel: .15, gain: .7, vib: 8, scoop: 20 },
  { id: 'recorder', n: 'Recorder', g: 'World', kind: 'sf', rel: .15, gain: .75, vib: 4, scoop: 10 },
  { id: 'harmonica', n: 'Harmonica', g: 'World', kind: 'sf', rel: .2, gain: .6, vib: 10, scoop: 35 },
  { id: 'tinkle_bell', n: 'Gamelan bells', g: 'World', kind: 'sf', rel: 1.2, gain: .8 },
  { id: 'syn_square', n: 'Square · chip', g: 'Synth', kind: 'osc', wave: .5 },
  { id: 'syn_pulse', n: 'Narrow pulse · chip', g: 'Synth', kind: 'osc', wave: .125 },
  { id: 'syn_tri', n: 'Triangle', g: 'Synth', kind: 'osc', wave: 'triangle' },
  { id: 'syn_saw', n: 'Analog saw lead', g: 'Synth', kind: 'osc', wave: 'sawtooth', filter: 1 },
  { id: 'syn_pad', n: 'Warm pad', g: 'Synth', kind: 'pad' },
  { id: 'syn_bell', n: 'FM bell', g: 'Synth', kind: 'fm' }
];
export const voiceById = id => VOICES.find(v => v.id === id) || VOICES[0];

export const KITS = [
  ['acoustic-kit', 'Studio kit'], ['LINN', 'LinnDrum'], ['CR78', 'CR-78'], ['R8', 'Roland R-8'],
  ['Techno', 'Techno'], ['Bongos', 'Hand drums']
];
const KIT_FILES = { k: 'kick', s: 'snare', h: 'hihat', t: 'tom2', l: 'tom3', m: 'tom1' };

/* sample layout: Salamander covers every minor third A0–C8, GM sets C/E♭/G♭/A per octave */
const SAL_NAMES = { 0: 'C', 3: 'Ds', 6: 'Fs', 9: 'A' };
const SF_NAMES = { 0: 'C', 3: 'Eb', 6: 'Gb', 9: 'A' };

const listeners = { note: new Set(), load: new Set(), voice: new Set() };

export const A = {
  ctx: null, out: null, master: null, an: null,
  voiceId: store.get('voice', 'piano'),
  kitId: store.get('kit', 'acoustic-kit'),
  vol: store.get('vol', .85), room: store.get('room', .24), muted: false,
  sustain: false,
  buf: {}, state: {}, kits: {}, ks: new Map(), waves: {},
  held: new Map(), pedalled: new Set(), live: new Set(),

  on(type, fn) { listeners[type].add(fn); return () => listeners[type].delete(fn); },
  emit(type, d) { listeners[type].forEach(fn => { try { fn(d); } catch (e) { console.error(e); } }); },

  init() {
    if (A.ctx) return A.ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    const ctx = A.ctx = new C({ latencyHint: 'interactive' });
    A.master = ctx.createGain();
    A.dry = ctx.createGain();
    A.wet = ctx.createGain();
    A.verb = ctx.createConvolver();
    A.verb.buffer = A.impulse(2.8, 2.6);
    A.comp = ctx.createDynamicsCompressor();
    A.comp.threshold.value = -15; A.comp.knee.value = 10; A.comp.ratio.value = 3.2;
    A.comp.attack.value = .004; A.comp.release.value = .22;
    A.out = ctx.createGain();
    A.out.gain.value = A.muted ? 0 : A.vol;
    A.an = ctx.createAnalyser(); A.an.fftSize = 2048; A.an.smoothingTimeConstant = .8;
    A.drums = ctx.createGain(); A.drums.gain.value = .9;
    A.drumVerb = ctx.createGain(); A.drumVerb.gain.value = .12;
    A.master.connect(A.dry); A.master.connect(A.verb);
    A.drums.connect(A.comp); A.drums.connect(A.drumVerb); A.drumVerb.connect(A.verb);
    A.verb.connect(A.wet); A.wet.connect(A.comp); A.dry.connect(A.comp);
    A.comp.connect(A.out); A.out.connect(ctx.destination); A.out.connect(A.an);
    /* a guitar-body resonance shared by the modelled strings */
    const b1 = ctx.createBiquadFilter(); b1.type = 'peaking'; b1.frequency.value = 105; b1.Q.value = 1.4; b1.gain.value = 5;
    const b2 = ctx.createBiquadFilter(); b2.type = 'peaking'; b2.frequency.value = 230; b2.Q.value = 1.2; b2.gain.value = 3;
    const b3 = ctx.createBiquadFilter(); b3.type = 'highshelf'; b3.frequency.value = 4200; b3.gain.value = -4;
    b1.connect(b2); b2.connect(b3); b3.connect(A.master); A.body = b1;
    A.setRoom(A.room);
    return ctx;
  },
  resume() { A.init(); if (A.ctx.state !== 'running') A.ctx.resume(); return A.ctx; },
  now() { return A.ctx ? A.ctx.currentTime : 0; },

  /* a room built from decaying stereo noise, darkened as it dies */
  impulse(sec, decay) {
    const c = A.ctx, n = Math.floor(c.sampleRate * sec), pre = Math.floor(c.sampleRate * .012);
    const b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let lp = 0;
      for (let i = pre; i < n; i++) {
        const k = (i - pre) / (n - pre), env = Math.pow(1 - k, decay);
        lp += (1 - k * .85) * ((Math.random() * 2 - 1) - lp);   /* high end fades faster */
        d[i] = lp * env * .9;
      }
    }
    return b;
  },
  setRoom(v) {
    A.room = clamp(v, 0, 1); store.set('room', A.room);
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    A.wet.gain.setTargetAtTime(A.room * 1.15, t, .05);
    A.dry.gain.setTargetAtTime(1 - A.room * .3, t, .05);
  },
  setVolume(v) {
    A.vol = clamp(v, 0, 1); store.set('vol', A.vol);
    if (A.ctx && !A.muted) A.out.gain.setTargetAtTime(A.vol, A.ctx.currentTime, .03);
  },
  setMuted(m) {
    A.init(); A.muted = !!m;
    A.out.gain.setTargetAtTime(A.muted ? 0 : A.vol, A.ctx.currentTime, .02);
  },

  /* ---------- voices & loading ---------- */
  get voice() { return voiceById(A.voiceId); },
  setVoice(id) {
    const v = voiceById(id);
    A.voiceId = v.id; store.set('voice', v.id);
    A.emit('voice', v);
    return A.load(v.id);
  },
  load(id) {
    const v = voiceById(id);
    if (v.kind !== 'salamander' && v.kind !== 'sf') return Promise.resolve('ok');
    if (A.state[id] === 'ok' || A.state[id] === 'part') return Promise.resolve(A.state[id]);
    if (A.state[id] === 'loading') return A.state[id + ':p'];
    A.init(); A.state[id] = 'loading'; A.buf[id] = {};
    const jobs = [];
    const files = [];
    if (v.kind === 'salamander') {
      for (let m = 21; m <= 108; m++) if (SAL_NAMES[pc(m)] !== undefined) files.push([m, SALAMANDER + SAL_NAMES[pc(m)] + (Math.floor(m / 12) - 1) + '.mp3']);
    } else {
      for (let m = 24; m <= 96; m++) if (SF_NAMES[pc(m)] !== undefined) {
        const f = id + '-mp3/' + SF_NAMES[pc(m)] + (Math.floor(m / 12) - 1) + '.mp3';
        files.push([m, SF_MAIN + f, SF_BACK + f]);
      }
    }
    /* the middle of the keyboard first, so it is playable sooner */
    files.sort((a, b) => Math.abs(a[0] - 62) - Math.abs(b[0] - 62));
    let done = 0;
    const get1 = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => A.ctx.decodeAudioData(b));
    const get = url => get1(url).catch(() => new Promise(r => setTimeout(r, 700)).then(() => get1(url)));   /* one retry for flaky networks */
    for (const [m, url, back] of files) {
      jobs.push(get(url).catch(() => back ? get(back) : Promise.reject())
        .then(b => { A.buf[id][m] = b; if (A.state[id] === 'loading' && Object.keys(A.buf[id]).length >= 4) A.state[id] = 'part'; })
        .catch(() => {})
        .finally(() => { done++; A.emit('load', { id, done, total: files.length }); }));
    }
    const slow = setTimeout(() => { if (A.state[id] === 'loading') toast('Tuning up the ' + v.n.toLowerCase() + '…'); }, 900);
    const p = Promise.all(jobs).then(() => {
      clearTimeout(slow);
      const n = Object.keys(A.buf[id]).length;
      A.state[id] = n >= 4 ? 'ok' : 'fail';
      if (A.state[id] === 'fail') toast('Could not reach the sample library. Using the built-in voice.');
      A.emit('load', { id, done: files.length, total: files.length, state: A.state[id] });
      return A.state[id];
    });
    A.state[id + ':p'] = p;
    return p;
  },
  nearest(id, midi) {
    const set = A.buf[id]; if (!set) return null;
    let best = null, bd = 99;
    for (const k in set) { const d = Math.abs(+k - midi); if (d < bd || (d === bd && +k > midi)) { bd = d; best = +k; } }
    return best;
  },

  /* ---------- playing ---------- */
  vcurve(vel) { return .08 + .92 * Math.pow(clamp(vel, 0, 1), 1.55); },
  /* play one note. opts: dur (s, null = until released), vel 0–1, when (s from now) or at (ctx time), voice id */
  play(midi, o = {}) {
    A.init();
    const v = voiceById(o.voice || A.voiceId);
    let t = o.at != null ? o.at : A.ctx.currentTime + (o.when || 0) + .005;
    let vel = o.vel == null ? .75 : o.vel;
    /* a player never hits two notes identically: a few ms and a few percent either way */
    if (o.human) { t = Math.max(A.ctx.currentTime, t + (Math.random() - .5) * .014 * o.human); vel = clamp(vel * (1 + (Math.random() - .5) * .16 * o.human), .05, 1); }
    let h;
    const loaded = A.buf[v.id] && (A.state[v.id] === 'ok' || A.state[v.id] === 'part');
    if ((v.kind === 'salamander' || v.kind === 'sf') && loaded) h = A.sampleVoice(v, midi, t, vel, o);
    else if (v.kind === 'ks') h = A.ksVoice(v, midi, t, vel);
    else if (v.kind === 'osc') h = A.oscVoice(v, midi, t, vel);
    else if (v.kind === 'pad') h = A.padVoice(midi, t, vel);
    else if (v.kind === 'fm') h = A.fmVoice(midi, t, vel);
    else { if (!A.state[v.id]) A.load(v.id); h = A.warmVoice(midi, t, vel); }
    if (!h) return null;
    h.midi = midi; h.t = t;
    A.live.add(h);
    if (o.dur != null) {
      const hold = A.sustain && !o.ignorePedal ? Math.max(o.dur, 3.5) : o.dur;
      h.release(t + hold);
    }
    A.emit('note', { midi, vel, at: t, dur: o.dur || 1 });
    return h;
  },
  chord(midis, o = {}) {
    const spread = o.strum == null ? .014 : o.strum;
    if (o.human == null) o = { ...o, human: 1 };
    return midis.map((m, i) => A.play(m, { ...o, when: (o.when || 0) + i * spread, at: o.at != null ? o.at + i * spread : undefined, vel: (o.vel == null ? .65 : o.vel) * (i === 0 ? 1 : .86) }));
  },
  seq(midis, o = {}) {
    const gap = o.gap || .24;
    if (o.human == null) o = { ...o, human: 1 };
    return midis.map((m, i) => A.play(m, { ...o, when: (o.when || 0) + i * gap, at: o.at != null ? o.at + i * gap : undefined, dur: o.dur || gap * 1.8 }));
  },

  /* hands-on playing: key down / key up, with a damper pedal */
  noteOn(midi, vel = .75, voice) {
    A.resume();
    if (A.held.has(midi)) A.noteOff(midi, true);
    const h = A.play(midi, { vel, voice, dur: null });
    if (h) A.held.set(midi, h);
    return h;
  },
  noteOff(midi, force) {
    const h = A.held.get(midi); if (!h) return;
    A.held.delete(midi);
    if (A.sustain && !force) { A.pedalled.add(h); return; }
    h.release(A.ctx.currentTime);
  },
  setSustain(on) {
    A.sustain = !!on;
    if (!on && A.ctx) { const t = A.ctx.currentTime; A.pedalled.forEach(h => h.release(t)); A.pedalled.clear(); }
  },
  stopAll() {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    A.live.forEach(h => h.release(t, .04));
    A.live.clear(); A.held.clear(); A.pedalled.clear();
  },

  /* build a handle: gain node g, stop fn, release time constant */
  handle(g, stop, rel) {
    let ended = false;
    const h = {
      g, released: false,
      release(at, fast) {
        if (ended) return;
        const T = fast || rel;
        const when = Math.max(at, A.ctx.currentTime);
        h.released = true;
        try { g.gain.setTargetAtTime(0, when, T / 4); } catch (e) { /* already stopped */ }
        stop(when + T * 1.6 + .05);
      }
    };
    h.done = () => { ended = true; A.live.delete(h); };
    return h;
  },

  sampleVoice(v, midi, t, vel, o = {}) {
    const k = A.nearest(v.id, midi); if (k == null) return A.warmVoice(midi, t, vel);
    const c = A.ctx, src = c.createBufferSource();
    src.buffer = A.buf[v.id][k];
    src.playbackRate.value = Math.pow(2, (midi - k) / 12);
    /* players lean into notes and sing through long ones: a small scoop up to
       pitch at the start, then vibrato that fades in once the note settles */
    let lfo = null;
    const long = o.dur == null || o.dur > .32;
    if (o.expr !== false && src.detune) {
      if (v.scoop && long) { const sc = v.scoop * (.6 + Math.random() * .6) * (o.scoop == null ? 1 : o.scoop); src.detune.setValueAtTime(-sc, t); src.detune.linearRampToValueAtTime(0, t + .06 + Math.random() * .05); }
      if (v.vib && long) {
        lfo = c.createOscillator(); const lg = c.createGain();
        lfo.frequency.value = 4.8 + Math.random() * 1.2;
        lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + .22); lg.gain.linearRampToValueAtTime(v.vib, t + .6);
        lfo.connect(lg); lg.connect(src.detune); lfo.start(t);
      }
    }
    const g = c.createGain(), peak = A.vcurve(vel) * (v.gain || 1) * .9;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + .004);
    let node = src;
    if (v.kind === 'salamander') {   /* soft touch is darker on a real piano */
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = .5;
      f.frequency.value = 900 + Math.pow(vel, 1.4) * 11000;
      src.connect(f); node = f;
    }
    node.connect(g); g.connect(A.master);
    src.start(t);
    const h = A.handle(g, at => { try { src.stop(at); if (lfo) lfo.stop(at); } catch (e) { } }, v.rel || .3);
    src.onended = () => { h.done(); if (lfo) try { lfo.stop(); } catch (e) { } };
    return h;
  },

  /* Karplus–Strong: a burst of noise in a delay line that averages
     itself each pass, so upper harmonics fade first, like a real string */
  ksBuffer(midi, bright) {
    const key = midi + ':' + bright;
    if (A.ks.has(key)) { const b = A.ks.get(key); A.ks.delete(key); A.ks.set(key, b); return b; }
    const c = A.ctx, sr = c.sampleRate, f = freq(midi);
    const N = Math.max(2, Math.floor(sr / f - .5)), actual = sr / (N + .5);
    const t60 = clamp(7.5 - (midi - 40) * .085, 1.4, 7.5);
    const len = Math.floor(sr * Math.min(3.2, t60 * .55 + .35));
    const b = c.createBuffer(1, len, sr), out = b.getChannelData(0);
    const ring = new Float32Array(N);
    let lp = 0, mean = 0;
    for (let i = 0; i < N; i++) { lp += bright * ((Math.random() * 2 - 1) - lp); ring[i] = lp; mean += lp; }
    mean /= N;
    const pick = Math.max(1, Math.round(N * .14)), tmp = ring.slice();
    for (let i = 0; i < N; i++) ring[i] = (tmp[i] - mean) - .85 * (tmp[(i + pick) % N] - mean);   /* pluck position */
    const g = Math.pow(10, -3 / (t60 * actual)), damp = .5;
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const cur = ring[idx], nxt = (idx + 1) % N;
      out[i] = cur;
      ring[idx] = g * (cur * (1 - damp) + ring[nxt] * damp);
      idx = nxt;
    }
    const fade = Math.min(len, Math.floor(sr * .08));
    for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
    const rec = { b, rate: f / actual };
    A.ks.set(key, rec);
    if (A.ks.size > 30) A.ks.delete(A.ks.keys().next().value);
    return rec;
  },
  ksVoice(v, midi, t, vel) {
    const c = A.ctx, { b, rate } = A.ksBuffer(midi, v.bright);
    const src = c.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
    const g = c.createGain();
    g.gain.value = A.vcurve(vel) * .9 * (v.gain || 1);
    const tone = c.createBiquadFilter(); tone.type = 'lowpass';
    tone.frequency.value = 1400 + vel * vel * 9000;
    src.connect(tone); tone.connect(g); g.connect(A.body);
    src.start(t);
    const h = A.handle(g, at => { try { src.stop(at); } catch (e) { } }, .12);
    src.onended = h.done;
    return h;
  },

  pulseWave(duty) {
    if (A.waves[duty]) return A.waves[duty];
    const n = 64, real = new Float32Array(n), imag = new Float32Array(n);
    for (let i = 1; i < n; i++) imag[i] = (2 / (i * Math.PI)) * Math.sin(Math.PI * i * duty);
    return (A.waves[duty] = A.ctx.createPeriodicWave(real, imag));
  },
  oscVoice(v, midi, t, vel) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    if (typeof v.wave === 'number') o.setPeriodicWave(A.pulseWave(v.wave)); else o.type = v.wave;
    o.frequency.setValueAtTime(freq(midi), t);
    const peak = A.vcurve(vel) * .2;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + .004);
    g.gain.setTargetAtTime(peak * .7, t + .01, .08);
    let node = o;
    if (v.filter) {
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 6;
      f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(5200 * (.5 + vel), t + .03);
      f.frequency.setTargetAtTime(1300, t + .05, .25);
      o.connect(f); node = f;
    }
    node.connect(g); g.connect(A.master); o.start(t);
    const h = A.handle(g, at => { try { o.stop(at); } catch (e) { } }, .06);
    o.onended = h.done;
    return h;
  },
  padVoice(midi, t, vel) {
    const c = A.ctx, g = c.createGain(), f = c.createBiquadFilter(), oscs = [];
    f.type = 'lowpass'; f.frequency.value = 1500 + vel * 900; f.Q.value = .7;
    [-8, 0, 7].forEach(cents => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq(midi); o.detune.value = cents; o.connect(f); o.start(t); oscs.push(o); });
    const peak = A.vcurve(vel) * .09;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .4);
    f.connect(g); g.connect(A.master);
    const h = A.handle(g, at => oscs.forEach(o => { try { o.stop(at); } catch (e) { } }), 1.2);
    oscs[0].onended = h.done;
    return h;
  },
  fmVoice(midi, t, vel) {
    const c = A.ctx, car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    const f = freq(midi);
    car.frequency.value = f; mod.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * (2.5 + vel * 3), t); mg.gain.setTargetAtTime(f * .2, t, .35);
    mod.connect(mg); mg.connect(car.frequency);
    const peak = A.vcurve(vel) * .22;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .003); g.gain.setTargetAtTime(0, t + .01, 1.1);
    car.connect(g); g.connect(A.master); car.start(t); mod.start(t);
    const h = A.handle(g, at => { try { car.stop(at); mod.stop(at); } catch (e) { } }, .5);
    car.onended = h.done;
    return h;
  },
  /* the stand-in while samples load: a soft additive tone */
  warmVoice(midi, t, vel) {
    const c = A.ctx, g = c.createGain(), f = freq(midi), oscs = [];
    [[1, 1], [2, .36], [3, .14], [4.01, .06]].forEach(([mult, amp]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.value = f * mult; og.gain.value = amp; o.connect(og); og.connect(g); o.start(t); oscs.push(o);
    });
    const peak = A.vcurve(vel) * .2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .006);
    g.gain.setTargetAtTime(peak * .3, t + .01, .35);
    g.connect(A.master);
    const h = A.handle(g, at => oscs.forEach(o => { try { o.stop(at); } catch (e) { } }), .3);
    oscs[0].onended = h.done;
    return h;
  },

  /* ---------- drums ---------- */
  loadKit(id = A.kitId) {
    A.init();
    if (A.kits[id]) return A.kits[id].p;
    const kit = A.kits[id] = { buf: {}, ok: false };
    kit.p = Promise.all(Object.entries(KIT_FILES).map(([lane, f]) =>
      (() => { const once = () => fetch(KIT_BASE + id + '/' + f + '.mp3').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(b => A.ctx.decodeAudioData(b));
        return once().catch(() => new Promise(r => setTimeout(r, 700)).then(once)); })()
        .then(b => { kit.buf[lane] = b; }).catch(() => {})
    )).then(() => { kit.ok = Object.keys(kit.buf).length >= 3; return kit.ok; });
    return kit.p;
  },
  setKit(id) { A.kitId = id; store.set('kit', id); return A.loadKit(id); },
  /* lanes: k kick, s snare, h hat, t tom, c clave/rim, p clap */
  drum(lane, at, vel = 1, kitId = A.kitId) {
    A.init();
    const c = A.ctx, t = at == null ? c.currentTime + .005 : at;
    const kit = A.kits[kitId];
    if (!kit) A.loadKit(kitId);
    if (lane === 'c') return A.woodblock(t, vel, 1.35);
    if (lane === 'p') return A.clap(t, vel);
    if (kit && kit.buf[lane]) {
      const src = c.createBufferSource(), g = c.createGain();
      src.buffer = kit.buf[lane]; g.gain.value = vel * (lane === 'h' ? .55 : .95);
      src.connect(g); g.connect(A.drums); src.start(t);
      return;
    }
    A.synthDrum(lane, t, vel);
  },
  synthDrum(lane, t, vel) {
    const c = A.ctx;
    if (lane === 'k' || lane === 't') {
      const o = c.createOscillator(), g = c.createGain(), f0 = lane === 'k' ? 150 : 220;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .3, t + .12);
      g.gain.setValueAtTime(vel * .9, t); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
      o.connect(g); g.connect(A.drums); o.start(t); o.stop(t + .37);
      return;
    }
    const len = lane === 's' ? .2 : .05;
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(); src.buffer = b;
    const f = c.createBiquadFilter(), g = c.createGain();
    if (lane === 's') {
      f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = .8; g.gain.value = vel * .5;
      const o = c.createOscillator(), og = c.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(190, t);
      og.gain.setValueAtTime(vel * .34, t); og.gain.exponentialRampToValueAtTime(.0001, t + .13);
      o.connect(og); og.connect(A.drums); o.start(t); o.stop(t + .15);
    } else { f.type = 'highpass'; f.frequency.value = 7800; g.gain.value = vel * .3; }
    src.connect(f); f.connect(g); g.connect(A.drums); src.start(t);
  },
  clap(t, vel) {
    const c = A.ctx, len = .22;
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * len), c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const s = i / c.sampleRate, env = s < .03 ? Math.exp(-(s % .01) * 300) : Math.exp(-(s - .03) * 22);   /* three quick slaps, then the tail */
      d[i] = (Math.random() * 2 - 1) * env;
    }
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = b; f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.1; g.gain.value = vel * .8;
    src.connect(f); f.connect(g); g.connect(A.drums); src.start(t);
  },
  /* a wooden click: three inharmonic partials. level 2 bar, 1.5 accent, 1 beat, 0 subdivision */
  woodblock(t, vel = 1, pitch = 1) {
    const c = A.ctx, g = c.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * .55, t + .001); g.gain.exponentialRampToValueAtTime(.0001, t + .07);
    [[1, 1], [2.76, .45], [5.4, .12]].forEach(([m, a]) => {
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.value = 900 * pitch * m; og.gain.value = a;
      o.connect(og); og.connect(g); o.start(t); o.stop(t + .08);
    });
    g.connect(A.drums);
  },
  click(level, at) {
    A.init();
    const t = at == null ? A.ctx.currentTime + .005 : at;
    const L = { 2: [1, 1.6], 1.5: [.85, 1.38], 1: [.66, 1.2], 0: [.36, .95] }[level] || [.66, 1.2];
    A.woodblock(t, L[0], L[1]);
  },

  /* a stick on a practice pad: the kit's snare, right hand a shade higher than left */
  stick(hand, at, vel = .7) {
    A.init();
    const c = A.ctx, t = at == null ? c.currentTime + .005 : at, kit = A.kits[A.kitId];
    const right = hand === 'R' || hand === 'r';
    if (kit && kit.buf.s) {
      const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
      src.buffer = kit.buf.s; src.playbackRate.value = right ? 1.06 : .94;
      f.type = 'highpass'; f.frequency.value = 260; g.gain.value = vel * .8;
      src.connect(f); f.connect(g); g.connect(A.drums); src.start(t); src.stop(t + .35);
      return;
    }
    A.woodblock(t, vel * .8, right ? 1.1 : .85);
  },

  /* a sine tone that goes straight out, for pure intervals and the overtone series */
  sine(f, { at, when = 0, dur = 1.6, gain = .2, attack = .02 } = {}) {
    A.init();
    const c = A.ctx, t = at != null ? at : c.currentTime + when + .005;
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + .05);
    return { o, g };
  }
};
