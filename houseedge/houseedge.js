/* HouseEdge — page behaviour. Every figure here is computed, not typed in: the strategy chart, the baccarat tableau,
   dice odds, pot odds and odds conversions all come from the rules. The roulette table loads its own module (roulette.js). */
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = (n, d = 0) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (n, d = 0) => (n > 0 ? '+' : '') + money(n, d);
const pct = (x, d = 2) => (x * 100).toFixed(d) + '%';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (el, d = 0) => { const v = parseFloat(String(el?.value ?? '').replace(/[^\d.\-]/g, '')); return Number.isFinite(v) ? v : d; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ reveal */
{
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.sec-head, .placards > li, .edge-grid > *, .ch-photo, .ch-body > *, .strategy, .trainer, .dice-lab, .wheels, .rl, .ladder-hands, .safe-grid > *, .odds-board').forEach((el, i) => {
    if (!io) return; el.classList.add('rv'); el.style.transitionDelay = (el.parentElement?.classList.contains('placards') ? (i % 4) * 70 : 0) + 'ms'; io.observe(el);
  });
}

/* ------------------------------------------------------------------ glossary dialog */
{
  const dlg = $('#glossary'); let last = null;
  const open = () => { last = document.activeElement; dlg.hidden = false; document.body.style.overflow = 'hidden'; $('.gl-close', dlg).focus(); };
  const close = () => { dlg.hidden = true; document.body.style.overflow = ''; last?.focus(); };
  $$('[data-glossary]').forEach(b => b.addEventListener('click', open));
  $('.gl-close', dlg).addEventListener('click', close);
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dlg.hidden) close(); });
}

/* ------------------------------------------------------------------ what a night costs */
{
  // sd = standard deviation of one bet, in units of the bet (from each bet's payout distribution)
  const GAMES = [
    ['Blackjack: basic strategy, 3:2 table', .005, 70, 1.15],
    ['Blackjack: same game at a 6:5 table', .0189, 70, 1.15],
    ['Baccarat: Banker', .0106, 72, .927],
    ['Baccarat: Player', .0124, 72, .951],
    ['Baccarat: Tie (8:1)', .1436, 72, 2.641],
    ['Craps: Pass line (per decision)', .0141, 30, 1],
    ['Roulette: single zero, red or black', .027, 38, .9996],
    ['Roulette: double zero, red or black', .0526, 38, .9986],
    ['Roulette: double zero, one number', .0526, 38, 5.763],
    ['Roulette: triple zero, red or black', .0769, 38, .997],
    ['Slots: typical penny machine (≈91% RTP)', .0909, 600, 7]
  ];
  const sel = $('#costGame'), bet = $('#costBet'), pace = $('#costPace'), hrs = $('#costHours');
  sel.innerHTML = GAMES.map((g, i) => `<option value="${i}">${g[0]}</option>`).join('');
  sel.addEventListener('change', () => { pace.value = GAMES[sel.value][2]; calc(); });
  [bet, pace, hrs].forEach(el => el.addEventListener('input', calc));
  function calc() {
    const [, edge, , sd] = GAMES[sel.value], b = Math.max(0, num(bet)), n = Math.max(0, num(pace) * num(hrs));
    const action = b * n, mean = -edge * action, spread = sd * b * Math.sqrt(n);
    $('#costLoss').textContent = money(-mean);
    $('#costAction').textContent = money(action);
    $('#costEdge').textContent = pct(edge, edge < .01 ? 2 : 2);
    const lo = mean - spread, hi = mean + spread;
    $('#costRange').textContent = n ? `${signed(Math.round(lo))} and ${signed(Math.round(hi))}` : '–';
    $('#costRangeNote').textContent = hi > 0 ? `Winning nights happen: about ${Math.round(100 * (1 - normCdf(-mean / (spread || 1))))}% of sessions like this finish ahead. The average still costs ${money(-mean)}.` : 'At this length, even a lucky night usually finishes behind.';
    // bar: domain mean ± 2.4 sd, always including zero
    const d0 = Math.min(mean - 2.4 * spread, 0), d1 = Math.max(mean + 2.4 * spread, 0), X = v => (v - d0) / (d1 - d0 || 1) * 100;
    Object.assign($('#costBarLo').style, { left: X(lo) + '%', width: (X(hi) - X(lo)) + '%' });
    $('#costBarMean').style.left = `calc(${X(mean)}% - 1px)`; $('#costBarZero').style.left = X(0) + '%';
  }
  function normCdf(z) { const t = 1 / (1 + .2316419 * Math.abs(z)), d = .3989423 * Math.exp(-z * z / 2), p = d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
  calc();
}

/* ------------------------------------------------------------------ cards (shared) */
const SUIT = { S: '♠', H: '♥', D: '♦', C: '♣' };
const cardHTML = (rank, suit, back = false) => back ? '<span class="pc back" aria-label="Face-down card"></span>' :
  `<span class="pc${suit === 'H' || suit === 'D' ? ' red' : ''}" aria-label="${rank} of ${{ S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' }[suit]}"><span class="ix">${rank}<i>${SUIT[suit]}</i></span><span class="pip">${SUIT[suit]}</span><span class="ix b">${rank}<i>${SUIT[suit]}</i></span></span>`;
const rnd = n => Math.floor(Math.random() * n);
const pickSuit = () => 'SHDC'[rnd(4)];

/* ------------------------------------------------------------------ blackjack: basic strategy (4–8 decks, S17, DAS, late surrender) */
const UP = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
const row = s => s.split(' ');
const CHART = {
  hard: [['5–8', row('H H H H H H H H H H')], ['9', row('H D D D D H H H H H')], ['10', row('D D D D D D D D H H')], ['11', row('D D D D D D D D D H')], ['12', row('H H S S S H H H H H')], ['13', row('S S S S S H H H H H')], ['14', row('S S S S S H H H H H')], ['15', row('S S S S S H H H R H')], ['16', row('S S S S S H H R R R')], ['17+', row('S S S S S S S S S S')]],
  soft: [['A,2', row('H H H D D H H H H H')], ['A,3', row('H H H D D H H H H H')], ['A,4', row('H H D D D H H H H H')], ['A,5', row('H H D D D H H H H H')], ['A,6', row('H D D D D H H H H H')], ['A,7', row('S Ds Ds Ds Ds S S H H H')], ['A,8', row('S S S S S S S S S S')], ['A,9', row('S S S S S S S S S S')]],
  pairs: [['A,A', row('P P P P P P P P P P')], ['10,10', row('S S S S S S S S S S')], ['9,9', row('P P P P P S P P S S')], ['8,8', row('P P P P P P P P P P')], ['7,7', row('P P P P P P H H H H')], ['6,6', row('P P P P P H H H H H')], ['5,5', row('D D D D D D D D H H')], ['4,4', row('H H H P P H H H H H')], ['3,3', row('P P P P P P H H H H')], ['2,2', row('P P P P P P H H H H')]]
};
const NAME = { H: 'Hit', S: 'Stand', D: 'Double (or hit if you can’t)', Ds: 'Double (or stand if you can’t)', P: 'Split', R: 'Surrender (or hit if you can’t)' };
function why(kind, hand, up, act) {
  const weak = ['2', '3', '4', '5', '6'].includes(up), u = up === 'A' ? 'an ace' : `a ${up}`;
  if (kind === 'hard') {
    if (hand === '5–8') return 'No single card can bust you, so there is nothing to lose by hitting.';
    if (hand === '17+') return 'Hard 17 or more busts too often to hit. Stand and let the dealer draw.';
    if (act === 'D') return `A ten-value card turns ${hand} into ${+hand + 10}, and ${u} is weak enough that doubling earns more than just hitting.`;
    if (act === 'R') return `Hard ${hand} against ${u} loses well over half the time however you play it. Surrender gives up exactly half your bet, which is cheaper.`;
    if (act === 'S') return `Against ${u} the dealer busts often. Standing makes the dealer take the risk instead of you.`;
    if (hand === '9' || hand === '10' || hand === '11') return `Against ${u} the dealer is too strong for doubling to pay off. Just hit and try to improve.`;
    if (hand === '12' && weak) return `12 only busts on a ten-value card, and a dealer showing ${up} doesn't bust often enough to justify standing.`;
    return `The dealer showing ${u} will usually finish with 17 or better, so standing on ${hand} loses more than the risk of hitting.`;
  }
  if (kind === 'soft') {
    const t = +hand.split(',')[1] + 11;
    if (act === 'D') return `Soft ${t} can't bust with one more card, so double while the dealer shows a weak ${up}.`;
    if (act === 'Ds') return `Soft 18 against ${u}: double to press the advantage. If doubling isn't allowed, 18 is good enough to stand.`;
    if (act === 'S') return t >= 19 ? `Soft ${t} is a strong total. Stand.` : `Soft 18 already ties or beats ${u}'s likely finish. Stand.`;
    return t === 18 ? `18 is an underdog against ${u}. Hitting a soft hand can't bust it, so try to improve.` : `A soft ${t} can't bust on the next card, so take the free hit.`;
  }
  const p = hand.split(',')[0];
  if (p === 'A') return 'As one hand, two aces are just a soft 12. As two hands, each starts with an ace. Always split.';
  if (p === '10') return '20 wins most of the time. Never break it up.';
  if (p === '8') return '16 is the worst total in blackjack. Two hands starting with 8 are far better, even against strong upcards.';
  if (p === '5') return act === 'D' ? 'Never split fives: as a hard 10 it is one of the best doubling hands.' : `Never split fives. Play it as a hard 10. Against ${u}, just hit.`;
  if (p === '9') return act === 'P' ? `Two hands starting with 9 beat standing on 18 against ${u}.` : up === '7' ? 'The dealer showing 7 most often makes 17, so your 18 already wins. Stand.' : `Against ${u}, 18 is best left alone; splitting makes two hands that are likely to lose.`;
  if (act === 'P') return `Against a weak ${up}, two small hands (with doubling after the split allowed) earn more than one poor total.`;
  return `Against ${u}, splitting ${p}s creates two weak hands. Hit instead.`;
}
{
  const table = $('#bjChart'), whyEl = $('#bjWhy'); let current = 'hard';
  const render = kind => {
    current = kind;
    table.innerHTML = `<caption class="sr">${kind} totals versus the dealer's upcard</caption><thead><tr><th scope="col">You</th>${UP.map(u => `<th scope="col">${u}</th>`).join('')}</tr></thead><tbody>${CHART[kind].map(([h, acts]) => `<tr><th scope="row">${h}</th>${acts.map((a, i) => `<td class="${a}" data-h="${h}" data-u="${UP[i]}" data-a="${a}" tabindex="0" aria-label="${h} versus ${UP[i]}: ${NAME[a]}">${a}</td>`).join('')}</tr>`).join('')}</tbody>`;
    whyEl.textContent = 'Tap a square to see why.';
  };
  const explain = td => { $$('td.sel', table).forEach(x => x.classList.remove('sel')); td.classList.add('sel'); whyEl.innerHTML = `<b>${td.dataset.h} vs ${td.dataset.u}: ${NAME[td.dataset.a]}.</b> ${why(current, td.dataset.h, td.dataset.u, td.dataset.a)}`; };
  table.addEventListener('click', e => { const td = e.target.closest('td'); if (td) explain(td); });
  table.addEventListener('keydown', e => { const td = e.target.closest('td'); if (td && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); explain(td); } });
  $$('#bjStrategy [data-chart]').forEach(b => b.addEventListener('click', () => { $$('#bjStrategy [data-chart]').forEach(x => x.setAttribute('aria-selected', String(x === b))); render(b.dataset.chart); }));
  render('hard');
}
/* practice table */
{
  const dealerEl = $('#trDealer'), playerEl = $('#trPlayer'), verdict = $('#trVerdict'), acts = $$('#bjTrainer [data-act]');
  let hand = null, streak = 0, right = 0, total = 0;
  const tenRank = () => ['10', 'J', 'Q', 'K'][rnd(4)];
  function deal() {
    const upIdx = rnd(13), up = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'][upIdx], upKey = ['J', 'Q', 'K'].includes(up) ? '10' : up;
    const r = Math.random(); let kind, key, cards;
    if (r < .2) { // pair
      const [label] = CHART.pairs[rnd(CHART.pairs.length)], p = label.split(',')[0]; kind = 'pairs'; key = label;
      const rk = p === '10' ? [tenRank(), tenRank()] : [p, p]; cards = rk.map(x => [x, pickSuit()]);
    } else if (r < .42) { // soft
      const [label] = CHART.soft[rnd(CHART.soft.length)]; kind = 'soft'; key = label; cards = [['A', pickSuit()], [label.split(',')[1], pickSuit()]];
    } else { // hard, two different non-ace cards
      const t = 5 + rnd(15); kind = 'hard'; key = t <= 8 ? '5–8' : t >= 17 ? '17+' : String(t);
      let a, b; do { a = 2 + rnd(9); b = t - a; } while (b < 2 || b > 10 || a === b);
      cards = [a, b].map(v => [v === 10 ? tenRank() : String(v), pickSuit()]);
    }
    const acts0 = CHART[kind].find(x => x[0] === key)[1], answer = acts0[UP.indexOf(upKey)];
    hand = { kind, key, up: upKey, answer };
    dealerEl.innerHTML = cardHTML(up, pickSuit()) + cardHTML('', '', true);
    playerEl.innerHTML = cards.map(([rk, s]) => cardHTML(rk, s)).join('');
    acts.forEach(b => { b.disabled = b.dataset.act === 'P' && kind !== 'pairs'; b.classList.remove('right', 'wrong'); });
    verdict.className = 'trainer-verdict'; verdict.textContent = `${kind === 'pairs' ? 'Pair of ' + key.split(',')[0] + 's' : (kind === 'soft' ? 'Soft ' : 'Hard ') + (kind === 'soft' ? +key.split(',')[1] + 11 : cards.reduce((s, [rk]) => s + (['10', 'J', 'Q', 'K'].includes(rk) ? 10 : +rk), 0))} against a dealer ${up}. Your move.`;
  }
  acts.forEach(b => b.addEventListener('click', () => {
    if (!hand || hand.done) return;
    const want = hand.answer, pick = b.dataset.act, ok = pick === want || (want === 'Ds' && pick === 'D');
    total++; if (ok) { right++; streak++; } else streak = 0; hand.done = true;
    b.classList.add(ok ? 'right' : 'wrong'); if (!ok) acts.find(x => x.dataset.act === (want === 'Ds' ? 'D' : want))?.classList.add('right');
    verdict.className = 'trainer-verdict ' + (ok ? 'ok' : 'no');
    verdict.innerHTML = `<b>${ok ? 'Correct' : 'Not quite'}: ${NAME[want]}.</b> ${why(hand.kind, hand.key, hand.up, want)}`;
    $('#trStreak').textContent = streak; $('#trScore').textContent = `${right} / ${total}`;
  }));
  $('#trDeal').addEventListener('click', deal);
  deal();
}

/* ------------------------------------------------------------------ baccarat: banker's tableau */
{
  const bankerDraws = (b, p3) => p3 === 'none' ? b <= 5 : b <= 2 ? true : b === 3 ? p3 !== 8 : b === 4 ? p3 >= 2 && p3 <= 7 : b === 5 ? p3 >= 4 && p3 <= 7 : b === 6 ? p3 === 6 || p3 === 7 : false;
  const grid = $('#tbGrid'), selB = $('#tbBanker'), selP = $('#tbPlayer'), out = $('#tbVerdict');
  const cols = ['none', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  grid.innerHTML = `<thead><tr><th scope="col">Banker</th>${cols.map(c => `<th scope="col" data-c="${c}">${c === 'none' ? '–' : c}</th>`).join('')}</tr></thead><tbody>${[0, 1, 2, 3, 4, 5, 6, 7].map(b => `<tr><th scope="row" data-b="${b}">${b}</th>${cols.map(c => { const d = bankerDraws(b, c); return `<td class="${d ? 'dr' : 'st'}" data-b="${b}" data-c="${c}">${d ? 'D' : 'S'}</td>`; }).join('')}</tr>`).join('')}</tbody>`;
  const upd = () => {
    const b = +selB.value, c = selP.value === 'none' ? 'none' : +selP.value, d = bankerDraws(b, c);
    $$('.hit', grid).forEach(x => x.classList.remove('hit'));
    grid.querySelector(`td[data-b="${b}"][data-c="${c}"]`)?.classList.add('hit'); grid.querySelector(`th[data-c="${c}"]`)?.classList.add('hit'); grid.querySelector(`th[data-b="${b}"]`)?.classList.add('hit');
    out.innerHTML = `<b>Banker ${d ? 'draws' : 'stands'}.</b> ` + (c === 'none' ? `Player stood, so Banker follows Player's own rule: draw on 0–5, stand on 6–7.` : b <= 2 ? 'With 0, 1 or 2, Banker always draws.' : b === 7 ? 'Banker always stands on 7.' : `With ${b}, Banker draws only when Player's third card is ${{ 3: 'anything but 8', 4: '2 through 7', 5: '4 through 7', 6: '6 or 7' }[b]}.`);
  };
  [selB, selP].forEach(s => s.addEventListener('change', upd)); upd();
  $('#tbGrid').insertAdjacentHTML('afterend', '<p class="fine" style="margin-top:8px">D = Banker draws a third card · S = stands · “–” = Player did not draw. If either hand has a natural 8 or 9, nobody draws.</p>');
}

/* ------------------------------------------------------------------ craps: dice lab */
{
  const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  const face = n => `<div class="f f${n}">${PIPS[n].map(k => `<i style="grid-area:${Math.ceil(k / 3)} / ${(k - 1) % 3 + 1}"></i>`).join('')}</div>`;
  const dice = [$('#die1'), $('#die2')]; dice.forEach(d => d.innerHTML = [1, 2, 3, 4, 5, 6].map(face).join(''));
  const SHOW = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
  const spins = [0, 0];
  const dist = $('#dist'), WAYS = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  dist.innerHTML = WAYS.map((n, i) => `<li style="--n:${n}" class="${i === 5 ? 'seven' : ''}" data-s="${i + 2}"><small>${(n / 36 * 100).toFixed(1)}%</small><i></i><b>${i + 2}</b></li>`).join('');
  let point = null, rolls = 0, sevens = 0;
  const set = (d, n, k) => { spins[k] += 2 + rnd(2); const [x, y] = SHOW[n]; d.style.transform = `rotateX(${x + spins[k] * 360}deg) rotateY(${y + spins[k] * 360}deg)`; };
  set(dice[0], 3, 0); set(dice[1], 4, 1);
  const btn = $('#rollBtn'), msg = $('#diceMsg'), sumEl = $('#diceSum'), puck = $('#puck'), pl = $('#pointLabel');
  btn.addEventListener('click', () => {
    const a = 1 + rnd(6), b = 1 + rnd(6), s = a + b; set(dice[0], a, 0); set(dice[1], b, 1);
    btn.disabled = true; rolls++; if (s === 7) sevens++;
    setTimeout(() => {
      btn.disabled = false; sumEl.textContent = s;
      $$('li', dist).forEach(li => li.classList.toggle('hit', +li.dataset.s === s));
      let text;
      if (point === null) {
        if (s === 7 || s === 11) text = `${s === 7 ? 'Seven' : 'Yo-leven'} on the come-out: pass line wins.`;
        else if (s === 2 || s === 3 || s === 12) text = `Craps (${s}) on the come-out: pass line loses${s === 12 ? ', and don’t pass pushes' : ''}.`;
        else { point = s; text = `The point is ${s}. Now roll ${s} again before a 7. Odds on ${s} pay ${{ 4: '2:1', 10: '2:1', 5: '3:2', 9: '3:2', 6: '6:5', 8: '6:5' }[s]}.`; }
      } else if (s === point) { text = `Point made! ${s} came before 7: pass line wins. New come-out roll.`; point = null; }
      else if (s === 7) { text = 'Seven-out: pass line loses and the dice move to the next shooter.'; point = null; }
      else text = `${s} doesn't decide the pass line. Still rolling for ${point}.`;
      msg.textContent = text;
      puck.textContent = point ? 'ON' : 'OFF'; puck.classList.toggle('on', !!point); pl.textContent = point ? `Point: ${point}` : 'No point yet';
      $('#diceStats').textContent = `Rolls: ${rolls} · Sevens: ${sevens} (${(sevens / rolls * 100).toFixed(0)}%, expected 16.7%)`;
    }, reduced ? 60 : 1050);
  });
}

/* ------------------------------------------------------------------ slots: same RTP, different volatility */
{
  // each machine: [probability, payout multiple] — both return 92% of money wagered
  const LOW = [[.34, 1.5], [.1, 3], [.011, 10]], HIGH = [[.12, 2], [.014, 20], [.002, 200]];
  const rtp = m => m.reduce((s, [p, x]) => s + p * x, 0);
  console.assert(Math.abs(rtp(LOW) - .92) < 1e-9 && Math.abs(rtp(HIGH) - .92) < 1e-9);
  const svg = $('#simChart'), W = 600, H = 260, L = 38, B = 22, T = 12, SP = 300;
  function session(m) {
    let bank = 100, best = 0, dry = 0, maxDry = 0, hits = 0; const path = [bank];
    for (let i = 0; i < SP && bank > 0; i++) {
      bank -= 1; let r = Math.random(), win = 0;
      for (const [p, x] of m) { if (r < p) { win = x; break; } r -= p; }
      if (win) { bank += win; hits++; best = Math.max(best, win); dry = 0; } else { dry++; maxDry = Math.max(maxDry, dry); }
      path.push(bank);
    }
    return { path, bank, best, maxDry, hits, spins: path.length - 1 };
  }
  function run() {
    const a = session(LOW), b = session(HIGH), top = Math.max(200, ...a.path, ...b.path);
    const X = i => L + i / SP * (W - L - 8), Y = v => T + (1 - v / top) * (H - T - B);
    const line = (p, cls) => { const d = p.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' '); return `<path class="${cls}" d="${d}" style="--len:${Math.round(p.length * 4)}"/>`; };
    const ticks = []; for (let v = 0; v <= top; v += top > 300 ? 100 : 50) ticks.push(`<line x1="${L}" x2="${W - 8}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`);
    svg.innerHTML = `<g class="grid">${ticks.join('')}<text x="${W - 8}" y="${H - 6}" text-anchor="end">spins →</text></g><line class="start" x1="${L}" x2="${W - 8}" y1="${Y(100)}" y2="${Y(100)}"/>${line(a.path, 'lo')}${line(b.path, 'hi')}`;
    const f = s => s.bank <= 0 ? `busted after ${s.spins} spins` : `${s.bank} credits`;
    $('#simStats').innerHTML = `<div><dt>Low volatility finished with</dt><dd>${f(a)}</dd></div><div><dt>High volatility finished with</dt><dd>${f(b)}</dd></div><div><dt>Low · paid on</dt><dd>${Math.round(a.hits / a.spins * 100)}% of spins · best ${a.best}×</dd></div><div><dt>High · paid on</dt><dd>${Math.round(b.hits / b.spins * 100)}% of spins · best ${b.best}×</dd></div><div><dt>Low · longest dry spell</dt><dd>${a.maxDry} spins</dd></div><div><dt>High · longest dry spell</dt><dd>${b.maxDry} spins</dd></div>`;
  }
  $('#simRun').addEventListener('click', run); run();
}

/* ------------------------------------------------------------------ poker: hand ladder + pot odds */
{
  const H = [['Royal flush', 'AH KH QH JH 10H', 4], ['Straight flush', '9C 8C 7C 6C 5C', 36], ['Four of a kind', 'QS QH QD QC 2H', 624], ['Full house', 'KS KH KD 9C 9D', 3744], ['Flush', 'AD JD 8D 5D 2D', 5108], ['Straight', '9S 8H 7D 6C 5S', 10200], ['Three of a kind', '7S 7H 7D KC 2S', 54912], ['Two pair', 'JS JH 4D 4C 9S', 123552], ['One pair', 'AS AD 10C 7H 3S', 1098240], ['High card', 'AS JD 8C 5H 2C', 1302540]];
  const used = { 'Four of a kind': 4, 'Full house': 5, 'Three of a kind': 3, 'Two pair': 4, 'One pair': 2, 'High card': 1 };
  $('#handLadder').innerHTML = H.map(([n, cs, ways], i) => {
    const odds = 2598960 / ways, o = odds >= 100 ? Math.round(odds).toLocaleString('en-US') : odds.toFixed(1);
    const cards = cs.split(' ').map((c, k) => { const r = c.slice(0, -1), s = c.slice(-1); return `<span class="mini${s === 'H' || s === 'D' ? ' red' : ''}${used[n] !== undefined && k >= used[n] ? ' dim' : ''}">${r}<i>${SUIT[s]}</i></span>`; }).join('');
    return `<div class="hrow"><span class="rk">${i + 1}</span><span class="nm">${n}<small>1 in ${o}</small></span><span class="cards">${cards}</span></div>`;
  }).join('') + '<p class="fine" style="grid-column:1/-1;margin:8px 0 0;color:#cfe0d4">Odds of being dealt each hand in five cards (2,598,960 possible hands). Faded cards are kickers: they only break ties.</p>';
  const pot = $('#potPot'), call = $('#potCall'), outs = $('#potOuts');
  function upd() {
    const P = Math.max(0, num(pot)), C = Math.max(0, num(call)), o = clamp(Math.round(num(outs)), 0, 20);
    const need = C / (P + C || 1), one = o / 47, two = 1 - ((47 - o) * (46 - o)) / (47 * 46);
    $('#potNeed').textContent = pct(need, 1); $('#potOne').textContent = pct(one, 1); $('#potTwo').textContent = pct(two, 1);
    $('#potBarNeed').style.width = need * 100 + '%'; $('#potBarHit').style.width = one * 100 + '%';
    $('#potVerdict').innerHTML = one >= need ? `<b>Call is profitable on direct odds.</b> You hit ${pct(one, 1)} of the time with one card to come; the price only needs ${pct(need, 1)}.` : two >= need ? `<b>Close.</b> One card gives ${pct(one, 1)} vs ${pct(need, 1)} needed. Only worth it if you're all-in (${pct(two, 1)} by the river) or expect to win more later (implied odds).` : `<b>Fold on direct odds.</b> Even with two cards to come you hit ${pct(two, 1)}, below the ${pct(need, 1)} this price requires.`;
  }
  [pot, call, outs].forEach(el => el.addEventListener('input', upd));
  $$('#potLab [data-outs]').forEach(b => b.addEventListener('click', () => { outs.value = b.dataset.outs; upd(); }));
  upd();
}

/* ------------------------------------------------------------------ odds lab */
{
  const parse = s => { const v = parseFloat(String(s).replace(/[−–]/g, '-').replace(/[^\d.\-+]/g, '')); return Number.isFinite(v) && Math.abs(v) >= 100 ? v : NaN; };
  const imp = o => o < 0 ? -o / (-o + 100) : 100 / (o + 100);
  const dec = o => o < 0 ? 1 + 100 / -o : 1 + o / 100;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const frac = o => { let n = o < 0 ? 100 : Math.round(o), d = o < 0 ? Math.round(-o) : 100; const g = gcd(n, d); return `${n / g}/${d / g}`; };
  const amer = d => d >= 2 ? '+' + Math.round((d - 1) * 100) : '−' + Math.round(100 / (d - 1));
  const odds = $('#olOdds'), stake = $('#olStake');
  function conv() {
    const o = parse(odds.value), s = Math.max(0, num(stake));
    if (!Number.isFinite(o)) { ['olProb', 'olDec', 'olFrac', 'olProfit'].forEach(id => $('#' + id).textContent = '–'); return; }
    $('#olProb').textContent = pct(imp(o)); $('#olDec').textContent = dec(o).toFixed(2); $('#olFrac').textContent = frac(o); $('#olProfit').textContent = money(s * (dec(o) - 1), 2);
  }
  const A = $('#hvA'), Bx = $('#hvB');
  function hold() {
    const a = parse(A.value), b = parse(Bx.value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) { $('#hvOut').textContent = 'Enter two American prices, like −110 and −110 or −180 and +155.'; return; }
    const pa = imp(a), pb = imp(b), S = pa + pb, h = 1 - 1 / S;
    $('#hvOut').innerHTML = `The two prices add up to <b>${pct(S)}</b>, more than 100%. The extra is the book's margin: it keeps about <b>${pct(h)}</b> of all money bet on this market if action is balanced. Without the margin, the fair prices would be <b>${amer(1 / (pa / S))}</b> and <b>${amer(1 / (pb / S))}</b> (${pct(pa / S, 1)} / ${pct(pb / S, 1)}).`;
  }
  const legs = $('#plLegs'), plo = $('#plOdds'), plc = $('#plChance');
  function parlay() {
    const n = clamp(Math.round(num(legs, 3)), 2, 10), o = parse(plo.value), p = clamp(num(plc, 50), 1, 99) / 100;
    if (!Number.isFinite(o)) { $('#plOut').textContent = 'Enter the American price of each leg, like −110.'; return; }
    const D = Math.pow(dec(o), n), win = Math.pow(p, n), ev = win * D - 1, fair = 1 / win;
    $('#plOut').innerHTML = `${n} legs at ${plo.value.replace('-', '−')} pay <b>${amer(D)}</b> (${(D - 1).toFixed(2)} to 1). If each leg truly wins ${Math.round(p * 100)}% of the time, all ${n} hit only <b>${pct(win, win < .01 ? 2 : 1)}</b> of the time, a fair payout would be <b>${amer(fair)}</b>, and the average return is <b>${ev >= 0 ? '+' : '−'}${pct(Math.abs(ev), 1)}</b> of each dollar bet.`;
  }
  [odds, stake].forEach(el => el.addEventListener('input', conv)); [A, Bx].forEach(el => el.addEventListener('input', hold)); [legs, plo, plc].forEach(el => el.addEventListener('input', parlay));
  conv(); hold(); parlay();
}

/* ------------------------------------------------------------------ roulette: load when the table comes into view */
{
  const host = $('#rl'); let loaded = false;
  const load = () => { if (loaded) return; loaded = true; import('./roulette.js?v=2').then(m => m.init(host)).catch(e => console.warn('Roulette table unavailable', e)); };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '600px 0px' }); io.observe(host); } else load();
}
