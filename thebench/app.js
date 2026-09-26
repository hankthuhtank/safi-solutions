/* ==========================================================================
   THE BENCH — application
   ========================================================================== */
(function () {
  'use strict';

  const C = window.CURRICULUM;
  const G = window.GLOSSARY || [];
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- flat lesson index ---------- */
  const FLAT = [];
  C.modules.forEach((m, mi) => m.lessons.forEach((l, li) => {
    FLAT.push(Object.assign({}, l, {
      modId: m.id, modCode: m.code, modTitle: m.title, modTag: m.tag,
      mi, li, ref: m.code + ' · ' + String(li + 1).padStart(2, '0')
    }));
  }));
  const byId = id => FLAT.find(l => l.id === id);

  /* ---------- storage ---------- */
  const KEY = 'bench.v1';
  let S = { view: 'home', mod: null, lesson: null, done: {}, drafts: {}, theme: 'dark', pad: null };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  ['done','drafts','predictions'].forEach(k=>{if(!S[k]||typeof S[k]!=='object'||Array.isArray(S[k]))S[k]={}});
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  document.documentElement.dataset.theme = S.theme || 'dark';

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('up');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('up'), 2000);
  }

  /* ==========================================================================
     SYNTAX HIGHLIGHTING
     ========================================================================== */
  const KW_SETS = {
    cpp: 'alignas alignof asm auto bool break case catch char class const constexpr continue default delete do double else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept nullptr operator private protected public register return short signed sizeof static struct switch template this throw true try typedef typename union unsigned using virtual void volatile while',
    java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient true false null try void volatile while var record sealed',
    js: 'async await break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw true false null typeof undefined var void while yield',
    sql: 'select from where group by having order asc desc limit offset insert into values update set delete create table index unique primary key foreign references not null and or in like between join inner left right outer on as distinct count sum avg min max case when then else end begin commit rollback drop alter add text integer real blob default check exists union all',
    html: '',
    shell: 'git npm node docker cd ls run build push pull commit add branch merge switch status log diff',
    none: ''
  };
  const TYPES = 'string String vector ArrayList List Map Set HashMap Integer Double Boolean Character Long size_t auto var cout cin cerr endl System console Math printf std';

  function highlight(src, lang) {
    if (lang === 'html') return highlightHtml(src);
    const kws = new Set((KW_SETS[lang] || '').split(/\s+/).filter(Boolean));
    const types = new Set(TYPES.split(/\s+/));
    const out = [];
    let i = 0;
    const n = src.length;
    const push = (cls, txt) => out.push(cls ? '<span class="' + cls + '">' + esc(txt) + '</span>' : esc(txt));

    while (i < n) {
      const c = src[i];
      // comments
      if (c === '/' && src[i + 1] === '/') { let s = i; while (i < n && src[i] !== '\n') i++; push('t-com', src.slice(s, i)); continue; }
      if (lang === 'sql' && c === '-' && src[i + 1] === '-') { let s = i; while (i < n && src[i] !== '\n') i++; push('t-com', src.slice(s, i)); continue; }
      if (c === '#' && (lang === 'cpp' || lang === 'shell')) { let s = i; while (i < n && src[i] !== '\n') i++; push('t-com', src.slice(s, i)); continue; }
      if (c === '/' && src[i + 1] === '*') { let s = i; i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; push('t-com', src.slice(s, Math.min(i, n))); continue; }
      // strings
      if (c === '"' || c === "'" || c === '`') {
        let s = i; const q = c; i++;
        while (i < n && src[i] !== q) { if (src[i] === '\\') i++; i++; }
        i++; push('t-str', src.slice(s, Math.min(i, n))); continue;
      }
      // numbers
      if (/[0-9]/.test(c)) { let s = i; while (i < n && /[0-9a-fA-FxX._]/.test(src[i])) i++; push('t-num', src.slice(s, i)); continue; }
      // words
      if (/[A-Za-z_$]/.test(c)) {
        let s = i; while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++;
        const w = src.slice(s, i);
        const lw = lang === 'sql' ? w.toLowerCase() : w;
        if (kws.has(lw)) push('t-kw', w);
        else if (types.has(w)) push('t-typ', w);
        else if (src[i] === '(') push('t-fn', w);
        else push('', w);
        continue;
      }
      if (/[{}()[\];,.<>=+\-*/%!&|:?~^]/.test(c)) { push('t-pun', c); i++; continue; }
      push('', c); i++;
    }
    return out.join('');
  }

  function highlightHtml(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
      if (src.startsWith('<!--', i)) { const e = src.indexOf('-->', i); const end = e < 0 ? n : e + 3; out += '<span class="t-com">' + esc(src.slice(i, end)) + '</span>'; i = end; continue; }
      if (src[i] === '<') {
        const e = src.indexOf('>', i);
        const end = e < 0 ? n : e + 1;
        const tag = src.slice(i, end);
        out += tag.replace(/("[^"]*"|'[^']*')|(\b[a-zA-Z-]+)(?==)|(<\/?)([a-zA-Z0-9-]+)/g, (m, str, attr, open, name) => {
          if (str) return '<span class="t-str">' + esc(str) + '</span>';
          if (attr) return '<span class="t-typ">' + esc(attr) + '</span>';
          if (open) return '<span class="t-pun">' + esc(open) + '</span><span class="t-kw">' + esc(name) + '</span>';
          return esc(m);
        }).replace(/^(?![\s\S]*<span)/, x => esc(x));
        if (out.indexOf('<span') < 0) out += esc(tag);
        i = end; continue;
      }
      const nx = src.indexOf('<', i);
      const end = nx < 0 ? n : nx;
      out += esc(src.slice(i, end));
      i = end;
    }
    return out;
  }

  /* ==========================================================================
     CODE VIEW
     ========================================================================== */
  function renderCode(src, lang, opts) {
    opts = opts || {};
    const lines = src.replace(/\t/g, '  ').split('\n');
    const notes = opts.notes || {};
    let html = '<div class="code-table">';
    lines.forEach((ln, idx) => {
      const cls = [];
      if (notes[idx] !== undefined) cls.push('note-line');
      if (opts.pickable) cls.push('pick');
      html += '<div class="code-row ' + cls.join(' ') + '" data-line="' + idx + '">' +
        '<span class="ln">' + (idx + 1) + '</span>' +
        '<span class="lc">' + (highlight(ln, lang) || '&nbsp;') + '</span>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  /* ==========================================================================
     THE BENCH WIDGET  (editor + run + scrubber + inspector)
     ========================================================================== */
  function Bench(host, cfg) {
    this.host = host;
    this.lang = cfg.lang;
    this.src = cfg.code || '';
    this.notes = cfg.notes || {};
    this.stdin = cfg.stdin || '';
    this.editable = cfg.editable !== false;
    this.preview = !!cfg.preview;
    this.sqlSeed = cfg.sqlSeed;
    this.showIo = cfg.showIo || !!cfg.stdin;
    this.title = cfg.title || 'Source';
    this.tall = cfg.tall;
    this.onRun = cfg.onRun;
    this.trace = null;
    this.step = 0;
    this.timer = null;
    this.build();
  }

  Bench.prototype.build = function () {
    const runnable = ['cpp', 'java', 'js'].indexOf(this.lang) >= 0;
    const isSql = this.lang === 'sql';
    const isHtml = this.lang === 'html';
    const canRun = runnable || isSql || isHtml;

    let h = '<div class="panel bench">';
    h += '<div class="bench-bar">' +
      '<span class="lang-tag">' + esc(langLabel(this.lang)) + '</span>' +
      '<span class="legend">' + esc(this.title) + '</span>';
    if (canRun) {
      h += '<button class="btn sm" data-act="reset" title="Restore the original code">Reset</button>';
      h += '<button class="btn primary sm" data-act="run">Run ▸</button>';
    }
    h += '</div>';

    h += '<div class="code-wrap"><div class="code-scroll' + (this.tall ? ' tall' : '') + '"><div class="editor-host" data-host>' +
      renderCode(this.src, this.lang, { notes: this.notes, pickable: true }) +
      (this.editable ? '<textarea spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>' : '') +
      '</div></div></div>';

    if (Object.keys(this.notes).length) {
      h += '<div class="line-note" data-note><span class="legend">Line notes</span><p>Click any line marked with a dot to see what it does.</p></div>';
    }

    if (this.showIo) {
      h += '<div class="io-row"><span class="legend">Input</span><input data-stdin value="' + esc(this.stdin) + '" placeholder="values the program reads, separated by spaces"></div>';
    }

    if (runnable) {
      h += '<div class="scope" data-scope hidden>' +
        '<div class="scope-top">' +
          '<span class="legend">Execution trace</span>' +
          '<div class="transport">' +
            '<button data-act="first" title="Start">⏮</button>' +
            '<button data-act="prev" title="Back one step">◀</button>' +
            '<button data-act="play" class="play" title="Play">▶</button>' +
            '<button data-act="next" title="Forward one step">▶|</button>' +
            '<button data-act="last" title="End">⏭</button>' +
          '</div>' +
          '<span class="step-readout" data-readout>0 / 0</span>' +
        '</div>' +
        '<div class="track"><div class="track-canvas" data-canvas></div>' +
        '<input type="range" min="0" max="0" value="0" data-range aria-label="Execution step"></div>' +
      '</div>';

      h += '<div class="inspect" data-inspect hidden>' +
        '<div><h4>Variables</h4><div class="inspect-body" data-vars></div></div>' +
        '<div><h4>Call stack</h4><div class="inspect-body" data-stack></div></div>' +
      '</div>';
    }

    if (isHtml && this.preview) {
      h += '<iframe class="preview-frame" data-preview sandbox="allow-scripts allow-forms allow-modals" title="Live preview"></iframe>';
    } else {
      h += '<pre class="console" data-out></pre>';
    }

    h += '</div>';
    this.host.innerHTML = h;

    this.el = {
      host: $('[data-host]', this.host),
      ta: $('textarea', this.host),
      note: $('[data-note]', this.host),
      out: $('[data-out]', this.host),
      preview: $('[data-preview]', this.host),
      scope: $('[data-scope]', this.host),
      inspect: $('[data-inspect]', this.host),
      range: $('[data-range]', this.host),
      canvas: $('[data-canvas]', this.host),
      readout: $('[data-readout]', this.host),
      vars: $('[data-vars]', this.host),
      stack: $('[data-stack]', this.host),
      stdin: $('[data-stdin]', this.host)
    };

    const self = this;

    if (this.el.ta) {
      this.el.ta.value = this.src;
      this.syncGutter();
      this.el.ta.addEventListener('input', () => { self.src = self.el.ta.value; self.repaint(); if (self.cfgKey) { S.drafts[self.cfgKey] = self.src; save(); } });
      this.el.ta.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const s = self.el.ta.selectionStart, en = self.el.ta.selectionEnd;
          self.el.ta.value = self.el.ta.value.slice(0, s) + '  ' + self.el.ta.value.slice(en);
          self.el.ta.selectionStart = self.el.ta.selectionEnd = s + 2;
          self.src = self.el.ta.value; self.repaint();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); self.run(); }
      });
    }

    this.host.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (b) {
        const a = b.dataset.act;
        if (a === 'run') self.run();
        if (a === 'reset') self.reset();
        if (a === 'first') self.goto(0);
        if (a === 'prev') self.goto(self.step - 1);
        if (a === 'next') self.goto(self.step + 1);
        if (a === 'last') self.goto(self.trace ? self.trace.length - 1 : 0);
        if (a === 'play') self.togglePlay(b);
        return;
      }
      const row = e.target.closest('.code-row');
      if (row && self.el.note) self.showNote(+row.dataset.line);
    });

    if (this.el.range) {
      this.el.range.addEventListener('input', () => self.goto(+self.el.range.value));
    }
    if (this.el.stdin) {
      this.el.stdin.addEventListener('input', () => { self.stdin = self.el.stdin.value; });
    }

    if (isHtml && this.preview) this.renderPreview();
  };

  Bench.prototype.syncGutter = function () {
    const ln = $('.ln', this.el.host);
    if (ln && this.el.ta) {
      const w = ln.getBoundingClientRect().width;
      if (w) this.el.ta.style.paddingLeft = (w + 12) + 'px';
    }
  };

  Bench.prototype.repaint = function () {
    const t = $('.code-table', this.el.host);
    if (t) t.outerHTML = renderCode(this.src, this.lang, { notes: this.notes, pickable: true });
    this.syncGutter();
  };

  Bench.prototype.reset = function () {
    this.src = this.original !== undefined ? this.original : this.src;
    if (this.el.ta) this.el.ta.value = this.src;
    if (this.cfgKey) { delete S.drafts[this.cfgKey]; save(); }
    this.repaint();
    this.clearTrace();
    if (this.el.out) this.el.out.textContent = '';
    if (this.el.preview) this.renderPreview();
    toast('Code restored');
  };

  Bench.prototype.clearTrace = function () {
    this.trace = null; this.step = 0;
    if (this.el.scope) this.el.scope.hidden = true;
    if (this.el.inspect) this.el.inspect.hidden = true;
    $$('.code-row', this.el.host).forEach(r => r.classList.remove('hot', 'errline'));
    this.stopPlay();
  };

  Bench.prototype.run = function () {
    const lang = this.lang;
    this.stopPlay();
    if (lang === 'html') { this.renderPreview(); toast('Preview updated'); if (this.onRun) this.onRun(this.src, null); return; }
    if (lang === 'sql') { this.runSql(); return; }
    this.runCode();
  };

  Bench.prototype.renderPreview = function () {
    if (!this.el.preview) return;
    this.el.preview.srcdoc = this.src;
  };

  Bench.prototype.runSql = function () {
    const db = new window.BenchSQL.Database();
    if (this.sqlSeed) window.BenchSQL.run(this.sqlSeed, db);
    const res = window.BenchSQL.run(this.src, db);
    const out = this.el.out;
    $$('.code-row', this.el.host).forEach(r => r.classList.remove('errline'));
    if (!res.ok) {
      out.innerHTML = '<span class="err">✕ ' + esc(res.error) + '</span>';
      if (this.onRun) this.onRun(this.src, res);
      return;
    }
    let h = '';
    for (const r of res.results) {
      if (!r) continue;
      if (r.kind === 'message') { h += '<div class="rs-block rs-msg">✓ ' + esc(r.text) + '</div>'; continue; }
      if (r.kind === 'rows') {
        h += '<div class="rs-block"><div class="rs-wrap"><table class="rs"><thead><tr>' +
          r.columns.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>';
        for (const row of r.rows) {
          h += '<tr>' + r.columns.map(c => {
            const v = row[c];
            if (v === null || v === undefined) return '<td class="null">NULL</td>';
            return '<td>' + esc(fmtCell(v)) + '</td>';
          }).join('') + '</tr>';
        }
        h += '</tbody></table></div><div class="schema-note">' + r.rows.length + ' row' + (r.rows.length === 1 ? '' : 's') + '</div></div>';
      }
    }
    out.innerHTML = h || '<span class="ok">✓ Ran with no output.</span>';
    if (this.onRun) this.onRun(this.src, res);
  };

  function fmtCell(v) {
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return String(v);
      return String(Math.round(v * 10000) / 10000);
    }
    return v;
  }

  Bench.prototype.runCode = function () {
    const res = window.Bench.run(this.src, this.lang, { stdin: this.stdin });
    this.lastResult = res;
    const out = this.el.out;
    $$('.code-row', this.el.host).forEach(r => r.classList.remove('errline'));

    let text = esc(res.output || '');
    if (!res.ok) {
      text += (res.output ? '\n' : '') + '<span class="err">✕ ' + esc(res.error) + (res.line ? '  (line ' + res.line + ')' : '') + '</span>';
      const row = $('.code-row[data-line="' + (res.line - 1) + '"]', this.el.host);
      if (row) row.classList.add('errline');
    } else if (!res.output) {
      text = '<span class="ok">✓ Ran with no output. Add a print statement to see something.</span>';
    }
    out.innerHTML = text;

    this.trace = res.trace && res.trace.length ? res.trace : null;
    if (this.trace) {
      this.el.scope.hidden = false;
      this.el.inspect.hidden = false;
      this.el.range.max = String(this.trace.length - 1);
      this.paintTrack();
      this.goto(this.bestStep());
    } else {
      this.clearTrace();
    }
    if (this.onRun) this.onRun(this.src, res);
  };

  // The very last snapshot is taken after main has returned, so every local is
  // gone. Land on the last step that still had state to show instead.
  Bench.prototype.bestStep = function () {
    for (let i = this.trace.length - 1; i >= 0; i--) {
      const st = this.trace[i];
      const hasLocals = st.frames.some((f, fi) => fi > 0 || f.vars.length);
      if (hasLocals || st.globals.length) return i;
    }
    return this.trace.length - 1;
  };

  Bench.prototype.paintTrack = function () {
    const n = this.trace.length;
    const max = Math.min(n, 240);
    let h = '';
    for (let k = 0; k < max; k++) {
      const idx = Math.floor(k * n / max);
      const depth = this.trace[idx].frames.length;
      const cls = depth >= 3 ? 'frame3' : (depth === 2 ? 'frame2' : '');
      const hgt = Math.min(100, 34 + depth * 22);
      h += '<i class="' + cls + '" data-i="' + idx + '" style="height:' + hgt + '%"></i>';
    }
    this.el.canvas.innerHTML = h;
  };

  Bench.prototype.goto = function (i) {
    if (!this.trace) return;
    i = Math.max(0, Math.min(this.trace.length - 1, i));
    const prev = this.trace[this.step];
    this.step = i;
    const st = this.trace[i];
    this.el.range.value = String(i);
    this.el.readout.textContent = (i + 1) + ' / ' + this.trace.length;

    $$('.code-row', this.el.host).forEach(r => r.classList.remove('hot'));
    const row = $('.code-row[data-line="' + (st.line - 1) + '"]', this.el.host);
    if (row) {
      row.classList.add('hot');
      const sc = $('.code-scroll', this.host);
      if (sc) {
        const rt = row.offsetTop, rh = row.offsetHeight;
        if (rt < sc.scrollTop || rt + rh > sc.scrollTop + sc.clientHeight) {
          sc.scrollTop = rt - sc.clientHeight / 2 + rh;
        }
      }
    }

    const frac = i / Math.max(1, this.trace.length - 1);
    $$('i', this.el.canvas).forEach(b => {
      b.classList.toggle('past', (+b.dataset.i) <= i);
    });

    // variables
    const prevMap = {};
    if (prev) {
      prev.frames.forEach((f, fi) => f.vars.forEach(v => { prevMap[fi + ':' + v.name] = v.display; }));
      prev.globals.forEach(v => { prevMap['g:' + v.name] = v.display; });
    }
    let vh = '';
    const showFrames = st.frames.slice().reverse();
    showFrames.forEach((f) => {
      const fi = st.frames.indexOf(f);
      if (!f.vars.length && fi === 0) return;
      vh += '<div class="frame' + (fi === 0 ? ' f0' : '') + '">' +
        '<div class="frame-name">' + esc(f.name) + '</div>';
      if (!f.vars.length) vh += '<div class="legend" style="padding-left:11px">no locals yet</div>';
      else {
        vh += '<table class="vars">';
        f.vars.forEach(v => {
          const changed = prevMap[fi + ':' + v.name] !== undefined && prevMap[fi + ':' + v.name] !== v.display;
          vh += '<tr class="' + (changed ? 'changed' : '') + '">' +
            '<td class="vn">' + esc(v.name) + '</td>' +
            '<td class="vt">' + esc(v.type) + '</td>' +
            '<td class="vv">' + esc(v.display) + '</td></tr>';
        });
        vh += '</table>';
      }
      vh += '</div>';
    });
    if (st.globals.length) {
      vh += '<div class="frame f0"><div class="frame-name">file scope</div><table class="vars">' +
        st.globals.map(v => {
          const changed = prevMap['g:' + v.name] !== undefined && prevMap['g:' + v.name] !== v.display;
          return '<tr class="' + (changed ? 'changed' : '') + '"><td class="vn">' + esc(v.name) + '</td><td class="vt">' + esc(v.type) + '</td><td class="vv">' + esc(v.display) + '</td></tr>';
        }).join('') + '</table></div>';
    }
    this.el.vars.innerHTML = vh || '<div class="legend">no variables yet</div>';

    // call stack
    let sh = '';
    st.frames.slice().reverse().forEach((f, k) => {
      const depth = st.frames.length - 1 - k;
      sh += '<div class="frame' + (depth === 0 ? ' f0' : '') + '" style="padding-left:' + (depth * 10) + 'px">' +
        '<div class="frame-name">' + esc(f.name) + '<span class="legend" style="margin-left:auto">line ' + f.line + '</span></div></div>';
    });
    this.el.stack.innerHTML = sh;

    // output up to this step
    if (this.el.out && this.lastResult && this.lastResult.ok) {
      const partial = st.out || '';
      const full = this.lastResult.output || '';
      if (partial === full) {
        this.el.out.innerHTML = full ? esc(full) : '<span class="ok">✓ Ran with no output.</span>';
      } else {
        this.el.out.innerHTML = esc(partial) + '<span class="cursor">▌</span>';
      }
    }
  };

  Bench.prototype.togglePlay = function (btn) {
    if (this.timer) { this.stopPlay(); return; }
    if (!this.trace) return;
    if (this.step >= this.trace.length - 1) this.goto(0);
    btn.classList.add('on'); btn.textContent = '⏸';
    const self = this;
    this.timer = setInterval(() => {
      if (self.step >= self.trace.length - 1) { self.stopPlay(); return; }
      self.goto(self.step + 1);
    }, 220);
  };
  Bench.prototype.stopPlay = function () {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const b = $('[data-act="play"]', this.host);
    if (b) { b.classList.remove('on'); b.textContent = '▶'; }
  };

  Bench.prototype.showNote = function (idx) {
    if (!this.el.note) return;
    const n = this.notes[idx];
    if (n === undefined) {
      this.el.note.innerHTML = '<span class="legend">Line ' + (idx + 1) + '</span><p style="color:var(--silk-3)">No note on this line.</p>';
    } else {
      this.el.note.innerHTML = '<span class="legend">Line ' + (idx + 1) + '</span><p>' + esc(n) + '</p>';
    }
  };

  function langLabel(l) {
    return { cpp: 'C++', java: 'Java', js: 'JavaScript', html: 'HTML', css: 'CSS', sql: 'SQL', shell: 'Shell', none: 'Reference' }[l] || l;
  }

  /* ==========================================================================
     VIEWS
     ========================================================================== */
  const stage = $('#stage');
  let activeBench = null;

  function setView(v, opts) {
    S.view = v; save();
    $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    closeRail();
    if (activeBench) activeBench.stopPlay();
    if (v !== 'lesson') currentLesson = null;
    if (v === 'home') renderHome();
    else if (v === 'lesson') renderLesson(opts);
    else if (v === 'pad') renderPad();
    else if (v === 'glossary') renderGlossary();
    window.scrollTo(0, 0);
  }


  /* ---------- hero: a five-line program, stepped like the bench does it ---------- */
  const TRACE_CODE = ['let total = 0;', 'for (let i = 1; i <= 3; i++) {', '  total = total + i;', '}', 'console.log(total);'];
  const TRACE_STEPS = [
    [1, { total: 0 }, '', 'total starts at 0'], [2, { total: 0, i: 1 }, '', 'i = 1 · is 1 ≤ 3? yes'], [3, { total: 1, i: 1 }, '', 'total = 0 + 1'],
    [2, { total: 1, i: 2 }, '', 'i = 2 · is 2 ≤ 3? yes'], [3, { total: 3, i: 2 }, '', 'total = 1 + 2'], [2, { total: 3, i: 3 }, '', 'i = 3 · is 3 ≤ 3? yes'],
    [3, { total: 6, i: 3 }, '', 'total = 3 + 3'], [2, { total: 6, i: 4 }, '', 'i = 4 · is 4 ≤ 3? no — leave the loop'], [5, { total: 6 }, '6', 'print total']
  ];
  let traceTimer = null;
  function traceDemoHTML() {
    return '<figure class="trace-demo" id="traceDemo" aria-label="A short JavaScript loop being stepped through one line at a time">' +
      '<div class="td-head"><span class="ref">JS · TRACE</span><b id="tdStep">step 1 / ' + TRACE_STEPS.length + '</b></div>' +
      '<ol class="td-code">' + TRACE_CODE.map((l, n) => '<li data-l="' + (n + 1) + '"><code>' + esc(l) + '</code></li>').join('') + '</ol>' +
      '<div class="td-why" id="tdWhy"></div>' +
      '<div class="td-panels"><div><span class="legend">Variables</span><dl class="td-vars" id="tdVars"></dl></div><div><span class="legend">Output</span><pre class="td-out" id="tdOut"></pre></div></div>' +
      '<figcaption>Every example in the course runs like this — line by line, with the state you can’t normally see.</figcaption></figure>';
  }
  function startTraceDemo() {
    clearInterval(traceTimer);
    const host = $('#traceDemo'); if (!host) return;
    let k = 0, prev = {};
    const show = () => {
      const [line, vars, out, why] = TRACE_STEPS[k];
      $$('.td-code li', host).forEach(li => li.classList.toggle('on', +li.dataset.l === line));
      $('#tdVars').innerHTML = Object.keys(vars).map(n => '<div class="' + (prev[n] !== vars[n] ? 'chg' : '') + '"><dt>' + n + '</dt><dd>' + vars[n] + '</dd></div>').join('');
      $('#tdOut').textContent = out || ' ';
      $('#tdWhy').textContent = why; $('#tdStep').textContent = 'step ' + (k + 1) + ' / ' + TRACE_STEPS.length;
      prev = vars;
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { k = TRACE_STEPS.length - 1; show(); return; }
    let paused = false; host.addEventListener('mouseenter', () => paused = true); host.addEventListener('mouseleave', () => paused = false);
    show();
    traceTimer = setInterval(() => { if (paused || !document.body.contains(host)) { if (!document.body.contains(host)) clearInterval(traceTimer); return; } k = (k + 1) % TRACE_STEPS.length; if (k === 0) prev = {}; show(); }, 1300);
  }

  /* ---------- home ---------- */
  function renderHome() {
    const doneN = FLAT.filter(l => S.done[l.id]).length;
    const next = FLAT.find(l => !S.done[l.id]) || FLAT[0];
    const runnable = FLAT.filter(l => ['cpp', 'java', 'js'].indexOf(l.lang) >= 0).length;
    const challenges = FLAT.filter(l => l.challenge).length;

    let h = '<div class="wrap">';
    h += '<section class="hero has-trace"><div class="hero-text">' +
      '<span class="legend">A field manual for building software</span>' +
      '<h1>Learn to code by <em>watching it run.</em></h1>' +
      '<p>C++, Java, JavaScript, HTML, CSS, SQL, servers and shipping — in one place, in an order that builds on itself. Run supported C++, Java and JavaScript examples in a teaching interpreter; preview HTML and try SQL in the browser. Predict a result, test it, then trace the changes that explain it.</p>' +
      '<div class="hero-actions">' +
        '<button class="btn primary big" data-go="' + esc(next.id) + '">' + (doneN ? 'Continue · ' + esc(next.title) : 'Start at the beginning') + ' →</button>' +
        '<button class="btn big" data-view="pad">Open the bench</button>' +
      '</div>' +
    '</div>' + traceDemoHTML() + '</section>';

    h += '<div class="stat-row">' +
      stat(FLAT.length, 'lessons in sequence') +
      stat(runnable, 'programs you can run') +
      stat(challenges, 'challenges to solve') +
      stat(G.length, 'terms in the glossary') +
    '</div>';

    h += '<div class="section-head"><h2>The course</h2><p>Work top to bottom, or jump to what you need.</p></div>';
    h += '<div class="map-grid">';
    C.modules.forEach(m => {
      const d = m.lessons.filter(l => S.done[l.id]).length;
      const pct = Math.round(d / m.lessons.length * 100);
      h += '<button class="map-card" data-mod="' + esc(m.id) + '">' +
        '<span class="ref">' + esc(m.code) + '</span>' +
        '<strong>' + esc(m.title) + '</strong>' +
        '<p>' + esc(m.blurb) + '</p>' +
        '<span class="legend" style="display:block;margin-top:9px">' + d + ' / ' + m.lessons.length + ' done</span>' +
        '<i class="bar" style="width:' + pct + '%"></i>' +
        '</button>';
    });
    h += '</div>';

    h += '<div class="section-head"><h2>How this works</h2><p>Three habits that make the difference.</p></div>';
    h += '<div class="map-grid">' +
      howCard('Run everything', 'Do not read the code samples. Run them, then break them on purpose and run them again. The error message is part of the lesson.') +
      howCard('Scrub the trace', 'After running, drag the execution slider. You will see every variable change, every function call pushed onto the stack, and every line of output as it appears.') +
      howCard('Do the challenge', 'Lessons with a challenge give you a small change to make and a check on the result. In other lessons, explain the example and try a variation before marking it complete.') +
    '</div>';

    h += '</div>';
    stage.innerHTML = h;
    startTraceDemo();
  }
  const stat = (n, l) => '<div class="stat"><b>' + n + '</b><span class="legend">' + esc(l) + '</span></div>';
  const howCard = (t, p) => '<div class="map-card" style="cursor:default"><strong>' + esc(t) + '</strong><p>' + esc(p) + '</p></div>';

  /* ---------- lesson ---------- */
  function renderLesson(opts) {
    const id = (opts && opts.id) || S.lesson || FLAT[0].id;
    const L = byId(id) || FLAT[0];
    S.lesson = L.id; S.mod = L.modId; save();

    const idx = FLAT.indexOf(L);
    const prev = FLAT[idx - 1], next = FLAT[idx + 1];

    let h = '<div class="wrap">';

    h += '<div class="lesson-top">' +
      '<div class="crumb">' +
        '<span class="ref">' + esc(L.ref) + '</span>' +
        '<span class="chip">' + esc(L.modTitle) + '</span>' +
        '<span class="chip">' + esc(langLabel(L.lang)) + '</span>' +
        (S.done[L.id] ? '<span class="chip" style="color:var(--gold);border-color:var(--gold-dim)">completed</span>' : '') +
      '</div>' +
      '<h1 class="title">' + esc(L.title) + '</h1>' +
      '<p class="goal">' + esc(L.goal) + '</p>' +
    '</div>';

    h += '<div class="lesson-grid">';

    /* prose */
    h += '<div class="prose">';
    h += '<p class="lead">' + esc(L.plain) + '</p>';
    if (L.why) h += '<div class="aside-block"><span class="legend">Why this matters</span><p>' + esc(L.why) + '</p></div>';
    if (L.analogy) h += '<div class="picture"><span class="legend">Mental picture</span><p>' + esc(L.analogy) + '</p></div>';
    if (L.points && L.points.length) {
      h += '<div><span class="legend" style="display:block;margin-bottom:6px">Key points</span><ul class="keylist">' +
        L.points.map(p => '<li><span>' + esc(p) + '</span></li>').join('') + '</ul></div>';
    }
    if (L.callout) {
      h += '<div class="callout ' + esc(L.callout.kind) + '"><b>' + esc(L.callout.kind.toUpperCase()) + '</b><span>' + esc(L.callout.text) + '</span></div>';
    }
    if (L.terms && L.terms.length) {
      h += '<div><span class="legend" style="display:block;margin-bottom:6px">Terms in this lesson</span><div class="termrow">' +
        L.terms.map(t => '<button data-term="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>';
    }
    h += '</div>';

    /* bench */
    h += '<div>';
    if (['cpp','java','js'].includes(L.lang) && L.code) h += '<div class="prediction-panel"><span class="legend">Before you run</span><h3>What will it print?</h3><label for="outputPrediction">Predict the output, one line at a time. Leave it empty if you expect no output.</label><textarea id="outputPrediction" rows="3" spellcheck="false"></textarea><button class="btn sm" type="button" id="comparePrediction">Run &amp; compare</button><p id="predictionResult" aria-live="polite">Your prediction is a starting point. A mismatch gives you something specific to trace.</p></div>';
    h += '<div data-benchhost></div><details class="runtime-note"><summary>What this bench can run</summary><p>C++, Java and JavaScript use a limited teaching interpreter, not their production compilers or engines. Unsupported features may fail here even when valid in the language. HTML runs in a sandboxed browser preview; SQL uses this app’s local teaching engine. Reference-only examples are marked as such.</p></details>';
    if (L.challenge) {
      h += '<div class="panel challenge">' +
        '<div class="panel-head"><span class="legend">Challenge</span></div>' +
        '<div class="challenge-body">' +
          '<p>' + esc(L.challenge.prompt) + '</p>' +
          '<div class="challenge-actions">' +
            '<button class="btn primary sm" data-act="check">Check my answer</button>' +
            '<button class="btn sm" data-act="hint">Show hint</button>' +
            '<span class="verdict" data-verdict></span>' +
          '</div>' +
          '<div data-hint></div>' +
        '</div></div>';
    }
    h += '</div>';
    h += '</div>';

    /* next strip */
    h += '<div class="next-strip">' +
      '<div>' +
        '<span class="legend">' + (next ? 'Next up' : 'End of the course') + '</span>' +
        '<strong>' + esc(next ? next.title : 'You have reached the end') + '</strong>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        (prev ? '<button class="btn" data-go="' + esc(prev.id) + '">← Back</button>' : '') +
        '<button class="btn' + (S.done[L.id] ? '' : ' primary') + '" data-act="done">' + (S.done[L.id] ? '✓ Completed' : 'Mark complete') + '</button>' +
        (next ? '<button class="btn" data-go="' + esc(next.id) + '">Next →</button>' : '') +
      '</div>' +
    '</div>';

    h += '</div>';
    stage.innerHTML = h;

    /* mount bench */
    const bhost = $('[data-benchhost]');
    const draftKey = 'l:' + L.id;
    const code = S.drafts[draftKey] !== undefined ? S.drafts[draftKey] : (L.code || L.codeBlock || '');
    const b = new Bench(bhost, {
      lang: L.codeBlock && !L.code ? 'none' : L.lang,
      code: code,
      notes: L.notes,
      stdin: L.stdin,
      preview: L.preview,
      editable: !(L.codeBlock && !L.code),
      showIo: !!L.stdin,
      sqlSeed: L.lang === 'sql' ? SQL_SEED : null,
      title: L.codeBlock && !L.code ? 'Reference' : 'Source — edit and run it'
    });
    b.original = L.code || L.codeBlock || '';
    b.cfgKey = draftKey;
    activeBench = b;

    const prediction=$('#outputPrediction');
    if(prediction){prediction.value=typeof S.predictions[L.id]==='string'?S.predictions[L.id]:'';prediction.addEventListener('input',()=>{S.predictions[L.id]=prediction.value;save()});$('#comparePrediction').addEventListener('click',()=>{b.run();const result=b.lastResult,out=$('#predictionResult');if(!result?.ok){out.textContent='The program did not finish successfully. Read the runtime error, adjust the code and try again.';return}const clean=t=>String(t||'').replace(/\r\n/g,'\n').trim();const expected=clean(prediction.value),actual=clean(result.output);out.textContent=expected===actual?'Your prediction matches. Now change one value and predict again before running.':'The result differs. Compare the program output with your prediction, then scrub the trace to find the first change you did not expect.';out.dataset.match=String(expected===actual)})}
    currentLesson = L;
  }

  /* one delegated handler for the whole stage, installed once */
  let currentLesson = null;
  stage.addEventListener('click', e => {
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) { setView('lesson', { id: goBtn.dataset.go }); buildRail(); return; }

    const tb = e.target.closest('[data-term]');
    if (tb) { openTerm(tb.dataset.term); return; }

    const act = e.target.closest('[data-act]');
    if (!act || !currentLesson) return;
    const L = currentLesson;
    if (act.dataset.act === 'done') markDone(L.id);
    else if (act.dataset.act === 'check' && L.challenge && activeBench) checkChallenge(L, activeBench);
    else if (act.dataset.act === 'hint' && L.challenge) {
      const h = $('[data-hint]');
      if (h) h.innerHTML = '<div class="hint">' + esc(L.challenge.hint) + '</div>';
    }
  });

  function markDone(id) {
    S.done[id] = !S.done[id];
    save();
    buildRail();
    renderLesson({ id });
    toast(S.done[id] ? 'Marked complete' : 'Marked incomplete');
  }

  function checkChallenge(L, bench) {
    const c = L.challenge;
    const v = $('[data-verdict]');
    const chk = c.check || {};
    let ok = false, msg = '';

    if (chk.htmlContains) {
      const src = bench.src.toLowerCase();
      ok = chk.htmlContains.every(s => src.indexOf(String(s).toLowerCase()) >= 0);
      msg = ok ? '✓ That is it — the markup is there.' : '✕ Not yet. Check the hint.';
    } else {
      const res = window.Bench.run(bench.src, L.lang, { stdin: bench.stdin || '' });
      if (!res.ok) { ok = false; msg = '✕ It does not run: ' + res.error; }
      else {
        const out = (res.output || '').trim();
        if (chk.output !== undefined) {
          ok = out === String(chk.output).trim();
          msg = ok ? '✓ Exactly right.' : '✕ Output was "' + out.split('\n').slice(-1)[0] + '"';
        } else if (chk.outputContains !== undefined) {
          ok = out.indexOf(String(chk.outputContains)) >= 0;
          msg = ok ? '✓ That is it.' : '✕ Not seeing "' + chk.outputContains + '" in the output yet.';
        }
      }
      bench.runCode();
    }

    v.className = 'verdict ' + (ok ? 'pass' : 'fail');
    v.textContent = msg;
    if (ok && !S.done[L.id]) { S.done[L.id] = true; save(); buildRail(); toast('Challenge solved — lesson marked complete'); }
  }

  /* ---------- pad (free bench) ---------- */
  const PRESETS = {
    cpp: '#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\nint main() {\n  vector<string> parts = {"bolt", "nut", "washer"};\n\n  for (int i = 0; i < parts.size(); i++) {\n    cout << i + 1 << ". " << parts[i] << endl;\n  }\n\n  int total = 0;\n  for (int i = 1; i <= 10; i++) total += i;\n  cout << "Sum 1..10 = " << total << endl;\n\n  return 0;\n}',
    java: 'public class Main {\n\n  static int fib(int n) {\n    if (n < 2) return n;\n    return fib(n - 1) + fib(n - 2);\n  }\n\n  public static void main(String[] args) {\n    for (int i = 0; i < 10; i++) {\n      System.out.print(fib(i) + " ");\n    }\n    System.out.println();\n  }\n}',
    js: 'const cart = [\n  { sku: "BLT-12", qty: 4, price: 0.35 },\n  { sku: "BRG-22", qty: 1, price: 14.5 }\n];\n\nlet total = 0;\nfor (const line of cart) {\n  const sub = line.qty * line.price;\n  console.log(line.sku + " -> " + sub);\n  total = total + sub;\n}\nconsole.log("Total: " + total);',
    html: '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n  body { font-family: system-ui, sans-serif; padding: 24px; }\n  .card { border: 2px solid #78716c; border-radius: 10px; padding: 18px; max-width: 340px; }\n  button { padding: 8px 14px; font: inherit; cursor: pointer; }\n</style>\n</head>\n<body>\n  <div class="card">\n    <h2>Click counter</h2>\n    <p id="out">0 clicks</p>\n    <button id="go">Click me</button>\n  </div>\n\n  <script>\n    let n = 0;\n    document.querySelector("#go").addEventListener("click", () => {\n      n = n + 1;\n      document.querySelector("#out").textContent = n + " clicks";\n    });\n  <\/script>\n</body>\n</html>',
    sql: "SELECT c.name,\n       COUNT(o.id)              AS orders,\n       SUM(o.qty * o.unit_price) AS spend\nFROM customers AS c\nLEFT JOIN orders AS o ON o.customer_id = c.id\nGROUP BY c.name\nORDER BY spend DESC;"
  };

  const SQL_SEED = "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);\n" +
    "CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, sku TEXT NOT NULL, qty INTEGER NOT NULL, unit_price REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);\n" +
    "CREATE TABLE inventory (sku TEXT PRIMARY KEY, on_hand INTEGER NOT NULL, reorder_at INTEGER NOT NULL);\n" +
    "INSERT INTO customers (name,email,created_at) VALUES ('Hank Thomas','hank@safi.example','2026-01-04'),('Ana Ruiz','ana@safi.example','2026-02-11'),('Ben Okoye','ben@safi.example','2026-03-02'),('Dee Cole','dee@safi.example','2026-05-20');\n" +
    "INSERT INTO orders (customer_id,sku,qty,unit_price,status,created_at) VALUES (1,'BLT-12',40,0.35,'pending','2026-06-02'),(1,'NUT-08',100,0.12,'shipped','2026-06-09'),(2,'BRG-22',2,14.50,'pending','2026-06-14'),(2,'BLT-12',12,0.35,'shipped','2025-11-30'),(3,'WSH-04',500,0.04,'pending','2026-07-01'),(3,'BRG-22',1,14.50,'cancelled','2025-12-12'),(1,'WSH-04',250,0.04,'shipped','2026-07-20');\n" +
    "INSERT INTO inventory (sku,on_hand,reorder_at) VALUES ('BLT-12',820,200),('NUT-08',44,100),('WSH-04',6100,1000),('BRG-22',3,10);";

  function renderPad() {
    const lang = S.pad || 'cpp';
    let h = '<div class="wrap">';
    h += '<div class="lesson-top"><div class="crumb"><span class="ref">BENCH</span><span class="chip">free practice</span></div>' +
      '<h1 class="title">The bench</h1>' +
      '<p class="goal">Write whatever you like, run it, and scrub through the execution. Nothing here is graded.</p></div>';

    h += '<div class="preset-row">';
    ['cpp', 'java', 'js', 'html', 'sql'].forEach(l => {
      h += '<button class="btn' + (l === lang ? ' primary' : '') + '" data-lang="' + l + '">' + esc(langLabel(l)) + '</button>';
    });
    h += '</div>';

    if (lang === 'sql') {
      h += '<div class="callout note" style="margin-bottom:14px"><b>TABLES</b><span>A sample database is loaded: <code>customers</code> (id, name, email, created_at), <code>orders</code> (id, customer_id, sku, qty, unit_price, status), and <code>inventory</code> (sku, on_hand, reorder_at). Each run starts from the same seed data.</span></div>';
    }

    h += '<div data-benchhost></div>';
    h += '<div class="callout tip" style="margin-top:14px"><b>KEYS</b><span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> runs. After running, <kbd>←</kbd> and <kbd>→</kbd> step through the trace when the slider is focused.</span></div>';
    h += '</div>';
    stage.innerHTML = h;

    const key = 'pad:' + lang;
    const b = new Bench($('[data-benchhost]'), {
      lang: lang,
      code: S.drafts[key] !== undefined ? S.drafts[key] : PRESETS[lang],
      preview: lang === 'html',
      showIo: ['cpp', 'java', 'js'].indexOf(lang) >= 0,
      sqlSeed: lang === 'sql' ? SQL_SEED : null,
      tall: true,
      title: 'Scratch file'
    });
    b.original = PRESETS[lang];
    b.cfgKey = key;
    activeBench = b;

    $$('[data-lang]').forEach(btn => btn.addEventListener('click', () => {
      S.pad = btn.dataset.lang; save(); renderPad();
    }));
  }

  /* ---------- glossary ---------- */
  let gQuery = '', gCat = 'All';
  function renderGlossary() {
    const cats = ['All', ...[...new Set(G.map(t => t.c))].sort()];
    let h = '<div class="wrap">';
    h += '<div class="lesson-top"><div class="crumb"><span class="ref">GLOSSARY</span><span class="chip">' + G.length + ' terms</span></div>' +
      '<h1 class="title">Every word, in plain English</h1>' +
      '<p class="goal">Look something up the moment it confuses you. Nothing here assumes you already know the answer.</p></div>';
    h += '<div class="search-bar"><input id="gq" placeholder="Search terms and definitions…" value="' + esc(gQuery) + '" autocomplete="off"></div>';
    h += '<div class="filters">' + cats.map(c => '<button data-cat="' + esc(c) + '" class="' + (c === gCat ? 'on' : '') + '">' + esc(c) + '</button>').join('') + '</div>';
    h += '<div id="gres"></div></div>';
    stage.innerHTML = h;

    const draw = () => {
      const q = gQuery.trim().toLowerCase();
      let list = G.filter(t => (gCat === 'All' || t.c === gCat) &&
        (!q || t.n.toLowerCase().indexOf(q) >= 0 || (t.p || '').toLowerCase().indexOf(q) >= 0));
      const res = $('#gres');
      if (!list.length) { res.innerHTML = '<div class="empty">No terms match that. Try a shorter word.</div>'; return; }
      const capped = list.slice(0, 300);
      res.innerHTML = '<div class="term-grid">' + capped.map(t =>
        '<div class="term-card"><span class="legend">' + esc(t.c) + '</span><strong>' + esc(t.n) + '</strong>' +
        '<p>' + esc(t.p) + '</p>' + (t.u ? '<p class="use">' + esc(t.u) + '</p>' : '') + '</div>'
      ).join('') + '</div>' +
      (list.length > capped.length ? '<div class="empty">Showing 300 of ' + list.length + '. Narrow the search to see more.</div>' : '');
    };
    draw();

    $('#gq').addEventListener('input', e => { gQuery = e.target.value; draw(); });
    $$('[data-cat]').forEach(b => b.addEventListener('click', () => {
      gCat = b.dataset.cat;
      $$('[data-cat]').forEach(x => x.classList.toggle('on', x === b));
      draw();
    }));
  }

  function openTerm(name) {
    const t = G.find(x => x.n.toLowerCase() === String(name).toLowerCase());
    const m = $('#modal');
    if (!t) {
      gQuery = name; gCat = 'All'; setView('glossary'); buildRail(); return;
    }
    $('#modalBody').innerHTML =
      '<span class="legend">' + esc(t.c) + '</span>' +
      '<h3>' + esc(t.n) + '</h3>' +
      '<p>' + esc(t.p) + '</p>' +
      (t.u ? '<p style="color:var(--silk-3);font-size:.88rem"><span class="legend">Where you meet it</span><br>' + esc(t.u) + '</p>' : '') +
      '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn sm" data-close>Close</button>' +
      '<button class="btn sm" data-openglossary>Open full glossary</button></div>';
    m.classList.add('on');
  }

  /* ==========================================================================
     RAIL
     ========================================================================== */
  function buildRail() {
    const rail = $('#rail');
    const doneN = FLAT.filter(l => S.done[l.id]).length;
    let h = '<div class="rail-head">' +
      '<span class="legend">Progress</span>' +
      '<div class="meter"><i style="width:' + Math.round(doneN / FLAT.length * 100) + '%"></i></div>' +
      '<small>' + doneN + ' of ' + FLAT.length + ' lessons complete</small>' +
    '</div>';

    C.modules.forEach(m => {
      const open = S.mod === m.id;
      const d = m.lessons.filter(l => S.done[l.id]).length;
      h += '<div class="drawer' + (open ? ' open' : '') + '" data-drawer="' + esc(m.id) + '">' +
        '<button class="drawer-btn" aria-expanded="' + open + '" aria-controls="module-' + esc(m.id) + '">' +
          '<span class="ref">' + esc(m.code) + '</span>' +
          '<span><strong>' + esc(m.title) + '</strong><em>' + esc(m.tag) + '</em></span>' +
          '<span class="tally">' + d + '/' + m.lessons.length + '</span>' +
        '</button>' +
        '<div class="drawer-list" id="module-' + esc(m.id) + '">' +
          m.lessons.map(l => '<button data-lesson="' + esc(l.id) + '" class="' + (S.lesson === l.id ? 'on ' : '') + (S.done[l.id] ? 'done' : '') + '">' +
            '<span class="dot"></span><span>' + esc(l.title) + '</span></button>').join('') +
        '</div>' +
      '</div>';
    });
    rail.innerHTML = h;

    $$('.drawer-btn', rail).forEach(b => b.addEventListener('click', () => {
      const id = b.parentElement.dataset.drawer;
      S.mod = S.mod === id ? null : id;
      save(); buildRail();
      [...$('#rail').querySelectorAll('[data-drawer]')].find(el => el.dataset.drawer === id)?.querySelector('button').focus();
    }));
    $$('[data-lesson]', rail).forEach(b => b.addEventListener('click', () => {
      setView('lesson', { id: b.dataset.lesson });
      buildRail();
    }));
  }

  const smallScreen = matchMedia('(max-width: 900px)');
  function syncRail() {
    const open = $('#rail').classList.contains('out');
    $('#rail').inert = smallScreen.matches && !open;
    $('#railToggle').setAttribute('aria-expanded',String(open));
    $('#railToggle').setAttribute('aria-controls','rail');
  }
  function openRail() { $('#rail').classList.add('out'); $('#scrim').classList.add('on'); syncRail(); $('#rail').querySelector('button')?.focus(); }
  function closeRail() {
    const restore = smallScreen.matches && $('#rail').contains(document.activeElement);
    $('#rail').classList.remove('out'); $('#scrim').classList.remove('on'); syncRail();
    if(restore) $('#railToggle').focus();
  }
  smallScreen.addEventListener('change',closeRail); syncRail();

  /* ==========================================================================
     WIRING
     ========================================================================== */
  $$('.tabs button').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.view;
    if (v === 'lesson') setView('lesson', { id: S.lesson || FLAT[0].id });
    else setView(v);
    buildRail();
  }));
  $('#mark').addEventListener('click', e => { e.preventDefault(); setView('home'); buildRail(); });
  $('#railToggle').addEventListener('click', () => {
    $('#rail').classList.contains('out') ? closeRail() : openRail();
  });
  $('#scrim').addEventListener('click', closeRail);

  $('#themeBtn').addEventListener('click', () => {
    S.theme = S.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = S.theme;
    save();
    $('#themeBtn').textContent = S.theme === 'dark' ? '◐' : '◑';
  });
  $('#themeBtn').textContent = S.theme === 'dark' ? '◐' : '◑';

  document.addEventListener('click', e => {
    if (e.target.closest('[data-view]') && !e.target.closest('.tabs')) {
      const v = e.target.closest('[data-view]').dataset.view;
      setView(v); buildRail(); return;
    }
    if (e.target.closest('[data-mod]')) {
      const id = e.target.closest('[data-mod]').dataset.mod;
      const m = C.modules.find(x => x.id === id);
      S.mod = id;
      setView('lesson', { id: m.lessons[0].id });
      buildRail();
      return;
    }
    if (e.target.closest('[data-close]') || e.target.id === 'modal') $('#modal').classList.remove('on');
    if (e.target.closest('[data-openglossary]')) { $('#modal').classList.remove('on'); setView('glossary'); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { $('#modal').classList.remove('on'); closeRail(); }
    if (e.target.matches('input, textarea')) return;
    if (e.key === '[' && S.view === 'lesson') {
      const i = FLAT.findIndex(l => l.id === S.lesson);
      if (i > 0) { setView('lesson', { id: FLAT[i - 1].id }); buildRail(); }
    }
    if (e.key === ']' && S.view === 'lesson') {
      const i = FLAT.findIndex(l => l.id === S.lesson);
      if (i < FLAT.length - 1) { setView('lesson', { id: FLAT[i + 1].id }); buildRail(); }
    }
  });

  /* ---------- boot ---------- */
  const bootLines = [
    'bench init            <b>ok</b>',
    'loading curriculum    <b>' + FLAT.length + ' lessons</b>',
    'loading glossary      <b>' + G.length + ' terms</b>',
    'runtime  c++ / java / javascript / sql   <b>ready</b>'
  ];
  const bootEl = $('#boot pre');
  setTimeout(() => { const b = $('#boot'); if (b) b.remove(); }, 3500);
  let bi = 0;
  const bootTick = setInterval(() => {
    if (bi >= bootLines.length) {
      clearInterval(bootTick);
      setTimeout(() => { $('#boot').classList.add('gone'); setTimeout(() => $('#boot').remove(), 450); }, 180);
      return;
    }
    bootEl.innerHTML += bootLines[bi++] + '\n';
  }, 110);

  buildRail();
  if (S.view === 'lesson' && S.lesson) setView('lesson', { id: S.lesson });
  else if (S.view === 'pad') setView('pad');
  else if (S.view === 'glossary') setView('glossary');
  else setView('home');
})();
