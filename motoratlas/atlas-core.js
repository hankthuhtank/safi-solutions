(()=>{
'use strict';
const DATA=window.MOTOR_ATLAS;
if(!DATA) return;
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

let activeSystem=DATA.systems[0];
let activePart=activeSystem.parts[0];
let activeTab='quick';
let currentCase=DATA.diagnostics[0];
let caseStep=0;

/* ---------- navigation ---------- */
const topbar=$('#topbar'), menuBtn=$('#menuBtn'), navLinks=$('#navLinks');
addEventListener('scroll',()=>topbar?.classList.toggle('scrolled',scrollY>28),{passive:true});
menuBtn?.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open))});
function closeMenu(){navLinks?.classList.remove('open');menuBtn?.setAttribute('aria-expanded','false')}
$$('#navLinks a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navLinks?.classList.contains('open')){closeMenu();menuBtn?.focus()}});
document.addEventListener('click',e=>{if(!e.target.closest('#topbar'))closeMenu()});

/* ---------- counts ---------- */
const totalParts=DATA.systems.reduce((n,s)=>n+s.parts.length,0);
$('#heroCount').textContent=`${totalParts} components · ${DATA.systems.length} systems`;

/* ---------- systems ---------- */
function renderSystemStrip(){
  const el=$('#systemStrip');
  el.innerHTML=DATA.systems.map((s,i)=>`<button class="system-select${s.id===activeSystem.id?' active':''}" data-system="${s.id}" type="button"><span>${String(i+1).padStart(2,'0')} / ${s.parts.length}</span><b>${esc(s.name)}</b></button>`).join('');
  $$('.system-select',el).forEach(b=>b.addEventListener('click',()=>selectSystem(b.dataset.system,true)));
}
function selectSystem(id,resetPart=true){
  const s=DATA.systems.find(x=>x.id===id); if(!s) return;
  activeSystem=s;
  if(resetPart || !s.parts.includes(activePart)) activePart=s.parts[0];
  activeTab='quick';
  $('#partSearch').value='';
  renderSystemStrip();renderPartList();renderManual();renderSystemVisual();renderFlow();
}

/* ---------- parts ---------- */
function filteredParts(){
  const q=norm($('#partSearch').value);
  if(!q) return activeSystem.parts;
  return activeSystem.parts.filter(p=>norm([p.name,p.purpose,p.location,p.connects,p.failure,p.learn,p.tags.join(' ')].join(' ')).includes(q));
}
function renderPartList(){
  const arr=filteredParts();
  $('#partSystemLabel').textContent=activeSystem.name.toUpperCase();
  $('#partCountLabel').textContent=`${arr.length} PART${arr.length===1?'':'S'}`;
  $('#partList').innerHTML=arr.length?arr.map((p,i)=>`<button type="button" class="part-btn${p===activePart?' active':''}" data-name="${esc(p.name)}"><span class="n">${String(i+1).padStart(2,'0')}</span><b>${esc(p.name)}</b></button>`).join(''):`<div style="padding:20px;color:#68747a;font:500 .65rem var(--mono)">NO COMPONENTS MATCH THIS FILTER.</div>`;
  $$('.part-btn').forEach(b=>b.addEventListener('click',()=>{
    const p=activeSystem.parts.find(x=>x.name===b.dataset.name);if(!p)return;activePart=p;activeTab='quick';renderPartList();renderManual();renderSystemVisual();
  }));
}
$('#partSearch')?.addEventListener('input',renderPartList);

function safetyText(p){
  const t=p.tags.map(norm);
  if(t.some(x=>x.includes('high voltage'))) return 'High-voltage components can remain energized after shutdown. Hands-on service requires manufacturer isolation procedures, voltage verification and trained personnel.';
  if(t.some(x=>x.includes('pyrotechnic'))) return 'Airbag/pretensioner components are pyrotechnic devices. Follow OEM disablement, handling and waiting procedures before service.';
  if(t.some(x=>x.includes('safety critical'))) return 'This component affects vehicle safety. Educational information is not a substitute for the model-specific service procedure and inspection limits.';
  if(t.some(x=>x.includes('high pressure'))) return 'This system may retain dangerous pressure. Depressurization and service procedures are vehicle-specific.';
  if(t.some(x=>x.includes('hot'))) return 'Exhaust and cooling hardware can remain hot enough to cause injury after operation.';
  return 'Use manufacturer service information for specifications, test limits and repair procedures. Symptoms can overlap across several components.';
}
function detailHTML(tab,p){
  if(tab==='learn') return `<h4>How it fits into the system</h4><p class="lead">${esc(p.learn)}</p><div class="detail-grid"><div class="detail-block"><span>System</span><p>${esc(activeSystem.summary)}</p></div><div class="detail-block"><span>Works with</span><p>${esc(p.connects)}</p></div><div class="detail-block"><span>Where it lives</span><p>${esc(p.location)}</p></div><div class="detail-block"><span>Core job</span><p>${esc(p.purpose)}</p></div></div><div class="detail-callout"><b>Think in systems:</b> a complaint near this component does not prove this component failed. Follow the energy, fluid, mechanical load or signal path around it.</div>`;
  if(tab==='failure') return `<h4>What failure can look like</h4><p class="lead">${esc(p.failure)}</p><div class="detail-grid"><div class="detail-block"><span>Why symptoms overlap</span><p>Connected components can create similar behavior. For example, a sensor code may be caused by wiring, a mechanical condition or an implausible input rather than the sensor itself.</p></div><div class="detail-block"><span>Connected hardware</span><p>${esc(p.connects)}</p></div><div class="detail-block"><span>Best mindset</span><p>Confirm the complaint, identify the system, gather evidence and compare measurements with the manufacturer specification before replacing parts.</p></div><div class="detail-block"><span>Context tags</span><p>${esc(p.tags.length?p.tags.join(' · '):'General component')}</p></div></div><div class="detail-callout"><b>Possible signs ≠ diagnosis.</b> The listed symptoms are patterns that may occur, not a parts-replacement checklist.</div>`;
  if(tab==='inspect') return `<h4>How a technician approaches it</h4><p class="lead">${esc(p.inspect)}</p><div class="detail-grid"><div class="detail-block"><span>Start with</span><p>Verify the exact complaint and operating condition. Visual inspection and scan/measurement data should be interpreted before disassembly whenever practical.</p></div><div class="detail-block"><span>Specification matters</span><p>Clearance, pressure, temperature, voltage, runout, torque and wear limits differ by vehicle. “Looks okay” is not a specification.</p></div><div class="detail-block"><span>System connection</span><p>${esc(p.connects)}</p></div><div class="detail-block"><span>Safety</span><p>${esc(safetyText(p))}</p></div></div>`;
  return `<h4>What it does</h4><p class="lead">${esc(p.purpose)}</p><div class="detail-grid"><div class="detail-block"><span>Where it lives</span><p>${esc(p.location)}</p></div><div class="detail-block"><span>Works with</span><p>${esc(p.connects)}</p></div><div class="detail-block"><span>Possible failure signs</span><p>${esc(p.failure)}</p></div><div class="detail-block"><span>System</span><p>${esc(activeSystem.name)}: ${esc(activeSystem.summary)}</p></div></div><div class="detail-callout"><b>One-sentence mental model:</b> ${esc(p.purpose)}</div>`;
}
function relatedCandidates(){
  const terms=new Set(norm(activePart.connects).split(' ').filter(x=>x.length>3));
  const scored=[];
  DATA.systems.forEach(s=>s.parts.forEach(p=>{
    if(p===activePart)return;
    let score=0;const name=norm(p.name), blob=norm(p.name+' '+p.connects+' '+p.tags.join(' '));
    terms.forEach(t=>{if(name.includes(t))score+=4;else if(blob.includes(t))score++});
    if(norm(activePart.connects).includes(name))score+=8;
    if(s===activeSystem)score+=1;
    if(score>1)scored.push({p,s,score});
  }));
  return scored.sort((a,b)=>b.score-a.score).slice(0,5);
}
function renderManual(){
  const si=DATA.systems.indexOf(activeSystem)+1, pi=activeSystem.parts.indexOf(activePart)+1;
  $('#manualCode').textContent=`${String(si).padStart(2,'0')}.${String(pi).padStart(2,'0')}`;
  $('#partTitle').textContent=activePart.name;
  $('#partTags').innerHTML=(activePart.tags.length?activePart.tags:['component']).slice(0,4).map(t=>`<span>${esc(t)}</span>`).join('');
  $$('.detail-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
  $('#detailView').innerHTML=detailHTML(activeTab,activePart);
  const rel=relatedCandidates();
  $('#relatedParts').innerHTML=rel.length?rel.map((r,i)=>`<button type="button" data-rel="${i}">${esc(r.p.name)}</button>`).join(''):'<span style="color:#657077;font-size:.75rem">No direct cross-reference indexed.</span>';
  $$('[data-rel]').forEach(b=>b.addEventListener('click',()=>{const r=rel[+b.dataset.rel];if(!r)return;activeSystem=r.s;activePart=r.p;activeTab='quick';renderSystemStrip();renderPartList();renderManual();renderSystemVisual();renderFlow();$('#workbench').scrollIntoView({behavior:'smooth',block:'start'})}));
}
$$('.detail-tabs button').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tab;renderManual()}));

/* ---------- visual ---------- */
function renderSystemVisual(){
  const vis=activePart.visual||activeSystem.visual;
  const img=$('#systemImage');
  img.style.opacity='0';
  img.onload=()=>{img.style.opacity='1'};
  img.onerror=()=>{if(vis!==activeSystem.visual){activePart.visual=null;renderSystemVisual()}else{img.removeAttribute('src');img.alt='Reference image unavailable';$('#visualCaption').textContent='Reference image unavailable. Source link retained.';img.style.opacity='0'}};
  img.src=vis.src;img.alt=`${activePart.visual?activePart.name:activeSystem.name} technical reference`;
  $('#visualCaption').textContent=vis.caption+' · '+vis.credit;
  $('#visualSource').href=vis.href;
  const idx=DATA.systems.indexOf(activeSystem)+1;
  $('#systemCode').textContent=`SYSTEM ${String(idx).padStart(2,'0')} / ${activeSystem.parts.length} COMPONENTS`;
  $('#systemTitle').textContent=activeSystem.name;
  $('#systemSummary').textContent=activeSystem.summary;
  document.dispatchEvent(new CustomEvent('ma:part',{detail:{system:activeSystem.id,part:activePart.name}}));
}

/* ---------- flow diagrams ---------- */
function renderFlow(){
  const f=activeSystem.flow;$('#flowTitle').textContent=f.title;$('#flowSummary').textContent=f.summary;
  const W=960,rowH=108,nodeW=126,nodeH=52,left=80,right=35,top=26,H=Math.max(190,top+f.paths.length*rowH+20);
  const defs=`<defs><marker id="arr-energy" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#f0a43b"/></marker><marker id="arr-fluid" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#75c7d1"/></marker><marker id="arr-signal" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#b488da"/></marker></defs>`;
  let body='';
  f.paths.forEach((path,r)=>{
    const y=top+r*rowH;
    body+=`<text x="12" y="${y+29}" fill="#667177" font-family="IBM Plex Mono" font-size="9">${esc(path.label)}</text>`;
    const usable=W-left-right-nodeW, gap=path.nodes.length>1?usable/(path.nodes.length-1):0;
    path.nodes.forEach((name,i)=>{
      const x=left+i*gap;
      if(i<path.nodes.length-1){const nx=left+(i+1)*gap;body+=`<path class="path ${path.type}" marker-end="url(#arr-${path.type})" d="M ${x+nodeW} ${y+nodeH/2} L ${nx-8} ${y+nodeH/2}"/>`}
      const words=name.split(' '),line1=words.slice(0,Math.ceil(words.length/2)).join(' '),line2=words.slice(Math.ceil(words.length/2)).join(' ');
      body+=`<rect class="node" x="${x}" y="${y}" rx="0" width="${nodeW}" height="${nodeH}"/><text class="node-title" x="${x+10}" y="${y+22}">${esc(line1)}</text>${line2?`<text class="node-sub" x="${x+10}" y="${y+38}">${esc(line2)}</text>`:''}`;
    });
  });
  $('#flowStage').innerHTML=`<svg class="flow-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(f.title)}">${defs}${body}</svg>`;
}

/* ---------- global search ---------- */
const gs=$('#globalSearch');
const results=document.createElement('div');results.className='global-results';results.id='globalSearchResults';gs.closest('.hero-search').appendChild(results);
gs.setAttribute('aria-label','Search all systems and components');gs.setAttribute('aria-controls',results.id);gs.setAttribute('aria-expanded','false');
function closeResults(){results.classList.remove('open');gs.setAttribute('aria-expanded','false')}
results.addEventListener('keydown',e=>{
 const buttons=$$('button',results),i=buttons.indexOf(document.activeElement);
 if(e.key==='Escape'){e.preventDefault();closeResults();gs.focus()}
 else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=i+(e.key==='ArrowDown'?1:-1);if(next<0)gs.focus();else buttons[Math.min(next,buttons.length-1)]?.focus()}
});
function searchAll(q){
  q=norm(q);if(!q)return[];const out=[];
  DATA.systems.forEach(s=>{
    if(norm(s.name+' '+s.summary).includes(q))out.push({type:'system',s,label:s.name,sub:`${s.parts.length} components`});
    s.parts.forEach(p=>{const blob=norm([p.name,p.purpose,p.failure,p.tags.join(' ')].join(' '));if(blob.includes(q))out.push({type:'part',s,p,label:p.name,sub:s.name})});
  });return out.slice(0,10);
}
let currentSearch=[];
function renderGlobalResults(){
  currentSearch=searchAll(gs.value);
  if(!norm(gs.value)){closeResults();results.innerHTML='';return}
  results.innerHTML=currentSearch.length?currentSearch.map((r,i)=>`<button type="button" data-result="${i}"><span>${r.type==='part'?'PART':'SYSTEM'}</span><b>${esc(r.label)}</b><small>${esc(r.sub)}</small></button>`).join(''):`<div class="no-result">No indexed component matched “${esc(gs.value)}”.</div>`;
  results.classList.add('open');gs.setAttribute('aria-expanded','true');
  $$('[data-result]',results).forEach(b=>b.addEventListener('click',()=>openSearchResult(+b.dataset.result)));
}
function openSearchResult(i){const r=currentSearch[i];if(!r)return;activeSystem=r.s;activePart=r.p||r.s.parts[0];activeTab='quick';renderSystemStrip();renderPartList();renderManual();renderSystemVisual();renderFlow();closeResults();$('#partTitle').setAttribute('tabindex','-1');$('#partTitle').focus({preventScroll:true});$('#workbench').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}
gs.addEventListener('input',renderGlobalResults);gs.addEventListener('keydown',e=>{
 if(e.key==='ArrowDown'){e.preventDefault();renderGlobalResults();results.querySelector('button')?.focus()}
 if(e.key==='Enter'){e.preventDefault();renderGlobalResults();if(currentSearch[0])openSearchResult(0)}
 if(e.key==='Escape')closeResults();
});
document.addEventListener('focusin',e=>{if(!e.target.closest('.hero-search'))closeResults()});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();gs.focus();gs.select()}});
document.addEventListener('click',e=>{if(!e.target.closest('.hero-search'))closeResults()});

/* ---------- architecture ---------- */
function renderArchitecture(key){
  const d=DATA.architecture[key];if(!d)return;
  $$('#archTabs button').forEach(b=>b.classList.toggle('active',b.dataset.arch===key));
  $('#archImage').src=d.image;$('#archImage').alt=`U.S. Department of Energy labeled ${d.title.toLowerCase()} component diagram`;
  $('#archSource').textContent=d.source;$('#archTitle').textContent=d.title;$('#archText').textContent=d.text;$('#archLink').href=d.link;
  $('#archParts').innerHTML=d.parts.map(x=>`<div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('');
}
$$('#archTabs button').forEach(b=>b.addEventListener('click',()=>renderArchitecture(b.dataset.arch)));

/* ---------- diagnostic cases ---------- */
function renderCaseList(){
  $('#caseList').innerHTML=DATA.diagnostics.map(c=>`<button type="button" class="case-btn${c.id===currentCase.id?' active':''}" data-case="${c.id}"><span>${esc(c.code.split('/')[0])}</span><b>${esc(c.title)}</b><small>${esc(c.complaint)}</small></button>`).join('');
  $$('.case-btn').forEach(b=>b.addEventListener('click',()=>{currentCase=DATA.diagnostics.find(c=>c.id===b.dataset.case);caseStep=0;renderCaseList();renderCase()}));
}
function renderCase(){
  $('#caseCode').textContent=currentCase.code;$('#caseTitle').textContent=currentCase.title;$('#caseComplaint').textContent=currentCase.complaint;$('#caseStatus').textContent=caseStep>=currentCase.tests.length?'CASE NARROWED':'OPEN CASE';
  $('#caseSteps').innerHTML=currentCase.tests.map((t,i)=>`<button type="button" class="test-step${i<caseStep?' done':''}" data-step="${i}" ${i>caseStep?'disabled':''}><span class="n">${String(i+1).padStart(2,'0')}</span><b>${esc(t[0])}</b><span>${i<caseStep?'EVIDENCE LOGGED':i===caseStep?'RUN TEST':'LOCKED'}</span></button>`).join('');
  if(caseStep===0)$('#caseResult').innerHTML='<b>Start with the symptom.</b><span>Run the first test. Each result changes what should be suspected next.</span>';
  else if(caseStep<=currentCase.tests.length){const t=currentCase.tests[caseStep-1];$('#caseResult').innerHTML=`<b>${esc(t[1])}</b><span>${esc(t[2])}</span>`}
  if(caseStep>=currentCase.tests.length)$('#caseResult').innerHTML=`<b>Supported direction</b><span>${esc(currentCase.conclusion)}</span>`;
  $$('.test-step').forEach(b=>b.addEventListener('click',()=>{if(+b.dataset.step!==caseStep)return;caseStep++;renderCase()}));
}
$('#caseReset')?.addEventListener('click',()=>{caseStep=0;renderCase()});

/* ---------- sources ---------- */
function renderSources(){
  $('#sourceGrid').innerHTML=DATA.sources.map((s,i)=>`<article class="source-item"><span>${String(i+1).padStart(2,'0')} / REFERENCE</span><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p><a href="${esc(s[2])}" target="_blank" rel="noopener">OPEN SOURCE ↗</a></article>`).join('');
}

/* ---------- public hook: the 3D machine opens parts through this ---------- */
window.MotorAtlasUI={
  openPart(name,sysId,scroll=true){
    const s=DATA.systems.find(x=>x.id===sysId&&x.parts.some(p=>p.name===name))||DATA.systems.find(x=>x.parts.some(p=>p.name===name));if(!s)return false;
    activeSystem=s;activePart=s.parts.find(p=>p.name===name);activeTab='quick';$('#partSearch').value='';
    renderSystemStrip();renderPartList();renderManual();renderSystemVisual();renderFlow();
    if(scroll)$('#workbench').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    return true;
  },
  find(name){for(const s of DATA.systems){const p=s.parts.find(x=>x.name===name);if(p)return{system:s,part:p}}return null},
  data:DATA
};

/* ---------- init ---------- */
renderSystemStrip();renderPartList();renderManual();renderSystemVisual();renderFlow();renderArchitecture('gas');renderCaseList();renderCase();renderSources();
})();