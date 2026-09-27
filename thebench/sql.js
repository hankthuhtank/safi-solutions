/* ============================================================
   BENCH SQL — a small teaching SQL engine.
   Supports CREATE TABLE, INSERT, SELECT with WHERE / JOIN /
   GROUP BY / HAVING / ORDER BY / LIMIT, aggregates, and
   CREATE INDEX (accepted and reported, not optimised).
   ============================================================ */
(function (root) {
  'use strict';

  function SqlError(msg) { const e = new Error(msg); e.isSql = true; return e; }

  /* ---------------- tokenizer ---------------- */
  const OPS = ['<>', '!=', '<=', '>=', '=', '<', '>', '(', ')', ',', ';', '*', '+', '-', '/', '.'];
  function tok(sql) {
    const out = [];
    let i = 0;
    while (i < sql.length) {
      const c = sql[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '-' && sql[i + 1] === '-') { while (i < sql.length && sql[i] !== '\n') i++; continue; }
      if (c === "'") {
        i++; let s = '';
        while (i < sql.length && sql[i] !== "'") { if (sql[i] === '\\') { s += sql[i + 1]; i += 2; } else s += sql[i++]; }
        i++; out.push({ t: 'str', v: s }); continue;
      }
      if (c === '"') {
        i++; let s = '';
        while (i < sql.length && sql[i] !== '"') s += sql[i++];
        i++; out.push({ t: 'id', v: s }); continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(sql[i + 1] || ''))) {
        let s = i;
        while (i < sql.length && /[0-9.]/.test(sql[i])) i++;
        out.push({ t: 'num', v: parseFloat(sql.slice(s, i)) }); continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let s = i;
        while (i < sql.length && /[A-Za-z0-9_$]/.test(sql[i])) i++;
        out.push({ t: 'id', v: sql.slice(s, i) }); continue;
      }
      let m = null;
      for (const o of OPS) if (sql.startsWith(o, i)) { m = o; break; }
      if (m) { out.push({ t: 'op', v: m }); i += m.length; continue; }
      throw SqlError('Unexpected character "' + c + '" in the query.');
    }
    out.push({ t: 'eof', v: null });
    return out;
  }

  const KW = w => String(w).toUpperCase();

  /* ---------------- database ---------------- */
  function Database() { this.tables = new Map(); this.indexes = []; }

  Database.prototype.exec = function (sql) {
    const statements = splitStatements(sql);
    const results = [];
    for (const st of statements) {
      if (!st.trim()) continue;
      results.push(this.execOne(st));
    }
    return results;
  };

  function splitStatements(sql) {
    const parts = [];
    let cur = '', inStr = false;
    for (let i = 0; i < sql.length; i++) {
      const c = sql[i];
      if (c === "'" ) inStr = !inStr;
      if (c === '-' && sql[i + 1] === '-' && !inStr) { while (i < sql.length && sql[i] !== '\n') i++; cur += '\n'; continue; }
      if (c === ';' && !inStr) { parts.push(cur); cur = ''; continue; }
      cur += c;
    }
    parts.push(cur);
    return parts;
  }

  Database.prototype.execOne = function (sql) {
    const t = tok(sql);
    if (t[0].t === 'eof') return null;
    const head = KW(t[0].v);
    if (head === 'CREATE') {
      if (KW(t[1].v) === 'TABLE') return this.createTable(t);
      if (KW(t[1].v) === 'INDEX' || (KW(t[1].v) === 'UNIQUE' && KW(t[2].v) === 'INDEX')) return this.createIndex(t, sql);
      throw SqlError('Only CREATE TABLE and CREATE INDEX are supported here.');
    }
    if (head === 'INSERT') return this.insert(t);
    if (head === 'SELECT') return this.select(new P(t, this));
    if (head === 'UPDATE') return this.update(new P(t, this));
    if (head === 'DELETE') return this.del(new P(t, this));
    if (head === 'DROP') {
      const name = t[2].v;
      this.tables.delete(name);
      return { kind: 'message', text: 'Dropped table ' + name };
    }
    if (head === 'BEGIN' || head === 'COMMIT' || head === 'ROLLBACK') {
      return { kind: 'message', text: KW(head) + ': transactions are accepted here but not simulated.' };
    }
    throw SqlError('Statement "' + head + '" is not supported in this lab.');
  };

  Database.prototype.createTable = function (t) {
    let i = 2;
    if (KW(t[i].v) === 'IF') i += 3; // IF NOT EXISTS
    const name = t[i++].v;
    if (t[i].v !== '(') throw SqlError('Expected ( after the table name.');
    i++;
    const cols = [];
    let depth = 1;
    let cur = [];
    while (i < t.length && t[i].t !== 'eof') {
      const tk = t[i];
      if (tk.t === 'op' && tk.v === '(') depth++;
      if (tk.t === 'op' && tk.v === ')') { depth--; if (depth === 0) { if (cur.length) cols.push(cur); break; } }
      if (tk.t === 'op' && tk.v === ',' && depth === 1) { cols.push(cur); cur = []; i++; continue; }
      cur.push(tk); i++;
    }
    const columns = [];
    for (const c of cols) {
      if (!c.length) continue;
      const first = KW(c[0].v);
      if (['PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK', 'CONSTRAINT'].indexOf(first) >= 0 && c.length > 1 && KW(c[1].v) === 'KEY') continue;
      const colName = c[0].v;
      const type = c[1] ? KW(c[1].v) : 'TEXT';
      const rest = c.map(x => KW(x.v)).join(' ');
      columns.push({
        name: colName,
        type: /INT/.test(type) ? 'INTEGER' : (/REAL|FLOAT|DOUB|NUM|DEC/.test(type) ? 'REAL' : 'TEXT'),
        pk: rest.indexOf('PRIMARY KEY') >= 0,
        notNull: rest.indexOf('NOT NULL') >= 0,
        unique: rest.indexOf('UNIQUE') >= 0
      });
    }
    this.tables.set(name, { name, columns, rows: [], autoId: 1 });
    return { kind: 'message', text: 'Created table ' + name + ' with ' + columns.length + ' column' + (columns.length === 1 ? '' : 's') + '.' };
  };

  Database.prototype.createIndex = function (t, sql) {
    const m = /ON\s+([A-Za-z_][\w$]*)\s*\(([^)]*)\)/i.exec(sql);
    const nm = /INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_][\w$]*)/i.exec(sql);
    const name = nm ? nm[1] : 'idx';
    if (!m) throw SqlError('CREATE INDEX needs ON tablename(column).');
    this.indexes.push({ name, table: m[1], columns: m[2].split(',').map(s => s.trim()) });
    return { kind: 'message', text: 'Created index ' + name + ' on ' + m[1] + '(' + m[2].trim() + '). Lookups filtering those columns can now skip a full scan.' };
  };

  Database.prototype.table = function (name) {
    const t = this.tables.get(name) || this.tables.get(String(name).toLowerCase());
    if (!t) throw SqlError('There is no table called "' + name + '". Tables available: ' + ([...this.tables.keys()].join(', ') || 'none yet') + '.');
    return t;
  };

  Database.prototype.insert = function (t) {
    let i = 1;
    if (KW(t[i].v) === 'INTO') i++;
    const name = t[i++].v;
    const tbl = this.table(name);
    let cols = null;
    if (t[i] && t[i].v === '(') {
      i++; cols = [];
      while (t[i] && t[i].v !== ')') { if (t[i].v !== ',') cols.push(t[i].v); i++; }
      i++;
    }
    if (!t[i] || KW(t[i].v) !== 'VALUES') throw SqlError('INSERT needs a VALUES clause.');
    i++;
    let inserted = 0;
    while (t[i] && t[i].v === '(') {
      i++;
      const vals = [];
      let neg = false;
      while (t[i] && t[i].v !== ')') {
        if (t[i].v === ',') { i++; continue; }
        if (t[i].t === 'op' && t[i].v === '-') { neg = true; i++; continue; }
        let v = t[i].t === 'num' ? t[i].v : (t[i].t === 'str' ? t[i].v : (KW(t[i].v) === 'NULL' ? null : t[i].v));
        if (neg && typeof v === 'number') { v = -v; neg = false; }
        vals.push(v); i++;
      }
      i++;
      const target = cols || tbl.columns.map(c => c.name);
      const row = {};
      for (const c of tbl.columns) row[c.name] = null;
      target.forEach((cn, k) => { row[cn] = coerceCol(tbl, cn, vals[k]); });
      const pk = tbl.columns.find(c => c.pk);
      if (pk && (row[pk.name] === null || row[pk.name] === undefined)) row[pk.name] = tbl.autoId;
      if (pk && typeof row[pk.name] === 'number' && row[pk.name] >= tbl.autoId) tbl.autoId = row[pk.name] + 1;
      for (const c of tbl.columns) {
        if (c.notNull && (row[c.name] === null || row[c.name] === undefined)) throw SqlError('Column "' + c.name + '" is NOT NULL but no value was given.');
        if (c.unique && tbl.rows.some(r => r[c.name] === row[c.name])) throw SqlError('Column "' + c.name + '" is UNIQUE and the value ' + JSON.stringify(row[c.name]) + ' already exists.');
      }
      tbl.rows.push(row);
      inserted++;
      if (t[i] && t[i].v === ',') i++;
    }
    return { kind: 'message', text: 'Inserted ' + inserted + ' row' + (inserted === 1 ? '' : 's') + ' into ' + name + '.' };
  };

  function coerceCol(tbl, name, v) {
    const col = tbl.columns.find(c => c.name === name);
    if (v === null || v === undefined) return null;
    if (!col) return v;
    if (col.type === 'INTEGER') { const n = Number(v); return isNaN(n) ? v : Math.trunc(n); }
    if (col.type === 'REAL') { const n = Number(v); return isNaN(n) ? v : n; }
    return String(v);
  }

  /* ---------------- select parser ---------------- */
  function P(t, db) { this.t = t; this.i = 0; this.db = db; }
  P.prototype = {
    peek() { return this.t[this.i]; },
    kw() { const p = this.peek(); return p.t === 'id' ? KW(p.v) : null; },
    next() { return this.t[this.i++]; },
    isOp(v) { const p = this.peek(); return p.t === 'op' && p.v === v; },
    eatOp(v) { if (this.isOp(v)) { this.i++; return true; } return false; },
    eatKw(w) { if (this.kw() === w) { this.i++; return true; } return false; },
    expectKw(w) { if (!this.eatKw(w)) throw SqlError('Expected ' + w + ' near "' + (this.peek().v || 'end') + '".'); },
    atEnd() { return this.peek().t === 'eof'; }
  };

  const CLAUSE = new Set(['FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'AS', 'OFFSET', 'SET']);

  Database.prototype.select = function (p) {
    p.expectKw('SELECT');
    let distinct = p.eatKw('DISTINCT');

    // projection
    const items = [];
    do {
      if (p.isOp('*')) { p.next(); items.push({ star: true }); }
      else {
        const expr = parseExpr(p);
        let alias = null;
        if (p.eatKw('AS')) alias = p.next().v;
        else if (p.peek().t === 'id' && !CLAUSE.has(p.kw())) alias = p.next().v;
        items.push({ expr, alias: alias || exprLabel(expr) });
      }
    } while (p.eatOp(','));

    // from
    let base = null, joins = [];
    if (p.eatKw('FROM')) {
      base = parseSource(p);
      for (;;) {
        let type = null;
        if (p.eatKw('INNER')) { p.expectKw('JOIN'); type = 'inner'; }
        else if (p.eatKw('LEFT')) { p.eatKw('OUTER'); p.expectKw('JOIN'); type = 'left'; }
        else if (p.eatKw('JOIN')) type = 'inner';
        else break;
        const src = parseSource(p);
        p.expectKw('ON');
        const on = parseExpr(p);
        joins.push({ type, src, on });
      }
    }

    let where = null, groupBy = [], having = null, orderBy = [], limit = null;
    if (p.eatKw('WHERE')) where = parseExpr(p);
    if (p.eatKw('GROUP')) { p.expectKw('BY'); do { groupBy.push(parseExpr(p)); } while (p.eatOp(',')); }
    if (p.eatKw('HAVING')) having = parseExpr(p);
    if (p.eatKw('ORDER')) {
      p.expectKw('BY');
      do {
        const e = parseExpr(p);
        let dir = 'asc';
        if (p.eatKw('DESC')) dir = 'desc'; else p.eatKw('ASC');
        orderBy.push({ e, dir });
      } while (p.eatOp(','));
    }
    if (p.eatKw('LIMIT')) limit = Number(p.next().v);

    // build rows
    let rows = this.sourceRows(base);
    for (const j of joins) {
      const right = this.sourceRows(j.src);
      const out = [];
      for (const l of rows) {
        let matched = false;
        for (const r of right) {
          const combined = Object.assign({}, l, r);
          if (truthy(evalExpr(j.on, combined, this))) { out.push(combined); matched = true; }
        }
        if (!matched && j.type === 'left') {
          const blank = {};
          for (const k of j.src.columnKeys) blank[k] = null;
          out.push(Object.assign({}, l, blank));
        }
      }
      rows = out;
    }

    if (where) rows = rows.filter(r => truthy(evalExpr(where, r, this)));

    // expand star
    const cols = [];
    for (const it of items) {
      if (it.star) {
        const keys = base ? base.columnKeys.slice() : [];
        for (const j of joins) for (const k of j.src.columnKeys) if (keys.indexOf(k) < 0) keys.push(k);
        for (const k of keys) cols.push({ label: shortKey(k), expr: { k: 'col', name: k } });
      } else cols.push({ label: it.alias, expr: it.expr });
    }

    let outRows;
    const hasAgg = cols.some(c => containsAgg(c.expr)) || (having && containsAgg(having));

    if (groupBy.length || hasAgg) {
      const groups = new Map();
      if (!groupBy.length) groups.set('__all__', rows);
      else {
        for (const r of rows) {
          const key = groupBy.map(g => JSON.stringify(evalExpr(g, r, this))).join('\u0001');
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(r);
        }
      }
      outRows = [];
      for (const [, groupRows] of groups) {
        const ctx = groupRows[0] || {};
        if (having && !truthy(evalExpr(having, ctx, this, groupRows))) continue;
        const rec = {};
        for (const c of cols) rec[c.label] = evalExpr(c.expr, ctx, this, groupRows);
        rec.__src = ctx;
        outRows.push(rec);
      }
    } else {
      outRows = rows.map(r => {
        const rec = {};
        for (const c of cols) rec[c.label] = evalExpr(c.expr, r, this);
        rec.__src = r;
        return rec;
      });
    }

    if (distinct) {
      const seen = new Set();
      outRows = outRows.filter(r => {
        const k = cols.map(c => JSON.stringify(r[c.label])).join('\u0001');
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
    }

    if (orderBy.length) {
      outRows.sort((a, b) => {
        for (const o of orderBy) {
          const label = exprLabel(o.e);
          const av = (label in a) ? a[label] : evalExpr(o.e, a.__src || {}, this);
          const bv = (label in b) ? b[label] : evalExpr(o.e, b.__src || {}, this);
          const c = compare(av, bv);
          if (c !== 0) return o.dir === 'desc' ? -c : c;
        }
        return 0;
      });
    }

    if (limit !== null && !isNaN(limit)) outRows = outRows.slice(0, limit);
    outRows.forEach(r => { delete r.__src; });

    return { kind: 'rows', columns: cols.map(c => c.label), rows: outRows };
  };

  Database.prototype.sourceRows = function (src) {
    if (!src) return [{}];
    const tbl = this.table(src.table);
    src.columnKeys = [];
    const prefix = src.alias || src.table;
    for (const c of tbl.columns) {
      src.columnKeys.push(prefix + '.' + c.name);
    }
    return tbl.rows.map(r => {
      const o = {};
      for (const c of tbl.columns) {
        o[prefix + '.' + c.name] = r[c.name];
        if (!(c.name in o)) o[c.name] = r[c.name];
      }
      return o;
    });
  };

  Database.prototype.update = function (p) {
    p.expectKw('UPDATE');
    const name = p.next().v;
    const tbl = this.table(name);
    p.expectKw('SET');
    const sets = [];
    do {
      const col = p.next().v;
      if (!p.eatOp('=')) throw SqlError('Expected = in the SET clause.');
      sets.push({ col, expr: parseExpr(p) });
    } while (p.eatOp(','));
    let where = null;
    if (p.eatKw('WHERE')) where = parseExpr(p);
    let n = 0;
    for (const r of tbl.rows) {
      const flat = flatten(r, name);
      if (where && !truthy(evalExpr(where, flat, this))) continue;
      for (const s of sets) r[s.col] = coerceCol(tbl, s.col, evalExpr(s.expr, flat, this));
      n++;
    }
    return { kind: 'message', text: 'Updated ' + n + ' row' + (n === 1 ? '' : 's') + '.' };
  };

  Database.prototype.del = function (p) {
    p.expectKw('DELETE');
    p.expectKw('FROM');
    const name = p.next().v;
    const tbl = this.table(name);
    let where = null;
    if (p.eatKw('WHERE')) where = parseExpr(p);
    const before = tbl.rows.length;
    tbl.rows = tbl.rows.filter(r => where ? !truthy(evalExpr(where, flatten(r, name), this)) : false);
    return { kind: 'message', text: 'Deleted ' + (before - tbl.rows.length) + ' row(s).' };
  };

  function flatten(row, prefix) {
    const o = {};
    for (const k in row) { o[k] = row[k]; o[prefix + '.' + k] = row[k]; }
    return o;
  }

  function parseSource(p) {
    const table = p.next().v;
    let alias = null;
    if (p.eatKw('AS')) alias = p.next().v;
    else if (p.peek().t === 'id' && !CLAUSE.has(p.kw())) alias = p.next().v;
    return { table, alias, columnKeys: [] };
  }

  /* ---------------- expressions ---------------- */
  function parseExpr(p) { return parseOr(p); }
  function parseOr(p) {
    let l = parseAnd(p);
    while (p.kw() === 'OR') { p.next(); l = { k: 'bin', op: 'OR', l, r: parseAnd(p) }; }
    return l;
  }
  function parseAnd(p) {
    let l = parseNot(p);
    while (p.kw() === 'AND') { p.next(); l = { k: 'bin', op: 'AND', l, r: parseNot(p) }; }
    return l;
  }
  function parseNot(p) {
    if (p.kw() === 'NOT') { p.next(); return { k: 'not', e: parseNot(p) }; }
    return parseCmp(p);
  }
  function parseCmp(p) {
    let l = parseAdd(p);
    for (;;) {
      if (p.kw() === 'IS') {
        p.next();
        const neg = p.eatKw('NOT');
        p.expectKw('NULL');
        l = { k: 'isnull', e: l, neg };
        continue;
      }
      if (p.kw() === 'LIKE') { p.next(); l = { k: 'like', l, r: parseAdd(p) }; continue; }
      if (p.kw() === 'IN') {
        p.next();
        if (!p.eatOp('(')) throw SqlError('IN needs a list in brackets.');
        const list = [];
        while (!p.isOp(')')) { list.push(parseAdd(p)); if (!p.eatOp(',')) break; }
        p.eatOp(')');
        l = { k: 'in', e: l, list };
        continue;
      }
      if (p.kw() === 'BETWEEN') {
        p.next();
        const lo = parseAdd(p); p.expectKw('AND'); const hi = parseAdd(p);
        l = { k: 'between', e: l, lo, hi };
        continue;
      }
      const pk = p.peek();
      if (pk.t === 'op' && ['=', '<', '>', '<=', '>=', '<>', '!='].indexOf(pk.v) >= 0) {
        p.next();
        l = { k: 'bin', op: pk.v, l, r: parseAdd(p) };
        continue;
      }
      break;
    }
    return l;
  }
  function parseAdd(p) {
    let l = parseMul(p);
    for (;;) {
      if (p.isOp('+')) { p.next(); l = { k: 'bin', op: '+', l, r: parseMul(p) }; }
      else if (p.isOp('-')) { p.next(); l = { k: 'bin', op: '-', l, r: parseMul(p) }; }
      else break;
    }
    return l;
  }
  function parseMul(p) {
    let l = parseUnary(p);
    for (;;) {
      if (p.isOp('*')) { p.next(); l = { k: 'bin', op: '*', l, r: parseUnary(p) }; }
      else if (p.isOp('/')) { p.next(); l = { k: 'bin', op: '/', l, r: parseUnary(p) }; }
      else break;
    }
    return l;
  }
  function parseUnary(p) {
    if (p.isOp('-')) { p.next(); return { k: 'neg', e: parseUnary(p) }; }
    return parseAtom(p);
  }

  const AGGS = new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']);
  const FNS = new Set(['UPPER', 'LOWER', 'LENGTH', 'ROUND', 'ABS', 'SUBSTR', 'COALESCE']);

  function parseAtom(p) {
    const tk = p.peek();
    if (tk.t === 'num') { p.next(); return { k: 'num', v: tk.v }; }
    if (tk.t === 'str') { p.next(); return { k: 'str', v: tk.v }; }
    if (tk.t === 'op' && tk.v === '(') { p.next(); const e = parseExpr(p); p.eatOp(')'); return e; }
    if (tk.t === 'op' && tk.v === '*') { p.next(); return { k: 'star' }; }
    if (tk.t === 'id') {
      const up = KW(tk.v);
      if (up === 'NULL') { p.next(); return { k: 'null' }; }
      if (up === 'TRUE') { p.next(); return { k: 'num', v: 1 }; }
      if (up === 'FALSE') { p.next(); return { k: 'num', v: 0 }; }
      if (up === 'CASE') return parseCase(p);
      p.next();
      if (p.isOp('(')) {
        p.next();
        const args = [];
        let distinct = false;
        if (p.kw() === 'DISTINCT') { p.next(); distinct = true; }
        while (!p.isOp(')')) { args.push(parseExpr(p)); if (!p.eatOp(',')) break; }
        p.eatOp(')');
        if (AGGS.has(up)) return { k: 'agg', fn: up, arg: args[0] || { k: 'star' }, distinct };
        if (FNS.has(up)) return { k: 'fn', fn: up, args };
        throw SqlError('Unknown function "' + tk.v + '".');
      }
      // qualified name a.b
      if (p.isOp('.')) {
        p.next();
        const col = p.next().v;
        return { k: 'col', name: tk.v + '.' + col };
      }
      return { k: 'col', name: tk.v };
    }
    throw SqlError('Unexpected "' + (tk.v === null ? 'end of query' : tk.v) + '".');
  }

  function parseCase(p) {
    p.next();
    const whens = [];
    let els = null;
    while (p.kw() === 'WHEN') {
      p.next();
      const cond = parseExpr(p);
      p.expectKw('THEN');
      whens.push({ cond, val: parseExpr(p) });
    }
    if (p.eatKw('ELSE')) els = parseExpr(p);
    p.expectKw('END');
    return { k: 'case', whens, els };
  }

  function containsAgg(e) {
    if (!e || typeof e !== 'object') return false;
    if (e.k === 'agg') return true;
    for (const key in e) {
      const v = e[key];
      if (Array.isArray(v)) { if (v.some(containsAgg)) return true; }
      else if (v && typeof v === 'object' && containsAgg(v)) return true;
    }
    return false;
  }

  function exprLabel(e) {
    switch (e.k) {
      case 'col': return shortKey(e.name);
      case 'num': return String(e.v);
      case 'str': return e.v;
      case 'agg': return e.fn + '(' + (e.arg.k === 'star' ? '*' : exprLabel(e.arg)) + ')';
      case 'fn': return e.fn + '(' + e.args.map(exprLabel).join(', ') + ')';
      case 'bin': return exprLabel(e.l) + ' ' + e.op + ' ' + exprLabel(e.r);
      default: return 'value';
    }
  }
  function shortKey(k) { const i = String(k).indexOf('.'); return i < 0 ? k : String(k).slice(i + 1); }

  function evalExpr(e, row, db, groupRows) {
    switch (e.k) {
      case 'num': return e.v;
      case 'str': return e.v;
      case 'null': return null;
      case 'star': return 1;
      case 'col': {
        if (row && Object.prototype.hasOwnProperty.call(row, e.name)) return row[e.name];
        const short = shortKey(e.name);
        if (row && Object.prototype.hasOwnProperty.call(row, short)) return row[short];
        for (const k in row) if (shortKey(k) === short) return row[k];
        throw SqlError('There is no column called "' + e.name + '" in this query.');
      }
      case 'neg': return -Number(evalExpr(e.e, row, db, groupRows));
      case 'not': return truthy(evalExpr(e.e, row, db, groupRows)) ? 0 : 1;
      case 'isnull': { const v = evalExpr(e.e, row, db, groupRows); const n = (v === null || v === undefined); return (e.neg ? !n : n) ? 1 : 0; }
      case 'like': {
        const v = String(evalExpr(e.l, row, db, groupRows) ?? '');
        const pat = String(evalExpr(e.r, row, db, groupRows) ?? '');
        const rx = new RegExp('^' + pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
        return rx.test(v) ? 1 : 0;
      }
      case 'in': {
        const v = evalExpr(e.e, row, db, groupRows);
        return e.list.some(x => looseEqSql(v, evalExpr(x, row, db, groupRows))) ? 1 : 0;
      }
      case 'between': {
        const v = evalExpr(e.e, row, db, groupRows);
        return (compare(v, evalExpr(e.lo, row, db, groupRows)) >= 0 && compare(v, evalExpr(e.hi, row, db, groupRows)) <= 0) ? 1 : 0;
      }
      case 'case': {
        for (const w of e.whens) if (truthy(evalExpr(w.cond, row, db, groupRows))) return evalExpr(w.val, row, db, groupRows);
        return e.els ? evalExpr(e.els, row, db, groupRows) : null;
      }
      case 'fn': {
        const a = e.args.map(x => evalExpr(x, row, db, groupRows));
        switch (e.fn) {
          case 'UPPER': return String(a[0] ?? '').toUpperCase();
          case 'LOWER': return String(a[0] ?? '').toLowerCase();
          case 'LENGTH': return String(a[0] ?? '').length;
          case 'ABS': return Math.abs(Number(a[0]));
          case 'ROUND': { const d = a[1] === undefined ? 0 : Number(a[1]); const f = Math.pow(10, d); return Math.round(Number(a[0]) * f) / f; }
          case 'SUBSTR': return String(a[0] ?? '').substr(Number(a[1]) - 1, a[2] === undefined ? undefined : Number(a[2]));
          case 'COALESCE': { for (const v of a) if (v !== null && v !== undefined) return v; return null; }
        }
        return null;
      }
      case 'agg': {
        const rows = groupRows || [];
        let vals = rows.map(r => e.arg.k === 'star' ? 1 : evalExpr(e.arg, r, db));
        if (e.fn !== 'COUNT' || e.arg.k !== 'star') vals = vals.filter(v => v !== null && v !== undefined);
        if (e.distinct) vals = [...new Set(vals.map(v => JSON.stringify(v)))].map(v => JSON.parse(v));
        switch (e.fn) {
          case 'COUNT': return vals.length;
          case 'SUM': return vals.length ? round10(vals.reduce((a, b) => a + Number(b), 0)) : 0;
          case 'AVG': return vals.length ? round10(vals.reduce((a, b) => a + Number(b), 0) / vals.length) : null;
          case 'MIN': return vals.length ? vals.reduce((a, b) => compare(a, b) <= 0 ? a : b) : null;
          case 'MAX': return vals.length ? vals.reduce((a, b) => compare(a, b) >= 0 ? a : b) : null;
        }
        return null;
      }
      case 'bin': {
        const op = e.op;
        if (op === 'AND') return (truthy(evalExpr(e.l, row, db, groupRows)) && truthy(evalExpr(e.r, row, db, groupRows))) ? 1 : 0;
        if (op === 'OR') return (truthy(evalExpr(e.l, row, db, groupRows)) || truthy(evalExpr(e.r, row, db, groupRows))) ? 1 : 0;
        const l = evalExpr(e.l, row, db, groupRows), r = evalExpr(e.r, row, db, groupRows);
        switch (op) {
          case '+': return round10(Number(l) + Number(r));
          case '-': return round10(Number(l) - Number(r));
          case '*': return round10(Number(l) * Number(r));
          case '/': return Number(r) === 0 ? null : round10(Number(l) / Number(r));
          case '=': return looseEqSql(l, r) ? 1 : 0;
          case '<>': case '!=': return looseEqSql(l, r) ? 0 : 1;
          case '<': return compare(l, r) < 0 ? 1 : 0;
          case '>': return compare(l, r) > 0 ? 1 : 0;
          case '<=': return compare(l, r) <= 0 ? 1 : 0;
          case '>=': return compare(l, r) >= 0 ? 1 : 0;
        }
        return null;
      }
    }
    return null;
  }

  function round10(n) { return Math.round(n * 1e10) / 1e10; }
  function truthy(v) { return !(v === null || v === undefined || v === 0 || v === '' || v === false); }
  function looseEqSql(a, b) {
    if (a === null || b === null || a === undefined || b === undefined) return false;
    if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
    return String(a) === String(b);
  }
  function compare(a, b) {
    if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
    if (b === null || b === undefined) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : (a > b ? 1 : 0);
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') return na < nb ? -1 : (na > nb ? 1 : 0);
    const sa = String(a), sb = String(b);
    return sa < sb ? -1 : (sa > sb ? 1 : 0);
  }

  function runSql(sql, db) {
    const database = db || new Database();
    try {
      const results = database.exec(sql).filter(Boolean);
      return { ok: true, results, db: database };
    } catch (e) {
      return { ok: false, error: e.message, db: database };
    }
  }

  root.BenchSQL = { Database, run: runSql };
})(typeof window !== 'undefined' ? window : globalThis);
