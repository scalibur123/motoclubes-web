/* rutas/video.js · 🆕 VIDEO-RUTA-1 (25-sep-2026, 74.ª) — primera versión de SOCIAL-SALIDA-1 en la web.
   Mario: «si podemos construir algo para publicar en Instagram, que lo convierta en reel [...] que te pueda guardar un
   fichero [...] para darle publicidad a MOTOCLUBes y a las rutas que haga». Guion aprobado por él:
     0–2 s   nombre de la ruta y «807 km · 2 días» sobre el mapa, con el casco
     2–16 s  la línea se dibuja y el casco avanza; contador de km; aparecen puertos (con altura) y paradas
     16–19 s resumen: km, tiempo, desnivel, puertos, el más alto
     19–22 s cierre: casco, «MOTOCLUBes · La app que viaja contigo», motoclubes.es
   (tiempos en VIDEO; primera versión 15 s, alargada a 22 s a petición de Mario el mismo día)
   Vertical 1080×1920, sin música (se pone en Instagram, que tiene la música con licencia). Se graba el lienzo con MediaRecorder: MP4 en Safari.
   Fondo: UNA imagen estática de Mapbox (outdoors) por vídeo; el trazado se proyecta encima con la misma Mercator.
   Usa lo que ya tiene la página (index.html): esc, fmtMiles, kmAcum, aligerarTraza, tipoDe, MAPBOX_TOKEN.
   ⚠️ Mientras Mario lo revisa, el botón solo sale con ?video=1 en la dirección (lo vemos antes, dijo). */

// 🔄 25-sep, Mario tras verlo («una pasada»): «un poco más lento». El dibujo pasa de 8 a 14 s y el vídeo de 15 a 22 s.
// Todos los tiempos salen de aquí: si se vuelve a tocar el ritmo, solo se cambia este bloque.
var VIDEO = { W: 1080, H: 1920, FPS: 30, DUR: 22, T_DIBUJO: [2, 16], T_RESUMEN: [16, 19], T_CIERRE: 19 };

function mercX(lng) { return (lng + 180) / 360; }
function mercY(lat) {
  var s = Math.sin(lat * Math.PI / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}

/* Encuadre: el centro y el zoom (Mapbox, teselas de 512) que meten el trazado en la zona central del vídeo. */
function encuadreVideo(pts) {
  var x1 = 1, x2 = 0, y1 = 1, y2 = 0;
  pts.forEach(function (p) {
    var x = mercX(p.lng), y = mercY(p.lat);
    if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y;
  });
  var anchoUtil = 540 - 2 * 50, altoUtil = 960 - 260 - 250; // lógico (@2x → 1080×1920); arriba título, abajo contador
  var z = Math.min(Math.log2(anchoUtil / (512 * Math.max(x2 - x1, 1e-9))), Math.log2(altoUtil / (512 * Math.max(y2 - y1, 1e-9))));
  z = Math.max(1, Math.min(15, z));
  var escala = 512 * Math.pow(2, z);
  var cx = (x1 + x2) / 2;
  var cy = (y1 + y2) / 2 + ((260 - 250) / 2) / escala; // el trazado queda en el hueco entre título y contador
  var lng = cx * 360 - 180;
  var lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * cy))) * 180 / Math.PI;
  return {
    z: z, lng: lng, lat: lat,
    proy: function (p) { // a píxeles del lienzo 1080×1920
      return { x: ((mercX(p.lng) - cx) * escala + 270) * 2, y: ((mercY(p.lat) - cy) * escala + 480) * 2 };
    }
  };
}

function cargarImagen(src) {
  return new Promise(function (ok, mal) {
    var im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = function () { ok(im); };
    im.onerror = function () { mal(new Error("imagen")); };
    im.src = src;
  });
}

function tipoGrabacion() {
  var c = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  for (var i = 0; i < c.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(c[i])) return c[i];
  return "";
}

function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
function tramo(t, a, b) { return suave((t - a) / (b - a)); }

function textoSombra(ctx, txt, x, y, font, color, alineado) {
  ctx.font = font; ctx.textAlign = alineado || "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
  ctx.fillStyle = color; ctx.fillText(txt, x, y);
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}

function pildora(ctx, x, y, w, h, r, fondo) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fillStyle = fondo; ctx.fill();
}

/* r = la ruta de mc_ruta_publica · pts = trazado · paradas = paradasConKm(...) · puertos = puertosEnRuta(...) */
function hacerVideoRuta(r, pts, paradas, puertos, alTerminar) {
  var W = VIDEO.W, H = VIDEO.H;
  var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  var ctx = cv.getContext("2d");
  var fino = aligerarTraza(pts, 40);
  var acum = kmAcum(fino), total = acum[acum.length - 1] || 1;
  var kmRuta = r.km != null ? Number(r.km) : total;
  var enc = encuadreVideo(fino);
  var P = fino.map(enc.proy);
  var titulo = r.title || "Ruta en MOTOCLUBes";
  var dias = r.dias && r.dias > 1 ? r.dias + " días" : "1 día";
  var minutos = r.moving_time_minutes != null ? r.moving_time_minutes : r.duration_minutes;
  var conAlt = puertos.filter(function (p) { return p.ele != null; });
  var alto = conAlt.reduce(function (a, b) { return !a || b.ele > a.ele ? b : a; }, null);
  var etiquetados = conAlt.slice().sort(function (a, b) { return b.ele - a.ele; }).slice(0, 6);
  var paradasVideo = paradas.filter(function (p) { return !p.inicio && !p.fin && p.w.waypointType && p.w.waypointType !== "puerto"; });
  var url = "https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/" + enc.lng.toFixed(5) + "," + enc.lat.toFixed(5) + "," +
    enc.z.toFixed(3) + ",0/540x960@2x?access_token=" + MAPBOX_TOKEN + "&attribution=false&logo=false";

  return Promise.all([cargarImagen(url), cargarImagen("../img/helmet-256.png"), (document.fonts && document.fonts.ready) || Promise.resolve()])
    .then(function (res) {
      var fondo = res[0], casco = res[1];

      function cuadro(t) { // t en segundos
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(fondo, 0, 0, W, H);
        // velo para que se lea el texto
        var g = ctx.createLinearGradient(0, 0, 0, 520); g.addColorStop(0, "rgba(14,14,14,.82)"); g.addColorStop(1, "rgba(14,14,14,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, 520);
        var g2 = ctx.createLinearGradient(0, H - 560, 0, H); g2.addColorStop(0, "rgba(14,14,14,0)"); g2.addColorStop(1, "rgba(14,14,14,.88)");
        ctx.fillStyle = g2; ctx.fillRect(0, H - 560, W, 560);

        // trazado: de 2 a 10 s
        var f = tramo(t, VIDEO.T_DIBUJO[0], VIDEO.T_DIBUJO[1]);
        var kmHasta = f * total, n = 1;
        while (n < acum.length && acum[n] <= kmHasta) n++;
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        [[16, "#ffffff"], [9, "#7C3AED"]].forEach(function (capa) {
          ctx.beginPath(); ctx.lineWidth = capa[0]; ctx.strokeStyle = capa[1];
          for (var i = 0; i < Math.min(n, P.length); i++) { if (i) ctx.lineTo(P[i].x, P[i].y); else ctx.moveTo(P[i].x, P[i].y); }
          var cab = P[Math.min(n, P.length) - 1];
          if (n < P.length && n > 0) { // tramo a medias hasta la cabeza exacta
            var a = acum[n - 1], b = acum[n], u = b > a ? (kmHasta - a) / (b - a) : 0;
            cab = { x: P[n - 1].x + (P[n].x - P[n - 1].x) * u, y: P[n - 1].y + (P[n].y - P[n - 1].y) * u };
            ctx.lineTo(cab.x, cab.y);
          }
          ctx.stroke();
          cuadro.cabeza = cab;
        });

        // paradas y puertos, según los alcanza la línea
        var kmVisto = f * kmRuta;
        paradasVideo.forEach(function (p) {
          if (p.km > kmVisto + 0.01) return;
          var q = enc.proy(p.w), s = Math.min(1, (kmVisto - p.km) / (kmRuta * 0.03) + 0.35);
          ctx.globalAlpha = s;
          ctx.beginPath(); ctx.arc(q.x, q.y, 26, 0, 2 * Math.PI); ctx.fillStyle = p.t.c; ctx.fill();
          ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke();
          ctx.font = "28px 'Apple Color Emoji','Segoe UI Emoji',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(p.t.e, q.x, q.y + 1);
          ctx.globalAlpha = 1;
        });
        puertos.forEach(function (pu) {
          if (pu.km > kmVisto + 0.01) return;
          var q = enc.proy(pu), s = Math.min(1, (kmVisto - pu.km) / (kmRuta * 0.03) + 0.35);
          ctx.globalAlpha = s;
          ctx.beginPath(); ctx.arc(q.x, q.y, 30, 0, 2 * Math.PI); ctx.fillStyle = "#7C3AED"; ctx.fill();
          ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.stroke();
          ctx.font = "30px 'Apple Color Emoji','Segoe UI Emoji',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("🏔️", q.x, q.y + 1);
          if (etiquetados.indexOf(pu) >= 0) {
            var txt = pu.name + " · " + fmtMiles(pu.ele) + " m";
            ctx.font = "700 30px Manrope, system-ui, sans-serif";
            var w = ctx.measureText(txt).width + 32, x = Math.max(20, Math.min(W - w - 20, q.x - w / 2));
            pildora(ctx, x, q.y + 40, w, 50, 25, "rgba(255,255,255,.95)");
            ctx.fillStyle = "#111"; ctx.textAlign = "left"; ctx.fillText(txt, x + 16, q.y + 66);
          }
          ctx.globalAlpha = 1;
        });

        // casco en la cabeza de la línea (2–10 s) o en la salida antes
        var c = f > 0 ? cuadro.cabeza : P[0];
        if (c && t < VIDEO.T_DIBUJO[1] + 0.5) ctx.drawImage(casco, c.x - 44, c.y - 44, 88, 88);

        // título arriba
        var ta = tramo(t, 0, 0.8);
        ctx.globalAlpha = ta;
        textoSombra(ctx, titulo.length > 28 ? titulo.slice(0, 27) + "…" : titulo, W / 2, 170, "800 72px Manrope, system-ui, sans-serif", "#fff");
        textoSombra(ctx, fmtMiles(kmRuta) + " km · " + dias, W / 2, 260, "700 44px Manrope, system-ui, sans-serif", "#FF7A1A");
        ctx.globalAlpha = 1;

        // contador abajo (2–10 s)
        if (t >= VIDEO.T_DIBUJO[0] - 0.5 && t < VIDEO.T_DIBUJO[1] + 0.5) {
          textoSombra(ctx, "km " + fmtMiles(kmVisto), W / 2, H - 250, "800 96px Manrope, system-ui, sans-serif", "#fff");
          textoSombra(ctx, (puertos.filter(function (p) { return p.km <= kmVisto; }).length) + " puertos", W / 2, H - 160, "700 44px Manrope, system-ui, sans-serif", "rgba(255,255,255,.85)");
        }

        // resumen (10–13 s)
        var rs = tramo(t, VIDEO.T_RESUMEN[0], VIDEO.T_RESUMEN[0] + 0.6) * (1 - tramo(t, VIDEO.T_RESUMEN[1] - 0.4, VIDEO.T_RESUMEN[1] + 0.1));
        if (rs > 0) {
          ctx.globalAlpha = rs;
          pildora(ctx, 90, 620, W - 180, 760, 40, "rgba(14,14,14,.86)");
          var filas = [
            ["Distancia", fmtMiles(kmRuta) + " km"],
            ["Tiempo", minutos ? Math.floor(minutos / 60) + " h " + (Math.round(minutos % 60) ? Math.round(minutos % 60) + " min" : "") : "—"],
            ["Desnivel", r.elevation_gain_m != null ? fmtMiles(r.elevation_gain_m) + " m" : "—"],
            ["Puertos", String(puertos.length)],
            ["El más alto", alto ? fmtMiles(alto.ele) + " m" : "—"]
          ];
          filas.forEach(function (fl, i) {
            var y = 720 + i * 132;
            ctx.font = "700 40px Manrope, system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(255,255,255,.62)";
            ctx.fillText(fl[0], 150, y);
            ctx.font = "800 56px Manrope, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = i === 4 ? "#FF7A1A" : "#fff";
            ctx.fillText(fl[1], W - 150, y);
          });
          if (alto) { ctx.font = "600 34px Manrope, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,.62)"; ctx.fillText(alto.name, W - 150, 720 + 4 * 132 + 60); }
          ctx.globalAlpha = 1;
        }

        // cierre (13–15 s)
        var ci = tramo(t, VIDEO.T_CIERRE, VIDEO.T_CIERRE + 0.6);
        if (ci > 0) {
          ctx.globalAlpha = ci;
          ctx.fillStyle = "rgba(14,14,14,.92)"; ctx.fillRect(0, 0, W, H);
          ctx.drawImage(casco, W / 2 - 150, 620, 300, 300);
          textoSombra(ctx, "MOTOCLUBes", W / 2, 1010, "800 92px Manrope, system-ui, sans-serif", "#fff");
          textoSombra(ctx, "La app que viaja contigo", W / 2, 1100, "600 46px Manrope, system-ui, sans-serif", "rgba(255,255,255,.8)");
          textoSombra(ctx, "motoclubes.es", W / 2, 1210, "800 54px Manrope, system-ui, sans-serif", "#FF7A1A");
          ctx.globalAlpha = 1;
        }

        // atribución del mapa (obligatoria)
        ctx.font = "500 22px Manrope, system-ui, sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillText("© Mapbox © OpenStreetMap", W - 24, H - 24);
      }

      var tipo = tipoGrabacion();
      if (!tipo || !cv.captureStream) throw new Error("Este navegador no sabe grabar vídeo. Prueba con Safari.");
      var flujo = cv.captureStream(VIDEO.FPS);
      var rec = new MediaRecorder(flujo, { mimeType: tipo, videoBitsPerSecond: 8000000 });
      var trozos = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) trozos.push(e.data); };
      var hecho = new Promise(function (ok) { rec.onstop = function () { ok(new Blob(trozos, { type: tipo.split(";")[0] })); }; });
      var t0 = null;
      cuadro(0);
      rec.start(250);
      return new Promise(function (ok) {
        function paso(ahora) {
          if (t0 === null) t0 = ahora;
          var t = (ahora - t0) / 1000;
          cuadro(Math.min(t, VIDEO.DUR));
          if (alTerminar && alTerminar.progreso) alTerminar.progreso(Math.min(1, t / VIDEO.DUR), cv);
          if (t < VIDEO.DUR) requestAnimationFrame(paso);
          else { rec.stop(); ok(); }
        }
        requestAnimationFrame(paso);
      }).then(function () { return hecho; }).then(function (blob) {
        return { blob: blob, ext: tipo.indexOf("mp4") >= 0 ? "mp4" : "webm", lienzo: cv };
      });
    });
}
