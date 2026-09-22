(function(){
  const control=window.SAFI_STORE_CONTROL;
  if(!control||!control.products)return;
  const launchMode=control.pricingMode!=="regular";
  const checkoutWorker=String(control.checkoutWorker||"").replace(/\/+$/,'');
  const freeWorker=String(control.freeDownloadWorker||"").replace(/\/+$/,'');
  const money=v=>'$'+Number(v).toFixed(Number(v)%1?2:0);

  async function startCheckout(product,trigger){
    if(!control.salesEnabled||!checkoutWorker)return;
    const original=trigger.textContent;
    try{
      trigger.setAttribute('aria-busy','true');trigger.textContent='Opening checkout…';
      const res=await fetch(checkoutWorker+'/api/checkout',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({product,pricing:launchMode?'launch':'regular'})});
      let data=null;try{data=await res.json()}catch(_){ }
      if(!res.ok||!data||!data.url)throw new Error(data&&data.error?data.error:'Checkout is not available right now.');
      location.href=data.url;
    }catch(err){
      const fallback=window.SAFI_STORE?.products?.[product];
      const fallbackUrl=launchMode?fallback?.launchUrl:fallback?.regularUrl;
      if(fallbackUrl){ location.href=fallbackUrl; return; }
      alert(err&&err.message?err.message:'Checkout is not available right now.');
      trigger.removeAttribute('aria-busy');trigger.textContent=original;
    }
  }

  document.querySelectorAll('[data-stripe-product]').forEach(link=>{
    const key=link.dataset.stripeProduct,item=control.products[key];
    if(!item||item.free)return;
    const current=launchMode?item.launchPrice:item.regularPrice;
    const shelf=link.closest('.product-shelf');
    if(shelf){
      const price=shelf.querySelector('.product-price');
      if(price){const del=price.querySelector('del'),strong=price.querySelector('strong'),small=price.querySelector('small');if(del){del.textContent=money(item.regularPrice);del.hidden=!launchMode}if(strong)strong.textContent=money(current);if(small)small.textContent=launchMode?'launch · one-time':'one-time purchase';}
    }
    if(control.salesEnabled){link.href='#';link.addEventListener('click',e=>{e.preventDefault();startCheckout(key,link)});}else{link.href='#';link.setAttribute('aria-disabled','true');link.textContent='Sales opening soon';link.addEventListener('click',e=>e.preventDefault());}
  });

  document.querySelectorAll('[data-free-product]').forEach(link=>{
    const key=link.dataset.freeProduct,item=control.products[key];
    if(!item||!item.free)return;
    if(!control.freeDownloadsEnabled||!freeWorker){
      link.href='#';link.setAttribute('aria-disabled','true');link.classList.add('is-disabled');link.textContent='Free download setup pending';link.addEventListener('click',e=>e.preventDefault());return;
    }
    link.href='#';link.addEventListener('click',async e=>{
      e.preventDefault();const original=link.textContent;link.textContent='Preparing download…';link.setAttribute('aria-busy','true');
      try{const res=await fetch(freeWorker+'/api/free-download?product='+encodeURIComponent(key),{headers:{'Accept':'application/json'}});let data=null;try{data=await res.json()}catch(_){ }if(!res.ok||!data?.url)throw new Error(data?.error||'Free download is unavailable right now.');location.href=data.url;}catch(err){alert(err.message||'Free download is unavailable right now.');link.textContent=original;link.removeAttribute('aria-busy');}
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
  document.documentElement.dataset.launchMode=launchMode?'true':'false';
})();
