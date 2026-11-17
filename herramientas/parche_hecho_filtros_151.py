#!/usr/bin/env python3
"""ADMIN-HECHO-FILTROS-1 (151.ª, 17-nov-2026, Mario 17:59): las tarjetas de «Hecho» como filtros.

Una tarjeta por cada tipo que puede salir en la lista (sacados del código: mc_envios.que, foro, noticias, quitados, invitaciones
de Rider Friendly, llamadas a negocios, notas de contactos y los correos automáticos de email_send_log). Pulsas una → la lista
enseña solo ese tipo y la tarjeta queda marcada; «Todo» o la misma tarjeta otra vez → vuelve todo. Las de 0, en gris.
Idempotente: sentinela, copia .bak y comprobación de sintaxis con esbuild.
Uso: python3 herramientas/parche_hecho_filtros_151.py   (desde la carpeta motoclubes-web)
"""
import re, shutil, subprocess, sys, tempfile

P = 'admin/index.html'
SENT = 'ADMIN-HECHO-FILTROS-1'
s = open(P, encoding='utf-8').read()
if SENT in s:
    print('Ya estaba hecho (' + SENT + '). No toco nada.'); sys.exit(0)
shutil.copyfile(P, P + '.bak')

def rep(a, b):
    global s
    if s.count(a) != 1:
        sys.exit(f'❌ No encuentro (o hay {s.count(a)}): {a[:80]!r}')
    s = s.replace(a, b)

# 1) Estilo: tarjetas pequeñas, en una o dos filas; las de 0 en gris
rep('.cifra.pulsable{cursor:pointer;',
    '.cifras.chicas{grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px}.cifras.chicas .cifra{padding:10px 12px}'
    '.cifras.chicas .cifra b{font-size:20px}.cifras.chicas .cifra span{font-size:12px}.cifras.chicas .cifra.sel{padding:9px 11px}'
    '.cifra.cero{opacity:.45}.cifra.pulsable.sel:hover{border-color:var(--o)} /* ADMIN-HECHO-FILTROS-1 */\n.cifra.pulsable{cursor:pointer;')
rep('<div class="cifras" id="h-cifras"></div>', '<div class="cifras chicas" id="h-cifras"></div>')

# 2) Los tipos (orden de las tarjetas) y a cuál va cada línea
rep("let HECHO = [], hePet = 0\n", """let HECHO = [], hePet = 0
// ADMIN-HECHO-FILTROS-1 (151.ª, Mario 17:59): una tarjeta por tipo; pulsarla filtra la lista. heFiltro = null → todo.
let heFiltro = null
const HE_CAT = [['aviso', 'Avisos a riders'], ['correo', 'Correos a riders'], ['web', 'Altas en la web'], ['tester', 'Invitaciones y enlaces'],
  ['recuerdo', 'Recordatorios y ayudas'], ['escuchamos', 'Te escuchamos'], ['foro', 'Foro'], ['noticia', 'Noticias'], ['salida', 'Salidas en grupo'],
  ['negocio', 'Negocios'], ['rf', 'Rider Friendly'], ['contacto', 'Contactos'], ['lista', 'Quitados de la lista'], ['otro', 'Otros']]
// Cada línea de mc_envios a su tipo. Te escuchamos: «arreglo» o un título con su código MC-00xx (la respuesta a una incidencia).
function heCatEnvio(x, neg) {
  const t = String(x.titulo || '')
  if (/Rider Friendly/.test(t)) return 'rf'
  if (neg) return 'negocio'
  if (x.que === 'arreglo' || /\\bMC-\\d{3,}/.test(t)) return 'escuchamos'
  if (x.que === 'aviso') return 'aviso'
  if (x.que === 'correo') return 'correo'
  if (x.que === 'invitacion' || x.que === 'play' || x.que === 'testflight') return 'tester'
  if (x.que === 'recordatorio' || x.que === 'ayuda') return 'recuerdo'
  return 'otro'
}
const HE_LOG_CAT = { web_aviso_confirmar: 'web', 'notify-salida': 'salida', 'notify-salida-copia': 'salida', 'notify-feedback-resolved': 'escuchamos' }
""")
rep("L.push({ en: x.creado, auto: x.por === 'auto', que:", "L.push({ en: x.creado, auto: x.por === 'auto', cat: heCatEnvio(x, neg), que:")
rep("L.push({ en: x.created_at, auto: true, que: HE_LOG_TXT", "L.push({ en: x.created_at, auto: true, cat: HE_LOG_CAT[x.template_name] || 'otro', que: HE_LOG_TXT")
rep("for (const h of hilos.data || []) L.push({ en: h.created_at, que:", "for (const h of hilos.data || []) L.push({ en: h.created_at, cat: h.category === 'noticias' ? 'noticia' : 'foro', que:")
rep("for (const p of posts.data || []) L.push({ en: p.created_at, que:", "for (const p of posts.data || []) L.push({ en: p.created_at, cat: 'foro', que:")
rep("for (const m of marcadas) L.push({ en: m.marcado_at, que:", "for (const m of marcadas) L.push({ en: m.marcado_at, cat: 'foro', que:")
rep("for (const q of QUITADOS) L.push({ en: q.quitado_at, que:", "for (const q of QUITADOS) L.push({ en: q.quitado_at, cat: 'lista', que:")
rep("L.push({ en: a.enviada_en, que: 'Invitación a Rider Friendly'", "L.push({ en: a.enviada_en, cat: 'rf', que: 'Invitación a Rider Friendly'")
rep("if (x.en) L.push({ en: x.en, que: 'Llamada a negocio'", "if (x.en) L.push({ en: x.en, cat: 'negocio', que: 'Llamada a negocio'")
rep("if (x.fecha) L.push({ en: x.fecha, que: 'Nota de contacto'", "if (x.fecha) L.push({ en: x.fecha, cat: 'contacto', que: 'Nota de contacto'")

# 3) Las tarjetas y el filtro
old_pintar = re.search(r"function pintarHecho\(\) \{\n  const todo = .*?\n  \$\('h-filas'\)\.innerHTML = lista\.slice", s, re.S)
if not old_pintar:
    sys.exit('❌ No encuentro el principio de pintarHecho')
rep(old_pintar.group(0), """function pintarHecho() {
  const todo = $('h-quien').value === 'todo', base = HECHO.filter(x => todo || !x.auto)
  const n = {}; for (const x of base) n[x.cat || 'otro'] = (n[x.cat || 'otro'] || 0) + 1
  if (heFiltro && !HE_CAT.some(([k]) => k === heFiltro)) heFiltro = null
  const lista = heFiltro ? base.filter(x => (x.cat || 'otro') === heFiltro) : base // ADMIN-HECHO-FILTROS-1
  const caja = (k, v, t) => `<button type="button" class="card cifra pulsable${heFiltro === k ? ' sel' : ''}${v ? '' : ' cero'}" data-hc="${k}"><b>${v}</b><span>${t}</span></button>`
  $('h-cifras').innerHTML = caja('', base.length, 'Todo') + HE_CAT.map(([k, t]) => caja(k, n[k] || 0, t)).join('')
  $('h-filas').innerHTML = lista.slice""")
rep("|| `<tr><td colspan=\"5\" class=\"sub\">Nada en estos días${todo ? '' : ' (prueba «También lo automático»)'}.</td></tr>`",
    "|| `<tr><td colspan=\"5\" class=\"sub\">${heFiltro ? 'Nada de este tipo en estos días.' : 'Nada en estos días' + (todo ? '' : ' (prueba «Todo»)') + '.'}</td></tr>`")
rep("$('h-quien').onchange = () => pintarHecho()\n", """$('h-quien').onchange = () => pintarHecho()
$('h-cifras').onclick = (ev) => { // ADMIN-HECHO-FILTROS-1: «Todo» o la misma otra vez → todo
  const b = ev.target.closest('[data-hc]'); if (!b) return
  const k = b.dataset.hc || null
  heFiltro = !k || heFiltro === k ? null : k
  pintarHecho()
}
""")

open(P, 'w', encoding='utf-8').write(s)

# 4) Comprobación: el JavaScript de la página tiene que compilar
js = '\n'.join(re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', s, re.S))
with tempfile.NamedTemporaryFile('w', suffix='.mjs', delete=False) as f:
    f.write(js)
r = subprocess.run(['npx', '--yes', 'esbuild@0.24.0', '--log-level=error', f.name, '--outfile=/dev/null'], capture_output=True, text=True)
if r.returncode:
    shutil.copyfile(P + '.bak', P)
    sys.exit('❌ esbuild falla; dejo el fichero como estaba:\n' + r.stderr)
print('✅ ' + SENT + ' aplicado (copia en ' + P + '.bak)')
