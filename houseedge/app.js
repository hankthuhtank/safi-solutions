(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmtMoney=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
function implied(odds){odds=Number(odds);if(!Number.isFinite(odds)||odds===0)return NaN;return odds<0?(-odds)/((-odds)+100):100/(odds+100)}
function profit(odds,stake){odds=Number(odds);stake=Number(stake);if(!Number.isFinite(odds)||!Number.isFinite(stake)||odds===0||stake<0)return NaN;return odds<0?stake*100/(-odds):stake*odds/100}
function syncQuick(){const o=+$('#quickOdds').value,p=implied(o),pr=profit(o,100);$('#quickProb').textContent=Number.isFinite(p)?(p*100).toFixed(2)+'%':'—';$('#quickProfit').textContent=Number.isFinite(pr)?fmtMoney(pr):'—'}
$('#quickOdds')?.addEventListener('input',syncQuick);syncQuick();
function syncCalc(){const o=+$('#americanOdds').value,s=+$('#stake').value,p=implied(o),pr=profit(o,s);$('#impliedOut').textContent=Number.isFinite(p)?(p*100).toFixed(2)+'%':'—';$('#profitOut').textContent=Number.isFinite(pr)?fmtMoney(pr):'—';$('#returnOut').textContent=Number.isFinite(pr)?fmtMoney(pr+s):'—'}
['americanOdds','stake'].forEach(id=>$('#'+id)?.addEventListener('input',syncCalc));syncCalc();
const termCopy={spread:'Spread: the favorite gives points; the underdog receives them. The bet wins based on the adjusted final score.',moneyline:'Moneyline: no point spread. You are pricing the chance that a team or player wins outright.',total:'Total: you are betting whether the combined scoring lands over or under the posted number.',parlay:'Parlay: multiple selections are combined. Every leg usually must win, so the payout rises because the probability falls quickly.'};
$$('[data-term]').forEach(b=>b.addEventListener('click',()=>{$$('[data-term]').forEach(x=>x.classList.toggle('on',x===b));$('#termAnswer').textContent=termCopy[b.dataset.term]}));
const motion=$('#motionBtn');let off=false;motion?.addEventListener('click',()=>{off=!off;document.documentElement.classList.toggle('motion-off',off);motion.setAttribute('aria-pressed',String(off));motion.textContent=off?'Motion off':'Motion on'});

// Matter.js chip field: decorative only; the site still works if the library/CDN is unavailable.
if(window.Matter){
  const canvas=$('#chip-canvas'),{Engine,Runner,Bodies,Composite,Render,Events,Body}=Matter;
  const engine=Engine.create();engine.gravity.y=.28;
  const render=Render.create({canvas,engine,options:{width:innerWidth,height:innerHeight,wireframes:false,background:'transparent',pixelRatio:Math.min(devicePixelRatio||1,1.5)}});
  const wall=80;const bounds=[Bodies.rectangle(innerWidth/2,innerHeight+wall/2,innerWidth+200,wall,{isStatic:true,render:{visible:false}}),Bodies.rectangle(-wall/2,innerHeight/2,wall,innerHeight*2,{isStatic:true,render:{visible:false}}),Bodies.rectangle(innerWidth+wall/2,innerHeight/2,wall,innerHeight*2,{isStatic:true,render:{visible:false}})];Composite.add(engine.world,bounds);
  const palette=['#d6b768','#7cc8a0','#d84c49','#e7dfc9','#4a8769'];
  for(let i=0;i<22;i++){
    const r=10+Math.random()*11;const body=Bodies.circle(Math.random()*innerWidth,-80-Math.random()*innerHeight*.7,r,{restitution:.72,friction:.03,frictionAir:.012,render:{fillStyle:palette[i%palette.length],strokeStyle:'rgba(255,255,255,.25)',lineWidth:1}});Body.setAngularVelocity(body,(Math.random()-.5)*.06);Composite.add(engine.world,body)
  }
  Render.run(render);const runner=Runner.create();Runner.run(runner,engine);
  window.addEventListener('resize',()=>{render.canvas.width=innerWidth*Math.min(devicePixelRatio||1,1.5);render.canvas.height=innerHeight*Math.min(devicePixelRatio||1,1.5);render.options.width=innerWidth;render.options.height=innerHeight});
  Events.on(engine,'afterUpdate',()=>{if(off)engine.timing.timeScale=0;else engine.timing.timeScale=1});
}

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('seen')}),{threshold:.12});
$$('.game-sheet,.split-sheet,.poker-table,.sports-grid,.lab-grid,.reality-grid').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(18px)';el.style.transition='opacity .6s ease,transform .6s ease';observer.observe(el)});
const style=document.createElement('style');style.textContent='.seen{opacity:1!important;transform:none!important}';document.head.append(style);
})();
