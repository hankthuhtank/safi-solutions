/* CarDesk — representative 3D vehicle. The decoded VIN's fuel type and drive type configure the model
   (gasoline / hybrid / electric, FWD / RWD / AWD); the layer buttons highlight powertrain, safety or the built body. */
import { mountMachine } from '../assets/js/machine3d.js';

const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const GROUPS = {
  power: ['engine', 'airfuel', 'cooling', 'lubrication', 'transmission', 'drivetrain', 'exhaust', 'hybridev'],
  safety: ['brakes', 'structure', 'steering', 'suspension', 'wheels'],
  identity: null
};
const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
let cfg = { mode: 'gas', drive: 'fwd', label: 'Representative model · configured from the VIN once decoded' };

function fromVin(v) {
  const elec = String(v.ElectrificationLevel || ''), fuel = `${v.FuelTypePrimary || ''} ${v.FuelTypeSecondary || ''}`, dt = String(v.DriveType || '');
  const mode = /BEV/i.test(elec) || /^\s*electric\s*$/i.test(v.FuelTypePrimary || '') ? 'ev' : /HEV|PHEV|hybrid/i.test(elec) || /electric/i.test(v.FuelTypeSecondary || '') ? 'hybrid' : 'gas';
  const drive = /AWD|4WD|4x4|all/i.test(dt) ? 'awd' : /RWD|rear/i.test(dt) || /4x2/i.test(dt) ? 'rwd' : 'fwd';
  const words = { gas: 'combustion', hybrid: 'hybrid', ev: 'battery-electric' }[mode];
  const label = `Representative ${words} layout · ${drive.toUpperCase()}${dt ? '' : ' (drive type not reported)'} · component placement varies by vehicle`;
  return { mode, drive, label, fuel };
}
function setLayer(m, key) {
  if (!m) return;
  if (key === 'identity') { m.setXray(false); m.focus(null); return; }
  m.setXray(true); m.focus(GROUPS[key] || null, { view: 'overview' });
}
async function mount(host, opts) {
  if (!host || !webgl) { host?.classList.add('no-webgl'); return null; }
  try { const m = await mountMachine(host, { labels: false, grid: false, ...opts, mode: cfg.mode, drive: cfg.drive }); host.classList.add('is-ready'); return m; }
  catch (e) { console.warn('CarDesk 3D unavailable', e); host.classList.add('no-webgl'); return null; }
}

/* hero */
const heroHost = $('#cdMachine');
let hero = null, heroLayer = null;
const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
idle(async () => { hero = await mount(heroHost, { autoRotate: true }); if (hero && heroLayer) setLayer(hero, heroLayer); });
$$('.cd-modes .hero-system').forEach(b => b.addEventListener('click', () => {
  const key = b.dataset.mode, on = heroLayer !== key;
  heroLayer = on ? key : null;
  $$('.cd-modes .hero-system').forEach(x => x.setAttribute('aria-pressed', String(on && x === b)));
  if (on) setLayer(hero, key); else { hero?.setXray(true); hero?.focus(null); }
}));

/* architecture scan in the workspace */
const scanHost = $('#cdScan');
let scan = null, scanLayer = 'power';
if (scanHost) {
  const io = new IntersectionObserver(async es => {
    if (!es[0].isIntersecting || scan) return; io.disconnect();
    scan = await mount(scanHost, { autoRotate: true });
    setLayer(scan, scanLayer);
  }, { rootMargin: '200px 0px' });
  io.observe(scanHost);
  $('#scanTabs')?.addEventListener('click', e => { const b = e.target.closest('button[data-mode]'); if (!b) return; scanLayer = b.dataset.mode; setLayer(scan, scanLayer); });
}

/* decoded vehicle → configure both models */
document.addEventListener('cd:vehicle', e => {
  cfg = fromVin(e.detail || {});
  for (const m of [hero, scan]) { if (!m) continue; m.setMode(cfg.mode); m.setDrive(cfg.drive); }
  $$('.cd-note').forEach(n => { if (!n.classList.contains('cd-scan-note')) n.textContent = cfg.label; });
  const sn = $('.cd-scan-note'); if (sn) sn.textContent = cfg.label;
});
