/* OVERTONE · shell helpers shared by every view (modal, navigation) */
import { $ } from './util.js';

export const go = id => { location.hash = id; };

const modalClose = new Set();
export function openModal(title, html) {
  const d = $('#modal');
  $('#mTitle').textContent = title; $('#mBody').innerHTML = html;
  if (!d.open) d.showModal();
  d.querySelector('.mwin').scrollTop = 0;
}
export function closeModal() { const d = $('#modal'); if (d.open) d.close(); }
export function onModalClose(fn) { modalClose.add(fn); }
$('#modal').addEventListener('close', () => modalClose.forEach(fn => fn()));
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

