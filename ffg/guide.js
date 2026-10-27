'use strict';
(() => {
  const DATA = JSON.parse(document.getElementById('guide-data').textContent);
  const FFR = JSON.parse(document.getElementById('resonance-data').textContent);
  const BASE = document.documentElement.dataset.base;
  const ART = new URL('../ffr/art/', BASE).href;
  const KEY = 'ffg-progress-v1';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const prose = value => esc(text(value)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  function text(value) {
    if (value == null) return '';
    if (typeof value !== 'object') return String(value);
    if (Array.isArray(value)) return value.map(text).join(' · ');
    return Object.entries(value).map(([key, item]) => `${key}: ${text(item)}`).join(' · ');
  }
  function safeUrl(value) {
    try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? esc(url.href) : '#'; } catch { return '#'; }
  }
  let state = { version: 1, games: {}, font: 17, motion: !matchMedia('(prefers-reduced-motion: reduce)').matches };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.version === 1 && saved.games && typeof saved.games === 'object') state = { ...state, ...saved };
  } catch { /* A blocked storage API leaves the guide usable for this session. */ }
  let game = null, view = 'overview', search = '', sortKey = 'name', sortDir = 1, filter = '', filterType = '';
  let resonanceUrl, searchTimer, toastTimer, particleFrame, lastParticleTime = 0;
  const THEMES = {
    1: { roman:'I', name:'Final Fantasy I', chapter:'The crystals awaken', subtitle:'The beginning of the legend', platform:'NES · 1987 / 1990', accent:'#8bcef4', wash:'#19364e', panel:'#0d192a', bg:'#040912', hero:'warrior-of-light', scene:'earth-shrine', motif:'CRYSTALS & PROPHECY' },
    2: { roman:'II', name:'Final Fantasy II', chapter:'Against the empire', subtitle:'A rebellion written in blood', platform:'FAMICOM · 1988', accent:'#e99b9e', wash:'#44202d', panel:'#21101b', bg:'#0b050b', hero:'firion', scene:'dark-symphony', motif:'REBELLION & SACRIFICE' },
    3: { roman:'III', name:'Final Fantasy III', chapter:'Between light & darkness', subtitle:'Four lights against the void', platform:'FAMICOM · 1990', accent:'#96d8c1', wash:'#163b37', panel:'#0e211f', bg:'#040c0c', hero:'onion-knight', scene:'the-crystal-tower', motif:'LIGHT & DARKNESS' },
    4: { roman:'IV', name:'Final Fantasy IV', chapter:'From darkness to light', subtitle:'A knight beneath the twin moons', platform:'SUPER FAMICOM · 1991', accent:'#c6b0ed', wash:'#302747', panel:'#171326', bg:'#070510', hero:'cecil', scene:'eternal-summit', motif:'REDEMPTION & THE MOON' },
    5: { roman:'V', name:'Final Fantasy V', chapter:'Where the wind leads', subtitle:'A world carried on the wind', platform:'SUPER FAMICOM · 1992', accent:'#9ad7d2', wash:'#19413d', panel:'#10241f', bg:'#050d0c', hero:'bartz', scene:'rain-road', motif:'WIND & POSSIBILITY' },
    6: { roman:'VI', name:'Final Fantasy VI', chapter:'Beyond the ruined world', subtitle:'Magic at the edge of extinction', platform:'SNES / SUPER FAMICOM · 1994', accent:'#e7ad8d', wash:'#42302f', panel:'#211719', bg:'#0b0709', hero:'terra', scene:'mobreeze-airship-factory-1', motif:'MAGIC & MACHINERY' }
  };
  const NAV = [
    ['overview','Command room','icon-story'],['walkthrough','Walkthrough','quest'],['missables','Missables','caution'],
    ['equipment','Equipment','weapon'],['abilities','Magic & abilities','icon-book'],['jobs','Party & jobs','icon-rank'],
    ['bosses','Boss strategies','colosseum'],['optional','Side quests','quest-sub'],['setups','Recommended setups','stat-power'],
    ['progress','My checklist','quest-clear'],['notes','Notes & backup','save'],['versions','Compare editions','icon-book'],['sources','Research sources','notice'],['keywords','Key words','icon-story']
  ];
  function current() { return DATA.find(item => Number(item.id) === game); }
  function gs(id = game) {
    if (!state.games[id] || typeof state.games[id] !== 'object') state.games[id] = { checked:{}, chapter:0, notes:'' };
    const item = state.games[id];
    if (!item.checked || typeof item.checked !== 'object') item.checked = {};
    if (typeof item.notes !== 'string') item.notes = '';
    return item;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { toast('Progress is held for this session. Browser storage is unavailable.'); }
  }
  function toast(message) {
    $('#toast')?.remove();
    const node = document.createElement('div'); node.id = 'toast'; node.className = 'toast'; node.setAttribute('role','status'); node.textContent = message;
    document.body.append(node); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.remove(), 3200);
  }
  function applyTheme(id) {
    const t = THEMES[id];
    for (const [key, value] of Object.entries({accent:t?.accent || '#83d8f1',wash:t?.wash || '#183047',panel:t?.panel || '#0c1422',bg:t?.bg || '#05080f'})) document.documentElement.style.setProperty(`--${key}`, value);
    document.documentElement.style.setProperty('--size', `${Math.min(21,Math.max(15,Number(state.font)||17))}px`);
    document.body.dataset.game = id || 'library';
    document.body.classList.toggle('motion-off', !state.motion);
  }
  function img(path, className = '', alt = '') { return `<img src="${ART}${path}.webp" class="${className}" alt="${esc(alt)}" loading="lazy">`; }
  function sprite(t) { return state.motion ? img(`v/${t.hero}`, 'game-sprite', '') : img(`vf/${t.hero}`, 'game-sprite static-sprite', ''); }
  function refs(ids) {
    const d = current();
    if (!ids?.length || !d) return '';
    return `<div class="sources">${ids.map(id => { const s = d.sources?.find(x=>x.id===id); return s ? `<a href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(s.label)}">${esc(s.label)}</a>` : ''; }).join('')}</div>`;
  }
  function tier(value) { return value ? `<span class="tier tier-${esc(value)}">${esc(value)}</span>` : '<span class="muted">—</span>'; }
  function tasks(d) { return d.chapters.flatMap((c,i)=>(c.checklist?.length?c.checklist:[`Complete ${c.title}`]).map((label,j)=>({key:`ch-${i}-${j}`,label,chapter:i}))); }
  function progress(d) { const all = tasks(d), checked = gs(d.id).checked; const done = all.filter(x=>checked[x.key]).length; return {done,total:all.length,percent:all.length?Math.round(done/all.length*100):0}; }
  function checkedChapter(d, index) { const items=tasks(d).filter(x=>x.chapter===index); return items.length && items.every(x=>gs(d.id).checked[x.key]); }
  function renderLibrary() {
    game = null; search = ''; applyTheme(null);
    document.title = 'Final Fantasy · The field guides';
    $('#app').innerHTML = `<header class="topbar"><a class="mark" href="#" data-home>${img('i/title-emblem')}<div><b>FINAL FANTASY</b><small>The personal field guides</small></div></a><div class="utility"><span class="tag hide-small">THE ORIGINAL COLLECTION</span><button data-motion aria-pressed="${state.motion}">${state.motion?'◇ Motion on':'◇ Motion off'}</button><button data-lock>Lock</button></div></header>
      <main class="library" id="main"><section class="library-hero"><div class="crystal-ring" aria-hidden="true"></div><span class="eyebrow">Six beginnings. Countless adventures.</span><h1>Final Fantasy<span>THE FIELD GUIDES</span></h1><div class="divider"></div><p>Choose a world. Find your way through it.<br>Original games, carefully charted—from the first crystal to the last battle.</p></section>
      <div class="library-label"><span class="eyebrow">Choose your adventure</span><span class="tag">I — VI</span></div>
      <div class="game-grid">${DATA.map(d=>{const t=THEMES[d.id],p=progress(d);return `<button class="game-card frame" data-game="${d.id}" style="--accent:${t.accent};--wash:${t.wash};--panel:${t.panel};--deep:${t.bg}" aria-label="Open ${t.name}"><div class="game-art" style="background-image:url('${ART}l/${t.scene}.webp')"></div><span class="game-number" aria-hidden="true">${t.roman}</span><div class="card-top"><span>${String(d.id).padStart(2,'0')}</span><span>${esc(t.motif)}</span></div>${sprite(t)}<div class="card-body"><h2>${t.name}</h2><p>${t.subtitle}</p><div class="card-bottom"><span>${p.done?`${p.percent}% of checklist complete`:t.platform}</span><b aria-hidden="true">→</b></div></div><span class="resume-bar" style="width:${p.percent}%"></span></button>`;}).join('')}</div>
      <button class="resonance-card frame" data-resonance><div class="game-art" style="background-image:url('${ART}l/g-hero.webp')"></div><div><span class="eyebrow">A different kind of resonance</span><h2>Final Fantasy Resonance</h2><p>Your existing guide. Visions, abilities, equipment, and the journey through Lapis.</p></div>${img('c/rain')}<span class="sigil" aria-hidden="true">→</span></button>
      <footer class="library-foot"><span>Original adventures. GBA additions and remaster changes clearly marked.</span><span class="pixel">◆ PERSONAL FIELD GUIDES</span></footer></main>`;
  }
  function openGame(id) {
    if (!THEMES[id] || !DATA.some(x=>Number(x.id)===id)) return;
    game = Number(id); view = 'overview'; search = ''; filter = ''; filterType = ''; sortKey = 'name'; sortDir = 1;
    applyTheme(game); const t = THEMES[game]; document.title = `${t.name} · Field guide`;
    const navigation = NAV.filter(([key]) => key !== 'keywords' || current().keywords?.length);
    $('#app').innerHTML = `<div class="mobile-overlay" id="mobile-overlay" data-close-nav></div><div class="guide-shell"><aside class="sidebar" id="sidebar" aria-label="Guide navigation"><div class="side-brand"><span class="eyebrow">THE FIELD GUIDES</span><span class="roman">${t.roman}</span><h2>${t.name}</h2><small>ORIGINAL RELEASE</small></div><nav class="side-nav"><div class="nav-group">Your adventure</div>${navigation.map(([id,label,icon],i)=>`${i===3?'<div class="nav-group">The archives</div>':''}${i===9?'<div class="nav-group">Field records</div>':''}<button data-view="${id}">${img(`i/${icon}`)}<span>${label}</span></button>`).join('')}</nav><div class="side-footer"><button class="library-back" data-home>← All adventures</button><div class="row"><button data-font="-1" aria-label="Smaller text">A−</button><button data-font="1" aria-label="Larger text">A+</button><button data-motion aria-label="Toggle animation" aria-pressed="${state.motion}">${state.motion?'◇':'◈'}</button><button data-lock>Lock</button></div></div></aside><main class="guide-main" id="main"><header class="guide-top"><button class="mobile-menu" data-menu aria-label="Open navigation" aria-expanded="false">☰</button><label class="sr" for="search">Search this guide</label><input id="search" type="search" placeholder="Search places, weapons, spells, bosses…  /" autocomplete="off"><span class="game-label">${t.motif}</span></header><div class="content" id="content" tabindex="-1"></div></main></div>`;
    renderView(); window.scrollTo(0,0);
  }
  function setView(next) {
    if (!NAV.some(x=>x[0]===next)) return;
    view = next; search = ''; filter = ''; filterType = ''; sortKey='name';sortDir=1;
    if ($('#search')) $('#search').value = '';
    closeNav(); renderView(); window.scrollTo(0,0); $('#content').focus({preventScroll:true});
  }
  function title(heading, description, eyebrow = 'THE ARCHIVES') { return `<header class="section-head"><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(heading)}</h2>${description?`<p>${prose(description)}</p>`:''}</header>`; }
  function overview(d) {
    const t = THEMES[game], p = progress(d), index = Math.min(Math.max(0,Number(gs().chapter)||0),d.chapters.length-1);
    return `<section class="page-hero frame"><div class="game-art" style="background-image:url('${ART}l/${t.scene}.webp')"></div><span class="eyebrow">${t.platform} · ORIGINAL RELEASE</span><h1>${t.chapter}</h1><p>${prose(d.intro)}</p>${sprite(t)}<div class="row"><button class="btn-primary" data-chapter="${index}">${p.done?'Continue your journey':'Begin your journey'} →</button><button data-view="missables">Before you miss it</button></div></section>
      <div class="stats-grid">${[[d.chapters.length,'Route stages'],[d.equipment.length,'Equipment entries'],[d.abilities.length,'Spells & abilities'],[d.bosses.length,'Boss strategies']].map(([n,label])=>`<div class="frame stat"><b>${n}</b><span>${label}</span></div>`).join('')}</div>
      <div class="two-col"><section class="frame panel-pad"><div class="row between"><h3>Your field record</h3><span class="tag">${p.percent}%</span></div><p class="muted">${p.done} / ${p.total} route objectives checked</p><div class="progress-track"><i style="width:${p.percent}%"></i></div><p class="soft">Current stop: <strong>${esc(d.chapters[index].title)}</strong></p><button data-view="progress">Open checklist →</button></section><section class="frame panel-pad"><span class="eyebrow">Version matters</span><h3>${esc(d.edition)}</h3><p class="soft">${prose(d.versionNotes?.[0] || 'Original release mechanics and names are used throughout.')}</p><div class="row"><button data-view="versions">Original · GBA · Remasters →</button><button data-view="sources">Sources</button></div></section></div>
      ${title('Know your systems','The mechanics that matter before you spend your gil.','BEFORE YOU SET OUT')}<div class="two-col">${d.mechanics.map(m=>`<article class="frame mechanic"><h3>${esc(m.name)}</h3><p>${prose(m.detail)}</p>${refs(m.sources)}</article>`).join('')}</div>
      ${d.coverage?`<p class="database-note">${prose(d.coverage)}</p>`:''}`;
  }
  function walkthrough(d) {
    let index = Math.min(Math.max(0,Number(gs().chapter)||0),d.chapters.length-1); gs().chapter=index;
    const c = d.chapters[index], items = tasks(d).filter(x=>x.chapter===index);
    return `${title('Walkthrough','A clear route through the original game. Key items and selected treasure pickups appear in gold bold text.','THE JOURNEY')}<div class="chapter-layout"><nav class="chapter-nav frame" aria-label="Walkthrough stages">${d.chapters.map((ch,i)=>`<button data-chapter="${i}" class="${i===index?'active':''}" ${i===index?'aria-current="step"':''}><span class="num">${String(i+1).padStart(2,'0')}</span><span>${esc(ch.title)}</span>${checkedChapter(d,i)?'<span class="done" aria-label="Complete">◆</span>':''}</button>`).join('')}</nav><div><article class="chapter-card frame"><div class="row between"><span class="tag">STAGE ${String(index+1).padStart(2,'0')} / ${d.chapters.length}</span><span class="pill">${esc(c.region || 'Main quest')}</span></div><h2>${esc(c.title)}</h2><p class="summary">${prose(c.summary)}</p>${c.recommended?`<p class="muted">${prose(c.recommended)}</p>`:''}
      ${(c.warnings||[]).map(w=>`<div class="notice danger" style="margin:12px 0">${prose(w)}</div>`).join('')}<ol class="route">${(c.steps||[]).map(step=>`<li>${prose(step)}</li>`).join('')}</ol>
      ${c.treasures?.length?`<section class="chapter-section"><h3>${img('i/chest')}Worth picking up</h3>${c.treasures.map(item=>typeof item==='string'?`<div class="treasure"><strong>${esc(item)}</strong></div>`:`<div class="treasure"><strong>${esc(item.name)}</strong><p>${prose(item.location)}</p>${item.note?`<p>${prose(item.note)}</p>`:''}</div>`).join('')}</section>`:''}
      ${c.bosses?.length?`<section class="chapter-section"><h3>${img('i/colosseum')}Boss encounter</h3>${c.bosses.map(name=>{const boss=d.bosses.find(b=>b.name===name||b.name.includes(name));return `<div class="treasure"><strong>${esc(name)}</strong>${boss?`<p>${prose(boss.strategy)}</p>`:''}</div>`;}).join('')}<button data-view="bosses">All boss strategies →</button></section>`:''}
      <section class="chapter-section"><h3>${img('i/quest-clear')}Before you move on</h3>${items.map(item=>check(item)).join('')}</section>${refs(c.sources)}</article><div class="chapter-bottom"><button data-chapter="${index-1}" ${index===0?'disabled':''}>← Previous stage</button><button class="btn-primary" data-chapter="${index+1}" ${index===d.chapters.length-1?'disabled':''}>Next stage →</button></div></div></div>`;
  }
  function check(item) { const done = !!gs().checked[item.key]; return `<label class="check ${done?'checked':''}"><input type="checkbox" data-check="${esc(item.key)}" ${done?'checked':''}><span>${prose(item.label)}</span></label>`; }
  function toolbar(data, field = 'type', ranks = true) {
    const types=[...new Set(data.map(item=>text(item[field])).filter(Boolean))].sort();
    return `<div class="toolbar"><label class="sr" for="filter">Filter entries</label><input id="filter" placeholder="Filter this table…" value="${esc(filter)}"><label class="sr" for="filter-type">Filter by ${esc(field)}</label><select id="filter-type"><option value="">All ${field==='type'?'types':'stages'}</option>${types.map(type=>`<option value="${esc(type)}" ${type===filterType?'selected':''}>${esc(type)}</option>`).join('')}</select><span class="muted" id="result-count"></span></div>${ranks?'<p class="database-note">Ranks are editorial recommendations for practical use in the original release: S exceptional, A strong, B situational, C limited. Acquisition timing and special effects matter more than raw power.</p>':''}`;
  }
  const equipmentColumns=[['name','Equipment'],['type','Type'],['stat','Power / defense'],['users','Who can equip'],['location','Where to find'],['tier','Rank']];
  const abilityColumns=[['name','Magic / ability'],['type','School'],['level','Level'],['cost','Cost'],['effect','Effect'],['location','Where to learn'],['tier','Rank']];
  function filtered(data) {
    const q=filter.toLocaleLowerCase();
    return data.map((item,index)=>({...item,_index:index})).filter(item=>(!filterType||text(item.type)===filterType)&&(!q||text(Object.values(item)).toLocaleLowerCase().includes(q))).sort((a,b)=>{
      let av=a[sortKey],bv=b[sortKey];
      if(sortKey==='tier'){av='SABCD'.indexOf(av);bv='SABCD'.indexOf(bv);return ((av<0?99:av)-(bv<0?99:bv))*sortDir;}
      if(sortKey==='stat'&&Number.isFinite(Number(av))&&Number.isFinite(Number(bv))){if(av==null)return 1;if(bv==null)return -1;return (Number(av)-Number(bv))*sortDir;}
      return text(av).localeCompare(text(bv),undefined,{numeric:true})*sortDir;
    });
  }
  function tableBody(d) {
    const isEquipment=view==='equipment',data=isEquipment?d.equipment:d.abilities,columns=isEquipment?equipmentColumns:abilityColumns;
    const rows=filtered(data);
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${columns.map(([key,label])=>`<th scope="col" ${sortKey===key?`aria-sort="${sortDir===1?'ascending':'descending'}"`:''}><button data-sort="${key}">${label}${sortKey===key?(sortDir===1?' ↑':' ↓'):''}</button></th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(item=>`<tr>${columns.map(([key])=>`<td>${key==='tier'?tier(item[key]):key==='name'?`<button data-detail="${item._index}" style="padding:0;border:0;background:none;color:var(--accent);text-align:left;font-weight:600">${esc(item.name)}</button>${item.effect&&isEquipment?`<small>${prose(item.effect)}</small>`:''}${item.notes?`<small>${prose(item.notes)}</small>`:''}`:key==='stat'?`${item.stat==null?'—':esc(item.stat)}<small>${esc(item.statLabel||'Base power')}</small>`:prose(item[key] || '—')}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${columns.length}">No matching entries.</td></tr>`}</tbody></table></div>`;
  }
  function database(d) {
    const eq=view==='equipment',data=eq?d.equipment:d.abilities;
    return `${title(eq?'The armory':'Magic & abilities',eq?'Compare base power, equipment restrictions, special properties, and acquisition. Select a name for the full entry and its sources.':'Browse original-release magic and skills. Costs and spell levels belong to the stated original version; select a name for notes and sources.','THE ARCHIVES')}${toolbar(data)}<div id="table-content">${tableBody(d)}</div><p class="database-note">${eq?'Power is base attack for weapons or the labeled defensive stat for armor. Filter by type before comparing values. Unverified values are left blank.':'The school, level, and cost fields follow the original system; spell naming may include modern aliases.'}</p>`;
  }
  function jobs(d) { return `${title('Party & jobs','Practical strengths, limitations, and builds for the original roster. Ranks describe usefulness in context.','YOUR COMPANIONS')}<div class="job-grid">${d.jobs.map(j=>`<article class="job-card frame"><div class="row between"><h3>${esc(j.name)}</h3>${tier(j.tier)}</div><p class="role">${prose(j.role)}</p><span class="pill">${esc(j.unlock||'Story progression')}</span><dl>${[['Strengths',j.strengths],['Tradeoffs',j.weaknesses],['Build direction',j.build],['Abilities',j.abilities],['Notes',j.notes]].filter(([,v])=>v).map(([label,value])=>`<dt>${label}</dt><dd>${prose(value)}</dd>`).join('')}</dl>${refs(j.sources)}</article>`).join('')}</div>`; }
  function bosses(d) { return `${title('Boss strategies','Original-release encounters, with the setup and decisions that win them. HP can differ sharply in later editions.','KNOW YOUR ENEMY')}<div class="toolbar"><label class="sr" for="boss-filter">Find a boss</label><input id="boss-filter" placeholder="Find a boss, location, or weakness…" value="${esc(filter)}"></div><div class="two-col" id="boss-results">${bossCards(d)}</div>`; }
  function bossCards(d) { const rows=d.bosses.filter(b=>!filter||text(Object.values(b)).toLowerCase().includes(filter.toLowerCase()));return rows.map(b=>`<article class="boss-card frame"><div class="row between"><h3>${esc(b.name)}</h3><span class="hp">${b.hp==null?'HP —':`${esc(text(b.hp))} HP`}</span></div><p class="boss-location">${esc(b.location)}</p>${b.weakness?`<p><span class="tag">WEAKNESS</span><br>${prose(b.weakness)}</p>`:''}<p>${prose(b.strategy)}</p>${b.notes?`<p class="muted">${prose(b.notes)}</p>`:''}${refs(b.sources)}</article>`).join('')||'<p class="empty wide">No matching bosses.</p>'; }
  function missables(d) { return `${title('Before you miss it','Read the relevant warning before a story transition. Use separate saves before one-time dungeons and world changes.','THE IMPORTANT DETOURS')}<div class="notice" style="margin-bottom:22px">This is a route companion for completing the original game, with selected important treasure and completion warnings. It does not claim an exhaustive every-chest inventory.</div><div class="card-list">${d.missables.map(m=>`<article class="warning-card frame"><h3>${esc(m.name)}</h3><p class="when">${esc(m.when)}</p><p>${prose(m.detail)}</p>${Number.isInteger(m.chapter)&&m.chapter>0&&m.chapter<=d.chapters.length?`<button style="margin-top:15px" data-chapter="${m.chapter-1}">Open route stage →</button>`:''}${refs(m.sources)}</article>`).join('')}</div>`; }
  function optional(d) { return `${title('Side quests & secrets','The detours worth taking, when they unlock, and what comes back with you.','OFF THE MAIN ROAD')}<div class="two-col">${d.optional.map((q,i)=>`<article class="optional-card frame"><div class="row between"><h3>${esc(q.name)}</h3>${q.missable?'<span class="pill">Missable</span>':''}</div><p class="tag">${esc(q.when)}</p><ol>${(q.steps||[]).map(step=>`<li>${prose(step)}</li>`).join('')}</ol><p class="reward">${prose(q.reward)}</p>${check({key:`optional-${i}`,label:'Completed'})}${refs(q.sources)}</article>`).join('')}</div>`; }
  function setups(d) { return `${title('Recommended setups','Useful party and ability combinations at the point you can actually use them. These are recommendations, not requirements.','PLAN YOUR PARTY')}<div class="two-col">${d.setups.map(s=>`<article class="frame panel-pad"><span class="eyebrow">${esc(s.stage)}</span><h3>${esc(s.name)}</h3><p class="accent">${prose(s.members)}</p><p class="soft">${prose(s.detail)}</p>${refs(s.sources)}</article>`).join('')}</div>`; }
  function progressPage(d) { const p=progress(d);return `${title('Your journey, recorded',`${p.done} of ${p.total} route objectives complete. Progress and notes are saved on this browser. Export a backup to move them to another device.`,'FIELD RECORDS')}<div class="progress-track"><i style="width:${p.percent}%"></i></div><div class="all-checks">${d.chapters.map((c,i)=>`<details class="frame panel-pad" ${i===gs().chapter?'open':''}><summary>${String(i+1).padStart(2,'0')} · ${esc(c.title)} ${checkedChapter(d,i)?'◆':''}</summary>${tasks(d).filter(t=>t.chapter===i).map(check).join('')}<button data-chapter="${i}">Open walkthrough →</button></details>`).join('')}</div>`; }
  function notes(d) { return `${title('Your field notes','Keep your own reminders, loadouts, and things to revisit. Notes and progress stay on this browser; downloaded backups contain your notes in readable text.','FIELD RECORDS')}<section class="frame panel-pad"><label for="notes" class="eyebrow">${esc(THEMES[game].name)} · YOUR NOTES</label><textarea id="notes" class="notes-box" placeholder="Next stop, party plans, treasures to revisit…">${esc(gs().notes)}</textarea><p class="muted" id="notes-status" role="status" style="margin-top:12px;font-size:.8rem">Saved automatically as you type.</p></section><section class="frame panel-pad" style="margin-top:20px"><h3>Keep your field records</h3><p class="soft">Export or restore the checklist, notes, and preferences for all six guides. Resonance keeps its existing backup controls inside its own guide.</p><div class="row"><button data-export class="btn-primary">Export backup</button><button data-import>Restore backup</button><input class="export-input" type="file" id="backup-file" accept="application/json,.json"></div></section>`; }
  function keywords(d) {
    return `${title('Words that open the world','Learn a key word when it appears in dialogue, then Ask the right person about it. Possessing the physical item can be a separate requirement.','FINAL FANTASY II · KEY WORDS')}<div class="two-col">${(d.keywords||[]).map(word=>`<article class="frame panel-pad"><h3>${esc(word.name)}</h3><span class="eyebrow">WHERE TO LEARN</span><p class="soft">${prose(word.learn)}</p><span class="eyebrow">WHERE TO USE</span><p class="soft">${prose(word.use)}</p>${refs(word.sources)}</article>`).join('')}</div>`;
  }
  function versions(d) {
    const changes=d.versionChanges||[];
    return `${title('Originals, Advance & beyond','The walkthrough and databases use the original release. These notes show where GBA and later versions take another path.','COMPARE EDITIONS')}<section class="frame panel-pad" style="margin-bottom:23px"><span class="eyebrow">THIS GUIDE’S BASELINE</span><h3>${esc(d.edition)}</h3><ul class="soft">${d.versionNotes.map(n=>`<li>${prose(n)}</li>`).join('')}</ul></section><div class="two-col">${changes.map(change=>`<article class="frame panel-pad"><span class="eyebrow">${esc(change.version)}</span><h3>${esc(change.name)}</h3>${change.when?`<p class="tag">${esc(change.when)}</p>`:''}<p class="soft">${prose(change.detail)}</p>${change.impact?`<div class="notice">${prose(change.impact)}</div>`:''}${refs(change.sources)}</article>`).join('')}</div>${d.bonusBosses?.length?`${title('Advance bonus encounters','These encounters belong to the GBA version and are separate from the original-game boss list.','GBA · EXTRA CONTENT')}<div class="two-col">${d.bonusBosses.map(b=>`<article class="boss-card frame"><span class="eyebrow">${esc(b.version||'GBA · Advance')}</span><div class="row between"><h3>${esc(b.name)}</h3><span class="hp">${b.hp==null?'HP —':esc(text(b.hp))+' HP'}</span></div><p class="boss-location">${esc(b.location)}</p><p>${prose(b.strategy)}</p>${b.weakness?`<p class="soft">Weakness: ${prose(b.weakness)}</p>`:''}${refs(b.sources)}</article>`).join('')}</div>`:''}`;
  }
  function sources(d) { return `${title('Research sources','Facts are organized in fresh guide text. Source links let you check values, routes, and exact edition details.','THE RESEARCH DESK')}${d.coverage?`<p class="notice" style="margin-bottom:23px">${prose(d.coverage)}</p>`:''}<div class="two-col">${d.sources.map(s=>`<article class="source-card frame"><h3><a href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></h3><p>${prose(s.scope)}</p></article>`).join('')}</div><section class="frame panel-pad" style="margin-top:25px"><h3>Artwork</h3><p class="soft">Animated character sprites, decorative scenery, menu icons, and fonts are reused from your Resonance guide. The hero sprites are later interpretations of the original cast; decorative scenes are not screenshots of these original releases. Final Fantasy characters and artwork belong to Square Enix. Source artwork includes ffresonance.wiki assets retained with their existing metadata.</p></section>`; }
  function searchResults(d) {
    const q=search.toLocaleLowerCase(),groups=[['walkthrough','Route stage',d.chapters],['equipment','Equipment',d.equipment],['abilities','Magic / ability',d.abilities],['jobs','Party / job',d.jobs],['bosses','Boss',d.bosses],['optional','Side quest',d.optional],['missables','Missable',d.missables],['keywords','Key word',d.keywords||[]],['versions','Edition change',d.versionChanges||[]]];
    const results=groups.flatMap(([target,label,rows])=>rows.map((item,index)=>({item,index,target,label})).filter(({item})=>text(Object.values(item)).toLocaleLowerCase().includes(q))).slice(0,100);
    return `${title('Search the field guide',`${results.length}${results.length===100?'+':''} results for “${search}”`,'THE ARCHIVES')}<div class="search-results">${results.map(({item,index,target,label})=>`<button class="search-result frame" data-result="${target}" data-result-index="${index}"><span class="eyebrow">${label}</span><h3>${esc(item.name||item.title)}</h3><p>${prose(text(item.summary||item.effect||item.location||item.detail||item.role||item.when).slice(0,220))}</p></button>`).join('')||'<p class="empty">No matches. Try a shorter name or another translation.</p>'}</div>`;
  }
  function renderView() {
    const d=current(); if(!d)return;
    document.querySelectorAll('[data-view]').forEach(node=>{const active=node.dataset.view===view;node.classList.toggle('active',active);if(active)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');});
    const renderers={overview,walkthrough,equipment:database,abilities:database,jobs,bosses,missables,optional,setups,progress:progressPage,notes,versions,sources,keywords};
    $('#content').innerHTML = search ? searchResults(d) : renderers[view](d);
    if(view==='equipment'||view==='abilities')updateCount();
  }
  function updateCount(){const el=$('#result-count');if(el)el.textContent=`${filtered(current()[view]).length} entries`;}
  function refreshTable(){const wrap=$('#table-content');if(wrap)wrap.innerHTML=tableBody(current());updateCount();}
  function closeNav(){$('#sidebar')?.classList.remove('open');$('#mobile-overlay')?.classList.remove('open');$('[data-menu]')?.setAttribute('aria-expanded','false');}
  let modalReturn;
  function detail(index) {
    const item=current()?.[view]?.[index]; if(!item)return;
    modalReturn=document.activeElement;
    const labels={name:'Name',type:'Type',stat:'Base power / defense',statLabel:'Stat convention',users:'Users',location:'Acquisition',effect:'Effect',tier:'Editorial rank',notes:'Notes',level:'Level',cost:'Cost'};
    const node=document.createElement('div');node.className='modal-cover';node.id='detail-modal';
    node.innerHTML=`<section class="modal frame" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabindex="-1"><div class="row between"><h2 id="detail-title">${esc(item.name)}</h2><button data-close-modal aria-label="Close entry">✕</button></div>${Object.entries(item).filter(([key,value])=>key!=='name'&&key!=='sources'&&value!=null).map(([key,value])=>`<span class="eyebrow" style="margin-top:20px;margin-bottom:5px">${esc(labels[key]||key)}</span><p>${prose(value)}</p>`).join('')}${refs(item.sources)}</section>`;
    document.body.append(node);node.querySelector('[data-close-modal]').focus();
  }
  function closeModal(){$('#detail-modal')?.remove();modalReturn?.focus();}
  function resonance() {
    const html=FFR.split('__RESONANCE_BASE__').join(new URL('../ffr/',BASE).href);
    resonanceUrl=URL.createObjectURL(new Blob([html],{type:'text/html'}));
    const shell=document.createElement('div');shell.className='ffr-view';shell.id='ffr-view';
    const frame=document.createElement('iframe');frame.src=resonanceUrl;frame.title='Final Fantasy Resonance field guide';frame.id='resonance-frame';
    const back=document.createElement('button');back.className='ffr-return';back.textContent='← All adventures';back.dataset.closeResonance='';shell.append(frame,back);document.body.append(shell);
  }
  function closeResonance(){$('#ffr-view')?.remove();if(resonanceUrl)URL.revokeObjectURL(resonanceUrl);resonanceUrl=undefined;}
  function lock(){parent.postMessage({type:'ffr-lock'},location.origin);}
  function exportBackup(){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='final-fantasy-field-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup downloaded.');}
  function validBackup(value){return value?.version===1&&value.games&&typeof value.games==='object'&&!Array.isArray(value.games)&&Object.keys(value.games).every(key=>/^[1-6]$/.test(key))&&Object.values(value.games).every(item=>item&&typeof item==='object'&&typeof item.notes==='string'&&item.notes.length<100000&&Number.isInteger(item.chapter)&&item.chapter>=0&&item.checked&&typeof item.checked==='object'&&!Array.isArray(item.checked)&&Object.entries(item.checked).every(([key,done])=>/^(ch-\d+-\d+|optional-\d+)$/.test(key)&&typeof done==='boolean'));}
  document.addEventListener('click',event=>{
    const node=event.target.closest('button,a,[data-close-nav]');if(!node)return;const d=node.dataset;
    if(d.home!==undefined){event.preventDefault();renderLibrary();window.scrollTo(0,0);return;}
    if(d.game){openGame(Number(d.game));return;}
    if(d.view){setView(d.view);return;}
    if(d.chapter!==undefined){const index=Number(d.chapter);if(index<0||index>=current().chapters.length)return;gs().chapter=index;persist();view='walkthrough';search='';if($('#search'))$('#search').value='';closeNav();renderView();window.scrollTo(0,0);return;}
    if(d.sort){if(sortKey===d.sort)sortDir*=-1;else{sortKey=d.sort;sortDir=1;}refreshTable();return;}
    if(d.detail!==undefined){detail(Number(d.detail));return;}
    if(d.closeModal!==undefined){closeModal();return;}
    if(d.result){const target=d.result,index=Number(d.resultIndex);setView(target);if(target==='walkthrough'){gs().chapter=index;persist();renderView();}else if(target==='equipment'||target==='abilities')detail(index);else{const cards=$('#content').querySelectorAll('article');cards[index]?.scrollIntoView({block:'start'});}return;}
    if(d.menu!==undefined){const open=!$('#sidebar').classList.contains('open');$('#sidebar').classList.toggle('open',open);$('#mobile-overlay').classList.toggle('open',open);node.setAttribute('aria-expanded',String(open));return;}
    if(d.closeNav!==undefined){closeNav();return;}
    if(d.lock!==undefined){lock();return;}
    if(d.resonance!==undefined){resonance();return;}
    if(d.closeResonance!==undefined){closeResonance();return;}
    if(d.export!==undefined){exportBackup();return;}
    if(d.import!==undefined){$('#backup-file').click();return;}
    if(d.font){state.font=Math.min(21,Math.max(15,(Number(state.font)||17)+Number(d.font)));applyTheme(game);persist();return;}
    if(d.motion!==undefined){state.motion=!state.motion;persist();if(game){const previous=view;openGame(game);view=previous;renderView();}else renderLibrary();startParticles();return;}
  });
  document.addEventListener('input',event=>{const node=event.target;
    if(node.id==='search'){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{search=node.value.trim();renderView();},160);}
    if(node.id==='filter'){filter=node.value;refreshTable();}
    if(node.id==='boss-filter'){filter=node.value;$('#boss-results').innerHTML=bossCards(current());}
    if(node.id==='notes'){gs().notes=node.value;persist();$('#notes-status').textContent='Saved on this browser.';}
  });
  document.addEventListener('change',async event=>{const node=event.target;
    if(node.dataset.check){gs().checked[node.dataset.check]=node.checked;persist();node.closest('.check').classList.toggle('checked',node.checked);if(view==='progress')renderView();}
    if(node.id==='filter-type'){filterType=node.value;refreshTable();}
    if(node.id==='backup-file'&&node.files[0]){try{if(node.files[0].size>2000000)throw new Error();const data=JSON.parse(await node.files[0].text());if(!validBackup(data))throw new Error();if(!confirm('Replace all six guides’ current checklist and notes with this backup?'))return;state={version:1,games:data.games,font:Math.min(21,Math.max(15,Number(data.font)||17)),motion:typeof data.motion==='boolean'?data.motion:state.motion};persist();applyTheme(game);renderView();toast('Field records restored.');}catch{toast('That file is not a valid field-record backup.');}node.value='';}
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){closeModal();closeNav();return;}
    if(event.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)&&$('#search')){event.preventDefault();$('#search').focus();}
    if(event.key==='Tab'&&$('#detail-modal')){const focusable=[...$('#detail-modal').querySelectorAll('button,a[href]')];const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  });
  document.addEventListener('click',event=>{if(event.target.id==='detail-modal')closeModal();});
  window.addEventListener('message',event=>{if(event.source===$('#resonance-frame')?.contentWindow&&event.origin===location.origin&&event.data?.type==='ffr-lock'){closeResonance();lock();}});
  function startParticles(){cancelAnimationFrame(particleFrame);const canvas=$('#motes'),ctx=canvas.getContext('2d');let width=innerWidth,height=innerHeight;canvas.width=width;canvas.height=height;ctx.clearRect(0,0,width,height);if(!state.motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const particles=Array.from({length:Math.min(48,Math.round(width/30))},()=>({x:Math.random()*width,y:Math.random()*height,s:Math.random()*1.3+.3,v:Math.random()*.16+.04}));function draw(now){particleFrame=requestAnimationFrame(draw);if(document.hidden||now-lastParticleTime<32)return;lastParticleTime=now;ctx.clearRect(0,0,width,height);ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent');for(const p of particles){p.y-=p.v;p.x+=Math.sin(now/8000+p.y)*.08;if(p.y<0)p.y=height;ctx.globalAlpha=.12+p.s*.15;ctx.fillRect(p.x,p.y,p.s,p.s);}}particleFrame=requestAnimationFrame(draw);}
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(startParticles,180);});
  renderLibrary();startParticles();
})();
