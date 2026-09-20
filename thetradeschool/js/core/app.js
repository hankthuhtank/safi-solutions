(() => {
  const D = window.TRADE_DATA;
  const app = document.getElementById("app");

  const state = {
    progress: (()=>{try{const p=JSON.parse(localStorage.getItem("tradeschool-progress")||"{}");return p&&typeof p==="object"&&!Array.isArray(p)?p:{}}catch(_){return{}}})(),
    circuit: { voltage:24, r1:12, r2:12, mode:"series", closed:true },
    ladder: {
      inputs:{START:false, STOP:true, SENSOR:false, FAULT:false},
      rungs:[
        {id:1, items:[{type:"xic",tag:"START"},{type:"xio",tag:"FAULT"},{type:"ote",tag:"MOTOR"}]}
      ],
      outputs:{MOTOR:false}
    },
    trouble: { fault:null, measured:"—", result:null, readings:{} }
  };

  const saveProgress = () => localStorage.setItem("tradeschool-progress", JSON.stringify(state.progress));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const conceptById = id => D.concepts.find(c => c.id === id);
  const worldOf = c => c?.world || "electrical";
  const conceptsFor = world => D.concepts.filter(c => worldOf(c) === world);
  const categoriesFor = world => (D.worldCategories && D.worldCategories[world]) || D.categories;
  const pathsFor = world => (D.worldLearningPaths && D.worldLearningPaths[world]) || D.learningPaths;
  const categoryById = (id, world="electrical") => categoriesFor(world).find(c => c.id === id) || D.categories.find(c=>c.id===id);
  const completedCount = (world=null) => world ? conceptsFor(world).filter(c=>state.progress[c.id]).length : Object.values(state.progress).filter(Boolean).length;
  const pct = n => Math.max(0,Math.min(100,n));

  /* V15: hero media comes from data so the media layer owns it. The old inline
     table pointed Industrial at a photo of a bottle jack. */
  const WORLD_MEDIA = D.worldMedia || {
    electrical:{image:"assets/hero/electrical-mcc.jpg",label:"Motor control center",tone:"electrical"},
    hvac:{image:"assets/hero/hvac-rooftop.jpg",label:"Packaged rooftop unit",tone:"hvac"},
    plumbing:{image:"assets/reference/plumbing/pex_tools_fittings.jpg",label:"PEX tools and fittings",tone:"plumbing"},
    industrial:{image:"assets/reference/industrial/ball_bearing.jpg",label:"Deep-groove ball bearing",tone:"industrial"},
    welding:{image:"assets/reference/welding/tig_welding.jpg",label:"GTAW at the bench",tone:"welding"},
    construction:{image:"assets/reference/construction/light_framing.jpg",label:"Light-frame construction",tone:"construction"}
  };

  const WORLD_COPY = {
    electrical:{tag:"POWER + CONTROL",title:"Read circuits. Trace control. Prove faults.",desc:"Electrical is organized the way technicians encounter it: power, components, control logic, motors, automation, measurements, then troubleshooting."},
    hvac:{tag:"HEAT + AIR + REFRIGERANT",title:"Follow energy through the whole system.",desc:"HVAC learning centers on heat transfer, the refrigeration circuit, airflow, controls, service measurements and diagnostic patterns."},
    plumbing:{tag:"PRESSURE + FLOW + DRAINAGE",title:"See where water should go — and why it doesn't.",desc:"Plumbing is organized around supply, pressure, fixtures, DWV, venting, hot water, backflow and practical diagnosis."},
    industrial:{tag:"MOTION + RELIABILITY",title:"Understand the machine before replacing the part.",desc:"Industrial maintenance connects bearings, shafts, drives, pumps, fluid power and condition evidence into one machine-level view."},
    welding:{tag:"PROCESS + JOINT + METALLURGY",title:"Read the joint, puddle and finished weld as evidence.",desc:"Welding focuses on process selection, settings, fit-up, fusion, heat effects, defects, inspection and safe work."},
    construction:{tag:"DRAWINGS + ASSEMBLIES + LOADS",title:"Translate the plan into a buildable assembly.",desc:"Construction is organized around drawings, layout, framing, load paths, envelope continuity, materials and jobsite coordination."}
  };

  function worldThemeFromHash(){
    const raw=location.hash.replace(/^#\/?/,"");
    const m=raw.match(/(?:world\/|concept\/)([^/?]+)/);
    if(m && D.worlds.some(w=>w.id===m[1])) return m[1];
    if(raw.startsWith("concept/")){ const c=conceptById(raw.split("/")[1]?.split("?")[0]); return worldOf(c); }
    if(raw.startsWith("tool/")){
      const t=raw.split("/")[1]?.split("?")[0];
      const map={circuit:"electrical",ladder:"electrical",troubleshoot:"electrical","hvac-cycle":"hvac",airflow:"hvac","hvac-controls":"hvac","pressure-flow":"plumbing","drain-vent":"plumbing","water-heater-lab":"plumbing","shaft-alignment":"industrial","hydraulic-lab":"industrial","pneumatic-lab":"industrial","bearing-lab":"industrial","conveyor-lab":"industrial","weld-puddle":"welding","joint-lab":"welding","defect-lab":"welding","blueprint-lab":"construction","framing-lab":"construction","loadpath-lab":"construction","envelope-lab":"construction"};
      return map[t]||"home";
    }
    return "home";
  }

  function route() {
    const raw = location.hash.replace(/^#\/?/, "");
    const pathOnly = raw.split("?")[0];
    const parts = pathOnly.split("/").filter(Boolean);
    if (!parts.length) return renderHome();
    if (parts[0] === "world" && parts[1] && parts[2] === "unit" && parts[3]) return renderUnit(parts[1], parts[3]);
    if (parts[0] === "world" && parts[1]) return renderWorld(parts[1], parts[2]);
    if (parts[0] === "concept" && parts[1]) return renderConcept(parts[1]);
    if (parts[0] === "tool" && parts[1]) return renderTool(parts[1]);
    if (parts[0] === "standards") return renderStandards();
    return renderHome();
  }

  function go(path){ location.hash = path.startsWith("#") ? path : "#/" + path; }
  window.go = go;

  function shell(content){
    const theme=worldThemeFromHash();
    app.innerHTML = `
      <div class="shell theme-${theme}" data-world="${theme}">
        <canvas id="particleCanvas" class="particle-canvas" aria-hidden="true"></canvas>
        <header class="topbar">
          <div class="brand" onclick="go('')" role="link" tabindex="0" aria-label="The TradeSchool home">
            <img src="/assets/project-logos/tradeschool.svg?v=2" alt="The TradeSchool">
          </div>
          <div class="top-actions">
            <button class="icon-btn search-trigger" onclick="openSearch()"><span>Search anything — “what is a contactor?”</span><span class="kbd">⌘ K</span></button>
            <button class="ghost-btn" onclick="showWorlds()">Explore Trades</button>
          </div>
        </header>
        <main class="main">${content}</main>
        <div class="search-modal" id="searchModal" role="dialog" aria-modal="true" aria-label="Search TradeSchool" onclick="modalClick(event)">
          <div class="search-box" onclick="event.stopPropagation()">
            <div class="search-input"><span>⌕</span><input id="searchField" type="search" aria-label="Search topics" aria-controls="searchResults" autocomplete="off" placeholder="What are you trying to understand?" /><button type="button" class="search-close" onclick="closeSearch()" aria-label="Close search">×</button></div>
            <div class="search-results" id="searchResults"></div>
          </div>
        </div>
        <div class="toast" id="toast"></div>
      </div>`;
    bindSearchHotkey();
    initParticles();
  }

  function footer(){
    const rev = (D.standards && D.standards.reviewed) ? ` \u00b7 reviewed ${D.standards.reviewed}` : '';
    return `<footer class="footer"><span>TradeSchool \u00b7 Visual learning engine</span><span><button class="footer-link" onclick="go('standards')">Standards and currency${rev}</button></span><span>Education only \u2014 workplace tasks require proper training, procedures and qualifications.</span></footer>`;
  }

  function renderHome(){
    const liveWorlds = D.worlds.filter(w=>w.status==="live");
    const featured = [
      {src:WORLD_MEDIA.electrical.image, label:"Motor control equipment"},
      {src:WORLD_MEDIA.hvac.image, label:"Rooftop HVAC"},
      {src:WORLD_MEDIA.welding.image, label:"GTAW at the bench"}
    ];
    shell(`
      <section class="home-intro home-intro-v14">
        <div class="home-copy">
          <div class="eyebrow">Built for people who work with their hands and tools</div>
          <h1>Know what you're looking at<br><span>before you touch it.</span></h1>
          <p>TradeSchool teaches the systems behind electrical, HVAC, plumbing, industrial maintenance, welding, and construction — so when you're on a job, the equipment and the problem make sense.</p>
          <div class="hero-actions"><button class="solid-btn hero-action" onclick="showWorlds()">Start a trade</button><button class="ghost-btn hero-action" onclick="go('tool/fieldcheck')">Try a field decision</button><button class="ghost-btn hero-action" onclick="openSearch()">Find a topic</button></div>
          <div class="home-proof"><span><b>${D.concepts.length}</b> topics across 6 trades</span><span><b>${Object.keys(D.visualAssets||{}).length}</b> checked visuals</span><span>Standards reviewed ${esc((D.standards&&D.standards.reviewed)||'')}</span></div>
        </div>
        <div class="home-hero-strip" aria-hidden="true">
          ${featured.map(f=>`<figure><img src="${f.src}" alt=""><figcaption>${esc(f.label)}</figcaption></figure>`).join("")}
        </div>
      </section>
      <section class="section" id="worldsSection">
        <div class="section-head">
          <div>
            <div class="eyebrow">Pick a trade</div>
            <h2>Start where you work — or where you want to work.</h2>
          </div>
          <p>Each course is organized the way the job is organized: systems first, then the parts, then what fails and how you prove it.</p>
        </div>
        <div class="world-grid world-grid-v7">${D.worlds.map(worldCard).join("")}</div>
      </section>
      <section class="research-note">
        <div><small>HOW THIS IS BUILT</small><h2>Every visual and every claim has to earn its place.</h2></div>
        <p>A photo stays only if it shows the equipment it says it shows. Use the named standards and sources to check technical claims. Interactive labs simplify real equipment; they do not establish service limits or qualify a repair.</p>
        <div class="method-rows">
          <div class="method-row"><b>${Object.keys(D.visualAssets||{}).length}</b><span>topics carry a checked visual. ${(D.removedMedia?Object.keys(D.removedMedia).length:0)} images were removed for showing the wrong thing, including a bottle jack labelled as a hydraulic cylinder and a museum exhibit labelled as a compressor.</span></div>
          <div class="method-row"><b>${(D.boilerplateRemoved||[]).length}</b><span>generic sentences were deleted. One safety line had been repeated on 104 different topics. A line that fits everything teaches nothing about anything.</span></div>
          <div class="method-row"><b>${(D.standards&&D.standards.items.length)||0}</b><span>standards and dates are stated openly on the <button class="footer-link" onclick="go('standards')">standards page</button>, so you can see what edition this was written against instead of guessing.</span></div>
        </div>
      </section>
      ${footer()}
    `);
  }

  function worldCard(w){
    const m=WORLD_MEDIA[w.id], copy=WORLD_COPY[w.id];
    return `<article class="world-card-v7 world-card-${w.id}" onclick="go('world/${w.id}')">
      <div class="world-card-photo"><img src="${m.image}" alt="${esc(m.label)}"><span></span></div>
      <div class="world-card-body"><small>${esc(copy.tag)}</small><h3>${esc(w.name)}</h3><p>${esc(copy.desc)}</p><div class="world-card-foot"><span>${conceptsFor(w.id).length} topics</span><b>Open course →</b></div></div>
    </article>`;
  }

  function pathCard(p){
    const done = p.concepts.filter(id=>state.progress[id]).length;
    const progress = Math.round(done / p.concepts.length * 100);
    return `<article class="path-card" onclick="go('concept/${p.concepts.find(id=>!state.progress[id]) || p.concepts[0]}')">
      <div class="path-top"><span>${p.level}</span><span>${p.minutes} MIN</span></div>
      <h4>${p.name}</h4>
      <p>${p.concepts.length} connected concepts · ${done} complete</p>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
    </article>`;
  }

  function labCatalogFor(world){
    // V10: only keep labs that teach a measurable relationship without looking like toys.
    // Weak CSS "playground" simulations were removed from the catalog.
    const labs={
      electrical:[
        {id:"circuit",title:"Circuit Bench",purpose:"Change voltage and resistance and watch current and power respond in real time. Predict the reading before you look.",outcome:"Use Ohm's law as a prediction tool, not a formula to memorize.",level:"Fundamentals"},
        {id:"ladder",title:"Ladder Logic Trainer",purpose:"Toggle inputs and watch a simple rung decide whether the output energizes. Trace the path of truth through the contacts.",outcome:"Read a rung as cause-and-effect instead of a list of symbols.",level:"Controls"}
      ],
      hvac:[
        {id:"hvac-cycle",title:"Refrigeration Cycle",purpose:"Follow pressure and state changes around the four core components. See what each device does to the refrigerant.",outcome:"Explain the job of compressor, condenser, metering device, and evaporator without guessing.",level:"Refrigeration"}
      ],
      plumbing:[
        {id:"drain-vent",title:"Trap + Vent",purpose:"Drain a fixture with and without a working vent path and watch what happens to the trap seal.",outcome:"Explain why the vent protects the seal instead of treating it as optional pipe.",level:"DWV"}
      ],
      industrial:[
        // V15: restored. The V10 removal left this tab empty. The lab was rebuilt in
        // js/core/labs-v15.js as a connected circuit with a working relief valve.
        {id:"hydraulic-lab",title:"Hydraulic Force + Motion",purpose:"Change pump flow, relief setting, load and bore, then extend and retract. Watch force and speed split apart, and watch the relief open when the load asks for more than the system has.",outcome:"Separate what sets force from what sets speed, and recognize a system going over relief instead of blaming the cylinder.",level:"Fluid power"}
      ],
      welding:[
        {id:"weld-puddle",title:"Weld Parameter Window",purpose:"Change current, voltage, and travel speed on a labeled cross-section model. See the direction of heat-input and bead-shape tradeoffs.",outcome:"Understand parameter direction without pretending a browser graphic predicts real weld quality.",level:"Process settings"}
      ],
      construction:[
        {id:"envelope-lab",title:"Water Management",purpose:"Drive rain at a wall assembly and toggle head flashing and drainage-plane continuity. Watch whether water drains out or reaches the interior.",outcome:"Think in drainage paths and laps — not in single layers.",level:"Envelope"}
      ]
    };
    return labs[world]||[];
  }

  function renderWorld(id, tab="course"){
    const world=D.worlds.find(w=>w.id===id);
    if(!world||world.status!=="live") return renderComingSoon(world);
    const concepts=conceptsFor(id), completed=completedCount(id), copy=WORLD_COPY[id], media=WORLD_MEDIA[id];
    const categories=categoriesFor(id);
    shell(`
      <section class="course-hero course-hero-${id}">
        <div class="course-hero-media"><img src="${media.image}" alt="${esc(media.label)}"><div class="course-hero-overlay"></div><span class="field-caption">FIELD REFERENCE · ${esc(media.label).toUpperCase()}</span></div>
        <div class="course-hero-copy"><div class="breadcrumb"><span onclick="go('')">TradeSchool</span><b>›</b><span>${esc(world.name)}</span></div><div class="eyebrow">${esc(copy.tag)}</div><h1>${esc(world.name)}</h1><h2>${esc(copy.title)}</h2><p>${esc(copy.desc)}</p><div class="course-progress"><span>${completed} / ${concepts.length} topics marked complete</span><div class="progress-track"><div class="progress-fill" style="width:${concepts.length?Math.round(completed/concepts.length*100):0}%"></div></div></div></div>
      </section>
      <nav class="course-tabs"><button class="${tab==='course'||tab==='map'?'active':''}" onclick="go('world/${id}/course')">Course</button><button class="${tab==='labs'?'active':''}" onclick="go('world/${id}/labs')">Practice labs</button><button class="${tab==='concepts'?'active':''}" onclick="go('world/${id}/concepts')">Reference index</button></nav>
      ${tab==='labs'?renderLabs(id):tab==='concepts'?renderAllConcepts(id):renderKnowledgeMap(id)}
      ${footer()}
    `);
  }

  function renderKnowledgeMap(world){
    const cats=categoriesFor(world);
    return `<section class="course-outline"><div class="course-outline-head"><div><div class="eyebrow">Course outline</div><h2>Work through systems, not isolated vocabulary.</h2></div><p>Each unit is a scrollable lesson containing the related terms together. You can still open a single term from search when you need a quick reference.</p></div><div class="unit-list">${cats.map((cat,i)=>{
      const cs=conceptsFor(world).filter(c=>c.category===cat.id), done=cs.filter(c=>state.progress[c.id]).length;
      return `<article class="unit-row" onclick="go('world/${world}/unit/${cat.id}')"><div class="unit-number">${String(i+1).padStart(2,'0')}</div><div class="unit-copy"><small>${done}/${cs.length} COMPLETE</small><h3>${esc(cat.name)}</h3><p>${esc(cat.description)}</p><div class="unit-preview">${cs.slice(0,4).map(c=>`<span>${esc(c.title)}</span>`).join('')}${cs.length>4?`<span>+${cs.length-4} more</span>`:''}</div></div><div class="unit-action">Study unit <b>→</b></div></article>`;
    }).join('')}</div></section>`;
  }

  function renderUnit(worldId, categoryId){
    const world=D.worlds.find(w=>w.id===worldId), cat=categoryById(categoryId,worldId);
    if(!world||!cat) return renderWorld(worldId);
    const cs=conceptsFor(worldId).filter(c=>c.category===categoryId), media=WORLD_MEDIA[worldId];
    const uniqueSafety=[...new Set(cs.map(c=>c.safety).filter(x=>x && !x.startsWith('Use the correct trade procedures')))].slice(0,3);
    const shownAssets=new Set();
    const topicMarkup=cs.map((c,i)=>{
      const asset=D.visualAssets?.[c.id];
      const duplicate=!!(asset && shownAssets.has(asset.src));
      if(asset) shownAssets.add(asset.src);
      return renderInlineTopic(c,i+1,{suppressAsset:duplicate, sharedReference:duplicate});
    }).join('');
    shell(`
      <section class="unit-hero unit-${worldId}"><div><div class="breadcrumb"><span onclick="go('')">TradeSchool</span><b>›</b><span onclick="go('world/${worldId}')">${esc(world.name)}</span><b>›</b><span>${esc(cat.name)}</span></div><div class="eyebrow">UNIT · ${esc(WORLD_COPY[worldId].tag)}</div><h1>${esc(cat.name)}</h1><p>${esc(cat.description)}</p><div class="unit-meta"><span>${cs.length} topics</span><span>Read top to bottom</span><span>Checkpoint at the end</span></div></div><img src="${media.image}" alt="${esc(media.label)}"></section>
      <div class="unit-layout"><aside class="unit-toc"><b>IN THIS UNIT</b>${cs.map((c,i)=>`<button type="button" onclick="document.getElementById('topic-${c.id}')?.scrollIntoView({behavior:'smooth',block:'start'})"><span>${String(i+1).padStart(2,'0')}</span>${esc(c.title)}</button>`).join('')}</aside><article class="unit-article">
        <section class="unit-intro"><p>Start with the system idea, then connect each term to something you could actually see, measure or troubleshoot. The goal is not to memorize ${cs.length} definitions — it is to understand how they fit together.</p></section>
        
        ${topicMarkup}
        ${uniqueSafety.length?`<section class="unit-safety"><small>UNIT SAFETY CONTEXT</small><h2>Before this becomes hands-on work</h2>${uniqueSafety.map(x=>`<p>${esc(x)}</p>`).join('')}</section>`:''}
        ${renderUnitCheckpoint(cs)}
        ${unitLessonNav(worldId, categoryId)}
      </article></div>${footer()}
    `);
  }

  function renderInlineTopic(c,num,opts={}){
    const asset=opts.suppressAsset?null:D.visualAssets?.[c.id];
    const field=(c.recognize||[]).slice(0,2), verify=(c.verify||[]).slice(0,2), failures=(c.failures||[]).slice(0,2);
    return `<section class="inline-topic" id="topic-${c.id}"><header><span>${String(num).padStart(2,'0')}</span><div><h2>${esc(c.title)}</h2><p>${esc(c.oneLine)}</p></div><button onclick="go('concept/${c.id}')" aria-label="Open ${esc(c.title)} reference">Reference ↗</button></header><div class="inline-topic-body"><div class="topic-prose"><p>${esc(c.plain)}</p>${c.why?`<p>${esc(c.why)}</p>`:''}${c.analogy && !isGenericAnalogy(c.analogy)?`<blockquote>${esc(c.analogy)}</blockquote>`:''}</div>${asset?`<figure class="topic-photo"><img src="${asset.src}" alt="${esc(asset.title||asset.caption||c.title)}"><figcaption><b>${esc(asset.title||c.title)}</b><span>${esc(asset.caption||'')}</span>${asset.credit?`<em>${esc(asset.credit)}</em>`:''}</figcaption></figure>`:renderTopicContextCard(c,opts.sharedReference)}</div>${field.length||verify.length||failures.length?`<div class="field-strip">${field.length?`<div><small>RECOGNIZE</small>${field.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}${verify.length?`<div><small>VERIFY</small>${verify.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}${failures.length?`<div><small>FAILURE CLUES</small>${failures.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}</div>`:''}${c.fieldScenario&&!isGenericScenario(c.fieldScenario)?`<div class="inline-scenario"><small>FIELD EXAMPLE</small><p>${esc(c.fieldScenario)}</p></div>`:''}</section>`;
  }

  function isGenericAnalogy(text){
    return /Think of the (piping system|system as an energy-moving network)/i.test(String(text||''));
  }

  function isGenericScenario(text){
    const t=String(text||'');
    return /Instead of immediately changing every machine setting/i.test(t) || /Rather than forcing the work to fit/i.test(t);
  }

  function renderTopicContextCard(c, sharedReference=false){
    const where=(c.where||[]).slice(0,4);
    const related=(c.related||[]).slice(0,3).map(rid=>conceptById(rid)).filter(Boolean);
    return `<aside class="topic-context-card">${sharedReference?`<div class="shared-note">Shared field reference already shown earlier in this unit.</div>`:''}<small>${sharedReference?'FIELD CONTEXT':'USEFUL CONTEXT'}</small><h3>What should a learner connect this to?</h3>${where.length?`<div class="context-block"><b>Usually shows up in</b><ul>${where.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}${related.length?`<div class="context-block"><b>Keep following the system</b><div class="context-links">${related.map(r=>`<button onclick="go('concept/${r.id}')">${esc(r.title)}</button>`).join('')}</div></div>`:''}<div class="context-block"><b>Learning goal</b><p>Understand how ${esc(c.title.toLowerCase())} affects the system before trying to memorize the term.</p></div></aside>`;
  }

  function unitVisualsFor(worldId, categoryId, cs){
    // V11: no unit-level visual clusters
    return [];
  }

  function renderUnitVisualCluster(worldId, categoryId, cs){
    // V11: unit-level visual strips removed — they repeated images and added noise.
    return "";
  }

  function renderUnitCheckpoint(cs){
    const qs=cs.filter(c=>c.check&&Array.isArray(c.check.options)).slice(0,3);
    if(!qs.length)return '';
    return `<section class="unit-checkpoint"><div class="eyebrow">Checkpoint</div><h2>Can you reason through the unit?</h2><p>These are here to expose weak spots, not to award points.</p>${qs.map((c,i)=>`<details><summary>${i+1}. ${esc(c.check.q)}</summary><div class="checkpoint-answer"><b>Answer: ${esc(c.check.options[c.check.answer])}</b><p>${esc(c.check.explain)}</p></div></details>`).join('')}</section>`;
  }

  function renderAllConcepts(world){
    const query=new URLSearchParams(location.hash.split("?")[1]||""); const selected=query.get("cat")||"all"; const all=conceptsFor(world); const list=selected==="all"?all:all.filter(c=>c.category===selected);
    return `<section class="reference-index"><div class="reference-index-head"><div><div class="eyebrow">Reference index</div><h2>Find a term without walking the whole course.</h2></div><p>This is intentionally secondary. New learners should use the course units; this index is for lookup.</p></div><div class="filter-row"><button class="filter-chip ${selected==='all'?'active':''}" onclick="location.hash='#/world/${world}/concepts'">All</button>${categoriesFor(world).map(c=>`<button class="filter-chip ${selected===c.id?'active':''}" onclick="location.hash='#/world/${world}/concepts?cat=${c.id}'">${esc(c.name)}</button>`).join('')}</div><div class="reference-table">${list.map(c=>`<button onclick="go('concept/${c.id}')"><span>${esc(c.title)}</span><small>${esc(c.oneLine)}</small><b>→</b></button>`).join('')}</div></section>`;
  }

  function renderLabs(world){
    const labs=labCatalogFor(world);
    return `<section class="practice-page"><div class="practice-head"><div><div class="eyebrow">Practice labs</div><h2>Every lab here proves one relationship you can carry to a job.</h2></div><p>Each lab computes its readouts from the real relationship it is teaching, not from a lookup table. Where a number is illustrative rather than a service target, the lab says so on its own face.</p></div><div class="practice-grid">${labs.map((t,i)=>`<article class="practice-card" onclick="go('tool/${t.id}')"><div class="practice-card-index">${String(i+1).padStart(2,'0')}</div><small>${esc(t.level)}</small><h3>${esc(t.title)}</h3><p>${esc(t.purpose)}</p><div class="practice-outcome"><span>YOU SHOULD LEAVE ABLE TO</span>${esc(t.outcome)}</div><button>Open lab →</button></article>`).join('')}</div></section>`;
  }

  function renderPaths(world){ return renderKnowledgeMap(world); }

  /* V15: the site now states its own shelf life. Editions and dates come from
     D.standards, set in js/content/v15-currency.js and verified against
     published sources. */
  function renderStandards(){
    const st = D.standards;
    if(!st) return renderHome();
    const worldName = w => (D.worlds.find(x=>x.id===w)||{}).name || w;
    const groups = {};
    st.items.forEach(i => (groups[i.world] = groups[i.world] || []).push(i));
    shell(`
      <section class="page-head standards-head">
        <div class="breadcrumb"><span onclick="go('')">TradeSchool</span><b>\u203a</b><span>Standards and currency</span></div>
        <div class="eyebrow">Reviewed ${esc(st.reviewed)}</div>
        <h1>What this site is written against.</h1>
        <p>${esc(st.note)}</p>
      </section>
      <section class="standards-list">
        ${Object.keys(groups).map(w => `
          <div class="standards-group theme-${w}">
            <h2>${esc(worldName(w))}</h2>
            ${groups[w].map(i => `
              <article class="standard-card">
                <div class="standard-plate">
                  <span>STANDARD</span><b>${esc(i.key)}</b>
                  <span>STATUS</span><b class="standard-current">${esc(i.current)}</b>
                </div>
                <div class="standard-body">
                  <p>${esc(i.detail)}</p>
                  <p class="standard-sowhat"><small>WHAT IT MEANS ON THE JOB</small>${esc(i.soWhat)}</p>
                </div>
              </article>`).join('')}
          </div>`).join('')}
      </section>
      <section class="standards-foot">
        <p>Codes are adopted locally and amended locally. Nothing here replaces the adopted code in your jurisdiction, the manufacturer's instructions for the specific equipment, or the training and qualifications your work requires.</p>
      </section>
      ${footer()}`);
  }

  function renderComingSoon(world){
    shell(`<section class="page-head"><div class="breadcrumb"><span onclick="go('')">TradeSchool</span><b>›</b><span>${world?.name||"World"}</span></div><h1>${world?.icon||"◌"} ${world?.name||"Trade World"}</h1><p>${world?.description||""}</p></section><div class="empty-state"><h2>World engine ready.</h2><p>This trade uses the same concept, simulation, diagnostic and playground architecture as Electrical. Content has not been populated in this V1.</p><button class="solid-btn" onclick="go('world/electrical')">Open Electrical</button></div>${footer()}`);
  }

  function shouldShowDiagram(c){
    const w=worldOf(c), idc=c.id;
    const anchors={
      electrical:new Set(['voltage','series-parallel','relay','contactor','motor-basics','motor-starter','control-circuit','seal-in','plc','scan-cycle','ladder-logic','vfd','three-phase','transformer','multimeter','grounding']),
      hvac:new Set(['refrigerant','airflow-cfm','thermostat']),
      plumbing:new Set(['water-pressure','p-trap','water-heater','potable-water']),
      industrial:new Set(['coupling','bearing','hydraulic-pressure','pneumatic-system','centrifugal-pump','vibration']),
      welding:new Set(['fillet-weld','heat-input','porosity','welding-symbols']),
      construction:new Set(['floor-plan','wall-framing','load-path','building-envelope','concrete','excavation-safety'])
    };
    return !!anchors[w]?.has(idc);
  }

  function renderVisualLearning(c){
    const asset=D.visualAssets?.[c.id];
    if(!asset) return '';
    return `<section class="evidence-visual"><div class="evidence-visual-head"><div><div class="eyebrow">Visual reference</div><h2>Use the visual to support recognition.</h2></div><p>Photos and technical visuals stay only when they help the learner recognize real equipment, trace an assembly, or understand a relationship that text alone hides.</p></div><div class="evidence-media"><figure class="reference-photo v7-photo"><img src="${asset.src}" alt="${esc(asset.title||asset.caption||c.title)}"><figcaption><b>${esc(asset.title||c.title)}</b><span>${esc(asset.caption||'')}</span>${asset.credit?`<em>${esc(asset.credit)}${asset.license?` · ${esc(asset.license)}`:''}</em>`:''}</figcaption></figure></div></section>`;
  }

  window.switchVisualTab = (visualId, tab) => {
    const host=id(visualId); if(!host) return;
    const section=host.closest('.visual-learning');
    section?.querySelectorAll('.visual-tab').forEach(b=>b.classList.toggle('active',b.dataset.vtab===tab));
    host.querySelectorAll('.visual-panel-page').forEach(p=>p.classList.toggle('active',p.dataset.vpanel===tab));
  };

  function svgWrapped(text,x,y,maxChars=18,className="cd-node-text",lineHeight=16){
    const words=String(text||'').split(/\s+/).filter(Boolean), lines=[]; let line='';
    words.forEach(word=>{const test=line?line+' '+word:word;if(test.length>maxChars&&line){lines.push(line);line=word}else line=test});
    if(line)lines.push(line);const shown=lines.slice(0,3);if(lines.length>3)shown[2]=shown[2].replace(/[.…]*$/,'')+'…';
    const start=y-((shown.length-1)*lineHeight)/2;
    return `<text x="${x}" y="${start}" text-anchor="middle" class="${className}">${shown.map((l,i)=>`<tspan x="${x}" dy="${i?lineHeight:0}">${esc(l)}</tspan>`).join('')}</text>`;
  }

  function hvacConceptDiagram(c){
    const title=esc(c.title), cat=c.category;
    const defs=`<defs><marker id="hvacArrow-${c.id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="hv-arrow-head"/></marker></defs>`;
    let body='';
    if(cat==='hvac-cycle'){
      body=`<path d="M160 150 H545 Q590 150 590 195 V265 Q590 310 545 310 H160 Q115 310 115 265 V195 Q115 150 160 150" class="hv-loop"/>
      <g class="hv-node ${['compressor','discharge-line'].includes(c.id)?'focus':''}"><rect x="90" y="115" width="150" height="78" rx="18"/><text x="165" y="146">COMPRESSOR</text><text x="165" y="168" class="cd-label">raises P + T</text></g>
      <g class="hv-node ${['condenser','outdoor-unit','condenser-fan'].includes(c.id)?'focus':''}"><rect x="470" y="115" width="160" height="78" rx="18"/><text x="550" y="146">CONDENSER</text><text x="550" y="168" class="cd-label">rejects heat</text></g>
      <g class="hv-node ${['metering-device','liquid-line','filter-drier'].includes(c.id)?'focus':''}"><rect x="470" y="275" width="160" height="78" rx="18"/><text x="550" y="306">METERING</text><text x="550" y="328" class="cd-label">drops pressure</text></g>
      <g class="hv-node ${['evaporator','suction-line','superheat'].includes(c.id)?'focus':''}"><rect x="90" y="275" width="150" height="78" rx="18"/><text x="165" y="306">EVAPORATOR</text><text x="165" y="328" class="cd-label">absorbs heat</text></g>
      <text x="355" y="218" text-anchor="middle" class="cd-value">PRESSURE ↔ TEMPERATURE ↔ PHASE</text><text x="355" y="242" text-anchor="middle" class="cd-label">FOLLOW THE REFRIGERANT AROUND THE LOOP</text>
      ${[0,1,2,3].map((_,i)=>`<circle r="5" class="hv-particle p${i}"><animateMotion dur="5s" begin="-${i*1.25}s" repeatCount="indefinite" path="M165 150 H550 Q590 150 590 200 V270 Q590 310 550 310 H165 Q115 310 115 270 V200 Q115 150 165 150"/></circle>`).join('')}`;
    } else if(cat==='hvac-air'){
      body=`<path d="M70 215 H640" class="hv-air-path" marker-end="url(#hvacArrow-${c.id})"/><g class="hv-air-node"><rect x="55" y="160" width="110" height="110" rx="18"/><text x="110" y="207">RETURN</text><text x="110" y="230" class="cd-label">room air</text></g><g class="hv-air-node ${['filter-merv','return-air'].includes(c.id)?'focus':''}"><rect x="195" y="175" width="80" height="80" rx="12"/><path d="M210 190 l50 50 m-50 -20 l30 30 m0 -60 l20 20" class="hv-filter"/><text x="235" y="278" class="cd-label">FILTER</text></g><g class="hv-air-node ${['blower','ecm-motor','psc-motor'].includes(c.id)?'focus':''}"><circle cx="355" cy="215" r="48"/><path d="M355 174 q35 25 0 41 q-35 16 0 42 q35 -26 0 -42 q-35 -16 0 -41" class="hv-fan"/><text x="355" y="287" class="cd-label">BLOWER</text></g><g class="hv-air-node ${['evaporator','delta-t','condensate-drain'].includes(c.id)?'focus':''}"><rect x="445" y="169" width="80" height="92" rx="10"/><path d="M458 183 l54 64 m-54 0 l54 -64" class="hv-coil"/><text x="485" y="286" class="cd-label">COIL</text></g><g class="hv-air-node ${['supply-air','ductwork','damper','duct-sizing','flex-duct'].includes(c.id)?'focus':''}"><rect x="555" y="160" width="110" height="110" rx="18"/><text x="610" y="207">SUPPLY</text><text x="610" y="230" class="cd-label">to rooms</text></g>${Array.from({length:7},(_,i)=>`<circle r="4" class="air-dot"><animateMotion dur="${2.8+i*.18}s" begin="-${i*.35}s" repeatCount="indefinite" path="M70 215 H640"/></circle>`).join('')}<text x="355" y="110" text-anchor="middle" class="cd-value">AIRFLOW IS A COMPLETE CIRCUIT</text><text x="355" y="132" text-anchor="middle" class="cd-label">restriction anywhere changes the entire system</text>`;
    } else if(cat==='hvac-controls'){
      body=`<g class="control-chain"><rect x="55" y="170" width="125" height="90" rx="17"/><text x="118" y="204">24 VAC</text><text x="118" y="228" class="cd-label">R + C</text><path d="M180 215 H230"/><rect x="230" y="150" width="130" height="130" rx="18"/><text x="295" y="202">THERMOSTAT</text><text x="295" y="226" class="cd-label">Y / G / W call</text><path d="M360 215 H410"/><rect x="410" y="150" width="130" height="130" rx="18"/><text x="475" y="202">BOARD +</text><text x="475" y="222">SAFETIES</text><path d="M540 215 H585"/><rect x="585" y="170" width="90" height="90" rx="17"/><text x="630" y="204">LOAD</text><text x="630" y="228" class="cd-label">coil/motor</text></g><text x="355" y="110" text-anchor="middle" class="cd-value">REQUEST → PERMISSION → OUTPUT</text><circle r="5" class="hv-particle"><animateMotion dur="3.2s" repeatCount="indefinite" path="M100 215 H630"/></circle>`;
    } else if(cat==='hvac-heating'){
      body=`<path d="M65 215 H650" class="heat-seq"/><g class="heat-node"><circle cx="95" cy="215" r="43"/><text x="95" y="219">CALL</text></g><g class="heat-node ${c.id==='inducer'?'focus':''}"><circle cx="230" cy="215" r="43"/><text x="230" y="219">DRAFT</text></g><g class="heat-node ${['gas-valve','flame-sensor'].includes(c.id)?'focus':''}"><circle cx="365" cy="215" r="43"/><text x="365" y="213">IGNITE</text><text x="365" y="232" class="cd-label">+ prove</text></g><g class="heat-node ${['furnace','limit-switch-hvac'].includes(c.id)?'focus':''}"><circle cx="500" cy="215" r="43"/><text x="500" y="219">HEAT</text></g><g class="heat-node"><circle cx="635" cy="215" r="43"/><text x="635" y="219">BLOWER</text></g><text x="355" y="112" text-anchor="middle" class="cd-value">SEQUENCE MATTERS</text><text x="355" y="135" text-anchor="middle" class="cd-label">the first failed proof stops everything after it</text>`;
    } else if(cat==='hvac-tools'||cat==='hvac-diagnostics'){
      body=`<g class="diag-gauge"><circle cx="170" cy="205" r="78"/><path d="M125 225 A52 52 0 0 1 215 225"/><line x1="170" y1="218" x2="202" y2="180"/><text x="170" y="255">PRESSURE</text></g><path d="M250 205 H330" class="cd-link"/><rect x="330" y="150" width="150" height="110" rx="20" class="cd-device"/><text x="405" y="190" text-anchor="middle" class="cd-label">P → SAT TEMP</text><text x="405" y="218" text-anchor="middle" class="cd-value">COMPARE</text><path d="M480 205 H550" class="cd-link"/><g class="diag-probe"><line x1="590" y1="145" x2="590" y2="240"/><circle cx="590" cy="240" r="13"/><text x="590" y="270">LINE TEMP</text></g><text x="355" y="112" text-anchor="middle" class="cd-value">MEASURE CONDITIONS — NOT JUST PARTS</text>`;
    } else if(cat==='hvac-safety'){
      body=`<g class="hazard-grid"><rect x="70" y="150" width="150" height="115" rx="18"/><text x="145" y="190">ELECTRICAL</text><text x="145" y="218" class="cd-label">shock / arc</text><rect x="280" y="150" width="150" height="115" rx="18"/><text x="355" y="190">PRESSURE</text><text x="355" y="218" class="cd-label">stored energy</text><rect x="490" y="150" width="150" height="115" rx="18"/><text x="565" y="190">COMBUSTION</text><text x="565" y="218" class="cd-label">fuel / CO</text></g><text x="355" y="112" text-anchor="middle" class="cd-value">CONTROL THE HAZARD BEFORE THE DIAGNOSIS</text>`;
    } else {
      body=`<rect x="150" y="150" width="410" height="130" rx="25" class="cd-device"/>${svgWrapped(c.title,355,205,28,'cd-value',19)}<text x="355" y="245" text-anchor="middle" class="cd-label">CONNECT THIS CONCEPT TO THE WHOLE HVAC SYSTEM</text>`;
    }
    return `<div class="concept-diagram-wrap hvac-concept-viz"><svg class="concept-diagram" viewBox="0 0 710 410" role="img" aria-label="HVAC visual explanation of ${title}">${defs}<text x="355" y="44" text-anchor="middle" class="cd-title">${title}</text><text x="355" y="68" text-anchor="middle" class="cd-label">HVAC · SYSTEM BEHAVIOR</text>${body}</svg><div class="diagram-caption"><b>Follow what changes through the system.</b><span>Pressure, temperature, airflow, state and control sequence are connected — never diagnose one in isolation.</span></div></div>`;
  }

  function plumbingConceptDiagram(c){
    const title=esc(c.title),cat=c.category;
    let body='';
    if(['plumb-fundamentals','plumb-supply','plumb-protection'].includes(cat)){
      body=`<path d="M55 220 H655" class="pl-water-line"/><g class="pl-node"><circle cx="80" cy="220" r="36"/><text x="80" y="224">MAIN</text></g><g class="pl-node"><rect x="145" y="178" width="100" height="84" rx="16"/><text x="195" y="211">METER</text><text x="195" y="232" class="cd-label">usage</text></g><g class="pl-node ${['pressure-regulator','static-dynamic-pressure'].includes(c.id)?'focus':''}"><rect x="285" y="168" width="115" height="104" rx="18"/><text x="343" y="205">REGULATE</text><text x="343" y="228" class="cd-label">pressure</text></g><g class="pl-node ${['ball-valve','shutoff-valve','main-shutoff'].includes(c.id)?'focus':''}"><circle cx="465" cy="220" r="43"/><path d="M435 190 L495 250 M495 190 L435 250"/><text x="465" y="286" class="cd-label">ISOLATE</text></g><g class="pl-node"><rect x="555" y="178" width="105" height="84" rx="16"/><text x="608" y="211">FIXTURE</text><text x="608" y="232" class="cd-label">flow</text></g>${Array.from({length:6},(_,i)=>`<circle r="4" class="water-dot"><animateMotion dur="${3+i*.18}s" begin="-${i*.5}s" repeatCount="indefinite" path="M55 220 H655"/></circle>`).join('')}<text x="355" y="112" text-anchor="middle" class="cd-value">PRESSURE SUPPLIES ENERGY · RESTRICTION SPENDS IT</text>`;
    } else if(cat==='plumb-drain'){
      body=`<path d="M115 120 V190 Q115 225 150 225 H195 Q230 225 230 260 Q230 300 270 300 H610" class="drain-water"/><path d="M335 300 V115" class="vent-air"/><path d="M335 115 V82" class="vent-air"/><text x="115" y="105" text-anchor="middle" class="cd-label">FIXTURE</text><path d="M150 225 q20 45 40 0" class="pl-trap-water"/><text x="185" y="205" class="cd-label">TRAP SEAL</text><text x="372" y="118" class="cd-label">VENT AIR</text><text x="510" y="330" class="cd-label">GRAVITY DRAIN →</text>${Array.from({length:5},(_,i)=>`<circle r="5" class="water-dot"><animateMotion dur="${3+i*.2}s" begin="-${i*.55}s" repeatCount="indefinite" path="M115 120 V190 Q115 225 150 225 H195 Q230 225 230 260 Q230 300 270 300 H610"/></circle>`).join('')}${Array.from({length:3},(_,i)=>`<circle r="4" class="air-vent-dot"><animateMotion dur="3s" begin="-${i}s" repeatCount="indefinite" path="M335 295 V90"/></circle>`).join('')}<text x="355" y="385" text-anchor="middle" class="cd-value">WATER GOES DOWN · AIR MUST HAVE A PATH TOO</text>`;
    } else if(cat==='plumb-hot'){
      body=`<rect x="245" y="115" width="220" height="230" rx="70" class="pl-heater-tank"/><path d="M275 250 Q355 220 435 250 V325 H275 Z" class="tank-cold"/><path d="M275 165 Q355 145 435 165 V250 Q355 220 275 250 Z" class="tank-hot"/><path d="M295 90 V305" class="pl-cold-inlet"/><path d="M415 90 V135" class="pl-hot-outlet"/><text x="275" y="76" text-anchor="middle" class="cd-label">COLD IN ↓</text><text x="435" y="76" text-anchor="middle" class="cd-label">HOT OUT ↑</text><text x="355" y="192" text-anchor="middle" class="cd-value">HOT LAYER</text><text x="355" y="292" text-anchor="middle" class="cd-label">COLDER WATER</text><circle cx="530" cy="150" r="48" class="expansion-bubble"/><path d="M465 150 H482" class="cd-link"/><text x="530" y="146" text-anchor="middle" class="cd-label">EXPANSION</text><text x="530" y="166" text-anchor="middle" class="cd-label">CONTROL</text>`;
    } else if(cat==='plumb-pipe'){
      body=`<path d="M90 215 H295" class="pipe-cut"/><path d="M415 215 H620" class="pipe-cut"/><rect x="285" y="165" width="140" height="100" rx="24" class="joint-body"/><path d="M310 185 V245 M400 185 V245" class="joint-seal"/><text x="355" y="205" text-anchor="middle" class="cd-label">PREP</text><text x="355" y="230" text-anchor="middle" class="cd-value">JOINT</text><text x="355" y="300" text-anchor="middle" class="cd-label">CUT → CLEAN/DEBURR → JOIN → VERIFY</text><circle r="4" class="water-dot"><animateMotion dur="2.6s" repeatCount="indefinite" path="M90 215 H620"/></circle>`;
    } else if(cat==='plumb-fixtures'){
      body=`<rect x="105" y="120" width="210" height="160" rx="26" class="fixture-body"/><text x="210" y="155" text-anchor="middle" class="cd-value">FIXTURE</text><path d="M145 190 H275" class="pl-water-line"/><circle cx="210" cy="190" r="27" class="fixture-valve"/><path d="M210 217 V315" class="drain-water"/><rect x="405" y="140" width="190" height="125" rx="22" class="cd-device"/><text x="500" y="180" text-anchor="middle" class="cd-label">SERVICE LOGIC</text><text x="500" y="207" text-anchor="middle" class="cd-value">SUPPLY → VALVE</text><text x="500" y="232" text-anchor="middle" class="cd-value">→ SEAL → DRAIN</text>`;
    } else {
      body=`<g class="pl-diagnostic"><rect x="65" y="160" width="135" height="110" rx="18"/><text x="132" y="198">OBSERVE</text><text x="132" y="224" class="cd-label">symptom</text><path d="M200 215 H270"/><rect x="270" y="160" width="170" height="110" rx="18"/><text x="355" y="198">ISOLATE</text><text x="355" y="224" class="cd-label">branch / test</text><path d="M440 215 H510"/><rect x="510" y="160" width="135" height="110" rx="18"/><text x="578" y="198">PROVE</text><text x="578" y="224" class="cd-label">cause</text></g><text x="355" y="112" text-anchor="middle" class="cd-value">DON'T OPEN THE WALL UNTIL THE SYSTEM TELLS YOU WHERE</text>`;
    }
    return `<div class="concept-diagram-wrap plumbing-concept-viz"><svg class="concept-diagram" viewBox="0 0 710 410" role="img" aria-label="Plumbing visual explanation of ${title}"><text x="355" y="44" text-anchor="middle" class="cd-title">${title}</text><text x="355" y="68" text-anchor="middle" class="cd-label">PLUMBING · SYSTEM BEHAVIOR</text>${body}</svg><div class="diagram-caption"><b>Follow both water and pressure/air.</b><span>Supply systems use pressure; drainage systems depend on gravity plus a controlled air path.</span></div></div>`;
  }


  function industrialConceptDiagram(c){
    const title=esc(c.title), cat=c.category;
    const defs=`<defs><marker id="indArrow-${c.id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="ind-arrow-head"/></marker></defs>`;
    let body='';
    if(['ind-mechanical','ind-bearings'].includes(cat)){
      body=`<g class="ind-drive">
        <rect x="55" y="155" width="125" height="105" rx="24" class="ind-machine"/><circle cx="118" cy="207" r="34" class="ind-rotor"/><text x="118" y="212" text-anchor="middle" class="cd-value">MOTOR</text>
        <path d="M180 207 H245" class="ind-shaft"/><g class="${['coupling','alignment','soft-foot'].includes(c.id)?'focus':''}"><rect x="235" y="184" width="72" height="46" rx="12" class="ind-coupling"/><text x="271" y="212" text-anchor="middle" class="cd-label">COUPLING</text></g>
        <path d="M307 207 H395" class="ind-shaft"/><g class="${['bearing','pillow-block','bearing-fit','bearing-clearance','radial-load','axial-load'].includes(c.id)?'focus':''}"><rect x="345" y="168" width="96" height="78" rx="18" class="ind-bearing"/><circle cx="393" cy="207" r="25"/><circle cx="393" cy="207" r="11"/></g>
        <path d="M441 207 H505" class="ind-shaft"/><rect x="505" y="145" width="145" height="125" rx="24" class="ind-machine"/><circle cx="577" cy="207" r="38" class="ind-driven"/><text x="577" y="212" text-anchor="middle" class="cd-value">LOAD</text>
        <path d="M105 116 C220 76 480 76 605 116" class="ind-motion" marker-end="url(#indArrow-${c.id})"/><text x="355" y="88" text-anchor="middle" class="cd-label">TORQUE + SPEED + LOAD TRAVEL THROUGH THE DRIVE</text>
        <text x="393" y="286" text-anchor="middle" class="cd-label">SUPPORT · ALIGN · TRANSMIT · MONITOR</text></g>`;
    } else if(cat==='ind-fluid'){
      body=`<g class="ind-hyd">
        <rect x="65" y="286" width="150" height="70" rx="14" class="hyd-reservoir"/><text x="140" y="326" text-anchor="middle" class="cd-label">RESERVOIR</text>
        <circle cx="170" cy="180" r="55" class="hyd-pump"/><path d="M145 180 L190 155 L190 205 Z"/><text x="170" y="252" text-anchor="middle" class="cd-label">PUMP CREATES FLOW</text>
        <rect x="300" y="142" width="120" height="76" rx="15" class="hyd-valve"/><path d="M320 180 H400 M360 158 V202"/><text x="360" y="240" text-anchor="middle" class="cd-label">VALVE CONTROLS PATH</text>
        <rect x="500" y="145" width="145" height="70" rx="18" class="hyd-cylinder"/><rect x="520" y="158" width="24" height="44" rx="5"/><path d="M544 180 H675" class="hyd-rod"/><text x="570" y="244" text-anchor="middle" class="cd-label">PRESSURE × AREA = FORCE</text>
        <path d="M140 286 V236 Q140 180 115 180 H115" class="hyd-line"/><path d="M225 180 H300 M420 180 H500 M500 205 C470 320 320 330 215 320" class="hyd-line"/>
        ${Array.from({length:8},(_,i)=>`<circle r="5" class="hyd-dot"><animateMotion dur="${3.2+i*.08}s" begin="-${i*.45}s" repeatCount="indefinite" path="M215 320 C320 330 470 320 500 205 M500 180 H420 M300 180 H225 M170 235 V286"/></circle>`).join('')}
        <text x="355" y="90" text-anchor="middle" class="cd-value">FLOW MAKES SPEED · RESISTANCE CREATES PRESSURE</text></g>`;
    } else if(cat==='ind-air'){
      body=`<g class="ind-air">
        <circle cx="105" cy="205" r="52" class="air-compressor-viz"/><text x="105" y="201" text-anchor="middle" class="cd-label">AIR</text><text x="105" y="220" text-anchor="middle" class="cd-value">COMPRESSOR</text>
        <path d="M157 205 H235" class="air-line"/>
        <rect x="235" y="153" width="110" height="104" rx="18" class="air-frl"/><text x="290" y="190" text-anchor="middle" class="cd-value">FRL</text><text x="290" y="214" text-anchor="middle" class="cd-label">CLEAN · REGULATE</text>
        <path d="M345 205 H410" class="air-line"/><rect x="410" y="168" width="90" height="74" rx="16" class="air-valve-viz"/><text x="455" y="210" text-anchor="middle" class="cd-label">VALVE</text>
        <path d="M500 205 H545" class="air-line"/><rect x="545" y="165" width="110" height="80" rx="18" class="air-cylinder-viz"/><path d="M595 205 H690" class="air-rod"/><text x="600" y="276" text-anchor="middle" class="cd-label">CYLINDER MOTION</text>
        ${Array.from({length:7},(_,i)=>`<circle r="4" class="air-dot-viz"><animateMotion dur="2.8s" begin="-${i*.4}s" repeatCount="indefinite" path="M157 205 H655"/></circle>`).join('')}
        <text x="355" y="105" text-anchor="middle" class="cd-value">COMPRESSED AIR STORES ENERGY · FLOW CONTROLS SPEED</text></g>`;
    } else if(cat==='ind-pumps'){
      body=`<g class="ind-pump-system">
        <rect x="55" y="245" width="145" height="100" rx="16" class="pump-tank"/><path d="M60 290 Q125 275 195 292 V340 H60 Z" class="pump-water"/><text x="127" y="325" text-anchor="middle" class="cd-label">SOURCE</text>
        <path d="M198 287 H265" class="pump-pipe"/><circle cx="350" cy="222" r="78" class="pump-casing"/><path d="M350 222 m-42 0 q42 -52 84 0 q-42 52 -84 0" class="pump-impeller"/><text x="350" y="330" text-anchor="middle" class="cd-label">IMPELLER ADDS ENERGY</text>
        <path d="M428 222 H650" class="pump-pipe"/><circle cx="515" cy="155" r="43" class="pump-gauge"/><path d="M515 155 L540 137"/><text x="515" y="115" text-anchor="middle" class="cd-label">DISCHARGE</text>
        ${Array.from({length:6},(_,i)=>`<circle r="5" class="pump-dot"><animateMotion dur="${2.8+i*.1}s" begin="-${i*.42}s" repeatCount="indefinite" path="M120 287 H270 C300 287 305 222 350 222 H650"/></circle>`).join('')}
        <text x="355" y="70" text-anchor="middle" class="cd-value">SUCTION CONDITIONS + PUMP CURVE + SYSTEM RESISTANCE SET THE OPERATING POINT</text></g>`;
    } else if(cat==='ind-conveyors'){
      body=`<g class="ind-conveyor">
        <circle cx="115" cy="230" r="52" class="conv-pulley"/><circle cx="595" cy="230" r="52" class="conv-pulley"/><path d="M115 178 H595 A52 52 0 0 1 595 282 H115 A52 52 0 0 1 115 178" class="conv-belt"/>
        <circle cx="245" cy="285" r="17" class="conv-idler"/><circle cx="355" cy="285" r="17" class="conv-idler"/><circle cx="465" cy="285" r="17" class="conv-idler"/>
        <rect x="245" y="132" width="62" height="46" rx="8" class="conv-load"/><rect x="365" y="130" width="75" height="48" rx="8" class="conv-load"/>
        <circle cx="95" cy="345" r="32" class="conv-motor"/><path d="M95 313 L115 282" class="conv-drive"/>
        ${Array.from({length:7},(_,i)=>`<circle r="4" class="conv-dot"><animateMotion dur="3s" begin="-${i*.4}s" repeatCount="indefinite" path="M115 178 H595"/></circle>`).join('')}
        <text x="355" y="82" text-anchor="middle" class="cd-value">DRIVE → PULLEY → BELT → MATERIAL · TRACKING + TENSION KEEP IT CONTROLLED</text></g>`;
    } else if(['ind-condition','ind-reliability','ind-diagnostics'].includes(cat)){
      body=`<g class="ind-condition-map">
        <rect x="250" y="145" width="210" height="125" rx="28" class="condition-machine"/><circle cx="315" cy="207" r="34" class="condition-rotor"/><path d="M349 207 H405"/><circle cx="420" cy="207" r="28" class="condition-bearing"/><text x="355" y="310" text-anchor="middle" class="cd-value">MACHINE BASELINE</text>
        ${[['VIBRATION',100,105],['TEMPERATURE',610,105],['OIL',105,350],['ULTRASOUND',600,350]].map(([t,x,y])=>`<g><circle cx="${x}" cy="${y}" r="48" class="condition-sensor"/><text x="${x}" y="${y+4}" text-anchor="middle" class="cd-label">${t}</text><path d="M${x+(x<355?48:-48)} ${y} Q355 ${y} 355 207" class="condition-link"/></g>`).join('')}
        <path d="M275 125 q18 -35 36 0 q18 35 36 0 q18 -35 36 0 q18 35 36 0" class="condition-wave"/>
        <text x="355" y="75" text-anchor="middle" class="cd-value">TREND CHANGE OVER TIME — DON'T WAIT FOR TOTAL FAILURE</text></g>`;
    } else {
      body=`<g class="ind-safety-map"><rect x="70" y="155" width="150" height="100" rx="20" class="safety-energy"/><text x="145" y="190" text-anchor="middle" class="cd-value">ENERGY</text><text x="145" y="216" text-anchor="middle" class="cd-label">electrical · pressure</text><text x="145" y="235" text-anchor="middle" class="cd-label">gravity · springs · motion</text><path d="M220 205 H285" class="safety-path"/><rect x="285" y="145" width="140" height="120" rx="24" class="safety-lock"/><text x="355" y="190" text-anchor="middle" class="cd-value">ISOLATE</text><text x="355" y="218" text-anchor="middle" class="cd-label">LOCK · BLOCK · BLEED</text><path d="M425 205 H490" class="safety-path"/><rect x="490" y="155" width="150" height="100" rx="20" class="safety-verify"/><text x="565" y="190" text-anchor="middle" class="cd-value">VERIFY</text><text x="565" y="218" text-anchor="middle" class="cd-label">zero-energy state</text><text x="355" y="330" text-anchor="middle" class="cd-value">STOPPED IS NOT THE SAME AS SAFE</text></g>`;
    }
    return `<div class="concept-diagram-wrap industrial-concept-viz"><svg class="concept-diagram" viewBox="0 0 710 410" role="img" aria-label="Industrial maintenance visual explanation of ${title}">${defs}<text x="355" y="42" text-anchor="middle" class="cd-title">${title}</text><text x="355" y="66" text-anchor="middle" class="cd-label">INDUSTRIAL MAINTENANCE · SYSTEM VIEW</text>${body}</svg><div class="diagram-caption"><b>See the machine as an energy path.</b><span>Drive, transmit, support, control, load and condition are connected — failures rarely live in isolation.</span></div></div>`;
  }

  function weldingConceptDiagram(c){
    const title=esc(c.title), cat=c.category;
    let body='';
    if(['weld-process','weld-arc'].includes(cat)){
      body=`<g class="weld-process-viz">
        <path d="M150 95 L310 210" class="weld-torch"/><circle cx="314" cy="214" r="10" class="weld-electrode-tip"/>
        <path d="M318 220 C300 240 330 256 350 270 C370 252 397 240 384 220" class="weld-arc-viz"/>
        <ellipse cx="355" cy="285" rx="78" ry="28" class="weld-puddle-viz"/><path d="M80 315 H630" class="weld-plate"/>
        <path d="M425 286 Q470 275 515 288" class="weld-bead-viz"/>
        ${Array.from({length:12},(_,i)=>`<circle class="weld-spark-viz" cx="${330+(i%4)*17}" cy="${225+(i%3)*8}" r="${2+(i%2)}"><animate attributeName="cy" values="${225+(i%3)*8};${150-(i%4)*14}" dur="${.7+(i%3)*.2}s" begin="-${i*.09}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${.7+(i%3)*.2}s" begin="-${i*.09}s" repeatCount="indefinite"/></circle>`).join('')}
        <text x="112" y="110" class="cd-label">ELECTRODE / TORCH</text><text x="355" y="355" text-anchor="middle" class="cd-value">HEAT + ARC + TRAVEL + SHIELDING SHAPE THE PUDDLE</text>
        <text x="535" y="205" text-anchor="middle" class="cd-label">WATCH THE PUDDLE EDGES</text></g>`;
    } else if(cat==='weld-joints'){
      body=`<g class="weld-joint-viz">
        <path d="M105 300 H300 L340 225" class="weld-joint-plate"/><path d="M605 300 H410 L370 225" class="weld-joint-plate"/>
        <path d="M338 225 Q355 205 372 225 L407 297 H303 Z" class="weld-fusion-zone"/>
        <path d="M345 225 L355 246 L365 225" class="weld-root"/>
        <path d="M302 300 H408" class="weld-root-gap"/><text x="355" y="326" text-anchor="middle" class="cd-label">ROOT GAP / ROOT FACE</text>
        <path d="M300 300 L340 225 M410 300 L370 225" class="weld-bevel"/>
        <text x="215" y="190" text-anchor="middle" class="cd-label">BEVEL ANGLE</text><text x="500" y="190" text-anchor="middle" class="cd-label">FIT-UP</text>
        <text x="355" y="96" text-anchor="middle" class="cd-value">ACCESS + GEOMETRY DETERMINE WHETHER THE ARC CAN REACH THE ROOT AND SIDEWALLS</text></g>`;
    } else if(cat==='weld-symbols'){
      body=`<g class="weld-symbol-viz">
        <path d="M95 230 H610" class="symbol-reference"/><path d="M245 230 L155 320" class="symbol-arrow"/><path d="M155 320 l18 -3 l-10 -15" class="symbol-arrowhead"/>
        <path d="M330 230 l32 -38 v38 z" class="fillet-symbol"/><text x="302" y="207" text-anchor="end" class="cd-value">6</text><text x="382" y="208" class="cd-value">50-100</text>
        <circle cx="245" cy="230" r="13" class="all-around-ring"/><path d="M610 230 l70 -40" class="symbol-tail"/>
        <text x="350" y="275" text-anchor="middle" class="cd-label">REFERENCE LINE</text><text x="140" y="350" text-anchor="middle" class="cd-label">ARROW POINTS TO JOINT</text><text x="560" y="170" text-anchor="middle" class="cd-label">TAIL / PROCESS INFO</text>
        <text x="355" y="90" text-anchor="middle" class="cd-value">LOCATION · TYPE · SIZE · LENGTH · CONTOUR</text></g>`;
    } else if(cat==='weld-metal'){
      body=`<g class="weld-metal-viz">
        <path d="M75 295 H635" class="base-metal-top"/><rect x="75" y="295" width="560" height="65" class="base-metal-zone"/>
        <path d="M260 295 Q355 195 450 295 Z" class="weld-metal-zone"/><path d="M215 295 Q355 150 495 295" class="haz-boundary"/>
        <text x="355" y="245" text-anchor="middle" class="cd-value">WELD METAL</text><text x="220" y="325" text-anchor="middle" class="cd-label">BASE METAL</text><text x="490" y="325" text-anchor="middle" class="cd-label">BASE METAL</text><text x="215" y="245" text-anchor="middle" class="cd-label">HAZ</text><text x="495" y="245" text-anchor="middle" class="cd-label">HAZ</text>
        <path d="M355 145 V205" class="heat-arrow"/><text x="355" y="105" text-anchor="middle" class="cd-value">HEAT CYCLE CHANGES MORE THAN THE MOLTEN METAL</text></g>`;
    } else if(cat==='weld-defects'){
      body=`<g class="weld-defect-viz">
        <path d="M75 310 H635" class="weld-plate"/><path d="M195 310 Q355 190 515 310 Z" class="weld-section"/>
        <circle cx="310" cy="265" r="13" class="defect-pore"/><circle cx="345" cy="245" r="7" class="defect-pore"/><path d="M200 310 q22 -28 40 0" class="defect-undercut"/><path d="M430 275 Q470 260 500 300" class="defect-lackfusion"/>
        <path d="M310 252 L230 160" class="defect-callout"/><text x="185" y="150" class="cd-label">POROSITY</text><path d="M215 292 L135 230" class="defect-callout"/><text x="90" y="220" class="cd-label">UNDERCUT</text><path d="M455 275 L545 185" class="defect-callout"/><text x="555" y="175" class="cd-label">FUSION</text>
        <text x="355" y="95" text-anchor="middle" class="cd-value">VISIBLE CLUE → PHYSICAL MECHANISM → LIKELY PROCESS CAUSES</text></g>`;
    } else {
      body=`<g class="weld-safety-viz"><path d="M155 175 q55 -55 110 0 v95 q-55 45 -110 0 z" class="helmet-viz"/><rect x="175" y="185" width="70" height="36" rx="7" class="helmet-lens"/><text x="210" y="310" text-anchor="middle" class="cd-label">EYES + FACE</text><path d="M355 280 q-45 -80 0 -150 q45 70 0 150" class="fume-viz"/><text x="355" y="310" text-anchor="middle" class="cd-label">FUMES</text><rect x="485" y="145" width="70" height="150" rx="28" class="cylinder-viz"/><path d="M520 145 v-25 h20" class="cylinder-valve"/><text x="520" y="320" text-anchor="middle" class="cd-label">CYLINDERS</text><path d="M605 250 q20 -50 40 0 q20 -50 40 0" class="hotwork-flame"/><text x="645" y="310" text-anchor="middle" class="cd-label">HOT WORK</text><text x="355" y="90" text-anchor="middle" class="cd-value">PPE IS ONE LAYER — CONTROL RADIATION, FUMES, FIRE, GAS AND ELECTRICAL ENERGY</text></g>`;
    }
    return `<div class="concept-diagram-wrap welding-concept-viz"><svg class="concept-diagram" viewBox="0 0 710 410" role="img" aria-label="Welding visual explanation of ${title}"><text x="355" y="42" text-anchor="middle" class="cd-title">${title}</text><text x="355" y="66" text-anchor="middle" class="cd-label">WELDING · PROCESS VIEW</text>${body}</svg><div class="diagram-caption"><b>Watch what the process physically changes.</b><span>Arc, heat, puddle, fit-up, shielding and cooling history create the finished joint together.</span></div></div>`;
  }

  function constructionConceptDiagram(c){
    const title=esc(c.title), cat=c.category;
    let body='';
    if(['const-plans','const-layout'].includes(cat)){
      body=`<g class="const-plan-viz"><rect x="85" y="105" width="540" height="245" class="plan-sheet"/><path d="M165 135 V320 M355 135 V320 M545 135 V320 M115 175 H595 M115 270 H595" class="plan-grid"/><path d="M185 195 H520 V285 H185 Z M300 195 V285 M420 195 V285" class="plan-walls"/><path d="M220 165 H485" class="plan-dim"/><path d="M220 155 V175 M485 155 V175" class="plan-dim"/><text x="352" y="153" text-anchor="middle" class="cd-value">12'-0"</text><circle cx="300" cy="285" r="20" class="plan-callout"/><text x="300" y="290" text-anchor="middle" class="cd-label">5</text><text x="355" y="382" text-anchor="middle" class="cd-label">ESTABLISH REFERENCES → LOCATE → DIMENSION → VERIFY BEFORE BUILDING</text></g>`;
    } else if(cat==='const-framing'){
      body=`<g class="const-frame-viz"><path d="M90 115 H620 M90 325 H620" class="frame-plate"/><path d="M115 115 V325 M175 115 V325 M535 115 V325 M595 115 V325" class="frame-stud"/><rect x="230" y="205" width="250" height="120" class="frame-opening"/><rect x="205" y="155" width="300" height="55" class="frame-header"/><path d="M220 210 V325 M490 210 V325" class="frame-jack"/><path d="M245 115 V155 M305 115 V155 M365 115 V155 M425 115 V155 M485 115 V155" class="frame-cripple"/><path d="M250 80 V145 M355 80 V145 M460 80 V145" class="load-arrow-viz"/><text x="355" y="98" text-anchor="middle" class="cd-value">HEADER + SUPPORTS CARRY LOAD AROUND THE OPENING</text><text x="355" y="365" text-anchor="middle" class="cd-label">PLATES · STUDS · OPENINGS · SHEATHING · CONNECTIONS = ONE ASSEMBLY</text></g>`;
    } else if(cat==='const-loads'){
      body=`<g class="const-load-viz"><path d="M105 120 L355 70 L605 120" class="roof-viz"/><path d="M135 120 H575" class="floor-viz"/><path d="M180 120 V310 M530 120 V310" class="column-viz"/><path d="M115 310 H245 V345 H115 Z M465 310 H595 V345 H465 Z" class="footing-viz"/><path d="M250 95 V160 M355 78 V160 M460 95 V160" class="load-arrow-viz"/><path d="M355 160 V300" class="force-path-viz"/><path d="M355 220 C300 245 230 255 210 310 M355 220 C410 245 480 255 500 310" class="force-path-viz"/><text x="355" y="380" text-anchor="middle" class="cd-value">ROOF / FLOOR → BEAM / WALL → COLUMN / BEARING → FOOTING → SOIL</text></g>`;
    } else if(cat==='const-envelope'){
      body=`<g class="const-envelope-viz"><rect x="155" y="115" width="75" height="225" class="clad-viz"/><rect x="230" y="115" width="35" height="225" class="wrb-viz"/><rect x="265" y="115" width="80" height="225" class="sheath-viz"/><rect x="345" y="115" width="120" height="225" class="insul-viz"/><rect x="465" y="115" width="55" height="225" class="interior-viz"/><rect x="285" y="180" width="125" height="95" class="window-viz"/><path d="M270 170 H430 L448 190" class="flash-viz"/><path d="M90 155 l55 18 M85 205 l60 18 M90 255 l55 18" class="rain-arrow-viz"/><path d="M245 145 V315" class="drainage-path-viz"/><text x="193" y="370" text-anchor="middle" class="cd-label">CLADDING</text><text x="248" y="390" text-anchor="middle" class="cd-label">DRAINAGE PLANE</text><text x="405" y="370" text-anchor="middle" class="cd-label">THERMAL / AIR CONTROL</text><text x="355" y="98" text-anchor="middle" class="cd-value">KEEP WATER, AIR AND THERMAL LAYERS CONTINUOUS AT OPENINGS</text></g>`;
    } else if(cat==='const-materials'){
      body=`<g class="const-material-viz"><path d="M115 285 H595 V350 H115 Z" class="concrete-viz"/><path d="M165 300 H545 M165 325 H545" class="rebar-viz"/><circle cx="195" cy="300" r="9" class="rebar-dot"/><circle cx="295" cy="300" r="9" class="rebar-dot"/><circle cx="395" cy="300" r="9" class="rebar-dot"/><circle cx="495" cy="300" r="9" class="rebar-dot"/><path d="M145 140 V285 M565 140 V285" class="form-viz"/><path d="M145 140 H565" class="form-viz"/><text x="355" y="205" text-anchor="middle" class="cd-value">FORM → REINFORCE → PLACE → CONSOLIDATE → CURE</text><text x="355" y="375" text-anchor="middle" class="cd-label">POSITION + COVER + MATERIAL QUALITY MATTER BEFORE THE WORK IS HIDDEN</text></g>`;
    } else {
      body=`<g class="const-site-viz"><rect x="65" y="235" width="170" height="95" class="site-excavation"/><path d="M65 235 L105 175 H195 L235 235" class="excavation-slope"/><text x="150" y="288" text-anchor="middle" class="cd-label">EXCAVATION</text><rect x="290" y="135" width="140" height="195" class="site-scaffold"/><path d="M290 175 H430 M290 230 H430 M325 135 V330 M395 135 V330" class="scaffold-lines"/><text x="360" y="360" text-anchor="middle" class="cd-label">ACCESS / FALLS</text><path d="M500 315 V135" class="site-ladder"/><path d="M480 155 H520 M480 195 H520 M480 235 H520 M480 275 H520" class="ladder-rungs-viz"/><circle cx="600" cy="235" r="55" class="utility-zone"/><path d="M570 235 H630 M600 205 V265" class="utility-cross"/><text x="600" y="315" text-anchor="middle" class="cd-label">UTILITIES</text><text x="355" y="100" text-anchor="middle" class="cd-value">IDENTIFY THE HAZARD BEFORE THE WORK ENTERS THE EXPOSURE ZONE</text></g>`;
    }
    return `<div class="concept-diagram-wrap construction-concept-viz"><svg class="concept-diagram" viewBox="0 0 710 410" role="img" aria-label="Construction visual explanation of ${title}"><text x="355" y="42" text-anchor="middle" class="cd-title">${title}</text><text x="355" y="66" text-anchor="middle" class="cd-label">CONSTRUCTION · ASSEMBLY VIEW</text>${body}</svg><div class="diagram-caption"><b>Translate information into a complete assembly.</b><span>Reference, sequence, interfaces and continuity are where field quality is won or lost.</span></div></div>`;
  }

  function conceptDiagram(c){
    const title=esc(c.title), cat=c.category, world=worldOf(c);
    const rel=(c.related||[]).map(x=>conceptById(x)).filter(Boolean).slice(0,3);
    if(world==="hvac") return hvacConceptDiagram(c);
    if(world==="plumbing") return plumbingConceptDiagram(c);
    if(world==="industrial") return industrialConceptDiagram(c);
    if(world==="welding") return weldingConceptDiagram(c);
    if(world==="construction") return constructionConceptDiagram(c);
    if(world!=="electrical"){
      const w=D.worlds.find(x=>x.id===worldOf(c));
      const lower=(c.where||[]).slice(0,3).map((x,i)=>`<g transform="translate(${65+i*215} 285)"><rect width="190" height="72" rx="13" class="cd-node"/>${svgWrapped(x,95,36,20,'cd-node-text',15)}</g>`).join('');
      const links=(c.where||[]).slice(0,3).map((x,i)=>`<path d="M355 205 C355 250 ${160+i*215} 248 ${160+i*215} 285" class="cd-link"/>`).join('');
      return `<div class="concept-diagram-wrap"><svg class="concept-diagram" viewBox="0 0 710 410"><text x="355" y="42" text-anchor="middle" class="cd-title">${title}</text><text x="355" y="67" text-anchor="middle" class="cd-label">${esc(w?.name||worldOf(c)).toUpperCase()} SYSTEM CONTEXT</text><rect x="235" y="118" width="240" height="105" rx="24" class="cd-device"/><text x="355" y="162" text-anchor="middle" class="cd-label">CONCEPT</text><text x="355" y="191" text-anchor="middle" class="cd-value">${title}</text>${links}${lower}<circle r="5" class="cd-dot"><animateMotion dur="3s" repeatCount="indefinite" path="M165 315 C245 240 300 220 355 205 C430 225 505 250 545 315"/></circle></svg><div class="diagram-caption"><b>Place the concept inside the real system.</b><span>The connected nodes show common places you encounter it in this trade.</span></div></div>`;
    }
    const nodeX=[45,265,485];
    const nodes=rel.map((r,i)=>`<g transform="translate(${nodeX[i]} 302)"><rect width="180" height="72" rx="14" class="cd-node"/>${svgWrapped(r.title,90,37,19,'cd-node-text',15)}</g>`).join('');
    const connectors=rel.map((r,i)=>`<path d="M350 218 C350 262 ${135+i*220} 252 ${135+i*220} 302" class="cd-link"/>`).join('');
    const flowDots=`<circle r="5" class="cd-dot"><animateMotion dur="2.8s" repeatCount="indefinite" path="M120 188 H590"/></circle><circle r="4" class="cd-dot cd-dot2"><animateMotion dur="2.8s" begin="-.9s" repeatCount="indefinite" path="M120 188 H590"/></circle>`;
    let core='';
    if(['fundamentals','circuits'].includes(cat)) core=`<rect x="78" y="135" width="135" height="106" rx="18" class="cd-device"/><text x="145" y="177" text-anchor="middle" class="cd-label">SOURCE</text><text x="145" y="203" text-anchor="middle" class="cd-value">24 V</text><path d="M213 188 H497" class="cd-wire"/><rect x="497" y="142" width="135" height="92" rx="18" class="cd-device"/><text x="565" y="177" text-anchor="middle" class="cd-label">LOAD</text><text x="565" y="203" text-anchor="middle" class="cd-value">SYSTEM</text>${flowDots}`;
    else if(cat==='components') core=`<rect x="90" y="135" width="150" height="108" rx="18" class="cd-device"/><path d="M120 190 q35 -55 70 0 q35 55 70 0" class="cd-coil"/><text x="165" y="218" text-anchor="middle" class="cd-label">COIL / ACTUATOR</text><path d="M300 190 H392" class="cd-wire"/><line x1="410" y1="210" x2="478" y2="160" class="cd-contact"/><circle cx="405" cy="214" r="7" class="cd-contact-point"/><circle cx="490" cy="150" r="7" class="cd-contact-point"/><path d="M495 150 H620" class="cd-wire"/><text x="530" y="222" text-anchor="middle" class="cd-label">CONTACT / OUTPUT</text>`;
    else if(cat==='motors') core=`<circle cx="355" cy="185" r="96" class="cd-stator"/><circle cx="355" cy="185" r="52" class="cd-rotor"/><path d="M355 80 A105 105 0 0 1 455 180" class="cd-field"/><path d="M355 290 A105 105 0 0 1 255 190" class="cd-field cd-field2"/><text x="355" y="190" text-anchor="middle" class="cd-value">ROTOR</text><text x="355" y="68" text-anchor="middle" class="cd-label">ROTATING MAGNETIC FIELD</text>`;
    else if(cat==='plc') core=`<rect x="65" y="145" width="150" height="84" rx="16" class="cd-device"/><text x="140" y="180" text-anchor="middle" class="cd-label">FIELD INPUTS</text><text x="140" y="202" text-anchor="middle" class="cd-value">0 / 1</text><path d="M215 187 H282" class="cd-wire"/><rect x="282" y="118" width="150" height="138" rx="18" class="cd-device cd-plc"/><text x="357" y="168" text-anchor="middle" class="cd-label">PLC</text><text x="357" y="194" text-anchor="middle" class="cd-value">READ → SOLVE</text><text x="357" y="216" text-anchor="middle" class="cd-value">→ UPDATE</text><path d="M432 187 H497" class="cd-wire"/><rect x="497" y="145" width="150" height="84" rx="16" class="cd-device"/><text x="572" y="180" text-anchor="middle" class="cd-label">FIELD OUTPUTS</text><text x="572" y="202" text-anchor="middle" class="cd-value">ACT</text>`;
    else if(cat==='drives') core=`<g class="cd-drive-flow"><rect x="36" y="150" width="120" height="76" rx="14" class="cd-device"/><text x="96" y="181" text-anchor="middle" class="cd-label">AC INPUT</text><text x="96" y="204" text-anchor="middle" class="cd-value">60 Hz</text><path d="M156 188 H205" class="cd-wire"/><rect x="205" y="150" width="120" height="76" rx="14" class="cd-device"/><text x="265" y="181" text-anchor="middle" class="cd-label">RECTIFIER</text><text x="265" y="204" text-anchor="middle" class="cd-value">AC→DC</text><path d="M325 188 H374" class="cd-wire"/><rect x="374" y="150" width="120" height="76" rx="14" class="cd-device cd-bus"/><text x="434" y="181" text-anchor="middle" class="cd-label">DC BUS</text><text x="434" y="204" text-anchor="middle" class="cd-value">ENERGY</text><path d="M494 188 H543" class="cd-wire"/><rect x="543" y="150" width="120" height="76" rx="14" class="cd-device"/><text x="603" y="181" text-anchor="middle" class="cd-label">INVERTER</text><text x="603" y="204" text-anchor="middle" class="cd-value">VAR Hz</text></g>`;
    else if(cat==='sensors') core=`<rect x="65" y="145" width="150" height="90" rx="45" class="cd-device"/><text x="140" y="182" text-anchor="middle" class="cd-label">SENSOR</text><text x="140" y="207" text-anchor="middle" class="cd-value">DETECT</text><path d="M215 190 H420" class="cd-beam"/><rect x="420" y="120" width="88" height="140" rx="12" class="cd-target"/><text x="464" y="285" text-anchor="middle" class="cd-label">TARGET</text><path d="M215 220 C310 280 500 300 620 222" class="cd-signal"/><text x="580" y="208" class="cd-value">PLC INPUT</text>`;
    else if(cat==='power') core=`<path d="M100 190 h92" class="cd-wire"/><path d="M205 130 q-35 60 0 120 q35 -60 0 -120 m28 0 q-35 60 0 120 q35 -60 0 -120" class="cd-coil"/><rect x="280" y="110" width="150" height="155" rx="16" class="cd-core"/><path d="M475 130 q-35 60 0 120 q35 -60 0 -120 m28 0 q-35 60 0 120 q35 -60 0 -120" class="cd-coil"/><path d="M530 190 h92" class="cd-wire"/><path d="M305 137 C345 105 385 105 420 137 M420 238 C380 270 340 270 305 238" class="cd-flux"/><text x="355" y="192" text-anchor="middle" class="cd-value">MAGNETIC FLUX</text>`;
    else if(cat==='diagnostics') core=`<path d="M85 198 H235" class="cd-wire"/><rect x="235" y="158" width="160" height="80" rx="16" class="cd-device"/><text x="315" y="191" text-anchor="middle" class="cd-label">UNKNOWN</text><text x="315" y="214" text-anchor="middle" class="cd-value">FAULT?</text><path d="M395 198 H630" class="cd-wire"/><circle cx="490" cy="100" r="52" class="cd-meter"/><text x="490" y="106" text-anchor="middle" class="cd-value">DMM</text><path d="M470 145 L405 190 M510 145 L555 190" class="cd-probe"/>`;
    else core=`<rect x="82" y="140" width="150" height="95" rx="18" class="cd-device"/><text x="157" y="180" text-anchor="middle" class="cd-label">ENERGY</text><text x="157" y="205" text-anchor="middle" class="cd-value">SOURCE</text><path d="M232 188 H315" class="cd-wire"/><rect x="315" y="130" width="100" height="115" rx="15" class="cd-lock"/><text x="365" y="180" text-anchor="middle" class="cd-label">ISOLATE</text><text x="365" y="205" text-anchor="middle" class="cd-value">LOCK</text><path d="M415 188 H495" class="cd-wire"/><circle cx="560" cy="188" r="58" class="cd-meter"/><text x="560" y="182" text-anchor="middle" class="cd-label">VERIFY</text><text x="560" y="207" text-anchor="middle" class="cd-value">0 ENERGY</text>`;
    return `<div class="concept-diagram-wrap"><svg class="concept-diagram" viewBox="0 0 710 410" role="img" aria-label="Visual explanation of ${title}"><defs><filter id="glow-${c.id}"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><text x="355" y="42" text-anchor="middle" class="cd-title">${title}</text>${core}<g opacity=".85">${connectors}${nodes}</g></svg><div class="diagram-caption"><b>Read the behavior, not just the symbol.</b><span>The lower nodes show concepts this topic connects to in the real system.</span></div></div>`;
  }

  function renderKnowledgeCheck(c){
    const q=c.check; if(!q) return '';
    return `<section class="knowledge-check" id="check-${c.id}"><div class="eyebrow">Quick knowledge check</div><h2>${esc(q.q)}</h2><div class="check-options">${q.options.map((o,i)=>`<button onclick="answerConceptCheck('${c.id}',${i})" data-check-option="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(o)}</button>`).join('')}</div><div class="check-explain" data-check-explain></div></section>`;
  }

  window.answerConceptCheck=(conceptId,choice)=>{
    const c=conceptById(conceptId), host=id(`check-${conceptId}`); if(!c?.check||!host)return;
    host.querySelectorAll('[data-check-option]').forEach((b,i)=>{b.classList.remove('correct','wrong'); if(i===c.check.answer)b.classList.add('correct'); else if(i===choice)b.classList.add('wrong');});
    const box=host.querySelector('[data-check-explain]'); box.innerHTML=`<b>${choice===c.check.answer?'Correct.':'Not quite.'}</b> ${esc(c.check.explain)}`; box.classList.add('show');
  };

  function conceptCompass(c){
    return `<div class="concept-compass"><div><span>01</span><b>Define it</b><p>${esc(c.oneLine)}</p></div><div><span>02</span><b>Place it in the system</b><p>${esc(c.why)}</p></div><div><span>03</span><b>Recognize it in the field</b><p>${esc((c.recognize||[])[0]||'Connect the concept to the real equipment around it.')}</p></div></div>`;
  }



  function unitAdjacent(worldId, categoryId){
    const cats = categoriesFor(worldId);
    const idx = cats.findIndex(c => c.id === categoryId);
    return {
      prev: idx > 0 ? cats[idx-1] : null,
      next: idx >= 0 && idx < cats.length-1 ? cats[idx+1] : null,
      index: idx+1,
      total: cats.length
    };
  }

  function unitLessonNav(worldId, categoryId){
    const {prev, next, index, total} = unitAdjacent(worldId, categoryId);
    return `<nav class="lesson-nav unit-lesson-nav" aria-label="Unit navigation">
      <div class="lesson-nav-meta"><span>Course units</span><b>${index} / ${total}</b></div>
      <div class="lesson-nav-btns">
        ${prev ? `<button class="ghost-btn lesson-nav-btn" onclick="go('world/${worldId}/unit/${prev.id}')"><span>← Previous unit</span><b>${esc(prev.name)}</b></button>` : `<span class="lesson-nav-placeholder"></span>`}
        ${next ? `<button class="solid-btn lesson-nav-btn" onclick="go('world/${worldId}/unit/${next.id}')"><span>Next unit →</span><b>${esc(next.name)}</b></button>` : `<button class="ghost-btn lesson-nav-btn" onclick="go('world/${worldId}')"><span>Course home</span><b>Back to outline</b></button>`}
      </div>
    </nav>`;
  }

  function adjacentLessons(conceptId){
    const c = conceptById(conceptId);
    if(!c) return {prev:null, next:null, index:0, total:0};
    const worldId = worldOf(c);
    // Prefer same-unit sequence; fall back to full world order
    let list = conceptsFor(worldId).filter(x => x.category === c.category);
    if(list.length < 2) list = conceptsFor(worldId);
    const idx = list.findIndex(x => x.id === conceptId);
    return {
      prev: idx > 0 ? list[idx-1] : null,
      next: idx >= 0 && idx < list.length-1 ? list[idx+1] : null,
      index: idx >= 0 ? idx+1 : 0,
      total: list.length,
      unitName: (categoryById(c.category, worldId)||{}).name || "Unit"
    };
  }

  function lessonNav(conceptId){
    const {prev, next, index, total, unitName} = adjacentLessons(conceptId);
    if(!prev && !next) return "";
    return `<nav class="lesson-nav" aria-label="Lesson navigation">
      <div class="lesson-nav-meta"><span>${esc(unitName)}</span><b>${index} / ${total}</b></div>
      <div class="lesson-nav-btns">
        ${prev ? `<button class="ghost-btn lesson-nav-btn" onclick="go('concept/${prev.id}')"><span>← Previous</span><b>${esc(prev.title)}</b></button>` : `<span class="lesson-nav-placeholder"></span>`}
        ${next ? `<button class="solid-btn lesson-nav-btn" onclick="go('concept/${next.id}')"><span>Next →</span><b>${esc(next.title)}</b></button>` : `<button class="ghost-btn lesson-nav-btn" onclick="history.back()">Back</button>`}
      </div>
    </nav>`;
  }

  /* V15 signature: the equipment data plate.
     Every trade here starts a job the same way — find the plate, read it before
     you touch anything. Motor nameplate, valve tag, pipe marker, arc-flash
     label, WPS number. So the concept header is a plate, and it carries the
     same reading order: what it is, where it lives, what it does, how you
     prove it. Rows only appear when the concept actually has that data. */
  function nameplate(c, world, cat){
    const firstVerify = (c.verify||[])[0];
    const firstWhere = (c.where||[]).slice(0,3).join(" \u00b7 ");
    const rows = [
      ["TRADE", world?.name||worldOf(c)],
      ["UNIT", cat?.name||"Reference"],
      ["CLASS", c.eyebrow||"Concept"],
      ["DEFINITION", c.oneLine, true]
    ];
    if(firstWhere) rows.push(["FOUND ON", firstWhere, true]);
    if(firstVerify) rows.push(["HOW YOU PROVE IT", firstVerify, true]);
    return `<div class="nameplate">
      <div class="plate-head">
        <span class="plate-mark">TradeSchool \u00b7 field reference${c.currency?" \u00b7 currency checked":""}</span>
        <h1 class="plate-title">${esc(c.title)}</h1>
      </div>
      <div class="plate-rows">
        ${rows.map(([k,v,wide])=>`<div class="plate-row${wide?" wide":""}"><small>${k}</small><b>${esc(v)}</b></div>`).join("")}
      </div>
    </div>`;
  }

  function renderConcept(id){
    const c=conceptById(id); if(!c) return renderHome();
    const worldId=worldOf(c), world=D.worlds.find(w=>w.id===worldId), cat=categoryById(c.category,worldId);
    const genericSafety=/^Use the correct trade procedures, manufacturer documentation and applicable codes/i.test(String(c.safety||''));
    const asset=D.visualAssets?.[c.id];
    shell(`
      <section class="reference-hero reference-${worldId}"><div><div class="breadcrumb"><span onclick="go('')">TradeSchool</span><b>\u203a</b><span onclick="go('world/${worldId}')">${esc(world?.name||worldId)}</span><b>\u203a</b><span onclick="go('world/${worldId}/unit/${c.category}')">${esc(cat?.name||'Unit')}</span></div>
        ${nameplate(c, world, cat)}
        <div class="reference-actions"><button class="${state.progress[c.id]?'ghost-btn':'solid-btn'}" onclick="toggleComplete('${c.id}')">${state.progress[c.id]?'\u2713 Complete':'Mark understood'}</button><button class="ghost-btn" onclick="go('world/${worldId}/unit/${c.category}')">Back to unit</button></div></div>${(asset && !/\.svg$/i.test(asset.src))?`<img src="${asset.src}" alt="${esc(asset.caption||c.title)}">`:`<div class="reference-hero-mark"><span>${esc(WORLD_COPY[worldId].tag)}</span></div>`}</section>
      ${lessonNav(c.id)}
      <article class="reference-article">
        <section class="reference-lead"><div><small>THE IDEA</small><p>${esc(c.plain)}</p>${c.why?`<p>${esc(c.why)}</p>`:''}${c.analogy&&!isGenericAnalogy(c.analogy)?`<blockquote>${esc(c.analogy)}</blockquote>`:''}</div></section>
        ${renderVisualLearning(c)}
        ${(c.steps||[]).length?`<section class="behavior-flow"><div class="section-heading-row"><div><div class="eyebrow">Behavior</div><h2>Follow what actually happens.</h2></div><p>Read this as a sequence, not a checklist to memorize.</p></div><div class="behavior-steps">${c.steps.map((x,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><p>${esc(x)}</p></div>`).join('')}</div></section>`:''}
        ${((c.recognize||[]).length+(c.verify||[]).length+(c.failures||[]).length)?`
        <section class="field-evidence"><div class="section-heading-row"><div><div class="eyebrow">Field evidence</div><h2>What would make you believe this is the issue?</h2></div><p>Recognition, measurement and symptoms belong together.</p></div><div class="field-evidence-grid">${[['RECOGNIZE',c.recognize],['VERIFY',c.verify],['FAILURE CLUES',c.failures]].filter(([,v])=>(v||[]).length).map(([k,v])=>`<div><small>${k}</small>${v.slice(0,4).map(x=>`<p>${esc(x)}</p>`).join('')}</div>`).join('')}</div></section>`:''}
        ${c.fieldScenario&&!isGenericScenario(c.fieldScenario)?`<section class="field-story"><small>FIELD SCENARIO</small><h2>Put it in context.</h2><p>${esc(c.fieldScenario)}</p></section>`:''}
        ${!genericSafety&&c.safety?`<section class="safety-note-v7"><small>SAFETY CONTEXT</small><p>${esc(c.safety)}</p></section>`:''}
        ${(c.related||[]).length?`<section class="reference-related"><small>KEEP FOLLOWING THE SYSTEM</small><div>${c.related.map(rid=>{const r=conceptById(rid);return r?`<button onclick="go('concept/${rid}')"><b>${esc(r.title)}</b><span>${esc(r.oneLine)}</span></button>`:''}).join('')}</div></section>`:''}
        ${renderKnowledgeCheck(c)}
      </article>
      ${lessonNav(c.id)}
      ${footer()}
    `);
  }

  function renderLesson(c){
    const type = c.lesson;
    if(!type || type==="none") return "";
    const title = {
      voltage:"Voltage Lab",ohms:"Ohm's Law Lab",series:"Series / Parallel Lab",relay:"Relay Lab",
      motor:"Motor Behavior Lab",starter:"Motor Starter Lab",scan:"PLC Scan Lab",ladder:"Ladder Preview",
      sensor:"Sensor Lab",wave:"AC Wave Lab",transformer:"Transformer Lab",meter:"Meter Thinking Lab",troubleshoot:"Troubleshoot Preview",
      "hvac-cycle":"Refrigeration Cycle Lab",airflow:"Airflow Lab","hvac-controls":"HVAC Controls Lab","pressure-flow":"Pressure + Flow Lab","drain-vent":"Drain + Vent Lab","water-heater-lab":"Water Heater Lab","shaft-alignment":"Shaft Alignment Lab","hydraulic-lab":"Hydraulic Power Lab","pneumatic-lab":"Pneumatic Sequence Lab","bearing-lab":"Bearing Health Lab","conveyor-lab":"Conveyor Drive Lab","weld-puddle":"Weld Parameter Window","joint-lab":"Joint + Penetration Lab","defect-lab":"Weld Defect Lab","blueprint-lab":"Blueprint + Layout Lab","framing-lab":"Framing Builder","loadpath-lab":"Load Path Lab","envelope-lab":"Envelope Water Lab"
    }[type] || "Interactive Lab";
    const intents={voltage:["See how voltage, resistance, current and power move together.","Watch what changes under load — not just the number on the slider."],ohms:["Build intuition for V = I × R instead of memorizing the triangle.","Change one variable at a time and predict the other values before looking."],series:["Compare one current path with multiple parallel paths.","Watch which quantity stays the same and which quantity divides."],relay:["See how a low-power coil mechanically controls another circuit.","Separate coil state, contact state and load state in your head."],motor:["Connect frequency and load to motor speed/current.","Watch overload behavior emerge instead of treating amps as a random number."],starter:["Understand START, STOP, overload and seal-in as one control sequence.","Watch why the motor stays on after a momentary START command."],scan:["See what a PLC scan actually means in time.","Notice the difference between field input, input image, logic result and physical output."],ladder:["Read ladder as cause-and-effect logic.","Find the condition that blocks continuity instead of staring at the whole rung."],sensor:["See detection become an electrical input state.","Watch the difference between physical target position and PLC-style ON/OFF data."],wave:["Make AC frequency and phase visible.","Compare one waveform with three phase-shifted waveforms."],transformer:["See how turns ratio changes AC voltage.","Watch primary/secondary values change while the magnetic link remains the mechanism."],
      "shaft-alignment":["See shaft centerlines instead of treating alignment as a vague machine position.","Watch offset and angular error create stress before the machine necessarily fails."],
      
      "pneumatic-lab":["Follow supply and exhaust through a directional valve.","Watch pressure affect force and restriction affect speed."],
      "bearing-lab":["Turn bearing temperature and vibration into condition clues.","Watch lubrication, alignment and load create different evidence."],
      "conveyor-lab":["See motor, gearbox, pulley, belt and load as one drive.","Watch slip and excessive tension trade one problem for another."],
      "weld-puddle":["Compare how parameter direction changes a simplified weld cross-section.","Use the model for cause-and-effect only — not as a weld-quality predictor."],
      "joint-lab":["Connect root geometry and heat to fusion/penetration.","Watch whether the arc can physically reach the surfaces that must fuse."],
      "defect-lab":["Identify defects by physical appearance and location.","Work backward from the discontinuity to plausible process causes."],
      "blueprint-lab":["Translate scale/dimensions into a field location.","Use controlling dimensions instead of trusting the apparent picture size."],
      "framing-lab":["An opening interrupts the normal stud path. Headers and jack studs are the members that restore continuity around that interruption.","Remove the header support and the visualization shows the exact location where the vertical load path is broken."],
      "loadpath-lab":["Every gravity load needs a continuous path of members and connections to the foundation.","Remove one beam or support and identify the exact transfer point that is now missing — that is where the structure would fail under the remaining load."],
      "envelope-lab":["Follow rain behind cladding and back to the exterior.","Watch flashing and drainage-plane continuity determine whether water drains or leaks."]

    };
    const intent=intents[type]||["Use the interaction to connect the concept to system behavior.","Change one condition at a time and explain what changed before moving on."];
    return `<section class="lesson-card premium-lesson"><div class="lesson-top"><span>${title}</span><span>GUIDED INTERACTION</span></div><div class="lesson-intent"><div><small>WHAT YOU'RE LEARNING</small><b>${intent[0]}</b></div><div><small>WHAT TO WATCH</small><b>${intent[1]}</b></div></div><div class="lesson-body" id="lessonBody">${lessonMarkup(type)}</div></section>`;
  }

  function lessonMarkup(type){
    const worldTools={"hvac-cycle":["Refrigeration Cycle Lab","See pressure, temperature and heat movement around the complete loop."],airflow:["Airflow Lab","Change restriction and blower behavior, then watch CFM and static pressure respond."],"hvac-controls":["Thermostat + Controls Lab","Watch a cooling request become a real equipment sequence."],"pressure-flow":["Pressure + Flow Lab","Change pressure, pipe size and restriction while the water stream responds."],"drain-vent":["Drain + Vent Lab","See why a vent protects the trap seal while a fixture drains."],"water-heater-lab":["Water Heater Lab","Draw hot water and watch temperature layers, recovery and expansion react."],"shaft-alignment":["Shaft Alignment Lab","Move coupled shafts and see how misalignment becomes vibration and coupling stress."],"pneumatic-lab":["Pneumatic Sequence Lab","Route compressed air and watch a cylinder respond."],"bearing-lab":["Bearing Health Lab","See how load, lubrication and alignment affect bearing condition."],"conveyor-lab":["Conveyor Drive Lab","Watch speed, load and belt tension interact."],"weld-puddle":["Arc + Puddle Lab","Change welding variables and watch the molten puddle and bead react."],"joint-lab":["Joint + Penetration Lab","Cut through the joint and watch fusion depth change."],"defect-lab":["Weld Defect Lab","Create common defects and learn what caused them."],"blueprint-lab":["Blueprint + Layout Lab","Translate drawing information into a field location."],"framing-lab":["Opening + Header Framing","Add the header and jack studs that carry load around an opening, then remove them and watch continuity fail."],"loadpath-lab":["Load Path Continuity","Break one member or support and identify the exact transfer point that is now missing."],"envelope-lab":["Envelope Water Lab","Change flashing and weather layers while rain tests the assembly."]};
    if(worldTools[type]) return `<div class="tool-preview"><div class="preview-orbit"></div><h2>${worldTools[type][0]}</h2><p>${worldTools[type][1]}</p><button class="solid-btn" onclick="go('tool/${type}')">Open full interactive lab →</button></div>`;
    if(type==="voltage" || type==="ohms") return `
      <div class="lab-grid">
        <div class="control-panel">
          <div class="range-row"><div class="range-head"><span>Source voltage</span><b id="labVoltLabel">24 V</b></div><input id="labVolt" type="range" min="0" max="72" value="24"></div>
          <div class="range-row"><div class="range-head"><span>Load resistance</span><b id="labResLabel">12 Ω</b></div><input id="labRes" type="range" min="2" max="60" value="12"></div>
          <div class="metric-row"><div class="metric"><b id="labI">2.00 A</b><small>Current</small></div><div class="metric"><b id="labP">48 W</b><small>Power</small></div><div class="metric"><b id="labState">ON</b><small>Load</small></div></div>
          <div id="labFail"></div>
        </div>
        <div class="visual-panel"><div class="bulb-wrap"><div class="bulb" id="labBulb"><div class="bulb-filament"></div></div></div><div class="circuit-line on" id="labWire"></div></div>
      </div>`;
    if(type==="series") return `
      <div class="lab-grid">
        <div class="control-panel">
          <div class="range-row"><div class="range-head"><span>Source</span><b id="seriesVoltLabel">24 V</b></div><input id="seriesVolt" type="range" min="6" max="48" value="24"></div>
          <div class="range-row"><div class="range-head"><span>Topology</span><b id="seriesModeLabel">SERIES</b></div><button class="push" id="seriesMode">Switch to parallel</button></div>
          <div class="metric-row"><div class="metric"><b id="seriesI">1.00 A</b><small>Total I</small></div><div class="metric"><b id="seriesEach">12 V</b><small>Each load</small></div><div class="metric"><b id="seriesP">12 W</b><small>Each power</small></div></div>
        </div>
        <div class="visual-panel" style="display:grid;grid-template-columns:1fr 1fr;place-items:center">
          <div class="bulb-wrap" style="height:180px"><div class="bulb" id="bulbA"></div></div><div class="bulb-wrap" style="height:180px"><div class="bulb" id="bulbB"></div></div>
        </div>
      </div>`;
    if(type==="relay") return `
      <div class="lab-grid"><div class="control-panel"><h3 style="margin-top:0">Energize the coil.</h3><p style="color:var(--muted);font-size:13px;line-height:1.5">Watch the magnetic coil pull the normally-open contact closed and energize a separate load circuit.</p><button class="push" id="relayBtn">ENERGIZE COIL</button><div class="metric-row"><div class="metric"><b id="relayCoilM">OFF</b><small>Coil</small></div><div class="metric"><b id="relayContactM">OPEN</b><small>NO contact</small></div><div class="metric"><b id="relayLoadM">OFF</b><small>Load</small></div></div></div><div class="visual-panel"><div class="relay-board"><div class="relay-coil" id="relayCoil">COIL</div><div class="relay-contact" id="relayContact"><div class="contact-base"></div><div class="contact-arm"></div></div><div class="load-lamp" id="relayLamp"></div></div></div></div>`;
    if(type==="motor") return `
      <div class="lab-grid"><div class="control-panel"><div class="range-row"><div class="range-head"><span>Frequency</span><b id="motorHzLabel">60 Hz</b></div><input id="motorHz" type="range" min="0" max="60" value="60"></div><div class="range-row"><div class="range-head"><span>Mechanical load</span><b id="motorLoadLabel">50%</b></div><input id="motorLoad" type="range" min="0" max="120" value="50"></div><div class="metric-row"><div class="metric"><b id="motorRpm">1800</b><small>Field RPM*</small></div><div class="metric"><b id="motorAmp">5.0 A</b><small>Current</small></div><div class="metric"><b id="motorCondition">NORMAL</b><small>Condition</small></div></div><p style="font-size:9px;color:var(--muted)">*Simplified 4-pole synchronous-speed model for visualization.</p></div><div class="visual-panel"><div class="motor-vis"><div class="motor-body"><div class="motor-rotor spin" id="motorRotor"></div></div></div></div></div>`;
    if(type==="starter") return `
      <div class="lab-grid"><div class="control-panel"><h3 style="margin-top:0">Three-wire starter</h3><p style="font-size:12px;color:var(--muted);line-height:1.5">START is momentary. The auxiliary contact seals around it. STOP or OVERLOAD opens the series control path.</p><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="push" id="startBtn">START</button><button class="push" id="stopBtn">STOP</button><button class="push" id="olBtn">TRIP OVERLOAD</button></div><div class="metric-row"><div class="metric"><b id="starterCoil">OFF</b><small>M coil</small></div><div class="metric"><b id="starterAux">OPEN</b><small>M aux</small></div><div class="metric"><b id="starterMotor">STOPPED</b><small>Motor</small></div></div></div><div class="visual-panel"><div class="motor-vis"><div class="motor-body"><div class="motor-rotor" id="starterRotor"></div></div></div><div class="circuit-line" id="starterLine"></div></div></div>`;
    if(type==="scan") return `
      <div class="lab-grid"><div class="control-panel"><h3 style="margin-top:0">Watch one PLC scan.</h3><p style="font-size:12px;color:var(--muted);line-height:1.5">Toggle the field input, then step the PLC through input read → program solve → output update.</p><div class="io-row"><span>FIELD_SENSOR</span><div class="toggle" id="scanInput"></div></div><button class="push" id="scanStep" style="margin-top:12px">STEP SCAN</button><button class="push" id="scanAuto" style="margin-top:12px">AUTO SCAN</button></div><div class="visual-panel"><div id="scanStages" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:55px"><div class="metric" id="stage0"><b>1</b><small>Read inputs</small></div><div class="metric" id="stage1"><b>2</b><small>Solve program</small></div><div class="metric" id="stage2"><b>3</b><small>Update output</small></div></div><div class="metric-row" style="margin-top:30px"><div class="metric"><b id="scanImage">0</b><small>Input image</small></div><div class="metric"><b id="scanLogic">0</b><small>Logic result</small></div><div class="metric"><b id="scanOutput">0</b><small>Physical output</small></div></div></div></div>`;
    if(type==="ladder") return `<div class="empty-state" style="padding:30px"><h2>Build it for real.</h2><p>The full Ladder Logic Playground lets you create rungs, toggle inputs and simulate outputs.</p><button class="solid-btn" onclick="go('tool/ladder')">Open Ladder Playground →</button></div>`;
    if(type==="sensor") return `
      <div class="lab-grid"><div class="control-panel"><h3 style="margin-top:0">Move the target.</h3><p style="font-size:12px;color:var(--muted);line-height:1.5">Bring the object into the sensor's detection zone and watch the PLC-style input state change.</p><div class="range-row"><div class="range-head"><span>Target position</span><b id="sensorPosLabel">64%</b></div><input id="sensorPos" type="range" min="20" max="80" value="64"></div><div class="metric"><b id="sensorState">OFF</b><small>Sensor output</small></div></div><div class="visual-panel"><div class="sensor-stage"><div class="sensor-head"></div><div class="sensor-beam"></div><div class="sensor-object" id="sensorObject"></div></div></div></div>`;
    if(type==="wave") return `
      <div class="lab-grid"><div class="control-panel"><div class="range-row"><div class="range-head"><span>Frequency</span><b id="waveHzLabel">60 Hz</b></div><input id="waveHz" type="range" min="1" max="60" value="60"></div><button class="push" id="phaseBtn">Show 3-phase</button><div class="metric-row"><div class="metric"><b id="wavePeriod">16.7 ms</b><small>Period</small></div><div class="metric"><b id="waveMode">1ϕ</b><small>View</small></div><div class="metric"><b>AC</b><small>Type</small></div></div></div><div class="visual-panel"><div class="wave-box"><svg id="waveSvg" viewBox="0 0 600 220"></svg></div></div></div>`;
    if(type==="transformer") return `
      <div class="lab-grid"><div class="control-panel"><div class="range-row"><div class="range-head"><span>Primary voltage</span><b id="txVinLabel">480 V</b></div><input id="txVin" type="range" min="120" max="600" step="10" value="480"></div><div class="range-row"><div class="range-head"><span>Turns ratio Np:Ns</span><b id="txRatioLabel">4.0 : 1</b></div><input id="txRatio" type="range" min="1" max="10" step=".5" value="4"></div><div class="metric-row"><div class="metric"><b id="txOut">120 V</b><small>Secondary</small></div><div class="metric"><b id="txRatioM">4.0:1</b><small>Ratio</small></div><div class="metric"><b>AC</b><small>Required</small></div></div></div><div class="visual-panel"><div style="height:220px;display:grid;place-items:center;font-family:var(--mono);color:var(--muted)"><div><span style="font-size:42px;color:#798c80">))))</span><span style="font-size:28px;color:var(--lime);padding:0 28px">║║</span><span style="font-size:42px;color:#798c80">((</span><div style="text-align:center;margin-top:18px">MAGNETIC FLUX TRANSFERS ENERGY</div></div></div></div></div>`;
    if(type==="meter" || type==="troubleshoot") return `<div class="empty-state" style="padding:30px"><h2>Don't guess. Prove.</h2><p>Use the full motor troubleshooting lab to choose test points, read the virtual meter and isolate the fault.</p><button class="solid-btn" onclick="go('tool/troubleshoot')">Open Troubleshoot Mode →</button></div>`;
    return "";
  }

  function initLesson(c){
    const type = c.lesson;
    if(type==="voltage" || type==="ohms") initOhms();
    if(type==="series") initSeries();
    if(type==="relay") initRelay();
    if(type==="motor") initMotor();
    if(type==="starter") initStarter();
    if(type==="scan") initScan();
    if(type==="sensor") initSensor();
    if(type==="wave") initWave();
    if(type==="transformer") initTransformer();
  }

  function initOhms(){
    const v=document.getElementById("labVolt"), r=document.getElementById("labRes");
    if(!v||!r)return;
    const update=()=>{
      const V=+v.value,R=+r.value,I=V/R,P=V*I;
      id("labVoltLabel").textContent=V+" V"; id("labResLabel").textContent=R+" Ω";
      id("labI").textContent=I.toFixed(2)+" A"; id("labP").textContent=P.toFixed(0)+" W";
      const failed=P>120; id("labState").textContent=failed?"FAILED":V?"ON":"OFF";
      const b=id("labBulb"); b.style.background=failed?"rgba(255,118,111,.22)":`rgba(215,255,100,${Math.min(.55,P/180)})`;
      b.style.boxShadow=failed?"0 0 30px rgba(255,118,111,.23)":`0 0 ${Math.min(70,P/2)}px rgba(215,255,100,.24)`;
      id("labWire").classList.toggle("on",V>0&&!failed);
      id("labFail").innerHTML=failed?`<div class="fail-banner">Too much power is being dissipated in this simplified load. In the real world that usually becomes heat, damage, protection opening — or all three.</div>`:"";
    };
    v.oninput=r.oninput=update; update();
  }

  function initSeries(){
    let mode="series";
    const v=id("seriesVolt");
    const update=()=>{
      const V=+v.value,R=12;
      let totalI, eachV, eachP;
      if(mode==="series"){totalI=V/(R*2);eachV=V/2;eachP=eachV*totalI}
      else{totalI=V/R*2;eachV=V;eachP=V*(V/R)}
      id("seriesVoltLabel").textContent=V+" V";id("seriesModeLabel").textContent=mode.toUpperCase();
      id("seriesI").textContent=totalI.toFixed(2)+" A";id("seriesEach").textContent=eachV.toFixed(0)+" V";id("seriesP").textContent=eachP.toFixed(0)+" W";
      ["bulbA","bulbB"].forEach(x=>{const e=id(x);e.style.background=`rgba(215,255,100,${Math.min(.55,eachP/70)})`;e.style.boxShadow=`0 0 ${Math.min(60,eachP)}px rgba(215,255,100,.23)`});
    };
    v.oninput=update;id("seriesMode").onclick=()=>{mode=mode==="series"?"parallel":"series";id("seriesMode").textContent=mode==="series"?"Switch to parallel":"Switch to series";update()};update();
  }

  function initRelay(){
    let on=false; const btn=id("relayBtn"); if(!btn)return;
    btn.onclick=()=>{on=!on;btn.classList.toggle("on",on);btn.textContent=on?"DE-ENERGIZE COIL":"ENERGIZE COIL";id("relayCoil").classList.toggle("on",on);id("relayContact").classList.toggle("on",on);id("relayLamp").classList.toggle("on",on);id("relayCoilM").textContent=on?"ON":"OFF";id("relayContactM").textContent=on?"CLOSED":"OPEN";id("relayLoadM").textContent=on?"ON":"OFF"};
  }

  function initMotor(){
    const hz=id("motorHz"), load=id("motorLoad"); if(!hz||!load)return;
    const update=()=>{
      const H=+hz.value,L=+load.value,rpm=H*30,amps=(H?2.5:0)+(L/20);
      id("motorHzLabel").textContent=H+" Hz";id("motorLoadLabel").textContent=L+"%";id("motorRpm").textContent=rpm.toFixed(0);id("motorAmp").textContent=amps.toFixed(1)+" A";
      const bad=L>100&&H>0;id("motorCondition").textContent=bad?"OVERLOAD":H?"NORMAL":"STOPPED";
      const rotor=id("motorRotor");rotor.classList.toggle("spin",H>0);rotor.style.animationDuration=H?Math.max(.25,2.2-H/34)+"s":"0s";
    };hz.oninput=load.oninput=update;update();
  }

  function initStarter(){
    let coil=false,ol=false;
    const update=()=>{id("starterCoil").textContent=coil?"ON":"OFF";id("starterAux").textContent=coil?"CLOSED":"OPEN";id("starterMotor").textContent=coil?"RUNNING":"STOPPED";id("starterRotor").classList.toggle("spin",coil);id("starterLine").classList.toggle("on",coil);id("olBtn").classList.toggle("on",ol)};
    id("startBtn").onclick=()=>{if(!ol)coil=true;update()};
    id("stopBtn").onclick=()=>{coil=false;update()};
    id("olBtn").onclick=()=>{ol=!ol;if(ol)coil=false;id("olBtn").textContent=ol?"RESET OVERLOAD":"TRIP OVERLOAD";update()};
    update();
  }

  function initScan(){
    let field=false,stage=0,image=false,logic=false,output=false,timer=null;
    const paint=()=>{[0,1,2].forEach(i=>{const e=id("stage"+i);e.style.borderColor=i===stage?"rgba(215,255,100,.45)":"var(--line)";e.style.background=i===stage?"rgba(215,255,100,.05)":"transparent"});id("scanImage").textContent=image?1:0;id("scanLogic").textContent=logic?1:0;id("scanOutput").textContent=output?1:0;id("scanInput").classList.toggle("on",field)};
    const step=()=>{if(stage===0)image=field;if(stage===1)logic=image;if(stage===2)output=logic;stage=(stage+1)%3;paint()};
    id("scanInput").onclick=()=>{field=!field;paint()};id("scanStep").onclick=step;
    id("scanAuto").onclick=()=>{if(timer){clearInterval(timer);timer=null;id("scanAuto").textContent="AUTO SCAN"}else{timer=setInterval(step,700);id("scanAuto").textContent="STOP AUTO"}};paint();
  }

  function initSensor(){
    const s=id("sensorPos"); if(!s)return; const update=()=>{const p=+s.value,on=p<48;id("sensorPosLabel").textContent=p+"%";id("sensorObject").style.left=p+"%";id("sensorState").textContent=on?"ON":"OFF";id("sensorState").style.color=on?"var(--lime)":"var(--text)";id("sensorObject").style.borderColor=on?"var(--lime)":"#496054"};s.oninput=update;update();
  }

  function initWave(){
    const hz=id("waveHz"); let three=false;
    const draw=()=>{const H=+hz.value;id("waveHzLabel").textContent=H+" Hz";id("wavePeriod").textContent=(1000/H).toFixed(1)+" ms";id("waveMode").textContent=three?"3ϕ":"1ϕ";const svg=id("waveSvg");let paths=[];const phases=three?[0,2*Math.PI/3,4*Math.PI/3]:[0];phases.forEach((phase,idx)=>{let d="";for(let x=0;x<=600;x+=4){const y=110-Math.sin((x/600)*Math.PI*2*(1+H/20)+phase)*60;d+=(x===0?"M":"L")+x+" "+y+" "}paths.push(`<path d="${d}" stroke="${idx===0?"#d7ff64":idx===1?"#66e8dc":"#ffb76b"}" fill="none" stroke-width="2"/>`)});svg.innerHTML=`<line x1="0" y1="110" x2="600" y2="110" stroke="#33463b"/>${paths.join("")}`};
    hz.oninput=draw;id("phaseBtn").onclick=()=>{three=!three;id("phaseBtn").textContent=three?"Show single-phase":"Show 3-phase";draw()};draw();
  }

  function initTransformer(){
    const vin=id("txVin"),ratio=id("txRatio");if(!vin||!ratio)return;const update=()=>{const V=+vin.value,R=+ratio.value,O=V/R;id("txVinLabel").textContent=V+" V";id("txRatioLabel").textContent=R.toFixed(1)+" : 1";id("txOut").textContent=O.toFixed(0)+" V";id("txRatioM").textContent=R.toFixed(1)+":1"};vin.oninput=ratio.oninput=update;update();
  }

  /* V15: labs rebuilt in js/core/labs-v15.js register themselves here and take
     precedence over the originals. Keeps the rebuilt labs in their own file
     instead of growing this one, and keeps deep links working either way. */
  window.TS = window.TS || {};
  window.TS.labs = window.TS.labs || {};
  window.TS.host = { shell, footer, toolIntro, labGuide, esc, id, go, state, D,
                     rerender: () => route(),
                     get WORLD_MEDIA(){ return WORLD_MEDIA }, get WORLD_COPY(){ return WORLD_COPY } };

  function renderTool(id){
    if(window.TS.labs[id]) return window.TS.labs[id]();
    if(id==="ladder") return renderLadder();
    if(id==="circuit") return renderCircuit();
    if(id==="troubleshoot") return renderTrouble();
    if(id==="hvac-cycle") return renderHVACCycle();
    if(id==="airflow") return renderAirflow();
    if(id==="hvac-controls") return renderHVACControls();
    if(id==="pressure-flow") return renderPressureFlow();
    if(id==="drain-vent") return renderDrainVent();
    if(id==="water-heater-lab") return renderWaterHeater();
    if(id==="shaft-alignment") return renderShaftAlignment();
    if(id==="hydraulic-lab") return renderHydraulicLab();
    if(id==="pneumatic-lab") return renderPneumaticLab();
    if(id==="bearing-lab") return renderBearingLab();
    if(id==="conveyor-lab") return renderConveyorLab();
    if(id==="weld-puddle") return renderWeldPuddle();
    if(id==="joint-lab") return renderJointLab();
    if(id==="defect-lab") return renderDefectLab();
    if(id==="blueprint-lab") return renderBlueprintLab();
    if(id==="framing-lab") return renderFramingLab();
    if(id==="loadpath-lab") return renderLoadPathLab();
    if(id==="envelope-lab") return renderEnvelopeLab();
    return renderWorld("electrical","labs");
  }

  function toolIntro(title,desc,world="electrical"){
    const w=D.worlds.find(x=>x.id===world); const m=WORLD_MEDIA[world];
    return `<section class="tool-page tool-page-v7"><div class="breadcrumb"><span onclick="go('')">TradeSchool</span><b>›</b><span onclick="go('world/${world}/labs')">${esc(w?.name||world)} practice</span><b>›</b><span>${title}</span></div><div class="tool-head-v7"><div><div class="eyebrow">PRACTICE LAB · ${esc(WORLD_COPY[world]?.tag||'SYSTEM')}</div><h1>${title}</h1><p>${desc}</p></div><figure><img src="${m?.image||''}" alt="${esc(m?.label||w?.name||'Trade reference')}"><figcaption>Real equipment reference · ${esc(m?.label||'')}</figcaption></figure></div><button class="tool-back ghost-btn" onclick="go('world/${world}/labs')">← Practice labs</button>`;
  }

  function labGuide(type){
    const guides={
      ladder:{title:"Why a motor keeps running after you let go",purpose:"Three-wire control is the first circuit in almost every motor panel. Build it, then break it, and watch which contact is responsible for what.",steps:["Hold START and watch the coil pick up.","Release START. The seal-in contact should keep it running.","Press STOP and confirm it drops out no matter what else is true.","Remove the seal-in contact and try again. Now it only runs while you hold the button."],watch:"Highlighted means the path is closed. That is logic, not proof of field voltage: a rung can be true while the motor is still dead downstream."},
      circuit:{title:"Make Ohm's law visible",purpose:"Learn how voltage, resistance, topology, current and power depend on each other.",steps:["Start with the circuit closed and note current.","Increase resistance and predict what current will do.","Switch between series and parallel and compare equivalent resistance.","Open the circuit and notice that source voltage can still exist while current falls to zero."],watch:"Change one thing at a time. Predict first, then use the live values to check your mental model."},
      trouble:{title:"Troubleshoot by dividing the problem",purpose:"Learn how a technician uses strategic voltage measurements to find the first point where expected control power disappears.",steps:["Confirm the source is healthy.","Move through the control chain in logical order.","Find the last point with expected voltage and the first point without it.","Choose a diagnosis only after the readings support it."],watch:"The best measurement is not the fanciest one — it is the one that eliminates the most possible causes."},
      "hvac-cycle":{title:"Follow heat around one complete loop",purpose:"Learn what each refrigeration component changes instead of memorizing four component names.",steps:["Start at the evaporator and follow low-pressure vapor toward the compressor.","Raise outdoor temperature and watch the high side respond.","Reduce indoor airflow and watch the air-side result change too.","Turn the cooling call off and notice that circulation stops even though components still exist."],watch:"The compressor creates the pressure difference; the evaporator absorbs heat; the condenser rejects it; the metering device creates the low-pressure condition."},
      airflow:{title:"Treat the duct system as part of the machine",purpose:"See why blower speed alone cannot guarantee airflow when filters, ducts or dampers create excessive resistance.",steps:["Begin with a clean filter and open damper.","Increase filter loading while holding blower command steady.","Close the supply damper and watch static pressure climb as delivery falls.","Increase blower command and notice that more effort does not remove the restriction."],watch:"High static pressure plus low delivered CFM points toward a resistance problem — not automatically a bad blower."},
      "hvac-controls":{title:"Follow the cooling request from thermostat to equipment",purpose:"Learn the difference between a thermostat asking for cooling and the equipment actually being permitted to run.",steps:["Set room temperature above the cooling setpoint.","Follow the active Y request through the sequence.","Open the safety chain and watch the request get blocked downstream.","Restore the safety and lower room temperature below the call threshold."],watch:"A thermostat call is only one condition. Power, safeties, relays/contactors and field hardware must all agree before the compressor runs."},
      "pressure-flow":{title:"Separate pressure from flow",purpose:"Learn why good static pressure does not guarantee good fixture performance when the piping or a valve is restrictive.",steps:["Start at 60 psi with the valve mostly open.","Reduce pipe diameter without changing source pressure.","Close the valve gradually and watch pressure drop/flow behavior diverge.","Re-open the path and compare how diameter changes velocity at similar demand."],watch:"Pressure is available energy. Flow is the result after the entire path spends some of that energy overcoming resistance."},
      "drain-vent":{title:"Watch water and air move together",purpose:"See exactly why a fixture trap needs a protected air path while the drainage system carries water away.",steps:["Drain the fixture once with the vent open.","Watch air move through the vent while water moves through the drain.","Refill the fixture, block the vent, then drain again.","Compare the remaining trap seal after both runs."],watch:"The trap is supposed to keep water after the fixture drains. A pressure imbalance can siphon that seal away even when the drain itself appears to work."},
      "water-heater-lab":{title:"Understand the tank as stored heat, not just hot water",purpose:"See how cold inlet water, stratification, heating input, demand and thermal expansion interact.",steps:["Begin with no draw and note the hot layer at the top.","Increase hot-water demand and watch cold water enter low in the tank.","Leave heat enabled and watch recovery behavior.","Raise the setpoint and notice the expansion indicator increase."],watch:"Usable hot-water capacity depends on stored temperature, stratification, incoming cold water and recovery rate — not tank gallons alone."}
,
      "shaft-alignment":{title:"Make misalignment visible before it becomes damage",purpose:"Learn the difference between offset and angular misalignment and why couplings cannot simply absorb unlimited alignment error.",steps:["Begin with both machines aligned and note the low stress/vibration state.","Introduce horizontal or vertical offset and watch coupling stress rise.","Add angular error and compare the different shaft-centerline relationship.","Return toward alignment and connect the visual result to dial/laser measurement thinking."],watch:"Alignment is about two shaft centerlines at the coupling. Measure, correct soft foot/base issues, move the machine deliberately, and re-measure."},
      "hydraulic-lab":{title:"Separate hydraulic pressure, flow, force and speed",purpose:"Understand what the pump supplies, what the load demands, and why pressure and flow answer different questions.",steps:["Open the valve with a light load and watch the cylinder move.","Increase flow and observe speed before changing the load.","Increase the load and watch required pressure rise.","Push the system toward the relief setting and identify where excess energy goes."],watch:"Flow mainly controls actuator speed. Load resistance creates the pressure required to move. Pressure alone does not tell you how fast oil is moving."},
      "pneumatic-lab":{title:"Follow compressed air from supply to exhaust",purpose:"See how pressure, flow restriction, valve state and exhaust path determine cylinder force and speed.",steps:["Start with normal regulated pressure and command extension.","Restrict flow and compare cylinder speed without changing pressure.","Reduce pressure and compare available force.","Reverse the valve and follow supply/exhaust paths through the opposite side of the cylinder."],watch:"Pneumatic actuators need both a supply path and an exhaust path. A restricted exhaust can slow motion just as effectively as a restricted supply."},
      "bearing-lab":{title:"Turn bearing condition into evidence",purpose:"Connect lubrication, alignment and load problems to the temperature/vibration clues a maintainer can actually trend.",steps:["Start from the healthy baseline.","Reduce lubrication and watch friction-related condition values change.","Introduce misalignment and compare the vibration response.","Increase load and decide whether the bearing is the cause or simply receiving a bad condition from the machine."],watch:"A failed bearing is often the victim. Always ask what load, alignment, fit, contamination or lubrication condition damaged it."},
      "conveyor-lab":{title:"See the conveyor as one connected drive system",purpose:"Understand how drive speed, belt tension, load, tracking and slip interact instead of treating the belt as an isolated component.",steps:["Run the conveyor with moderate load and normal tension.","Increase load while watching required drive effort.","Reduce tension until slip appears.","Restore tension and compare throughput, tracking and bearing/drive stress."],watch:"More tension is not automatically better. The goal is enough traction and control without creating unnecessary pulley, bearing and belt stress."},
      "weld-puddle":{title:"Read parameter direction before touching a procedure",purpose:"Current drives penetration, arc voltage drives width, and travel speed divides both. Heat input is computed from the real equation, so the number moves with you.",steps:["Start at the baseline and note the relative heat, width and penetration indicators.","Raise current while holding travel speed steady and compare the section response.","Increase travel speed and watch relative heat input fall.","Compare two settings that give the same kJ/in and notice the bead is not the same."],watch:"This is a concept model, not a weld-quality predictor. Real results depend on process, polarity, electrode or wire, shielding, joint design, base metal, position and the qualified procedure."},
      "joint-lab":{title:"Make joint geometry part of the welding process",purpose:"See why bevel, root opening, fit-up and heat input determine whether the arc can create fusion through the intended joint.",steps:["Start with a reasonable root gap and bevel.","Reduce the gap and observe root access.","Increase heat/travel balance and watch the penetration zone change.","Compare a good cross-section with incomplete penetration or fusion."],watch:"A machine setting cannot compensate for every fit-up problem. Joint preparation determines where the arc and molten metal can physically reach."},
      "defect-lab":{title:"Work backward from a defect to its mechanism",purpose:"Learn to identify what a visible discontinuity is telling you and build a short list of plausible process causes.",steps:["Create one defect at a time.","Study where it appears in the bead or cross-section.","Read the live cause clues and identify which variables could physically create it.","Correct one variable and compare the resulting weld."],watch:"A defect name is not a diagnosis. Porosity, undercut and lack of fusion each have several possible causes that must be separated by evidence."},
      "blueprint-lab":{title:"Turn a drawing into a field location",purpose:"Practice reading scale, dimensions and reference information without treating the picture itself as the measurement.",steps:["Identify the controlling dimension and reference line.","Change drawing scale and notice that printed distance changes while the stated dimension does not.","Apply a field offset from the known reference.","Use the measurement overlay to verify where the opening should actually land."],watch:"Use written dimensions and project control points. Scaling a drawing is a fallback, not a substitute for controlling dimensions."},
      "framing-lab":{title:"Build around an opening without breaking the load path",purpose:"See how headers and supporting studs redirect load around doors/windows in a simplified framed wall.",steps:["Start with a small opening and supporting header/studs present.","Increase opening width and load above.","Remove the support and watch load-path continuity disappear.","Restore support and connect the visual assembly to king/jack/cripple/header terminology."],watch:"The opening is not just empty space. The framing around it has to collect loads above and deliver them to support below."},
      "loadpath-lab":{title:"Continuity is the whole point",purpose:"Loads do not magically reach the ground. They only reach the ground if every member and every connection along the path is present and capable. The lab forces you to break that chain and see the failure location.",steps:["Apply a moderate gravity load and confirm the path is continuous.","Trace the force from the loaded surface into the primary beam.","Follow the reactions through each support into the foundation.","Remove one beam or one support and name the exact transfer point that is now missing — that is the failure location under the remaining load."],watch:"A missing jack stud, an undersized header, a discontinuous beam, or a support that does not reach the foundation all produce the same class of failure: the load has nowhere continuous to go."},
      "envelope-lab":{title:"Make water management visible",purpose:"See how cladding, flashing and the drainage plane work together to redirect wind-driven rain back outside.",steps:["Run moderate rain with flashing and WRB continuity intact.","Increase wind pressure and watch the assembly remain drained.","Break the head-flashing detail and observe the new water path.","Break drainage-plane continuity and compare how quickly water reaches the interior."],watch:"Assume some water gets behind the cladding. Durable envelope design gives that water a continuous path back out instead of relying on a perfect exterior surface."}
    }[type];
    return `<section class="lab-guide"><div class="lab-guide-title"><div class="eyebrow">Guided mode</div><h2>${guideSafe(guides?.title)}</h2><p>${guideSafe(guides?.purpose)}</p></div><div class="lab-guide-steps">${(guides?.steps||[]).map((x,i)=>`<div><span>${i+1}</span><p>${guideSafe(x)}</p></div>`).join('')}</div><div class="lab-watch"><b>WHAT TO WATCH</b><p>${guideSafe(guides?.watch)}</p></div></section>`;
  }
  function guideSafe(x){ return esc(x||''); }

  function renderLadder(){
    shell(`${toolIntro("Ladder Logic Playground","Build real cause-and-effect logic, toggle simulated inputs and watch continuity propagate through the rung.")}
      ${labGuide('ladder')}
      <div class="workspace">
        <div class="workspace-bar"><span>PROJECT · CONVEYOR_DEMO</span><span id="ladderStatus">SIMULATION READY</span></div>
        <div class="workspace-body">
          <div class="ladder-grid">
            <aside class="palette premium-palette">
              <h3>1 · CHOOSE A TAG</h3>
              <div class="tag-picker" id="ladderTagPicker">${["START","STOP","SENSOR","FAULT"].map((t,i)=>`<button class="${i===2?'active':''}" data-ltag="${t}" onclick="selectLadderTag('${t}')">${t}</button>`).join('')}</div>
              <h3 style="margin-top:18px">2 · ADD AN INSTRUCTION</h3>
              <div class="palette-item" onclick="addInstruction('xic')"><span>Examine ON</span><code>—| |—</code></div>
              <div class="palette-item" onclick="addInstruction('xio')"><span>Examine OFF</span><code>—|/|—</code></div>
              <div class="palette-item" onclick="addInstruction('ote')"><span>Output coil</span><code>—( )—</code></div>
              <div class="palette-item" onclick="addInstruction('ton')"><span>Timer ON</span><code>TON</code></div>
              <h3 style="margin-top:20px">RUNG</h3>
              <button class="ghost-btn" style="width:100%" onclick="addRung()">+ Add rung</button>
              <button class="danger-btn" style="width:100%;margin-top:7px" onclick="resetLadder()">Reset demo</button>
              <p style="font-size:10px;color:var(--muted);line-height:1.5;margin-top:18px">Click an instruction to add it to the last rung. Click an instruction on the canvas to remove it.</p>
            </aside>
            <section class="ladder-canvas"><div class="rails"></div><div id="rungs"></div></section>
            <aside class="io-panel">
              <h3>SIMULATED INPUTS</h3>
              ${Object.keys(state.ladder.inputs).map(k=>`<div class="io-row"><span>${k}</span><div class="toggle ${state.ladder.inputs[k]?"on":""}" data-input="${k}" onclick="toggleInput('${k}')"></div></div>`).join("")}
              <h3 style="margin-top:20px">OUTPUTS</h3>
              <div class="io-row"><span>MOTOR</span><b id="outMotor" style="font-family:var(--mono)">OFF</b></div>
              <div class="ladder-physical"><div class="physical-kicker">FIELD HARDWARE</div><div class="physical-chain"><div class="mini-contactor" id="physicalContactor"><span>COIL</span><i></i></div><div class="physical-arrow">→</div><div class="mini-motor" id="physicalMotor"><span>M1</span><i></i></div></div><p>The rung does not spin a motor directly. It commands an output, which energizes real hardware.</p></div>
              <h3 style="margin-top:20px">LIVE EXPLANATION</h3>
              <div class="lab-live-explain" id="ladderExplain">Toggle an input and watch the explanation follow the logic.</div>
              <h3 style="margin-top:20px">HOW TO READ IT</h3>
              <p style="font-size:10px;color:var(--muted);line-height:1.6">Green = logical continuity. XIC asks “is this tag ON?” XIO asks “is this tag OFF?” The output coil executes only when every required condition in the path is true.</p>
            </aside>
          </div>
        </div>
      </div>${footer()}`);
    drawLadder();
  }

  window.__ladderSelectedTag="SENSOR";
  window.selectLadderTag = tag => { window.__ladderSelectedTag=tag; document.querySelectorAll('[data-ltag]').forEach(b=>b.classList.toggle('active',b.dataset.ltag===tag)); };
  window.addInstruction = type => {
    const rung=state.ladder.rungs[state.ladder.rungs.length-1]; if(!rung)return;
    const tag = type==="ote"?"MOTOR":type==="ton"?"T1":window.__ladderSelectedTag;
    rung.items.push({type,tag:String(tag).toUpperCase(),acc:0});
    drawLadder();
  };
  window.addRung = () => {state.ladder.rungs.push({id:Date.now(),items:[]});drawLadder()};
  window.resetLadder = () => {state.ladder={inputs:{START:false,STOP:true,SENSOR:false,FAULT:false},rungs:[{id:1,items:[{type:"xic",tag:"START"},{type:"xio",tag:"FAULT"},{type:"ote",tag:"MOTOR"}]}],outputs:{MOTOR:false}};renderLadder()};
  window.removeInst = (ri,ii) => {state.ladder.rungs[ri].items.splice(ii,1);drawLadder()};
  window.toggleInput = tag => {state.ladder.inputs[tag]=!state.ladder.inputs[tag];document.querySelector(`[data-input="${tag}"]`)?.classList.toggle("on",state.ladder.inputs[tag]);drawLadder()};

  function rungEval(r){
    let live=true;
    for(const it of r.items){
      if(it.type==="xic") live=live && !!state.ladder.inputs[it.tag];
      if(it.type==="xio") live=live && !state.ladder.inputs[it.tag];
      if(it.type==="ton"){ if(live) it.acc=(it.acc||0)+1; else it.acc=0; live=live && it.acc>=2; }
      if(it.type==="ote") state.ladder.outputs[it.tag]=live;
    }
    return live;
  }

  function drawLadder(){
    const host=id("rungs");if(!host)return;
    state.ladder.outputs.MOTOR=false;
    const rungs=state.ladder.rungs.map((r,ri)=>{
      const live=rungEval(r);
      return `<div class="rung ${live?"live":""}">${r.items.map((it,ii)=>{
        const symbol=it.type==="xic"?"| |":it.type==="xio"?"|/|":it.type==="ote"?"( )":"TON";
        let truth=true;if(it.type==="xic")truth=!!state.ladder.inputs[it.tag];if(it.type==="xio")truth=!state.ladder.inputs[it.tag];if(it.type==="ote")truth=live;if(it.type==="ton")truth=(it.acc||0)>=2&&live;
        return `<div class="instruction ${truth?"live":""} ${it.type==="ote"?"coil-inst":""}" onclick="removeInst(${ri},${ii})"><div><small>${it.type.toUpperCase()}</small><br><b>${symbol} ${esc(it.tag)}</b></div></div>`;
      }).join("")}</div>`;
    }).join("");
    host.innerHTML=rungs;
    const out=id("outMotor");if(out){out.textContent=state.ladder.outputs.MOTOR?"ON":"OFF";out.style.color=state.ladder.outputs.MOTOR?"var(--lime)":"var(--text)"}
    id("physicalContactor")?.classList.toggle("on",state.ladder.outputs.MOTOR); id("physicalMotor")?.classList.toggle("on",state.ladder.outputs.MOTOR);
    id("ladderStatus").textContent=state.ladder.outputs.MOTOR?"MOTOR OUTPUT ENERGIZED":"SIMULATION RUNNING";
    const explain=id("ladderExplain"); if(explain){
      const first=state.ladder.rungs[0]; const states=(first?.items||[]).filter(x=>x.type==='xic'||x.type==='xio').map(it=>`${it.tag} is ${state.ladder.inputs[it.tag]?'ON':'OFF'} → ${it.type==='xic'?(state.ladder.inputs[it.tag]?'passes':'blocks'):(!state.ladder.inputs[it.tag]?'passes':'blocks')}`);
      explain.innerHTML=`<b>${state.ladder.outputs.MOTOR?'Rung true — MOTOR executes.':'Rung false — MOTOR stays off.'}</b><span>${states.join(' · ')||'Add conditions to begin.'}</span>`;
    }
  }

  function renderCircuit(){
    shell(`${toolIntro("Circuit Playground","A guided DC trainer for seeing voltage, current, resistance, equivalent resistance and power react in real time.")}
      ${labGuide('circuit')}
      <div class="workspace"><div class="workspace-bar"><span>DC TRAINER · SIM-01</span><span>LIVE VALUES</span></div><div class="workspace-body">
        <div class="circuit-play">
          <aside class="circuit-controls">
            <div class="range-row"><div class="range-head"><span>Source voltage</span><b id="cpVLabel">${state.circuit.voltage} V</b></div><input id="cpV" type="range" min="0" max="48" value="${state.circuit.voltage}"></div>
            <div class="range-row"><div class="range-head"><span>R1</span><b id="cpR1Label">${state.circuit.r1} Ω</b></div><input id="cpR1" type="range" min="2" max="50" value="${state.circuit.r1}"></div>
            <div class="range-row"><div class="range-head"><span>R2</span><b id="cpR2Label">${state.circuit.r2} Ω</b></div><input id="cpR2" type="range" min="2" max="50" value="${state.circuit.r2}"></div>
            <button class="push" id="cpMode">${state.circuit.mode==="series"?"SERIES → switch to parallel":"PARALLEL → switch to series"}</button>
            <button class="push ${state.circuit.closed?"on":""}" id="cpSwitch" style="margin-top:8px">${state.circuit.closed?"CIRCUIT CLOSED":"CIRCUIT OPEN"}</button>
            <div class="metric-row"><div class="metric"><b id="cpI">0 A</b><small>Total current</small></div><div class="metric"><b id="cpP">0 W</b><small>Total power</small></div><div class="metric"><b id="cpReq">0 Ω</b><small>Equivalent R</small></div></div>
          </aside>
          <section><div class="circuit-stage" id="circuitStage"></div><div class="lab-live-explain big" id="cpExplain"></div></section>
        </div>
      </div></div>${footer()}`);
    initCircuitPlay();
  }

  function initCircuitPlay(){
    const update=()=>{
      state.circuit.voltage=+id("cpV").value;state.circuit.r1=+id("cpR1").value;state.circuit.r2=+id("cpR2").value;
      id("cpVLabel").textContent=state.circuit.voltage+" V";id("cpR1Label").textContent=state.circuit.r1+" Ω";id("cpR2Label").textContent=state.circuit.r2+" Ω";
      const {voltage:V,r1,r2,mode,closed}=state.circuit;let req=mode==="series"?r1+r2:(r1*r2)/(r1+r2);let I=closed&&req?V/req:0;let P=V*I;
      id("cpI").textContent=I.toFixed(2)+" A";id("cpP").textContent=P.toFixed(1)+" W";id("cpReq").textContent=req.toFixed(1)+" Ω";
      const exp=id("cpExplain"); if(exp){
        const topology=mode==="series"?`Series adds resistance: ${r1}Ω + ${r2}Ω = ${req.toFixed(1)}Ω. The same ${I.toFixed(2)} A must pass through both loads.`:`Parallel creates two current paths. Both branches see the full ${V} V source, so equivalent resistance falls to ${req.toFixed(1)}Ω and source current rises.`;
        exp.innerHTML=`<b>${closed?'Circuit is complete.':'Circuit is open — current is zero.'}</b><span>${closed?topology:`The source can still have ${V} V of potential even though there is no complete path for current.`} Total power is ${P.toFixed(1)} W.</span>`;
      }
      const live=closed&&V>0?"live":"";const hot=live?"hot":"";
      const particleSeries=live?`<circle r="5" class="trainer-particle"><animateMotion dur="2.7s" repeatCount="indefinite" path="M135 252 H185 V94 H580 V252 H135"/></circle><circle r="4" class="trainer-particle p2"><animateMotion dur="2.7s" begin="-.9s" repeatCount="indefinite" path="M135 252 H185 V94 H580 V252 H135"/></circle>`:"";
      const particleParallel=live?`<circle r="5" class="trainer-particle"><animateMotion dur="2.5s" repeatCount="indefinite" path="M135 252 H185 V94 H580 V252 H135"/></circle><circle r="4" class="trainer-particle p2"><animateMotion dur="2.2s" repeatCount="indefinite" path="M185 94 V175 H500 V94"/></circle>`:"";
      id("circuitStage").innerHTML=mode==="series"?`
        <svg class="circuit-svg trainer-svg" viewBox="0 0 720 360">
          <defs><linearGradient id="bench" x1="0" x2="1"><stop offset="0" stop-color="#101d18"/><stop offset=".5" stop-color="#172820"/><stop offset="1" stop-color="#0e1915"/></linearGradient><filter id="meterGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <rect x="18" y="18" width="684" height="324" rx="28" class="trainer-board"/>
          <text x="42" y="48" class="trainer-title">TRADESCHOOL DC BENCH · SERIES CIRCUIT</text>
          <rect x="55" y="115" width="128" height="164" rx="18" class="trainer-module source-module"/><text x="119" y="143" text-anchor="middle" class="trainer-label">DC POWER SUPPLY</text><rect x="78" y="160" width="82" height="45" rx="7" class="trainer-screen"/><text x="119" y="189" text-anchor="middle" class="trainer-screen-text">${V.toFixed(0)}.0 V</text><circle cx="90" cy="235" r="8" class="jack red"/><circle cx="150" cy="235" r="8" class="jack black"/>
          <path class="trainer-wire ${live}" d="M150 235 H185 V94 H285"/>
          <g transform="translate(285 70)"><rect width="125" height="76" rx="14" class="trainer-module ${hot}"/><text x="62" y="21" text-anchor="middle" class="trainer-label">R1 LOAD</text><path d="M15 48 h15 l8 -13 14 26 14 -26 14 26 14 -26 8 13 h18" class="resistor-symbol ${live}"/><text x="62" y="69" text-anchor="middle" class="trainer-small">${r1} Ω</text></g>
          <path class="trainer-wire ${live}" d="M410 94 H455"/>
          <g transform="translate(455 70)"><rect width="125" height="76" rx="14" class="trainer-module ${hot}"/><text x="62" y="21" text-anchor="middle" class="trainer-label">R2 LOAD</text><path d="M15 48 h15 l8 -13 14 26 14 -26 14 26 14 -26 8 13 h18" class="resistor-symbol ${live}"/><text x="62" y="69" text-anchor="middle" class="trainer-small">${r2} Ω</text></g>
          <path class="trainer-wire ${live}" d="M580 94 V235 H150"/>
          <g transform="translate(265 190)"><rect width="116" height="83" rx="13" class="trainer-meter"/><text x="58" y="20" text-anchor="middle" class="trainer-label">AMMETER</text><rect x="20" y="31" width="76" height="32" rx="6" class="trainer-screen"/><text x="58" y="53" text-anchor="middle" class="trainer-screen-text">${I.toFixed(2)} A</text></g>
          <g transform="translate(414 190)"><rect width="116" height="83" rx="13" class="trainer-meter"/><text x="58" y="20" text-anchor="middle" class="trainer-label">TOTAL POWER</text><rect x="20" y="31" width="76" height="32" rx="6" class="trainer-screen"/><text x="58" y="53" text-anchor="middle" class="trainer-screen-text">${P.toFixed(1)} W</text></g>
          <g transform="translate(565 210)"><circle cx="35" cy="35" r="26" class="trainer-switch ${closed?'closed':''}"/><path d="M20 41 L${closed?50:45} ${closed?41:22}" class="switch-arm"/><text x="35" y="78" text-anchor="middle" class="trainer-small">${closed?'CLOSED':'OPEN'}</text></g>${particleSeries}
          <text x="42" y="320" class="trainer-caption">One path → same current through R1 and R2 · Equivalent resistance ${req.toFixed(1)} Ω</text>
        </svg>`:`
        <svg class="circuit-svg trainer-svg" viewBox="0 0 720 360">
          <rect x="18" y="18" width="684" height="324" rx="28" class="trainer-board"/>
          <text x="42" y="48" class="trainer-title">TRADESCHOOL DC BENCH · PARALLEL CIRCUIT</text>
          <rect x="55" y="115" width="128" height="164" rx="18" class="trainer-module source-module"/><text x="119" y="143" text-anchor="middle" class="trainer-label">DC POWER SUPPLY</text><rect x="78" y="160" width="82" height="45" rx="7" class="trainer-screen"/><text x="119" y="189" text-anchor="middle" class="trainer-screen-text">${V.toFixed(0)}.0 V</text><circle cx="90" cy="235" r="8" class="jack red"/><circle cx="150" cy="235" r="8" class="jack black"/>
          <path class="trainer-wire ${live}" d="M150 235 H185 V94 H580 V235 H150"/><path class="trainer-wire ${live}" d="M185 94 V175 H580 V94"/>
          <g transform="translate(300 70)"><rect width="130" height="76" rx="14" class="trainer-module ${hot}"/><text x="65" y="21" text-anchor="middle" class="trainer-label">R1 BRANCH</text><path d="M15 48 h15 l8 -13 14 26 14 -26 14 26 14 -26 8 13 h18" class="resistor-symbol ${live}"/><text x="65" y="69" text-anchor="middle" class="trainer-small">${r1} Ω · ${(closed?V/r1:0).toFixed(2)} A</text></g>
          <g transform="translate(300 151)"><rect width="130" height="76" rx="14" class="trainer-module ${hot}"/><text x="65" y="21" text-anchor="middle" class="trainer-label">R2 BRANCH</text><path d="M15 48 h15 l8 -13 14 26 14 -26 14 26 14 -26 8 13 h18" class="resistor-symbol ${live}"/><text x="65" y="69" text-anchor="middle" class="trainer-small">${r2} Ω · ${(closed?V/r2:0).toFixed(2)} A</text></g>
          <g transform="translate(458 236)"><rect width="132" height="58" rx="12" class="trainer-meter"/><text x="66" y="18" text-anchor="middle" class="trainer-label">SOURCE CURRENT</text><text x="66" y="43" text-anchor="middle" class="trainer-screen-text">${I.toFixed(2)} A</text></g>
          <g transform="translate(215 236)"><rect width="132" height="58" rx="12" class="trainer-meter"/><text x="66" y="18" text-anchor="middle" class="trainer-label">EQUIV. R</text><text x="66" y="43" text-anchor="middle" class="trainer-screen-text">${req.toFixed(1)} Ω</text></g>
          <g transform="translate(585 183)"><circle cx="35" cy="35" r="26" class="trainer-switch ${closed?'closed':''}"/><path d="M20 41 L${closed?50:45} ${closed?41:22}" class="switch-arm"/><text x="35" y="78" text-anchor="middle" class="trainer-small">${closed?'CLOSED':'OPEN'}</text></g>${particleParallel}
          <text x="42" y="320" class="trainer-caption">Two branches → same voltage across R1 and R2 · Branch currents add at the source</text>
        </svg>`;
    };
    id("cpV").oninput=id("cpR1").oninput=id("cpR2").oninput=update;
    id("cpMode").onclick=()=>{state.circuit.mode=state.circuit.mode==="series"?"parallel":"series";id("cpMode").textContent=state.circuit.mode==="series"?"SERIES → switch to parallel":"PARALLEL → switch to series";update()};
    id("cpSwitch").onclick=()=>{state.circuit.closed=!state.circuit.closed;id("cpSwitch").classList.toggle("on",state.circuit.closed);id("cpSwitch").textContent=state.circuit.closed?"CIRCUIT CLOSED":"CIRCUIT OPEN";update()};update();
  }

  function renderTrouble(){
    newTrouble(false);
    shell(`${toolIntro("Motor Troubleshoot Mode","A motor will not start. Use a virtual meter and a deliberate divide-and-prove strategy to isolate the failed part of the control chain.")}
      ${labGuide('trouble')}
      <div class="workspace"><div class="workspace-bar"><span>FAULT LAB · MOTOR M1</span><span id="faultState">FAULT ACTIVE</span></div><div class="workspace-body">
        <div class="trouble-layout">
          <section class="machine-schematic">
            <div class="eyebrow">Symptom</div><h2 style="font-size:34px;letter-spacing:-.05em;margin:10px 0">M1 will not start.</h2>
            <p style="color:var(--muted);font-size:12px">The control system is a simplified 24 VDC chain. Pick strategic test points on the right.</p>
            <div class="machine-chain" id="machineChain"></div>
          </section>
          <aside class="meter-panel">
            <h3 style="margin-top:0">VIRTUAL DMM</h3><div class="meter-screen" id="meterScreen">—</div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:10px">MEASURE VOLTAGE TO 0V COMMON</div>
            <button class="test-btn" onclick="measureFault('source')">TP1 · Power supply +24V</button>
            <button class="test-btn" onclick="measureFault('fuse')">TP2 · After control fuse</button>
            <button class="test-btn" onclick="measureFault('stop')">TP3 · After STOP chain</button>
            <button class="test-btn" onclick="measureFault('start')">TP4 · START output</button>
            <button class="test-btn" onclick="measureFault('coil')">TP5 · Contactor coil A1</button>
            <div class="lab-live-explain" id="troubleExplain"><b>Start at TP1.</b><span>Confirm the source before moving downstream.</span></div>
            <div style="font-size:10px;color:var(--muted);margin:16px 0 8px">DIAGNOSE</div>
            <div class="diagnosis-grid" id="diagnosisGrid"></div>
            <button class="ghost-btn" style="width:100%;margin-top:10px" onclick="newTrouble(true)">New random fault</button>
          </aside>
        </div>
      </div></div>${footer()}`);
    drawTrouble();
  }

  const faultDefs = {
    fuse:{label:"Open control fuse",cut:"fuse"},
    stop:{label:"Open STOP / interlock",cut:"stop"},
    start:{label:"Failed START contact",cut:"start"},
    coil:{label:"Open contactor coil",cut:"coil"}
  };

  function newTrouble(redraw=true){
    const keys=Object.keys(faultDefs);state.trouble.fault=keys[Math.floor(Math.random()*keys.length)];state.trouble.measured="—";state.trouble.result=null;state.trouble.readings={};if(redraw)drawTrouble();
  }
  window.newTrouble=newTrouble;

  window.measureFault = point => {
    const order=["source","fuse","stop","start","coil"];const cut=faultDefs[state.trouble.fault].cut;
    let volts=24;
    if(cut==="fuse" && order.indexOf(point)>=1)volts=0;
    if(cut==="stop" && order.indexOf(point)>=2)volts=0;
    if(cut==="start" && order.indexOf(point)>=3)volts=0;
    if(cut==="coil" && point==="coil")volts=24; // voltage reaches coil but coil is open
    state.trouble.readings=state.trouble.readings||{}; state.trouble.readings[point]=volts;
    state.trouble.measured=volts+"."+Math.floor(Math.random()*3)+" V";id("meterScreen").textContent=state.trouble.measured;
    const e=id("troubleExplain"); if(e){ const names={source:"TP1 source",fuse:"TP2 after fuse",stop:"TP3 after STOP chain",start:"TP4 START output",coil:"TP5 coil A1"}; e.innerHTML=`<b>${names[point]} = ${state.trouble.measured}</b><span>${volts>20?'Expected control voltage is still present here. Move downstream to find where it disappears.':'Control voltage is missing at this point. Compare with the previous test point — the fault lies at or upstream of this transition.'}</span>`; }
  };

  window.diagnoseFault = key => {
    state.trouble.result=key;drawTrouble(); const good=key===state.trouble.fault; const e=id("troubleExplain"); if(e)e.innerHTML=good?`<b>Fault proven: ${faultDefs[key].label}.</b><span>Your measurements narrowed the chain to the correct failure. Reset and try another fault to build the pattern-recognition skill.</span>`:`<b>That diagnosis does not fit all the evidence.</b><span>Go back to the voltage path. Find the last test point with expected voltage and the first point where it disappears.</span>`; if(good)toast("Fault proven. Nice troubleshooting.");else toast("That doesn't fit all the evidence yet.");
  };

  function drawTrouble(){
    const chain=id("machineChain");if(!chain)return;const nodes=[["source","24V SUPPLY"],["fuse","FUSE F1"],["stop","STOP / PERMISSIVE"],["start","START PB"],["coil","M CONTACTOR COIL"]];
    const fault=state.trouble.fault; const readings=state.trouble.readings||{}; chain.innerHTML=nodes.map(([k,l])=>{const measured=Object.prototype.hasOwnProperty.call(readings,k); const rv=readings[k]; const cls=state.trouble.result===fault&&k===fault?"bad":measured?(rv>20?"measured-good":"measured-bad"):""; return `<div class="chain-node ${cls}"><div class="chain-symbol chain-${k}" aria-hidden="true"></div><b>${l}</b><small>${k==="source"?"SOURCE":"CONTROL PATH"}</small>${measured?`<em>${rv.toFixed(1)} V measured</em>`:""}</div>`}).join("");
    id("meterScreen").textContent=state.trouble.measured;
    id("diagnosisGrid").innerHTML=Object.entries(faultDefs).map(([k,v])=>`<button class="diagnosis-btn ${state.trouble.result===k?(k===fault?"correct":"wrong"):""}" onclick="diagnoseFault('${k}')">${v.label}</button>`).join("");
    if(state.trouble.result===fault)id("faultState").textContent="FAULT FOUND · "+faultDefs[fault].label.toUpperCase();else id("faultState").textContent="FAULT ACTIVE";
  }


  function quickJumps(world){
    const map={electrical:[["ladder","Ladder Playground"],["troubleshoot","Troubleshoot Mode"]],hvac:[["hvac-cycle","Refrigeration Cycle"],["airflow","Airflow Lab"]],plumbing:[["pressure-flow","Pressure + Flow"],["drain-vent","Drain + Vent"]],industrial:[],welding:[["weld-puddle","Parameter Window"],["defect-lab","Defect Lab"]],construction:[["loadpath-lab","Load Path"],["framing-lab","Framing Builder"]]};
    return (map[world]||[]).map(([id,label],i)=>`<button class="ghost-btn" style="width:100%;${i?'':'margin-bottom:7px'}" onclick="go('tool/${id}')">${label}</button>`).join("");
  }

  window.showWorlds = () => { if(location.hash){location.hash="";setTimeout(()=>document.getElementById("worldsSection")?.scrollIntoView({behavior:"smooth"}),80)} else document.getElementById("worldsSection")?.scrollIntoView({behavior:"smooth"}); };

  let particleAnimation;
  function initParticles(){
    const canvas=id("particleCanvas"); if(!canvas)return; cancelAnimationFrame(particleAnimation);
    const ctx=canvas.getContext("2d"); let w=0,h=0,particles=[]; const mobile=innerWidth<720; const count=mobile?95:190;
    const resize=()=>{w=canvas.width=innerWidth*devicePixelRatio;h=canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";particles=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:(.45+Math.random()*1.25)*devicePixelRatio,vx:(Math.random()-.5)*.16*devicePixelRatio,vy:(-.08-Math.random()*.32)*devicePixelRatio,a:.08+Math.random()*.24,phase:Math.random()*6.28}));};
    resize(); window.onresize=resize;
    const tick=(t)=>{ctx.clearRect(0,0,w,h);for(const p of particles){p.x+=p.vx+Math.sin(t/1800+p.phase)*.035*devicePixelRatio;p.y+=p.vy;if(p.y<-10)p.y=h+10;if(p.x<-10)p.x=w+10;if(p.x>w+10)p.x=-10;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(215,255,170,${p.a})`;ctx.fill();}particleAnimation=requestAnimationFrame(tick)}; particleAnimation=requestAnimationFrame(tick);
  }

  function renderHVACCycle(){
    shell(`${toolIntro("Refrigeration Cycle Lab","Treat the refrigeration system like one living loop. Change the outdoor load, indoor airflow and cooling call; watch the compressor, heat transfer, pressures and animated refrigerant state respond together.","hvac")}
      ${labGuide('hvac-cycle')}
      <div class="workspace hvac-workspace"><div class="workspace-bar"><span>HVAC TRAINER · COOLING MODE</span><span id="hvacCycleState">SYSTEM RUNNING</span></div><div class="workspace-body"><div class="system-lab-layout">
        <aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Outdoor temperature</span><b id="hcOutdoorL">95°F</b></div><input id="hcOutdoor" type="range" min="65" max="115" value="95"></div><div class="range-row"><div class="range-head"><span>Indoor airflow</span><b id="hcAirL">100%</b></div><input id="hcAir" type="range" min="35" max="125" value="100"></div><button class="push on" id="hcCall">COOLING CALL ON</button><div class="metric-row"><div class="metric"><b id="hcLow">118 psi</b><small>Low side*</small></div><div class="metric"><b id="hcHigh">325 psi</b><small>High side*</small></div><div class="metric"><b id="hcDT">19°F</b><small>Air ΔT*</small></div></div><p class="sim-note">*Conceptual values for visualization — not refrigerant-specific service targets.</p><div class="lab-live-explain big" id="hcExplain"><b>Start with the loop.</b><span>The compressor is moving vapor and creating a high-side / low-side pressure difference so heat can move in the desired direction.</span></div></aside>
        <section class="big-sim-stage"><svg class="hvac-svg" viewBox="0 0 900 520"><defs><linearGradient id="hotGrad"><stop offset="0" stop-color="#ffba70"/><stop offset="1" stop-color="#ff766f"/></linearGradient><linearGradient id="coldGrad"><stop offset="0" stop-color="#66e8dc"/><stop offset="1" stop-color="#79aaff"/></linearGradient></defs>
          <path id="hotPath" d="M180 145 C310 70 520 70 690 150" class="refrig-line hot-line"/><path id="liquidPath" d="M690 150 C780 230 770 350 650 390" class="refrig-line liquid-line"/><path id="coldPath" d="M650 390 C490 470 300 465 180 375" class="refrig-line cold-line"/><path id="suctionPath" d="M180 375 C90 310 90 220 180 145" class="refrig-line suction-line"/>
          <g class="hvac-unit compressor-node"><rect x="125" y="105" width="110" height="90" rx="28"/><text x="180" y="143">COMPRESSOR</text><circle id="compressorSpin" cx="180" cy="168" r="18"/></g>
          <g class="hvac-unit condenser-node"><rect x="625" y="105" width="130" height="95" rx="18"/><text x="690" y="140">CONDENSER</text><path d="M650 165 h80"/><path d="M650 180 h80"/></g>
          <g class="hvac-unit meter-node"><rect x="615" y="355" width="100" height="70" rx="18"/><text x="665" y="385">METERING</text><text x="665" y="404">DEVICE</text></g>
          <g class="hvac-unit evap-node"><rect x="115" y="335" width="130" height="90" rx="18"/><text x="180" y="370">EVAPORATOR</text><path d="M140 395 h80"/></g>
          <g id="refrigerantDots"></g><g id="heatArrows"></g><text x="450" y="255" class="cycle-center">MOVE HEAT → NOT “MAKE COLD”</text><text x="450" y="282" class="cycle-sub">high pressure outside · low pressure inside</text>
        </svg><div class="state-strip"><span><i class="state-dot hot"></i> hot vapor</span><span><i class="state-dot liquid"></i> high-pressure liquid</span><span><i class="state-dot cold"></i> cold mixture</span><span><i class="state-dot vapor"></i> cool vapor</span></div></section>
      </div></div></div>${footer()}`); initHVACCycle();
  }
  function initHVACCycle(){
    let call=true;
    const update=()=>{
      const out=+id("hcOutdoor").value,air=+id("hcAir").value;
      id("hcOutdoorL").textContent=out+"°F";id("hcAirL").textContent=air+"%";
      const low=call?Math.round(108+(air-70)*.22):0,high=call?Math.round(250+(out-65)*2.5):0,dt=call?Math.round(25-(air-60)*.095):0;
      id("hcLow").textContent=low+" psi";id("hcHigh").textContent=high+" psi";id("hcDT").textContent=dt+"°F";
      id("hvacCycleState").textContent=call?"SYSTEM RUNNING":"SYSTEM IDLE";document.querySelector(".hvac-svg")?.classList.toggle("paused",!call);id("hcCall").classList.toggle("on",call);id("hcCall").textContent=call?"COOLING CALL ON":"COOLING CALL OFF";drawRefrigerant(call?Math.max(.45,air/100):0);
      const ex=id("hcExplain");if(ex){let h="The refrigeration loop is active.",t="The compressor maintains the pressure difference while heat is absorbed indoors and rejected outdoors.";if(!call){h="The call is off — refrigerant circulation stops.";t="Nothing in the loop can move heat continuously without the compressor operating and a complete control sequence."}else if(air<60){h="Indoor airflow is now a major variable.";t="Reduced air across the evaporator changes coil heat load and temperature behavior. Fix air-side conditions before treating refrigerant readings as a charge problem."}else if(out>102){h="Outdoor heat rejection just got harder.";t="Higher outdoor temperature raises the condensing-side burden. Watch the conceptual high side rise while the condenser rejects heat to hotter air."}ex.innerHTML=`<b>${h}</b><span>${t}</span>`;}
    };
    id("hcOutdoor").oninput=id("hcAir").oninput=update;id("hcCall").onclick=()=>{call=!call;update()};update();
  }

  function drawRefrigerant(speed){const g=id("refrigerantDots");if(!g)return;const colors=["#ff8c70","#ffc66d","#66e8dc","#79aaff"];const paths=["#hotPath","#liquidPath","#coldPath","#suctionPath"];g.innerHTML=Array.from({length:28},(_,i)=>`<circle r="${i%4===0?5:3.3}" fill="${colors[Math.floor(i/7)]}" opacity=".85"><animateMotion dur="${(5.8/Math.max(speed,.1)).toFixed(1)}s" begin="-${(i%7)*.75}s" repeatCount="indefinite"><mpath href="${paths[Math.floor(i/7)]}"/></animateMotion></circle>`).join("");}

  function renderAirflow(){
    shell(`${toolIntro("Airflow Lab","The equipment can only move the air the duct system allows. Load the filter, close the damper and change blower speed; watch velocity, static pressure and delivery change visually.","hvac")}
      ${labGuide('airflow')}
      <div class="workspace"><div class="workspace-bar"><span>AIR SYSTEM · SUPPLY / RETURN</span><span id="airStatus">BALANCED</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls">
        <div class="range-row"><div class="range-head"><span>Blower command</span><b id="afBlowerL">75%</b></div><input id="afBlower" type="range" min="20" max="100" value="75"></div><div class="range-row"><div class="range-head"><span>Filter loading</span><b id="afFilterL">15%</b></div><input id="afFilter" type="range" min="0" max="95" value="15"></div><div class="range-row"><div class="range-head"><span>Supply damper</span><b id="afDamperL">100%</b></div><input id="afDamper" type="range" min="20" max="100" value="100"></div><div class="metric-row"><div class="metric"><b id="afCfm">960</b><small>CFM*</small></div><div class="metric"><b id="afStatic">0.45</b><small>Static*</small></div><div class="metric"><b id="afHealth">GOOD</b><small>Air side</small></div></div><p class="sim-note">*Relative teaching model, not equipment design data.</p><div class="lab-live-explain big" id="afExplain"><b>Airflow healthy.</b><span>The blower has a relatively open path. Add restriction and watch delivery fall while static pressure rises.</span></div></aside>
        <section class="big-sim-stage airflow-stage"><div class="return-box">RETURN</div><div class="filter-box" id="filterBox"><div class="filter-lines"></div></div><div class="blower-shell"><div class="blower-wheel" id="blowerWheel" aria-hidden="true"><i></i></div></div><div class="duct-main"><div class="air-particles" id="airParticles"></div></div><div class="damper" id="damperBlade"></div><div class="supply-a">SUPPLY A</div><div class="supply-b">SUPPLY B</div><div class="gauge"><div class="gauge-needle" id="gaugeNeedle"></div><span>STATIC</span></div></section>
      </div></div></div>${footer()}`);initAirflow();
  }
  function initAirflow(){
    const update=()=>{const b=+id("afBlower").value,f=+id("afFilter").value,d=+id("afDamper").value;const restriction=(f*.55+(100-d)*.75);const cfm=Math.max(120,Math.round(b*15*(1-restriction/155)));const sp=(.12+b/230+restriction/120).toFixed(2);id("afBlowerL").textContent=b+"%";id("afFilterL").textContent=f+"%";id("afDamperL").textContent=d+"%";id("afCfm").textContent=cfm;id("afStatic").textContent=sp;const health=restriction>70?"RESTRICTED":restriction>40?"WATCH":"GOOD";id("afHealth").textContent=health;id("airStatus").textContent=health==="GOOD"?"AIRFLOW HEALTHY":"HIGH SYSTEM RESISTANCE";id("filterBox").style.opacity=.55+f/210;id("damperBlade").style.transform=`rotate(${90-d*.9}deg)`;id("blowerWheel").style.animationDuration=Math.max(.25,1.4-b/100)+"s";id("gaugeNeedle").style.transform=`rotate(${-55+Math.min(110,+sp*70)}deg)`;const particles=id("airParticles");particles.innerHTML=Array.from({length:Math.round(cfm/55)},(_,i)=>`<i style="--i:${i};--speed:${(2.9-b/75).toFixed(2)}s;--y:${12+(i*37)%74}%"></i>`).join("");
      const ex=id("afExplain");if(ex){let h="The air path is reasonably open.",t="Blower command is becoming delivered airflow because the filter and damper are not consuming excessive pressure.";if(f>65){h="The filter is acting like a restriction.";t="Notice that the blower can keep spinning while delivered CFM falls and static pressure rises. A dirty filter is a system problem, not just a housekeeping problem."}else if(d<50){h="The supply side is being throttled.";t="Closing the damper raises resistance. The blower sees a harder system even though its command did not change."}else if(b>85&&restriction>40){h="More blower effort cannot erase a bad duct path.";t="Increasing speed can raise pressure and noise, but the restriction still limits useful delivery."}ex.innerHTML=`<b>${h}</b><span>${t}</span>`;}
    };["afBlower","afFilter","afDamper"].forEach(x=>id(x).oninput=update);update();
  }

  function renderHVACControls(){
    shell(`${toolIntro("Thermostat + Controls Lab","A thermostat request is only the beginning. Change room temperature and setpoint, then watch the low-voltage request pass through the contactor into compressor and blower operation.","hvac")}
      ${labGuide('hvac-controls')}
      <div class="workspace"><div class="workspace-bar"><span>24V CONTROL SEQUENCE</span><span id="hctlState">NO COOLING CALL</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Room temperature</span><b id="roomTempL">78°F</b></div><input id="roomTemp" type="range" min="60" max="92" value="78"></div><div class="range-row"><div class="range-head"><span>Cooling setpoint</span><b id="setTempL">74°F</b></div><input id="setTemp" type="range" min="60" max="85" value="74"></div><button id="safetySwitch" class="push on">SAFETY CHAIN CLOSED</button><div class="metric-row"><div class="metric"><b id="yCall">ON</b><small>Y call</small></div><div class="metric"><b id="compressorCall">RUN</b><small>Compressor</small></div><div class="metric"><b id="fanCall">RUN</b><small>Blower</small></div></div><div class="lab-live-explain big" id="hctlExplain"><b>Cooling request active.</b><span>The thermostat is asking, but the safety chain still has to permit the request to reach the field loads.</span></div></aside><section class="big-sim-stage control-sequence" id="controlSequence"></section></div></div></div>${footer()}`);initHVACControls();
  }
  function initHVACControls(){
    let safe=true;
    const update=()=>{const room=+id("roomTemp").value,set=+id("setTemp").value,demand=room>set+1,call=demand&&safe;id("roomTempL").textContent=room+"°F";id("setTempL").textContent=set+"°F";id("yCall").textContent=call?"ON":"OFF";id("compressorCall").textContent=call?"RUN":"STOP";id("fanCall").textContent=call?"RUN":"STOP";id("hctlState").textContent=!safe?"SAFETY OPEN — CALL BLOCKED":call?"COOLING SEQUENCE ACTIVE":"NO COOLING CALL";id("safetySwitch").classList.toggle("on",safe);id("safetySwitch").textContent=safe?"SAFETY CHAIN CLOSED":"SAFETY CHAIN OPEN";id("controlSequence").innerHTML=[["THERMOSTAT",demand],["Y SIGNAL",call],["CONTACTOR",call],["COMPRESSOR",call],["BLOWER",call]].map((n,i)=>`<div class="sequence-node ${n[1]?"active":""}" style="--delay:${i*.13}s"><b>${n[0]}</b><span>${n[1]?"ACTIVE":"IDLE"}</span></div>`).join('<div class="sequence-link">→</div>');
      const ex=id("hctlExplain");if(ex){if(!demand)ex.innerHTML='<b>No cooling request.</b><span>The room condition does not currently exceed the setpoint enough to create the simulated Y call. The equipment should remain idle.</span>';else if(!safe)ex.innerHTML='<b>The thermostat is asking — but the safety path says no.</b><span>This is the important distinction: a demand can exist upstream while a safety or permissive prevents downstream hardware from energizing.</span>';else ex.innerHTML='<b>The complete control chain is true.</b><span>Demand exists, the safety is closed, the contactor is permitted to energize, and the compressor/blower outputs can run.</span>';}
    };id("roomTemp").oninput=id("setTemp").oninput=update;id("safetySwitch").onclick=()=>{safe=!safe;update()};update();
  }

  function renderPressureFlow(){
    shell(`${toolIntro("Pressure + Flow Lab","Pressure is the push; flow is what actually gets through. Change service pressure, pipe diameter and valve opening and watch the stream and gauge react.","plumbing")}
      ${labGuide('pressure-flow')}
      <div class="workspace"><div class="workspace-bar"><span>DOMESTIC WATER TRAINER</span><span id="pfState">FLOWING</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Supply pressure</span><b id="pfPressureL">60 psi</b></div><input id="pfPressure" type="range" min="20" max="100" value="60"></div><div class="range-row"><div class="range-head"><span>Pipe diameter</span><b id="pfDiaL">0.75 in</b></div><input id="pfDia" type="range" min="0.5" max="1.5" step="0.25" value="0.75"></div><div class="range-row"><div class="range-head"><span>Valve opening</span><b id="pfValveL">80%</b></div><input id="pfValve" type="range" min="0" max="100" value="80"></div><div class="metric-row"><div class="metric"><b id="pfGpm">8.3</b><small>Relative GPM*</small></div><div class="metric"><b id="pfVel">4.2</b><small>Velocity*</small></div><div class="metric"><b id="pfDrop">7 psi</b><small>Pressure drop*</small></div></div><p class="sim-note">*Simplified teaching model, not a pipe-sizing calculator.</p><div class="lab-live-explain big" id="pfExplain"><b>Pressure is not flow.</b><span>Source pressure provides energy; pipe size and valve restriction determine how much of that energy remains available to move water.</span></div></aside><section class="big-sim-stage pipe-stage"><div class="water-source">CITY<br><b id="sourceGauge">60</b><small> PSI</small></div><div class="pipe-run"><div class="water-particles" id="waterParticles"></div></div><div class="valve-wheel" id="valveWheel" aria-hidden="true"><i></i></div><div class="faucet"><div class="faucet-spout"></div><div class="water-jet" id="waterJet"></div></div><div class="pressure-gauge"><div class="gauge-needle" id="pipeGaugeNeedle"></div></div></section></div></div></div>${footer()}`);initPressureFlow();
  }
  function initPressureFlow(){
    const update=()=>{const p=+id("pfPressure").value,d=+id("pfDia").value,v=+id("pfValve").value;const gpm=(p/60)*(d*d)*11*(v/100),vel=gpm/(d*d*2.6),drop=Math.max(0,Math.round(p*(1-v/100)*.55));id("pfPressureL").textContent=p+" psi";id("pfDiaL").textContent=d.toFixed(2)+" in";id("pfValveL").textContent=v+"%";id("pfGpm").textContent=gpm.toFixed(1);id("pfVel").textContent=vel.toFixed(1);id("pfDrop").textContent=drop+" psi";id("sourceGauge").textContent=p;id("valveWheel").style.transform=`rotate(${v*3.6}deg)`;id("waterJet").style.height=(v?25+Math.min(160,gpm*10):0)+"px";id("waterJet").style.opacity=v/100;id("pipeGaugeNeedle").style.transform=`rotate(${-55+p*1.1}deg)`;id("pfState").textContent=v?"FLOWING":"VALVE CLOSED";id("waterParticles").innerHTML=Array.from({length:Math.round(gpm*2)},(_,i)=>`<i style="--i:${i};--speed:${Math.max(.55,3.2-vel/2.4).toFixed(2)}s"></i>`).join("");
      const ex=id("pfExplain");if(ex){let h="The path is open enough to convert pressure into flow.",t="Watch the stream, not just the source gauge. The fixture experiences what remains after the path's restrictions.";if(v<30){h="The valve has become the dominant restriction.";t="Available source pressure is still present upstream, but the nearly closed valve spends much of that pressure across a small opening and flow falls sharply."}else if(d<=.5){h="Small diameter is limiting capacity.";t="The same source pressure is being asked to move water through a smaller area. Velocity rises and the system becomes more sensitive to friction loss."}else if(p>85){h="High source pressure is not a substitute for correct sizing.";t="More pressure can increase flow in this teaching model, but real systems still need pressure regulation, correct pipe sizing and code-compliant velocity."}ex.innerHTML=`<b>${h}</b><span>${t}</span>`;}
    };["pfPressure","pfDia","pfValve"].forEach(x=>id(x).oninput=update);update();
  }

  function renderDrainVent(){
    shell(`${toolIntro("Drain + Vent Lab","A drain is water and air moving together. Fill the fixture, pull the plug, then block the vent and watch pressure behavior disturb the trap seal.","plumbing")}
      ${labGuide('drain-vent')}
      <div class="workspace"><div class="workspace-bar"><span>DWV TRAINER · FIXTURE BRANCH</span><span id="dvState">READY</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Fixture water</span><b id="dvFillL">75%</b></div><input id="dvFill" type="range" min="10" max="100" value="75"></div><button class="push on" id="dvVent">VENT OPEN</button><button class="solid-btn" style="width:100%;margin-top:8px" id="dvDrain">PULL PLUG / DRAIN</button><div class="metric-row"><div class="metric"><b id="dvTrap">100%</b><small>Trap seal</small></div><div class="metric"><b id="dvAir">BALANCED</b><small>Air pressure</small></div><div class="metric"><b id="dvFlow">READY</b><small>Drain</small></div></div><div class="lab-live-explain big" id="dvExplain"><b>Trap seal ready.</b><span>Drain once with the vent open, then block the vent and repeat. Compare what remains in the trap.</span></div></aside><section class="big-sim-stage dwv-stage"><div class="sink-bowl"><div class="sink-water" id="sinkWater"></div></div><div class="drain-neck"></div><div class="trap-pipe"><div class="trap-water" id="trapWater"></div></div><div class="drain-horizontal"><div id="drainDrops"></div></div><div class="vent-stack" id="ventStack"><span class="vent-air va1"></span><span class="vent-air va2"></span><span class="vent-air va3"></span></div><div class="sewer-arrow">→ DRAIN</div></section></div></div></div>${footer()}`);initDrainVent();
  }
  function initDrainVent(){
    let vent=true,draining=false;
    const update=()=>{const fill=+id("dvFill").value;id("dvFillL").textContent=fill+"%";id("sinkWater").style.height=(draining?0:fill*.72)+"%";id("dvVent").classList.toggle("on",vent);id("dvVent").textContent=vent?"VENT OPEN":"VENT BLOCKED";id("ventStack").classList.toggle("blocked",!vent);const ex=id("dvExplain");if(ex&&!draining)ex.innerHTML=vent?'<b>Vent path open.</b><span>When you drain the fixture, air can enter through the vent instead of being pulled through the trap water seal.</span>':'<b>Vent path blocked.</b><span>Drain the fixture now. The falling water will create a stronger negative-pressure condition in this simplified branch and pull on the trap seal.</span>';};
    id("dvFill").oninput=update;id("dvVent").onclick=()=>{vent=!vent;update()};id("dvDrain").onclick=()=>{if(draining)return;draining=true;id("dvFlow").textContent="FLOWING";id("dvState").textContent=vent?"AIR + WATER MOVING":"NEGATIVE PRESSURE BUILDING";id("drainDrops").innerHTML=Array.from({length:24},(_,i)=>`<i style="--i:${i}"></i>`).join("");const ex=id("dvExplain");if(ex)ex.innerHTML=vent?'<b>Water is draining while replacement air enters through the vent.</b><span>That separate air path helps keep pressure at the trap from falling enough to siphon the water seal.</span>':'<b>Water is draining without a healthy air path.</b><span>Watch the trap after flow ends. The pressure imbalance is pulling water out of the seal in this teaching model.</span>';update();setTimeout(()=>{const seal=vent?92:28;id("trapWater").style.height=seal+"%";id("dvTrap").textContent=seal+"%";id("dvAir").textContent=vent?"BALANCED":"SIPHONING";id("dvState").textContent=vent?"TRAP SEAL PROTECTED":"TRAP SEAL PULLED DOWN";id("dvFlow").textContent="DRAINED";draining=false;id("drainDrops").innerHTML="";if(ex)ex.innerHTML=vent?'<b>The fixture drained and the trap seal survived.</b><span>This is the result we want: waste leaves, air pressure stays controlled, and water remains to block sewer gas.</span>':'<b>The fixture drained — but the trap lost most of its seal.</b><span>A drain can appear to “work” while its venting is still wrong. The remaining water seal is the clue that matters.</span>';},1500)};update();
  }

  function renderWaterHeater(){
    shell(`${toolIntro("Water Heater Lab","A tank is a thermal storage system. Draw hot water and watch cold inlet water, temperature layers, heater recovery and thermal expansion change over time.","plumbing")}
      ${labGuide('water-heater-lab')}
      <div class="workspace"><div class="workspace-bar"><span>TANK WATER HEATER · CONCEPT TRAINER</span><span id="whState">AT TEMPERATURE</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Thermostat setpoint</span><b id="whSetL">120°F</b></div><input id="whSet" type="range" min="100" max="140" value="120"></div><div class="range-row"><div class="range-head"><span>Hot-water draw</span><b id="whDrawL">0%</b></div><input id="whDraw" type="range" min="0" max="100" value="0"></div><button class="push on" id="whHeat">HEAT ENABLED</button><div class="metric-row"><div class="metric"><b id="whTop">120°F</b><small>Top temp*</small></div><div class="metric"><b id="whBottom">116°F</b><small>Bottom temp*</small></div><div class="metric"><b id="whExpand">LOW</b><small>Expansion</small></div></div><p class="sim-note">Conceptual thermal model. Real temperature/pressure safety controls are critical.</p><div class="lab-live-explain big" id="whExplain"><b>Tank is stratified.</b><span>The hottest water is stored near the top outlet. Increase demand to watch incoming cold water consume that stored heat from the bottom upward.</span></div></aside><section class="big-sim-stage heater-stage"><div class="heater-tank"><div class="tank-layer hot-layer" id="hotLayer"></div><div class="tank-layer warm-layer" id="warmLayer"></div><div class="tank-layer cold-layer" id="coldLayer"></div><div class="heater-element" id="heaterElement">≈</div><div class="tank-bubbles" id="tankBubbles"></div></div><div class="cold-inlet"><span>↓ COLD IN</span></div><div class="hot-outlet"><span>HOT OUT ↑</span></div><div class="expansion-orb" id="expansionOrb"></div></section></div></div></div>${footer()}`);initWaterHeater();
  }
  function initWaterHeater(){
    let enabled=true;
    const update=()=>{const set=+id("whSet").value,draw=+id("whDraw").value;const top=Math.max(65,Math.round(set-draw*.22)),bottom=Math.max(55,Math.round(set-4-draw*.42));id("whSetL").textContent=set+"°F";id("whDrawL").textContent=draw+"%";id("whTop").textContent=top+"°F";id("whBottom").textContent=bottom+"°F";const heating=enabled&&bottom<set-3;id("whState").textContent=heating?"RECOVERING":draw?"HOT WATER DRAW":"AT TEMPERATURE";id("whHeat").classList.toggle("on",enabled);id("whHeat").textContent=enabled?"HEAT ENABLED":"HEAT DISABLED";id("heaterElement").classList.toggle("active",heating);id("coldLayer").style.height=(18+draw*.45)+"%";id("warmLayer").style.height=(25+draw*.12)+"%";id("hotLayer").style.height=Math.max(12,57-draw*.4)+"%";id("whExpand").textContent=set>130?"HIGH":set>118?"MED":"LOW";id("expansionOrb").style.transform=`scale(${.7+(set-100)/70})`;id("tankBubbles").innerHTML=heating?Array.from({length:15},(_,i)=>`<i style="--i:${i}"></i>`).join(""):"";
      const ex=id("whExplain");if(ex){let h="Stored heat is concentrated near the top.",t="With low demand, stratification preserves a hotter layer near the outlet while cooler water remains lower in the tank.";if(draw>65){h="Demand is consuming stored heat faster.";t="Cold replacement water enters the lower tank and the usable hot layer shrinks. Recovery capacity determines how quickly the tank can rebuild that stored energy."}else if(!enabled&&draw>15){h="The tank is being drawn down with no recovery.";t="With heat disabled, every gallon leaving hot is replaced by colder water and the tank cannot restore the lost energy."}else if(heating){h="The heater is in recovery.";t="The lower portion is below setpoint, so heat input is active while temperature layers rebuild."}if(set>130){h="Higher stored temperature increases thermal-expansion and scald considerations.";t="Real installations require correct temperature control, T&P relief protection and expansion control where the system is closed."}ex.innerHTML=`<b>${h}</b><span>${t}</span>`;}
    };id("whSet").oninput=id("whDraw").oninput=update;id("whHeat").onclick=()=>{enabled=!enabled;update()};update();
  }

  function renderShaftAlignment(){
    shell(`${toolIntro("Shaft Alignment Lab","Drag offset and angular misalignment into a coupled motor/pump set. Watch the coupling flex, shaft centerlines separate, and a simplified vibration indicator respond.","industrial")}
      ${labGuide('shaft-alignment')}
      <div class="workspace"><div class="workspace-bar"><span>ROTATING EQUIPMENT · MOTOR → PUMP</span><span id="alignState">GOOD ALIGNMENT</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Offset</span><b id="alOffsetL">0.00</b></div><input id="alOffset" type="range" min="-30" max="30" value="0"></div><div class="range-row"><div class="range-head"><span>Angular error</span><b id="alAngleL">0.0°</b></div><input id="alAngle" type="range" min="-12" max="12" value="0"></div><div class="metric-row"><div class="metric"><b id="alVib">1.0</b><small>Relative vibration</small></div><div class="metric"><b id="alCoupling">LOW</b><small>Coupling stress</small></div><div class="metric"><b id="alBearing">LOW</b><small>Bearing load</small></div></div><p class="sim-note">Conceptual model — real alignment tolerances depend on machine speed, coupling and procedure.</p></aside><section class="big-sim-stage align-stage"><div class="align-machine motor-a"><span class="rotor-disc"></span><b>MOTOR</b></div><div class="shaft-line left-shaft"></div><div class="flex-coupling" id="flexCoupling"></div><div class="shaft-line right-shaft" id="rightShaft"></div><div class="align-machine pump-b" id="pumpMachine"><span class="rotor-disc"></span><b>PUMP</b></div><div class="laser-line" id="laserLine"></div><div class="vibe-rings" id="vibeRings"><i></i><i></i><i></i></div></section></div></div></div>${footer()}`);initShaftAlignment();
  }
  function initShaftAlignment(){const update=()=>{const o=+id("alOffset").value,a=+id("alAngle").value,sev=Math.abs(o)/18+Math.abs(a)/7;id("alOffsetL").textContent=(o/100).toFixed(2)+" in*";id("alAngleL").textContent=a.toFixed(1)+"°*";id("alVib").textContent=(1+sev*2.2).toFixed(1);const label=sev>.9?"HIGH":sev>.35?"MED":"LOW";id("alCoupling").textContent=label;id("alBearing").textContent=label;id("alignState").textContent=sev>.9?"SEVERE MISALIGNMENT":sev>.35?"MISALIGNED":"GOOD ALIGNMENT";id("pumpMachine").style.transform=`translateY(${o}px) rotate(${a}deg)`;id("rightShaft").style.transform=`translateY(${o}px) rotate(${a}deg)`;id("flexCoupling").style.transform=`translateY(${o*.45}px) rotate(${a*.35}deg) scaleY(${1+sev*.12})`;id("vibeRings").style.opacity=Math.min(1,.12+sev*.8)};id("alOffset").oninput=id("alAngle").oninput=update;update()}

  function renderHydraulicLab(){
    shell(`${toolIntro("Hydraulic Power Lab","Pressure creates available force; flow creates actuator speed. Change pump flow, relief pressure and load, then route a 4/3-style conceptual valve to extend or retract the cylinder.","industrial")}
      ${labGuide('hydraulic-lab')}
      <div class="workspace"><div class="workspace-bar"><span>HYDRAULIC TRAINER · PUMP / VALVE / CYLINDER</span><span id="hydState">HOLDING</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Relief setting</span><b id="hyPressL">1500 psi</b></div><input id="hyPress" type="range" min="300" max="3000" step="50" value="1500"></div><div class="range-row"><div class="range-head"><span>Pump flow</span><b id="hyFlowL">8 gpm*</b></div><input id="hyFlow" type="range" min="1" max="20" value="8"></div><div class="range-row"><div class="range-head"><span>Load resistance</span><b id="hyLoadL">55%</b></div><input id="hyLoad" type="range" min="10" max="120" value="55"></div><div style="display:flex;gap:6px"><button class="push" id="hyRet">← RETRACT</button><button class="push on" id="hyHold">HOLD</button><button class="push" id="hyExt">EXTEND →</button></div><div class="metric-row"><div class="metric"><b id="hyForce">5890 lb*</b><small>Force</small></div><div class="metric"><b id="hySpeed">0.0</b><small>Speed*</small></div><div class="metric"><b id="hyActualP">825 psi*</b><small>System P</small></div></div></aside><section class="big-sim-stage hydraulic-stage"><div class="hyd-reservoir">TANK</div><div class="hyd-pump"><span>↻</span><b>PUMP</b></div><div class="hyd-line pressure-line"><div id="hydDots"></div></div><div class="hyd-valve" id="hydValve">P<br><b>VALVE</b><br>T</div><div class="hyd-cylinder"><div class="hyd-piston" id="hydPiston"></div><div class="hyd-rod" id="hydRod"></div></div><div class="load-block" id="hydLoadBlock">LOAD</div></section></div></div></div>${footer()}`);initHydraulicLab();
  }
  function initHydraulicLab(){let dir=0,pos=45;let raf;const update=()=>{const relief=+id("hyPress").value,flow=+id("hyFlow").value,load=+id("hyLoad").value;const required=Math.round(300+load*12),actual=Math.min(relief,required),force=Math.round(actual*7.1),stalled=required>relief,speed=dir&&!stalled?flow*(1-load/170):0;id("hyPressL").textContent=relief+" psi";id("hyFlowL").textContent=flow+" gpm*";id("hyLoadL").textContent=load+"%";id("hyActualP").textContent=actual+" psi*";id("hyForce").textContent=force+" lb*";id("hySpeed").textContent=Math.abs(speed).toFixed(1);id("hydState").textContent=stalled&&dir?"RELIEF / STALLED":dir===1?"EXTENDING":dir===-1?"RETRACTING":"HOLDING";id("hydValve").className=`hyd-valve dir${dir}`;id("hydLoadBlock").style.transform=`translateX(${pos*3.2}px)`;id("hydPiston").style.left=pos+"%";id("hydRod").style.width=Math.max(8,pos-8)+"%";id("hydDots").innerHTML=dir?Array.from({length:18},(_,i)=>`<i style="--i:${i};--dir:${dir};--speed:${Math.max(.5,2.4-flow/15)}s"></i>`).join(""):""};const tick=()=>{const relief=+id("hyPress").value,load=+id("hyLoad").value,flow=+id("hyFlow").value;if(dir&&300+load*12<=relief){pos+=dir*flow*.012;pos=Math.max(8,Math.min(82,pos))}update();raf=requestAnimationFrame(tick)};["hyPress","hyFlow","hyLoad"].forEach(x=>id(x).oninput=update);const set=d=>{dir=d;[[-1,"hyRet"],[0,"hyHold"],[1,"hyExt"]].forEach(([v,k])=>id(k).classList.toggle("on",d===v));update()};id("hyRet").onclick=()=>set(-1);id("hyHold").onclick=()=>set(0);id("hyExt").onclick=()=>set(1);cancelAnimationFrame(raf);tick()}

  function renderPneumaticLab(){
    shell(`${toolIntro("Pneumatic Sequence Lab","A compressed-air circuit feels simple until flow restrictions and load change the motion. Shift the valve, change regulator pressure and meter the exhaust to see the cylinder behave.","industrial")}
      ${labGuide('pneumatic-lab')}
      <div class="workspace"><div class="workspace-bar"><span>PNEUMATIC TRAINER · DOUBLE-ACTING CYLINDER</span><span id="pnState">RETRACTED</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Regulator pressure</span><b id="pnPressL">80 psi</b></div><input id="pnPress" type="range" min="20" max="120" value="80"></div><div class="range-row"><div class="range-head"><span>Flow control opening</span><b id="pnFlowL">75%</b></div><input id="pnFlow" type="range" min="10" max="100" value="75"></div><div class="range-row"><div class="range-head"><span>Load</span><b id="pnLoadL">35%</b></div><input id="pnLoad" type="range" min="0" max="110" value="35"></div><button class="push" id="pnShift">SHIFT VALVE → EXTEND</button><div class="metric-row"><div class="metric"><b id="pnForce">310 lb*</b><small>Force</small></div><div class="metric"><b id="pnSpeed">MED</b><small>Speed</small></div><div class="metric"><b id="pnStatus">READY</b><small>Motion</small></div></div></aside><section class="big-sim-stage pneu-stage"><div class="air-unit">FRL<br><b id="pnGauge">80</b> PSI</div><div class="air-line"><div class="air-flow-dots" id="pnDots"></div></div><div class="pneu-valve" id="pnValve">5/2<br>VALVE</div><div class="pneu-cylinder"><div class="pneu-piston" id="pnPiston"></div><div class="pneu-rod" id="pnRod"></div></div><div class="pneu-load" id="pnLoadBlock">LOAD</div><div class="exhaust-puffs" id="exhaustPuffs"></div></section></div></div></div>${footer()}`);initPneumaticLab();
  }
  function initPneumaticLab(){let ext=false;const update=()=>{const p=+id("pnPress").value,f=+id("pnFlow").value,l=+id("pnLoad").value,margin=p-l*.7;const move=margin>10;id("pnPressL").textContent=p+" psi";id("pnFlowL").textContent=f+"%";id("pnLoadL").textContent=l+"%";id("pnGauge").textContent=p;id("pnForce").textContent=Math.round(p*3.9)+" lb*";id("pnSpeed").textContent=f>75?"FAST":f>40?"MED":"SLOW";id("pnStatus").textContent=move?(ext?"EXTENDED":"RETRACTED"):"STALLED";id("pnState").textContent=id("pnStatus").textContent;const pos=move?(ext?76:18):48;id("pnPiston").style.left=pos+"%";id("pnRod").style.width=Math.max(8,pos-8)+"%";id("pnLoadBlock").style.transform=`translateX(${pos*2.7}px)`;id("pnValve").classList.toggle("shifted",ext);id("pnShift").textContent=ext?"SHIFT VALVE → RETRACT":"SHIFT VALVE → EXTEND";id("pnDots").innerHTML=Array.from({length:Math.round(f/7)},(_,i)=>`<i style="--i:${i};--speed:${(2.2-f/80).toFixed(2)}s"></i>`).join("");id("exhaustPuffs").innerHTML=move?Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join(""):""};["pnPress","pnFlow","pnLoad"].forEach(x=>id(x).oninput=update);id("pnShift").onclick=()=>{ext=!ext;update()};update()}

  function renderBearingLab(){
    shell(`${toolIntro("Bearing Health Lab","Turn three common reliability variables — load, lubrication and misalignment — and watch a conceptual bearing's temperature and vibration signature deteriorate.","industrial")}
      ${labGuide('bearing-lab')}
      <div class="workspace"><div class="workspace-bar"><span>BEARING HEALTH · CONDITION VIEW</span><span id="brState">HEALTHY</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Radial load</span><b id="brLoadL">45%</b></div><input id="brLoad" type="range" min="10" max="120" value="45"></div><div class="range-row"><div class="range-head"><span>Lubrication condition</span><b id="brLubeL">90%</b></div><input id="brLube" type="range" min="0" max="100" value="90"></div><div class="range-row"><div class="range-head"><span>Misalignment</span><b id="brMisL">10%</b></div><input id="brMis" type="range" min="0" max="100" value="10"></div><div class="metric-row"><div class="metric"><b id="brTemp">118°F*</b><small>Temperature</small></div><div class="metric"><b id="brVib">1.4*</b><small>Vibration</small></div><div class="metric"><b id="brLife">GOOD</b><small>Condition</small></div></div></aside><section class="big-sim-stage bearing-stage"><div class="bearing-outer"><div class="bearing-inner spin-bearing" id="bearingInner"></div><div id="bearingBalls" class="bearing-balls"></div></div><svg class="spectrum" viewBox="0 0 600 160" id="bearingSpectrum"></svg><div class="heat-halo" id="bearingHeat"></div></section></div></div></div>${footer()}`);initBearingLab();
  }
  function initBearingLab(){const update=()=>{const l=+id("brLoad").value,lu=+id("brLube").value,m=+id("brMis").value,sev=l/120+(100-lu)/60+m/80,temp=Math.round(82+sev*42),vib=(.7+sev*2.7).toFixed(1),cond=sev>2.15?"CRITICAL":sev>1.35?"WATCH":"GOOD";id("brLoadL").textContent=l+"%";id("brLubeL").textContent=lu+"%";id("brMisL").textContent=m+"%";id("brTemp").textContent=temp+"°F*";id("brVib").textContent=vib+"*";id("brLife").textContent=cond;id("brState").textContent=cond;id("bearingHeat").style.opacity=Math.min(.8,sev/3);id("bearingInner").style.animationDuration=Math.max(.25,1.1-l/180)+"s";id("bearingBalls").innerHTML=Array.from({length:12},(_,i)=>`<i style="--a:${i*30}deg"></i>`).join("");let d="M0 135";for(let x=0;x<=600;x+=10){const base=8*Math.sin(x/34)+4*Math.sin(x/11),spike=(Math.sin(x/(26-sev*3))**12)*sev*48;d+=` L${x} ${Math.max(15,130-base-spike)}`};id("bearingSpectrum").innerHTML=`<path d="${d}" fill="none" stroke="${cond==='GOOD'?'#d7ff64':cond==='WATCH'?'#ffb76b':'#ff766f'}" stroke-width="2"/><line x1="0" y1="135" x2="600" y2="135" stroke="#33463b"/>`};["brLoad","brLube","brMis"].forEach(x=>id(x).oninput=update);update()}

  function renderConveyorLab(){
    shell(`${toolIntro("Conveyor Drive Lab","Conveyors connect mechanical power to process throughput. Change drive speed, product load and belt tension and watch slip and motor demand respond.","industrial")}
      ${labGuide('conveyor-lab')}
      <div class="workspace"><div class="workspace-bar"><span>CONVEYOR TRAINER · DRIVE END</span><span id="cvState">RUNNING</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Drive command</span><b id="cvSpeedL">70%</b></div><input id="cvSpeed" type="range" min="0" max="100" value="70"></div><div class="range-row"><div class="range-head"><span>Product load</span><b id="cvLoadL">50%</b></div><input id="cvLoad" type="range" min="0" max="120" value="50"></div><div class="range-row"><div class="range-head"><span>Belt tension</span><b id="cvTensionL">65%</b></div><input id="cvTension" type="range" min="10" max="100" value="65"></div><div class="metric-row"><div class="metric"><b id="cvActual">67%</b><small>Belt speed*</small></div><div class="metric"><b id="cvSlip">4%</b><small>Slip*</small></div><div class="metric"><b id="cvTorque">58%</b><small>Drive load*</small></div></div></aside><section class="big-sim-stage conveyor-stage"><div class="drive-motor"><span id="cvMotorWheel">✣</span><b>MOTOR</b></div><div class="conveyor-belt" id="conveyorBelt"><div id="cvBoxes"></div></div><div class="drive-pulley" id="drivePulley"></div><div class="tail-pulley"></div><div class="slip-sparks" id="slipSparks"></div></section></div></div></div>${footer()}`);initConveyorLab();
  }
  function initConveyorLab(){const update=()=>{const s=+id("cvSpeed").value,l=+id("cvLoad").value,t=+id("cvTension").value,slip=Math.max(0,(l-t*.8)*.35),actual=Math.max(0,s*(1-slip/100)),torque=Math.min(140,l*.75+s*.3);id("cvSpeedL").textContent=s+"%";id("cvLoadL").textContent=l+"%";id("cvTensionL").textContent=t+"%";id("cvActual").textContent=Math.round(actual)+"%";id("cvSlip").textContent=Math.round(slip)+"%";id("cvTorque").textContent=Math.round(torque)+"%";id("cvState").textContent=s===0?"STOPPED":slip>20?"BELT SLIPPING":torque>100?"OVERLOADED":"RUNNING";id("conveyorBelt").style.animationDuration=s?Math.max(.35,4-actual/27)+"s":"0s";id("cvMotorWheel").style.animationDuration=s?Math.max(.25,2-s/65)+"s":"0s";id("cvBoxes").innerHTML=Array.from({length:Math.max(1,Math.round(l/18))},(_,i)=>`<i style="left:${10+i*14}%"></i>`).join("");id("slipSparks").innerHTML=slip>12?Array.from({length:Math.round(slip/3)},(_,i)=>`<i style="--i:${i}"></i>`).join(""):""};["cvSpeed","cvLoad","cvTension"].forEach(x=>id(x).oninput=update);update()}

  // --- V3 Welding Labs --------------------------------------------------------
  function renderWeldPuddle(){
    shell(`${toolIntro("Weld Parameter Window","This is not a fake welding game. It is a simplified process map that shows how current, arc voltage and travel speed move heat input, bead width and penetration tendency. Use it to understand direction of change — then compare those ideas with a real procedure and actual welds.","welding")}
      ${labGuide('weld-puddle')}
      <div class="workspace weld-workspace-v7"><div class="workspace-bar"><span>PROCESS MAP · SIMPLIFIED RELATIONSHIPS</span><span id="wpState">BASELINE WINDOW</span></div><div class="workspace-body"><div class="weld-parameter-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Current</span><b id="wpAmpL">120 A</b></div><input id="wpAmp" type="range" min="40" max="240" value="120"></div><div class="range-row"><div class="range-head"><span>Arc voltage</span><b id="wpVoltL">22 V</b></div><input id="wpVolt" type="range" min="14" max="34" value="22"></div><div class="range-row"><div class="range-head"><span>Travel speed</span><b id="wpSpeedL">55%</b></div><input id="wpSpeed" type="range" min="15" max="100" value="55"></div><div class="range-row"><div class="range-head"><span>Work angle</span><b id="wpAngleL">45°</b></div><input id="wpAngle" type="range" min="20" max="70" value="45"></div><div class="metric-row"><div class="metric"><b id="wpPen">MED</b><small>Penetration tendency</small></div><div class="metric"><b id="wpWidth">MED</b><small>Bead-width tendency</small></div><div class="metric"><b id="wpHeat">NORM</b><small>Relative heat input</small></div></div><div class="model-warning"><b>Simplified model</b><p>Actual weld behavior depends on process, polarity, electrode/wire, shielding, joint geometry, material, position and qualified procedure variables.</p></div></aside><section class="weld-response-stage"><div class="response-heading"><span>CROSS-SECTION RESPONSE</span><b id="wpResponse">Balanced profile</b></div><div class="weld-cross-section"><div class="base-plate-cross"></div><div class="haz-cross" id="weldHaz"></div><div class="fusion-cross" id="weldPuddle"></div><div class="bead-cap-cross" id="weldBead"></div><div class="centerline-cross"></div><div class="dimension dim-width"><span>WIDTH</span></div><div class="dimension dim-depth"><span>DEPTH</span></div></div><div class="response-scale"><span>LOW ENERGY</span><i></i><span>HIGH ENERGY</span></div><div class="response-explain" id="wpExplain"></div></section></div></div></div>${footer()}`);initWeldPuddle();
  }
  function initWeldPuddle(){
    const update=()=>{
      const a=+id("wpAmp").value,v=+id("wpVolt").value,s=+id("wpSpeed").value,ang=+id("wpAngle").value;
      const heat=(a*v)/Math.max(15,s), pen=a/(s*.75), width=v*1.7/s*55;
      id("wpAmpL").textContent=a+" A"; id("wpVoltL").textContent=v+" V"; id("wpSpeedL").textContent=s+"%"; id("wpAngleL").textContent=ang+"°";
      const penLabel=pen>4?"DEEP":pen>2.5?"MED":"SHALLOW", widthLabel=width>45?"WIDE":width>28?"MED":"NARROW", heatLabel=heat>85?"HIGH":heat<35?"LOW":"NORM";
      id("wpPen").textContent=penLabel; id("wpWidth").textContent=widthLabel; id("wpHeat").textContent=heatLabel;
      const state=heat>100?"EXCESSIVE RELATIVE HEAT":heat<30?"LOW RELATIVE HEAT":v>31?"HIGH VOLTAGE / LONGER ARC":s>88?"FAST TRAVEL":"BASELINE WINDOW";
      id("wpState").textContent=state;
      id("wpResponse").textContent=`${widthLabel.toLowerCase()} cap · ${penLabel.toLowerCase()} penetration`;
      const fusion=id("weldPuddle"), cap=id("weldBead"), haz=id("weldHaz");
      fusion.style.width=(70+Math.min(130,width))+'px'; fusion.style.height=(28+Math.min(95,pen*13))+'px';
      cap.style.width=(95+Math.min(150,width*1.3))+'px'; cap.style.height=(12+Math.max(0,50-s)*.16)+'px';
      haz.style.width=(150+Math.min(260,heat*1.55))+'px'; haz.style.height=(70+Math.min(120,heat*.55))+'px';
      const notes=[]; if(a>180)notes.push('Higher current increases melting/penetration tendency in this simplified model.'); if(v>28)notes.push('Higher arc voltage tends to broaden the arc and bead.'); if(s>75)notes.push('Faster travel reduces energy deposited per unit length.'); if(s<35)notes.push('Slow travel raises relative heat input and time at temperature.'); if(Math.abs(ang-45)>15)notes.push('Large angle changes can redirect arc force and heat; correct angle depends on process and joint.'); if(!notes.length)notes.push('Change one variable at a time. Predict the direction first, then compare the profile.');
      id("wpExplain").innerHTML=notes.map(x=>`<p>${esc(x)}</p>`).join('');
    };
    ["wpAmp","wpVolt","wpSpeed","wpAngle"].forEach(x=>id(x).oninput=update); update();
  }

  function renderJointLab(){
    shell(`${toolIntro("Joint + Penetration Lab","Look through the joint instead of only at the bead surface. Change groove angle, root opening and heat level to see why access and energy affect fusion through the section.","welding")}
      ${labGuide('joint-lab')}
      <div class="workspace"><div class="workspace-bar"><span>WELD CROSS-SECTION · GROOVE JOINT</span><span id="jtState">GOOD ACCESS</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Included groove angle</span><b id="jtAngleL">60°</b></div><input id="jtAngle" type="range" min="20" max="90" value="60"></div><div class="range-row"><div class="range-head"><span>Root opening</span><b id="jtRootL">3 mm*</b></div><input id="jtRoot" type="range" min="0" max="8" value="3"></div><div class="range-row"><div class="range-head"><span>Heat level</span><b id="jtHeatL">60%</b></div><input id="jtHeat" type="range" min="20" max="100" value="60"></div><div class="metric-row"><div class="metric"><b id="jtFusion">GOOD</b><small>Sidewall fusion*</small></div><div class="metric"><b id="jtRoot">GOOD</b><small>Root fusion*</small></div><div class="metric"><b id="jtDist">MED</b><small>Distortion risk*</small></div></div></aside><section class="big-sim-stage joint-stage"><div class="joint-left" id="jointLeft"></div><div class="joint-right" id="jointRight"></div><div class="fusion-zone" id="fusionZone"></div><div class="root-gap" id="rootGap"></div><div class="joint-bead"></div><div class="penetration-glow" id="penetrationGlow"></div></section></div></div></div>${footer()}`);initJointLab();
  }
  function initJointLab(){const update=()=>{const a=+id("jtAngle").value,r=+id("jtRoot").value,h=+id("jtHeat").value,access=a/60+r/5,root=h/60+r/4,side=h/60+a/70;id("jtAngleL").textContent=a+"°";id("jtRootL").textContent=r+" mm*";id("jtHeatL").textContent=h+"%";id("jtFusion").textContent=side>1.4?"GOOD":side>1?"MARGINAL":"POOR";id("jtRoot").textContent=root>1.35?"GOOD":root>.9?"MARGINAL":"POOR";id("jtDist").textContent=h>82?"HIGH":h>50?"MED":"LOW";id("jtState").textContent=access<.75?"ARC ACCESS RESTRICTED":root<.9?"ROOT FUSION RISK":"GOOD ACCESS";id("jointLeft").style.transform=`skewX(${-(90-a)/2}deg)`;id("jointRight").style.transform=`skewX(${(90-a)/2}deg)`;id("rootGap").style.width=(4+r*5)+"px";id("fusionZone").style.height=(35+h*.9)+"px";id("fusionZone").style.width=(55+a*1.3)+"px";id("penetrationGlow").style.height=(10+Math.min(90,root*45))+"px"};["jtAngle","jtRoot","jtHeat"].forEach(x=>id(x).oninput=update);update()}

  function renderDefectLab(){
    shell(`${toolIntro("Weld Defect Lab","Create bad conditions on purpose. Toggle contamination, shielding loss and excessive travel speed and watch the bead develop visual clues you can connect to likely causes.","welding")}
      ${labGuide('defect-lab')}
      <div class="workspace"><div class="workspace-bar"><span>WELD QUALITY · CAUSE → SYMPTOM</span><span id="dfState">SOUND BEAD</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="io-row"><span>Surface contamination</span><div class="toggle" id="dfDirty"></div></div><div class="io-row"><span>Shielding gas disturbed</span><div class="toggle" id="dfGas"></div></div><div class="io-row"><span>Travel too fast</span><div class="toggle" id="dfFast"></div></div><div class="io-row"><span>Arc aimed at edge</span><div class="toggle" id="dfEdge"></div></div><div class="metric-row"><div class="metric"><b id="dfPoro">LOW</b><small>Porosity risk*</small></div><div class="metric"><b id="dfUnder">LOW</b><small>Undercut risk*</small></div><div class="metric"><b id="dfFusion">GOOD</b><small>Fusion*</small></div></div></aside><section class="big-sim-stage defect-stage"><div class="defect-plate"><div class="defect-bead" id="defectBead"></div><div id="poreField"></div><div class="undercut-line left" id="underL"></div><div class="undercut-line right" id="underR"></div><div class="fusion-shadow" id="fusionShadow"></div></div><div class="defect-callouts" id="defectCallouts"></div></section></div></div></div>${footer()}`);initDefectLab();
  }
  function initDefectLab(){let dirty=false,gas=false,fast=false,edge=false;const update=()=>{const por=(dirty?1:0)+(gas?2:0),under=(fast?1:0)+(edge?2:0),fusion=(fast?1:0)+(edge?1:0);id("dfDirty").classList.toggle("on",dirty);id("dfGas").classList.toggle("on",gas);id("dfFast").classList.toggle("on",fast);id("dfEdge").classList.toggle("on",edge);id("dfPoro").textContent=por>=2?"HIGH":por?"MED":"LOW";id("dfUnder").textContent=under>=2?"HIGH":under?"MED":"LOW";id("dfFusion").textContent=fusion>=2?"POOR":fusion?"WATCH":"GOOD";id("dfState").textContent=!por&&!under&&!fusion?"SOUND BEAD":"DEFECT CONDITIONS ACTIVE";id("poreField").innerHTML=Array.from({length:por*9},(_,i)=>`<i style="left:${8+(i*17)%84}%;top:${34+(i*31)%34}%"></i>`).join("");id("underL").style.opacity=under?1:0;id("underR").style.opacity=under>1?1:0;id("fusionShadow").style.opacity=fusion?Math.min(.8,.25*fusion):0;const calls=[];if(por)calls.push("POROSITY → check shielding / contamination");if(under)calls.push("UNDERCUT → check travel / angle / heat");if(fusion)calls.push("FUSION RISK → slow down / improve access");id("defectCallouts").innerHTML=calls.map(x=>`<span>${x}</span>`).join("")};id("dfDirty").onclick=()=>{dirty=!dirty;update()};id("dfGas").onclick=()=>{gas=!gas;update()};id("dfFast").onclick=()=>{fast=!fast;update()};id("dfEdge").onclick=()=>{edge=!edge;update()};update()}

  // --- V3 Construction Labs ---------------------------------------------------
  function renderBlueprintLab(){
    shell(`${toolIntro("Blueprint + Layout Lab","Construction drawings are information networks. Change scale, select references and use the dimension strings to locate an opening without trusting the picture alone.","construction")}
      ${labGuide('blueprint-lab')}
      <div class="workspace"><div class="workspace-bar"><span>PLAN READER · WALL A</span><span id="bpState">USE DIMENSIONS</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Printed scale</span><b id="bpScaleL">1/4 in = 1 ft</b></div><input id="bpScale" type="range" min="1" max="4" value="2"></div><div class="range-row"><div class="range-head"><span>Field control offset</span><b id="bpOffsetL">0 ft</b></div><input id="bpOffset" type="range" min="-4" max="4" step=".5" value="0"></div><button class="push" id="bpMeasure">SHOW SCALED RULER</button><div class="metric-row"><div class="metric"><b>12'-0"</b><small>Grid A → opening</small></div><div class="metric"><b>3'-0"</b><small>Opening width</small></div><div class="metric"><b id="bpField">12'-0"</b><small>Field location</small></div></div></aside><section class="big-sim-stage blueprint-stage"><div class="plan-gridline ga">A</div><div class="plan-gridline gb">B</div><div class="plan-wall"></div><div class="plan-opening" id="planOpening"></div><div class="dimension-line dim-main"><span>12'-0"</span></div><div class="dimension-line dim-open"><span>3'-0"</span></div><div class="plan-note">DOOR 101<br><small>SEE 5/A6.2</small></div><div class="scale-ruler" id="scaleRuler"></div></section></div></div></div>${footer()}`);initBlueprintLab();
  }
  function initBlueprintLab(){let show=false;const labels=["1/8 in = 1 ft","3/16 in = 1 ft","1/4 in = 1 ft","1/2 in = 1 ft"];const update=()=>{const sc=+id("bpScale").value,off=+id("bpOffset").value;id("bpScaleL").textContent=labels[sc-1];id("bpOffsetL").textContent=off+" ft";id("bpField").textContent=(12+off).toFixed(1)+" ft";id("planOpening").style.transform=`translateX(${off*18}px)`;id("scaleRuler").classList.toggle("show",show);id("scaleRuler").style.transform=`scaleX(${.65+sc*.18})`;id("bpState").textContent=off?"FIELD OFFSET APPLIED":"USE DIMENSIONS"};id("bpScale").oninput=id("bpOffset").oninput=update;id("bpMeasure").onclick=()=>{show=!show;id("bpMeasure").classList.toggle("on",show);update()};update()}

  function renderFramingLab(){
    shell(`${toolIntro("Framing Builder","Build a simplified wall around an opening. Change opening width and bearing load and watch common supporting members appear and carry the load around the opening.","construction")}
      ${labGuide('framing-lab')}
      <div class="workspace"><div class="workspace-bar"><span>WALL FRAMING · OPENING STUDY</span><span id="frState">LOAD PATH CONTINUOUS</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Opening width</span><b id="frOpenL">4 ft*</b></div><input id="frOpen" type="range" min="2" max="10" value="4"></div><div class="range-row"><div class="range-head"><span>Load above</span><b id="frLoadL">55%</b></div><input id="frLoad" type="range" min="10" max="100" value="55"></div><button class="push on" id="frHeader">HEADER + SUPPORT ON</button><div class="metric-row"><div class="metric"><b id="frHeaderSize">2x?</b><small>Concept header</small></div><div class="metric"><b id="frJacks">2</b><small>Support studs</small></div><div class="metric"><b id="frPath">GOOD</b><small>Load path</small></div></div><p class="sim-note">Visualization only. Structural member sizing must come from approved code/design criteria.</p></aside><section class="big-sim-stage framing-stage"><div class="top-plate"></div><div class="bottom-plate"></div><div class="stud-field" id="studField"></div><div class="framing-opening" id="frOpening"></div><div class="framing-header" id="frHeaderViz"></div><div class="load-arrows" id="frLoadArrows"></div></section></div></div></div>${footer()}`);initFramingLab();
  }
  function initFramingLab(){let supported=true;const update=()=>{const o=+id("frOpen").value,l=+id("frLoad").value;id("frOpenL").textContent=o+" ft*";id("frLoadL").textContent=l+"%";id("frHeader").classList.toggle("on",supported);id("frHeader").textContent=supported?"HEADER + SUPPORT ON":"REMOVE SUPPORT";id("frHeaderViz").style.width=(80+o*23)+"px";id("frOpening").style.width=(70+o*25)+"px";id("frHeaderViz").style.opacity=supported?1:.12;id("frHeaderSize").textContent=l>75||o>7?"DEEPER*":l>45||o>4?"MEDIUM*":"LIGHT*";id("frJacks").textContent=supported?(o>7?4:2):0;id("frPath").textContent=supported?"GOOD":"BROKEN";id("frState").textContent=supported?"LOAD PATH CONTINUOUS":"OPENING INTERRUPTS LOAD PATH";id("studField").innerHTML=Array.from({length:11},(_,i)=>`<i style="left:${4+i*9.1}%"></i>`).join("");id("frLoadArrows").innerHTML=Array.from({length:8},(_,i)=>`<i style="left:${8+i*12}% ;height:${25+l*.35}px"></i>`).join("")};id("frOpen").oninput=id("frLoad").oninput=update;id("frHeader").onclick=()=>{supported=!supported;update()};update()}

  function renderLoadPathLab(){
    shell(`${toolIntro("Load Path Lab","Put gravity load onto a simplified structure and follow it through connected members. Remove one support and the visualization immediately shows where continuity is lost.","construction")}
      ${labGuide('loadpath-lab')}
      <div class="workspace"><div class="workspace-bar"><span>STRUCTURE · GRAVITY LOAD TRACE</span><span id="lpState">CONTINUOUS LOAD PATH</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Applied roof/floor load</span><b id="lpLoadL">60%</b></div><input id="lpLoad" type="range" min="10" max="100" value="60"></div><div class="io-row"><span>Beam present</span><div class="toggle on" id="lpBeam"></div></div><div class="io-row"><span>Left support</span><div class="toggle on" id="lpLeft"></div></div><div class="io-row"><span>Right support</span><div class="toggle on" id="lpRight"></div></div><div class="metric-row"><div class="metric"><b id="lpBeamForce">60</b><small>Beam demand*</small></div><div class="metric"><b id="lpSupportForce">30 / 30</b><small>Support share*</small></div><div class="metric"><b id="lpResult">STABLE</b><small>Path</small></div></div></aside><section class="big-sim-stage loadpath-stage"><div class="roof-load" id="roofLoad" aria-label="Downward applied load"><span></span><span></span><span></span><span></span><span></span></div><div class="structure-beam" id="structureBeam"></div><div class="structure-column left" id="structureLeft"></div><div class="structure-column right" id="structureRight"></div><div class="foundation-pad left"></div><div class="foundation-pad right"></div><div class="force-flow" id="forceFlow"></div></section></div></div></div>${footer()}`);initLoadPathLab();
  }
  function initLoadPathLab(){let beam=true,left=true,right=true;const update=()=>{const l=+id("lpLoad").value,good=beam&&left&&right;id("lpLoadL").textContent=l+"%";id("lpBeam").classList.toggle("on",beam);id("lpLeft").classList.toggle("on",left);id("lpRight").classList.toggle("on",right);id("structureBeam").classList.toggle("missing",!beam);id("structureLeft").classList.toggle("missing",!left);id("structureRight").classList.toggle("missing",!right);id("lpBeamForce").textContent=beam?l:"—";id("lpSupportForce").textContent=left&&right?Math.round(l/2)+" / "+Math.round(l/2):left?l+" / —":right?"— / "+l:"— / —";id("lpResult").textContent=good?"STABLE":"BROKEN";id("lpState").textContent=good?"CONTINUOUS LOAD PATH":"LOAD PATH INTERRUPTED";id("forceFlow").innerHTML=good?Array.from({length:22},(_,i)=>`<i style="--i:${i}"></i>`).join(""):"";id("roofLoad").style.opacity=.25+l/130};id("lpLoad").oninput=update;id("lpBeam").onclick=()=>{beam=!beam;update()};id("lpLeft").onclick=()=>{left=!left;update()};id("lpRight").onclick=()=>{right=!right;update()};update()}

  function renderEnvelopeLab(){
    shell(`${toolIntro("Envelope Water Lab","Water management is easiest to understand when you can watch water try to get through the assembly. Change flashing and drainage-layer continuity while wind-driven rain hits the wall.","construction")}
      ${labGuide('envelope-lab')}
      <div class="workspace"><div class="workspace-bar"><span>WALL ENVELOPE · WATER CONTROL</span><span id="evState">DRAINING OUT</span></div><div class="workspace-body"><div class="system-lab-layout"><aside class="circuit-controls"><div class="range-row"><div class="range-head"><span>Rain intensity</span><b id="evRainL">65%</b></div><input id="evRain" type="range" min="0" max="100" value="65"></div><div class="range-row"><div class="range-head"><span>Wind pressure</span><b id="evWindL">40%</b></div><input id="evWind" type="range" min="0" max="100" value="40"></div><div class="io-row"><span>Head flashing correct</span><div class="toggle on" id="evFlash"></div></div><div class="io-row"><span>Drainage plane continuous</span><div class="toggle on" id="evWRB"></div></div><div class="metric-row"><div class="metric"><b id="evDrain">GOOD</b><small>Drainage</small></div><div class="metric"><b id="evLeak">LOW</b><small>Leak risk*</small></div><div class="metric"><b id="evDry">DRY</b><small>Interior</small></div></div></aside><section class="big-sim-stage envelope-stage"><div class="wall-layers"><div class="cladding-layer">CLADDING</div><div class="wrb-layer" id="wrbLayer">WRB</div><div class="sheathing-layer">SHEATHING</div><div class="inside-layer">INTERIOR</div></div><div class="window-box">WINDOW<div class="head-flashing" id="headFlashing"></div></div><div class="rain-field" id="rainField"></div><div class="drain-drops" id="envelopeDrain"></div><div class="leak-path" id="leakPath"></div></section></div></div></div>${footer()}`);initEnvelopeLab();
  }
  function initEnvelopeLab(){let flash=true,wrb=true;const update=()=>{const r=+id("evRain").value,w=+id("evWind").value,risk=(flash?0:45)+(wrb?0:45)+r*.12+w*.12;id("evRainL").textContent=r+"%";id("evWindL").textContent=w+"%";id("evFlash").classList.toggle("on",flash);id("evWRB").classList.toggle("on",wrb);id("headFlashing").classList.toggle("bad",!flash);id("wrbLayer").classList.toggle("bad",!wrb);id("evDrain").textContent=flash&&wrb?"GOOD":wrb?"PARTIAL":"POOR";id("evLeak").textContent=risk>70?"HIGH":risk>35?"MED":"LOW";id("evDry").textContent=risk>60?"WET":"DRY";id("evState").textContent=risk>60?"WATER REACHING INTERIOR":risk>35?"DETAILS STRESSED":"DRAINING OUT";id("rainField").innerHTML=Array.from({length:Math.round(r/3)},(_,i)=>`<i style="--i:${i};--wind:${w}"></i>`).join("");id("envelopeDrain").innerHTML=wrb?Array.from({length:Math.round(r/8)},(_,i)=>`<i style="--i:${i}"></i>`).join(""):"";id("leakPath").style.opacity=risk>60?1:0};id("evRain").oninput=id("evWind").oninput=update;id("evFlash").onclick=()=>{flash=!flash;update()};id("evWRB").onclick=()=>{wrb=!wrb;update()};update()}

  window.toggleComplete = idc => {state.progress[idc]=!state.progress[idc];saveProgress();renderConcept(idc);toast(state.progress[idc]?"Concept completed.":"Marked incomplete.")};

  let searchReturn=null;
  window.openSearch = () => {
    searchReturn=document.activeElement;
    id("searchModal").classList.add("open");
    const f=id("searchField");f.value="";updateSearch("");setTimeout(()=>f.focus(),10);
    f.oninput=()=>updateSearch(f.value);
    f.onkeydown=e=>{
      if(e.key==='ArrowDown'){e.preventDefault();id('searchResults').querySelector('button')?.focus()}
      if(e.key==='Enter'){e.preventDefault();id('searchResults').querySelector('button')?.click()}
    };
    id('searchModal').onkeydown=e=>{
      if(e.defaultPrevented)return;
      if(e.key==='Escape'){e.preventDefault();closeSearch()}
      const controls=[...id('searchModal').querySelectorAll('input,button')],index=controls.indexOf(document.activeElement);
      if(e.key==='ArrowDown'&&index>0){e.preventDefault();controls[Math.min(index+1,controls.length-1)]?.focus()}
      if(e.key==='ArrowUp'&&index>0){e.preventDefault();controls[Math.max(0,index-1)]?.focus()}
      if(e.key==='Tab'){
        if(e.shiftKey&&index===0){e.preventDefault();controls[controls.length-1]?.focus()}
        else if(!e.shiftKey&&index===controls.length-1){e.preventDefault();controls[0]?.focus()}
      }
    };
  };
  window.closeSearch=()=>{const modal=id("searchModal");if(!modal?.classList.contains("open"))return;modal.classList.remove("open");if(searchReturn?.isConnected)searchReturn.focus({preventScroll:true})};
  window.modalClick=e=>{if(e.target.id==="searchModal")closeSearch()};
  function bindSearchHotkey(){
    document.onkeydown=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}if(e.key==="Escape")closeSearch()};
  }
  function updateSearch(q){
    const clean=q.toLowerCase().replace(/what( the hell)? is|what's|explain|how does|how do|why does/g,"").trim();
    const words=clean.split(/\s+/).filter(Boolean);
    const ranked=D.concepts.map(c=>{const hay=(c.title+" "+c.oneLine+" "+c.plain+" "+c.eyebrow).toLowerCase();let score=0;words.forEach(w=>{if(c.title.toLowerCase().includes(w))score+=5;if(hay.includes(w))score+=1});return {c,score}}).filter(x=>!words.length||x.score>0).sort((a,b)=>b.score-a.score).slice(0,10);
    id("searchResults").innerHTML=ranked.length?ranked.map(({c})=>`<button type="button" class="search-result" onclick="closeSearch();go('concept/${c.id}')"><span><b>${esc(c.title)}</b><small>${esc(c.oneLine)}</small></span><code>${esc(categoryById(c.category,worldOf(c))?.name||"")}</code></button>`).join(""):`<p class="search-empty" role="status">No topics match “${esc(q)}”. Try a part, system, or trade name.</p>`;
  }

  window.toast = msg => {const t=id("toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show"),2200)};
  function id(x){return document.getElementById(x)}

  window.addEventListener("hashchange",route);
  route();
})();