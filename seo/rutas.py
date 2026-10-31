#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RUTAS-WEB-1 (133.ª, 31-oct-2026) · Una página de Google por cada ruta pública de Mario que alguien buscaría.

Mario (18:56): «adelante» con las rutas como páginas propias; solo las suyas (las de otros riders, más adelante y
preguntándoles). Elegidas el 31-oct (19:00): Transpirenaica y sus 4 días, La ruta del silencio (la del 17-sep, en grupo)
y sus 2 días, Barcelona → Beceite, Santander → Potes y Cantavieja → Ciudad Real.

Datos: seo/rutas_datos.csv, sacado por Mario con db/rutas_web_datos_133.sql (repo de la app). Para poner una ruta
nueva: se añade su id a ese SQL, Mario lo vuelve a ejecutar, se cambia el CSV y se añade su ficha en FICHAS.

Cómo se usa: `python3 seo/rutas.py` desde la raíz de la web. Hace /rutas-en-moto/ (índice) y /rutas-en-moto/<slug>/.

Reglas:
- Solo lo que sale de los datos o de lo que Mario contó (marketing.md); nada de memoria. Sin fechas de viaje salvo la
  Transpirenaica (9-12 oct, documentada).
- El dibujo NO enseña los 3 primeros ni los 3 últimos km: muchas salen de casa de Mario.
- Fuera los «puertos» que son túneles, y el Col de la Pierre Saint-Martin (Mario no quiso nombrarlo en los reels).
- El mapa de verdad y el GPX, en /rutas/?id= (la página que ya existe).
"""
import csv, html, io, json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.motoclubes.es"
CARPETA = "rutas-en-moto"
e = html.escape

FUERA = ("Col de la Pierre Saint-Martin",)

# id → ficha escrita a mano (slug, h1, texto). «dias_de» enlaza los días con su ruta madre.
FICHAS = {
 "93195c53-3c02-44e7-ad4b-62abd13d1a9e": dict(
   slug="transpirenaica-4-dias",
   h1="Transpirenaica en moto: 4 días por los Pirineos",
   corto="Transpirenaica en moto",
   texto="Cuatro días cruzando los Pirineos de punta a punta, del Mediterráneo al Cantábrico y vuelta, por los dos "
         "lados de la frontera. La rodó Mario (Cantabrón Motero, el creador de MOTOCLUBes) con un compañero del 9 al 12 "
         "de octubre de 2026, planificada y navegada con la app. Cada día tiene su propia página, con sus carreteras."),
 "21147591-9e63-47ac-ae10-f06e6de12223": dict(
   slug="transpirenaica-dia-1-barcelona-valencia-d-aneu", madre="93195c53-3c02-44e7-ad4b-62abd13d1a9e", dia=1,
   h1="Transpirenaica, día 1: Barcelona → València d’Àneu",
   corto="Día 1 · Barcelona → València d’Àneu",
   texto="El primer día sube de Barcelona por el lado francés hasta la Cerdanya, entra en Andorra y acaba en el Pallars. "
         "Las carreteras que destaca Mario: la N-20 de Porta al Port d’Envalira y la N-260 de Adrall a Sort por el "
         "Port del Cantó."),
 "b38e029a-2566-4d5f-a05b-ca12ed0cc447": dict(
   slug="transpirenaica-dia-2-valencia-d-aneu-piedrafita-de-jaca", madre="93195c53-3c02-44e7-ad4b-62abd13d1a9e", dia=2,
   h1="Transpirenaica, día 2: València d’Àneu → Piedrafita de Jaca",
   corto="Día 2 · València d’Àneu → Piedrafita de Jaca",
   texto="El día de los grandes cols franceses. Las carreteras que destaca Mario: la D618 de Vielha al Col de "
         "Peyresourde, la D918 de Arrens-Marsous por el Soulor al Col d’Aubisque y la D934 de Laruns al Col du Pourtalet, "
         "para volver a entrar en Huesca."),
 "af97ef23-2ee2-4793-a5fe-557d4132d3bf": dict(
   slug="transpirenaica-dia-3-piedrafita-de-jaca-hondarribia", madre="93195c53-3c02-44e7-ad4b-62abd13d1a9e", dia=3,
   h1="Transpirenaica, día 3: Piedrafita de Jaca → Hondarribia",
   corto="Día 3 · Piedrafita de Jaca → Hondarribia",
   texto="Para Mario, el mejor de los cuatro días. Del valle de Aspe al Roncal (de Bedous a Isaba), la NA-140 y la "
         "NA-2012 de Isaba a Ochagavía y la Selva de Irati, y la NA-138 y la NA-1740 de Saigots a Eugi y el puerto de "
         "Artesiaga (984 m) hasta Elizondo, para acabar en el Cantábrico."),
 "b1e303d1-f08a-46f6-b503-70ba20fc2681": dict(
   slug="transpirenaica-dia-4-hondarribia-barcelona", madre="93195c53-3c02-44e7-ad4b-62abd13d1a9e", dia=4,
   h1="Transpirenaica, día 4: Hondarribia → Barcelona",
   corto="Día 4 · Hondarribia → Barcelona",
   texto="La vuelta a casa, el día más largo: de Hondarribia por Navarra y el Prepirineo de Huesca, cruzando el "
         "puerto de Monrepós, y por Lleida hasta Barcelona."),
 "b67023ce-7003-49d5-bb97-d9b7dab9851e": dict(
   slug="ruta-del-silencio-maestrazgo-2-dias",
   h1="La Ruta del Silencio en moto: 2 días al Maestrazgo desde Barcelona",
   corto="La Ruta del Silencio en moto",
   texto="Dos días al Maestrazgo de Teruel, con noche en Cantavieja, que hicimos en grupo con MOTOCLUBes. La vuelta "
         "baja de Cantavieja por la A-1702, la carretera panorámica de Teruel conocida como la Ruta del Silencio, y "
         "regresa a Barcelona por las Terres de l’Ebre."),
 "87789914-17f9-4f80-a267-f9f3b9e36558": dict(
   slug="ruta-del-silencio-dia-1-barcelona-cantavieja", madre="b67023ce-7003-49d5-bb97-d9b7dab9851e", dia=1,
   h1="Ruta del Silencio, día 1: Barcelona → Cantavieja",
   corto="Día 1 · Barcelona → Cantavieja",
   texto="La ida al Maestrazgo: sale de Barcelona por el Coll de la Creu d’Ordal, baja hacia las Terres de l’Ebre y "
         "sube por el Port de Torre Miró hasta Cantavieja, donde se hace noche."),
 "d1d78251-4332-426b-9a0e-dfcfbe2650f0": dict(
   slug="ruta-del-silencio-dia-2-cantavieja-barcelona", madre="b67023ce-7003-49d5-bb97-d9b7dab9851e", dia=2,
   h1="Ruta del Silencio, día 2: Cantavieja → Barcelona",
   corto="Día 2 · Cantavieja → Barcelona",
   texto="El día de la Ruta del Silencio: de Cantavieja por la A-1702, con el Puerto de Villarluengo, el Collado Frío "
         "y el Collado del Herrero, y vuelta a Barcelona por las Terres de l’Ebre y el Coll de Lilla."),
 "ddfa8ba0-d7a1-4025-91a3-9f2748efbcca": dict(
   slug="barcelona-beceite",
   h1="De Barcelona a Beceite en moto, por el Priorat",
   corto="Barcelona → Beceite",
   texto="Una jornada de curvas de Barcelona a Beceite, en el Matarraña de Teruel: por el Coll del Bruc y el "
         "Priorat (Coll de Porrera y Coll de la Teixeta)."),
 "c2a08b36-a3a7-4e9e-9158-5e572d9a8353": dict(
   slug="santander-potes",
   h1="De Santander a Potes en moto, a los pies de los Picos de Europa",
   corto="Santander → Potes",
   texto="De Santander a Potes, la capital de Liébana, por el interior de Cantabria y el Collado de Carmona, y "
         "entrando en Liébana por el desfiladero de La Hermida."),
 "042be797-b742-4386-b4f9-17b4aea261a5": dict(
   slug="cantavieja-ciudad-real",
   h1="De Cantavieja a Ciudad Real en moto, del Maestrazgo a La Mancha",
   corto="Cantavieja → Ciudad Real",
   texto="Del Maestrazgo a La Mancha en un día: el Puerto de Cantavieja (1.420 m) al principio, bajada hacia Valencia "
         "y por La Mancha hasta Ciudad Real."),
}

def miles(n):
    return f"{int(round(float(n))):,}".replace(",", ".")

def leer():
    filas = list(csv.DictReader(io.open(os.path.join(RAIZ, "seo", "rutas_datos.csv"), encoding="utf8")))
    out = {}
    for f in filas:
        if f["id"] not in FICHAS:
            continue
        f.update(FICHAS[f["id"]])
        pts = [tuple(map(float, p.split(","))) for p in f["trazado"].split(";") if p]
        f["pts"] = pts
        f["puertos_l"] = []
        for p in (f["puertos"] or "").split(" | "):
            m = re.match(r"(.*) \((\d+|\?) m\)$", p.strip())
            if not m or m.group(1).startswith("Túnel") or m.group(1) in FUERA:
                continue
            f["puertos_l"].append((m.group(1), m.group(2)))
        out[f["id"]] = f
    return out

def km_entre(a, b):
    la = math.radians((a[0] + b[0]) / 2)
    return math.hypot((a[0] - b[0]) * 111.32, (a[1] - b[1]) * 111.32 * math.cos(la))

def recortar(pts, km=3.0):
    """Quita los primeros y los últimos `km` del dibujo (no enseñar desde qué portal se sale)."""
    if len(pts) < 10:
        return pts
    ini, fin = pts[0], pts[-1]
    i = 0
    while i < len(pts) - 2 and km_entre(pts[i], ini) < km:
        i += 1
    j = len(pts) - 1
    while j > i + 1 and km_entre(pts[j], fin) < km:
        j -= 1
    return pts[i:j + 1]

def svg(pts, W=1000, H=560, M=30, grueso=6, puntos=True):
    pts = recortar(pts)
    lat0 = math.radians(sum(p[0] for p in pts) / len(pts))
    xs = [p[1] * math.cos(lat0) for p in pts]
    ys = [p[0] for p in pts]
    ax, bx, ay, by = min(xs), max(xs), min(ys), max(ys)
    k = min((W - 2 * M) / max(bx - ax, 1e-9), (H - 2 * M) / max(by - ay, 1e-9))
    dx = (W - (bx - ax) * k) / 2
    dy = (H - (by - ay) * k) / 2
    P = [(dx + (x - ax) * k, dy + (by - y) * k) for x, y in zip(xs, ys)]
    d = " ".join(("M" if i == 0 else "L") + f"{x:.1f} {y:.1f}" for i, (x, y) in enumerate(P))
    extra = ""
    if puntos:
        extra = (f'<circle cx="{P[0][0]:.1f}" cy="{P[0][1]:.1f}" r="11" fill="#FF7A1A" stroke="#0E0E0E" stroke-width="4"/>'
                 f'<circle cx="{P[-1][0]:.1f}" cy="{P[-1][1]:.1f}" r="11" fill="#fff" stroke="#0E0E0E" stroke-width="4"/>')
    return (f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Dibujo del recorrido" style="width:100%;height:auto;display:block">'
            f'<path d="{d}" fill="none" stroke="#FF7A1A" stroke-width="{grueso}" stroke-linejoin="round" stroke-linecap="round"/>'
            f'{extra}</svg>')

def horas(minutos):
    m = int(float(minutos))
    h, r = divmod(m, 60)
    return f"{h} h {r:02d} min" if h else f"{r} min"

def datos(f):
    filas = [("Distancia", f"{miles(f['km'])} km")]
    if int(f["dias"]) > 1:
        filas.append(("Días", f["dias"]))
    if f["minutos_previstos"] not in ("", "null"):
        filas.append(("Al volante", "unas " + horas(f["minutos_previstos"]) if int(f["dias"]) == 1
                      else f"unas {round(int(f['minutos_previstos']) / 60)} h en total"))
    if f["curvas"] not in ("", "null", "0"):
        filas.append(("Curvas", miles(f["curvas"])))
    if f["desnivel_subida_m"] not in ("", "null"):
        filas.append(("Desnivel de subida", f"{miles(f['desnivel_subida_m'])} m"))
    if f["altitud_max_m"] not in ("", "null"):
        filas.append(("Altitud máxima", f"{miles(f['altitud_max_m'])} m"))
    if f["puertos_l"]:
        filas.append(("Puertos y collados", str(len(f["puertos_l"]))))
    return filas

def desde_hasta(f):
    a = f["municipio_inicio"] or f["provincia_inicio"]
    b = f["municipio_fin"] or f["provincia_fin"]
    return a, b

def descripcion(f):
    a, b = desde_hasta(f)
    s = f"{f['corto']}: {miles(f['km'])} km"
    if int(f["dias"]) > 1:
        s += f" en {f['dias']} días"
    if f["puertos_l"]:
        s += f" y {len(f['puertos_l'])} puertos"
    s += ". Mapa, datos y GPX de la ruta, planificada con MOTOCLUBes, la app para moteros."
    return s

def plantilla():
    from paginas import plantilla as p
    cab, pie = p()
    return cab, pie

def cabeza(title, desc, url):
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<!-- RUTAS-WEB-1 · generada por seo/rutas.py: los cambios, allí (si se toca aquí, se pierde al volver a generar) -->
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#0E0E0E">
<link rel="canonical" href="{url}">
<link rel="icon" type="image/png" href="/img/helmet-256.png">
<link rel="apple-touch-icon" href="/img/helmet-256.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="MOTOCLUBes">
<meta property="og:locale" content="es">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/mc.css?v=15oct1">
<style>
.ruta-mapa{{background:#141414;border:1px solid var(--borde);border-radius:18px;padding:14px;margin:26px 0 8px}}
.ruta-nota{{font-size:13px;color:var(--texto-2);margin:0 0 26px}}
.ruta-datos{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:0 0 30px}}
.ruta-datos div{{background:#141414;border:1px solid var(--borde);border-radius:14px;padding:14px 16px}}
.ruta-datos b{{display:block;font-size:22px;color:#fff}}
.ruta-datos span{{font-size:13px;color:var(--texto-2)}}
.ruta-puertos{{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 0;padding:0;list-style:none}}
.ruta-puertos li{{background:var(--naranja-suave);color:#fff;border-radius:999px;padding:7px 13px;font-size:14px}}
.ruta-puertos li small{{color:var(--naranja);font-weight:700;margin-left:6px}}
.rutas-lista{{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}}
.rutas-lista a{{display:block;background:#141414;border:1px solid var(--borde);border-radius:18px;padding:14px;color:#fff;text-decoration:none}}
.rutas-lista a:hover{{border-color:var(--naranja)}}
.rutas-lista h3{{margin:12px 0 4px;font-size:18px}}
.rutas-lista p{{margin:0;font-size:14px;color:var(--texto-2)}}
</style>
"""

def migas_ld(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)]}

def acciones(f):
    return (f'<div class="acciones" style="animation:none;justify-content:flex-start">'
            f'<a class="boton boton-principal" href="/rutas/?id={f["id"]}">Ver el mapa y bajar el GPX</a>'
            f'<a class="boton boton-suave" href="/#avisame">Avísame cuando salga la app</a></div>')

def pagina_ruta(f, todas, cab, pie):
    url = f"{BASE}/{CARPETA}/{f['slug']}/"
    title = f"{f['h1']} · mapa y GPX · MOTOCLUBes"
    desc = descripcion(f)
    a, b = desde_hasta(f)
    datos_html = "".join(f"<div><b>{e(str(v))}</b><span>{e(k)}</span></div>" for k, v in datos(f))
    puertos_html = ""
    if f["puertos_l"]:
        lis = "".join(f"<li>{e(n)}<small>{miles(m) + ' m' if m != '?' else ''}</small></li>" for n, m in f["puertos_l"])
        puertos_html = (f'<h2>Puertos y collados por los que pasa</h2><p class="entradilla">En el orden en que se pasan, '
                        f'sacados del trazado de la ruta.</p><ul class="ruta-puertos">{lis}</ul>')
    # días (si es ruta madre) o vuelta a la madre y días hermanos
    hijos = sorted([t for t in todas.values() if t.get("madre") == f["id"]], key=lambda t: t["dia"])
    rel = ""
    migas = [("MOTOCLUBes", BASE + "/"), ("Rutas en moto", f"{BASE}/{CARPETA}/")]
    if hijos:
        tarjetas = "".join(tarjeta(t) for t in hijos)
        rel = f'<section class="franja"><div class="envoltura"><h2>Día a día</h2><div class="rutas-lista">{tarjetas}</div></div></section>'
    elif f.get("madre"):
        m = todas[f["madre"]]
        migas.append((m["corto"], f"{BASE}/{CARPETA}/{m['slug']}/"))
        hermanos = sorted([t for t in todas.values() if t.get("madre") == f["madre"] and t["id"] != f["id"]],
                          key=lambda t: t["dia"])
        tarjetas = tarjeta(m) + "".join(tarjeta(t) for t in hermanos)
        rel = f'<section class="franja"><div class="envoltura"><h2>El resto del viaje</h2><div class="rutas-lista">{tarjetas}</div></div></section>'
    else:
        otras = [t for t in todas.values() if not t.get("madre") and t["id"] != f["id"]]
        tarjetas = "".join(tarjeta(t) for t in otras)
        rel = f'<section class="franja"><div class="envoltura"><h2>Más rutas en moto</h2><div class="rutas-lista">{tarjetas}</div></div></section>'
    migas.append((f["corto"], url))
    viaje = {"@context": "https://schema.org", "@type": "TouristTrip", "name": f["h1"], "description": desc, "url": url,
             "touristType": "Moteros", "provider": {"@type": "Organization", "name": "MOTOCLUBes", "url": BASE + "/"}}
    if f["puertos_l"]:
        viaje["itinerary"] = {"@type": "ItemList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": {"@type": "Place", "name": n}} for i, (n, _) in enumerate(f["puertos_l"])]}
    return (cabeza(title, desc, url)
        + f'<script type="application/ld+json">{json.dumps(viaje, ensure_ascii=False)}</script>\n'
        + f'<script type="application/ld+json">{json.dumps(migas_ld(migas), ensure_ascii=False)}</script>\n</head>\n'
        + cab + f"""

<section>
  <div class="envoltura">
    <p class="rotulo"><a href="/{CARPETA}/" style="color:inherit;text-decoration:none">Rutas en moto</a></p>
    <h1>{e(f['h1'])}</h1>
    <p class="entradilla">{e(f['texto'])}</p>
    <div class="ruta-mapa">{svg(f['pts'])}</div>
    <p class="ruta-nota">El dibujo del recorrido. El mapa completo, con las paradas, y el GPX para tu navegador están en «Ver el mapa y bajar el GPX».</p>
    <div class="ruta-datos">{datos_html}</div>
    {acciones(f)}
  </div>
</section>

<section class="franja">
  <div class="envoltura">
    {puertos_html}
    <h2 style="margin-top:{'40px' if puertos_html else '0'}">Hazla con MOTOCLUBes</h2>
    <p class="entradilla">Ábrela en la app, guárdala en tus rutas y navégala con la voz en el casco, los radares y las
    gasolineras con precio. Si vais varios, monta la salida con tu grupo: os veis en el mapa y habláis por el
    intercomunicador del móvil. Y si prefieres tu GPS, bájate el GPX.</p>
    <div class="acciones" style="animation:none;justify-content:flex-start">
      <a class="boton boton-suave" href="/navegador-gps-moto/">El navegador GPS para moto</a>
      <a class="boton boton-suave" href="/salir-en-grupo-en-moto/">Salir en grupo</a>
      <a class="boton boton-suave" href="/planificador-rutas-moto/">Planifica tu ruta</a>
    </div>
  </div>
</section>

{rel}

{pie}""")

def tarjeta(t):
    a, b = desde_hasta(t)
    dias = f" · {t['dias']} días" if int(t["dias"]) > 1 else ""
    return (f'<a href="/{CARPETA}/{t["slug"]}/">{svg(t["pts"], 600, 320, 18, 7, False)}'
            f'<h3>{e(t["corto"])}</h3><p>{miles(t["km"])} km{dias} · {len(t["puertos_l"])} puertos</p></a>')

def indice(todas, cab, pie):
    url = f"{BASE}/{CARPETA}/"
    title = "Rutas en moto por España: mapas, puertos y GPX · MOTOCLUBes"
    desc = ("Rutas en moto por los Pirineos, el Maestrazgo, el Matarraña y Cantabria, con mapa, puertos, curvas y GPX. "
            "Planificadas con MOTOCLUBes, la app para moteros.")
    madres = [t for t in todas.values() if not t.get("madre")]
    lista = "".join(tarjeta(t) for t in madres)
    return (cabeza(title, desc, url)
        + f'<script type="application/ld+json">{json.dumps(migas_ld([("MOTOCLUBes", BASE + "/"), ("Rutas en moto", url)]), ensure_ascii=False)}</script>\n</head>\n'
        + cab + f"""

<section>
  <div class="envoltura">
    <p class="rotulo">Rutas en moto</p>
    <h1>Rutas en moto por España</h1>
    <p class="entradilla">Rutas para rodar, con su dibujo, sus puertos, sus curvas y el GPX para
    llevártelas. Todas planificadas con MOTOCLUBes, la app que viaja contigo.</p>
    <div class="rutas-lista" style="margin-top:28px">{lista}</div>
  </div>
</section>

<section class="franja">
  <div class="envoltura">
    <h2>Planifica la tuya</h2>
    <p class="entradilla">Con MOTOCLUBes trazas tu ruta por curvas o sin peajes, la navegas con la voz en el casco y la
    compartes con tu grupo. Y si te gusta, la publicas para que otros moteros la rueden.</p>
    <div class="acciones" style="animation:none;justify-content:flex-start">
      <a class="boton boton-principal" href="/#avisame">Avísame cuando salga</a>
      <a class="boton boton-suave" href="/planificador-rutas-moto/">El planificador de rutas</a>
    </div>
  </div>
</section>

{pie}""")

def sitemap(urls):
    p = os.path.join(RAIZ, "sitemap.xml")
    s = io.open(p, encoding="utf8").read()
    for u in urls:
        loc = f"<loc>{u}</loc>"
        if loc not in s:
            s = s.replace("</urlset>", f"  <url>{loc}<lastmod>2026-10-31</lastmod><priority>0.8</priority></url>\n</urlset>")
    io.open(p, "w", encoding="utf8").write(s)

if __name__ == "__main__":
    todas = leer()
    falta = set(FICHAS) - set(todas)
    if falta:
        sys.exit(f"🔴 sin datos en el CSV: {falta}")
    cab, pie = plantilla()
    base = os.path.join(RAIZ, CARPETA)
    os.makedirs(base, exist_ok=True)
    io.open(os.path.join(base, "index.html"), "w", encoding="utf8").write(indice(todas, cab, pie))
    urls = [f"{BASE}/{CARPETA}/"]
    for f in todas.values():
        d = os.path.join(base, f["slug"])
        os.makedirs(d, exist_ok=True)
        io.open(os.path.join(d, "index.html"), "w", encoding="utf8").write(pagina_ruta(f, todas, cab, pie))
        urls.append(f"{BASE}/{CARPETA}/{f['slug']}/")
        print("hecha", f["slug"])
    sitemap(urls)
    print("índice y sitemap al día:", len(urls), "direcciones")
