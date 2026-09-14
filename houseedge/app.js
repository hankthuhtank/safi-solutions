(()=>{
'use strict';
const photoSheet=document.createElement('link');photoSheet.rel='stylesheet';photoSheet.href='photos.css';document.head.append(photoSheet);
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
function implied(o){o=Number(o);if(!Number.isFinite(o)||o===0)return NaN;return o<0?(-o)/((-o)+100):100/(o+100)}
function profit(o,s){o=Number(o);s=Number(s);if(!Number.isFinite(o)||!Number.isFinite(s)||o===0||s<0)return NaN;return o<0?s*100/(-o):s*o/100}
function syncOdds(){const o=+$('#americanOdds').value,s=+$('#stake').value,p=implied(o),pr=profit(o,s);$('#probOut').textContent=Number.isFinite(p)?(p*100).toFixed(2)+'%':'—';$('#profitOut').textContent=Number.isFinite(pr)?money(pr):'—';$('#returnOut').textContent=Number.isFinite(pr)?money(pr+s):'—'}
['americanOdds','stake'].forEach(id=>$('#'+id)?.addEventListener('input',syncOdds));syncOdds();
const drawer=$('#helpDrawer'),backdrop=$('#drawerBackdrop');
function openHelp(){drawer.classList.add('open');backdrop.classList.add('open');drawer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeHelp(){drawer.classList.remove('open');backdrop.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.style.overflow=''}
['helpOpen','floatingHelp','startHere'].forEach(id=>$('#'+id)?.addEventListener('click',openHelp));
$('#helpClose')?.addEventListener('click',closeHelp);backdrop?.addEventListener('click',closeHelp);$('#helpJump')?.addEventListener('click',closeHelp);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeHelp()});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');observer.unobserve(e.target)}}),{threshold:.08});
$$('.chapter>*,.game-selector>*,.odds-lab>*,.responsibility>*').forEach(el=>{el.classList.add('reveal');observer.observe(el)});
if(window.Matter&&innerWidth>760){const canvas=$('#chips'),{Engine,Render,Runner,Bodies,Composite,Body}=Matter;const engine=Engine.create();engine.gravity.y=.18;const render=Render.create({canvas,engine,options:{width:innerWidth,height:innerHeight,pixelRatio:Math.min(devicePixelRatio||1,1.4),wireframes:false,background:'transparent'}});const floor=Bodies.rectangle(innerWidth/2,innerHeight+70,innerWidth+200,120,{isStatic:true,render:{visible:false}});Composite.add(engine.world,floor);const colors=['#c6a34e','#315e45','#8d3430','#dcd2b8'];for(let i=0;i<15;i++){const r=7+Math.random()*8,b=Bodies.circle(Math.random()*innerWidth,-100-Math.random()*innerHeight*.8,r,{restitution:.7,frictionAir:.01,render:{fillStyle:colors[i%colors.length],strokeStyle:'rgba(255,255,255,.18)',lineWidth:1}});Body.setAngularVelocity(b,(Math.random()-.5)*.05);Composite.add(engine.world,b)}Render.run(render);Runner.run(Runner.create(),engine)}
})();