(function () {
  const store = window.SAFI_STORE;
  if (!store || !store.products) return;

  const money = value => `$${value}`;

  const salesEnabled = store.salesEnabled !== false;
  const disableCheckoutLink = (link) => {
    link.removeAttribute('target');
    link.removeAttribute('rel');
    link.setAttribute('aria-disabled', 'true');
    link.dataset.checkoutDisabled = 'true';
    link.href = '#';
    if (!link.dataset.originalLabel) link.dataset.originalLabel = link.textContent.trim();
    link.textContent = 'Launching soon';
    link.title = 'Checkout opens after secure download delivery is connected.';
    link.addEventListener('click', e => e.preventDefault());
  };

  // Standard product + 5-app checkout links.
  document.querySelectorAll('[data-stripe-product]').forEach(link => {
    const key = link.dataset.stripeProduct;
    const item = store.products[key];
    if (!item) return;

    const activeUrl = store.launchMode ? item.launchUrl : item.regularUrl;
    if (activeUrl && salesEnabled) {
      link.href = activeUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else if (!salesEnabled) {
      disableCheckoutLink(link);
    }

    const shelf = link.closest('.product-shelf');
    if (shelf) {
      const price = shelf.querySelector('.product-price');
      if (price) {
        const del = price.querySelector('del');
        const strong = price.querySelector('strong');
        const small = price.querySelector('small');
        if (del) {
          del.textContent = money(item.regularPrice);
          del.hidden = !store.launchMode;
        }
        if (strong) strong.textContent = money(store.launchMode ? item.launchPrice : item.regularPrice);
        if (small) small.textContent = store.launchMode ? 'launch price' : 'one-time purchase';
      }
    }
  });

  // Compact top pricing ribbon.
  document.querySelectorAll('[data-price-key]').forEach(node => {
    const key = node.dataset.priceKey;
    let item;
    if (key === 'single') item = store.products.padeff;
    else if (key === 'bundle-3') item = store.bundle3;
    else item = store.products[key];
    if (!item) return;
    const del = node.querySelector('del');
    const strong = node.querySelector('strong');
    if (del) {
      del.textContent = money(item.regularPrice);
      del.hidden = !store.launchMode;
    }
    if (strong) strong.textContent = money(store.launchMode ? item.launchPrice : item.regularPrice);
  });

  // Choose-3 modal: customer selects exactly three apps BEFORE Stripe.
  const dialog = document.getElementById('bundle-chooser');
  const openers = document.querySelectorAll('[data-bundle-chooser]');
  if (dialog && openers.length) {
    const checks = Array.from(dialog.querySelectorAll('input[type="checkbox"][data-app]'));
    const counter = dialog.querySelector('[data-bundle-count]');
    const continueBtn = dialog.querySelector('[data-bundle-continue]');
    const closeBtn = dialog.querySelector('[data-bundle-close]');

    const update = () => {
      const selected = checks.filter(c => c.checked);
      checks.forEach(c => { c.disabled = selected.length >= 3 && !c.checked; });
      if (counter) counter.textContent = `${selected.length} / 3 selected`;
      if (continueBtn) continueBtn.disabled = selected.length !== 3;
    };

    checks.forEach(c => c.addEventListener('change', update));
    openers.forEach(opener => {
      if (!salesEnabled) {
        opener.setAttribute('aria-disabled', 'true');
        opener.title = 'Checkout opens after secure download delivery is connected.';
        if (opener.tagName === 'BUTTON') opener.disabled = true;
        if (!opener.dataset.originalLabel) opener.dataset.originalLabel = opener.textContent.trim();
        opener.textContent = 'Launching soon';
        return;
      }
      opener.addEventListener('click', e => {
        e.preventDefault();
        checks.forEach(c => { c.checked = false; c.disabled = false; });
        update();
        dialog.showModal();
      });
    });
    closeBtn?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

    continueBtn?.addEventListener('click', () => {
      if (!salesEnabled) return;
      const selected = checks.filter(c => c.checked).map(c => c.dataset.app).sort();
      const combos = Object.values(store.bundle3.combinations || {});
      const match = combos.find(combo => [...combo.apps].sort().join('|') === selected.join('|'));
      if (!match) return;
      const url = store.launchMode ? match.launchUrl : match.regularUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
  }


  // Product screenshot lightbox: enlarge previews without leaving the page.
  const lightbox = document.getElementById('product-lightbox');
  const lightboxImg = lightbox?.querySelector('[data-product-lightbox-image]');
  const lightboxTitle = lightbox?.querySelector('#product-lightbox-title');
  const lightboxClose = lightbox?.querySelector('[data-product-lightbox-close]');
  if (lightbox && lightboxImg) {
    const openPreview = img => {
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || 'Product preview';
      if (lightboxTitle) lightboxTitle.textContent = img.alt || 'Product preview';
      lightbox.showModal();
    };
    document.querySelectorAll('.product-shot img').forEach(img => {
      img.tabIndex = 0;
      img.setAttribute('role','button');
      img.setAttribute('aria-label', `Enlarge ${img.alt || 'product preview'}`);
      img.addEventListener('click', () => openPreview(img));
      img.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPreview(img);
        }
      });
    });
    lightboxClose?.addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });
  }

  document.documentElement.dataset.launchMode = store.launchMode ? 'true' : 'false';
  document.documentElement.dataset.salesEnabled = salesEnabled ? 'true' : 'false';
})();
