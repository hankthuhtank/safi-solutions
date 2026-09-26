/* Sports Atlas — play-diagram engine.
   Scenes are plain data in field units (see viz/*.js). The engine draws the regulation surface, then animates
   players, routes, zones and the ball on a deterministic timeline (so scrubbing and replays are exact).
   On narrow screens long surfaces rotate to portrait with labels kept upright. */
import { SURFACES, PALETTES, textSVG, smoothPath } from './surfaces.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lin = t => t;

/* Token radius & label size per sport, in field units */
const TOKEN = { football: 1.15, basketball: 1.55, soccer: 1.7, volleyball: .42, baseball: 7, golf: 4 };
let DGID = 0;

export class Diagram {
  constructor(host, opts = {}) {
    this.host = host; this.o = opts; this.sport = opts.sport;
    this.id = 'dg' + (++DGID);
    this.R = opts.r || TOKEN[this.sport] || 1;
    this.callouts = !!opts.callouts; // numbered badges + legend instead of long labels on phones
    this.t = 0; this.playing = false; this.speed = 1;
    host.classList.add('dg');
    host.innerHTML = '';
    this.stage = document.createElement('div'); this.stage.className = 'dg-stage'; host.append(this.stage);
    this.svg = el('svg', { class: 'dg-svg', role: 'img', 'aria-label': opts.label || 'Diagram', preserveAspectRatio: 'xMidYMid meet' }, this.stage);
    this.defs = el('defs', {}, this.svg);
    this.root = el('g', { class: 'dg-root' }, this.svg);
    this.gSurface = el('g', { class: 'dg-surface' }, this.root);
    this.gUnder = el('g', { class: 'dg-under' }, this.root);
    this.gZones = el('g', { class: 'dg-zones' }, this.root);
    this.gMarks = el('g', { class: 'dg-marks' }, this.root);
    this.gPaths = el('g', { class: 'dg-paths' }, this.root);
    this.gLabels = el('g', { class: 'dg-labels' }, this.root); // mark & zone labels sit above every line
    this.gPlayers = el('g', { class: 'dg-players' }, this.root);
    this.gFx = el('g', { class: 'dg-fx' }, this.root);
    this.arrowDefs();
    this.drawSurface();
    if (opts.caption !== false) { this.cap = document.createElement('p'); this.cap.className = 'dg-caption'; this.cap.setAttribute('aria-live', 'polite'); host.append(this.cap); }
    if (opts.controls !== false) this.buildControls();
    this.tip = document.createElement('div'); this.tip.className = 'dg-tip'; this.tip.hidden = true; this.stage.append(this.tip);
    this.ro = new ResizeObserver(() => this.layout()); this.ro.observe(host);
    this.io = new IntersectionObserver(es => {
      this.onscreen = es[0].isIntersecting;
      if (this.onscreen) { if (this.autoplayPending) { this.autoplayPending = false; this.play(); } }
      else if (this.playing) { this.pause(true); this.autoplayPending = true; }
    }, { threshold: .35 });
    this.io.observe(host);
  }

  arrowDefs() {
    const mk = (id, d, cls) => { const m = el('marker', { id: this.id + id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4.2, markerHeight: 4.2, orient: 'auto-start-reverse', markerUnits: 'strokeWidth' }, this.defs); el('path', { d, class: cls }, m); };
    mk('a', 'M0,0 L10,5 L0,10 Z', 'dg-mk');
    const t = el('marker', { id: this.id + 't', viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto', markerUnits: 'strokeWidth' }, this.defs);
    el('path', { d: 'M5,0 L5,10', class: 'dg-mk-tee' }, t);
  }

  drawSurface() {
    const sp = SURFACES[this.sport](PALETTES[this.sport].diagram, this.o.surface || {});
    this.spec = sp;
    this.gSurface.innerHTML = sp.svg + textSVG(sp);
  }

  /* ---------- layout / orientation */
  layout() {
    const w = this.host.clientWidth || 600;
    const v = this.view || this.spec.bounds;
    if (this.callouts && this.rawScene && this.narrow() !== this.useCallouts) { this.load(this.rawScene, true); return; }
    const wantV = this.isVertical(v, w);
    this.vertical = wantV;
    const [x, y, W, H] = v;
    if (wantV) {
      this.root.setAttribute('transform', 'matrix(0,-1,1,0,0,0)');
      this.svg.setAttribute('viewBox', `${y} ${-(x + W)} ${H} ${W}`);
    } else {
      this.root.removeAttribute('transform');
      this.svg.setAttribute('viewBox', `${x} ${y} ${W} ${H}`);
    }
    this.host.classList.toggle('is-vertical', wantV);
    // keep tall views from rendering wider than their content: cap width by the 72vh height limit
    const aspect = wantV ? H / W : W / H;
    this.svg.style.maxWidth = aspect < 1.25 ? `calc(${wantV ? 78 : 72}vh * ${aspect.toFixed(3)})` : '';
    for (const n of this.svg.querySelectorAll('.upright')) n.setAttribute('transform', wantV ? 'rotate(90)' : '');
    cancelAnimationFrame(this.fitRaf); this.fitRaf = requestAnimationFrame(() => { this.fitRaf = requestAnimationFrame(() => this.fitLabels()); });
  }

  isVertical(v, w) { return this.o.orient === 'v' || (this.o.orient !== 'h' && this.scene?.rotate !== false && w < (this.o.rotateBelow || 620) && v[2] > v[3] * 1.15); }
  narrow() { return (this.host.clientWidth || innerWidth) < 560; }

  /* screen pixels per field unit for the current view (used to keep labels legible at any size) */
  measure() {
    const w = this.host.clientWidth || 600, v = this.view, vert = this.isVertical(v, w);
    const vw = vert ? v[3] : v[2], vh = vert ? v[2] : v[3], aspect = vw / vh;
    const maxW = aspect < 1.25 ? (vert ? .78 : .72) * innerHeight * aspect : Infinity;
    this.pxu = Math.min(w, maxW) / vw;
  }
  labelSize(fs) { const nar = this.narrow(); return Math.min(Math.max(fs, (nar ? 9.5 : 10) / this.pxu), (nar ? 13 : 22) / this.pxu); }

  /* nudge any label that spills past the drawing back inside it */
  fitLabels() {
    if (!this.svg.isConnected) return;
    const ctm = this.svg.getScreenCTM(), vb = this.svg.viewBox.baseVal;
    if (!ctm || !vb || !vb.width) return;
    const ax = ctm.a * vb.x + ctm.e, ay = ctm.d * vb.y + ctm.f, bx = ax + ctm.a * vb.width, by = ay + ctm.d * vb.height, pad = 3;
    for (const w of this.root.querySelectorAll('.lab-wrap')) {
      const x = +w.dataset.x, y = +w.dataset.y;
      w.setAttribute('transform', `translate(${x} ${y})`);
      const r = w.getBoundingClientRect(); if (!r.width) continue;
      let dx = 0, dy = 0;
      if (r.width > bx - ax - 2 * pad) dx = (ax + bx - r.left - r.right) / 2;
      else if (r.left < ax + pad) dx = ax + pad - r.left; else if (r.right > bx - pad) dx = bx - pad - r.right;
      if (r.top < ay + pad) dy = ay + pad - r.top; else if (r.bottom > by - pad) dy = by - pad - r.bottom;
      if (!dx && !dy) continue;
      const m = w.parentNode.getScreenCTM().inverse();
      w.setAttribute('transform', `translate(${x + m.a * dx + m.c * dy} ${y + m.b * dx + m.d * dy})`);
    }
  }

  /* shared label builder: a pill label, or on phones (callout mode) a numbered badge keyed to a legend */
  label(parent, x, y, text, fs, cls, o = {}) {
    const wrap = el('g', { transform: `translate(${x} ${y})`, class: 'lab-wrap' + (o.wrapCls ? ' ' + o.wrapCls : '') }, parent);
    wrap.dataset.x = x; wrap.dataset.y = y;
    const up = el('g', { class: 'upright' }, wrap);
    if (this.useCallouts && (o.callout === true || (o.callout !== false && text.length > 7))) {
      const n = this.legendItems.indexOf(text) + 1 || this.legendItems.push(text), r = 10 / this.pxu;
      el('circle', { class: 'co-disc', r, 'stroke-width': r * .2 }, up);
      const t = el('text', { class: 'co-num', 'text-anchor': 'middle', dy: '.36em', 'font-size': r * 1.1 }, up); t.textContent = n;
      return wrap;
    }
    const size = this.labelSize(fs);
    const t = el('text', { class: cls, 'text-anchor': o.anchor || 'middle', dy: '.35em', 'font-size': size }, up); t.textContent = text;
    if (o.pill) { requestAnimationFrame(() => { try { const b = t.getBBox(); const r = el('rect', { class: 'mk-pill', x: b.x - size * .45, y: b.y - size * .18, width: b.width + size * .9, height: b.height + size * .36, rx: size * .3, 'stroke-width': size * .07 }); up.insertBefore(r, t); } catch (e) { } }); }
    return wrap;
  }

  renderLegend() {
    if (this.legendEl) { this.legendEl.remove(); this.legendEl = null; }
    if (!this.legendItems.length) return;
    const ol = document.createElement('ol'); ol.className = 'dg-legend';
    for (const [i, text] of this.legendItems.entries()) { const li = document.createElement('li'); const b = document.createElement('b'); b.textContent = i + 1; const sp = document.createElement('span'); sp.textContent = text; li.append(b, sp); ol.append(li); }
    this.stage.after(ol); this.legendEl = ol;
  }

  /* ---------- scene loading */
  /* Optional schematic lateral mapping (e.g. spread the interior line, compress toward the sidelines on phones). */
  mapScene(sc) {
    const m = this.o.mapY; if (!m) return sc;
    const pt = p => [p[0], m(p[1])];
    const out = { ...sc };
    if (sc.view) { const [x, y, w, hh] = sc.view; const y0 = m(y), y1 = m(y + hh); out.view = [x, y0, w, y1 - y0]; }
    out.players = (sc.players || []).map(p => ({ ...p, y: m(p.y) }));
    out.paths = (sc.paths || []).map(p => ({ ...p, pts: p.pts && p.pts.map(pt), toPt: p.toPt && pt(p.toPt), fromPt: p.fromPt && pt(p.fromPt) }));
    out.zones = (sc.zones || []).map(z => {
      if (z.shape === 'poly') return { ...z, pts: z.pts.map(pt), ly: z.ly != null ? m(z.ly) : z.ly };
      if (z.shape === 'ellipse') { const y0 = m(z.y - z.ry), y1 = m(z.y + z.ry); return { ...z, y: (y0 + y1) / 2, ry: (y1 - y0) / 2 }; }
      const y0 = m(z.y), y1 = m(z.y + z.h); return { ...z, y: y0, h: y1 - y0, ly: z.ly != null ? m(z.ly) : z.ly };
    });
    out.marks = (sc.marks || []).map(k => {
      const n = { ...k };
      if (k.y1 != null) n.y1 = m(k.y1); if (k.y2 != null) n.y2 = m(k.y2);
      if (k.type === 'rect') { const y0 = m(k.y), y1 = m(k.y + k.h); n.y = y0; n.h = y1 - y0; }
      if (k.type === 'circle') n.y = m(k.y);
      if (k.ly != null) n.ly = m(k.ly);
      return n;
    });
    if (sc.ball && sc.ball.y != null) out.ball = { ...sc.ball, y: m(sc.ball.y) };
    return out;
  }

  load(scene, relayout) {
    this.pause(true);
    const keepT = relayout ? this.t : null;
    this.rawScene = scene;
    scene = this.mapScene(scene);
    this.scene = scene;
    this.view = scene.view || this.spec.bounds;
    this.measure();
    this.useCallouts = this.callouts && this.narrow();
    this.legendItems = [];
    this.gZones.innerHTML = ''; this.gMarks.innerHTML = ''; this.gLabels.innerHTML = ''; this.gPaths.innerHTML = ''; this.gPlayers.innerHTML = ''; this.gFx.innerHTML = ''; this.gUnder.innerHTML = '';
    this.players = new Map(); this.paths = []; this.zones = []; this.segs = new Map();
    const R = scene.r || this.R;
    // static marks (LOS, line to gain, labels, dimension callouts)
    for (const m of scene.marks || []) this.addMark(m);
    for (const z of scene.zones || []) this.addZone(z);
    // players
    for (const p of scene.players || []) {
      const g = el('g', { class: `pl pl-${p.team || 'o'}${p.hl ? ' is-hl' : ''}${p.ghost ? ' is-ghost' : ''}`, tabindex: p.info ? 0 : null, role: p.info ? 'button' : null, 'aria-label': p.info ? `${p.name || p.label}: ${p.info}` : null }, this.gPlayers);
      const inner = el('g', { class: 'upright' }, g);
      const r = p.r || R;
      if (p.shape === 'x') { el('path', { class: 'pl-x', d: `M${-r * .7},${-r * .7} L${r * .7},${r * .7} M${r * .7},${-r * .7} L${-r * .7},${r * .7}` }, inner); }
      else el('circle', { class: 'pl-disc', r }, inner);
      if (p.label) { const tx = el('text', { class: 'pl-lab', 'text-anchor': 'middle', dy: '.36em', 'font-size': (r * (p.label.length > 3 ? .62 : p.label.length > 2 ? .78 : .95)).toFixed(3) }, inner); tx.textContent = p.label; }
      const obj = { ...p, g, r, x: p.x, y: p.y };
      this.players.set(p.id || p.label, obj);
      if (p.info) {
        const show = () => this.showTip(obj); const hide = () => this.hideTip();
        g.addEventListener('mouseenter', show); g.addEventListener('mouseleave', hide);
        g.addEventListener('focus', show); g.addEventListener('blur', hide);
        g.addEventListener('click', e => { e.stopPropagation(); this.tipFor === obj ? this.hideTip() : this.showTip(obj); });
      }
    }
    // paths
    for (const p of scene.paths || []) this.addPath(p);
    this.renderLegend();
    // ball
    this.ball = null;
    if (scene.ball) {
      this.ball = el('g', { class: 'dg-ball' }, this.gFx);
      el('circle', { r: (scene.ball.r || R * .38) }, this.ball);
      this.ballEvents = this.paths.filter(p => ['pass', 'shot', 'kick', 'handoff', 'hit', 'toss'].includes(p.kind)).sort((a, b) => a.t - b.t);
    }
    this.duration = scene.duration || Math.max(1, ...this.paths.map(p => p.t + p.d), ...(scene.zones || []).map(z => (z.t || 0) + 1), ...(scene.captions || []).map(c => c.t + 1.5));
    this.captions = (scene.captions || []).slice().sort((a, b) => a.t - b.t);
    if (this.scrub) { this.scrub.max = this.duration; this.scrub.value = 0; }
    this.layout();
    this.seek(keepT ?? scene.startAt ?? (scene.static ? this.duration : 0));
    this.host.classList.toggle('is-static', !!scene.static || !this.paths.length);
    if (this.o.autoplay && !scene.static && !reduced) { this.onscreen ? this.play() : (this.autoplayPending = true); }
    if (reduced && !scene.static) this.seek(this.duration);
  }

  addMark(m) {
    const g = el('g', { class: `mk mk-${m.tone || 'dim'}` }, m.under ? this.gUnder : this.gMarks);
    if (m.type === 'line') el('line', { x1: m.x1, y1: m.y1, x2: m.x2, y2: m.y2, class: 'mk-line', 'stroke-dasharray': m.dash || null }, g);
    if (m.type === 'rect') el('rect', { x: m.x, y: m.y, width: m.w, height: m.h, class: 'mk-rect', rx: m.rx || 0 }, g);
    if (m.type === 'circle') el('circle', { cx: m.x, cy: m.y, r: m.r, class: 'mk-circle' }, g);
    if (m.type === 'path') el('path', { d: m.d, class: 'mk-path' }, g);
    if (m.type === 'dim') { // dimension callout with end ticks
      el('line', { x1: m.x1, y1: m.y1, x2: m.x2, y2: m.y2, class: 'mk-dim', 'marker-start': `url(#${this.id}t)`, 'marker-end': `url(#${this.id}t)` }, g);
    }
    if (m.label) {
      const lx = m.lx ?? (m.type === 'line' || m.type === 'dim' ? (m.x1 + m.x2) / 2 : m.x + (m.w || 0) / 2);
      const ly = m.ly ?? (m.type === 'line' || m.type === 'dim' ? (m.y1 + m.y2) / 2 : m.y + (m.h || 0) / 2);
      this.label(this.gLabels, lx, ly, m.label, m.fs || this.R * .95, 'mk-lab', { pill: m.pill !== false, callout: m.callout, wrapCls: `mk mk-${m.tone || 'dim'}` });
    }
    return g;
  }

  addZone(z) {
    const g = el('g', { class: `zn zn-${z.tone || 'under'}` }, this.gZones);
    let shape;
    if (z.shape === 'ellipse') shape = el('ellipse', { cx: z.x, cy: z.y, rx: z.rx, ry: z.ry }, g);
    else if (z.shape === 'poly') shape = el('path', { d: z.smooth ? smoothPath(z.pts, true, .8) : 'M' + z.pts.map(p => p.join(',')).join(' L') + ' Z' }, g);
    else shape = el('rect', { x: z.x, y: z.y, width: z.w, height: z.h, rx: z.rx ?? Math.min(z.w, z.h) * .12 }, g);
    shape.setAttribute('class', 'zn-shape');
    if (z.label) {
      const cx = z.lx ?? (z.shape === 'rect' || !z.shape ? z.x + z.w / 2 : z.shape === 'ellipse' ? z.x : z.pts.reduce((a, p) => a + p[0], 0) / z.pts.length);
      const cy = z.ly ?? (z.shape === 'rect' || !z.shape ? z.y + z.h / 2 : z.shape === 'ellipse' ? z.y : z.pts.reduce((a, p) => a + p[1], 0) / z.pts.length);
      z = { ...z, lab: this.label(this.gLabels, cx, cy, z.label, z.fs || this.R * .9, 'zn-lab', { callout: z.callout, wrapCls: `zn zn-${z.tone || 'under'}` }) };
    }
    this.zones.push({ ...z, g });
  }

  addPath(p) {
    const kind = p.kind || 'route';
    const g = el('g', { class: `pt pt-${kind}${p.alt ? ' pt-alt' : ''}` }, this.gPaths);
    const obj = { ...p, kind, t: p.t || 0, d: p.d ?? 1, g };
    if (kind === 'pass' || kind === 'shot' || kind === 'kick' || kind === 'hit' || kind === 'toss') {
      obj.line = el('path', { class: 'pt-line', 'marker-end': p.arrow === 'none' ? null : `url(#${this.id}a)` }, g);
      this.paths.push(obj); return;
    }
    if (kind === 'handoff') { this.paths.push(obj); return; }
    const pts = p.pts;
    const d = p.curve ? smoothPath(pts, false, .85) : 'M' + pts.map(q => q.join(',')).join(' L');
    obj.line = el('path', { d, class: 'pt-line', 'marker-end': p.arrow === 'none' ? null : kind === 'block' || p.arrow === 'tee' ? `url(#${this.id}t)` : `url(#${this.id}a)` }, g);
    obj.len = obj.line.getTotalLength();
    obj.line.style.strokeDasharray = kind === 'motion' ? null : `${obj.len} ${obj.len}`;
    if (p.who) {
      if (!this.segs.has(p.who)) this.segs.set(p.who, []);
      this.segs.get(p.who).push(obj);
    }
    if (p.label) {
      const end = pts[pts.length - 1];
      obj.lab = this.label(g, end[0] + (p.lox || 0), end[1] + (p.loy || 0), p.label, p.fs || this.R * .85, 'pt-lab', { anchor: p.anchor, wrapCls: 'pt-labwrap', callout: false });
    }
    this.paths.push(obj);
  }

  /* ---------- deterministic state at time t */
  posAt(id, t) {
    const p = this.players.get(id); if (!p) return [0, 0];
    const segs = this.segs.get(id);
    if (!segs) return [p.x, p.y];
    let pos = [p.x, p.y];
    for (const s of segs.slice().sort((a, b) => a.t - b.t)) {
      if (t <= s.t) break;
      const k = Math.min(1, (t - s.t) / s.d), e = (s.ease === 'lin' ? lin : ease)(k);
      const q = s.line.getPointAtLength(s.len * e);
      pos = [q.x, q.y];
    }
    return pos;
  }

  seek(t) {
    this.t = Math.max(0, Math.min(this.duration || 0, t));
    const T = this.t;
    for (const [id, p] of this.players) { const [x, y] = this.posAt(id, T); p.cx = x; p.cy = y; p.g.setAttribute('transform', `translate(${x} ${y})`); }
    for (const s of this.paths) {
      if (!s.line) continue;
      const k = Math.max(0, Math.min(1, (T - s.t) / s.d));
      if (s.kind === 'pass' || s.kind === 'shot' || s.kind === 'kick' || s.kind === 'hit' || s.kind === 'toss') {
        const a = s.fromPt || this.posAt(s.from, s.t), b = s.toPt || (s.to ? this.posAt(s.to, s.t + s.d) : a);
        const mid = [(a[0] + b[0]) / 2 + (s.bend || 0) * (b[1] - a[1]) * .15, (a[1] + b[1]) / 2 - (s.bend || 0) * (b[0] - a[0]) * .15];
        s.line.setAttribute('d', `M${a[0]},${a[1]} Q${mid[0]},${mid[1]} ${b[0]},${b[1]}`);
        const len = s.line.getTotalLength(); s.len = len;
        s.line.style.strokeDasharray = `${len} ${len}`; s.line.style.strokeDashoffset = len * (1 - k);
        s.g.style.opacity = T < s.t ? 0 : 1;
      } else {
        s.line.style.strokeDashoffset = s.kind === 'motion' ? 0 : s.len * (1 - ease(k));
        s.g.style.opacity = T < s.t ? 0 : (s.dim ? .22 : 1);
        if (s.lab) s.lab.style.opacity = k > .85 ? 1 : 0;
      }
    }
    for (const z of this.zones) { const o = T >= (z.t || 0) ? 1 : 0; z.g.style.opacity = o; if (z.lab) z.lab.style.opacity = o; }
    this.placeBall(T);
    if (this.cap) {
      let c = this.captions.filter(x => x.t <= T + .001).pop() || this.captions[0];
      const txt = c ? c.text : (this.scene?.caption || '');
      if (this.cap.textContent !== txt) this.cap.textContent = txt;
    }
    if (this.scrub) this.scrub.value = T;
  }

  placeBall(T) {
    if (!this.ball) return;
    const sc = this.scene.ball;
    let holder = sc.holder, inAir = null, rest = sc.x != null ? [sc.x, sc.y] : null;
    for (const e of this.ballEvents) {
      if (T < e.t) break;
      if (e.kind === 'handoff') { holder = e.to; rest = null; continue; }
      if (T < e.t + e.d) { inAir = e; break; }
      if (e.to) { holder = e.to; rest = null; } else { holder = null; rest = e.toPt || rest; }
    }
    let x, y;
    if (inAir) { const k = (T - inAir.t) / inAir.d; const q = inAir.line.getPointAtLength(inAir.len * k); x = q.x; y = q.y; }
    else if (holder) { const [px, py] = this.posAt(holder, T); x = px + (sc.dx ?? .6) * this.R; y = py + (sc.dy ?? -.5) * this.R; }
    else if (rest) { [x, y] = rest; }
    this.ball.style.opacity = x == null ? 0 : 1;
    if (x != null) this.ball.setAttribute('transform', `translate(${x} ${y})`);
  }

  /* ---------- playback */
  play() {
    if (!this.scene || this.scene.static) return;
    if (this.onscreen === false) { this.autoplayPending = true; return; }
    if (this.t >= this.duration - .01) this.seek(0);
    this.playing = true; this.host.classList.add('is-playing');
    if (this.btn) { this.btn.setAttribute('aria-label', 'Pause'); this.btn.dataset.state = 'pause'; }
    let last = performance.now();
    const step = now => {
      if (!this.playing) return;
      const dt = Math.min(.05, (now - last) / 1000) * this.speed; last = now;
      this.seek(this.t + dt);
      if (this.t >= this.duration) { this.pause(); return; }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
  pause(silent) {
    this.playing = false; cancelAnimationFrame(this.raf); this.host.classList.remove('is-playing');
    if (this.btn) { this.btn.setAttribute('aria-label', this.t >= this.duration - .01 ? 'Replay' : 'Play'); this.btn.dataset.state = this.t >= this.duration - .01 ? 'replay' : 'play'; }
  }
  buildControls() {
    const bar = document.createElement('div'); bar.className = 'dg-controls';
    this.btn = document.createElement('button'); this.btn.type = 'button'; this.btn.className = 'dg-play'; this.btn.dataset.state = 'play'; this.btn.setAttribute('aria-label', 'Play');
    this.btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-play" d="M8 5v14l11-7z"/><path class="i-pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/><path class="i-replay" d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg>';
    this.btn.addEventListener('click', () => this.playing ? this.pause() : this.play());
    this.scrub = document.createElement('input'); this.scrub.type = 'range'; this.scrub.min = 0; this.scrub.step = .01; this.scrub.className = 'dg-scrub'; this.scrub.setAttribute('aria-label', 'Scrub through the play');
    this.scrub.addEventListener('input', () => { this.pause(true); this.seek(+this.scrub.value); this.btn.dataset.state = 'play'; });
    const sp = document.createElement('button'); sp.type = 'button'; sp.className = 'dg-speed'; sp.textContent = '1×'; sp.setAttribute('aria-label', 'Playback speed');
    sp.addEventListener('click', () => { this.speed = this.speed === 1 ? .5 : 1; sp.textContent = this.speed === 1 ? '1×' : '½×'; });
    bar.append(this.btn, this.scrub, sp);
    this.host.append(bar);
  }

  showTip(p) {
    this.tipFor = p;
    this.tip.innerHTML = `<strong>${p.name || p.label}</strong><span>${p.info}</span>`;
    this.tip.hidden = false;
    const sb = this.svg.getBoundingClientRect(), hb = this.stage.getBoundingClientRect();
    const m = p.g.getScreenCTM(); if (!m) return;
    const x = m.e - hb.left, y = m.f - hb.top;
    const tw = this.tip.offsetWidth, th = this.tip.offsetHeight;
    let left = Math.min(Math.max(8, x - tw / 2), hb.width - tw - 8), top = y - th - 18;
    if (top < 6) top = y + 22;
    this.tip.style.left = left + 'px'; this.tip.style.top = top + 'px';
    for (const q of this.players.values()) q.g.classList.toggle('is-focus', q === p);
  }
  /* Convert a screen point to field units (works in either orientation). */
  toField(cx, cy) { const pt = this.svg.createSVGPoint(); pt.x = cx; pt.y = cy; const q = pt.matrixTransform(this.root.getScreenCTM().inverse()); return [q.x, q.y]; }
  /* Make players draggable (pointer + arrow keys). clamp(x, y, id) → [x, y]; onMove(id, x, y) after each move. */
  drag(ids, { onMove, clamp } = {}) {
    for (const id of ids) {
      const p = this.players.get(id); if (!p) continue;
      p.g.classList.add('is-drag'); p.g.setAttribute('tabindex', '0'); p.g.setAttribute('role', 'slider');
      p.g.setAttribute('aria-label', `${p.name || p.label}: drag or use arrow keys to move`);
      const place = (x, y) => { [x, y] = clamp ? clamp(x, y, id) : [x, y]; p.x = x; p.y = y; p.cx = x; p.cy = y; p.g.setAttribute('transform', `translate(${x} ${y})`); onMove && onMove(id, x, y); };
      p.g.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); this.hideTip();
        p.g.setPointerCapture(e.pointerId); p.g.classList.add('is-grabbing');
        const move = ev => { const [x, y] = this.toField(ev.clientX, ev.clientY); place(x, y); };
        const up = () => { p.g.classList.remove('is-grabbing'); p.g.removeEventListener('pointermove', move); p.g.removeEventListener('pointerup', up); p.g.removeEventListener('pointercancel', up); };
        p.g.addEventListener('pointermove', move); p.g.addEventListener('pointerup', up); p.g.addEventListener('pointercancel', up);
      });
      p.g.addEventListener('keydown', e => {
        const step = e.shiftKey ? 2 : .5; let dx = 0, dy = 0;
        if (e.key === 'ArrowRight') dx = step; if (e.key === 'ArrowLeft') dx = -step; if (e.key === 'ArrowUp') dy = -step; if (e.key === 'ArrowDown') dy = step;
        if (!dx && !dy) return; e.preventDefault();
        if (this.vertical) [dx, dy] = [-dy, dx];
        place(p.x + dx, p.y + dy);
      });
    }
  }
  hideTip() { this.tipFor = null; this.tip.hidden = true; for (const q of this.players.values()) q.g.classList.remove('is-focus'); }
  layer(name, on) { this.svg.querySelectorAll(`[data-layer="${name}"]`).forEach(n => n.style.display = on ? '' : 'none'); }
}

/* Small helper for sport modules: a chip group that swaps scenes in one diagram. */
export function sceneSwitcher(host, diagram, scenes, opts = {}) {
  const bar = document.createElement('div'); bar.className = 'chips'; bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', opts.label || 'Choose a scene');
  const keys = Object.keys(scenes);
  const info = document.createElement('div'); info.className = 'scene-info';
  const pick = k => {
    bar.querySelectorAll('button').forEach(b => { const on = b.dataset.k === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    const sc = scenes[k]; diagram.load(sc);
    info.innerHTML = sc.title || sc.about ? `${sc.title ? `<h4>${sc.title}</h4>` : ''}${sc.about ? `<p>${sc.about}</p>` : ''}${sc.beats ? `<p class="beats"><b>Beats it:</b> ${sc.beats}</p>` : ''}${sc.weak ? `<p class="weak"><b>Watch for:</b> ${sc.weak}</p>` : ''}` : '';
    if (!opts.noAutoplay && !sc.static && !reduced) diagram.play();
  };
  keys.forEach((k, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.k = k; b.setAttribute('role', 'tab');
    b.textContent = scenes[k].chip || k; b.addEventListener('click', () => pick(k));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length; bar.children[j].focus(); pick(keys[j]); } });
    bar.append(b);
  });
  host.prepend(bar);
  if (opts.infoAfter) opts.infoAfter.after(info); else host.append(info);
  pick(opts.start || keys[0]);
  return { pick, bar, info };
}
