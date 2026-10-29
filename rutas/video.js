/* rutas/video.js · 🆕 VIDEO-RUTA-1 (25-sep-2026, 74.ª) — primera versión de SOCIAL-SALIDA-1 en la web.
   Mario: «si podemos construir algo para publicar en Instagram, que lo convierta en reel [...] que te pueda guardar un
   fichero [...] para darle publicidad a MOTOCLUBes y a las rutas que haga».
   v1 (15 s, imagen fija) → «una pasada» → v2 (22 s, más lento) → v3, lo que pidió después viéndolo:
     «que al principio apareciera el mapa como aparece y luego fueras haciendo un zoom para que se viera con más detalle
      [...] que aparecieran abajo los pueblos y los puertos [...] donde dormimos, que apareciera día uno, que el día dos
      arrancara tras una tarjeta sobre el mapa que ponga día dos [...] y que se vaya haciendo un zoom para que se vea más
      claro por dónde vas».
   GUION v3 (los tiempos salen de la ruta, ver `guion`):
     vista entera con el título → zoom hacia la salida → tarjeta «Día 1» → la cámara SIGUE al casco mientras la línea se
     dibuja (abajo, el pueblo / puerto / parada por el que pasa) → al acabar cada día, tarjeta «Día N» con dónde se duerme
     → al final se aleja a la vista entera → resumen → cierre MOTOCLUBes.
   CÓMO: el mapa se pinta con TESELAS de Mapbox (Static Tiles API, estilo outdoors) descargadas ANTES de grabar, para que
   ningún fotograma salga a medio cargar: se simula la cámara entera, se apuntan las teselas que va a ver y se bajan. Luego
   se graba el lienzo en tiempo real con MediaRecorder (MP4 en Safari). Sin música: se pone en Instagram (con licencia).
   v5: zoom fundiendo niveles, fotogramas a paso fijo, más lento (km/15 s), abajo solo paradas de verdad y puertos.
   v4 (FOTOS-SALIDA-1): tras alejarse, las fotos de la salida (r.fotos de mc_ruta_publica), 2,6 s cada una.
   FOTOS-PARADA-1 (130.ª): la foto con parada (lat/lng/pie) sale al pasar por ella, con su rótulo; las demás, al final.
   Usa lo que ya tiene la página (index.html): esc, fmtMiles, kmAcum, aligerarTraza, MAPBOX_TOKEN.
   🟢 25-sep: revisado por Mario en v5 y puesto a la vista de todos en la página de cada ruta pública. */

/* 🆕 v6 (25-sep, 77.ª · VIDEO-RUTA-2), a partir del reel de travelanimator.app que enseñó Mario: más cerca (la mitad de
   ancho), los km GRANDES arriba a la derecha, el puerto o la parada en un bocadillo pegado al casco y sin velos oscuros
   mientras se rueda. Se quedó «en revisión» (solo con «&video=6») y sin apuntar en ningún documento.
   28-sep (83.ª): se puso la v6 por defecto (`b23e9a6`) y, al verla, Mario: «me gustaba más cómo estaba la V4 que la V6.
   Así que vuelve la V4». 🟢 DECIDIDO: la de siempre es la v5 (la que Mario llama «V4»); la v6 sigue con «&video=6». */
var VIDEO_V6 = /[?&]video=6(&|$)/.test(location.search);

/* 🆕 VIDEO-CAPTURA-1 (7-oct, 102.ª). Mario, para el vídeo de la Transpirenaica en LinkedIn: «te paso la captura y haces una
   pequeña traslación de arriba abajo». Solo con «&captura=<nombre>» en el enlace: carga /img/video/<nombre>.jpg y, tras
   alejarse al final de la ruta, la enseña en una ventana redondeada que baja despacio. Sin el parámetro, el vídeo de
   siempre. Hoy: «&captura=transpi-tiempo» (el tiempo de cada etapa en la tarjeta de la salida). */
var VIDEO_CAPTURA = (location.search.match(/[?&]captura=([a-z0-9-]{1,40})(?:&|$)/) || [])[1] || null;

/* 🆕 VIDEO-DESTACAR-1 (15-oct, 109.ª). Mario, para los reels de la Transpirenaica: «pusieras en amarillo cada carretera más
   bonita de cada una de las etapas». Solo con «&destacar=…» en el enlace (sin él, el vídeo de siempre). Cada tramo:
     «Pueblo A>Pueblo B~Letrero»   o   «km:120-165~Letrero»   (varios separados por «;», 6 como mucho; el letrero es opcional)
   Los pueblos se buscan primero entre los puertos y paradas de la ruta y, si no, en el buscador de Mapbox dentro del
   recuadro de la ruta; vale el punto de la ruta más cercano (a menos de 5 km). Al pasar por un tramo: la línea en
   AMARILLO y más gruesa, la cámara un nivel más cerca, 2,5 veces más despacio y el letrero «⭐ …» arriba. */
/* 🆕 CARTEL-CARRETERA-1 (15-oct, 109.ª). Mario: «es lo importante, marcar la carretera, decir el número de carretera más
   bonitas con la franja en amarillo». Las teselas de Mapbox no pintan los números de más de 6 letras (NA-2012, GI-2634…)
   y la franja amarilla tapa los que sí salen. Si el letrero lleva un número de carretera («NA-2012 · Selva de Irati»), se
   dibuja un cartel blanco con borde negro y ese número encima de la franja amarilla, un poco por detrás del casco. */
function numCarretera(txt) {
  var m = String(txt || "").match(/(?:^|[^A-Za-z0-9])([A-Z]{1,4}-\d{1,5}[a-z]?|[DN]\d{2,4})(?![A-Za-z0-9])/);
  return m ? m[1] : null;
}
var VIDEO_DESTACAR = (function () {
  var m = location.search.match(/[?&]destacar=([^&]*)/); if (!m) return [];
  var txt; try { txt = decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) { return []; }
  return txt.split(";").map(function (it) {
    it = it.trim(); if (!it) return null;
    var partes = it.split("~"), que = partes[0].trim(), letrero = (partes[1] || "").trim();
    var k = que.match(/^km:\s*(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/i);
    if (k) return { kmA: parseFloat(k[1].replace(",", ".")), kmB: parseFloat(k[2].replace(",", ".")), txt: letrero || ("km " + k[1] + "-" + k[2]), num: numCarretera(letrero) };
    var ab = que.split(">"); if (ab.length !== 2 || !ab[0].trim() || !ab[1].trim()) return null;
    return { a: ab[0].trim(), b: ab[1].trim(), txt: letrero || (ab[0].trim() + " → " + ab[1].trim()), num: numCarretera(letrero) };
  }).filter(Boolean).slice(0, 6);
})();
// ZOOM: niveles respecto a la cámara de siempre al pasar por un tramo. Era +1 (más cerca); Mario, 15-oct: «el zoom está hecho
// muy bajo»; y luego: «cuando llegues entre Porta y el Col de Puymorens […] haces un pequeño zoom de la carretera para que se vea con las curvas» → +0,7.
var DESTACAR = { LENTO: 2.5, ZOOM: 0.7, BORDE_KM: 3, MAX_KM_LEJOS: 5 };
function sinTildesV(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
/* Pasa los tramos de VIDEO_DESTACAR a km del trazado completo. Devuelve { tramos: [{a, b, txt}], fallos: [texto] }. */
function resolverDestacados(pts, puertos, paradas) {
  if (!VIDEO_DESTACAR.length || pts.length < 2) return Promise.resolve({ tramos: [], fallos: [] });
  var acum = kmAcum(pts), total = acum[acum.length - 1];
  var lat1 = 90, lat2 = -90, lng1 = 180, lng2 = -180;
  pts.forEach(function (p) { if (p.lat < lat1) lat1 = p.lat; if (p.lat > lat2) lat2 = p.lat; if (p.lng < lng1) lng1 = p.lng; if (p.lng > lng2) lng2 = p.lng; });
  var bbox = [lng1 - 0.2, lat1 - 0.2, lng2 + 0.2, lat2 + 0.2].map(function (v) { return v.toFixed(4); }).join(",");
  function masCerca(lat, lng) { // el punto de la ruta más cercano: km y distancia
    var mejor = { km: 0, d: 1e9 };
    for (var i = 0; i < pts.length; i++) { var d = hav({ lat: lat, lng: lng }, pts[i]); if (d < mejor.d) mejor = { km: acum[i], d: d }; }
    return mejor;
  }
  // 🔁 DESTACAR-PAR-1 (15-oct, 109.ª). Mario, con el día 1: «la línea amarilla aparece desde el inicio […] desde el principio
  // ponen la N20». «Porta» se buscaba solo y el buscador devolvía el barrio de Porta de Barcelona, a 2 km de la salida: el tramo
  // empezaba en el km 0. Ahora se juntan TODOS los sitios posibles de cada pueblo (puertos y paradas de la ruta y lo que dé el
  // buscador a menos de 5 km del trazado) y se elige la pareja más corta que va en el sentido de la ruta (A antes que B).
  // 🔁 ENVALIRA-PUERTO-1 (16-oct, 110.ª). Mario, con «Porta>Envalira»: «desde Porta hasta Envalira es bastante más de lo que
  // has dibujado». Si el nombre es un puerto o una parada de la ruta, vale SOLO ese punto (el buscador no entra: daba otros
  // «Envalira» antes del puerto). Si no lo es, del buscador valen primero los sitios que se llaman exactamente así (que «Porta»
  // no coja Porté-Puymorens) y, solo si no hay ninguno, los parecidos, como antes.
  function candidatos(nombre) {
    var q = sinTildesV(nombre), kms = [];
    puertos.forEach(function (p) { if (p.km != null && sinTildesV(p.name).indexOf(q) >= 0) kms.push(p.km); });
    paradas.forEach(function (p) { if (p.km != null && sinTildesV(p.nombre).indexOf(q) >= 0) kms.push(p.km); });
    if (kms.length) return Promise.resolve(kms);
    var url = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURIComponent(nombre) + ".json?access_token=" + MAPBOX_TOKEN +
      "&bbox=" + bbox + "&limit=10&language=es";
    return fetch(url).then(function (r) { return r.ok ? r.json() : { features: [] }; }).then(function (j) {
      var exactos = [], parecidos = [];
      (j.features || []).forEach(function (f) {
        if (!f.center) return; var c = masCerca(f.center[1], f.center[0]);
        if (c.d > DESTACAR.MAX_KM_LEJOS) return;
        (sinTildesV(f.text) === q ? exactos : parecidos).push(c.km);
      });
      return exactos.length ? exactos : parecidos;
    }).catch(function () { return kms; });
  }
  function pareja(ka, kb) { // la pareja más corta con A antes que B; si no hay ninguna así, la más corta al revés
    var mejor = null, alReves = null;
    ka.forEach(function (a) { kb.forEach(function (b) {
      var d = b - a;
      if (d >= 0.5 && (!mejor || d < mejor.b - mejor.a)) mejor = { a: a, b: b };
      if (d <= -0.5 && (!alReves || -d < alReves.a - alReves.b)) alReves = { a: b, b: a };
    }); });
    return mejor || (alReves ? { a: alReves.a, b: alReves.b } : null);
  }
  var fallos = [];
  return Promise.all(VIDEO_DESTACAR.map(function (it) {
    if (it.kmA != null) return Promise.resolve({ a: Math.max(0, Math.min(it.kmA, it.kmB)), b: Math.min(total, Math.max(it.kmA, it.kmB)), txt: it.txt, num: it.num });
    return Promise.all([candidatos(it.a), candidatos(it.b)]).then(function (k) {
      if (!k[0].length || !k[1].length) { fallos.push(!k[0].length ? it.a : it.b); return null; }
      var pr = pareja(k[0], k[1]);
      if (!pr) { fallos.push(it.a + " > " + it.b); return null; }
      return { a: pr.a, b: pr.b, txt: it.txt, num: it.num };
    });
  })).then(function (rs) {
    var tramos = rs.filter(Boolean).sort(function (x, y) { return x.a - y.a; });
    console.log("[video] tramos destacados", tramos, "no encontrados", fallos);
    return { tramos: tramos, fallos: fallos };
  });
}

var VIDEO = {
  W: 1080, H: 1920, FPS: 30,
  T_VISTA: 2.5, T_ZOOM: 3.6, T_TARJETA: 2.2, T_ALEJAR: 3, T_FOTO: 2.6, T_RESUMEN: 3.2, T_CIERRE: 3, T_CAPTURA: 6,
  T_PARADA: 1.6, T_FOTO_PARADA: 2.2, // FOTOS-PARADA-1: el rótulo de la parada en el mapa y cada foto de esa parada
  // 🔄 v5 (Mario: «va muy rápido y no te da tiempo a ver los nombres»): km/15 por segundo, entre 20 y 58 s de dibujo
  DIBUJO_MIN: 20, DIBUJO_MAX: 58, KM_POR_S: 15,
  ESTILO: "outdoors-v12"
};
// 🆕 MAPA-SATELITE-1 (15-oct, 109.ª). Mario, con un reel de referencia (vista de satélite, la curva señalada con una flecha
// amarilla): «te envío un poco la idea». Con «&mapa=satelite» en el enlace, las teselas son de satélite con carreteras y
// nombres (satellite-streets-v12). Sin el parámetro, el mapa de siempre.
if (/[?&]mapa=satelite(&|$)/.test(location.search)) VIDEO.ESTILO = "satellite-streets-v12";
// 🆕 SOLO-LINEA-1 (15-oct, 109.ª). Mario, para el reel del día 1: «quitaría todos los puntos […] solamente con la línea».
//   &solo=puertos → fuera gasolineras, comidas, hoteles y demás paradas (en el mapa y abajo); quedan los puertos.
//   &solo=linea   → fuera también los puertos: solo la línea, los tramos amarillos y sus carteles.
// 🆕 REEL-CORTO-1 (15-oct, 109.ª). Mario: «yo lo haría más sencillo, se hace largo, es otra vez toda la carrera» → «exacto»:
//   &corto=1 (con &destacar=) → el día entero ya dibujado 2,6 s, vuelo a cada tramo destacado (zoom a sus curvas, la línea
//   amarilla se dibuja con su cartel y la flecha), se aleja, las fotos y el cierre. Sin recorrer el resto del día.
var VIDEO_CORTO = /[?&]corto=1(&|$)/.test(location.search);
var VIDEO_SOLO = (location.search.match(/[?&]solo=(puertos|linea)(?:&|$)/) || [])[1] || null;
// 🆕 SIN-FOTOS-1 (16-oct, 110.ª). Mario, para el reel del día 1: con «&fotos=0» el vídeo sale sin las fotos de la salida
// (mapa, tramos y cierre); las fotos y sus vídeos se meten después en el montaje. Sin el parámetro, como siempre.
var VIDEO_SIN_FOTOS = /[?&]fotos=0(&|$)/.test(location.search);

function mercX(lng) { return (lng + 180) / 360; }
function mercY(lat) { var s = Math.sin(lat * Math.PI / 180); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); }
function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
function tramo(t, a, b) { return suave((t - a) / (b - a)); }

function cargarImagen(src) {
  return new Promise(function (ok, mal) {
    var im = new Image(); im.crossOrigin = "anonymous";
    im.onload = function () { ok(im); }; im.onerror = function () { mal(new Error("imagen")); };
    im.src = src;
  });
}
function tipoGrabacion() {
  var c = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  for (var i = 0; i < c.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(c[i])) return c[i];
  return "";
}
/* VIDEO-TEXTO-SAFARI-1 (25-sep, 77.ª): en el iPhone el texto centrado que empieza por emoji salía empezando en el centro
   (bocadillo «🏔️ Coll de les Ma…» cortado; capturas de Mario). Toda la alineación se hace a mano con measureText y
   textAlign "left": en los navegadores que ya centraban bien, el resultado es el mismo píxel a píxel. */
function escribir(ctx, txt, x, y, al) {
  var w = ctx.measureText(txt).width; ctx.textAlign = "left";
  ctx.fillText(txt, al === "right" ? x - w : al === "center" ? x - w / 2 : x, y);
}
function textoSombra(ctx, txt, x, y, font, color, alineado) {
  ctx.font = font; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
  ctx.fillStyle = color; escribir(ctx, txt, x, y, alineado || "center");
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}
function pildora(ctx, x, y, w, h, r, fondo) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fillStyle = fondo; ctx.fill();
}
function recortar(txt, n) { txt = String(txt || ""); return txt.length > n ? txt.slice(0, n - 1) + "…" : txt; }
/* 🆕 MARCA-HECHO-1 (18-oct, 115.ª · RUTAS-COMUNIDAD-1). Mario: «cuando lo publiquen, que ponga hecho por MOTOCLUBes», y en
   la propuesta aprobada («todo»): «Hecho con MOTOCLUBes» en una esquina DURANTE TODO EL VÍDEO. Píldora oscura con el casco:
   arriba a la izquierda, por debajo del título y de los letreros amarillos (y 210-306) y lejos de la cámara de Instagram; en
   las pantallas de paneles (puertos, resumen, captura), que ocupan el ancho, abajo en el centro para no pisarlos. */
function marcaHecho(ctx, casco, abajo, alfa) {
  if (!(alfa > 0)) return;
  var t1 = "Hecho con ", t2 = "MOTOCLUBes", h = 70, ic = 48, f1 = "600 34px Manrope, system-ui, sans-serif", f2 = "800 34px Manrope, system-ui, sans-serif";
  ctx.font = f1; var w1 = ctx.measureText(t1).width;
  ctx.font = f2; var w2 = ctx.measureText(t2).width;
  var w = 16 + ic + 12 + w1 + w2 + 28, x = abajo ? (VIDEO.W - w) / 2 : 40, y = abajo ? VIDEO.H - 130 : 336;
  ctx.globalAlpha = alfa;
  pildora(ctx, x, y, w, h, h / 2, "rgba(14,14,14,.74)");
  if (casco) ctx.drawImage(casco, x + 16, y + (h - ic) / 2, ic, ic);
  ctx.textBaseline = "middle";
  ctx.font = f1; ctx.fillStyle = "rgba(255,255,255,.88)"; escribir(ctx, t1, x + 16 + ic + 12, y + h / 2 + 1, "left");
  ctx.font = f2; ctx.fillStyle = "#FF7A1A"; escribir(ctx, t2, x + 16 + ic + 12 + w1, y + h / 2 + 1, "left");
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ el guion: días, tiempos y cámara */
/* 🆕 VIDEO-RESUMEN-PUERTOS-1 (7-oct, 102.ª). Mario, con el vídeo de la Transpirenaica para LinkedIn: «que fueran saliendo
   todos los puertos con su altura, en naranja los tres más altos» y que el resumen diga también el más bajo, hoteles,
   restaurantes… «que fuera apareciendo». Una pantalla nueva con los puertos (en orden de paso, uno a uno; si son más de
   24, los 24 más altos) y el resumen con filas que entran una a una. */
var VIDEO_PUERTOS_PAGINA = 15; // 7-oct, Mario con 28 puertos: «alguno se corta el nombre» → páginas de hasta 15, una columna
function datosResumen(paradas, puertos) {
  var conAlt = puertos.filter(function (p) { return p.ele != null; });
  var bajo = conAlt.length > 1 ? conAlt.reduce(function (a, b) { return !a || b.ele < a.ele ? b : a; }, null) : null;
  var cuenta = {};
  paradas.forEach(function (p) {
    if (p.inicio || p.fin || !p.w.waypointType) return;
    cuenta[p.w.waypointType] = (cuenta[p.w.waypointType] || 0) + 1;
    // CENA-EN-PARADA-1, como la app (`contarComer`): el hotel o camping donde también se cena cuenta en «Restaurantes»
    if ((p.w.waypointType === "hotel" || p.w.waypointType === "camping") && p.w.cena === true) cuenta.restaurante = (cuenta.restaurante || 0) + 1;
  });
  var cuentas = [["hotel", "Hoteles"], ["camping", "Campings"], ["restaurante", "Restaurantes"], ["gasolinera", "Gasolineras"]]
    .filter(function (c) { return cuenta[c[0]]; }).map(function (c) { return [c[1], String(cuenta[c[0]])]; });
  var lista = puertos.slice().sort(function (a, b) { return a.km - b.km; });
  var npag = Math.max(1, Math.ceil(lista.length / VIDEO_PUERTOS_PAGINA)), porPag = Math.ceil(lista.length / npag);
  var paginas = [];
  for (var k = 0; k < npag; k++) paginas.push(lista.slice(k * porPag, (k + 1) * porPag));
  var top = lista.filter(function (p) { return p.ele != null; }).slice().sort(function (a, b) { return b.ele - a.ele; }).slice(0, 3);
  return { bajo: bajo, cuentas: cuentas, lista: lista, top: top, paginas: paginas };
}

function guion(r, pts, paradas, puertos, fotos, captura, destacados) {
  fotos = fotos || [];
  var fino = aligerarTraza(pts, 20); // v5: menos puntos que pintar por fotograma (va más fino), sin perder la forma
  var acum = kmAcum(fino), total = acum[acum.length - 1] || 1;
  var totalOrig = kmAcum(pts).slice(-1)[0] || total;
  var kmF = function (km) { return km * total / totalOrig; }; // km del trazado completo → km del trazado aligerado
  var M = fino.map(function (p) { return { x: mercX(p.lng), y: mercY(p.lat) }; });
  function enKm(km) { // posición (Mercator) a esos km
    if (km <= 0) return M[0];
    if (km >= total) return M[M.length - 1];
    var lo = 0, hi = acum.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (acum[mid] <= km) lo = mid; else hi = mid; }
    var u = (km - acum[lo]) / ((acum[hi] - acum[lo]) || 1);
    return { x: M[lo].x + (M[hi].x - M[lo].x) * u, y: M[lo].y + (M[hi].y - M[lo].y) * u };
  }

  // Días: solo en la ruta «completa» de una multietapa (la página de una etapa es un día).
  var etapas = [];
  if (Array.isArray(r.multietapa) && r.multietapa.some(function (e) { return e.id === r.id && e.etapa == null; })) {
    etapas = r.multietapa.filter(function (e) { return e.etapa != null; }).sort(function (a, b) { return a.etapa - b.etapa; });
  }
  var limites = [0];
  if (etapas.length > 1) {
    var suma = etapas.reduce(function (s, e) { return s + (Number(e.km) || 0); }, 0) || 1, ac = 0;
    etapas.forEach(function (e) { ac += Number(e.km) || 0; limites.push(total * ac / suma); });
  } else limites.push(total);
  var dias = limites.length - 1;
  var nombreDia = function (i) { return etapas[i] ? etapas[i].title : (r.title || ""); };
  var noche = function (i) { // dónde se duerme al acabar el día i: el hotel o camping más cerca del cambio de día
    var mejor = null, dmin = total * 0.06 + 5;
    paradas.forEach(function (p) {
      var t = p.w.waypointType; if (t !== "hotel" && t !== "camping") return;
      var d = Math.abs(kmF(p.km) - limites[i + 1]); if (d < dmin) { dmin = d; mejor = p; }
    });
    return mejor;
  };

  // VIDEO-DESTACAR-1: los tramos en km del trazado aligerado
  var dest = (destacados || []).map(function (d) { return { a: kmF(d.a), b: kmF(d.b), txt: d.txt, num: d.num || null }; });
  function solape(x, y) { var s = 0; dest.forEach(function (d) { s += Math.max(0, Math.min(y, d.b) - Math.max(x, d.a)); }); return s; }
  function largoPesado(x, y) { return (y - x) + (DESTACAR.LENTO - 1) * solape(x, y); } // los tramos destacados «pesan» más: van más despacio
  function kmDePeso(x, y, w) { // dentro de [x, y], el km al que se llega tras recorrer un largo «pesado» w
    var cortes = [x]; dest.forEach(function (d) { if (d.a > x && d.a < y) cortes.push(d.a); if (d.b > x && d.b < y) cortes.push(d.b); });
    cortes.push(y); cortes.sort(function (p, q) { return p - q; });
    for (var i = 0; i < cortes.length - 1; i++) {
      var c0 = cortes[i], c1 = cortes[i + 1], mid = (c0 + c1) / 2;
      var pz = dest.some(function (d) { return mid >= d.a && mid <= d.b; }) ? DESTACAR.LENTO : 1, lw = (c1 - c0) * pz;
      if (w <= lw) return c0 + w / pz;
      w -= lw;
    }
    return y;
  }
  function cercania(km) { // 0 lejos de un tramo destacado, 1 dentro (con rampas de BORDE_KM)
    var m = 0; dest.forEach(function (d) { m = Math.max(m, tramo(km, d.a - DESTACAR.BORDE_KM, d.a) * (1 - tramo(km, d.b, d.b + DESTACAR.BORDE_KM))); });
    return m;
  }

  // Encuadres: la vista entera y el zoom de detalle.
  var x1 = 1, x2 = 0, y1 = 1, y2 = 0;
  M.forEach(function (p) { if (p.x < x1) x1 = p.x; if (p.x > x2) x2 = p.x; if (p.y < y1) y1 = p.y; if (p.y > y2) y2 = p.y; });
  var zFit = Math.min(Math.log2(440 / (512 * Math.max(x2 - x1, 1e-9))), Math.log2(470 / (512 * Math.max(y2 - y1, 1e-9))));
  zFit = Math.max(2, Math.min(13, zFit));
  var cFit = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 10 / (512 * Math.pow(2, zFit)) };
  var zDet = Math.max(zFit + 1, Math.min(11.5, zFit + 3.3)); // en La ruta del silencio: unos 28 km de ancho de pantalla
  if (VIDEO_V6) zDet = Math.max(zFit + 1, Math.min(12.5, zFit + 4.3)); // v6: un nivel más cerca, la mitad de ancho (~14 km)

  // CARTEL-CARRETERA-1: cuántos píxeles de pantalla mide 1 km de cada tramo con la cámara ya cerca (para poner el cartel
  // siempre a la misma distancia por detrás del casco, sobre lo amarillo ya dibujado: la cámara mira por delante y lo de
  // atrás se sale enseguida de la pantalla, así que un cartel fijo en el mapa casi nunca se llegaba a ver)
  var zDest = zDet + DESTACAR.ZOOM;
  dest.forEach(function (d) {
    var largoM = 0, paso = (d.b - d.a) / 40;
    for (var k = 0; k < 40; k++) { var p0 = enKm(d.a + k * paso), p1 = enKm(d.a + (k + 1) * paso); largoM += Math.hypot(p1.x - p0.x, p1.y - p0.y); }
    d.pxKm = Math.max(1, largoM * 512 * Math.pow(2, zDest) * 2 / Math.max(d.b - d.a, 0.01)); d.zPx = zDest;
  });

  // 🆕 FOTOS-PARADA-1 (130.ª, 29-oct · Fèlix y Mario «vamos a hacerlo»): la foto puesta en una parada (lat/lng de la parada,
  // con `mc_foto_situar`) sale AL PASAR el casco por ella: el mapa se para con el rótulo 📷 y pasan sus fotos con su texto, y
  // sigue. Como Relive, con la marca MOTOCLUBes. Las que no tienen parada (o quedan a más de 1,5 km de la ruta), al final.
  // En el reel corto (REEL-CORTO-1) y sin fotos (&fotos=0), como antes.
  var acumOrig = kmAcum(pts), grupos = [], alFinal = [];
  // 🆕 RUTA-VUELTA-1 (130.ª, revisión de fin de día): en una ruta que vuelve a donde empezó, o de ida y vuelta, el punto «más
  // cerca» de la foto puede ser la otra pasada. 1) Si la foto está en una parada (lo normal: la puso ahí quien la subió), va
  // en el km de ESA parada, que ya sale en el orden de la ruta (paradasConKm). 2) Si no, el punto más cerca. En las rutas de
  // varios días, el día de la foto solo sirve para ELEGIR entre pasadas (con el mismo margen que el hotel de cada noche):
  // nunca se manda al final una foto que antes salía (2.ª revisión: los días se reparten por los km de cada etapa, no exactos).
  var margenDia = total * 0.06 + 5;
  if (!(VIDEO_CORTO && dest.length > 0)) fotos.forEach(function (f, i) {
    if (f.lat == null || f.lng == null || !(isFinite(f.lat) && isFinite(f.lng))) { alFinal.push(i); return; }
    var dF = dias > 1 && f.dia >= 1 && f.dia <= dias ? f.dia - 1 : -1;
    var enDia = function (km) { return dF < 0 || (km >= limites[dF] - margenDia && km <= limites[dF + 1] + margenDia); };
    var kmP = null, enParada = null, enParadaDia = null;
    (paradas || []).forEach(function (p) {
      if (p.km == null || !p.w || !isFinite(p.w.lat) || !isFinite(p.w.lng) || hav(p.w, f) > 0.03) return;
      var mejorQue = function (x) { return !x || ((x.inicio || x.fin) && !p.inicio && !p.fin); }; // una de en medio antes que la salida o la llegada
      if (mejorQue(enParada)) enParada = p;
      if (enDia(kmF(p.km)) && mejorQue(enParadaDia)) enParadaDia = p;
    });
    if (enParadaDia || enParada) kmP = Math.max(0, Math.min(total, kmF((enParadaDia || enParada).km)));
    else {
      var c = Math.cos(f.lat * Math.PI / 180), mejor = -1, dMin = Infinity, mejorD = -1, dMinD = Infinity;
      for (var k = 0; k < pts.length; k++) {
        var dx = (pts[k].lng - f.lng) * c, dy = pts[k].lat - f.lat, dd = dx * dx + dy * dy;
        if (dd < dMin) { dMin = dd; mejor = k; }
        if (dF >= 0 && dd < dMinD && enDia(kmF(acumOrig[k]))) { dMinD = dd; mejorD = k; }
      }
      if (mejor < 0 || Math.sqrt(dMin) * 111.32 > 1.5) { alFinal.push(i); return; }
      if (mejorD >= 0 && Math.sqrt(dMinD) * 111.32 <= 1.5) mejor = mejorD; // la pasada de su día, si la hay
      kmP = Math.max(0, Math.min(total, kmF(acumOrig[mejor])));
    }
    var g = null; grupos.forEach(function (x) { if (Math.abs(x.km - kmP) < 0.3) g = x; });
    if (!g) { g = { km: kmP, idxs: [], pie: "" }; grupos.push(g); }
    g.idxs.push(i); if (!g.pie && f.pie) g.pie = String(f.pie);
  });
  else fotos.forEach(function (f, i) { alFinal.push(i); });
  grupos.sort(function (a, b) { return a.km - b.km; });

  // Tiempos.
  var tDibujo = Math.max(VIDEO.DIBUJO_MIN, Math.min(VIDEO.DIBUJO_MAX, total / VIDEO.KM_POR_S));
  var tramos = []; var t = 0;
  tramos.push({ tipo: "vista", a: t, b: t += VIDEO.T_VISTA });
  tramos.push({ tipo: "zoom", a: t, b: t += VIDEO.T_ZOOM });
  for (var d = 0; d < dias; d++) {
    tramos.push({ tipo: "tarjeta", dia: d, a: t, b: t += VIDEO.T_TARJETA });
    var ult = d === dias - 1, x0 = limites[d], x1 = ult ? total : limites[d + 1]; // revisión: el último día llega hasta el final
    grupos.forEach(function (g) { // FOTOS-PARADA-1: el día se trocea en cada parada con fotos
      if (g.km < x0 || (!ult && g.km >= x1)) return;
      if (g.km > x0) tramos.push({ tipo: "dibujo", dia: d, x0: x0, x1: g.km, a: t, b: t += tDibujo * largoPesado(x0, g.km) / total });
      tramos.push({ tipo: "parada", dia: d, km: g.km, g: g, a: t, b: t += VIDEO.T_PARADA });
      g.idxs.forEach(function (i, n) { tramos.push({ tipo: "foto", i: i, km: g.km, dia: d, primera: n === 0, a: t, b: t += VIDEO.T_FOTO_PARADA }); });
      x0 = g.km;
    });
    if (x1 > x0) tramos.push({ tipo: "dibujo", dia: d, x0: x0, x1: x1, a: t, b: t += tDibujo * largoPesado(x0, x1) / total }); // VIDEO-DESTACAR-1
  }
  tramos.push({ tipo: "alejar", a: t, b: t += VIDEO.T_ALEJAR });
  if (captura) tramos.push({ tipo: "captura", a: t, b: t += VIDEO.T_CAPTURA }); // VIDEO-CAPTURA-1
  // 🆕 FOTOS-SALIDA-1: tras la ruta, las fotos de los que fueron (Mario: «primero poner la ruta, luego poner las fotos»)
  alFinal.forEach(function (i, n) { tramos.push({ tipo: "foto", i: i, primera: n === 0, a: t, b: t += VIDEO.T_FOTO }); });
  // VIDEO-RESUMEN-PUERTOS-1: los puertos uno a uno (0,3 s cada uno) y el resumen con sus filas entrando una a una
  var DR = datosResumen(paradas, puertos);
  if (DR.lista.length >= 2) DR.paginas.forEach(function (pg, k) {
    tramos.push({ tipo: "puertos", pag: k, a: t, b: t += Math.max(4, 2.4 + pg.length * 0.3) });
  });
  var nFilas = 6 + (DR.bajo ? 1 : 0) + DR.cuentas.length;
  tramos.push({ tipo: "resumen", a: t, b: t += Math.max(VIDEO.T_RESUMEN, 1.2 + nFilas * 0.3 + 2) });
  tramos.push({ tipo: "cierre", a: t, b: t += VIDEO.T_CIERRE });
  var DUR = t;

  // REEL-CORTO-1: otro guion, solo con los tramos destacados
  var corto = VIDEO_CORTO && dest.length > 0, camTramo = [];
  if (corto) {
    // 🔁 ZOOM-CERCA-1 (15-oct, 109.ª). Mario, con el primer reel corto: «deberías hacer un zoom más de detalle porque no se ve
    // casi nada». Antes la cámara encuadraba el tramo entero y se quedaba quieta (de lejos, las curvas no se veían). Ahora:
    // vuela hasta el principio del tramo, lo SIGUE de cerca mientras se pinta (de ancho de pantalla, lo que se rueda en ~2 s,
    // 5 km como poco) y al acabar se aleja 1,4 s para ver el tramo entero en amarillo.
    dest.forEach(function (d) {
      var bx1 = 1, bx2 = 0, by1 = 1, by2 = 0, paso = (d.b - d.a) / 60, largoU = 0, prev = null;
      for (var k = 0; k <= 60; k++) {
        var q = enKm(d.a + k * paso); bx1 = Math.min(bx1, q.x); bx2 = Math.max(bx2, q.x); by1 = Math.min(by1, q.y); by2 = Math.max(by2, q.y);
        if (prev) largoU += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q;
      }
      var zt = Math.min(Math.log2(400 / (512 * Math.max(bx2 - bx1, 1e-9))), Math.log2(520 / (512 * Math.max(by2 - by1, 1e-9))));
      var largo = Math.max(d.b - d.a, 0.5), dur = Math.max(6, Math.min(10, largo / 3));
      var anchoKm = Math.max(5, 2 * largo / dur), uKm = largoU / largo; // unidades del mapa por km de ruta
      camTramo.push({ c: { x: (bx1 + bx2) / 2, y: (by1 + by2) / 2 }, z: Math.max(zFit + 1, Math.min(13.5, zt)),
        zCerca: Math.max(zFit + 2, Math.min(13.5, Math.log2(540 / (512 * anchoKm * uKm)))), ancho: anchoKm, dur: dur });
    });
    tramos = []; t = 0;
    tramos.push({ tipo: "vista", a: t, b: t += 2.6 });
    dest.forEach(function (d, i) {
      tramos.push({ tipo: "vuelo", i: i, a: t, b: t += 1.8 });
      tramos.push({ tipo: "tramo", i: i, a: t, b: t += camTramo[i].dur });
      tramos.push({ tipo: "ver", i: i, a: t, b: t += 1.4 });
    });
    tramos.push({ tipo: "alejar", a: t, b: t += 1.6 });
    fotos.forEach(function (f, i) { tramos.push({ tipo: "foto", i: i, primera: i === 0, a: t, b: t += VIDEO.T_FOTO }); });
    tramos.push({ tipo: "cierre", a: t, b: t += VIDEO.T_CIERRE });
    DUR = t;
  }
  function sigueCerca(i, km) { // ZOOM-CERCA-1: mira un poco por delante del casco, en proporción al zoom
    var w = camTramo[i].ancho, d = dest[i];
    var ps = [km - 0.1 * w, km, km + 0.15 * w, km + 0.3 * w].map(function (k) { return enKm(Math.max(d.a - w, Math.min(d.b + w, Math.max(0, Math.min(total, k))))); });
    return { x: (ps[0].x + ps[1].x + ps[2].x + ps[3].x) / 4, y: (ps[0].y + ps[1].y + ps[2].y + ps[3].y) / 4 };
  }

  function tramoEn(t) { for (var i = 0; i < tramos.length; i++) if (t < tramos[i].b) return tramos[i]; return tramos[tramos.length - 1]; }
  function kmCabeza(t) {
    var tr = tramoEn(t);
    if (corto) { // REEL-CORTO-1
      if (tr.tipo === "vista") return 0;
      if (tr.tipo === "vuelo") return dest[tr.i].a;
      if (tr.tipo === "tramo") { var dd = dest[tr.i]; return dd.a + (dd.b - dd.a) * suave((t - tr.a) / (tr.b - tr.a)); }
      if (tr.tipo === "ver") return dest[tr.i].b;
      return total;
    }
    if (tr.tipo === "vista" || tr.tipo === "zoom") return 0;
    if (tr.tipo === "tarjeta") return limites[tr.dia];
    if (tr.km != null && (tr.tipo === "parada" || tr.tipo === "foto")) return tr.km; // FOTOS-PARADA-1: quieto en la parada
    if (tr.tipo === "dibujo") { // VIDEO-DESTACAR-1: más despacio en los tramos destacados
      var x0 = tr.x0 != null ? tr.x0 : limites[tr.dia], x1 = tr.x1 != null ? tr.x1 : limites[tr.dia + 1];
      return kmDePeso(x0, x1, largoPesado(x0, x1) * Math.min(1, (t - tr.a) / (tr.b - tr.a)));
    }
    return total;
  }
  function sigue(km) { // la cámara mira un poco por delante y promedia para no dar tirones
    var ad = VIDEO_V6 ? 0.5 : 1; // v6: con el doble de zoom, mirar por delante la mitad (si no, el casco se va arriba del todo)
    var ps = [km - 4 * ad, km, km + 4 * ad, km + 8 * ad].map(function (k) { return enKm(Math.max(0, Math.min(total, k))); });
    return { x: (ps[0].x + ps[1].x + ps[2].x + ps[3].x) / 4, y: (ps[0].y + ps[1].y + ps[2].y + ps[3].y) / 4 };
  }
  function interp(a, b, u, za, zb) { // de una cámara a otra: el zoom en escala logarítmica
    return { c: { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }, z: za + (zb - za) * u };
  }
  function camara(t) {
    var tr = tramoEn(t);
    if (corto) { // REEL-CORTO-1
      var entero = function (i) { return { c: camTramo[i].c, z: camTramo[i].z }; }; // ZOOM-CERCA-1
      if (tr.tipo === "vuelo") {
        var de = tr.i ? entero(tr.i - 1) : { c: cFit, z: zFit }, va = sigueCerca(tr.i, dest[tr.i].a);
        var cv = interp(de.c, va, tramo(t, tr.a, tr.b), de.z, camTramo[tr.i].zCerca); cv.fundir = true; return cv;
      }
      if (tr.tipo === "tramo") return { c: sigueCerca(tr.i, kmCabeza(t)), z: camTramo[tr.i].zCerca, fundir: true };
      if (tr.tipo === "ver") { var cw = interp(sigueCerca(tr.i, dest[tr.i].b), camTramo[tr.i].c, tramo(t, tr.a, tr.b), camTramo[tr.i].zCerca, camTramo[tr.i].z); cw.fundir = true; return cw; }
      if (tr.tipo === "alejar") { var de2 = entero(dest.length - 1), cl = interp(de2.c, cFit, tramo(t, tr.a, tr.b), de2.z, zFit); cl.fundir = true; return cl; }
      return { c: cFit, z: zFit };
    }
    if (tr.tipo === "vista" || tr.tipo === "resumen" || tr.tipo === "cierre" || (tr.tipo === "foto" && tr.km == null) || tr.tipo === "puertos" || tr.tipo === "captura") return { c: cFit, z: zFit };
    if (tr.tipo === "zoom") { var cz = interp(cFit, sigue(0), tramo(t, tr.a, tr.b), zFit, zDet); cz.fundir = true; return cz; }
    if (tr.tipo === "alejar") { var ca = interp(sigue(total), cFit, tramo(t, tr.a, tr.b), zDet, zFit); ca.fundir = true; return ca; }
    var kc = kmCabeza(t);
    return { c: sigue(kc), z: zDet + DESTACAR.ZOOM * cercania(kc), fundir: dest.length > 0 }; // VIDEO-DESTACAR-1: más cerca en los tramos
  }

  // Lo que sale abajo al pasar: pueblos (el «Pueblo» de «Carretera · Pueblo»), puertos y paradas con su icono.
  var avisos = [];
  if (!VIDEO_SOLO) paradas.forEach(function (p) { // SOLO-LINEA-1
    if (p.w.waypointType === "puerto" || p.inicio || p.fin) return; // los puertos van aparte; salida y llegada, en las tarjetas
    // v5, Mario: «los puntos de pasada no, porque confunden»: solo paradas de verdad (y los puertos, arriba)
    if (["gasolinera", "restaurante", "hotel", "camping", "lugar_interes", "mirador"].indexOf(p.w.waypointType) < 0) return;
    var nom = String(p.nombre || "").trim(); if (!nom) return;
    var partes = nom.split(" · ");
    // «N-420a · Falset» → «Falset»: si delante va una carretera, se enseña el pueblo
    var txt = partes.length > 1 && (!p.w.waypointType || /^[A-Z]{1,3}-?\d/.test(partes[0])) ? partes[partes.length - 1] : nom;
    avisos.push({ km: kmF(p.km), txt: p.t.e + " " + txt });
  });
  if (VIDEO_SOLO !== "linea") puertos.forEach(function (pu) { avisos.push({ km: kmF(pu.km), txt: "🏔️ " + pu.name + (pu.ele != null ? " · " + fmtMiles(pu.ele) + " m" : "") }); });
  avisos.sort(function (a, b) { return a.km - b.km; });

  return { fino: fino, M: M, acum: acum, total: total, kmF: kmF, enKm: enKm, dias: dias, limites: limites, nombreDia: nombreDia,
    noche: noche, zFit: zFit, zDet: zDet, tramos: tramos, tramoEn: tramoEn, DUR: DUR, kmCabeza: kmCabeza, camara: camara, avisos: avisos, DR: DR, captura: captura || null,
    dest: dest, cercania: cercania, corto: corto };
}

/* ------------------------------------------------------------------ teselas */
function nivelTesela(z) { return Math.max(1, Math.min(14, Math.round(z))); }
/* v5 · «al principio, cuando está haciendo el zoom, no es muy fino»: saltaba de un nivel de teselas al siguiente de golpe.
   Mientras la cámara cambia de zoom se pintan DOS niveles (el de abajo y el de arriba) fundiéndose según el zoom. */
function nivelesTesela(cam) {
  if (!cam.fundir) return [{ L: nivelTesela(cam.z), a: 1 }];
  var L0 = Math.max(1, Math.min(14, Math.floor(cam.z))), fr = cam.z - L0;
  return L0 >= 14 ? [{ L: 14, a: 1 }] : [{ L: L0, a: 1 }, { L: L0 + 1, a: fr }];
}
function tilesVisibles(cam, Lfijo) {
  var L = Lfijo || nivelTesela(cam.z), esc = 512 * Math.pow(2, L), f = Math.pow(2, cam.z - L);
  var cx = cam.c.x * esc, cy = cam.c.y * esc, hw = 270 / f + 64, hh = 480 / f + 64, n = Math.pow(2, L);
  var out = [];
  for (var tx = Math.floor((cx - hw) / 512); tx <= Math.floor((cx + hw) / 512); tx++)
    for (var ty = Math.floor((cy - hh) / 512); ty <= Math.floor((cy + hh) / 512); ty++)
      if (ty >= 0 && ty < n) out.push({ L: L, x: ((tx % n) + n) % n, y: ty, tx: tx });
  return out;
}
function urlTesela(k) {
  return "https://api.mapbox.com/styles/v1/mapbox/" + VIDEO.ESTILO + "/tiles/512/" + k.L + "/" + k.x + "/" + k.y + "@2x?access_token=" + MAPBOX_TOKEN;
}

/* ------------------------------------------------------------------ el vídeo */
function hacerVideoRuta(r, pts, paradas, puertos, avisar) {
  avisar = avisar || {};
  var W = VIDEO.W, H = VIDEO.H;
  var G = null, fotosIm = [];
  var titulo = r.title || "Ruta en MOTOCLUBes";
  var kmRuta = r.km != null ? Number(r.km) : null; // sin km en la ruta, se toma el del trazado cuando esté el guion
  var dias = ""; // se calcula con el guion, cuando ya están las fotos
  var minutos = r.moving_time_minutes != null ? r.moving_time_minutes : r.duration_minutes;
  var conAlt = puertos.filter(function (p) { return p.ele != null; });
  var alto = conAlt.reduce(function (a, b) { return !a || b.ele > a.ele ? b : a; }, null);
  var paradasVideo = paradas.filter(function (p) { return !p.inicio && !p.fin && p.w.waypointType && p.w.waypointType !== "puerto"; });

  // 0) las fotos de la salida (FOTOS-SALIDA-1): las que no carguen, fuera
  // Como mucho 12 fotos en el vídeo, repartidas entre los días (con 10 por persona y día podrían ser muchas más).
  var fotosR = VIDEO_SIN_FOTOS ? [] : (function () {
    // TRANSPI-PORTADA-1 (15-oct): la madre puede llevar de portada fotos que también están en su etapa: sin repetir (por URL).
    // FOTOS-PARADA-1 (revisión): de las repetidas se queda la que tiene parada o texto y, si no, la del día más alto (la de la etapa)
    var vistas = {}, orden = [];
    (Array.isArray(r.fotos) ? r.fotos : []).forEach(function (f) {
      if (!f) return;
      var v = vistas[f.url], peso = function (x) { return (x.lat != null ? 2 : 0) + (x.pie ? 1 : 0); };
      if (!v) { vistas[f.url] = f; orden.push(f.url); return; }
      if (peso(f) > peso(v) || (peso(f) === peso(v) && (f.dia || 0) > (v.dia || 0))) vistas[f.url] = f;
    });
    var todas = orden.map(function (u) { return vistas[u]; }), porDia = {};
    todas.forEach(function (f) { (porDia[f.dia] = porDia[f.dia] || []).push(f); });
    var diasF = Object.keys(porDia).sort(function (a, b) { return a - b; });
    var cupo = diasF.length ? Math.ceil(12 / diasF.length) : 0, out = [];
    diasF.forEach(function (d) { out = out.concat(porDia[d].slice(0, cupo)); });
    return out.slice(0, 12);
  })();
  var cache = {}, lista = [];
  var capturaIm = null; // VIDEO-CAPTURA-1: si no carga, el vídeo sale sin ella
  var capturaLista = VIDEO_CAPTURA ? cargarImagen("/img/video/" + VIDEO_CAPTURA + ".jpg").then(function (im) { capturaIm = im; }).catch(function () {}) : Promise.resolve();
  var destListos = resolverDestacados(pts, puertos, paradas); // VIDEO-DESTACAR-1
  var destacados = [];
  var fotosListas = Promise.all(fotosR.map(function (f) {
    return cargarImagen(f.url).then(function (im) { return { im: im, dia: f.dia, autor: f.autor, lat: f.lat, lng: f.lng, pie: f.pie }; }).catch(function () { return null; }); // FOTOS-PARADA-1
  })).then(function (rs) { return capturaLista.then(function () { return rs; }); }).then(function (rs) {
    return destListos.then(function (dr) {
      destacados = dr.tramos;
      if (dr.fallos.length && avisar.aviso) avisar.aviso("No encuentro en la ruta: " + dr.fallos.join(", ") + ". Sale sin ese tramo.");
      return rs;
    });
  }).then(function (rs) {
    fotosIm = rs.filter(Boolean);
    G = guion(r, pts, paradas, puertos, fotosIm, capturaIm, destacados);
    // 1) qué teselas va a ver la cámara, simulándola entera
    for (var s = 0; s <= G.DUR; s += 0.1) {
      var cs = G.camara(s);
      nivelesTesela(cs).forEach(function (nv) {
        tilesVisibles(cs, nv.L).forEach(function (k) { var id = k.L + "/" + k.x + "/" + k.y; if (!(id in cache)) { cache[id] = null; lista.push(k); } });
      });
    }
  });
  // 2) bajarlas antes de grabar (6 a la vez)
  var hechas = 0;
  function bajar(k) {
    return cargarImagen(urlTesela(k)).then(function (im) { cache[k.L + "/" + k.x + "/" + k.y] = im; })
      .catch(function () {}).then(function () { hechas++; if (avisar.cargando) avisar.cargando(hechas, lista.length); });
  }
  var cola = null;
  function trabajador() { var k = cola.shift(); return k ? bajar(k).then(trabajador) : Promise.resolve(); }
  var bajando = fotosListas.then(function () {
    cola = lista.slice();
    return Promise.all([trabajador(), trabajador(), trabajador(), trabajador(), trabajador(), trabajador()]);
  });

  return Promise.all([bajando, cargarImagen("../img/helmet-256.png"), (document.fonts && document.fonts.ready) || Promise.resolve()])
    .then(function (res) {
      var casco = res[1];
      dias = G.dias > 1 ? G.dias + " días" : (r.dias && r.dias > 1 ? r.dias + " días" : "1 día");
      if (kmRuta == null) kmRuta = G.total;
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");

      function proy(cam) {
        var esc = 512 * Math.pow(2, cam.z);
        return function (p) { return { x: ((p.x - cam.c.x) * esc + 270) * 2, y: ((p.y - cam.c.y) * esc + 480) * 2 }; };
      }
      function mapa(cam) {
        ctx.fillStyle = "#e9e6dc"; ctx.fillRect(0, 0, W, H);
        nivelesTesela(cam).forEach(function (nv) {
          if (nv.a <= 0.01) return;
          var L = nv.L, f = Math.pow(2, cam.z - L), esc = 512 * Math.pow(2, L);
          var cx = cam.c.x * esc, cy = cam.c.y * esc, lado = 512 * f * 2;
          ctx.globalAlpha = nv.a;
          tilesVisibles(cam, L).forEach(function (k) {
            var im = cache[k.L + "/" + k.x + "/" + k.y]; if (!im) return;
            var px = ((k.tx * 512 - cx) * f + 270) * 2, py = ((k.y * 512 - cy) * f + 480) * 2;
            ctx.drawImage(im, px, py, lado + 1, lado + 1);
          });
          ctx.globalAlpha = 1;
        });
      }
      function linea(P, hasta, ancho, color) {
        ctx.beginPath(); ctx.lineWidth = ancho; ctx.strokeStyle = color; ctx.lineJoin = "round"; ctx.lineCap = "round";
        for (var i = 0; i < Math.min(hasta, P.length); i++) { if (i) ctx.lineTo(P[i].x, P[i].y); else ctx.moveTo(P[i].x, P[i].y); }
      }
      function velo(arriba, abajo) {
        if (arriba) { var g = ctx.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, "rgba(14,14,14,.8)"); g.addColorStop(1, "rgba(14,14,14,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 480); }
        if (abajo) { var g2 = ctx.createLinearGradient(0, H - 520, 0, H); g2.addColorStop(0, "rgba(14,14,14,0)"); g2.addColorStop(1, "rgba(14,14,14,.85)"); ctx.fillStyle = g2; ctx.fillRect(0, H - 520, W, 520); }
      }

      function cuadro(t) {
        var tr = G.tramoEn(t), cam = G.camara(t), pr = proy(cam);
        var P = G.M.map(pr), km = G.kmCabeza(t);
        mapa(cam);
        if (!VIDEO_V6) velo(true, true);
        else { // v6: sin velos mientras se rueda; se van al empezar el día 1 y vuelven al alejarse (para el título)
          var va = tr.tipo === "dibujo" || tr.tipo === "parada" ? 0 : tr.tipo === "tarjeta" ? (tr.dia === 0 ? 1 - tramo(t, tr.a, tr.a + 0.6) : 0) :
            tr.tipo === "alejar" ? tramo(t, tr.a, tr.a + 0.6) : 1;
          if (va > 0) { ctx.globalAlpha = va; velo(true, true); ctx.globalAlpha = 1; }
        }

        // la ruta entera, tenue (se ve hacia dónde se va) y lo ya recorrido, fuerte
        linea(P, P.length, 7, "rgba(255,255,255,.55)"); ctx.stroke();
        var n = 1; while (n < G.acum.length && G.acum[n] <= km) n++;
        if (G.corto) n = P.length; // REEL-CORTO-1: el día entero ya dibujado
        var cab = pr(G.enKm(km));
        [[16, "#ffffff"], [9, "#7C3AED"]].forEach(function (c) { linea(P, n, c[0], c[1]); if (km > 0 && !G.corto) ctx.lineTo(cab.x, cab.y); ctx.stroke(); });
        // VIDEO-DESTACAR-1: lo ya recorrido de cada tramo destacado, en amarillo y más gordo
        G.dest.forEach(function (d) {
          if (km <= d.a) return;
          var hastaKm = Math.min(km, d.b), ini = pr(G.enKm(d.a)), fin = pr(G.enKm(hastaKm));
          [[26, "#ffffff"], [16, "#FFC400"]].forEach(function (c) {
            ctx.beginPath(); ctx.lineWidth = c[0]; ctx.strokeStyle = c[1]; ctx.lineJoin = "round"; ctx.lineCap = "round";
            ctx.moveTo(ini.x, ini.y);
            for (var i = 1; i < G.acum.length; i++) { if (G.acum[i] <= d.a) continue; if (G.acum[i] >= hastaKm) break; ctx.lineTo(P[i].x, P[i].y); }
            ctx.lineTo(fin.x, fin.y); ctx.stroke();
          });
        });

        // CARTEL-CARRETERA-1: el número de la carretera en su cartel, sobre lo amarillo, ~190 px por detrás del casco
        if (tr.tipo === "dibujo" || tr.tipo === "tramo" || tr.tipo === "ver") G.dest.forEach(function (d) {
          if (!d.num || km <= d.a) return;
          if (G.corto && G.dest.indexOf(d) !== tr.i) return; // ZOOM-CERCA-1: solo el cartel del tramo en el que se está
          var aC = Math.min(1, (km - d.a) / 0.6) * G.cercania(km); if (aC <= 0.02) return;
          var pxKm = d.pxKm * Math.pow(2, cam.z - d.zPx);
          var kS = Math.max(d.a, Math.min(d.b, km - 190 / pxKm)), q = pr(G.enKm(kS));
          ctx.globalAlpha = aC;
          ctx.font = "800 44px Manrope, system-ui, sans-serif";
          var wC = ctx.measureText(d.num).width + 40, hC = 66;
          var xC = Math.max(24, Math.min(W - 24 - wC, q.x - wC / 2)), yC = Math.max(340, Math.min(H - 300, q.y - hC / 2)); // dentro de la pantalla, siempre entero
          if (Math.abs(xC + wC / 2 - cab.x) < wC / 2 + 50 && Math.abs(yC + hC / 2 - cab.y) < 90) yC = cab.y + 70; // si choca con el casco, debajo de él (encima va la flecha de SUPERCARRETERA-1)
          ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
          pildora(ctx, xC, yC, wC, hC, 12, "#111");
          ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          pildora(ctx, xC + 5, yC + 5, wC - 10, hC - 10, 8, "#fff");
          ctx.fillStyle = "#111"; ctx.textBaseline = "middle"; escribir(ctx, d.num, xC + wC / 2, yC + hC / 2 + 2, "center");
          ctx.globalAlpha = 1;
        });

        // paradas y puertos ya alcanzados
        var detalle = cam.z > G.zFit + 1;
        if (!VIDEO_SOLO) paradasVideo.forEach(function (p) { // SOLO-LINEA-1
          if (G.kmF(p.km) > km + 0.01) return;
          var q = pr({ x: mercX(p.w.lng), y: mercY(p.w.lat) });
          ctx.beginPath(); ctx.arc(q.x, q.y, 26, 0, 2 * Math.PI); ctx.fillStyle = p.t.c; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke();
          ctx.font = "28px 'Apple Color Emoji','Segoe UI Emoji',sans-serif"; ctx.textBaseline = "middle"; escribir(ctx, p.t.e, q.x, q.y + 1, "center");
        });
        if (VIDEO_SOLO !== "linea") puertos.forEach(function (pu) {
          if (G.kmF(pu.km) > km + 0.01) return;
          var q = pr({ x: mercX(pu.lng), y: mercY(pu.lat) });
          ctx.beginPath(); ctx.arc(q.x, q.y, 30, 0, 2 * Math.PI); ctx.fillStyle = "#7C3AED"; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke();
          ctx.font = "30px 'Apple Color Emoji','Segoe UI Emoji',sans-serif"; ctx.textBaseline = "middle"; escribir(ctx, "🏔️", q.x, q.y + 1, "center");
          if (!VIDEO_V6 && detalle && q.x > -50 && q.x < W + 50 && q.y > -50 && q.y < H + 50) { // v6: el nombre va en el bocadillo
            var txt = recortar(pu.name, 26) + (pu.ele != null ? " · " + fmtMiles(pu.ele) + " m" : "");
            ctx.font = "700 32px Manrope, system-ui, sans-serif";
            var w = ctx.measureText(txt).width + 32, x = Math.max(20, Math.min(W - w - 20, q.x - w / 2));
            pildora(ctx, x, q.y + 40, w, 52, 26, "rgba(255,255,255,.95)");
            ctx.fillStyle = "#111"; ctx.textAlign = "left"; ctx.fillText(txt, x + 16, q.y + 67);
          }
        });

        // casco
        if (tr.tipo !== "resumen" && tr.tipo !== "cierre" && tr.tipo !== "foto" && tr.tipo !== "puertos" && tr.tipo !== "captura" && (!G.corto || tr.tipo === "tramo" || tr.tipo === "vuelo" || tr.tipo === "ver")) { var lc = VIDEO_V6 ? 112 : 96; ctx.drawImage(casco, cab.x - lc / 2, cab.y - lc / 2, lc, lc); }

        // 🆕 SUPERCARRETERA-1 (15-oct, 109.ª). Mario, con el reel de referencia: «la carretera marcada en amarillo y una flecha
        // moviéndose que decía supercarretera […] con un poco de gracia». En cada tramo destacado, encima del casco, una flecha
        // que rebota apuntándole y el letrero «¡SUPERCARRETERA! 🔥» (entra y sale con la cercanía al tramo, como el zoom).
        if ((tr.tipo === "dibujo" || tr.tipo === "tramo" || tr.tipo === "ver") && G.dest.length) {
          var aS = G.cercania(km);
          if (aS > 0.05) {
            var rebote = Math.sin(t * 7) * 14, inclina = Math.sin(t * 3) * 0.06;
            var ax = Math.max(220, Math.min(W - 220, cab.x)), ay = Math.max(560, cab.y) - 120 + rebote;
            ctx.save(); ctx.globalAlpha = Math.min(1, aS * 1.4);
            ctx.translate(ax, ay); ctx.rotate(inclina);
            // la flecha, apuntando abajo, al casco
            ctx.beginPath(); ctx.moveTo(-26, -70); ctx.lineTo(26, -70); ctx.lineTo(26, -20); ctx.lineTo(54, -20); ctx.lineTo(0, 34);
            ctx.lineTo(-54, -20); ctx.lineTo(-26, -20); ctx.closePath();
            ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
            ctx.fillStyle = "#FF7A1A"; ctx.fill(); ctx.shadowColor = "transparent";
            ctx.lineWidth = 6; ctx.strokeStyle = "#fff"; ctx.stroke();
            // el letrero, encima, un pelín girado
            ctx.rotate(-0.05);
            ctx.font = "900 50px Manrope, system-ui, sans-serif";
            var txS = "¡SUPERCARRETERA! 🔥", wS = ctx.measureText(txS).width + 56, hS = 84;
            var xS = Math.max(24 - ax, Math.min(W - 24 - ax - wS, -wS / 2));
            ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
            pildora(ctx, xS, -70 - 22 - hS, wS, hS, 20, "#111");
            ctx.shadowColor = "transparent";
            ctx.fillStyle = "#FFC400"; ctx.textBaseline = "middle"; escribir(ctx, txS, xS + 28, -70 - 22 - hS / 2 + 2, "left");
            ctx.restore();
          }
        }

        // 🆕 FOTOS-PARADA-1: en la parada con fotos, la cámara naranja encima del casco y el rótulo amarillo con su texto
        if (tr.tipo === "parada") {
          var aP = tramo(t, tr.a, tr.a + 0.35), saltoP = (1 - tramo(t, tr.a, tr.a + 0.5)) * 40;
          ctx.globalAlpha = aP;
          var pyP = Math.max(120, cab.y - 150 - saltoP);
          ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
          ctx.beginPath(); ctx.arc(cab.x, pyP, 50, 0, 2 * Math.PI); ctx.fillStyle = "#FF7A1A"; ctx.fill();
          ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.lineWidth = 7; ctx.strokeStyle = "#fff"; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cab.x - 16, pyP + 46); ctx.lineTo(cab.x, pyP + 72); ctx.lineTo(cab.x + 16, pyP + 46); ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill();
          ctx.font = "48px 'Apple Color Emoji','Segoe UI Emoji',sans-serif"; ctx.textBaseline = "middle"; escribir(ctx, "📷", cab.x, pyP + 2, "center");
          var nF = tr.g.idxs.length, txP = tr.g.pie ? recortar(tr.g.pie, 44) : (nF === 1 ? "1 foto" : nF + " fotos"), fP = 50;
          do { ctx.font = "800 " + fP + "px Manrope, system-ui, sans-serif"; fP -= 2; } while (fP >= 32 && ctx.measureText(txP).width + 80 > W - 64);
          var wP = ctx.measureText(txP).width + 80, hP = 100, xP = (W - wP) / 2, yP = H - 360;
          ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
          pildora(ctx, xP, yP, wP, hP, hP / 2, "#FFC400");
          ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.fillStyle = "#111"; ctx.textBaseline = "middle"; escribir(ctx, txP, W / 2, yP + hP / 2 + 2, "center");
          ctx.globalAlpha = 1;
        }

        // VIDEO-DESTACAR-1: el letrero del tramo destacado por el que se pasa
        if ((tr.tipo === "dibujo" || tr.tipo === "tramo" || tr.tipo === "ver") && G.dest.length) {
          var dAct = null; G.dest.forEach(function (d) { if (km >= d.a - DESTACAR.BORDE_KM && km <= d.b + DESTACAR.BORDE_KM) dAct = d; });
          var aD = G.cercania(km);
          if (dAct && aD > 0.02) {
            ctx.globalAlpha = aD;
            var txL = "⭐ " + recortar(dAct.txt, 34), fL = 52;
            do { ctx.font = "800 " + fL + "px Manrope, system-ui, sans-serif"; fL -= 2; } while (fL >= 34 && ctx.measureText(txL).width + 72 > W - 64);
            var wL = ctx.measureText(txL).width + 72, hL = 96, xL = (W - wL) / 2, yL = 210;
            ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
            pildora(ctx, xL, yL, wL, hL, hL / 2, "#FFC400");
            ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
            ctx.fillStyle = "#111"; ctx.textBaseline = "middle"; escribir(ctx, txL, xL + 36, yL + hL / 2 + 2, "left");
            ctx.globalAlpha = 1;
          }
        }

        // título: en la vista entera del principio y al alejarse al final
        var tv = tr.tipo === "vista" ? tramo(t, 0, 0.7) : tr.tipo === "zoom" ? 1 - tramo(t, tr.a, tr.a + 0.8) : tr.tipo === "alejar" ? tramo(t, tr.a + 0.6, tr.b) : 0;
        if (tv > 0) {
          ctx.globalAlpha = tv;
          textoSombra(ctx, recortar(titulo, 26), W / 2, 170, "800 74px Manrope, system-ui, sans-serif", "#fff");
          textoSombra(ctx, fmtMiles(kmRuta) + " km · " + dias, W / 2, 262, "700 46px Manrope, system-ui, sans-serif", "#FF7A1A");
          ctx.globalAlpha = 1;
        }

        // día y km arriba mientras se rueda
        if (VIDEO_V6 && (tr.tipo === "tarjeta" || tr.tipo === "dibujo" || tr.tipo === "parada")) {
          // v6: los km grandes arriba a la derecha (por debajo del icono de cámara de Instagram) y el día en una etiqueta
          textoSombra(ctx, fmtMiles(km * kmRuta / G.total), W - 56, 250, "800 200px Manrope, system-ui, sans-serif", "#FF7A1A", "right");
          textoSombra(ctx, "KM", W - 62, 382, "800 58px Manrope, system-ui, sans-serif", "#FF7A1A", "right");
          if (G.dias > 1) {
            ctx.font = "800 42px Manrope, system-ui, sans-serif";
            var txD = "DÍA " + (tr.dia + 1), wD = ctx.measureText(txD).width + 56;
            pildora(ctx, 56, 150, wD, 80, 40, "rgba(14,14,14,.78)");
            ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txD, 84, 191);
          }
        } else if (tr.tipo === "tarjeta" || tr.tipo === "dibujo" || tr.tipo === "parada") {
          var d = tr.dia;
          textoSombra(ctx, (G.dias > 1 ? "DÍA " + (d + 1) + " · " : "") + "km " + fmtMiles(km * kmRuta / G.total), W / 2, 150, "800 60px Manrope, system-ui, sans-serif", "#fff");
        }

        // abajo: el pueblo, puerto o parada por el que se pasa (se queda unos segundos)
        if (tr.tipo === "dibujo") {
          var margen = Math.max(8, G.total * 0.035), ult = null;
          G.avisos.forEach(function (a) { if (a.km <= km && km - a.km < margen) ult = a; });
          if (ult) {
            var al = Math.min(1, (km - ult.km) / (margen * 0.15) + 0.2) * (1 - tramo(km - ult.km, margen * 0.8, margen));
            ctx.globalAlpha = al;
            if (VIDEO_V6) { // v6: bocadillo encima del casco, con la punta hacia él
              var txB = recortar(ult.txt, 30), fB = 44;
              do { ctx.font = "700 " + fB + "px Manrope, system-ui, sans-serif"; fB -= 2; } while (fB >= 30 && ctx.measureText(txB).width + 64 > W - 48);
              var wB = ctx.measureText(txB).width + 64, hB = 92;
              var xB = Math.max(24, Math.min(W - wB - 24, cab.x - 70)), yB = cab.y - 56 - 34 - hB;
              var abajoB = yB < 440; // no pisar los km: si no cabe encima del casco, va debajo con la punta hacia arriba
              if (abajoB) yB = cab.y + 56 + 34;
              var px = Math.max(xB + 40, Math.min(xB + wB - 40, cab.x));
              ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
              pildora(ctx, xB, yB, wB, hB, hB / 2, "rgba(105,105,105,.9)");
              ctx.beginPath();
              if (abajoB) { ctx.moveTo(px - 18, yB + 2); ctx.lineTo(px, yB - 26); ctx.lineTo(px + 18, yB + 2); }
              else { ctx.moveTo(px - 18, yB + hB - 2); ctx.lineTo(px, yB + hB + 26); ctx.lineTo(px + 18, yB + hB - 2); }
              ctx.closePath(); ctx.fill();
              ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
              ctx.lineWidth = 4; ctx.strokeStyle = "#fff";
              ctx.beginPath(); ctx.moveTo(xB + hB / 2, yB); ctx.arcTo(xB + wB, yB, xB + wB, yB + hB, hB / 2); ctx.arcTo(xB + wB, yB + hB, xB, yB + hB, hB / 2);
              ctx.arcTo(xB, yB + hB, xB, yB, hB / 2); ctx.arcTo(xB, yB, xB + wB, yB, hB / 2); ctx.closePath(); ctx.stroke();
              ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; escribir(ctx, txB, xB + 32, yB + hB / 2 + 2, "left");
            } else {
            ctx.font = "700 46px Manrope, system-ui, sans-serif";
            var txtA = recortar(ult.txt, 34), wA = ctx.measureText(txtA).width + 64;
            pildora(ctx, (W - wA) / 2, H - 300, wA, 96, 48, "rgba(14,14,14,.82)");
            ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; escribir(ctx, txtA, W / 2, H - 252, "center");
            }
            ctx.globalAlpha = 1;
          }
        }

        // tarjeta de día: «Día N · A → B» y, desde el día 2, dónde se durmió
        if (tr.tipo === "tarjeta") {
          var ta = tramo(t, tr.a, tr.a + 0.35) * (1 - tramo(t, tr.b - 0.35, tr.b));
          ctx.globalAlpha = ta;
          var nocheP = tr.dia > 0 ? G.noche(tr.dia - 1) : null;
          var alto2 = nocheP ? 360 : 280;
          pildora(ctx, 90, H / 2 - alto2 / 2, W - 180, alto2, 40, "rgba(14,14,14,.88)");
          textoSombra(ctx, "DÍA " + (tr.dia + 1), W / 2, H / 2 - alto2 / 2 + 90, "800 88px Manrope, system-ui, sans-serif", "#FF7A1A");
          textoSombra(ctx, recortar(G.nombreDia(tr.dia), 30), W / 2, H / 2 - alto2 / 2 + 180, "700 46px Manrope, system-ui, sans-serif", "#fff");
          if (nocheP) textoSombra(ctx, (nocheP.w.waypointType === "camping" ? "⛺ " : "🏨 ") + "Noche en " + recortar(nocheP.nombre, 24), W / 2, H / 2 - alto2 / 2 + 270, "600 40px Manrope, system-ui, sans-serif", "rgba(255,255,255,.8)");
          ctx.globalAlpha = 1;
        }

        // 🆕 FOTOS-SALIDA-1: cada foto a pantalla completa, con un zoom lento y «Día N · de quién»
        if (tr.tipo === "foto") {
          var fo = fotosIm[tr.i], u = (t - tr.a) / (tr.b - tr.a);
          var entra = tramo(t, tr.a, tr.a + 0.4);
          ctx.globalAlpha = tr.primera ? entra : 1; // FOTOS-PARADA-1: funde la primera de cada parada (y la primera del final)
          ctx.fillStyle = "#0e0e0e"; ctx.fillRect(0, 0, W, H);
          var k = Math.max(W / fo.im.width, H / fo.im.height) * (1 + 0.08 * u);
          var iw = fo.im.width * k, ih = fo.im.height * k;
          ctx.globalAlpha = entra;
          ctx.drawImage(fo.im, (W - iw) / 2, (H - ih) / 2, iw, ih);
          ctx.globalAlpha = 1;
          velo(false, true);
          if (fo.pie) { // FOTOS-PARADA-1: el texto de la foto, en el rótulo amarillo de la parada
            var txF = "📷 " + recortar(fo.pie, 44), fF = 50;
            do { ctx.font = "800 " + fF + "px Manrope, system-ui, sans-serif"; fF -= 2; } while (fF >= 30 && ctx.measureText(txF).width + 80 > W - 64);
            var wF = ctx.measureText(txF).width + 80, hF = 100;
            ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
            pildora(ctx, (W - wF) / 2, H - 420, wF, hF, hF / 2, "#FFC400");
            ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
            ctx.fillStyle = "#111"; ctx.textBaseline = "middle"; escribir(ctx, txF, W / 2, H - 420 + hF / 2 + 2, "center");
          }
          var pie = (G.dias > 1 ? "Día " + fo.dia : "") + (fo.autor ? (G.dias > 1 ? " · " : "") + "📸 " + fo.autor : "");
          if (pie) {
            ctx.font = "700 42px Manrope, system-ui, sans-serif";
            var wp = ctx.measureText(pie).width + 60;
            pildora(ctx, (W - wp) / 2, H - 290, wp, 90, 45, "rgba(14,14,14,.8)");
            ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; escribir(ctx, pie, W / 2, H - 245, "center");
          }
        }

        // 🆕 VIDEO-CAPTURA-1: la captura en una ventana redondeada que baja despacio de arriba abajo
        if (tr.tipo === "captura" && G.captura) {
          var ci = G.captura, vc = tramo(t, tr.a, tr.a + 0.5) * (1 - tramo(t, tr.b - 0.4, tr.b));
          var vw = 900, vh = 1250, vx = (W - vw) / 2, vy = 400 + (1 - tramo(t, tr.a, tr.a + 0.6)) * 80;
          var ihc = ci.height * vw / ci.width, rec = Math.max(0, ihc - vh), uc = tramo(t, tr.a + 0.9, tr.b - 0.8);
          ctx.globalAlpha = vc;
          ctx.fillStyle = "rgba(14,14,14,.55)"; ctx.fillRect(0, 0, W, H);
          textoSombra(ctx, "El tiempo de cada etapa", W / 2, 215, "800 60px Manrope, system-ui, sans-serif", "#fff");
          textoSombra(ctx, "a la hora de salir y de llegar", W / 2, 295, "600 44px Manrope, system-ui, sans-serif", "rgba(255,255,255,.85)");
          pildora(ctx, vx - 8, vy - 8, vw + 16, vh + 16, 52, "rgba(255,255,255,.95)");
          ctx.save();
          pildora(ctx, vx, vy, vw, vh, 44, "#f3ece4"); ctx.clip();
          ctx.drawImage(ci, vx, vy - rec * uc, vw, ihc);
          ctx.restore();
          ctx.globalAlpha = 1;
        }

        // 🆕 VIDEO-RESUMEN-PUERTOS-1: los puertos, uno a uno, en orden de paso, por páginas de hasta 15 y con el nombre
        // entero; los tres más altos de toda la ruta en naranja
        if (tr.tipo === "puertos") {
          var DRp = G.DR, lp = DRp.paginas[tr.pag] || [], np = lp.length, npg = DRp.paginas.length;
          var fila = Math.min(104, Math.floor(1440 / Math.max(1, np)));
          var altoP = np * fila + (npg > 1 ? 250 : 220), y0 = Math.max(110, (H - altoP) / 2);
          var vis = tramo(t, tr.a, tr.a + 0.5) * (1 - tramo(t, tr.b - 0.35, tr.b));
          var paso = Math.min(0.3, (tr.b - tr.a - 2.2) / Math.max(1, np));
          ctx.globalAlpha = vis;
          pildora(ctx, 60, y0, W - 120, altoP, 40, "rgba(14,14,14,.9)");
          ctx.font = "800 60px Manrope, system-ui, sans-serif"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
          escribir(ctx, "🏔️ " + puertos.length + " puertos", W / 2, y0 + 92, "center");
          if (npg > 1) { ctx.font = "600 34px Manrope, system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.55)"; escribir(ctx, (tr.pag + 1) + " de " + npg, W / 2, y0 + 150, "center"); }
          var yIni = y0 + (npg > 1 ? 220 : 190);
          lp.forEach(function (pu, i) {
            var en = tramo(t, tr.a + 0.6 + i * paso, tr.a + 0.6 + i * paso + 0.35);
            if (en <= 0) return;
            var y = yIni + i * fila + (1 - en) * 24, esTop = DRp.top.indexOf(pu) >= 0;
            ctx.globalAlpha = vis * en;
            ctx.font = "800 46px Manrope, system-ui, sans-serif";
            var alt = pu.ele != null ? fmtMiles(pu.ele) + " m" : "—", wAlt = ctx.measureText(alt).width;
            ctx.fillStyle = esTop ? "#FF7A1A" : "#fff";
            escribir(ctx, alt, W - 140, y, "right");
            ctx.font = (esTop ? "800 " : "600 ") + "42px Manrope, system-ui, sans-serif";
            ctx.fillStyle = esTop ? "#FF7A1A" : "rgba(255,255,255,.88)";
            var nom = String(pu.name || ""), hueco = W - 140 - wAlt - 40 - 140;
            while (nom.length > 4 && ctx.measureText(nom).width > hueco) nom = nom.slice(0, -2).trim() + "…"; // solo si de verdad no cabe
            escribir(ctx, nom, 140, y, "left");
          });
          ctx.globalAlpha = 1;
        }

        // resumen · VIDEO-RESUMEN-PUERTOS-1: + el más bajo, hoteles, restaurantes…, y las filas entran una a una
        if (tr.tipo === "resumen") {
          var rs = tramo(t, tr.a, tr.a + 0.5) * (1 - tramo(t, tr.b - 0.35, tr.b));
          var DRr = G.DR;
          var filas = [
            ["Distancia", fmtMiles(kmRuta) + " km"],
            ["Días", String(G.dias > 1 ? G.dias : 1)],
            ["Tiempo", minutos ? Math.floor(minutos / 60) + " h " + (Math.round(minutos % 60) ? Math.round(minutos % 60) + " min" : "") : "—"],
            ["Desnivel", r.elevation_gain_m != null ? fmtMiles(r.elevation_gain_m) + " m" : "—"],
            ["Puertos", String(puertos.length)],
            ["El más alto", alto ? fmtMiles(alto.ele) + " m" : "—", alto ? alto.name : "", true]
          ];
          if (DRr.bajo) filas.push(["El más bajo", fmtMiles(DRr.bajo.ele) + " m", DRr.bajo.name]);
          DRr.cuentas.forEach(function (c) { filas.push(c); });
          var conNombre = filas.filter(function (fl) { return fl[2]; }).length;
          var paso2 = 100, altoR = filas.length * paso2 + conNombre * 44 + 120, yR = Math.max(200, (H - altoR) / 2);
          ctx.globalAlpha = rs;
          pildora(ctx, 90, yR, W - 180, altoR, 40, "rgba(14,14,14,.88)");
          var y = yR + 100;
          filas.forEach(function (fl, i) {
            var en = tramo(t, tr.a + 0.4 + i * 0.3, tr.a + 0.75 + i * 0.3);
            if (en > 0) {
              ctx.globalAlpha = rs * en;
              ctx.font = "700 40px Manrope, system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(255,255,255,.62)"; ctx.fillText(fl[0], 150, y);
              ctx.font = "800 56px Manrope, system-ui, sans-serif"; ctx.fillStyle = fl[3] ? "#FF7A1A" : "#fff"; escribir(ctx, fl[1], W - 150, y, "right");
              if (fl[2]) { ctx.font = "600 34px Manrope, system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.62)"; escribir(ctx, recortar(fl[2], 30), W - 150, y + 54, "right"); }
            }
            y += paso2 + (fl[2] ? 44 : 0);
          });
          ctx.globalAlpha = 1;
        }

        // cierre
        if (tr.tipo === "cierre") {
          ctx.globalAlpha = tramo(t, tr.a, tr.a + 0.6);
          ctx.fillStyle = "rgba(14,14,14,.93)"; ctx.fillRect(0, 0, W, H);
          ctx.drawImage(casco, W / 2 - 150, 620, 300, 300);
          textoSombra(ctx, "MOTOCLUBes", W / 2, 1010, "800 92px Manrope, system-ui, sans-serif", "#fff");
          // NOMBRE-APP-2 (18-oct, 115.ª): que se vea que es una app para navegar, no una agencia ni un club (texto aprobado por Mario)
          textoSombra(ctx, "La app de rutas y GPS para moto", W / 2, 1100, "600 46px Manrope, system-ui, sans-serif", "rgba(255,255,255,.8)");
          textoSombra(ctx, "motoclubes.es", W / 2, 1210, "800 54px Manrope, system-ui, sans-serif", "#FF7A1A");
          ctx.globalAlpha = 1;
        }

        // MARCA-HECHO-1: «Hecho con MOTOCLUBes» todo el vídeo; se va fundiendo al entrar el cierre (allí ya está el logo)
        marcaHecho(ctx, casco, tr.tipo === "puertos" || tr.tipo === "resumen" || tr.tipo === "captura",
          tr.tipo === "cierre" ? 1 - tramo(t, tr.a, tr.a + 0.6) : 1);

        ctx.font = "500 22px Manrope, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
        ctx.fillStyle = VIDEO_V6 && (tr.tipo === "dibujo" || tr.tipo === "tarjeta") ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.75)"; // v6: sin velo, en oscuro para que se lea
        escribir(ctx, "© Mapbox © OpenStreetMap", W - 24, H - 24, "right");
      }

      var tipo = tipoGrabacion();
      if (!tipo || !cv.captureStream) throw new Error("Este navegador no sabe grabar vídeo. Prueba con Safari.");
      // v5 · «va a trompicones»: antes el tiempo del vídeo era el del reloj, y si un fotograma tardaba, el siguiente saltaba.
      // Ahora cada fotograma avanza EXACTAMENTE 1/30 s de guion y se entrega a mano (requestFrame): si el ordenador va
      // justo, el vídeo tarda más en hacerse pero no da saltos.
      var flujo = cv.captureStream(0), pista = flujo.getVideoTracks()[0];
      if (!pista || typeof pista.requestFrame !== "function") { flujo = cv.captureStream(VIDEO.FPS); pista = null; } // sin entrega a mano: al reloj
      var rec = new MediaRecorder(flujo, { mimeType: tipo, videoBitsPerSecond: 8000000 });
      var trozos = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) trozos.push(e.data); };
      var hecho = new Promise(function (ok) { rec.onstop = function () { ok(new Blob(trozos, { type: tipo.split(";")[0] })); }; });
      var t0 = null;
      cuadro(0);
      if (avisar.lienzo) avisar.lienzo(cv);
      rec.start(250);
      return new Promise(function (ok, no) {
        var i = 0, total = Math.ceil(G.DUR * VIDEO.FPS), dt = 1000 / VIDEO.FPS;
        function paso() {
          // VIDEO-CERRAR-1: si la persona cierra la capa a media grabación, se para aquí y no sigue gastando batería
          if (avisar.cancelado && avisar.cancelado()) { try { rec.stop(); } catch (e) {} no(new Error("cancelado")); return; }
          if (t0 === null) t0 = performance.now();
          var t = i / VIDEO.FPS;
          cuadro(Math.min(t, G.DUR));
          if (pista && pista.requestFrame) pista.requestFrame();
          if (avisar.progreso) avisar.progreso(t, G.DUR);
          i++;
          if (i > total) { setTimeout(function () { rec.stop(); ok(); }, 200); return; }
          var espera = t0 + i * dt - performance.now(); // al ritmo de 30 por segundo, sin saltarse ninguno
          setTimeout(paso, Math.max(0, espera));
        }
        paso();
      }).then(function () { return hecho; }).then(function (blob) {
        return { blob: blob, ext: tipo.indexOf("mp4") >= 0 ? "mp4" : "webm", segundos: Math.round(G.DUR) };
      });
    });
}
