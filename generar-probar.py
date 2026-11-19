#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WEB-MARKETING-1 · PROBAR-IDIOMAS-1 (155.ª, 19-nov-2026, Mario: «lo de probar tendrás que ponerlo en todos los idiomas»).
Genera /en/probar/, /ca/probar/, /fr/probar/, /pt/probar/ e /it/probar/ desde probar/index.html (la española), cadena a cadena,
como generar-idiomas.py con la portada. Cuando se toque la española, se vuelve a ejecutar: python3 generar-probar.py
La lógica del formulario NO cambia: solo los textos, el idioma que se manda (i) y el enlace que se comparte.
🔴 Traducciones de Claude, sin revisar por un nativo.
"""
import io, os, re

ES = io.open('probar/index.html', encoding='utf8').read()

# Las de toda la página. Las largas primero (una sola pasada, como generar-idiomas.py).
T = {
'en': {
 'La app GPS para moto, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'The motorcycle GPS app, made by riders. Try it before it hits the stores.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Ya somos casi 170 moteros probándola.': 'Almost 170 riders are already testing it.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Planifica rutas con curvas, puertos y gasolineras.': 'Plan routes with corners, mountain passes and fuel stations.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Navega con voz, en la pantalla de la moto y sin cobertura.': 'Navigate with voice, on the bike’s screen and with no signal.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Sal en grupo: todos en el mapa y hablando por la radio.': 'Ride as a group: everyone on the map and talking over the radio.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'SOS al grupo: 3 segundos en el mapa y tu grupo sabe dónde estás.': 'SOS to the group: 3 seconds on the map and your group knows where you are.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 '<title>Prueba MOTOCLUBes</title>': '<title>Try MOTOCLUBes</title>',
 'Vente a probar MOTOCLUBes, la app GPS para moto': 'Come and try MOTOCLUBes, the motorcycle GPS app',
 'Planifica, navega con voz y sal en grupo, con SOS al grupo. Apúntate y te mandamos la invitación para iPhone o Android.':
   'Plan, navigate with voice and ride as a group, with SOS to the group. Sign up and we’ll send you the invitation for iPhone or Android.',
 'Pásaselo a <b>tu grupo</b>': 'Share it with <b>your group</b>',
 'Con este enlace tus compañeros de ruta se apuntan en un minuto y les mandamos la invitación para instalar MOTOCLUBes, en iPhone o en Android.':
   'With this link your riding mates sign up in a minute and we send them the invitation to install MOTOCLUBes, on iPhone or Android.',
 '💬 Mandar por WhatsApp': '💬 Send on WhatsApp',
 'Compartir de otra forma': 'Share another way',
 'Cuantos más salgáis juntos, mejor se prueba la radio del grupo.': 'The more of you ride together, the better the group radio gets tested.',
 'Vente a probar <b>MOTOCLUBes</b>': 'Come and try <b>MOTOCLUBes</b>',
 'La app para moteros, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'The app for riders, made by riders. Try it before it hits the stores.',
 'Ya somos casi 170 moteros probándola en iPhone y Android.': 'Almost 170 riders are already testing it on iPhone and Android.',
 'Planifica tus rutas con curvas, puertos y gasolineras con el precio de hoy.': 'Plan your routes with corners, mountain passes and fuel stations with today’s price.',
 'Navega con voz por el casco, en la pantalla de la moto con CarPlay y Android Auto, y sin cobertura con el mapa descargado.':
   'Navigate with voice in your helmet, on the bike’s screen with CarPlay and Android Auto, and with no signal using the downloaded map.',
 'Sal en grupo: todos en el mapa y hablando por la radio del grupo con el intercomunicador que ya llevas.':
   'Ride as a group: everyone on the map and talking over the group radio with the intercom you already have.',
 'SOS al grupo: 3 segundos con el dedo en el mapa y todo tu grupo sabe dónde estás.': 'SOS to the group: hold your finger on the map for 3 seconds and your whole group knows where you are.',
 '¿Qué móvil tienes?': 'What phone do you have?',
 '>Tu correo<': '>Your email<',
 'He leído y acepto la': 'I have read and accept the',
 '>política de privacidad<': '>privacy policy<',
 'Quiero probarla': 'I want to try it',
 '¡Ya casi estás dentro!': 'You’re almost in!',
 'Mira tu correo y pulsa <b>«Confirmar mi correo»</b>.': 'Check your email and tap <b>“Confirm my email”</b>.',
 'En cuanto lo confirmes te damos de alta y te llega la invitación para instalarla.': 'As soon as you confirm it we sign you up and you get the invitation to install it.',
 '¿No te llega en unos minutos? Mira en <b>Spam</b> o en <b>Promociones</b>: a veces se esconde ahí.': 'Not there in a few minutes? Check <b>Spam</b> or <b>Promotions</b>: sometimes it hides there.',
 '¿Algún problema para instalarla? Escríbenos a': 'Any trouble installing it? Write to us at',
 'Abriendo la página de ': 'Opening the page of ',
 'Si no se abre, pulsa aquí': 'If it doesn’t open, tap here',
 '¡Vente a probar MOTOCLUBes! Es la app para salir en moto en grupo: todos en el mapa y hablando por el intercom del casco. Apúntate aquí y te llega un correo de MOTOCLUBes para confirmar (si no lo ves, mira en spam): ':
   'Come and try MOTOCLUBes! It’s the app for group motorcycle rides: everyone on the map and talking over the helmet intercom. Sign up here and you’ll get an email from MOTOCLUBes to confirm (if you can’t see it, check spam): ',
 '✅ Enlace copiado. Pégalo en tu grupo.': '✅ Link copied. Paste it in your group.',
 'Copiar el enlace': 'Copy the link',
 '<b></b> te invita a probar MOTOCLUBes': '<b></b> invites you to try MOTOCLUBes',
 'El Gmail de tu Play Store': 'The Gmail of your Play Store',
 'Google solo deja instalarla con esa cuenta. Lo ves en la app de Play Store, tocando tu foto arriba a la derecha.':
   'Google only lets you install it with that account. You’ll see it in the Play Store app by tapping your photo at the top right.',
 "'Tu correo'": "'Your email'",
 'Ahí te mandamos la invitación para instalarla con TestFlight, la app de Apple para probar apps antes de que salgan en la tienda.':
   'We’ll send you the invitation there to install it with TestFlight, Apple’s app for trying apps before they reach the store.',
 'tu@gmail.com': 'you@gmail.com', 'tu@correo.com': 'you@email.com',
 'Revisa el correo, parece que no está bien escrito.': 'Check the email, it doesn’t look right.',
 'Marca la casilla de privacidad para poder apuntarte.': 'Tick the privacy box so we can sign you up.',
 'Te escribimos a ese correo con el siguiente paso.': 'We’ll write to that email with the next step.',
 'Te llegará un enlace de Google Play. Ábrelo en tu móvil Android, en Chrome: el que tiene en Play Store el mismo Gmail que has puesto aquí.':
   'You’ll get a Google Play link. Open it on your Android phone, in Chrome: the one whose Play Store has the same Gmail you entered here.',
 'Al confirmar te enseñamos cómo instalarla en tu iPhone con TestFlight, y te lo mandamos también por correo.':
   'When you confirm, we’ll show you how to install it on your iPhone with TestFlight, and we’ll email it to you too.',
 'No se ha podido enviar. Inténtalo de nuevo en un momento.': 'It couldn’t be sent. Try again in a moment.',
},
'ca': {
 'La app GPS para moto, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'L’app GPS per a moto, feta per motoristes. Prova-la abans que surti a les botigues.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Ya somos casi 170 moteros probándola.': 'Ja som gairebé 170 motoristes provant-la.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Planifica rutas con curvas, puertos y gasolineras.': 'Planifica rutes amb revolts, ports i benzineres.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Navega con voz, en la pantalla de la moto y sin cobertura.': 'Navega amb veu, a la pantalla de la moto i sense cobertura.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Sal en grupo: todos en el mapa y hablando por la radio.': 'Surt en grup: tothom al mapa i parlant per la ràdio.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'SOS al grupo: 3 segundos en el mapa y tu grupo sabe dónde estás.': 'SOS al grup: 3 segons al mapa i el teu grup sap on ets.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 '<title>Prueba MOTOCLUBes</title>': '<title>Prova MOTOCLUBes</title>',
 'Vente a probar MOTOCLUBes, la app GPS para moto': 'Vine a provar MOTOCLUBes, l’app GPS per a moto',
 'Planifica, navega con voz y sal en grupo, con SOS al grupo. Apúntate y te mandamos la invitación para iPhone o Android.':
   'Planifica, navega amb veu i surt en grup, amb SOS al grup. Apunta’t i t’enviem la invitació per a iPhone o Android.',
 'Pásaselo a <b>tu grupo</b>': 'Passa-ho al <b>teu grup</b>',
 'Con este enlace tus compañeros de ruta se apuntan en un minuto y les mandamos la invitación para instalar MOTOCLUBes, en iPhone o en Android.':
   'Amb aquest enllaç els teus companys de ruta s’apunten en un minut i els enviem la invitació per instal·lar MOTOCLUBes, a iPhone o a Android.',
 '💬 Mandar por WhatsApp': '💬 Envia per WhatsApp',
 'Compartir de otra forma': 'Comparteix d’una altra manera',
 'Cuantos más salgáis juntos, mejor se prueba la radio del grupo.': 'Com més sortiu junts, millor es prova la ràdio del grup.',
 'Vente a probar <b>MOTOCLUBes</b>': 'Vine a provar <b>MOTOCLUBes</b>',
 'La app para moteros, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'L’app per a motoristes, feta per motoristes. Prova-la abans que surti a les botigues.',
 'Ya somos casi 170 moteros probándola en iPhone y Android.': 'Ja som gairebé 170 motoristes provant-la a iPhone i Android.',
 'Planifica tus rutas con curvas, puertos y gasolineras con el precio de hoy.': 'Planifica les teves rutes amb revolts, ports i benzineres amb el preu d’avui.',
 'Navega con voz por el casco, en la pantalla de la moto con CarPlay y Android Auto, y sin cobertura con el mapa descargado.':
   'Navega amb veu pel casc, a la pantalla de la moto amb CarPlay i Android Auto, i sense cobertura amb el mapa descarregat.',
 'Sal en grupo: todos en el mapa y hablando por la radio del grupo con el intercomunicador que ya llevas.':
   'Surt en grup: tothom al mapa i parlant per la ràdio del grup amb l’intercomunicador que ja portes.',
 'SOS al grupo: 3 segundos con el dedo en el mapa y todo tu grupo sabe dónde estás.': 'SOS al grup: 3 segons amb el dit al mapa i tot el teu grup sap on ets.',
 '¿Qué móvil tienes?': 'Quin mòbil tens?',
 '>Tu correo<': '>El teu correu<',
 'He leído y acepto la': 'He llegit i accepto la',
 '>política de privacidad<': '>política de privacitat<',
 'Quiero probarla': 'Vull provar-la',
 '¡Ya casi estás dentro!': 'Ja gairebé hi ets!',
 'Mira tu correo y pulsa <b>«Confirmar mi correo»</b>.': 'Mira el teu correu i prem <b>«Confirmar el meu correu»</b>.',
 'En cuanto lo confirmes te damos de alta y te llega la invitación para instalarla.': 'Tan bon punt el confirmis et donem d’alta i t’arriba la invitació per instal·lar-la.',
 '¿No te llega en unos minutos? Mira en <b>Spam</b> o en <b>Promociones</b>: a veces se esconde ahí.': 'No t’arriba en uns minuts? Mira a <b>Spam</b> o a <b>Promocions</b>: de vegades s’amaga allà.',
 '¿Algún problema para instalarla? Escríbenos a': 'Algun problema per instal·lar-la? Escriu-nos a',
 'Abriendo la página de ': 'Obrint la pàgina de ',
 'Si no se abre, pulsa aquí': 'Si no s’obre, prem aquí',
 '¡Vente a probar MOTOCLUBes! Es la app para salir en moto en grupo: todos en el mapa y hablando por el intercom del casco. Apúntate aquí y te llega un correo de MOTOCLUBes para confirmar (si no lo ves, mira en spam): ':
   'Vine a provar MOTOCLUBes! És l’app per sortir en moto en grup: tothom al mapa i parlant per l’intercom del casc. Apunta’t aquí i t’arriba un correu de MOTOCLUBes per confirmar (si no el veus, mira a spam): ',
 '✅ Enlace copiado. Pégalo en tu grupo.': '✅ Enllaç copiat. Enganxa’l al teu grup.',
 'Copiar el enlace': 'Copia l’enllaç',
 '<b></b> te invita a probar MOTOCLUBes': '<b></b> et convida a provar MOTOCLUBes',
 'El Gmail de tu Play Store': 'El Gmail de la teva Play Store',
 'Google solo deja instalarla con esa cuenta. Lo ves en la app de Play Store, tocando tu foto arriba a la derecha.':
   'Google només deixa instal·lar-la amb aquest compte. El veus a l’app de Play Store, tocant la teva foto a dalt a la dreta.',
 "'Tu correo'": "'El teu correu'",
 'Ahí te mandamos la invitación para instalarla con TestFlight, la app de Apple para probar apps antes de que salgan en la tienda.':
   'Allà t’enviem la invitació per instal·lar-la amb TestFlight, l’app d’Apple per provar apps abans que surtin a la botiga.',
 'tu@gmail.com': 'tu@gmail.com', 'tu@correo.com': 'tu@correu.cat',
 'Revisa el correo, parece que no está bien escrito.': 'Revisa el correu, sembla que no està ben escrit.',
 'Marca la casilla de privacidad para poder apuntarte.': 'Marca la casella de privacitat per poder apuntar-te.',
 'Te escribimos a ese correo con el siguiente paso.': 'T’escrivim a aquest correu amb el pas següent.',
 'Te llegará un enlace de Google Play. Ábrelo en tu móvil Android, en Chrome: el que tiene en Play Store el mismo Gmail que has puesto aquí.':
   'T’arribarà un enllaç de Google Play. Obre’l al teu mòbil Android, a Chrome: el que té a Play Store el mateix Gmail que has posat aquí.',
 'Al confirmar te enseñamos cómo instalarla en tu iPhone con TestFlight, y te lo mandamos también por correo.':
   'En confirmar t’ensenyem com instal·lar-la al teu iPhone amb TestFlight, i també t’ho enviem per correu.',
 'No se ha podido enviar. Inténtalo de nuevo en un momento.': 'No s’ha pogut enviar. Torna-ho a provar d’aquí a un moment.',
},
'fr': {
 'La app GPS para moto, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'L’app GPS pour la moto, faite par des motards. Essayez-la avant sa sortie dans les stores.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Ya somos casi 170 moteros probándola.': 'Nous sommes déjà près de 170 motards à la tester.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Planifica rutas con curvas, puertos y gasolineras.': 'Préparez des itinéraires avec virages, cols et stations-service.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Navega con voz, en la pantalla de la moto y sin cobertura.': 'Naviguez avec la voix, sur l’écran de la moto et sans réseau.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Sal en grupo: todos en el mapa y hablando por la radio.': 'Roulez en groupe : tout le monde sur la carte et à la radio.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'SOS al grupo: 3 segundos en el mapa y tu grupo sabe dónde estás.': 'SOS au groupe : 3 secondes sur la carte et votre groupe sait où vous êtes.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 '<title>Prueba MOTOCLUBes</title>': '<title>Essayez MOTOCLUBes</title>',
 'Vente a probar MOTOCLUBes, la app GPS para moto': 'Venez essayer MOTOCLUBes, l’app GPS pour la moto',
 'Planifica, navega con voz y sal en grupo, con SOS al grupo. Apúntate y te mandamos la invitación para iPhone o Android.':
   'Préparez, naviguez avec la voix et roulez en groupe, avec le SOS au groupe. Inscrivez-vous et nous vous envoyons l’invitation pour iPhone ou Android.',
 'Pásaselo a <b>tu grupo</b>': 'Partagez-le avec <b>votre groupe</b>',
 'Con este enlace tus compañeros de ruta se apuntan en un minuto y les mandamos la invitación para instalar MOTOCLUBes, en iPhone o en Android.':
   'Avec ce lien, vos compagnons de route s’inscrivent en une minute et nous leur envoyons l’invitation pour installer MOTOCLUBes, sur iPhone ou sur Android.',
 '💬 Mandar por WhatsApp': '💬 Envoyer par WhatsApp',
 'Compartir de otra forma': 'Partager autrement',
 'Cuantos más salgáis juntos, mejor se prueba la radio del grupo.': 'Plus vous roulez ensemble, mieux on teste la radio du groupe.',
 'Vente a probar <b>MOTOCLUBes</b>': 'Venez essayer <b>MOTOCLUBes</b>',
 'La app para moteros, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'L’app des motards, faite par des motards. Essayez-la avant sa sortie dans les stores.',
 'Ya somos casi 170 moteros probándola en iPhone y Android.': 'Nous sommes déjà près de 170 motards à la tester sur iPhone et Android.',
 'Planifica tus rutas con curvas, puertos y gasolineras con el precio de hoy.': 'Préparez vos itinéraires avec virages, cols et stations-service au prix du jour.',
 'Navega con voz por el casco, en la pantalla de la moto con CarPlay y Android Auto, y sin cobertura con el mapa descargado.':
   'Naviguez avec la voix dans le casque, sur l’écran de la moto avec CarPlay et Android Auto, et sans réseau grâce à la carte téléchargée.',
 'Sal en grupo: todos en el mapa y hablando por la radio del grupo con el intercomunicador que ya llevas.':
   'Roulez en groupe : tout le monde sur la carte et en train de parler par la radio du groupe avec l’intercom que vous avez déjà.',
 'SOS al grupo: 3 segundos con el dedo en el mapa y todo tu grupo sabe dónde estás.': 'SOS au groupe : 3 secondes le doigt sur la carte et tout votre groupe sait où vous êtes.',
 '¿Qué móvil tienes?': 'Quel téléphone avez-vous ?',
 '>Tu correo<': '>Votre e-mail<',
 'He leído y acepto la': 'J’ai lu et j’accepte la',
 '>política de privacidad<': '>politique de confidentialité<',
 'Quiero probarla': 'Je veux l’essayer',
 '¡Ya casi estás dentro!': 'Vous y êtes presque !',
 'Mira tu correo y pulsa <b>«Confirmar mi correo»</b>.': 'Regardez vos e-mails et touchez <b>« Confirmer mon e-mail »</b>.',
 'En cuanto lo confirmes te damos de alta y te llega la invitación para instalarla.': 'Dès que vous le confirmez, nous vous inscrivons et vous recevez l’invitation pour l’installer.',
 '¿No te llega en unos minutos? Mira en <b>Spam</b> o en <b>Promociones</b>: a veces se esconde ahí.': 'Rien après quelques minutes ? Regardez dans <b>Spam</b> ou <b>Promotions</b> : il s’y cache parfois.',
 '¿Algún problema para instalarla? Escríbenos a': 'Un problème pour l’installer ? Écrivez-nous à',
 'Abriendo la página de ': 'Ouverture de la page ',
 'Si no se abre, pulsa aquí': 'Si elle ne s’ouvre pas, touchez ici',
 '¡Vente a probar MOTOCLUBes! Es la app para salir en moto en grupo: todos en el mapa y hablando por el intercom del casco. Apúntate aquí y te llega un correo de MOTOCLUBes para confirmar (si no lo ves, mira en spam): ':
   'Viens essayer MOTOCLUBes ! C’est l’app pour rouler à moto en groupe : tout le monde sur la carte et en train de parler par l’intercom du casque. Inscris-toi ici et tu recevras un e-mail de MOTOCLUBes à confirmer (si tu ne le vois pas, regarde dans les spams) : ',
 '✅ Enlace copiado. Pégalo en tu grupo.': '✅ Lien copié. Collez-le dans votre groupe.',
 'Copiar el enlace': 'Copier le lien',
 '<b></b> te invita a probar MOTOCLUBes': '<b></b> vous invite à essayer MOTOCLUBes',
 'El Gmail de tu Play Store': 'Le Gmail de votre Play Store',
 'Google solo deja instalarla con esa cuenta. Lo ves en la app de Play Store, tocando tu foto arriba a la derecha.':
   'Google ne permet de l’installer qu’avec ce compte. Vous le voyez dans l’app Play Store en touchant votre photo en haut à droite.',
 "'Tu correo'": "'Votre e-mail'",
 'Ahí te mandamos la invitación para instalarla con TestFlight, la app de Apple para probar apps antes de que salgan en la tienda.':
   'Nous vous y envoyons l’invitation pour l’installer avec TestFlight, l’app d’Apple pour essayer des apps avant leur sortie.',
 'tu@gmail.com': 'vous@gmail.com', 'tu@correo.com': 'vous@email.fr',
 'Revisa el correo, parece que no está bien escrito.': 'Vérifiez l’e-mail, il semble mal écrit.',
 'Marca la casilla de privacidad para poder apuntarte.': 'Cochez la case de confidentialité pour pouvoir vous inscrire.',
 'Te escribimos a ese correo con el siguiente paso.': 'Nous vous écrivons à cette adresse avec l’étape suivante.',
 'Te llegará un enlace de Google Play. Ábrelo en tu móvil Android, en Chrome: el que tiene en Play Store el mismo Gmail que has puesto aquí.':
   'Vous recevrez un lien Google Play. Ouvrez-le sur votre téléphone Android, dans Chrome : celui dont le Play Store a le même Gmail que celui saisi ici.',
 'Al confirmar te enseñamos cómo instalarla en tu iPhone con TestFlight, y te lo mandamos también por correo.':
   'En confirmant, nous vous montrons comment l’installer sur votre iPhone avec TestFlight, et nous vous l’envoyons aussi par e-mail.',
 'No se ha podido enviar. Inténtalo de nuevo en un momento.': 'L’envoi a échoué. Réessayez dans un instant.',
},
'pt': {
 'La app GPS para moto, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'A app GPS para mota, feita por motociclistas. Experimenta-a antes de sair nas lojas.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Ya somos casi 170 moteros probándola.': 'Já somos quase 170 motociclistas a testá-la.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Planifica rutas con curvas, puertos y gasolineras.': 'Planeia rotas com curvas, passos de montanha e bombas.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Navega con voz, en la pantalla de la moto y sin cobertura.': 'Navega com voz, no ecrã da mota e sem rede.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Sal en grupo: todos en el mapa y hablando por la radio.': 'Sai em grupo: todos no mapa e a falar pelo rádio.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'SOS al grupo: 3 segundos en el mapa y tu grupo sabe dónde estás.': 'SOS ao grupo: 3 segundos no mapa e o teu grupo sabe onde estás.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 '<title>Prueba MOTOCLUBes</title>': '<title>Experimenta o MOTOCLUBes</title>',
 'Vente a probar MOTOCLUBes, la app GPS para moto': 'Vem experimentar o MOTOCLUBes, a app GPS para mota',
 'Planifica, navega con voz y sal en grupo, con SOS al grupo. Apúntate y te mandamos la invitación para iPhone o Android.':
   'Planeia, navega com voz e sai em grupo, com SOS ao grupo. Inscreve-te e enviamos-te o convite para iPhone ou Android.',
 'Pásaselo a <b>tu grupo</b>': 'Passa ao <b>teu grupo</b>',
 'Con este enlace tus compañeros de ruta se apuntan en un minuto y les mandamos la invitación para instalar MOTOCLUBes, en iPhone o en Android.':
   'Com este link os teus companheiros de estrada inscrevem-se num minuto e enviamos-lhes o convite para instalar o MOTOCLUBes, no iPhone ou no Android.',
 '💬 Mandar por WhatsApp': '💬 Enviar por WhatsApp',
 'Compartir de otra forma': 'Partilhar de outra forma',
 'Cuantos más salgáis juntos, mejor se prueba la radio del grupo.': 'Quantos mais saírem juntos, melhor se testa o rádio do grupo.',
 'Vente a probar <b>MOTOCLUBes</b>': 'Vem experimentar o <b>MOTOCLUBes</b>',
 'La app para moteros, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'A app para motociclistas, feita por motociclistas. Experimenta-a antes de sair nas lojas.',
 'Ya somos casi 170 moteros probándola en iPhone y Android.': 'Já somos quase 170 motociclistas a testá-la em iPhone e Android.',
 'Planifica tus rutas con curvas, puertos y gasolineras con el precio de hoy.': 'Planeia as tuas rotas com curvas, passos de montanha e bombas com o preço de hoje.',
 'Navega con voz por el casco, en la pantalla de la moto con CarPlay y Android Auto, y sin cobertura con el mapa descargado.':
   'Navega com voz no capacete, no ecrã da mota com CarPlay e Android Auto, e sem rede com o mapa descarregado.',
 'Sal en grupo: todos en el mapa y hablando por la radio del grupo con el intercomunicador que ya llevas.':
   'Sai em grupo: todos no mapa e a falar pelo rádio do grupo com o intercomunicador que já usas.',
 'SOS al grupo: 3 segundos con el dedo en el mapa y todo tu grupo sabe dónde estás.': 'SOS ao grupo: 3 segundos com o dedo no mapa e todo o teu grupo sabe onde estás.',
 '¿Qué móvil tienes?': 'Que telemóvel tens?',
 '>Tu correo<': '>O teu e-mail<',
 'He leído y acepto la': 'Li e aceito a',
 '>política de privacidad<': '>política de privacidade<',
 'Quiero probarla': 'Quero experimentar',
 '¡Ya casi estás dentro!': 'Já estás quase lá dentro!',
 'Mira tu correo y pulsa <b>«Confirmar mi correo»</b>.': 'Vê o teu e-mail e toca em <b>«Confirmar o meu e-mail»</b>.',
 'En cuanto lo confirmes te damos de alta y te llega la invitación para instalarla.': 'Assim que o confirmares, damos-te de alta e recebes o convite para a instalar.',
 '¿No te llega en unos minutos? Mira en <b>Spam</b> o en <b>Promociones</b>: a veces se esconde ahí.': 'Não chegou em poucos minutos? Vê em <b>Spam</b> ou em <b>Promoções</b>: às vezes esconde-se aí.',
 '¿Algún problema para instalarla? Escríbenos a': 'Algum problema para a instalar? Escreve-nos para',
 'Abriendo la página de ': 'A abrir a página da ',
 'Si no se abre, pulsa aquí': 'Se não abrir, toca aqui',
 '¡Vente a probar MOTOCLUBes! Es la app para salir en moto en grupo: todos en el mapa y hablando por el intercom del casco. Apúntate aquí y te llega un correo de MOTOCLUBes para confirmar (si no lo ves, mira en spam): ':
   'Vem experimentar o MOTOCLUBes! É a app para sair de mota em grupo: todos no mapa e a falar pelo intercomunicador do capacete. Inscreve-te aqui e recebes um e-mail do MOTOCLUBes para confirmar (se não o vires, vê no spam): ',
 '✅ Enlace copiado. Pégalo en tu grupo.': '✅ Link copiado. Cola-o no teu grupo.',
 'Copiar el enlace': 'Copiar o link',
 '<b></b> te invita a probar MOTOCLUBes': '<b></b> convida-te a experimentar o MOTOCLUBes',
 'El Gmail de tu Play Store': 'O Gmail da tua Play Store',
 'Google solo deja instalarla con esa cuenta. Lo ves en la app de Play Store, tocando tu foto arriba a la derecha.':
   'A Google só deixa instalá-la com essa conta. Vês na app da Play Store, tocando na tua foto em cima à direita.',
 "'Tu correo'": "'O teu e-mail'",
 'Ahí te mandamos la invitación para instalarla con TestFlight, la app de Apple para probar apps antes de que salgan en la tienda.':
   'Enviamos-te para aí o convite para a instalar com o TestFlight, a app da Apple para testar apps antes de saírem na loja.',
 'tu@gmail.com': 'tu@gmail.com', 'tu@correo.com': 'tu@email.pt',
 'Revisa el correo, parece que no está bien escrito.': 'Revê o e-mail, parece que não está bem escrito.',
 'Marca la casilla de privacidad para poder apuntarte.': 'Marca a caixa de privacidade para te podermos inscrever.',
 'Te escribimos a ese correo con el siguiente paso.': 'Escrevemos-te para esse e-mail com o passo seguinte.',
 'Te llegará un enlace de Google Play. Ábrelo en tu móvil Android, en Chrome: el que tiene en Play Store el mismo Gmail que has puesto aquí.':
   'Vais receber um link da Google Play. Abre-o no teu telemóvel Android, no Chrome: o que tem na Play Store o mesmo Gmail que puseste aqui.',
 'Al confirmar te enseñamos cómo instalarla en tu iPhone con TestFlight, y te lo mandamos también por correo.':
   'Ao confirmares mostramos-te como a instalar no teu iPhone com o TestFlight, e também to enviamos por e-mail.',
 'No se ha podido enviar. Inténtalo de nuevo en un momento.': 'Não foi possível enviar. Tenta de novo daqui a pouco.',
},
'it': {
 'La app GPS para moto, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'L’app GPS per la moto, fatta da motociclisti. Provala prima che arrivi negli store.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Ya somos casi 170 moteros probándola.': 'Siamo già quasi 170 motociclisti a provarla.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Planifica rutas con curvas, puertos y gasolineras.': 'Pianifica percorsi con curve, passi e distributori.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Navega con voz, en la pantalla de la moto y sin cobertura.': 'Naviga con la voce, sullo schermo della moto e senza campo.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'Sal en grupo: todos en el mapa y hablando por la radio.': 'Esci in gruppo: tutti sulla mappa e a parlare via radio.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 'SOS al grupo: 3 segundos en el mapa y tu grupo sabe dónde estás.': 'SOS al gruppo: 3 secondi sulla mappa e il tuo gruppo sa dove sei.',  # WEB-MARKETING-1 (155.ª, 11:37): frase corta
 '<title>Prueba MOTOCLUBes</title>': '<title>Prova MOTOCLUBes</title>',
 'Vente a probar MOTOCLUBes, la app GPS para moto': 'Vieni a provare MOTOCLUBes, l’app GPS per la moto',
 'Planifica, navega con voz y sal en grupo, con SOS al grupo. Apúntate y te mandamos la invitación para iPhone o Android.':
   'Pianifica, naviga con la voce ed esci in gruppo, con l’SOS al gruppo. Iscriviti e ti mandiamo l’invito per iPhone o Android.',
 'Pásaselo a <b>tu grupo</b>': 'Passalo al <b>tuo gruppo</b>',
 'Con este enlace tus compañeros de ruta se apuntan en un minuto y les mandamos la invitación para instalar MOTOCLUBes, en iPhone o en Android.':
   'Con questo link i tuoi compagni di strada si iscrivono in un minuto e mandiamo loro l’invito per installare MOTOCLUBes, su iPhone o su Android.',
 '💬 Mandar por WhatsApp': '💬 Invia su WhatsApp',
 'Compartir de otra forma': 'Condividi in un altro modo',
 'Cuantos más salgáis juntos, mejor se prueba la radio del grupo.': 'Più uscite insieme, meglio si prova la radio del gruppo.',
 'Vente a probar <b>MOTOCLUBes</b>': 'Vieni a provare <b>MOTOCLUBes</b>',
 'La app para moteros, hecha por moteros. Pruébala antes de que salga en las tiendas.': 'L’app per motociclisti, fatta da motociclisti. Provala prima che arrivi negli store.',
 'Ya somos casi 170 moteros probándola en iPhone y Android.': 'Siamo già quasi 170 motociclisti a provarla su iPhone e Android.',
 'Planifica tus rutas con curvas, puertos y gasolineras con el precio de hoy.': 'Pianifica i tuoi percorsi con curve, passi e distributori con il prezzo di oggi.',
 'Navega con voz por el casco, en la pantalla de la moto con CarPlay y Android Auto, y sin cobertura con el mapa descargado.':
   'Naviga con la voce nel casco, sullo schermo della moto con CarPlay e Android Auto, e senza campo con la mappa scaricata.',
 'Sal en grupo: todos en el mapa y hablando por la radio del grupo con el intercomunicador que ya llevas.':
   'Esci in gruppo: tutti sulla mappa e a parlare con la radio del gruppo con l’interfono che hai già.',
 'SOS al grupo: 3 segundos con el dedo en el mapa y todo tu grupo sabe dónde estás.': 'SOS al gruppo: 3 secondi con il dito sulla mappa e tutto il tuo gruppo sa dove sei.',
 '¿Qué móvil tienes?': 'Che telefono hai?',
 '>Tu correo<': '>La tua email<',
 'He leído y acepto la': 'Ho letto e accetto la',
 '>política de privacidad<': '>privacy policy<',
 'Quiero probarla': 'Voglio provarla',
 '¡Ya casi estás dentro!': 'Ci sei quasi!',
 'Mira tu correo y pulsa <b>«Confirmar mi correo»</b>.': 'Guarda la tua email e tocca <b>«Conferma la mia email»</b>.',
 'En cuanto lo confirmes te damos de alta y te llega la invitación para instalarla.': 'Appena la confermi ti iscriviamo e ti arriva l’invito per installarla.',
 '¿No te llega en unos minutos? Mira en <b>Spam</b> o en <b>Promociones</b>: a veces se esconde ahí.': 'Non arriva in pochi minuti? Guarda in <b>Spam</b> o in <b>Promozioni</b>: a volte si nasconde lì.',
 '¿Algún problema para instalarla? Escríbenos a': 'Problemi a installarla? Scrivici a',
 'Abriendo la página de ': 'Apertura della pagina di ',
 'Si no se abre, pulsa aquí': 'Se non si apre, tocca qui',
 '¡Vente a probar MOTOCLUBes! Es la app para salir en moto en grupo: todos en el mapa y hablando por el intercom del casco. Apúntate aquí y te llega un correo de MOTOCLUBes para confirmar (si no lo ves, mira en spam): ':
   'Vieni a provare MOTOCLUBes! È l’app per uscire in moto in gruppo: tutti sulla mappa e a parlare con l’interfono del casco. Iscriviti qui e ti arriva un’email di MOTOCLUBes da confermare (se non la vedi, guarda nello spam): ',
 '✅ Enlace copiado. Pégalo en tu grupo.': '✅ Link copiato. Incollalo nel tuo gruppo.',
 'Copiar el enlace': 'Copia il link',
 '<b></b> te invita a probar MOTOCLUBes': '<b></b> ti invita a provare MOTOCLUBes',
 'El Gmail de tu Play Store': 'Il Gmail del tuo Play Store',
 'Google solo deja instalarla con esa cuenta. Lo ves en la app de Play Store, tocando tu foto arriba a la derecha.':
   'Google permette di installarla solo con quell’account. Lo vedi nell’app Play Store toccando la tua foto in alto a destra.',
 "'Tu correo'": "'La tua email'",
 'Ahí te mandamos la invitación para instalarla con TestFlight, la app de Apple para probar apps antes de que salgan en la tienda.':
   'Lì ti mandiamo l’invito per installarla con TestFlight, l’app di Apple per provare le app prima che arrivino nello store.',
 'tu@gmail.com': 'tu@gmail.com', 'tu@correo.com': 'tu@email.it',
 'Revisa el correo, parece que no está bien escrito.': 'Controlla l’email, sembra scritta male.',
 'Marca la casilla de privacidad para poder apuntarte.': 'Spunta la casella della privacy per poterti iscrivere.',
 'Te escribimos a ese correo con el siguiente paso.': 'Ti scriviamo a quell’email con il passo successivo.',
 'Te llegará un enlace de Google Play. Ábrelo en tu móvil Android, en Chrome: el que tiene en Play Store el mismo Gmail que has puesto aquí.':
   'Ti arriverà un link di Google Play. Aprilo sul tuo telefono Android, in Chrome: quello che ha nel Play Store lo stesso Gmail che hai messo qui.',
 'Al confirmar te enseñamos cómo instalarla en tu iPhone con TestFlight, y te lo mandamos también por correo.':
   'Quando confermi ti mostriamo come installarla sul tuo iPhone con TestFlight, e te lo mandiamo anche via email.',
 'No se ha podido enviar. Inténtalo de nuevo en un momento.': 'Non è stato possibile inviare. Riprova tra un momento.',
},
}

def generar(l, dic):
    s = ES
    # El botón del correo de confirmar se llama como en web-aviso (T[idioma].boton): el correo de /probar/ va en su idioma.
    pat = re.compile('|'.join(re.escape(k) for k in sorted(dic, key=len, reverse=True)))
    s = pat.sub(lambda m: dic[m.group(0)], s)
    s = s.replace('<html lang="es">', f'<html lang="{l}">')
    s = s.replace('content="https://www.motoclubes.es/probar/"', f'content="https://www.motoclubes.es/{l}/probar/"')
    s = s.replace('../img/', '/img/').replace('../assets/', '/assets/').replace('href="../"', f'href="/{l}/"')
    # El idioma que se manda al apuntarse (web-aviso lo guarda y escribe en ese idioma) y el enlace que se comparte.
    s = s.replace("i: 'es',", f"i: '{l}',")
    # Revisión: el enlace que se comparte es siempre el castellano (/probar/?de=…): cada amigo pasa solo a su idioma.
    # La castellana manda a su idioma según el móvil; las traducidas no mandan a ningún sitio.
    s = re.sub(r'\n  // PROBAR-IDIOMAS-1 · ES-SOLO.*?// /ES-SOLO\n', '\n', s, flags=re.S)
    os.makedirs(f'{l}/probar', exist_ok=True)
    io.open(f'{l}/probar/index.html', 'w', encoding='utf8').write(s)
    quedan = [k for k in dic if k in s and len(k) > 20 and dic[k] != k]
    print(f'{l}/probar/index.html: escrito. Sin traducir: {len(quedan)}')
    for q in quedan[:5]: print('   🔴', q[:80])

for l, d in T.items():
    generar(l, d)
