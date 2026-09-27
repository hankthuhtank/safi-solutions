# Safi Solutions: builds the main pages from the lists below.
#   index.html (landing) · projects/ · products/ · websites/ · studio/ · tradingdesk/ · about/ · contact/
# To add or change a project, product or website: edit PROJECTS / PRODUCTS / SITES / MORE_SITES, then run
#   python3 tools/build-pages.py
# (Python 3.8+, no packages needed.) If you hand-edit those pages instead, don't re-run this script, because it
# rewrites them. Every other page (pricing, support, legal, product detail pages, the projects themselves) is untouched.
import os, html, json
SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
V = "17"
ARROW = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
BACK = '<svg class="arrow back" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'
EXT = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>'
PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></svg>'
LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
e = html.escape
TTD = 'https://thetradingdesk.org'

# Projects, in the order they appear. The first two are the large tiles; the rest fill the wall below.
#   type = the small label under each tile · bg = the tile colour behind the logo · raster = logo drawn as a picture
#   shot = screenshot shown on the project's detail view (assets/showcase/)
PROJECTS = [
  dict(id='vellum', name='Vellum', type='Bible discovery', href='/vellum/', shot='vellum.webp', logo='vellum.svg', featured=True,
       bg='linear-gradient(145deg,#554b61,#332d39)',
       detail='Read the Bible with context: people, places, cross-references, audio and personal notes.'),
  dict(id='thewell', name='The Well', type='Bartending guide', href='/thewell/', shot='thewell-live.webp', logo='thewell.webp', raster=True, featured=True,
       bg='#071611',
       detail='A compact bartending guide with 100 searchable recipes, a drink of the day, ingredient references, a flavor finder, bar lessons and a personal home bar.'),
  dict(id='motoratlas', name='MotorAtlas', type='Automotive education', href='/motoratlas/', shot='motoratlas.webp', logo='motoratlas.svg',
       bg='linear-gradient(145deg,#746655,#5f5348)',
       detail='Every system in a car inside a 3D X-ray you can orbit, for gasoline, hybrid and electric vehicles, with plain-English part pages and a path from symptom to diagnosis.'),
  dict(id='tradeschool', name='The TradeSchool', type='Skilled trades', href='/thetradeschool/', shot='tradeschool.webp', logo='tradeschool.svg',
       bg='linear-gradient(145deg,#4b4035,#2e2924)',
       detail='Electrical, HVAC, plumbing, industrial maintenance, welding and construction, from the basic words up to real systems, measurements and diagnosis.'),
  dict(id='overtone', name='Overtone', type='Music education', href='/overtone/', shot='overtone.webp', logo='overtone.svg',
       bg='linear-gradient(145deg,#423d4d,#2a2731)',
       detail='A playable music theory workbench: scales, chords, rhythm, ear training, chord shapes and the overtone series. Every idea makes a sound you can hear.'),
  dict(id='voltvisual', name='VoltVisual', type='Electrical systems', href='/voltvisual/', shot='voltvisual.webp', logo='voltvisual.svg',
       bg='linear-gradient(145deg,#2d5f78,#1c4c68)',
       detail='Power, signals, PLCs, drives, safety and drawings, traced through one machine, with a live ladder logic rung and a real motor starter schematic.'),
  dict(id='cardesk', name='CarDesk', type='Vehicle tools', href='/cardesk/', shot='cardesk.webp', logo='cardesk.webp', raster=True,
       bg='#0b1016',
       detail='Decode a VIN, check recalls, compare ownership costs and keep a private service log, with a 3D view of your car’s systems.'),
  dict(id='movedesk', name='MoveDesk', type='Relocation tools', href='/movedesk/', shot='movedesk.webp', logo='movedesk.svg',
       bg='linear-gradient(145deg,#3c514b,#263833)',
       detail='Turn two places into a move plan: the road route, destination essentials, moving costs, a timeline and the official changeover tasks.'),
  dict(id='houseedge', name='HouseEdge', type='Gambling education', href='/houseedge/', shot='houseedge.webp', logo='houseedge.webp', raster=True,
       bg='#071611',
       detail='The rules and real house edge of seven casino games, with a 3D roulette table, a basic strategy trainer and a calculator for what a night actually costs.'),
  dict(id='thebench', name='The Bench', type='Learn to code', href='/thebench/', shot='thebench.webp', logo='thebench.webp', raster=True,
       bg='linear-gradient(145deg,#174636,#0e2f25)',
       detail='C++, Java, JavaScript, HTML, CSS and SQL in one course that runs every example and steps through it line by line.'),
  dict(id='playbook', name='Playbook', type='Sports education', href='/playbook/', shot='playbook.webp', logo='playbook.webp',
       bg='linear-gradient(145deg,#1c2621,#0e1411)',
       detail='Football, baseball, basketball, soccer, volleyball and golf explained for complete beginners: 3D stadiums, animated plays, 400+ concepts in plain English and every rule change for 2026.'),
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
# Client websites shown as logo tiles. logo can be a local file or the client's own logo URL; fallback is the text
# shown if that image ever fails to load.
SITES = [
  dict(id='elizabeth', name='Elizabeth Aven', type='Photography website', href='https://www.elizabethavenphotography.com',
       logo='https://www.elizabethavenphotography.com/logo.png', fallback='Elizabeth Aven Photography',
       desc='A portfolio for a Texas photographer, built around the pictures, with galleries, session information and a direct path to an enquiry.'),
  dict(id='baker', name='Baker Precision', type='Home inspections website', href='https://bakerinspections.com',
       logo='/assets/website-logos/baker-precision.png', fallback='Baker Precision Home Inspections',
       desc='Service information, inspection coverage and a clear way for local homeowners to book an independent home inspection.'),
]
MORE_SITES = [('Landry Locksmith', 'Service website', 'https://www.landrylocksmith.com'), ('Tex-Mex Oil & Shine', 'Automotive business', 'https://texmexoilandshine.com'), ('NETX Behavioral Health', 'Healthcare website', 'https://netxbh.com')]
N_PROJ, N_PROD, N_SITES = len(PROJECTS), len(PRODUCTS), len(SITES) + len(MORE_SITES)
FREE = sum(1 for p in PRODUCTS if not p['paid'])

# The rail on the left (and the phone menu). About/Pricing/Support sit under the rule.
NAV = [('home', '/', 'Home', ''), ('products', '/products/', 'Products', f'{N_PROD:02d}'), ('projects', '/projects/', 'Projects', f'{N_PROJ:02d}'),
       ('websites', '/websites/', 'Websites', f'{N_SITES:02d}'), ('studio', '/studio/', 'SafiStudios', ''), ('tradingdesk', '/tradingdesk/', 'TheTradingDesk', 'Featured')]
NAV2 = [('about', '/about/', 'About'), ('pricing', '/pricing.html', 'Pricing'), ('support', '/support.html', 'Support')]
DISPLAY_FONTS = '<link href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@700&family=Fraunces:opsz,wght@9..144,600&family=Newsreader:opsz,wght@6..72,600&family=Roboto+Slab:wght@600&family=Syne:wght@700&family=Unbounded:wght@600&display=swap" rel="stylesheet">'


def contact(interest=None):
    """Link to the contact page, optionally pre-selecting an answer for "I'm interested in"."""
    return '/contact/' + ('?interest=' + interest.replace(' ', '+').replace('/', '%2F') if interest else '')


def page(key, path, title, desc, label, body, extra_head='', extra_tail='', dialogs=''):
    cur = lambda k: ' aria-current="page"' if k == key else ''
    def item(k, h, t, c):
        cls = ' class="nav-ttd"' if k == 'tradingdesk' else ''
        return f'<a href="{h}"{cls}{cur(k)}>{t}{f" <span>{c}</span>" if c else ""}</a>'
    nav = ''.join(item(*n) for n in NAV)
    nav += '<span class="nav-rule" aria-hidden="true"></span>' + ''.join(f'<a href="{h}"{cur(k)}>{t}</a>' for k, h, t in NAV2)
    mnav = ''.join(f'<a href="{h}"{cur(k)}>{t}</a>' for k, h, t, c in NAV) + ''.join(f'<a href="{h}"{cur(k)}>{t}</a>' for k, h, t in NAV2) + f'<a href="/contact/"{cur("contact")}>Get in touch</a>'
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
  <div class="rail-contact"><a class="button small" href="/contact/">Get in touch {ARROW}</a></div>
  <div class="rail-footer"><span>HELAL SAFI<br>PARIS, TEXAS</span></div>
</aside>
<header class="mobile-header">
  <a class="brand-m" href="/" aria-label="Safi Solutions home"><img src="/assets/images/logo-lockup.png" alt="Safi Solutions" width="675" height="288"></a>
  <button id="menu-toggle" type="button" aria-controls="mobile-nav" aria-expanded="false"><span>Menu</span></button>
  <nav id="mobile-nav" aria-label="Main">{mnav}</nav>
</header>
<main id="main" tabindex="-1">
<div class="workspace-top"><span>{e(label)}</span><span class="clock" data-clock>Paris, Texas</span><a href="/contact/">Let’s talk {ARROW}</a></div>
{body}
<footer class="site-footer"><span>© <span data-year>2026</span> Safi Solutions</span><span>Independent. Hands-on. Still curious.</span><nav aria-label="Footer"><a href="/pricing.html">Pricing</a><a href="/support.html">Support</a><a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a><a href="/refunds.html">Refunds</a></nav></footer>
</main>
{dialogs}<script src="/assets/site.js?v={V}" defer></script>
{extra_tail}</body>
</html>
'''


def write(rel, text):
    assert '—' not in text, f'em dash in {rel}'
    p = os.path.join(SITE, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w').write(text); print('wrote', rel, len(text))


def cta(title, text, href, label):
    return f'<div class="cta-band rv"><div><h2>{title}</h2><p>{text}</p></div><a class="button" href="{href}">{label} {ARROW}</a></div>'


# ---------------------------------------------------------------- landing: just the hero and its doors
DOORS = [
  ('/products/', 'Products', 'Desktop software for Windows', f'<b>{N_PROD}</b>{FREE} free', ''),
  ('/projects/', 'Projects', 'Interactive guides &amp; tools', f'<b>{N_PROJ}</b>live', ''),
  ('/websites/', 'Websites', 'Sites for local businesses', f'<b>{N_SITES}</b>live', ''),
  ('/studio/', 'SafiStudios', 'Custom business software', '<b>1:1</b>built to fit', ''),
  ('/tradingdesk/', 'TheTradingDesk', 'Markets, explained visually', 'featured', ' door-ttd'),
  ('/about/', 'About Me', 'The person behind the work', 'Paris, TX', ''),
  ('/contact/', 'Contact', 'Tell me what you’re working on', 'direct', ''),
]
doors = ''.join(f'<a class="door{x}" href="{h}"><span class="door-body"><b>{t}</b><small>{s}</small></span><span class="door-count">{c}</span>{ARROW}</a>' for h, t, s, c, x in DOORS)
landing = f'''<section class="hero" aria-labelledby="hero-title">
  <canvas class="threads" aria-hidden="true"></canvas>
  <div class="hero-copy">
    <p class="micro">Software · Websites · Interactive guides</p>
    <h1 id="hero-title" class="hero-title-pyramid"><span class="hero-line hero-line-1">Complicated</span><span class="hero-line hero-line-2">tasks. <span class="hero-made">Made</span></span><span class="hero-line hero-line-3">simpler.</span></h1>
    <p class="hero-lede">I design and build software, websites, and interactive guides that take something complicated, whether it’s a car or a business process, and make it easy to see, learn, and use.</p>
    <div class="hero-cta"><a class="button" href="/projects/">See the work {ARROW}</a><a class="button ghost" href="/contact/">Start a project</a></div>
  </div>
  <nav class="doors" aria-label="Explore Safi Solutions">{doors}</nav>
  <p class="hero-hint" aria-hidden="true"><i></i>Run the pointer through the threads</p>
</section>'''
write('index.html', page('home', '/', 'Safi Solutions | Complicated tasks, made simpler', 'Helal Safi designs and builds software, websites and interactive guides that take something complicated and make it easy to see, learn and use.', 'Safi Solutions / Independent studio', landing, extra_tail='<script src="/assets/threads.js?v=' + V + '" defer></script>\n'))


# ---------------------------------------------------------------- projects: logo tiles, and a detail view for each
def tile(p):
    raster = ' raster' if p.get('raster') else ''
    badge = f'<span class="tile-badge">{p["badge"]}</span>' if p.get('badge') else ''
    return f'''<article class="tile" id="t-{p["id"]}">
  <a class="tile-cover{raster}" href="#{p["id"]}" style="--identity:{p["bg"]}" aria-label="{e(p["name"])}: {e(p["type"])}">{badge}<img src="/assets/project-logos/{p["logo"]}" alt="{e(p["name"])} logo" loading="lazy"></a>
  <div class="tile-cap"><a href="#{p["id"]}">{e(p["name"])}</a><span>{e(p["type"])}</span></div>
</article>'''
featured = [p for p in PROJECTS if p.get('featured')]
wall = [p for p in PROJECTS if not p.get('featured')]
pdata = [dict(id=p['id'], name=p['name'], type=p['type'], detail=p['detail'], href=p['href'], shot='/assets/showcase/' + p['shot']) for p in PROJECTS]
noscript = ''.join(f'<a href="{p["href"]}">{e(p["name"])}</a>' for p in PROJECTS)
projects_body = f'''<div class="page" id="project-list">
  <header class="page-head"><div><p class="micro">Interactive tools &amp; learning</p><h1>Projects.</h1></div><p class="lead short">Turning complicated ideas<br>into clear visual systems.</p></header>
  <div class="tiles featured">{''.join(tile(p) for p in featured)}</div>
  <div class="subhead"><h2>More projects</h2><span>{len(wall):02d} / Explore</span></div>
  <div class="tiles wall">{''.join(tile(p) for p in wall)}</div>
  <noscript><p class="noscript-links">{noscript}</p></noscript>
  {cta('Have a subject that deserves this treatment?', 'Training material, a product that’s hard to explain, or a field your customers find confusing can all be made visual.', contact('An interactive education / product idea'), 'Talk about it')}
</div>
<section class="page detail" id="project-detail" aria-labelledby="d-title" hidden>
  <div class="detail-toolbar"><a href="/projects/" data-all>{BACK} All projects</a><div><a id="d-prev" href="#">{BACK} Previous</a><a id="d-next" href="#">Next {ARROW}</a></div></div>
  <header class="detail-head"><div><p class="micro" id="d-type"></p><h1 id="d-title"></h1><p class="copy" id="d-copy"></p></div>
    <div class="detail-actions"><a class="button" id="d-open" href="/">Open live project {ARROW}</a><button class="button ghost" type="button" id="d-phone">{PHONE}Add to phone</button></div></header>
  <figure class="detail-screen">
    <div class="screen-bar" aria-hidden="true"><i></i><i></i><i></i><span class="screen-url">{LOCK}<span id="d-url">safisolutions.org</span></span></div>
    <a class="detail-view" id="d-view" href="/"><img id="d-img" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="" width="1280" height="800"></a>
  </figure>
  <p class="detail-foot">Actual project preview. Click the picture or Open live project to explore it.</p>
</section>
<script type="application/json" id="project-data">{json.dumps(pdata, ensure_ascii=False)}</script>'''
phone_dialog = f'''<dialog class="sheet-dialog" id="phone-dialog" aria-labelledby="phone-title">
  <div class="sd-head"><div><p class="micro">Home screen app</p><h2 id="phone-title">Add <span id="phone-name">it</span> to your phone.</h2></div><button class="sd-close" type="button" aria-label="Close">×</button></div>
  <div class="sd-body"><p class="sd-copy">Save the live project to your Home Screen so it opens like an app.</p><section><p class="micro">iPhone / iPad</p><p>Open the project in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong> and <strong>Add</strong>.</p></section><section><p class="micro">Android</p><p>Open the project in Chrome, tap <strong>⋮</strong>, then <strong>Add to Home screen</strong> or <strong>Install app</strong> and confirm.</p></section>
  <a class="button" id="phone-open" href="/">Open it {ARROW}</a></div>
</dialog>
'''
names = ', '.join(p['name'] for p in PROJECTS)
write('projects/index.html', page('projects', '/projects/', 'Projects | Safi Solutions', f'Interactive guides and web tools by Safi Solutions: {names}.', 'Projects / Interactive tools & learning', projects_body, dialogs=phone_dialog))


# ---------------------------------------------------------------- products
def shelf(p):
    if p['paid']: buy = f'<div class="price"><del>$39</del><strong>$29</strong><small>one-time</small></div><a class="button" href="/products/{p["id"]}.html">Explore features {ARROW}</a>'
    else: buy = f'<div class="price"><strong>Free</strong><small>no checkout</small></div><a class="button" href="/products/{p["id"]}.html">Explore &amp; download {ARROW}</a>'
    shots = ''.join(f'<figure><button type="button" data-zoom style="all:unset;display:block;cursor:zoom-in;width:100%"><img src="/assets/products/{f}.webp" alt="{e(p["name"])}: {e(c)}" loading="lazy" width="1280" height="800"></button><figcaption>{e(c)}</figcaption></figure>' for f, c in p['shots'])
    tags = ''.join(f'<span>{t}</span>' for t in p['tags'])
    return f'''<article class="shelf w-{p["id"]} rv" id="{p["id"]}">
  <div><div class="shelf-kicker"><span class="pill {"paid" if p["paid"] else "free"}">{"Paid" if p["paid"] else "Free"}</span><span class="micro">{e(p["cat"])}</span></div>
    <h2>{e(p["name"])}</h2><p class="copy">{e(p["copy"])}</p><div class="tags">{tags}</div><div class="shelf-buy">{buy}</div></div>
  <div class="shelf-shots">{shots}</div>
</article>'''
products_body = f'''<div class="page">
  <header class="page-head"><div><p class="micro">Desktop software</p><h1>Products.</h1></div><p class="lead">Software like this already exists. I simplify the hard parts. Built for everyday users: <strong>{FREE} tools are free</strong>, and two focused business apps are one-time purchases with no subscription.</p></header>
  <div class="shelves">{''.join(shelf(p) for p in PRODUCTS)}</div>
  <div class="note-bar rv"><span><strong>Every app:</strong> Windows desktop · offline-first · no account · version 1.0</span><a class="underlined" href="/terms.html">Open/shareable licensing {ARROW}</a><a class="underlined" href="/support.html">Support &amp; updates {ARROW}</a><a class="underlined" href="/pricing.html">Pricing {ARROW}</a></div>
</div>'''
zoom_dialog = f'''<dialog class="sheet-dialog" id="zoom-dialog" style="width:min(1280px,calc(100% - 24px))"><div class="sd-head"><p class="micro zoom-title">Product preview</p><button class="sd-close" type="button" aria-label="Close">×</button></div><div class="sd-body"><img src="" alt="" style="width:100%;border:1px solid var(--line);border-radius:6px"></div></dialog>
'''
write('products/index.html', page('products', '/products/', 'Products | Safi Solutions desktop software', f'Six Windows desktop apps from Safi Solutions: {FREE} free tools (Padeff, Piktoor, Brandur, DoqDesk) and two one-time-purchase business apps (Kwezeen, DoqCorp).', 'Products / Desktop software', products_body, extra_head=DISPLAY_FONTS + '\n', dialogs=zoom_dialog))


# ---------------------------------------------------------------- websites: the client logos
def site_card(s):
    return f'''<article class="card rv" id="{s["id"]}">
  <a class="site-cover site-{s["id"]}" href="{s["href"]}" target="_blank" rel="noopener noreferrer" aria-label="Visit {e(s["name"])}"><img src="{s["logo"]}" alt="{e(s["name"])} logo" data-fallback="{e(s["fallback"])}"></a>
  <div class="card-body"><div><h2>{e(s["name"])}</h2><p class="card-kind">{e(s["type"])}</p></div><div class="card-links"><a class="button small" href="{s["href"]}" target="_blank" rel="noopener noreferrer">Visit {EXT}</a></div><p>{e(s["desc"])}</p></div>
</article>'''
more = ''.join(f'<a href="{h}" target="_blank" rel="noopener noreferrer"><div><strong>{e(n)}</strong><span>{e(t)}</span></div>{EXT}</a>' for n, t, h in MORE_SITES)
websites_body = f'''<div class="page">
  <header class="page-head"><div><p class="micro">Client websites</p><h1>Websites.</h1></div><p class="lead short">Designed for the business<br>on the other side of the screen.</p></header>
  <div class="card-grid">{''.join(site_card(s) for s in SITES)}</div>
  <div class="sec-head rv" style="margin-top:clamp(40px,5vw,64px)"><div><p class="micro">More website work</p><h2>Also live.</h2></div><a class="underlined" href="https://yourfuturesite.org" target="_blank" rel="noopener noreferrer">Explore more website directions {EXT}</a></div>
  <div class="site-list rv">{more}</div>
  {cta('Need a website?', 'A new site, a redesign, or a site that finally matches the business. Tell me what you do and who you do it for.', contact('A custom website'), 'Start a website')}
</div>'''
write('websites/index.html', page('websites', '/websites/', 'Websites | Safi Solutions', 'Client websites designed and built by Safi Solutions: Elizabeth Aven Photography, Baker Precision Home Inspections, Landry Locksmith, Tex-Mex Oil & Shine and NETX Behavioral Health.', 'Websites / Client work', websites_body))


# ---------------------------------------------------------------- studio
GAL = [
  ('sallys-roses-workspace.webp', 'Sally’s Roses: business workspace dashboard'),
  ('jgs-auto-workspace.webp?v=17', 'JG’s Auto: vehicle and service history workspace'),
]
gal = ''.join(f'<figure class="rv"><img src="/assets/showcase/{f}" alt="{e(c)}" loading="lazy"><figcaption>{e(c)}</figcaption></figure>' for f, c in GAL)
studio_body = f'''<div class="page">
  <header class="page-head"><div><p class="micro">Business software</p><h1>SafiStudios.</h1></div><p class="lead">Custom software for a better-organized business, built around the way your day actually runs instead of the other way round.</p></header>
  <section class="studio-hero">
    <div class="rv"><p>Keep documents, employee records, schedules and inventory in one workspace, built around your everyday data entry.</p><p>Tailored to different industries, from retail and daily operations to contractors and events. Every build starts from how the work is really done and removes the steps nobody needs.</p><p class="field-note"><strong>For field teams:</strong> I’m developing connected workflows to help pest control, HVAC and other service crews communicate with management.</p>
      <div class="hero-cta"><a class="button" href="{contact('SafiStudios / custom business software')}">Discuss your business {ARROW}</a><a class="button ghost" href="/pricing.html">How pricing works</a></div></div>
    <div class="studio-stack rv" data-d="120"><figure><img src="/assets/showcase/java-workspace.webp" alt="Downtown Coffee staff schedule workspace"></figure><figure><img src="/assets/showcase/cedar-workspace.webp" alt="Cedar’s Pest routes and dispatch workspace"></figure></div>
  </section>
  <div class="sec-head rv" style="margin-top:clamp(48px,6vw,80px)"><div><p class="micro">Design previews</p><h2>Built to fit the work.</h2></div><p class="micro">Sample data · modules vary by build</p></div>
  <div class="gallery two studio-real-previews">{gal}</div>
  {cta('Running on spreadsheets and sticky notes?', 'Tell me how the day works now. Quotes are based on scope, with no fixed packages you have to fit into.', contact('SafiStudios / custom business software'), 'Start the conversation')}
</div>'''
write('studio/index.html', page('studio', '/studio/', 'SafiStudios | Custom business software', 'SafiStudios builds custom business software: documents, employee records, scheduling, inventory and field-team workflows in one workspace, built around how your business runs.', 'SafiStudios / Business software', studio_body))


# ---------------------------------------------------------------- TheTradingDesk
TOPICS = ['Beginner path', 'Market structure', 'Options', 'Futures', 'Risk', 'Calculators', 'Terminology']
ttd_body = f'''<section class="market" aria-labelledby="ttd-title">
  <div class="market-mark">
    <a class="market-logo" href="{TTD}" target="_blank" rel="noopener noreferrer" aria-label="Open TheTradingDesk"><img src="/assets/project-logos/tradingdesk.svg" alt="TheTradingDesk" width="2172" height="724"></a>
    <a class="button market-open" href="{TTD}" target="_blank" rel="noopener noreferrer">Open TheTradingDesk {EXT}</a>
  </div>
  <div class="market-copy">
    <p class="micro">TheTradingDesk · Featured project</p>
    <h1 id="ttd-title">Markets Simplified.</h1>
    <p class="market-lede">A dedicated learning environment for understanding how markets actually work, from basic language to options, futures, risk and trade structure. The goal is education and clarity, not signals.</p>
    <div class="tags market-topics" aria-label="Topics covered">{''.join(f'<span>{t}</span>' for t in TOPICS)}</div>
    <div class="market-proof"><strong>Built as a reference, not a feed.</strong><span>Learn at your own pace, revisit concepts, and use the visual tools when the language gets dense.</span></div>
    <a class="underlined" href="{TTD}" target="_blank" rel="noopener noreferrer">Explore the full learning desk {EXT}</a>
    <p class="market-note">Educational reference only. Focused on understanding markets, not individualized financial advice or trade signals.</p>
  </div>
</section>'''
write('tradingdesk/index.html', page('tradingdesk', '/tradingdesk/', 'TheTradingDesk | Markets Simplified', 'TheTradingDesk is a learning environment for how markets actually work: market structure, options, futures, risk and trade structure, built for education and clarity, not signals.', 'TheTradingDesk / Markets', ttd_body))


# ---------------------------------------------------------------- about
about_body = f'''<div class="page about-page">
  <div class="about-meta micro"><span>About / the person behind the work</span><span>Paris, Texas</span></div>
  <div class="about-grid">
    <figure class="portrait rv"><img src="/assets/images/profphoto.webp" alt="Helal Safi" width="640" height="1400"><figcaption>HELAL SAFI<br>PARIS, TEXAS</figcaption></figure>
    <div class="about-copy rv" data-d="120">
      <p class="micro">About me</p>
      <h1>Hi, I’m Helal.</h1>
      <p>I build desktop software, websites and interactive tools that make complicated things easier to work with.</p>
      <p>A lot of these projects start with something I want to understand better, or a business that needs a better way to manage its day. The Bench makes coding more approachable. VoltVisual turns electrical systems into something you can explore. SafiStudios brings that same thinking to business software.</p>
      <p>I had a basic coding foundation from college, but AI dramatically expanded what I could bring to life. Learning how to engineer with it, structure problems, guide the tools and refine the output is what lets me turn ideas into working products.</p>
      <p>I’m based in Paris, Texas. Safi Solutions is my independent practice, so when you get in touch, you’re talking to the person doing the work.</p>
      <p class="note">The project list is also a fairly accurate record of my curiosity.</p>
      <dl class="about-facts"><div><dt>{N_PROJ}</dt><dd>interactive projects</dd></div><div><dt>{N_PROD}</dt><dd>desktop apps</dd></div><div><dt>{N_SITES}</dt><dd>client websites</dd></div></dl>
      <div class="hero-cta"><a class="button" href="/contact/">Tell me what you’re working on {ARROW}</a><a class="button ghost" href="/projects/">See the work</a></div>
    </div>
  </div>
</div>'''
write('about/index.html', page('about', '/about/', 'About Helal Safi | Safi Solutions', 'Helal Safi is an independent designer and developer in Paris, Texas, building desktop software, websites and interactive tools that make complicated things easier to work with.', 'About / Helal Safi', about_body))


# ---------------------------------------------------------------- contact
INTERESTS = ['A custom website', 'SafiStudios / custom business software', 'Products / desktop software', 'A SaaS / software concept', 'An internal business tool', 'An interactive education / product idea', 'Improving something that already exists', 'Not sure yet / something else']
contact_body = f'''<div class="page contact-page">
  <div class="contact-grid">
    <header class="contact-head"><p class="micro">Direct to Helal</p><h1>What are you working on?</h1><p>A new website, a business tool, or something you haven’t quite figured out yet. Tell me about it and you’ll hear back from me, not a team.</p><a class="mail" href="mailto:safihelal@gmail.com">safihelal@gmail.com {ARROW}</a></header>
    <form class="inquiry-form" id="inquiry-form" action="https://formsubmit.co/safihelal@gmail.com" method="POST">
      <input type="hidden" name="_captcha" value="true"><input type="hidden" name="_subject" value="New inquiry - Safi Solutions"><input type="hidden" name="_template" value="table">
      <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
      <div class="form-field"><label for="iq-name">Your name <em>*</em></label><input id="iq-name" name="name" type="text" autocomplete="name" placeholder="Your name" required></div>
      <div class="form-field"><label for="iq-biz">Business / project</label><input id="iq-biz" name="business" type="text" autocomplete="organization" placeholder="Business name or project idea"></div>
      <div class="form-field"><label for="iq-email">Email <em>*</em></label><input id="iq-email" name="email" type="email" autocomplete="email" placeholder="you@email.com" required></div>
      <div class="form-field"><label for="iq-phone">Phone (optional)</label><input id="iq-phone" name="phone" type="tel" autocomplete="tel" placeholder="(555) 555-5555"></div>
      <div class="form-field full"><label for="iq-interest">I’m interested in…</label><select id="iq-interest" name="interest">{''.join(f'<option>{e(o)}</option>' for o in INTERESTS)}</select></div>
      <div class="form-field full"><label for="iq-msg">Tell me what you’re trying to build (optional)</label><textarea id="iq-msg" name="message" placeholder="The problem, the idea, what exists today, or what you wish existed instead…"></textarea></div>
      <button class="button" type="submit">Send inquiry {ARROW}</button>
      <p class="form-foot">Delivered through FormSubmit straight to my inbox. No mailing lists.</p>
    </form>
  </div>
</div>'''
write('contact/index.html', page('contact', '/contact/', 'Contact | Safi Solutions', 'Tell Helal Safi about your website, business software or interactive project. Every inquiry goes straight to him.', 'Contact / Direct to Helal', contact_body))
