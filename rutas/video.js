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
   Usa lo que ya tiene la página (index.html): esc, fmtMiles, kmAcum, aligerarTraza, MAPBOX_TOKEN.
   🟢 25-sep: revisado por Mario en v5 y puesto a la vista de todos en la página de cada ruta pública. */

var VIDEO = {
  W: 1080, H: 1920, FPS: 30,
  T_VISTA: 2.5, T_ZOOM: 3.6, T_TARJETA: 2.2, T_ALEJAR: 3, T_FOTO: 2.6, T_RESUMEN: 3.2, T_CIERRE: 3,
  // 🔄 v5 (Mario: «va muy rápido y no te da tiempo a ver los nombres»): km/15 por segundo, entre 20 y 58 s de dibujo
  DIBUJO_MIN: 20, DIBUJO_MAX: 58, KM_POR_S: 15,
  ESTILO: "outdoors-v12"
};

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
function textoSombra(ctx, txt, x, y, font, color, alineado) {
  ctx.font = font; ctx.textAlign = alineado || "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
  ctx.fillStyle = color; ctx.fillText(txt, x, y);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}
function pildora(ctx, x, y, w, h, r, fondo) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fillStyle = fondo; ctx.fill();
}
function recortar(txt, n) { txt = String(txt || ""); return txt.length > n ? txt.slice(0, n - 1) + "…" : txt; }

/* ------------------------------------------------------------------ el guion: días, tiempos y cámara */
function guion(r, pts, paradas, puertos, fotos) {
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

  // Encuadres: la vista entera y el zoom de detalle.
  var x1 = 1, x2 = 0, y1 = 1, y2 = 0;
  M.forEach(function (p) { if (p.x < x1) x1 = p.x; if (p.x > x2) x2 = p.x; if (p.y < y1) y1 = p.y; if (p.y > y2) y2 = p.y; });
  var zFit = Math.min(Math.log2(440 / (512 * Math.max(x2 - x1, 1e-9))), Math.log2(470 / (512 * Math.max(y2 - y1, 1e-9))));
  zFit = Math.max(2, Math.min(13, zFit));
  var cFit = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + 10 / (512 * Math.pow(2, zFit)) };
  var zDet = Math.max(zFit + 1, Math.min(11.5, zFit + 3.3)); // en La ruta del silencio: unos 28 km de ancho de pantalla

  // Tiempos.
  var tDibujo = Math.max(VIDEO.DIBUJO_MIN, Math.min(VIDEO.DIBUJO_MAX, total / VIDEO.KM_POR_S));
  var tramos = []; var t = 0;
  tramos.push({ tipo: "vista", a: t, b: t += VIDEO.T_VISTA });
  tramos.push({ tipo: "zoom", a: t, b: t += VIDEO.T_ZOOM });
  for (var d = 0; d < dias; d++) {
    tramos.push({ tipo: "tarjeta", dia: d, a: t, b: t += VIDEO.T_TARJETA });
    tramos.push({ tipo: "dibujo", dia: d, a: t, b: t += tDibujo * (limites[d + 1] - limites[d]) / total });
  }
  tramos.push({ tipo: "alejar", a: t, b: t += VIDEO.T_ALEJAR });
  // 🆕 FOTOS-SALIDA-1: tras la ruta, las fotos de los que fueron (Mario: «primero poner la ruta, luego poner las fotos»)
  fotos.forEach(function (f, i) { tramos.push({ tipo: "foto", i: i, a: t, b: t += VIDEO.T_FOTO }); });
  tramos.push({ tipo: "resumen", a: t, b: t += VIDEO.T_RESUMEN });
  tramos.push({ tipo: "cierre", a: t, b: t += VIDEO.T_CIERRE });
  var DUR = t;

  function tramoEn(t) { for (var i = 0; i < tramos.length; i++) if (t < tramos[i].b) return tramos[i]; return tramos[tramos.length - 1]; }
  function kmCabeza(t) {
    var tr = tramoEn(t);
    if (tr.tipo === "vista" || tr.tipo === "zoom") return 0;
    if (tr.tipo === "tarjeta") return limites[tr.dia];
    if (tr.tipo === "dibujo") return limites[tr.dia] + (limites[tr.dia + 1] - limites[tr.dia]) * Math.min(1, (t - tr.a) / (tr.b - tr.a));
    return total;
  }
  function sigue(km) { // la cámara mira un poco por delante y promedia para no dar tirones
    var ps = [km - 4, km, km + 4, km + 8].map(function (k) { return enKm(Math.max(0, Math.min(total, k))); });
    return { x: (ps[0].x + ps[1].x + ps[2].x + ps[3].x) / 4, y: (ps[0].y + ps[1].y + ps[2].y + ps[3].y) / 4 };
  }
  function interp(a, b, u, za, zb) { // de una cámara a otra: el zoom en escala logarítmica
    return { c: { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }, z: za + (zb - za) * u };
  }
  function camara(t) {
    var tr = tramoEn(t);
    if (tr.tipo === "vista" || tr.tipo === "resumen" || tr.tipo === "cierre" || tr.tipo === "foto") return { c: cFit, z: zFit };
    if (tr.tipo === "zoom") { var cz = interp(cFit, sigue(0), tramo(t, tr.a, tr.b), zFit, zDet); cz.fundir = true; return cz; }
    if (tr.tipo === "alejar") { var ca = interp(sigue(total), cFit, tramo(t, tr.a, tr.b), zDet, zFit); ca.fundir = true; return ca; }
    return { c: sigue(kmCabeza(t)), z: zDet };
  }

  // Lo que sale abajo al pasar: pueblos (el «Pueblo» de «Carretera · Pueblo»), puertos y paradas con su icono.
  var avisos = [];
  paradas.forEach(function (p) {
    if (p.w.waypointType === "puerto" || p.inicio || p.fin) return; // los puertos van aparte; salida y llegada, en las tarjetas
    // v5, Mario: «los puntos de pasada no, porque confunden»: solo paradas de verdad (y los puertos, arriba)
    if (["gasolinera", "restaurante", "hotel", "camping", "lugar_interes", "mirador"].indexOf(p.w.waypointType) < 0) return;
    var nom = String(p.nombre || "").trim(); if (!nom) return;
    var partes = nom.split(" · ");
    // «N-420a · Falset» → «Falset»: si delante va una carretera, se enseña el pueblo
    var txt = partes.length > 1 && (!p.w.waypointType || /^[A-Z]{1,3}-?\d/.test(partes[0])) ? partes[partes.length - 1] : nom;
    avisos.push({ km: kmF(p.km), txt: p.t.e + " " + txt });
  });
  puertos.forEach(function (pu) { avisos.push({ km: kmF(pu.km), txt: "🏔️ " + pu.name + (pu.ele != null ? " · " + fmtMiles(pu.ele) + " m" : "") }); });
  avisos.sort(function (a, b) { return a.km - b.km; });

  return { fino: fino, M: M, acum: acum, total: total, kmF: kmF, enKm: enKm, dias: dias, limites: limites, nombreDia: nombreDia,
    noche: noche, zFit: zFit, zDet: zDet, tramos: tramos, tramoEn: tramoEn, DUR: DUR, kmCabeza: kmCabeza, camara: camara, avisos: avisos };
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
  var fotosR = (function () {
    var todas = Array.isArray(r.fotos) ? r.fotos : [], porDia = {};
    todas.forEach(function (f) { (porDia[f.dia] = porDia[f.dia] || []).push(f); });
    var diasF = Object.keys(porDia).sort(function (a, b) { return a - b; });
    var cupo = diasF.length ? Math.ceil(12 / diasF.length) : 0, out = [];
    diasF.forEach(function (d) { out = out.concat(porDia[d].slice(0, cupo)); });
    return out.slice(0, 12);
  })();
  var cache = {}, lista = [];
  var fotosListas = Promise.all(fotosR.map(function (f) {
    return cargarImagen(f.url).then(function (im) { return { im: im, dia: f.dia, autor: f.autor }; }).catch(function () { return null; });
  })).then(function (rs) {
    fotosIm = rs.filter(Boolean);
    G = guion(r, pts, paradas, puertos, fotosIm);
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
        velo(true, true);

        // la ruta entera, tenue (se ve hacia dónde se va) y lo ya recorrido, fuerte
        linea(P, P.length, 7, "rgba(255,255,255,.55)"); ctx.stroke();
        var n = 1; while (n < G.acum.length && G.acum[n] <= km) n++;
        var cab = pr(G.enKm(km));
        [[16, "#ffffff"], [9, "#7C3AED"]].forEach(function (c) { linea(P, n, c[0], c[1]); if (km > 0) ctx.lineTo(cab.x, cab.y); ctx.stroke(); });

        // paradas y puertos ya alcanzados
        var detalle = cam.z > G.zFit + 1;
        paradasVideo.forEach(function (p) {
          if (G.kmF(p.km) > km + 0.01) return;
          var q = pr({ x: mercX(p.w.lng), y: mercY(p.w.lat) });
          ctx.beginPath(); ctx.arc(q.x, q.y, 26, 0, 2 * Math.PI); ctx.fillStyle = p.t.c; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke();
          ctx.font = "28px 'Apple Color Emoji','Segoe UI Emoji',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.t.e, q.x, q.y + 1);
        });
        puertos.forEach(function (pu) {
          if (G.kmF(pu.km) > km + 0.01) return;
          var q = pr({ x: mercX(pu.lng), y: mercY(pu.lat) });
          ctx.beginPath(); ctx.arc(q.x, q.y, 30, 0, 2 * Math.PI); ctx.fillStyle = "#7C3AED"; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke();
          ctx.font = "30px 'Apple Color Emoji','Segoe UI Emoji',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🏔️", q.x, q.y + 1);
          if (detalle && q.x > -50 && q.x < W + 50 && q.y > -50 && q.y < H + 50) {
            var txt = recortar(pu.name, 26) + (pu.ele != null ? " · " + fmtMiles(pu.ele) + " m" : "");
            ctx.font = "700 32px Manrope, system-ui, sans-serif";
            var w = ctx.measureText(txt).width + 32, x = Math.max(20, Math.min(W - w - 20, q.x - w / 2));
            pildora(ctx, x, q.y + 40, w, 52, 26, "rgba(255,255,255,.95)");
            ctx.fillStyle = "#111"; ctx.textAlign = "left"; ctx.fillText(txt, x + 16, q.y + 67);
          }
        });

        // casco
        if (tr.tipo !== "resumen" && tr.tipo !== "cierre" && tr.tipo !== "foto") ctx.drawImage(casco, cab.x - 48, cab.y - 48, 96, 96);

        // título: en la vista entera del principio y al alejarse al final
        var tv = tr.tipo === "vista" ? tramo(t, 0, 0.7) : tr.tipo === "zoom" ? 1 - tramo(t, tr.a, tr.a + 0.8) : tr.tipo === "alejar" ? tramo(t, tr.a + 0.6, tr.b) : 0;
        if (tv > 0) {
          ctx.globalAlpha = tv;
          textoSombra(ctx, recortar(titulo, 26), W / 2, 170, "800 74px Manrope, system-ui, sans-serif", "#fff");
          textoSombra(ctx, fmtMiles(kmRuta) + " km · " + dias, W / 2, 262, "700 46px Manrope, system-ui, sans-serif", "#FF7A1A");
          ctx.globalAlpha = 1;
        }

        // día y km arriba mientras se rueda
        if (tr.tipo === "tarjeta" || tr.tipo === "dibujo") {
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
            ctx.font = "700 46px Manrope, system-ui, sans-serif";
            var txtA = recortar(ult.txt, 34), wA = ctx.measureText(txtA).width + 64;
            pildora(ctx, (W - wA) / 2, H - 300, wA, 96, 48, "rgba(14,14,14,.82)");
            ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txtA, W / 2, H - 252);
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
          ctx.globalAlpha = tr.i === 0 ? entra : 1;
          ctx.fillStyle = "#0e0e0e"; ctx.fillRect(0, 0, W, H);
          var k = Math.max(W / fo.im.width, H / fo.im.height) * (1 + 0.08 * u);
          var iw = fo.im.width * k, ih = fo.im.height * k;
          ctx.globalAlpha = entra;
          ctx.drawImage(fo.im, (W - iw) / 2, (H - ih) / 2, iw, ih);
          ctx.globalAlpha = 1;
          velo(false, true);
          var pie = (G.dias > 1 ? "Día " + fo.dia : "") + (fo.autor ? (G.dias > 1 ? " · " : "") + "📸 " + fo.autor : "");
          if (pie) {
            ctx.font = "700 42px Manrope, system-ui, sans-serif";
            var wp = ctx.measureText(pie).width + 60;
            pildora(ctx, (W - wp) / 2, H - 290, wp, 90, 45, "rgba(14,14,14,.8)");
            ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(pie, W / 2, H - 245);
          }
        }

        // resumen
        if (tr.tipo === "resumen") {
          var rs = tramo(t, tr.a, tr.a + 0.5) * (1 - tramo(t, tr.b - 0.35, tr.b));
          ctx.globalAlpha = rs;
          pildora(ctx, 90, 600, W - 180, 800, 40, "rgba(14,14,14,.88)");
          var filas = [
            ["Distancia", fmtMiles(kmRuta) + " km"],
            ["Días", String(G.dias > 1 ? G.dias : 1)],
            ["Tiempo", minutos ? Math.floor(minutos / 60) + " h " + (Math.round(minutos % 60) ? Math.round(minutos % 60) + " min" : "") : "—"],
            ["Desnivel", r.elevation_gain_m != null ? fmtMiles(r.elevation_gain_m) + " m" : "—"],
            ["Puertos", String(puertos.length)],
            ["El más alto", alto ? fmtMiles(alto.ele) + " m" : "—"]
          ];
          filas.forEach(function (fl, i) {
            var y = 690 + i * 112;
            ctx.font = "700 40px Manrope, system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(255,255,255,.62)"; ctx.fillText(fl[0], 150, y);
            ctx.font = "800 56px Manrope, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = i === 5 ? "#FF7A1A" : "#fff"; ctx.fillText(fl[1], W - 150, y);
          });
          if (alto) { ctx.font = "600 34px Manrope, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,.62)"; ctx.fillText(recortar(alto.name, 30), W - 150, 690 + 5 * 112 + 58); }
          ctx.globalAlpha = 1;
        }

        // cierre
        if (tr.tipo === "cierre") {
          ctx.globalAlpha = tramo(t, tr.a, tr.a + 0.6);
          ctx.fillStyle = "rgba(14,14,14,.93)"; ctx.fillRect(0, 0, W, H);
          ctx.drawImage(casco, W / 2 - 150, 620, 300, 300);
          textoSombra(ctx, "MOTOCLUBes", W / 2, 1010, "800 92px Manrope, system-ui, sans-serif", "#fff");
          textoSombra(ctx, "La app que viaja contigo", W / 2, 1100, "600 46px Manrope, system-ui, sans-serif", "rgba(255,255,255,.8)");
          textoSombra(ctx, "motoclubes.es", W / 2, 1210, "800 54px Manrope, system-ui, sans-serif", "#FF7A1A");
          ctx.globalAlpha = 1;
        }

        ctx.font = "500 22px Manrope, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText("© Mapbox © OpenStreetMap", W - 24, H - 24);
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
      return new Promise(function (ok) {
        var i = 0, total = Math.ceil(G.DUR * VIDEO.FPS), dt = 1000 / VIDEO.FPS;
        function paso() {
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
