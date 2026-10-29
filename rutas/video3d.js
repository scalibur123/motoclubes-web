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
   Sin VideoEncoder, MediaRecorder como hoy, parando la grabación mientras el mapa pinta (ver `grabarMR`).
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
    DELANTE_S: 0.6, DELANTE_KM: 2, ATRAS_S: 0.25, ATRAS_KM: 0.5,
    SUAVE_S: 0.5,     // …y suavizada en el tiempo (±0,5 s, dos pasadas) para que no dé tirones
    ESPERA_MS: 2000,  // lo más que se espera a que Mapbox acabe un fotograma (luego se graba lo que haya)
    ARRANQUE_MS: 25000, // lo más que se espera a que cargue el mapa al principio (si no, el vídeo de siempre)
    MUXER: "https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.js", // global Mp4Muxer
    CODECS: ["avc1.640028", "avc1.4d0028", "avc1.42e028"], // H.264 (High, Main, Baseline · nivel 4: 1080×1920 cabe)
    BITRATE: 8000000
  };
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
  function forzarDensidad(v) {
    try {
      var antes = Object.getOwnPropertyDescriptor(window, "devicePixelRatio");
      Object.defineProperty(window, "devicePixelRatio", { get: function () { return v; }, configurable: true });
      return function () {
        try { if (antes) Object.defineProperty(window, "devicePixelRatio", antes); else delete window.devicePixelRatio; } catch (e) {}
        try { window.dispatchEvent(new Event("resize")); } catch (e) {}
      };
    } catch (e) { return function () {}; } // si el navegador no deja, Mapbox pinta a su densidad y se escala al copiarlo
  }

  function preparar(G, W, H) {
    if (!window.mapboxgl) return Promise.reject(new Error("sin Mapbox"));
    if (typeof mapboxgl.supported === "function" && !mapboxgl.supported()) return Promise.reject(new Error("sin WebGL"));
    if (G.corto) return Promise.reject(new Error("reel corto"));
    var FPS = VIDEO.FPS, ANCHO = 540, ALTO = 960, esc = W / ANCHO;
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
      if (tr.tipo === "tarjeta" || tr.tipo === "dibujo" || tr.tipo === "parada" || (tr.tipo === "foto" && tr.km != null)) return 1;
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
        pitch: V3.PITCH * m * m, // se inclina tarde al acercarse (y pronto al alejarse): de lejos no hace falta cargar el horizonte
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
    var devolver = forzarDensidad(esc), map = null;
    function limpiar() { try { if (map) map.remove(); } catch (e) {} map = null; caja.remove(); devolver(); devolver = function () {}; }

    function esperar(ms) { // a que Mapbox acabe de pintar lo pedido (teselas, relieve, línea) o, como mucho, ms
      return new Promise(function (ok) {
        var listo = false, to = null;
        function fin(porTiempo) { if (listo) return; listo = true; clearTimeout(to); if (map) map.off("idle", alIdle); if (porTiempo) lentos++; ok(); }
        function alIdle() { fin(false); }
        map.on("idle", alIdle);
        to = setTimeout(function () { fin(true); }, ms);
        map.triggerRepaint();
      });
    }
    var lentos = 0, ultCam = "", ultKm = "", camPos = null, camF = [0, 0, -1];
    function ponerFotograma(t) {
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
      return cambia ? esperar(V3.ESPERA_MS) : Promise.resolve();
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
      function fotograma(i) { var t = Math.min(i / FPS, G.DUR); return ponerFotograma(t).then(function () { cuadro(t); return t; }); }
      var fin = function (r) {
        console.log("[video3d] " + (total + 1) + " fotogramas en " + Math.round((performance.now() - t0) / 1000) + " s; sin acabar de pintar: " + lentos);
        limpiar(); return r;
      };
      return elegirCodec().then(function (codec) {
        if (codec) return grabarCodec(codec);
        console.log("[video3d] sin VideoEncoder H.264: MediaRecorder");
        return grabarMR();
      }).then(fin, function (e) { limpiar(); console.warn("[video3d] " + ((e && e.stack) || e)); throw e; });

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
          return dormir(0).then(function () { return enc.encodeQueueSize > 4 ? dormir(15).then(libre) : null; });
        }
        return paso().then(function () { return enc.flush(); }).then(function () {
          if (fallo) throw fallo;
          enc.close(); muxer.finalize();
          return { blob: new Blob([muxer.target.buffer], { type: "video/mp4" }), ext: "mp4", segundos: Math.round(G.DUR) };
        });
      }

      // Sin WebCodecs: MediaRecorder como el vídeo de siempre, pero EN PAUSA mientras Mapbox pinta cada fotograma; solo
      // graba 1/30 s con el fotograma ya pintado. Así el tiempo de espera no entra en el vídeo (en Chromium probado: dura lo
      // que debe; en otros navegadores, sin probar). Va más lento que WebCodecs.
      function grabarMR() {
        var tipo = tipoGrabacion();
        if (!tipo || !cv.captureStream) throw new Error("Este navegador no sabe grabar vídeo. Prueba con Safari.");
        var flujo = cv.captureStream(0), pista = flujo.getVideoTracks()[0];
        if (!pista || typeof pista.requestFrame !== "function") { flujo = cv.captureStream(FPS); pista = null; }
        var rec = new MediaRecorder(flujo, { mimeType: tipo, videoBitsPerSecond: V3.BITRATE });
        var trozos = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) trozos.push(e.data); };
        var hecho = new Promise(function (ok) { rec.onstop = function () { ok(new Blob(trozos, { type: tipo.split(";")[0] })); }; });
        var i = 0, empezado = false, dt = 1000 / FPS;
        function paso() {
          if (cancelado()) { try { rec.stop(); } catch (e) {} throw new Error("cancelado"); }
          if (empezado && rec.state === "recording") rec.pause();
          return fotograma(i).then(function (t) {
            if (!empezado) { empezado = true; if (avisar.lienzo) avisar.lienzo(cv); rec.start(250); }
            else if (rec.state === "paused") rec.resume();
            if (pista) pista.requestFrame();
            if (avisar.progreso) avisar.progreso(t, G.DUR);
            i++;
            return dormir(dt).then(function () { if (i > total) return; return paso(); });
          });
        }
        return paso().then(function () { return dormir(200); }).then(function () { rec.stop(); return hecho; }).then(function (blob) {
          return { blob: blob, ext: tipo.indexOf("mp4") >= 0 ? "mp4" : "webm", segundos: Math.round(G.DUR) };
        });
      }
    }

    var muxerListo = window.VideoEncoder && !window.Mp4Muxer ? cargarScript(V3.MUXER).catch(function () {}) : Promise.resolve();
    return muxerListo.then(function () {
      return new Promise(function (ok, mal) {
        var tiempo = setTimeout(function () { limpiar(); mal(new Error("el mapa 3D no carga")); }, V3.ARRANQUE_MS);
        try {
          mapboxgl.accessToken = MAPBOX_TOKEN;
          map = new mapboxgl.Map({
            container: caja, style: "mapbox://styles/mapbox/" + VIDEO.ESTILO, // MAPA-SATELITE-1 también vale aquí
            center: aLngLat(plano.c), zoom: plano.z, pitch: 0, bearing: 0,
            interactive: false, attributionControl: false, preserveDrawingBuffer: true, fadeDuration: 0, antialias: true, trackResize: false
          });
        } catch (e) { clearTimeout(tiempo); limpiar(); mal(e); return; }
        map.on("error", function (e) { console.warn("[video3d] mapa:", e && e.error ? e.error.message || e.error : e); });
        map.once("load", function () {
          try {
            map.addSource("mc-dem", { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 });
            map.setTerrain({ source: "mc-dem", exaggeration: V3.EXAGERA });
            map.addLayer({ id: "mc-cielo", type: "sky", paint: { "sky-type": "atmosphere", "sky-atmosphere-sun": [0, 75], "sky-atmosphere-sun-intensity": 12 } });
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
          ponerFotograma(0).then(function () { return map && esperar(V3.ARRANQUE_MS - 5000); }).then(function () {
            if (!map) return; // ya se rindió por tiempo (y se avisó)
            clearTimeout(tiempo);
            console.log("[video3d] mapa listo, lienzo " + map.getCanvas().width + "×" + map.getCanvas().height + ", " + N + " fotogramas");
            ok({ proy: proy, pintar: pintar, grabar: grabar, limpiar: limpiar });
          });
        });
      });
    });
  }

  window.Video3D = { preparar: preparar, V3: V3 };
})();
