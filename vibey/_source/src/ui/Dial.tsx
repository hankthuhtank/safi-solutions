// The tuning dial: drag the needle along the band, hear the hiss between stations, feel the detent
// when it locks on a place. Arrow keys, the wheel and a click on any station work too.

import { useEffect, useRef, useState } from "react";
import { audio } from "../engine/audio/AudioEngine";
import { SCENES, SCENE_BY_ID } from "../data/scenes";
import { tune, useStore } from "../state/store";
import type { SceneDef } from "../types";
import { Meter, meterSignal } from "./Meter";
import { thumbOf } from "./Stage";

const MIN = 87.5;
const MAX = 108.5;
const LOCK = 0.12; // MHz either side of a station that counts as tuned
const pct = (f: number) => ((f - MIN) / (MAX - MIN)) * 100;

function nearest(f: number): SceneDef {
  let best = SCENES[0];
  for (const s of SCENES) if (Math.abs(s.freq - f) < Math.abs(best.freq - f)) best = s;
  return best;
}

/** 1 = tuned, 0 = nothing but hiss. */
const signal = (f: number) => Math.max(0, 1 - Math.max(0, Math.abs(nearest(f).freq - f) - LOCK * 0.5) / 0.42);

/** The band is laid out like a real dial: indoor rooms at the bottom, open sky at the top. */
function regionOf(s: SceneDef) {
  if (s.categories.includes("cozy")) return "Indoors";
  if (s.categories.includes("cosmic")) return "Night sky";
  if (s.categories.includes("urban")) return "City";
  const c = s.categories[0] === "weather" ? s.categories[1] : s.categories[0];
  return c === "water" ? "Water" : "Outdoors";
}

const REGIONS: { label: string; from: number; to: number }[] = [];
for (const s of SCENES) {
  const r = regionOf(s);
  const last = REGIONS[REGIONS.length - 1];
  if (last && last.label === r) last.to = s.freq;
  else REGIONS.push({ label: r, from: s.freq, to: s.freq });
}

const TICKS: { f: number; major: boolean; label?: string }[] = [];
for (let f = 88; f <= 108.001; f += 0.5) {
  const whole = Math.abs(f - Math.round(f)) < 0.01;
  TICKS.push({ f, major: whole, label: whole && Math.round(f) % 2 === 0 ? String(Math.round(f)) : undefined });
}

export function Dial() {
  const sceneId = useStore((s) => s.scene);
  const started = useStore((s) => s.started);
  const scene = SCENE_BY_ID.get(sceneId) ?? SCENES[0];
  const [freq, setFreq] = useState(scene.freq);
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState<SceneDef | null>(null);
  const track = useRef<HTMLDivElement>(null); // the scale itself, inset inside the glass
  const freqRef = useRef(freq);
  const anim = useRef(0);
  const lockTimer = useRef(0);
  const wheelAt = useRef(0);
  const dragRef = useRef(false);

  const apply = (f: number) => {
    f = Math.max(MIN, Math.min(MAX, f));
    freqRef.current = f;
    setFreq(f);
    const hiss = 1 - signal(f);
    meterSignal.value = dragRef.current || anim.current ? 1 - hiss : -1;
    const root = document.documentElement;
    root.style.setProperty("--static", (hiss * 0.5).toFixed(3));
    // the grain layer only exists while there is hiss to show
    if (hiss > 0.02) root.dataset.tuning = "1";
    else delete root.dataset.tuning;
    if (started) audio.setStatic(hiss);
  };

  const sweepTo = (target: number, ms = 420, detent = false) => {
    cancelAnimationFrame(anim.current);
    const from = freqRef.current;
    if (Math.abs(from - target) < 0.001) return apply(target);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      // passing other stations on the way gives a flicker of hiss, like a real sweep
      apply(from + (target - from) * e);
      if (k < 1) anim.current = requestAnimationFrame(step);
      else {
        anim.current = 0;
        apply(target);
        audio.setStatic(0);
        if (detent) audio.click();
      }
    };
    anim.current = requestAnimationFrame(step);
  };

  // follow tuning from elsewhere (keys, memory, cycles)
  useEffect(() => {
    if (!dragRef.current) sweepTo(scene.freq, Math.min(900, 180 + Math.abs(scene.freq - freqRef.current) * 40));
  }, [scene.freq]);

  // switching on: the needle sweeps in from the bottom of the band, hissing, and locks
  useEffect(() => {
    if (!started) return;
    freqRef.current = MIN;
    sweepTo(scene.freq, 1700, true);
  }, [started]);

  useEffect(
    () => () => {
      cancelAnimationFrame(anim.current);
      clearTimeout(lockTimer.current);
    },
    [],
  );

  const fromX = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    return MIN + ((x - r.left) / r.width) * (MAX - MIN);
  };

  const lockOn = (s: SceneDef) => {
    if (s.id !== sceneId) {
      tune(s.id);
      audio.click();
    }
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    cancelAnimationFrame(anim.current);
    dragRef.current = true;
    setDrag(true);
    apply(fromX(e.clientX));
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) {
      if (e.pointerType === "mouse") {
        const n = nearest(fromX(e.clientX));
        setHover(Math.abs(n.freq - fromX(e.clientX)) < 0.35 ? n : null);
      }
      return;
    }
    const f = fromX(e.clientX);
    apply(f);
    // resting on a station while dragging tunes in, as on a real set
    clearTimeout(lockTimer.current);
    const n = nearest(f);
    if (Math.abs(n.freq - f) < LOCK) lockTimer.current = window.setTimeout(() => lockOn(n), 420);
  };

  const onUp = () => {
    if (!dragRef.current) return;
    dragRef.current = false;
    setDrag(false);
    meterSignal.value = -1;
    clearTimeout(lockTimer.current);
    const n = nearest(freqRef.current);
    sweepTo(n.freq, 260);
    lockOn(n);
    if (n.id === sceneId) audio.click();
  };

  const step = (dir: number) => {
    const i = SCENES.findIndex((s) => s.id === sceneId);
    const n = SCENES[(i + dir + SCENES.length) % SCENES.length];
    lockOn(n);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowUp") step(1);
    else if (k === "ArrowLeft" || k === "ArrowDown") step(-1);
    else if (k === "PageUp") step(5);
    else if (k === "PageDown") step(-5);
    else if (k === "Home") lockOn(SCENES[0]);
    else if (k === "End") lockOn(SCENES[SCENES.length - 1]);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  const onWheel = (e: React.WheelEvent) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 4) return;
    const now = performance.now();
    if (now - wheelAt.current < 260) return;
    wheelAt.current = now;
    step(d > 0 ? 1 : -1);
  };

  const sig = signal(freq);
  const tuned = sig > 0.97 && !drag;
  const near = drag ? nearest(freq) : hover;

  return (
    <div className="dial">
      <div className="dial-readout" aria-hidden="true">
        <span className={`dial-lamp${tuned ? " on" : ""}`} />
        <span className="dial-freq tnum">{freq.toFixed(1)}</span>
        <span className="dial-unit caps">MHz</span>
        <Meter />
      </div>
      <div
        className={`dial-glass${drag ? " dragging" : ""}`}
        role="slider"
        tabIndex={0}
        aria-label="Tuning dial: choose a place"
        aria-valuemin={SCENES[0].freq}
        aria-valuemax={SCENES[SCENES.length - 1].freq}
        aria-valuenow={scene.freq}
        aria-valuetext={`${scene.freq.toFixed(1)} megahertz, ${scene.name}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onWheel={onWheel}
      >
        <div className="dial-inner" ref={track}>
        <svg className="dial-scale" viewBox="0 0 1000 56" preserveAspectRatio="none" aria-hidden="true">
          {TICKS.map((t) => (
            <line key={t.f} x1={pct(t.f) * 10} x2={pct(t.f) * 10} y1={t.major ? 15 : 19} y2={26} className={t.major ? "major" : "minor"} />
          ))}
          {SCENES.map((s) => (
            <rect key={s.id} x={pct(s.freq) * 10 - 2} y={29} width={4} height={4} rx={1} className={s.id === sceneId ? "station on" : "station"} />
          ))}
          {REGIONS.map((r) => (
            <line key={r.label + r.from} x1={pct(r.from) * 10 - 9} x2={pct(r.to) * 10 + 9} y1={39} y2={39} className="region" />
          ))}
        </svg>
        <div className="dial-labels" aria-hidden="true">
          {TICKS.filter((t) => t.label).map((t) => (
            <span key={t.f} style={{ left: `${pct(t.f)}%` }}>
              {t.label}
            </span>
          ))}
        </div>
        <div className="dial-regions caps" aria-hidden="true">
          {REGIONS.map((r) => (
            <span key={r.label + r.from} style={{ left: `${pct((r.from + r.to) / 2)}%` }}>
              {r.label}
            </span>
          ))}
        </div>
        <div className="dial-needle" style={{ left: `${pct(freq)}%` }} aria-hidden="true" />
        {near ? (
          <div className="dial-tip" style={{ left: `${pct(near.freq)}%` }} aria-hidden="true">
            <img src={thumbOf(near.variations[0])} alt="" width={128} height={72} />
            <span className="dial-tip-text">
              <span className="dial-tip-freq tnum">{near.freq.toFixed(1)}</span>
              <span className="dial-tip-name">{near.name}</span>
            </span>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
