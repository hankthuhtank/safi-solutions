(function(){
  const store=window.SAFI_STORE_CONTROL;
  if(!store||!store.products)return;
  const launchMode=store.pricingMode!=="regular";
  const salesEnabled=store.salesEnabled===true;
  const checkoutWorker=String(store.checkoutWorker||"").replace(/\/+$/,'');
  const money=v=>{const n=Number(v);return Number.isInteger(n)?'$'+n:'$'+n.toFixed(2)};
  const priceFor=item=>launchMode?item.launchPrice:item.regularPrice;

  function disableCheckout(el){
    el.removeAttribute('target');el.removeAttribute('rel');
    el.setAttribute('aria-disabled','true');el.href='#';
    if(!el.dataset.originalLabel)el.dataset.originalLabel=el.textContent.trim();
    el.textContent='Launching soon';el.title='Checkout opens when sales are enabled.';
    el.addEventListener('click',e=>e.preventDefault());
  }

  function resetCheckoutUI(){
    document.querySelectorAll('[aria-busy="true"][data-checkout-original-label]').forEach(el=>{
      el.removeAttribute('aria-busy');
      el.textContent=el.dataset.checkoutOriginalLabel;
      delete el.dataset.checkoutOriginalLabel;
    });
  }

  // Browsers often restore this page from the back/forward cache after Stripe.
  // Reset temporary checkout text when the customer comes back.
  window.addEventListener('pageshow',resetCheckoutUI);

  async function startCheckout(payload,trigger){
    if(!salesEnabled||!checkoutWorker)return;
    const original=trigger?trigger.textContent:'';
    try{
      if(trigger){
        trigger.dataset.checkoutOriginalLabel=original;
        trigger.setAttribute('aria-busy','true');
        trigger.textContent='Opening checkout…';
      }
      const res=await fetch(checkoutWorker+'/api/checkout',{
        method:'POST',credentials:'omit',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
      let data=null;try{data=await res.json()}catch(_){ }
      if(!res.ok||!data||!data.url)throw new Error(data&&data.error?data.error:'Checkout is not available right now.');
      window.location.href=data.url;
    }catch(err){
      alert(err&&err.message?err.message:'Checkout is not available right now.');
      if(trigger){
        trigger.removeAttribute('aria-busy');
        trigger.textContent=original;
        delete trigger.dataset.checkoutOriginalLabel;
      }
    }
  }

  document.querySelectorAll('[data-stripe-product]').forEach(link=>{
    const key=link.dataset.stripeProduct;
    const item=key==='bundle-5'?store.bundle5:store.products[key];
    if(!item)return;
    if(salesEnabled&&checkoutWorker){
      link.href='#';link.removeAttribute('target');link.removeAttribute('rel');
      link.addEventListener('click',e=>{e.preventDefault();startCheckout({product:key==='bundle-5'?'bundle5':key},link)});
    }else disableCheckout(link);

    const shelf=link.closest('.product-shelf');
    if(shelf&&key!=='bundle-5'){
      const price=shelf.querySelector('.product-price');
      if(price){
        const del=price.querySelector('del'),strong=price.querySelector('strong'),small=price.querySelector('small');
        if(del){del.textContent=money(item.regularPrice);del.hidden=!launchMode}
        if(strong)strong.textContent=money(priceFor(item));
        if(small)small.textContent=launchMode?'launch price':'one-time purchase';
      }
    }
  });

  document.querySelectorAll('[data-price-key]').forEach(node=>{
    const key=node.dataset.priceKey;
    let item=null;
    if(key==='single')item=store.products.padeff;
    else if(key==='bundle-3')item=store.bundle3;
    else if(key==='bundle-5')item=store.bundle5;
    else item=store.products[key];
    if(!item)return;
    const del=node.querySelector('del'),strong=node.querySelector('strong');
    if(del){del.textContent=money(item.regularPrice);del.hidden=!launchMode}
    if(strong)strong.textContent=money(priceFor(item));
  });

  const dialog=document.getElementById('bundle-chooser');
  const openers=document.querySelectorAll('[data-bundle-chooser]');
  if(dialog&&openers.length){
    const checks=Array.from(dialog.querySelectorAll('input[type="checkbox"][data-app]'));
    const counter=dialog.querySelector('[data-bundle-count]');
    const continueBtn=dialog.querySelector('[data-bundle-continue]');
    const closeBtn=dialog.querySelector('[data-bundle-close]');
    const kicker=dialog.querySelector('.bundle-dialog-head .micro');
    const title=dialog.querySelector('#bundle-title');
    let activeBundle='bundle3';
    let requiredCount=3;
    let eligible=new Set();

    const update=()=>{
      const available=checks.filter(c=>eligible.has(c.dataset.app));
      const selected=available.filter(c=>c.checked);
      available.forEach(c=>{c.disabled=selected.length>=requiredCount&&!c.checked});
      if(counter)counter.textContent=selected.length+' / '+requiredCount+' selected';
      if(continueBtn)continueBtn.disabled=selected.length!==requiredCount;
    };

    const configure=(bundleKey,count)=>{
      activeBundle=bundleKey;
      requiredCount=count;
      const config=store[bundleKey]||{};
      eligible=new Set(config.eligibleApps||config.apps||[]);
      checks.forEach(c=>{
        const allowed=eligible.has(c.dataset.app);
        c.checked=false;
        c.disabled=!allowed;
        const label=c.closest('label');
        if(label)label.hidden=!allowed;
      });
      if(kicker)kicker.textContent='ANY '+requiredCount+' BUNDLE';
      if(title)title.textContent='Choose your '+requiredCount+' apps.';
      update();
    };

    checks.forEach(c=>c.addEventListener('change',update));
    openers.forEach(opener=>{
      if(!salesEnabled){
        opener.setAttribute('aria-disabled','true');opener.title='Checkout opens when sales are enabled.';
        if(opener.tagName==='BUTTON')opener.disabled=true;
        if(!opener.dataset.originalLabel)opener.dataset.originalLabel=opener.textContent.trim();
        opener.textContent='Launching soon';return;
      }
      opener.addEventListener('click',e=>{
        e.preventDefault();
        const count=Number(opener.dataset.bundleSize)||3;
        configure(count===5?'bundle5':'bundle3',count===5?5:3);
        dialog.showModal();
      });
    });
    if(closeBtn)closeBtn.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    if(continueBtn)continueBtn.addEventListener('click',()=>{
      if(!salesEnabled)return;
      const selected=checks.filter(c=>eligible.has(c.dataset.app)&&c.checked).map(c=>c.dataset.app).sort();
      if(selected.length!==requiredCount)return;
      startCheckout({product:activeBundle,apps:selected},continueBtn);
    });
  }

  const lightbox=document.getElementById('product-lightbox');
  const lightboxImg=lightbox&&lightbox.querySelector('[data-product-lightbox-image]');
  const lightboxTitle=lightbox&&lightbox.querySelector('#product-lightbox-title');
  const lightboxClose=lightbox&&lightbox.querySelector('[data-product-lightbox-close]');
  if(lightbox&&lightboxImg){
    const openPreview=img=>{lightboxImg.src=img.currentSrc||img.src;lightboxImg.alt=img.alt||'Product preview';if(lightboxTitle)lightboxTitle.textContent=img.alt||'Product preview';lightbox.showModal()};
    document.querySelectorAll('.product-shot img').forEach(img=>{
      img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','Enlarge '+(img.alt||'product preview'));
      img.addEventListener('click',()=>openPreview(img));
      img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPreview(img)}});
    });
    if(lightboxClose)lightboxClose.addEventListener('click',()=>lightbox.close());
    lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});
  }

  document.documentElement.dataset.launchMode=launchMode?'true':'false';
  document.documentElement.dataset.salesEnabled=salesEnabled?'true':'false';
})();
