/* ============================================================
   BENCH RUNTIME — evaluator + trace recorder
   ============================================================ */
(function (root) {
  'use strict';
  const { lex, Parser, CodeError } = root.BenchParse;

  const MAX_STEPS = 6000;
  const MAX_OUT = 20000;

  /* ---------- values ---------- */
  const V = {
    int: v => ({ t: 'int', v: Math.trunc(v) }),
    dbl: v => ({ t: 'double', v }),
    bool: v => ({ t: 'bool', v: !!v }),
    str: v => ({ t: 'string', v: String(v) }),
    chr: v => ({ t: 'char', v: String(v).slice(0, 1) }),
    nul: () => ({ t: 'null', v: null }),
    voidv: () => ({ t: 'void', v: undefined }),
    arr: (items, elem) => ({ t: 'array', v: items, elem: elem || 'auto' }),
    obj: (cls, fields) => ({ t: 'object', cls, fields })
  };
  const isNum = x => x.t === 'int' || x.t === 'double' || x.t === 'char';
  const numOf = x => {
    if (x.t === 'char') return x.v.charCodeAt(0) || 0;
    if (x.t === 'bool') return x.v ? 1 : 0;
    if (x.t === 'null') return 0;
    if (x.t === 'string') { const n = parseFloat(x.v); return isNaN(n) ? 0 : n; }
    return x.v;
  };
  const truthy = x => {
    if (!x) return false;
    switch (x.t) {
      case 'bool': return x.v;
      case 'int': case 'double': return x.v !== 0;
      case 'char': return x.v !== '\0' && x.v !== '';
      case 'string': return x.v.length > 0;
      case 'null': case 'void': return false;
      default: return true;
    }
  };

  /* ---------- printing ---------- */
  function fmtNum(n, lang, forceDouble) {
    if (!isFinite(n)) return n > 0 ? 'inf' : (n < 0 ? '-inf' : 'nan');
    if (Number.isInteger(n)) {
      if (forceDouble) return lang === 'java' ? n.toFixed(1) : String(n);
      return String(n);
    }
    const r = Math.round(n * 1e10) / 1e10;
    if (lang === 'cpp') {
      // cout default precision is 6 significant digits
      let s = r.toPrecision(6);
      if (s.indexOf('e') < 0) { s = s.replace(/0+$/, ''); s = s.replace(/\.$/, ''); }
      return s;
    }
    return String(r);
  }
  function toDisplay(x, lang) {
    if (!x) return 'undefined';
    switch (x.t) {
      case 'int': return fmtNum(x.v, lang, false);
      case 'double': return fmtNum(x.v, lang, true);
      case 'bool': return lang === 'cpp' ? (x.v ? '1' : '0') : (x.v ? 'true' : 'false');
      case 'char': return x.v;
      case 'string': return x.v;
      case 'null': return lang === 'cpp' ? '0' : 'null';
      case 'void': return '';
      case 'array': return '[' + x.v.map(e => toDisplay(e, lang)).join(', ') + ']';
      case 'object': {
        if (x.cls && x.cls.methods && x.cls.methods.find(m => m.name === 'toString')) return '<' + x.cls.name + '>';
        return x.cls ? x.cls.name + '@' + (x.id || '1') : 'object';
      }
      case 'stream': return '';
      case 'func': return 'function ' + (x.name || '');
      default: return String(x.v);
    }
  }

  let objId = 0;

  /* ---------- environment ---------- */
  function Env(parent, label) {
    this.vars = new Map();
    this.parent = parent || null;
    this.label = label || null;
  }
  Env.prototype.get = function (name) {
    let e = this;
    while (e) { if (e.vars.has(name)) return e.vars.get(name); e = e.parent; }
    return undefined;
  };
  Env.prototype.has = function (name) {
    let e = this;
    while (e) { if (e.vars.has(name)) return true; e = e.parent; }
    return false;
  };
  Env.prototype.setExisting = function (name, val) {
    let e = this;
    while (e) { if (e.vars.has(name)) { const slot = e.vars.get(name); slot.val = val; return true; } e = e.parent; }
    return false;
  };
  Env.prototype.declare = function (name, val, type) {
    this.vars.set(name, { val, type: type || 'auto', name });
  };

  /* ---------- control signals ---------- */
  const BREAK = { sig: 'break' };
  const CONTINUE = { sig: 'continue' };
  function ReturnSig(value) { this.value = value; this.sig = 'return'; }
  function ThrowSig(value, label) { this.value = value; this.sig = 'throw'; this.label = label || 'Exception'; }

  /* ---------- the machine ---------- */
  function Machine(src, lang, opts) {
    opts = opts || {};
    this.lang = lang;
    this.src = src;
    this.out = '';
    this.trace = [];
    this.steps = 0;
    this.classes = new Map();
    this.funcs = new Map();
    this.globals = new Env(null, 'global');
    this.callStack = [];
    this.stdin = (opts.stdin || '').split(/\s+/).filter(Boolean);
    this.stdinPos = 0;
    this.recordTrace = opts.trace !== false;
    this.lineCount = src.split('\n').length;
  }

  Machine.prototype.write = function (s) {
    this.out += s;
    if (this.out.length > MAX_OUT) throw CodeError('Program produced too much output (over ' + MAX_OUT + ' characters). Check for an endless loop.', 0);
  };

  Machine.prototype.snapshot = function (line, note) {
    if (!this.recordTrace) return;
    if (this.trace.length >= MAX_STEPS) return;
    const frames = [];
    for (let i = 0; i < this.callStack.length; i++) {
      const f = this.callStack[i];
      const vars = [];
      let e = f.env;
      const seen = new Set();
      const chain = [];
      while (e && e !== this.globals) { chain.push(e); e = e.parent; }
      for (const env of chain) {
        for (const [k, slot] of env.vars) {
          if (seen.has(k)) continue;
          seen.add(k);
          vars.push({ name: k, type: slot.type, display: inspect(slot.val, this.lang) });
        }
      }
      frames.push({ name: f.name, vars, line: f.line });
    }
    const gvars = [];
    for (const [k, slot] of this.globals.vars) {
      if (slot.val && (slot.val.t === 'func' || slot.val.t === 'native' || slot.val.t === 'stream' || slot.val.t === 'module')) continue;
      gvars.push({ name: k, type: slot.type, display: inspect(slot.val, this.lang) });
    }
    this.trace.push({ line, out: this.out, frames, globals: gvars, note: note || null });
  };

  function inspect(x, lang) {
    if (!x) return '–';
    switch (x.t) {
      case 'bool': return x.v ? 'true' : 'false';
      case 'string': return '"' + x.v + '"';
      case 'char': return "'" + (x.v === '\0' ? '\\0' : x.v) + "'";
      case 'null': return lang === 'cpp' ? 'null' : 'null';
      case 'void': return '–';
      case 'array': return '[' + x.v.map(e => inspect(e, lang)).join(', ') + ']';
      case 'object': {
        const parts = [];
        for (const k in x.fields) parts.push(k + ': ' + inspect(x.fields[k], lang));
        return (x.cls ? x.cls.name : 'obj') + ' { ' + parts.join(', ') + ' }';
      }
      case 'func': case 'method': case 'builtin': case 'native': return 'ƒ';
      default: return toDisplay(x, lang);
    }
  }

  function cloneVal(x) {
    if (!x) return x;
    if (x.t === 'array') return { t: 'array', elem: x.elem, v: x.v.map(cloneVal) };
    if (x.t === 'object') {
      const f = {};
      for (const k in x.fields) f[k] = cloneVal(x.fields[k]);
      return { t: 'object', cls: { name: x.cls ? x.cls.name : 'Object' }, fields: f, id: x.id };
    }
    return { t: x.t, v: x.v };
  }

  Machine.prototype.tick = function (line) {
    this.steps++;
    if (this.steps > MAX_STEPS) throw CodeError('Program ran for more than ' + MAX_STEPS + ' steps. That usually means a loop never ends.', line);
  };

  /* ---------- default value for a type ---------- */
  Machine.prototype.defaultFor = function (type) {
    if (!type) return V.nul();
    if (type.arrayDepth) return V.nul();
    switch (type.name) {
      case 'int': return V.int(0);
      case 'double': return V.dbl(0);
      case 'bool': return V.bool(false);
      case 'char': return V.chr('\0');
      case 'string': return this.lang === 'cpp' ? V.str('') : V.nul();
      case 'auto': return V.nul();
      default:
        if (type.container) return V.arr([], type.elem ? type.elem.name : 'auto');
        return V.nul();
    }
  };

  Machine.prototype.coerce = function (val, type) {
    if (!type || !val) return val;
    if (type.arrayDepth || type.container) return val;
    switch (type.name) {
      case 'int': return isNum(val) || val.t === 'bool' ? V.int(numOf(val)) : val;
      case 'double': return isNum(val) || val.t === 'bool' ? V.dbl(numOf(val)) : val;
      case 'bool': return val.t === 'bool' ? val : V.bool(truthy(val));
      case 'char': return val.t === 'char' ? val : (val.t === 'string' ? V.chr(val.v) : (isNum(val) ? V.chr(String.fromCharCode(numOf(val))) : val));
      case 'string': return val.t === 'string' ? val : (val.t === 'null' ? val : V.str(toDisplay(val, this.lang)));
      default: return val;
    }
  };

  Machine.prototype.typeLabel = function (type, val) {
    if (type && type.name && type.name !== 'auto') {
      let base = type.raw && this.lang !== 'js' ? type.raw : type.name;
      if (type.container) base = (type.raw || 'vector') + '<' + (type.elem && type.elem.raw ? type.elem.raw : 'auto') + '>';
      if (type.arrayDepth) base += '[]'.repeat(type.arrayDepth);
      return base;
    }
    if (!val) return 'auto';
    if (val.t === 'array') return 'array';
    if (val.t === 'object') return val.cls ? val.cls.name : 'object';
    return val.t;
  };

  /* ---------- run ---------- */
  Machine.prototype.run = function () {
    const toks = lex(this.src);
    const parser = new Parser(toks, this.lang);
    const prog = parser.parseProgram();

    installBuiltins(this);

    // hoist declarations
    const topStmts = [];
    for (const st of prog.body) {
      if (st.kind === 'FuncDecl') { this.funcs.set(st.name, st); this.globals.declare(st.name, { t: 'func', name: st.name, decl: st, env: this.globals }, 'function'); }
      else if (st.kind === 'ClassDecl') { this.classes.set(st.name, st); }
      else topStmts.push(st);
    }
    // static fields
    for (const [, cls] of this.classes) {
      cls.statics = {};
      for (const f of cls.fields) {
        if (f.static) cls.statics[f.name] = f.init ? this.evalNode(f.init, this.globals) : this.defaultFor(f.type);
      }
    }

    this.callStack.push({ name: 'global', env: this.globals, line: 1 });
    this.snapshot(topStmts.length ? topStmts[0].line : 1, 'start');

    try {
      for (const st of topStmts) this.execStmt(st, this.globals);
      const main = this.funcs.get('main');
      if (main) {
        this.callFunction(main, [], null, main.line);
      } else {
        let entry = null, entryCls = null;
        for (const [, cls] of this.classes) {
          const m = cls.methods.find(x => x.name === 'main');
          if (m) { entry = m; entryCls = cls; if (cls.name === 'Main') break; }
        }
        if (entry) this.callMethod(entryCls, null, entry, [V.arr([], 'string')], entry.line);
      }
    } catch (e) {
      if (e && e.sig === 'return') { /* main returned */ }
      else throw e;
    }
    this.snapshot(this.lineCount, 'end');
    return { output: this.out, trace: this.trace };
  };

  /* ---------- statements ---------- */
  Machine.prototype.execStmt = function (node, env) {
    if (!node) return;
    this.tick(node.line);
    const frame = this.callStack[this.callStack.length - 1];
    if (frame) frame.line = node.line;

    switch (node.kind) {
      case 'Block': {
        const inner = new Env(env, 'block');
        const prev = frame ? frame.env : null;
        if (frame) frame.env = inner;
        try { for (const s of node.body) this.execStmt(s, inner); }
        finally { if (frame) frame.env = prev; }
        return;
      }
      case 'VarDecl': {
        this.snapshot(node.line);
        for (const d of node.decls) {
          let val;
          if (d.init) {
            val = this.evalInit(d.init, d.type, env);
          } else if (d.ctorArgs) {
            const cls = this.classes.get(d.type.raw) || this.classes.get(d.type.name);
            if (cls) val = this.instantiate(cls, d.ctorArgs.map(a => this.evalNode(a, env)), node.line);
            else val = this.coerce(this.evalNode(d.ctorArgs[0], env), d.type);
          } else if (d.dims && d.dims.length && d.dims[0]) {
            const size = Math.max(0, Math.trunc(numOf(this.evalNode(d.dims[0], env))));
            const elemT = { kind: 'Type', name: d.type.name, raw: d.type.raw };
            val = V.arr(new Array(size).fill(0).map(() => this.defaultFor(elemT)), d.type.name);
          } else if (d.type.container) {
            val = V.arr([], d.type.elem ? d.type.elem.name : 'auto');
          } else {
            const cls = this.classes.get(d.type.raw) || this.classes.get(d.type.name);
            if (cls && this.lang === 'cpp') val = this.instantiate(cls, [], node.line);
            else val = this.defaultFor(d.type);
          }
          if (!(d.type.arrayDepth || d.type.container)) val = this.coerce(val, d.type);
          env.declare(d.name, val, this.typeLabel(d.type, val));
        }
        this.snapshot(node.line);
        return;
      }
      case 'ExprStmt': {
        this.snapshot(node.line);
        this.evalNode(node.expr, env);
        this.snapshot(node.line);
        return;
      }
      case 'If': {
        this.snapshot(node.line);
        const t = truthy(this.evalNode(node.test, env));
        this.snapshot(node.line, t ? 'condition true' : 'condition false');
        if (t) this.execStmt(node.cons, env);
        else if (node.alt) this.execStmt(node.alt, env);
        return;
      }
      case 'While': {
        let guard = 0;
        for (;;) {
          this.snapshot(node.line);
          if (!truthy(this.evalNode(node.test, env))) break;
          if (guard++ > MAX_STEPS) throw CodeError('This while loop never stops.', node.line);
          try { this.execStmt(node.body, env); }
          catch (e) { if (e === BREAK) break; if (e === CONTINUE) continue; throw e; }
        }
        return;
      }
      case 'DoWhile': {
        let guard = 0;
        for (;;) {
          try { this.execStmt(node.body, env); }
          catch (e) { if (e === BREAK) break; if (e !== CONTINUE) throw e; }
          this.snapshot(node.line);
          if (!truthy(this.evalNode(node.test, env))) break;
          if (guard++ > MAX_STEPS) throw CodeError('This do/while loop never stops.', node.line);
        }
        return;
      }
      case 'For': {
        const loopEnv = new Env(env, 'for');
        const prevF = frame ? frame.env : null;
        if (frame) frame.env = loopEnv;
        try {
        if (node.init) this.execStmt(node.init, loopEnv);
        let guard = 0;
        for (;;) {
          this.snapshot(node.line);
          if (node.test && !truthy(this.evalNode(node.test, loopEnv))) break;
          if (guard++ > MAX_STEPS) throw CodeError('This for loop never stops. Check the condition and the update step.', node.line);
          try { this.execStmt(node.body, loopEnv); }
          catch (e) {
            if (e === BREAK) break;
            if (e !== CONTINUE) throw e;
          }
          if (node.update) { this.evalNode(node.update, loopEnv); this.snapshot(node.line); }
        }
        } finally { if (frame) frame.env = prevF; }
        return;
      }
      case 'ForEach': {
        const seq = this.evalNode(node.iter, env);
        let items;
        if (node.mode === 'in') {
          if (seq.t === 'array') items = seq.v.map((_, i) => V.int(i));
          else if (seq.t === 'object') items = Object.keys(seq.fields).map(V.str);
          else items = [];
        } else if (seq.t === 'array') items = seq.v;
        else if (seq.t === 'string') items = seq.v.split('').map(c => this.lang === 'js' ? V.str(c) : V.chr(c));
        else if (seq.t === 'object') items = Object.keys(seq.fields).map(k => seq.fields[k]);
        else throw CodeError('You can only loop over a list, array, or string.', node.line);
        const loopEnv = new Env(env, 'foreach');
        loopEnv.declare(node.varName, this.defaultFor(node.varType), this.typeLabel(node.varType));
        const prevFe = frame ? frame.env : null;
        if (frame) frame.env = loopEnv;
        try {
          for (const it of items) {
            loopEnv.setExisting(node.varName, this.coerce(it, node.varType));
            this.snapshot(node.line);
            try { this.execStmt(node.body, loopEnv); }
            catch (e) { if (e === BREAK) break; if (e !== CONTINUE) throw e; }
          }
        } finally { if (frame) frame.env = prevFe; }
        return;
      }
      case 'Switch': {
        this.snapshot(node.line);
        const d = this.evalNode(node.disc, env);
        const inner = new Env(env, 'switch');
        let started = false;
        try {
          for (const c of node.cases) {
            if (!started) {
              if (c.test === null) started = true;
              else {
                const cv = this.evalNode(c.test, inner);
                if (looseEq(d, cv)) started = true;
              }
            }
            if (started) for (const s of c.body) this.execStmt(s, inner);
          }
        } catch (e) { if (e !== BREAK) throw e; }
        return;
      }
      case 'Return': {
        this.snapshot(node.line);
        const v = node.arg ? this.evalNode(node.arg, env) : V.voidv();
        throw new ReturnSig(v);
      }
      case 'Break': this.snapshot(node.line); throw BREAK;
      case 'Continue': this.snapshot(node.line); throw CONTINUE;
      case 'FuncDecl': this.funcs.set(node.name, node); env.declare(node.name, { t: 'func', name: node.name, decl: node, env }, 'function'); return;
      case 'ClassDecl': this.classes.set(node.name, node); return;
      case 'Throw': {
        this.snapshot(node.line, 'throw');
        let label = 'Exception', payload;
        if (node.arg && node.arg.kind === 'New') {
          label = node.arg.type.raw || node.arg.type.name;
          const args = node.arg.args.map(a => this.evalNode(a, env));
          payload = args.length ? args[0] : V.str(label);
        } else payload = this.evalNode(node.arg, env);
        throw new ThrowSig(payload, label);
      }
      case 'Try': {
        this.snapshot(node.line);
        try {
          try { this.execStmt(node.block, env); }
          catch (err) {
            if (err === BREAK || err === CONTINUE || err instanceof ReturnSig) throw err;
            let label, payload;
            if (err instanceof ThrowSig) { label = err.label; payload = err.value; }
            else if (err && err.isCodeError) { label = guessExceptionType(err.message, this.lang); payload = V.str(err.message); }
            else throw err;
            const h = node.handlers.find(x => !x.ctype || x.ctype === label ||
              x.ctype === 'Exception' || x.ctype === 'Throwable' || x.ctype === 'RuntimeException' || x.ctype === 'Error');
            if (!h) throw err;
            const cenv = new Env(env, 'catch');
            const shown = payload && payload.t === 'string' ? V.str(label + ': ' + payload.v) : payload;
            cenv.declare(h.param, shown, label);
            const frame = this.callStack[this.callStack.length - 1];
            const prevE = frame ? frame.env : null;
            if (frame) frame.env = cenv;
            this.snapshot(node.line, 'caught ' + label);
            try { this.execStmt(h.body, cenv); }
            finally { if (frame) frame.env = prevE; }
          }
        } finally {
          if (node.fin) this.execStmt(node.fin, env);
        }
        return;
      }
      default:
        this.snapshot(node.line);
        this.evalNode(node, env);
    }
  };

  Machine.prototype.evalInit = function (node, type, env) {
    if (node.kind === 'ArrayLit') {
      const elemT = type ? { kind: 'Type', name: type.container ? (type.elem ? type.elem.name : 'auto') : type.name, raw: type.raw } : null;
      const items = node.items.map(it => {
        const v = this.evalInit(it, elemT, env);
        return elemT && !it.items ? this.coerce(v, elemT) : v;
      });
      return V.arr(items, elemT ? elemT.name : 'auto');
    }
    return this.evalNode(node, env);
  };

  /* ---------- objects ---------- */
  Machine.prototype.instantiate = function (cls, args, line) {
    const fields = {};
    let chain = [];
    let c = cls;
    while (c) { chain.unshift(c); c = c.parent ? this.classes.get(c.parent) : null; }
    for (const cc of chain) {
      for (const f of cc.fields) {
        if (f.static) continue;
        if (f.dims && f.dims.length && f.dims[0]) {
          const size = Math.trunc(numOf(this.evalNode(f.dims[0], this.globals)));
          fields[f.name] = V.arr(new Array(size).fill(0).map(() => this.defaultFor({ name: f.type.name })), f.type.name);
        } else {
          fields[f.name] = f.init ? this.evalInit(f.init, f.type, this.globals) : this.defaultFor(f.type);
        }
      }
    }
    const obj = { t: 'object', cls, fields, id: ++objId };
    const ctor = chain.slice().reverse().map(cc => cc.ctor).find(Boolean);
    if (ctor) this.callMethod(cls, obj, ctor, args, line);
    return obj;
  };

  Machine.prototype.findMethod = function (cls, name) {
    let c = cls;
    while (c) {
      const m = c.methods.find(x => x.name === name);
      if (m) return m;
      c = c.parent ? this.classes.get(c.parent) : null;
    }
    return null;
  };

  Machine.prototype.callMethod = function (cls, self, method, args, line) {
    const env = new Env(this.globals, 'method');
    if (self) env.declare('this', self, cls.name);
    bindParams(this, env, method.params, args);
    this.callStack.push({ name: (cls ? cls.name + '.' : '') + method.name, env, line: method.line, self, cls });
    this.snapshot(method.line, 'call ' + method.name);
    let ret = V.voidv();
    try { this.execStmt(method.body, env); }
    catch (e) {
      if (e instanceof ReturnSig) ret = e.value;
      else { this.callStack.pop(); throw e; }
    }
    this.callStack.pop();
    const back = this.callStack[this.callStack.length - 1];
    this.snapshot(back ? back.line : line, 'return from ' + method.name);
    return method.retType ? this.coerce(ret, method.retType) : ret;
  };

  Machine.prototype.callFunction = function (decl, args, self, line, closureEnv) {
    const env = new Env(closureEnv || this.globals, 'func');
    bindParams(this, env, decl.params, args);
    this.callStack.push({ name: decl.name, env, line: decl.line });
    if (this.callStack.length > 60) { this.callStack.pop(); throw CodeError('Too many nested calls (over 60). A function is probably calling itself with no stopping condition.', line); }
    this.snapshot(decl.line, 'call ' + decl.name);
    let ret = V.voidv();
    try { this.execStmt(decl.body, env); }
    catch (e) {
      if (e instanceof ReturnSig) ret = e.value;
      else { this.callStack.pop(); throw e; }
    }
    this.callStack.pop();
    const back = this.callStack[this.callStack.length - 1];
    this.snapshot(back ? back.line : line, 'return from ' + decl.name);
    return decl.retType ? this.coerce(ret, decl.retType) : ret;
  };

  function guessExceptionType(msg, lang) {
    if (lang === 'js') {
      if (/not been declared/i.test(msg)) return 'ReferenceError';
      if (/outside this/i.test(msg)) return 'RangeError';
      return 'Error';
    }
    if (lang === 'cpp') {
      if (/divide|division|remainder/i.test(msg)) return 'std::runtime_error';
      if (/outside this/i.test(msg)) return 'std::out_of_range';
      return 'std::exception';
    }
    if (/divide|division|remainder/i.test(msg)) return 'ArithmeticException';
    if (/outside this array|outside this list/i.test(msg)) return 'ArrayIndexOutOfBoundsException';
    if (/outside this string/i.test(msg)) return 'StringIndexOutOfBoundsException';
    if (/not been declared/i.test(msg)) return 'ReferenceError';
    return 'RuntimeException';
  }

  function bindParams(m, env, params, args) {
    params.forEach((p, i) => {
      let v = i < args.length ? args[i] : (p.def ? m.evalNode(p.def, env) : m.defaultFor(p.type));
      if (p.type) v = m.coerce(v, p.type);
      env.declare(p.name, v, m.typeLabel(p.type, v));
    });
  }

  function looseEq(a, b) {
    if (!a || !b) return false;
    if (a.t === 'string' || b.t === 'string') return toDisplayRaw(a) === toDisplayRaw(b);
    if (a.t === 'null' || b.t === 'null') return a.t === b.t;
    if (a.t === 'object' || b.t === 'object') return a === b || (a.id && a.id === b.id);
    if (a.t === 'array' || b.t === 'array') return a === b;
    return numOf(a) === numOf(b);
  }
  function toDisplayRaw(x) {
    if (x.t === 'bool') return x.v ? 'true' : 'false';
    if (x.t === 'double' || x.t === 'int') return String(x.v);
    return String(x.v);
  }

  /* ---------- expressions ---------- */
  Machine.prototype.evalNode = function (node, env) {
    this.tick(node.line);
    switch (node.kind) {
      case 'Num': return node.isFloat ? V.dbl(node.value) : V.int(node.value);
      case 'Str': return V.str(node.value);
      case 'Char': return this.lang === 'js' ? V.str(node.value) : V.chr(node.value);
      case 'Bool': return V.bool(node.value);
      case 'Null': return V.nul();
      case 'This': {
        const f = this.callStack[this.callStack.length - 1];
        if (f && f.self) return f.self;
        const t = env.get('this'); if (t) return t.val;
        throw CodeError('"this" is only available inside a method', node.line);
      }
      case 'Arrow': return { t: 'func', name: null, decl: node, env };
      case 'ArrayLit': return V.arr(node.items.map(i => this.evalNode(i, env)), 'auto');
      case 'ObjectLit': {
        const fields = {};
        for (const pr of node.props) fields[pr.key] = this.evalNode(pr.value, env);
        return { t: 'object', cls: { name: 'Object', methods: [], fields: [] }, fields, id: ++objId };
      }
      case 'Seq': this.evalNode(node.a, env); return this.evalNode(node.b, env);

      case 'Ident': {
        const slot = env.get(node.name);
        if (slot) return slot.val;
        // implicit this.field inside a method
        const f = this.callStack[this.callStack.length - 1];
        if (f && f.self && Object.prototype.hasOwnProperty.call(f.self.fields, node.name)) return f.self.fields[node.name];
        const oc = f && (f.cls || (f.self && f.self.cls));
        if (oc) {
          let c = oc;
          while (c) { if (c.statics && node.name in c.statics) return c.statics[node.name]; c = c.parent ? this.classes.get(c.parent) : null; }
        }
        if (this.funcs.has(node.name)) return { t: 'func', name: node.name, decl: this.funcs.get(node.name), env: this.globals };
        if (this.classes.has(node.name)) return { t: 'classref', cls: this.classes.get(node.name) };
        if (BUILTIN_GLOBALS[node.name]) return BUILTIN_GLOBALS[node.name];
        throw CodeError('"' + node.name + '" has not been declared yet. Check the spelling, or declare it above this line.', node.line);
      }

      case 'Cast': {
        const v = this.evalNode(node.arg, env);
        return this.coerce(v, { name: node.to });
      }

      case 'Unary': {
        const v = this.evalNode(node.arg, env);
        if (node.op === '!') return V.bool(!truthy(v));
        if (node.op === '-') return v.t === 'double' ? V.dbl(-numOf(v)) : V.int(-numOf(v));
        if (node.op === '+') return v;
        if (node.op === '~') return V.int(~numOf(v));
        return v;
      }

      case 'Update': {
        const cur = this.readTarget(node.arg, env);
        const delta = node.op === '++' ? 1 : -1;
        const isD = cur.t === 'double';
        const next = isD ? V.dbl(numOf(cur) + delta) : V.int(numOf(cur) + delta);
        this.writeTarget(node.arg, next, env);
        return node.prefix ? next : cur;
      }

      case 'Assign': {
        let val;
        if (node.op === '=') val = this.evalNode(node.value, env);
        else {
          const cur = this.readTarget(node.target, env);
          const rhs = this.evalNode(node.value, env);
          val = binop(this, node.op[0], cur, rhs, node.line);
        }
        return this.writeTarget(node.target, val, env);
      }

      case 'Ternary': return truthy(this.evalNode(node.test, env)) ? this.evalNode(node.cons, env) : this.evalNode(node.alt, env);

      case 'Bin': {
        if (node.op === '&&') return V.bool(truthy(this.evalNode(node.left, env)) && truthy(this.evalNode(node.right, env)));
        if (node.op === '||') return V.bool(truthy(this.evalNode(node.left, env)) || truthy(this.evalNode(node.right, env)));
        const l = this.evalNode(node.left, env);
        // stream operators
        if (l && l.t === 'stream') {
          const r = this.evalNode(node.right, env);
          if (node.op === '<<') {
            if (r && r.t === 'endl') this.write('\n');
            else this.write(toDisplay(r, this.lang));
            return l;
          }
          if (node.op === '>>') {
            const tok = this.stdin[this.stdinPos++];
            if (tok === undefined) throw CodeError('The program asked for input but the Input box is empty.', node.line);
            this.writeTargetRaw(node.right, tok, env);
            return l;
          }
        }
        const r = this.evalNode(node.right, env);
        return binop(this, node.op, l, r, node.line);
      }

      case 'Index': {
        const o = this.evalNode(node.obj, env);
        if (o && o.t === 'object') {
          const key = toDisplay(this.evalNode(node.index, env), this.lang);
          return Object.prototype.hasOwnProperty.call(o.fields, key) ? o.fields[key] : V.nul();
        }
        if (o && o.t === 'module') {
          const key = toDisplay(this.evalNode(node.index, env), this.lang);
          return key in o.members ? o.members[key] : V.nul();
        }
        const i = Math.trunc(numOf(this.evalNode(node.index, env)));
        if (o.t === 'array') {
          if (i < 0 || i >= o.v.length) throw CodeError('Index ' + i + ' is outside this array. Valid positions are 0 to ' + (o.v.length - 1) + '.', node.line);
          return o.v[i];
        }
        if (o.t === 'string') {
          if (i < 0 || i >= o.v.length) throw CodeError('Index ' + i + ' is outside this string (length ' + o.v.length + ').', node.line);
          return this.lang === 'js' ? V.str(o.v[i]) : V.chr(o.v[i]);
        }
        throw CodeError('You can only use [ ] on an array, vector, list, or string.', node.line);
      }

      case 'Member': {
        // static-ish access first
        if (node.obj.kind === 'Ident') {
          const nm = node.obj.name;
          if (this.classes.has(nm)) {
            const cls = this.classes.get(nm);
            if (cls.statics && node.name in cls.statics) return cls.statics[node.name];
            const m = this.findMethod(cls, node.name);
            if (m) return { t: 'method', cls, self: null, decl: m };
          }
          if (BUILTIN_NAMESPACES[nm]) {
            const ns = BUILTIN_NAMESPACES[nm];
            if (node.name in ns) return ns[node.name];
          }
        }
        const o = this.evalNode(node.obj, env);
        return this.memberOf(o, node.name, node.line);
      }

      case 'Call': return this.evalCall(node, env);

      case 'New': {
        const cls = this.classes.get(node.type.raw) || this.classes.get(node.type.name);
        const args = node.args.map(a => this.evalNode(a, env));
        if (cls) return this.instantiate(cls, args, node.line);
        if (node.type.container) return V.arr([], node.type.elem ? node.type.elem.name : 'auto');
        if (node.type.name === 'string') return V.str(args.length ? toDisplay(args[0], this.lang) : '');
        if (/(Exception|Error)$/.test(node.type.raw || '')) return V.str(args.length ? toDisplay(args[0], this.lang) : (node.type.raw));
        throw CodeError('There is no class named "' + (node.type.raw || node.type.name) + '" in this file.', node.line);
      }

      case 'NewArray': {
        if (node.init) return this.evalInit(node.init, { name: node.type.name, raw: node.type.raw, container: false }, env);
        const size = node.size ? Math.max(0, Math.trunc(numOf(this.evalNode(node.size, env)))) : 0;
        return V.arr(new Array(size).fill(0).map(() => this.defaultFor({ name: node.type.name })), node.type.name);
      }

      default:
        throw CodeError('This kind of expression is not supported yet (' + node.kind + ')', node.line);
    }
  };

  /* ---------- targets ---------- */
  Machine.prototype.readTarget = function (node, env) { return this.evalNode(node, env); };

  Machine.prototype.writeTarget = function (node, val, env) {
    if (node.kind === 'Ident') {
      const slot = env.get(node.name);
      if (slot) {
        const coerced = this.coerce(val, typeFromLabel(slot.type));
        slot.val = coerced;
        return coerced;
      }
      const f = this.callStack[this.callStack.length - 1];
      if (f && f.self && Object.prototype.hasOwnProperty.call(f.self.fields, node.name)) { f.self.fields[node.name] = val; return val; }
      const oc2 = f && (f.cls || (f.self && f.self.cls));
      if (oc2) {
        let c = oc2;
        while (c) { if (c.statics && node.name in c.statics) { c.statics[node.name] = val; return val; } c = c.parent ? this.classes.get(c.parent) : null; }
      }
      // implicit global (JS sloppy)
      this.globals.declare(node.name, val, val.t);
      return val;
    }
    if (node.kind === 'Index') {
      const o = this.evalNode(node.obj, env);
      if (o && o.t === 'object') {
        const key = toDisplay(this.evalNode(node.index, env), this.lang);
        o.fields[key] = val; return val;
      }
      const i = Math.trunc(numOf(this.evalNode(node.index, env)));
      if (o.t !== 'array') throw CodeError('You can only assign into an array or list with [ ].', node.line);
      if (i < 0 || i >= o.v.length) throw CodeError('Index ' + i + ' is outside this array. Valid positions are 0 to ' + (o.v.length - 1) + '.', node.line);
      const elemT = o.elem && o.elem !== 'auto' ? { name: o.elem } : null;
      o.v[i] = elemT ? this.coerce(val, elemT) : val;
      return o.v[i];
    }
    if (node.kind === 'Member') {
      if (node.obj.kind === 'Ident' && this.classes.has(node.obj.name)) {
        const cls = this.classes.get(node.obj.name);
        if (cls.statics && node.name in cls.statics) { cls.statics[node.name] = val; return val; }
      }
      const o = this.evalNode(node.obj, env);
      if (o.t === 'object') { o.fields[node.name] = val; return val; }
      if (o.t === 'array' && node.name === 'length') { o.v.length = Math.max(0, Math.trunc(numOf(val))); return val; }
      throw CodeError('Cannot set "' + node.name + '" on this value.', node.line);
    }
    throw CodeError('That is not something you can assign to.', node.line);
  };

  Machine.prototype.writeTargetRaw = function (node, token, env) {
    let cur = null;
    try { cur = this.evalNode(node, env); } catch (e) { cur = null; }
    let v;
    if (cur && (cur.t === 'int')) v = V.int(parseInt(token, 10) || 0);
    else if (cur && cur.t === 'double') v = V.dbl(parseFloat(token) || 0);
    else if (cur && cur.t === 'char') v = V.chr(token);
    else if (cur && cur.t === 'bool') v = V.bool(token === 'true' || token === '1');
    else v = V.str(token);
    this.writeTarget(node, v, env);
  };

  function typeFromLabel(label) {
    if (!label) return null;
    const base = String(label).replace(/\[\]/g, '').replace(/<.*>/, '');
    if (['int', 'double', 'bool', 'char', 'string'].indexOf(base) >= 0 && !/\[\]|</.test(String(label))) return { name: base };
    const norm = root.BenchParse.normType(base);
    if (['int', 'double', 'bool', 'char', 'string'].indexOf(norm) >= 0 && !/\[\]|</.test(String(label))) return { name: norm };
    return null;
  }

  /* ---------- binary ops ---------- */
  function binop(m, op, l, r, line) {
    switch (op) {
      case '+': {
        if (l.t === 'string' || r.t === 'string') return V.str(toDisplay(l, m.lang) + toDisplay(r, m.lang));
        if (l.t === 'array' && r.t === 'array') return V.arr(l.v.concat(r.v), l.elem);
        if (l.t === 'char' && r.t === 'char' && m.lang === 'js') return V.str(l.v + r.v);
        return numResult(l, r, numOf(l) + numOf(r));
      }
      case '-': return numResult(l, r, numOf(l) - numOf(r));
      case '*': return numResult(l, r, numOf(l) * numOf(r));
      case '/': {
        const d = numOf(r);
        if (d === 0) {
          if (isIntish(l) && isIntish(r) && m.lang !== 'js') throw CodeError('Division by zero.', line);
          return V.dbl(numOf(l) / d);
        }
        if (isIntish(l) && isIntish(r) && m.lang !== 'js') return V.int(Math.trunc(numOf(l) / d));
        return V.dbl(numOf(l) / d);
      }
      case '%': {
        const d = numOf(r);
        if (d === 0) throw CodeError('Cannot take a remainder with 0 on the right side.', line);
        return numResult(l, r, numOf(l) % d);
      }
      case '==': return V.bool(looseEq(l, r));
      case '!=': return V.bool(!looseEq(l, r));
      case '===': return V.bool(strictEq(l, r));
      case '!==': return V.bool(!strictEq(l, r));
      case '<': return V.bool(cmp(l, r) < 0);
      case '>': return V.bool(cmp(l, r) > 0);
      case '<=': return V.bool(cmp(l, r) <= 0);
      case '>=': return V.bool(cmp(l, r) >= 0);
      case '&': return V.int(numOf(l) & numOf(r));
      case '|': return V.int(numOf(l) | numOf(r));
      case '^': return V.int(numOf(l) ^ numOf(r));
      case '<<': return V.int(numOf(l) << numOf(r));
      case '>>': return V.int(numOf(l) >> numOf(r));
      default: throw CodeError('Unsupported operator "' + op + '"', line);
    }
  }
  function strictEq(a, b) {
    if (!a || !b) return false;
    const na = a.t === 'int' || a.t === 'double', nb = b.t === 'int' || b.t === 'double';
    if (na !== nb) return false;
    if (!na && a.t !== b.t) return false;
    return looseEq(a, b);
  }
  const isIntish = x => x.t === 'int' || x.t === 'char' || x.t === 'bool';
  function numResult(l, r, n) {
    if (isIntish(l) && isIntish(r)) return V.int(n);
    return V.dbl(n);
  }
  function cmp(a, b) {
    if (a.t === 'string' && b.t === 'string') return a.v < b.v ? -1 : (a.v > b.v ? 1 : 0);
    const x = numOf(a), y = numOf(b);
    return x < y ? -1 : (x > y ? 1 : 0);
  }

  /* ---------- members & calls ---------- */
  Machine.prototype.memberOf = function (o, name, line) {
    if (!o) throw CodeError('Cannot read "' + name + '" of nothing.', line);
    if (o.t === 'object') {
      if (Object.prototype.hasOwnProperty.call(o.fields, name)) return o.fields[name];
      const m = o.cls && o.cls.methods ? this.findMethod(o.cls, name) : null;
      if (m) return { t: 'method', cls: o.cls, self: o, decl: m };
      if (o.cls && o.cls.statics && name in o.cls.statics) return o.cls.statics[name];
      if (o.cls && o.cls.name === 'Object') return V.nul();
      throw CodeError('"' + o.cls.name + '" has no member called "' + name + '".', line);
    }
    if (o.t === 'array') {
      if (name === 'length' && this.lang !== 'cpp') return V.int(o.v.length);
      if (name === 'length' || name === 'size') return { t: 'native', name, self: o };
      return { t: 'native', name, self: o };
    }
    if (o.t === 'string') {
      if (name === 'length' && this.lang === 'js') return V.int(o.v.length);
      return { t: 'native', name, self: o };
    }
    if (o.t === 'module') { if (name in o.members) return o.members[name]; throw CodeError('"' + name + '" is not available here.', line); }
    if (isNum(o) || o.t === 'bool') return { t: 'native', name, self: o };
    throw CodeError('Cannot read "' + name + '" from this value.', line);
  };

  Machine.prototype.evalCall = function (node, env) {
    const callee = node.callee;

    // super(...) -> parent constructor;  super.foo(...) -> parent method
    if (callee.kind === 'Ident' && callee.name === 'super') {
      const f = this.callStack[this.callStack.length - 1];
      const parent = f && f.cls && f.cls.parent ? this.classes.get(f.cls.parent) : null;
      if (parent && parent.ctor && f.self) return this.callMethod(parent, f.self, parent.ctor, node.args.map(a => this.evalNode(a, env)), node.line);
      return V.voidv();
    }
    if (callee.kind === 'Member' && callee.obj.kind === 'Ident' && callee.obj.name === 'super') {
      const f = this.callStack[this.callStack.length - 1];
      const parent = f && f.cls && f.cls.parent ? this.classes.get(f.cls.parent) : null;
      const pm = parent ? this.findMethod(parent, callee.name) : null;
      if (pm && f.self) return this.callMethod(parent, f.self, pm, node.args.map(a => this.evalNode(a, env)), node.line);
      throw CodeError('There is no parent method called "' + callee.name + '".', node.line);
    }

    // direct name calls, incl. builtins
    if (callee.kind === 'Ident') {
      const nm = callee.name;
      if (!env.has(nm) && !this.funcs.has(nm) && BUILTIN_FUNCS[nm]) {
        return BUILTIN_FUNCS[nm](this, node.args.map(a => this.evalNode(a, env)), node.line, node, env);
      }
      // implicit method call inside a class (instance or static)
      const f = this.callStack[this.callStack.length - 1];
      const ownerCls = f && (f.cls || (f.self && f.self.cls));
      if (ownerCls && !this.funcs.has(nm)) {
        const m = this.findMethod(ownerCls, nm);
        if (m) return this.callMethod(ownerCls, f.self || null, m, node.args.map(a => this.evalNode(a, env)), node.line);
      }
    }

    const target = this.evalNode(callee, env);
    const args = node.args.map(a => this.evalNode(a, env));

    if (target.t === 'func') {
      if (target.decl.expr) {
        const fenv = new Env(target.env || this.globals, 'arrow');
        bindParams(this, fenv, target.decl.params, args);
        this.callStack.push({ name: target.name || 'arrow', env: fenv, line: target.decl.line });
        this.snapshot(target.decl.line, 'call ' + (target.name || 'arrow'));
        let out;
        try { out = this.evalNode(target.decl.body, fenv); }
        finally { this.callStack.pop(); }
        const back0 = this.callStack[this.callStack.length - 1];
        this.snapshot(back0 ? back0.line : node.line, 'return');
        return out;
      }
      return this.callFunction(target.decl, args, null, node.line, target.env);
    }
    if (target.t === 'method') return this.callMethod(target.cls, target.self, target.decl, args, node.line);
    if (target.t === 'native') return nativeCall(this, target, args, node.line);
    if (target.t === 'builtin') return target.fn(this, args, node.line);
    if (target.t === 'classref') return this.instantiate(target.cls, args, node.line);
    throw CodeError('That value is not a function you can call.', node.line);
  };

  /* ---------- native methods on strings/arrays/numbers ---------- */
  function nativeCall(m, target, args, line) {
    const self = target.self;
    const name = target.name;
    const a0 = args[0], a1 = args[1];
    const L = m.lang;

    if (self.t === 'string') {
      const s = self.v;
      switch (name) {
        case 'length': case 'size': return V.int(s.length);
        case 'charAt': case 'at': return L === 'js' ? V.str(s[numOf(a0)] || '') : V.chr(s[numOf(a0)] || '\0');
        case 'substring': return V.str(s.substring(numOf(a0), a1 === undefined ? undefined : numOf(a1)));
        case 'substr': return V.str(a1 === undefined ? s.substr(numOf(a0)) : s.substr(numOf(a0), numOf(a1)));
        case 'slice': return V.str(a1 === undefined ? s.slice(numOf(a0)) : s.slice(numOf(a0), numOf(a1)));
        case 'indexOf': case 'find': { const i = s.indexOf(toDisplay(a0, L)); return V.int(i); }
        case 'toUpperCase': case 'toUpper': return V.str(s.toUpperCase());
        case 'toLowerCase': case 'toLower': return V.str(s.toLowerCase());
        case 'trim': return V.str(s.trim());
        case 'equals': return V.bool(s === toDisplay(a0, L));
        case 'equalsIgnoreCase': return V.bool(s.toLowerCase() === toDisplay(a0, L).toLowerCase());
        case 'contains': case 'includes': return V.bool(s.indexOf(toDisplay(a0, L)) >= 0);
        case 'startsWith': return V.bool(s.startsWith(toDisplay(a0, L)));
        case 'endsWith': return V.bool(s.endsWith(toDisplay(a0, L)));
        case 'replace': return V.str(s.split(toDisplay(a0, L)).join(toDisplay(a1, L)));
        case 'split': return V.arr(s.split(toDisplay(a0, L)).map(V.str), 'string');
        case 'concat': case 'append': return V.str(s + toDisplay(a0, L));
        case 'empty': case 'isEmpty': return V.bool(s.length === 0);
        case 'compareTo': return V.int(s < toDisplay(a0, L) ? -1 : (s > toDisplay(a0, L) ? 1 : 0));
        case 'repeat': return V.str(s.repeat(Math.max(0, numOf(a0))));
        case 'push_back': return V.voidv();
        case 'toString': return V.str(s);
        default: throw CodeError('Strings do not have a "' + name + '" operation here.', line);
      }
    }

    if (self.t === 'array') {
      const arr = self.v;
      switch (name) {
        case 'size': case 'length': return V.int(arr.length);
        case 'push_back': case 'add': case 'push': case 'append': {
          if (args.length === 2 && name === 'add') { arr.splice(numOf(a0), 0, a1); return V.voidv(); }
          arr.push(a0); return L === 'js' ? V.int(arr.length) : V.voidv();
        }
        case 'get': case 'at': {
          const i = numOf(a0);
          if (i < 0 || i >= arr.length) throw CodeError('Index ' + i + ' is outside this list (size ' + arr.length + ').', line);
          return arr[i];
        }
        case 'set': { const i = numOf(a0); const old = arr[i]; arr[i] = a1; return old || V.voidv(); }
        case 'pop_back': { arr.pop(); return V.voidv(); }
        case 'pop': return arr.pop() || V.nul();
        case 'remove': { const i = numOf(a0); const old = arr.splice(i, 1)[0]; return old || V.nul(); }
        case 'clear': { arr.length = 0; return V.voidv(); }
        case 'empty': case 'isEmpty': return V.bool(arr.length === 0);
        case 'contains': return V.bool(arr.some(x => looseEq(x, a0)));
        case 'indexOf': { let i = arr.findIndex(x => looseEq(x, a0)); return V.int(i); }
        case 'front': return arr[0] || V.nul();
        case 'back': return arr[arr.length - 1] || V.nul();
        case 'join': return V.str(arr.map(x => toDisplay(x, L)).join(a0 ? toDisplay(a0, L) : ','));
        case 'sort': { arr.sort((x, y) => cmp(x, y)); return V.voidv(); }
        case 'reverse': { arr.reverse(); return V.voidv(); }
        case 'toString': return V.str(toDisplay(self, L));
        default: throw CodeError('Lists do not have a "' + name + '" operation here.', line);
      }
    }

    if (isNum(self) || self.t === 'bool') {
      switch (name) {
        case 'toString': return V.str(toDisplay(self, L));
        case 'toFixed': return V.str(numOf(self).toFixed(numOf(a0)));
        case 'equals': return V.bool(looseEq(self, a0));
        case 'compareTo': return V.int(cmp(self, a0));
        case 'intValue': return V.int(numOf(self));
        case 'doubleValue': return V.dbl(numOf(self));
        default: throw CodeError('Numbers do not have a "' + name + '" operation here.', line);
      }
    }
    throw CodeError('Cannot call "' + name + '" on this value.', line);
  }

  /* ---------- builtins ---------- */
  const BUILTIN_GLOBALS = {};
  const BUILTIN_NAMESPACES = {};
  const BUILTIN_FUNCS = {};

  function nat(fn) { return { t: 'builtin', fn }; }

  function installBuiltins(m) {
    // streams
    BUILTIN_GLOBALS.cout = { t: 'stream', v: 'cout' };
    BUILTIN_GLOBALS.cerr = { t: 'stream', v: 'cerr' };
    BUILTIN_GLOBALS.cin = { t: 'stream', v: 'cin' };
    BUILTIN_GLOBALS.endl = { t: 'endl', v: '\n' };

    // System.out.*
    const outObj = {
      t: 'module', members: {
        println: nat((mm, args) => { mm.write(args.length ? toDisplay(args[0], mm.lang) : ''); mm.write('\n'); return V.voidv(); }),
        print: nat((mm, args) => { mm.write(args.length ? toDisplay(args[0], mm.lang) : ''); return V.voidv(); }),
        printf: nat((mm, args, line) => { mm.write(formatPrintf(mm, args, line)); return V.voidv(); }),
        flush: nat(() => V.voidv())
      }
    };
    BUILTIN_NAMESPACES.System = { out: outObj, err: outObj, currentTimeMillis: nat(() => V.int(Date.now() % 100000)), lineSeparator: nat(() => V.str('\n')) };
    BUILTIN_GLOBALS.System = { t: 'module', members: BUILTIN_NAMESPACES.System };

    const mathMembers = {
      PI: V.dbl(Math.PI), E: V.dbl(Math.E),
      abs: nat((mm, a) => a[0].t === 'double' ? V.dbl(Math.abs(numOf(a[0]))) : V.int(Math.abs(numOf(a[0])))),
      max: nat((mm, a) => (a[0].t === 'double' || a[1].t === 'double') ? V.dbl(Math.max(numOf(a[0]), numOf(a[1]))) : V.int(Math.max(numOf(a[0]), numOf(a[1])))),
      min: nat((mm, a) => (a[0].t === 'double' || a[1].t === 'double') ? V.dbl(Math.min(numOf(a[0]), numOf(a[1]))) : V.int(Math.min(numOf(a[0]), numOf(a[1])))),
      pow: nat((mm, a) => V.dbl(Math.pow(numOf(a[0]), numOf(a[1])))),
      sqrt: nat((mm, a) => V.dbl(Math.sqrt(numOf(a[0])))),
      floor: nat((mm, a) => V.dbl(Math.floor(numOf(a[0])))),
      ceil: nat((mm, a) => V.dbl(Math.ceil(numOf(a[0])))),
      round: nat((mm, a) => V.int(Math.round(numOf(a[0])))),
      random: nat(mm => V.dbl(mm.rand())),
      sin: nat((mm, a) => V.dbl(Math.sin(numOf(a[0])))),
      cos: nat((mm, a) => V.dbl(Math.cos(numOf(a[0])))),
      tan: nat((mm, a) => V.dbl(Math.tan(numOf(a[0])))),
      log: nat((mm, a) => V.dbl(Math.log(numOf(a[0])))),
      log10: nat((mm, a) => V.dbl(Math.log10(numOf(a[0])))),
      exp: nat((mm, a) => V.dbl(Math.exp(numOf(a[0]))))
    };
    BUILTIN_NAMESPACES.Math = mathMembers;
    BUILTIN_GLOBALS.Math = { t: 'module', members: mathMembers };

    BUILTIN_NAMESPACES.Integer = {
      parseInt: nat((mm, a) => V.int(parseInt(toDisplay(a[0], mm.lang), 10) || 0)),
      valueOf: nat((mm, a) => V.int(numOf(a[0]))),
      toString: nat((mm, a) => V.str(toDisplay(a[0], mm.lang))),
      MAX_VALUE: V.int(2147483647), MIN_VALUE: V.int(-2147483648)
    };
    BUILTIN_NAMESPACES.Double = {
      parseDouble: nat((mm, a) => V.dbl(parseFloat(toDisplay(a[0], mm.lang)) || 0)),
      valueOf: nat((mm, a) => V.dbl(numOf(a[0]))),
      toString: nat((mm, a) => V.str(toDisplay(a[0], mm.lang)))
    };
    BUILTIN_NAMESPACES.String = {
      valueOf: nat((mm, a) => V.str(toDisplay(a[0], mm.lang))),
      format: nat((mm, a, line) => V.str(formatPrintf(mm, a, line)))
    };
    BUILTIN_NAMESPACES.Arrays = {
      toString: nat((mm, a) => V.str(toDisplay(a[0], mm.lang))),
      sort: nat((mm, a) => { if (a[0].t === 'array') a[0].v.sort((x, y) => cmp(x, y)); return V.voidv(); }),
      fill: nat((mm, a) => { if (a[0].t === 'array') a[0].v = a[0].v.map(() => a[1]); return V.voidv(); })
    };
    BUILTIN_NAMESPACES.Collections = {
      sort: nat((mm, a) => { if (a[0].t === 'array') a[0].v.sort((x, y) => cmp(x, y)); return V.voidv(); }),
      reverse: nat((mm, a) => { if (a[0].t === 'array') a[0].v.reverse(); return V.voidv(); })
    };

    const consoleMembers = {
      log: nat((mm, args) => { mm.write(args.map(x => toDisplay(x, mm.lang)).join(' ') + '\n'); return V.voidv(); }),
      error: nat((mm, args) => { mm.write(args.map(x => toDisplay(x, mm.lang)).join(' ') + '\n'); return V.voidv(); }),
      warn: nat((mm, args) => { mm.write(args.map(x => toDisplay(x, mm.lang)).join(' ') + '\n'); return V.voidv(); }),
      info: nat((mm, args) => { mm.write(args.map(x => toDisplay(x, mm.lang)).join(' ') + '\n'); return V.voidv(); })
    };
    BUILTIN_NAMESPACES.console = consoleMembers;
    BUILTIN_GLOBALS.console = { t: 'module', members: consoleMembers };

    // seeded RNG so the trace is reproducible when scrubbing
    let seed = 1234567;
    m.rand = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    // free functions
    Object.assign(BUILTIN_FUNCS, {
      printf: (mm, args, line) => { mm.write(formatPrintf(mm, args, line)); return V.voidv(); },
      puts: (mm, args) => { mm.write(toDisplay(args[0], mm.lang) + '\n'); return V.voidv(); },
      sqrt: (mm, a) => V.dbl(Math.sqrt(numOf(a[0]))),
      pow: (mm, a) => V.dbl(Math.pow(numOf(a[0]), numOf(a[1]))),
      abs: (mm, a) => a[0].t === 'double' ? V.dbl(Math.abs(numOf(a[0]))) : V.int(Math.abs(numOf(a[0]))),
      fabs: (mm, a) => V.dbl(Math.abs(numOf(a[0]))),
      floor: (mm, a) => V.dbl(Math.floor(numOf(a[0]))),
      ceil: (mm, a) => V.dbl(Math.ceil(numOf(a[0]))),
      round: (mm, a) => V.int(Math.round(numOf(a[0]))),
      max: (mm, a) => (a[0].t === 'double' || a[1].t === 'double') ? V.dbl(Math.max(numOf(a[0]), numOf(a[1]))) : V.int(Math.max(numOf(a[0]), numOf(a[1]))),
      min: (mm, a) => (a[0].t === 'double' || a[1].t === 'double') ? V.dbl(Math.min(numOf(a[0]), numOf(a[1]))) : V.int(Math.min(numOf(a[0]), numOf(a[1]))),
      to_string: (mm, a) => V.str(toDisplay(a[0], mm.lang)),
      stoi: (mm, a) => V.int(parseInt(toDisplay(a[0], mm.lang), 10) || 0),
      stod: (mm, a) => V.dbl(parseFloat(toDisplay(a[0], mm.lang)) || 0),
      parseInt: (mm, a) => V.int(parseInt(toDisplay(a[0], mm.lang), 10) || 0),
      parseFloat: (mm, a) => V.dbl(parseFloat(toDisplay(a[0], mm.lang)) || 0),
      Number: (mm, a) => a.length ? V.dbl(numOf(a[0])) : V.int(0),
      String: (mm, a) => V.str(a.length ? toDisplay(a[0], mm.lang) : ''),
      Boolean: (mm, a) => V.bool(a.length ? truthy(a[0]) : false),
      isNaN: (mm, a) => V.bool(isNaN(numOf(a[0]))),
      swap: (mm, a) => V.voidv(),
      getline: (mm, a, line, node, env) => {
        const tok = mm.stdin[mm.stdinPos++];
        if (tok === undefined) throw CodeError('The program asked for input but the Input box is empty.', line);
        mm.writeTargetRaw(node.args[1], tok, env);
        return V.voidv();
      }
    });
  }

  function formatPrintf(m, args, line) {
    if (!args.length) return '';
    let fmt = toDisplay(args[0], m.lang);
    let ai = 1;
    return fmt.replace(/%(-?\d+)?(\.\d+)?([sdifncbxo%])/g, (mt, width, prec, conv) => {
      if (conv === '%') return '%';
      if (conv === 'n') return '\n';
      const a = args[ai++];
      if (a === undefined) return mt;
      let s;
      if (conv === 's') s = toDisplay(a, m.lang);
      else if (conv === 'd' || conv === 'i') s = String(Math.trunc(numOf(a)));
      else if (conv === 'f') s = numOf(a).toFixed(prec ? parseInt(prec.slice(1), 10) : 6);
      else if (conv === 'c') s = a.t === 'char' ? a.v : String.fromCharCode(numOf(a));
      else if (conv === 'b') s = truthy(a) ? 'true' : 'false';
      else if (conv === 'x') s = Math.trunc(numOf(a)).toString(16);
      else if (conv === 'o') s = Math.trunc(numOf(a)).toString(8);
      else s = toDisplay(a, m.lang);
      if (width) {
        const w = parseInt(width, 10);
        if (w < 0) s = s.padEnd(-w); else s = s.padStart(w);
      }
      return s;
    });
  }

  /* ---------- public API ---------- */
  function runProgram(src, lang, opts) {
    opts = opts || {};
    const m = new Machine(src, lang, opts);
    try {
      const r = m.run();
      return { ok: true, output: r.output, trace: r.trace, lang };
    } catch (e) {
      if (e && e.sig === 'throw') {
        const txt = e.value ? toDisplay(e.value, lang) : '';
        return { ok: false, output: m.out, trace: m.trace, error: 'Uncaught ' + e.label + (txt ? ': ' + txt : ''), line: 0, lang };
      }
      if (e && e.isCodeError) return { ok: false, output: m.out, trace: m.trace, error: e.message, line: e.line, lang };
      return { ok: false, output: m.out, trace: m.trace, error: (e && e.message) || String(e), line: 0, lang };
    }
  }

  root.Bench = { run: runProgram, toDisplay, inspect, V };
})(typeof window !== 'undefined' ? window : globalThis);
