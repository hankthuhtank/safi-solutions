/* Moneywise: number and date formatting. Pure, so the build script can use it too. */

const nf = (min, max) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: min, maximumFractionDigits: max });
const N0 = nf(0, 0),
  N2 = nf(2, 2),
  N1 = nf(1, 1);

// $1,264 or $1,264.14 (cents: true). Negative amounts get a real minus sign.
export function money(x, { cents = false, sign = false } = {}) {
  if (x == null || !Number.isFinite(x)) return x === Infinity ? "never" : "\u2013";
  const s = (cents ? N2 : N0).format(Math.abs(cents ? x : Math.round(x)));
  const neg = x < 0 && (cents ? Math.abs(x) >= 0.005 : Math.round(Math.abs(x)) > 0);
  return (neg ? "−" : sign && x > 0 ? "+" : "") + "$" + s;
}
// Compact for chart ticks: $950, $12K, $1.2M
export function moneyShort(x) {
  const a = Math.abs(x),
    s = x < 0 ? "−" : "";
  if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return s + "$" + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K";
  return s + "$" + Math.round(a);
}
// Plain number with commas, fixed decimals (for the tape)
export const num = (x, d = 2) => (Number.isFinite(x) ? nf(d, d).format(x) : "\u2013");
// 0.0725 -> 7.25%   (digits default 2, trailing zeros trimmed unless keep)
export function pct(x, digits = 2, keep = false) {
  if (x == null || !Number.isFinite(x)) return "\u2013";
  let s = (x * 100).toFixed(digits);
  if (!keep && s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s.replace("-", "−") + "%";
}
// Percent value already in percent units (FRED): 7.4 -> 7.40%
export const pctPts = (x, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) + "%" : "\u2013");
export const int = (x) => N0.format(Math.round(x));
export const one = (x) => N1.format(x);

// 67 -> "5 yrs 7 mos"
export function duration(months) {
  if (!Number.isFinite(months)) return "never";
  const m = Math.round(months),
    y = Math.floor(m / 12),
    r = m % 12;
  const ys = y ? `${y} yr${y === 1 ? "" : "s"}` : "",
    ms = r ? `${r} mo${r === 1 ? "" : "s"}` : "";
  return [ys, ms].filter(Boolean).join(" ") || "0 mos";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
// '2026-10-08' -> 'Oct 8, 2026'; monthly series ('2026-08-01', monthly) -> 'Aug 2026'
export function asOf(iso, freq) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (freq === "monthly") return `${MONTHS[m - 1]} ${y}`;
  if (freq === "quarterly") return `Q${Math.floor((m - 1) / 3) + 1} ${y}`;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
export const monthName = (m, long = false) => (long ? MONTHS_LONG : MONTHS)[m];
// Calendar month k months after a start date ('Nov 2026' style)
export function monthAfter(k, start = new Date()) {
  const d = new Date(start.getFullYear(), start.getMonth() + k, 1);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
