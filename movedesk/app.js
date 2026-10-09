(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
const state={from:null,to:null,fromWeather:null,toWeather:null,route:null,map:null,layers:[],climate:{from:null,to:null}};
let toastT;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1900)}

/* boot */
const boot=$('#boot');const leaveBoot=()=>{if(!boot)return;boot.classList.add('out');setTimeout(()=>boot.remove(),500)};
if(document.readyState==='complete')setTimeout(leaveBoot,1050);else window.addEventListener('load',()=>setTimeout(leaveBoot,720),{once:true});setTimeout(leaveBoot,2400);

/* Location results are explicit choices; a shared name must not silently pick a city. */
const resolved={from:null,to:null};
let buildRequest=0;
setupSearch('fromInput','fromSuggestions','fromResolved','from');setupSearch('toInput','toSuggestions','toResolved','to');
function closeSuggestions(side){$('#'+side+'Suggestions').classList.remove('on');$('#'+side+'Input').setAttribute('aria-expanded','false')}
function setupSearch(inputId,listId,statusId,side){
 const input=$('#'+inputId),list=$('#'+listId);let timer=0,seq=0;
 input.setAttribute('aria-controls',listId);input.setAttribute('aria-expanded','false');input.setAttribute('aria-describedby',statusId);
 input.addEventListener('input',()=>{
   resolved[side]=null;const my=++seq;clearTimeout(timer);list.innerHTML='';closeSuggestions(side);
   const q=input.value.trim();$('#'+statusId).textContent=q.length<2?'Search a city or ZIP code':'Searching…';
   if(q.length<2)return;
   timer=setTimeout(async()=>{try{const choices=await searchLocations(q);if(my!==seq)return;renderSuggestions(choices,list,side,input,statusId)}catch(e){if(my!==seq)return;closeSuggestions(side);$('#'+statusId).textContent='Search unavailable. Try again'}},260);
 });
 input.addEventListener('focus',()=>{if(list.children.length&&!resolved[side]){list.classList.add('on');input.setAttribute('aria-expanded','true')}});
 input.addEventListener('keydown',e=>{
   if(e.key==='ArrowDown'&&list.classList.contains('on')){e.preventDefault();list.querySelector('button')?.focus()}
   if(e.key==='Enter'&&list.classList.contains('on')&&list.querySelector('button')){e.preventDefault();list.querySelector('button').focus()}
   if(e.key==='Escape')closeSuggestions(side);
 });
 list.addEventListener('keydown',e=>{
   const buttons=$$('button',list),i=buttons.indexOf(document.activeElement);
   if(e.key==='Escape'){e.preventDefault();closeSuggestions(side);input.focus()}
   if(e.key==='ArrowDown'){e.preventDefault();buttons[Math.min(i+1,buttons.length-1)]?.focus()}
   if(e.key==='ArrowUp'){e.preventDefault();if(i<=0)input.focus();else buttons[i-1]?.focus()}
 });
 document.addEventListener('click',e=>{if(!e.target.closest('.'+side+'-field'))closeSuggestions(side)});
 document.addEventListener('focusin',e=>{if(!e.target.closest('.'+side+'-field'))closeSuggestions(side)});
}
async function searchLocations(q){const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`);if(!r.ok)throw new Error('Geocoding failed');const j=await r.json();return j.results||[]}
function locLabel(x){return [x.name,x.admin1,x.country_code].filter(Boolean).join(', ')}
function chooseLocation(side,x){
 resolved[side]=x;$('#'+side+'Input').value=locLabel(x);
 $('#'+side+'Resolved').textContent=`${Number(x.latitude).toFixed(3)}, ${Number(x.longitude).toFixed(3)} ∙ ${x.timezone||'timezone –'}`;
 closeSuggestions(side);$('#routeError').hidden=true;
}
function renderSuggestions(choices,list,side,input,statusId){
 if(!choices.length){list.innerHTML='<p class="suggestion-empty" role="status">No locations found. Try a city and state, or a ZIP code.</p>';$('#'+statusId).textContent='No locations found'}
 else{list.innerHTML=choices.map((x,i)=>`<button type="button" data-i="${i}"><b>${esc(x.name)}</b><span>${esc([x.admin1,x.country,x.postcodes?.[0]].filter(Boolean).join(' ∙ '))}</span></button>`).join('');$('#'+statusId).textContent='Choose your location below';}
 list.classList.add('on');input.setAttribute('aria-expanded','true');
 list.onclick=e=>{const button=e.target.closest('button[data-i]');if(!button)return;chooseLocation(side,choices[+button.dataset.i]);input.focus()};
}
$$('.clear-field').forEach(button=>button.addEventListener('click',()=>{const input=$('#'+button.dataset.clear);input.value='';input.dispatchEvent(new Event('input'));input.focus()}));
async function resolveInput(side){
 if(resolved[side])return resolved[side];
 const input=$('#'+side+'Input'),q=input.value.trim();
 if(!q)throw new Error(`Enter a ${side==='from'?'current':'destination'} location`);
 const choices=await searchLocations(q);
 if(input.value.trim()!==q)throw new Error('The location changed. Choose the updated location and build again.');
 if(!choices.length)throw new Error(`Could not find ${q}. Try a city and state, or ZIP code.`);
 if(choices.length>1){renderSuggestions(choices,$('#'+side+'Suggestions'),side,input,side+'Resolved');input.focus();throw new Error(`Choose the exact ${side==='from'?'current':'destination'} location from the suggestions.`)}
 chooseLocation(side,choices[0]);return choices[0];
}
function showRouteError(message){const box=$('#routeError');box.textContent=message;box.hidden=false}
$('#routeForm').addEventListener('submit',e=>{e.preventDefault();buildBrief()});
$('#sampleMove').addEventListener('click',async()=>{
 const button=$('#sampleMove');button.disabled=true;
 try{
   const [from,to]=await Promise.all([searchLocations('Paris, Texas'),searchLocations('Nashville, Tennessee')]);
   const a=from.find(x=>x.country_code==='US'&&x.admin1==='Texas'),b=to.find(x=>x.country_code==='US'&&x.admin1==='Tennessee');
   if(!a||!b)throw new Error('The sample locations are temporarily unavailable. Search for your own move above.');
   chooseLocation('from',a);chooseLocation('to',b);await buildBrief();
 }catch(e){showRouteError(e.message)}finally{button.disabled=false}
});
async function buildBrief(){
 const request=++buildRequest,button=$('.build-brief');button.disabled=true;button.querySelector('span').textContent='BUILDING MOVE PLAN…';$('#routeError').hidden=true;$('#routeForm').setAttribute('aria-busy','true');
 try{
   const [from,to]=await Promise.all([resolveInput('from'),resolveInput('to')]);
   if(request!==buildRequest)return;
   const [fw,tw,route]=await Promise.all([fetchWeather(from),fetchWeather(to),fetchRoute(from,to)]);
   if(request!==buildRequest)return;
   if(resolved.from!==from||resolved.to!==to)throw new Error('The location changed. Choose the updated locations and build again.');
   Object.assign(state,{from,to,fromWeather:fw,toWeather:tw,route});
   renderCore();$('#brief').classList.remove('hidden');
   setTimeout(()=>{if(request!==buildRequest)return;$('#compare').scrollIntoView({behavior:'smooth',block:'start'});renderMap()},80);
   calcBudget();renderPlan();loadClimate();
   window.dispatchEvent(new CustomEvent('movedesk:ready',{detail:{from,to}}));
 }catch(error){if(request===buildRequest)showRouteError(error.message||'Could not build the move plan. Please try again.')}
 finally{if(request===buildRequest){button.disabled=false;button.querySelector('span').textContent='BUILD MY MOVE PLAN';$('#routeForm').setAttribute('aria-busy','false')}}
}

/* live weather */
async function fetchWeather(x){const u=new URL('https://api.open-meteo.com/v1/forecast');u.searchParams.set('latitude',x.latitude);u.searchParams.set('longitude',x.longitude);u.searchParams.set('current','temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m');u.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset');u.searchParams.set('temperature_unit','fahrenheit');u.searchParams.set('wind_speed_unit','mph');u.searchParams.set('precipitation_unit','inch');u.searchParams.set('timezone','auto');u.searchParams.set('forecast_days','7');const r=await fetch(u);if(!r.ok)throw new Error('Weather service unavailable');return r.json()}
const WX={0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Heavy freezing rain',71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Rain showers',81:'Rain showers',82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorms',96:'Thunderstorm / hail',99:'Severe thunderstorm / hail'};
const wxText=c=>WX[c]||'Weather'; const isWet=c=>[51,53,55,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(+c);

/* routing */
async function fetchRoute(a,b){const air=haversine(a.latitude,a.longitude,b.latitude,b.longitude);try{const u=`https://router.project-osrm.org/route/v1/driving/${a.longitude},${a.latitude};${b.longitude},${b.latitude}?overview=full&geometries=geojson&steps=false`;const r=await fetch(u);if(!r.ok)throw new Error();const j=await r.json();if(j.code!=='Ok'||!j.routes?.[0])throw new Error();const route=j.routes[0];return{type:'road',miles:route.distance/1609.344,hours:route.duration/3600,geometry:route.geometry,air}}catch(e){return{type:'air',miles:air,hours:null,geometry:null,air}}}
function haversine(lat1,lon1,lat2,lon2){const R=3958.7613,d2r=Math.PI/180,dLat=(lat2-lat1)*d2r,dLon=(lon2-lon1)*d2r,a=Math.sin(dLat/2)**2+Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLon/2)**2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function routeTime(h){if(!Number.isFinite(h))return'ROUTE UNAVAILABLE';const hr=Math.floor(h),m=Math.round((h-hr)*60);return`${hr} HR ${m} MIN`}

function renderCore(){const a=state.from,b=state.to,aw=state.fromWeather,bw=state.toWeather,r=state.route;
 $('#fromName').textContent=a.name;$('#toName').textContent=b.name;$('#fromMeta').textContent=[a.admin1,a.country,a.timezone].filter(Boolean).join(' ∙ ');$('#toMeta').textContent=[b.admin1,b.country,b.timezone].filter(Boolean).join(' ∙ ');
 $('#fromTemp').textContent=`${Math.round(aw.current.temperature_2m)}°`;$('#toTemp').textContent=`${Math.round(bw.current.temperature_2m)}°`;$('#fromCondition').textContent=wxText(aw.current.weather_code);$('#toCondition').textContent=wxText(bw.current.weather_code);
 $('#moveMiles').textContent=`${fmt.format(r.miles)} MI`;$('#moveTime').textContent=r.type==='road'?routeTime(r.hours):'STRAIGHT-LINE FALLBACK';$('#routeDistance').textContent=`${fmt.format(r.miles)} miles`;$('#routeDuration').textContent=r.type==='road'?routeTime(r.hours):'Road route unavailable';$('#airDistance').textContent=`${fmt.format(r.air)} MI`;
 $('#heroRouteFrom').textContent=[a.name,a.admin1].filter(Boolean).join(', ').toUpperCase();$('#heroRouteTo').textContent=[b.name,b.admin1].filter(Boolean).join(', ').toUpperCase();$('#heroRouteMiles').textContent=`${fmt.format(r.miles)} MI`;$('#heroRouteTime').textContent=r.type==='road'?routeTime(r.hours):'DIRECT DISTANCE';
 $('#mapRouteLabel').textContent=`${a.name.toUpperCase()} → ${b.name.toUpperCase()}`;const tz=((bw.utc_offset_seconds||0)-(aw.utc_offset_seconds||0))/3600;$('#timezoneShift').textContent=tz===0?'NO CHANGE':`${tz>0?'+':''}${tz} HR`;const elev=(+b.elevation||0)-(+a.elevation||0);$('#elevationShift').textContent=`${elev>=0?'+':''}${fmt.format(elev)} M`;
 renderForecast('from',a,aw);renderForecast('to',b,bw);
}
function renderForecast(side,loc,w){
 $('#'+side+'ForecastName').textContent=loc.name.toUpperCase();const daily=w.daily||{},highs=daily.temperature_2m_max||[],lows=daily.temperature_2m_min||[],rain=daily.precipitation_sum||[],codes=daily.weather_code||[],dates=daily.time||[],validHighs=highs.filter(Number.isFinite),avg=validHighs.length?validHighs.reduce((s,n)=>s+n,0)/validHighs.length:null,wet=dates.length&&dates.every((_,i)=>Number.isFinite(rain[i]))?rain.reduce((s,n)=>s+n,0):null;
 $('#'+side+'WeatherSummary').textContent=`AVG HIGH ${avg===null?'–':Math.round(avg)+'°'} ∙ ${wet===null?'PRECIP UNAVAILABLE':wet.toFixed(2)+' IN PRECIP'}`;
 const temp=x=>Number.isFinite(x)?Math.round(x)+'°':'–';$('#'+side+'Forecast').innerHTML=dates.length?dates.map((d,i)=>{const dt=new Date(d+'T12:00:00'),description=Number.isFinite(codes[i])?wxText(codes[i]):'Weather unavailable';return`<div class="forecast-day"><span>${dt.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase()}</span><i class="${isWet(codes[i])?'rain':''}" title="${esc(description)}"></i><b>${temp(highs[i])} / ${temp(lows[i])}</b><small>${esc(description)}<br>${Number.isFinite(rain[i])?rain[i].toFixed(2)+' IN':'PRECIP –'}</small></div>`}).join(''):'<p>No daily forecast returned.</p>'
}

/* map */
function renderMap(){if(!window.L||!state.from||!state.to)return;const a=state.from,b=state.to;if(!state.map){state.map=L.map('map',{zoomControl:true,attributionControl:true});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(state.map)}state.layers.forEach(l=>state.map.removeLayer(l));state.layers=[];
 const icon=side=>L.divIcon({className:'',html:`<div class="move-marker ${side}"></div>`,iconSize:[22,22],iconAnchor:[11,11]});const ma=L.marker([a.latitude,a.longitude],{icon:icon('from')}).bindTooltip(`FROM ∙ ${a.name}`),mb=L.marker([b.latitude,b.longitude],{icon:icon('to')}).bindTooltip(`TO ∙ ${b.name}`);ma.addTo(state.map);mb.addTo(state.map);state.layers.push(ma,mb);let line;
 if(state.route.geometry?.coordinates){const pts=state.route.geometry.coordinates.map(([lon,lat])=>[lat,lon]);const casing=L.polyline(pts,{color:'#0b0d0e',weight:9,opacity:.9}).addTo(state.map);state.layers.push(casing);line=L.polyline(pts,{color:'#f5c518',weight:4,opacity:1});}else line=L.polyline([[a.latitude,a.longitude],[b.latitude,b.longitude]],{color:'#f5c518',weight:3,dashArray:'10 10',opacity:.9});line.addTo(state.map);state.layers.push(line);state.map.fitBounds(line.getBounds().pad(.12));setTimeout(()=>state.map.invalidateSize(),120)}

/* climate */
async function loadClimate(){
 const request=buildRequest,from=state.from,to=state.to;
 state.climate={from:null,to:null};
 ['fromClimate','toClimate','monthAxis','climateTakeaways'].forEach(id=>$('#'+id).textContent='');
 $('#climateLoading').classList.remove('done');$('#climateLoading').textContent='Building 36 months of climate context…';
 const year=new Date().getFullYear(),start=`${year-3}-01-01`,end=`${year-1}-12-31`;
 try{const [a,b]=await Promise.all([fetchArchive(from,start,end),fetchArchive(to,start,end)]);if(request!==buildRequest||state.from!==from||state.to!==to)return;state.climate.from=aggregateClimate(a);state.climate.to=aggregateClimate(b);renderClimate()}
 catch(e){if(request===buildRequest)$('#climateLoading').textContent='Recent weather context is unavailable or incomplete. No seasonal comparison is shown; your route and plan still work.'}
}
async function fetchArchive(x,start,end){const u=new URL('https://archive-api.open-meteo.com/v1/archive');u.searchParams.set('latitude',x.latitude);u.searchParams.set('longitude',x.longitude);u.searchParams.set('start_date',start);u.searchParams.set('end_date',end);u.searchParams.set('daily','temperature_2m_max,temperature_2m_min,precipitation_sum');u.searchParams.set('temperature_unit','fahrenheit');u.searchParams.set('precipitation_unit','inch');u.searchParams.set('timezone','auto');const r=await fetch(u);if(!r.ok)throw new Error('Archive unavailable');return r.json()}
function aggregateClimate(j){
 const out=Array.from({length:12},()=>({hi:0,lo:0,p:0,n:0,years:new Set()})),d=j.daily||{},dates=d.time||[];
 if(!dates.length)throw new Error('No archive days');
 dates.forEach((date,i)=>{const m=Number(date.slice(5,7))-1,x=out[m];if(!x||![d.temperature_2m_max?.[i],d.temperature_2m_min?.[i],d.precipitation_sum?.[i]].every(Number.isFinite))throw new Error('Incomplete archive');x.hi+=d.temperature_2m_max[i];x.lo+=d.temperature_2m_min[i];x.p+=d.precipitation_sum[i];x.n++;x.years.add(Number(date.slice(0,4)))});
 out.forEach((x,m)=>{const expected=[...x.years].reduce((n,y)=>n+new Date(Date.UTC(y,m+1,0)).getUTCDate(),0);if(x.years.size!==3||x.n!==expected)throw new Error('Incomplete archive month');x.hi/=x.n;x.lo/=x.n;x.p/=x.years.size;delete x.years});return out
}
const MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function renderClimate(){const A=state.climate.from,B=state.climate.to;if(!A||!B)return;$('#monthAxis').innerHTML=MONTHS.map(m=>`<span>${m}</span>`).join('');renderClimateSide('fromClimate','from',state.from,A);renderClimateSide('toClimate','to',state.to,B);$('#climateLoading').classList.add('done');const avg=x=>x.reduce((s,m)=>s+m.hi*m.n,0)/x.reduce((s,m)=>s+m.n,0),prec=x=>x.reduce((s,m)=>s+m.p,0),tempDiff=avg(B)-avg(A),precDiff=prec(B)-prec(A);let maxI=0,maxD=-1;A.forEach((m,i)=>{const d=Math.abs(B[i].hi-m.hi);if(d>maxD){maxD=d;maxI=i}});$('#climateTakeaways').innerHTML=`<article class="takeaway"><span>AVERAGE DAILY HIGH SHIFT</span><b>${tempDiff>=0?'+':''}${tempDiff.toFixed(1)}°F</b><p>${tempDiff>3?'Recent average daily highs have been noticeably warmer.':tempDiff<-3?'Recent average daily highs have been noticeably cooler.':'Recent average daily highs are fairly similar.'}</p></article><article class="takeaway"><span>ANNUAL PRECIPITATION SHIFT</span><b>${precDiff>=0?'+':''}${precDiff.toFixed(1)} IN</b><p>${precDiff>5?'The destination has been materially wetter in the recent archive.':precDiff<-5?'The destination has been materially drier in the recent archive.':'Recent annual precipitation is relatively close.'}</p></article><article class="takeaway"><span>BIGGEST HIGH-TEMP CHANGE</span><b>${MONTHS[maxI]} ∙ ${B[maxI].hi-A[maxI].hi>=0?'+':''}${(B[maxI].hi-A[maxI].hi).toFixed(0)}°</b><p>This is the month where recent average daily highs diverge the most.</p></article>`;renderPlan()}
function renderClimateSide(id,side,loc,data){const days=data.reduce((s,x)=>s+x.n,0),avgHi=data.reduce((s,x)=>s+x.hi*x.n,0)/days,avgLo=data.reduce((s,x)=>s+x.lo*x.n,0)/days,prec=data.reduce((s,x)=>s+x.p,0);$('#'+id).className=`climate-side ${side}`;$('#'+id).innerHTML=`<div class="climate-title"><h3>${esc(loc.name)}</h3><span>3-YEAR RECENT BASELINE</span></div>`+data.map((x,i)=>{const left=Math.max(0,Math.min(100,(x.lo+10)/120*100)),right=Math.max(left+3,Math.min(100,(x.hi+10)/120*100));return`<div class="climate-month"><span>${MONTHS[i]}</span><div class="temp-track"><i class="temp-range" style="left:${left}%;width:${right-left}%;--l:${left};--w:${Math.max(.5,right-left)}"></i></div><b>${Math.round(x.lo)}° / ${Math.round(x.hi)}°</b></div>`}).join('')+`<div class="climate-summary"><div><span>AVG HIGH</span><b>${Math.round(avgHi)}°</b></div><div><span>AVG LOW</span><b>${Math.round(avgLo)}°</b></div><div><span>PRECIP / YR</span><b>${prec.toFixed(1)}″</b></div></div>`}

/* budget */
['manualMiles','currentHousing','newHousing','movingQuote','moveMpg','moveGas','hotelNights','hotelRate','otherCost'].forEach(id=>$('#'+id).addEventListener('input',calcBudget));
function n(id){return Math.max(0,Number($('#'+id).value)||0)}
function calcBudget(){
 const manual=$('#manualMiles'),ids=['currentHousing','newHousing','movingQuote','moveMpg','moveGas','hotelNights','hotelRate','otherCost'];
 if(!ids.every(id=>$('#'+id).value.trim()!==''&&$('#'+id).validity.valid)||!manual.validity.valid){$('#oneTimeCost').textContent='–';$('#fuelMoveCost').textContent='Complete the inputs with valid, non-negative values.';$('#annualHousingDelta').textContent='–';$('#monthlyHousingDelta').textContent='–';return}
 const miles=manual.value.trim()!==''?n('manualMiles'):state.route?.type==='road'?state.route.miles:null;
 const fuel=miles===null?null:miles/n('moveMpg')*n('moveGas'),truck=n('movingQuote'),hotel=n('hotelNights')*n('hotelRate'),other=n('otherCost'),one=truck+(fuel||0)+hotel+other,monthly=n('newHousing')-n('currentHousing'),annual=monthly*12;
 $('#oneTimeCost').textContent=money(one)+(fuel===null?' + fuel':'');$('#fuelMoveCost').textContent=fuel===null?'Fuel excluded: road distance is unavailable. Enter driving miles above.':`Includes ${money(fuel)} fuel for ${fmt.format(miles)} ${manual.value.trim()!==''?'entered':'road-route'} miles`;
 $('#annualHousingDelta').textContent=`${annual>=0?'+':''}${money(annual)}`;$('#monthlyHousingDelta').textContent=`${monthly>=0?'+':''}${money(monthly)} / month`;
 const mx=Math.max(truck,fuel||0,hotel,other,1);[['barTruck',truck],['barFuel',fuel||0],['barHotel',hotel],['barOther',other]].forEach(([id,x])=>$('#'+id).style.transform=`scaleX(${x/mx})`)
}

function renderPlanCompass(){const all=$$('#plan .check-item'),next=all.find(el=>!el.querySelector('input').checked),done=all.filter(el=>el.querySelector('input').checked).length;$('#nextMoveTask').textContent=next?next.querySelector('b').textContent:'All current tasks checked off';$('#planCompletion').textContent=`${done} of ${all.length} tasks complete ∙ Saved on this device for this route.`;$('#jumpNextTask').disabled=!next}
$('#jumpNextTask').addEventListener('click',()=>{const next=$$('#plan .check-item').find(el=>!el.querySelector('input').checked);next?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});next?.querySelector('input').focus({preventScroll:true})});
/* action plan */
['hasVehicle','hasPets','hasKids','isRenter','remoteWork'].forEach(id=>$('#'+id).addEventListener('change',renderPlan));
const PLAN_KEY='movedesk.plan.v1';function planDone(){try{const value=JSON.parse(localStorage.getItem(PLAN_KEY)||'{}'),data=value&&typeof value==='object'&&!Array.isArray(value)?value:{};if(state.from&&state.to){const old=`${state.from.name}-${state.from.admin1}|${state.to.name}-${state.to.admin1}:`,current=routeKey()+':';let changed=false;Object.keys(data).filter(k=>k.startsWith(old)).forEach(k=>{const target=current+k.slice(old.length);if(!(target in data)){data[target]=data[k];changed=true}});if(changed)localStorage.setItem(PLAN_KEY,JSON.stringify(data))}return data}catch(e){return{}}}function setDone(k,v){const x=planDone();x[k]=v;localStorage.setItem(PLAN_KEY,JSON.stringify(x))}
function routeKey(){return state.from&&state.to?`${state.from.latitude},${state.from.longitude}|${state.to.latitude},${state.to.longitude}`:'route'}
function task(id,title,copy){return{id,title,copy}}
function renderPlan(){if(!state.from||!state.to)return;const differentState=(state.from.country_code==='US'&&state.to.country_code==='US'&&state.from.admin1&&state.to.admin1&&state.from.admin1!==state.to.admin1),long=(state.route?.miles||0)>500,vehicle=$('#hasVehicle').checked,pets=$('#hasPets').checked,kids=$('#hasKids').checked,renter=$('#isRenter').checked,remote=$('#remoteWork').checked;const tempShift=state.climate.from&&state.climate.to?state.climate.to.reduce((s,x)=>s+x.hi,0)/12-state.climate.from.reduce((s,x)=>s+x.hi,0)/12:0;
 const before=[task('notice','Lock the move date','Choose the date, then work backward from leases, work, utilities and movers.'),renter&&task('lease','Handle the current lease','Confirm notice requirements, move-out inspection and deposit process.'),task('usps','Schedule address changes','Create a list for USPS, banks, insurance, subscriptions, employers and important accounts.'),task('utilities','Stage utility shutoff + startup','Overlap critical utilities so the old place is not dark before you leave and the new place is live when you arrive.'),vehicle&&task('vehicleprep','Prep the vehicle','Check tires, fluids, roadside kit and service needs before the drive.'),long&&task('routeprep','Break up the long route','Plan fuel, rest and overnight stops before moving day.'),pets&&task('petrecords','Collect pet records','Keep vaccination, medication and veterinarian records accessible during the move.'),kids&&task('schoolrecords','Request school records','Collect enrollment, immunization and academic documents before leaving.')].filter(Boolean);
 const arrival=[task('keys','Document the new place','Photograph condition, meters and anything that should be documented immediately.'),task('utilities2','Confirm utilities + internet','Test power, water, heating/cooling and connectivity before unpacking around a problem.'),vehicle&&differentState&&task('insurance','Update vehicle insurance location','Tell the insurer the garaging address changed and confirm coverage requirements.'),remote&&task('worktest','Test the work setup','Verify internet speed, backup connectivity and workspace before the first remote workday.'),Math.abs(tempShift)>8&&task('climategear','Adjust for the climate shift',`Recent archive data shows a meaningful temperature change. Check HVAC, clothing, vehicle and home-prep needs for the new pattern.`),pets&&task('petsetup','Settle pet essentials first','Food, medications, containment and a nearby veterinarian should be easy to reach on day one.')].filter(Boolean);
 const month=[differentState&&task('license','Transfer driver license / ID','Check the destination state deadline and required proof documents.'),vehicle&&differentState&&task('registration','Transfer vehicle registration','Check title, inspection, tax and registration requirements in the new state.'),kids&&task('enroll','Complete school enrollment','Confirm district, transportation, calendars and any missing records.'),task('localservices','Build the local short list','Primary care, pharmacy, grocery, repair services and emergency resources.'),task('budgetcheck','Recheck the real monthly cost','After the first bills arrive, replace your planning assumptions with actual housing, utilities and transportation costs.'),task('records','Finish address cleanup','Catch any accounts, licenses or subscriptions that still point to the old address.')].filter(Boolean);
 renderList('beforeList',before);renderList('arrivalList',arrival);renderList('monthList',month);renderOfficialLinks(differentState);renderPlanCompass()}
function renderList(id,items){const done=planDone(),rk=routeKey();$('#'+id).innerHTML=items.map(x=>{const key=`${rk}:${x.id}`,on=!!done[key];return`<label class="check-item ${on?'done':''}" data-key="${esc(key)}"><input type="checkbox" ${on?'checked':''}><div><b>${esc(x.title)}</b><p>${esc(x.copy)}</p></div></label>`}).join('');$$('#'+id+' .check-item').forEach(l=>l.addEventListener('change',()=>{l.classList.toggle('done',l.querySelector('input').checked);setDone(l.dataset.key,l.querySelector('input').checked);renderPlanCompass()}))}
const STATE_PORTALS={'Alabama':'https://www.alabama.gov','Alaska':'https://www.alaska.gov','Arizona':'https://az.gov','Arkansas':'https://portal.arkansas.gov','California':'https://www.ca.gov','Colorado':'https://co.colorado.gov','Connecticut':'https://portal.ct.gov','Delaware':'https://delaware.gov','District of Columbia':'https://dc.gov','Florida':'https://www.myflorida.com','Georgia':'https://georgia.gov','Hawaii':'https://portal.ehawaii.gov','Idaho':'https://www.idaho.gov','Illinois':'https://www.illinois.gov','Indiana':'https://www.in.gov','Iowa':'https://www.iowa.gov','Kansas':'https://portal.kansas.gov','Kentucky':'https://www.kentucky.gov','Louisiana':'https://www.louisiana.gov','Maine':'https://www.maine.gov','Maryland':'https://www.maryland.gov','Massachusetts':'https://www.mass.gov','Michigan':'https://www.michigan.gov','Minnesota':'https://mn.gov','Mississippi':'https://www.ms.gov','Missouri':'https://www.mo.gov','Montana':'https://mt.gov','Nebraska':'https://www.nebraska.gov','Nevada':'https://nv.gov','New Hampshire':'https://www.nh.gov','New Jersey':'https://www.nj.gov','New Mexico':'https://www.nm.gov','New York':'https://www.ny.gov','North Carolina':'https://www.nc.gov','North Dakota':'https://www.nd.gov','Ohio':'https://ohio.gov','Oklahoma':'https://oklahoma.gov','Oregon':'https://www.oregon.gov','Pennsylvania':'https://www.pa.gov','Rhode Island':'https://www.ri.gov','South Carolina':'https://sc.gov','South Dakota':'https://sd.gov','Tennessee':'https://www.tn.gov','Texas':'https://www.texas.gov','Utah':'https://www.utah.gov','Vermont':'https://www.vermont.gov','Virginia':'https://www.virginia.gov','Washington':'https://wa.gov','West Virginia':'https://www.wv.gov','Wisconsin':'https://www.wisconsin.gov','Wyoming':'https://www.wyo.gov'};
function renderOfficialLinks(differentState){const to=state.to,links=[['USPS change of address','https://moversguide.usps.com/'],['USA.gov moving guide','https://www.usa.gov/moving']];if(to.country_code==='US'&&to.admin1&&STATE_PORTALS[to.admin1])links.unshift([`${to.admin1} official portal`,STATE_PORTALS[to.admin1]]);if(differentState)links.push(['State motor vehicle services','https://www.usa.gov/state-motor-vehicle-services']);$('#officialLinks').innerHTML=links.map(([t,u])=>`<a href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join('')}
// Shared interface for the independently loaded decision and saved-plan modules.
window.MoveDeskBridge={
 get:()=>({from:state.from,to:state.to,route:state.route}),
 restore:async(from,to)=>{
  if(!from||!to||![from.latitude,from.longitude,to.latitude,to.longitude].every(Number.isFinite))return false;
  chooseLocation('from',from);chooseLocation('to',to);
  await buildBrief();
  return state.from===from&&state.to===to;
 }
};
})();
