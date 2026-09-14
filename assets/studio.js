(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const all = s => Array.from(document.querySelectorAll(s));
  const projects = window.SAFI_PROJECTS || [];
  const byId = new Map(projects.map(p => [p.id,p]));
  const pages = all('.page');
  const scrollPositions = new Map();
  let activePage = '', lastHash = '';
  document.documentElement.classList.add('js');
  $('#year').textContent = new Date().getFullYear();
  const menu = $('#menu-toggle'), mobileNav = $('#mobile-nav');
  const closeMenu = () => { menu.setAttribute('aria-expanded','false'); mobileNav.classList.remove('open'); };
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); mobileNav.classList.toggle('open',open); });
  mobileNav.addEventListener('click', e => { if(e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape' && mobileNav.classList.contains('open')) {closeMenu();menu.focus();} });
  const el = (tag,cls,text) => {const n=document.createElement(tag); if(cls)n.className=cls; if(text)n.textContent=text;return n;};
  function renderDetail(p) {
    $('#detail-title').textContent=p.name;
    $('#detail-type').textContent=p.type.toUpperCase();
    $('#detail-copy').textContent=p.detail;
    $('#detail-visit').href=p.url;
    $('#detail-visit').textContent=p.category==='websites'?'Visit website ↗':'Open project ↗';
    const group=projects.filter(item=>p.category==='websites'?item.category==='websites':item.category!=='websites'&&item.id!=='safistudios');
    const index=group.indexOf(p);
    $('#previous-project').href='#'+group[(index-1+group.length)%group.length].id;
    $('#next-project').href='#'+group[(index+1)%group.length].id;
    $('.detail-toolbar>a').href=p.category==='websites'?'#websites':'#work';
    $('.detail-toolbar>a').textContent=p.category==='websites'?'← All websites':'← All projects';
    const visual=$('#detail-visual');visual.replaceChildren();
    if(p.image) {
      const wrap=el('div','detail-screen'),image=el('img');
      image.src='assets/showcase/'+p.image;image.alt=p.name+' — actual website screenshot';
      wrap.append(image);visual.append(wrap);
      $('#detail-foot').textContent='Actual website capture · September 2026 · Open the project to explore it.';
    } else {
      const wrap=el('div','detail-logo-stage');wrap.style.setProperty('--identity',p.color);
      if(p.logo){const image=el('img');image.src='assets/project-logos/'+p.logo;image.alt=p.name;wrap.append(image);}
      else wrap.append(el('strong','',p.name));
      wrap.append(el('p','',p.desc));
      const link=el('a','button',p.category==='websites'?'Visit website ↗':'Explore the live project ↗');link.href=p.url;link.target='_blank';link.rel='noopener noreferrer';wrap.append(link);visual.append(wrap);
      $('#detail-foot').textContent=p.logo?'Project identity · Open the live project to explore the interface.':'Client website · Open the live website to explore the design.';
    }
  }
  function route(initial=false) {
    let hash;try{hash=decodeURIComponent(location.hash.slice(1)||'work');}catch{hash='work';}
    if(hash===lastHash&&!initial)return;
    if(activePage)scrollPositions.set(activePage,window.scrollY);
    let id=hash, chapter=null;
    if(hash==='markets'){id='work';chapter='markets';}
    if(hash.startsWith('studio-'))id='safistudios';
    if(['main','top','desk','playground'].includes(hash))id='work';
    if(['services','packages'].includes(hash))id='websites';
    const p=byId.get(id);
    if(p && id!=='safistudios'){renderDetail(p);id='project-detail';}
    if(!pages.some(page=>page.id===id))id='work';
    pages.forEach(page=>{const active=page.id===id;page.classList.toggle('active',active);page.hidden=!active;});
    all('[data-route]').forEach(a=>{const selected=a.dataset.route===id||(id==='project-detail'&&a.dataset.route===(p.category==='websites'?'websites':'work'));if(selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    all('[data-project-link]').forEach(a=>{if(a.dataset.projectLink===hash)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    const labels={work:'PROJECTS / INTERACTIVE TOOLS',websites:'CLIENT WEBSITES',safistudios:'SAFISTUDIOS / BUSINESS SOFTWARE',about:'ABOUT HELAL',contact:'GET IN TOUCH','project-detail':p?p.name.toUpperCase():'PROJECT'};
    $('#location-label').textContent=labels[id];
    document.title=(id==='work'?'Safi Solutions':id==='project-detail'?p.name:id==='safistudios'?'SafiStudios':id==='about'?'About Helal':id==='websites'?'Websites':'Get in touch')+' — Independent design & development';
    const changed=activePage!==id || id==='project-detail';
    activePage=id;lastHash=hash;closeMenu();
    requestAnimationFrame(()=>{
      if(chapter)document.getElementById(chapter).scrollIntoView({behavior:'auto',block:'start'});
      else if(changed||initial)window.scrollTo({top:['work','websites'].includes(id)?(scrollPositions.get(id)||0):0,behavior:'instant'});
      if(!initial&&changed)$('#main').focus({preventScroll:true});
    });
  }
  window.addEventListener('hashchange',()=>route());
  document.addEventListener('click', e=>{
    const a=e.target.closest('a');if(!a)return;
    if(a.dataset.interest){const select=$('#iq-interest');if(Array.from(select.options).some(o=>o.value===a.dataset.interest))select.value=a.dataset.interest;}
    if(a.getAttribute('href')===location.hash && a.getAttribute('href')==='#work'){window.scrollTo({top:0,behavior:'smooth'});}
  });
  const samples={coffee:{src:'assets/showcase/java-workspace.webp',title:'Java’s / coffee shop',alt:'Existing coffee-shop app layout with fictional sample records'},pest:{src:'assets/showcase/cedar-workspace.webp',title:'Cedar’s / service business',alt:'Existing service-business app layout with fictional sample records'}};
  const dialog=$('#sample-dialog');let opener=null;
  all('[data-expand]').forEach(button=>button.addEventListener('click',()=>{
    const s=samples[button.dataset.expand];opener=button;dialog.classList.remove('zoomed');$('#zoom-sample').textContent='Zoom in';$('#zoom-sample').setAttribute('aria-pressed','false');
    $('#dialog-title').textContent=s.title;$('#dialog-image').src=s.src;$('#dialog-image').alt=s.alt;
    if(typeof dialog.showModal==='function'){dialog.showModal();document.body.classList.add('dialog-open');}
    else window.open(s.src,'_blank','noopener');
  }));
  $('#zoom-sample').addEventListener('click',()=>{const on=dialog.classList.toggle('zoomed');$('#zoom-sample').textContent=on?'Fit image':'Zoom in';$('#zoom-sample').setAttribute('aria-pressed',String(on));});
  $('#close-sample').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');opener?.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),toggle=$('#motion-toggle');let paused=false;
  try{paused=localStorage.getItem('safi-cabinet-motion')==='paused';}catch{}
  function syncMotion(){const off=paused||reduced.matches;document.documentElement.classList.toggle('motion-paused',off);toggle.setAttribute('aria-pressed',String(off));toggle.textContent=reduced.matches?'Reduced motion':paused?'Motion off':'Motion on';toggle.disabled=reduced.matches;}
  toggle.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('safi-cabinet-motion',paused?'paused':'on');}catch{}syncMotion();});
  reduced.addEventListener?.('change',syncMotion);syncMotion();route(true);
})();
