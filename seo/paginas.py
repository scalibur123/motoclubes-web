#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SEO-PAGINAS-1 (133.ª, 31-oct-2026) · Las páginas de motoclubes.es pensadas para Google.

Mario (17:44-17:45): «¿la gente no busca aplicaciones para motos, de navegación? […] tenemos tantas cosas que podríamos estar
en todo […] hazlo, todo lo que puedas, vamos a potenciarlo». Search Console (31-oct) decía que solo nos encuentra quien ya
busca «motoclubes»; para «motoclubs», «moteros de España» o «app gps moto» no salimos. Google premia las páginas que
contestan UNA búsqueda: una página por cada cosa que la app hace bien, con texto de verdad.

Cómo se usa: se edita el contenido de PAGINAS (abajo) y se ejecuta `python3 seo/paginas.py` desde la raíz de la web.
Rehace cada carpeta (navegador-gps-moto/, salir-en-grupo-en-moto/, planificador-rutas-moto/, motoclubs/) con la cabecera,
el menú y el pie de /por-dentro/ (la misma marca y la misma hoja de estilos). Las páginas nuevas van también a sitemap.xml.

Reglas del texto (A71 y marketing.md): para vender, en positivo, en idioma de motero; solo lo que ya hace la app publicada;
sin precios; sin nombrar a otras apps. Lo que aún no tiene todo el mundo se dice como «muy pronto».
"""
import html, io, json, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.motoclubes.es"

# Los iconos de las tarjetas de la portada (index.html), por nombre.
def iconos():
    s = io.open(os.path.join(RAIZ, "index.html"), encoding="utf8").read()
    pares = re.findall(r'<div class="tarjeta"><span class="ico">(<svg.*?</svg>)</span><h3>(.*?)</h3>', s)
    return {h: svg for svg, h in pares}

I = iconos()
ICO = {
    "mapa": I["Planifica"], "brujula": I["Navega"], "grupo": I["Rueda en grupo"], "gpx": I["Importa, edita y exporta GPX"],
    "pin": I["Paradas y puntos de paso"], "monte": I["Buscador de puertos"], "perfil": I["El perfil real de la ruta"],
    "vuela": I["Vuela la ruta antes de hacerla"], "voz": I["Intercom del grupo"], "vivo": I["Seguimiento en vivo"],
    "gasolina": I["Gasolineras de cuatro países"], "lugar": I["Tus lugares"], "coche": I["CarPlay"],
    "candado": I["Pública o privada, tú decides"], "fotos": I["Las fotos de la salida"], "retos": I["Logros y retos"],
    "foro": I["Foro de la comunidad"], "rf": I["Rider Friendly"],
}

PREGUNTA_DESCARGA = ("¿Cuándo la puedo descargar?",
    "Está terminando su fase de pruebas en carretera con riders reales. Déjanos tu correo en la portada y te avisamos el día "
    "que salga en App Store y en Google Play. Si quieres probarla antes, apúntate como tester.")

PAGINAS = [
    {
        "carpeta": "navegador-gps-moto",
        "title": "Navegador GPS para moto: voz en el casco, curvas y CarPlay · MOTOCLUBes",
        "description": "El navegador GPS pensado para la moto: rutas por curvas o sin peajes, voz por el intercomunicador, radares, "
                       "gasolineras con precio y CarPlay. Sigue guiándote con el móvil bloqueado en el bolsillo.",
        "rotulo": "Navegador GPS para moto",
        "h1": "El navegador que piensa como un motero",
        "entradilla": "Una app de GPS hecha para la moto, no para el coche: te lleva por la carretera que te apetece rodar, te habla "
                      "por el intercomunicador y sigue guiándote con el móvil en el bolsillo.",
        "tarjetas": [
            ("brujula", "Elige cómo quieres rodar", "Rápida, por curvas o por pista, con o sin peajes. Y a mitad de camino, «desde aquí, rápida» si se te hace tarde."),
            ("voz", "La voz, en el casco", "Indicaciones cortas y claras por tu intercomunicador o tus auriculares, sin cortarte la música."),
            ("vivo", "Con el móvil bloqueado", "La navegación sigue con el GPS activo aunque el teléfono vaya en el bolsillo o con la pantalla apagada."),
            ("pin", "Radares y límite de velocidad", "Te avisa de los radares fijos y de tramo de tu ruta, y del límite antes de que baje. En Francia, las zonas de peligro, como marca su ley."),
            ("gasolina", "Gasolineras con precio", "Más de 24.000 en España, Francia, Portugal y Andorra, con el precio de cada mañana. Las baratas, en verde."),
            ("mapa", "Recalcula al momento", "Si te sales de la ruta, vuelve a calcular en un par de segundos y te devuelve a tu carretera."),
            ("lugar", "Sin cobertura, también", "La ruta se queda guardada en el móvil y la navegación sigue aunque te quedes sin señal, que en la montaña pasa."),
            ("coche", "En la pantalla de la moto", "Con CarPlay, la ruta, las paradas y los avisos salen en la pantalla de la moto o del coche. Android Auto, muy pronto."),
            ("retos", "Todo lo que ruedas, guardado", "Cada salida queda grabada con su recorrido real, los kilómetros y la media en marcha."),
        ],
        "faq": [
            ("¿Me sirve como GPS de moto sin comprar un navegador?",
             "Sí. Con el móvil en el soporte o en el bolsillo y tu intercomunicador tienes la voz, el mapa y los avisos. Y si tu moto tiene CarPlay, la ruta sale en su pantalla."),
            ("¿Puedo navegar un GPX que ya tengo?",
             "Sí. Lo importas, la app lo prepara y lo navegas con voz como cualquier otra ruta."),
            ("¿Funciona en iPhone y en Android?",
             "Sí. La app es nativa en los dos."),
            ("¿Necesito un intercomunicador concreto?",
             "No. Vale cualquier auricular o intercomunicador Bluetooth que ya lleves en el casco, sea de la marca que sea."),
            PREGUNTA_DESCARGA,
        ],
    },
    {
        "carpeta": "salir-en-grupo-en-moto",
        "title": "Salir en grupo en moto: el grupo en el mapa y radio en el casco · MOTOCLUBes",
        "description": "Organiza la salida en moto con tu grupo: la ruta para todos, cada casco en el mapa en directo y la radio del "
                       "grupo por el intercomunicador que ya llevas, sea de la marca que sea. iPhone y Android.",
        "rotulo": "Salidas en grupo",
        "h1": "Sal en grupo y que nadie se pierda",
        "entradilla": "La ruta, la quedada, el mapa del grupo y la voz en un solo sitio. Se acabó el «¿dónde estáis?» en el WhatsApp a mitad de puerto.",
        "tarjetas": [
            ("grupo", "Publica la salida", "Día, hora, punto de encuentro y la ruta. Los del grupo dicen «voy» y les llega el aviso al móvil."),
            ("mapa", "La ruta del día, con el tiempo", "La mañana de la salida cada uno recibe la ruta del día y el tiempo que hará al salir y al llegar."),
            ("vivo", "Todos los cascos en el mapa", "Durante la salida ves dónde va cada compañero, con el color de su casco. Sabes quién se ha quedado atrás sin parar a llamar."),
            ("voz", "La radio del grupo", "Habláis entre todos por el intercomunicador que ya lleváis, de la marca que sea. Va por los datos del móvil: no depende del alcance del aparato."),
            ("brujula", "Con el móvil en el bolsillo", "El mapa del grupo y la radio siguen funcionando con la pantalla apagada."),
            ("perfil", "Viajes de varios días", "Etapas por días, cada una con su ruta, y el GPX para quien quiera llevarla en su navegador."),
            ("fotos", "El resumen de la salida", "Al terminar: quién fue, los kilómetros de cada uno y las fotos que sube cada rider, guardado en el historial del grupo."),
            ("candado", "Tu posición, cuando tú quieras", "El mapa en directo solo funciona durante la salida, y cada rider puede apagarlo en su perfil."),
            ("coche", "iPhone y Android, juntos", "Da igual el móvil de cada uno: el grupo, la salida, el mapa y la voz funcionan entre los dos."),
        ],
        "faq": [
            ("¿Necesito un intercomunicador de 400 €?",
             "No. La voz del grupo va por los datos del móvil, así que vale cualquier auricular o intercomunicador Bluetooth que ya tengas en el casco. Y no depende del alcance del aparato: mientras haya cobertura, seguís hablando."),
            ("¿Todo el mundo ve dónde estoy?",
             "No por defecto. El seguimiento en vivo solo funciona durante una salida, hay que activarlo en el grupo, y cada rider tiene su propio interruptor en el perfil para no compartir su posición."),
            ("¿Sirve para cuatro amigos o solo para clubes?",
             "Para los dos. Vale igual para un club con su estructura que para cuatro amigos que salen a desayunar el domingo."),
            ("¿Y si alguien del grupo no lleva intercomunicador?",
             "Sigue al grupo en el mapa igual que los demás. Para hablar por la radio le hace falta un micrófono: intercomunicador o auriculares con micro."),
            PREGUNTA_DESCARGA,
        ],
    },
    {
        "carpeta": "planificador-rutas-moto",
        "title": "Planificador de rutas en moto: curvas, puertos, etapas y GPX · MOTOCLUBes",
        "description": "Planifica tu ruta en moto en el móvil o en el ordenador: por curvas o sin peajes, con paradas, los puertos "
                       "que cruzas, el desnivel, etapas de varios días y GPX para llevarla donde quieras.",
        "rotulo": "Planificador de rutas en moto",
        "h1": "Planifica la ruta que de verdad quieres rodar",
        "entradilla": "Busca un pueblo, un puerto o pon el dedo en el mapa. MOTOCLUBes traza la ruta por la carretera que buscas y te "
                      "dice todo lo que vas a encontrar antes de salir.",
        "tarjetas": [
            ("brujula", "Por curvas, rápida o por pista", "Elige el tipo de carretera y si quieres peajes o no. Las curvas, por secundarias y comarcales."),
            ("pin", "Paradas con sentido", "Gasolinera, restaurante, hotel o el sitio que te apetece ver. Los puntos por los que solo pasas no ensucian el mapa."),
            ("monte", "Los puertos que cruzas", "15.478 puertos y collados de España y Francia. La ruta te dice cuántos pasas, con su altura."),
            ("perfil", "El perfil real", "Desnivel de subida y de bajada, altitud máxima y mínima, y las curvas contadas una a una."),
            ("mapa", "Viajes de varios días", "Etapas con su color, kilómetros y tiempo. ¿Tienes un GPX larguísimo? La app lo reparte en etapas por días o por kilómetros."),
            ("gpx", "Importa y exporta GPX", "Trae tus rutas de siempre y llévate las nuevas al navegador de tu moto cuando quieras."),
            ("lugar", "En el ordenador, a lo grande", "Planifica en la pantalla del ordenador y la tienes al momento en el móvil para navegarla."),
            ("vuela", "Vuélala antes de hacerla", "Vista aérea de todo el recorrido, para ver por dónde vas a pasar sin salir de casa."),
            ("fotos", "Compártela y hazle un vídeo", "Tu ruta en una página que cualquiera puede ver, y un vídeo vertical del recorrido para tus redes."),
        ],
        "boton_extra": ("/planificar/", "🖥️ Planifica en el ordenador"),
        "faq": [
            ("¿Puedo planificar desde el ordenador?",
             "Sí, en motoclubes.es/planificar, con tu cuenta. La ruta que guardas allí la tienes al momento en el móvil para navegarla."),
            ("¿Puedo llevar la ruta al navegador de mi moto?",
             "Sí. Descargas el GPX y lo cargas en tu navegador, sea el de la moto o uno de manillar."),
            ("¿Sabe por qué puertos de montaña paso?",
             "Sí. Mientras planificas, la app te dice los puertos y collados de la ruta, con su altura."),
            ("¿Puedo planificar un viaje de varios días?",
             "Sí, por etapas: cada día empieza donde acabó el anterior, con sus kilómetros y su tiempo."),
            PREGUNTA_DESCARGA,
        ],
    },
    {
        "carpeta": "motoclubs",
        "title": "Motoclubs y grupos de moteros: tu club en una sola app · MOTOCLUBes",
        "description": "Crea tu motoclub o tu grupo de moteros en MOTOCLUBes: miembros, chat, salidas con su ruta, mapa del grupo en "
                       "directo, radio en el casco, fotos e historial. Público o privado. iPhone y Android.",
        "rotulo": "Motoclubs y grupos de moteros",
        "h1": "Tu motoclub, tu peña o tu grupo del domingo, en una app",
        "entradilla": "Da igual que seáis un club con chaleco y parches o cuatro amigos que salen a desayunar: un grupo en MOTOCLUBes "
                      "es la gente con la que ruedas, y todo lo de rodar juntos está ahí.",
        "tarjetas": [
            ("candado", "Público o privado", "Un grupo público se encuentra en la comunidad y cualquiera puede pedir entrar; uno privado, solo con invitación."),
            ("grupo", "Invita por WhatsApp", "Mandas un enlace y entran. Tú decides si es para una persona o para varias."),
            ("foro", "El chat del grupo", "Las conversaciones del club, dentro de la app y junto a vuestras salidas."),
            ("mapa", "Salidas con su ruta", "Publicas la salida con día, hora, punto de encuentro y ruta, y ves quién va."),
            ("voz", "Mapa y radio en ruta", "En la salida, todos los cascos en el mapa y la radio del grupo por el intercomunicador."),
            ("fotos", "La historia del club", "Cada salida queda en el historial con su resumen, los kilómetros y las fotos de todos."),
            ("retos", "Comunidad motera", "El foro, las rutas que publican otros moteros, los rankings y los retos."),
            ("rf", "Sitios Rider Friendly", "Bares, hoteles y talleres que tratan bien al motero, para parar con el grupo."),
        ],
        "faq": [
            ("¿Puedo encontrar grupos de moteros por mi zona?",
             "Sí. En la comunidad de la app están los grupos públicos y puedes pedir entrar en el que te encaje. Y si no hay ninguno por tu zona, creas el tuyo en un minuto."),
            ("¿Es solo para clubes con chaleco y parches?",
             "No. Vale igual para un club con su estructura que para cuatro amigos que salen a desayunar el domingo. Un grupo es simplemente la gente con la que ruedas."),
            ("¿Y si en el club unos llevan iPhone y otros Android?",
             "Da igual. La app es nativa en las dos plataformas y todo funciona entre ellas: el grupo, la salida, el mapa y la voz."),
            ("¿Qué pasa con los datos de los socios?",
             "Cada rider decide qué comparte: su posición solo se ve durante una salida y la puede apagar en su perfil. Un grupo privado solo lo ven sus miembros."),
            PREGUNTA_DESCARGA,
        ],
    },
]

NOMBRES_CORTOS = {
    "navegador-gps-moto": "Navegador GPS para moto",
    "salir-en-grupo-en-moto": "Salir en grupo en moto",
    "planificador-rutas-moto": "Planificador de rutas en moto",
    "motoclubs": "Motoclubs y grupos de moteros",
}

e = html.escape

def plantilla():
    """Cabecera (menú y logo) y pie de /por-dentro/, que ya es una página interior con la marca."""
    s = io.open(os.path.join(RAIZ, "por-dentro", "index.html"), encoding="utf8").read()
    cuerpo_ini = s.index("<body>")
    cab = s[cuerpo_ini:s.index("</header>") + len("</header>")]
    # sin el selector de idioma: estas páginas solo existen en castellano
    cab = re.sub(r'<details class="idiomas">.*?</details>', "", cab, flags=re.S)
    pie = s[s.index("<footer>"):]
    return cab, pie

def pagina(p, cab, pie):
    url = f"{BASE}/{p['carpeta']}/"
    app = {
        "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "MOTOCLUBes",
        "operatingSystem": "iOS, Android", "applicationCategory": "TravelApplication",
        "description": p["description"], "url": url,
        "publisher": {"@type": "Organization", "name": "MOTOCLUBES TECH S.L.", "url": BASE + "/"},
    }
    faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]}
    migas = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "MOTOCLUBes", "item": BASE + "/"},
        {"@type": "ListItem", "position": 2, "name": NOMBRES_CORTOS[p["carpeta"]], "item": url}]}
    tarjetas = "".join(
        f'<div class="tarjeta"><span class="ico">{ICO[i]}</span><h3>{e(t)}</h3><p>{e(d)}</p></div>' for i, t, d in p["tarjetas"])
    faqs = "".join(f'<details class="faq"><summary>{e(q)}<i></i></summary><p>{e(a)}</p></details>' for q, a in p["faq"])
    extra = ""
    if p.get("boton_extra"):
        extra = f'\n      <a class="boton boton-suave" href="{p["boton_extra"][0]}">{e(p["boton_extra"][1])}</a>'
    otras = "".join(f'<a class="boton boton-suave" href="/{c}/">{e(n)}</a>' for c, n in NOMBRES_CORTOS.items() if c != p["carpeta"])
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<!-- SEO-PAGINAS-1 · generada por seo/paginas.py: los cambios, allí (si se toca aquí, se pierde al volver a generar) -->
<title>{e(p['title'])}</title>
<meta name="description" content="{e(p['description'])}">
<meta name="theme-color" content="#0E0E0E">
<link rel="canonical" href="{url}">
<link rel="icon" type="image/png" href="/img/helmet-256.png">
<link rel="apple-touch-icon" href="/img/helmet-256.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MOTOCLUBes">
<meta property="og:locale" content="es">
<meta property="og:title" content="{e(p['title'])}">
<meta property="og:description" content="{e(p['description'])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(p['title'])}">
<meta name="twitter:description" content="{e(p['description'])}">
<meta name="twitter:image" content="{BASE}/img/og.png">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/mc.css?v=15oct1">
<script type="application/ld+json">{json.dumps(app, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(faq, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(migas, ensure_ascii=False)}</script>
</head>
{cab}

<section>
  <div class="envoltura">
    <p class="rotulo">{e(p['rotulo'])}</p>
    <h1>{e(p['h1'])}</h1>
    <p class="entradilla">{e(p['entradilla'])}</p>
    <div class="acciones" style="animation:none;justify-content:flex-start">
      <a class="boton boton-principal" href="/#avisame">Avísame cuando salga</a>
      <a class="boton boton-suave" href="/probar/">Quiero probarla ya</a>{extra}
    </div>
  </div>
</section>

<section class="franja">
  <div class="envoltura">
    <h2>Lo que hace por ti</h2>
    <div class="rejilla rejilla-3">{tarjetas}</div>
  </div>
</section>

<section>
  <div class="envoltura">
    <p class="rotulo">Preguntas frecuentes</p>
    <h2>Lo que nos preguntáis</h2>
    <div class="faqs">{faqs}</div>
  </div>
</section>

<section class="franja">
  <div class="envoltura">
    <h2>Todo MOTOCLUBes</h2>
    <p class="entradilla">Planificar la ruta, navegarla en moto y rodarla con tu gente, en una sola app hecha por moteros.</p>
    <div class="acciones" style="animation:none;justify-content:flex-start">{otras}<a class="boton boton-suave" href="/por-dentro/">La app por dentro</a><a class="boton boton-suave" href="/">Portada</a></div>
  </div>
</section>

{pie}"""

def sitemap(carpetas):
    p = os.path.join(RAIZ, "sitemap.xml")
    s = io.open(p, encoding="utf8").read()
    for c in carpetas:
        loc = f"<loc>{BASE}/{c}/</loc>"
        if loc not in s:
            s = s.replace("</urlset>", f"  <url>{loc}<lastmod>2026-10-31</lastmod><priority>0.9</priority></url>\n</urlset>")
    io.open(p, "w", encoding="utf8").write(s)

if __name__ == "__main__":
    cab, pie = plantilla()
    for p in PAGINAS:
        d = os.path.join(RAIZ, p["carpeta"])
        os.makedirs(d, exist_ok=True)
        io.open(os.path.join(d, "index.html"), "w", encoding="utf8").write(pagina(p, cab, pie))
        print("hecha", p["carpeta"])
    sitemap([p["carpeta"] for p in PAGINAS])
    print("sitemap al día")
