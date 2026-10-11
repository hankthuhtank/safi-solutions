/* Moneywise home: the guilloché rosette (the engraved security pattern on banknotes) around the coin. */
import { boot } from '../ui.js';

boot();

const svg = document.getElementById('guilloche');
if (svg) {
  const C = 250, TAU = Math.PI * 2;
  // polar rosette: r(θ) = base + amp · sin(lobes · θ + phase), drawn as many phase-shifted copies to weave the net
  const curve = (base, amp, lobes, phase, steps = 540) => {
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const th = i / steps * TAU, r = base + amp * Math.sin(lobes * th + phase) + amp * 0.35 * Math.sin((lobes * 3) * th - phase * 2);
      d += `${i ? 'L' : 'M'}${(C + r * Math.cos(th)).toFixed(1)} ${(C + r * Math.sin(th)).toFixed(1)}`;
    }
    return d + 'Z';
  };
  const band = (cls, spin, base, amp, lobes, copies) => {
    let paths = '';
    for (let i = 0; i < copies; i++) paths += `<path class="${cls}" d="${curve(base, amp, lobes, i / copies * TAU)}"/>`;
    return `<g class="${spin}">${paths}</g>`;
  };
  const ringText = 'MONEYWISE · THE MATH, SHOWN · MORTGAGE · CAR · RATES · CREDIT · INSURANCE · TAXES · RETIREMENT · ';
  svg.innerHTML = `
    <defs><path id="ring-path" d="M ${C} ${C} m -226 0 a 226 226 0 1 1 452 0 a 226 226 0 1 1 -452 0"/></defs>
    <circle class="ring" cx="${C}" cy="${C}" r="238"/><circle class="ring" cx="${C}" cy="${C}" r="214"/>
    <text class="ring-text"><textPath href="#ring-path" textLength="1400" lengthAdjust="spacing">${ringText}</textPath></text>
    ${band('g1', 'spin', 176, 26, 14, 18)}
    ${band('g2', 'spin-r', 128, 18, 10, 14)}
    ${band('g3', 'spin', 92, 9, 22, 10)}
    <circle class="ring" cx="${C}" cy="${C}" r="74"/>`;
}
