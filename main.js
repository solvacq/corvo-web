(() => {
  'use strict';
  const body = document.body;
  const burger = document.getElementById('burger'), panel = document.getElementById('panel');

  /* Menú móvil */
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    panel.setAttribute('aria-hidden', String(!open));
  }
  burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 820) setMenu(false); });

  /* Enlace activo según la sección visible */
  const links = [...document.querySelectorAll('.links a')];
  const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && secs.length) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + e.target.id)));
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => io.observe(s));
  }

  /* Lista de funciones: una abierta a la vez (respaldo para navegadores sin details[name]) */
  const fs = [...document.querySelectorAll('#feats details')];
  fs.forEach((d) => d.addEventListener('toggle', () => { if (d.open) fs.forEach((o) => { if (o !== d) o.open = false; }); }));
})();
