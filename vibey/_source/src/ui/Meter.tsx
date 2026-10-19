// A small moving-coil meter, lit from behind. While the dial is being turned it reads signal
// strength; the rest of the time it is a VU meter on the receiver's output.

import { useEffect, useRef } from "react";
import { audio } from "../engine/audio/AudioEngine";

export const meterSignal = { value: -1 }; // 0..1 while tuning, -1 otherwise

const ARC = 50; // degrees either side of centre

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

const TICKS = [-20, -10, -7, -5, -3, -1, 0, 1, 2, 3].map((db) => ({ db, deg: dbToDeg(db) }));

function dbToDeg(db: number) {
  // VU-style law: most of the swing lives between -10 and +3
  const x = Math.max(0, Math.min(1, (Math.pow(10, db / 20) - 0.1) / (1.41 - 0.1)));
  return -ARC + Math.pow(x, 0.62) * ARC * 2;
}

export function Meter() {
  const needle = useRef<SVGLineElement>(null);
  useEffect(() => {
    let raf = 0;
    let pos = -ARC;
    let vel = 0;
    let last = performance.now();
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (document.hidden || document.querySelector(".app.idle")) return;
      let target: number;
      if (meterSignal.value >= 0) target = -ARC + meterSignal.value * ARC * 2;
      else {
        const rms = audio.meter();
        // reference level: -18 dBFS RMS reads 0 VU
        const db = rms > 0 ? 20 * Math.log10(rms) + 18 : -60;
        target = dbToDeg(db);
      }
      // a damped spring: the needle has mass, overshoots a touch and settles
      const k = 160;
      const c = 2 * Math.sqrt(k) * 0.72;
      vel += (k * (target - pos) - c * vel) * dt;
      pos += vel * dt;
      pos = Math.max(-ARC - 3, Math.min(ARC + 3, pos));
      needle.current?.setAttribute("transform", `rotate(${pos.toFixed(2)} 32 40)`);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const [x0, y0] = polar(32, 40, 30, -ARC);
  const [x1, y1] = polar(32, 40, 30, ARC);
  const [r0x, r0y] = polar(32, 40, 30, dbToDeg(0));
  return (
    <svg className="meter" viewBox="0 0 64 44" width="64" height="44" aria-hidden="true">
      <defs>
        <radialGradient id="meterLamp" cx="50%" cy="100%" r="90%">
          <stop offset="0%" stopColor="rgba(243,181,98,0.42)" />
          <stop offset="70%" stopColor="rgba(243,181,98,0.08)" />
          <stop offset="100%" stopColor="rgba(243,181,98,0)" />
        </radialGradient>
      </defs>
      <rect x="0.5" y="0.5" width="63" height="43" rx="5" className="meter-face" />
      <rect x="0.5" y="0.5" width="63" height="43" rx="5" fill="url(#meterLamp)" />
      <path d={`M ${x0} ${y0} A 30 30 0 0 1 ${x1} ${y1}`} className="meter-arc" />
      <path d={`M ${r0x} ${r0y} A 30 30 0 0 1 ${x1} ${y1}`} className="meter-red" />
      {TICKS.map((t) => {
        const [ax, ay] = polar(32, 40, 30, t.deg);
        const [bx, by] = polar(32, 40, t.db === 0 || t.db === -20 ? 25 : 27, t.deg);
        return <line key={t.db} x1={ax} y1={ay} x2={bx} y2={by} className={t.db > 0 ? "meter-tick red" : "meter-tick"} />;
      })}
      <text x="32" y="30" className="meter-label">
        VU
      </text>
      <line ref={needle} x1="32" y1="40" x2="32" y2="9" className="meter-needle" transform={`rotate(${-ARC} 32 40)`} />
      <circle cx="32" cy="40" r="3" className="meter-pivot" />
    </svg>
  );
}
