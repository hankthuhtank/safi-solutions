// The menu: one cup that turns into every espresso drink, a café board, and a caffeine ladder.
import { $, $$, esc, sound, initChrome, reduced } from './core.js';
import { cupSVG, swatch } from './cups.js';
import { byId } from './data/recipes.js';

initChrome();

const LINES = {
  milk: [
    { at: 0, id: 'espresso', n: 'Espresso', v: 'demitasse', esp: 36, milk: 0, foam: 0, layers: [['espresso', 30], ['crema', 8]], line: 'Just the shot. 18 g in, 36 g out.' },
    { at: 14, id: 'macchiato', n: 'Macchiato', v: 'demitasse', esp: 36, milk: 0, foam: 10, layers: [['espresso', 30], ['microfoam', 12, 'f']], line: 'A spot of foam "stains" the shot.' },
    { at: 30, id: 'cortado', n: 'Cortado', v: 'gibraltar', esp: 36, milk: 45, foam: 5, layers: [['espresso', 36], ['steamed', 44, 'b'], ['microfoam', 10, 'f']], line: 'Cut with an equal splash of warm milk.' },
    { at: 47, id: 'flat-white', n: 'Flat white', v: 'fw', esp: 36, milk: 110, foam: 10, layers: [['espresso', 36], ['steamed', 100, 'b'], ['microfoam', 14, 'f']], line: 'Silky milk folded through. Still tastes of coffee.' },
    { at: 64, id: 'cappuccino', n: 'Cappuccino', v: 'cap', esp: 36, milk: 80, foam: 60, layers: [['espresso', 36], ['steamed', 70, 'b'], ['foam', 60, 'f']], line: 'Same milk, much more air: a deep, light foam.' },
    { at: 81, id: 'latte', n: 'Latte', v: 'latte', esp: 36, milk: 220, foam: 20, layers: [['espresso', 36], ['steamed', 220, 'b'], ['microfoam', 20, 'f']], line: 'Mostly milk. A thin cap of foam for art.' },
    { at: 97, id: 'latte-macchiato', n: 'Latte macchiato', v: 'latte', esp: 18, milk: 170, foam: 46, layers: [['steamed', 170], ['lightcoffee', 26, 'b'], ['espresso', 18, 'b'], ['foam', 46, 'f']], line: 'Milk first, shot last: it marks the milk in layers.' },
  ],
  water: [
    { at: 0, id: 'ristretto', n: 'Ristretto', v: 'demitasse', esp: 24, water: 0, layers: [['espresso', 20], ['crema', 7]], line: 'The shot, cut short at about 1:1.3. Syrupy.' },
    { at: 22, id: 'espresso', n: 'Espresso', v: 'demitasse', esp: 36, water: 0, layers: [['espresso', 30], ['crema', 8]], line: 'The standard: 1:2 in 25–30 seconds.' },
    { at: 44, id: 'lungo', n: 'Lungo', v: 'demitasse', esp: 54, water: 0, layers: [['espresso', 52], ['crema', 5]], line: 'Run long through the puck, about 1:3. More bitter.' },
    { at: 70, id: 'long-black', n: 'Long black', v: 'glassmug', esp: 36, water: 110, layers: [['americano', 140], ['crema', 10]], line: 'Hot water first, shot on top. The crema survives.' },
    { at: 96, id: 'americano', n: 'Americano', v: 'glassmug', esp: 36, water: 150, layers: [['americano', 180], ['crema', 6]], line: 'Shot first, water after. Drip strength, espresso taste.' },
  ],
};
let line = 'milk', cur = null;
const range = $('#mlRange'), stage = $('#mlStage');
const nearest = v => LINES[line].reduce((a, b) => (Math.abs(b.at - v) < Math.abs(a.at - v) ? b : a));

function stops() {
  $('#mlStops').innerHTML = LINES[line].map(s => `<button type="button" data-at="${s.at}" style="left:${s.at}%" aria-pressed="false">${s.n}</button>`).join('');
}
function show(s, force) {
  if (s === cur && !force) return; cur = s;
  stage.innerHTML = cupSVG({ id: 'ml-' + s.id, n: s.n, v: s.v, layers: s.layers }, { steam: true });
  if (!reduced()) stage.firstElementChild.animate([{ transform: 'translateY(10px) scale(.94)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.34,1.4,.64,1)' });
  $('#ml-name').textContent = s.n; $('#mlLine').textContent = s.line;
  const parts = line === 'milk' ? [['Espresso', s.esp, 'g', 'espresso'], ['Milk', s.milk, 'ml', 'steamed'], ['Foam', s.foam, 'ml', 'foam']] : [['Espresso', s.esp, 'g', 'espresso'], ['Water', s.water, 'ml', 'water']];
  $('#mlRatio').innerHTML = parts.map(([l, v, u]) => `<span>${l} <b>${v}${v ? ' ' + u : ''}</b></span>`).join('') + (line === 'milk' && s.milk ? `<span>Ratio <b>1 : ${((s.milk + s.foam) / s.esp).toFixed(1)}</b></span>` : '');
  $('#mlBar').innerHTML = parts.filter(p => p[1]).map(([l, v, , k]) => `<i title="${l}" style="flex-grow:${v};background:${swatch(k)};${k === 'water' ? 'background:#cfe1e6' : ''}"></i>`).join('');
  $$('#mlStops button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.at === s.at)));
  $('#mlLink').href = '/groundwork/recipes/#' + s.id; $('#mlLink').textContent = `${s.n} recipe →`;
  range.setAttribute('aria-valuetext', s.n);
  sound.tick();
}
const fill = () => range.style.setProperty('--fill', range.value + '%');
range.addEventListener('input', () => { fill(); show(nearest(+range.value)); });
range.addEventListener('change', () => { range.value = nearest(+range.value).at; fill(); });
$('#mlStops').addEventListener('click', e => { const b = e.target.closest('[data-at]'); if (!b) return; range.value = b.dataset.at; fill(); show(nearest(+range.value)); });
$$('[data-line]').forEach(b => b.addEventListener('click', () => {
  line = b.dataset.line; $$('[data-line]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  range.setAttribute('aria-label', line === 'milk' ? 'Amount of milk' : 'Amount of water');
  stops(); range.value = 0; fill(); cur = null; show(LINES[line][0]); sound.click();
}));
stops(); fill(); show(LINES.milk[0], true);

/* ------------------------------------------------------------------ board */
const BOARD = [
  [['Espresso', [['ristretto', 'Ristretto', '1 : 1.3', 'Short, syrupy'], ['espresso', 'Espresso', '1 : 2', '18 g in, 36 g out'], ['lungo', 'Lungo', '1 : 3', 'Long, thinner']]],
   ['With water', [['americano', 'Americano', '+ 4× water', 'Shot, then water'], ['long-black', 'Long black', 'water first', 'Keeps the crema'], ['red-eye', 'Red eye', 'drip + shot', 'For long nights']]]],
  [['With milk', [['macchiato', 'Macchiato', 'a spot', 'Foam on a shot'], ['cortado', 'Cortado', '1 : 1', 'Equal warm milk'], ['flat-white', 'Flat white', '1 : 3', 'Thin, silky foam'], ['cappuccino', 'Cappuccino', '⅓ foam', 'Deep, airy foam'], ['latte', 'Latte', '1 : 6', 'Mostly milk'], ['mocha', 'Mocha', '+ chocolate', 'A chocolate latte']]]],
  [['Cold', [['cold-brew', 'Cold brew', '1 : 10 · 14 h', 'Steeped cold'], ['iced-latte', 'Iced latte', 'shot over milk', 'Cascades in clouds'], ['espresso-tonic', 'Espresso tonic', 'shot over tonic', 'Bitter and fizzy'], ['freddo-espresso', 'Freddo', 'shaken', 'Greek café staple']]],
   ['Slow bar', [['pour-over', 'Pour-over', '1 : 16', 'Clean and bright'], ['french-press', 'French press', '1 : 16', 'Full and oily'], ['moka', 'Moka pot', '≈ 1 : 10', 'Stovetop strong'], ['turkish', 'Turkish', '1 : 10', 'Unfiltered']]]],
];
$('#boardCols').innerHTML = BOARD.map(col => `<div class="board-col">${col.map(([h, items]) => `<h3>${h}</h3><ul>${items.map(([id, n, rt, ds]) => `<li><a href="/groundwork/recipes/#${id}"><span class="nm">${n}</span><span class="dots" aria-hidden="true"></span><span class="rt">${rt}</span><span class="ds">${ds}</span></a></li>`).join('')}</ul>`).join('')}</div>`).join('');

/* ------------------------------------------------------------------ caffeine ladder */
const CAF = [['Decaf espresso', 8, 'decaf'], ['Turkish coffee', 60, 'turkish'], ['Instant, 8 oz', 62, 'greek-frappe'], ['Single espresso', 63, 'espresso'], ['Drip coffee, 8 oz', 95, 'pour-over'], ['Latte (double)', 126, 'latte'], ['Pour-over, 12 oz', 140, 'pour-over'], ['Cold brew, 16 oz', 200, 'cold-brew']];
$('#cafLadder').innerHTML = `<div style="display:grid;gap:8px">${CAF.map(([n, mg, id]) => `<a href="/groundwork/recipes/#${byId[id] ? id : 'espresso'}" style="display:grid;grid-template-columns:minmax(120px,190px) 1fr 56px;gap:12px;align-items:center;text-decoration:none">
  <span style="font:400 17px var(--serif)">${esc(n)}</span>
  <span style="position:relative;height:22px;border-radius:4px;background:var(--paper-2);overflow:hidden"><i style="position:absolute;inset:0 auto 0 0;width:${mg / 400 * 100}%;background:linear-gradient(90deg,#2b1710,${mg > 150 ? '#7a4a2b' : '#4a2c1d'});border-radius:4px"></i></span>
  <span class="num" style="font-size:13px;text-align:right">${mg} mg</span></a>`).join('')}
  <div style="display:grid;grid-template-columns:minmax(120px,190px) 1fr 56px;gap:12px;align-items:center"><span class="muted" style="font-size:13px">FDA daily guide</span><span style="height:2px;background:var(--cherry);position:relative"><b style="position:absolute;right:0;top:-8px;width:2px;height:18px;background:var(--cherry)"></b></span><span class="num" style="font-size:13px;text-align:right;color:var(--cherry)">400 mg</span></div></div>`;
