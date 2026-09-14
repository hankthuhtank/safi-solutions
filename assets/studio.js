(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const all = s => Array.from(document.querySelectorAll(s));
  const projects = window.SAFI_PROJECTS || [];
  const byId = new Map(projects.map(p => [p.id,p]));
  const pages = all('.page');
  let homeScroll=0;
  let activePage = '', lastHash = '';
  document.documentElement.classList.add('js');

  const polish=document.createElement('style');
  polish.textContent=`
    .inquiry-form>.button{grid-column:1/-1;justify-self:center;width:min(100%,420px)}
    @media(max-width:760px){
      .featured-projects{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important;margin-bottom:30px!important}
      .featured-projects .site-cover,.featured-projects .card-thebench .site-cover{height:auto!important;aspect-ratio:1.46!important}
      .featured-projects .project-caption{display:block!important;margin-top:9px!important}
      .featured-projects .project-caption>a{font-size:14px!important;line-height:1.2!important}
      .featured-projects .project-caption>span{display:block!important;max-width:100%!important;text-align:left!important;margin-top:4px!important;font-size:9px!important;line-height:1.4!important}
    }
    @media(max-width:430px){
      .featured-projects{gap:10px!important}
      .featured-projects .project-caption>a{font-size:13px!important}
      .featured-projects .project-caption>span{font-size:8px!important}
    }
  `;
  document.head.append(polish);
  $('.form-foot')?.remove();

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
      image.src='assets/showcase/'+p.image;image.alt=p.name+' - actual website screenshot';
      wrap.append(image);visual.append(wrap);
      $('#detail-foot').textContent='Actual website capture · September 2026 · Open the project to explore it.';
    } else {
      const wrap=el('div','detail-logo-stage');wrap.style.setProperty('--identity',p.color);
      if(p.logo){const image=el('img');image.src='assets/project-logos/'+p.logo;image.alt=p.name;wrap.append(image);}
      else wrap.append(el('strong','',p.name));
      wrap.append(el('p','',p.desc));
      visual.append(wrap);
      $('#detail-foot').textContent=p.logo?'Project identity · Open the live project to explore the interface.':'Client website · Open the live website to explore the design.';
    }
  }
  const homeSections=pages.filter(page=>page.id!=='project-detail');
  const labels={work:'PROJECTS / INTERACTIVE TOOLS',websites:'CLIENT WEBSITES',safistudios:'SAFISTUDIOS / BUSINESS SOFTWARE',markets:'THE TRADING DESK / MARKETS',about:'ABOUT HELAL',contact:'GET IN TOUCH'};
  function highlight(id){
    all('[data-route]').forEach(a=>{if(a.dataset.route===id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    $('#location-label').textContent=labels[id]||'SAFI SOLUTIONS';
  }
  function route(initial=false){
    let hash;try{hash=decodeURIComponent(location.hash.slice(1)||'work');}catch{hash='work';}
    if(hash===lastHash&&!initial)return;
    if(activePage==='home')homeScroll=window.scrollY;
    let id=hash;
    if(['main','top','desk','playground'].includes(id))id='work';
    if(['services','packages'].includes(id))id='websites';
    if(id.startsWith('studio-'))id='safistudios';
    if(id==='tradingdesk')id='markets';
    const p=byId.get(id),detail=!!p&&id!=='safistudios';
    const returning=activePage==='detail';
    if(detail)renderDetail(p);
    else if(!homeSections.some(page=>page.id===id))id='work';
    pages.forEach(page=>{const show=detail?page.id==='project-detail':page.id!=='project-detail';page.hidden=!show;page.classList.toggle('active',show);});
    document.body.classList.toggle('detail-mode',detail);
    activePage=detail?'detail':'home';lastHash=hash;closeMenu();
    highlight(detail?(p.category==='websites'?'websites':'work'):id);
    all('[data-project-link]').forEach(a=>{if(detail&&a.dataset.projectLink===hash)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.title=(detail?p.name+' - ':'')+'Safi Solutions - Independent design & development';
    requestAnimationFrame(()=>{
      if(detail)window.scrollTo({top:0,behavior:'instant'});
      else if(returning&&['work','websites'].includes(id))window.scrollTo({top:homeScroll,behavior:'instant'});
      else if(!initial||hash!=='work')document.getElementById(id).scrollIntoView({behavior:'auto',block:'start'});
      if(!initial&&detail)$('#main').focus({preventScroll:true});
    });
  }
  window.addEventListener('hashchange',()=>route());
  let scrollQueued=false;
  window.addEventListener('scroll',()=>{
    if(scrollQueued||activePage!=='home')return;scrollQueued=true;
    requestAnimationFrame(()=>{scrollQueued=false;let selected=homeSections[0];for(const section of homeSections){if(section.getBoundingClientRect().top<=window.innerHeight*.35)selected=section;}highlight(selected.id);});
  },{passive:true});
  document.addEventListener('click',e=>{
    const a=e.target.closest('a');if(!a)return;
    if(a.dataset.interest){const select=$('#iq-interest');if(Array.from(select.options).some(o=>o.value===a.dataset.interest))select.value=a.dataset.interest;}
    if(a.getAttribute('href')===location.hash&&activePage==='home'){const target=document.getElementById(location.hash.slice(1));if(target)target.scrollIntoView({behavior:'smooth',block:'start'});}
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
