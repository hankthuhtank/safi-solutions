(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
const extra=['incomeNow','incomeNext','utilitiesNow','utilitiesNext','foodNow','foodNext','transportNow','transportNext','otherNow','otherNext','deposits','savings','reserveMonths'];
const move=['currentHousing','newHousing','movingQuote','manualMiles','moveMpg','moveGas','hotelNights','hotelRate','otherCost'];
const profile=['hasVehicle','hasPets','hasKids','isRenter','remoteWork'],KEY='movedesk.workspace.v1',DRAFT='movedesk.decision.draft.v1',THEME='movedesk.theme.v1';
let activeId='',servicesSeq=0,currentServices=[],ready=false,restoring=false,foundLoc=null;
const notice=msg=>{const e=$('#workspaceNotice');if(e){e.textContent=msg;clearTimeout(notice.timer);notice.timer=setTimeout(()=>e.textContent='',6500)}};
const val=id=>{const e=$('#'+id);return e&&e.validity.valid&&e.value.trim()?Math.max(0,Number(e.value)||0):0};
const valid=id=>{const e=$('#'+id);return !e||e.value.trim()===''||e.validity.valid};
const safeParse=(value,fallback)=>{try{return JSON.parse(value)}catch{return fallback}};
const plans=()=>{let x;try{x=safeParse(localStorage.getItem(KEY)||'[]',[])}catch{x=[]}return Array.isArray(x)?x.filter(p=>p&&typeof p==='object'&&typeof p.id==='string'&&p.to&&Number.isFinite(+p.to.latitude)&&Number.isFinite(+p.to.longitude)).slice(0,30):[]};
function persist(arr){try{localStorage.setItem(KEY,JSON.stringify(arr));return true}catch{notice('Device storage unavailable. Export a backup before clearing browser data.');return false}}
const moneyDiff=n=>(n>0?'+':n<0?'−':'')+usd(Math.abs(n));
function decision(){
 const values=Object.fromEntries([...extra,...move].map(id=>[id,$('#'+id)?.value??'']));
 const summary=[['Current','Now'],['Destination','Next']].map(([title,suffix],i)=>{const income=val('income'+suffix),housing=val(i?'newHousing':'currentHousing'),utilities=val('utilities'+suffix),food=val('food'+suffix),transport=val('transport'+suffix),other=val('other'+suffix);return{title,income,expenses:housing+utilities+food+transport+other,left:income-housing-utilities-food-transport-other}});
 const r=window.MoveDeskBridge?.get?.()?.route,miles=$('#manualMiles').value.trim()?val('manualMiles'):r?.type==='road'?r.miles:null;
 const fuel=miles===null?null:miles/Math.max(1,val('moveMpg'))*val('moveGas');
 const once=val('movingQuote')+val('hotelNights')*val('hotelRate')+val('otherCost')+(fuel||0),upfront=once+val('deposits'),savings=val('savings'),buffer=summary[1].expenses*val('reserveMonths');
 return{values,summary,miles,fuel,once,upfront,savings,buffer,net:summary[1].left-summary[0].left,shortfall:Math.max(0,upfront+buffer-savings)};
}
function renderDecision(){
 if(![...extra,...move].every(valid))return;
 const d=decision(),[now,there]=d.summary;
 $('#decisionNow').textContent=usd(now.left);$('#decisionThere').textContent=usd(there.left);$('#decisionShift').textContent=moneyDiff(d.net);
 $('#decisionShift').classList.toggle('negative',d.net<0);$('#decisionShift').classList.toggle('positive',d.net>0);
 $('#decisionBreakdown').innerHTML=[['Monthly take-home',now.income,there.income],['Housing',val('currentHousing'),val('newHousing')],['Utilities',val('utilitiesNow'),val('utilitiesNext')],['Food + groceries',val('foodNow'),val('foodNext')],['Transportation',val('transportNow'),val('transportNext')],['Other recurring',val('otherNow'),val('otherNext')]].map(([name,a,b])=>'<div class="decision-row"><span>'+esc(name)+'</span><b>'+usd(a)+'</b><b>'+usd(b)+'</b></div>').join('');
 $('#upfrontCost').textContent=usd(d.upfront)+(d.fuel===null?' + fuel':'');$('#upfrontDetails').textContent=usd(d.once)+(d.fuel===null?' plus uncalculated fuel':'')+' move costs + '+usd(val('deposits'))+' deposits / setup';
 $('#reserveCost').textContent=usd(d.buffer);$('#reserveDetails').textContent=val('reserveMonths')+' months of estimated destination expenses';
 $('#fundingGap').textContent=d.shortfall?usd(d.shortfall)+' needed':usd(d.savings-d.upfront-d.buffer)+' remaining';
 $('#fundingGap').classList.toggle('negative',d.shortfall>0);$('#fundingGap').classList.toggle('positive',!d.shortfall);
 $('#affordabilityInsight').textContent='Based only on numbers you enter. No taxes, market averages, or provider quotes are inferred. '+(d.net>0?'The destination leaves more monthly cash available.':d.net<0?'The destination leaves less monthly cash available.':'Both locations have the same modeled monthly surplus.')+(d.fuel===null?' Road distance is unavailable, so driving fuel is excluded.':'');
 try{localStorage.setItem(DRAFT,JSON.stringify(Object.fromEntries(extra.map(id=>[id,$('#'+id).value]))))}catch{}
}
function renderSaved(){
 const box=$('#savedRoutes'),items=plans();
 if(!items.length){box.innerHTML='<div class="empty-workspace">No plans saved yet. Build a route, enter your numbers, then save your first destination.</div>';return}
 box.innerHTML=items.map(x=>'<article class="saved-route"><div><span class="save-eyebrow">'+new Date(x.updated||Date.now()).toLocaleDateString('en-US')+'</span><h3>'+esc(x.name||x.to.name||'Untitled')+'</h3><p>'+esc([x.from?.name,x.from?.admin1].filter(Boolean).join(', '))+' → '+esc([x.to?.name,x.to?.admin1].filter(Boolean).join(', '))+'</p><small>'+esc(x.note||'')+'</small></div><div class="saved-numbers"><b>'+usd(x.upfront||0)+'</b><span>UPFRONT ESTIMATE</span><strong class="'+(x.net<0?'negative':'positive')+'">'+moneyDiff(x.net||0)+'/mo</strong></div><div class="saved-buttons"><button type="button" data-open="'+esc(x.id)+'">Open</button><button type="button" data-remove="'+esc(x.id)+'">Delete</button></div></article>').join('');
}
function save(){
 const pair=window.MoveDeskBridge?.get?.();if(!pair?.from||!pair?.to){notice('Build a move route before saving.');return}
 const d=decision(),list=plans(),old=list.find(p=>p.id===activeId),id=old?.id||'p'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
 const name=($('#planName').value||'').trim().slice(0,70)||[pair.from.name,pair.to.name].join(' → ');
 const entry={id,name,note:$('#planNote').value.slice(0,250),from:pair.from,to:pair.to,fields:d.values,profile:Object.fromEntries(profile.map(x=>[x,$('#'+x).checked])),date:$('#moveDate').value,upfront:d.upfront,net:d.net,updated:new Date().toISOString()};
 if(persist([entry,...list.filter(p=>p.id!==id)].slice(0,20))){activeId=id;$('#planName').value=name;renderSaved();notice('Saved on this device. Export a backup to keep a separate copy.')}
}
async function openPlan(id){
 const entry=plans().find(p=>p.id===id);if(!entry||!window.MoveDeskBridge?.restore)return;restoring=true;$('#savePlan').disabled=true;notice('Restoring saved move…');
 try{const ok=await window.MoveDeskBridge.restore(entry.from,entry.to);if(!ok)throw Error('Unable to restore that route.');
  [...extra,...move].forEach(k=>{if(Object.hasOwn(entry.fields||{},k)&&$('#'+k))$('#'+k).value=entry.fields[k]});
  profile.forEach(k=>{if(Object.hasOwn(entry.profile||{},k))$('#'+k).checked=!!entry.profile[k]});
  $('#moveDate').value=entry.date||'';$('#moveDate').dispatchEvent(new Event('change'));
  $('#hasVehicle').dispatchEvent(new Event('change'));
  activeId=id;$('#planName').value=entry.name||'';$('#planNote').value=entry.note||'';$('#currentPlanLabel').textContent='SAVED WORKSPACE';
  renderDecision();$('#brief').scrollIntoView({behavior:'smooth'});notice('Saved destination loaded.');
 }catch(e){notice(e.message||'Could not reopen this plan.')}finally{restoring=false;$('#savePlan').disabled=false}
}
function exportPlans(){
 const data={format:'MoveDesk-plans',version:1,created:new Date().toISOString(),plans:plans()},a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 a.href=url;a.download='movedesk-plans.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function importPlans(file){
 if(!file)return;if(file.size>2000000){notice('Backup file is too large.');return}
 const reader=new FileReader();reader.onload=()=>{const data=safeParse(reader.result,null);if(data?.format!=='MoveDesk-plans'||!Array.isArray(data.plans)){notice('Not a MoveDesk backup file.');return}
  const incoming=data.plans.filter(p=>p&&typeof p.id==='string'&&p.from&&p.to&&Number.isFinite(+p.from.latitude)&&Number.isFinite(+p.to.latitude)).slice(0,20);
  const ids=new Set(incoming.map(p=>p.id));if(persist([...incoming,...plans().filter(p=>!ids.has(p.id))].slice(0,20))){renderSaved();notice('Imported '+incoming.length+' saved destinations.')}
 };reader.readAsText(file);
}
const cats=[
{id:'electric',name:'Electricity',query:'electric utility service provider',tag:'energy'},
{id:'internet',name:'Internet',query:'internet providers broadband',tag:'telecom'},
{id:'gas',name:'Natural gas',query:'natural gas service provider',tag:'energy'},
{id:'water',name:'Water + sewer',query:'water sewer utility department',tag:'water'},
{id:'trash',name:'Trash + recycling',query:'trash recycling pickup service',tag:'waste'},
{id:'other',name:'Other essentials',query:'home internet utilities insurance post office',tag:'other'}];
const geoSearch=(q,loc)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q+' near '+[loc.name,loc.admin1,loc.country].filter(Boolean).join(', '));
function renderServices(){
 const e=$('#servicesGrid');if(!foundLoc){e.innerHTML='<p>Build a move to explore destination services.</p>';return}
 e.innerHTML=cats.map(c=>{const items=currentServices.filter(s=>s.types.includes(c.tag)).slice(0,6);
  const list=items.length?'<ul class="service-list">'+items.map(s=>'<li><div><b>'+esc(s.name)+'</b><small>Mapped office · service area unverified'+(s.distance!==null?' · about '+s.distance.toFixed(1)+' mi away':'')+'</small></div><a href="'+(s.url||geoSearch(s.name,foundLoc))+'" target="_blank" rel="noopener noreferrer">Details ↗</a></li>').join('')+'</ul>':'<p class="provider-empty">No local provider-office listing found in the map data. This does not mean service is unavailable.</p>';
  const official=c.id==='internet'&&foundLoc.country_code==='US'?'<a href="https://broadbandmap.fcc.gov/home" target="_blank" rel="noopener noreferrer">FCC address-level providers ↗</a>':'';
  return'<article class="service-card"><div class="service-title"><span>'+esc(c.name)+'</span><span class="service-number">'+(items.length?items.length+' mapped':'CHECK')+'</span></div>'+list+'<div class="service-actions">'+official+'<a href="'+geoSearch(c.query,foundLoc)+'" target="_blank" rel="noopener noreferrer">Find '+esc(c.name.toLowerCase())+' services ↗</a></div></article>';
 }).join('');
}
function distance(a,b,lat,lon){const r=Math.PI/180,p=(lat-a)*r,d=(lon-b)*r;return 3958.76*2*Math.asin(Math.sqrt(Math.sin(p/2)**2+Math.cos(a*r)*Math.cos(lat*r)*Math.sin(d/2)**2))}
function safeUrl(u){try{const z=new URL(u);return ['https:','http:'].includes(z.protocol)?z.href:null}catch{return null}}
function classify(t){
 const tags=[t.office||'',t.utility||''].join(' ').toLowerCase(),name=(t.name||'').toLowerCase(),types=[];
 if(/energy_supplier|electricity|gas|utility/.test(tags)||/electric|power|energy/.test(name))types.push('energy');
 if(/telecommunication|telecom/.test(tags)||/broadband|fiber|telecom|internet/.test(name))types.push('telecom');
 if(/water_utility|water/.test(tags)||/water department|water utility/.test(name))types.push('water');
 if(/waste|recycling/.test(tags)||/sanitation|waste management|refuse/.test(name))types.push('waste');
 return types;
}
async function loadServices(loc){
 const request=++servicesSeq;currentServices=[];foundLoc=loc;$('#serviceLocation').textContent=[loc.name,loc.admin1].filter(Boolean).join(', ');$('#serviceStatus').textContent='Checking mapped local offices…';renderServices();
 const lat=+loc.latitude,lon=+loc.longitude;
 if(!Number.isFinite(lat)||!Number.isFinite(lon))return;
 const q='[out:json][timeout:15];(nwr(around:30000,'+lat+','+lon+')["office"~"^(energy_supplier|water_utility|utility|telecommunication|waste_disposal)$"];nwr(around:30000,'+lat+','+lon+')["utility"~"^(electricity|gas|water|telecom)$"]["name"];);out center tags 100;';
 try{const controller=new AbortController(),t=setTimeout(()=>controller.abort(),14000);let response;try{response=await fetch('https://overpass.kumi.systems/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q),signal:controller.signal})}finally{clearTimeout(t)}
  if(!response.ok)throw Error('Provider directory unavailable');const json=await response.json();if(request!==servicesSeq)return;
  const names=new Set();currentServices=(json.elements||[]).map(x=>{const t=x.tags||{},name=(t.name||t.operator||'').trim(),p=x.center||x,types=classify(t);if(!name||!types.length||names.has(name.toLowerCase()))return null;names.add(name.toLowerCase());return{name,types,url:safeUrl(t.website||t['contact:website']),distance:Number.isFinite(p.lat)&&Number.isFinite(p.lon)?distance(lat,lon,p.lat,p.lon):null}}).filter(Boolean).sort((a,b)=>(a.distance??1000)-(b.distance??1000));
  $('#serviceStatus').textContent='Nearby provider offices, not verified service territories. Confirm availability for your exact address.';
 }catch{if(request!==servicesSeq)return;$('#serviceStatus').textContent='Map directory unavailable. Use the provider searches below to find contacts.'}renderServices();
}
$('#savePlan').addEventListener('click',save);
$('#newPlan').addEventListener('click',()=>{activeId='';$('#planName').value='';$('#planNote').value='';$('#currentPlanLabel').textContent='NEW WORKSPACE';notice('New workspace ready. Saved plans are unchanged.')});
$('#exportPlans').addEventListener('click',exportPlans);
$('#importPlans').addEventListener('change',e=>{importPlans(e.target.files?.[0]);e.target.value=''});
$('#printPlan').addEventListener('click',()=>{if(!ready){notice('Build a route first.');return}window.print()});
$('#savedRoutes').addEventListener('click',e=>{
 const o=e.target.closest('[data-open]'),d=e.target.closest('[data-remove]');
 if(o)openPlan(o.dataset.open);
 if(d){const p=plans().find(x=>x.id===d.dataset.remove);if(p&&confirm('Delete "'+p.name+'" from this browser?')){persist(plans().filter(x=>x.id!==p.id));if(activeId===p.id)activeId='';renderSaved()}}
});
[...extra,...move].forEach(id=>$('#'+id)?.addEventListener('input',renderDecision));
$('#themeToggle').addEventListener('click',()=>{const light=document.documentElement.dataset.mode==='light';document.documentElement.dataset.mode=light?'dark':'light';$('#themeToggle').textContent=light?'Light mode':'Dark mode';try{localStorage.setItem(THEME,light?'dark':'light')}catch{}});
let theme='dark';try{theme=localStorage.getItem(THEME)||'dark'}catch{}
document.documentElement.dataset.mode=theme==='light'?'light':'dark';$('#themeToggle').textContent=theme==='light'?'Dark mode':'Light mode';
let draft={};try{draft=safeParse(localStorage.getItem(DRAFT)||'{}',{})}catch{}
extra.forEach(id=>{if(typeof draft[id]==='string'&&$('#'+id))$('#'+id).value=draft[id]});
window.addEventListener('movedesk:ready',e=>{ready=true;if(!restoring){activeId='';$('#planName').value='';$('#planNote').value='';$('#currentPlanLabel').textContent='UNSAVED WORKSPACE'}renderDecision();loadServices(e.detail.to)});
renderSaved();renderDecision();renderServices();
})();
