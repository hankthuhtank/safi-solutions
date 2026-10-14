(function(){
  const control=window.SAFI_STORE_CONTROL;
  if(!control||!control.products)return;
  const freeWorker=String(control.freeDownloadWorker||"").replace(/\/+$/,'');

  function showInstallNotice(onContinue){
    let dialog=document.getElementById('install-notice');
    if(!dialog){
      dialog=document.createElement('dialog');
      dialog.id='install-notice';
      dialog.className='install-notice';
      dialog.innerHTML='<div class="install-notice-card"><span class="install-notice-kicker">WINDOWS INSTALL</span><h2>One quick note</h2><p>Windows may show <strong>“Windows protected your PC.”</strong> Choose <strong>More info → Run anyway</strong>.</p><div class="install-notice-actions"><button type="button" class="button secondary" data-install-cancel>Cancel</button><button type="button" class="button" data-install-continue>Continue to download</button></div></div>';
      document.body.appendChild(dialog);
      dialog.querySelector('[data-install-cancel]').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    }
    const go=dialog.querySelector('[data-install-continue]');
    const handler=()=>{go.removeEventListener('click',handler);dialog.close();onContinue();};
    go.addEventListener('click',handler);
    dialog.showModal();
  }

  document.querySelectorAll('[data-free-product]').forEach(link=>{
    const key=link.dataset.freeProduct,item=control.products[key];
    if(!item||!item.free)return;
    if(!control.freeDownloadsEnabled||!freeWorker||item.downloadEnabled===false){
      link.href='#';link.setAttribute('aria-disabled','true');link.classList.add('is-disabled');link.textContent='Free download setup pending';link.addEventListener('click',e=>e.preventDefault());return;
    }
    link.href='#';link.addEventListener('click',e=>{
      e.preventDefault();
      showInstallNotice(async()=>{
        const original=link.textContent;link.textContent='Preparing download…';link.setAttribute('aria-busy','true');
        try{const res=await fetch(freeWorker+'/api/free-download?product='+encodeURIComponent(key),{headers:{'Accept':'application/json'}});let data=null;try{data=await res.json()}catch(_){ }if(!res.ok||!data?.url)throw new Error(data?.error||'Free download is unavailable right now.');location.href=data.url;}catch(err){alert(err.message||'Free download is unavailable right now.');link.textContent=original;link.removeAttribute('aria-busy');}
      });
    });
  });

  const lightbox=document.getElementById('product-lightbox');
  const lightboxImg=lightbox&&lightbox.querySelector('[data-product-lightbox-image]');
  const lightboxTitle=lightbox&&lightbox.querySelector('#product-lightbox-title');
  const close=lightbox&&lightbox.querySelector('[data-product-lightbox-close]');
  if(lightbox&&lightboxImg){
    const open=img=>{lightboxImg.src=img.currentSrc||img.src;lightboxImg.alt=img.alt||'Product preview';if(lightboxTitle)lightboxTitle.textContent=img.alt||'Product preview';lightbox.showModal()};
    document.querySelectorAll('.product-shot img').forEach(img=>{img.tabIndex=0;img.setAttribute('role','button');img.addEventListener('click',()=>open(img));img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(img)}})});
    close?.addEventListener('click',()=>lightbox.close());lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});
  }
})();

