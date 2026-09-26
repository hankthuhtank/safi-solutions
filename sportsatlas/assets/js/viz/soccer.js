/* Sports Atlas — soccer visuals. Units are metres on a 105 × 68 pitch; the blue team attacks to the right (+x). */
import { Diagram, sceneSwitcher } from '../diagram.js';

const L = 105, W = 68, MID = 34;
const h = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const NARROW = matchMedia('(max-width: 640px)').matches;
const OPT = { sport: 'soccer', r: NARROW ? 2.3 : 1.6 };
const FULL = [-3, -3, L + 6, W + 6], ATT = [48, -3, 60, W + 6];
const P = (id, label, x, y, info, o = {}) => ({ id, label, x, y, info, ...o });
const team = (arr, t) => arr.map(p => ({ team: t, ...p }));
const ROLE = {
  GK: 'Goalkeeper — the only player who may handle the ball, and only inside his own penalty area.',
  CB: 'Center back — wins duels in the air and on the ground, and starts the buildup.',
  LB: 'Left back — defends the flank and supports attacks down the outside.', RB: 'Right back — defends the flank and supports attacks down the outside.',
  WB: 'Wing-back — covers the whole flank in a back three or five: defender and winger in one.',
  DM: 'Defensive midfielder (6) — screens the back line and receives from the defenders.',
  CM: 'Central midfielder (8) — links defense to attack, runs box to box.',
  AM: 'Attacking midfielder (10) — operates between the opponent’s lines and creates chances.',
  LM: 'Wide midfielder — covers the flank in a flat four.', RM: 'Wide midfielder — covers the flank in a flat four.',
  W: 'Winger — stretches the defense wide, beats defenders 1v1, crosses or cuts inside.',
  ST: 'Striker (9) — the main goal threat; pins center backs and finishes chances.'
};

/* ------------------------------------------------ anatomy */
function anatomy(host) {
  const body = host.querySelector('.viz-body');
  const bar = h('div', 'chips layers'); body.append(bar);
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'To-scale pitch with toggleable layers', caption: false, callouts: true, controls: false });
  const layers = {
    areas: [
      { type: 'rect', x: L - 16.5, y: MID - 20.16, w: 16.5, h: 40.32, tone: 'hot', label: 'PENALTY AREA', fs: 1.5, ly: MID - 15 },
      { type: 'rect', x: L - 5.5, y: MID - 9.16, w: 5.5, h: 18.32, tone: 'good', label: '', fs: 1 },
      { type: 'line', x1: L - 3, y1: MID + 12.5, x2: L - 3, y2: MID + 12.5, label: 'GOAL AREA', fs: 1.2 },
      { type: 'line', x1: 52.5, y1: 4, x2: 52.5, y2: 4, label: 'HALFWAY LINE', fs: 1.3 },
      { type: 'line', x1: 13, y1: W + 1.6, x2: 13, y2: W + 1.6, label: 'DEFENDING HALF', fs: 1.2, pill: false },
      { type: 'line', x1: 92, y1: W + 1.6, x2: 92, y2: W + 1.6, label: 'ATTACKING HALF', fs: 1.2, pill: false }
    ],
    dims: [
      { type: 'dim', x1: 0, y1: -1.8, x2: L, y2: -1.8, label: '105 M (100–110)', fs: 1.4, callout: false },
      { type: 'dim', x1: -1.8, y1: 0, x2: -1.8, y2: W, label: '68 M', fs: 1.3, lx: 3.5, callout: false },
      { type: 'dim', x1: L - 16.5, y1: MID + 21.8, x2: L, y2: MID + 21.8, label: '16.5 M', fs: 1.2, callout: false },
      { type: 'dim', x1: L - 11, y1: MID + 2, x2: L, y2: MID + 2, label: NARROW ? '11 M' : '11 M SPOT', fs: 1.1, ly: MID + 3.6, callout: false },
      { type: 'dim', x1: 52.5, y1: MID, x2: 52.5 + 9.15, y2: MID, label: '9.15 M', fs: 1.1, ly: MID - 1.7, callout: false },
      { type: 'dim', x1: L + 1.4, y1: MID - 3.66, x2: L + 1.4, y2: MID + 3.66, label: 'GOAL 7.32 × 2.44 M', fs: 1.05, lx: NARROW ? L + 3.4 : L - 7, ly: NARROW ? MID + 17 : MID - 6, callout: false }
    ]
  };
  const st = { areas: true, dims: true };
  const render = () => d.load({ static: true, view: [-5, -5, L + 10, W + 10], marks: Object.keys(layers).flatMap(k => st[k] ? layers[k] : []) });
  [['areas', 'Areas'], ['dims', 'Dimensions']].forEach(([k, t]) => { const b = h('button', 'chip chip-toggle', t); b.type = 'button'; b.setAttribute('aria-pressed', 'true'); b.onclick = () => { st[k] = !st[k]; b.setAttribute('aria-pressed', String(st[k])); render(); }; bar.append(b); });
  render();
}

/* ------------------------------------------------ formations */
const GK = P('GK', 'GK', 5, MID, ROLE.GK, { team: 'k' });
const back4 = [P('LB', 'LB', 25, 8, ROLE.LB), P('LCB', 'CB', 20, 25, ROLE.CB), P('RCB', 'CB', 20, 43, ROLE.CB), P('RB', 'RB', 25, 60, ROLE.RB)];
const back3 = [P('LCB', 'CB', 21, 19, ROLE.CB), P('CB', 'CB', 18, MID, ROLE.CB), P('RCB', 'CB', 21, 49, ROLE.CB)];
const F = {
  f433: ['4-3-3', 'Width from the wingers, a single pivot (the 6) behind two 8s. Natural for pressing high and building from the back.', [...back4, P('DM', '6', 35, MID, ROLE.DM), P('LCM', '8', 42, 22, ROLE.CM), P('RCM', '8', 42, 46, ROLE.CM), P('LW', 'LW', 60, 10, ROLE.W), P('ST', '9', 64, MID, ROLE.ST), P('RW', 'RW', 60, 58, ROLE.W)]],
  f4231: ['4-2-3-1', 'Two holding midfielders (a “double pivot”) protect the back four; a 10 plays behind a lone striker.', [...back4, P('LDM', '6', 36, 26, ROLE.DM), P('RDM', '6', 36, 42, ROLE.DM), P('AM', '10', 51, MID, ROLE.AM), P('LW', 'LW', 54, 10, ROLE.W), P('RW', 'RW', 54, 58, ROLE.W), P('ST', '9', 65, MID, ROLE.ST)]],
  f442: ['4-4-2', 'Two banks of four and two strikers: simple, compact and easy to press from. Width comes from the wide midfielders.', [...back4, P('LM', 'LM', 45, 9, ROLE.LM), P('LCM', 'CM', 41, 26, ROLE.CM), P('RCM', 'CM', 41, 42, ROLE.CM), P('RM', 'RM', 45, 59, ROLE.RM), P('ST1', '9', 60, 27, ROLE.ST), P('ST2', '9', 60, 41, ROLE.ST)]],
  f442d: ['4-4-2 diamond', 'A narrow midfield diamond — 6, two 8s and a 10 — dominates the center; the fullbacks must provide all the width.', [...back4, P('DM', '6', 34, MID, ROLE.DM), P('LCM', '8', 42, 23, ROLE.CM), P('RCM', '8', 42, 45, ROLE.CM), P('AM', '10', 51, MID, ROLE.AM), P('ST1', '9', 62, 28, ROLE.ST), P('ST2', '9', 62, 40, ROLE.ST)]],
  f4141: ['4-1-4-1', 'A single holding midfielder behind a line of four. Very compact without the ball.', [...back4, P('DM', '6', 34, MID, ROLE.DM), P('LM', 'LM', 47, 9, ROLE.LM), P('LCM', '8', 45, 25, ROLE.CM), P('RCM', '8', 45, 43, ROLE.CM), P('RM', 'RM', 47, 59, ROLE.RM), P('ST', '9', 63, MID, ROLE.ST)]],
  f352: ['3-5-2', 'Three center backs let the wing-backs push high; three central midfielders and two strikers.', [...back3, P('LWB', 'WB', 43, 6, ROLE.WB), P('LCM', '8', 40, 22, ROLE.CM), P('DM', '6', 35, MID, ROLE.DM), P('RCM', '8', 40, 46, ROLE.CM), P('RWB', 'WB', 43, 62, ROLE.WB), P('ST1', '9', 61, 28, ROLE.ST), P('ST2', '9', 61, 40, ROLE.ST)]],
  f343: ['3-4-3', 'Back three, two wing-backs, two central midfielders and a front three: lots of attackers, lots of width.', [...back3, P('LWB', 'WB', 42, 6, ROLE.WB), P('LCM', '8', 38, 27, ROLE.CM), P('RCM', '8', 38, 41, ROLE.CM), P('RWB', 'WB', 42, 62, ROLE.WB), P('LW', 'LW', 59, 15, ROLE.W), P('ST', '9', 63, MID, ROLE.ST), P('RW', 'RW', 59, 53, ROLE.W)]],
  f541: ['5-4-1', 'The defensive version of a back three: wing-backs drop into a back five. Protects the box and the half-spaces.', [P('LWB', 'WB', 23, 6, ROLE.WB), P('LCB', 'CB', 19, 21, ROLE.CB), P('CB', 'CB', 17, MID, ROLE.CB), P('RCB', 'CB', 19, 47, ROLE.CB), P('RWB', 'WB', 23, 62, ROLE.WB), P('LM', 'LM', 35, 11, ROLE.LM), P('LCM', 'CM', 33, 27, ROLE.CM), P('RCM', 'CM', 33, 41, ROLE.CM), P('RM', 'RM', 35, 57, ROLE.RM), P('ST', '9', 49, MID, ROLE.ST)]]
};
function formations(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Formation board', caption: false, controls: false });
  const scenes = {};
  for (const [k, [name, about, list]] of Object.entries(F)) scenes[k] = { chip: name, title: name, about, static: true, view: [-3, -3, 75, W + 6], rotate: true, players: [{ ...GK }, ...team(list, 'o')] };
  sceneSwitcher(stage, d, scenes, { label: 'Formation', noAutoplay: true });
}

/* ------------------------------------------------ lanes */
function lanes(host) {
  const body = host.querySelector('.viz-body');
  const bar = h('div', 'chips layers'); body.append(bar);
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Five lanes, thirds and zone 14', caption: false, callouts: true, controls: false });
  const y1 = MID - 20.16, y2 = MID - 9.16, y3 = MID + 9.16, y4 = MID + 20.16;
  const layers = {
    lanes: [
      { type: 'rect', x: 0, y: 0, w: L, h: y1, tone: 'zone', label: 'WIDE LANE', fs: 1.3, lx: 20 },
      { type: 'rect', x: 0, y: y1, w: L, h: y2 - y1, tone: 'good', label: 'HALF-SPACE', fs: 1.3, lx: 20 },
      { type: 'rect', x: 0, y: y2, w: L, h: y3 - y2, tone: 'dim', label: 'CENTRAL LANE', fs: 1.3, lx: 20 },
      { type: 'rect', x: 0, y: y3, w: L, h: y4 - y3, tone: 'good', label: 'HALF-SPACE', fs: 1.3, lx: 20 },
      { type: 'rect', x: 0, y: y4, w: L, h: W - y4, tone: 'zone', label: 'WIDE LANE', fs: 1.3, lx: 20 }
    ],
    thirds: [
      { type: 'line', x1: 35, y1: 0, x2: 35, y2: W, tone: 'ltg' }, { type: 'line', x1: 70, y1: 0, x2: 70, y2: W, tone: 'ltg' },
      { type: 'line', x1: 17.5, y1: W + 1.7, x2: 17.5, y2: W + 1.7, label: 'DEFENSIVE THIRD', fs: 1.2 },
      { type: 'line', x1: 52.5, y1: W + 1.7, x2: 52.5, y2: W + 1.7, label: 'MIDDLE THIRD', fs: 1.2 },
      { type: 'line', x1: 87.5, y1: W + 1.7, x2: 87.5, y2: W + 1.7, label: 'FINAL THIRD', fs: 1.2 }
    ],
    z14: [{ type: 'rect', x: 70, y: W / 3, w: L - 16.5 - 70, h: W / 3, tone: 'hot', label: 'ZONE 14', fs: 1.4 }]
  };
  const st = { lanes: true, thirds: true, z14: true };
  const render = () => d.load({ static: true, view: [-3, -3, L + 6, W + 7], marks: Object.keys(layers).flatMap(k => st[k] ? layers[k] : []) });
  [['lanes', 'Five lanes'], ['thirds', 'Thirds'], ['z14', 'Zone 14']].forEach(([k, t]) => { const b = h('button', 'chip chip-toggle', t); b.type = 'button'; b.setAttribute('aria-pressed', 'true'); b.onclick = () => { st[k] = !st[k]; b.setAttribute('aria-pressed', String(st[k])); render(); }; bar.append(b); });
  render();
}

/* ------------------------------------------------ attacking patterns */
function patterns(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Attacking patterns' });
  const def = list => team(list.map(([id, x, y]) => P(id, '', x, y)), 'd');
  const GKd = { ...P('gk', 'GK', 102.5, MID), team: 'd' };
  const run = (who, pts, t, dd, curve = true) => ({ who, kind: 'route', pts, t, d: dd, curve });
  const drib = (who, pts, t, dd) => ({ who, kind: 'run', pts, t, d: dd, curve: true });
  const mv = (who, pts, t, dd) => ({ who, kind: 'move', pts, t, d: dd, curve: pts.length > 2 });
  const pass = (from, to, t, dd = .6, bend = .1) => ({ kind: 'pass', from, to, t, d: dd, bend });
  sceneSwitcher(stage, d, {
    overlap: { chip: 'Overlap', title: 'Overlap', about: 'The winger holds the ball; the fullback sprints around the outside. The defender has to choose — track the runner or stay with the ball.', view: ATT, ball: { holder: 'W' },
      players: [...team([P('W', 'W', 72, 57), P('FB', 'RB', 62, 63), P('ST', '9', 86, 34), P('AM', '10', 76, 42)], 'o'), ...def([['d1', 80, 57], ['d2', 88, 48], ['d3', 90, 36], ['d4', 88, 26]]), GKd],
      paths: [run('FB', [[62, 63], [76, 65], [92, 63]], .1, 1.6), drib('W', [[72, 57], [77, 53]], .3, .8), mv('d1', [[80, 57], [81, 55]], .4, .6), pass('W', 'FB', 1.3, .6, -.1), drib('FB', [[92, 63], [97, 58]], 1.95, .5), { kind: 'pass', from: 'FB', to: 'ST', t: 2.5, d: .7, bend: .25 }, run('ST', [[86, 34], [95, 36]], 2, 1)],
      captions: [{ t: 0, text: 'The right back starts his run around the outside.' }, { t: .8, text: 'The winger drives inside, dragging the defender with him…' }, { t: 1.3, text: '…and slips the overlapping fullback in behind.' }, { t: 2.5, text: 'Cross to the striker.' }] },
    underlap: { chip: 'Underlap', title: 'Underlap', about: 'The runner goes inside the ball-carrier instead of around him — into the half-space between fullback and center back.', view: ATT, ball: { holder: 'W' },
      players: [...team([P('W', 'W', 76, 62), P('CM', '8', 66, 48), P('ST', '9', 86, 34)], 'o'), ...def([['d1', 83, 60], ['d2', 88, 48], ['d3', 90, 36], ['d4', 86, 25]]), GKd],
      paths: [run('CM', [[66, 48], [78, 52], [92, 53]], .1, 1.5), mv('d1', [[83, 60], [82, 62]], .3, .6), pass('W', 'CM', 1.2, .55, .1), drib('CM', [[92, 53], [97, 47]], 1.8, .5), { kind: 'pass', from: 'CM', to: 'ST', t: 2.35, d: .45, bend: .1 }, run('ST', [[86, 34], [95, 37]], 1.8, 1)],
      captions: [{ t: 0, text: 'The midfielder bursts through the gap inside the winger.' }, { t: 1.2, text: 'Pass into the half-space, behind the fullback.' }, { t: 2.3, text: 'Low ball across the six-yard box.' }] },
    thirdman: { chip: 'Third-man run', title: 'Third-man run', about: 'A passes to B, but the real target is C, already running. B plays C in first time — the defense is watching the first pass, not the third player.', view: ATT, ball: { holder: 'A' },
      players: [...team([P('A', 'A', 58, 38), P('B', 'B', 70, 36), P('Cc', 'C', 64, 20)], 'o'), ...def([['d1', 73, 38], ['d2', 84, 28], ['d3', 85, 42], ['d4', 82, 16]]), GKd],
      paths: [pass('A', 'B', .3, .5), run('Cc', [[64, 20], [76, 22], [90, 26]], .5, 1.5), mv('d1', [[73, 38], [71.5, 37]], .4, .5), { kind: 'pass', from: 'B', to: 'Cc', t: 1.1, d: .75, bend: -.1 }],
      captions: [{ t: 0, text: 'A plays into B, who has his back to goal.' }, { t: .8, text: 'C is already running beyond the defense.' }, { t: 1.1, text: 'B plays it first time into C’s path: in on goal.' }] },
    switch: { chip: 'Switch of play', title: 'Switch of play', about: 'The defense has shifted toward the ball. One long pass to the far side attacks the space it left behind.', view: FULL, ball: { holder: 'LB' },
      players: [...team([P('LB', 'LB', 55, 8), P('LW', 'LW', 70, 7), P('CM', '8', 60, 22), P('RW', 'RW', 72, 60), P('ST', '9', 78, 30)], 'o'), ...def([['d1', 75, 10], ['d2', 80, 22], ['d3', 82, 32], ['d4', 80, 42], ['m1', 66, 12], ['m2', 64, 24]]), GKd],
      paths: [pass('LB', 'RW', .4, 1.3, .25), mv('d4', [[80, 42], [84, 52]], 1.1, 1.2), drib('RW', [[72, 60], [82, 56]], 1.8, .9)],
      captions: [{ t: 0, text: 'Everyone — both teams — is on the left side.' }, { t: .4, text: 'Long diagonal to the winger on the far side.' }, { t: 1.8, text: 'He gets a 1-v-1 with space to run into.' }] },
    cutback: { chip: 'Cutback', title: 'Cutback', about: 'Drive to the goal line, then pass backward to a teammate arriving at the penalty spot. Defenders facing their own goal can’t see him.', view: ATT, ball: { holder: 'W' },
      players: [...team([P('W', 'W', 84, 56), P('CM', '8', 80, 40), P('ST', '9', 92, 34)], 'o'), ...def([['d1', 88, 54], ['d2', 97, 44], ['d3', 98, 34], ['d4', 96, 28]]), GKd],
      paths: [drib('W', [[84, 56], [95, 56], [101, 50]], .1, 1.2), run('ST', [[92, 34], [100, 37]], .5, .8), mv('d3', [[98, 34], [101, 38]], .7, .7), run('CM', [[80, 40], [90, 38]], .6, 1.1), { kind: 'pass', from: 'W', to: 'CM', t: 1.45, d: .45, bend: 0 }],
      captions: [{ t: 0, text: 'The winger drives to the byline.' }, { t: .7, text: 'The striker’s near-post run pulls defenders toward the goal.' }, { t: 1.45, text: 'Cutback to the midfielder arriving late — open shot from 12 metres.' }] },
    wall: { chip: 'One-two', title: 'One-two (wall pass)', about: 'Pass to a teammate, sprint past your defender, get it straight back. The teammate acts like a wall.', view: ATT, ball: { holder: 'A' },
      players: [...team([P('A', 'A', 66, 30), P('B', 'B', 76, 38)], 'o'), ...def([['d1', 72, 30], ['d2', 88, 34]]), GKd],
      paths: [pass('A', 'B', .2, .45), run('A', [[66, 30], [74, 29], [84, 30]], .45, 1.1), { kind: 'pass', from: 'B', to: 'A', t: .95, d: .5, bend: .05 }, mv('d1', [[72, 30], [70.5, 32]], .3, .5)],
      captions: [{ t: 0, text: 'Pass to B…' }, { t: .5, text: 'A runs past his defender…' }, { t: .95, text: '…and B returns it first time into his path.' }] }
  }, { label: 'Pattern' });
}

/* ------------------------------------------------ blocks */
function blocks(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Pressing heights', caption: false, controls: false });
  const shape = (f) => team([P('ST1', '', f, 28), P('ST2', '', f, 40), P('LM', '', f + 11, 10), P('CM1', '', f + 11, 26), P('CM2', '', f + 11, 42), P('RM', '', f + 11, 58), P('LB', '', f + 22, 12), P('CB1', '', f + 22, 27), P('CB2', '', f + 22, 41), P('RB', '', f + 22, 56)], 'd');
  const blue = team([P('gk', 'GK', 5, MID), P('b1', '', 16, 20), P('b2', '', 16, 48), P('b3', '', 26, 6), P('b4', '', 26, 62), P('b5', '', 30, MID), P('b6', '', 42, 22), P('b7', '', 42, 46), P('b8', '', 58, 10), P('b9', '', 62, MID), P('b10', '', 58, 58)], 'o').map(p => ({ ...p, ghost: true }));
  const block = (f, label) => ({ shape: 'rect', x: f - 2, y: 4, w: 26, h: W - 8, tone: 'hot', label, t: 0, fs: 1.4 });
  const gkd = { ...P('gkd', 'GK', 100, MID), team: 'd' };
  sceneSwitcher(stage, d, {
    high: { chip: 'High press', title: 'High press', about: 'Defend in the opponent’s half: force mistakes near their goal. Risky — a long ball can go over the top of the whole team.', static: true, view: FULL, players: [...blue, ...shape(20), gkd], zones: [block(20, 'HIGH BLOCK')] },
    mid: { chip: 'Mid block', title: 'Mid block', about: 'Let the center backs have the ball, then close down once it enters the middle third. The most common default.', static: true, view: FULL, players: [...blue, ...shape(48), gkd], zones: [block(48, 'MID BLOCK')] },
    low: { chip: 'Low block', title: 'Low block', about: 'Sit deep and compact around your own box. Hard to break down, but it concedes territory and invites pressure.', static: true, view: FULL, players: [...blue, ...shape(68), gkd], zones: [block(68, 'LOW BLOCK')] }
  }, { label: 'Block height', noAutoplay: true });
}

/* ------------------------------------------------ offside checker */
function offside(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const d = new Diagram(left, { ...OPT, orient: 'h', label: 'Drag players to test offside', caption: false, controls: false });
  const restarts = h('div', 'chips'); const v = h('div', 'verdict'); const ro = h('div', 'readout');
  right.append(restarts, ro, v, h('p', 'kicker', 'Drag the dashed players (or focus one and use the arrow keys).'));
  let restart = 'play';
  [['play', 'Pass in open play'], ['throw', 'Throw-in'], ['goalkick', 'Goal kick'], ['corner', 'Corner kick']].forEach(([k, t]) => { const b = h('button', 'chip', t); b.type = 'button'; b.dataset.k = k; b.onclick = () => { restart = k; update(); }; restarts.append(b); });
  const scene = {
    static: true, view: ATT, ball: { holder: 'P', dx: .9, dy: 0 },
    players: [
      { id: 'P', label: 'P', name: 'Passer', team: 'o', x: 66, y: 30, info: 'Passer — has the ball.' },
      { id: 'R', label: 'R', name: 'Receiver', team: 'o', x: 86.6, y: 46, info: 'Receiver — is he offside?' },
      { id: 'D1', label: 'D', name: 'Defender', team: 'd', x: 86, y: 26 },
      { id: 'D2', label: 'D', name: 'Defender', team: 'd', x: 85.2, y: 45 },
      { id: 'D3', label: 'D', name: 'Defender', team: 'd', x: 82, y: 36 },
      { id: 'GK', label: 'GK', name: 'Goalkeeper', team: 'd', x: 102, y: MID }
    ]
  };
  const clamp = (x, y) => [Math.max(49, Math.min(L - .5, x)), Math.max(.5, Math.min(W - .5, y))];
  const draw = () => {
    d.load(scene);
    d.drag(['P', 'R', 'D1', 'D2', 'D3', 'GK'], { clamp, onMove: (id, x, y) => { const p = scene.players.find(q => q.id === id); p.x = x; p.y = y; update(); } });
    update();
  };
  const lineG = { el: null };
  const update = () => {
    restarts.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === restart)));
    const get = id => scene.players.find(p => p.id === id);
    const defs = ['D1', 'D2', 'D3', 'GK'].map(get).sort((a, b) => b.x - a.x);
    const second = defs[1], ballX = get('P').x + .9, R = get('R');
    const lineX = Math.max(second.x, ballX);
    // draw / move the offside line
    if (!lineG.el || !lineG.el.isConnected) { lineG.el = document.createElementNS('http://www.w3.org/2000/svg', 'line'); lineG.el.setAttribute('class', 'mk-line'); lineG.el.setAttribute('stroke', '#ffd400'); lineG.el.setAttribute('stroke-width', '.35'); lineG.el.setAttribute('stroke-dasharray', '1 .6'); d.gMarks.append(lineG.el); }
    lineG.el.setAttribute('x1', lineX); lineG.el.setAttribute('x2', lineX); lineG.el.setAttribute('y1', 0); lineG.el.setAttribute('y2', W);
    d.placeBall(0);
    const gap = R.x - lineX;
    const inOwnHalf = R.x <= L / 2;
    const level = Math.abs(gap) < .2;
    const exempt = restart !== 'play';
    const offsidePos = !inOwnHalf && gap >= .2;
    ro.innerHTML = `<div class="${offsidePos ? 'is-warn' : 'is-good'}"><small>Receiver vs. line</small><b>${level ? 'LEVEL' : (gap > 0 ? '+' : '') + gap.toFixed(1) + ' m'}</b></div><div><small>Line set by</small><b style="font-size:20px">${ballX > second.x ? 'The ball' : second.id === 'GK' ? 'Goalkeeper' : '2nd-last defender'}</b></div>`;
    if (exempt) { v.className = 'verdict ok'; v.innerHTML = `<strong>No offside possible</strong>A player cannot be offside when receiving the ball directly from a ${restart === 'throw' ? 'throw-in' : restart === 'goalkick' ? 'goal kick' : 'corner kick'}.`; return; }
    if (inOwnHalf) { v.className = 'verdict ok'; v.innerHTML = '<strong>Onside</strong>He is in his own half — you cannot be offside there.'; return; }
    if (level) { v.className = 'verdict ok'; v.innerHTML = '<strong>Onside — level</strong>Level with the second-last defender (or the ball) is onside.'; return; }
    if (offsidePos) { v.className = 'verdict bad'; v.innerHTML = `<strong>Offside position</strong>He is ${gap.toFixed(1)} m nearer the goal line than ${ballX > second.x ? 'the ball' : 'the second-last defender'}. If he plays the ball or interferes with an opponent, it is an <b>indirect free kick</b> to the defending team. Being there alone is not an offence.`; return; }
    v.className = 'verdict ok'; v.innerHTML = `<strong>Onside</strong>He is ${Math.abs(gap).toFixed(1)} m behind the line.`;
  };
  draw();
}

/* ------------------------------------------------ restarts / countdowns */
function restarts(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); left.style.cssText = 'display:grid;place-items:center;min-height:260px;background:#0b120e;border-radius:4px';
  const right = h('div', 'tool'); wrap.append(left, right);
  const R = 70, C = 2 * Math.PI * R;
  left.innerHTML = `<svg viewBox="0 0 200 200" width="220" height="220" role="img" aria-label="Countdown"><circle cx="100" cy="100" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/><circle class="arc" cx="100" cy="100" r="${R}" fill="none" stroke="#ffd400" stroke-width="12" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="${C}" stroke-dashoffset="0"/><text class="num" x="100" y="112" text-anchor="middle" font-family="Big Shoulders, sans-serif" font-weight="900" font-size="64" fill="#eef1ea">8</text><text class="unit" x="100" y="138" text-anchor="middle" font-family="Martian Mono, monospace" font-size="10" fill="#9aa79e" letter-spacing="1.5">SECONDS</text></svg>`;
  const arc = left.querySelector('.arc'), num = left.querySelector('.num'), unit = left.querySelector('.unit');
  const chips = h('div', 'chips'); const v = h('div', 'verdict'); const go = h('button', 'btn btn-primary', 'Start the clock'); go.type = 'button';
  right.append(chips, v, go);
  const S = {
    gk: { t: 8, lab: 'Goalkeeper holding the ball', law: '2025/26', text: 'Hold the ball more than <b>8 seconds</b> and the opponents get a <b>corner kick</b>. The referee counts the last five down with a raised hand.' },
    throw: { t: 5, lab: 'Throw-in (delayed)', law: '2026/27', text: 'Deliberately slow to take a throw-in? A visible <b>5-second</b> countdown — then the throw-in goes to the other team.' },
    goal: { t: 5, lab: 'Goal kick (delayed)', law: '2026/27', text: 'Same 5-second countdown for a deliberately delayed goal kick. Run out of time and the opponents get a <b>corner kick</b>.' },
    sub: { t: 10, lab: 'Substitution', law: '2026/27', text: 'The player leaving has <b>10 seconds</b> to get off the field. Take longer and his replacement cannot come on until the first stoppage after one minute.' },
    injury: { t: 60, lab: 'Injury treatment', law: '2026/27', text: 'A player treated on the field must stay off for <b>one minute</b> after play restarts.' }
  };
  let cur = 'gk', raf;
  const set = k => { cur = k; cancelAnimationFrame(raf); chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === k))); const s = S[k]; num.textContent = s.t; unit.textContent = s.t === 60 ? 'SECONDS OFF' : 'SECONDS'; arc.style.strokeDashoffset = 0; arc.setAttribute('stroke', '#ffd400'); v.className = 'verdict mid'; v.innerHTML = `<strong>${s.lab} · ${s.law} Laws</strong>${s.text}`; };
  Object.entries(S).forEach(([k, s]) => { const b = h('button', 'chip', s.lab); b.type = 'button'; b.dataset.k = k; b.onclick = () => set(k); chips.append(b); });
  go.onclick = () => {
    cancelAnimationFrame(raf); const s = S[cur], t0 = performance.now(), dur = s.t * 1000 * (s.t > 10 ? .15 : 1);
    const tick = now => { const k = Math.min(1, (now - t0) / dur); const left_ = Math.ceil(s.t * (1 - k)); num.textContent = left_; arc.style.strokeDashoffset = C * k; arc.setAttribute('stroke', k > .6 ? '#ef4136' : '#ffd400'); if (k < 1) raf = requestAnimationFrame(tick); else { num.textContent = '0'; v.className = 'verdict bad'; v.innerHTML = `<strong>Time!</strong>${S[cur].text}`; } };
    raf = requestAnimationFrame(tick);
  };
  set('gk');
}

/* ------------------------------------------------ set pieces */
function setpieces(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...OPT, label: 'Set-piece setups' });
  const box = [70, -3, 38, W + 6];
  const GKd = { ...P('gk', 'GK', 104.2, MID), team: 'k' };
  sceneSwitcher(stage, d, {
    zonal: { chip: 'Corner — zonal', title: 'Corner kick: zonal marking', about: 'Defenders guard spaces — usually a line along the six-yard box plus the near post — and attack the ball when it arrives in their zone.', view: box, ball: { holder: 'K' },
      players: [{ ...P('K', 'K', L, W - .5), team: 'o' }, ...team([P('a1', '', 93, 30), P('a2', '', 92, 38), P('a3', '', 95, 44), P('a4', '', 90, 24), P('a5', '', 88, 42)], 'o'), ...team([P('z1', '', 99.5, 26), P('z2', '', 99.5, 31), P('z3', '', 99.5, 36), P('z4', '', 99.5, 41), P('np', '', 103.5, 45), P('fp', '', 97, 20)], 'd'), GKd],
      zones: [{ shape: 'rect', x: 98, y: 24, w: 3.5, h: 20, tone: 'soft', label: 'ZONES', t: 0, fs: 1.1 }],
      paths: [{ kind: 'kick', from: 'K', toPt: [98.5, 35], t: .4, d: 1.1, bend: -.3 }, { who: 'a2', kind: 'route', pts: [[92, 38], [98, 35]], t: .5, d: 1 }],
      captions: [{ t: 0, text: 'Defenders hold zones along the six-yard box.' }, { t: .5, text: 'Inswinging delivery toward the penalty spot area…' }] },
    man: { chip: 'Corner — man', title: 'Corner kick: man marking', about: 'Each defender picks up one attacker and follows him. Clear responsibility — but a single lost duel (or a screen) frees a header.', view: box, ball: { holder: 'K' },
      players: [{ ...P('K', 'K', L, W - .5), team: 'o' }, ...team([P('a1', '', 93, 30), P('a2', '', 92, 38), P('a3', '', 95, 44), P('a4', '', 90, 24)], 'o'), ...team([P('m1', '', 94, 29), P('m2', '', 93, 37.2), P('m3', '', 96, 43.2), P('m4', '', 91, 23.5), P('np', '', 103.5, 45)], 'd'), GKd],
      paths: [{ who: 'a1', kind: 'route', pts: [[93, 30], [99, 34]], t: .4, d: 1 }, { who: 'm1', kind: 'move', pts: [[94, 29], [99.6, 33]], t: .45, d: 1 }, { who: 'a2', kind: 'route', pts: [[92, 38], [96, 40], [100, 38]], t: .4, d: 1, curve: true }, { who: 'm2', kind: 'move', pts: [[93, 37.2], [96, 39], [99, 37]], t: .5, d: 1.1, curve: true }, { kind: 'kick', from: 'K', to: 'a2', t: .5, d: 1, bend: -.3 }],
      captions: [{ t: 0, text: 'Every defender tracks an attacker.' }, { t: .8, text: 'Attackers use timed runs and blocks to lose their marker.' }] },
    wall: { chip: 'Free-kick wall', title: 'Direct free kick and the wall', about: 'Defenders must stand at least **9.15 m** from the ball. Attackers may not stand within 1 m of a wall of three or more defenders.', static: true, view: box,
      players: [{ ...P('K', 'K', 83, 28), team: 'o' }, ...team([P('w1', '', 83 + 8.6, 30.6), P('w2', '', 83 + 8.3, 31.8), P('w3', '', 83 + 8, 33), P('w4', '', 83 + 7.7, 34.2)], 'd'), GKd, ...team([P('a1', '', 89.2, 35.5)], 'o')],
      marks: [{ type: 'circle', x: 83.6, y: 28, r: 9.15, tone: 'dim' }, { type: 'line', x1: 83.6, y1: 28, x2: 91.8, y2: 32, tone: 'dim', label: '9.15 M', fs: 1, lx: 86, ly: 27 }], ball: { x: 83.9, y: 28.3, r: .6 } },
    pen: { chip: 'Penalty kick', title: 'Penalty kick', about: 'Kicker at the spot, 11 m out. The goalkeeper must have part of one foot on or in line with the goal line when the ball is kicked. Everyone else stays outside the area, behind the ball and 9.15 m away — hence the arc.', static: true, view: box,
      players: [{ ...P('K', 'K', 92.6, MID), team: 'o' }, GKd, ...team([P('a1', '', 86.8, 22), P('a2', '', 86.2, 47)], 'o'), ...team([P('d1', '', 86.8, 25), P('d2', '', 86.2, 44)], 'd')],
      ball: { x: 94, y: MID, r: .6 }, marks: [{ type: 'line', x1: 94, y1: MID + .5, x2: L, y2: MID + .5, tone: 'dim', label: '11 M', fs: 1, ly: MID + 2 }] }
  }, { label: 'Set piece' });
}

const MODS = { anatomy, formations, lanes, patterns, blocks, offside, restarts, setpieces };
export function mount(host, name) { const fn = MODS[name]; if (!fn) throw new Error('No soccer visual: ' + name); return fn(host); }
