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
window.MC_SERVICIOS = [
  { v: 'garaje_cubierto',  l: 'Garaje cubierto para motos' },
  { v: 'parking_vigilado', l: 'Parking a la vista o vigilado' },
  { v: 'lavado',           l: 'Manguera o zona de lavado' },
  { v: 'secado_equipo',    l: 'Sitio para secar ropa y guardar el equipo' },
  { v: 'herramientas',     l: 'Herramientas básicas' },
  { v: 'grupos',           l: 'Menú u horario para grupos' },
]
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
