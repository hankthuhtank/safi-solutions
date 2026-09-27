(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=new Intl.NumberFormat('en-US',{maximumFractionDigits:0}), money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={vehicle:null,recalls:[],complaints:[]};
let decodeRequest=0;
const GARAGE_KEY='cardesk.garage.v1', SERVICE_KEY='cardesk.service.v1';
let toastT;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),1900)}
function val(x){return x&&String(x).trim()&&String(x).trim()!=='Not Applicable'?String(x).trim():'–'}
function cleanVin(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,17)}
function getGarage(){try{return JSON.parse(localStorage.getItem(GARAGE_KEY)||'[]')}catch(e){return[]}}
function saveGarage(g){localStorage.setItem(GARAGE_KEY,JSON.stringify(g));renderGarage()}
function getServices(){try{return JSON.parse(localStorage.getItem(SERVICE_KEY)||'{}')}catch(e){return{}}}
function saveServices(s){localStorage.setItem(SERVICE_KEY,JSON.stringify(s))}

/* boot */
const boot=$('#boot');
const dismissBoot=()=>{if(!boot)return;boot.classList.add('out');setTimeout(()=>boot.remove(),500)};
if(document.readyState==='complete')setTimeout(dismissBoot,1050);else window.addEventListener('load',()=>setTimeout(dismissBoot,700),{once:true});setTimeout(dismissBoot,2400);

/* VIN */
$('#vinInput').addEventListener('input',e=>{e.target.value=cleanVin(e.target.value)});
$('#sampleVin').addEventListener('click',()=>{$('#vinInput').value='1HGCM82633A004352';decodeVin('1HGCM82633A004352')});
$('#vinForm').addEventListener('submit',e=>{e.preventDefault();decodeVin($('#vinInput').value)});
async function decodeVin(raw){
  const vin=cleanVin(raw); $('#vinInput').value=vin;
  if(!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)){toast('VIN must be 17 valid characters');$('#vinInput').focus();return}
  const request=++decodeRequest;
  setBusy(true);
  try{
    const res=await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`);
    if(!res.ok)throw new Error('VIN service unavailable');
    const json=await res.json(), v=json.Results&&json.Results[0];
    if(request!==decodeRequest)return;
    if(!v)throw new Error('No decode returned');
    if(v.ErrorCode && !String(v.ErrorCode).split(',').includes('0') && (!v.Make||!v.Model)) throw new Error(v.ErrorText||'VIN could not be decoded');
    state.vehicle={...v,VIN:vin};
    renderVehicle();
    $('#workspace').classList.remove('hidden');
    $('#workspace').scrollIntoView({behavior:'smooth',block:'start'});
    Promise.allSettled([loadRecalls(),loadComplaints()]);
  }catch(err){if(request===decodeRequest)toast(err.message||'Could not decode VIN')}finally{if(request===decodeRequest)setBusy(false)}
}
function setBusy(on){const b=$('#vinForm button[type=submit]');b.disabled=on;b.innerHTML=on?'DECODING…':'DECODE VEHICLE <span>→</span>';$('#heroBayStatus').textContent=on?'READING VIN':state.vehicle?'VEHICLE DECODED':'AWAITING VIN'}
function name(v){return [v.Make,v.Model].filter(Boolean).join(' ')||'Unknown vehicle'}
function renderVehicle(){const v=state.vehicle;if(!v)return;
  $('#vehicleYear').textContent=val(v.ModelYear); $('#vehicleName').textContent=name(v); $('#vehicleTrim').textContent=[v.Trim,v.Series,v.BodyClass].filter(Boolean).join(' · ')||'Decoded vehicle profile';
  $('#vehicleVin').textContent=v.VIN; $('#decodeStatus').textContent=(v.ErrorCode==='0'||String(v.ErrorCode||'').startsWith('0'))?'DECODED':'PARTIAL';
  $('#bayMake').textContent=`${val(v.Make)} / ${val(v.Model)}`; $('#bayEngine').textContent=engineText(v); $('#bayDrive').textContent=val(v.DriveType); $('#heroBayStatus').textContent='VEHICLE ONLINE';
  $('#serviceVehicle').textContent=`${val(v.ModelYear)} ${name(v)}`; renderDna();renderTech();renderScan('power');renderServices(); updateSaveButton();
  document.dispatchEvent(new CustomEvent('cd:vehicle',{detail:v}));
}
function engineText(v){const bits=[];if(v.DisplacementL)bits.push(`${parseFloat(v.DisplacementL).toFixed(1)}L`);if(v.EngineCylinders)bits.push(`${v.EngineCylinders} CYL`);if(v.FuelTypePrimary)bits.push(v.FuelTypePrimary);return bits.join(' · ')||'POWERTRAIN –'}
function renderDna(){const v=state.vehicle;const rows=[
 ['POWER',engineText(v),v.EngineConfiguration||v.EngineModel],['DRIVE',val(v.DriveType),v.Axles?`${v.Axles} axles`:v.DriveType],['TRANSMISSION',val(v.TransmissionStyle),v.TransmissionSpeeds?`${v.TransmissionSpeeds} speeds`:v.TransmissionStyle],['BODY',val(v.BodyClass),v.Doors?`${v.Doors} doors`:v.VehicleType],
 ['BUILD',val(v.PlantCountry),[v.PlantCity,v.PlantState].filter(Boolean).join(', ')],['MANUFACTURER',val(v.Manufacturer),v.ManufacturerId?`NHTSA manufacturer ID ${v.ManufacturerId}`:''],['FUEL',val(v.FuelTypePrimary),v.FuelTypeSecondary||v.ElectrificationLevel],['BRAKES',val(v.BrakeSystemType),v.BrakeSystemDesc]
 ];
 $('#dnaGrid').innerHTML=rows.map(r=>`<article class="dna-card"><span>${esc(r[0])}</span><b>${esc(r[1]||'–')}</b><small>${esc(r[2]||'No additional VIN field')}</small></article>`).join('');
}
function renderTech(){const v=state.vehicle;const tech=[['ABS',v.ABS],['ESC',v.ESC],['TPMS',v.TPMS],['TRACTION',v.TractionControl],['FORWARD COLLISION',v.ForwardCollisionWarning],['LANE WARNING',v.LaneDepartureWarning],['LANE KEEP',v.LaneKeepSystem],['BLIND SPOT',v.BlindSpotMon],['ADAPTIVE CRUISE',v.AdaptiveCruiseControl],['REAR CROSS TRAFFIC',v.RearCrossTrafficAlert],['FRONT AIRBAGS',v.AirBagLocFront],['CURTAIN AIRBAGS',v.AirBagLocCurtain]];
 $('#techStrip').innerHTML=tech.map(([k,x])=>{const xval=val(x),yes=/standard|yes|all|1st|row|front|driver|passenger/i.test(xval);return `<div class="tech-chip"><span>${esc(k)}</span><b class="${yes?'yes':''}">${esc(xval)}</b></div>`}).join('');
}
function renderScan(mode){const v=state.vehicle;if(!v)return;$$('#scanTabs button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('#scanMode').textContent=mode.toUpperCase();
 const power=$$('.sys-line.power'), signal=$$('.sys-line.signal'); power.forEach(x=>x.style.opacity=mode==='power'?'1':'.13');signal.forEach(x=>x.style.opacity=mode==='safety'?'1':'.13');
 const copy={power:`<b>${esc(engineText(v))}</b> feeds a ${esc(val(v.TransmissionStyle))} transmission into ${esc(val(v.DriveType))}. The map is a conceptual flow view; VIN data identifies the architecture, not the exact physical component placement.`,safety:`<b>Safety layer:</b> ABS ${esc(val(v.ABS))}, stability control ${esc(val(v.ESC))}, TPMS ${esc(val(v.TPMS))}. Driver-assistance fields are shown below exactly as NHTSA reports them.`,identity:`<b>Build layer:</b> ${esc(val(v.Manufacturer))}. ${v.PlantCity||v.PlantCountry?`Assembly reported at ${esc([v.PlantCity,v.PlantState,v.PlantCountry].filter(Boolean).join(', '))}.`: 'No plant location was returned for this VIN.'}`};
 $('#scanCopy').innerHTML=copy[mode];
}
$('#scanTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-mode]');if(b)renderScan(b.dataset.mode)});

/* safety APIs */
async function loadRecalls(){const v=state.vehicle;if(!v)return;state.recalls=[];$('#recallCount').textContent='–';$('#recallList').textContent='Checking NHTSA recall database…';
 try{const u=`https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(v.Make)}&model=${encodeURIComponent(v.Model)}&modelYear=${encodeURIComponent(v.ModelYear)}`;const r=await fetch(u);if(!r.ok)throw new Error();const j=await r.json();if(state.vehicle!==v)return;state.recalls=j.results||j.Results||[];renderRecalls()}catch(e){if(state.vehicle!==v)return;$('#recallCount').textContent='–';$('#recallList').innerHTML='<div class="loading-block">Recall service could not be reached. Try again later.</div>'}}
function renderRecalls(){const a=state.recalls;$('#recallCount').textContent=a.length;if(!a.length){$('#recallList').innerHTML='<div class="loading-block">No recalls were returned for this year / make / model search. Verify VIN-specific status with NHTSA or the manufacturer.</div>';return}
 $('#recallList').innerHTML=a.map(x=>`<div class="recall-item"><div class="recall-meta"><span>${esc(x.NHTSACampaignNumber||'NHTSA RECALL')}</span><span>${esc(x.ReportReceivedDate||'')}</span></div><h3>${esc(x.Component||'Recall')}</h3><p>${esc(shorten(x.Summary||x.Consequence||'',210))}</p><details><summary>READ CONSEQUENCE + REMEDY</summary><p><b>Consequence:</b> ${esc(x.Consequence||'Not provided')}</p><p><b>Remedy:</b> ${esc(x.Remedy||'Not provided')}</p></details></div>`).join('')}
async function loadComplaints(){const v=state.vehicle;if(!v)return;state.complaints=[];$('#complaintCount').textContent='–';$('#complaintChart').textContent='Reading complaint components…';
 try{const u=`https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(v.Make)}&model=${encodeURIComponent(v.Model)}&modelYear=${encodeURIComponent(v.ModelYear)}`;const r=await fetch(u);if(!r.ok)throw new Error();const j=await r.json();if(state.vehicle!==v)return;state.complaints=j.results||j.Results||[];renderComplaints()}catch(e){if(state.vehicle!==v)return;$('#complaintCount').textContent='–';$('#complaintChart').innerHTML='<div class="loading-block">Complaint service could not be reached.</div>'}}
function renderComplaints(){const a=state.complaints;$('#complaintCount').textContent=a.length;if(!a.length){$('#complaintChart').innerHTML='<div class="loading-block">No complaint records were returned for this search.</div>';return}const counts={};
 a.forEach(x=>{let c=x.components||x.Component||x.component||x.COMPONENT||'Uncategorized';if(Array.isArray(c))c=c.join(',');String(c).split(/,|;/).map(s=>s.trim()).filter(Boolean).forEach(s=>counts[s]=(counts[s]||0)+1)});const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8),max=rows[0]?.[1]||1;
 $('#complaintChart').innerHTML=rows.map(([k,n])=>`<div class="complaint-row"><span title="${esc(k)}">${esc(k)}</span><div class="complaint-bar"><i style="width:${Math.max(4,n/max*100)}%"></i></div><b>${n}</b></div>`).join('')+`<div class="complaint-note">${fmt.format(a.length)} NHTSA complaint records returned. This is a count of submitted reports for this model search, not a defect rate and not normalized by vehicles sold.</div>`}
function shorten(s,n){s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'…':s}

/* cost calculator */
['milesYear','mpg','fuelPrice','insurance','payment','maintenance','energyModel','kwhUse','electricPrice'].forEach(id=>$('#'+id).addEventListener('input',calcCost));
function calcCost(){
 const ids=['milesYear','insurance','payment','maintenance',...($('#energyModel').value==='ev'?['kwhUse','electricPrice']:['mpg','fuelPrice'])];
 const valid=ids.every(id=>{const el=$('#'+id);return el.value.trim()!==''&&el.validity.valid&&Number.isFinite(Number(el.value))});
 const ev=$('#energyModel').value==='ev';['mpgLabel','gasLabel'].forEach(id=>$('#'+id).hidden=ev);['kwhLabel','electricLabel'].forEach(id=>$('#'+id).hidden=!ev);
 if(!valid){['annualCost','monthlyCost','mileCost','fuelCost'].forEach(id=>$('#'+id).textContent='–');$('#costBreakdown').innerHTML='';$('#costExplanation').textContent='Enter valid, non-negative values in each visible field to calculate your budget.';return}
 const num=id=>Number($('#'+id).value),miles=num('milesYear'),energy=ev?miles/100*num('kwhUse')*num('electricPrice'):miles/num('mpg')*num('fuelPrice');
 const rows=[['Energy',energy],['Insurance',num('insurance')*12],['Payments',num('payment')*12],['Maintenance',num('maintenance')]],total=rows.reduce((sum,r)=>sum+r[1],0);
 $('#annualCost').textContent=money(total);$('#monthlyCost').textContent=money(total/12);$('#mileCost').textContent=miles?`$${(total/miles).toFixed(2)}`:'–';$('#fuelCost').textContent=money(energy);
 $('#costRing').style.strokeDashoffset=String(553*(1-(total?energy/total:0)));
 $('#costBreakdown').innerHTML=rows.map(([label,value])=>`<div><span>${label}</span><b>${money(value)}</b><i style="width:${total?value/total*100:0}%"></i></div>`).join('');
 $('#costExplanation').textContent=`${ev?'Electricity':'Fuel'} is ${total?Math.round(energy/total*100):0}% of this annual cash budget. The ring shows that share. ${miles?'Change one assumption to see its effect.':'Per-mile cost needs annual mileage above zero.'}`;
}calcCost();

/* OBD */
const CODES={
 P0300:{t:'Random / multiple cylinder misfire',sys:'Combustion',means:'The PCM detected misfires across more than one cylinder. The code does not identify the failed part.',first:'Check for companion cylinder-specific codes, ignition condition, vacuum leaks and fuel delivery before replacing parts.'},
 P0420:{t:'Catalyst efficiency below threshold, Bank 1',sys:'Emissions',means:'The downstream oxygen-sensor pattern suggests the catalyst is storing less oxygen than expected.',first:'Check for exhaust leaks, misfires, fuel-trim problems and sensor issues before condemning the catalytic converter.'},
 P0171:{t:'System too lean, Bank 1',sys:'Fuel / air',means:'Fuel trim has moved rich to compensate for a mixture the PCM sees as too lean.',first:'Inspect unmetered-air leaks, intake plumbing, MAF data, fuel pressure and injector delivery.'},
 P0455:{t:'EVAP system leak detected, large leak',sys:'Evaporative emissions',means:'The sealed fuel-vapor system cannot hold the expected pressure or vacuum.',first:'Start with the fuel cap and obvious EVAP hoses, then smoke-test the system if needed.'},
 P0442:{t:'EVAP system leak detected, small leak',sys:'Evaporative emissions',means:'The EVAP monitor found a smaller leak than a P0455 condition.',first:'Inspect cap seal, purge/vent valves and small vapor lines; a smoke test is often the fastest confirmation.'},
 P0128:{t:'Coolant thermostat below regulating temperature',sys:'Cooling',means:'The engine is warming more slowly, or running cooler, than the PCM expects.',first:'Compare actual coolant temperature with sensor data; check coolant level and thermostat operation.'},
 P0101:{t:'Mass air flow range / performance',sys:'Air metering',means:'MAF airflow does not agree with the airflow the PCM expects from other operating data.',first:'Check intake leaks and restrictions, MAF contamination/wiring and compare grams-per-second data under load.'},
 P0135:{t:'O2 sensor heater circuit, Bank 1 Sensor 1',sys:'Emissions / electrical',means:'The upstream oxygen sensor heater circuit is not drawing or responding as expected.',first:'Verify fuse power, heater resistance, wiring and connector condition before replacing the sensor.'}
};
$('#decodeObd').addEventListener('click',()=>renderObd($('#obdCode').value));$('#obdCode').addEventListener('keydown',e=>{if(e.key==='Enter')renderObd(e.target.value)});$$('.quick-codes button').forEach(b=>b.addEventListener('click',()=>{$('#obdCode').value=b.textContent;renderObd(b.textContent)}));
function renderObd(raw){const code=String(raw||'').toUpperCase().replace(/\s/g,'');$('#obdCode').value=code;const d=CODES[code];if(d){$('#obdResult').innerHTML=`<span>${esc(code)} / ${esc(d.sys)}</span><h3>${esc(d.t)}</h3><div class="diag-grid"><div><b>WHAT THE CODE SAYS</b><p>${esc(d.means)}</p></div><div><b>START HERE</b><p>${esc(d.first)}</p></div></div><p>Generic OBD-II reference only. Confirm manufacturer-specific diagnostic information before repair.</p>`;return}const family=/^[PBCU][0-3][0-9A-F]{3}$/.test(code)?({P:'Powertrain',B:'Body',C:'Chassis',U:'Network'})[code[0]]:null;$('#obdResult').innerHTML=family?`<span>${esc(code)} / ${family.toUpperCase()}</span><h3>Valid code family.</h3><p>This quick desk does not yet have a curated entry for ${esc(code)}. Use the vehicle-specific service information for the exact definition; manufacturer-specific meanings can differ.</p>`:`<span>CODE DESK</span><h3>Check the format.</h3><p>Use a five-character OBD-II code such as P0300 or P0420.</p>`}

/* garage */
function updateSaveButton(){const v=state.vehicle;if(!v)return;const saved=getGarage().some(x=>x.VIN===v.VIN);$('#saveVehicle').textContent=saved?'SAVED IN GARAGE':'+ SAVE TO GARAGE';$('#saveVehicle').disabled=saved}
$('#saveVehicle').addEventListener('click',()=>{const v=state.vehicle;if(!v)return;const g=getGarage();if(!g.some(x=>x.VIN===v.VIN)){g.unshift({VIN:v.VIN,Make:v.Make,Model:v.Model,ModelYear:v.ModelYear,Trim:v.Trim,DriveType:v.DriveType,FuelTypePrimary:v.FuelTypePrimary,savedAt:Date.now()});saveGarage(g);updateSaveButton();toast('Vehicle saved locally')}});
function renderGarage(){const g=getGarage();$('#garageCount').textContent=g.length;$('#garageList').innerHTML=g.length?g.map(x=>`<article class="garage-card" data-vin="${esc(x.VIN)}"><span>${esc(x.ModelYear||'')} / ${esc(x.FuelTypePrimary||'VEHICLE')}</span><h3>${esc([x.Make,x.Model].filter(Boolean).join(' '))}</h3><p>${esc(x.VIN)}</p><div><button data-load>OPEN VEHICLE</button><button data-remove>REMOVE</button></div></article>`).join(''):'<div class="garage-empty">No saved vehicles yet. Decode a VIN and save it here.</div>'}
function openGarage(){renderGarage();$('#garageDrawer').classList.add('open');$('#garageDrawer').setAttribute('aria-hidden','false');$('#scrim').classList.add('on')}function closeGarage(){$('#garageDrawer').classList.remove('open');$('#garageDrawer').setAttribute('aria-hidden','true');$('#scrim').classList.remove('on')}
$('#garageBtn').addEventListener('click',openGarage);$('#closeGarage').addEventListener('click',closeGarage);$('#scrim').addEventListener('click',closeGarage);
$('#garageList').addEventListener('click',e=>{const card=e.target.closest('.garage-card');if(!card)return;const vin=card.dataset.vin;if(e.target.closest('[data-load]')){closeGarage();$('#vinInput').value=vin;decodeVin(vin)}if(e.target.closest('[data-remove]')){saveGarage(getGarage().filter(x=>x.VIN!==vin));if(state.vehicle?.VIN===vin)updateSaveButton();toast('Removed from garage')}});renderGarage();

/* service log */
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
$('#serviceDate').value=localDate();
$('#serviceForm').addEventListener('submit',e=>{e.preventDefault();const v=state.vehicle;if(!v){toast('Decode a vehicle first');return}const all=getServices(),list=all[v.VIN]||[];list.push({id:Date.now(),date:$('#serviceDate').value,miles:+$('#serviceMiles').value||0,type:$('#serviceType').value.trim(),cost:+$('#serviceCost').value||0,notes:$('#serviceNotes').value.trim()});all[v.VIN]=list;saveServices(all);e.target.reset();$('#serviceDate').value=localDate();renderServices();toast('Service event added')});
function renderServices(){const v=state.vehicle;if(!v)return;const a=(getServices()[v.VIN]||[]).slice().sort((x,y)=>String(y.date).localeCompare(String(x.date)));$('#serviceTotal').textContent=money(a.reduce((s,x)=>s+(+x.cost||0),0));$('#serviceList').innerHTML=a.length?a.map(x=>`<div class="timeline-item" data-id="${x.id}"><span class="date">${esc(x.date||'–')}</span><span class="miles">${x.miles?fmt.format(x.miles)+' MI':'MILES –'}</span><div class="copy"><h4>${esc(x.type)}</h4>${x.notes?`<p>${esc(x.notes)}</p>`:''}</div><div><span class="price">${money(x.cost)}</span><button data-del>REMOVE</button></div></div>`).join(''):'<div class="timeline-empty">No service events logged for this VIN yet.</div>'}
$('#serviceList').addEventListener('click',e=>{const row=e.target.closest('.timeline-item');if(!row||!e.target.closest('[data-del]')||!state.vehicle)return;const all=getServices();all[state.vehicle.VIN]=(all[state.vehicle.VIN]||[]).filter(x=>String(x.id)!==row.dataset.id);saveServices(all);renderServices()});

/* utilities */
$('#copyVin').addEventListener('click',async()=>{if(!state.vehicle)return;try{await navigator.clipboard.writeText(state.vehicle.VIN);toast('VIN copied')}catch(e){toast('Copy unavailable')}});
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeGarage();if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('#vinInput').focus()}});
})();
