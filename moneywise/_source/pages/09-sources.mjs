// Schedule S: where every number comes from, the checks the math must pass, and the assumptions behind it.
import { money } from '../../js/format.js';

export default (k, { TESTS, TESTED_ON }) => {
  const { rates, TAX, LIMITS, MODULES, esc, asOf, rate, asof, part } = k;
  const SOURCES = k.SOURCES;
  const S = rates.series;
  const modLink = s => { const m = MODULES.find(x => x.slug === s); return m ? `<a href="/moneywise/${m.slug}/">${m.tab}</a>` : s === 'tests' ? '<a href="#checks">Checks</a>' : ''; };
  const date = d => (d && /^\d{4}/.test(d) ? (d.length === 7 ? asOf(d + '-01', 'monthly') : d.length === 4 ? d : asOf(d)) : '');
  const src = id => SOURCES.find(s => s.id === id);
  const cite = id => { const s = src(id); return s ? `<a href="${s.url}" rel="noopener" target="_blank">${esc(s.title)}</a>` : ''; };

  /* ---------------- Part I: live numbers */
  const node = (small, big, span, cls = '') => `<div class="pnode ${cls}"><small>${small}</small><b>${big}</b><span>${span}</span></div>`;
  const arrow = label => `<div class="parrow" aria-hidden="true"><span>${label}</span></div>`;
  const ids = Object.keys(S).filter(id => id !== 'FEDTARGET');
  const value = id => (S[id].units === '$' ? money(S[id].latest?.value) : rate(id));
  const what = id => (id === 'CPIAUCSL' ? 'Inflation: the change in the Consumer Price Index over the last 12 months' : esc(S[id].label));
  const live = `
<div class="prose">
  <p class="lead">Every rate on Moneywise comes from <a href="https://fred.stlouisfed.org/" rel="noopener" target="_blank">FRED</a>, the free economic database of the Federal Reserve Bank of St. Louis, which republishes the original figures from Freddie Mac, the Federal Reserve Board, the Bureau of Labor Statistics, the FDIC and the Census Bureau. Each number on the site carries its own date, because the series update on different schedules.</p>
</div>
<div class="pipes" role="list" aria-label="How live numbers reach this page">
  <div class="pipe" role="listitem">${node('Source', 'FRED', 'Federal Reserve Bank of St. Louis, 16 series', 'src')}${arrow('once a day at most')}${node('Moneywise Worker', 'Cloudflare', 'holds the FRED key on the server and keeps a copy for 24 hours')}${arrow('JSON, with dates')}${node('This page', 'Your browser', 'shows each number with its as-of date', 'out')}</div>
  <div class="pipe" role="listitem">${node('If the feed is down', 'Snapshot', `a saved copy of the same data, made ${asOf(rates.generated.slice(0, 10))}`, 'src')}${arrow('built into every page')}${node('Fallback', 'Printed numbers', 'pages read correctly before any script runs')}${arrow('labeled Snapshot')}${node('This page', 'Your browser', 'the strip at the top says which you are seeing', 'out')}</div>
</div>
<p class="micro" style="margin:0 0 10px">Now showing: <b data-mode>${rates.mode === 'live' ? 'Live from FRED' : 'Snapshot'}</b></p>
<div class="table-scroll"><table class="src-table">
  <thead><tr><th>Series</th><th>What it measures</th><th class="n">Latest</th><th>As of</th><th>Updated</th><th>Published by</th></tr></thead>
  <tbody>${ids.map(id => `<tr><td><a href="${S[id].url}" rel="noopener" target="_blank"><code>${id}</code></a></td><td>${what(id)}</td><td class="n">${value(id)}</td><td class="d">${asof(id)}</td><td>${S[id].freq}</td><td>${esc(S[id].publisher)}</td></tr>`).join('')}</tbody>
</table></div>
${k.note('Averages, not offers', '<p>Survey rates are national averages. Freddie Mac\'s mortgage rate assumes a borrower with strong credit and 20% down; the Fed\'s G.19 card and loan rates are averages across commercial banks. Your own quote depends on your credit, down payment, loan type and lender.</p>')}`;

  /* ---------------- Part II: tables */
  const table = (file, j, year) => `<tr><td><a href="/moneywise/data/${file}"><code>${file}</code></a></td><td>${esc(j.table)}<small>${esc(j.effective)}</small></td><td class="n">${year}</td><td class="d">${asOf(j.checked)}</td><td><ul class="cites">${Object.values(j.sources).map(s => `<li><a href="${s.url}" rel="noopener" target="_blank">${esc(s.title)}</a>${s.published ? ` <span>(${asOf(s.published)})</span>` : ''}</li>`).join('')}</ul></td></tr>`;
  const tables = `
<div class="prose">
  <p>Tax brackets, deductions and contribution limits change every year, so they live in two small data files instead of inside the code. Each file names the tax year it applies to, the date it was checked, the official documents it was copied from, and when the next update is due. The calculators read these files directly.</p>
</div>
<div class="table-scroll"><table class="src-table tables">
  <thead><tr><th>File</th><th>What it holds</th><th class="n">Year</th><th>Checked</th><th>Copied from</th></tr></thead>
  <tbody>${table('tax-2026.json', TAX, TAX.taxYear)}${table('limits-2026.json', LIMITS, LIMITS.year)}</tbody>
</table></div>
<dl class="defs">
  <div><dt>Next tax update</dt><dd>${esc(TAX.nextUpdate)}</dd></div>
  <div><dt>Next limits update</dt><dd>${esc(LIMITS.nextUpdate)}</dd></div>
</dl>`;

  /* ---------------- Part III: the checks */
  // each check is filed under the form it protects; the text before the colon names the exact calculation
  const FILE = [
    ['Mortgage', /^(amortization|APR from payments|PMI|points|refinance)/],
    ['Interest and savings', /^(APY|APR to APY|growth)/],
    ['Credit', /^(debt payoff|minimum payments)/],
    ['Car loans', /^cars/],
    ['Health insurance', /^insurance/],
    ['Taxes', /^(brackets|income tax|IRS Tax Table|Schedule 1-A|payroll|paycheck)/],
    ['Savings and retirement', /^(fees|retirement)/],
  ];
  const groups = FILE.map(([g]) => ({ g, items: [] }));
  for (const t of TESTS) {
    const i = t.name.indexOf(': ');
    const head = i > 0 ? t.name.slice(0, i) : '', d = i > 0 ? t.name.slice(i + 2) : t.name;
    const at = FILE.findIndex(([, re]) => re.test(t.name));
    (groups[at < 0 ? 1 : at]).items.push({ ok: t.ok, head, d });
  }
  const against = [
    ['Amortization', 'CFPB sample Loan Estimate and Closing Disclosure: $162,000 at 3.875% for 30 years. Payment $761.78, $15,773 of principal in five years, Total Interest Percentage 69.46%.', ['cfpb-le', 'cfpb-cd']],
    ['APY', 'Regulation DD, Appendix A: the worked yields of 6.17%, 6.18% and the stepped-rate certificate at 5.39%.', ['regdd']],
    ['Tax brackets', 'Revenue Procedure 2025-32: every published base amount for all four filing statuses.', ['irs-rp2532']],
    ['IRS Tax Table', 'The 2025 Tax Table in the Form 1040 instructions: seven rows per filing status, to the dollar.', ['irs-i1040', 'irs-rp2440']],
    ['Schedule 1-A', 'The new deductions for tips, overtime, car loan interest and seniors, with each phase-out rule.', ['irs-sch1a']],
    ['Payroll tax', 'The 2026 Social Security wage base of $184,500 and the Additional Medicare Tax threshold.', ['ssa-cbb']],
    ['Fees', 'The SEC\'s investor bulletin example: $100,000 at 4% for 20 years with 0.25%, 0.50% and 1% fees.', ['sec-fees']],
  ];
  const checks = `
<div class="prose">
  <p class="lead">The formulas behind every calculator are tested against worked examples published by the agencies that write the rules. The site is rebuilt only when every check passes; the last run was ${asOf(TESTED_ON)}, and all ${TESTS.length} passed.</p>
</div>
<div class="table-scroll"><table class="src-table">
  <thead><tr><th>Checked against</th><th>What has to match</th><th>Document</th></tr></thead>
  <tbody>${against.map(([n, d, s]) => `<tr><td><b>${n}</b></td><td>${d}</td><td>${s.map(cite).join('<br>')}</td></tr>`).join('')}</tbody>
</table></div>
<h3 class="checks-h">All ${TESTS.length} checks</h3>
<div class="check-groups">${groups.filter(g => g.items.length).map(g => `<section><h4>${esc(g.g)} <span>${g.items.length}</span></h4><ul class="tests">${g.items.map(x => `<li${x.ok ? '' : ' class="fail"'}><span>${x.head ? `<b>${esc(x.head)}</b> ` : ''}${esc(x.d)}</span></li>`).join('')}</ul></section>`).join('')}</div>
<p class="fine-run">Run them yourself from a copy of the site: <code>node --test moneywise/tests/calc.test.mjs</code></p>`;

  /* ---------------- Part IV: every source */
  const order = ['rates', 'mortgage', 'car', 'credit', 'insurance', 'taxes', 'retirement', 'tests'];
  const sorted = [...SOURCES].sort((a, b) => Math.min(...a.for.map(f => order.indexOf(f))) - Math.min(...b.for.map(f => order.indexOf(f))));
  const all = `
<div class="table-scroll"><table class="src-table every">
  <thead><tr><th>Publisher</th><th>Document</th><th>Date</th><th>Used on</th></tr></thead>
  <tbody>${sorted.map(s => `<tr><td>${esc(s.publisher)}</td><td><a href="${s.url}" rel="noopener" target="_blank">${esc(s.title)}</a></td><td class="d">${date(s.date) || (s.date ? esc(s.date) : '')}</td><td>${s.for.map(modLink).filter(Boolean).join(', ')}</td></tr>`).join('')}</tbody>
</table></div>`;

  /* ---------------- Part V: method */
  const method = `
<div class="method prose">
  <h3>Rounding</h3>
  <ul>
    <li>Loan payments are rounded to the cent each month, the way servicers post them; the last payment absorbs the leftover cents. Big figures on screen are rounded to the dollar, and the tape shows cents.</li>
    <li>Tax under $100,000 of taxable income can differ by a few dollars from your return, because the IRS Tax Table taxes the middle of each $50 band. The tax calculator says when that applies.</li>
  </ul>
  <h3>Assumptions, form by form</h3>
  <ul>
    <li><b>Mortgage.</b> PMI is charged on the original loan amount and ends when the scheduled balance reaches 78% of the original value (automatic under the Homeowners Protection Act), at 80% if you ask, and never later than the midpoint of the term. APR uses the actuarial method of Regulation Z, Appendix J.</li>
    <li><b>Car loans.</b> A new car is assumed to lose about 20% of its value in the first year and about 16% a year after that (roughly 40% left at five years). Sales tax is figured after the trade-in, as most states do.</li>
    <li><b>Interest rates.</b> APY = (1 + APR / n)<sup>n</sup> − 1 for n compounding periods a year. The rate-shock tool moves card, home-equity and savings rates one for one with the Fed; for savings that is the most you could expect, since banks usually pass on less, and later.</li>
    <li><b>Credit.</b> Interest accrues monthly at APR ÷ 12. Every debt gets its minimum first; the rest of the budget goes to the target debt, and a paid-off debt's payment rolls to the next. The minimum-payment example uses a common issuer formula: 1% of the balance plus that month's interest, at least $35.</li>
    <li><b>Health insurance.</b> You pay the deductible, then your coinsurance share, until the out-of-pocket maximum; premiums are paid on top and never count toward it. In-network care only.</li>
    <li><b>Taxes.</b> ${TAX.taxYear} federal brackets and deductions; the child tax credit phases out by $50 per $1,000 of income over $200,000 ($400,000 joint). Paycheck withholding is approximated as the year's tax spread evenly; your employer's IRS Publication 15-T tables land close to this when your W-4 is current. State tax is a flat estimate you enter.</li>
    <li><b>Savings and retirement.</b> Returns are assumptions, not forecasts. Fees come out of each year's return: (1 + return) × (1 − fee) − 1, the SEC's method. Contributions arrive through the year, are capped at the IRS limit for your age, and the limits rise with inflation after ${LIMITS.year}. "Today's dollars" divides by (1 + inflation)<sup>years</sup>.</li>
  </ul>
  <h3>What Moneywise is not</h3>
  <ul>
    <li>It is education, not financial, tax or legal advice, and it is not a lender, broker or insurer. Nothing here is an offer, and nothing is sold.</li>
    <li>It covers the United States. The calculators run in your browser; nothing you type is sent anywhere or saved.</li>
  </ul>
</div>`;

  const parts = [
    ['live', 'Live numbers', 'Live numbers', live],
    ['tables', 'Tax & limit tables', 'Tax and limit tables', tables],
    ['checks', 'The checks', 'The checks', checks],
    ['every', 'Every source', 'Every source', all],
    ['method', 'Method', 'Method and assumptions', method],
  ];
  const roman = i => ['I', 'II', 'III', 'IV', 'V'][i];
  const body = `
<div class="wrap">
  <header class="form-head">
    <div class="form-id"><span>Schedule</span><b>S</b><small>${SOURCES.length} sources<br>${TESTS.length} checks</small></div>
    <div class="form-title"><p class="dept">Moneywise · Department of Plain English</p><h1>Sources &amp; checks</h1><p class="lede">Where every number on Moneywise comes from, how the live rates reach this page, the tests the math must pass before the site is rebuilt, and the assumptions behind each calculator.</p></div>
    <aside class="form-today" aria-labelledby="today-h"><h2 id="today-h">On file</h2><dl>
      <div><dt>Live series</dt><dd>${ids.length}<small>from FRED</small></dd></div>
      <div><dt>Tax year</dt><dd>${TAX.taxYear}<small>Rev. Proc. 2025-32</small></dd></div>
      <div><dt>Checks passed</dt><dd>${TESTS.filter(t => t.ok).length} of ${TESTS.length}<small>${asOf(TESTED_ON)}</small></dd></div>
      <div><dt>Documents cited</dt><dd>${SOURCES.length}</dd></div>
    </dl></aside>
  </header>
  <div class="module-grid">
    <nav class="parts-rail" aria-label="Parts of this schedule"><ol>${parts.map(([id, short], i) => `<li><a href="#${id}"><span>Part ${roman(i)}</span>${short}</a></li>`).join('')}</ol></nav>
    <div class="module-body">${parts.map(([id, , title, html], i) => part(i + 1, id, title, html)).join('')}</div>
  </div>
</div>`;

  return {
    slug: 'sources',
    title: 'Sources and checks: where every number comes from | Moneywise',
    description: `Every source behind Moneywise: ${ids.length} live FRED series with dates, the ${TAX.taxYear} IRS tax and limit tables, ${TESTS.length} math checks against CFPB, IRS, Regulation DD and SEC examples, and the assumptions behind each calculator.`,
    body,
  };
};
