/* Moneywise: the calculator tape. Every Try-it tool prints its arithmetic here, one line per step, the way a
   two-colour printing calculator does: amounts right-aligned, the operation in the margin, money going out in red,
   subtotals marked with a diamond and totals with an asterisk under a rule. Changed lines re-ink as you type. */
import { num } from './format.js';

const OPS = { add: '+', sub: '−', mul: '×', div: '÷', pct: '%', eq: '=', subtotal: '◇', total: '*', none: '' };
const today = () => { const d = new Date(); return `${String(d.getMonth() + 1).padStart(2, '0')}·${String(d.getDate()).padStart(2, '0')}·${String(d.getFullYear()).slice(2)}`; };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createTape(wrap, { title = 'MONEYWISE' } = {}) {
  wrap.classList.add('tape-wrap');
  wrap.innerHTML = `<p class="micro"><span>The tape</span><span class="tape-actions"><button type="button" data-copy>Copy tape</button></span></p>
<div class="tape" role="region" aria-label="Calculator tape, every step of the math"><div class="tape-head"><span>${title}</span><span>${today()}</span></div><ol></ol></div>`;
  const ol = wrap.querySelector('ol');
  let prev = new Map(), lastText = '';

  const text = line => (line.text != null ? line.text : num(Math.abs(line.v), line.d ?? 2));
  wrap.querySelector('[data-copy]').addEventListener('click', async e => {
    try { await navigator.clipboard.writeText(lastText); e.target.textContent = 'Copied'; }
    catch { e.target.textContent = 'Select & copy'; }
    setTimeout(() => (e.target.textContent = 'Copy tape'), 1600);
  });

  return {
    /* lines: [{label, v, op, kind, d, text}]  kind: 'note' | 'gap' | 'subtotal' | 'total' | undefined
       op: one of OPS keys; a 'sub' op or a negative v prints in red. */
    print(lines) {
      const frag = document.createDocumentFragment(), next = new Map();
      const plain = [];
      let i = 0;
      for (const line of lines) {
        const li = document.createElement('li');
        li.className = 't-line';
        if (line.kind === 'gap') { li.classList.add('gap'); frag.appendChild(li); plain.push(''); continue; }
        if (line.kind === 'note') { li.classList.add('t-note'); li.textContent = line.label; frag.appendChild(li); plain.push('  ' + line.label); continue; }
        const op = line.kind === 'total' ? 'total' : line.kind === 'subtotal' ? 'subtotal' : line.op || 'none';
        if (line.kind) li.classList.add(line.kind === 'subtotal' ? 'sub' : line.kind);
        if (op === 'sub' || (typeof line.v === 'number' && line.v < 0)) li.classList.add('neg');
        const t = text(line), key = `${i++}|${line.label}`;
        next.set(key, t);
        if (prev.size && prev.get(key) !== t && !reduced()) li.classList.add('fresh');
        const lab = document.createElement('span'); lab.className = 't-label'; lab.textContent = line.label || '';
        const n = document.createElement('span'); n.className = 't-num'; n.textContent = t;
        const o = document.createElement('span'); o.className = 't-op'; o.textContent = OPS[op] ?? ''; o.setAttribute('aria-hidden', 'true');
        li.append(lab, n, o);
        frag.appendChild(li);
        plain.push(`${(line.label || '').padEnd(28).slice(0, 28)} ${t.padStart(16)} ${OPS[op] || ''}`);
      }
      // first print feeds line by line, like paper coming out of the machine
      if (!prev.size && !reduced()) [...frag.children].forEach((li, k) => { li.style.animation = `print .3s ${k * 28}ms ease-out both`; });
      ol.replaceChildren(frag);
      prev = next;
      lastText = plain.join('\n');
    },
  };
}
