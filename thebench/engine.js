/* ============================================================
   BENCH RUNTIME — a teaching interpreter for C++ / Java / JS
   ------------------------------------------------------------
   Not a compiler. A deliberately readable subset interpreter
   that records every step so a learner can scrub through it.
   ============================================================ */
(function (root) {
  "use strict";

  /* ---------------- errors ---------------- */
  function CodeError(msg, line) {
    const e = new Error(msg);
    e.line = line;
    e.isCodeError = true;
    return e;
  }

  /* ---------------- lexer ---------------- */
  const KEYWORDS = new Set([
    "int",
    "long",
    "short",
    "double",
    "float",
    "char",
    "bool",
    "boolean",
    "string",
    "String",
    "void",
    "auto",
    "var",
    "let",
    "const",
    "unsigned",
    "signed",
    "if",
    "else",
    "while",
    "for",
    "do",
    "return",
    "break",
    "continue",
    "switch",
    "case",
    "default",
    "class",
    "struct",
    "public",
    "private",
    "protected",
    "static",
    "final",
    "new",
    "this",
    "true",
    "false",
    "null",
    "nullptr",
    "namespace",
    "using",
    "include",
    "import",
    "package",
    "extends",
    "implements",
    "function",
    "vector",
    "ArrayList",
    "endl",
    "try",
    "catch",
    "finally",
    "throw",
    "throws",
    "sizeof",
    "Integer",
    "Double",
    "Boolean",
    "Character",
    "Long",
    "printf",
    "cout",
    "cin",
    "cerr",
  ]);

  const PUNCT = [
    "===",
    "!==",
    "<<=",
    ">>=",
    "...",
    "=>",
    "->",
    "++",
    "--",
    "<<",
    ">>",
    "<=",
    ">=",
    "==",
    "!=",
    "&&",
    "||",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "::",
    "+",
    "-",
    "*",
    "/",
    "%",
    "=",
    "<",
    ">",
    "!",
    "?",
    ":",
    ";",
    ",",
    ".",
    "(",
    ")",
    "[",
    "]",
    "{",
    "}",
    "&",
    "|",
    "^",
    "~",
    "#",
  ];

  function lex(src) {
    const toks = [];
    let i = 0,
      line = 1;
    const n = src.length;
    const push = (type, value) => toks.push({ type, value, line });

    while (i < n) {
      const c = src[i];

      if (c === "\n") {
        line++;
        i++;
        continue;
      }
      if (c === " " || c === "\t" || c === "\r") {
        i++;
        continue;
      }

      // comments
      if (c === "/" && src[i + 1] === "/") {
        while (i < n && src[i] !== "\n") i++;
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        i += 2;
        while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
          if (src[i] === "\n") line++;
          i++;
        }
        i += 2;
        continue;
      }

      // preprocessor / package lines -> skip whole line
      if (c === "#") {
        while (i < n && src[i] !== "\n") i++;
        continue;
      }

      // numbers
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
        let s = i,
          isFloat = false;
        while (i < n && /[0-9]/.test(src[i])) i++;
        if (src[i] === "." && /[0-9]/.test(src[i + 1] || "")) {
          isFloat = true;
          i++;
          while (i < n && /[0-9]/.test(src[i])) i++;
        }
        if (src[i] === "e" || src[i] === "E") {
          isFloat = true;
          i++;
          if (src[i] === "+" || src[i] === "-") i++;
          while (i < n && /[0-9]/.test(src[i])) i++;
        }
        let raw = src.slice(s, i);
        if (src[i] === "f" || src[i] === "F") {
          isFloat = true;
          i++;
        } else if (src[i] === "L" || src[i] === "l") {
          i++;
        }
        push("num", { v: parseFloat(raw), isFloat: isFloat || raw.includes(".") });
        continue;
      }

      // strings
      if (c === '"') {
        i++;
        let out = "";
        while (i < n && src[i] !== '"') {
          if (src[i] === "\\") {
            out += unescapeChar(src[i + 1]);
            i += 2;
          } else {
            if (src[i] === "\n") line++;
            out += src[i++];
          }
        }
        i++;
        push("str", out);
        continue;
      }
      if (c === "'") {
        i++;
        let out = "";
        while (i < n && src[i] !== "'") {
          if (src[i] === "\\") {
            out += unescapeChar(src[i + 1]);
            i += 2;
          } else out += src[i++];
        }
        i++;
        push("char", out);
        continue;
      }

      // identifiers
      if (/[A-Za-z_$]/.test(c)) {
        let s = i;
        while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++;
        const word = src.slice(s, i);
        push(KEYWORDS.has(word) ? "kw" : "id", word);
        continue;
      }

      // punctuation
      let matched = null;
      for (const p of PUNCT) {
        if (src.startsWith(p, i)) {
          matched = p;
          break;
        }
      }
      if (matched) {
        push("punct", matched);
        i += matched.length;
        continue;
      }

      throw CodeError('Unexpected character "' + c + '"', line);
    }
    push("eof", null);
    return toks;
  }

  function unescapeChar(ch) {
    switch (ch) {
      case "n":
        return "\n";
      case "t":
        return "\t";
      case "r":
        return "\r";
      case "0":
        return "\0";
      case "\\":
        return "\\";
      case '"':
        return '"';
      case "'":
        return "'";
      default:
        return ch || "";
    }
  }

  /* ---------------- type helpers ---------------- */
  const TYPE_WORDS = new Set([
    "int",
    "long",
    "short",
    "double",
    "float",
    "char",
    "bool",
    "boolean",
    "string",
    "String",
    "void",
    "auto",
    "var",
    "let",
    "const",
    "unsigned",
    "signed",
    "vector",
    "ArrayList",
    "Integer",
    "Double",
    "Boolean",
    "Character",
    "Long",
  ]);
  const MODIFIERS = new Set([
    "public",
    "private",
    "protected",
    "static",
    "final",
    "const",
    "unsigned",
    "signed",
    "virtual",
    "inline",
    "abstract",
  ]);

  function normType(name) {
    switch (name) {
      case "boolean":
        return "bool";
      case "String":
        return "string";
      case "float":
        return "double";
      case "short":
      case "long":
      case "Integer":
      case "Long":
        return "int";
      case "Double":
        return "double";
      case "Boolean":
        return "bool";
      case "Character":
        return "char";
      case "var":
      case "let":
      case "auto":
        return "auto";
      default:
        return name;
    }
  }

  /* ---------------- parser ---------------- */
  function Parser(toks, lang) {
    this.t = toks;
    this.p = 0;
    this.lang = lang;
    this.classNames = new Set();
    this.blockDepth = 0;
  }

  Parser.prototype = {
    peek(k) {
      return this.t[this.p + (k || 0)];
    },
    at(type, value) {
      const tk = this.t[this.p];
      if (tk.type !== type) return false;
      if (value === undefined) return true;
      return tk.value === value;
    },
    atAny(type, values) {
      const tk = this.t[this.p];
      return tk.type === type && values.indexOf(tk.value) >= 0;
    },
    next() {
      return this.t[this.p++];
    },
    eat(type, value) {
      if (this.at(type, value)) {
        return this.next();
      }
      return null;
    },
    expect(type, value) {
      if (this.at(type, value)) return this.next();
      const tk = this.t[this.p];
      throw CodeError("Expected " + (value || type) + ' but found "' + fmtTok(tk) + '"', tk.line);
    },
    line() {
      return this.t[this.p].line;
    },

    /* ---- program ---- */
    parseProgram() {
      // prescan class names so `Dog d;` parses as a declaration
      for (let i = 0; i < this.t.length - 1; i++) {
        if (
          this.t[i].type === "kw" &&
          (this.t[i].value === "class" || this.t[i].value === "struct")
        ) {
          const nm = this.t[i + 1];
          if (nm && (nm.type === "id" || nm.type === "kw")) this.classNames.add(nm.value);
        }
      }
      const body = [];
      while (!this.at("eof")) {
        const s = this.parseTopLevel();
        if (s) body.push(s);
      }
      return { kind: "Program", body };
    },

    parseTopLevel() {
      // skip `using namespace std;` / `import x.y.*;` / `package a;`
      if (
        this.at("kw", "using") ||
        this.at("kw", "import") ||
        this.at("kw", "package") ||
        this.at("kw", "namespace")
      ) {
        while (!this.at("punct", ";") && !this.at("eof")) this.next();
        this.eat("punct", ";");
        return null;
      }
      return this.parseStatement();
    },

    /* ---- types ---- */
    tryType() {
      const save = this.p;
      // JS-style declarator: const/let/var immediately followed by a plain name
      if (this.at("kw", "const") || this.at("kw", "let") || this.at("kw", "var")) {
        const nxt = this.peek(1);
        if (nxt && nxt.type === "id") {
          const kw = this.next().value;
          return {
            kind: "Type",
            name: "auto",
            raw: kw,
            mods: [kw],
            elem: null,
            container: false,
            arrayDepth: 0,
          };
        }
      }
      const mods = [];
      while (this.at("kw") && MODIFIERS.has(this.peek().value)) mods.push(this.next().value);

      let base = null;
      const tk = this.peek();
      if (
        (tk.type === "kw" && TYPE_WORDS.has(tk.value)) ||
        (tk.type === "id" && this.classNames.has(tk.value))
      ) {
        base = this.next().value;
      } else if (mods.length && tk.type === "id") {
        base = this.next().value;
      } else {
        this.p = save;
        return null;
      }

      // generics: vector<int>, ArrayList<Integer>, ArrayList<>
      let elem = null;
      if (this.at("punct", "<")) {
        const save2 = this.p;
        this.next();
        if (this.at("punct", ">")) {
          this.next();
        } else {
          const inner = this.tryType();
          if (!inner) {
            this.p = save2;
          } else if (this.at("punct", ">")) {
            this.next();
            elem = inner;
          } else if (this.at("punct", ">>")) {
            // nested generics
            this.t[this.p] = { type: "punct", value: ">", line: this.peek().line };
            elem = inner;
          } else {
            this.p = save2;
          }
        }
      }

      let arrayDepth = 0;
      while (this.at("punct", "[") && this.peek(1).type === "punct" && this.peek(1).value === "]") {
        this.next();
        this.next();
        arrayDepth++;
      }

      // C++ reference / pointer sugar (treated as plain values)
      while (this.at("punct", "&") || this.at("punct", "*")) this.next();

      const name = normType(base);
      const isContainer = base === "vector" || base === "ArrayList";
      return {
        kind: "Type",
        name,
        raw: base,
        mods,
        elem: elem || (isContainer ? { kind: "Type", name: "auto", raw: "auto" } : null),
        container: isContainer,
        arrayDepth,
      };
    },

    /* ---- statements ---- */
    parseBlock() {
      const line = this.line();
      this.expect("punct", "{");
      this.blockDepth++;
      const body = [];
      while (!this.at("punct", "}") && !this.at("eof")) {
        const s = this.parseStatement();
        if (s) body.push(s);
      }
      this.blockDepth--;
      this.expect("punct", "}");
      return { kind: "Block", body, line };
    },

    parseStatement() {
      const line = this.line();

      if (this.at("punct", ";")) {
        this.next();
        return null;
      }
      if (this.at("punct", "{")) return this.parseBlock();

      if (this.at("kw", "class") || this.at("kw", "struct")) return this.parseClass();
      if (this.at("kw") && MODIFIERS.has(this.peek().value)) {
        let k = 0;
        while (this.peek(k) && this.peek(k).type === "kw" && MODIFIERS.has(this.peek(k).value)) k++;
        const after = this.peek(k);
        if (after && after.type === "kw" && (after.value === "class" || after.value === "struct")) {
          for (let j = 0; j < k; j++) this.next();
          return this.parseClass();
        }
      }
      if (this.at("kw", "if")) return this.parseIf();
      if (this.at("kw", "while")) return this.parseWhile();
      if (this.at("kw", "do")) return this.parseDoWhile();
      if (this.at("kw", "for")) return this.parseFor();
      if (this.at("kw", "switch")) return this.parseSwitch();
      if (this.at("kw", "return")) {
        this.next();
        let arg = null;
        if (!this.at("punct", ";")) arg = this.parseExpression();
        this.eat("punct", ";");
        return { kind: "Return", arg, line };
      }
      if (this.at("kw", "break")) {
        this.next();
        this.eat("punct", ";");
        return { kind: "Break", line };
      }
      if (this.at("kw", "continue")) {
        this.next();
        this.eat("punct", ";");
        return { kind: "Continue", line };
      }
      if (this.at("kw", "using") || this.at("kw", "import") || this.at("kw", "package")) {
        while (!this.at("punct", ";") && !this.at("eof")) this.next();
        this.eat("punct", ";");
        return null;
      }
      if (this.at("kw", "function")) {
        // JS style
        this.next();
        const name = this.next().value;
        const params = this.parseParams();
        const body = this.parseBlock();
        return {
          kind: "FuncDecl",
          name,
          params,
          body,
          retType: { kind: "Type", name: "auto" },
          line,
        };
      }
      if (this.at("kw", "try")) {
        this.next();
        const block = this.parseBlock();
        const handlers = [];
        while (this.at("kw", "catch")) {
          this.next();
          let param = "e",
            ctype = null;
          if (this.eat("punct", "(")) {
            const words = [];
            while (!this.at("punct", ")") && !this.at("eof")) {
              const tk = this.next();
              if (tk.type === "id" || tk.type === "kw") words.push(tk.value);
            }
            this.expect("punct", ")");
            if (words.length >= 2) {
              ctype = words[words.length - 2];
              param = words[words.length - 1];
            } else if (words.length === 1) {
              param = words[0];
            }
          }
          handlers.push({ param, ctype, body: this.parseBlock() });
        }
        let fin = null;
        if (this.at("kw", "finally")) {
          this.next();
          fin = this.parseBlock();
        }
        return { kind: "Try", block, handlers, fin, line };
      }
      if (this.at("kw", "throw")) {
        this.next();
        const arg = this.parseExpression();
        this.eat("punct", ";");
        return { kind: "Throw", arg, line };
      }

      // declaration or function
      const save = this.p;
      const type = this.tryType();
      if (type) {
        if (
          this.blockDepth === 0 &&
          (this.at("id") || this.at("kw")) &&
          this.peek(1).type === "punct" &&
          this.peek(1).value === "("
        ) {
          const name = this.next().value;
          const params = this.parseParams();
          if (this.at("punct", "{")) {
            const body = this.parseBlock();
            return { kind: "FuncDecl", name, params, body, retType: type, line };
          }
          this.eat("punct", ";"); // prototype
          return null;
        }
        if (this.at("id") || (this.at("kw") && !TYPE_WORDS.has(this.peek().value))) {
          return this.finishVarDecl(type, line);
        }
        this.p = save;
      }

      const expr = this.parseExpression();
      this.eat("punct", ";");
      return { kind: "ExprStmt", expr, line };
    },

    finishVarDecl(type, line) {
      const decls = [];
      do {
        const nameTok = this.next();
        const name = nameTok.value;
        let arrayDims = [];
        let localType = type;
        while (this.at("punct", "[")) {
          this.next();
          if (this.at("punct", "]")) {
            this.next();
            arrayDims.push(null);
          } else {
            arrayDims.push(this.parseExpression());
            this.expect("punct", "]");
          }
        }
        if (arrayDims.length)
          localType = Object.assign({}, type, {
            arrayDepth: (type.arrayDepth || 0) + arrayDims.length,
          });

        let init = null,
          ctorArgs = null;
        if (this.at("punct", "=")) {
          this.next();
          init = this.parseInitializer(localType);
        } else if (this.at("punct", "(") && !type.container) {
          ctorArgs = this.parseArgs();
        }
        decls.push({ name, type: localType, init, ctorArgs, dims: arrayDims });
      } while (this.eat("punct", ","));
      this.eat("punct", ";");
      return { kind: "VarDecl", decls, line };
    },

    looksLikeObjectLit() {
      if (!this.at("punct", "{")) return false;
      const n1 = this.peek(1),
        n2 = this.peek(2);
      if (!n1) return false;
      if (n1.type === "punct" && n1.value === "}") return this.lang === "js";
      return (
        (n1.type === "id" || n1.type === "str" || n1.type === "kw") &&
        n2 &&
        n2.type === "punct" &&
        n2.value === ":"
      );
    },

    parseObjectLit() {
      const line = this.line();
      this.next();
      const props = [];
      while (!this.at("punct", "}")) {
        const keyTok = this.next();
        this.expect("punct", ":");
        props.push({ key: String(keyTok.value), value: this.parseAssign() });
        if (!this.eat("punct", ",")) break;
      }
      this.expect("punct", "}");
      return { kind: "ObjectLit", props, line };
    },

    parseInitializer(type) {
      if (this.looksLikeObjectLit()) return this.parseObjectLit();
      if (this.at("punct", "{")) {
        const line = this.line();
        this.next();
        const items = [];
        while (!this.at("punct", "}")) {
          items.push(this.parseInitializer(type && type.elem));
          if (!this.eat("punct", ",")) break;
        }
        this.expect("punct", "}");
        return { kind: "ArrayLit", items, line };
      }
      return this.parseAssign();
    },

    parseParams() {
      this.expect("punct", "(");
      const params = [];
      while (!this.at("punct", ")")) {
        const t = this.tryType();
        let name = null;
        if (this.at("id") || (this.at("kw") && !TYPE_WORDS.has(this.peek().value)))
          name = this.next().value;
        while (this.at("punct", "[")) {
          this.next();
          this.expect("punct", "]");
        }
        let def = null;
        if (this.eat("punct", "=")) def = this.parseAssign();
        params.push({ name: name || "arg" + params.length, type: t, def });
        if (!this.eat("punct", ",")) break;
      }
      this.expect("punct", ")");
      return params;
    },

    parseArgs() {
      this.expect("punct", "(");
      const args = [];
      while (!this.at("punct", ")")) {
        args.push(this.parseAssign());
        if (!this.eat("punct", ",")) break;
      }
      this.expect("punct", ")");
      return args;
    },

    parseClass() {
      const line = this.line();
      this.next(); // class|struct
      const name = this.next().value;
      this.classNames.add(name);
      let parent = null;
      if (this.at("kw", "extends")) {
        this.next();
        parent = this.next().value;
      }
      if (this.at("punct", ":")) {
        // C++ inheritance
        this.next();
        while (this.at("kw") && MODIFIERS.has(this.peek().value)) this.next();
        parent = this.next().value;
      }
      if (this.at("kw", "implements")) {
        this.next();
        while (!this.at("punct", "{")) this.next();
      }
      this.expect("punct", "{");
      const fields = [],
        methods = [];
      let ctor = null;
      while (!this.at("punct", "}") && !this.at("eof")) {
        // access labels
        if (
          this.at("kw") &&
          MODIFIERS.has(this.peek().value) &&
          this.peek(1).type === "punct" &&
          this.peek(1).value === ":"
        ) {
          this.next();
          this.next();
          continue;
        }
        if (this.at("punct", ";")) {
          this.next();
          continue;
        }

        const mods = [];
        while (this.at("kw") && MODIFIERS.has(this.peek().value)) mods.push(this.next().value);

        // constructor: Name(
        if ((this.at("id", name) || this.at("kw", name)) && this.peek(1).value === "(") {
          const cline = this.line();
          this.next();
          const params = this.parseParams();
          if (this.at("punct", ":")) {
            // C++ init list — skip to body
            while (!this.at("punct", "{") && !this.at("eof")) this.next();
          }
          const body = this.at("punct", "{")
            ? this.parseBlock()
            : (this.eat("punct", ";"), { kind: "Block", body: [], line: cline });
          ctor = { name, params, body, line: cline, isCtor: true };
          continue;
        }
        // destructor
        if (this.at("punct", "~")) {
          this.next();
          this.next();
          this.parseParams();
          if (this.at("punct", "{")) this.parseBlock();
          else this.eat("punct", ";");
          continue;
        }

        const mline = this.line();
        const type = this.tryType();
        if (!type) {
          this.next();
          continue;
        }
        const mname = this.next().value;
        if (this.at("punct", "(")) {
          const params = this.parseParams();
          while (this.at("kw") && MODIFIERS.has(this.peek().value)) this.next();
          if (this.at("kw", "throws")) {
            while (!this.at("punct", "{") && !this.at("punct", ";")) this.next();
          }
          if (this.at("punct", "{"))
            methods.push({
              name: mname,
              params,
              body: this.parseBlock(),
              retType: type,
              line: mline,
              static: mods.includes("static"),
            });
          else this.eat("punct", ";");
        } else {
          let dims = [];
          while (this.at("punct", "[")) {
            this.next();
            if (!this.at("punct", "]")) {
              dims.push(this.parseExpression());
            }
            this.expect("punct", "]");
          }
          let init = null;
          if (this.eat("punct", "=")) init = this.parseInitializer(type);
          this.eat("punct", ";");
          fields.push({
            name: mname,
            type: dims.length ? Object.assign({}, type, { arrayDepth: dims.length }) : type,
            init,
            dims,
            static: mods.includes("static"),
          });
        }
      }
      this.expect("punct", "}");
      this.eat("punct", ";");
      return { kind: "ClassDecl", name, parent, fields, methods, ctor, line };
    },

    parseIf() {
      const line = this.line();
      this.next();
      this.expect("punct", "(");
      const test = this.parseExpression();
      this.expect("punct", ")");
      const cons = this.parseStatement();
      let alt = null;
      if (this.at("kw", "else")) {
        this.next();
        alt = this.parseStatement();
      }
      return { kind: "If", test, cons, alt, line };
    },
    parseWhile() {
      const line = this.line();
      this.next();
      this.expect("punct", "(");
      const test = this.parseExpression();
      this.expect("punct", ")");
      const body = this.parseStatement();
      return { kind: "While", test, body, line };
    },
    parseDoWhile() {
      const line = this.line();
      this.next();
      const body = this.parseStatement();
      this.expect("kw", "while");
      this.expect("punct", "(");
      const test = this.parseExpression();
      this.expect("punct", ")");
      this.eat("punct", ";");
      return { kind: "DoWhile", test, body, line };
    },
    parseFor() {
      const line = this.line();
      this.next();
      this.expect("punct", "(");
      // for-each?  for (int x : arr)
      const save = this.p;
      const t = this.tryType();
      if (t && (this.at("id") || this.at("kw"))) {
        const nm = this.peek().value;
        const sep = this.peek(1);
        const isColon = sep && sep.type === "punct" && sep.value === ":";
        const isOf = sep && sep.type === "id" && (sep.value === "of" || sep.value === "in");
        if (isColon || isOf) {
          const mode = isOf ? sep.value : "of";
          this.next();
          this.next();
          const iter = this.parseExpression();
          this.expect("punct", ")");
          const body = this.parseStatement();
          return { kind: "ForEach", varName: nm, varType: t, iter, body, line, mode };
        }
      }
      this.p = save;

      let init = null;
      if (!this.at("punct", ";")) {
        const st = this.parseStatement();
        init = st;
      } else this.next();
      let test = null;
      if (!this.at("punct", ";")) test = this.parseExpression();
      this.expect("punct", ";");
      let update = null;
      if (!this.at("punct", ")")) update = this.parseExpression();
      this.expect("punct", ")");
      const body = this.parseStatement();
      return { kind: "For", init, test, update, body, line };
    },
    parseSwitch() {
      const line = this.line();
      this.next();
      this.expect("punct", "(");
      const disc = this.parseExpression();
      this.expect("punct", ")");
      this.expect("punct", "{");
      const cases = [];
      while (!this.at("punct", "}") && !this.at("eof")) {
        let test = null;
        const cline = this.line();
        if (this.at("kw", "case")) {
          this.next();
          test = this.parseExpression();
          this.expect("punct", ":");
        } else {
          this.expect("kw", "default");
          this.expect("punct", ":");
        }
        const body = [];
        while (
          !this.at("kw", "case") &&
          !this.at("kw", "default") &&
          !this.at("punct", "}") &&
          !this.at("eof")
        ) {
          const s = this.parseStatement();
          if (s) body.push(s);
        }
        cases.push({ test, body, line: cline });
      }
      this.expect("punct", "}");
      return { kind: "Switch", disc, cases, line };
    },

    /* ---- expressions (precedence climbing) ---- */
    parseExpression() {
      let e = this.parseAssign();
      while (this.at("punct", ",")) {
        // comma operator - rare; keep last
        this.next();
        e = { kind: "Seq", a: e, b: this.parseAssign(), line: e.line };
      }
      return e;
    },

    parseAssign() {
      const arrow = this.tryArrow();
      if (arrow) return arrow;
      const left = this.parseTernary();
      const tk = this.peek();
      if (tk.type === "punct" && ["=", "+=", "-=", "*=", "/=", "%="].indexOf(tk.value) >= 0) {
        this.next();
        const right = this.parseAssign();
        return { kind: "Assign", op: tk.value, target: left, value: right, line: tk.line };
      }
      return left;
    },

    tryArrow() {
      // name => ...
      if (
        this.at("id") &&
        this.peek(1) &&
        this.peek(1).type === "punct" &&
        this.peek(1).value === "=>"
      ) {
        const line = this.line();
        const name = this.next().value;
        this.next();
        return this.finishArrow([{ name, type: null, def: null }], line);
      }
      // (a, b) => ...
      if (this.at("punct", "(")) {
        let depth = 0,
          i = this.p;
        while (i < this.t.length) {
          const tk = this.t[i];
          if (tk.type === "punct" && tk.value === "(") depth++;
          else if (tk.type === "punct" && tk.value === ")") {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          } else if (tk.type === "eof") return null;
          i++;
        }
        const after = this.t[i];
        if (after && after.type === "punct" && after.value === "=>") {
          const line = this.line();
          const params = this.parseParams();
          this.expect("punct", "=>");
          return this.finishArrow(params, line);
        }
      }
      return null;
    },

    finishArrow(params, line) {
      if (this.at("punct", "{")) {
        const body = this.parseBlock();
        return { kind: "Arrow", params, body, expr: false, line };
      }
      const e = this.parseAssign();
      return { kind: "Arrow", params, body: e, expr: true, line };
    },

    parseTernary() {
      const test = this.parseBinary(0);
      if (this.at("punct", "?")) {
        const line = this.line();
        this.next();
        const cons = this.parseAssign();
        this.expect("punct", ":");
        const alt = this.parseAssign();
        return { kind: "Ternary", test, cons, alt, line };
      }
      return test;
    },

    parseBinary(minPrec) {
      let left = this.parseUnary();
      for (;;) {
        const tk = this.peek();
        if (tk.type !== "punct") break;
        const prec = BINPREC[tk.value];
        if (prec === undefined || prec < minPrec) break;
        this.next();
        const right = this.parseBinary(prec + 1);
        left = { kind: "Bin", op: tk.value, left, right, line: tk.line };
      }
      return left;
    },

    parseUnary() {
      const tk = this.peek();
      if (tk.type === "punct" && ["!", "-", "+", "~"].indexOf(tk.value) >= 0) {
        this.next();
        return { kind: "Unary", op: tk.value, arg: this.parseUnary(), line: tk.line };
      }
      if (tk.type === "punct" && (tk.value === "++" || tk.value === "--")) {
        this.next();
        return {
          kind: "Update",
          op: tk.value,
          prefix: true,
          arg: this.parseUnary(),
          line: tk.line,
        };
      }
      if (tk.type === "kw" && tk.value === "new") {
        this.next();
        let t = this.tryType();
        if (!t && (this.at("id") || this.at("kw"))) {
          const nm = this.next().value;
          t = {
            kind: "Type",
            name: nm,
            raw: nm,
            mods: [],
            elem: null,
            container: false,
            arrayDepth: 0,
          };
        }
        if (!t) throw CodeError('Expected a type name after "new".', tk.line);
        const line = tk.line;
        if (this.at("punct", "[")) {
          this.next();
          let size = null;
          if (!this.at("punct", "]")) size = this.parseExpression();
          this.expect("punct", "]");
          let init = null;
          if (this.at("punct", "{")) init = this.parseInitializer(t);
          return this.parsePostfixOps({ kind: "NewArray", type: t, size, init, line });
        }
        let args = [];
        if (this.at("punct", "(")) args = this.parseArgs();
        if (this.at("punct", "{")) {
          const lit = this.parseInitializer(t);
          return this.parsePostfixOps({ kind: "NewArray", type: t, size: null, init: lit, line });
        }
        return this.parsePostfixOps({ kind: "New", type: t, args, line });
      }
      if (tk.type === "kw" && tk.value === "sizeof") {
        this.next();
        if (this.at("punct", "(")) {
          this.parseArgs();
        } else this.parseUnary();
        return { kind: "Num", value: 4, isFloat: false, line: tk.line };
      }
      // C-style cast: (int)x  (double)y
      if (tk.type === "punct" && tk.value === "(") {
        const save = this.p;
        this.next();
        const t = this.tryType();
        if (
          t &&
          this.at("punct", ")") &&
          ["int", "double", "char", "bool", "string"].indexOf(t.name) >= 0
        ) {
          const after = this.peek(1);
          const castable =
            after &&
            (after.type === "num" ||
              after.type === "id" ||
              after.type === "str" ||
              (after.type === "punct" && (after.value === "(" || after.value === "-")) ||
              after.type === "kw");
          if (castable) {
            this.next();
            return { kind: "Cast", to: t.name, arg: this.parseUnary(), line: tk.line };
          }
        }
        this.p = save;
      }
      return this.parsePostfix();
    },

    parsePostfix() {
      return this.parsePostfixOps(this.parsePrimary());
    },

    parsePostfixOps(node) {
      for (;;) {
        if (this.at("punct", ".") || this.at("punct", "->")) {
          this.next();
          const nameTok = this.next();
          node = { kind: "Member", obj: node, name: nameTok.value, line: nameTok.line };
        } else if (this.at("punct", "::")) {
          this.next();
          const nameTok = this.next();
          node = {
            kind: "Member",
            obj: node,
            name: nameTok.value,
            line: nameTok.line,
            static: true,
          };
        } else if (this.at("punct", "(")) {
          const line = this.line();
          const args = this.parseArgs();
          node = { kind: "Call", callee: node, args, line };
        } else if (this.at("punct", "[")) {
          const line = this.line();
          this.next();
          const idx = this.parseExpression();
          this.expect("punct", "]");
          node = { kind: "Index", obj: node, index: idx, line };
        } else if (this.at("punct", "++") || this.at("punct", "--")) {
          const tk = this.next();
          node = { kind: "Update", op: tk.value, prefix: false, arg: node, line: tk.line };
        } else break;
      }
      return node;
    },

    parsePrimary() {
      const tk = this.peek();
      if (tk.type === "num") {
        this.next();
        return { kind: "Num", value: tk.value.v, isFloat: tk.value.isFloat, line: tk.line };
      }
      if (tk.type === "str") {
        this.next();
        return { kind: "Str", value: tk.value, line: tk.line };
      }
      if (tk.type === "char") {
        this.next();
        return { kind: "Char", value: tk.value, line: tk.line };
      }
      if (tk.type === "kw") {
        if (tk.value === "true") {
          this.next();
          return { kind: "Bool", value: true, line: tk.line };
        }
        if (tk.value === "false") {
          this.next();
          return { kind: "Bool", value: false, line: tk.line };
        }
        if (tk.value === "null" || tk.value === "nullptr") {
          this.next();
          return { kind: "Null", line: tk.line };
        }
        if (tk.value === "this") {
          this.next();
          return { kind: "This", line: tk.line };
        }
        // treat other keywords used as values (cout, cin, endl, printf, String...) as identifiers
        this.next();
        return { kind: "Ident", name: tk.value, line: tk.line };
      }
      if (tk.type === "id") {
        this.next();
        return { kind: "Ident", name: tk.value, line: tk.line };
      }
      if (tk.type === "punct" && tk.value === "(") {
        this.next();
        const e = this.parseExpression();
        this.expect("punct", ")");
        return e;
      }
      if (tk.type === "punct" && tk.value === "{") return this.parseInitializer(null);
      if (tk.type === "punct" && tk.value === "[") {
        this.next();
        const items = [];
        while (!this.at("punct", "]")) {
          items.push(this.parseAssign());
          if (!this.eat("punct", ",")) break;
        }
        this.expect("punct", "]");
        return { kind: "ArrayLit", items, line: tk.line };
      }
      throw CodeError('Unexpected "' + fmtTok(tk) + '"', tk.line);
    },
  };

  const BINPREC = {
    "||": 1,
    "&&": 2,
    "|": 3,
    "^": 4,
    "&": 5,
    "==": 6,
    "!=": 6,
    "===": 6,
    "!==": 6,
    "<": 7,
    ">": 7,
    "<=": 7,
    ">=": 7,
    "<<": 8,
    ">>": 8,
    "+": 9,
    "-": 9,
    "*": 10,
    "/": 10,
    "%": 10,
  };

  function fmtTok(tk) {
    if (!tk) return "end of file";
    if (tk.type === "eof") return "end of file";
    if (tk.type === "num") return String(tk.value.v);
    if (tk.type === "str") return '"' + tk.value + '"';
    return String(tk.value);
  }

  root.BenchParse = { lex, Parser, CodeError, normType, fmtTok };
})(typeof window !== "undefined" ? window : globalThis);
