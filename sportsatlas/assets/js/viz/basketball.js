/* Sports Atlas — basketball visuals. Units are feet; the right basket is at (88.75, 25). Half-court diagrams render
   basket-up. C(d, y) places a point d feet from the right baseline. */
import { Diagram, sceneSwitcher } from '../diagram.js';

const h = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const NARROW = matchMedia('(max-width: 640px)').matches;
const C = (d, y) => [94 - d, y];
const P = (id, label, d, y, info, o = {}) => ({ id, label, x: 94 - d, y, info, ...o });
const HALF = [45, -2.5, 51.5, 55];
const OPT = { sport: 'basketball', orient: 'v', r: NARROW ? 1.9 : 1.45 };
const team = (arr, t) => arr.map(p => ({ team: t, ...p }));
const INFO = {
  PG: 'Point guard (1): primary ball-handler; starts the offense and runs the pick-and-roll.',
  SG: 'Shooting guard (2): perimeter scorer; spaces the floor and attacks closeouts.',
  SF: 'Small forward (3): wing: shoots, drives, defends multiple positions.',
  PF: 'Power forward (4): frontcourt: screens, rebounds, often spaces to the three-point line today.',
  C: 'Center (5): protects the rim, rebounds, sets screens and rolls to the basket.'
};

/* ------------------------------------------------ anatomy */
function anatomy(host) {
  const body = host.querySelector('.viz-body');
  const bar = h('div', 'chips layers'); body.append(bar);
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { sport: 'basketball', r: 1.4, label: 'To-scale NBA court with toggleable layers', caption: false, callouts: true, controls: false });
  const L = {
    areas: [
      { type: 'rect', x: 75, y: 17, w: 19, h: 16, tone: 'hot', label: 'THE PAINT', fs: 1.3 },
      { type: 'path', d: `M94,3 L${94 - 14.2},3 A23.75,23.75 0 0 0 ${94 - 14.2},47 L94,47`, tone: 'good', label: '', under: true },
      { type: 'line', x1: 60, y1: 25, x2: 60, y2: 25, label: 'THREE-POINT RANGE', fs: 1.2, tone: 'dim' },
      { type: 'line', x1: 80, y1: 1.6, x2: 80, y2: 1.6, label: 'CORNER 3', fs: 1, tone: 'dim' },
      { type: 'line', x1: 23.5, y1: 25, x2: 23.5, y2: 25, label: 'BACKCOURT (DEFENDING END)', fs: 1.2, tone: 'dim' }
    ],
    dims: [
      { type: 'dim', x1: 0, y1: -3, x2: 94, y2: -3, label: '94 FT', fs: 1.3 },
      { type: 'dim', x1: 97, y1: 0, x2: 97, y2: 50, label: '50 FT', fs: 1.2 },
      { type: 'dim', x1: 88.75, y1: 25, x2: 88.75 - 23.75, y2: 25, label: "23' 9\"", fs: 1.1, ly: 23.4 },
      { type: 'dim', x1: 91, y1: 3, x2: 91, y2: 25, label: "22' CORNER", fs: 1, lx: 88, ly: 10 },
      { type: 'dim', x1: 72.6, y1: 17, x2: 72.6, y2: 33, label: "16' LANE", fs: 1, lx: 71, ly: 36 },
      { type: 'dim', x1: 90, y1: 35.5, x2: 75, y2: 35.5, label: "15' FT LINE", fs: 1, ly: 37 },
      { type: 'line', x1: 5.25, y1: 25, x2: 5.25, y2: 25, label: "RIM 10' HIGH · 4' RESTRICTED AREA", fs: 1, ly: 31 }
    ]
  };
  const st = { areas: true, dims: true };
  const render = () => d.load({ static: true, view: [-4, -6, 104, 62], marks: Object.keys(L).flatMap(k => st[k] ? L[k] : []) });
  [['areas', 'Areas'], ['dims', 'Dimensions']].forEach(([k, t]) => { const b = h('button', 'chip chip-toggle', t); b.type = 'button'; b.setAttribute('aria-pressed', 'true'); b.onclick = () => { st[k] = !st[k]; b.setAttribute('aria-pressed', String(st[k])); render(); }; bar.append(b); });
  render();
}

/* ------------------------------------------------ shot value */
function shotvalue(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const d = new Diagram(left, { ...OPT, label: 'Shot zones by points per shot', caption: false, controls: false });
  // approximate recent NBA league averages by zone (NBA.com shot zones, rounded)
  const Z = { rim: .66, paint: .44, mid: .42, corner: .385, above: .355 };
  const tone = pps => pps >= 1.15 ? 'good' : pps >= 1.02 ? 'zone' : 'hot';
  const draw = () => {
    const pps = { rim: Z.rim * 2, paint: Z.paint * 2, mid: Z.mid * 2, corner: Z.corner * 3, above: Z.above * 3 };
    const marks = [
      { type: 'path', d: `M94,${25 - 22} L${94 - 14.2},3 A23.75,23.75 0 0 0 ${94 - 14.2},47 L94,47 L94,33 L75,33 L75,17 L94,17 Z`, tone: tone(pps.mid), under: true, label: `MIDRANGE ${pps.mid.toFixed(2)}`, lx: 74, ly: 40, fs: 1.2 },
      { type: 'path', d: 'M94,17 L75,17 L75,33 L94,33 Z', tone: tone(pps.paint), under: true, label: `PAINT ${pps.paint.toFixed(2)}`, lx: 78, ly: 25, fs: 1.2 },
      { type: 'circle', x: 88.75, y: 25, r: 4.2, tone: tone(pps.rim), label: `RIM ${pps.rim.toFixed(2)}`, lx: 86, ly: 25, fs: 1.1 },
      { type: 'rect', x: 80, y: -.2, w: 14, h: 3.2, tone: tone(pps.corner), label: `CORNER 3 ${pps.corner.toFixed(2)}`, fs: 1 },
      { type: 'rect', x: 80, y: 47, w: 14, h: 3.2, tone: tone(pps.corner), label: `CORNER 3 ${pps.corner.toFixed(2)}`, fs: 1 },
      { type: 'line', x1: 56, y1: 25, x2: 56, y2: 25, tone: 'dim', label: `ABOVE THE BREAK 3 · ${pps.above.toFixed(2)}`, fs: 1.2 }
    ];
    d.load({ static: true, view: HALF, marks });
  };
  right.innerHTML = `<div class="tool-row"><label for="sv-2">Two-point make rate <b></b></label><input id="sv-2" type="range" min="30" max="70" value="50"></div><div class="tool-row"><label for="sv-3">Three-point make rate <b></b></label><input id="sv-3" type="range" min="20" max="50" value="36"></div>`;
  const ro = h('div', 'readout'); const v = h('div', 'verdict'); right.append(ro, v, h('p', 'kicker', 'Zone values on the court = approximate recent NBA league averages × points.'));
  const two = right.querySelector('#sv-2'), three = right.querySelector('#sv-3');
  const run = () => {
    const p2 = +two.value / 100, p3 = +three.value / 100, a = p2 * 2, b = p3 * 3;
    right.querySelector('label[for=sv-2] b').textContent = two.value + '%'; right.querySelector('label[for=sv-3] b').textContent = three.value + '%';
    ro.innerHTML = `<div class="${a >= b ? 'is-key' : ''}"><small>Points per 2-pt shot</small><b>${a.toFixed(2)}</b></div><div class="${b > a ? 'is-key' : ''}"><small>Points per 3-pt shot</small><b>${b.toFixed(2)}</b></div><div><small>Break-even 3P%</small><b>${(p2 * 200 / 3).toFixed(1)}%</b></div>`;
    v.className = 'verdict ' + (b > a ? 'ok' : 'mid');
    v.innerHTML = `<strong>${b > a ? 'The three is the better shot' : 'The two is the better shot'}</strong>${Math.round(p3 * 100)}% from three is worth ${b.toFixed(2)} points per attempt; ${Math.round(p2 * 100)}% from two is worth ${a.toFixed(2)}. To match your two-point shooting, you only need to make ${(p2 * 200 / 3).toFixed(1)}% of threes.`;
  };
  two.addEventListener('input', run); three.addEventListener('input', run); run(); draw();
}

/* ------------------------------------------------ positions */
function positions(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Five offensive positions', caption: false, controls: false });
  const trad = team([P('PG', '1', 31, 25, INFO.PG), P('SG', '2', 22.6, 42.3, INFO.SG), P('SF', '3', 22.6, 7.7, INFO.SF), P('PF', '4', 9, 16, INFO.PF), P('C', '5', 8, 33, INFO.C)], 'o');
  const modern = team([P('PG', 'LEAD', 31, 25, 'Lead guard: initiates pick-and-rolls and makes the first read.'), P('SG', '3&D', 3, 47, 'Corner shooter / 3-and-D wing: spaces the floor and guards the other team’s best perimeter scorer.'), P('SF', 'WING', 22.6, 7.7, 'Wing creator: attacks closeouts and makes secondary plays.'), P('PF', '4', 3, 3, 'Stretch four: a big who shoots threes, pulling his defender away from the rim.'), P('C', 'BIG', 4, 31.5, 'Rim-running big: screens, rolls, catches lobs, lives in the dunker spot.')], 'o');
  sceneSwitcher(stage, d, {
    trad: { chip: 'Traditional 1–5', title: 'Traditional positions', about: 'Guards on the perimeter, forwards on the wings and blocks, the center near the basket.', static: true, view: HALF, players: trad },
    modern: { chip: 'Modern roles', title: 'Modern five-out roles', about: 'Today most teams space four or five players around the arc, with one big living near the rim in the “dunker spot”.', static: true, view: HALF, players: modern }
  }, { label: 'Positions', noAutoplay: true });
}

/* ------------------------------------------------ spacing */
function spacing(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Spacing comparison' });
  const good = team([P('A', '1', 31, 25), P('B', '2', 3, 47), P('Cc', '3', 22.6, 7.7), P('D', '4', 3, 3), P('E', '5', 4, 31.5)], 'o');
  const goodD = team([P('a', '', 28, 25), P('b', '', 7, 43), P('c', '', 19, 10), P('dd', '', 7, 7), P('e', '', 8, 29)], 'd');
  const bad = team([P('A', '1', 31, 25), P('B', '2', 19, 33), P('Cc', '3', 22, 40), P('D', '4', 10, 35), P('E', '5', 6, 29)], 'o');
  const badD = team([P('a', '', 28, 25), P('b', '', 17, 31), P('c', '', 19, 36), P('dd', '', 12, 32), P('e', '', 8, 27)], 'd');
  sceneSwitcher(stage, d, {
    good: { chip: 'Five-out spacing', title: 'Five-out: the drive-and-kick', about: 'Four shooters around the arc and a big in the dunker spot. When the guard drives, the nearest helper has to leave a shooter, so the kick-out is open.', view: HALF, players: [...good, ...goodD], ball: { holder: 'A' },
      zones: [{ shape: 'rect', x: 94 - 28, y: 20, w: 20, h: 10, tone: 'good', label: 'DRIVING LANE', t: 0, fs: 1.1 }],
      paths: [{ who: 'A', kind: 'run', pts: [C(31, 25), C(20, 22), C(12, 20)], t: .2, d: 1.2, curve: true }, { who: 'dd', kind: 'move', pts: [C(7, 7), C(10, 15)], t: .8, d: .7 }, { who: 'a', kind: 'move', pts: [C(28, 25), C(15, 22)], t: .2, d: 1.2 }, { kind: 'pass', from: 'A', to: 'D', t: 1.5, d: .5, bend: .3 }],
      captions: [{ t: 0, text: 'The driving lane is wide open because everyone is spaced out.' }, { t: .8, text: 'The corner defender slides over to stop the drive…' }, { t: 1.5, text: '…leaving the corner shooter open: kick it out.' }] },
    bad: { chip: 'Cramped spacing', title: 'Cramped: one defender guards two', about: 'Three offensive players on one side and no one in the weak-side corner. Defenders can help on the drive without leaving anyone dangerous.', view: HALF, players: [...bad, ...badD], ball: { holder: 'A' },
      zones: [{ shape: 'rect', x: 94 - 24, y: 22, w: 18, h: 16, tone: 'hot', label: 'CROWDED', t: 0, fs: 1.1 }],
      paths: [{ who: 'A', kind: 'run', pts: [C(31, 25), C(22, 27), C(17, 28)], t: .2, d: 1.1, curve: true }, { who: 'b', kind: 'move', pts: [C(17, 31), C(18, 29)], t: .6, d: .6 }, { who: 'dd', kind: 'move', pts: [C(12, 32), C(14, 29)], t: .6, d: .6 }],
      captions: [{ t: 0, text: 'Three offensive players sharing one side.' }, { t: .8, text: 'Two defenders help on the drive without leaving anyone open. The drive dies.' }] }
  }, { label: 'Spacing' });
}

/* ------------------------------------------------ actions */
function actions(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Common offensive actions' });
  const base = (list) => team(list, 'o');
  const scr = (who, from, to, t = .1, dd = .7) => ({ who, kind: 'route', pts: [from, to], t, d: dd, arrow: 'tee' });
  sceneSwitcher(stage, d, {
    pnr: { chip: 'Pick-and-roll', title: 'Pick-and-roll', about: 'The big sets a screen on the ball-handler’s defender, then rolls to the rim. The guard can shoot, drive, or pass to the roller.', view: HALF, ball: { holder: 'G' },
      players: [...base([P('G', '1', 32, 23), P('B', '5', 22, 30), P('W1', '3', 3, 3), P('W2', '2', 3, 47), P('W3', '4', 22.6, 7.7)]), ...team([P('g', '', 29.5, 23.5), P('b', '', 18, 29)], 'd')],
      paths: [scr('B', C(22, 30), C(29.8, 26.2), .1, .8), { who: 'G', kind: 'run', pts: [C(32, 23), C(30, 29), C(22, 33), C(17, 31)], t: .9, d: 1.3, curve: true }, { who: 'B', kind: 'route', pts: [C(29.8, 26.2), C(18, 26), C(7, 25.5)], t: 1.4, d: 1.1, curve: true }, { who: 'g', kind: 'move', pts: [C(29.5, 23.5), C(29, 27), C(24, 31)], t: .9, d: 1.3, curve: true }, { who: 'b', kind: 'move', pts: [C(18, 29), C(14, 29), C(11, 27)], t: 1.1, d: 1 }, { kind: 'pass', from: 'G', to: 'B', t: 2.2, d: .45, bend: .2 }],
      captions: [{ t: 0, text: 'The big sets the screen on the guard’s defender.' }, { t: 1, text: 'The guard comes off the screen; the big “rolls” to the rim.' }, { t: 2.2, text: 'The big’s defender stays with the guard too long: pocket pass for the dunk.' }] },
    pop: { chip: 'Pick-and-pop', title: 'Pick-and-pop', about: 'Same screen, but the screener “pops” out to the three-point line instead of rolling, deadly with a big who can shoot.', view: HALF, ball: { holder: 'G' },
      players: [...base([P('G', '1', 32, 23), P('B', '4', 22, 30), P('W1', '3', 3, 3), P('W2', '2', 3, 47), P('W3', '5', 4, 20)]), ...team([P('g', '', 29.5, 23.5), P('b', '', 18, 29)], 'd')],
      paths: [scr('B', C(22, 30), C(29.8, 26.2), .1, .8), { who: 'G', kind: 'run', pts: [C(32, 23), C(29, 30), C(20, 32), C(15, 30)], t: .9, d: 1.2, curve: true }, { who: 'B', kind: 'route', pts: [C(29.8, 26.2), C(27, 36), C(24, 40)], t: 1.3, d: .9, curve: true }, { who: 'b', kind: 'move', pts: [C(18, 29), C(16, 30)], t: 1, d: .8 }, { kind: 'pass', from: 'G', to: 'B', t: 2.2, d: .5, bend: .2 }],
      captions: [{ t: 0, text: 'The four sets the screen…' }, { t: 1.3, text: '…then pops to the arc while his defender protects the paint.' }, { t: 2.2, text: 'Open three.' }] },
    dho: { chip: 'Handoff (DHO)', title: 'Dribble handoff', about: 'A big dribbles toward a guard and hands him the ball as he runs by: the big’s body acts as a moving screen.', view: HALF, ball: { holder: 'B' },
      players: [...base([P('B', '5', 30, 25), P('G', '2', 22.6, 42.3), P('W1', '3', 3, 3), P('W2', '4', 3, 47), P('W3', '1', 22.6, 7.7)]), ...team([P('g', '', 19.5, 39), P('b', '', 27, 25)], 'd')],
      paths: [{ who: 'B', kind: 'run', pts: [C(30, 25), C(28, 33)], t: .1, d: .8 }, { who: 'G', kind: 'route', pts: [C(22.6, 42.3), C(29.5, 36), C(26, 30), C(16, 26)], t: .2, d: 1.8, curve: true }, { kind: 'handoff', from: 'B', to: 'G', t: 1.05 }, { who: 'g', kind: 'move', pts: [C(19.5, 39), C(26.5, 36.5)], t: .4, d: .9 }],
      captions: [{ t: 0, text: 'The big dribbles toward the wing…' }, { t: 1.05, text: 'Handoff: the guard takes it at full speed and his defender is stuck behind the big.' }] },
    pindown: { chip: 'Pin-down', title: 'Pin-down', about: 'A player near the block screens down for a shooter, who sprints up from the corner to the wing for a catch-and-shoot.', view: HALF, ball: { holder: 'PG' },
      players: [...base([P('PG', '1', 31, 25), P('S', '2', 3, 44), P('B', '5', 9, 38), P('W1', '3', 22.6, 7.7), P('W2', '4', 3, 5)]), ...team([P('s', '', 6, 41), P('b', '', 9, 34)], 'd')],
      paths: [scr('B', C(9, 38), C(8, 41.5), .1, .6), { who: 'S', kind: 'route', pts: [C(3, 44), C(8, 44.5), C(20, 42)], t: .7, d: 1.1, curve: true }, { who: 's', kind: 'move', pts: [C(6, 41), C(8.5, 40)], t: .7, d: .8 }, { kind: 'pass', from: 'PG', to: 'S', t: 1.8, d: .5, bend: .1 }],
      captions: [{ t: 0, text: 'The center screens down on the shooter’s defender.' }, { t: .8, text: 'The shooter curls up off the screen to the wing.' }, { t: 1.8, text: 'Catch and shoot.' }] },
    flare: { chip: 'Flare screen', title: 'Flare screen', about: 'A screen that sends the shooter away from the ball. Defenders chasing him get caught on the screen.', view: HALF, ball: { holder: 'PG' },
      players: [...base([P('PG', '1', 22.6, 42.3), P('S', '2', 28, 28), P('B', '4', 24, 20), P('W1', '3', 3, 47), P('W2', '5', 4, 31.5)]), ...team([P('s', '', 25, 29), P('b', '', 21, 21)], 'd')],
      paths: [scr('B', C(24, 20), C(25.8, 26.2), .1, .7), { who: 'S', kind: 'route', pts: [C(28, 28), C(27, 18), C(22, 9)], t: .8, d: 1, curve: true }, { who: 's', kind: 'move', pts: [C(25, 29), C(25.2, 27)], t: .8, d: .6 }, { kind: 'pass', from: 'PG', to: 'S', t: 1.8, d: .6, bend: .05 }],
      captions: [{ t: 0, text: 'Screen on the shooter’s defender, facing away from the ball.' }, { t: .9, text: 'The shooter drifts away into space; his defender is walled off.' }, { t: 1.8, text: 'Skip pass across the court for the open three.' }] },
    spain: { chip: 'Spain pick-and-roll', title: 'Spain pick-and-roll', about: 'A pick-and-roll plus a third player who back-screens the roller’s defender, then pops out for three. The defense must choose between the lob and the shooter.', view: HALF, ball: { holder: 'G' },
      players: [...base([P('G', '1', 32, 23), P('B', '5', 22, 28), P('S', '2', 17, 27), P('W1', '3', 3, 3), P('W2', '4', 3, 47)]), ...team([P('g', '', 29.5, 23.5), P('b', '', 19.5, 27.5), P('s', '', 14, 27)], 'd')],
      paths: [scr('B', C(22, 28), C(29.8, 26.2), .1, .8), { who: 'G', kind: 'run', pts: [C(32, 23), C(30, 29), C(23, 33)], t: .9, d: 1.1, curve: true }, { who: 'B', kind: 'route', pts: [C(29.8, 26.2), C(18, 26), C(7, 25)], t: 1.3, d: 1.1, curve: true }, { who: 'S', kind: 'route', pts: [C(17, 27), C(20.5, 27.3)], t: 1.2, d: .4, arrow: 'tee' }, { who: 'S', kind: 'route', pts: [C(20.5, 27.3), C(27, 20), C(28, 16)], t: 1.7, d: .9, curve: true }, { who: 'b', kind: 'move', pts: [C(19.5, 27.5), C(20, 28)], t: 1.2, d: .4 }, { kind: 'pass', from: 'G', to: 'S', t: 2.6, d: .5, bend: .2 }],
      captions: [{ t: 0, text: 'Normal pick-and-roll at the top…' }, { t: 1.2, text: '…but a shooter back-screens the big’s defender as he drops.' }, { t: 1.8, text: 'The shooter then pops out. Lob or three: the defense can’t take both.' }] },
    backdoor: { chip: 'Backdoor cut', title: 'Backdoor cut', about: 'When a defender overplays the passing lane, the receiver cuts behind him to the basket.', view: HALF, ball: { holder: 'PG' },
      players: [...base([P('PG', '1', 31, 25), P('W', '2', 22.6, 42.3), P('B', '5', 19, 33), P('W1', '3', 3, 3), P('W2', '4', 22.6, 7.7)]), ...team([P('w', '', 24.5, 37.5)], 'd')],
      paths: [{ who: 'W', kind: 'route', pts: [C(22.6, 42.3), C(24.5, 41), C(9, 30), C(5.5, 27.5)], t: .4, d: 1.2, curve: true }, { who: 'w', kind: 'move', pts: [C(24.5, 37.5), C(23, 38.5), C(16, 35)], t: .6, d: 1.1 }, { kind: 'pass', from: 'PG', to: 'W', t: 1.2, d: .55, bend: .1 }],
      captions: [{ t: 0, text: 'The defender is denying the pass to the wing.' }, { t: .5, text: 'So the wing plants and cuts behind him…' }, { t: 1.2, text: '…bounce pass for the layup.' }] }
  }, { label: 'Action' });
}

/* ------------------------------------------------ pick-and-roll coverages */
function pnr(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Pick-and-roll coverages' });
  const O = team([P('G', '1', 32, 23, 'Ball-handler.'), P('B', '5', 22, 30, 'Screener (the big).'), P('W1', '3', 3, 3), P('W2', '2', 3, 47), P('W3', '4', 22.6, 7.7)], 'o');
  const Dd = (big) => team([P('g', 'X1', 29.5, 23.5, 'Guards the ball-handler.'), P('b', 'X5', ...big, 'Guards the screener. His position defines the coverage.'), P('w1', '', 6, 7), P('w2', '', 7, 42), P('w3', '', 19, 11)], 'd');
  const screen = { who: 'B', kind: 'route', pts: [C(22, 30), C(29.8, 26.2)], t: .1, d: .8, arrow: 'tee' };
  const drive = (pts, t = .9, dd = 1.2) => ({ who: 'G', kind: 'run', pts: pts.map(p => C(...p)), t, d: dd, curve: true });
  const roll = (pts, t = 1.4, dd = 1.1) => ({ who: 'B', kind: 'route', pts: [C(29.8, 26.2), ...pts.map(p => C(...p))], t, d: dd, curve: true });
  const mv = (who, pts, t, dd) => ({ who, kind: 'move', pts: pts.map(p => C(...p)), t, d: dd, curve: pts.length > 2 });
  sceneSwitcher(stage, d, {
    drop: { chip: 'Drop', title: 'Drop coverage', about: 'The big sinks back near the paint to wall off the drive and the roll; the guard chases over the screen. Safe at the rim, but it concedes the pull-up jumper.', beats: 'Rolling bigs and lob threats.', weak: 'Guards who can shoot off the dribble (and pick-and-pop bigs).', view: HALF, ball: { holder: 'G' }, players: [...O, ...Dd([19, 28.5])],
      paths: [screen, drive([[32, 23], [30, 29.5], [22, 32], [18, 31]]), roll([[18, 26], [8, 25.5]]), mv('b', [[19, 28.5], [14, 28], [11, 27]], .9, 1.1), mv('g', [[29.5, 23.5], [29.5, 27.5], [22, 30.5]], .9, 1.2), { kind: 'shot', from: 'G', toPt: C(5.25, 25), t: 2.3, d: .6, bend: .4 }],
      captions: [{ t: 0, text: 'X5 starts low, at or below the free-throw line.' }, { t: 1.1, text: 'He retreats with the roll, protecting the rim.' }, { t: 2.3, text: 'That leaves the mid-range pull-up. The defense lives with it.' }] },
    hedge: { chip: 'Hedge / show', title: 'Hedge (show)', about: 'The big jumps out into the ball-handler’s path for a moment, forcing him wide, then sprints back to the roller.', beats: 'Pull-up shooters: it takes away the first read.', weak: 'The roll man and the short roll while the big is recovering.', view: HALF, ball: { holder: 'G' }, players: [...O, ...Dd([24, 29])],
      paths: [screen, drive([[32, 23], [30.5, 29.5], [31, 35], [25, 37]], .9, 1.4), roll([[18, 26], [9, 25.5]], 1.5), mv('b', [[24, 29], [30.5, 31.5], [22, 28], [13, 27]], .8, 1.8), mv('g', [[29.5, 23.5], [29.8, 27.5], [27.5, 34]], .9, 1.2)],
      captions: [{ t: 0, text: 'X5 waits beside the screen.' }, { t: .9, text: 'He jumps out, pushing the guard wide and away from the paint…' }, { t: 1.7, text: '…then recovers to the rolling big.' }] },
    blitz: { chip: 'Blitz / trap', title: 'Blitz (trap)', about: 'Both defenders attack the ball-handler to force the ball out of his hands. The offense now plays four-on-three behind the trap.', beats: 'A star ball-handler you must stop at all costs.', weak: 'A good passer and a short-roll playmaker.', view: HALF, ball: { holder: 'G' }, players: [...O, ...Dd([25, 29.5])],
      paths: [screen, drive([[32, 23], [31, 28], [33, 31]], .9, .9), roll([[21, 27.5]], 1.4, .7), mv('b', [[25, 29.5], [31.5, 30.5]], .8, .8), mv('g', [[29.5, 23.5], [31, 27.5], [33.5, 29.5]], .9, .9), mv('w3', [[19, 11], [19, 22]], 1.5, .8), { kind: 'pass', from: 'G', to: 'B', t: 1.9, d: .45, bend: .2 }],
      captions: [{ t: 0, text: 'The big comes all the way up…' }, { t: 1, text: 'Two defenders trap the ball-handler.' }, { t: 1.9, text: 'The escape pass goes to the “short roll”: now it’s 4-on-3.' }] },
    switch: { chip: 'Switch', title: 'Switch', about: 'The two defenders simply swap assignments. Nothing opens up in the moment, but now a big guards a quick guard and a small guard guards the center.', beats: 'Actions that rely on a split second of confusion.', weak: 'Mismatches: the guard attacks the slow big; the center posts up the small guard.', view: HALF, ball: { holder: 'G' }, players: [...O, ...Dd([24, 29])],
      paths: [screen, drive([[32, 23], [30.5, 30], [26, 34]], .9, 1), roll([[18, 26], [9, 26]], 1.4), mv('b', [[24, 29], [29.5, 31], [26.5, 32.5]], .8, 1.1), mv('g', [[29.5, 23.5], [26, 25], [12, 26]], 1, 1.5)],
      captions: [{ t: 0, text: 'Screen set.' }, { t: 1, text: 'X5 takes the ball-handler; X1 takes the rolling big.' }, { t: 2, text: 'Result: a guard-on-center mismatch in the post.' }] },
    ice: { chip: 'ICE (side)', title: 'ICE: side pick-and-roll', about: 'On a pick-and-roll near the sideline, the guard’s defender jumps above the screen and forces the ball toward the baseline, where the big is waiting.', beats: 'Keeps the ball out of the middle of the floor.', weak: 'A quick ball-handler who rejects the screen or splits it.', view: HALF, ball: { holder: 'G' },
      players: [...team([P('G', '1', 24, 44.5), P('B', '5', 18, 38), P('W1', '3', 3, 3), P('W2', '2', 22.6, 7.7), P('W3', '4', 30, 25)], 'o'), ...team([P('g', 'X1', 22.5, 41), P('b', 'X5', 12, 38.5), P('w1', '', 6, 7), P('w2', '', 20, 11), P('w3', '', 26, 25)], 'd')],
      paths: [{ who: 'B', kind: 'route', pts: [C(18, 38), C(24, 41.5)], t: .1, d: .7, arrow: 'tee' }, mv('g', [[22.5, 41], [25.5, 42]], .3, .6), drive([[24, 44.5], [17, 45.5], [10, 43]], 1, 1.1), mv('b', [[12, 38.5], [11.5, 41.5]], .9, .8)],
      captions: [{ t: 0, text: 'The screen comes to the middle of the floor…' }, { t: .5, text: '…but X1 jumps above it and refuses to let the ball go middle.' }, { t: 1.2, text: 'The guard is pushed baseline, into the waiting big.' }] },
    level: { chip: 'At the level', title: 'At the level (up to touch)', about: 'A middle ground between drop and hedge: the big steps up to the level of the screen to contain the ball, then gets back.', beats: 'Pull-up shooters, without fully committing like a hedge.', weak: 'Quick pocket passes to the roller.', view: HALF, ball: { holder: 'G' }, players: [...O, ...Dd([25.5, 28.5])],
      paths: [screen, drive([[32, 23], [30.5, 29.5], [27, 33]], .9, 1.1), roll([[18, 26], [9, 25.5]], 1.4), mv('b', [[25.5, 28.5], [28, 30.5], [18, 27], [12, 26.5]], .8, 1.6), mv('g', [[29.5, 23.5], [29.8, 27.5], [26, 31.5]], .9, 1.2)],
      captions: [{ t: 0, text: 'X5 sits at the screener’s level.' }, { t: 1, text: 'He shows long enough to stop the pull-up…' }, { t: 1.8, text: '…then retreats with the roller.' }] }
  }, { label: 'Coverage' });
}

/* ------------------------------------------------ zones */
function zones(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Zone defenses' });
  const O = team([P('A', '1', 31, 25), P('B', '2', 22.6, 42.3), P('Cc', '3', 22.6, 7.7), P('D', '4', 3, 47), P('E', '5', 3, 3)], 'o').map(p => ({ ...p, ghost: true }));
  const poly = (pts, label, tone = 'under', at) => ({ shape: 'poly', pts: pts.map(p => C(...p)), tone, label, t: 0, fs: 1, ...(at ? { lx: 94 - at[0], ly: at[1] } : {}) });
  const gap = (dd, y, label) => ({ type: 'circle', x: 94 - dd, y, r: 2.4, tone: 'hot', label, fs: .95 });
  sceneSwitcher(stage, d, {
    z23: { chip: '2-3 zone', title: '2-3 zone', about: 'Two defenders up top, three along the baseline. It packs the paint and protects the rim.', weak: 'The high post (free-throw line), the short corners, and threes from the wings and corners.', static: true, view: HALF, players: [...O, ...team([P('a', '', 23, 18), P('b', '', 23, 32), P('c', '', 8, 8), P('dd', '', 6.5, 25), P('e', '', 8, 42)], 'd')],
      zones: [poly([[36, 25], [36, 3], [16, 3], [16, 25]], 'TOP', 'under', [31.5, 12]), poly([[36, 25], [36, 47], [16, 47], [16, 25]], 'TOP', 'under', [31.5, 38]), poly([[16, 0], [16, 17], [0, 17], [0, 0]], 'WING-BASE', 'deep', [13.2, 8.5]), poly([[16, 17], [16, 33], [0, 33], [0, 17]], 'MIDDLE', 'deep', [12.4, 25]), poly([[16, 33], [16, 50], [0, 50], [0, 33]], 'WING-BASE', 'deep', [13.2, 41.5])],
      marks: [gap(19, 25, 'HIGH POST'), gap(5, 12, 'SHORT CORNER')] },
    z32: { chip: '3-2 zone', title: '3-2 zone', about: 'Three across the top, two low. Better at contesting perimeter shots.', weak: 'The baseline, short corners and offensive rebounding.', static: true, view: HALF, players: [...O, ...team([P('a', '', 26, 25), P('b', '', 21, 10), P('c', '', 21, 40), P('dd', '', 8, 17), P('e', '', 8, 33)], 'd')],
      zones: [poly([[36, 3], [36, 17], [15, 17], [15, 3]], 'WING', 'under', [30.5, 10]), poly([[36, 17], [36, 33], [18, 33], [18, 17]], 'TOP', 'under', [32.5, 25]), poly([[36, 33], [36, 47], [15, 47], [15, 33]], 'WING', 'under', [30.5, 40]), poly([[15, 0], [15, 25], [0, 25], [0, 0]], 'LOW', 'deep', [12.5, 17]), poly([[15, 25], [15, 50], [0, 50], [0, 25]], 'LOW', 'deep', [12.5, 33])],
      marks: [gap(4, 8, 'BASELINE'), gap(4, 42, 'BASELINE')] },
    z131: { chip: '1-3-1 zone', title: '1-3-1 zone', about: 'One at the top, three across the middle, one on the baseline. Built to trap wings and steal passes.', weak: 'The corners and the baseline behind the middle row.', static: true, view: HALF, players: [...O, ...team([P('a', '', 31, 25), P('b', '', 19, 8), P('c', '', 17, 25), P('dd', '', 19, 42), P('e', '', 5, 25)], 'd')],
      zones: [poly([[38, 12], [38, 38], [26, 38], [26, 12]], 'TOP', 'under', [35.5, 17]), poly([[26, 0], [26, 16], [12, 16], [12, 0]], 'WING', 'under', [14.5, 8]), poly([[26, 16], [26, 34], [12, 34], [12, 16]], 'MIDDLE', 'under', [22.5, 25]), poly([[26, 34], [26, 50], [12, 50], [12, 34]], 'WING', 'under', [14.5, 42]), poly([[12, 0], [12, 50], [0, 50], [0, 0]], 'BASELINE', 'deep', [9.5, 12])],
      marks: [gap(2.5, 3, 'CORNER'), gap(2.5, 47, 'CORNER')] },
    box1: { chip: 'Box-and-one', title: 'Box-and-one', about: 'Four defenders play a box zone while one chases the opponent’s best scorer everywhere (man-to-man).', weak: 'Every other shooter: the zone gives them space.', view: HALF, ball: { holder: 'A' }, players: [...O.map(p => p.id === 'B' ? { ...p, ghost: false, hl: true, label: 'STAR' } : p), ...team([P('a', '', 19, 18), P('b', '', 19, 32), P('c', '', 7, 17), P('dd', '', 7, 33), P('s', 'MAN', 20, 40)], 'd')],
      zones: [poly([[34, 5], [34, 25], [14, 25], [14, 5]], 'BOX', 'under', [29, 12]), poly([[34, 25], [34, 45], [14, 45], [14, 25]], 'BOX', 'under', [29, 32]), poly([[14, 3], [14, 25], [0, 25], [0, 3]], 'BOX', 'deep', [11.5, 10]), poly([[14, 25], [14, 47], [0, 47], [0, 25]], 'BOX', 'deep', [11.5, 40])],
      paths: [{ who: 'B', kind: 'route', pts: [C(22.6, 42.3), C(12, 44), C(3, 45)], t: .3, d: 1.4, curve: true }, { who: 's', kind: 'move', pts: [C(20, 40), C(11, 42), C(4.5, 43.5)], t: .4, d: 1.4, curve: true }],
      captions: [{ t: 0, text: 'The star moves; the “one” follows him everywhere.' }] }
  }, { label: 'Zone', noAutoplay: false });
}

/* ------------------------------------------------ two-for-one clock */
function clock(host) {
  const body = host.querySelector('.viz-body');
  const tool = h('div', 'tool'); body.append(tool);
  tool.innerHTML = `<div class="tool-row"><label for="c21">Time left when you get the ball <b></b></label><input id="c21" type="range" min="5" max="60" value="38"></div>`;
  const bar = h('div'); bar.style.cssText = 'position:relative;height:74px;border:1px solid var(--line-2);border-radius:4px;overflow:hidden;background:var(--panel)';
  const v = h('div', 'verdict');
  tool.append(bar, v);
  const inp = tool.querySelector('#c21');
  const seg = (from, to, T, color, label) => `<div style="position:absolute;top:0;bottom:0;left:${(1 - from / T) * 100}%;width:${(from - to) / T * 100}%;background:${color};display:grid;place-items:center;font:700 11px/1.2 var(--mono);letter-spacing:.06em;color:#0b0f0d;text-align:center;border-right:2px solid #080b0a">${label}</div>`;
  const run = () => {
    const T = +inp.value; tool.querySelector('label b').textContent = `0:${String(T).padStart(2, '0')}`;
    const shootAt = Math.min(T - 4, Math.max(T - 24, 30)); // shoot early enough that their full possession still leaves time
    const theirs = Math.max(0, shootAt - 24);
    let html = '', msg;
    if (T >= 34) {
      html = seg(T, shootAt, T, '#ffd400', `YOU · SHOOT AT 0:${String(shootAt).padStart(2, '0')}`) + seg(shootAt, theirs, T, '#ef4136', 'THEM · UP TO 24s') + (theirs > 0 ? seg(theirs, 0, T, '#2fcf7a', `YOU AGAIN · ${theirs}s`) : '');
      msg = `<strong>Two-for-one is on</strong>Attack quickly and get a good shot up by about 0:${String(shootAt).padStart(2, '0')}. Even if the opponent uses its full 24-second clock, you get the ball back with about ${theirs} seconds for a second shot.`;
      v.className = 'verdict ok';
    } else if (T > 24) {
      html = seg(T, T - 24, T, '#ffd400', 'YOU · FULL 24s') + seg(T - 24, 0, T, '#ef4136', `THEM · ${T - 24}s`);
      msg = `<strong>No clean two-for-one</strong>Your 24-second shot clock runs out with about ${T - 24} seconds left, so the opponent gets the last possession either way. Run a good set and get the best shot you can.`;
      v.className = 'verdict mid';
    } else {
      html = seg(T, 0, T, '#ffd400', 'YOU · LAST SHOT OF THE QUARTER');
      msg = `<strong>Hold for the last shot</strong>Less than 24 seconds: the shot clock is off (or doesn’t matter). Use the time and shoot around 0:03 so there’s no answer.`;
      v.className = 'verdict mid';
    }
    bar.innerHTML = html; v.innerHTML = msg;
  };
  inp.addEventListener('input', run); run();
}

/* ------------------------------------------------ efficiency calculator */
function stats(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const f = [['fgm', 'Field goals made', 9], ['fga', 'Field goals attempted', 18], ['tpm', 'Threes made', 3], ['ftm', 'Free throws made', 6], ['fta', 'Free throws attempted', 7]];
  const form = h('div', 'tool'); form.style.display = 'grid'; form.style.gridTemplateColumns = 'repeat(2, minmax(0,1fr))';
  form.innerHTML = f.map(([k, l, v]) => `<div class="tool-row"><label for="bk-${k}">${l}</label><input id="bk-${k}" type="number" min="0" value="${v}" style="height:42px;border-radius:4px;border:1px solid var(--line-2);background:var(--panel);color:var(--chalk);padding:0 10px;font:600 15px var(--mono);width:100%;min-width:0"></div>`).join('');
  const right = h('div', 'tool'); const ro = h('div', 'readout'); const n = h('p', 'note'); right.append(ro, n); wrap.append(form, right);
  const g = k => Math.max(0, +form.querySelector('#bk-' + k).value || 0);
  const run = () => {
    const fgm = g('fgm'), fga = g('fga'), tpm = Math.min(g('tpm'), fgm), ftm = g('ftm'), fta = Math.max(g('fta'), ftm);
    const pts = 2 * (fgm - tpm) + 3 * tpm + ftm, fg = fgm / fga, efg = (fgm + .5 * tpm) / fga, ts = pts / (2 * (fga + .44 * fta));
    const pct = x => isFinite(x) ? (x * 100).toFixed(1) + '%' : '–';
    ro.innerHTML = `<div><small>Points</small><b>${pts}</b></div><div><small>FG%</small><b>${pct(fg)}</b></div><div><small>eFG%</small><b>${pct(efg)}</b></div><div class="is-key"><small>TS%</small><b>${pct(ts)}</b></div>`;
    n.innerHTML = `<strong>Why TS% matters:</strong> two players with the same FG% can be very different scorers. Threes (eFG%) and free throws (TS%) add value FG% ignores. League-average true shooting in the NBA has been in the high 50s in recent seasons.`;
  };
  form.addEventListener('input', run); run();
}

const MODS = { anatomy, shotvalue, positions, spacing, actions, pnr, zones, clock, stats };
export function mount(host, name) { const fn = MODS[name]; if (!fn) throw new Error('No basketball visual: ' + name); return fn(host); }
