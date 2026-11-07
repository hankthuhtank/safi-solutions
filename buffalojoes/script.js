'use strict';

const menu = {
  burgers: [
    ['Buffalo Burger', 'Buffalo patty, cheese and the fixings, with waffle fries.', 'THE ORIGINAL'],
    ['Spicy Buffalo Burger', 'Buffalo, bacon, blue cheese and ghost pepper sauce.'],
    ['Classic Cheeseburger', 'A beef patty with American cheese on a Kaiser roll.'],
    ['Cowboy Burger', 'Beef, cheese, grilled onion, an onion ring and BBQ sauce.'],
    ['Fish & Chips', 'Fried cod with waffle fries and tartar sauce.']
  ],
  starters: [
    ['Wings', 'Bone-in or boneless. Ask about the sauces.'],
    ['Joe’s Sampler', 'A little of everything for the table.'],
    ['Fried Green Beans', 'Battered green beans, made for dipping.'],
    ['Fried Mushrooms', 'A pub-menu regular.'],
    ['Chips & Salsa', 'An easy start while you look at the menu.']
  ],
  tacos: [
    ['Fish Tacos', 'Breaded cod, cabbage, cilantro and sriracha dressing.'],
    ['Chicken Tacos', 'Grilled chicken, lettuce, tomato and cheese.'],
    ['Chicken Wrap', 'Grilled chicken, bacon, greens and cheese in a spinach tortilla.'],
    ['Chicken Salad', 'Grilled chicken over lettuce with the fixings.'],
    ['House Salad', 'Lettuce, tomato, onion, cheese and dressing.']
  ],
  drinks: [
    ['On Draft', 'Pull up to the bar and see what’s pouring.'],
    ['Bottles & Cans', 'Ask about the current beer selection.'],
    ['Mixed Drinks', 'Tell the bartender your usual.'],
    ['Whiskey & Bourbon', 'Take a look at the back bar.'],
    ['Joe’s Tea', 'Ask the bar about this local favorite.']
  ]
};

const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panel = document.getElementById('menu-panel');
function selectTab(tab) {
  tabs.forEach(t => { const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; });
  panel.replaceChildren(...menu[tab.dataset.category].map(([name, description, tag]) => {
    const article = document.createElement('article'); article.className = 'menu-item';
    const title = document.createElement('h3'); title.textContent = name;
    if (tag) { const label = document.createElement('span'); label.textContent = tag; title.append(' ', label); }
    const text = document.createElement('p'); text.textContent = description; article.append(title, text); return article;
  }));
  panel.setAttribute('aria-labelledby', tab.id);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); tabs[next].focus(); selectTab(tabs[next]); }
  });
});

const navToggle = document.querySelector('.nav-toggle');
const navigation = document.getElementById('navigation');
function closeNavigation() { navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Open navigation'); navigation.classList.remove('open'); }
navToggle.addEventListener('click', () => { const open = navToggle.getAttribute('aria-expanded') !== 'true'; navToggle.setAttribute('aria-expanded', String(open)); navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); navigation.classList.toggle('open', open); });
navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNavigation));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && navigation.classList.contains('open')) { closeNavigation(); navToggle.focus(); } });
document.addEventListener('click', e => { if (!e.target.closest('.header')) closeNavigation(); });
window.matchMedia('(min-width: 801px)').addEventListener('change', closeNavigation);

const photos = {
  burger: ['assets/burger.webp', 'A burger and waffle fries at Buffalo Joe’s. Photo via Restaurantji contributors.'],
  patio: ['assets/patio.webp', 'A pint on the patio at Buffalo Joe’s. Photo via MapQuest / Yelp contributors.'],
  taps: ['assets/taps.webp', 'Behind the bar at Buffalo Joe’s. Photo via MapQuest / Yelp contributors.'],
  fries: ['assets/fries.webp', 'Loaded waffle fries at Buffalo Joe’s. Photo via MapQuest / Yelp contributors.'],
  huser: ['assets/huser.webp', 'Show archive · Huser Brothers with Trey Rose · March 21, 2026. Artwork from Buffalo Joe’s.'],
  cole: ['assets/cole.webp', 'Show archive · Cole Barnhill with Bryan Hoffman Band · April 17, 2026. Artwork from Buffalo Joe’s.'],
  menu: ['assets/menu-photos.webp', 'Photographed pub menus from public listings. Prices and availability may have changed. Photos via Restaurantji contributors.']
};
const photoDialog = document.getElementById('photo-dialog');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-caption');
const counter = photoDialog.querySelector('.photo-counter');
const photoOrder = ['taps', 'patio', 'fries', 'burger', 'huser', 'cole'];
let currentPhotos = photoOrder;
let currentIndex = 0;
let previousFocus;
function displayPhoto(index) {
  currentIndex = (index + currentPhotos.length) % currentPhotos.length;
  const [src, caption] = photos[currentPhotos[currentIndex]];
  lightboxImage.src = src; lightboxImage.alt = caption; lightboxCaption.textContent = caption;
  counter.textContent = currentPhotos.length > 1 ? `${currentIndex + 1} / ${currentPhotos.length}` : '';
  photoDialog.querySelectorAll('.photo-prev,.photo-next').forEach(button => { button.hidden = currentPhotos.length < 2; });
}
function openPhoto(key) {
  previousFocus = document.activeElement;
  currentPhotos = key === 'menu' ? ['menu'] : photoOrder;
  displayPhoto(currentPhotos.indexOf(key));
  photoDialog.showModal();
}
document.querySelectorAll('[data-photo]').forEach(button => button.addEventListener('click', () => openPhoto(button.dataset.photo)));
document.getElementById('open-menu').addEventListener('click', () => openPhoto('menu'));
photoDialog.querySelector('.photo-prev').addEventListener('click', () => displayPhoto(currentIndex - 1));
photoDialog.querySelector('.photo-next').addEventListener('click', () => displayPhoto(currentIndex + 1));
photoDialog.addEventListener('keydown', e => { if (currentPhotos.length < 2) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); displayPhoto(currentIndex + (e.key === 'ArrowRight' ? 1 : -1)); } });
let touchX = null;
photoDialog.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
photoDialog.addEventListener('touchend', e => { if (touchX === null || currentPhotos.length < 2) return; const distance = e.changedTouches[0].clientX - touchX; if (Math.abs(distance) > 55) displayPhoto(currentIndex + (distance < 0 ? 1 : -1)); touchX = null; }, { passive: true });
const creditsDialog = document.getElementById('credits-dialog');
document.getElementById('open-credits').addEventListener('click', () => { previousFocus = document.activeElement; creditsDialog.showModal(); });
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (dialog === photoDialog || e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close(); });
  dialog.addEventListener('close', () => { if (previousFocus) previousFocus.focus({ preventScroll: true }); });
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); entry.target.classList.remove('pre-reveal'); observer.unobserve(entry.target); } }), { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(element => { if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add('pre-reveal'); observer.observe(element); });
}
