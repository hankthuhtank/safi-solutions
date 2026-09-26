/* Sports Atlas — football visuals. Field units are yards: x runs goal-to-goal (goal lines at 10 and 110),
   y runs sideline to sideline (0–53⅓). The offense always attacks +x; play diagrams render "offense up". */
import { Diagram, sceneSwitcher } from '../diagram.js';

const W = 160 / 3, MID = W / 2, LOS = 45, HASH = 70.75 / 3;
const P = (id, label, d, y, info, o = {}) => ({ id, label, x: LOS + d, y, info, ...o });
const R = (d, y) => [LOS + d, y];
const VIEW = (back = 11, fwd = 29) => [LOS - back, -1.2, back + fwd, W + 2.4];
const h = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
/* Play diagrams are schematic across the field: the interior line is spread so every player is readable,
   and on phones the space toward the sidelines is compressed. Depth (x) is always to scale. */
const NARROW = matchMedia('(max-width: 640px)').matches;
const mapY = y => { const dy = y - MID, a = Math.abs(dy), sg = Math.sign(dy);
  const f = NARROW ? (a <= 7 ? a * 1.5 : 10.5 + (a - 7) * .36) : (a <= 6 ? a * 1.32 : a < 14 ? 7.92 + (a - 6) * (6.08 / 8) : a);
  return MID + sg * f; };
const PLAY = { sport: 'football', orient: 'v', mapY, r: NARROW ? .95 : .74 };

/* ------------------------------------------------ position library */
const INFO = {
  C: 'Center — snaps the ball and usually calls the protection.',
  G: 'Guard — interior lineman. Pulls on gap runs, anchors pass protection inside.',
  T: 'Tackle — edge lineman. Blocks the best pass rushers.',
  TE: 'Tight end — half lineman, half receiver. Blocks, then runs routes.',
  QB: 'Quarterback — takes the snap, reads the defense, throws or hands off.',
  RB: 'Running back — main ball carrier; also blocks and catches.',
  FB: 'Fullback — lead blocker in front of the running back.',
  X: 'Split end (X) — outside receiver on the line of scrimmage.',
  Z: 'Flanker (Z) — outside receiver set a yard off the line, free to motion.',
  SL: 'Slot receiver — lines up inside another receiver; can break either way.',
  DE: 'Defensive end — sets the edge and rushes the passer.',
  DT: 'Defensive tackle — controls interior gaps and collapses the pocket.',
  NT: 'Nose tackle — lines up over the center and eats double teams.',
  OLB: 'Outside linebacker — in a 3-4, a stand-up edge rusher.',
  ILB: 'Inside linebacker — reads the run, covers the middle.',
  MIKE: 'MIKE (middle linebacker) — makes the defensive calls, fills inside runs.',
  WILL: 'WILL (weak-side linebacker) — fast, chases plays away from the strength.',
  SAM: 'SAM (strong-side linebacker) — aligns to the tight end side.',
  CB: 'Cornerback — covers wide receivers.',
  NB: 'Nickel back — fifth defensive back, usually over the slot.',
  DB: 'Dime back — sixth defensive back for obvious passing downs.',
  FS: 'Free safety — deep middle; the last line of defense.',
  SS: 'Strong safety — plays closer to the box, supports the run.'
};
const ol = (d = -.8) => [P('LT', 'LT', d, MID - 2.6, INFO.T), P('LG', 'LG', d, MID - 1.3, INFO.G), P('C', 'C', d, MID, INFO.C), P('RG', 'RG', d, MID + 1.3, INFO.G), P('RT', 'RT', d, MID + 2.6, INFO.T)];
const withTeam = (arr, team) => arr.map(p => ({ team, ...p }));

/* Base formation: 11 personnel, shotgun, 2×2 (TE right) */
function gun2x2() {
  return withTeam([...ol(), P('TE', 'TE', -.9, MID + 3.9, INFO.TE), P('QB', 'QB', -5, MID, INFO.QB), P('RB', 'RB', -5.2, MID + 1.7, INFO.RB), P('X', 'X', -.8, 9.5, INFO.X), P('SL', 'SL', -1.5, 16.5, INFO.SL), P('Z', 'Z', -1.8, W - 9.5, INFO.Z)], 'o');
}

/* ------------------------------------------------ 1. field anatomy (layers) */
function anatomy(host) {
  const body = host.querySelector('.viz-body');
  const bar = h('div', 'chips layers'); body.append(bar);
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { sport: 'football', label: 'To-scale NFL field with toggleable layers', caption: false, controls: false });
  const marks = {
    zones: [
      { type: 'rect', x: 0, y: 0, w: 10, h: W, tone: 'good', label: 'END ZONE', fs: 1.6 },
      { type: 'rect', x: 110, y: 0, w: 10, h: W, tone: 'good', label: 'END ZONE', fs: 1.6 },
      { type: 'rect', x: 90, y: 0, w: 20, h: W, tone: 'hot', label: 'RED ZONE', fs: 1.5, ly: 5 },
      { type: 'rect', x: 10, y: 0, w: 20, h: W, tone: 'hot', label: 'RED ZONE (OPP.)', fs: 1.5, ly: 5 }
    ],
    dims: [
      { type: 'dim', x1: 0, y1: -4, x2: 120, y2: -4, tone: 'dim', label: NARROW ? '120 YD WITH END ZONES' : '120 YD — INCLUDING END ZONES', fs: 1.5, lx: NARROW ? 36 : undefined },
      { type: 'dim', x1: 10, y1: W + 3.6, x2: 110, y2: W + 3.6, tone: 'dim', label: '100 YD FIELD OF PLAY', fs: 1.5, lx: NARROW ? 84 : undefined },
      { type: 'dim', x1: 124.5, y1: 0, x2: 124.5, y2: W, tone: 'dim', label: '53⅓ YD', fs: 1.4 },
      { type: 'dim', x1: 65, y1: 0, x2: 65, y2: HASH, tone: 'dim', label: "70' 9\"", fs: 1.2, lx: 65, ly: 7 },
      { type: 'dim', x1: 54, y1: HASH, x2: 54, y2: W - HASH, tone: 'dim', label: "18' 6\"", fs: 1.1, lx: 50.5 },
      { type: 'dim', x1: 0, y1: W + 1.2, x2: 10, y2: W + 1.2, tone: 'dim', label: '10 YD', fs: 1.2, ly: W + 2.4 }
    ],
    scoring: [
      { type: 'line', x1: 95, y1: MID - 4, x2: 95, y2: MID + 4, tone: 'ltg', label: 'PAT SNAP · 15-YD LINE (33-YD KICK)', fs: 1.25, lx: 95, ly: MID - 5.6 },
      { type: 'line', x1: 108, y1: MID - 4, x2: 108, y2: MID + 4, tone: 'los', label: '2-PT TRY · 2-YD LINE', fs: 1.25, lx: 104, ly: MID + 5.6 }
    ]
  };
  const state = { zones: true, dims: true, scoring: false, hashes: true, arrows: true };
  const render = () => {
    d.load({ static: true, view: [-6, -8, 138, W + 14], rotate: true, marks: Object.keys(marks).flatMap(k => state[k] ? marks[k] : []) });
    d.layer('hashes', state.hashes); d.layer('arrows', state.arrows);
  };
  [['zones', 'Zones'], ['dims', 'Dimensions'], ['scoring', 'Scoring spots'], ['hashes', 'Hash marks'], ['arrows', 'Direction arrows']].forEach(([k, label]) => {
    const b = h('button', 'chip chip-toggle', label); b.type = 'button'; b.setAttribute('aria-pressed', String(state[k]));
    b.onclick = () => { state[k] = !state[k]; b.setAttribute('aria-pressed', String(state[k])); render(); };
    bar.append(b);
  });
  render();
}

/* ------------------------------------------------ 2. down & distance simulator */
function chains(host) {
  const body = host.querySelector('.viz-body');
  const wrap = h('div', 'viz-grid'); body.append(wrap);
  const left = h('div'); const right = h('div', 'tool'); wrap.append(left, right);
  const d = new Diagram(left, { sport: 'football', label: 'Drive simulator field', caption: false, controls: false });
  const st = { spot: 35, down: 1, togo: 10, score: 0, log: 'Your drive starts at your own 25 after a kickoff… actually the 35: kickoffs into the end zone come out to the 35 since 2025.' };
  st.spot = 45; // field x of the ball (own 35)
  const yardText = x => { const y = Math.round(x - 10); return y === 50 ? 'MIDFIELD' : y < 50 ? `OWN ${y}` : `OPP ${100 - y}`; };
  const readout = h('div', 'readout'); right.append(readout);
  const verdict = h('div', 'verdict'); right.append(verdict);
  const plays = h('div', 'chips'); right.append(plays);
  const fourth = h('div', 'chips'); right.append(fourth);
  const reset = (spot = 45, msg) => { st.spot = spot; st.down = 1; st.togo = Math.min(10, 110 - spot); st.log = msg; };
  const ordinal = n => ['1st', '2nd', '3rd', '4th'][n - 1];
  const zoneName = x => x >= 100 ? 'Goal-to-go range' : x >= 90 ? 'Red zone' : x >= 70 ? 'Four-down territory' : x > 20 ? 'Open field' : 'Backed up';
  function draw() {
    const ltg = Math.min(110, st.spot + st.togo);
    const goal = st.spot + st.togo >= 110;
    const marks = [
      { type: 'rect', x: 90, y: 0, w: 20, h: W, tone: 'hot', under: true },
      { type: 'line', x1: st.spot, y1: 0, x2: st.spot, y2: W, tone: 'los', label: 'LINE OF SCRIMMAGE', fs: 1.3, ly: W - 9 },
      goal ? null : { type: 'line', x1: ltg, y1: 0, x2: ltg, y2: W, tone: 'ltg', label: 'LINE TO GAIN', fs: 1.3, ly: 9 },
      { type: 'rect', x: st.spot - .7, y: -3.2, w: 1.4, h: 2.4, tone: 'zone', label: String(st.down), fs: 1.6 }
    ].filter(Boolean);
    d.load({ static: true, view: [-2, -5, 124, W + 8], marks, ball: { x: st.spot, y: MID, r: .75 }, players: [] });
    const fg = Math.round(110 - st.spot + 17);
    readout.innerHTML = `<div class="is-key"><small>Down & distance</small><b>${ordinal(st.down)} & ${goal ? 'Goal' : st.togo}</b></div><div><small>Ball on</small><b>${yardText(st.spot)}</b></div><div><small>Field goal try</small><b>${fg} yd</b></div><div><small>Zone</small><b style="font-size:20px">${zoneName(st.spot)}</b></div>`;
    verdict.className = 'verdict ' + (st.tone || 'mid');
    verdict.innerHTML = `<strong>${st.head || 'Your drive'}</strong>${st.log}`;
    fourth.style.display = st.down === 4 ? '' : 'none';
  }
  const apply = (gain, label) => {
    st.head = null; st.tone = 'mid';
    st.spot = Math.max(0, Math.min(110, st.spot + gain));
    if (st.spot >= 110) { st.score += 6; reset(45, `${label} — <b>Touchdown!</b> Six points (then a try for one or two). The next drive starts at your 35 after a touchback. Total: ${st.score}.`); st.head = 'Touchdown'; st.tone = 'ok'; return draw(); }
    if (st.spot <= 10) { reset(45, `${label} — tackled in your own end zone: a <b>safety</b>, two points for the defense, and you must free-kick it away.`); st.head = 'Safety'; st.tone = 'bad'; return draw(); }
    if (gain >= st.togo) { st.down = 1; st.togo = Math.min(10, 110 - st.spot); st.log = `${label} — that reaches the line to gain. <b>First down</b>: a fresh set of four downs.`; st.tone = 'ok'; st.head = 'First down'; return draw(); }
    st.togo -= gain; st.down++;
    if (st.down > 4) { reset(45, `${label} — short on fourth down. <b>Turnover on downs</b>: the other team takes over right here. (Reset to a new drive.)`); st.head = 'Turnover on downs'; st.tone = 'bad'; return draw(); }
    st.log = `${label}. Now ${ordinal(st.down)} & ${st.spot + st.togo >= 110 ? 'goal' : st.togo}.` + (st.down === 3 ? ' Third down is the “money down” — convert or you probably kick.' : st.down === 4 ? ' Fourth down: go for it, punt, or kick a field goal.' : '');
    draw();
  };
  [['Stuffed · 0', 0, 'Run stuffed at the line'], ['Run · +4', 4, 'Inside run for four'], ['Run · +7', 7, 'Outside run for seven'], ['Short pass · +9', 9, 'Completed pass for nine'], ['Deep shot · +28', 28, 'Deep completion for twenty-eight'], ['Incomplete', 0, 'Incomplete pass — the clock stops'], ['Sack · −7', -7, 'Quarterback sacked for a loss of seven'], ['Penalty on D · +5', 5, 'Defensive offside, five yards']].forEach(([t, g, l]) => {
    const b = h('button', 'chip', t); b.type = 'button';
    b.onclick = () => { if (t.startsWith('Penalty')) { st.spot += 5; const ng = st.togo - 5; st.togo = ng <= 0 ? Math.min(10, 110 - st.spot) : ng; if (ng <= 0) st.down = 1; st.log = 'Defensive offside: five yards, <b>replay the down</b> (penalties don’t use a down).'; st.head = 'Flag'; st.tone = 'mid'; return draw(); } apply(g, l); };
    plays.append(b);
  });
  [['Go for it', null], ['Punt', 'punt'], ['Field goal', 'fg']].forEach(([t, k]) => {
    const b = h('button', 'chip chip-toggle', t); b.type = 'button';
    b.onclick = () => {
      if (!k) { st.log = 'You’re going for it — pick a play above.'; st.head = 'Fourth-down decision'; return draw(); }
      if (k === 'punt') { const net = Math.min(40, 110 - st.spot - 10); reset(45, `Punt of about ${Math.round(net + 2)} yards: possession flips, but the opponent starts deep. Field position is the prize. (New drive.)`); st.head = 'Punt'; return draw(); }
      const dist = Math.round(110 - st.spot + 17);
      const tier = dist <= 39 ? 'a routine kick for NFL kickers' : dist <= 49 ? 'a makeable kick most of the time' : dist <= 55 ? 'a long kick — good kickers make most of these' : dist <= 62 ? 'a very long kick — often a coin flip' : 'beyond almost every kicker’s range';
      st.score += dist <= 62 ? 3 : 0;
      reset(45, `A <b>${dist}-yard</b> field goal attempt (ball spot + 10-yard end zone + 7-yard hold) is ${tier}. ${dist <= 62 ? 'It’s good — three points. Total: ' + st.score + '.' : 'Short. Opponent takes over at the spot of the kick.'}`);
      st.head = 'Field goal'; st.tone = dist <= 62 ? 'ok' : 'bad'; draw();
    };
    fourth.append(b);
  });
  const hint = h('p', 'kicker', 'Try it: run a drive from your own 35. Reach the yellow line in four downs and you get four more.'); right.append(hint);
  st.log = 'The ball is on your own 35 — where a kickoff touchback now comes out. Pick a play.'; st.head = '1st & 10';
  draw();
}

/* ------------------------------------------------ 3. offense positions */
function offense(host) {
  const body = host.querySelector('.viz-body');
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...PLAY, label: 'Offensive formation: 11 personnel shotgun', caption: false, controls: false });
  const groups = { all: null, line: ['LT', 'LG', 'C', 'RG', 'RT'], backs: ['QB', 'RB'], receivers: ['X', 'SL', 'Z', 'TE'], eligible: ['X', 'SL', 'Z', 'TE', 'RB'] };
  const bar = h('div', 'chips'); stage.before(bar);
  const info = h('p', 'scene-info'); stage.after(info);
  const text = { all: 'Tap any player. Seven must be on the line of scrimmage at the snap; the five linemen wear numbers 50–79 and cannot catch a forward pass.', line: '<b>Offensive line (5):</b> tackle–guard–center–guard–tackle. They are “ineligible” receivers.', backs: '<b>Backfield:</b> the quarterback 5 yards deep in shotgun, the running back beside him.', receivers: '<b>Receivers:</b> X on the line, Z and the slot off it, tight end attached to the line.', eligible: '<b>Eligible receivers (5):</b> the players allowed to catch a forward pass — the two players on the ends of the line plus everyone in the backfield.' };
  const show = k => {
    bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === k)));
    const players = gun2x2().map(p => ({ ...p, hl: groups[k]?.includes(p.id), ghost: groups[k] && !groups[k].includes(p.id) }));
    d.load({ static: true, view: VIEW(8, 9), players, marks: [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }], ball: { x: LOS, y: MID, r: .45 } });
    info.innerHTML = text[k];
  };
  [['all', 'Everyone'], ['line', 'Offensive line'], ['backs', 'Backfield'], ['receivers', 'Receivers'], ['eligible', 'Eligible receivers']].forEach(([k, t]) => { const b = h('button', 'chip', t); b.type = 'button'; b.dataset.k = k; b.onclick = () => show(k); bar.append(b); });
  show('all');
}

/* ------------------------------------------------ 4. defense packages */
function defensePkgs() {
  const off = gun2x2().map(p => ({ ...p, ghost: true, info: null }));
  const dl43 = [P('DE', 'DE', 1, MID - 4.3, INFO.DE), P('DT', 'DT', 1, MID - .75, INFO.DT), P('DT2', 'DT', 1, MID + 1.95, INFO.DT), P('DE2', 'DE', 1, MID + 5.1, INFO.DE)];
  const base43 = [...dl43, P('WILL', 'W', 5, MID - 3.6, INFO.WILL), P('MIKE', 'M', 5, MID + .4, INFO.MIKE), P('SAM', 'S', 4.2, MID + 4.6, INFO.SAM), P('CB', 'CB', 6.5, 9.5, INFO.CB), P('CB2', 'CB', 6.5, W - 9.5, INFO.CB), P('FS', 'FS', 12.5, MID - 8, INFO.FS), P('SS', 'SS', 11.5, MID + 8, INFO.SS)];
  const base34 = [P('DE', 'DE', 1, MID - 2.6, INFO.DE), P('NT', 'NT', 1, MID, INFO.NT), P('DE2', 'DE', 1, MID + 2.6, INFO.DE), P('OLB', 'OLB', 1.2, MID - 5.1, INFO.OLB), P('OLB2', 'OLB', 1.2, MID + 5.9, INFO.OLB), P('ILB', 'ILB', 5, MID - 2, INFO.ILB), P('ILB2', 'ILB', 5, MID + 2, INFO.ILB), P('CB', 'CB', 6.5, 9.5, INFO.CB), P('CB2', 'CB', 6.5, W - 9.5, INFO.CB), P('FS', 'FS', 12.5, MID - 8, INFO.FS), P('SS', 'SS', 11.5, MID + 8, INFO.SS)];
  const nickel = [...dl43, P('WILL', 'W', 5, MID - 2.2, INFO.WILL), P('MIKE', 'M', 5, MID + 2, INFO.MIKE), P('NB', 'NB', 5, 16.5, INFO.NB), P('CB', 'CB', 6.5, 9.5, INFO.CB), P('CB2', 'CB', 6.5, W - 9.5, INFO.CB), P('FS', 'FS', 12.5, MID - 8.5, INFO.FS), P('SS', 'SS', 12.5, MID + 8.5, INFO.SS)];
  const dime = [...dl43, P('MIKE', 'M', 5.5, MID, INFO.MIKE), P('NB', 'NB', 5, 16.5, INFO.NB), P('DB', 'DB', 5.5, MID + 5.5, INFO.DB), P('CB', 'CB', 6.5, 9.5, INFO.CB), P('CB2', 'CB', 6.5, W - 9.5, INFO.CB), P('FS', 'FS', 12.5, MID - 8.5, INFO.FS), P('SS', 'SS', 12.5, MID + 8.5, INFO.SS)];
  const mk = (list, title, about) => ({ static: true, view: VIEW(8, 16), title, about, players: [...off, ...withTeam(list, 'd')], marks: [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }] });
  return {
    base43: { chip: '4-3 base', ...mk(base43, '4-3 base', 'Four down linemen, three linebackers (SAM, MIKE, WILL), four defensive backs. Built to stop the run against heavier offenses.') },
    base34: { chip: '3-4 base', ...mk(base34, '3-4 base', 'Three down linemen with two stand-up outside linebackers who can rush or drop. The offense has to guess where the fourth rusher comes from.') },
    nickel: { chip: 'Nickel (4-2-5)', ...mk(nickel, 'Nickel — the modern default', 'A fifth defensive back (the nickel) replaces a linebacker to cover the slot receiver. Most NFL snaps are now played in nickel or dime.') },
    dime: { chip: 'Dime (4-1-6)', ...mk(dime, 'Dime', 'Six defensive backs for obvious passing downs such as 3rd & long. Faster, but lighter against the run.') }
  };
}
function defense(host) {
  const body = host.querySelector('.viz-body');
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...PLAY, label: 'Defensive packages', caption: false, controls: false });
  sceneSwitcher(stage, d, defensePkgs(), { label: 'Defensive package', noAutoplay: true });
}

/* ------------------------------------------------ 5. personnel & formations */
function personnel(host) {
  const body = host.querySelector('.viz-body');
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...PLAY, label: 'Personnel groupings and formations', caption: false, controls: false });
  const base = extra => withTeam([...ol(), ...extra], 'o');
  const L = [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }];
  const sc = (chip, title, about, extra) => ({ chip, title, about, static: true, view: VIEW(10, 8), players: base(extra), marks: L, ball: { x: LOS, y: MID, r: .45 } });
  const scenes = {
    p11: sc('11 · Gun 2×2', '11 personnel — shotgun, 2×2', '1 RB · 1 TE · 3 WR. Balanced: two receivers each side. It can run or pass without substituting, which is why it is the NFL’s most-used package.', [P('TE', 'TE', -.9, MID + 3.9, INFO.TE), P('QB', 'QB', -5, MID, INFO.QB), P('RB', 'RB', -5.2, MID - 1.7, INFO.RB), P('X', 'X', -.8, 9.5, INFO.X), P('SL', 'SL', -1.5, 16.5, INFO.SL), P('Z', 'Z', -1.8, W - 9.5, INFO.Z)]),
    trips: sc('11 · Trips', '11 personnel — trips right', 'Three eligible receivers to one side forces the defense to declare how it will handle the overload.', [P('TE', 'TE', -.9, MID + 3.9, INFO.TE), P('QB', 'QB', -5, MID, INFO.QB), P('RB', 'RB', -5.2, MID - 1.7, INFO.RB), P('X', 'X', -.8, 9.5, INFO.X), P('SL', 'SL', -1.5, W - 16, INFO.SL), P('Z', 'Z', -1.8, W - 9.5, INFO.Z)]),
    bunch: sc('11 · Bunch', '11 personnel — bunch', 'Three receivers stacked tightly. Their releases cross, so man-to-man defenders get picked in traffic.', [P('QB', 'QB', -5, MID, INFO.QB), P('RB', 'RB', -5.2, MID - 1.7, INFO.RB), P('X', 'X', -.8, 9.5, INFO.X), P('TE', 'TE', -.9, MID + 9.5, INFO.TE), P('SL', 'SL', -2.2, MID + 10.8, INFO.SL), P('Z', 'Z', -2.2, MID + 8.2, INFO.Z)]),
    p12: sc('12 · Singleback', '12 personnel — singleback', '1 RB · 2 TE · 2 WR. Heavier, so defenses must respect the run — perfect for play-action.', [P('TE', 'TE', -.9, MID + 3.9, INFO.TE), P('TE2', 'TE', -1.8, MID - 4.3, INFO.TE), P('QB', 'QB', -1.3, MID, INFO.QB), P('RB', 'RB', -7, MID, INFO.RB), P('X', 'X', -.8, 10, INFO.X), P('Z', 'Z', -1.8, W - 10, INFO.Z)]),
    p21: sc('21 · I-formation', '21 personnel — I-formation', '2 RB · 1 TE · 2 WR. The fullback lines up in front of the tailback: a classic downhill run look.', [P('TE', 'TE', -.9, MID + 3.9, INFO.TE), P('QB', 'QB', -1.3, MID, INFO.QB), P('FB', 'FB', -4.5, MID, INFO.FB), P('RB', 'RB', -7, MID, INFO.RB), P('X', 'X', -.8, 10, INFO.X), P('Z', 'Z', -1.8, W - 10, INFO.Z)]),
    p13: sc('13 · Heavy', '13 personnel — heavy', '1 RB · 3 TE · 1 WR. Goal line and short yardage: extra blockers, but still three players who can catch.', [P('TE', 'TE', -.9, MID + 3.9, INFO.TE), P('TE2', 'TE', -.9, MID - 3.9, INFO.TE), P('TE3', 'TE', -1.8, MID + 5.2, INFO.TE), P('QB', 'QB', -1.3, MID, INFO.QB), P('RB', 'RB', -7, MID, INFO.RB), P('X', 'X', -.8, 12, INFO.X)]),
    p10: sc('10 · Empty', '10 personnel — empty', '1 RB · 0 TE · 4 WR, with the back split out wide: five receivers, five blockers. The defense must show its coverage — but there is no one extra to pick up a blitz.', [P('QB', 'QB', -5, MID, INFO.QB), P('RB', 'RB', -1.5, MID + 6, INFO.RB), P('X', 'X', -.8, 8.5, INFO.X), P('SL', 'SL', -1.5, 15.5, INFO.SL), P('SL2', 'SL', -1.5, W - 15.5, INFO.SL), P('Z', 'Z', -.8, W - 8.5, INFO.Z)]),
    pistol: sc('20 · Pistol', '20 personnel — pistol', '2 RB · 0 TE · 3 WR. Quarterback 4 yards deep with a back directly behind him: downhill runs and read-option from the same look.', [P('QB', 'QB', -4, MID, INFO.QB), P('RB', 'RB', -6.8, MID, INFO.RB), P('RB2', 'H', -4, MID + 2.4, INFO.FB), P('X', 'X', -.8, 9.5, INFO.X), P('SL', 'SL', -1.5, W - 16.5, INFO.SL), P('Z', 'Z', -.8, W - 9.5, INFO.Z)])
  };
  sceneSwitcher(stage, d, scenes, { label: 'Personnel', noAutoplay: true });
}

/* ------------------------------------------------ run concepts */
const defFront43 = (o = {}) => withTeam([P('DE', 'DE', 1, MID - 4.2, INFO.DE), P('DT', 'DT', 1, MID - .7, INFO.DT), P('DT2', 'DT', 1, MID + 1.95, INFO.DT), P('DE2', 'DE', 1, MID + 5.2, INFO.DE), P('WILL', 'W', 5, MID - 3.4), P('MIKE', 'M', 5, MID + .4), P('SAM', 'S', 4.5, MID + 4.8), P('SS', 'SS', 8.5, MID + 8.5), P('CB', 'CB', 6, 10), P('CB2', 'CB', 6, W - 10), P('FS', 'FS', 12.5, MID - 5)], 'd').map(p => ({ ...p, ghost: !(o.keep || []).includes(p.id), info: null }));
function runScenes() {
  const I = extra => withTeam([...ol(), P('TE', 'TE', -.9, MID + 3.9, INFO.TE), ...extra, P('X', 'X', -.8, 10, INFO.X), P('Z', 'Z', -1.8, W - 10, INFO.Z)], 'o');
  const under = [P('QB', 'QB', -1.3, MID, INFO.QB), P('RB', 'RB', -7, MID, INFO.RB)];
  const blk = (id, from, to, t = .2, d = .7) => ({ who: id, kind: 'block', pts: [from, to], t, d });
  const L = [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }];
  const v = VIEW(9, 14);
  return {
    iz: { chip: 'Inside zone', title: 'Inside zone', about: 'Every lineman steps the same way and blocks whoever enters his area. The back presses the guard’s hip and reads the defense for a cut — often back against the grain.', beats: 'Fast, flowing linebackers who over-pursue.', weak: 'A penetrating defensive tackle who knocks the line backward.', view: v, marks: L, ball: { holder: 'QB' },
      players: [...I(under), ...defFront43({ keep: ['DE', 'DT', 'DT2', 'DE2', 'MIKE', 'WILL', 'SAM'] })],
      paths: [blk('LT', R(-.8, MID - 2.6), R(.6, MID - 1.9)), blk('LG', R(-.8, MID - 1.3), R(.6, MID - .7)), blk('C', R(-.8, MID), R(.6, MID + .9)), blk('RG', R(-.8, MID + 1.3), R(.6, MID + 2)), blk('RT', R(-.8, MID + 2.6), R(.7, MID + 4.4)), blk('TE', R(-.9, MID + 3.9), R(3.8, MID + 4.8)),
        { kind: 'handoff', from: 'QB', to: 'RB', t: .8 }, { who: 'QB', kind: 'drop', pts: [R(-1.3, MID), R(-4, MID - 1.2)], t: .1, d: .8, arrow: 'none' },
        { who: 'RB', kind: 'run', pts: [R(-7, MID), R(-2, MID + 1.3), R(1.5, MID + 1.5), R(6, MID - .6), R(12, MID - 2)], curve: true, t: .2, d: 2.4 }],
      captions: [{ t: 0, text: 'Snap. The whole line steps right together — zone blocking.' }, { t: .9, text: 'Handoff. The back aims at the right guard’s outside hip.' }, { t: 1.6, text: 'The linebackers flowed hard, so he cuts back into the vacated gap.' }] },
    oz: { chip: 'Outside zone', title: 'Outside zone (stretch)', about: 'The line runs laterally and tries to reach the defenders’ outside shoulders. The back reads the edge: bounce outside, cut up the seam, or cut back.', beats: 'Defenses that cannot run sideline to sideline.', weak: 'An edge defender who wins outside and forces the back to cut too early.', view: v, marks: L, ball: { holder: 'QB' },
      players: [...I(under), ...defFront43({ keep: ['DE', 'DT', 'DT2', 'DE2', 'MIKE', 'SAM'] })],
      paths: [blk('LT', R(-.8, MID - 2.6), R(.3, MID - .5)), blk('LG', R(-.8, MID - 1.3), R(.4, MID + .6)), blk('C', R(-.8, MID), R(.5, MID + 1.8)), blk('RG', R(-.8, MID + 1.3), R(.5, MID + 3)), blk('RT', R(-.8, MID + 2.6), R(.6, MID + 5.4)), blk('TE', R(-.9, MID + 3.9), R(1.4, MID + 6.8)),
        { kind: 'handoff', from: 'QB', to: 'RB', t: .75 }, { who: 'QB', kind: 'drop', pts: [R(-1.3, MID), R(-3.6, MID + 1.4)], t: .1, d: .7, arrow: 'none' },
        { who: 'RB', kind: 'run', pts: [R(-7, MID), R(-4.6, MID + 3.4), R(-1.2, MID + 6.8), R(4, MID + 8.2), R(12, MID + 9)], curve: true, t: .2, d: 2.5 }],
      captions: [{ t: 0, text: 'Everyone steps playside and tries to reach the outside shoulder.' }, { t: .9, text: 'The back aims at the tight end’s outside hip…' }, { t: 1.7, text: '…and the edge is sealed, so he bounces outside and turns upfield.' }] },
    power: { chip: 'Power', title: 'Power (gap scheme)', about: 'Playside linemen block down on the man inside them; the backside guard pulls and leads through the hole. It creates an extra blocker exactly where the ball is going.', beats: 'Defenses that are one blocker short at the point of attack.', weak: 'A defender who “spills” the puller or penetrates behind the pull.', view: v, marks: L, ball: { holder: 'QB' },
      players: [...I([P('QB', 'QB', -1.3, MID, INFO.QB), P('FB', 'FB', -4.5, MID, INFO.FB), P('RB', 'RB', -7, MID, INFO.RB)]), ...defFront43({ keep: ['DE', 'DT', 'DT2', 'DE2', 'MIKE', 'SAM', 'WILL'] })],
      paths: [blk('RT', R(-.8, MID + 2.6), R(.8, MID + 2.1)), blk('RG', R(-.8, MID + 1.3), R(.8, MID + .1)), blk('C', R(-.8, MID), R(.7, MID - 1.1)), blk('LT', R(-.8, MID - 2.6), R(.4, MID - 3.6)), blk('TE', R(-.9, MID + 3.9), R(.9, MID + 4.9)),
        { who: 'LG', kind: 'block', pts: [R(-.8, MID - 1.3), R(-2, MID - .6), R(-1.8, MID + 2.2), R(1.3, MID + 3.2), R(4.4, MID + 3.4)], curve: true, t: .15, d: 1.3 },
        { who: 'FB', kind: 'block', pts: [R(-4.5, MID), R(-.5, MID + 3.8), R(1.1, MID + 5.4)], curve: true, t: .2, d: .9 },
        { kind: 'handoff', from: 'QB', to: 'RB', t: .85 }, { who: 'QB', kind: 'drop', pts: [R(-1.3, MID), R(-3.6, MID - 1)], t: .1, d: .7, arrow: 'none' },
        { who: 'RB', kind: 'run', pts: [R(-7, MID), R(-3.4, MID + 1.6), R(.6, MID + 3.2), R(6, MID + 3.5), R(12, MID + 3)], curve: true, t: .35, d: 2.3 }],
      captions: [{ t: 0, text: 'Playside linemen block down. The fullback kicks out the end.' }, { t: .5, text: 'The backside guard pulls behind the line…' }, { t: 1.3, text: '…and leads up through the hole for the linebacker. The back follows him.' }] },
    counter: { chip: 'Counter', title: 'Counter (GT counter)', about: 'Misdirection: the back takes a step one way while the guard and tackle from the other side pull back across. The guard kicks out the end, the tackle wraps up to the linebacker.', beats: 'Aggressive linebackers who fly to the first movement.', weak: 'Slow pullers — the timing has to be perfect.', view: v, marks: L, ball: { holder: 'QB' },
      players: [...I(under), ...defFront43({ keep: ['DE', 'DT', 'DT2', 'DE2', 'MIKE', 'SAM', 'WILL'] })],
      paths: [blk('RT', R(-.8, MID + 2.6), R(.8, MID + 2.1)), blk('RG', R(-.8, MID + 1.3), R(.8, MID + .1)), blk('C', R(-.8, MID), R(.7, MID - 1.1)), blk('TE', R(-.9, MID + 3.9), R(.8, MID + 4.9)),
        { who: 'LG', kind: 'block', pts: [R(-.8, MID - 1.3), R(-2.1, MID - .4), R(-1.9, MID + 3.6), R(.9, MID + 5.4)], curve: true, t: .15, d: 1.1 },
        { who: 'LT', kind: 'block', pts: [R(-.8, MID - 2.6), R(-2.4, MID - 1.6), R(-2, MID + 2.4), R(1.6, MID + 3.4), R(4.6, MID + 1.6)], curve: true, t: .2, d: 1.4 },
        { kind: 'handoff', from: 'QB', to: 'RB', t: 1 }, { who: 'QB', kind: 'drop', pts: [R(-1.3, MID), R(-3.8, MID - 1.3)], t: .1, d: .8, arrow: 'none' },
        { who: 'RB', kind: 'run', pts: [R(-7, MID), R(-6.4, MID - 1.6), R(-3.4, MID + .9), R(.8, MID + 3), R(6, MID + 3), R(12, MID + 2)], curve: true, t: .2, d: 2.6 }],
      captions: [{ t: 0, text: 'The back jab-steps left — the linebackers bite.' }, { t: .6, text: 'Left guard and left tackle pull across the formation.' }, { t: 1.4, text: 'Guard kicks out the end, tackle leads through for the linebacker, back follows.' }] },
    option: { chip: 'Read option', title: 'Zone read (read option)', about: 'The offense leaves the backside defensive end unblocked on purpose. The quarterback reads him: if he crashes on the running back, the QB keeps it; if he stays home, the QB hands off.', beats: 'An end who chases the running back.', weak: 'A disciplined end plus a scraping linebacker who takes the quarterback.', view: v, marks: L, ball: { holder: 'QB' },
      players: [...withTeam([...ol(), P('TE', 'TE', -.9, MID + 3.9, INFO.TE), P('QB', 'QB', -5, MID, INFO.QB), P('RB', 'RB', -5.2, MID - 1.7, INFO.RB), P('X', 'X', -.8, 10, INFO.X), P('Z', 'Z', -1.8, W - 10, INFO.Z)], 'o'), ...defFront43({ keep: ['DE', 'DT', 'DT2', 'DE2', 'MIKE', 'WILL'] }).map(p => p.id === 'DE' ? { ...p, hl: true, ghost: false, label: 'READ' } : p)],
      paths: [blk('LG', R(-.8, MID - 1.3), R(.6, MID - .2)), blk('C', R(-.8, MID), R(.6, MID + 1)), blk('RG', R(-.8, MID + 1.3), R(.6, MID + 2.1)), blk('RT', R(-.8, MID + 2.6), R(.7, MID + 4.4)), blk('TE', R(-.9, MID + 3.9), R(3.6, MID + 4.5)), { who: 'LT', kind: 'block', pts: [R(-.8, MID - 2.6), R(3.8, MID - 3)], t: .2, d: .9 },
        { who: 'DE', kind: 'move', pts: [R(1, MID - 4.2), R(-1.6, MID - 1.8), R(-3.6, MID + .2)], t: .2, d: 1.2, curve: true },
        { who: 'RB', kind: 'route', pts: [R(-5.2, MID - 1.7), R(-4.8, MID + 1), R(-2.6, MID + 3)], t: .25, d: 1.1, curve: true },
        { who: 'QB', kind: 'run', pts: [R(-5, MID), R(-4.4, MID - 3.4), R(-.5, MID - 7.6), R(5, MID - 10.4), R(12, MID - 11.4)], curve: true, t: 1.2, d: 2.1 }],
      captions: [{ t: 0, text: 'The left defensive end is left unblocked. The quarterback reads him.' }, { t: .7, text: 'He crashes down on the running back…' }, { t: 1.3, text: '…so the quarterback pulls the ball and keeps it around the vacated edge.' }] },
    toss: { chip: 'Toss', title: 'Toss / sweep', about: 'Get the ball to the edge fast. The pitch saves a second compared with a handoff, and blockers seal defenders inside.', beats: 'Defenses squeezed inside against heavy formations.', weak: 'A fast edge defender or cornerback who sets the edge.', view: v, marks: L, ball: { holder: 'QB' },
      players: [...I(under), ...defFront43({ keep: ['DE2', 'SAM', 'CB2', 'MIKE'] })],
      paths: [blk('RT', R(-.8, MID + 2.6), R(.4, MID + 4)), blk('TE', R(-.9, MID + 3.9), R(.8, MID + 6.4)), blk('RG', R(-.8, MID + 1.3), R(.8, MID + 3)), blk('C', R(-.8, MID), R(.6, MID + 1.6)), { who: 'Z', kind: 'block', pts: [R(-1.8, W - 10), R(4.8, W - 11.2)], t: .2, d: .8, arrow: 'tee' },
        { kind: 'toss', from: 'QB', to: 'RB', t: .4, d: .45 }, { who: 'QB', kind: 'drop', pts: [R(-1.3, MID), R(-2.8, MID + 1.6)], t: .1, d: .5, arrow: 'none' },
        { who: 'RB', kind: 'run', pts: [R(-7, MID), R(-6.3, MID + 4.4), R(-3, MID + 9.4), R(3, MID + 12), R(12, MID + 13)], curve: true, t: .15, d: 2.3 }],
      captions: [{ t: 0, text: 'The quarterback pitches the ball to the back running wide.' }, { t: .9, text: 'Tight end and receiver seal the edge defenders inside.' }, { t: 1.6, text: 'The back turns the corner outside the block.' }] }
  };
}
function runs(host) { const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage); const d = new Diagram(stage, { ...PLAY, label: 'Animated run concepts' }); sceneSwitcher(stage, d, runScenes(), { label: 'Run concept' }); }

/* ------------------------------------------------ route tree */
function routetree(host) {
  const body = host.querySelector('.viz-body');
  const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { sport: 'football', orient: 'v', r: NARROW ? .95 : .8, label: 'Numbered route tree', caption: false });
  const y0 = W - 12, d0 = -.8; // right-side receiver; outside = +y, inside = −y
  const T = (dd, dy) => R(d0 + dd, y0 + dy);
  const routes = [
    ['1', 'Flat', [T(0, 0), T(2, .8), T(3, 5.5)], 'Quick release, then flatten toward the sideline at 2–3 yards.'],
    ['2', 'Slant', [T(0, 0), T(3, 0), T(8, -5)], 'Three hard steps, then 45° inside. Fast and hard to jam.'],
    ['3', 'Comeback', [T(0, 0), T(15, 0), T(12.5, 2.5)], 'Sell deep to 15 yards, then come back toward the sideline.'],
    ['4', 'Curl', [T(0, 0), T(12, 0), T(10.5, -1.4)], 'Push to 12 yards, turn back inside to the quarterback.'],
    ['5', 'Out', [T(0, 0), T(10, 0), T(10, 5)], 'Square break to the sideline at about 10 yards. A timing throw.'],
    ['6', 'Dig / in', [T(0, 0), T(12, 0), T(12, -10)], 'Square break inside at 12–15 yards, into the window behind linebackers.'],
    ['7', 'Corner', [T(0, 0), T(11, 0), T(19, 5.5)], 'Stem to 11 yards, then 45° to the back pylon. Beats the flat defender.'],
    ['8', 'Post', [T(0, 0), T(11, 0), T(21, -8)], 'Stem to 11 yards, then 45° toward the goalpost — into the deep middle.'],
    ['9', 'Go / fly', [T(0, 0), T(26, 0)], 'Straight vertical: run past the defender.']
  ];
  const info = h('div', 'scene-info'); stage.after(info);
  const bar = h('div', 'chips'); stage.before(bar);
  const load = focus => {
    const paths = routes.map(([n, name, pts], i) => ({ kind: 'route', alt: focus === n, dim: focus && focus !== n, pts, t: focus ? 0 : i * .18, d: !focus ? .9 : focus === n ? 1.2 : .01, label: n, fs: 1.1, lox: 1.1 }));
    d.load({ view: [LOS - 4, W - 30, 32, 30.5], rotate: true, players: [{ id: 'WR', label: 'Z', team: 'o', x: LOS + d0, y: y0, info: 'The receiver. Odd numbers break outside, even numbers break inside.' }], paths, marks: [{ type: 'line', x1: LOS, y1: W - 30, x2: LOS, y2: W, tone: 'los' }, ...[5, 10, 15, 20].map(k => ({ type: 'line', x1: LOS + k, y1: W - 29.5, x2: LOS + k, y2: W - 27.5, tone: 'dim', label: k + ' YD', fs: .95, lx: LOS + k, ly: W - 26.3, pill: false }))] });
    const r = routes.find(x => x[0] === focus);
    info.innerHTML = r ? `<h4>${r[0]} · ${r[1]}</h4><p>${r[3]}</p>` : '<h4>The classic tree</h4><p><b>Odd numbers break toward the sideline, even numbers break inside.</b> A play call like “Z-9, X-6” tells two receivers their routes in two digits.</p>';
    d.play();
  };
  const all = h('button', 'chip', 'All routes'); all.type = 'button'; all.onclick = () => { bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b === all))); load(null); }; bar.append(all);
  routes.forEach(([n, name]) => { const b = h('button', 'chip', `${n} ${name}`); b.type = 'button'; b.onclick = () => { bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', String(x === b))); load(n); }; bar.append(b); });
  all.setAttribute('aria-selected', 'true'); load(null);
}

/* ------------------------------------------------ pass concepts */
function conceptScenes() {
  const O = (extra = []) => withTeam([...ol(), P('QB', 'QB', -5, MID, INFO.QB), ...extra], 'o');
  const L = [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }];
  const qb = (t = .2, d = .8) => ({ who: 'QB', kind: 'drop', pts: [R(-5, MID), R(-7.2, MID)], t, d, arrow: 'none' });
  const rt = (who, pts, t = .15, d = 1.6, n) => ({ who, kind: 'route', pts, t, d, curve: pts.length > 2, label: n, fs: .95, lox: .9 });
  const pass = (to, t, d = .7, bend = .6) => ({ kind: 'pass', from: 'QB', to, t, d, bend });
  const D = list => withTeam(list, 'd');
  const v = VIEW(9, 25);
  return {
    smash: { chip: 'Smash', title: 'Smash vs. Cover 2', about: 'A hitch underneath and a corner route over the top put the Cover 2 cornerback in a bind: he cannot cover both. Whatever he does, throw the other one.', beats: 'Cover 2 — the corner owns the flat, and the safety is too far inside.', weak: 'Cover 3 or quarters, where a deep defender sits over the corner route.', view: v, marks: L, ball: { holder: 'QB' },
      zones: [{ shape: 'rect', x: LOS + 12, y: 0, w: 16, h: W / 2, tone: 'deep', label: 'DEEP ½', t: .9 }, { shape: 'rect', x: LOS + 12, y: W / 2, w: 16, h: W / 2, tone: 'deep', label: 'DEEP ½', t: .9 }, { shape: 'rect', x: LOS + 1, y: W - 10, w: 10, h: 10, tone: 'under', label: 'FLAT', t: .9 }],
      players: [...O([P('RB', 'RB', -5.2, MID - 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, W - 16.5), P('Z', 'Z', -.8, W - 9.5), P('TE', 'TE', -.9, MID - 3.9)]), ...D([P('CB2', 'CB', 5, W - 9.8, null, { hl: true }), P('SS', 'S', 12, W - 13), P('FS', 'S', 12, 13), P('CB', 'CB', 5, 9.8)])],
      paths: [qb(), rt('Z', [R(-.8, W - 9.5), R(5, W - 9.5), R(4.2, W - 10.3)], .15, .9, '1'), rt('SL', [R(-1.5, W - 16.5), R(11, W - 16.5), R(17.5, W - 9.8)], .15, 1.6, '2'), rt('X', [R(-.8, 9.5), R(5, 9.5), R(4.2, 10.3)], .15, .9), rt('TE', [R(-.9, MID - 3.9), R(8, MID - 5.4), R(13, MID - 3)], .15, 1.3),
        { who: 'CB2', kind: 'move', pts: [R(5, W - 9.8), R(4.4, W - 10.4)], t: .6, d: .5 }, { who: 'SS', kind: 'move', pts: [R(12, W - 13), R(18, W - 16)], t: .5, d: 1.2 }, { who: 'FS', kind: 'move', pts: [R(12, 13), R(18, 16)], t: .5, d: 1.2 },
        pass('SL', 1.5, .75)],
      captions: [{ t: 0, text: 'Two-high safeties before the snap: likely Cover 2.' }, { t: .7, text: 'The cornerback squats on the hitch — he is the “conflict” defender.' }, { t: 1.5, text: 'So the quarterback throws the corner route over him, in front of the safety.' }] },
    flood: { chip: 'Flood', title: 'Flood (sail) vs. Cover 3', about: 'Three receivers attack one sideline at three depths — deep, intermediate and short. Cover 3 has only two defenders there, so one level is always open.', beats: 'Cover 3: the flat defender cannot cover the out and the flat.', weak: 'Quarters or man coverage that matches each receiver.', view: v, marks: L, ball: { holder: 'QB' },
      zones: [{ shape: 'rect', x: LOS + 12, y: 0, w: 16, h: W / 3, tone: 'deep', label: 'DEEP ⅓', t: .9 }, { shape: 'rect', x: LOS + 12, y: W / 3, w: 16, h: W / 3, tone: 'deep', label: 'DEEP ⅓', t: .9 }, { shape: 'rect', x: LOS + 12, y: 2 * W / 3, w: 16, h: W / 3, tone: 'deep', label: 'DEEP ⅓', t: .9 }, { shape: 'rect', x: LOS + 1, y: W - 13, w: 11, h: 13, tone: 'under', label: 'CURL-FLAT', t: .9 }],
      players: [...O([P('RB', 'RB', -5.2, MID + 1.7), P('X', 'X', -.8, 9.5), P('TE', 'TE', -.9, MID + 3.9), P('SL', 'SL', -1.5, W - 16.5), P('Z', 'Z', -.8, W - 9.5)]), ...D([P('CB2', 'CB', 6.5, W - 9.8), P('NB', 'N', 5, W - 17, null, { hl: true }), P('FS', 'S', 13, MID), P('CB', 'CB', 6.5, 9.8)])],
      paths: [qb(), rt('Z', [R(-.8, W - 9.5), R(24, W - 9)], .15, 1.8, '1'), rt('SL', [R(-1.5, W - 16.5), R(11, W - 16.2), R(13, W - 7)], .15, 1.6, '2'), rt('TE', [R(-.9, MID + 3.9), R(1.8, MID + 7.2), R(3.2, W - 4.5)], .2, 1.5, '3'), rt('X', [R(-.8, 9.5), R(12, 9.5), R(12, MID - 3)], .15, 1.5),
        { who: 'CB2', kind: 'move', pts: [R(6.5, W - 9.8), R(18, W - 8.5)], t: .4, d: 1.4 }, { who: 'NB', kind: 'move', pts: [R(5, W - 17), R(6, W - 9.2)], t: .6, d: 1 }, { who: 'FS', kind: 'move', pts: [R(13, MID), R(18, MID + 2)], t: .4, d: 1.2 },
        pass('SL', 1.65, .7)],
      captions: [{ t: 0, text: 'One deep safety: likely Cover 3. Attack the right sideline at three levels.' }, { t: .8, text: 'The flat defender widens to take the tight end in the flat…' }, { t: 1.6, text: '…which opens the out route between him and the deep-third corner.' }] },
    mesh: { chip: 'Mesh', title: 'Mesh vs. man coverage', about: 'Two receivers cross at about six yards, almost brushing shoulders. Man defenders chasing them run into traffic; zone defenders see two players cross their area at once.', beats: 'Man coverage — the crossers create natural (legal) rubs.', weak: 'Defenders who pass receivers off cleanly in zone.', view: v, marks: L, ball: { holder: 'QB' },
      players: [...O([P('RB', 'RB', -5.2, MID + 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 17), P('TE', 'TE', -.9, MID + 3.9), P('Z', 'Z', -.8, W - 9.5)]), ...D([P('CB', 'CB', 1.5, 9.5), P('NB', 'N', 2.5, 17, null, { hl: true }), P('LB', 'LB', 5, MID + 3.9, null, { hl: true }), P('CB2', 'CB', 1.5, W - 9.5), P('FS', 'S', 13, MID)])],
      paths: [qb(), rt('SL', [R(-1.5, 17), R(5.5, 22), R(6, W - 10)], .15, 1.7, '1'), rt('TE', [R(-.9, MID + 3.9), R(6.5, MID + 1), R(7, 8)], .15, 1.7, '2'), rt('X', [R(-.8, 9.5), R(12, 9.5), R(18, 13)], .15, 1.6), rt('Z', [R(-.8, W - 9.5), R(22, W - 9.5)], .15, 1.7), rt('RB', [R(-5.2, MID + 1.7), R(-3, W - 12), R(3, W - 5)], .2, 1.4, '3'),
        { who: 'NB', kind: 'move', pts: [R(2.5, 17), R(5.2, 23), R(5.6, MID + 1.6)], t: .25, d: 1.1, curve: true }, { who: 'LB', kind: 'move', pts: [R(5, MID + 3.9), R(6.2, MID + 1.6), R(6.4, MID - .4)], t: .25, d: 1.1, curve: true }, { who: 'CB', kind: 'move', pts: [R(1.5, 9.5), R(12, 10), R(17, 13.4)], t: .2, d: 1.6 }, { who: 'CB2', kind: 'move', pts: [R(1.5, W - 9.5), R(21, W - 9.8)], t: .2, d: 1.7 },
        pass('SL', 1.45, .6, .3)],
      captions: [{ t: 0, text: 'Press corners and no zone drops: this looks like man coverage.' }, { t: .8, text: 'The two crossers meet over the ball — their defenders collide in the traffic.' }, { t: 1.45, text: 'The slot comes out of the mesh wide open; throw it on the run.' }] },
    stick: { chip: 'Stick', title: 'Stick vs. Cover 3', about: 'A quick three-receiver triangle: an outside clear-out, a flat route and a “stick” at six yards that sits in the hole. The flat defender must pick one.', beats: 'Zone coverages with one underneath defender to that side.', weak: 'Hard-flat coverage plus a robbing linebacker.', view: v, marks: L, ball: { holder: 'QB' },
      zones: [{ shape: 'rect', x: LOS + 1, y: W - 13, w: 11, h: 13, tone: 'under', label: 'CURL-FLAT', t: .8 }, { shape: 'rect', x: LOS + 1, y: MID, w: 11, h: 13.3, tone: 'under', label: 'HOOK', t: .8 }],
      players: [...O([P('RB', 'RB', -5.2, MID - 1.7), P('X', 'X', -.8, 9.5), P('TE', 'TE', -.9, MID + 3.9), P('SL', 'SL', -1.5, W - 16.5), P('Z', 'Z', -.8, W - 9.5)]), ...D([P('NB', 'N', 5, W - 16.5, null, { hl: true }), P('LB', 'LB', 5, MID + 3), P('CB2', 'CB', 6.5, W - 9.8), P('FS', 'S', 13, MID)])],
      paths: [qb(.15, .5), rt('Z', [R(-.8, W - 9.5), R(20, W - 9.5)], .15, 1.6, '1'), rt('SL', [R(-1.5, W - 16.5), R(3, W - 13), R(3.6, W - 4)], .15, 1.1, '2'), rt('TE', [R(-.9, MID + 3.9), R(6, MID + 4.4), R(5.6, MID + 5.8)], .15, 1, '3'), rt('X', [R(-.8, 9.5), R(6, 9.5), R(5.6, 10.6)], .15, 1),
        { who: 'NB', kind: 'move', pts: [R(5, W - 16.5), R(4.6, W - 10)], t: .45, d: .8 }, { who: 'LB', kind: 'move', pts: [R(5, MID + 3), R(7.5, MID - 1.5)], t: .45, d: .9 }, { who: 'CB2', kind: 'move', pts: [R(6.5, W - 9.8), R(16, W - 9.6)], t: .35, d: 1.2 },
        pass('TE', 1.05, .45, .2)],
      captions: [{ t: 0, text: 'Quick game: three-step drop, ball out fast.' }, { t: .6, text: 'The flat defender jumps the flat route…' }, { t: 1.05, text: '…so the stick route sits down in the space he left. Easy completion.' }] },
    verts: { chip: 'Four verticals', title: 'Four verticals vs. Cover 3', about: 'Four receivers run straight up the field against three deep defenders. Someone has to cover two — usually the middle safety, who must choose a seam.', beats: 'Cover 3 and single-high safety looks.', weak: 'Quarters, where four deep defenders match four verticals.', view: VIEW(9, 29), marks: L, ball: { holder: 'QB' },
      zones: [{ shape: 'rect', x: LOS + 12, y: 0, w: 17, h: W / 3, tone: 'deep', label: 'DEEP ⅓', t: .8 }, { shape: 'rect', x: LOS + 12, y: W / 3, w: 17, h: W / 3, tone: 'deep', label: 'DEEP ⅓', t: .8 }, { shape: 'rect', x: LOS + 12, y: 2 * W / 3, w: 17, h: W / 3, tone: 'deep', label: 'DEEP ⅓', t: .8 }],
      players: [...O([P('RB', 'RB', -5.2, MID - 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 17.5), P('SL2', 'SL', -1.5, W - 17.5), P('Z', 'Z', -.8, W - 9.5)]), ...D([P('CB', 'CB', 7, 9.8), P('FS', 'S', 13, MID, null, { hl: true }), P('CB2', 'CB', 7, W - 9.8)])],
      paths: [qb(.2, 1), rt('X', [R(-.8, 9.5), R(26, 8)], .15, 1.9), rt('SL', [R(-1.5, 17.5), R(26, 19)], .15, 1.9, '1'), rt('SL2', [R(-1.5, W - 17.5), R(26, W - 19)], .15, 1.9, '2'), rt('Z', [R(-.8, W - 9.5), R(26, W - 8)], .15, 1.9), rt('RB', [R(-5.2, MID - 1.7), R(3, MID - 2.5)], .3, 1, '3'),
        { who: 'CB', kind: 'move', pts: [R(7, 9.8), R(23, 9)], t: .2, d: 1.8 }, { who: 'CB2', kind: 'move', pts: [R(7, W - 9.8), R(23, W - 9)], t: .2, d: 1.8 }, { who: 'FS', kind: 'move', pts: [R(13, MID), R(18, MID - 3.5)], t: .5, d: 1 },
        pass('SL2', 1.55, .85, .5)],
      captions: [{ t: 0, text: 'Four vertical routes against three deep defenders.' }, { t: .9, text: 'The single safety has to choose a seam — his eyes take him left.' }, { t: 1.55, text: 'Throw the opposite seam, away from the safety.' }] },
    levels: { chip: 'Levels', title: 'Levels vs. zone', about: 'Two in-breaking routes at different depths — one at 5, one at 12 — stack on top of a hook defender. If he drops, throw underneath; if he jumps up, throw behind him.', beats: 'Zone defenses with hook defenders.', weak: 'Man coverage with a robber in the middle.', view: v, marks: L, ball: { holder: 'QB' },
      zones: [{ shape: 'rect', x: LOS + 1, y: MID - 13, w: 11, h: 13, tone: 'under', label: 'HOOK', t: .8 }],
      players: [...O([P('RB', 'RB', -5.2, MID + 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 16.5), P('TE', 'TE', -.9, MID + 3.9), P('Z', 'Z', -.8, W - 9.5)]), ...D([P('LB', 'LB', 5, MID - 5, null, { hl: true }), P('CB', 'CB', 6, 9.8), P('FS', 'S', 13, MID)])],
      paths: [qb(), rt('X', [R(-.8, 9.5), R(12, 9.5), R(12, MID + 3)], .15, 1.7, '1'), rt('SL', [R(-1.5, 16.5), R(5, 16.5), R(5, MID + 2)], .15, 1.3, '2'), rt('Z', [R(-.8, W - 9.5), R(22, W - 9.5)], .15, 1.7), rt('TE', [R(-.9, MID + 3.9), R(10, MID + 4.6)], .15, 1.4),
        { who: 'LB', kind: 'move', pts: [R(5, MID - 5), R(4.6, MID - 2.2)], t: .6, d: .6 }, { who: 'CB', kind: 'move', pts: [R(6, 9.8), R(16, 10)], t: .3, d: 1.2 },
        pass('X', 1.5, .65)],
      captions: [{ t: 0, text: 'Two in-cuts, stacked five yards apart.' }, { t: .75, text: 'The hook defender jumps the shallow route.' }, { t: 1.5, text: 'The dig behind him is open.' }] },
    dagger: { chip: 'Dagger', title: 'Dagger vs. Cover 3', about: 'The slot runs a seam that clears out the deep middle; the outside receiver breaks in on a deep dig into the space the seam vacated.', beats: 'Single-high coverages where the seam pulls the safety.', weak: 'Two-high safeties who stay on top of the seam.', view: v, marks: L, ball: { holder: 'QB' },
      zones: [{ shape: 'rect', x: LOS + 12, y: W / 3, w: 16, h: W / 3, tone: 'deep', label: 'DEEP MIDDLE', t: .8 }],
      players: [...O([P('RB', 'RB', -5.2, MID + 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 16.5), P('TE', 'TE', -.9, MID + 3.9), P('Z', 'Z', -.8, W - 9.5)]), ...D([P('FS', 'S', 13, MID, null, { hl: true }), P('LB', 'LB', 5, MID - 4), P('CB', 'CB', 6.5, 9.8)])],
      paths: [qb(.2, 1), rt('SL', [R(-1.5, 16.5), R(24, 17.5)], .15, 1.8, '1'), rt('X', [R(-.8, 9.5), R(15, 9.5), R(15, MID + 2)], .15, 1.9, '2'), rt('TE', [R(-.9, MID + 3.9), R(4, MID + 6)], .2, 1, '3'), rt('Z', [R(-.8, W - 9.5), R(20, W - 9.5)], .15, 1.7),
        { who: 'FS', kind: 'move', pts: [R(13, MID), R(20, 18.5)], t: .4, d: 1.2 }, { who: 'LB', kind: 'move', pts: [R(5, MID - 4), R(9, MID - 5)], t: .4, d: 1 }, { who: 'CB', kind: 'move', pts: [R(6.5, 9.8), R(20, 9.4)], t: .3, d: 1.4 },
        pass('X', 1.75, .7)],
      captions: [{ t: 0, text: 'The slot’s seam threatens the deep middle.' }, { t: .9, text: 'The safety carries the seam…' }, { t: 1.75, text: '…and the deep dig breaks into the hole he left.' }] }
  };
}
function concepts(host) { const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage); const d = new Diagram(stage, { ...PLAY, label: 'Animated pass concepts' }); sceneSwitcher(stage, d, conceptScenes(), { label: 'Pass concept' }); }

/* ------------------------------------------------ protection */
function protection(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...PLAY, label: 'Pass protection counts' });
  const L = [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }];
  const rush = (list) => withTeam(list.map(([id, y, dd]) => P(id, id.replace(/\d/, ''), dd || 1, y)), 'd');
  const blk = (who, from, to, t = .15, d = .7) => ({ who, kind: 'block', pts: [from, to], t, d });
  const set = (who, y) => blk(who, R(-.8, y), R(-2.4, y));
  const olSet = () => [set('LT', MID - 2.6), set('LG', MID - 1.3), set('C', MID), set('RG', MID + 1.3), set('RT', MID + 2.6)];
  const v = VIEW(10, 12);
  return sceneSwitcher(stage, d, {
    five: { chip: '5-man', title: '5-man protection (empty)', about: 'Only the five linemen block. Five receivers go out — maximum options, minimum time. If the defense sends six, someone is unblocked and the ball must come out now (“hot”).', view: v, marks: L,
      players: [...withTeam([...ol(), P('QB', 'QB', -5, MID), P('RB', 'RB', -1.5, W - 16), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 17), P('Z', 'Z', -.8, W - 9.5), P('TE', 'TE', -.9, MID + 3.9)], 'o'), ...rush([['DE', MID - 4.2], ['DT', MID - .7], ['DT2', MID + 1.9], ['DE2', MID + 5.2]])],
      paths: [...olSet(), { who: 'QB', kind: 'drop', pts: [R(-5, MID), R(-7, MID)], t: .1, d: .6, arrow: 'none' }, ...['X', 'SL', 'Z', 'TE', 'RB'].map((w, i) => ({ who: w, kind: 'route', pts: [R(w === 'TE' ? -.9 : w === 'RB' ? -1.5 : w === 'SL' ? -1.5 : -.8, [9.5, 17, W - 9.5, MID + 3.9, W - 16][i]), R(7, [9.5, 17, W - 9.5, MID + 3.9, W - 16][i])], t: .15, d: .9 }))],
      captions: [{ t: 0, text: 'Five blockers, five receivers.' }] },
    six: { chip: '6-man', title: '6-man protection', about: 'The running back stays in to block. One fewer receiver, but now six blockers can handle a five- or six-man rush.', view: v, marks: L,
      players: [...withTeam([...ol(), P('QB', 'QB', -5, MID), P('RB', 'RB', -5.2, MID - 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 17), P('Z', 'Z', -.8, W - 9.5), P('TE', 'TE', -.9, MID + 3.9)], 'o'), ...rush([['DE', MID - 4.2], ['DT', MID - .7], ['DT2', MID + 1.9], ['DE2', MID + 5.2], ['LB', MID - 2.2, 4.5]])],
      paths: [...olSet(), { who: 'RB', kind: 'block', pts: [R(-5.2, MID - 1.7), R(-2.8, MID - 2.1)], t: .25, d: .6 }, { who: 'LB', kind: 'move', pts: [R(4.5, MID - 2.2), R(-1.6, MID - 2)], t: .1, d: .7 }, { who: 'QB', kind: 'drop', pts: [R(-5, MID), R(-7, MID)], t: .1, d: .6, arrow: 'none' }],
      captions: [{ t: 0, text: 'A linebacker blitzes; the running back steps up and picks him up.' }] },
    seven: { chip: '7-man max', title: '7-man “max protect”', about: 'Running back and tight end both stay in. Only three receivers release — used for deep play-action shots that need time.', view: v, marks: L,
      players: [...withTeam([...ol(), P('QB', 'QB', -5, MID), P('RB', 'RB', -5.2, MID - 1.7), P('TE', 'TE', -.9, MID + 3.9), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 17), P('Z', 'Z', -.8, W - 9.5)], 'o'), ...rush([['DE', MID - 4.2], ['DT', MID - .7], ['DT2', MID + 1.9], ['DE2', MID + 5.2], ['LB', MID - 2.2, 4.5], ['LB2', MID + 3, 4.5]])],
      paths: [...olSet(), { who: 'RB', kind: 'block', pts: [R(-5.2, MID - 1.7), R(-2.8, MID - 2.1)], t: .25, d: .6 }, { who: 'TE', kind: 'block', pts: [R(-.9, MID + 3.9), R(-2.2, MID + 4.2)], t: .2, d: .5 }, { who: 'X', kind: 'route', pts: [R(-.8, 9.5), R(9, 9.5)], t: .15, d: 1 }, { who: 'Z', kind: 'route', pts: [R(-.8, W - 9.5), R(9, W - 9.5)], t: .15, d: 1 }, { who: 'SL', kind: 'route', pts: [R(-1.5, 17), R(8, 19)], t: .15, d: 1 }, { who: 'QB', kind: 'drop', pts: [R(-5, MID), R(-7.5, MID)], t: .1, d: .7, arrow: 'none' }],
      captions: [{ t: 0, text: 'Seven blockers buy time for three deep routes.' }] },
    slide: { chip: 'Half-slide', title: 'Half-slide', about: 'Part of the line slides to one side as a zone, while the other side and the back block man-to-man. It handles stunts on the slide side and gives the back a clear rule.', view: v, marks: L,
      players: [...withTeam([...ol(), P('QB', 'QB', -5, MID), P('RB', 'RB', -5.2, MID + 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 17), P('Z', 'Z', -.8, W - 9.5), P('TE', 'TE', -.9, MID + 3.9)], 'o'), ...rush([['DE', MID - 4.2], ['DT', MID - .7], ['DT2', MID + 1.9], ['DE2', MID + 5.2]])],
      paths: [blk('LT', R(-.8, MID - 2.6), R(-2.2, MID - 3.9)), blk('LG', R(-.8, MID - 1.3), R(-1.8, MID - 2.4)), blk('C', R(-.8, MID), R(-1.8, MID - 1.1)), blk('RG', R(-.8, MID + 1.3), R(-2, MID + 1.8)), blk('RT', R(-.8, MID + 2.6), R(-2.4, MID + 4.4)), { who: 'RB', kind: 'block', pts: [R(-5.2, MID + 1.7), R(-2.6, MID + 4.8)], t: .25, d: .6 }, { who: 'QB', kind: 'drop', pts: [R(-5, MID), R(-7, MID)], t: .1, d: .6, arrow: 'none' }],
      captions: [{ t: 0, text: 'Left side slides as a unit; the right tackle and back block man.' }] }
  }, { label: 'Protection' });
}

/* ------------------------------------------------ fronts, gaps, techniques */
function fronts(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { sport: 'football', orient: 'v', r: NARROW ? .5 : .46, label: 'Defensive fronts, gaps and technique numbers', caption: false, controls: false });
  const OLs = withTeam([...ol(), P('TE', 'TE', -.9, MID + 3.9, INFO.TE)], 'o').map(p => ({ ...p, info: null }));
  // technique positions (y) relative to the line; strength (TE) to the right
  const tech = { '0': MID, '1': MID + .55, '1w': MID - .55, '2i': MID + .85, '2': MID + 1.3, '3': MID + 1.85, '2iw': MID - .85, '2w': MID - 1.3, '3w': MID - 1.85, '4i': MID + 2.15, '4': MID + 2.6, '5': MID + 3.15, '4iw': MID - 2.15, '4w': MID - 2.6, '5w': MID - 3.15, '7': MID + 3.45, '6': MID + 3.9, '9': MID + 4.5, '9w': MID - 4.1 };
  const gaps = [['A', MID - .65], ['A', MID + .65], ['B', MID - 1.95], ['B', MID + 1.95], ['C', MID - 3.25], ['C', MID + 3.25], ['D', MID + 4.6], ['D', MID - 4.5]];
  const gapMarks = gaps.map(([g, y]) => ({ type: 'line', x1: LOS - 2.6, y1: y, x2: LOS - 2.6, y2: y, tone: 'ltg', label: g, fs: .62, lx: LOS - 2.4, ly: y, pill: false }));
  const order = ['0', '1', '2i', '2', '3', '4i', '4', '5', '7', '6', '9'];
  const techMarks = order.map((k, i) => ({ type: 'line', x1: LOS + .15, y1: tech[k], x2: LOS + .15, y2: tech[k], tone: 'tech', label: k, fs: NARROW ? .5 : .4, lx: LOS + (i % 2 ? 2.75 : 2.15), ly: tech[k], pill: false }));
  techMarks.push({ type: 'line', x1: LOS, y1: MID, x2: LOS, y2: MID, tone: 'dim', label: 'TECHNIQUES →', fs: .38, lx: LOS + 3.4, ly: MID - 1.6, pill: false });
  const DL = (list) => withTeam(list.map(([id, lab, k, dd, info]) => P(id, lab, dd || 1.05, tech[k], info)), 'd');
  const frontsData = {
    over: { chip: '4-3 Over', title: '4-3 Over', about: 'The line shifts toward the tight end: a 3-technique on the strong guard, a 1-technique shade on the weak side of the center, ends in a 5 and a 9. Linebackers fill the remaining gaps.', players: [...OLs, ...DL([['WE', 'E', '5w'], ['N', 'N', '1w'], ['T', 'T', '3'], ['SE', 'E', '9']]), ...withTeam([P('W', 'W', 4.8, MID - 2.4), P('M', 'M', 4.8, MID + .6), P('S', 'S', 4.8, MID + 5.4)], 'd')] },
    under: { chip: '4-3 Under', title: '4-3 Under', about: 'The line shifts away from the tight end: the 3-technique goes to the weak side, the nose shades strong, and the SAM linebacker walks up on the line over the tight end.', players: [...OLs, ...DL([['WE', 'E', '5w'], ['T', 'T', '3w'], ['N', 'N', '1'], ['SE', 'E', '5'], ['S', 'S', '9', 1.3]]), ...withTeam([P('W', 'W', 4.8, MID - 2.8), P('M', 'M', 4.8, MID + 1.2)], 'd')] },
    okie: { chip: '3-4 Okie', title: '3-4 “Okie”', about: 'A nose over the center (0) and two 5-techniques, with stand-up outside linebackers wide. Two-gap linemen control blockers and read the run.', players: [...OLs, ...DL([['E', 'E', '5w'], ['N', 'N', '0'], ['E2', 'E', '5'], ['O', 'OLB', '9w', 1.3], ['O2', 'OLB', '9', 1.3]]), ...withTeam([P('I', 'ILB', 4.8, MID - 1.8), P('I2', 'ILB', 4.8, MID + 1.8)], 'd')] },
    bear: { chip: 'Bear', title: 'Bear (46) front', about: 'Center and both guards are “covered” by linemen (3–0–3), so no one can double-team or climb to linebackers easily. Built to stop inside runs.', players: [...OLs, ...DL([['E', 'E', '9w'], ['T', 'T', '3w'], ['N', 'N', '0'], ['T2', 'T', '3'], ['E2', 'E', '7', 1.15]]), ...withTeam([P('S', 'S', 1.3, MID + 5.2), P('M', 'M', 4.8, MID - .8), P('W', 'W', 4.8, MID - 4.6)], 'd')] },
    nickel: { chip: '4-2-5', title: '4-2-5 nickel front', about: 'Four linemen and two linebackers; the fifth defensive back replaces the SAM. The standard modern answer to three-receiver sets.', players: [...OLs, ...DL([['WE', 'E', '5w'], ['T', 'T', '2iw'], ['T2', 'T', '3'], ['SE', 'E', '5']]), ...withTeam([P('W', 'W', 4.8, MID - 2), P('M', 'M', 4.8, MID + 1.8), P('NB', 'NB', 4.6, MID + 8.4)], 'd')] }
  };
  const scenes = {};
  for (const [k, v] of Object.entries(frontsData)) scenes[k] = { ...v, static: true, view: [LOS - 4, MID - 7.5, 10, 15], rotate: true, marks: [...gapMarks, ...techMarks, { type: 'line', x1: LOS, y1: MID - 9, x2: LOS, y2: MID + 9, tone: 'los' }] };
  sceneSwitcher(stage, d, scenes, { label: 'Front', noAutoplay: true });
}

/* ------------------------------------------------ coverage shells */
function coverageScenes() {
  const O = withTeam([...ol(), P('TE', 'TE', -.9, MID + 3.9), P('QB', 'QB', -5, MID), P('RB', 'RB', -5.2, MID - 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 16.5), P('Z', 'Z', -1.8, W - 9.5)], 'o').map(p => ({ ...p, ghost: true, info: null }));
  const L = [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }];
  const DLq = withTeam([P('DE', 'E', 1, MID - 4.2), P('DT', 'T', 1, MID - .7), P('DT2', 'T', 1, MID + 1.9), P('DE2', 'E', 1, MID + 5.2)], 'd');
  const mv = (who, from, to, t = .6, d = 1) => ({ who, kind: 'drop', pts: [from, to], t, d });
  const rush = ['DE', 'DT', 'DT2', 'DE2'].map((id, i) => ({ who: id, kind: 'move', pts: [R(1, [MID - 4.2, MID - .7, MID + 1.9, MID + 5.2][i]), R(-3.4, [MID - 3, MID - .6, MID + 1.4, MID + 3.6][i])], t: .5, d: 1.1 }));
  const zone = (x0, x1, y0, y1, tone, label, t = 1.2) => ({ shape: 'rect', x: LOS + x0, y: y0, w: x1 - x0, h: y1 - y0, tone, label, t, fs: .95 });
  const back7 = (cb1, cb2, nb, m, w, s1, s2) => withTeam([P('CB', 'CB', ...cb1), P('CB2', 'CB', ...cb2), P('NB', 'N', ...nb), P('MIKE', 'M', ...m), P('WILL', 'W', ...w), P('FS', 'S', ...s1), P('SS', 'S', ...s2)], 'd');
  const pre2 = () => back7([6, 9.8], [6, W - 9.8], [5, 16.5], [5, MID + 1.6], [5, MID - 2.4], [12.5, MID - 9], [12.5, MID + 9]);
  const v = VIEW(8, 26);
  return {
    c0: { chip: 'Cover 0', title: 'Cover 0', about: 'Pure man-to-man with no deep safety — every extra defender rushes. Maximum pressure, zero help behind it.', beats: 'Nothing if the ball comes out late; it is built to force a fast, rushed throw.', weak: 'Quick throws, rub routes and any receiver who wins his matchup — there is no safety to save a touchdown.', view: v, marks: L,
      players: [...O, ...DLq, ...back7([1.2, 9.5], [1.2, W - 9.5], [2.5, 16.5], [4.6, MID + 3.9], [4.6, MID - 1.7], [8, MID - 3], [8, MID + 2])],
      paths: [...rush, { who: 'FS', kind: 'move', pts: [R(8, MID - 3), R(-2.6, MID - 1.8)], t: .4, d: 1.1 }, { who: 'SS', kind: 'move', pts: [R(8, MID + 2), R(-2.4, MID + 1.6)], t: .4, d: 1.1 }, { who: 'MIKE', kind: 'drop', pts: [R(4.6, MID + 3.9), R(5.5, MID + 4.8)], t: .6, d: .8 }, { who: 'WILL', kind: 'drop', pts: [R(4.6, MID - 1.7), R(2, MID - 3)], t: .6, d: .8 }],
      marks2: true, captions: [{ t: 0, text: 'Everyone is matched to a receiver; the safeties creep down.' }, { t: .8, text: 'At the snap both safeties blitz: six rushers, no one deep.' }] },
    c1: { chip: 'Cover 1', title: 'Cover 1 (man-free)', about: 'Man coverage underneath with one free safety patrolling the deep middle. The other safety can rob, blitz or cover the tight end.', beats: 'Vertical routes (the free safety helps over the top) and teams without a clear matchup edge.', weak: 'Crossing routes, rubs and bunch sets that make man defenders chase through traffic.', view: v, marks: L,
      zones: [zone(12, 28, W / 4, 3 * W / 4, 'deep', 'FREE SAFETY — DEEP MIDDLE'), zone(6, 11, MID - 7, MID + 7, 'under', 'RAT / HOLE', 1.4)],
      players: [...O, ...DLq, ...back7([1.5, 9.5], [1.5, W - 9.5], [3, 16.5], [4.8, MID - 1.7], [4.8, MID + 3.9], [12.5, MID - 4], [9, MID + 7])],
      paths: [...rush, mv('FS', R(12.5, MID - 4), R(16, MID)), mv('SS', R(9, MID + 7), R(8, MID + 1)), mv('CB', R(1.5, 9.5), R(4, 10.2)), mv('CB2', R(1.5, W - 9.5), R(4, W - 10.2)), mv('NB', R(3, 16.5), R(5, 17.4)), mv('MIKE', R(4.8, MID - 1.7), R(3.2, MID - 3.2)), mv('WILL', R(4.8, MID + 3.9), R(6, MID + 4.8))],
      captions: [{ t: 0, text: 'Press corners, one high safety: the classic man-free look.' }, { t: 1, text: 'Corners and nickel stay attached to their receivers; the free safety centers himself deep.' }] },
    c2: { chip: 'Cover 2', title: 'Cover 2', about: 'Two safeties split the deep field in halves; five defenders cover underneath zones. Cornerbacks squat and jump anything in the flats.', beats: 'Short outside throws — corners sit in the flats.', weak: 'The deep middle between the safeties, the sideline “hole” behind the corner, and runs against the lighter box.', view: v, marks: L,
      zones: [zone(12, 28, 0, W / 2, 'deep', 'DEEP ½'), zone(12, 28, W / 2, W, 'deep', 'DEEP ½'), zone(1, 10, 0, 10.5, 'under', 'FLAT'), zone(1, 10, W - 10.5, W, 'under', 'FLAT'), zone(2, 11, 10.5, 21, 'under', 'CURL'), zone(2, 11, 21, 32.3, 'under', 'MIDDLE HOOK'), zone(2, 11, 32.3, W - 10.5, 'under', 'CURL')],
      players: [...O, ...DLq, ...pre2()],
      paths: [...rush, mv('FS', R(12.5, MID - 9), R(16, 13)), mv('SS', R(12.5, MID + 9), R(16, W - 13)), mv('CB', R(6, 9.8), R(4, 6.2)), mv('CB2', R(6, W - 9.8), R(4, W - 6.2)), mv('NB', R(5, 16.5), R(7.5, 15.5)), mv('MIKE', R(5, MID + 1.6), R(8.5, MID + .6)), mv('WILL', R(5, MID - 2.4), R(7.5, W - 16))],
      captions: [{ t: 0, text: 'Two high safeties, corners rolled up tight.' }, { t: .9, text: 'Safeties bail to deep halves; corners squat in the flats.' }, { t: 1.5, text: 'Five underneath zones, two deep: look for the seam between the safeties.' }] },
    tampa: { chip: 'Tampa 2', title: 'Tampa 2', about: 'Cover 2 with a twist: the middle linebacker sprints to the deep middle, closing the hole between the safeties.', beats: 'Seams and deep-middle throws that beat regular Cover 2.', weak: 'Intermediate crossers underneath, and a middle linebacker without the speed to carry it.', view: v, marks: L,
      zones: [zone(13, 28, 0, W / 2 - 4, 'deep', 'DEEP ½'), zone(13, 28, W / 2 + 4, W, 'deep', 'DEEP ½'), zone(10, 20, MID - 6, MID + 6, 'deep', 'MIKE — DEEP MIDDLE', 1.5), zone(1, 10, 0, 10.5, 'under', 'FLAT'), zone(1, 10, W - 10.5, W, 'under', 'FLAT'), zone(2, 10, 12, 22, 'under', 'CURL'), zone(2, 10, W - 22, W - 12, 'under', 'CURL')],
      players: [...O, ...DLq, ...pre2()],
      paths: [...rush, mv('FS', R(12.5, MID - 9), R(17, 12.5)), mv('SS', R(12.5, MID + 9), R(17, W - 12.5)), mv('CB', R(6, 9.8), R(4, 6.2)), mv('CB2', R(6, W - 9.8), R(4, W - 6.2)), mv('NB', R(5, 16.5), R(7, 16.5)), mv('MIKE', R(5, MID + 1.6), R(15, MID), .6, 1.3), mv('WILL', R(5, MID - 2.4), R(7, W - 17))],
      captions: [{ t: 0, text: 'Looks like Cover 2 before the snap.' }, { t: .9, text: 'But the MIKE turns and runs straight down the middle.' }, { t: 1.7, text: 'Now the deep middle is covered — three deep, four under.' }] },
    c3: { chip: 'Cover 3', title: 'Cover 3', about: 'Three deep defenders (two corners and a safety) each take a third of the field; four defenders cover underneath. Balanced and sound against both run and pass.', beats: 'Deep shots — there are three players on top.', weak: 'The seams and the curl-flat areas: four underneath defenders cannot cover five short zones.', view: v, marks: L,
      zones: [zone(12, 28, 0, W / 3, 'deep', 'DEEP ⅓'), zone(12, 28, W / 3, 2 * W / 3, 'deep', 'DEEP ⅓'), zone(12, 28, 2 * W / 3, W, 'deep', 'DEEP ⅓'), zone(1, 11, 0, 13, 'under', 'CURL-FLAT'), zone(2, 11, 13, MID, 'under', 'HOOK'), zone(2, 11, MID, W - 13, 'under', 'HOOK'), zone(1, 11, W - 13, W, 'under', 'CURL-FLAT')],
      players: [...O, ...DLq, ...pre2()],
      paths: [...rush, mv('FS', R(12.5, MID - 9), R(16, MID)), mv('SS', R(12.5, MID + 9), R(6, W - 14), .6, 1.1), mv('CB', R(6, 9.8), R(16, 8.5)), mv('CB2', R(6, W - 9.8), R(16, W - 8.5)), mv('NB', R(5, 16.5), R(6.5, 9)), mv('MIKE', R(5, MID + 1.6), R(7.5, MID + 5)), mv('WILL', R(5, MID - 2.4), R(7.5, MID - 5))],
      captions: [{ t: 0, text: 'Two-high shell before the snap — a disguise.' }, { t: .9, text: 'At the snap one safety rotates down and the other spins to the middle.' }, { t: 1.6, text: 'Now it is Cover 3: corners and a safety in deep thirds.' }] },
    c4: { chip: 'Cover 4', title: 'Cover 4 (quarters)', about: 'Four defenders split the deep field into quarters; safeties read the slot receivers and can fly down against the run. Great against vertical passing.', beats: 'Four verticals and deep shots; also lets safeties hit the run.', weak: 'The flats and short throws underneath — only three short defenders.', view: v, marks: L,
      zones: [zone(12, 28, 0, W / 4, 'deep', 'DEEP ¼'), zone(12, 28, W / 4, W / 2, 'deep', 'DEEP ¼'), zone(12, 28, W / 2, 3 * W / 4, 'deep', 'DEEP ¼'), zone(12, 28, 3 * W / 4, W, 'deep', 'DEEP ¼'), zone(2, 11, 6, 20, 'under', 'CURL-FLAT'), zone(2, 11, 20, W - 20, 'under', 'HOOK'), zone(2, 11, W - 20, W - 6, 'under', 'CURL-FLAT')],
      players: [...O, ...DLq, ...pre2()],
      paths: [...rush, mv('FS', R(12.5, MID - 9), R(14, 19)), mv('SS', R(12.5, MID + 9), R(14, W - 19)), mv('CB', R(6, 9.8), R(15, 7)), mv('CB2', R(6, W - 9.8), R(15, W - 7)), mv('NB', R(5, 16.5), R(7, 14)), mv('MIKE', R(5, MID + 1.6), R(7.5, MID)), mv('WILL', R(5, MID - 2.4), R(7, W - 14))],
      captions: [{ t: 0, text: 'Two high safeties, corners off: could be 2, 4 or 6.' }, { t: 1, text: 'Everyone deep stays deep — four across.' }] },
    c6: { chip: 'Cover 6', title: 'Cover 6 (quarter-quarter-half)', about: 'Split-field coverage: quarters to one side (usually the passing strength), Cover 2 to the other. It tailors the coverage to the formation.', beats: 'Offenses that overload one side.', weak: 'Formations and motion that flip the strength after the defense sets.', view: v, marks: L,
      zones: [zone(12, 28, 0, W / 4, 'deep', 'DEEP ¼'), zone(12, 28, W / 4, W / 2, 'deep', 'DEEP ¼'), zone(12, 28, W / 2, W, 'deep', 'DEEP ½'), zone(2, 11, 6, 20, 'under', 'CURL-FLAT'), zone(2, 11, 20, W - 20, 'under', 'HOOK'), zone(2, 11, W - 20, W - 10.5, 'under', 'CURL'), zone(1, 10, W - 10.5, W, 'under', 'FLAT')],
      players: [...O, ...DLq, ...pre2()],
      paths: [...rush, mv('FS', R(12.5, MID - 9), R(14, 19)), mv('SS', R(12.5, MID + 9), R(16, W - 13)), mv('CB', R(6, 9.8), R(15, 7)), mv('CB2', R(6, W - 9.8), R(4, W - 6)), mv('NB', R(5, 16.5), R(7, 14)), mv('MIKE', R(5, MID + 1.6), R(7.5, MID + 1)), mv('WILL', R(5, MID - 2.4), R(7, W - 15))],
      captions: [{ t: 0, text: 'Two-high again — the same shell as Cover 2 and 4.' }, { t: 1, text: 'Left side plays quarters, right side plays Cover 2: a hybrid.' }] }
  };
}
function coverage(host) { const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage); const d = new Diagram(stage, { ...PLAY, label: 'Animated coverage shells' }); sceneSwitcher(stage, d, coverageScenes(), { label: 'Coverage', start: 'c3' }); }

/* ------------------------------------------------ pressure */
function pressure(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...PLAY, label: 'Blitz and pressure packages' });
  const O = withTeam([...ol(), P('TE', 'TE', -.9, MID + 3.9), P('QB', 'QB', -5, MID), P('RB', 'RB', -5.2, MID - 1.7), P('X', 'X', -.8, 9.5), P('SL', 'SL', -1.5, 16.5), P('Z', 'Z', -1.8, W - 9.5)], 'o').map(p => ({ ...p, ghost: true, info: null }));
  const L = [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }];
  const r = (who, from, to, t = .4, dd = 1) => ({ who, kind: 'move', pts: [from, to], t, d: dd });
  const dr = (who, from, to, t = .5, dd = 1) => ({ who, kind: 'drop', pts: [from, to], t, d: dd });
  const z = (x0, x1, y0, y1, tone, label) => ({ shape: 'rect', x: LOS + x0, y: y0, w: x1 - x0, h: y1 - y0, tone, label, t: 1.2, fs: .9 });
  const base = extra => [...O, ...withTeam(extra, 'd')];
  const v = VIEW(8, 24);
  sceneSwitcher(stage, d, {
    fire: { chip: 'Fire zone', title: 'Fire zone (5-man zone pressure)', about: 'Five rushers, with a defensive end dropping into coverage behind them. Three deep, three underneath — the offense sees a blitz but the coverage is still zone.', view: v, marks: L,
      zones: [z(12, 26, 0, W / 3, 'deep', 'DEEP ⅓'), z(12, 26, W / 3, 2 * W / 3, 'deep', 'DEEP ⅓'), z(12, 26, 2 * W / 3, W, 'deep', 'DEEP ⅓'), z(2, 10, 3, 18, 'under', 'HOT'), z(2, 10, 18, W - 18, 'under', 'HOOK'), z(2, 10, W - 18, W - 3, 'under', 'HOT')],
      players: base([P('DE', 'E', 1, MID - 4.2, null, { hl: true }), P('DT', 'T', 1, MID - .7), P('DT2', 'T', 1, MID + 1.9), P('DE2', 'E', 1, MID + 5.2), P('MIKE', 'M', 4.5, MID - 1.2, null, { hl: true }), P('WILL', 'W', 4.5, MID + 2.4), P('NB', 'N', 4.5, 16.5, null, { hl: true }), P('CB', 'CB', 6.5, 9.8), P('CB2', 'CB', 6.5, W - 9.8), P('FS', 'S', 12.5, MID), P('SS', 'S', 9, MID + 8)]),
      paths: [r('DT', R(1, MID - .7), R(-3.4, MID - .5)), r('DT2', R(1, MID + 1.9), R(-3.4, MID + 1.4)), r('DE2', R(1, MID + 5.2), R(-3.6, MID + 3.6)), r('MIKE', R(4.5, MID - 1.2), R(-3.2, MID - 1.6)), r('NB', R(4.5, 16.5), R(-3, MID - 4.2), .3, 1.2), dr('DE', R(1, MID - 4.2), R(6, 12)), dr('CB', R(6.5, 9.8), R(15, 8)), dr('CB2', R(6.5, W - 9.8), R(15, W - 8)), dr('FS', R(12.5, MID), R(16, MID)), dr('SS', R(9, MID + 8), R(6, W - 13)), dr('WILL', R(4.5, MID + 2.4), R(7, MID + 1))],
      captions: [{ t: 0, text: 'Nickel and MIKE threaten the left side.' }, { t: .8, text: 'They blitz — while the left end drops out into the “hot” zone.' }, { t: 1.6, text: 'The quick “hot” throw runs straight into a defender who used to be a pass rusher.' }] },
    doubleA: { chip: 'Double A-gap', title: 'Double A-gap pressure', about: 'Two linebackers stand in the gaps on either side of the center. The center cannot block both, and the protection has to decide early — or guess wrong.', view: v, marks: L,
      players: base([P('DE', 'E', 1, MID - 4.2), P('DT', 'T', 1, MID - 2.4), P('DT2', 'T', 1, MID + 2.4), P('DE2', 'E', 1, MID + 5.2), P('MIKE', 'M', 2, MID - .65, null, { hl: true }), P('WILL', 'W', 2, MID + .65, null, { hl: true }), P('NB', 'N', 5, 16.5), P('CB', 'CB', 2, 9.5), P('CB2', 'CB', 2, W - 9.5), P('FS', 'S', 12.5, MID), P('SS', 'S', 8, MID + 7)]),
      paths: [r('MIKE', R(2, MID - .65), R(-3.6, MID - .6), .3, .8), r('WILL', R(2, MID + .65), R(-3.6, MID + .6), .3, .8), r('DT', R(1, MID - 2.4), R(-3.4, MID - 2)), r('DT2', R(1, MID + 2.4), R(-3.4, MID + 2)), r('DE', R(1, MID - 4.2), R(-3.6, MID - 3.6)), r('DE2', R(1, MID + 5.2), R(-3.6, MID + 3.6)), dr('SS', R(8, MID + 7), R(8, MID + 2)), dr('FS', R(12.5, MID), R(16, MID))],
      captions: [{ t: 0, text: 'Both A-gaps are threatened before the snap.' }, { t: .6, text: 'Both linebackers go. Six rushers against the protection.' }] },
    sim: { chip: 'Simulated pressure', title: 'Simulated pressure (creeper)', about: 'Show a blitz, rush only four — but not the usual four. A linebacker rushes while a lineman drops, so the protection blocks the wrong people and still has no extra help.', view: v, marks: L,
      zones: [z(12, 26, 0, W / 3, 'deep', 'DEEP ⅓'), z(12, 26, W / 3, 2 * W / 3, 'deep', 'DEEP ⅓'), z(12, 26, 2 * W / 3, W, 'deep', 'DEEP ⅓'), z(2, 10, 3, 18, 'under', 'HOT'), z(2, 10, 18, W - 18, 'under', 'HOOK'), z(2, 10, W - 18, W - 3, 'under', 'HOT')],
      players: base([P('DE', 'E', 1, MID - 4.2), P('DT', 'T', 1, MID - .7, null, { hl: true }), P('DT2', 'T', 1, MID + 1.9), P('DE2', 'E', 1, MID + 5.2), P('MIKE', 'M', 2.2, MID + 3.2, null, { hl: true }), P('WILL', 'W', 2.2, MID - 2.2), P('NB', 'N', 4.5, 16.5), P('CB', 'CB', 6.5, 9.8), P('CB2', 'CB', 6.5, W - 9.8), P('FS', 'S', 12.5, MID), P('SS', 'S', 9, MID + 8)]),
      paths: [r('MIKE', R(2.2, MID + 3.2), R(-3.4, MID + 2.4), .3, .9), r('DE', R(1, MID - 4.2), R(-3.6, MID - 3.4)), r('DT2', R(1, MID + 1.9), R(-3.4, MID + 1)), r('DE2', R(1, MID + 5.2), R(-3.6, MID + 3.8)), dr('DT', R(1, MID - .7), R(6, MID - 3)), dr('WILL', R(2.2, MID - 2.2), R(6, 13)), dr('NB', R(4.5, 16.5), R(6.5, W - 15)), dr('CB', R(6.5, 9.8), R(15, 8)), dr('CB2', R(6.5, W - 9.8), R(15, W - 8)), dr('FS', R(12.5, MID), R(16, MID)), dr('SS', R(9, MID + 8), R(7, MID + 4))],
      captions: [{ t: 0, text: 'Two linebackers on the line of scrimmage: it looks like six are coming.' }, { t: .8, text: 'Only four rush — and a defensive tackle drops into the middle.' }] },
    twist: { chip: 'T-E stunt', title: 'Tackle–end stunt (twist)', about: 'Two linemen exchange rush lanes: the tackle crashes out first, the end loops inside behind him. Linemen who don’t pass them off correctly let one through clean.', view: VIEW(7, 10), marks: L,
      players: base([P('DE', 'E', 1, MID - 4.2), P('DT', 'T', 1, MID - .7), P('DT2', 'T', 1, MID + 1.95, null, { hl: true }), P('DE2', 'E', 1, MID + 5.2, null, { hl: true })]),
      paths: [r('DT2', R(1, MID + 1.95), R(-1.6, MID + 4.2), .3, .8), { who: 'DE2', kind: 'move', pts: [R(1, MID + 5.2), R(-.4, MID + 4.6), R(-1.8, MID + 2.4), R(-3.8, MID + 1.2)], t: .5, d: 1.2, curve: true }, r('DE', R(1, MID - 4.2), R(-3.6, MID - 3.4)), r('DT', R(1, MID - .7), R(-3.4, MID - .6))],
      captions: [{ t: 0, text: 'The right tackle and end are about to swap lanes.' }, { t: .7, text: 'Tackle crashes outside first…' }, { t: 1.2, text: '…and the end loops inside behind him into the B-gap.' }] }
  }, { label: 'Pressure' });
}

/* ------------------------------------------------ reading the defense (stepper) */
function readdefense(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { ...PLAY, label: 'Eight-step read of the defense' });
  const O = gun2x2();
  const L = [{ type: 'line', x1: LOS, y1: 0, x2: LOS, y2: W, tone: 'los' }];
  const Dfn = (hl = []) => withTeam([P('DE', 'E', 1, MID - 4.2), P('DT', 'T', 1, MID - .7), P('DT2', 'T', 1, MID + 1.9), P('DE2', 'E', 1, MID + 5.2), P('WILL', 'W', 4.8, MID - 2.4), P('MIKE', 'M', 4.8, MID + 1.8), P('NB', 'N', 5, 16.5), P('CB', 'CB', 6.5, 9.8), P('CB2', 'CB', 1.2, W - 9.5), P('FS', 'S', 12.5, MID - 8.5), P('SS', 'S', 12.5, MID + 8.5)], 'd').map(p => ({ ...p, hl: hl.includes(p.id), ghost: hl.length && !hl.includes(p.id) }));
  const v = VIEW(9, 20);
  const stepsData = [
    { chip: '1 · Safeties', title: 'Count the deep safeties', about: 'Two safeties high = a “two-high” shell (Cover 2, 4, 6 or a rotation). One high = Cover 1 or 3. This narrows the menu before anything else.', players: [...O, ...Dfn(['FS', 'SS'])], zones: [{ shape: 'rect', x: LOS + 10.5, y: 0, w: 4, h: W, tone: 'deep', label: 'TWO HIGH', t: 0 }] },
    { chip: '2 · The box', title: 'Count the box', about: 'Count defenders inside the box (roughly tackle to tackle, within 5–7 yards). Six in the box against six blockers: the run is “blocked”. Seven: throw it.', players: [...O, ...Dfn(['DE', 'DT', 'DT2', 'DE2', 'WILL', 'MIKE'])], zones: [{ shape: 'rect', x: LOS + .2, y: MID - 6, w: 6.5, h: 12, tone: 'under', label: '6 IN THE BOX', t: 0 }] },
    { chip: '3 · Corners', title: 'Look at the corners', about: 'The right corner is pressed up tight (likely man or Cover 2); the left corner is off at 7 yards (likely zone). Inside or outside leverage tells you which way he wants the receiver to go.', players: [...O, ...Dfn(['CB', 'CB2'])], zones: [{ shape: 'ellipse', x: LOS + 1.2, y: W - 9.5, rx: 2.2, ry: 2.2, tone: 'hot', label: 'PRESS', t: 0 }, { shape: 'ellipse', x: LOS + 6.5, y: 9.8, rx: 2.2, ry: 2.2, tone: 'good', label: 'OFF', t: 0 }] },
    { chip: '4 · Motion', title: 'Use motion to test man vs. zone', about: 'Send the slot across the formation. If a defender runs with him, it is probably man coverage. If defenders just bump over and pass him along, it is zone.', players: [...O, ...Dfn(['NB'])], paths: [{ who: 'SL', kind: 'motion', pts: [R(-1.5, 16.5), R(-1.5, W - 16)], t: .2, d: 1.6, arrow: 'arrow' }, { who: 'NB', kind: 'move', pts: [R(5, 16.5), R(5, W - 16.5)], t: .4, d: 1.6 }], captions: [{ t: 0, text: 'Motion the slot across…' }, { t: 1.2, text: '…the nickel follows him all the way: man coverage.' }] },
    { chip: '5 · Blitzers', title: 'Find the possible blitzers', about: 'Defenders creeping toward the line, or a linebacker with his weight forward, are threats. Count them against your protection — if there are more than you can block, you need a “hot” answer.', players: [...O, ...Dfn(['WILL', 'MIKE'])], paths: [{ who: 'WILL', kind: 'move', pts: [R(4.8, MID - 2.4), R(2, MID - 1.4)], t: .2, d: .8 }, { who: 'MIKE', kind: 'move', pts: [R(4.8, MID + 1.8), R(2, MID + 1)], t: .2, d: .8 }], captions: [{ t: 0, text: 'Both linebackers creep toward the A-gaps.' }] },
    { chip: '6 · Rotation', title: 'After the snap: confirm the rotation', about: 'Two-high before the snap does not guarantee two-high after it. Here the right safety drops down and the left spins to the middle — Cover 3 hiding in a Cover 2 shell.', players: [...O, ...Dfn(['FS', 'SS'])], paths: [{ who: 'FS', kind: 'drop', pts: [R(12.5, MID - 8.5), R(16, MID)], t: .3, d: 1.1 }, { who: 'SS', kind: 'drop', pts: [R(12.5, MID + 8.5), R(6, W - 13)], t: .3, d: 1.1 }], captions: [{ t: 0, text: 'Snap…' }, { t: .8, text: 'One safety drops, one spins to the middle: it was Cover 3.' }] },
    { chip: '7 · The conflict', title: 'Read the defender your play attacks', about: 'Every good concept puts one defender in a bind. Against Cover 3 “Stick”, that is the flat defender: watch only him. He takes the flat, throw the stick; he takes the stick, throw the flat.', players: [...O, ...Dfn(['NB'])], paths: [{ who: 'SL', kind: 'route', pts: [R(-1.5, 16.5), R(3, 13), R(3.6, 4)], t: .2, d: 1 }, { who: 'X', kind: 'route', pts: [R(-.8, 9.5), R(6, 9.5), R(5.6, 10.6)], t: .2, d: .9 }, { who: 'NB', kind: 'move', pts: [R(5, 16.5), R(4.4, 10.4)], t: .4, d: .8 }], captions: [{ t: 0, text: 'One defender, two routes.' }, { t: .9, text: 'He chooses the outside route — the inside one is yours.' }] },
    { chip: '8 · Take it', title: 'Take the easy answer', about: 'A five-yard completion on first down keeps the offense “ahead of the chains”. The defense gave it to you — take it, and save the deep shot for when the picture is right.', players: [...O, ...Dfn([])], ball: { holder: 'QB' }, paths: [{ who: 'RB', kind: 'route', pts: [R(-5.2, MID + 1.7), R(-2.8, MID + 6.4), R(2.4, MID + 8.4)], t: .2, d: 1, curve: true }, { kind: 'pass', from: 'QB', to: 'RB', t: 1, d: .5, bend: .3 }], captions: [{ t: 0, text: 'The back leaks into the flat…' }, { t: 1, text: '…easy completion: 2nd & 5 is a great down.' }] }
  ];
  const scenes = {};
  stepsData.forEach((s, i) => scenes['s' + i] = { ...s, view: v, marks: L, static: !s.paths });
  sceneSwitcher(stage, d, scenes, { label: 'Step' });
}

/* ------------------------------------------------ field-position zones */
function zones(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { sport: 'football', label: 'Field position zones', caption: false, controls: false });
  const Z = (x0, x1, tone, label) => ({ type: 'rect', x: x0, y: 0, w: x1 - x0, h: W, tone, label, fs: 1.25 });
  d.load({ static: true, view: [-2, -3, 124, W + 6], rotate: true, marks: [Z(10, 20, 'hot', 'BACKED UP · OWN 1–10'), Z(20, 40, 'dim', 'COMING OUT'), Z(40, 80, 'dim', 'OPEN FIELD'), Z(80, 90, 'zone', 'FRINGE · 4-DOWN AREA'), Z(90, 100, 'good', 'RED ZONE'), Z(100, 110, 'hot', 'GOAL TO GO')] });
  const legend = h('div', 'legend', '<span>Offense attacks → right</span><span>Fringe = too far for an easy kick, too close to punt</span>'); body.append(legend);
}

/* ------------------------------------------------ 2026 kickoff */
function kickoff(host) {
  const body = host.querySelector('.viz-body'); const stage = h('div'); body.append(stage);
  const d = new Diagram(stage, { sport: 'football', autoplay: true, callouts: true, label: 'NFL dynamic kickoff alignment and landing zone' });
  const kick = [P('K', 'K', 0, MID, 'Kicker — kicks from his own 35-yard line.')].map(p => ({ ...p, team: 'o', x: 45 }));
  const cover = Array.from({ length: 10 }, (_, i) => ({ id: 'c' + i, label: '', team: 'o', x: 70 - .6, y: 4 + i * (W - 8) / 9 + (i > 4 ? 1.6 : -1.6) * 0 }));
  const ret = [...Array.from({ length: 9 }, (_, i) => ({ id: 'r' + i, label: '', team: 'd', x: i < 7 ? 75 + .6 : 78, y: 4.5 + (i < 7 ? i * (W - 9) / 6 : (i === 7 ? 15 : W - 15)) })), { id: 'R1', label: 'R', team: 'd', x: 100, y: MID - 6, info: 'Returner — up to two may wait in the landing zone.' }, { id: 'R2', label: 'R', team: 'd', x: 104, y: MID + 5, info: 'Returner.' }];
  d.load({
    view: [36, -3, 88, W + 6], rotate: true,
    marks: [
      { type: 'rect', x: 90, y: 0, w: 20, h: W, tone: 'zone', label: 'LANDING ZONE · GOAL LINE TO 20', fs: 1.4, ly: 3.2 },
      { type: 'rect', x: 75, y: 0, w: 5, h: W, tone: 'good', label: 'SETUP ZONE 30–35', fs: 1.0, ly: 1.8 },
      { type: 'line', x1: 70, y1: 0, x2: 70, y2: W, tone: 'los', label: 'KICK TEAM ON RECEIVING 40', fs: 1.1, ly: -1.6 },
      { type: 'line', x1: 75, y1: 0, x2: 75, y2: W, tone: 'ltg', label: 'TOUCHBACK → 35', fs: 1.1, ly: W + 1.6 }
    ],
    players: [...kick, ...cover, ...ret], ball: { holder: 'K', r: .55 },
    paths: [{ kind: 'kick', from: 'K', toPt: [104, MID + 5], t: .4, d: 1.6, bend: .15 }, ...cover.map(c => ({ who: c.id, kind: 'move', pts: [[c.x, c.y], [c.x + 12, c.y + (MID - c.y) * .25]], t: 1.95, d: 1.2, arrow: 'none' }))],
    captions: [{ t: 0, text: 'Kicker at his 35; the other ten stand on the receiving team’s 40 — only 5 yards from the return team.' }, { t: .5, text: 'Nobody moves until the ball lands in the landing zone or a player touches it.' }, { t: 2, text: 'Now everyone goes. Kicks into the end zone are touchbacks to the 35; kicks short of the 20 come out to the 40.' }]
  });
}

/* ------------------------------------------------ registry */
const MODS = { anatomy, chains, offense, defense, personnel, runs, routetree, concepts, protection, fronts, coverage, pressure, readdefense, zones, kickoff };
export function mount(host, name) { const fn = MODS[name]; if (!fn) throw new Error('No football visual: ' + name); return fn(host); }
