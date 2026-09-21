/* visita.js · MOTOCLUBes · WEB-ANALITICA-1 (21-sep-2026)
   Medición propia de visitas. SIN cookies, SIN guardar nada en el navegador y SIN IPs:
   manda página, de dónde viene, tipo de dispositivo e idioma al entrar, y los segundos
   que la página ha estado VISIBLE al salir. País y ciudad los deduce el servidor y no
   guarda la IP. Política: /legal/cookies/
   Excepción única: ?yo en la URL marca ESTE navegador para no contarlo (lo usa el dueño
   de la web para que sus pruebas no inflen las cifras). ?yo=no lo desmarca. */
(function () {
  try {
    var U = 'https://yxmirhpwmdmaxynlshdx.supabase.co/functions/v1/web-visita';
    var q = new URLSearchParams(location.search);
    if (q.has('yo')) {
      if (q.get('yo') === 'no') localStorage.removeItem('mc_no_contar');
      else { localStorage.setItem('mc_no_contar', '1'); return; }
    }
    if (localStorage.getItem('mc_no_contar')) return;
  } catch (e) { /* sin localStorage: se cuenta normal */ }

  try {
    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
      });
    var ua = navigator.userAgent || '';
    var tactil = (navigator.maxTouchPoints || 0) > 1;
    var d = /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && tactil) || (/Android/.test(ua) && !/Mobile/.test(ua))
      ? 'tablet' : (/Mobi|iPhone|iPod|Android/i.test(ua) ? 'movil' : 'ordenador');
    var seg = location.pathname.split('/')[1];
    var i = ['en', 'ca', 'fr', 'pt'].indexOf(seg) >= 0 ? seg : 'es';
    var o = '';
    try { o = new URLSearchParams(location.search).get('o') || ''; } catch (e) {}

    var enviar = function (datos) {
      var cuerpo = JSON.stringify(datos);
      try {
        if (navigator.sendBeacon && navigator.sendBeacon(U, new Blob([cuerpo], { type: 'text/plain' }))) return;
      } catch (e) {}
      try { fetch(U, { method: 'POST', body: cuerpo, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
    };

    enviar({ t: 'v', id: id, p: location.pathname, r: document.referrer || '', o: o, d: d, i: i });

    // Tiempo VISIBLE: solo corre mientras la pestaña se ve. Se manda cada vez que se oculta
    // (el servidor se queda con el mayor), porque en el móvil no hay garantía de otro aviso.
    var visible = 0, desde = document.visibilityState === 'visible' ? Date.now() : 0;
    var parar = function () {
      if (desde) { visible += Date.now() - desde; desde = 0; }
      enviar({ t: 's', id: id, s: Math.round(visible / 1000) });
    };
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') parar();
      else if (!desde) desde = Date.now();
    });
    window.addEventListener('pagehide', function () { if (desde) parar(); });
  } catch (e) { /* la medición nunca puede romper la página */ }
})();
