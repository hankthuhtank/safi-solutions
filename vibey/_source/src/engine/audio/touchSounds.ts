// The small sounds the picture makes when it is touched. All synthesized, so they cost nothing to
// load, and all sent through the ambience bus so the room fader and mute apply to them too.

import { audio } from "./AudioEngine";
import type { TouchHit } from "../visual/touch";

let noise: AudioBuffer | null = null;
function noiseBuffer(ctx: AudioContext) {
  if (!noise || noise.sampleRate !== ctx.sampleRate) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noise;
}

interface Out {
  ctx: AudioContext;
  t: number;
  /** panned, distance-shaped input for this sound */
  in: AudioNode;
}

/** A panner and a gentle low-pass for distance: far things are quieter and duller. */
function place(hit: TouchHit, level: number): Out | null {
  const ctx = audio.ctx;
  if (!ctx || ctx.state !== "running") return null;
  const gain = ctx.createGain();
  gain.gain.value = level * (0.45 + 0.55 * hit.near);
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 2200 + 9000 * hit.near;
  const pan = ctx.createStereoPanner();
  pan.pan.value = Math.max(-1, Math.min(1, (hit.x - 0.5) * 1.5));
  gain.connect(tone).connect(pan).connect(audio.ambientBus);
  window.setTimeout(() => {
    gain.disconnect();
    tone.disconnect();
    pan.disconnect();
  }, 5000);
  return { ctx, t: ctx.currentTime + 0.005, in: gain };
}

function tone(o: Out, type: OscillatorType, f0: number, f1: number, at: number, dur: number, amp: number, attack = 0.004) {
  const osc = o.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, o.t + at);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, o.t + at + dur);
  const g = o.ctx.createGain();
  g.gain.setValueAtTime(0.0001, o.t + at);
  g.gain.exponentialRampToValueAtTime(amp, o.t + at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, o.t + at + dur);
  osc.connect(g).connect(o.in);
  osc.start(o.t + at);
  osc.stop(o.t + at + dur + 0.03);
}

function hiss(o: Out, type: BiquadFilterType, f0: number, f1: number, q: number, at: number, dur: number, amp: number, attack = 0.01) {
  const src = o.ctx.createBufferSource();
  src.buffer = noiseBuffer(o.ctx);
  src.loop = true;
  const f = o.ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, o.t + at);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, o.t + at + dur);
  const g = o.ctx.createGain();
  g.gain.setValueAtTime(0.0001, o.t + at);
  g.gain.exponentialRampToValueAtTime(amp, o.t + at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, o.t + at + dur);
  src.connect(f).connect(g).connect(o.in);
  src.start(o.t + at, Math.random() * 1.5);
  src.stop(o.t + at + dur + 0.05);
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Play the sound that goes with what the picture just did. */
export function touchSound(hit: TouchHit) {
  const soft = hit.drag ? 0.5 : 1;
  switch (hit.act) {
    case "ripple": {
      // a pebble: the hollow "plip" of the cavity closing, then a little spray
      const o = place(hit, 0.5 * soft);
      if (!o) return;
      const f = rnd(340, 520) * (1.25 - 0.5 * hit.near);
      tone(o, "sine", f, f * 2.3, 0, 0.09, 0.5, 0.002);
      tone(o, "sine", f * 1.5, f * 2.6, 0.07, 0.07, 0.22, 0.002);
      if (!hit.drag) hiss(o, "bandpass", 2400, 900, 1.2, 0.02, 0.28, 0.12);
      return;
    }
    case "bubbles": {
      const o = place(hit, 0.32 * soft);
      if (!o) return;
      for (let i = 0; i < (hit.drag ? 2 : 5); i++) {
        const f = rnd(380, 900);
        tone(o, "sine", f, f * rnd(1.5, 2.1), i * rnd(0.05, 0.11), 0.08, 0.4, 0.004);
      }
      return;
    }
    case "shake": {
      // leaves against leaves: two short breaths of bright noise
      const o = place(hit, 0.36 * soft);
      if (!o) return;
      hiss(o, "bandpass", rnd(3200, 4400), 2400, 0.7, 0, 0.32, 0.5, 0.03);
      hiss(o, "highpass", 5200, 3800, 0.5, 0.11, 0.42, 0.26, 0.05);
      return;
    }
    case "snowfall": {
      // snow sliding off a branch: soft, low, and gone
      const o = place(hit, 0.4 * soft);
      if (!o) return;
      hiss(o, "lowpass", 1500, 420, 0.4, 0, 0.55, 0.5, 0.08);
      hiss(o, "lowpass", 600, 220, 0.4, 0.3, 0.5, 0.3, 0.1);
      return;
    }
    case "wipe": {
      // a fingertip on wet glass
      const o = place(hit, 0.16 * soft);
      if (!o) return;
      const f = rnd(1300, 1900);
      hiss(o, "bandpass", f, f * rnd(1.25, 1.6), 7, 0, 0.22, 0.7, 0.04);
      hiss(o, "bandpass", 420, 300, 1, 0, 0.2, 0.25, 0.03);
      return;
    }
    case "blink": {
      // a filament ticking as it cools and catches again
      const o = place(hit, 0.3);
      if (!o) return;
      for (const at of [0, 0.15, 0.31, 0.46]) hiss(o, "highpass", 3500, 3500, 0.5, at, 0.018, rnd(0.4, 0.8), 0.001);
      tone(o, "sawtooth", 118, 120, 0.02, 0.5, 0.05, 0.05);
      return;
    }
    case "stoke": {
      // a log shifting: a low thud of air, then the sap spitting
      const o = place(hit, 0.5);
      if (!o) return;
      hiss(o, "lowpass", 380, 150, 0.6, 0, 0.6, 0.7, 0.05);
      for (let i = 0; i < 9; i++) hiss(o, "bandpass", rnd(1800, 5200), 1500, 2.5, rnd(0.03, 1.1), 0.02, rnd(0.25, 0.8), 0.001);
      return;
    }
    case "star":
    case "nova": {
      // glass chimes, high and far away
      const o = place({ ...hit, near: 0.9 }, hit.act === "nova" ? 0.2 : 0.16);
      if (!o) return;
      const base = [1318.5, 1568, 1760, 2093][Math.floor(Math.random() * 4)];
      tone(o, "sine", base, base, 0, 1.6, 0.4, 0.004);
      tone(o, "sine", base * 1.498, base * 1.498, 0.09, 1.3, 0.22, 0.004);
      tone(o, "sine", base * 2.0, base * 2.0, 0.19, 1.1, 0.14, 0.004);
      if (hit.act === "nova") tone(o, "sine", base / 4, base / 4, 0, 1.8, 0.35, 0.3);
      return;
    }
    case "gust": {
      // the wind arriving through everything at once
      const o = place({ ...hit, near: 0.8 }, 0.5);
      if (!o) return;
      const src = o.ctx.createBufferSource();
      src.buffer = noiseBuffer(o.ctx);
      src.loop = true;
      const f = o.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 0.9;
      f.frequency.setValueAtTime(260, o.t);
      f.frequency.exponentialRampToValueAtTime(900, o.t + 1.1);
      f.frequency.exponentialRampToValueAtTime(320, o.t + 4.2);
      const g = o.ctx.createGain();
      g.gain.setValueAtTime(0.0001, o.t);
      g.gain.exponentialRampToValueAtTime(0.5, o.t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, o.t + 4.4);
      src.connect(f).connect(g).connect(o.in);
      src.start(o.t, Math.random());
      src.stop(o.t + 4.5);
      return;
    }
    case "pulse": {
      // barely a sound: a soft knock, as on wood
      const o = place(hit, 0.3);
      if (!o) return;
      const f = rnd(150, 190);
      tone(o, "sine", f, f * 0.62, 0, 0.16, 0.6, 0.003);
      return;
    }
    // "strike": the thunder itself comes from the ambience, timed to the flash
    default:
      return;
  }
}
