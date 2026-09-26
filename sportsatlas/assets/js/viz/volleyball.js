/* Sports Atlas — volleyball visuals. Units are metres; the court is 18 × 9 with the net at x = 9.
   The blue team plays on the left (facing +x, so its right-hand side is +y). */
import { Diagram, sceneSwitcher } from '../diagram.js';

const h = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const NARROW = matchMedia('(max-width: 640px)').matches;
const OPT = { sport: 'volleyball', r: NARROW ? .55 : .44 };
const FULL = [-4, -2.5, 26, 14], HALF = [-3.2, -1.6, 13.4, 12.2];
const team = (arr, t) => arr.map(p => ({ team: t, ...p }));
// rotational spots for the blue (left) team
const SPOT = { 1: [2.8, 7.4], 2: [7.2, 7.4], 3: [7.2, 4.5], 4: [7.2, 1.6], 5: [2.8, 1.6], 6: [2.8, 4.5] };
const ROLE_INFO = {
  S: 'Setter — takes the second contact and decides who attacks.', OH: 'Outside hitter — attacks from the left, passes serve, plays defense.',
  MB: 'Middle blocker — blocks across the net and hits quick sets.', OPP: 'Opposite — right-side attacker, lined up opposite the setter.',
  L: 'Libero — back-row defensive specialist in a different color jersey.'
};

/* ------------------------------------------------ anatomy */
function anatomy(host) {
  const body = host.querySelector('.viz-body');
  const bar = h('div', 'chips layers'); body.append(bar);
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'To-scale volleyball court with toggleable layers', caption: false, callouts: true, controls: false });
  const L = {
    zones: [
      { type: 'rect', x: 6, y: 0, w: 3, h: 9, tone: 'hot', label: 'FRONT ZONE', fs: .42, ly: 4.5 },
      { type: 'rect', x: 0, y: 0, w: 6, h: 9, tone: 'dim', label: 'BACK ZONE', fs: .42 },
      { type: 'rect', x: -3.2, y: 0, w: 3, h: 9, tone: 'zone', label: 'SERVICE ZONE', fs: .38 },
      { type: 'line', x1: 13.5, y1: 4.5, x2: 13.5, y2: 4.5, label: 'OTHER TEAM’S SIDE', fs: .34 }
    ],
    dims: [
      { type: 'dim', x1: 0, y1: 9.9, x2: 18, y2: 9.9, label: '18 M', fs: .45 },
      { type: 'dim', x1: 18.9, y1: 0, x2: 18.9, y2: 9, label: '9 M', fs: .45 },
      { type: 'dim', x1: 6, y1: -.7, x2: 9, y2: -.7, label: '3 M', fs: .4 },
      { type: 'line', x1: 9, y1: 2.6, x2: 9, y2: 2.6, label: 'NET · 2.43 M MEN · 2.24 M WOMEN', fs: .34 },
      { type: 'line', x1: 9, y1: 0, x2: 9, y2: 0, label: 'ANTENNA · 80 CM ABOVE THE NET', fs: .32, lx: 13.2, ly: -.75 }
    ]
  };
  const st = { zones: true, dims: true };
  const render = () => d.load({ static: true, view: [-4, -2.2, 24.5, 13.4], marks: Object.keys(L).flatMap(k => st[k] ? L[k] : []) });
  [['zones', 'Zones'], ['dims', 'Dimensions']].forEach(([k, t]) => { const b = h('button', 'chip chip-toggle', t); b.type = 'button'; b.setAttribute('aria-pressed', 'true'); b.onclick = () => { st[k] = !st[k]; b.setAttribute('aria-pressed', String(st[k])); render(); }; bar.append(b); });
  render();
}

/* ------------------------------------------------ rotation stepper (5-1) */
function rotation(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const d = new Diagram(left, { ...OPT, orient: 'h', label: 'Six-rotation stepper', caption: false });
  const lineup = { S: 1, OH1: 2, MB1: 3, OPP: 4, OH2: 5, MB2: 6 }; // rotation 1
  const roleOf = id => id.replace(/\d/, '');
  let rot = 1, phase = 'serve';
  const ctr = h('div', 'chips'); const phaseSeg = h('div', 'segmented'); const ro = h('div', 'readout'); const v = h('div', 'verdict');
  right.append(ctr, phaseSeg, ro, v);
  for (let r = 1; r <= 6; r++) { const b = h('button', 'chip', `Rotation ${r}`); b.type = 'button'; b.dataset.r = r; b.onclick = () => { rot = r; render(); }; ctr.append(b); }
  phaseSeg.innerHTML = '<button type="button" data-p="serve">At the serve</button><button type="button" data-p="base">After the serve (base)</button>';
  phaseSeg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { phase = b.dataset.p; render(); } });
  const posOf = (p, r) => ((p - (r - 1) - 1) % 6 + 6) % 6 + 1;
  function base(id, pos) {
    const role = roleOf(id), front = pos >= 2 && pos <= 4;
    if (front) return role === 'OH' ? [7.6, 1.2] : role === 'MB' ? [8.3, 4.5] : role === 'S' ? [8.4, 6.4] : [7.7, 7.8];
    if (role === 'S' || role === 'OPP') return [2.9, 7.5];
    if (role === 'L' || role === 'MB') return [2.9, 1.6];
    return [1.5, 4.5];
  }
  function render() {
    ctr.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.r === rot)));
    phaseSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === phase)));
    const players = [], paths = [];
    let setterFront = false;
    for (const [id, p0] of Object.entries(lineup)) {
      const pos = posOf(p0, rot);
      let role = roleOf(id), label = role, pid = id;
      if (role === 'MB' && (pos === 5 || pos === 6)) { label = 'L'; pid = 'L'; role = 'L'; }
      if (id === 'S' && pos >= 2 && pos <= 4) setterFront = true;
      const [sx, sy] = pos === 1 ? [-1.2, 8] : SPOT[pos];
      const [bx, by] = base(role === 'L' ? 'L' : id, pos);
      players.push({ id: pid, label, team: role === 'L' ? 'k' : 'o', x: sx, y: sy, hl: id === 'S', name: `${role} · spot ${pos}`, info: `${ROLE_INFO[role]} Rotational spot ${pos}${pos === 1 ? ' — serving' : ''}.` });
      if (phase === 'base') paths.push({ who: pid, kind: 'move', pts: [[sx, sy], [bx, by]], t: .2, d: 1.1 });
    }
    // spot numbers under the players
    const marks = Object.entries(SPOT).map(([n, [x, y]]) => ({ type: 'circle', x, y, r: .72, tone: 'dim', label: '', pill: false }));
    Object.entries(SPOT).forEach(([n, [x, y]]) => marks.push({ type: 'line', x1: x, y1: y, x2: x, y2: y, label: n, fs: .34, lx: x - .78, ly: y - .78, pill: false, tone: 'ltg' }));
    if (phase === 'serve') [[4, 5], [3, 6], [2, 1], [4, 3], [3, 2], [5, 6], [6, 1]].forEach(([a, b]) => marks.push({ type: 'line', x1: SPOT[a][0], y1: SPOT[a][1], x2: SPOT[b][0], y2: SPOT[b][1], tone: 'dim', dash: '.18 .14', under: true }));
    d.load({ view: HALF, players, paths, marks, static: phase === 'serve', captions: [{ t: 0, text: phase === 'serve' ? 'At the serve (serving team shown): spot 1 serves from behind the end line.' : 'The instant the ball is served, everyone runs to their job.' }] });
    if (phase === 'base') d.play();
    ro.innerHTML = `<div class="is-key"><small>Setter is</small><b>${setterFront ? 'FRONT ROW' : 'BACK ROW'}</b></div><div><small>Front-row hitters</small><b>${setterFront ? 2 : 3}</b></div>`;
    v.className = 'verdict mid';
    v.innerHTML = setterFront ? '<strong>Two-hitter rotation</strong>With the setter in the front row, only two front-row attackers are available — the hardest rotations for a 5-1. (But the setter can attack the second ball himself.)' : '<strong>Three-hitter rotation</strong>The setter is in the back row, so all three front-row players can attack. He must “penetrate” from the back row to the net to set.';
  }
  render();
  right.append(h('p', 'kicker', 'Receiving team rule: front-row players must be nearer the net than the back-row player behind them, and in left-to-right order in each row, when the ball is served.'));
}

/* ------------------------------------------------ rally */
function rally(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, autoplay: true, label: 'One rally, touch by touch' });
  const blue = team([{ id: 'L', label: 'L', x: 2.8, y: 3.6 }, { id: 'OH', label: 'OH', x: 3.4, y: 1.4 }, { id: 'OH2', label: 'OH', x: 3.6, y: 6.6 }, { id: 'S', label: 'S', x: 3.4, y: 8.4 }, { id: 'MB', label: 'MB', x: 7.6, y: 4.4 }, { id: 'OPP', label: 'OP', x: 7.2, y: 7.8 }], 'o').map(p => p.id === 'L' ? { ...p, team: 'k' } : p);
  const red = team([{ id: 'SV', label: 'SV', x: 19.3, y: 1.4 }, { id: 'b1', label: 'B', x: 10.4, y: 1.6 }, { id: 'b2', label: 'B', x: 10.4, y: 3.2 }, { id: 'b3', label: '', x: 10.6, y: 7.2 }, { id: 'dg', label: 'D', x: 15.5, y: 6.8 }, { id: 'd2', label: '', x: 15.6, y: 2.6 }], 'd');
  d.load({
    view: FULL, players: [...blue, ...red], ball: { holder: 'SV', dx: -.6, dy: 0 },
    paths: [
      { kind: 'kick', from: 'SV', to: 'L', t: .3, d: 1.2, bend: .08 },
      { who: 'S', kind: 'route', pts: [[3.4, 8.4], [6.4, 7.6], [8.2, 5.8]], t: .4, d: 1.1, curve: true },
      { who: 'OH', kind: 'route', pts: [[3.4, 1.4], [5.6, .9], [7.9, 1.2]], t: 1.6, d: 1.2, curve: true },
      { kind: 'pass', from: 'L', to: 'S', t: 1.55, d: .75, bend: .1 },
      { kind: 'toss', from: 'S', to: 'OH', t: 2.35, d: .9, bend: .25 },
      { who: 'b1', kind: 'move', pts: [[10.4, 1.6], [9.35, 1.1]], t: 2.4, d: .7 }, { who: 'b2', kind: 'move', pts: [[10.4, 3.2], [9.35, 2.1]], t: 2.4, d: .7 },
      { kind: 'shot', from: 'OH', to: 'dg', t: 3.3, d: .45, bend: 0 },
      { who: 'dg', kind: 'move', pts: [[15.5, 6.8], [14.8, 6.2]], t: 3.1, d: .5 },
      { kind: 'toss', from: 'dg', toPt: [11.6, 4.8], t: 3.8, d: .8, bend: .2 }
    ],
    captions: [
      { t: 0, text: '1 · SERVE — from behind the end line, anywhere along its 9-metre width.' },
      { t: 1.55, text: '2 · PASS — the libero passes (a forearm “dig”) to the setter’s target near the net.' },
      { t: 2.35, text: '3 · SET — the setter, who ran in from the back row, sets the outside hitter.' },
      { t: 3.3, text: '4 · ATTACK — cross-court past the two-man block.' },
      { t: 3.8, text: '5 · DIG — the defender keeps it alive, and the other team starts its own three touches.' }
    ]
  });
}

/* ------------------------------------------------ tempo / set locations */
function tempo(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Set locations and tempos', caption: false });
  const S = [8.2, 5.9];
  const sets = [
    ['4', 'High “4” (outside)', [7.8, .45], 'high', 3, 'Third tempo: a high ball to the left antenna. The safest set when the pass is poor.'],
    ['GO', 'Go (fast outside)', [8.35, 1.35], 'med', 2, 'Second tempo: a faster, flatter set to the left pin.'],
    ['31', '31', [8.5, 3.1], 'low', 1, 'First tempo: a quick set in the gap between the middle and the left side.'],
    ['1', 'Quick (1)', [8.5, 5.0], 'low', 1, 'First tempo: the middle jumps before the set and hits it right in front of the setter.'],
    ['SL', 'Slide', [8.5, 7.55], 'low', 1, 'First tempo behind the setter: the middle runs along the net and takes off from one foot.'],
    ['RED', 'Back set (red)', [8.1, 8.6], 'med', 2, 'The setter sets backwards, over the head, to the right-side attacker at the right antenna.'],
    ['PIPE', 'Pipe', [5.6, 4.4], 'med', 2, 'Back-row attack from the middle, jumping from behind the 3 m line.'],
    ['D', 'D ball', [5.6, 7.7], 'med', 2, 'Back-row attack from the right side.']
  ];
  const info = h('div', 'scene-info'); stage.after(info);
  const bar = h('div', 'chips'); stage.before(bar);
  const load = focus => {
    const paths = sets.map(([k, n, to, arc, tm]) => ({ kind: 'toss', fromPt: S, toPt: to, t: focus ? 0 : .15 * sets.findIndex(x => x[0] === k), d: tm === 1 ? .35 : tm === 2 ? .55 : .8, bend: arc === 'high' ? .5 : arc === 'med' ? .28 : .1 }));
    const marks = sets.map(([k, n, to, arc, tm]) => ({ type: 'circle', x: to[0], y: to[1], r: .38, tone: tm === 1 ? 'hot' : tm === 2 ? 'zone' : 'good', label: k, fs: .3, lx: to[0] - .78 - k.length * .12, ly: to[1] }));
    d.load({ view: HALF, players: [{ id: 'S', label: 'S', team: 'o', x: S[0], y: S[1], hl: true, info: 'The setter’s target: just right of center, about a metre off the net.' }], paths: focus ? paths.map((p, i) => sets[i][0] === focus ? p : { ...p, dim: true, t: 0, d: .01 }) : paths, marks });
    const s = sets.find(x => x[0] === focus);
    info.innerHTML = s ? `<h4>${s[1]} · tempo ${s[4]}</h4><p>${s[5]}</p>` : '<h4>Faster sets beat blocks</h4><p><b>Red = first tempo</b> (quick), <b>yellow = second</b>, <b>green = third</b> (high). A great pass lets the setter use every option — which forces the middle blocker to guess.</p>';
    d.play();
  };
  const all = h('button', 'chip', 'All sets'); all.type = 'button'; all.onclick = () => { bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b === all))); load(null); }; bar.append(all);
  sets.forEach(([k, n]) => { const b = h('button', 'chip', n); b.type = 'button'; b.onclick = () => { bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', String(x === b))); load(k); }; bar.append(b); });
  all.setAttribute('aria-selected', 'true'); load(null);
}

/* ------------------------------------------------ serve receive */
function receive(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Serve-receive formations', caption: false, controls: false });
  const zone = (pts, label) => ({ shape: 'poly', pts, tone: 'good', label, t: 0, fs: .3 });
  const P = (id, label, x, y, o = {}) => ({ id, label, x, y, team: 'o', ...o });
  const S = P('S', 'S', 8.4, 6.3, { hl: true, info: 'The setter stays out of the pass so he can set.' });
  sceneSwitcher(stage, d, {
    w: { chip: 'W (5 passers)', title: 'The W', about: 'Five players share the court in a W shape — common for beginners because nobody has to cover much ground.', static: true, view: HALF,
      players: [S, P('a', '', 5.3, 1.3), P('b', '', 5.3, 7.7), P('c', '', 3.8, 4.5), P('d', '', 1.7, 1.6), P('e', '', 1.7, 7.4)],
      zones: [zone([[6.2, 0], [6.2, 3], [2.8, 3], [2.8, 0]], ''), zone([[6.2, 6], [6.2, 9], [2.8, 9], [2.8, 6]], ''), zone([[4.6, 3], [4.6, 6], [2.8, 6], [2.8, 3]], '')] },
    u: { chip: '4 passers', title: 'Four-person receive', about: 'Four passers in a U, with the setter and one middle at the net. Fewer seams between passers.', static: true, view: HALF,
      players: [S, P('m', 'MB', 8.3, 3.6), P('a', '', 5, 1.3), P('b', '', 2.8, 3.3), P('c', '', 2.8, 5.7), P('d', '', 5, 7.7)] },
    three: { chip: '3 passers', title: 'Three-person receive', about: 'The modern standard: two outside hitters and the libero pass everything. The other three are free to attack.', static: true, view: HALF,
      players: [S, P('m', 'MB', 8.3, 3.6), P('o', 'OP', 8.1, 7.8), P('oh1', 'OH', 3.8, 1.8), P('l', 'L', 3.3, 4.5, { team: 'k' }), P('oh2', 'OH', 3.8, 7.2)],
      zones: [zone([[6, 0], [6, 3], [1, 3], [1, 0]], 'OH'), zone([[6, 3], [6, 6], [1, 6], [1, 3]], 'LIBERO'), zone([[6, 6], [6, 9], [1, 9], [1, 6]], 'OH')] },
    two: { chip: '2 passers', title: 'Two-person receive', about: 'Elite teams sometimes hide a weak passer by having only two players — often the libero and the best outside hitter — cover the whole court.', static: true, view: HALF,
      players: [S, P('m', 'MB', 8.3, 3.6), P('o', 'OP', 8.1, 7.8), P('oh', 'OH', 7.6, 1.3), P('l', 'L', 3.4, 2.6, { team: 'k' }), P('oh2', 'OH', 3.4, 6.4)],
      zones: [zone([[6, 0], [6, 4.5], [.8, 4.5], [.8, 0]], 'LIBERO'), zone([[6, 4.5], [6, 9], [.8, 9], [.8, 4.5]], 'OH')] }
  }, { label: 'Formation', noAutoplay: true });
}

/* ------------------------------------------------ blocking */
function block(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Line block vs angle block' });
  const A = [10.6, 7.6];
  const att = { id: 'A', label: 'OH', team: 'd', x: A[0], y: A[1], info: 'Opponent outside hitter attacking from his left side.' };
  const P = (id, label, x, y, o = {}) => ({ id, label, x, y, team: 'o', ...o });
  const shade = (pts, label, tone) => ({ shape: 'poly', pts, tone, label, t: 0, fs: .32 });
  sceneSwitcher(stage, d, {
    line: { chip: 'Line block', title: 'Line block', about: 'The blockers set up closer to the sideline and take away the straight “line” shot. The back row is arranged to dig the cross-court angle that is left open.', view: [-1.2, -1.2, 13.6, 11.4], ball: { holder: 'A' },
      players: [att, P('b1', 'B', 8.7, 8.1, { hl: true }), P('b2', 'B', 8.7, 7.1, { hl: true }), P('dl', 'D', 1.8, 8.1), P('dm', 'D', 1.3, 4.6), P('da', 'D', 2.6, 1.6), P('tip', 'T', 6.2, 6.4)],
      zones: [{ ...shade([[8.9, 8.6], [8.9, 6.6], [3, 5.4], [3, 9]], 'BLOCK SHADOW', 'soft'), lx: 4.3, ly: 7.7 }, { ...shade([[9, 6.4], [9, 3], [.5, .3], [.5, 3.6]], 'OPEN ANGLE', 'hot'), lx: 5.2, ly: 2.75 }],
      paths: [{ kind: 'shot', from: 'A', toPt: [1.5, 1.8], t: .6, d: .5, bend: 0 }],
      captions: [{ t: 0, text: 'The block takes away the line; defenders line up in the angle.' }, { t: .6, text: 'The hitter goes cross-court — right into the dig.' }] },
    angle: { chip: 'Angle block', title: 'Angle (cross-court) block', about: 'The blockers slide inside to take away the cross-court angle. Now the line is open, so a defender plays deep down the line.', view: [-1.2, -1.2, 13.6, 11.4], ball: { holder: 'A' },
      players: [att, P('b1', 'B', 8.7, 6.8, { hl: true }), P('b2', 'B', 8.7, 5.8, { hl: true }), P('dl', 'D', 1.4, 8.2), P('dm', 'D', 1.6, 4.4), P('da', 'D', 4.6, 1.4), P('tip', 'T', 6.4, 7.9)],
      zones: [shade([[8.9, 7.3], [8.9, 5.3], [2, 1.8], [2, 5.4]], 'BLOCK SHADOW', 'soft'), { ...shade([[9, 9], [9, 7.6], [.5, 7.7], [.5, 9]], 'OPEN LINE', 'hot'), lx: 4.4, ly: 8.66 }],
      paths: [{ kind: 'shot', from: 'A', toPt: [1.6, 8.3], t: .6, d: .5, bend: 0 }],
      captions: [{ t: 0, text: 'The block takes away the angle; one defender guards the line.' }, { t: .6, text: 'The hitter goes down the line — the line defender is waiting.' }] }
  }, { label: 'Block' });
}

const MODS = { anatomy, rotation, rally, tempo, receive, block };
export function mount(host, name) { const fn = MODS[name]; if (!fn) throw new Error('No volleyball visual: ' + name); return fn(host); }
