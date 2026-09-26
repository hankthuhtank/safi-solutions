/* VoltVisual — number the page like a drawing set: zone markers along the top of each sheet and a title block. */
(() => {
  const sheets = [
    ['#machine', 'Machine map'], ['#signalLesson', 'First signal · 4–20 mA'], ['#paths', 'Learning paths'], ['#lab', 'Visual lab'],
    ['#brandDecoder', 'Brand decoder'], ['#drawings', 'Drawings + symbols'], ['#library', 'Term library'], ['#troubleshoot', 'Troubleshooting']
  ].filter(([s]) => document.querySelector(s)).sort((a, b) => document.querySelector(a[0]).compareDocumentPosition(document.querySelector(b[0])) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  sheets.forEach(([sel, title], i) => {
    const el = document.querySelector(sel); el.classList.add('sheet');
    el.insertAdjacentHTML('beforeend', `<div class="sheet-zones" aria-hidden="true">${'12345678'.split('').map(n => `<span>${n}</span>`).join('')}</div><div class="tblock" aria-hidden="true"><span>VOLTVISUAL · FIELD GUIDE</span><b>${title}</b><em>SHEET ${String(i + 1).padStart(2, '0')} OF ${String(sheets.length).padStart(2, '0')}</em><i>DWG VV-${String(i + 1).padStart(3, '0')}</i></div>`);
  });
})();
