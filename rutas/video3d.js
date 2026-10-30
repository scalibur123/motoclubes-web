/* rutas/video3d.js · 🆕 VIDEO-3D-1 (130.ª, 29-oct-2026) — el vídeo de la ruta en 3D, «como Relive»: relieve, la cámara
   DETRÁS del casco, inclinada, girando con la carretera y siguiendo la línea mientras se dibuja.
   Solo con «&video=3d» en el enlace (como «&video=6»). Sin el parámetro, video.js hace el vídeo de siempre y este fichero
   ni se carga: Mario volvió de la v6 a la de siempre, así que la de siempre no se toca.
   CÓMO: el guion es EL MISMO de video.js (`guion`: tramos, km del casco, días, fotos, tramos destacados). Cambia solo el
   fondo: en vez de las teselas planas, un mapa de Mapbox escondido (fuera de la pantalla, 540×960 a 2× = 1080×1920) con
   el relieve (mapbox-terrain-dem-v1, ×1,4) y el cielo. La ruta la pinta Mapbox, pegada al relieve (entera en gris y lo
   recorrido en naranja); el casco, las paradas, los km, los letreros, las tarjetas y las fotos los sigue pintando
   video.js encima, como siempre, en el punto de la pantalla que le da Mapbox (`proy`).
   Cada fotograma ESPERA a que Mapbox acabe de pintarlo (como mucho 2 s, nunca se queda colgado) y se graba con su hora
   exacta (i/30 s) con WebCodecs (VideoEncoder, H.264) + mp4-muxer: aunque un fotograma tarde, el vídeo no da saltos.
   Sin VideoEncoder con H.264 (Safari de antes de la 16.4, algunos Firefox) no se hace en 3D: sale el vídeo de siempre, con
   aviso. Se probó grabar con MediaRecorder parándolo mientras el mapa pinta y en Chromium el vídeo salía de 8 minutos en vez
   de 22 s (la pausa no descuenta el tiempo): un vídeo así no sirve para publicar.
   Si el mapa 3D no carga, video.js hace el vídeo de siempre (se avisa). En el reel corto (&corto=1) no se usa. */
(function () {
  var V3 = {
    PITCH: 65,        // inclinación de la cámara al rodar (0 = desde arriba; Relive va más o menos así)
    PAD: 230,         // px (de 960) de margen arriba: el casco queda a ~62 % de la altura y se ve la carretera por delante
    ZOOM_MAS: 0.5,    // niveles más cerca que el zoom de detalle de siempre (zDet), porque con la inclinación se ve más lejos
    EXAGERA: 1.4,     // cuánto se exagera el relieve
    // La dirección de la cámara: de un punto de lo ya rodado a un punto de lo que viene, más lejos cuanto más deprisa va
    // el casco (en el guion de siempre va a 3-15 km por segundo de vídeo): DELANTE = lo que rueda en 0,6 s (2 km como poco),
    // ATRÁS = lo de 0,25 s (0,5 km como poco). Así lo rodado entra por abajo y la carretera sigue hacia arriba, sin girar en
    // cada curva. Probado en una ruta de prueba muy revirada: la estela entra torcida ~16° de mediana (con una media fija
    // de 4 km por delante, ~24°).
    DELANTE_S: 0.6, DELANTE_KM: 3, ATRAS_S: 0.25, ATRAS_KM: 0.5,
    SUAVE_S: 1.2,     // …y suavizada en el tiempo (±1,2 s, dos pasadas) para que no dé tirones
    // 🔄 VIDEO-3D-CAMARA-CALMA-1 (132.ª, Mario: «se va moviendo de derecha a izquierda en función de la dirección del casco, va
    // entre los valles»): antes ±0,5 s y 2 km por delante; ahora mira 3 km por delante y suaviza ±1,2 s: no sigue cada curva
    // VIDEO-3D-ESPERA-1 (131.ª, Mario 09:56: «si está cargando… no puedes empezar con el vídeo»): antes, 2 s y se grababa lo que
    // hubiera (con datos del móvil, fotogramas a medio pintar). Ahora, primero se recorre la ruta entera SIN grabar para que
    // Mapbox tenga el mapa y el relieve (PRECARGA_*), y luego cada fotograma espera a estar pintado del todo (ESPERA_MS, solo
    // un tope de seguridad para no quedarse colgado si se va la red).
    ESPERA_MS: 20000, // lo más que se espera a que Mapbox acabe un fotograma (después de la precarga casi siempre es al momento)
    AGOTADAS_MAX: 3,  // revisión 131.ª: tantas esperas agotadas SEGUIDAS → el mapa no responde y se para (no horas «montando»)
    NO_RESPONDE: "el mapa 3D no responde (sin conexión o la tarjeta gráfica no da más)",
    SIN_GRAFICA: "la tarjeta gráfica ha dejado de pintar el mapa 3D",
    PRECARGA_PASO_S: 0.5, // cada cuánto (en segundos de vídeo) se pone la cámara al recorrer la ruta antes de grabar
    PRECARGA_MS: 20000,   // lo más que se espera a cada vista de la precarga
    ARRANQUE_MS: 25000, // lo más que se espera a que cargue el mapa al principio (si no, el vídeo de siempre)
    MUXER: "https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.js", // global Mp4Muxer
    CODECS: ["avc1.640028", "avc1.4d0028", "avc1.42e028"], // H.264 (High, Main, Baseline · nivel 4: 1080×1920 cabe)
    BITRATE: 8000000,
    /* 🆕 VIDEO-3D-LIGERO-1 (132.ª, 30-oct). El 30-oct el 3D colgó el MacBook Pro de Mario (Intel UHD Graphics 630: «toda la
       pantalla parecía Matrix, tuve que apagar»). El mapa 3D se pintaba a 1080×1920 con bordes suavizados (antialias), cielo,
       inclinación de 65° (mucho horizonte = muchas teselas) y un fotograma detrás de otro sin parar: la gráfica integrada
       no descansaba nunca. MODO LIGERO, solo donde la gráfica es floja o no se sabe (graficaFloja()):
       · el mapa se pinta a 720×1280 (44 % de los píxeles) y se estira a 1080×1920; lo de encima (casco, letreros, km,
         fotos) lo sigue pintando video.js a tamaño completo, nítido;
       · sin antialias, sin cielo, inclinación de 55° (menos horizonte que cargar) y caché de teselas limitada;
       · RESPIRO_MS de descanso entre fotograma y fotograma (y entre vista y vista de la precarga);
       · si un fotograma tarda más de LENTO_MS, LENTOS_MAX veces seguidas, se para con aviso (antes de que se cuelgue). */
    LIGERO: { DENSIDAD: 4 / 3, PITCH: 55, RESPIRO_MS: 120, CACHE: 120, LENTO_MS: 6000, LENTOS_MAX: 4 },
    PESADO: "la gráfica de este ordenador va muy justa con el 3D: hazlo en plano o desde el móvil"
  };
  /* VIDEO-3D-LIGERO-1: ¿gráfica floja (o desconocida)? Con «&ligero=1» o «&ligero=0» en el enlace se fuerza (para probar).
     · Chrome/Edge/Firefox dicen el modelo: Intel (UHD, HD, Iris), por software (SwiftShader, llvmpipe) o móviles viejos → floja.
     · Safari en el Mac dice siempre «Apple GPU», sea un M1 o un Intel UHD 630: no se puede saber → ligero (lo seguro).
     · iPhone y iPad («Apple GPU» con pantalla táctil), Apple M, NVIDIA, AMD → completo. */
  function graficaFloja() {
    var m = location.search.match(/[?&]ligero=(0|1)(?:&|$)/);
    if (m) return m[1] === "1";
    var rend = "";
    try {
      var c = document.createElement("canvas"), gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return true;
      var dbg = gl.getExtension("WEBGL_debug_renderer_info");
      rend = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || "");
      var lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext(); // no dejar el contexto de la prueba abierto
    } catch (e) { return true; }
    var ordenadorMac = /Macintosh/.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1);
    console.log("[video3d] gráfica: " + (rend || "¿?") + (ordenadorMac ? " (Mac)" : ""));
    if (/Intel|SwiftShader|llvmpipe|Software|Mesa|Mali-[4T]|Adreno \(TM\) [2-5]\d\d/i.test(rend)) return true;
    if (/Apple M\d|NVIDIA|GeForce|Radeon|AMD/i.test(rend)) return false;
    if (/^Apple GPU$/i.test(rend.trim())) return ordenadorMac; // Safari: en el Mac no se sabe cuál es → ligero
    return true; // lo que no se conoce, ligero
  }
  var FUERA = { x: -99999, y: -99999 }; // lo que queda detrás de la cámara (no se pinta)

  function cargarScript(src) {
    return new Promise(function (ok, mal) {
      var s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = function () { ok(); }; s.onerror = function () { mal(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  function aLngLat(p) { // Mercator (0..1, como en video.js) → [lng, lat]
    return [p.x * 360 - 180, 360 / Math.PI * Math.atan(Math.exp((180 - p.y * 360) * Math.PI / 180)) - 90];
  }
  function dormir(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  /* Mapbox 2.15 no deja elegir la densidad de píxeles del mapa (usa la de la pantalla: 3 en el iPhone, 1 en muchos
     ordenadores). Para que el lienzo de Mapbox mida justo 1080×1920 se le hace creer, mientras dura el vídeo, que la
     pantalla es de 2×; al acabar se deja como estaba y se avisa al mapa de la página para que se vuelva a ajustar. */
  // Revisión 131.ª: si se cerraba y se volvía a abrir antes de acabar, la segunda guardaba como «de antes» la densidad falsa
  // de la primera y la página se quedaba a 2× para siempre. Ahora lo de verdad se guarda UNA vez y se cuenta quién lo usa.
  var dprOriginal = null, dprUsos = 0;
  function forzarDensidad(v) {
    try {
      if (dprUsos === 0) dprOriginal = { d: Object.getOwnPropertyDescriptor(window, "devicePixelRatio") };
      Object.defineProperty(window, "devicePixelRatio", { get: function () { return v; }, configurable: true });
      dprUsos++;
      var hecho = false;
      return function () {
        if (hecho) return; hecho = true;
        dprUsos = Math.max(0, dprUsos - 1);
        if (dprUsos > 0) return; // otro vídeo sigue usándolo
        try { if (dprOriginal && dprOriginal.d) Object.defineProperty(window, "devicePixelRatio", dprOriginal.d); else delete window.devicePixelRatio; } catch (e) {}
        dprOriginal = null;
        try { window.dispatchEvent(new Event("resize")); } catch (e) {}
      };
    } catch (e) { return function () {}; } // si el navegador no deja, Mapbox pinta a su densidad y se escala al copiarlo
  }

  function preparar(G, W, H, avisar) { // VIDEO-3D-ESPERA-1: avisar.preparando(n, de) y avisar.cancelado()
    avisar = avisar || {};
    if (!window.mapboxgl) return Promise.reject(new Error("sin Mapbox"));
    if (typeof mapboxgl.supported === "function" && !mapboxgl.supported()) return Promise.reject(new Error("sin WebGL"));
    if (G.corto) return Promise.reject(new Error("reel corto"));
    function cancelado() { return !!(avisar.cancelado && avisar.cancelado()); }
    if (cancelado()) return Promise.reject(new Error("cancelado"));
    var FPS = VIDEO.FPS, ANCHO = 540, ALTO = 960, esc = W / ANCHO;
    var LIG = avisar.ligero != null ? (avisar.ligero ? V3.LIGERO : null) : (graficaFloja() ? V3.LIGERO : null); // VIDEO-3D-LIGERO-1
    var PITCH = LIG ? LIG.PITCH : V3.PITCH, RESPIRO = LIG ? LIG.RESPIRO_MS : 0;
    console.log("[video3d] modo " + (LIG ? "LIGERO" : "completo"));
    var plano = G.camara(0); // la vista entera del principio (cFit, zFit)
    var vacio = { type: "FeatureCollection", features: [] };
    function linea(coords) { return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }; }
    var todo = G.fino.map(function (p) { return [p.lng, p.lat]; });

    // la dirección de la cámara en cada fotograma, calculada de antemano y suavizada
    function rumboEn(t) {
      var km = G.kmCabeza(t), v = Math.abs(G.kmCabeza(Math.min(G.DUR, t + 0.5)) - G.kmCabeza(Math.max(0, t - 0.5))); // km/s
      var a = G.enKm(km - Math.max(V3.ATRAS_KM, V3.ATRAS_S * v)), b = G.enKm(km + Math.max(V3.DELANTE_KM, V3.DELANTE_S * v));
      var dx = b.x - a.x, dy = b.y - a.y;
      return Math.hypot(dx, dy) < 1e-12 ? null : Math.atan2(dx, -dy) * 180 / Math.PI; // grados desde el norte (y de Mercator va al sur)
    }
    var N = Math.ceil(G.DUR * FPS) + 1, rumbos = new Array(N), prev = rumboEn(0) || 0;
    for (var i = 0; i < N; i++) {
      var rb = rumboEn(Math.min(i / FPS, G.DUR));
      if (rb == null) rb = prev;
      while (rb - prev > 180) rb -= 360; while (rb - prev < -180) rb += 360; // sin saltos de 359° a 1°
      rumbos[i] = prev = rb;
    }
    function media(v, r) { // media móvil de ±r fotogramas
      var out = new Array(v.length), sum = [0];
      for (var k = 0; k < v.length; k++) sum.push(sum[k] + v[k]);
      for (var j = 0; j < v.length; j++) { var a = Math.max(0, j - r), b = Math.min(v.length - 1, j + r); out[j] = (sum[b + 1] - sum[a]) / (b - a + 1); }
      return out;
    }
    var R = Math.max(1, Math.round(V3.SUAVE_S * FPS));
    rumbos = media(media(rumbos, R), R);
    function rumbo(t) { var r = rumbos[Math.max(0, Math.min(N - 1, Math.round(t * FPS)))]; r = ((r % 360) + 540) % 360 - 180; return r; }

    // 0 = la vista plana de siempre (desde arriba), 1 = detrás del casco en 3D
    function mezcla(tr, t) {
      if (tr.tipo === "zoom") return tramo(t, tr.a, tr.b);
      if (tr.tipo === "alejar") return 1 - tramo(t, tr.a, tr.b);
      if (tr.tipo === "tarjeta" || tr.tipo === "dibujo" || tr.tipo === "parada" || tr.tipo === "puerto" || (tr.tipo === "foto" && tr.km != null)) return 1; // VIDEO-PUERTOS-ARRIBA-1
      return 0;
    }
    function camara(t) {
      var tr = G.tramoEn(t), m = mezcla(tr, t), km = G.kmCabeza(t), cab = G.enKm(km);
      // al acercarse y al alejarse, el rumbo de llegada (o de salida) fijo: que el giro no salte de +180° a −180° a medias
      var rb = tr.tipo === "zoom" ? rumbo(tr.b) : tr.tipo === "alejar" ? rumbo(tr.a) : rumbo(t);
      var z3 = G.zDet + V3.ZOOM_MAS + DESTACAR.ZOOM * G.cercania(km); // VIDEO-DESTACAR-1: más cerca en los tramos, como en 2D
      return {
        c: { x: plano.c.x + (cab.x - plano.c.x) * m, y: plano.c.y + (cab.y - plano.c.y) * m },
        zoom: plano.z + (z3 - plano.z) * m,
        pitch: PITCH * m * m, // se inclina tarde al acercarse (y pronto al alejarse): de lejos no hace falta cargar el horizonte
        bearing: rb * m, pad: V3.PAD * m
      };
    }
    function hecho(km) { // lo recorrido: los puntos hasta el casco y el casco
      if (km <= 0) return vacio;
      var n = 1; while (n < G.acum.length && G.acum[n] <= km) n++;
      var c = todo.slice(0, n); c.push(aLngLat(G.enKm(km)));
      return linea(c);
    }
    function destacado(km) { // VIDEO-DESTACAR-1: lo ya recorrido de cada tramo, en amarillo
      var fs = [];
      G.dest.forEach(function (d) {
        if (km <= d.a) return;
        var hasta = Math.min(km, d.b), c = [aLngLat(G.enKm(d.a))];
        for (var k = 1; k < G.acum.length; k++) { if (G.acum[k] <= d.a) continue; if (G.acum[k] >= hasta) break; c.push(todo[k]); }
        c.push(aLngLat(G.enKm(hasta)));
        fs.push(linea(c));
      });
      return { type: "FeatureCollection", features: fs };
    }

    var caja = document.createElement("div");
    caja.style.cssText = "position:fixed;left:-20000px;top:0;width:" + ANCHO + "px;height:" + ALTO + "px;pointer-events:none";
    document.body.appendChild(caja);
    var devolver = forzarDensidad(LIG ? LIG.DENSIDAD : esc), map = null; // VIDEO-3D-LIGERO-1: ligero, 720×1280
    function limpiar() { try { if (map) map.remove(); } catch (e) {} map = null; caja.remove(); devolver(); devolver = function () {}; }

    // Revisión 131.ª: con el tope de 20 s, si el mapa deja de responder (red caída, una tesela atascada o la gráfica colgada,
    // como en el MacBook Intel) el vídeo podía quedarse «montando» horas. Ahora se corta: gráfica perdida → error al momento;
    // 3 esperas agotadas SEGUIDAS → error; y cerrar la capa corta también la espera en curso (mira cada 250 ms).
    var graficaPerdida = false, agotadasSeguidas = 0;
    function esperar(ms) { // a que Mapbox acabe de pintar lo pedido (teselas, relieve, línea) o, como mucho, ms
      if (!map) return Promise.reject(new Error("el mapa 3D se ha cerrado"));
      if (graficaPerdida) return Promise.reject(new Error(V3.SIN_GRAFICA));
      if (cancelado()) return Promise.reject(new Error("cancelado"));
      return new Promise(function (ok, mal) {
        var listo = false, to = null, mira = null;
        function fin(porTiempo, error) {
          if (listo) return; listo = true; clearTimeout(to); clearInterval(mira); if (map) map.off("idle", alIdle);
          if (error) { mal(error); return; }
          if (porTiempo) { lentos++; agotadasSeguidas++; } else agotadasSeguidas = 0;
          if (agotadasSeguidas >= V3.AGOTADAS_MAX) { mal(new Error(V3.NO_RESPONDE)); return; }
          ok();
        }
        function alIdle() { fin(false); }
        map.on("idle", alIdle);
        to = setTimeout(function () { fin(true); }, ms);
        mira = setInterval(function () {
          if (cancelado()) fin(false, new Error("cancelado"));
          else if (graficaPerdida) fin(false, new Error(V3.SIN_GRAFICA));
        }, 250);
        map.triggerRepaint();
      });
    }
    var lentos = 0, ultCam = "", ultKm = "", camPos = null, camF = [0, 0, -1];
    function ponerFotograma(t, ms) { // ms: lo que se espera a que se pinte (por defecto ESPERA_MS)
      var cam = camara(t), km = G.kmCabeza(t), cambia = false;
      var clave = [cam.c.x.toFixed(9), cam.c.y.toFixed(9), cam.zoom.toFixed(4), cam.pitch.toFixed(2), cam.bearing.toFixed(2), cam.pad.toFixed(1)].join();
      if (clave !== ultCam) {
        ultCam = clave; cambia = true;
        map.jumpTo({ center: aLngLat(cam.c), zoom: cam.zoom, pitch: cam.pitch, bearing: cam.bearing, padding: { top: cam.pad, bottom: 0, left: 0, right: 0 } });
        var fc = map.getFreeCameraOptions(), b = map.getBearing() * Math.PI / 180, p = map.getPitch() * Math.PI / 180;
        camPos = fc.position || null; camF = [Math.sin(p) * Math.sin(b), -Math.sin(p) * Math.cos(b), -Math.cos(p)];
      }
      var kk = km.toFixed(4);
      if (kk !== ultKm) {
        ultKm = kk; cambia = true;
        map.getSource("mc-hecho").setData(hecho(km));
        if (G.dest.length) map.getSource("mc-dest").setData(destacado(km));
      }
      return cambia ? esperar(ms || V3.ESPERA_MS) : Promise.resolve();
    }
    // Para video.js: dónde cae en el lienzo (1080×1920) un punto Mercator, con el relieve; lo de detrás de la cámara, fuera
    function proy(q) {
      if (camPos) {
        var d = (q.x - camPos.x) * camF[0] + (q.y - camPos.y) * camF[1] + (0 - camPos.z) * camF[2];
        if (!(d > 0)) return FUERA;
      }
      var s = map.project(aLngLat(q));
      return { x: s.x * esc, y: s.y * esc };
    }
    function pintar(ctx) { ctx.drawImage(map.getCanvas(), 0, 0, W, H); }

    // VIDEO-3D-ESPERA-1: la ruta entera, de PRECARGA_PASO_S en PRECARGA_PASO_S segundos de vídeo, con la cámara de verdad,
    // esperando a que cada vista esté cargada. Así, al grabar, el mapa y el relieve ya están en el navegador.
    function precargar() {
      var ts = [];
      for (var t = 0; t < G.DUR; t += V3.PRECARGA_PASO_S) ts.push(t);
      ts.push(G.DUR);
      var k = 0, t0 = performance.now(), lentosAntes = lentos;
      function sig() {
        if (!map) return Promise.reject(new Error("el mapa 3D se ha cerrado"));
        if (cancelado()) { limpiar(); return Promise.reject(new Error("cancelado")); }
        if (k >= ts.length) {
          console.log("[video3d] precarga: " + ts.length + " vistas en " + Math.round((performance.now() - t0) / 1000) + " s; sin acabar: " + (lentos - lentosAntes));
          ultCam = ""; ultKm = ""; // que el primer fotograma de la grabación vuelva a poner la cámara
          return Promise.resolve();
        }
        var cam = camara(ts[k]);
        map.jumpTo({ center: aLngLat(cam.c), zoom: cam.zoom, pitch: cam.pitch, bearing: cam.bearing, padding: { top: cam.pad, bottom: 0, left: 0, right: 0 } });
        return esperar(V3.PRECARGA_MS).then(function () { return RESPIRO ? dormir(RESPIRO) : null; }).then(function () { // VIDEO-3D-LIGERO-1
          k++;
          if (avisar.preparando) avisar.preparando(k, ts.length);
          return sig();
        });
      }
      return sig();
    }

    function elegirCodec() {
      if (!window.VideoEncoder || !window.VideoFrame || !window.Mp4Muxer) return Promise.resolve(null);
      var k = 0;
      function sig() {
        if (k >= V3.CODECS.length) return Promise.resolve(null);
        var c = V3.CODECS[k++];
        return VideoEncoder.isConfigSupported({ codec: c, width: W, height: H, bitrate: V3.BITRATE, framerate: FPS })
          .then(function (s) { return s && s.supported ? c : sig(); }, sig);
      }
      return sig();
    }

    function grabar(cv, cuadro, avisar) {
      var total = Math.ceil(G.DUR * FPS), t0 = performance.now();
      function cancelado() { return avisar.cancelado && avisar.cancelado(); }
      var lentosSeg = 0; // VIDEO-3D-LIGERO-1: fotogramas muy lentos seguidos (la gráfica no da más) → se para con aviso
      function fotograma(i) {
        var t = Math.min(i / FPS, G.DUR), a = performance.now();
        return ponerFotograma(t).then(function () {
          if (LIG) {
            if (performance.now() - a > LIG.LENTO_MS) { if (++lentosSeg >= LIG.LENTOS_MAX) throw new Error(V3.PESADO); } else lentosSeg = 0;
          }
          cuadro(t); return t;
        });
      }
      var fin = function (r) {
        console.log("[video3d] " + (total + 1) + " fotogramas en " + Math.round((performance.now() - t0) / 1000) + " s; sin acabar de pintar: " + lentos);
        limpiar(); return r;
      };
      return Promise.resolve().then(function () { return grabarCodec(codecElegido); }).then(fin, function (e) { limpiar(); console.warn("[video3d] " + ((e && e.stack) || e)); throw e; });

      // WebCodecs: cada fotograma con su hora exacta (i/30 s), tarde lo que tarde en pintarse
      function grabarCodec(codec) {
        var muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: "avc", width: W, height: H, frameRate: FPS }, fastStart: "in-memory" });
        var fallo = null;
        var enc = new VideoEncoder({ output: function (ch, meta) { muxer.addVideoChunk(ch, meta); }, error: function (e) { fallo = e; } });
        enc.configure({ codec: codec, width: W, height: H, bitrate: V3.BITRATE, framerate: FPS, avc: { format: "avc" } });
        console.log("[video3d] WebCodecs " + codec);
        var i = 0, primero = true;
        function paso() {
          if (cancelado()) { try { enc.close(); } catch (e) {} throw new Error("cancelado"); }
          if (fallo) throw fallo;
          return fotograma(i).then(function (t) {
            if (primero) { primero = false; if (avisar.lienzo) avisar.lienzo(cv); }
            var fr = new VideoFrame(cv, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
            enc.encode(fr, { keyFrame: i % (FPS * 2) === 0 }); fr.close();
            if (avisar.progreso) avisar.progreso(t, G.DUR);
            if (i % (FPS * 5) === 0) console.log("[video3d] " + Math.round(t) + " s de vídeo · " + Math.round((performance.now() - t0) / 1000) + " s de reloj · sin acabar de pintar: " + lentos);
            i++;
            if (i > total) return;
            return libre().then(paso);
          });
        }
        function libre() { // deja respirar a la página (el aviso de progreso) y no amontona fotogramas en el codificador
          return dormir(RESPIRO).then(function () { // VIDEO-3D-LIGERO-1: RESPIRO en ligero, también para la gráfica
            return enc.encodeQueueSize > 4 ? dormir(15).then(libre) : null; });
        }
        return paso().catch(function (e) { try { if (enc.state !== "closed") enc.close(); } catch (x) {} throw e; }) // revisión 131.ª: no dejar el codificador abierto
          .then(function () { return enc.flush(); }).then(function () {
          if (fallo) throw fallo;
          enc.close(); muxer.finalize();
          return { blob: new Blob([muxer.target.buffer], { type: "video/mp4" }), ext: "mp4", segundos: Math.round(G.DUR) };
        });
      }
    }

    var codecElegido = null;
    var muxerListo = window.VideoEncoder && !window.Mp4Muxer ? cargarScript(V3.MUXER).catch(function () {}) : Promise.resolve();
    return muxerListo.then(elegirCodec).then(function (codec) {
      if (!codec) { limpiar(); throw new Error("este navegador no graba H.264 con WebCodecs"); }
      codecElegido = codec;
      return new Promise(function (ok, mal) {
        if (cancelado()) { limpiar(); mal(new Error("cancelado")); return; } // revisión 131.ª: cerrado mientras cargaban las fotos
        var tiempo = setTimeout(function () { limpiar(); mal(new Error("el mapa 3D no carga")); }, V3.ARRANQUE_MS);
        try {
          mapboxgl.accessToken = MAPBOX_TOKEN;
          map = new mapboxgl.Map({
            container: caja, style: "mapbox://styles/mapbox/" + VIDEO.ESTILO, // MAPA-SATELITE-1 también vale aquí
            center: aLngLat(plano.c), zoom: plano.z, pitch: 0, bearing: 0,
            interactive: false, attributionControl: false, preserveDrawingBuffer: true, fadeDuration: 0, trackResize: false,
            antialias: !LIG, renderWorldCopies: false, // VIDEO-3D-LIGERO-1: sin suavizado de bordes en ligero
            maxTileCacheSize: LIG ? LIG.CACHE : null
          });
        } catch (e) { clearTimeout(tiempo); limpiar(); mal(e); return; }
        map.on("error", function (e) { console.warn("[video3d] mapa:", e && e.error ? e.error.message || e.error : e); });
        map.on("webglcontextlost", function () { graficaPerdida = true; console.warn("[video3d] la tarjeta gráfica ha perdido el mapa"); }); // revisión 131.ª
        map.once("load", function () {
          try {
            map.addSource("mc-dem", { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 });
            map.setTerrain({ source: "mc-dem", exaggeration: V3.EXAGERA });
            // VIDEO-3D-LIGERO-1: en ligero, el cielo en degradado (más barato que la atmósfera); que nunca quede hueco transparente
            map.addLayer({ id: "mc-cielo", type: "sky", paint: LIG ? { "sky-type": "gradient", "sky-gradient": ["interpolate", ["linear"], ["sky-radial-progress"], 0.8, "#8ec5ff", 1, "#dcecff"] }
              : { "sky-type": "atmosphere", "sky-atmosphere-sun": [0, 75], "sky-atmosphere-sun-intensity": 12 } });
            map.addSource("mc-ruta", { type: "geojson", data: linea(todo) });
            map.addSource("mc-hecho", { type: "geojson", data: vacio });
            map.addSource("mc-dest", { type: "geojson", data: vacio });
            var redondo = { "line-join": "round", "line-cap": "round" };
            map.addLayer({ id: "mc-ruta", type: "line", source: "mc-ruta", layout: redondo, paint: { "line-color": "#2b2b2b", "line-opacity": 0.55, "line-width": 4.5 } });
            map.addLayer({ id: "mc-hecho-borde", type: "line", source: "mc-hecho", layout: redondo, paint: { "line-color": "#ffffff", "line-width": 9 } });
            map.addLayer({ id: "mc-hecho", type: "line", source: "mc-hecho", layout: redondo, paint: { "line-color": "#FF7A1A", "line-width": 5.5 } });
            map.addLayer({ id: "mc-dest-borde", type: "line", source: "mc-dest", layout: redondo, paint: { "line-color": "#ffffff", "line-width": 13 } });
            map.addLayer({ id: "mc-dest", type: "line", source: "mc-dest", layout: redondo, paint: { "line-color": "#FFC400", "line-width": 8 } });
          } catch (e) { clearTimeout(tiempo); limpiar(); mal(e); return; }
          var lentosAntes0 = lentos;
          ponerFotograma(0, V3.ARRANQUE_MS - 5000).then(function () { // VIDEO-3D-ESPERA-1: una sola espera al arrancar (antes 2 s + 20 s)
            if (!map) return; // ya se rindió por tiempo (y se avisó)
            clearTimeout(tiempo);
            if (lentos > lentosAntes0) throw new Error("el mapa 3D no carga"); // revisión 131.ª: la primera vista no llegó a pintarse
            return precargar();
          }).then(function () {
            if (!map) return;
            console.log("[video3d] mapa listo, lienzo " + map.getCanvas().width + "×" + map.getCanvas().height + ", " + N + " fotogramas");
            ok({ proy: proy, pintar: pintar, grabar: grabar, limpiar: limpiar });
          }).catch(function (e) { clearTimeout(tiempo); limpiar(); mal(e); }); // VIDEO-3D-ESPERA-1: cancelado o fallo en el arranque o la precarga
        });
      });
    });
  }

  window.Video3D = { preparar: preparar, V3: V3, graficaFloja: graficaFloja };
})();
