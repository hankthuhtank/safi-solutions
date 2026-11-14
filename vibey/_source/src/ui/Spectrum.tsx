// The receiver's spectrum display: a row of segmented columns, low notes on the left, with a
// peak segment that hangs for a moment before it falls, the way the fluorescent displays on
// late-70s hi-fi did. Drawn on a canvas straight from the analyser, outside React.

import { useEffect, useRef } from "react";
import { audio } from "../engine/audio/AudioEngine";

const COLS = 30;
const ROWS = 12;

export function Spectrum() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    let last = 0;
    const bins = new Uint8Array(1024);
    const level = new Float32Array(COLS);
    const peak = new Float32Array(COLS);
    const hold = new Float32Array(COLS);
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(2, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(2, Math.round(canvas.clientHeight * dpr));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 33 || document.hidden) return;
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      const n = audio.spectrum(bins);
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const gap = Math.max(1, Math.round(W / 320));
      const cw = (W - gap * (COLS - 1)) / COLS;
      const rh = (H - gap * (ROWS - 1)) / ROWS;
      for (let c = 0; c < COLS; c++) {
        // columns are spaced by pitch, not by frequency: 45 Hz to 15 kHz
        let v = 0;
        if (n) {
          const f0 = 45 * Math.pow(15000 / 45, c / COLS);
          const f1 = 45 * Math.pow(15000 / 45, (c + 1) / COLS);
          const i0 = Math.max(1, Math.floor((f0 / n.nyquist) * n.bins));
          const i1 = Math.max(i0 + 1, Math.ceil((f1 / n.nyquist) * n.bins));
          let m = 0;
          for (let i = i0; i < i1 && i < n.bins; i++) m = Math.max(m, bins[i]);
          // tilt: music has less energy at the top, so lift it to keep the display even
          v = Math.min(1, Math.max(0, (m / 255 - 0.28) * 1.45) * (0.85 + 0.5 * (c / COLS)));
        }
        level[c] = v > level[c] ? v : Math.max(v, level[c] - dt * 1.9);
        if (level[c] >= peak[c]) {
          peak[c] = level[c];
          hold[c] = 0.55;
        } else if ((hold[c] -= dt) <= 0) peak[c] = Math.max(0, peak[c] - dt * 0.7);
        const lit = Math.round(level[c] * ROWS);
        const pk = Math.min(ROWS - 1, Math.round(peak[c] * ROWS) - 1);
        const x = c * (cw + gap);
        for (let r = 0; r < ROWS; r++) {
          const y = H - (r + 1) * rh - r * gap;
          const on = r < lit;
          const top = r >= ROWS - 2;
          if (on) ctx.fillStyle = top ? "rgba(228, 87, 46, 0.95)" : `rgba(243, 181, 98, ${0.55 + 0.4 * (r / ROWS)})`;
          else if (r === pk && peak[c] > 0.04) ctx.fillStyle = top ? "rgba(228, 87, 46, 0.9)" : "rgba(255, 222, 170, 0.85)";
          else ctx.fillStyle = "rgba(243, 181, 98, 0.055)";
          ctx.fillRect(x, y, cw, rh);
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return (
    <div className="spectrum" aria-hidden="true">
      <canvas ref={ref} />
      <div className="spectrum-scale caps">
        <span>60</span>
        <span>250</span>
        <span>1k</span>
        <span>4k</span>
        <span>12k</span>
      </div>
    </div>
  );
}
