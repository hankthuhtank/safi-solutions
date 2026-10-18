/* Moneywise charts: plain SVG, no library. Thin marks (2px lines, bars at most 24px with a 4px rounded data end),
   hairline grid, a legend whenever there are two or more series, a crosshair tooltip on lines, a per-bar tooltip on
   bars, keyboard stepping with the arrow keys, and a table view under every chart so no value hides behind a hover. */
const NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function h(tag, cls, parent, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
}

export function niceTicks(lo, hi, count = 5) {
  if (!(hi > lo)) {
    hi = lo + 1;
  }
  const raw = (hi - lo) / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || 10 * mag;
  const start = Math.floor(lo / step) * step,
    end = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = start; v <= end + step * 1e-6; v += step) ticks.push(Math.round(v / step) * step);
  return { ticks, lo: start, hi: end };
}

const textWidth = (s, px = 11) => String(s).length * px * 0.58;
// split a label that is too wide into two lines: at a " · " if it has one, otherwise at the space nearest the middle
function wrapLabel(s, max, px = 12.5) {
  if (textWidth(s, px) <= max) return [s];
  const dot = s.indexOf(" \u00B7 ");
  if (dot > 0) return [s.slice(0, dot), s.slice(dot + 3)];
  const mid = s.length / 2;
  let best = -1;
  for (let i = 0; i < s.length; i++)
    if (s[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best > 0 ? [s.slice(0, best), s.slice(best + 1)] : [s];
}

// A bar with a 4px rounded data end and a square base. Horizontal when horiz is true.
function barPath(x, y, w, hgt, { roundEnd = true, horiz = false, negative = false } = {}) {
  const r = roundEnd ? Math.min(4, (horiz ? hgt : w) / 2, horiz ? Math.abs(w) : Math.abs(hgt)) : 0;
  if (!horiz) {
    if (!negative)
      return `M${x} ${y + hgt}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + hgt}Z`;
    return `M${x} ${y}V${y + hgt - r}Q${x} ${y + hgt} ${x + r} ${y + hgt}H${x + w - r}Q${x + w} ${y + hgt} ${x + w} ${y + hgt - r}V${y}Z`;
  }
  if (!negative)
    return `M${x} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + hgt - r}Q${x + w} ${y + hgt} ${x + w - r} ${y + hgt}H${x}Z`;
  return `M${x + w} ${y}H${x + r}Q${x} ${y} ${x} ${y + r}V${y + hgt - r}Q${x} ${y + hgt} ${x + r} ${y + hgt}H${x + w}Z`;
}

/* spec:
   type: 'line' | 'bars' | 'hbars' | 'waterfall'
   title, desc, height
   x: { values, format, label }            line: numeric x; bars/hbars: category labels
   y: { format, min, max, zero }
   series: [{ key, label, color, values, area, dash, step }]
   stacked (bars/hbars), labels ('end' | 'total' | 'none'), annotations [{x, label}], bands [{from, to, label}],
   thresholds [{value, label}] (hbars), steps (waterfall: [{label, value, kind, color}]), tableLabel */
export function makeChart(host, initial) {
  let spec = initial;
  const fig = h("figure", "chart", host);
  const head = h("div", "chart-head", fig);
  const title = h("h4", "", head);
  const legend = h("ul", "legend", head);
  const svg = svgEl("svg", { role: "img", tabindex: "0" }, fig);
  const tip = h("div", "tip", fig);
  tip.hidden = true;
  const details = h("details", "chart-table", fig);
  h("summary", "", details, "Table view");
  const tw = h("div", "tw", details);
  let width = 0,
    focusIndex = null,
    onKey = null;

  function drawLegend() {
    legend.replaceChildren();
    const items =
      spec.type === "waterfall" ? spec.legend || [] : spec.series.filter((s) => !s.hideLegend);
    if (items.length < 2) return;
    for (const s of items) {
      const li = h("li", "", legend);
      const sw = h("i", s.dash ? "dash" : spec.type === "line" ? "line" : "", li);
      sw.style.setProperty("--c", s.color);
      li.appendChild(document.createTextNode(s.label));
    }
  }

  function drawTable() {
    const t = h("table");
    const thead = h("thead", "", t),
      tr = h("tr", "", thead);
    if (spec.type === "waterfall") {
      h("th", "", tr, spec.tableLabel || "Step");
      h("th", "", tr, "Amount");
      h("th", "", tr, "Running total");
      const tb = h("tbody", "", t);
      let run = 0;
      for (const s of spec.steps) {
        run = s.kind === "end" ? s.value : s.kind === "start" ? s.value : run + s.value;
        const r = h("tr", "", tb);
        h("td", "", r, s.label);
        h("td", "", r, spec.y.format(s.value));
        h("td", "", r, spec.y.format(run));
      }
    } else {
      h("th", "", tr, spec.tableLabel || spec.x.label || "");
      for (const s of spec.series) h("th", "", tr, s.label);
      const tb = h("tbody", "", t);
      const step = spec.tableEvery || 1;
      spec.x.values.forEach((xv, i) => {
        if (i % step && i !== spec.x.values.length - 1) return;
        const r = h("tr", "", tb);
        h("td", "", r, spec.x.format ? spec.x.format(xv, i) : String(xv));
        for (const s of spec.series)
          h("td", "", r, s.values[i] == null ? "" : (s.format || spec.y.format)(s.values[i]));
      });
    }
    tw.replaceChildren(t);
  }

  function showTip(px, py, titleText, rows) {
    tip.replaceChildren();
    h("div", "tip-title", tip, titleText);
    for (const r of rows) {
      const row = h("div", "tip-row", tip);
      const i = h("i", "", row);
      i.style.setProperty("--c", r.color);
      h("b", "", row, r.value);
      h("span", "", row, r.label);
    }
    tip.hidden = false;
    const fw = fig.clientWidth,
      tw2 = tip.offsetWidth,
      th = tip.offsetHeight;
    let left = px + 14;
    if (left + tw2 > fw - 6) left = px - tw2 - 14;
    if (left < 6) left = 6;
    let top = py - th - 10;
    if (top < 4) top = py + 16;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  const hideTip = () => {
    tip.hidden = true;
  };
  // viewBox coordinates -> pixels inside the figure (the tooltip is positioned relative to the figure)
  const toFig = (vx, vy, W) => {
    const fr = fig.getBoundingClientRect(),
      sr = svg.getBoundingClientRect(),
      k = sr.width / W;
    return [sr.left - fr.left + vx * k, sr.top - fr.top + vy * k];
  };

  function render() {
    width = Math.max(260, Math.round(fig.clientWidth - 28));
    title.textContent = spec.title || "";
    svg.setAttribute("aria-label", [spec.title, spec.desc].filter(Boolean).join(". "));
    drawLegend();
    drawTable();
    svg.replaceChildren();
    hideTip();
    if (onKey) svg.removeEventListener("keydown", onKey);
    ({ line: drawLine, bars: drawBars, hbars: drawHBars, waterfall: drawWaterfall })[spec.type]();
  }

  /* ---------------- line */
  function drawLine() {
    const H = spec.height || 260,
      xs = spec.x.values;
    const all = spec.series.flatMap((s) => s.values.filter((v) => v != null));
    let lo = spec.y.min ?? Math.min(...all),
      hi = spec.y.max ?? Math.max(...all);
    if (spec.y.zero !== false && lo > 0 && spec.y.min == null) lo = 0;
    const nt = niceTicks(lo, hi, spec.y.ticks || 5);
    lo = nt.lo;
    hi = nt.hi;
    const anns = (spec.annotations || [])
      .filter((a) => a.x >= xs[0] && a.x <= xs[xs.length - 1])
      .sort((p, q) => p.x - q.x);
    const ml = Math.max(...nt.ticks.map((t) => textWidth(spec.y.format(t)))) + 10,
      mr = spec.endLabels ? 74 : 12,
      mb = 26;
    // annotation labels that would collide drop to a second row
    const W0 = width,
      x0a = xs[0],
      x1a = xs[xs.length - 1],
      Xa = (v) => ml + (x1a === x0a ? 0 : ((v - x0a) / (x1a - x0a)) * (W0 - ml - mr));
    const ends = [];
    let rowsUsed = 0;
    for (const a of anns) {
      const w = textWidth(a.label, 11) + 10,
        cx = Xa(a.x);
      a._anchor = cx > W0 - 90 ? "end" : cx < ml + 60 ? "start" : "middle";
      const lo = a._anchor === "end" ? cx - w : a._anchor === "start" ? cx : cx - w / 2;
      let row = 0;
      while (row < ends.length && lo < ends[row]) row++;
      ends[row] = lo + w;
      a._row = row;
      rowsUsed = Math.max(rowsUsed, row + 1);
    }
    const mt = anns.length ? 10 + 13 * rowsUsed : 8;
    const W = width,
      pw = W - ml - mr,
      ph = H - mt - mb;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("height", H);
    const x0 = xs[0],
      x1 = xs[xs.length - 1];
    const X = (v) => ml + (x1 === x0 ? pw / 2 : ((v - x0) / (x1 - x0)) * pw),
      Y = (v) => mt + ph - ((v - lo) / (hi - lo)) * ph;
    const grid = svgEl("g", { class: "grid" }, svg),
      axis = svgEl("g", { class: "axis" }, svg);
    for (const t of nt.ticks) {
      svgEl("line", { x1: ml, x2: W - mr, y1: Y(t), y2: Y(t) }, grid);
      const tx = svgEl("text", { x: ml - 8, y: Y(t) + 4, "text-anchor": "end" }, axis);
      tx.textContent = spec.y.format(t);
    }
    if (lo < 0 && hi > 0)
      svgEl("line", { class: "base", x1: ml, x2: W - mr, y1: Y(0), y2: Y(0) }, axis);
    svgEl("line", { class: "base", x1: ml, x2: W - mr, y1: mt + ph, y2: mt + ph }, axis);
    const xt =
      spec.x.ticks ||
      niceTicks(x0, x1, Math.max(2, Math.floor(pw / 90))).ticks.filter((v) => v >= x0 && v <= x1);
    for (const v of xt) {
      const tx = svgEl("text", { x: X(v), y: H - 8, "text-anchor": "middle" }, axis);
      tx.textContent = spec.x.format ? spec.x.format(v) : v;
    }
    for (const b of spec.bands || []) {
      const r = svgEl(
        "rect",
        {
          x: X(b.from),
          y: mt,
          width: Math.max(0, X(b.to) - X(b.from)),
          height: ph,
          fill: b.color || "rgba(184,67,42,.09)",
        },
        svg,
      );
      if (b.label) {
        const t = svgEl("text", { x: X(b.from) + 6, y: mt + 14, class: "label" }, svg);
        t.textContent = b.label;
      }
      r.setAttribute("aria-hidden", "true");
    }
    const ser = svgEl("g", { class: "series" }, svg);
    for (const s of spec.series) {
      let d = "",
        pen = false,
        area = "",
        startX = null,
        lastX = null;
      s.values.forEach((v, i) => {
        if (v == null) {
          pen = false;
          return;
        }
        const px = X(xs[i]).toFixed(1),
          py = Y(v).toFixed(1);
        if (s.step && pen) d += `H${px}`;
        d += `${pen ? "L" : "M"}${px} ${py}`;
        pen = true;
        if (startX == null) startX = px;
        lastX = px;
      });
      if (s.area && startX != null)
        area = `${d}L${lastX} ${Y(Math.max(lo, 0))}L${startX} ${Y(Math.max(lo, 0))}Z`;
      if (area)
        svgEl(
          "path",
          { class: "area", d: area, fill: s.color, "fill-opacity": s.areaOpacity || 0.1 },
          ser,
        );
      svgEl(
        "path",
        { class: "line", d, stroke: s.color, "stroke-dasharray": s.dash ? "5 4" : null },
        ser,
      );
    }
    if (spec.endLabels) {
      const ends = spec.series
        .map((s) => {
          let i = s.values.length - 1;
          while (i >= 0 && s.values[i] == null) i--;
          return { s, i, y: Y(s.values[i]) };
        })
        .sort((a, b) => a.y - b.y);
      for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 14) ends[k].skip = true;
      for (const e of ends) {
        if (e.i < 0) continue;
        svgEl("circle", { class: "marker", cx: X(xs[e.i]), cy: e.y, r: 4, fill: e.s.color }, ser);
        if (e.skip) continue;
        const t = svgEl("text", { x: X(xs[e.i]) + 8, y: e.y + 4, class: "label" }, svg);
        t.textContent = (e.s.format || spec.y.format)(e.s.values[e.i]);
      }
    }
    const ann = svgEl("g", { class: "ann" }, svg);
    for (const a of anns) {
      const ty = mt - 6 - (rowsUsed - 1 - a._row) * 13;
      svgEl("line", { x1: X(a.x), x2: X(a.x), y1: ty + 3, y2: mt + ph }, ann);
      const t = svgEl("text", { x: X(a.x), y: ty, "text-anchor": a._anchor }, ann);
      t.textContent = a.label;
    }
    // crosshair
    const cross = svgEl("line", { class: "cross", y1: mt, y2: mt + ph, visibility: "hidden" }, svg);
    const dots = spec.series.map((s) =>
      svgEl("circle", { class: "marker", r: 4, fill: s.color, visibility: "hidden" }, svg),
    );
    const hit = svgEl("rect", { class: "hit", x: ml, y: mt, width: pw, height: ph }, svg);
    const at = (i) => {
      focusIndex = i;
      const cx = X(xs[i]);
      cross.setAttribute("x1", cx);
      cross.setAttribute("x2", cx);
      cross.setAttribute("visibility", "visible");
      const rows = [];
      spec.series.forEach((s, k) => {
        const v = s.values[i];
        if (v == null) {
          dots[k].setAttribute("visibility", "hidden");
          return;
        }
        dots[k].setAttribute("cx", cx);
        dots[k].setAttribute("cy", Y(v));
        dots[k].setAttribute("visibility", "visible");
        rows.push({ color: s.color, value: (s.format || spec.y.format)(v), label: s.label });
      });
      const top = Math.min(
        ...spec.series.map((s) => (s.values[i] == null ? Infinity : Y(s.values[i]))),
      );
      const [px, py] = toFig(cx, Number.isFinite(top) ? top : mt, W);
      showTip(px, py, spec.x.format ? spec.x.format(xs[i], i) : String(xs[i]), rows);
    };
    const clear = () => {
      cross.setAttribute("visibility", "hidden");
      dots.forEach((d) => d.setAttribute("visibility", "hidden"));
      hideTip();
    };
    const nearest = (evt) => {
      const r = svg.getBoundingClientRect(),
        vx = ((evt.clientX - r.left) * W) / r.width;
      let best = 0,
        bd = Infinity;
      xs.forEach((v, i) => {
        const dd = Math.abs(X(v) - vx);
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      });
      return best;
    };
    hit.addEventListener("pointermove", (e) => at(nearest(e)));
    hit.addEventListener("pointerdown", (e) => at(nearest(e)));
    hit.addEventListener("pointerleave", clear);
    onKey = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Escape") return;
      e.preventDefault();
      if (e.key === "Escape") {
        focusIndex = null;
        return clear();
      }
      const i =
        focusIndex == null
          ? xs.length - 1
          : Math.max(0, Math.min(xs.length - 1, focusIndex + (e.key === "ArrowRight" ? 1 : -1)));
      at(i);
    };
    svg.addEventListener("keydown", onKey);
    svg.addEventListener("blur", clear, { once: true });
  }

  /* ---------------- vertical bars (columns), grouped or stacked */
  function drawBars() {
    const H = spec.height || 260,
      cats = spec.x.values,
      n = cats.length;
    const totals = cats.map((_, i) =>
      spec.stacked
        ? spec.series.reduce((s, se) => s + Math.max(0, se.values[i] || 0), 0)
        : Math.max(...spec.series.map((se) => se.values[i] || 0)),
    );
    const mins = cats.map((_, i) => Math.min(0, ...spec.series.map((se) => se.values[i] || 0)));
    const nt = niceTicks(
      spec.y.min ?? Math.min(0, ...mins),
      spec.y.max ?? Math.max(...totals),
      spec.y.ticks || 5,
    );
    const lo = nt.lo,
      hi = nt.hi;
    const ml = Math.max(...nt.ticks.map((t) => textWidth(spec.y.format(t)))) + 10,
      mr = 8,
      mt = spec.labels === "total" ? 18 : 8,
      mb = 26;
    const W = width,
      pw = W - ml - mr,
      ph = H - mt - mb;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("height", H);
    const band = pw / n,
      Y = (v) => mt + ph - ((v - lo) / (hi - lo)) * ph;
    const grid = svgEl("g", { class: "grid" }, svg),
      axis = svgEl("g", { class: "axis" }, svg);
    for (const t of nt.ticks) {
      svgEl("line", { x1: ml, x2: W - mr, y1: Y(t), y2: Y(t) }, grid);
      const tx = svgEl("text", { x: ml - 8, y: Y(t) + 4, "text-anchor": "end" }, axis);
      tx.textContent = spec.y.format(t);
    }
    svgEl("line", { class: "base", x1: ml, x2: W - mr, y1: Y(0), y2: Y(0) }, axis);
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(pw / 46))));
    cats.forEach((c, i) => {
      if (i % every && i !== n - 1) return;
      const tx = svgEl(
        "text",
        { x: ml + band * (i + 0.5), y: H - 8, "text-anchor": "middle" },
        axis,
      );
      tx.textContent = spec.x.format ? spec.x.format(c, i) : c;
    });
    const g = svgEl("g", { class: "series" }, svg);
    const groups = spec.stacked ? 1 : spec.series.length;
    const bw = Math.max(2, Math.min(24, (band * 0.72 - (groups - 1) * 2) / groups));
    cats.forEach((c, i) => {
      const cx = ml + band * (i + 0.5);
      if (spec.stacked) {
        let acc = 0;
        const segs = spec.series
          .map((s) => ({ s, v: Math.max(0, s.values[i] || 0) }))
          .filter((o) => o.v > 0);
        segs.forEach((o, k) => {
          const y1 = Y(acc + o.v),
            y0 = Y(acc),
            gap = k > 0 ? 2 : 0;
          const top = k === segs.length - 1;
          svgEl(
            "path",
            {
              class: "bar",
              d: barPath(cx - bw / 2, y1, bw, Math.max(0, y0 - y1 - gap), { roundEnd: top }),
              fill: o.s.color,
            },
            g,
          );
          acc += o.v;
        });
        if (spec.labels === "total" && segs.length) {
          const t = svgEl(
            "text",
            { x: cx, y: Y(acc) - 5, "text-anchor": "middle", class: "label" },
            svg,
          );
          t.textContent = (spec.labelFormat || spec.y.format)(acc);
        }
      } else {
        spec.series.forEach((s, k) => {
          const v = s.values[i] || 0,
            x = cx - (groups * bw + (groups - 1) * 2) / 2 + k * (bw + 2);
          const y = v >= 0 ? Y(v) : Y(0),
            hgt = Math.abs(Y(v) - Y(0));
          svgEl(
            "path",
            { class: "bar", d: barPath(x, y, bw, hgt, { negative: v < 0 }), fill: s.color },
            g,
          );
        });
      }
      const hit = svgEl(
        "rect",
        { class: "hit", x: ml + band * i, y: mt, width: band, height: ph },
        svg,
      );
      const show = () => {
        const rows = spec.series.map((s) => ({
          color: s.color,
          value: (s.format || spec.y.format)(s.values[i] || 0),
          label: s.label,
        }));
        if (spec.stacked && spec.series.length > 1)
          rows.push({ color: "transparent", value: spec.y.format(totals[i]), label: "Total" });
        const [px, py] = toFig(cx, Y(totals[i]), W);
        showTip(px, py, spec.x.format ? spec.x.format(c, i) : String(c), rows);
      };
      hit.addEventListener("pointermove", show);
      hit.addEventListener("pointerdown", show);
      hit.addEventListener("pointerleave", hideTip);
    });
  }

  /* ---------------- horizontal bars (categories down the side) */
  function drawHBars() {
    const cats = spec.x.values,
      n = cats.length,
      rowH = spec.rowHeight || 34;
    // category labels get up to 42% of the width (half on phones); longer ones wrap onto two lines
    const labelW = Math.min(
      width * (width < 520 ? 0.5 : 0.42),
      Math.max(...cats.map((c) => textWidth(c, 12.5))) + 14,
    );
    const totals = cats.map((_, i) =>
      spec.stacked
        ? spec.series.reduce((s, se) => s + (se.values[i] || 0), 0)
        : Math.max(...spec.series.map((se) => se.values[i] || 0)),
    );
    const mins = cats.map((_, i) => Math.min(0, ...spec.series.map((se) => se.values[i] || 0)));
    const valueW = spec.labels === "none" ? 8 : 70;
    // fewer ticks when the plot is narrow (phones), so axis labels never run together
    const room = Math.max(2, Math.floor((width - labelW - valueW) / 58));
    const nt = niceTicks(
      spec.y.min ?? Math.min(0, ...mins),
      spec.y.max ?? Math.max(...totals, ...(spec.thresholds || []).map((t) => t.value)),
      Math.min(spec.y.ticks || 4, room),
    );
    const lo = nt.lo,
      hi = nt.hi;
    const groups = spec.stacked ? 1 : spec.series.length;
    const H =
      (spec.thresholds && spec.thresholds.length ? 24 : 10) +
      n * rowH * Math.max(1, groups * 0.62) +
      28;
    const mt = spec.thresholds && spec.thresholds.length ? 22 : 8;
    const W = width,
      ml = labelW,
      mr = valueW,
      pw = W - ml - mr,
      ph = H - mt - 28;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("height", H);
    const X = (v) => ml + ((v - lo) / (hi - lo)) * pw,
      band = ph / n;
    const grid = svgEl("g", { class: "grid" }, svg),
      axis = svgEl("g", { class: "axis" }, svg);
    for (const t of nt.ticks) {
      svgEl("line", { x1: X(t), x2: X(t), y1: mt, y2: mt + ph }, grid);
      const tx = svgEl("text", { x: X(t), y: H - 8, "text-anchor": "middle" }, axis);
      tx.textContent = spec.y.format(t);
    }
    svgEl("line", { class: "base", x1: X(0), x2: X(0), y1: mt, y2: mt + ph }, axis);
    const g = svgEl("g", { class: "series" }, svg);
    const bh = Math.max(4, Math.min(24, (band * 0.66 - (groups - 1) * 2) / groups));
    cats.forEach((c, i) => {
      const cy = mt + band * (i + 0.5);
      const lab = svgEl("text", { x: 0, y: cy + 4, class: "label" }, svg);
      lab.setAttribute("style", "font-weight:600;fill:var(--ink)");
      const lines = wrapLabel(String(c), labelW - 12);
      if (lines.length === 1) lab.textContent = c;
      else
        lines.forEach((ln, j) => {
          const ts = svgEl("tspan", { x: 0, dy: j ? "1.15em" : "-0.5em" }, lab);
          ts.textContent = ln;
        });
      if (spec.stacked) {
        let acc = 0;
        const segs = spec.series.map((s) => ({ s, v: s.values[i] || 0 })).filter((o) => o.v > 0);
        segs.forEach((o, k) => {
          const x0 = X(acc) + (k > 0 ? 2 : 0),
            x1 = X(acc + o.v);
          svgEl(
            "path",
            {
              class: "bar",
              d: barPath(x0, cy - bh / 2, Math.max(0, x1 - x0), bh, {
                horiz: true,
                roundEnd: k === segs.length - 1,
              }),
              fill: o.s.color,
            },
            g,
          );
          acc += o.v;
        });
        if (spec.labels !== "none") {
          const t = svgEl("text", { x: X(acc) + 6, y: cy + 4, class: "label" }, svg);
          t.textContent = (spec.labelFormat || spec.y.format)(acc);
        }
      } else {
        spec.series.forEach((s, k) => {
          const v = s.values[i] || 0,
            y = cy - (groups * bh + (groups - 1) * 2) / 2 + k * (bh + 2);
          const xa = Math.min(X(0), X(v)),
            w = Math.abs(X(v) - X(0));
          svgEl(
            "path",
            {
              class: "bar",
              d: barPath(xa, y, w, bh, { horiz: true, negative: v < 0 }),
              fill: s.colorFor ? s.colorFor(v, i) : s.color,
            },
            g,
          );
          if (spec.labels !== "none") {
            const t = svgEl(
              "text",
              {
                x: v >= 0 ? X(v) + 6 : X(v) - 6,
                y: y + bh / 2 + 4,
                class: "label",
                "text-anchor": v >= 0 ? "start" : "end",
              },
              svg,
            );
            t.textContent = (s.format || spec.y.format)(v);
          }
        });
      }
      const hit = svgEl(
        "rect",
        { class: "hit", x: 0, y: mt + band * i, width: W, height: band },
        svg,
      );
      const show = () => {
        const rows = spec.series.map((s) => ({
          color: s.color,
          value: (s.format || spec.y.format)(s.values[i] || 0),
          label: s.label,
        }));
        const [px, py] = toFig(X(totals[i]), cy, W);
        showTip(px, py, c, rows);
      };
      hit.addEventListener("pointermove", show);
      hit.addEventListener("pointerdown", show);
      hit.addEventListener("pointerleave", hideTip);
    });
    for (const t of spec.thresholds || []) {
      svgEl(
        "line",
        {
          x1: X(t.value),
          x2: X(t.value),
          y1: mt - 4,
          y2: mt + ph,
          stroke: "var(--ink-2)",
          "stroke-width": 1,
        },
        svg,
      );
      const tx = svgEl(
        "text",
        { x: X(t.value), y: mt - 8, class: "label", "text-anchor": "middle" },
        svg,
      );
      tx.textContent = t.label;
    }
  }

  /* ---------------- waterfall (horizontal): gross at the top, each deduction floating, the result at the bottom */
  function drawWaterfall() {
    const steps = spec.steps,
      n = steps.length,
      rowH = 30;
    const labelW = Math.min(
      width * 0.44,
      Math.max(...steps.map((s) => textWidth(s.label, 12.5))) + 14,
    );
    let run = 0;
    const spans = steps.map((s) => {
      if (s.kind === "start" || s.kind === "end") {
        run = s.value;
        return [0, s.value];
      }
      const a = run;
      run += s.value;
      return [Math.min(a, run), Math.max(a, run)];
    });
    const hi = Math.max(...spans.map((s) => s[1]));
    const H = 8 + n * rowH + 28,
      W = width,
      ml = labelW,
      mr = 78,
      mt = 6,
      pw = W - ml - mr;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("height", H);
    const nt = niceTicks(0, hi, 4),
      X = (v) => ml + (v / nt.hi) * pw;
    const grid = svgEl("g", { class: "grid" }, svg),
      axis = svgEl("g", { class: "axis" }, svg);
    for (const t of nt.ticks) {
      svgEl("line", { x1: X(t), x2: X(t), y1: mt, y2: mt + n * rowH }, grid);
      const tx = svgEl("text", { x: X(t), y: H - 8, "text-anchor": "middle" }, axis);
      tx.textContent = spec.y.format(t);
    }
    const g = svgEl("g", { class: "series" }, svg);
    steps.forEach((s, i) => {
      const cy = mt + rowH * (i + 0.5),
        [a, b] = spans[i],
        bh = 18;
      const lab = svgEl("text", { x: 0, y: cy + 4, class: "label" }, svg);
      lab.textContent = s.label;
      lab.setAttribute("style", `font-weight:${s.kind ? 700 : 500};fill:var(--ink)`);
      if (b - a > 0)
        svgEl(
          "path",
          {
            class: "bar",
            d: barPath(X(a), cy - bh / 2, Math.max(1, X(b) - X(a)), bh, { horiz: true }),
            fill: s.color,
          },
          g,
        );
      if (i < n - 1 && s.kind !== "end") {
        const nx = s.kind === "start" ? X(s.value) : X(s.value < 0 ? a : b);
        svgEl(
          "line",
          {
            x1: nx,
            x2: nx,
            y1: cy + bh / 2,
            y2: cy + rowH - bh / 2,
            stroke: "var(--rule)",
            "stroke-width": 1,
          },
          svg,
        );
      }
      const t = svgEl("text", { x: X(b) + 6, y: cy + 4, class: "label" }, svg);
      t.textContent = (s.kind ? "" : "−") + spec.y.format(Math.abs(s.value));
      const hit = svgEl(
        "rect",
        { class: "hit", x: 0, y: cy - rowH / 2, width: W, height: rowH },
        svg,
      );
      const show = () => {
        const [px, py] = toFig(X(b), cy, W);
        showTip(px, py, s.label, [
          {
            color: s.color,
            value: spec.y.format(s.value),
            label:
              s.kind === "end"
                ? "What lands in your account"
                : s.kind === "start"
                  ? "Before anything comes out"
                  : "Comes out of each check",
          },
        ]);
      };
      hit.addEventListener("pointermove", show);
      hit.addEventListener("pointerdown", show);
      hit.addEventListener("pointerleave", hideTip);
    });
  }

  render();
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (Math.abs(fig.clientWidth - 28 - width) > 2) render();
    });
  });
  ro.observe(fig);
  return {
    update(next) {
      spec = next;
      render();
    },
    figure: fig,
  };
}
