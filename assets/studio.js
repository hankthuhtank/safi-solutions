(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storage = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k,v) { try { localStorage.setItem(k,v); } catch {} } };
  $('#year').textContent = new Date().getFullYear();
  const menu = $('#menu-toggle'), navigation = $('#navigation');
  const closeMenu = () => { menu.setAttribute('aria-expanded','false'); navigation.classList.remove('is-open'); };
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open',open); });
  navigation.addEventListener('click',e => { if(e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown',e => { if(e.key === 'Escape' && navigation.classList.contains('is-open')) { closeMenu(); menu.focus(); } });
  document.addEventListener('click', e => { if(!e.target.closest('.masthead')) closeMenu(); });
  window.matchMedia('(min-width: 801px)').addEventListener?.('change', e => { if(e.matches) closeMenu(); });

  const concepts = {
    coffee: { image:'assets/showcase/coffee-dashboard.webp', alt:'Coffee-shop sample dashboard with orders, inventory, staff schedule and daily close', number:'01 / HOSPITALITY', title:'From the first order\nto the daily close.', copy:'Sample orders, inventory records, staff schedules and a daily close — shown in the app’s existing dashboard layout.', label:'Coffee shop — sample dashboard' },
    pest: { image:'assets/showcase/pest-dashboard.webp', alt:'Pest-control sample dashboard with jobs, sales pipeline, scheduling and invoices', number:'02 / FIELD SERVICES', title:'A clear view\nof the day ahead.', copy:'Sample service jobs, sales enquiries, employee schedules and outstanding invoices — the same dashboard, set up for a pest-control business.', label:'Pest control — sample dashboard' }
  };
  let selected = 'coffee';
  const tabs = Array.from(document.querySelectorAll('[data-concept]'));
  function selectConcept(id, focus = false) {
    const c = concepts[id]; if(!c) return; selected = id;
    tabs.forEach(tab => { const active = tab.dataset.concept === id; tab.setAttribute('aria-selected',String(active)); tab.tabIndex = active ? 0 : -1; if(active && focus) tab.focus(); });
    $('#concept-panel').setAttribute('aria-labelledby',id+'-tab');
    $('#concept-image').src = c.image; $('#concept-image').alt = c.alt;
    $('#concept-number').textContent = c.number;
    $('#concept-title').textContent = c.title; $('#concept-title').style.whiteSpace='pre-line';
    $('#concept-copy').textContent = c.copy;
    $('#dialog-image').src = c.image; $('#dialog-image').alt = c.alt; $('#dialog-title').textContent = c.label;
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',() => selectConcept(tab.dataset.concept));
    tab.addEventListener('keydown',e => {
      let next;
      if(e.key==='ArrowRight') next=(index+1)%tabs.length;
      if(e.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
      if(e.key==='Home') next=0;
      if(e.key==='End') next=tabs.length-1;
      if(next!==undefined) { e.preventDefault(); selectConcept(tabs[next].dataset.concept,true); }
    });
  });
  const dialog = $('#concept-dialog'), expand = $('#expand-concept');
  expand.addEventListener('click',() => { selectConcept(selected); if(typeof dialog.showModal==='function') { dialog.showModal(); document.body.classList.add('dialog-open'); } else window.open(concepts[selected].image,'_blank','noopener'); });
  $('#close-concept').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',() => { document.body.classList.remove('dialog-open'); expand.focus(); });
  dialog.addEventListener('click',e => { if(e.target===dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close(); } });
  const filterButtons=Array.from(document.querySelectorAll('[data-filter]'));
  filterButtons.forEach(button=>button.addEventListener('click',()=> {
    filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    let count=0;document.querySelectorAll('.lab-item').forEach(item=>{item.hidden=button.dataset.filter!=='all'&&item.dataset.category!==button.dataset.filter;if(!item.hidden)count++;});
    $('#project-count').textContent=count+' projects';
  }));
  document.querySelectorAll('[data-interest]').forEach(link=>link.addEventListener('click',()=>{const select=$('#iq-interest');if(Array.from(select.options).some(o=>o.value===link.dataset.interest))select.value=link.dataset.interest;}));

  // A restrained animated drafting field; one canvas, no external animation dependency.
  const canvas=$('#studio-particles'),ctx=canvas.getContext('2d'),hero=$('.hero'),toggle=$('#motion-toggle');
  let preference=storage.get('safi-portfolio-motion')==='paused', paused=preference||reduced.matches, raf=0, visible=true, w=1,h=1,last=0;
  const pointer={x:-1000,y:-1000};let points=[];
  function resize(){const r=hero.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.floor(w*d));canvas.height=Math.max(1,Math.floor(h*d));ctx?.setTransform(d,0,0,d,0,0);points=Array.from({length:Math.min(90,Math.max(25,Math.round(w/20)))},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.1,vy:(Math.random()-.5)*.12}));}
  function frame(now){raf=0;if(paused||document.hidden||!visible||!ctx)return;const dt=Math.min(2,(now-last)/16.67||1);last=now;ctx.clearRect(0,0,w,h);for(let i=0;i<points.length;i++){const p=points[i];p.x=(p.x+p.vx*dt+w)%w;p.y=(p.y+p.vy*dt+h)%h;const near=Math.hypot(pointer.x-p.x,pointer.y-p.y)<180;ctx.fillStyle=near?'#b6d9ff':'#769dc87a';ctx.beginPath();ctx.arc(p.x,p.y,near?1.6:1,0,Math.PI*2);ctx.fill();if(near){ctx.strokeStyle='#9bcaff18';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.stroke();}}raf=requestAnimationFrame(frame);}
  function sync(){cancelAnimationFrame(raf);raf=0;paused=preference||reduced.matches;document.documentElement.classList.toggle('motion-paused',paused);toggle.disabled=reduced.matches;toggle.textContent=reduced.matches?'Reduced motion':paused?'Play motion':'Pause motion';toggle.setAttribute('aria-pressed',String(paused));if(!paused&&!document.hidden&&visible&&ctx)raf=requestAnimationFrame(frame);}
  toggle.addEventListener('click',()=>{preference=!preference;storage.set('safi-portfolio-motion',preference?'paused':'playing');sync();});
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;},{passive:true});hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-1000;});
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(hero);else window.addEventListener('resize',resize,{passive:true});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(hero);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener?.('change',sync);window.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});resize();sync();
})();
