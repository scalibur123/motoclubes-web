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
