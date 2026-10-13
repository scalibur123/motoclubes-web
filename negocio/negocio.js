// MC-RF-NEGOCIO-21SEP-2026 (ficha RF-NEGOCIO-1) · listas del portal de negocios, UNA vez.
// Las usan registro.html y perfil.html. Los valores de TIPOS y SERVICIOS son los que acepta la
// base (db/rf_negocios.sql) y business-portal: si se toca uno, se tocan los tres.
window.MC_TIPOS = [
  { v: 'restaurante', l: 'Bar o restaurante' },
  { v: 'hotel',       l: 'Hotel o casa rural' },
  { v: 'camping',     l: 'Camping' },
  { v: 'gasolinera',  l: 'Gasolinera' },
  { v: 'taller',      l: 'Taller' },
]
// Sugerencias de categoría por tipo. Es texto libre: si no está, el negocio escribe la suya.
window.MC_CATEGORIAS = {
  restaurante: ['Restaurante', 'Bar', 'Cafetería', 'Asador', 'Área de descanso'],
  hotel:       ['Hotel', 'Hostal', 'Casa rural', 'Apartamento turístico', 'Albergue'],
  camping:     ['Camping', 'Bungalós', 'Área de autocaravanas'],
  gasolinera:  ['Gasolinera', 'Área de servicio'],
  taller:      ['Taller de motos', 'Taller mecánico', 'Neumáticos'],
}
// MC-RF-SERVICIOS-TIPO-21SEP-2026: cada tipo de negocio ve SUS casillas (Mario: «a un taller
// no le pega lo mismo que a un restaurante»). Las claves se comparten entre tipos cuando es lo
// mismo (lavado, grupos…). La base (servicios_moto_check) y business-portal aceptan la unión.
window.MC_SERVICIO_TXT = {
  garaje_cubierto:  'Garaje cubierto para motos',
  parking_vigilado: 'Parking vigilado',
  parking_vista:    'Parking a la vista para motos',
  lavado:           'Manguera o zona de lavado para motos',
  secado_equipo:    'Secado de ropa y equipo',
  guardar_equipo:   'Sitio para dejar cascos y chaquetas',
  herramientas:     'Herramientas básicas',
  grupos:           'Menú u horario para grupos',
  desayunos:        'Abre temprano (desayunos)',
  cenas:            'Cenas',
  carga_movil:      'Enchufe para cargar móvil o intercom',
  moto_parcela:     'Moto junto a la parcela',
  bungalos:         'Bungalós o cabañas',
  aire_neumaticos:  'Aire para neumáticos',
  cafeteria_tienda: 'Cafetería o tienda',
  abierta_24h:      'Abierta 24 horas',
  reparacion:       'Reparación de motos',
  neumaticos_moto:  'Neumáticos de moto',
  asistencia_ruta:  'Asistencia en ruta o grúa',
  sin_cita:         'Atiende sin cita a riders de paso',
  recambios:        'Recambios',
}
window.MC_SERVICIOS_POR_TIPO = {
  restaurante: ['parking_vista', 'guardar_equipo', 'grupos', 'desayunos', 'carga_movil'],
  hotel:       ['garaje_cubierto', 'parking_vigilado', 'lavado', 'secado_equipo', 'herramientas', 'desayunos', 'cenas', 'grupos'],
  camping:     ['moto_parcela', 'secado_equipo', 'lavado', 'herramientas', 'bungalos'],
  gasolinera:  ['aire_neumaticos', 'lavado', 'cafeteria_tienda', 'abierta_24h'],
  taller:      ['reparacion', 'neumaticos_moto', 'asistencia_ruta', 'sin_cita', 'recambios'],
}
// Pinta en `cont` las casillas del tipo, con marcadas las de `marcadas`.
window.mcServicios = function (cont, tipo, marcadas) {
  const lista = window.MC_SERVICIOS_POR_TIPO[tipo] || []
  if (!lista.length) { cont.innerHTML = '<div class="field-hint">Elige arriba el tipo de negocio y aquí saldrán sus servicios.</div>'; return }
  cont.innerHTML = lista.map(v =>
    `<label class="rf-servicio"><input type="checkbox" class="f-serv" value="${v}" ${(marcadas || []).includes(v) ? 'checked' : ''}> ${window.MC_SERVICIO_TXT[v]}</label>`).join('')
}
// Pinta los chips de tipo en `cont` y llama a onElegir(v). Devuelve una función para marcar uno.
window.mcChipsTipo = function (cont, actual, onElegir) {
  cont.innerHTML = window.MC_TIPOS.map(t =>
    `<button type="button" class="rf-chip${t.v === actual ? ' sel' : ''}" data-v="${t.v}">${t.l}</button>`).join('')
  const marcar = (v) => cont.querySelectorAll('.rf-chip').forEach(c => c.classList.toggle('sel', c.dataset.v === v))
  cont.querySelectorAll('.rf-chip').forEach(c => c.addEventListener('click', () => { marcar(c.dataset.v); onElegir(c.dataset.v) }))
  return marcar
}
// Rellena un <datalist> con las categorías del tipo.
window.mcCategorias = function (datalist, tipo) {
  datalist.innerHTML = (window.MC_CATEGORIAS[tipo] || []).map(c => `<option value="${c}">`).join('')
}

// ---- MC-RF-ROBLE-30SEP-2026 (89.ª, RF-HORARIO-DIAS-1) · horario por días ----
// Formato (el mismo que limpia business-portal y lee la app en src/lib/rider-friendly.ts):
//   { mismo, dias: { lun: { abre, turnos: [["13:00","16:00"],["20:30","23:00"]] }, … }, festivos: { modo, turnos } }
// ⚠️ El texto «Hoy: …» existe DOS veces: aquí (vista previa del perfil) y en la app (horarioHoy). Si cambia uno, el otro.
window.MC_DIAS = [
  { k: 'lun', l: 'Lunes' }, { k: 'mar', l: 'Martes' }, { k: 'mie', l: 'Miércoles' }, { k: 'jue', l: 'Jueves' },
  { k: 'vie', l: 'Viernes' }, { k: 'sab', l: 'Sábado' }, { k: 'dom', l: 'Domingo' },
]
window.mcTurnosTxt = function (t) { return (t || []).map(x => x[0] + '–' + x[1]).join(' y ') }
window.mcHorarioHoy = function (h, fecha) {
  if (!h || !h.dias) return ''
  const k = window.MC_DIAS[((fecha || new Date()).getDay() + 6) % 7].k
  const d = h.dias[k] || {}
  const cerrados = window.MC_DIAS.filter(x => !(h.dias[x.k] || {}).abre).map(x => x.l.toLowerCase())
  const cierra = cerrados.length === 7 ? '' : cerrados.length
    ? ' · Cierra ' + (cerrados.length === 1 ? cerrados[0] : cerrados.slice(0, -1).join(', ') + ' y ' + cerrados[cerrados.length - 1])
    : ''
  return (d.abre ? 'Hoy: ' + window.mcTurnosTxt(d.turnos) : 'Hoy cerrado') + cierra
}

// ---- MC-RF-OPINIONES-13OCT-2026 (107.ª, `RF-OPINIONES-1`) · lo que dicen los moteros del negocio ----
// Mario: «que vea que hay una opinión buena […] las fotos y los comentarios». Lo usan registro.html (antes de darse de alta)
// y el panel. `op` = { n, media, opiniones: [{ id?, estrellas, comentario, hizo, fotos, aparcamiento, autor, fecha, respuesta? }] },
// tal como lo devuelve mc_rf_opiniones_sitio. Va con data-noi18n: lo escrito por los moteros no se traduce; los rótulos
// salen en el idioma elegido (MC_LANG). `extra(o, div)` deja al panel añadir cosas a cada opinión (contestar).
window.mcOpiniones = function (cont, op, extra) {
  var en = window.MC_LANG === 'en'
  cont.setAttribute('data-noi18n', '')
  cont.innerHTML = ''
  if (!op || !op.n || !(op.opiniones || []).length) { cont.style.display = 'none'; return }
  var HIZO = en
    ? { dormir: 'stayed the night', cenar: 'had dinner', desayunar: 'had breakfast', comer: 'had lunch', tomar: 'had a drink', repostar: 'filled up', reparar: 'got the bike fixed' }
    : { dormir: 'durmió', cenar: 'cenó', desayunar: 'desayunó', comer: 'comió', tomar: 'tomó algo', repostar: 'repostó', reparar: 'le arreglaron la moto' }
  var APARCA = en ? { gratis: 'Free parking', pago: 'Paid parking', no: 'No parking' }
    : { gratis: 'Aparcamiento gratis', pago: 'Aparcamiento de pago', no: 'Sin aparcamiento' }
  var el = function (tag, css, txt) { var d = document.createElement(tag); if (css) d.style.cssText = css; if (txt != null) d.textContent = txt; return d }
  var mini = function (u) {
    return u.indexOf('/storage/v1/object/public/') >= 0
      ? u.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=240&height=240&resize=cover&quality=60' : u
  }
  cont.style.cssText = 'display:block;background:var(--cream);border:1.5px solid var(--card);border-radius:14px;padding:14px 16px;margin-bottom:18px'
  var media = op.media != null ? Number(op.media).toLocaleString(en ? 'en-GB' : 'es-ES') : null
  var cab = el('div', 'font-size:15px;font-weight:800;margin-bottom:4px')
  cab.textContent = en ? 'What riders already say about you' : 'Lo que ya dicen de vosotros los moteros'
  cont.appendChild(cab)
  var sub = el('div', 'font-size:13px;color:var(--gray);margin-bottom:6px')
  sub.textContent = (en ? (op.n === 1 ? '1 review' : op.n + ' reviews') : (op.n === 1 ? '1 opinión' : op.n + ' opiniones')) + (media ? ' · ★ ' + media : '')
  cont.appendChild(sub)
  op.opiniones.forEach(function (o) {
    var d = el('div', 'border-top:1px solid var(--card);padding:12px 0 4px')
    var l1 = el('div', 'font-size:13px')
    if (o.estrellas) { var s = el('span', 'color:#F5C518;letter-spacing:1px', '★'.repeat(o.estrellas)); l1.appendChild(s); l1.appendChild(el('span', 'color:#666;letter-spacing:1px', '★'.repeat(5 - o.estrellas))); l1.appendChild(document.createTextNode('  ')) }
    l1.appendChild(el('span', 'color:var(--gray)', o.autor || (en ? 'A rider' : 'Un motero')))
    if (o.fecha) l1.appendChild(el('span', 'color:var(--gray-light)', ' · ' + new Date(o.fecha).toLocaleDateString(en ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })))
    d.appendChild(l1)
    var h = (o.hizo || []).map(function (x) { return HIZO[x] }).filter(Boolean)
    var datos = []
    if (h.length) { var t = h.length === 1 ? h[0] : h.slice(0, -1).join(', ') + (en ? ' and ' : ' y ') + h[h.length - 1]; datos.push(t.charAt(0).toUpperCase() + t.slice(1)) }
    if (o.aparcamiento && APARCA[o.aparcamiento]) datos.push(APARCA[o.aparcamiento])
    if (datos.length) d.appendChild(el('div', 'font-size:12px;color:var(--gray);margin-top:3px', datos.join(' · ')))
    if (o.comentario) d.appendChild(el('div', 'font-size:14px;line-height:1.5;margin-top:6px;white-space:pre-line', '«' + o.comentario + '»'))
    if ((o.fotos || []).length) {
      var f = el('div', 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap')
      o.fotos.forEach(function (u) {
        var a = el('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'
        var im = el('img', 'width:88px;height:88px;object-fit:cover;border-radius:10px;display:block'); im.src = mini(u); im.alt = ''; im.loading = 'lazy'
        a.appendChild(im); f.appendChild(a)
      })
      d.appendChild(f)
    }
    if (extra) extra(o, d)
    cont.appendChild(d)
  })
}
