/* Rotate the featured photograph through the same original shots shown below. */
(() => {
  const hero = document.querySelector('.sc-hero-photo');
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const button = hero.querySelector('[data-zoom]');
  const image = button.querySelector('img');
  const caption = hero.querySelector('figcaption');
  const shots = [...document.querySelectorAll('.sc-photo')].map(figure => {
    const img = figure.querySelector('img');
    const labels = figure.querySelector('figcaption').children;
    return { src: img.src, alt: img.alt, width: img.width, height: img.height,
      title: labels[0].textContent, place: labels[1].textContent };
  });
  let index = 0, busy = false;
  const rotate = async () => {
    if (busy || document.hidden || hero.matches(':hover') || hero.contains(document.activeElement)
      || document.querySelector('#zoom-dialog[open]')) return;
    busy = true;
    try {
      const next = (index + 1) % shots.length, shot = shots[next];
      const preload = new Image(); preload.src = shot.src;
      await preload.decode();
      image.classList.add('sc-photo-fading');
      await new Promise(resolve => setTimeout(resolve, 300));
      image.src = shot.src; image.alt = shot.alt;
      image.width = shot.width; image.height = shot.height;
      caption.children[0].textContent = shot.title;
      caption.children[1].textContent = shot.place;
      button.setAttribute('aria-label', 'Enlarge ' + shot.title);
      await image.decode();
      index = next;
    } finally { image.classList.remove('sc-photo-fading'); busy = false; }
  };
  setInterval(() => rotate().catch(() => {}), 6000);
})();
