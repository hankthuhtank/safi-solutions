// Glossary: every term on Moneywise, filed like index cards, A to Z.
export default (k) => {
  const { GLOSSARY, MODULES, esc } = k;
  const sortKey = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  const letterOf = term => (/^[a-z]/i.test(term) ? term[0].toUpperCase() : '#');
  const keys = Object.keys(GLOSSARY).sort((a, b) => sortKey(GLOSSARY[a].term).localeCompare(sortKey(GLOSSARY[b].term), 'en'));
  const byLetter = new Map();
  for (const key of keys) {
    const L = letterOf(GLOSSARY[key].term);
    if (!byLetter.has(L)) byLetter.set(L, []);
    byLetter.get(L).push(key);
  }
  const ALPHA = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const slug = L => (L === '#' ? 'num' : L.toLowerCase());
  const modName = s => MODULES.find(m => m.slug === s)?.name ?? s;
  const counts = MODULES.map(m => ({ m, n: keys.filter(x => GLOSSARY[x].module === m.slug).length }));

  const card = key => {
    const g = GLOSSARY[key];
    return `<article class="gl-card" id="${key}" data-module="${g.module}" data-letter="${slug(letterOf(g.term))}" data-names="${esc((g.term + ' ' + (g.abbr || '')).toLowerCase())}">
  <h3>${esc(g.term)}${g.abbr ? `<small>${esc(g.abbr)}</small>` : ''}</h3>
  <p>${esc(g.short)}</p>
  ${g.seen ? `<p class="seen"><b>Seen on</b>${esc(g.seen)}</p>` : ''}
  ${g.ex ? `<p class="ex"><b>Example</b>${esc(g.ex)}</p>` : ''}
  <a class="more" href="/moneywise/${g.module}/">${esc(modName(g.module))} →</a>
</article>`;
  };

  const list = [...byLetter].sort((a, b) => ALPHA.indexOf(a[0]) - ALPHA.indexOf(b[0]))
    .map(([L, ks]) => `<h2 class="gl-letter" id="letter-${slug(L)}" data-letter="${slug(L)}"><span>${L === '#' ? '0–9' : L}</span></h2>${ks.map(card).join('')}`).join('');

  const body = `
<div class="wrap">
  ${k.head({ title: 'Glossary', sub: 'Every money word on this site, in plain English. Tap a dotted word on any page to see its card.' })}
  <section class="gl" aria-label="All terms">
    <div class="gl-tools">
      <label class="gl-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><span class="vh">Search the glossary</span><input id="gl-q" type="search" placeholder="Search, e.g. escrow or APR" autocomplete="off" spellcheck="false"></label>
      <div class="gl-filter" role="group" aria-label="Show terms from">
        <button type="button" data-mod="all" aria-pressed="true">All<small>${keys.length}</small></button>${counts.map(({ m, n }) => `<button type="button" data-mod="${m.slug}" aria-pressed="false">${m.tab}<small>${n}</small></button>`).join('')}
      </div>
    </div>
    <nav class="gl-letters" aria-label="Jump to a letter">${ALPHA.map(L => byLetter.has(L) ? `<a href="#letter-${slug(L)}" data-letter="${slug(L)}">${L}</a>` : `<span aria-hidden="true">${L}</span>`).join('')}<p class="gl-count" aria-live="polite" data-gl-count>${keys.length} terms</p></nav>
    <div class="gl-list">${list}</div>
    <p class="gl-empty" hidden>No card matches that. Try a shorter word, or <button type="button" data-gl-reset>show every term</button>.</p>
  </section>
</div>`;

  return {
    slug: 'glossary',
    title: 'Glossary: every money term in plain English | Moneywise',
    description: `${keys.length} financial terms explained in plain English, with where you will see each one on real paperwork and a worked number: APR, APY, PMI, escrow, coinsurance, marginal rate, employer match and more.`,
    body,
  };
};
