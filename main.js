(() => {
  const root = document.documentElement, body = document.body;
  const video = document.getElementById('intro');
  const soundBtn = document.getElementById('sound'), soundLabel = document.getElementById('sound-label');
  const skipBtn = document.getElementById('skip'), replayBtn = document.getElementById('replay');
  const nav = document.getElementById('nav'), burger = document.getElementById('burger'), panel = document.getElementById('panel');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let done = false, fallback;

  /* ---------- Calidad del video según pantalla y conexión ---------- */
  const conn = navigator.connection || {};
  const slow = conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || '');
  const q = (innerWidth <= 900 || slow) ? '720' : '1080';
  const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const ext = (!safari && video.canPlayType('video/webm; codecs="vp9, opus"')) ? 'webm' : 'mp4';
  root.style.setProperty('--poster', `url("assets/portada-${q}.jpg")`);
  video.poster = `assets/portada-${q}.jpg`;
  if (!reduce) video.src = `assets/hero-${q}.${ext}`;

  /* ---------- Menú: desenfoque al hacer scroll, sección activa, panel móvil ---------- */
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 12);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const links = [...document.querySelectorAll('.links a')];
  if ('IntersectionObserver' in window) {
    const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const so = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = links.find((l) => l.getAttribute('href') === '#' + e.target.id); if (a) a.setAttribute('aria-current', 'true');
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => so.observe(s));
  }
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    panel.setAttribute('aria-hidden', String(!open));
    if (open) panel.querySelector('a').focus({ preventScroll: true }); else burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false); });
  matchMedia('(min-width: 861px)').addEventListener('change', (m) => { if (m.matches && body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- Cuenta regresiva fija: 30/10/2026 23:59 (Colombia, UTC-5), igual para todos ---------- */
  const cuenta = document.getElementById('cuenta-t');
  if (cuenta) {
    const fin = Date.parse('2026-10-30T23:59:59-05:00');
    const tick = () => {
      const d = fin - Date.now();
      if (d <= 0) { cuenta.textContent = 'La oferta terminó'; clearInterval(t); return; }
      const dd = Math.floor(d / 864e5), h = Math.floor(d / 36e5) % 24, mi = Math.floor(d / 6e4) % 60, se = Math.floor(d / 1e3) % 60;
      cuenta.textContent = `${dd} d  ${String(h).padStart(2, '0')} h  ${String(mi).padStart(2, '0')} min  ${String(se).padStart(2, '0')} s`;
    };
    const t = setInterval(tick, 1000); tick();
  }

  /* ---------- Fondo que cambia por sección + elementos por capas (escritorio, sin «reducir movimiento») ---------- */
  const fxOk = matchMedia('(min-width: 861px)');
  const secciones = [...document.querySelectorAll('main > section')];
  const capas = [...document.querySelectorAll('main .reveal')].map((el) => {
    const sec = el.closest('section'); return { el, k: [...sec.querySelectorAll('.reveal')].indexOf(el) };
  });
  const clamp = (v) => Math.min(1, Math.max(0, v));
  let lenis = null, rafId = 0, gestoHero = false, fondoActual = -1;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  function pintar() {
    const vh = innerHeight;
    // Fondo: la sección que cruza el centro de la pantalla manda.
    let idx = 0;
    secciones.forEach((s, i) => { if (s.getBoundingClientRect().top <= vh * 0.5) idx = i; });
    if (idx !== fondoActual) { fondoActual = idx; body.style.setProperty('--page-bg', secciones[idx].dataset.bg || '#0d0d0d'); }
    // Capas: cada elemento aparece al entrar y se desvanece al salir, con un leve desfase por orden (título, texto, botón).
    capas.forEach(({ el, k }) => {
      const r = el.getBoundingClientRect();
      const entra = clamp((vh * (0.96 - 0.05 * k) - r.top) / (vh * 0.22));
      const sale = clamp((r.bottom - vh * 0.04) / (vh * 0.22));
      const o = Math.min(entra, sale);
      el.style.setProperty('--o', o.toFixed(3));
      el.style.setProperty('--ty', ((1 - entra) * 34 - (1 - sale) * 22).toFixed(1) + 'px');
    });
  }
  function irA(i) {
    const y = secciones[i].getBoundingClientRect().top + scrollY;
    if (lenis) lenis.scrollTo(y, { duration: 1.3, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), force: true }); else scrollTo({ top: y, behavior: 'smooth' });
  }
  function arrancarLenis() {
    if (lenis || typeof Lenis === 'undefined') return;
    lenis = new Lenis({ duration: 1.1, easing: ease, smoothWheel: true });
    lenis.on('scroll', pintar);
    let bloqueado = false;
    // Durante la intro no se hace scroll: el bloqueo sigue siempre a la clase «ready».
    const raf = (t) => {
      if (!lenis) return;
      const b = !body.classList.contains('ready');
      if (b !== bloqueado) { bloqueado = b; b ? lenis.stop() : lenis.start(); }
      lenis.raf(t); rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
  }
  function pararLenis() { if (!lenis) return; cancelAnimationFrame(rafId); lenis.destroy(); lenis = null; }
  function efectos() {
    const on = fxOk.matches && !reduce;
    body.classList.toggle('fx', on);
    if (on) { pintar(); arrancarLenis(); }
    else { pararLenis(); body.style.removeProperty('--page-bg'); capas.forEach(({ el }) => { el.style.removeProperty('--o'); el.style.removeProperty('--ty'); }); }
  }
  addEventListener('scroll', () => { if (body.classList.contains('fx')) requestAnimationFrame(pintar); }, { passive: true });
  addEventListener('resize', efectos); fxOk.addEventListener('change', efectos);
  addEventListener('load', efectos); efectos();
  // Enlaces internos: scroll amortiguado hasta la sección.
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    if (!body.classList.contains('fx')) return;
    const i = secciones.findIndex((s) => '#' + s.id === a.getAttribute('href'));
    if (i < 0) return;
    e.preventDefault(); irA(i);
  }));
  // Un gesto = una sección. Transición de 1,4 s; la inercia del trackpad se descarta hasta que cesa.
  // En secciones más altas que la pantalla el scroll es normal y solo al llegar al borde un gesto cambia de sección.
  const DUR = 1.3;
  let animando = false, ultimaRueda = 0, ultimoDy = 0;
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function actual() {
    let idx = 0; const vh = innerHeight;
    secciones.forEach((s, i) => { if (s.getBoundingClientRect().top <= vh * 0.5) idx = i; });
    return idx;
  }
  function saltar(i, hacia) {
    const s = secciones[i]; const top = s.getBoundingClientRect().top + scrollY;
    const y = hacia < 0 && s.offsetHeight > innerHeight * 1.05 ? top + s.offsetHeight - innerHeight : top;   // al subir a una sección larga se llega a su final
    animando = true;
    // No se depende de un callback de Lenis: el bloqueo termina siempre por tiempo.
    setTimeout(() => { animando = false; }, DUR * 1000 * 0.8);   // se libera antes de terminar para que no se sienta pegado
    if (lenis) lenis.scrollTo(y, { duration: DUR, easing: suave, force: true });
    else scrollTo({ top: y, behavior: 'smooth' });
  }
  function gesto(dir, e) {
    if (!body.classList.contains('fx') || !body.classList.contains('ready')) return false;
    const now = performance.now(), gap = now - ultimaRueda;
    // Inercia del trackpad: sus deltas solo decrecen. Un gesto nuevo es una pausa >140 ms o un delta claramente mayor.
    let nuevo = true;
    if (e.type === 'wheel') { const mag = Math.abs(e.deltaY); nuevo = gap >= 140 || mag > ultimoDy * 1.5 + 4; ultimoDy = mag; ultimaRueda = now; }
    if (animando) return true;
    const i = actual(), s = secciones[i], r = s.getBoundingClientRect(), vh = innerHeight;
    const larga = s.offsetHeight > vh * 1.05;
    if (larga && ((dir > 0 && r.bottom > vh + 2) || (dir < 0 && r.top < -2))) return false;   // scroll normal dentro de la sección
    if (!nuevo) return true;                                                                    // inercia: se descarta
    const sig = i + dir;
    if (sig < 0 || sig >= secciones.length) return false;
    saltar(sig, dir); return true;
  }
  addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < 2) return;
    if (gesto(e.deltaY > 0 ? 1 : -1, e)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, { passive: false, capture: true });
  addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
    if (dir && gesto(dir, e)) e.preventDefault();
  });

  /* ---------- Aparición suave ---------- */
  function revealAll() { document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')); }
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach((e) => io.observe(e));
  } else revealAll();

  /* ---------- Código SHA-256: copiar ---------- */
  const copiar = document.getElementById('copiar')
  copiar?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(document.getElementById('sha').textContent.trim()); copiar.textContent = 'Copiado' } catch { copiar.textContent = 'Selecciona el código' }
    setTimeout(() => (copiar.textContent = 'Copiar'), 1800)
  })

  /* ---------- Descargas: Android sigue como marcador ---------- */
  document.querySelectorAll('[data-plataforma]').forEach((b) => b.addEventListener('click', (e) => e.preventDefault()));

  /* ---------- Intro ---------- */
  if (reduce) { body.classList.add('no-motion', 'ready'); video.pause(); return; }   // portada estática

  function finish() { if (done) return; done = true; clearTimeout(fallback); video.pause(); body.classList.add('ready'); }
  function setSound(on) {
    video.muted = !on; soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Silenciar' : 'Activar sonido'); soundLabel.textContent = on ? 'Silenciar' : 'Activar sonido';
  }
  // Sonido activado por defecto. Los navegadores solo lo permiten con una interacción previa;
  // si lo bloquean, el video arranca en silencio y el sonido se activa con el primer toque o tecla.
  function armGesture() {
    const on = () => { if (!done && video.muted) setSound(true); ['pointerdown', 'keydown', 'touchstart'].forEach((t) => removeEventListener(t, on)); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => addEventListener(t, on, { once: true, passive: true }));
  }
  function start() {
    done = false; body.classList.remove('ready'); scrollTo(0, 0);
    video.currentTime = 0; setSound(true);
    const quiet = () => { setSound(false); armGesture(); return video.play(); };
    const p = video.play();
    if (p && p.catch) p.catch((err) => {
      if (document.hidden) { document.addEventListener('visibilitychange', function f() { if (!document.hidden) { document.removeEventListener('visibilitychange', f); start(); } }); return; }
      if (err && err.name === 'NotAllowedError') { quiet().catch(finish); return; }  // sin sonido permitido: reintenta en silencio
      finish();
    });
    clearTimeout(fallback); fallback = setTimeout(finish, 9000);
  }
  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);
  soundBtn.addEventListener('click', () => setSound(video.muted));
  skipBtn.addEventListener('click', finish);
  replayBtn.addEventListener('click', start);
  start();
})();
