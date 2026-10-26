'use strict';
const form = document.getElementById('unlock-form');
const input = document.getElementById('key');
const button = document.getElementById('unlock');
const status = document.getElementById('status');
let frame;
let objectUrl;
const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled) return;
  const password = input.value.trim();
  if (!password) return;
  if (!crypto.subtle || typeof DecompressionStream === 'undefined') {
    status.textContent = 'Open this page in a current browser over HTTPS.';
    return;
  }
  button.disabled = true;
  button.textContent = 'Opening…';
  status.textContent = '';
  try {
    const response = await fetch('vault.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('download');
    const vault = await response.json();
    if (vault.version !== 1 || vault.iterations !== 600000) throw new Error('format');
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: bytes(vault.salt), iterations: vault.iterations },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    let compressed;
    try {
      compressed = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: bytes(vault.iv), additionalData: new TextEncoder().encode('private-field-guide-v1') },
        key,
        bytes(vault.ciphertext.join(''))
      );
    } catch {
      status.textContent = 'That key did not unlock the guide. Check it and try again.';
      return;
    }
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const base = new URL('./', location.href).href;
    const html = (await new Response(stream).text()).split('__BASE__').join(base);
    input.value = '';
    objectUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    frame = document.createElement('iframe');
    frame.title = 'Private field guide';
    frame.src = objectUrl;
    document.body.append(frame);
    document.getElementById('gate').hidden = true;
    frame.focus();
  } catch {
    status.textContent = 'Could not open the guide. Check your connection and try again.';
  } finally {
    button.disabled = false;
    button.textContent = 'Open guide';
  }
});
window.addEventListener('message', event => {
  if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin || event.data?.type !== 'ffr-lock') return;
  frame.remove();
  frame = undefined;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = undefined;
  document.getElementById('gate').hidden = false;
  input.focus();
});
