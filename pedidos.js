/* Comunicación del sitio con el Worker (pedidos y descargas). El precio SOLO viene del servidor. */
window.CORVO_API = 'https://solvacq-planes.solvacq-nube.workers.dev'
window.cop = (n) => '$' + Number(n).toLocaleString('es-CO')
window.fechaLarga = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '')
window.api = async (ruta, opciones) => {
  const r = await fetch(window.CORVO_API + ruta, opciones)
  let cuerpo = null
  try { cuerpo = await r.json() } catch { /* sin cuerpo */ }
  if (!r.ok) { const e = new Error((cuerpo && cuerpo.error) || 'error'); e.status = r.status; e.codigo = (cuerpo && cuerpo.error) || 'error'; throw e }
  return cuerpo
}
window.el = (tag, props = {}, ...hijos) => { const n = document.createElement(tag); Object.assign(n, props); n.append(...hijos); return n }
