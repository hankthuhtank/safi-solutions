// Helpers shared by the sport plans.
// Original sections are addressed by index (0 = "Start here"). Rows can be edited, added, removed or flagged.
export function rowsOf(sec, { drop = [], edit = {}, add = [], flag = {}, only } = {}) {
  let rows = sec.rows.map(r => ({ term: r.term, desc: edit[r.term] ?? r.desc }));
  if (only) rows = rows.filter(r => only.includes(r.term));
  rows = rows.filter(r => !drop.includes(r.term));
  for (const r of add) {
    if (r.after) { const i = rows.findIndex(x => x.term === r.after); rows.splice(i + 1, 0, { term: r.term, desc: r.desc, flag: r.flag }); }
    else rows.push({ term: r.term, desc: r.desc, flag: r.flag });
  }
  for (const r of rows) if (flag[r.term]) r.flag = flag[r.term];
  return rows;
}
export const viz = (id, title, kicker, caption) => ({ type: 'viz', id, title, kicker, caption });
export const terms = (rows, heading, sub) => ({ type: 'terms', rows, heading, sub });
export const bullets = (items, heading, sub) => ({ type: 'bullets', items, heading, sub });
export const steps = (items, heading, sub) => ({ type: 'steps', items, heading, sub });
export const note = text => ({ type: 'note', text });
export const tbl = (headers, rows, heading, sub) => ({ type: 'table', table: { headers, rows }, heading, sub });
export function glossary(orig, { add = [], edit = {}, drop = [] } = {}) {
  const g = orig.glossary.filter(x => !drop.includes(x.term)).map(x => ({ term: x.term, desc: edit[x.term] ?? x.desc }));
  for (const a of add) if (!g.some(x => x.term.toLowerCase() === a.term.toLowerCase())) g.push(a);
  return g;
}
