# Safi Solutions — builds the five main pages from the lists below:
#   index.html (landing) · projects/index.html · products/index.html · websites/index.html · studio/index.html
# To add or change a project, product or website: edit PROJECTS / PRODUCTS / SITES / MORE_SITES, then run
#   python3 tools/build-pages.py
# (Python 3.8+, no packages needed.) If you hand-edit those five HTML files instead, don't re-run this script —
# it rewrites them. Every other page (pricing, support, legal, product detail pages, the projects themselves) is untouched.
import os, html
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
V = "4"
ARROW = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
EXT = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>'
PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></svg>'
LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
e = html.escape

PROJECTS = [
  # id, name, kind, type, desc, href, shot, logo, extra
  dict(id='sportsatlas', name='Sports Atlas', kind='guide', type='Six sports, from zero', badge='New', wide=True,
       desc='Football, baseball, basketball, soccer, volleyball and golf explained for complete beginners — 3D stadiums, animated plays, 400+ concepts in plain English and every rule change for 2026.',
       href='/sportsatlas/', shot='sportsatlas', logo='sportsatlas.svg'),
  dict(id='motoratlas', name='MotorAtlas', kind='guide', type='How a car works',
       desc='Every system in a car inside a 3D X-ray you can orbit — gasoline, hybrid and electric — with plain-English part pages and a path from symptom to diagnosis.',
       href='/motoratlas/', shot='motoratlas', logo='motoratlas.svg'),
  dict(id='houseedge', name='HouseEdge', kind='guide', type='Casino games & the math',
       desc='The rules and real house edge of seven games, with a 3D roulette table, a basic-strategy trainer and a calculator for what a night actually costs.',
       href='/houseedge/', shot='houseedge', logo='houseedge.svg'),
  dict(id='voltvisual', name='VoltVisual', kind='guide', type='Industrial electrical systems',
       desc='Power, signals, PLCs, drives, safety and drawings, traced through one machine — with a live ladder-logic rung and a real motor-starter schematic.',
       href='/voltvisual/', shot='voltvisual', logo='voltvisual.svg'),
  dict(id='tradeschool', name='The TradeSchool', kind='guide', type='Skilled trades',
       desc='Electrical, HVAC, plumbing, industrial maintenance, welding and construction — from the basic words up to real systems, measurements and diagnosis.',
       href='/thetradeschool/', shot='tradeschool', logo='tradeschool.svg'),
  dict(id='overtone', name='Overtone', kind='guide', type='Music theory you can hear',
       desc='A playable music-theory workbench: scales, chords, rhythm, ear training, chord shapes and the overtone series — every idea makes sound.',
       href='/overtone/', shot='overtone', logo='overtone.svg'),
  dict(id='thebench', name='The Bench', kind='guide', type='Learn to code',
       desc='C++, Java, JavaScript, HTML, CSS and SQL in one course that runs every example and steps through it line by line.',
       href='/thebench/', shot='thebench', logo='thebench.svg'),
  dict(id='thewell', name='The Well', kind='guide', type='Cocktails & bartending',
       desc='A hundred drinks drawn as their glasses, with ingredients, technique, a flavour map, family trees and a glanceable service mode.',
       href='/thewell/', shot='thewell', logo='thewell.svg'),
  dict(id='vellum', name='Vellum', kind='guide', type='Bible reading & discovery',
       desc='Read with context: people, places, cross-references, audio and personal notes, in a quieter reading room.',
       href='/vellum/', shot='vellum', logo='vellum.svg'),
  dict(id='tradingdesk', name='TheTradingDesk', kind='guide', type='Markets, explained visually', wide=True, ext=True,
       desc='A learning environment for how markets actually work — from basic language to options, futures, risk and trade structure. Built as a reference, not a feed: education and clarity, not signals.',
       href='https://thetradingdesk.org', splash='tradingdesk.svg', bg='radial-gradient(circle at 50% 42%, #173229, #0c1714 70%)', logo=None,
       topics=['Beginner path', 'Market structure', 'Options', 'Futures', 'Risk', 'Calculators', 'Terminology']),
  dict(id='cardesk', name='CarDesk', kind='tool', type='Vehicle tools',
       desc='Decode a VIN, check recalls, compare ownership costs and keep a private service log — with a 3D view of your car’s systems.',
       href='/cardesk/', shot='cardesk', logo='cardesk.svg'),
  dict(id='movedesk', name='MoveDesk', kind='tool', type='Relocation planning',
       desc='Turn two places into a move plan: the road route, destination essentials, move costs, a timeline and the official changeover tasks.',
       href='/movedesk/', shot='movedesk', logo='movedesk.svg'),
]
PRODUCTS = [
  dict(id='kwezeen', name='Kwezeen', paid=True, cat='Restaurant menus', copy='Build one restaurant menu and turn it into print, signage, social and web-ready formats.', tags=['Design', 'Menus', 'Publish', 'Multi-format'],
       shots=[('kwezeen-1', 'Template-driven menu design'), ('kwezeen-2', 'Publish across multiple formats')]),
  dict(id='doqcorp', name='DoqCorp', paid=True, cat='Business paperwork', copy='Create the paperwork a small business actually uses without starting from a blank page.', tags=['Invoices', 'Hiring', 'Policies', 'Forms'],
       shots=[('doqcorp-1', '76 ready-to-use business documents'), ('doqcorp-2', 'Fill forms beside the finished page')]),
  dict(id='padeff', name='Padeff', paid=False, cat='PDF editor', copy='Read, edit, mark up and sign PDFs without learning a heavyweight editor.', tags=['Edit', 'Highlight', 'Redact', 'Sign'],
       shots=[('padeff-1', 'Mark up and protect documents'), ('padeff-2', 'Review and sign in one workspace')]),
  dict(id='piktoor', name='Piktoor', paid=False, cat='Image editor', copy='Everyday image editing made easier: fixes, cutouts, text, effects and quick creative work.', tags=['Fix', 'Cut out', 'Text', 'Export'],
       shots=[('piktoor-2', 'Quick creative layouts and text'), ('piktoor-1', 'Guided photo fixes and edits')]),
  dict(id='brandur', name='Brandur', paid=False, cat='Brand proofs', copy='Turn a logo into polished brand proofs, mockups and export-ready assets.', tags=['Proofs', 'Brand', 'Mockups', 'Export'],
       shots=[('brandur-1', 'See the brand in real-world contexts'), ('brandur-2', 'Build a clean reusable brand system')]),
  dict(id='doqdesk', name='DoqDesk', paid=False, cat='Documents + spreadsheets', copy='Open and edit Word (.docx) and Excel (.xlsx) files in one familiar desktop workspace without the extra clutter.', tags=['DOCX', 'XLSX', 'Charts', 'Formatting'],
       shots=[('doqdesk-1', 'Write and format documents in a familiar workspace'), ('doqdesk-2', 'Build spreadsheets, formulas and charts')]),
]
SITES = [
  dict(id='elizabeth', name='Elizabeth Aven', type='Photography website', href='https://www.elizabethavenphotography.com', shot='elizabeth-live', desc='A portfolio for a Texas photographer, built around the pictures: galleries, session information and a direct path to an enquiry.'),
  dict(id='baker', name='Baker Precision', type='Home inspections website', href='https://bakerinspections.com', shot='baker-live', desc='Service information, inspection coverage and a clear way for local homeowners to book — for an independent inspection business.'),
]
MORE_SITES = [('Landry Locksmith', 'Service website', 'https://www.landrylocksmith.com'), ('Tex-Mex Oil & Shine', 'Automotive business', 'https://texmexoilandshine.com'), ('NETX Behavioral Health', 'Healthcare website', 'https://netxbh.com')]
N_PROJ, N_PROD, N_SITES = len(PROJECTS), len(PRODUCTS), len(SITES) + len(MORE_SITES)

NAV = [('home', '/', 'Home', ''), ('projects', '/projects/', 'Projects', f'{N_PROJ:02d}'), ('products', '/products/', 'Products', f'{N_PROD:02d}'), ('websites', '/websites/', 'Websites', f'{N_SITES:02d}'), ('studio', '/studio/', 'SafiStudios', '')]
NAV2 = [('about', '/#about', 'About'), ('pricing', '/pricing.html', 'Pricing'), ('support', '/support.html', 'Support')]
DISPLAY_FONTS = '<link href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@700&family=Fraunces:opsz,wght@9..144,600&family=Newsreader:opsz,wght@6..72,600&family=Roboto+Slab:wght@600&family=Syne:wght@700&family=Unbounded:wght@600&display=swap" rel="stylesheet">'


def page(key, path, title, desc, label, body, extra_head='', extra_tail='', dialogs=''):
    cur = lambda k: ' aria-current="page"' if k == key else ''
    nav = ''.join(f'<a href="{h}"{cur(k)}>{t}{f" <span>{c}</span>" if c else ""}</a>' for k, h, t, c in NAV)
    nav += '<span class="nav-rule" aria-hidden="true"></span>' + ''.join(f'<a href="{h}"{cur(k)}>{t}</a>' for k, h, t in NAV2)
    mnav = ''.join(f'<a href="{h}"{cur(k)}>{t}</a>' for k, h, t, c in NAV) + ''.join(f'<a href="{h}"{cur(k)}>{t}</a>' for k, h, t in NAV2) + '<a href="/#contact">Get in touch</a>'
    url = 'https://www.safisolutions.org' + path
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#101215">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://www.safisolutions.org/assets/images/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/images/logo-mark.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
{extra_head}<link rel="stylesheet" href="/assets/site.css?v={V}">
</head>
<body class="page-{key}">
<a class="skip-link" href="#main">Skip to content</a>
<aside class="cabinet-rail" aria-label="Site">
  <a class="brand" href="/" aria-label="Safi Solutions home"><img src="/assets/images/logo-lockup.png" alt="Safi Solutions" width="675" height="288"></a>
  <p class="rail-intro">Independent software<br>&amp; website design.</p>
  <nav class="primary-nav" aria-label="Main">{nav}</nav>
  <div class="rail-contact"><a class="button small" href="/#contact" data-interest="Not sure yet / something else">Get in touch {ARROW}</a></div>
  <div class="rail-footer"><span>HELAL SAFI<br>PARIS, TEXAS</span></div>
</aside>
<header class="mobile-header">
  <a class="brand-m" href="/" aria-label="Safi Solutions home"><img src="/assets/images/logo-lockup.png" alt="Safi Solutions" width="675" height="288"></a>
  <button id="menu-toggle" type="button" aria-controls="mobile-nav" aria-expanded="false"><span>Menu</span></button>
  <nav id="mobile-nav" aria-label="Main">{mnav}</nav>
</header>
<main id="main" tabindex="-1">
<div class="workspace-top"><span>{e(label)}</span><span class="clock" data-clock>Paris, Texas</span><a href="/#contact">Let’s talk {ARROW}</a></div>
{body}
<footer class="site-footer"><span>© <span data-year>2026</span> Safi Solutions</span><span>Independent. Hands-on. Still curious.</span><nav aria-label="Footer"><a href="/pricing.html">Pricing</a><a href="/support.html">Support</a><a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a><a href="/refunds.html">Refunds</a></nav></footer>
</main>
{dialogs}<script src="/assets/site.js?v={V}" defer></script>
{extra_tail}</body>
</html>
'''


def write(rel, text):
    p = os.path.join(SITE, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w').write(text); print('wrote', rel, len(text))


# ---------------------------------------------------------------- landing
free = sum(1 for p in PRODUCTS if not p['paid'])
DOORS = [
  ('/projects/', 'Projects', 'Interactive guides & tools', f'<b>{N_PROJ}</b>live'),
  ('/products/', 'Products', 'Desktop software for Windows', f'<b>{N_PROD}</b>{free} free'),
  ('/websites/', 'Websites', 'Sites for local businesses', f'<b>{N_SITES}</b>live'),
  ('/studio/', 'SafiStudios', 'Custom business software', '<b>1:1</b>built to fit'),
]
doors = ''.join(f'<a class="door" href="{h}"><span class="door-no">0{i + 1}</span><span class="door-body"><b>{t}</b><small>{s}</small></span><span class="door-count">{c}</span>{ARROW}</a>' for i, (h, t, s, c) in enumerate(DOORS))

SHOW = [
  dict(name='Sports Atlas', kind='Interactive guide', new=True, url='safisolutions.org/sportsatlas', href='/sportsatlas/', img='/assets/showcase/sportsatlas.webp', cta='Open Sports Atlas',
       desc='Six sports explained from the first whistle: 3D stadiums, animated plays, 400+ concepts in plain English and every rule change for 2026.'),
  dict(name='HouseEdge', kind='Interactive guide', url='safisolutions.org/houseedge', href='/houseedge/', img='/assets/showcase/houseedge.webp', cta='Open HouseEdge',
       desc='The rules and real math behind seven casino games — with a 3D roulette table, a strategy trainer and what a night actually costs.'),
  dict(name='MotorAtlas', kind='Interactive guide', url='safisolutions.org/motoratlas', href='/motoratlas/', img='/assets/showcase/motoratlas.webp', cta='Open MotorAtlas',
       desc='Every system in a car inside a 3D X-ray you can orbit: gasoline, hybrid and electric, part by part.'),
  dict(name='TheTradingDesk', kind='Interactive guide', url='thetradingdesk.org', href='https://thetradingdesk.org', ext=True, splash='/assets/project-logos/tradingdesk.svg', bg='radial-gradient(circle at 50% 45%, #173229, #0b1512 72%)', cta='Open TheTradingDesk',
       desc='Markets, explained visually — options, futures, risk and trade structure, built as a reference rather than a feed.'),
  dict(name='Kwezeen', kind='Desktop software', url='safisolutions.org/products/kwezeen', href='/products/kwezeen.html', img='/assets/products/kwezeen-1.webp', cta='See Kwezeen',
       desc='Build a restaurant menu once, then publish it for print, signage, social and the web — one-time purchase, no subscription.'),
  dict(name='Elizabeth Aven', kind='Client website', url='elizabethavenphotography.com', href='https://www.elizabethavenphotography.com', ext=True, img='/assets/showcase/elizabeth-live.webp', cta='Visit the website',
       desc='A portfolio for a Texas photographer, built around the pictures and a direct path to booking a session.'),
]
def show_tab(i, s):
    attrs = f'data-name="{e(s["name"])}" data-url="{e(s["url"])}" data-href="{s["href"]}" data-cta="{e(s["cta"])}" data-desc="{e(s["desc"])}"'
    attrs += f' data-splash="{s["splash"]}" data-bg="{s["bg"]}"' if s.get('splash') else f' data-img="{s["img"]}" data-alt="{e(s["name"])} — screenshot"'
    if s.get('ext'): attrs += ' data-ext="1"'
    new = '<em>New</em>' if s.get('new') else ''
    return f'<li><button type="button" role="tab" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}" {attrs}><span class="sl-no">0{i + 1}</span><span class="sl-name">{e(s["name"])}{new}</span><span class="sl-kind">{e(s["kind"])}</span><span class="sl-bar" aria-hidden="true"><i></i></span></button></li>'
s0 = SHOW[0]
landing = f'''<section class="hero" aria-labelledby="hero-title">
  <canvas class="threads" aria-hidden="true"></canvas>
  <div class="hero-copy">
    <p class="micro">Software · Websites · Interactive guides</p>
    <h1 id="hero-title">Complicated tasks.<span>Made simpler.</span></h1>
    <p class="hero-lede">I’m <b>Helal Safi</b>. I design and build software, websites and interactive guides that take something complicated — a car, a circuit, a casino floor, a small business — and make it easy to see, learn and use.</p>
    <div class="hero-cta"><a class="button" href="/projects/">See the work {ARROW}</a><a class="button ghost" href="#contact">Start a project</a></div>
  </div>
  <nav class="doors" aria-label="Explore Safi Solutions">{doors}</nav>
  <p class="hero-hint" aria-hidden="true"><i></i>Run the pointer through the threads</p>
</section>

<section class="showroom" aria-labelledby="show-title">
  <header class="sec-head rv"><div><p class="micro">Recent work</p><h2 id="show-title">A few things made simpler.</h2></div><a class="underlined" href="/projects/">All {N_PROJ} projects {ARROW}</a></header>
  <div class="show-grid rv">
    <ol class="show-list" role="tablist" aria-label="Recent work">{''.join(show_tab(i, s) for i, s in enumerate(SHOW))}</ol>
    <figure class="show-screen" role="tabpanel" aria-live="polite">
      <div class="screen-bar" aria-hidden="true"><i></i><i></i><i></i><span class="screen-url">{LOCK}<span>{e(s0["url"])}</span></span></div>
      <a class="screen-view" href="{s0["href"]}" aria-label="Open {e(s0["name"])}"><img class="first" src="{s0["img"]}" alt=""></a>
      <figcaption class="show-cap"><p>{e(s0["desc"])}</p><a class="button small" href="{s0["href"]}">{e(s0["cta"])} {ARROW}</a></figcaption>
    </figure>
  </div>
</section>

<section class="about" id="about" aria-labelledby="about-title">
  <div class="about-grid">
    <figure class="portrait rv"><img src="/assets/images/profphoto.webp" alt="Helal Safi" width="640" height="1400" loading="lazy"><figcaption>HELAL SAFI<br>PARIS, TEXAS</figcaption></figure>
    <div class="about-copy rv" data-d="120">
      <p class="micro">About</p>
      <h2 id="about-title">Hi, I’m Helal.</h2>
      <p>I build desktop software, websites and interactive tools that make complicated things easier to work with.</p>
      <p>A lot of these projects start with something I wanted to understand better — a sport, a car, a circuit — or a business that needed a better way to run its day. The Bench makes coding approachable. VoltVisual turns electrical systems into something you can explore. SafiStudios brings the same thinking to business software.</p>
      <p>I had a basic coding foundation from college, but AI dramatically expanded what I could bring to life. Learning to engineer with it — structuring the problem, guiding the tools and refining the output — is what lets me turn ideas into working products.</p>
      <p>I’m based in Paris, Texas. Safi Solutions is my independent practice, so when you get in touch, you’re talking to the person doing the work.</p>
      <p class="note">The project list is also a fairly accurate record of my curiosity.</p>
      <dl class="about-facts"><div><dt>{N_PROJ}</dt><dd>interactive projects</dd></div><div><dt>{N_PROD}</dt><dd>desktop apps</dd></div><div><dt>{N_SITES}</dt><dd>client websites</dd></div></dl>
    </div>
  </div>
</section>

<section class="contact" id="contact" aria-labelledby="contact-title">
  <div class="contact-grid">
    <header class="contact-head rv"><p class="micro">Direct to Helal</p><h2 id="contact-title">What are you working on?</h2><p>A new website, a business tool, or something you haven’t quite figured out yet. Tell me about it — you’ll hear back from me, not a team.</p><a class="mail" href="mailto:safihelal@gmail.com">safihelal@gmail.com {ARROW}</a></header>
    <form class="inquiry-form rv" data-d="120" id="inquiry-form" action="https://formsubmit.co/safihelal@gmail.com" method="POST">
      <input type="hidden" name="_captcha" value="true"><input type="hidden" name="_subject" value="New inquiry - Safi Solutions"><input type="hidden" name="_template" value="table">
      <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
      <div class="form-field"><label for="iq-name">Your name <em>*</em></label><input id="iq-name" name="name" type="text" autocomplete="name" placeholder="Your name" required></div>
      <div class="form-field"><label for="iq-biz">Business / project</label><input id="iq-biz" name="business" type="text" autocomplete="organization" placeholder="Business name or project idea"></div>
      <div class="form-field"><label for="iq-email">Email <em>*</em></label><input id="iq-email" name="email" type="email" autocomplete="email" placeholder="you@email.com" required></div>
      <div class="form-field"><label for="iq-phone">Phone (optional)</label><input id="iq-phone" name="phone" type="tel" autocomplete="tel" placeholder="(555) 555-5555"></div>
      <div class="form-field full"><label for="iq-interest">I’m interested in…</label><select id="iq-interest" name="interest"><option>A custom website</option><option>SafiStudios / custom business software</option><option>Products / desktop software</option><option>A SaaS / software concept</option><option>An internal business tool</option><option>An interactive education / product idea</option><option>Improving something that already exists</option><option>Not sure yet / something else</option></select></div>
      <div class="form-field full"><label for="iq-msg">Tell me what you’re trying to build (optional)</label><textarea id="iq-msg" name="message" placeholder="The problem, the idea, what exists today, or what you wish existed instead…"></textarea></div>
      <button class="button" type="submit">Send inquiry {ARROW}</button>
      <p class="form-foot">Delivered through FormSubmit straight to my inbox. No mailing lists.</p>
    </form>
  </div>
</section>'''
write('index.html', page('home', '/', 'Safi Solutions — Complicated tasks, made simpler', 'Helal Safi designs and builds software, websites and interactive guides that make complicated things easy to see, learn and use — from 3D learning projects to desktop tools and business software.', 'Safi Solutions / Independent studio', landing, extra_tail='<script src="/assets/threads.js?v=' + V + '" defer></script>\n'))

# ---------------------------------------------------------------- projects
def card(p):
    kind = 'Interactive guide' if p['kind'] == 'guide' else 'Web tool'
    tgt = ' target="_blank" rel="noopener noreferrer"' if p.get('ext') else ''
    badge = f'<span class="card-badge">{p["badge"]}</span>' if p.get('badge') else ''
    if p.get('splash'): media = f'<span class="logo-splash" style="--splash:{p["bg"]}"><img src="/assets/project-logos/{p["splash"]}" alt="{e(p["name"])}" loading="lazy"></span>'
    else: media = f'<img class="shot" src="/assets/showcase/{p["shot"]}.webp" alt="{e(p["name"])} — screenshot of the live project" loading="lazy" width="1280" height="800">'
    logo = f'<img class="card-logo" src="/assets/project-logos/{p["logo"]}" alt="" loading="lazy">' if p.get('logo') else ''
    phone = '' if p.get('ext') else f'<button class="icon-btn" type="button" data-phone="{e(p["name"])}" data-href="{p["href"]}" aria-label="Add {e(p["name"])} to your phone" title="Add to your phone">{PHONE}</button>'
    topics = ''.join(f'<span>{t}</span>' for t in p.get('topics', []))
    topics = f'<div class="tags" style="grid-column:1/-1;margin:6px 0 0">{topics}</div>' if topics else ''
    cls = 'card wide rv' if p.get('wide') else 'card rv'
    return f'''<article class="{cls}" id="{p["id"]}" data-kind="{p["kind"]}">
  <a class="card-shot" href="{p["href"]}"{tgt} aria-label="Open {e(p["name"])}">{badge}{media}</a>
  <div class="card-body"><div>{logo}<h2>{e(p["name"])}</h2><p class="card-kind">{e(p["type"])}</p></div>
    <div class="card-links">{phone}<a class="button small" href="{p["href"]}"{tgt}>Open {EXT if p.get("ext") else ARROW}</a></div>
    <p>{e(p["desc"])}</p>{topics}</div>
</article>'''
guides = sum(1 for p in PROJECTS if p['kind'] == 'guide'); tools = N_PROJ - guides
projects_body = f'''<div class="page">
  <header class="page-head"><div><p class="micro">Interactive tools &amp; learning</p><h1>Projects.</h1></div><p class="lead">Each one takes a subject that’s hard to get into and turns it into something you can see and play with. All of them run in the browser, and most can be added to your phone like an app.</p></header>
  <div class="sec-head" style="margin-bottom:22px"><div class="filters" role="group" aria-label="Filter projects"><button class="chip" type="button" data-filter="all" aria-pressed="true">All <b>{N_PROJ}</b></button><button class="chip" type="button" data-filter="guide" aria-pressed="false">Interactive guides <b>{guides}</b></button><button class="chip" type="button" data-filter="tool" aria-pressed="false">Web tools <b>{tools}</b></button></div></div>
  <div class="card-grid">{''.join(card(p) for p in PROJECTS)}</div>
  <div class="cta-band rv"><div><h2>Have a subject that deserves this treatment?</h2><p>Training material, a product that’s hard to explain, a field your customers find confusing — it can be made visual.</p></div><a class="button" href="/#contact" data-interest="An interactive education / product idea">Talk about it {ARROW}</a></div>
</div>'''
phone_dialog = f'''<dialog class="sheet-dialog" id="phone-dialog" aria-labelledby="phone-title">
  <div class="sd-head"><div><p class="micro">Home screen app</p><h2 id="phone-title">Add <span id="phone-name">it</span> to your phone.</h2></div><button class="sd-close" type="button" aria-label="Close">×</button></div>
  <div class="sd-body"><section><p class="micro">iPhone / iPad</p><p>Open the project in Safari → tap <strong>Share</strong> → <strong>Add to Home Screen</strong> → <strong>Add</strong>.</p></section><section><p class="micro">Android</p><p>Open the project in Chrome → tap <strong>⋮</strong> → <strong>Add to Home screen</strong> or <strong>Install app</strong> → confirm.</p></section>
  <a class="button" id="phone-open" href="/">Open it {ARROW}</a></div>
</dialog>
'''
write('projects/index.html', page('projects', '/projects/', 'Projects — Safi Solutions', 'Interactive guides and web tools by Safi Solutions: Sports Atlas, MotorAtlas, HouseEdge, VoltVisual, The TradeSchool, Overtone, The Bench, The Well, Vellum, TheTradingDesk, CarDesk and MoveDesk.', 'Projects / Interactive tools & learning', projects_body, dialogs=phone_dialog))

# ---------------------------------------------------------------- products
def shelf(p):
    if p['paid']: buy = f'<div class="price"><del>$39</del><strong>$29</strong><small>one-time</small></div><a class="button" href="/products/{p["id"]}.html">Explore features {ARROW}</a>'
    else: buy = f'<div class="price"><strong>Free</strong><small>no checkout</small></div><a class="button" href="/products/{p["id"]}.html">Explore &amp; download {ARROW}</a>'
    shots = ''.join(f'<figure><button type="button" data-zoom style="all:unset;display:block;cursor:zoom-in;width:100%"><img src="/assets/products/{f}.webp" alt="{e(p["name"])} — {e(c)}" loading="lazy" width="1280" height="800"></button><figcaption>{e(c)}</figcaption></figure>' for f, c in p['shots'])
    tags = ''.join(f'<span>{t}</span>' for t in p['tags'])
    return f'''<article class="shelf w-{p["id"]} rv" id="{p["id"]}">
  <div><div class="shelf-kicker"><span class="pill {"paid" if p["paid"] else "free"}">{"Paid" if p["paid"] else "Free"}</span><span class="micro">{e(p["cat"])}</span></div>
    <h2>{e(p["name"])}</h2><p class="copy">{e(p["copy"])}</p><div class="tags">{tags}</div><div class="shelf-buy">{buy}</div></div>
  <div class="shelf-shots">{shots}</div>
</article>'''
products_body = f'''<div class="page">
  <header class="page-head"><div><p class="micro">Desktop software</p><h1>Products.</h1></div><p class="lead">Software like this already exists — I simplify the hard parts. Built for everyday users: <strong>{free} tools are free</strong>, and two focused business apps are one-time purchases with no subscription.</p></header>
  <div class="shelves">{''.join(shelf(p) for p in PRODUCTS)}</div>
  <div class="note-bar rv"><span><strong>Every app:</strong> Windows desktop · offline-first · no account · version 1.0</span><a class="underlined" href="/terms.html">Open/shareable licensing {ARROW}</a><a class="underlined" href="/support.html">Support &amp; updates {ARROW}</a><a class="underlined" href="/pricing.html">Pricing {ARROW}</a></div>
</div>'''
zoom_dialog = f'''<dialog class="sheet-dialog" id="zoom-dialog" style="width:min(1280px,calc(100% - 24px))"><div class="sd-head"><p class="micro zoom-title">Product preview</p><button class="sd-close" type="button" aria-label="Close">×</button></div><div class="sd-body"><img src="" alt="" style="width:100%;border:1px solid var(--line);border-radius:6px"></div></dialog>
'''
write('products/index.html', page('products', '/products/', 'Products — Safi Solutions desktop software', f'Six Windows desktop apps from Safi Solutions: {free} free tools (Padeff, Piktoor, Brandur, DoqDesk) and two one-time-purchase business apps (Kwezeen, DoqCorp).', 'Products / Desktop software', products_body, extra_head=DISPLAY_FONTS + '\n', dialogs=zoom_dialog))

# ---------------------------------------------------------------- websites
def site_card(s):
    return f'''<article class="card rv" id="{s["id"]}">
  <a class="card-shot" href="{s["href"]}" target="_blank" rel="noopener noreferrer" aria-label="Visit {e(s["name"])}"><img class="shot" src="/assets/showcase/{s["shot"]}.webp" alt="{e(s["name"])} — homepage" loading="lazy"></a>
  <div class="card-body"><div><h2>{e(s["name"])}</h2><p class="card-kind">{e(s["type"])}</p></div><div class="card-links"><a class="button small" href="{s["href"]}" target="_blank" rel="noopener noreferrer">Visit {EXT}</a></div><p>{e(s["desc"])}</p></div>
</article>'''
more = ''.join(f'<a href="{h}" target="_blank" rel="noopener noreferrer"><div><strong>{e(n)}</strong><span>{e(t)}</span></div>{EXT}</a>' for n, t, h in MORE_SITES)
websites_body = f'''<div class="page">
  <header class="page-head"><div><p class="micro">Client websites</p><h1>Websites.</h1></div><p class="lead">Designed for the business on the other side of the screen: clear services, real photographs, fast pages and one obvious way to get in touch.</p></header>
  <div class="card-grid">{''.join(site_card(s) for s in SITES)}</div>
  <div class="sec-head rv" style="margin-top:clamp(40px,5vw,64px)"><div><p class="micro">More website work</p><h2>Also live.</h2></div><a class="underlined" href="https://yourfuturesite.org" target="_blank" rel="noopener noreferrer">Explore more website directions {EXT}</a></div>
  <div class="site-list rv">{more}</div>
  <div class="cta-band rv"><div><h2>Need a website?</h2><p>New site, redesign or a site that finally matches the business — tell me what you do and who you do it for.</p></div><a class="button" href="/#contact" data-interest="A custom website">Start a website {ARROW}</a></div>
</div>'''
write('websites/index.html', page('websites', '/websites/', 'Websites — Safi Solutions', 'Client websites designed and built by Safi Solutions: Elizabeth Aven Photography, Baker Precision Home Inspections, Landry Locksmith, Tex-Mex Oil & Shine and NETX Behavioral Health.', 'Websites / Client work', websites_body))

# ---------------------------------------------------------------- studio
GAL = [('coffee-dashboard', 'Maple & Bean — the day’s operations at a glance'), ('coffee-counter', 'Maple & Bean — the counter view on a tablet'), ('pest-dashboard', 'Cedar Pest Control — jobs, sales pipeline and invoices'), ('cedar-agenda', 'Cedar — a technician’s day, on the phone')]
gal = ''.join(f'<figure class="rv"><img src="/assets/showcase/{f}.webp" alt="{e(c)}" loading="lazy"><figcaption>{e(c)}</figcaption></figure>' for f, c in GAL)
studio_body = f'''<div class="page">
  <header class="page-head"><div><p class="micro">Business software</p><h1>SafiStudios.</h1></div><p class="lead">Custom software for a better-organized business — built around the way your day actually runs, not the other way round.</p></header>
  <section class="studio-hero">
    <div class="rv"><p>Keep documents, employee records, schedules and inventory in one workspace, built around your everyday data entry.</p><p>Tailored to different industries — from retail and daily operations to contractors and events. Every build starts from how the work is really done and removes the steps nobody needs.</p><p class="field-note"><strong>For field teams:</strong> I’m developing connected workflows to help pest-control, HVAC and other service crews communicate with management.</p>
      <div class="hero-cta"><a class="button" href="/#contact" data-interest="SafiStudios / custom business software">Discuss your business {ARROW}</a><a class="button ghost" href="/pricing.html">How pricing works</a></div></div>
    <div class="studio-stack rv" data-d="120"><figure><img src="/assets/showcase/java-workspace.webp" alt="Downtown Coffee — staff schedule workspace"></figure><figure><img src="/assets/showcase/cedar-workspace.webp" alt="Cedar’s Pest — routes and dispatch workspace"></figure></div>
  </section>
  <div class="sec-head rv" style="margin-top:clamp(48px,6vw,80px)"><div><p class="micro">Design previews</p><h2>Built to fit the work.</h2></div><p class="micro">Sample data · modules vary by build</p></div>
  <div class="gallery two">{gal}</div>
  <div class="cta-band rv"><div><h2>Running on spreadsheets and sticky notes?</h2><p>Tell me how the day works now. Quotes are based on scope — no fixed packages you have to fit into.</p></div><a class="button" href="/#contact" data-interest="SafiStudios / custom business software">Start the conversation {ARROW}</a></div>
</div>'''
write('studio/index.html', page('studio', '/studio/', 'SafiStudios — custom business software', 'SafiStudios builds custom business software: documents, employee records, scheduling, inventory and field-team workflows in one workspace, built around how your business runs.', 'SafiStudios / Business software', studio_body))
