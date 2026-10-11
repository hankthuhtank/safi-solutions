/* Form MW-4, Credit: the avalanche-vs-snowball race, utilization, and the minimum payment warning box. */
import { boot, registerTool, startTools, bindBoxes, figs, verdict, draw, $ } from '../ui.js';
import { makeChart } from '../charts.js';
import { createTape } from '../tape.js';
import * as c from '../calc.js';
import { money, moneyShort, pct, num, duration } from '../format.js';

boot();

const C = { green: 'var(--series-1)', red: 'var(--series-2)', blue: 'var(--series-3)', gold: 'var(--series-4)', teal: 'var(--series-5)' };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------ the race */
registerTool('tool-race', panel => {
  const tape = createTape($('[data-tape]', panel));
  // the race runs full width under the calculator
  const race = document.createElement('div');
  race.className = 'race';
  race.innerHTML = `<div class="race-head"><div><p class="micro">The race</p><p class="race-note">Each bar grows until that debt is paid off. Same budget, same debts, two orders.</p></div><div class="race-ctl"><span class="race-clock" data-clock aria-live="off"></span><button class="btn small" type="button" data-run>Run the race <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div></div><div class="lanes"></div><div class="race-axis" aria-hidden="true"></div>`;
  panel.querySelector('.tool-grid').after(race);
  let plans = null, debts = [], maxM = 1, timer = 0;

  const build = () => {
    const lanes = $('.lanes', race);
    lanes.innerHTML = ['avalanche', 'snowball'].map(s => `<section class="lane" data-s="${s}" style="--c:${s === 'avalanche' ? C.blue : C.gold}"><header><b>${s === 'avalanche' ? 'Avalanche' : 'Snowball'}</b><small>${s === 'avalanche' ? 'highest rate first' : 'smallest balance first'}</small><span class="lane-sum"></span></header><div class="rows">${debts.map((d, i) => `<div class="row" data-i="${i}"><span class="rname">${d.name}</span><span class="rtrack"><i class="rbar"></i><b class="stamp" hidden></b></span></div>`).join('')}</div></section>`).join('');
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxM));
    $('.race-axis', race).innerHTML = `<span></span><span class="ticks">${ticks.map(t => `<i style="left:${(t / maxM * 100).toFixed(1)}%">${t}</i>`).join('')}</span><span class="axis-label">months</span>`;
  };
  const paint = m => {
    for (const s of ['avalanche', 'snowball']) {
      const p = plans[s], lane = $(`.lane[data-s="${s}"]`, race);
      p.debts.forEach((d, i) => {
        const row = $(`.row[data-i="${i}"]`, lane), end = d.paidOffMonth ?? maxM;
        const shown = Math.min(m, end);
        $('.rbar', row).style.width = (shown / maxM * 100).toFixed(2) + '%';
        const st = $('.stamp', row);
        st.hidden = !(d.paidOffMonth != null && m >= d.paidOffMonth);
        if (!st.hidden) { st.textContent = `Paid · mo ${d.paidOffMonth}`; st.style.left = `calc(${(end / maxM * 100).toFixed(2)}% + 8px)`; }
        row.classList.toggle('done', !st.hidden);
      });
      $('.lane-sum', lane).textContent = m >= p.months ? `${money(p.totalInterest)} interest · debt-free month ${p.months}` : `month ${m}`;
    }
    $('[data-clock]', race).textContent = m >= maxM ? '' : `Month ${m}`;
  };
  const run = () => {
    cancelAnimationFrame(timer);
    if (reduced()) return paint(maxM);
    let m = 0, last = 0;
    const step = ts => { if (ts - last > 90) { last = ts; paint(m++); } if (m <= maxM) timer = requestAnimationFrame(step); };
    timer = requestAnimationFrame(step);
  };
  $('[data-run]', race).addEventListener('click', run);

  const update = v => {
    const names = [...panel.querySelectorAll('.box-group-title')].map(n => n.textContent);
    debts = [0, 1, 2, 3].map(i => ({ name: names[i] || `Debt ${i + 1}`, balance: v[`b${i}`], apr: v[`r${i}`], min: v[`m${i}`] })).filter(d => d.balance > 0);
    const minTotal = debts.reduce((s2, d) => s2 + d.min, 0), total = debts.reduce((s2, d) => s2 + d.balance, 0);
    const av = c.payoffPlan({ debts, budget: v.budget, strategy: 'avalanche' });
    const sb = c.payoffPlan({ debts, budget: v.budget, strategy: 'snowball' });
    if (!av.feasible || !sb.feasible) {
      figs($('[data-figs]', panel), [{ label: 'Budget too small', value: money(minTotal), note: 'the minimums alone add up to this', hero: true, tone: 'bad' }]);
      verdict($('[data-verdict]', panel), 'Raise the monthly budget to at least the sum of the minimums, or the balances never reach zero.', 'warn');
      $('[data-verdict]', panel).hidden = false;
      race.hidden = true;
      return;
    }
    race.hidden = false;
    plans = { avalanche: av, snowball: sb };
    maxM = Math.max(av.months, sb.months);
    build(); cancelAnimationFrame(timer); paint(maxM);
    const extra = sb.totalInterest - av.totalInterest;
    figs($('[data-figs]', panel), [
      { label: 'Avalanche saves', value: money(extra), hero: true, tone: 'good', note: `debt-free in ${duration(av.months)} (snowball: ${duration(sb.months)})` },
      { label: 'Avalanche: first debt gone', value: `month ${av.firstWinMonth}`, note: `${money(av.totalInterest)} of interest in all` },
      { label: 'Snowball: first debt gone', value: `month ${sb.firstWinMonth}`, note: `${money(sb.totalInterest)} of interest in all` },
    ]);
    verdict($('[data-verdict]', panel), extra < 1
      ? 'Here both orders cost the same: your smallest debt is also your most expensive one. Start there.'
      : `The avalanche is cheaper by **${money(extra)}**. The snowball clears its first debt ${sb.firstWinMonth < av.firstWinMonth ? `**${av.firstWinMonth - sb.firstWinMonth} months sooner**` : 'just as fast'}. If early wins keep you going, that can be worth the difference.`, 'info');
    $('[data-verdict]', panel).hidden = false;
    tape.print([
      ...debts.map(d => ({ label: `${d.name} ${pct(d.apr, 2, true)}`, v: d.balance, op: 'add' })),
      { label: 'Total owed', v: total, kind: 'subtotal' },
      { label: 'Monthly budget', v: v.budget },
      { label: 'Minimums', v: minTotal, op: 'sub' },
      { label: 'Extra to the target', v: v.budget - minTotal, kind: 'subtotal' },
      { label: 'Avalanche interest', v: av.totalInterest },
      { label: 'Snowball interest', v: sb.totalInterest },
      { label: 'Difference', v: extra, kind: 'total' },
      { kind: 'note', label: `Avalanche order: ${av.order.map(i => debts[i].name).join(', ')}.` },
      { kind: 'note', label: `Snowball order: ${sb.order.map(i => debts[i].name).join(', ')}.` },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ utilization */
registerTool('tool-util', panel => {
  const tape = createTape($('[data-tape]', panel));
  const update = v => {
    const cards = [0, 1, 2].map(i => ({ name: `Card ${i + 1}`, limit: v[`l${i}`], balance: v[`s${i}`] })).filter(x => x.limit > 0);
    const u = c.utilization(cards), band = c.utilizationBand(u.overall);
    const toTen = Math.max(0, u.balance - 0.1 * u.limit);
    figs($('[data-figs]', panel), [
      { label: 'Overall utilization', value: pct(u.overall, 1, true), hero: true, tone: u.overall < 0.1 ? 'good' : u.overall >= 0.3 ? 'bad' : '', note: band.label },
      { label: 'Highest single card', value: pct(u.highest, 1, true), tone: u.highest >= 0.5 ? 'bad' : '' },
      { label: 'To report under 10%', value: toTen > 0 ? `pay ${money(toTen)}` : 'already there', note: 'before the statement closing date' },
    ]);
    verdict($('[data-verdict]', panel), u.highest >= 0.5 && u.overall < 0.3 ? 'Your overall ratio is fine, but **one card is more than half used**. Scoring models notice individual cards too.' : 'There is no magic number, but people with the highest scores tend to report under 10%. Utilization has no memory: next month\'s statement can fix it.', u.highest >= 0.5 ? 'warn' : 'info');
    $('[data-verdict]', panel).hidden = false;
    draw(panel, 'util', {
      type: 'hbars', title: 'Each card, as the bureaus see it', rowHeight: 34, desc: 'Statement balance as a share of each card\'s limit',
      x: { values: [...u.rows.map(r => r.name), 'All cards'] }, y: { format: x => x + '%', min: 0, max: Math.max(100, ...u.rows.map(r => r.ratio * 100)) },
      thresholds: [{ value: 10, label: '10%' }, { value: 30, label: '30%' }],
      series: [{ key: 'u', label: 'Utilization', color: C.blue, values: [...u.rows.map(r => r.ratio * 100), u.overall * 100], format: x => x.toFixed(1) + '%', colorFor: x => (x >= 30 ? C.red : x >= 10 ? C.gold : C.green) }],
    });
    tape.print([
      ...u.rows.map(r => ({ label: `${r.name} ${money(r.balance)} ÷ ${money(r.limit)}`, text: pct(r.ratio, 1, true) })),
      { label: 'Balances', v: u.balance, op: 'add' },
      { label: 'Limits', v: u.limit, op: 'div' },
      { label: 'Overall utilization', text: pct(u.overall, 2, true), kind: 'total' },
      { label: '10% of limits', v: 0.1 * u.limit },
      { label: 'Pay before statement', v: toTen, kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

/* ------------------------------------------------ minimum payment warning */
registerTool('tool-min', panel => {
  const tape = createTape($('[data-tape]', panel));
  const box = document.createElement('div');
  $('[data-charts]', panel).appendChild(box);
  const update = v => {
    const m = c.minimumPayoff({ balance: v.balance, apr: v.apr, percent: v.pct, plusInterest: v.plusInt, floor: v.floor });
    const p36 = c.payment(v.balance, v.apr, 36), t36 = p36 * 36;
    const never = !Number.isFinite(m.months);
    figs($('[data-figs]', panel), [
      { label: 'Paying only the minimum', value: never ? 'never paid off' : duration(m.months), hero: true, tone: 'bad', note: never ? 'the payment never covers the interest' : `${money(m.totalInterest)} of interest` },
      { label: 'First minimum payment', value: money(m.firstPayment, { cents: true }) },
      { label: 'Pay it off in 3 years', value: `${money(p36)}/mo`, tone: 'good', note: `${money(t36 - v.balance)} of interest` },
    ]);
    $('[data-verdict]', panel).hidden = true;
    const yrs = never ? 'never' : m.months < 24 ? `${m.months} months` : `${Math.round(m.months / 12)} years`;
    box.innerHTML = `<div class="warnbox" role="group" aria-label="Minimum payment warning"><h5>Minimum Payment Warning: If you make only the minimum payment each period, you will pay more in interest and it will take you longer to pay off your balance.</h5>
      <table><thead><tr><th>If you make no additional charges using this card and each month you pay…</th><th>You will pay off the balance shown on this statement in about…</th><th>And you will end up paying an estimated total of…</th></tr></thead>
      <tbody><tr><td>Only the minimum payment</td><td>${yrs}</td><td class="n">${never ? '–' : money(v.balance + m.totalInterest)}</td></tr>
      <tr><td class="n">${money(p36)}</td><td>3 years</td><td class="n">${money(t36)}${never ? '' : ` (Savings = ${money(v.balance + m.totalInterest - t36)})`}</td></tr></tbody></table></div>`;
    const n = Math.min(never ? 360 : m.months, 600), xs = Array.from({ length: n + 1 }, (_, i) => i);
    draw(panel, 'bal', {
      type: 'line', title: 'Balance left', height: 210, desc: 'Card balance paying only the minimum versus a fixed three-year payment',
      x: { values: xs, format: i => (i ? `Month ${i}` : 'Today') }, y: { format: moneyShort }, tableEvery: 6,
      series: [
        { key: 'm', label: 'Minimum only', color: C.red, values: xs.map(i => m.series[i] ?? null), format: x => money(x) },
        { key: 'f', label: `${money(p36)} a month`, color: C.green, values: xs.map(i => (i <= 36 ? c.balanceAfter(v.balance, v.apr, 36, i, p36) : null)), format: x => money(x) },
      ],
    });
    tape.print([
      { label: 'Balance', v: v.balance },
      { label: `Interest ${pct(v.apr, 2, true)} ÷ 12`, v: v.balance * v.apr / 12, op: 'add' },
      { label: `${pct(v.pct, 2)} of balance`, v: v.balance * v.pct, op: 'add' },
      { label: 'First minimum', v: m.firstPayment, kind: 'subtotal' },
      { label: 'Months at minimum', text: never ? 'never' : String(m.months) },
      { label: 'Interest at minimum', v: m.totalInterest },
      { label: '3-year payment', v: p36, op: 'eq' },
      { label: 'Interest over 3 years', v: t36 - v.balance },
      { label: 'Saved by paying more', v: never ? 0 : m.totalInterest - (t36 - v.balance), kind: 'total' },
    ]);
  };
  const b = bindBoxes(panel, update);
  update(b.values());
});

startTools();
