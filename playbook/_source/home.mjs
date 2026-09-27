// Playbook home: "the slate": a broadcast programme guide for the six plates.
// Called by build.mjs with the shared page helpers; returns the full HTML for playbook/index.html.

// the one rule change per sport that a newcomer is most likely to notice this season
const HEADLINE = { football: 0, baseball: 0, basketball: 0, soccer: 0, volleyball: 0, golf: 1 };
const LEAGUE = { football: 'NFL', baseball: 'MLB', basketball: 'NBA', soccer: 'IFAB', volleyball: 'FIVB', golf: 'USGA · R&A' };

const STEPS = [
  ['THE WORDS', 'Start with the twenty-odd words everything else assumes, each one defined in a sentence, and explained again wherever it shows up.'],
  ['THE FIELD', 'Orbit a to-scale 3D stadium, then flip on the layers of a regulation diagram: every line, zone and measurement labelled.'],
  ['THE PLAYS', 'Formations, routes, rotations and strategy as animated diagrams you can scrub, replay and drag, the way coaches draw them.'],
  ['THE RULEBOOK', 'What changed for the 2026 season, a searchable glossary and links straight to the official rules.']
];

export default function home({ plans, ORDER, head, topbar, footer, palette, esc, rich, ICONS, ARROW, SITE, original }) {
  const count = k => {
    const p = plans[k];
    const viz = p.sections.reduce((a, s) => a + s.blocks.filter(b => b.type === 'viz').length, 0);
    const terms = p.sections.reduce((a, s) => a + s.blocks.filter(b => b.type === 'terms').reduce((n, b) => n + b.rows.length, 0), 0);
    return { sections: p.sections.length, viz, terms, gloss: p.glossary.length };
  };
  const totals = ORDER.reduce((t, k) => { const c = count(k); t.viz += c.viz; t.terms += c.terms; t.sections += c.sections; return t; }, { viz: 0, terms: 0, sections: 0 });
  const plain = s => String(s).replace(/\*\*(.+?)\*\*/g, '$1');
  const crawl = ORDER.flatMap(k => plans[k].updates.map(u => `<span><b>${esc(LEAGUE[k])}</b>${esc(plain(u.title))}</span>`)).join('<i aria-hidden="true">◆</i>');

  const slate = ORDER.map((k, i) => {
    const p = plans[k];
    return `<li><a href="${k}/" data-k="${k}" data-sport="${k}"${i === 0 ? ' class="is-live"' : ''}><span class="sl-no">${esc(p.plate)}</span><span class="sl-icon">${ICONS[k]}</span><span class="sl-name"><b>${esc(p.name)}</b><em>${esc(p.tagline)}</em></span><span class="sl-go">${ARROW}</span><span class="sl-bar" aria-hidden="true"><i></i></span></a></li>`;
  }).join('');

  const plates = ORDER.map(k => {
    const p = plans[k], c = count(k);
    return `<a class="plate" href="${k}/" data-sport="${k}">
      <span class="plate-media"><span class="plate-img" style="background-image:url('assets/img/${k}-card.jpg')" role="img" aria-label="${esc(p.heroAlt)}"></span><i class="plate-sweep" aria-hidden="true"></i><span class="plate-no" aria-hidden="true">${esc(p.plate)}</span></span>
      <span class="plate-body">
        <span class="plate-tag">PLATE ${esc(p.plate)}</span>
        <span class="plate-name">${esc(p.name)}</span>
        <span class="plate-tagline">${esc(p.tagline)}</span>
        <span class="plate-periods" aria-label="Chapters: ${esc(p.periods.map(x => x.name).join(', '))}">${p.periods.map((x, i) => `<span style="--i:${i}" title="${esc(x.name)}">${esc(x.code)}</span>`).join('')}</span>
        <span class="plate-stats"><span><b>${c.sections}</b> sections</span><span><b>${c.viz}</b> interactive visuals</span><span><b>${c.terms}</b> concepts</span></span>
      </span>
    </a>`;
  }).join('');

  const watch = ORDER.map(k => {
    const p = plans[k], u = p.updates[HEADLINE[k] || 0];
    return `<a class="watch-row" href="${k}/#updates" data-sport="${k}"><span class="w-sport">${ICONS[k]}<b>${esc(p.name)}</b></span><span class="w-when">${esc(u.when)}</span><span class="w-copy"><b>${esc(plain(u.title))}</b><span>${rich(u.text)}</span></span><span class="w-go">${ARROW}</span></a>`;
  }).join('');

  const steps = STEPS.map(([t, d], i) => `<li style="--i:${i}"><span class="hw-code">Q${i + 1}</span><span class="hw-fill" aria-hidden="true"><i></i></span><b>${t}</b><p>${esc(d)}</p></li>`).join('');

  const bar = topbar(null, '').replace('aria-label="Search this page"', 'aria-label="Search the whole playbook"');
  return `${head({ title: 'Playbook: six sports explained visually, from zero', desc: `Football, baseball, basketball, soccer, volleyball and golf explained for complete beginners: 3D stadiums, ${totals.viz} interactive diagrams, ${totals.terms}+ concepts in plain English and every rule change for 2026.`, url: SITE, image: `${SITE}assets/img/football-og.jpg`, prefix: '' })}
<body class="home" data-sport="home">
${bar}
<main id="main">
<section class="slate-hero" aria-labelledby="home-title">
  <div class="slate-bg" aria-hidden="true">${ORDER.map((k, i) => `<div class="slate-shot${i === 0 ? ' is-on' : ''}" data-k="${k}" style="background-image:url('assets/img/${k}-hero.jpg')"></div>`).join('')}</div>
  <div class="slate-inner">
    <div class="slate-copy">
      <p class="onair"><span class="onair-dot" aria-hidden="true"></span>SIX SPORTS · EXPLAINED FROM ZERO · CURRENT TO THE 2026 SEASON</p>
      <h1 id="home-title"><span>Play</span><span>book</span></h1>
      <p class="lede">The rules, positions and plays of six sports, drawn to scale, animated in 3D and explained in plain English. <strong>No experience needed:</strong> pick a sport and start from the first whistle.</p>
      <div class="cta-row"><a class="btn btn-primary" href="#plates">Pick a sport ${ARROW}</a><button class="btn btn-ghost" type="button" data-open-search>Search ${Math.floor(totals.terms / 50) * 50}+ terms</button></div>
    </div>
    <div class="slate-guide">
      <p class="slate-label"><span>THE SLATE</span><em>6 PLATES · ${totals.viz} VISUALS</em></p>
      <ol class="slate" aria-label="The six sports">${slate}</ol>
    </div>
  </div>
  <div class="crawl" role="marquee" aria-label="Rule changes this season">
    <span class="crawl-tag">RULEBOOK WATCH</span>
    <div class="crawl-track"><div class="crawl-run">${crawl}<i aria-hidden="true">◆</i></div><div class="crawl-run" aria-hidden="true">${crawl}<i>◆</i></div></div>
  </div>
</section>

<section class="home-sec" id="plates" aria-labelledby="plates-h">
  <header class="home-head"><p class="sec-period">The plates</p><h2 id="plates-h">Six sports. One way to learn them.</h2><p class="sec-intro">Every plate is written for someone who has never watched the sport, and deep enough that fans still find something new.</p></header>
  <div class="plates">${plates}</div>
</section>

<section class="home-sec" id="how" aria-labelledby="how-h">
  <header class="home-head"><p class="sec-period">How a plate is played</p><h2 id="how-h">Four periods, in order.</h2><p class="sec-intro">Each page is split into periods, just like the game. A progress bar fills as you read, so you always know where you are.</p></header>
  <ol class="howbar">${steps}</ol>
</section>

<section class="home-sec" id="watch" aria-labelledby="watch-h">
  <header class="home-head"><p class="sec-period">Rulebook watch</p><h2 id="watch-h">What changed this season.</h2><p class="sec-intro">One headline change per sport. Each plate lists the rest, with links to the official rulebooks.</p></header>
  <div class="watch">${watch}</div>
</section>

<section class="home-sec home-outro" aria-label="About Playbook">
  <p>Playbook is a <a href="https://www.safisolutions.org/">Safi Solutions</a> project, turning complicated things simple. Dimensions and rules follow the official NFL, MLB, NBA, IFAB, FIVB and USGA/R&amp;A documents cited on every plate.</p>
</section>
</main>
${footer('')}
${palette('Search every sport: terms, concepts and sections…')}
<script type="module" src="assets/js/playbook.js"></script>
</body>
</html>
`;
}
