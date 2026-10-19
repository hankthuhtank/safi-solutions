'use strict';
/* The Blueprint — rendering, interactions, saved plan, exports.
   Content lives in content.js. Saved plans stay in this browser (localStorage). */

const STORAGE_KEY = 'safisolutions-blueprint-v1';
const defaults = () => ({schemaVersion:1,profile:{name:'',business:'',location:'',date:''},tasks:{},budget:{},costStatus:{},months:0,allowance:0,customCosts:[],notes:{offer:'',approvals:'',questions:'',launch:''},theme:'light',font:1});
let state = defaults(), storageAvailable = true;

const main = document.getElementById('main');
const ui = {layer:null,hidden:new Set(),valve:0,seats:64,pathFilter:'All',occ:'B',sheet:1,gloss:'',load:{dining:800,kitchen:400},pendingScroll:null};
let toastTimer, INDEX = null, observer = null;

/* ───────────── helpers ───────────── */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
function e(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const pad = n=>String(n).padStart(2,'0');
const cleanText = (x,max=10000)=>typeof x==='string'?x.slice(0,max):'';
const chapterNo = id=>CHAPTERS.findIndex(c=>c.id===id)+1;
const chapter = id=>CHAPTERS.find(c=>c.id===id);
const phaseOf = id=>PHASES.find(p=>p.chapters.includes(id));
function currency(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);}
const DATUM='<svg viewBox="0 0 18 13" aria-hidden="true"><path d="M1 1h16L9 12Z"/><path class="h" d="M9 1h8L9 12Z"/></svg>';
const datum=(t)=>`<span class="datum">${DATUM}<span>${t}</span></span>`;
const VALVE_SVG='<svg viewBox="0 0 56 56" aria-hidden="true"><path class="stem" d="M28 28V9"/><path class="wheel" d="M17 9h22"/><path class="body" d="M7 17 28 28 7 39ZM49 17 28 28 49 39Z"/></svg>';

function sanitizeState(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schemaVersion!==1)throw new Error('Unsupported blueprint file.');
  const out=defaults();
  for(const key of Object.keys(out.profile))out.profile[key]=cleanText(raw.profile?.[key],500);
  if(!BUSINESSES.some(b=>b.id===out.profile.business))out.profile.business='';
  for(const key of Object.keys(out.notes))out.notes[key]=cleanText(raw.notes?.[key],20000);
  out.customCosts=Array.isArray(raw.customCosts)?raw.customCosts.slice(0,80).filter(c=>c&&/^custom-[a-z0-9-]+$/.test(c.id)&&typeof c.name==='string').map(c=>({id:c.id,name:cleanText(c.name,150),frequency:c.frequency==='monthly'?'monthly':'upfront',category:'Your additions',detail:'An expense you added to your own plan.',contact:'Your notes / supplier',ballpark:'your estimate'})):[];
  const allowedCosts=new Set([...COSTS,...out.customCosts].map(c=>c.id));
  for(const [key,value] of Object.entries(raw.budget||{}))if(allowedCosts.has(key)&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0)out.budget[key]=Math.min(Number(value),1e12);
  for(const [key,value] of Object.entries(raw.costStatus||{}))if(allowedCosts.has(key)&&['unpriced','estimated','na'].includes(value))out.costStatus[key]=value;
  const allowedTasks=new Set([...CHAPTERS.flatMap(c=>c.tasks.map((_,i)=>c.id+'-'+i)),...BUSINESSES.flatMap(b=>b.checks.map((_,i)=>'industry-'+b.id+'-'+i))]);
  for(const [key,value] of Object.entries(raw.tasks||{}))if(allowedTasks.has(key)&&[1,2].includes(value))out.tasks[key]=value;
  out.months=Math.min(36,Math.max(0,Math.round(Number(raw.months)||0)));
  out.allowance=Math.min(100,Math.max(0,Math.round(Number(raw.allowance)||0)));
  out.theme=raw.theme==='dark'?'dark':'light';
  out.font=Math.min(1.25,Math.max(.9,Number(raw.font)||1));
  return out;
}
try{const saved=localStorage.getItem(STORAGE_KEY);if(saved)state=sanitizeState(JSON.parse(saved));}catch{storageAvailable=false;}
function persist(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}
  catch{storageAvailable=false;toast('Browser storage is unavailable here. Export a backup to keep your plan.');}
  updateNavProgress();
}
function toast(message){const box=$('#toast');box.textContent=message;box.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('visible'),3800);}
let themeOverride=(()=>{try{const t=new URLSearchParams(location.search).get('theme');return t==='dark'||t==='light'?t:'';}catch{return '';}})();
function applyPreferences(){
  if(themeOverride){state.theme=themeOverride;themeOverride='';}
  document.documentElement.dataset.theme=state.theme;
  document.documentElement.style.setProperty('--scale',state.font);
  $('meta[name=theme-color]')?.setAttribute('content',state.theme==='dark'?'#0b1530':'#f4f6f9');
  $('.u-theme')?.setAttribute('aria-label',`Switch to ${state.theme==='dark'?'day':'night'} mode`);
  requestAnimationFrame(moveCursor);
}

/* ───────────── progress ───────────── */
function allTasks(){
  const tasks=CHAPTERS.flatMap(c=>c.tasks.map((t,i)=>({id:c.id+'-'+i,title:t[0],href:'#roadmap/'+c.id})));
  const b=BUSINESSES.find(x=>x.id===state.profile.business);
  if(b)tasks.push(...b.checks.map((t,i)=>({id:'industry-'+b.id+'-'+i,title:t[0],href:'#paths/'+b.id})));
  return tasks;
}
function progress(){const tasks=allTasks(),done=tasks.filter(t=>state.tasks[t.id]===1).length,skipped=tasks.filter(t=>state.tasks[t.id]===2).length,total=tasks.length-skipped;return{done,skipped,total,percent:total?Math.round(done/total*100):0};}
function groupStats(prefix,count){let done=0,na=0;for(let i=0;i<count;i++){const v=state.tasks[prefix+'-'+i];if(v===1)done++;else if(v===2)na++;}const applicable=count-na;return{done,na,applicable,complete:applicable>0&&done===applicable};}
function phaseStats(ph){let done=0,total=0;for(const id of ph.chapters){const c=chapter(id),s=groupStats(id,c.tasks.length);done+=s.done;total+=s.applicable;}return{done,total,pct:total?Math.round(done/total*100):0};}
function updateNavProgress(){const n=$('#nav-progress');if(n)n.textContent=progress().percent+'%';}
function segs(prefix,count){return `<div class="segs" aria-hidden="true">${Array.from({length:count},(_,i)=>{const v=state.tasks[prefix+'-'+i];return `<i class="${v===1?'on':v===2?'na':''}"></i>`;}).join('')}</div>`;}
function cx(n,max=5){const cls=max===5?(n>=5?'max':n>=4?'hi':''):(n>=3?'max':n>=2?'hi':'');return `<span class="cx ${cls}" aria-label="${n} of ${max}">${Array.from({length:max},(_,k)=>`<i class="${k<n?'on':''}"></i>`).join('')}</span>`;}

/* ───────────── budget ───────────── */
const CAT_COLORS={'Admin':'#7a86a1','Plans & approvals':'#6d5bd0','Space & utilities':'#1590e3','Buildout':'#d0620c','Equipment':'#c99a06','Operations':'#12865a','People':'#0f9aa8','Launch':'#cc3b28','Your additions':'#0c1b3f'};
const allCosts=()=>[...COSTS,...state.customCosts];
function costStatus(c){return state.costStatus[c.id]||(state.budget[c.id]!==undefined?'estimated':'unpriced');}
function budgetTotals(){
  let upfront=0,monthly=0,unknown=0,priced=0,na=0;const byCat={};
  for(const c of allCosts()){
    if(state.costStatus[c.id]==='na'){na++;continue;}
    const v=state.budget[c.id];
    if(v===undefined||v===''){unknown++;continue;}
    priced++;const n=Number(v)||0;
    if(c.frequency==='monthly')monthly+=n;else upfront+=n;
    byCat[c.category]=(byCat[c.category]||0)+(c.frequency==='monthly'?n*state.months:n);
  }
  const reserve=monthly*state.months,allowance=upfront*state.allowance/100;
  return{upfront,monthly,unknown,priced,na,reserve,allowance,total:upfront+reserve+allowance,byCat};
}

/* ───────────── icons ───────────── */
const ICONS={
  food:'<path d="M3 17.5h18M5 17.5a7 7 0 0 1 14 0M12 10.5V8.2M10.2 8.2h3.6M4 20.5h16"/>',
  retail:'<path d="M5 8h14l-1.2 12.5H6.2L5 8Z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/>',
  salon:'<circle cx="6.5" cy="17.5" r="2.6"/><circle cx="17.5" cy="17.5" r="2.6"/><path d="M8.4 15.6 17 3.5M15.6 15.6 7 3.5"/>',
  trades:'<path d="M14.7 3.6a4.6 4.6 0 0 0-4.2 6.2L3.8 16.5a1.9 1.9 0 0 0 2.7 2.7l6.7-6.7a4.6 4.6 0 0 0 6.2-4.2l-2.8 2.1-2.6-.6-.6-2.6 2.1-2.8a4.6 4.6 0 0 0-.8-.8Z"/>',
  carwash:'<path d="M3.5 17v-3.3L5.6 9.5h12.8l2.1 4.2V17Z"/><circle cx="7.5" cy="17.4" r="1.6"/><circle cx="16.5" cy="17.4" r="1.6"/><path d="M8 2.8c0 .9-.9 1.4-.9 2.2a.9.9 0 0 0 1.8 0c0-.8-.9-1.3-.9-2.2ZM12 2c0 .9-.9 1.4-.9 2.2a.9.9 0 0 0 1.8 0c0-.8-.9-1.3-.9-2.2ZM16 2.8c0 .9-.9 1.4-.9 2.2a.9.9 0 0 0 1.8 0c0-.8-.9-1.3-.9-2.2Z"/>',
  auto:'<path d="M5 10.5V9l1.8-3h10.4L19 9v1.5Z"/><circle cx="8" cy="11.2" r="1.2"/><circle cx="16" cy="11.2" r="1.2"/><path d="M3 14.5h18M7 14.5v6M17 14.5v6M4 20.5h16"/>',
  home:'<path d="M3 11.2 12 4l9 7.2"/><path d="M5.2 9.6v10.9h13.6V9.6"/><path d="M10 20.5v-5.3h4v5.3"/>',
  online:'<rect x="3" y="4" width="18" height="15.5" rx="1.6"/><path d="M3 8h18M7.5 10.8h1.6l1.3 4.6h4.7l1.4-3.4H9.8"/><circle cx="11.2" cy="17.4" r=".5"/><circle cx="14.8" cy="17.4" r=".5"/>',
  professional:'<rect x="3" y="7" width="18" height="13" rx="1.6"/><path d="M9 7V4.8h6V7M3 12.2h18M10.8 12.2v2h2.4v-2"/>',
  cleaning:'<path d="M8.8 9.2h5.4l1.1 3v8.6H7.7v-8.6l1.1-3Z"/><path d="M10 9.2V6h3v3.2M13 6h3.6l1.2 2M17.6 4.4l1.9-1M18.4 7l2.1.3M18 9.4l1.8 1"/>',
  fitness:'<path d="M7 6.5v11M17 6.5v11M4 9v6M20 9v6M7 12h10M2.5 12H4M20 12h1.5"/>',
  manufacturing:'<path d="M3 20.5V11l5 3V11l5 3V11l5 3V5h3v15.5Z"/><path d="M7 17.5h2M12 17.5h2M17 17.5h1"/>',
  childcare:'<rect x="3.5" y="13" width="7.5" height="7.5"/><rect x="13" y="13" width="7.5" height="7.5"/><path d="m8.6 4.3 6.6 1.1-1.1 6.6-6.6-1.1Z"/><path d="M6 16.5h2.5M15.5 15.5l2.5 2.5"/>',
  events:'<path d="M3.5 7h17v3.2a1.9 1.9 0 0 0 0 3.6V17h-17v-3.2a1.9 1.9 0 0 0 0-3.6Z"/><path d="M9.2 7v10" stroke-dasharray="1.6 1.8"/><path d="m14.3 10.2.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2Z"/>',
  mobilefood:'<path d="M2.5 6.5h12v10h-12zM14.5 10h3.8l3.2 3.4v3.1h-7"/><circle cx="6.2" cy="17.6" r="1.7"/><circle cx="17.4" cy="17.6" r="1.7"/><path d="M2.5 9.5h12M5 9.5V12h7V9.5"/>',
  fuel:'<path d="M5 20.5V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15.5M3 20.5h13M7 8h5"/><path d="M14 10.5h2a1 1 0 0 1 1 1v5a1.5 1.5 0 0 0 3 0V8.2L17.6 5.8"/>',
  bar:'<path d="M4.5 4.5h15L12 13 4.5 4.5ZM12 13v7.5M8 20.5h8M7 7.8h10"/><path d="m15.5 4.5 2.5-2.5"/>',
  pets:'<ellipse cx="12" cy="16" rx="4.6" ry="3.6"/><circle cx="5.8" cy="10.6" r="1.8"/><circle cx="9.4" cy="6.6" r="1.8"/><circle cx="14.6" cy="6.6" r="1.8"/><circle cx="18.2" cy="10.6" r="1.8"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeoff:'<path d="M3 3l18 18M10.6 5.6A8.6 8.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.6 6.7C4 8.4 2.5 12 2.5 12s3.5 6.5 9.5 6.5a8.7 8.7 0 0 0 4.4-1.2"/><path d="M9.9 9.9a2.8 2.8 0 0 0 4 4"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>'
};
const icon=(name,cls='ic')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||''}</svg>`;

/* ───────────── page scaffolding ───────────── */
const page=(body,crumbs='')=>`<div class="page">${crumbs?`<nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>`:''}${body}</div>`;
function phead(label,title,lead,aside=''){return `<header class="phead"><div><span class="lbl">${label}</span><h1>${title}</h1>${lead?`<p class="lead">${lead}</p>`:''}</div>${aside?`<aside>${aside}</aside>`:''}</header><div class="ticks" aria-hidden="true"></div>`;}
function shead(label,title,deck=''){return `<header class="shead"><div><span class="lbl">${label}</span><h2>${title}</h2></div>${deck?`<p>${deck}</p>`:''}</header>`;}
function sourceLinks(keys){return keys.filter(k=>SOURCES[k]).map(k=>{const s=SOURCES[k];return `<a class="src" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.name)} <span aria-hidden="true">↗</span></a>`;}).join('');}
const cta=(href,label,cls='')=>`<a class="cta ${cls}" href="${href}"><span>${label}</span><i aria-hidden="true">→</i></a>`;

/* ───────────── HOME · the storefront elevation, standing on the ground line ───────────── */
const elevBox=()=>matchMedia('(max-width:700px)').matches?'170 0 1010 300':'0 0 1400 300';
function elevSVG(){
  const name=(state.profile.name||'Your name here').toUpperCase().slice(0,32);
  const fit=name.length>15?` textLength="${Math.min(460,name.length*26)}" lengthAdjust="spacingAndGlyphs"`:'';
  const d=(n)=>`style="--dl:${n}s"`;
  const hex=(x,y,n)=>`<g class="fade" ${d(1.4+n*.12)}><polygon points="${x-10},${y} ${x-5},${y-8.7} ${x+5},${y-8.7} ${x+10},${y} ${x+5},${y+8.7} ${x-5},${y+8.7}" fill="var(--sky)" stroke="var(--azure)" stroke-width="1.4"/><text x="${x}" y="${y+3.6}" text-anchor="middle" class="dt" style="font-size:10px;font-weight:600">${n}</text></g>`;
  return `<svg class="elev" viewBox="${elevBox()}" role="img" aria-label="Front elevation of a storefront standing on the ground line, with dimensions and four keynotes: the sign, the rooftop unit, the entrance, and the storefront.">
  <g>
   <path class="k" d="M0 292H1400"/>
   <path class="o draw" pathLength="1" ${d(0)} d="M420 292V67H1020V292"/>
   <path class="t draw" pathLength="1" ${d(.2)} d="M412 67H1028M412 73H1028M412 67V73M1028 67V73"/>
   <path class="hid fade" ${d(.9)} d="M420 81H1020"/>
   <rect class="g draw" pathLength="1" ${d(.35)} x="470" y="95" width="500" height="44"/>
   <text class="sign fade" ${d(1.1)} x="720" y="127" text-anchor="middle"${fit}>${e(name)}</text>
   <path class="o draw" pathLength="1" ${d(.45)} d="M450 152H990V160H450Z"/>
   <rect class="g draw" pathLength="1" ${d(.55)} x="450" y="168" width="540" height="112"/>
   <path class="o draw" pathLength="1" ${d(.65)} d="M450 196H990M510 168V280M570 168V280M630 168V280M690 168V292M750 168V292M810 168V280M870 168V280M930 168V280M450 280H690M750 280H990"/>
   <path class="o draw" pathLength="1" ${d(.75)} d="M694 292V200H746V292"/>
   <path class="t draw" pathLength="1" ${d(.85)} d="M702 208H738V270H702ZM702 246H738"/>
   <path class="t fade" ${d(1)} d="M462 272 494 206M476 276 506 214M822 272 854 206M836 276 866 214M942 272 974 206"/>
   <path class="t draw" pathLength="1" ${d(.6)} d="M1012 75V284H1004"/>
   <path class="o draw" pathLength="1" ${d(.5)} d="M822 67V42H922V67M832 50H912M832 56H912M832 62H912"/>
   <path class="o draw" pathLength="1" ${d(.5)} d="M562 67V54H586V67M552 54H596"/>
   <path class="t draw" pathLength="1" ${d(.7)} d="M436 176h10v10h-10ZM994 176h10v10h-10Z"/>
   <g class="tree"><circle class="draw" pathLength="1" ${d(.3)} cx="250" cy="168" r="72"/><path class="draw" pathLength="1" ${d(.5)} d="M204 150a48 48 0 0 1 52-34M216 196a56 56 0 0 0 76-12M288 132a40 40 0 0 1 14 40"/><path class="o draw" pathLength="1" ${d(.4)} d="M250 240V292M238 292H262"/></g>
   <g class="tree"><circle class="draw" pathLength="1" ${d(.4)} cx="352" cy="232" r="40"/><path class="o draw" pathLength="1" ${d(.5)} d="M352 272V292"/></g>
   <path class="o draw" pathLength="1" ${d(.6)} d="M1132 292V112M1132 116H1094M1082 116h24v8h-24ZM1124 292H1140"/>
  </g>
  <g class="fade" ${d(1.25)}>
   <path class="dim" d="M420 22H1020M420 16V60M1020 16V60M414 28 426 16M1014 28 1026 16"/>
   <text class="dt" x="720" y="15" text-anchor="middle">48'-0"</text>
   <path class="dim" d="M1062 67V292M1028 67H1070M1028 292H1070M1056 73 1068 61M1056 298 1068 286"/>
   <text class="dt" transform="translate(1080 180) rotate(-90)" text-anchor="middle">18'-0"</text>
   <path d="M1232 58H1250L1241 67Z" fill="none" stroke="var(--ink)" stroke-width="1.2"/><path d="M1241 58H1250L1241 67Z" fill="var(--ink)"/>
   <path class="t" d="M1200 67H1400" stroke-dasharray="3 4"/>
   <text class="note" x="1258" y="56">+18'-0" PARAPET</text>
  </g>
  ${hex(996,117,1)}${hex(944,46,2)}${hex(720,184,3)}${hex(540,238,4)}
 </svg>`;
}

/* ───────────── HOME · x-ray (isometric, drawn from 3-D coordinates) ───────────── */
const ISO={ox:300,oy:142};
const P=(x,y,z=0)=>[ISO.ox+(x-y)*0.866,ISO.oy+(x+y)*0.5-z];
const ptS=p=>{const q=P(...p);return q[0].toFixed(1)+','+q[1].toFixed(1);};
const pl=(a,c='',draw=true)=>`<polyline${draw?' pathLength="1"':''} class="${c}${draw?' draw':''}" points="${a.map(ptS).join(' ')}"/>`;
const pg=(a,c='',draw=true)=>`<polygon${draw?' pathLength="1"':''} class="${c}${draw?' draw':''}" points="${a.map(ptS).join(' ')}"/>`;
const box=(x0,y0,z0,x1,y1,z1,c='')=>pg([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],c)+pg([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],c)+pg([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],c);
const ring=(cx0,cy0,z,r,c='',n=28)=>pg(Array.from({length:n},(_,i)=>[cx0+r*Math.cos(i/n*Math.PI*2),cy0+r*Math.sin(i/n*Math.PI*2),z]),c,false);
const dot=(x,y,z,r=2.2)=>{const q=P(x,y,z);return `<circle class="ff" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${r}"/>`;};
const tl=(x,y,z,t,dx=0,dy=0,anchor='start')=>{const q=P(x,y,z);return `<text class="lbl2 c" x="${(q[0]+dx).toFixed(1)}" y="${(q[1]+dy).toFixed(1)}" text-anchor="${anchor}">${t}</text>`;};
const LAYER_GEO={
  site:{anchor:[-12,272,0],draw(){
    let s=pl([[-30,-30,0],[340,-30,0],[340,300,0],[-30,300,0],[-30,-30,0]],'d',false);
    s+=pl([[-30,212,0],[340,212,0]],'t')+pl([[-30,236,0],[340,236,0]]);
    for(const x of [46,92,138,184,230,276,322])s+=pl([[x,240,0],[x,300,0]]);
    s+=tl(340,-30,0,'P/L',6,4)+tl(330,300,0,'PARKING · 8 STALLS',-4,14,'end');
    return s;}},
  shell:{anchor:[300,150,98],draw(){
    const H=110;let s='';
    s+=pg([[0,0,0],[300,0,0],[300,200,0],[0,200,0]],'f');
    s+=pg([[0,0,0],[0,200,0],[0,200,H],[0,0,H]],'f t')+pg([[0,0,0],[300,0,0],[300,0,H],[0,0,H]],'f t');
    s+=pl([[0,0,H],[300,0,H]],'d t',false)+pl([[0,0,H],[0,200,H]],'d t',false);
    s+=pl([[300,0,0],[300,0,H]])+pl([[300,200,0],[300,200,H]])+pl([[0,200,0],[0,200,H]])+pl([[0,0,0],[0,0,H]],'t');
    s+=pl([[0,200,H],[300,200,H],[300,0,H]]);
    s+=pg([[18,200,12],[118,200,12],[118,200,80],[18,200,80]],'f')+pl([[68,200,12],[68,200,80]],'t');
    s+=pg([[172,200,12],[282,200,12],[282,200,80],[172,200,80]],'f')+pl([[227,200,12],[227,200,80]],'t');
    s+=pg([[128,200,0],[160,200,0],[160,200,86],[128,200,86]]);
    s+=pg([[300,60,0],[300,90,0],[300,90,86],[300,60,86]]);
    s+=pg([[180,0,0],[180,128,0],[180,128,96],[180,0,96]],'f t')+pg([[180,168,0],[180,200,0],[180,200,96],[180,168,96]],'f t');
    s+=pl([[60,0,0],[60,72,0],[0,72,0]],'t')+pl([[60,72,0],[60,72,96]],'t')+pl([[60,0,96],[60,72,96],[0,72,96]],'t');
    s+=box(150,30,0,166,150,38,'f');
    for(const [tx,ty] of [[34,108],[34,156],[92,108],[92,156]])s+=box(tx,ty,0,tx+20,ty+20,27,'f t');
    s+=box(196,4,0,296,30,36,'f')+box(206,94,0,264,112,34,'f t')+box(276,122,0,296,176,62,'f t');
    s+=tl(100,140,0,'DINING',0,0,'middle')+tl(236,56,0,'KITCHEN',0,0,'middle')+tl(34,60,0,'RR',0,0,'middle');
    return s;}},
  electrical:{anchor:[300,24,42],draw(){
    let s=box(312,250,0,334,272,16,'f');
    s+=pl([[323,250,-2],[323,24,-2],[300,24,-2],[300,24,30]],'d',false);
    s+=pg([[300,16,30],[300,32,30],[300,32,54],[300,16,54]],'f');
    s+=pg([[248,0,32],[272,0,32],[272,0,80],[248,0,80]],'f')+pl([[260,0,36],[260,0,76]],'t');
    s+=pl([[300,24,54],[300,24,102],[260,24,102],[260,0,102],[260,0,80]],'w');
    s+=pl([[260,24,102],[260,100,102],[110,100,102],[110,40,102]])+pl([[200,100,102],[200,160,102],[30,160,102]]);
    s+=pl([[240,24,102],[240,17,102],[240,17,36]]);
    for(const [a,b] of [[60,60],[130,60],[60,140],[130,140],[240,72],[240,150]])s+=pg([[a-9,b-4,104],[a+9,b-4,104],[a+9,b+4,104],[a-9,b+4,104]],'f');
    s+=tl(300,32,30,'METER',8,10)+tl(248,0,32,'PANEL',-4,12,'end')+tl(334,272,16,'XFMR',6,6);
    return s;}},
  plumbing:{anchor:[324,98,-14],draw(){
    let s=pl([[340,170,-4],[300,170,-4]],'d',false)+pl([[300,170,-4],[300,170,12]]);
    s+=pl([[300,170,12],[262,170,12],[262,120,12],[180,120,12],[180,86,12],[64,86,12],[64,40,12],[52,40,12]]);
    s+=box(282,180,0,296,196,46,'f')+box(206,140,0,256,160,34,'f')+box(284,96,24,296,110,32,'f');
    s+=box(10,8,0,26,26,15,'f')+box(34,4,26,52,16,31,'f');
    s+=pl([[18,18,-6],[18,98,-6],[230,98,-6],[230,150,-6]],'d',false)+pl([[230,98,-6],[312,98,-6]],'d',false);
    s+=box(312,84,-24,336,112,-2,'f d')+pl([[336,98,-12],[340,98,-12]],'d',false);
    s+=ring(230,150,0,5)+box(304,164,0,314,176,10,'f');
    s+=tl(336,112,-24,'GREASE INTERCEPTOR',6,8)+tl(296,196,46,'W.H.',4,-2)+tl(314,176,10,'BFP',4,8);
    return s;}},
  mechanical:{anchor:[78,92,136],draw(){
    let s=box(50,70,110,105,115,134,'f');
    s+=pl([[78,92,110],[78,92,104],[20,92,104]],'w')+pl([[78,92,104],[170,92,104]],'w');
    for(const x of [30,120,162])s+=pg([[x-5,87,103],[x+5,87,103],[x+5,97,103],[x-5,97,103]],'f');
    s+=box(196,2,74,296,34,92,'f');
    s+=pl([[246,18,92],[246,18,110]],'w')+box(234,6,110,258,30,122,'f');
    s+=box(205,60,110,232,86,124,'f')+pl([[218,73,110],[218,73,100],[218,40,100]]);
    s+=tl(105,70,134,'RTU',6,0)+tl(258,6,122,'EXHAUST FAN',6,-2)+tl(196,34,92,'TYPE I HOOD',-6,6,'end')+tl(232,60,124,'MUA',6,-2);
    return s;}},
  fire:{anchor:[150,100,100],draw(){
    let s=pl([[292,196,0],[292,196,100]],'w')+pg([[300,184,16],[300,196,16],[300,196,28],[300,184,28]],'f');
    s+=pl([[292,196,100],[292,40,100]],'w');
    for(const y of [40,100,160])s+=pl([[292,y,100],[10,y,100]],'t');
    for(const x of [30,90,150,210,270])for(const y of [40,100,160])s+=dot(x,y,100);
    s+=box(162,192,0,170,199,20,'f')+box(286,44,0,294,52,20,'f')+box(288,36,40,296,44,64,'f');
    for(const x of [214,246,278])s+=dot(x,18,74,1.8);
    s+=tl(292,196,100,'RISER',6,-4)+tl(300,196,28,'FDC',6,8);
    return s;}},
  egress:{anchor:[144,224,0],draw(){
    let s=pl([[252,140,1],[200,140,1],[144,140,1],[144,212,1]],'d w',false)+pg([[144,224,1],[137,210,1],[151,210,1]],'ff',false);
    s+=pl([[240,75,1],[308,75,1]],'d w',false)+pg([[320,75,1],[307,68,1],[307,82,1]],'ff',false);
    s+=pl([[46,124,1],[118,124,1],[144,140,1]],'d',false);
    s+=pg([[134,200,90],[154,200,90],[154,200,98],[134,200,98]],'ff')+pg([[300,66,90],[300,84,90],[300,84,98],[300,66,98]],'ff');
    s+=pl(Array.from({length:13},(_,i)=>{const a=i/12*Math.PI/2;return [128+32*Math.cos(a),200+32*Math.sin(a),0];}),'t');
    s+=pg([[122,204,0],[166,204,0],[166,228,0],[122,228,0]],'f');
    for(const x of [130,140,150,160])s+=pl([[x,206,0],[x,226,0]],'t');
    s+=ring(30,38,1,24,'d');
    s+=pg([[0,240,0],[46,240,0],[46,300,0],[0,300,0]],'f');
    for(const y of [252,266,280,294])s+=pl([[2,y,0],[12,y-10,0]],'t');
    s+=tl(154,200,98,'EXIT',-30,-6)+tl(30,38,1,'60" TURN',0,22,'middle');
    return s;}},
  sign:{anchor:[150,200,107],draw(){
    let s=pg([[36,200,88],[264,200,88],[264,200,106],[36,200,106]],'f w');
    for(let i=0;i<7;i++)s+=pg([[52+i*30,200,92],[70+i*30,200,92],[70+i*30,200,102],[52+i*30,200,102]],'ff');
    s+=pl([[330,262,0],[330,262,64]],'w')+pg([[314,262,64],[346,262,64],[346,262,90],[314,262,90]],'f');
    return s;}}
};
const LAYER_ORDER=['site','shell','plumbing','electrical','mechanical','fire','egress','sign'];
const LAYER_COLOR={site:'--l-site',shell:'--l-shell',electrical:'--l-elec',plumbing:'--l-plumb',mechanical:'--l-mech',fire:'--l-fire',egress:'--l-egress',sign:'--l-sign'};
const LAYER_DASH={site:true,plumbing:true,egress:true};
const VB={x:0,y:18,w:640,h:458};
let CAD_CACHE='';
function cadSVG(){
  if(!CAD_CACHE)CAD_CACHE=LAYER_ORDER.map((id,i)=>`<g class="ly" data-ly="${id}" style="--c:var(${LAYER_COLOR[id]});--dl:${(i*.16).toFixed(2)}s">${LAYER_GEO[id].draw()}</g>`).join('');
  return `<svg class="cad${ui.layer?' isolate':''}" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" role="img" aria-label="Isometric x-ray of a typical storefront showing eight systems: zoning and site, building, electrical, plumbing, ventilation, fire protection, exits and accessibility, and signage. Illustrative only.">${CAD_CACHE}<text class="lbl2" x="20" y="462">AXONOMETRIC · NOT TO SCALE · ILLUSTRATIVE</text></svg>`;
}
function pinPos(id){const q=P(...LAYER_GEO[id].anchor);return{x:((q[0]-VB.x)/VB.w*100).toFixed(2),y:((q[1]-VB.y)/VB.h*100).toFixed(2)};}
function xrayHTML(){
  const pins=LAYERS.map((l,i)=>{const p=pinPos(l.id);return `<button class="xr-pin" data-layer="${l.id}" style="--x:${p.x}%;--y:${p.y}%;--c:var(${LAYER_COLOR[l.id]})" aria-label="${e(l.name)}: ${e(l.q)}">${i+1}</button>`;}).join('');
  const rows=LAYERS.map(l=>`<div class="lyr" data-row="${l.id}" style="--c:var(${LAYER_COLOR[l.id]})"><button class="lyr-main" data-layer="${l.id}" aria-pressed="false"><i class="sw${LAYER_DASH[l.id]?' d':''}" aria-hidden="true"></i><span>${e(l.name)}</span><code>${l.code}</code></button><button class="lyr-eye" data-eye="${l.id}" aria-label="Hide ${e(l.name)} layer" aria-pressed="false">${icon('eye','')}</button></div>`).join('');
  return `<div class="xray"><div class="xr-stage"><div class="xr-canvas">${cadSVG()}${pins}</div><div class="xr-foot"><span>Tap a number or a layer</span><button data-action="xr-all">Show every layer</button></div></div><div class="xr-side"><div class="xr-layers" role="group" aria-label="Drawing layers">${rows}</div><div class="xr-info" id="xr-info" aria-live="polite">${xrInfo()}</div></div></div>`;
}
function xrInfo(){
  const l=LAYERS.find(x=>x.id===ui.layer);
  if(!l)return `<div class="xi-code">8 systems · 8 reviewers</div><h3>Pick a layer.</h3><p>Each system in the space has its own question to answer, its own reviewer, and its own invoice. Turn one on to see what it is, who signs off, what tends to surprise people, and a rough ballpark.</p>`;
  const n=LAYERS.indexOf(l)+1;
  return `<div class="xi-code" style="--c:var(${LAYER_COLOR[l.id]})">${pad(n)} · ${l.code} · ${e(l.name)}</div><h3>${e(l.q)}</h3><p>${e(l.text)}</p><dl><div><dt>Who reviews it</dt><dd>${e(l.who)}</dd></div><div><dt>What surprises people</dt><dd>${e(l.surprise)}</dd></div><div><dt>Ballpark</dt><dd class="bp">${e(l.ballpark)}</dd></div></dl><a class="go" href="#roadmap/${l.chapter}">Stage ${pad(chapterNo(l.chapter))} · ${e(chapter(l.chapter).short)}</a>`;
}
function syncXray(){
  const svg=$('.cad');if(!svg)return;
  svg.classList.toggle('isolate',!!ui.layer);
  $$('.cad .ly[data-ly]').forEach(g=>{g.classList.toggle('on',g.dataset.ly===ui.layer);g.classList.toggle('off',ui.hidden.has(g.dataset.ly));});
  $$('.xr-pin').forEach(b=>{const id=b.dataset.layer;b.classList.toggle('on',id===ui.layer);b.classList.toggle('dim',!!ui.layer&&id!==ui.layer);b.classList.toggle('off',ui.hidden.has(id));});
  $$('.lyr').forEach(r=>{const id=r.dataset.row,on=id===ui.layer,hid=ui.hidden.has(id);r.classList.toggle('on',on);r.classList.toggle('hidden',hid);r.querySelector('.lyr-main').setAttribute('aria-pressed',String(on));const eye=r.querySelector('.lyr-eye');eye.innerHTML=icon(hid?'eyeoff':'eye','');eye.setAttribute('aria-pressed',String(hid));eye.setAttribute('aria-label',`${hid?'Show':'Hide'} ${LAYERS.find(x=>x.id===id).name} layer`);});
  const info=$('#xr-info');if(info)info.innerHTML=xrInfo();
}

/* ───────────── HOME · valves, seats, boring log ───────────── */
function valvesHTML(){
  return `<div class="valves" id="valves" style="--open:${((ui.valve+.5)/VALVES.length*100).toFixed(1)}%">${VALVES.map((v,i)=>`<button class="valve ${i<=ui.valve?'on':''} ${i===ui.valve?'sel':''} ${v.end?'end':''}" data-valve="${i}" aria-pressed="${i===ui.valve}">${VALVE_SVG}<b>${e(v.n)}</b><small>${pad(i+1)}</small></button>`).join('')}</div><div class="valve-info" id="valve-info">${valveInfo()}</div><div class="valve-hint"><span>Each valve has to open before anything flows past it.</span><button data-action="valve-next">Open the next valve →</button></div>`;
}
function valveInfo(){const v=VALVES[ui.valve];return `<span class="n">${pad(ui.valve+1)}</span><div><h3>${e(v.n)}</h3><p>${e(v.q)}</p></div><dl><div><dt>Who opens it</dt><dd>${e(v.who)}</dd></div><div><dt>Ballpark · wait</dt><dd>${e(v.bp)} · ${e(v.wait)}</dd></div></dl><a class="go" href="#roadmap/${v.ch}">Stage ${pad(chapterNo(v.ch))}</a>`;}
function syncValves(){const w=$('#valves');if(!w)return;w.style.setProperty('--open',((ui.valve+.5)/VALVES.length*100).toFixed(1)+'%');$$('.valve').forEach((b,i)=>{b.classList.toggle('on',i<=ui.valve);b.classList.toggle('sel',i===ui.valve);b.setAttribute('aria-pressed',String(i===ui.valve));});$('#valve-info').innerHTML=valveInfo();}
function seatsOut(){
  const n=ui.seats;
  const items=[n<=49?['a','1 exit can be enough','At 49 people or fewer — if travel distance and other limits are met.']:n<=500?['b','2 exits required','The moment you pass 49, the code wants a second way out.']:['c','3 exits required','Above 500 occupants.'],
    n<50?['a','Usually Group B','Small dining rooms under 50 are typically treated like a business.']:['b','Group A-2 — assembly','Stricter exits, panic hardware on doors, and more fire review.'],
    n>=100?['c','Sprinklers likely required','The model code’s trigger for restaurants and bars: 100 people (or 5,000 sq ft).']:['a','No sprinkler trigger yet','At 100 people the model code usually requires them.']];
  return `<div class="big">${n}<small>people · ≈${(n*15).toLocaleString('en-US')} sq ft of dining</small></div><ul>${items.map(x=>`<li class="${x[0]}"><i>${x[0]==='a'?'✓':'!'}</i><span><b>${e(x[1])}</b>${e(x[2])}</span></li>`).join('')}</ul><a class="go" href="#codes" data-scroll-to="load">Run your own floor plan</a>`;
}
function seatGrid(){return Array.from({length:200},(_,i)=>`<i class="${i<ui.seats?(i<49?'a':i<99?'b':'c'):''}"></i>`).join('');}
const LOG_PATTERNS=[
  'radial-gradient(circle,rgba(238,244,255,.55) 1px,transparent 1.5px) 0 0/7px 7px',
  'linear-gradient(90deg,rgba(238,244,255,.5) 0 6px,transparent 6px) 0 0/10px 6px',
  'repeating-linear-gradient(-45deg,rgba(238,244,255,.5) 0 1px,transparent 1px 6px)',
  'radial-gradient(circle,transparent 2px,rgba(238,244,255,.5) 2.4px,rgba(238,244,255,.5) 3px,transparent 3.4px) 0 0/10px 9px',
  'linear-gradient(rgba(238,244,255,.5) 1px,transparent 1px) 0 0/100% 6px',
  'repeating-linear-gradient(45deg,rgba(238,244,255,.45) 0 1px,transparent 1px 7px),repeating-linear-gradient(-45deg,rgba(238,244,255,.45) 0 1px,transparent 1px 7px)'
];
function feeLog(){
  return `<table class="log"><thead><tr><th>Depth</th><th>Log</th><th>What shows up</th><th>Ballpark</th><th>Why it surprises people</th></tr></thead><tbody>${FEES.map((f,i)=>`<tr><td class="dp">−${22+i*2}'-0"</td><td class="sw"><i style="--p:${LOG_PATTERNS[i%LOG_PATTERNS.length]}"></i></td><td class="nm"><a href="#roadmap/${f[3]}">${e(f[0])}</a></td><td class="am">${e(f[1])}</td><td class="nt">${e(f[2])}</td></tr>`).join('')}</tbody></table><p class="log-note"><b>Ballpark</b>Rough orientation for many U.S. markets in 2025–26 — not quotes, and not advice. Prices swing widely by city, building, and scope. Get written quotes before you commit.</p>`;
}

/* ───────────── 00 · START ───────────── */
function startPage(){
  const grade=`<section class="grade"><div class="grade-in"><h1>Everything I wish I’d known before I opened.</h1><div class="story"><p>My first business burned down. Before that, I had no idea how much went into opening one — <strong>hazard codes</strong> I had never heard of, <strong>blueprints</strong> that cost far more than I expected, and <strong>fees that kept showing up</strong> after I thought I had paid them all.</p><p>This is the guide I needed. It starts with what customers see, and digs down to everything you actually pay for.</p><span class="sig"><b>Helal Safi</b>founder, SafiSolutions</span></div></div><div class="elev-wrap">${elevSVG()}</div></section>`;
  const keys=KEYNOTES.map((k,i)=>`<li><b><svg viewBox="0 0 24 22" aria-hidden="true"><polygon points="1,11 6.5,1.5 17.5,1.5 23,11 17.5,20.5 6.5,20.5"/></svg><span>${i+1}</span></b><span><strong>${e(k[0])}</strong> — ${e(k[1])}</span></li>`).join('');
  const L=(n,id,depth,kick,title,deck,body,dark=false)=>`<section class="stratum st${n}${dark?' dark':''}" id="${id}"><div class="st-in"><header class="st-head">${datum(depth)}<div><span class="st-kick">${kick}</span><h2>${title}</h2></div>${deck?`<p>${deck}</p>`:''}</header>${body}</div></section>`;
  const gb=`<section class="stratum st1" id="grade-line"><div class="st-in"><header class="st-head">${datum('±0\'-0" grade')}<div><span class="st-kick">At the sidewalk · what customers see</span><h2>Four things on this storefront need approval.</h2></div><p>The sign, the rooftop unit, the entrance, and the glass. And that’s only what shows. <a class="go down" href="#layer-1" data-scroll-to="layer-1">Dig in ↓</a></p></header><ol class="keys">${keys}</ol></div></section>`;
  /* st1 grade line · st2–st4 light soils · st5–st8 dark, down to bedrock */
  const l1=L(2,'layer-1','−2\'-0"','Layer 1 · Everyone tells you','The paperwork.','The part every checklist covers. It matters — and it’s the cheapest, fastest part of the whole job.',`<div class="shallow">${SHALLOW.map(s=>`<a href="#roadmap/${s[3]}"><small>Stage ${pad(chapterNo(s[3]))}</small><h3>${e(s[0])}</h3><p>${e(s[1])}</p><span class="amt">${e(s[2])}</span></a>`).join('')}</div>`);
  const l2=L(3,'layer-2','−6\'-0"','Layer 2 · Someone mentions','Licenses, insurance, the lease.','A friend or a banker brings these up. Few people explain how they depend on each other.',`<div class="mentions">${MENTIONS.map(m=>`<div><b>${e(m.k)}</b><h3>${e(m.t)}</h3><p>${e(m.p)}</p><ul>${m.items.map(x=>`<li><span>${e(x[0])}</span><span>${e(x[1])}</span></li>`).join('')}</ul><a class="go" href="#roadmap/${m.ch}">Stage ${pad(chapterNo(m.ch))}</a></div>`).join('')}</div>`);
  const l3=L(4,'layer-3','−10\'-0"','Layer 3 · You find out at the counter','Approvals open in order.','Nothing flows until each valve opens. Sign a lease before zoning, or build before the permit, and you pay for it twice.',valvesHTML());
  const l4=L(5,'layer-4','−14\'-0"','Layer 4 · The building tells you','Eight systems hide in the walls.','Power, water, grease, air, fire, exits, signs, and the zoning around it. Each one has its own reviewer and its own bill.',xrayHTML(),true);
  const l5=L(6,'layer-5','−18\'-0"','Layer 5 · The code tells you','Add seats, add rules.','Codes assume a headcount from your floor area. Slide the number of diners and watch the requirements change.',`<div class="seats"><div><div class="seat-grid" id="seat-grid" aria-hidden="true">${seatGrid()}</div><div class="seat-key"><span><i style="background:#9fdcff"></i>1–49 · one exit can work</span><span><i style="background:#ffe48a"></i>50–99 · assembly rules</span><span><i style="background:#ffb3a6"></i>100+ · sprinklers likely</span><span>Each square = 1 person</span></div><div class="seat-ctl"><label for="seat-range">Diners at once <output id="seat-n">${ui.seats}</output></label><input id="seat-range" type="range" min="0" max="200" step="1" value="${ui.seats}" data-seats></div></div><div class="seat-out" id="seat-out">${seatsOut()}</div></div>`,true);
  const l6=L(7,'layer-6','−22\'-0"','Layer 6 · The invoices tell you','The fees nobody mentions.','Logged like a soil boring: each layer is a cost owners most often say they never saw coming.',feeLog(),true);
  const l7=L(8,'bedrock','−52\'-0"','Bedrock','Build on something solid.','',`<div class="bedrock"><div><p>Work down the list from stage one, or start from your business type for its own checklist, equipment, hazards, and hidden costs. Everything you check off saves in this browser and prints as a clean plan.</p><div class="ctas">${cta('#roadmap','Start at stage 01','solid')}${cta('#plan','Open my blueprint')}</div></div><div class="typelist">${BUSINESSES.map(b=>`<a href="#paths/${b.id}">${icon(b.icon)}<span>${e(b.name)}</span><small>from ${e((b.startup.match(/\$[\d.,]+[kM]?/)||[''])[0])}</small></a>`).join('')}</div></div>`,true);
  return `${grade}<div class="strata" id="strata">${gb}${l1}${l2}${l3}${l4}${l5}${l6}${l7}<div class="flow-wrap" aria-hidden="true"><i class="flowline"></i></div></div>`;
}

/* ───────────── 01 · ROADMAP ───────────── */
function roadmapPage(){
  const p=progress();
  const aside=`<div class="ch-meta"><div><dt>Checked</dt><dd><b style="font:700 1.6rem/1 var(--f-mono);letter-spacing:-.06em;color:var(--green)">${p.percent}%</b></dd></div><div><dt>Tasks</dt><dd>${p.done} of ${p.total}${p.skipped?` · ${p.skipped} N/A`:''}</dd></div></div><a class="go" href="#plan" style="margin-top:12px">My blueprint</a>`;
  const head=phead(`${CHAPTERS.length} stages · ${CHAPTERS.length*5} tasks · ${GATES.length} hold points`,'The opening roadmap.',`Everything between “I have an idea” and “we’re open,” in the order it usually has to happen. Each stage has the work, the hold point, the trap, and who to ask — check tasks off as you go.`,aside);
  const jump=`<nav class="phase-jump" aria-label="Phases">${PHASES.map(ph=>{const s=phaseStats(ph);return `<a href="#roadmap" data-scroll-to="phase-${ph.id}"><small>Phase ${ph.n} · weeks ${ph.start}–${ph.end}</small>${e(ph.name)}<div class="pbar"><i style="--w:${s.pct}%"></i></div></a>`;}).join('')}</nav>`;
  const phases=PHASES.map(ph=>`<section class="phase" id="phase-${ph.id}"><header class="ph-head"><span class="ph-n">${ph.n}</span><div><h2>${e(ph.name)}</h2><p>${e(ph.deck)}</p></div><span class="tag time">Typically weeks ${ph.start}–${ph.end}</span></header><div class="sched"><div class="sched-h"><span>No.</span><span>Stage</span><span>Hold point — don’t pass until</span><span>Typical time</span><span>Your progress</span></div>${ph.chapters.map(schedRow).join('')}</div></section>`).join('');
  return page(head+jump+phases+`<p class="muted small" style="margin-top:32px">Some work runs in parallel, and your agencies and project team set the real order. Home-based, online, and mobile businesses can mark space-related tasks “not applicable” once they confirm they don’t apply.</p>`);
}
function schedRow(id){
  const c=chapter(id),n=chapterNo(id),s=groupStats(id,c.tasks.length);
  return `<a class="sched-r${s.complete?' complete':''}" href="#roadmap/${c.id}"><span class="no">${pad(n)}</span><span class="st"><b>${e(c.title)}</b><small>${e(c.deck)}</small></span><span class="hp">${e(c.gate)}</span><span class="tm">${e(c.time)}</span><span class="pg">${segs(c.id,c.tasks.length)}<small>${s.complete?'<span class="done-mark">Done</span>':`${s.done} of ${s.applicable}`}</small></span></a>`;
}
function taskHTML(id,t,num){
  const v=state.tasks[id];
  return `<div class="task ${v===1?'done':v===2?'skipped':''}" data-row="${id}"><span class="tn">${num}</span><input class="box" type="checkbox" id="tk-${id}" data-task="${id}" ${v===1?'checked':''} ${v===2?'disabled':''}><label class="tt" for="tk-${id}">${e(t[0])}</label><p>${e(t[1])}</p><button class="na" data-na="${id}">${v===2?'↺ Put back on my list':'Not applicable to me'}</button></div>`;
}
function bpTable(rows,title='Ballpark · rough U.S. ranges'){return `<div class="bp-table"><header><span>${title}</span><b>Not a quote</b></header>${rows.map(r=>`<div><span>${e(r[0])}</span><span>${e(r[1])}</span></div>`).join('')}</div>`;}
function chMeta(c){
  const s=groupStats(c.id,c.tasks.length);
  return `<div><dt>Progress</dt><dd>${segs(c.id,c.tasks.length)}<span class="mono" style="display:block;margin-top:8px;font-size:.66rem;color:var(--ink-2)">${s.complete?'<span class="done-mark">Stage done</span>':`${s.done} of ${s.applicable} checked${s.na?` · ${s.na} N/A`:''}`}</span></dd></div><div><dt>Typical time</dt><dd>${e(c.time)}</dd></div><div><dt>End with</dt><dd style="color:var(--ink-2)">${e(c.deliver)}</dd></div>`;
}
function chapterPage(id){
  const c=chapter(id);if(!c)return roadmapPage();
  const idx=CHAPTERS.indexOf(c),n=idx+1,ph=phaseOf(id),prev=CHAPTERS[idx-1],next=CHAPTERS[idx+1];
  const crumbs=`<a href="#roadmap">Roadmap</a><span>/</span><span>Phase ${ph.n} · ${e(ph.name)}</span><span>/</span><b>Stage ${pad(n)}</b>`;
  const body=`<header class="ch-head"><div class="ch-num" aria-hidden="true">${pad(n)}</div><div><span class="lbl">Stage ${pad(n)} of ${CHAPTERS.length} · ${e(c.short)}</span><h1>${e(c.title)}</h1><p class="lead">${e(c.deck)}</p></div><dl class="ch-meta" id="ch-meta">${chMeta(c)}</dl></header>
  <div class="hold">${VALVE_SVG}<p><small>Hold point — don’t pass this valve until it’s true</small>${e(c.gate)}.</p></div>
  <div class="ch-grid"><section class="ch-body"><h2>Why it’s in the plan</h2><p>${e(c.why)}</p><div class="sub"><h2>The work</h2><p>Checks save to My blueprint</p></div><div class="tasks">${c.tasks.map((t,i)=>taskHTML(c.id+'-'+i,t,`${n}.${i+1}`)).join('')}</div><div class="wish"><small>What people wish they’d known</small><p>${e(c.wish)}</p></div>${c.ballpark?.length?bpTable(c.ballpark):''}</section>
  <aside class="side"><div class="panel warn"><small>The easy thing to miss</small><p>${e(c.trap)}</p></div><div class="panel"><small>Who to ask</small><p>${e(c.ask)}</p><p style="margin-top:10px"><a class="go" href="#kit/ask">Questions to bring them</a></p></div><div class="panel"><small>Official starting points</small>${sourceLinks(c.sources)}</div></aside></div>
  <nav class="pager" aria-label="Stages">${prev?`<a href="#roadmap/${prev.id}"><small>← Stage ${pad(n-1)}</small><b>${e(prev.short)}</b></a>`:'<a href="#roadmap"><small>← Back</small><b>All stages</b></a>'}${next?`<a href="#roadmap/${next.id}"><small>Stage ${pad(n+1)} →</small><b>${e(next.short)}</b></a>`:'<a href="#plan"><small>Finished →</small><b>Open my blueprint</b></a>'}</nav>`;
  return page(body,crumbs);
}

/* ───────────── 02 · BUSINESS TYPES ───────────── */
function pathsPage(){
  const kinds=['All',...new Set(BUSINESSES.map(b=>b.kind))];
  const items=BUSINESSES.filter(b=>ui.pathFilter==='All'||b.kind===ui.pathFilter);
  const head=phead(`${BUSINESSES.length} business types`,'Different businesses. Different moving parts.','A café needs a very different equipment list from a cleaning service. Pick yours for the approvals, hazards, materials, and costs that hide inside it — then add it to your plan.');
  const filters=`<div class="filters" role="group" aria-label="Filter business types">${kinds.map(k=>`<button class="filter ${ui.pathFilter===k?'on':''}" data-path-filter="${e(k)}" aria-pressed="${ui.pathFilter===k}">${e(k)}<span>${k==='All'?BUSINESSES.length:BUSINESSES.filter(b=>b.kind===k).length}</span></button>`).join('')}</div>`;
  const grid=`<div class="types">${items.map(b=>{const avg=Math.round(b.scores.reduce((a,c)=>a+c,0)/b.scores.length);return `<a class="type" href="#paths/${b.id}">${icon(b.icon)}<h3>${e(b.name)}</h3><span class="kind">${e(b.kind)}</span><span class="row"><span>${e(b.startup)}</span>${cx(avg)}</span>${state.profile.business===b.id?'<span class="yours">Yours</span>':''}</a>`;}).join('')}</div>`;
  return page(head+filters+grid+`<p class="muted small" style="margin-top:18px">Representative types, not exhaustive license lists. A hybrid business may need pieces of more than one. Startup ranges and complexity bars are rough and relative — for orientation only.</p>`);
}
function pathPage(id){
  const b=BUSINESSES.find(x=>x.id===id);if(!b)return pathsPage();
  const idx=BUSINESSES.indexOf(b),sel=state.profile.business===b.id;
  const prev=BUSINESSES[(idx-1+BUSINESSES.length)%BUSINESSES.length],next=BUSINESSES[(idx+1)%BUSINESSES.length];
  const hz=HAZARD_MATRIX[b.id]||[];
  const crumbs=`<a href="#paths">Business types</a><span>/</span><b>${e(b.name)}</b>`;
  const body=`<header class="p-head"><div class="p-icon">${icon(b.icon,'ic')}</div><div><span class="lbl">${e(b.kind)} · ${e(b.tag)}</span><h1>${e(b.name)}</h1><p class="lead">${e(b.intro)}</p></div><button class="cta ${sel?'':'solid'}" data-select-business="${b.id}"><span>${sel?'✓ In my blueprint':'Use this business type'}</span><i aria-hidden="true">${sel?'×':'→'}</i></button></header>
  <div class="p-stats"><div><small>Typical occupancy group</small><b>${e(b.occupancy)}</b></div><div><small>Rough startup range</small><b class="startup">${e(b.startup)}</b></div><div><small>Relative complexity</small><div class="scores">${SCORE_LABELS.map((l,i)=>`<div><span>${l}</span>${cx(b.scores[i])}</div>`).join('')}</div></div></div>
  <div class="hold" style="margin-top:28px">${VALVE_SVG}<p><small>Before you commit</small>${e(b.before)}</p></div>
  <div class="p-cols"><section class="ch-body"><div class="sub" style="margin-top:0"><h2>Work specific to this business</h2><p>${sel?'In your plan':'Adds to your plan when selected'}</p></div><div class="tasks">${b.checks.map((t,i)=>taskHTML('industry-'+b.id+'-'+i,t,`${pad(idx+1)}.${i+1}`)).join('')}</div>
  <h2 style="margin-top:48px">Hazards to review with qualified people</h2><div class="hz-tags">${b.hazards.map(h=>`<span>${e(h)}</span>`).join('')}</div>
  <div class="bp-table" style="margin-top:26px"><header><span>Hazard profile · relative</span><b style="color:var(--ink-3)">0–3</b></header><div style="display:block;padding:12px 0"><div class="scores">${HAZARD_TYPES.map((t,i)=>`<div><span>${t}</span>${cx(hz[i]||0,3)}</div>`).join('')}</div></div></div>
  <p class="muted small" style="margin-top:12px">Topics to discuss — not a hazard assessment, an equipment specification, or a safe-work procedure.</p></section>
  <aside class="side"><div class="panel"><small>Materials &amp; equipment</small><ul class="mats">${b.materials.map(m=>`<li>${e(m)}</li>`).join('')}</ul></div><div class="panel warn"><small>Costs that hide here</small><ul class="redlist">${b.extras.map(x=>`<li>${e(x)}</li>`).join('')}</ul><a class="go" href="#costs">Price them</a></div><div class="panel"><small>Official starting points</small>${sourceLinks(b.sources)}</div></aside></div>
  <nav class="pager" aria-label="Business types"><a href="#paths/${prev.id}"><small>← Previous</small><b>${e(prev.name)}</b></a><a href="#paths/${next.id}"><small>Next →</small><b>${e(next.name)}</b></a></nav>`;
  return page(body,crumbs);
}

/* ───────────── 03 · COSTS ───────────── */
function costsPage(){
  const head=phead(`${COSTS.length} cost lines · every one starts blank`,'Look past the sticker price.','The drawings. The service upgrade. The second inspection. The rent while you wait. A blank is an unknown, not a zero — the ballparks keep you honest, but they don’t replace written quotes.');
  const cats=[...new Set(allCosts().map(c=>c.category))];
  const list=cats.map(cat=>`<div class="cost-cat"><i style="background:${CAT_COLORS[cat]||'#0c1b3f'}"></i>${e(cat)}</div>${allCosts().filter(c=>c.category===cat).map(costRow).join('')}`).join('');
  const add=`<form class="add-cost" id="custom-cost-form"><h3>Add a cost unique to your business</h3><div class="form-row"><label class="field">Line item<input class="input" name="name" maxlength="150" placeholder="e.g. Walk-in cooler installation" required></label><label class="field">Timing<select class="select" name="frequency"><option value="upfront">One-time</option><option value="monthly">Monthly</option></select></label><label class="field">Estimate (optional)<input class="input" name="amount" type="number" min="0" max="1000000000000" step="0.01" placeholder="USD"></label><button class="cta" type="submit"><span>Add</span><i aria-hidden="true">+</i></button></div><p class="muted small" style="margin:12px 0 0">For an annual bill, enter the monthly equivalent and keep the real due date in your notes.</p></form>`;
  return page(head+`<div id="cost-dash">${costDash()}</div><div class="cost-layout"><section><div class="cost-list">${list}</div>${add}</section><aside class="calc-side" id="calc-side">${calcSide()}</aside></div>`);
}
function costRow(c){
  const val=state.budget[c.id],st=costStatus(c);
  return `<div class="crow ${st==='na'?'na':st==='estimated'?'est':''}" data-crow="${c.id}"><details><summary>${e(c.name)}</summary><p>${e(c.detail)}<em>Ask: ${e(c.contact)}</em></p></details><label class="money"><span>$</span><input type="number" inputmode="decimal" min="0" max="1000000000000" step="0.01" data-cost="${c.id}" value="${val===undefined?'':e(val)}" placeholder="—" aria-label="${e(c.name)} estimate in US dollars" ${st==='na'?'disabled':''}></label><div class="meta"><span class="freq">${c.frequency==='monthly'?'Per month':'One-time'}</span>${c.ballpark?`<span class="tag cost" title="Rough U.S. ballpark — not a quote">≈ ${e(c.ballpark)}</span>`:''}<select data-cost-status="${c.id}" aria-label="${e(c.name)} status"><option value="unpriced" ${st==='unpriced'?'selected':''}>To investigate</option><option value="estimated" ${st==='estimated'?'selected':''}>Estimate entered</option><option value="na" ${st==='na'?'selected':''}>Not applicable</option></select>${c.category==='Your additions'?`<button class="na" data-remove-cost="${c.id}" style="margin:0">Remove</button>`:''}</div></div>`;
}
function costDash(){
  const t=budgetTotals(),all=allCosts();
  const waffle=all.map(c=>{const st=costStatus(c);return `<i class="${st==='na'?'na':st==='estimated'?'est':''}" title="${e(c.name)}"></i>`;}).join('');
  const sum=Object.values(t.byCat).reduce((a,b)=>a+b,0);
  const entries=Object.entries(t.byCat).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  const bar=sum?entries.map(([k,v])=>`<i style="width:${(v/sum*100).toFixed(2)}%;background:${CAT_COLORS[k]||'#0c1b3f'}" title="${e(k)}: ${currency(v)}"></i>`).join(''):'';
  const legend=sum?entries.map(([k,v])=>`<span><i style="background:${CAT_COLORS[k]||'#0c1b3f'}"></i>${e(k)} · ${Math.round(v/sum*100)}%</span>`).join(''):'<span>Enter amounts to see what makes up your total.</span>';
  return `<div class="cost-band"><div><small>One-time opening</small><div class="big">${currency(t.upfront)}</div><p>entered so far</p></div><div><small>Monthly operating</small><div class="big">${currency(t.monthly)}</div><p>per month</p></div><div><small>Total to plan for</small><div class="big hi">${currency(t.total)}</div><p>incl. ${state.months} mo. + ${state.allowance}%</p></div><div><small>${t.priced} priced · ${t.unknown} unknown · ${t.na} N/A</small><div class="waffle" aria-label="${t.priced} lines priced, ${t.unknown} unknown, ${t.na} not applicable">${waffle}</div></div></div><div class="stackbar" aria-hidden="true">${bar}</div><div class="stack-legend">${legend}</div>`;
}
function calcSide(){
  const t=budgetTotals();
  return `<header>Your estimate</header><div class="sec"><label for="rng-months">Months of operating costs to hold <output id="out-months">${state.months}</output></label><input id="rng-months" type="range" min="0" max="24" step="1" value="${Math.min(24,state.months)}" data-setting="months"><p class="hint">Rent, payroll, and bills before sales cover them. Three to six is a common suggestion.</p></div><div class="sec"><label for="rng-allow">Allowance on one-time costs <output id="out-allow">${state.allowance}%</output></label><input id="rng-allow" type="range" min="0" max="40" step="1" value="${Math.min(40,state.allowance)}" data-setting="allowance"><p class="hint">Room for surprises. Renovations often carry 10–20%.</p></div><div class="sec"><div class="sum" id="calc-sum">${sumHTML(t)}</div></div><div class="acts">${cta('#plan','Save in my blueprint','solid small')}<button class="cta small" data-action="csv"><span>Export cost sheet (CSV)</span><i aria-hidden="true">↓</i></button></div><p class="hint" style="margin:0;font-size:.76rem;color:var(--ink-3)">Arithmetic on your inputs only — not a funding recommendation. Blank lines are excluded.</p>`;
}
function sumHTML(t){return `<div><span>One-time costs</span><b>${currency(t.upfront)}</b></div><div><span>${state.months} × monthly</span><b>${currency(t.reserve)}</b></div><div><span>${state.allowance}% allowance</span><b>${currency(t.allowance)}</b></div><div class="total"><span>Total to plan for</span><b>${currency(t.total)}</b></div><div class="unk"><span>${t.unknown} lines still unknown</span></div>`;}
function refreshCosts(){const d=$('#cost-dash');if(d)d.innerHTML=costDash();const s=$('#calc-sum');if(s)s.innerHTML=sumHTML(budgetTotals());}

/* ───────────── 04 · CODES & HAZARDS ───────────── */
const SHEET_ART=[
  '<rect x="8" y="8" width="84" height="54"/><path d="M14 18h40M14 26h30M14 34h36M14 42h24M60 14h26v42H60zM60 24h26M60 34h26M60 44h26"/>',
  '<path d="M8 8h84v54H8zM50 8v30M8 38h30M62 38h30M62 38v24M38 38v6"/><path d="M38 44a12 12 0 0 0 12-6" stroke-dasharray="2 2"/><path d="M20 20h14v10H20zM64 18h18v12H64z"/>',
  '<path d="M10 10h80v50H10zM10 10h34v30H10"/><circle cx="66" cy="36" r="16" stroke-dasharray="3 3"/><path d="M84 14v20M16 48h16M22 16h10v10H22z"/>',
  '<path d="M10 12h80M10 36h80M10 60h80M16 6v58M50 6v58M84 6v58"/><circle cx="16" cy="12" r="3"/><circle cx="50" cy="36" r="3"/><circle cx="84" cy="60" r="3"/><path d="M50 12h34" stroke-width="3"/>',
  '<path d="M8 30h50v12H8zM58 22h24v28H58z"/><circle cx="70" cy="36" r="9"/><path d="M70 27v18M61 36h18M20 30V16M40 30V16M15 16h10M35 16h10M86 36h8"/>',
  '<rect x="10" y="8" width="30" height="54"/><path d="M10 16h30M10 24h30M10 32h30M10 40h30M10 48h30M25 8v54"/><path d="M48 20h20l6 8M48 40h14l8-8M48 56h30" stroke-dasharray="4 3"/><path d="M86 16l-6 12h8l-6 12"/>',
  '<path d="M20 62V10M20 20h40v20h22M20 44h28M60 20v-8"/><circle cx="86" cy="40" r="5"/><rect x="42" y="44" width="14" height="16"/><path d="M10 62h80"/>',
  '<path d="M8 14h84M8 34h84M8 54h84M92 8v54"/>'+[20,40,60,80].flatMap(x=>[14,34,54].map(y=>`<circle cx="${x}" cy="${y}" r="2.6"/>`)).join(''),
  '<rect x="8" y="10" width="24" height="18"/><rect x="38" y="10" width="30" height="18"/><rect x="74" y="10" width="18" height="46"/><rect x="8" y="38" width="44" height="18"/><circle cx="17" cy="47" r="3.5"/><circle cx="30" cy="47" r="3.5"/><circle cx="43" cy="47" r="3.5"/><path d="M58 40h10v16H58z"/>'
];
function codesPage(){
  const head=phead('Occupancy · occupant load · drawings · hazards','The codes, decoded.','Codes aren’t one rulebook. They’re model codes your state or city adopts, edits, and enforces through several offices. Here’s how they reach your door — and the handful of numbers that change everything.');
  const chain=`<section>${shead('How a code reaches you','From rulebook to your floor plan.','')}<div class="chain">${[['01','Written as a model','Groups like the ICC and NFPA publish model codes, updated about every three years.'],['02','Adopted & amended','Your state or city picks an edition — often not the newest — and edits it.'],['03','Enforced locally','Building official, fire marshal, health inspector: each enforces their own part.'],['04','Applied to your use','Your occupancy group, headcount, and what you store or cook decide which rules apply.']].map(x=>`<div><b>${x[0]}</b><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join('')}</div></section>`;
  const occ=`<section class="block" id="occupancy">${shead('Occupancy groups · A to U','What kind of building are you, on paper?','Every space is assigned a group by how it’s used. Change the use — or the headcount — and the group can change with it.')}<div class="occ" role="group" aria-label="Occupancy groups">${OCCUPANCY.map(o=>`<button data-occ="${o.g}" class="${ui.occ===o.g?'on':''}" aria-pressed="${ui.occ===o.g}"><b>${o.g}</b><span>${e(o.name)}</span></button>`).join('')}</div><div id="occ-detail">${occDetail()}</div></section>`;
  const calc=`<section class="block" id="load">${shead('Occupant load · 2021 IBC Table 1004.5','Your floor plan, counted the way the code counts it.','Enter rough square footage by use. The code assumes a number of people from area — and that number decides exits, sprinklers, and restrooms.')}<div class="load-calc"><div>${LOAD_FACTORS.map(f=>`<div class="lc-row"><span>${e(f.label)}<small>1 person per ${f.factor} sq ft ${f.basis}</small></span><label class="money" aria-label="${e(f.label)} square feet"><span>ft²</span><input type="number" min="0" max="200000" step="10" inputmode="numeric" data-load="${f.id}" value="${ui.load[f.id]||''}" placeholder="0"></label><em id="lc-${f.id}">${loadRow(f)}</em></div>`).join('')}</div><div class="lc-out" id="lc-out">${loadOut()}</div></div><p class="muted small" style="margin-top:12px">Your city may use another edition or amendments, and your design professional calculates the official number. An educational estimate — not a code determination.</p></section>`;
  const draw=`<section class="block" id="drawset">${shead('A typical tenant permit set','What “the blueprints” really are.','A permit set is a stack of sheets — often from several people. Not every project needs every sheet; your reviewer decides.')}<div class="drawset"><div class="stack" id="stack">${stackHTML()}</div><div><div class="ds-list" role="listbox" aria-label="Drawing sheets">${DRAWING_SET.map((s,i)=>`<button class="ds-item ${i===ui.sheet?'on':''}" data-sheet="${i}" role="option" aria-selected="${i===ui.sheet}"><code>${s.no}</code><span>${e(s.title)}</span><small>${e(s.who)}</small></button>`).join('')}</div><div class="ds-detail" id="ds-detail">${dsDetail(DRAWING_SET[ui.sheet])}</div></div></div><h3 style="margin-top:48px">Six ways to keep drawing costs down</h3><div class="tips">${DRAWING_TIPS.map((t,i)=>`<div><b>${pad(i+1)}</b><span>${e(t)}</span></div>`).join('')}</div></section>`;
  const heat=`<section class="block" id="hazards">${shead('18 business types × 7 hazards','Where the risk lives.','Relative and simplified — a map of what to raise with your fire marshal, insurer, and safety adviser, not an assessment.')}<div class="heat-wrap"><table class="heat"><thead><tr><th scope="col" style="text-align:left">Business type</th>${HAZARD_TYPES.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${BUSINESSES.map(b=>`<tr><th scope="row"><a href="#paths/${b.id}">${e(b.name)}</a></th>${(HAZARD_MATRIX[b.id]||[]).map((v,i)=>`<td class="h${v}" title="${e(b.name)} · ${e(HAZARD_TYPES[i])}: ${['none noted','low','moderate','high'][v]}"><i></i><span class="sr-only">${['none noted','low','moderate','high'][v]}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="heat-key"><span><i></i>None noted</span><span><i style="background:color-mix(in srgb,var(--amber) 22%,transparent)"></i>Low</span><span><i style="background:color-mix(in srgb,var(--amber) 58%,transparent)"></i>Moderate</span><span><i style="background:var(--red)"></i>High</span></div></section>`;
  const reg=`<section class="block" id="register">${shead('11 code families','Which code, in plain English.','Names to help you ask better questions. They don’t set your requirements — your local authority does.')}<div class="register">${CODE_TOPICS.map((x,i)=>`<article class="reg"><b>${pad(i+1)}</b><div><h3>${e(x[0])}</h3><span class="code">${e(x[1])}</span></div><p>${e(x[2])}</p><div class="who">Ask · ${e(x[3])}<br><a href="${e(SOURCES[x[4]].url)}" target="_blank" rel="noopener noreferrer">Official starting point ↗</a></div></article>`).join('')}</div><div class="wish" style="margin-top:36px"><small>Write down every answer</small><p>For each issue: the code, edition and amendments · your use classification · who designs it · what to submit · the fee · what has to come first. Keep it in your approval register.</p></div></section>`;
  return page(head+chain+occ+calc+draw+heat+reg);
}
function occDetail(){const o=OCCUPANCY.find(x=>x.g===ui.occ)||OCCUPANCY[1];return `<div class="occ-detail"><div class="letter">${o.g}</div><div><h3>Group ${o.g} · ${e(o.name)}</h3><p>${e(o.def)}</p><small>Small-business examples</small><p style="margin:0">${e(o.ex)}</p></div><div><small>Why it matters</small><p style="margin:0">${e(o.why)}</p></div></div>`;}
function loadRow(f){const a=Number(ui.load[f.id])||0;return a?Math.ceil(a/f.factor)+' ppl':'—';}
function computeLoad(){
  let total=0,a2=0,a3=0,area=0;const byGroup={};
  for(const f of LOAD_FACTORS){const a=Math.max(0,Number(ui.load[f.id])||0);if(!a)continue;const n=Math.ceil(a/f.factor);total+=n;area+=a;if(f.group==='A2')a2+=n;if(f.group==='A3')a3+=n;const g=f.group.startsWith('A')?'A':f.group;if(g)byGroup[g]=(byGroup[g]||0)+a;}
  return{total,a2,a3,area,byGroup};
}
function loadOut(){
  const L=computeLoad(),max=Math.max(120,Math.ceil(L.total*1.2/10)*10);
  const ticks=[[49,'49 · 1 EXIT MAX'],[100,'100 · A-2 SPRINKLERS'],[500,'500 · 3 EXITS']].filter(t=>t[0]<=max).map(t=>`<span class="tick" style="--at:${(t[0]/max*100).toFixed(1)}%"><span>${t[1]}</span></span>`).join('');
  const flags=[];
  if(!L.total)flags.push(['','Enter some square footage','Start with your main room — dining, sales floor, or gym floor.']);
  else{
    flags.push(L.total<=49?['ok','1 exit may be allowed','At 49 or fewer, if travel-distance and other limits are met.']:L.total<=500?['warn','2 exits required','Above 49 occupants the model code requires a second way out.']:L.total<=1000?['red','3 exits required','More than 500 occupants.']:['red','4 exits required','More than 1,000 occupants.']);
    const aTot=L.a2+L.a3;
    if(aTot>=50)flags.push(['warn',`Assembly (Group A) likely — ${aTot} assembly occupants`,'The strictest exit, alarm, and sprinkler rules. Doors may need panic hardware.']);
    else if(aTot>0)flags.push(['ok',`${aTot} assembly occupants — under 50`,'Small assembly spaces are often classified Group B instead.']);
    else{const top=Object.entries(L.byGroup).sort((a,b)=>b[1]-a[1])[0];if(top){const o=OCCUPANCY.find(x=>x.g===top[0]);if(o)flags.push(['ok',`Likely Group ${o.g} (${o.name})`,'Based on your largest area. Mixed uses can carry more than one group.']);}}
    const spk=(L.a2>=100&&'A-2 with 100+ occupants')||(L.a2>0&&L.area>5000&&'A-2 fire area over 5,000 sq ft')||(L.a3>=300&&'A-3 with 300+ occupants')||(L.area>12000&&'Fire area over 12,000 sq ft');
    flags.push(spk?['red','Sprinklers likely required',`Model-code trigger: ${spk}. Ask about water supply early.`]:['ok','No common sprinkler trigger hit','Local rules, storage, or the building itself can still require them. Ask.']);
    if(L.total>15)flags.push(['','Restrooms scale with people','More occupants can mean more — and separate — restrooms.']);
  }
  return `<div class="lc-total"><b>${L.total}</b><span>estimated occupants<br>${L.area.toLocaleString('en-US')} sq ft entered</span></div><div class="people" aria-hidden="true"><div class="fill" style="--w:${Math.min(100,L.total/max*100).toFixed(1)}%"></div>${ticks}</div><div class="lc-flags">${flags.map(f=>`<div class="flag ${f[0]}"><i>${f[0]==='ok'?'✓':f[0]?'!':'i'}</i><div><b>${e(f[1])}</b><small>${e(f[2])}</small></div></div>`).join('')}</div>`;
}
function stackHTML(){
  const n=DRAWING_SET.length;
  return DRAWING_SET.map((s,i)=>{const depth=(i-ui.sheet+n)%n;return `<button class="sh ${i===ui.sheet?'top':''}" data-sheet="${i}" style="--i:${Math.min(depth,6)};z-index:${n-depth};opacity:${depth>5?0:1}" aria-label="Show sheet ${s.no} ${e(s.title)}" tabindex="-1"><div class="sh-art"><svg viewBox="0 0 100 70" aria-hidden="true">${SHEET_ART[i]||''}</svg></div><div class="sh-tb"><span>${e(s.title)}</span><b>${s.no}</b></div></button>`;}).join('');
}
function dsDetail(s){return `<p><b style="color:var(--ink)">${s.no} · ${e(s.title)}</b> — ${e(s.what)}</p><p class="small"><span class="mono" style="font-size:.6rem;color:var(--ink-3)">DRAWN BY</span> ${e(s.who)} &nbsp;·&nbsp; <span class="mono" style="font-size:.6rem;color:var(--ink-3)">SEALED</span> ${e(s.seal)}</p><p class="tip">${e(s.tip)}</p>`;}
function syncDrawset(){const st=$('#stack');if(!st)return;st.innerHTML=stackHTML();$$('.ds-item').forEach(b=>{const on=+b.dataset.sheet===ui.sheet;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on));});$('#ds-detail').innerHTML=dsDetail(DRAWING_SET[ui.sheet]);}

/* ───────────── 05 · FIELD KIT ───────────── */
function kitPage(tab){
  if(!['ask','terms','sources'].includes(tab))tab='ask';
  const head=phead(`${CONTACTS.length} offices · ${GLOSSARY.length} terms · ${Object.keys(SOURCES).length} sources`,'You don’t have to know all the answers.','Know who to ask, exactly what to ask them, and what the words mean. Get the important answers in writing.');
  const tabs=`<nav class="tabs" aria-label="Field kit sections">${[['ask','Who to ask'],['terms','Plain-English terms'],['sources','Official resources']].map(t=>`<a href="#kit/${t[0]}" class="${tab===t[0]?'on':''}" ${tab===t[0]?'aria-current="page"':''}>${t[1]}</a>`).join('')}</nav>`;
  let body='';
  if(tab==='ask')body=`<a class="res" href="${e(SOURCES.gov.url)}" target="_blank" rel="noopener noreferrer" style="border-top:0;margin-bottom:8px"><div><h3>Find the official offices for your state, county, and city</h3><p>Bring your address, a list of everything you’ll do there, a rough layout, equipment spec sheets, and these questions.</p></div><span>USA.GOV ↗</span></a><div class="contacts">${CONTACTS.map((c,i)=>`<article class="contact"><span class="who">${e(c[0])}</span><h3>${e(c[1])}</h3><p>${e(c[2])}</p><ol>${c[4].map(q=>`<li>${e(q)}</li>`).join('')}</ol><div class="acts"><button class="copy-btn" data-copy="${i}">${icon('copy','')}Copy questions</button><a class="go" href="#roadmap/${c[3]}">Stage ${pad(chapterNo(c[3]))}</a></div></article>`).join('')}</div>`;
  else if(tab==='terms')body=`<label class="field gloss-search">Find a term<input id="gloss-search" class="input" type="search" placeholder="Egress, MEP, NNN, impact fee…" value="${e(ui.gloss)}"></label><div class="gloss" id="gloss-list">${glossItems(ui.gloss)}</div>`;
  else body=`<div class="notice"><span>ⓘ</span><span><b>Official references reviewed ${e(REVIEWED)}.</b> Use each agency’s current page before acting. Dallas and Texas links show one city’s or state’s process — not the rules for yours.</span></div>${Object.values(SOURCES).map(s=>`<a class="res" href="${e(s.url)}" target="_blank" rel="noopener noreferrer"><div><h3>${e(s.name)}</h3><p>${e(s.note)}</p></div><span>OPEN ↗</span></a>`).join('')}`;
  return page(head+tabs+body);
}
function glossItems(q){const query=(q||'').toLowerCase().trim();const items=GLOSSARY.filter(g=>(g[0]+' '+g[1]).toLowerCase().includes(query));return items.length?items.map(g=>`<div class="term"><h3>${e(g[0])}</h3><p>${e(g[1])}</p></div>`).join(''):'<p class="empty">No matching terms. Try a simpler word, or press / to search everything.</p>';}

/* ───────────── 06 · MY BLUEPRINT ───────────── */
function planPage(){
  const p=progress(),b=BUSINESSES.find(x=>x.id===state.profile.business),next=allTasks().find(t=>!state.tasks[t.id]);
  const head=phead('Saved in this browser · no account','My blueprint.','Your checklist, your costs, and the answers you collect. Put your business name in and it goes on the sign out front.');
  const note=`<div class="notice no-print"><span>${storageAvailable?'●':'○'}</span><span><b>${storageAvailable?'Saved in this browser.':'Browser storage is unavailable.'}</b> Nothing is sent to a server or synced across devices — export a backup to keep it or move it. A checkmark records your progress; it isn’t an approval.</span></div>`;
  const tb=`<div class="plan-tb"><label>Business name<input class="input" data-profile="name" maxlength="500" value="${e(state.profile.name)}" placeholder="Your business name"></label><label>Business type<select class="select" data-profile="business"><option value="">Choose a type…</option>${BUSINESSES.map(x=>`<option value="${x.id}" ${state.profile.business===x.id?'selected':''}>${e(x.name)}</option>`).join('')}</select></label><label>City &amp; state (your note)<input class="input" data-profile="location" maxlength="500" value="${e(state.profile.location)}" placeholder="City, State"></label><label>Target opening date<input class="input" data-profile="date" type="date" value="${e(state.profile.date)}"></label></div>`;
  const prog=`<section class="plan-progress"><div class="ring" style="--p:${p.percent}"><div><b>${p.percent}%</b><span>CHECKED</span></div></div><div class="pp-info"><h2>Your preparation, on paper.</h2><p>${p.done} of ${p.total} applicable tasks checked${p.skipped?` · ${p.skipped} not applicable`:''}${b?` · includes ${e(b.name)}`:''}.</p>${next?`<a class="go" href="${next.href}">Next up: ${e(next.title)}</a>`:'<p style="color:var(--green)">Every applicable task is checked. Verify approvals and open questions with your project team.</p>'}<small>Checklist progress — not a legal readiness score.</small></div><div class="phase-bars">${PHASES.map(ph=>{const s=phaseStats(ph);return `<a href="#roadmap" data-scroll-to="phase-${ph.id}"><b>${ph.n}</b><div>${e(ph.name)}<div class="pbar"><i style="--w:${s.pct}%"></i></div></div><em>${s.pct}%</em></a>`;}).join('')}</div></section>`;
  const acts=`<div class="actions-row no-print"><button class="cta solid small" data-action="print-plan"><span>Print my plan</span><i aria-hidden="true">⎙</i></button><button class="cta small" data-action="export"><span>Export backup</span><i aria-hidden="true">↓</i></button><button class="cta small" data-action="import"><span>Import backup</span><i aria-hidden="true">↑</i></button><button class="cta small" data-action="csv"><span>Cost sheet CSV</span><i aria-hidden="true">↓</i></button>${cta('#costs','Costs: '+currency(budgetTotals().total),'small')}</div>`;
  const lists=`<section>${shead('One stage at a time','Your working checklist.','')}<div class="acc-list">${CHAPTERS.map((c,i)=>planAcc(c.id,pad(i+1),c.short,c.tasks,'#roadmap/'+c.id)).join('')}${b?planAcc('industry-'+b.id,'★',b.name+' — specific work',b.checks,'#paths/'+b.id):''}</div>${b?'':'<p class="plan-prompt">Choose a business type above to add its five specific tasks to your plan.</p>'}</section>`;
  const notes=`<section class="block">${shead('Your notebook','The details worth writing down.','')}<div class="notes">${[['offer','The one-page offer','Who is the customer? What problem do you solve? What’s included? How will you test demand?'],['approvals','The approval register','Office · contact · approval · documents · fee · what comes first · status · expiration. Date every written answer.'],['questions','Quotes, questions & commitments','Lease terms, design scope, equipment specs, installed quotes, unknown costs, guarantees.'],['launch','Opening readiness & first 90 days','Final approvals, systems test, staffing, emergency contacts, backup suppliers, 30/60/90-day review dates.']].map(x=>`<label>Note<b>${x[1]}</b><textarea data-note="${x[0]}" maxlength="20000" placeholder="${e(x[2])}">${e(state.notes[x[0]])}</textarea></label>`).join('')}</div><p class="muted small" style="margin-top:14px">Keep ID numbers, bank details, passwords, and private client records out of this notebook.</p><button class="reset-btn" data-action="reset">Clear saved plan…</button></section>`;
  return page(head+note+tb+prog+acts+lists+notes+`<section class="print-document" id="print-document"></section>`);
}
function planAcc(prefix,num,title,tasks,link){
  const s=groupStats(prefix,tasks.length);
  return `<details class="acc" data-acc="${prefix}"><summary><b>${num}</b><span>${e(title)}</span><em>${s.done}/${s.applicable} checked</em></summary><div class="acc-body">${segs(prefix,tasks.length)}<div style="height:10px"></div>${tasks.map((t,i)=>{const id=prefix+'-'+i,v=state.tasks[id];return `<label class="ctask ${v===2?'skipped':''}"><input class="box" type="checkbox" data-task="${id}" ${v===1?'checked':''} ${v===2?'disabled':''}><span>${e(t[0])}${v===2?' (not applicable)':''}</span></label>`;}).join('')}<a class="go" href="${link}">Details &amp; applicability</a></div></details>`;
}
function printDocument(){
  const t=budgetTotals(),b=BUSINESSES.find(x=>x.id===state.profile.business);
  const mark=id=>state.tasks[id]===1?'✓':state.tasks[id]===2?'N/A':' ';
  return `<p class="print-note">SAFISOLUTIONS · THE BLUEPRINT · PERSONAL PLANNING WORKSHEET</p><h1>${e(state.profile.name||'My business blueprint')}</h1><p>${e(b?.name||'Business type not selected')} · ${e(state.profile.location||'Location not entered')}<br>Target opening: ${e(state.profile.date||'Not entered')} · Printed ${new Date().toLocaleDateString('en-US')}</p><p class="print-note">Educational prompts only. Confirm local requirements and approvals. Checked tasks are self-reported and do not establish legal readiness.</p><h2>Opening checklist</h2>${CHAPTERS.map((c,ci)=>`<h3>${pad(ci+1)} · ${e(c.short)}</h3><ul>${c.tasks.map((x,i)=>`<li>[${mark(c.id+'-'+i)}] ${e(x[0])}</li>`).join('')}</ul>`).join('')}${b?`<h3>${e(b.name)} — specific work</h3><ul>${b.checks.map((x,i)=>`<li>[${mark('industry-'+b.id+'-'+i)}] ${e(x[0])}</li>`).join('')}</ul>`:''}<h2>Cost sheet (USD)</h2><table><thead><tr><th>Line item</th><th>Timing</th><th>Amount / status</th></tr></thead><tbody>${allCosts().map(c=>`<tr><td>${e(c.name)}</td><td>${c.frequency==='monthly'?'Monthly':'One-time'}</td><td>${state.costStatus[c.id]==='na'?'Not applicable':state.budget[c.id]===undefined?'Unpriced':currency(state.budget[c.id])}</td></tr>`).join('')}</tbody></table><p>One-time: ${currency(t.upfront)} · Monthly: ${currency(t.monthly)}<br>${state.months} months of operating costs: ${currency(t.reserve)} · ${state.allowance}% allowance: ${currency(t.allowance)}<br><b>Total to plan for: ${currency(t.total)}</b> · ${t.unknown} applicable lines unpriced.</p><p class="print-note">Blank amounts are excluded. Figures round to the nearest dollar. Arithmetic on your inputs — not a funding recommendation.</p>${[['offer','One-page offer'],['approvals','Approval register'],['questions','Quotes, questions & commitments'],['launch','Opening readiness & first 90 days']].map(x=>`<h2>${x[1]}</h2><p>${e(state.notes[x[0]]||'________________________________________________\n\n________________________________________________\n\n________________________________________________')}</p>`).join('')}<h2>Where to verify</h2><ul>${Object.values(SOURCES).map(s=>`<li>${e(s.name)}: ${e(s.url)}</li>`).join('')}</ul><p class="print-note">Guide reviewed ${e(REVIEWED)}. Requirements change — check current agency pages.</p>`;
}

/* ───────────── routing ───────────── */
const ROUTES=new Set(['start','roadmap','paths','costs','codes','kit','plan']);
const LEGACY={overview:'start',business:'paths',library:'kit'};
const TITLES={start:'Everything I wish I’d known before I opened',roadmap:'The opening roadmap',paths:'Business types',costs:'Hidden costs',codes:'Codes & hazards',kit:'Field kit',plan:'My blueprint'};
function route(){const parts=location.hash.slice(1).split('/');let base=parts[0]||'start';base=LEGACY[base]||base;if(!ROUTES.has(base))base='start';let id='';try{id=parts[1]?decodeURIComponent(parts[1]):'';}catch{}return{base,id};}
function render(scroll=false){
  const {base,id}=route();
  let html;
  switch(base){
    case 'roadmap':html=id?chapterPage(id):roadmapPage();break;
    case 'paths':html=id?pathPage(id):pathsPage();break;
    case 'costs':html=costsPage();break;
    case 'codes':html=codesPage();break;
    case 'kit':html=kitPage(id||'ask');break;
    case 'plan':html=planPage();break;
    default:html=startPage();
  }
  main.innerHTML=html;
  if(base==='start'){syncXray();watchHome();}
  $$('[data-nav]').forEach(a=>{const on=a.dataset.nav===base;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  let sub='';
  if(base==='roadmap'&&id)sub=chapter(id)?.short||'';
  if(base==='paths'&&id)sub=BUSINESSES.find(b=>b.id===id)?.name||'';
  document.title=`${sub?sub+' · ':''}${TITLES[base]} | The Blueprint · SafiSolutions`;
  updateNavProgress();closeMenu();moveCursor();
  if(ui.pendingScroll){const t=document.getElementById(ui.pendingScroll);ui.pendingScroll=null;if(t){requestAnimationFrame(()=>t.scrollIntoView({block:'start'}));return;}}
  if(scroll){window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
}
function closeMenu(){document.body.classList.remove('menu-open');$('.u-menu')?.setAttribute('aria-expanded','false');}
function moveCursor(){const nav=$('#nav'),a=$('#nav a.active'),c=$('.cursor');if(!nav||!a||!c)return;c.style.setProperty('--cx',(a.offsetLeft+9+Math.min(a.offsetWidth-18,a.querySelector('b')?.offsetWidth+40||30)/2-7)+'px');}

/* home: draw the x-ray when it scrolls in, and run the flow line down the utility trench */
function watchHome(){
  observer?.disconnect();
  const cad=$('.cad');
  if(cad&&'IntersectionObserver' in window){observer=new IntersectionObserver(ents=>{for(const en of ents)if(en.isIntersecting){cad.classList.add('go-draw');observer.disconnect();}},{threshold:.25});observer.observe(cad);}
  else cad?.classList.add('go-draw');
  updateFlow();
}
function updateFlow(){
  const s=$('#strata'),f=$('.flowline');if(!s||!f)return;
  const r=s.getBoundingClientRect(),h=Math.max(0,Math.min(r.height,innerHeight*.62-r.top));
  f.style.setProperty('--flow',h+'px');
}
let flowTick=false;
window.addEventListener('scroll',()=>{if(flowTick)return;flowTick=true;requestAnimationFrame(()=>{updateFlow();flowTick=false;});},{passive:true});
window.addEventListener('resize',()=>{moveCursor();updateFlow();$('.elev')?.setAttribute('viewBox',elevBox());});
document.fonts?.ready?.then(moveCursor);

/* ───────────── search ───────────── */
function buildIndex(){
  INDEX=[
    ...CHAPTERS.map((c,i)=>({k:'Stage '+pad(i+1),t:c.title,d:c.deck,h:'#roadmap/'+c.id,x:[c.short,c.why,c.trap,c.wish,c.gate,c.tasks.flat().join(' '),(c.ballpark||[]).flat().join(' ')].join(' ')})),
    ...BUSINESSES.map(b=>({k:'Business type',t:b.name,d:b.intro,h:'#paths/'+b.id,x:[b.tag,b.before,b.occupancy,b.materials.join(' '),b.hazards.join(' '),b.checks.flat().join(' '),b.extras.join(' ')].join(' ')})),
    ...FEES.map(f=>({k:'Hidden fee',t:f[0],d:f[1]+' — '+f[2],h:'#roadmap/'+f[3],x:''})),
    ...LAYERS.map(l=>({k:'Building system',t:l.name,d:l.q,h:'#roadmap/'+l.chapter,x:[l.code,l.text,l.surprise,l.ballpark,l.who].join(' ')})),
    ...VALVES.filter(v=>!v.end).map(v=>({k:'Approval',t:v.n,d:v.q+' '+v.who,h:'#roadmap/'+v.ch,x:v.bp+' '+v.wait})),
    ...COSTS.map(c=>({k:'Cost line',t:c.name,d:c.detail+' Ballpark: '+c.ballpark,h:'#costs',x:c.category+' '+c.contact})),
    ...OCCUPANCY.map(o=>({k:'Occupancy',t:`Group ${o.g} — ${o.name}`,d:o.def,h:'#codes',occ:o.g,x:o.ex+' '+o.why})),
    {k:'Calculator',t:'Occupant load & seat-count calculator',d:'How many people the code assumes — and when exits and sprinklers change.',h:'#codes',scrollTo:'load',x:'occupancy occupant load seats sprinkler exits restroom capacity'},
    ...DRAWING_SET.map((s,i)=>({k:'Drawing sheet',t:`${s.no} · ${s.title}`,d:s.what,h:'#codes',sheet:i,x:s.who+' '+s.tip+' blueprint drawings plans architect engineer'})),
    ...CODE_TOPICS.map(x=>({k:'Code',t:x[0],d:x[1]+' — '+x[2],h:'#codes',scrollTo:'register',x:x[3]})),
    ...CONTACTS.map(c=>({k:'Who to ask',t:c[0],d:c[1],h:'#kit/ask',x:c[2]+' '+c[4].join(' ')})),
    ...GLOSSARY.map(g=>({k:'Term',t:g[0],d:g[1],h:'#kit/terms',gloss:g[0],x:''})),
    ...LEASE_QUESTIONS.map(q=>({k:'Lease question',t:q[0],d:q[1],h:'#roadmap/location',x:'lease landlord'}))
  ];
}
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function hl(text,terms){let out=e(text);for(const t of terms){if(t.length<2)continue;out=out.replace(new RegExp('('+reEsc(e(t))+')','ig'),'<mark>$1</mark>');}return out;}
function searchGuide(query){
  if(!INDEX)buildIndex();
  const q=query.trim().toLowerCase();
  if(q.length<2)return `<div class="s-sugg">${['grease trap','sprinkler','certificate of occupancy','LLC','salon','impact fee','blueprints','lease','EIN','food truck'].map(s=>`<button data-sugg="${e(s)}">${e(s)}</button>`).join('')}</div>`;
  const terms=q.split(/\s+/).filter(Boolean);
  const res=[];
  for(const r of INDEX){const t=r.t.toLowerCase(),d=r.d.toLowerCase(),x=(r.x||'').toLowerCase();let score=0,ok=true;for(const term of terms){const s=(t.includes(term)?6:0)+(d.includes(term)?3:0)+(x.includes(term)?1:0);if(!s){ok=false;break;}score+=s;}if(ok)res.push([score+(t.startsWith(terms[0])?4:0),r]);}
  res.sort((a,b)=>b[0]-a[0]);
  return res.length?res.slice(0,30).map(([,r])=>`<a class="s-res" href="${r.h}" ${r.gloss?`data-gloss="${e(r.gloss)}"`:''} ${r.occ?`data-occ-go="${r.occ}"`:''} ${r.sheet!==undefined?`data-sheet-go="${r.sheet}"`:''} ${r.scrollTo?`data-scroll-go="${r.scrollTo}"`:''}><small>${e(r.k)}</small><div><b>${hl(r.t,terms)}</b><p>${hl(r.d,terms)}</p></div></a>`).join(''):`<p class="empty" style="padding:20px 18px">No results for “${e(query)}”. Try a simpler word — or ask the office that would know.</p>`;
}
function openSearch(){const d=$('#search-dialog');if(!d.open)d.showModal();const i=$('#search-input');i.focus();i.select();$('#search-results').innerHTML=searchGuide(i.value);}

/* ───────────── downloads ───────────── */
function download(name,text,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function exportCSV(){
  const t=budgetTotals();
  const rows=[['Line item','Category','Timing','USD amount','Status','Ballpark (not a quote)'],...allCosts().map(c=>[c.name,c.category,c.frequency,state.budget[c.id]??'',costStatus(c),c.ballpark||'']),[],['One-time total','','',t.upfront],['Monthly total','','',t.monthly],['Operating cost months','','',state.months],['Operating cost amount','','',t.reserve],['Allowance percent','','',state.allowance],['Opening allowance','','',t.allowance],['Total to plan for','','',t.total],['Unpriced applicable lines','','',t.unknown]];
  const quote=v=>{let x=String(v??'');if(/^[=+@-]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"';};
  download('The-Blueprint-Cost-Sheet.csv','﻿'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
  toast('Cost sheet exported.');
}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true;}catch{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.append(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch{}ta.remove();return ok;}}

/* ───────────── task updates without a full re-render ───────────── */
function refreshTask(id){
  const v=state.tasks[id];
  $$(`[data-task="${id}"]`).forEach(input=>{input.checked=v===1;input.disabled=v===2;const row=input.closest('.task,.ctask');if(!row)return;row.classList.toggle('done',v===1);row.classList.toggle('skipped',v===2);const na=row.querySelector('[data-na]');if(na)na.textContent=v===2?'↺ Put back on my list':'Not applicable to me';});
  const {base,id:rid}=route();
  if(base==='plan'){const open=new Set($$('.acc[open]').map(d=>d.dataset.acc)),y=window.scrollY;render();$$('.acc').forEach(d=>{if(open.has(d.dataset.acc))d.open=true;});window.scrollTo(0,y);return;}
  if(base==='roadmap'&&rid){const c=chapter(rid),m=$('#ch-meta');if(c&&m){const was=groupStats(c.id,c.tasks.length).complete&&m.innerHTML.includes('Stage done');m.innerHTML=chMeta(c);if(!was&&groupStats(c.id,c.tasks.length).complete)toast(`Stage ${pad(chapterNo(c.id))} done — on to the next valve.`);}}
}

/* ───────────── events ───────────── */
document.addEventListener('click',async event=>{
  const el=event.target.closest('button,a,summary');
  if(document.body.classList.contains('menu-open')&&!event.target.closest('.ruler,.u-menu'))closeMenu();
  if(!el)return;
  if(el.closest('#nav')&&el.tagName==='A')closeMenu();
  const d=el.dataset;
  if(d.layer){ui.layer=ui.layer===d.layer?null:d.layer;ui.hidden.delete(d.layer);syncXray();return;}
  if(d.eye){const id=d.eye;if(ui.hidden.has(id))ui.hidden.delete(id);else{ui.hidden.add(id);if(ui.layer===id)ui.layer=null;}syncXray();return;}
  if(d.valve!==undefined){ui.valve=+d.valve;syncValves();return;}
  if(d.scrollTo){
    event.preventDefault();
    const target=d.scrollTo,href=el.getAttribute('href')||'';
    const want=href.startsWith('#')?href.slice(1).split('/')[0]:'';
    if(want&&route().base!==want||route().id&&want){ui.pendingScroll=target;if(location.hash==='#'+want)render();else location.hash='#'+want;return;}
    document.getElementById(target)?.scrollIntoView({behavior:'smooth',block:'start'});return;
  }
  if(d.pathFilter){ui.pathFilter=d.pathFilter;render();return;}
  if(d.occ){ui.occ=d.occ;$$('[data-occ]').forEach(b=>{b.classList.toggle('on',b.dataset.occ===ui.occ);b.setAttribute('aria-pressed',String(b.dataset.occ===ui.occ));});$('#occ-detail').innerHTML=occDetail();return;}
  if(d.sheet!==undefined&&!el.classList.contains('s-res')){ui.sheet=+d.sheet;syncDrawset();return;}
  if(d.copy!==undefined){const c=CONTACTS[+d.copy];const ok=await copyText(`${c[0]} — ${c[1]}\n`+c[4].map((q,i)=>`${i+1}. ${q}`).join('\n')+'\n\n(From The Blueprint · SafiSolutions)');toast(ok?'Questions copied — paste them into your notes or an email.':'Couldn’t copy. Select the text instead.');return;}
  if(d.sugg){const i=$('#search-input');i.value=d.sugg;$('#search-results').innerHTML=searchGuide(d.sugg);i.focus();return;}
  if(d.selectBusiness){const was=state.profile.business===d.selectBusiness;state.profile.business=was?'':d.selectBusiness;persist();render();toast(was?'Removed from my blueprint.':'Added to my blueprint — its tasks are now in your checklist.');return;}
  if(d.na){const id=d.na;if(state.tasks[id]===2)delete state.tasks[id];else state.tasks[id]=2;persist();refreshTask(id);return;}
  if(d.removeCost){const id=d.removeCost;state.customCosts=state.customCosts.filter(c=>c.id!==id);delete state.budget[id];delete state.costStatus[id];persist();render();toast('Cost line removed.');return;}
  if(el.classList.contains('s-res')){
    $('#search-dialog').close();
    if(d.gloss)ui.gloss=d.gloss;
    if(d.occGo){ui.occ=d.occGo;ui.pendingScroll='occupancy';}
    if(d.sheetGo!==undefined){ui.sheet=+d.sheetGo;ui.pendingScroll='drawset';}
    if(d.scrollGo)ui.pendingScroll=d.scrollGo;
    if(el.getAttribute('href')===location.hash){event.preventDefault();render(true);}
    return;
  }
  switch(d.action){
    case 'search':openSearch();break;
    case 'close-search':$('#search-dialog').close();break;
    case 'theme':state.theme=state.theme==='dark'?'light':'dark';applyPreferences();persist();break;
    case 'font-up':state.font=Math.min(1.25,Math.round((state.font+.05)*100)/100);applyPreferences();persist();break;
    case 'font-down':state.font=Math.max(.9,Math.round((state.font-.05)*100)/100);applyPreferences();persist();break;
    case 'menu':{const open=document.body.classList.toggle('menu-open');el.setAttribute('aria-expanded',String(open));break;}
    case 'xr-all':ui.layer=null;ui.hidden.clear();syncXray();break;
    case 'valve-next':ui.valve=(ui.valve+1)%VALVES.length;syncValves();break;
    case 'export':download('The-Blueprint-Backup.json',JSON.stringify(state,null,2),'application/json');toast('Backup exported.');break;
    case 'csv':exportCSV();break;
    case 'import':$('#import-file').click();break;
    case 'print-plan':$('#print-document').innerHTML=printDocument();document.body.classList.add('printing-plan');window.print();break;
    case 'reset':if(confirm('Clear this browser’s checklist, costs, and notes? Export a backup first if you want to keep them.')){const theme=state.theme,font=state.font;state=defaults();state.theme=theme;state.font=font;persist();render();toast('Saved plan cleared.');}break;
  }
});
document.addEventListener('input',event=>{
  const el=event.target,d=el.dataset;
  if(el.id==='search-input'){$('#search-results').innerHTML=searchGuide(el.value);return;}
  if(el.id==='gloss-search'){ui.gloss=el.value;$('#gloss-list').innerHTML=glossItems(el.value);return;}
  if(d.seats!==undefined){ui.seats=Math.max(0,Math.min(200,+el.value||0));$('#seat-n').textContent=ui.seats;$('#seat-grid').innerHTML=seatGrid();$('#seat-out').innerHTML=seatsOut();return;}
  if(d.profile&&d.profile!=='business'){state.profile[d.profile]=el.value;persist();return;}
  if(d.note){state.notes[d.note]=el.value;persist();return;}
  if(d.load){ui.load[d.load]=Math.min(200000,Math.max(0,Number(el.value)||0));const f=LOAD_FACTORS.find(x=>x.id===d.load);$('#lc-'+d.load).textContent=loadRow(f);$('#lc-out').innerHTML=loadOut();return;}
  if(d.cost){
    const id=d.cost;
    if(el.value===''||!Number.isFinite(Number(el.value))){delete state.budget[id];state.costStatus[id]='unpriced';}
    else{state.budget[id]=Math.min(1e12,Math.max(0,Number(el.value)));state.costStatus[id]='estimated';}
    persist();
    const sel=$(`[data-cost-status="${id}"]`);if(sel)sel.value=state.costStatus[id];
    $(`[data-crow="${id}"]`)?.classList.toggle('est',state.costStatus[id]==='estimated');
    refreshCosts();return;
  }
  if(d.setting){
    const key=d.setting;state[key]=Math.min(key==='months'?36:100,Math.max(0,Math.round(Number(el.value)||0)));persist();
    const o=$(key==='months'?'#out-months':'#out-allow');if(o)o.textContent=key==='months'?state.months:state.allowance+'%';
    refreshCosts();return;
  }
});
document.addEventListener('change',async event=>{
  const el=event.target,d=el.dataset;
  if(d.cost){el.value=state.budget[d.cost]??'';return;}
  if(d.task){const id=d.task;if(el.checked)state.tasks[id]=1;else delete state.tasks[id];persist();refreshTask(id);return;}
  if(d.profile==='business'){state.profile.business=el.value;persist();render();return;}
  if(d.costStatus){
    const id=d.costStatus;state.costStatus[id]=el.value;if(el.value==='unpriced')delete state.budget[id];persist();
    const row=$(`[data-crow="${id}"]`);
    if(row){const c=allCosts().find(x=>x.id===id);const open=row.querySelector('details').open;row.outerHTML=costRow(c);if(open)$(`[data-crow="${id}"] details`).open=true;}
    refreshCosts();return;
  }
  if(el.id==='import-file'&&el.files[0]){
    try{const file=el.files[0];if(file.size>2000000)throw new Error('File too large');const incoming=sanitizeState(JSON.parse(await file.text()));if(confirm('Replace the saved plan in this browser with this backup?')){state=incoming;persist();applyPreferences();render();toast('Backup restored.');}}
    catch{toast('Couldn’t import that file. Choose a The Blueprint backup (.json, under 2 MB).');}
    el.value='';
  }
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='custom-cost-form')return;
  event.preventDefault();
  const f=new FormData(event.target),name=String(f.get('name')||'').trim();if(!name)return;
  if(state.customCosts.length>=80){toast('Your plan supports up to 80 added cost lines.');return;}
  const id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  state.customCosts.push({id,name:name.slice(0,150),frequency:f.get('frequency')==='monthly'?'monthly':'upfront',category:'Your additions',detail:'An expense you added to your own plan.',contact:'Your notes / supplier',ballpark:'your estimate'});
  const amt=f.get('amount');if(amt!==''&&Number.isFinite(Number(amt))){state.budget[id]=Math.min(1e12,Math.max(0,Number(amt)));state.costStatus[id]='estimated';}
  persist();render();toast('Cost line added under “Your additions.”');
  requestAnimationFrame(()=>$(`[data-crow="${id}"]`)?.scrollIntoView({block:'center'}));
});
document.addEventListener('keydown',event=>{
  const tag=event.target.tagName;
  if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(tag)&&!event.target.isContentEditable){event.preventDefault();openSearch();}
  if(event.key==='Escape')closeMenu();
  if(event.target.id==='search-input'){
    if(event.key==='Enter'){const first=$('#search-results .s-res');if(first){event.preventDefault();first.click();}}
    if(event.key==='ArrowDown'){const first=$('#search-results .s-res');if(first){event.preventDefault();first.focus();}}
  }else if(event.target.classList?.contains('s-res')){
    if(event.key==='ArrowDown'){event.preventDefault();event.target.nextElementSibling?.focus();}
    if(event.key==='ArrowUp'){event.preventDefault();(event.target.previousElementSibling||$('#search-input')).focus();}
  }
});
$('#search-dialog').addEventListener('click',e2=>{if(e2.target.id==='search-dialog')e2.target.close();});
window.addEventListener('afterprint',()=>document.body.classList.remove('printing-plan'));
window.addEventListener('hashchange',()=>render(true));

applyPreferences();
render();
