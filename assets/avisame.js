/* avisame.js · MOTOCLUBes · WEB-ANALITICA-1 (21-sep-2026)
   La caja «Avísame»: manda el correo a la función web-aviso, que envía un correo para
   confirmar. Los textos viven en el HTML de cada idioma (data-*), no aquí. */
(function () {
  // WEB-ORIGEN-1 (109.ª, 15-oct-2026, Mario: «unos sabemos que vienen por Instagram, los otros no»). Si el enlace no lleva
  // ?o=, se mira la web de la que viene (document.referrer), como el contador de visitas. Sin cookies ni nada guardado en
  // el navegador. Sin rastro → «directo» (dirección escrita, WhatsApp, apps que no lo pasan); otra página nuestra → «web».
  function origenDe() {
    var r = '';
    try { r = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (x) {}
    if (!r) return 'directo';
    if (/(^|\.)motoclubes\.es$/.test(r)) return 'web';
    var h = r.replace(/^(www|m|l|lm|mobile)\./, '');
    var t = [[/instagram\.com$/, 'instagram'], [/(facebook\.com|fb\.com|fb\.me)$/, 'facebook'], [/(linkedin\.com|lnkd\.in)$/, 'linkedin'],
      [/(^|\.)google\./, 'google'], [/bing\.com$/, 'bing'], [/duckduckgo\.com$/, 'duckduckgo'], [/bmwmotos\./, 'bmwmotos'],
      [/tiktok\.com$/, 'tiktok'], [/(youtube\.com|youtu\.be)$/, 'youtube'], [/(^t\.co$|x\.com$|twitter\.com$)/, 'x'],
      [/(whatsapp\.com|wa\.me)$/, 'whatsapp']];
    for (var i = 0; i < t.length; i++) if (t[i][0].test(h)) return t[i][1];
    return h.slice(0, 40);
  }
  var f = document.getElementById('avisame-form');
  if (!f) return;
  var U = 'https://yxmirhpwmdmaxynlshdx.supabase.co/functions/v1/web-aviso';
  var msg = f.querySelector('.avisame-msg');
  var probar = f.querySelector('input[name=probar]');
  var plats = f.querySelector('.avisame-plataformas');
  probar.addEventListener('change', function () { plats.classList.toggle('visible', probar.checked); });
  var decir = function (clave, bien) {
    msg.textContent = f.getAttribute('data-' + clave) || '';
    msg.className = 'avisame-msg ' + (bien ? 'ok' : 'error');
  };
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = f.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return decir('err-email', false);
    if (!f.acepta.checked) return decir('err-acepta', false);
    var plat = f.querySelector('input[name=plat]:checked');
    var o = '';
    try { o = new URLSearchParams(location.search).get('o') || ''; } catch (x) {}
    if (!o) o = origenDe(); // WEB-ORIGEN-1 (109.ª): sin etiqueta en el enlace, de qué web viene
    var boton = f.querySelector('button');
    boton.disabled = true;
    fetch(U, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        t: 'alta', email: email, i: document.documentElement.lang || 'es', o: o,
        probar: probar.checked, plat: probar.checked && plat ? plat.value : null,
        acepta: true, web: f.web.value
      })
    }).then(function (r) {
      if (r.ok) { decir('ok', true); f.email.value = ''; }
      else if (r.status === 400) decir('err-email', false);
      else decir('err', false);
    }).catch(function () { decir('err', false); })
      .then(function () { boton.disabled = false; });
  });
})();
