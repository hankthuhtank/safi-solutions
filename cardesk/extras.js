(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

const css=document.createElement('style');
css.textContent=`
/* CarDesk v4 — zero fake car drawings */
.vehicle-stage{min-height:590px;overflow:hidden;background:radial-gradient(circle at 50% 46%,rgba(22,133,255,.10),transparent 34%),linear-gradient(180deg,rgba(12,25,40,.98),rgba(6,16,28,.98))!important}
.vehicle-stage:before{content:"";position:absolute;inset:44px 0 48px;background-image:linear-gradient(rgba(110,155,198,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(110,155,198,.05) 1px,transparent 1px);background-size:34px 34px;mask-image:radial-gradient(circle at 50% 50%,#000 0 45%,transparent 78%);pointer-events:none}
.car-hero{display:none!important}
.intel-core{position:relative;height:490px;margin:4px 0 0;isolation:isolate}
.intel-core .ring{position:absolute;left:50%;top:50%;translate:-50% -50%;border-radius:50%;border:1px solid rgba(77,178,255,.16);pointer-events:none}
.intel-core .ring.r1{width:206px;height:206px;border-color:rgba(255,152,31,.25);box-shadow:0 0 45px rgba(255,152,31,.05) inset}
.intel-core .ring.r2{width:326px;height:326px;border-style:dashed;animation:coreSpin 24s linear infinite}
.intel-core .ring.r3{width:438px;height:438px;border-color:rgba(43,215,255,.12);animation:coreSpinReverse 35s linear infinite}
.intel-core .ring:after{content:"";position:absolute;width:8px;height:8px;border-radius:50%;background:#2bd7ff;box-shadow:0 0 16px #2bd7ff;left:50%;top:-4px}
.intel-core .r1:after{background:#ff981f;box-shadow:0 0 16px #ff981f}
.core-center{position:absolute;left:50%;top:50%;translate:-50% -50%;width:164px;height:164px;border-radius:50%;display:grid;place-items:center;text-align:center;background:radial-gradient(circle at 45% 32%,#15324d,#0a1725 64%,#07111c);border:1px solid rgba(105,193,255,.28);box-shadow:0 0 0 10px rgba(22,133,255,.03),0 20px 60px rgba(0,0,0,.45),0 0 45px rgba(22,133,255,.12) inset;z-index:4}
.core-center:before{content:"";position:absolute;inset:13px;border-radius:50%;border:1px dashed rgba(109,201,255,.25);animation:coreSpin 15s linear infinite}
.core-center span{font:600 8px var(--mono);letter-spacing:.18em;color:#6f879e;position:relative}.core-center b{font:600 22px/1.05 var(--display);max-width:120px;position:relative}.core-center small{font:600 8px var(--mono);letter-spacing:.08em;color:#52d9ff;position:relative;max-width:120px}
.core-node{position:absolute;z-index:5;width:150px;min-height:66px;border:1px solid rgba(124,164,201,.15);background:rgba(10,23,37,.94);backdrop-filter:blur(10px);border-radius:14px;padding:12px 13px;text-align:left;box-shadow:0 12px 30px rgba(0,0,0,.24);transition:.2s ease}
.core-node:hover{transform:translateY(-3px);border-color:rgba(52,194,255,.45);box-shadow:0 16px 36px rgba(0,0,0,.3),0 0 24px rgba(22,133,255,.08)}
.core-node span{display:block;font:600 7px var(--mono);letter-spacing:.14em;color:#617990;margin-bottom:5px}.core-node b{display:block;font:600 14px var(--display);color:#f4f8fc}.core-node small{display:block;color:#7e93a8;font-size:9px;margin-top:3px}.core-node:before{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:#2bd7ff;box-shadow:0 0 12px #2bd7ff}.core-node.orange:before{background:#ff981f;box-shadow:0 0 12px #ff981f}
.node-vin{left:50%;top:4%;translate:-50% 0}.node-vin:before{left:50%;bottom:-4px}.node-safety{right:4%;top:22%}.node-safety:before{left:-4px;top:50%}.node-cost{right:4%;bottom:17%}.node-cost:before{left:-4px;top:50%}.node-service{left:50%;bottom:2%;translate:-50% 0}.node-service:before{left:50%;top:-4px}.node-diag{left:4%;bottom:17%}.node-diag:before{right:-4px;top:50%}.node-power{left:4%;top:22%}.node-power:before{right:-4px;top:50%}
.core-path{position:absolute;height:1px;background:linear-gradient(90deg,transparent,rgba(43,215,255,.48),transparent);transform-origin:left center;z-index:1;opacity:.7}.path-a{width:150px;left:27%;top:32%;rotate:28deg}.path-b{width:150px;right:27%;top:32%;rotate:-28deg}.path-c{width:158px;right:25%;top:66%;rotate:26deg}.path-d{width:158px;left:25%;top:66%;rotate:-26deg}.path-e{width:98px;left:50%;top:21%;rotate:90deg}.path-f{width:90px;left:50%;bottom:21%;rotate:90deg}.core-path:after{content:"";position:absolute;width:34px;height:1px;background:#fff;box-shadow:0 0 8px #2bd7ff;animation:dataRun 2.6s linear infinite}
.intel-hint{position:absolute;right:15px;bottom:60px;font:500 7px var(--mono);letter-spacing:.12em;color:#526b83;text-transform:uppercase}

.bay-readout{z-index:8}

/* replace lower fake vehicle drawing with abstract system topology */
.scan-visual svg{display:none!important}
.system-topology{height:100%;min-height:300px;position:relative;display:grid;place-items:center;background:radial-gradient(circle at center,rgba(22,133,255,.09),transparent 38%)}
.topo-center{width:112px;height:112px;border-radius:24px;display:grid;place-items:center;text-align:center;background:#0d1c2b;border:1px solid rgba(66,184,255,.27);box-shadow:0 0 45px rgba(22,133,255,.08)}
.topo-center span{font:600 7px var(--mono);letter-spacing:.12em;color:#6c8399}.topo-center b{font:600 18px var(--display)}
.topo-node{position:absolute;min-width:110px;padding:10px 12px;border:1px solid rgba(122,160,197,.15);border-radius:12px;background:#0b1724;text-align:center;transition:.2s ease}.topo-node b{display:block;font:600 11px var(--display)}.topo-node small{font-size:8px;color:#6d8397}.topo-node.active{border-color:rgba(255,152,31,.52);box-shadow:0 0 24px rgba(255,152,31,.08)}
.topo-power{left:8%;top:22%}.topo-trans{left:8%;bottom:18%}.topo-safety{right:8%;top:22%}.topo-build{right:8%;bottom:18%}.topo-data{left:50%;bottom:8%;translate:-50% 0}
.topo-line{position:absolute;width:28%;height:1px;background:linear-gradient(90deg,rgba(43,215,255,.05),rgba(43,215,255,.45),rgba(43,215,255,.05));left:50%;top:50%;transform-origin:left center;z-index:-1}.tl1{rotate:205deg}.tl2{rotate:155deg}.tl3{rotate:-25deg}.tl4{rotate:25deg}.tl5{rotate:90deg;width:20%}

.garage-card h3{font:600 21px var(--display);margin:7px 0 5px}.garage-card p{margin:0;color:#6f8399;font:500 9px var(--mono)}.garage-card>div{display:flex;gap:7px;margin-top:12px}.garage-empty{padding:24px;color:#6d8197;font-size:12px}.timeline-item{grid-template-columns:85px 80px minmax(0,1fr) auto}.timeline-item .date,.timeline-item .miles{font:500 8px var(--mono);color:#64788e}.timeline-item .copy h4{margin:0;font-size:13px}.timeline-item .copy p{margin:4px 0 0;color:#778ba0;font-size:10px}.timeline-item .price{display:block;font:600 15px var(--display);text-align:right}.timeline-item [data-del]{border:0;background:transparent;color:#62778e;font:500 7px var(--mono);padding:5px 0 0}.timeline-item [data-del]:hover{color:#ff7169}
@keyframes coreSpin{to{rotate:360deg}}@keyframes coreSpinReverse{to{rotate:-360deg}}@keyframes dataRun{from{left:0;opacity:0}15%{opacity:1}85%{opacity:1}to{left:100%;opacity:0}}
@media(max-width:900px){.intel-core{height:520px}.core-node{width:135px}.node-power,.node-diag{left:2%}.node-safety,.node-cost{right:2%}.intel-core .r3{width:390px;height:390px}}
@media(max-width:650px){.intel-core{height:550px}.intel-core .ring.r3{width:300px;height:300px}.intel-core .ring.r2{width:250px;height:250px}.core-center{width:136px;height:136px}.core-node{width:126px;min-height:60px;padding:9px}.node-vin{top:2%}.node-service{bottom:2%}.node-power,.node-safety{top:23%}.node-diag,.node-cost{bottom:20%}.core-node small{display:none}.intel-hint{display:none}.system-topology{min-height:350px}.topo-node{min-width:92px}.topo-power,.topo-trans{left:2%}.topo-safety,.topo-build{right:2%}}
`;
document.head.appendChild(css);

/* Hero: a representative 3D vehicle (garage3d.js) replaces the old drawing; the three system buttons become a mode bar. */
const stage=$('.vehicle-stage');
if(stage){
  $('.car-hero',stage)?.replaceWith(Object.assign(document.createElement('div'),{className:'cd-machine',id:'cdMachine'}));
  const bar=document.createElement('div');bar.className='cd-modes';bar.setAttribute('role','group');bar.setAttribute('aria-label','Highlight a vehicle layer');
  $$('.hero-system',stage).forEach(b=>{b.setAttribute('aria-pressed','false');bar.append(b)});
  const readout=$('.bay-readout',stage);stage.insertBefore(bar,readout||null);
  const note=document.createElement('p');note.className='cd-note';note.id='cdNote';note.textContent='Representative model · configured from the VIN once decoded';stage.insertBefore(note,bar);
}

/* Lower architecture: the same representative 3D vehicle, driven by the scan tabs. */
const scanVisual=$('.scan-visual');
if(scanVisual){scanVisual.innerHTML='<div class="cd-machine cd-scan" id="cdScan"></div><p class="cd-note cd-scan-note">Representative model — the VIN identifies the architecture, not exact component placement.</p>'}

})();