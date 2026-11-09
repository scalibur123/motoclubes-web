#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MC-WEB-IDIOMAS-20SEP-2026 · Genera /fr/, /pt/ e /it/ (IDIOMAS-PT-IT-1, 142.ª) desde la página española.

POR QUÉ ASÍ: la web son copias completas por idioma (así estaban ya /en/ y /ca/),
no plantillas. Este script traduce cadena a cadena sobre el HTML español, de modo
que cuando se toque la española basta con volver a ejecutarlo para rehacer las dos.

🔴 Las traducciones son de Claude y NO las ha revisado un nativo. Están escritas
con el mismo tono seco de la española, no calcadas palabra por palabra.
"""
import io, re, sys

FR = {
 "MOTOCLUBes — La app que viaja contigo | Rutas, navegación y comunidad motera":
   "MOTOCLUBes — L'app qui roule avec vous | Itinéraires, navigation et communauté moto",
 "MOTOCLUBes es la app para moteros: planifica rutas, navega con GPS pensado para la moto, rueda en grupo con intercom y comparte tus rutas con la comunidad.":
   "MOTOCLUBes est l'app des motards : préparez vos itinéraires, naviguez avec un GPS pensé pour la moto, roulez en groupe avec l'intercom et partagez vos parcours avec la communauté.",
 "Qué es":"L'app", "Funciones":"Fonctions", "Proyecto":"Le projet", "Preguntas":"Questions",
 "Negocios":"Professionnels", "Descarga":"Télécharger",
 "Planificar":"Planifier", "Planificador de varios días":"Planificateur sur plusieurs jours", "🖥️ Planifica en el ordenador":"🖥️ Planifier sur ordinateur",  # PLANIFICAR-WEB-ENLACE-1 (127.ª)
 "La app que viaja contigo.":"L'app qui roule avec vous.",
 "Tu club. Tus rutas. Tu comunidad.":"Votre club. Vos itinéraires. Votre communauté.",
 "Ver qué hace":"Voir ce qu'elle fait", "Soy un negocio":"Je suis un professionnel",
 "Estamos rodando la app con riders reales antes de abrirla al público.":
   "Nous testons l'app sur la route avec de vrais motards avant de l'ouvrir au public.",
 "Una app hecha por moteros, para moteros":"Une app faite par des motards, pour des motards",
 "MOTOCLUBes junta en un solo sitio las tres cosas que hoy están repartidas entre cinco aplicaciones distintas: planificar la ruta, navegarla en moto y rodarla con tu gente.":
   "MOTOCLUBes réunit au même endroit les trois choses aujourd'hui éparpillées entre cinq applications : préparer l'itinéraire, le naviguer à moto et le rouler avec les vôtres.",
 "Planifica":"Préparez",
 "Diseña la ruta por curvas, secundarias o sin peajes. Añade paradas de gasolinera, restaurante u hotel. Importa tus GPX de siempre.":
   "Tracez l'itinéraire par les virages, les départementales ou sans péage. Ajoutez vos arrêts station, restaurant ou hôtel. Importez vos GPX habituels.",
 "Navega":"Naviguez",
 "Navegación GPS pensada para la moto, con la pantalla encendida, funcionando en segundo plano y con la voz preparada para el intercomunicador.":
   "Navigation GPS pensée pour la moto : écran allumé, fonctionnement en arrière-plan et voix prête pour l'intercom.",
 "Rueda en grupo":"Roulez en groupe",
 "Crea el grupo, publica la salida, y en ruta todos se ven en el mapa y hablan por el intercom de la propia app.":
   "Créez le groupe, publiez la sortie, et sur la route chacun voit les autres sur la carte et parle par l'intercom de l'app.",
 "Todo lo que puedes hacer":"Tout ce que vous pouvez faire",
 "Lo que ya está construido y funcionando en la app, y lo que llega después.":
   "Ce qui est déjà construit et fonctionne dans l'app, et ce qui arrive ensuite.",
 "Tus rutas":"Vos itinéraires",
 "Planificador de varios días":"Planificateur sur plusieurs jours",
 "Etapas con su color, kilómetros y tiempo calculados, y el resumen de toda la salida en un mapa.":
   "Des étapes avec leur couleur, kilomètres et durée calculés, et le résumé de toute la sortie sur une carte.",
 "Importa, edita y exporta GPX":"Importez, modifiez et exportez vos GPX",
 "No solo verlos: traes tu GPX, lo retocas a tu gusto y te lo llevas otra vez cuando quieras.":
   "Pas seulement les afficher : vous importez votre GPX, vous le retouchez à votre goût et vous le récupérez quand vous voulez.",
 "Paradas y puntos de paso":"Arrêts et points de passage",
 "Gasolinera, restaurante, hotel o sitio que te apetece ver. Y los puntos por los que solo pasas no ensucian el mapa.":
   "Station, restaurant, hôtel ou endroit que vous voulez voir. Et les points où vous ne faites que passer n'encombrent pas la carte.",
 "Buscador de puertos":"Moteur de recherche de cols",
 "15.478 puertos y collados de España y Francia, buscables por nombre aunque te comas los acentos.":
   "15 478 cols d'Espagne et de France, cherchables par leur nom même sans les accents.",
 "El perfil real de la ruta":"Le vrai profil de l'itinéraire",
 "Desnivel acumulado de subida y de bajada, altitud máxima y mínima, y las curvas contadas una a una.":
   "Dénivelé positif et négatif, altitude maximale et minimale, et les virages comptés un à un.",
 "Vuela la ruta antes de hacerla":"Survolez l'itinéraire avant de le faire",
 "Vista aérea a vista de dron de todo el recorrido, para ver por dónde vas a pasar sin salir de casa.":
   "Vue aérienne, comme un drone, de tout le parcours : vous voyez où vous allez passer sans bouger de chez vous.",
 "En carretera":"Sur la route",
 "Navegación pensada para la moto":"Une navigation pensée pour la moto",
 "Sigue en segundo plano, con la pantalla activa y el GPS continuo aunque bloquees el móvil.":
   "Elle continue en arrière-plan, écran actif et GPS en continu même téléphone verrouillé.",
 "Intercom del grupo":"Intercom du groupe",
 "Voz entre los riders de la salida por los datos del móvil. Cualquier casco, cualquier marca.":
   "La voix entre les motards de la sortie passe par les données mobiles. N'importe quel casque, n'importe quelle marque.",
 "Seguimiento en vivo":"Suivi en direct",
 "Durante la salida cada uno ve dónde va el resto. Se activa en el grupo y se desactiva en tu perfil.":
   "Pendant la sortie, chacun voit où sont les autres. Ça s'active dans le groupe et se désactive dans votre profil.",
 "Gasolineras de cuatro países":"Stations-service de quatre pays",
 "Más de 24.000 en España, Francia, Portugal y Andorra, con el precio actualizado cada mañana y la fecha a la vista. Al acercarte a la frontera salen las de los dos lados.":
   "Plus de 24 000 en France, en Espagne, au Portugal et en Andorre, avec le prix mis à jour chaque matin et la date affichée. Près de la frontière, celles des deux côtés apparaissent.",
 "Tus lugares":"Vos lieux",
 "Casa, trabajo y tus sitios de siempre, puestos con el dedo en el mapa: la entrada del garaje no es lo que devuelve un buscador.":
   "Maison, travail et vos adresses habituelles, posées au doigt sur la carte : l'entrée du garage, ce n'est pas ce que renvoie un moteur de recherche.",
 "CarPlay":"CarPlay",
 "Apple ya ha autorizado la navegación en CarPlay. Está en construcción.":
   "Apple a déjà autorisé la navigation sur CarPlay. C'est en construction.",
 "Próximamente":"Bientôt",
 "Comunidad":"Communauté",
 "Pública o privada, tú decides":"Publique ou privée, c'est vous qui décidez",
 "Cada ruta se publica o se queda para ti. Y lo puedes cambiar cuando quieras.":
   "Chaque itinéraire est publié ou reste pour vous. Et vous pouvez changer d'avis quand vous voulez.",
 "Aplausos y comentarios":"Applaudissements et commentaires",
 "Las rutas que publicas se aplauden, se comentan y se guardan en favoritos.":
   "Les itinéraires que vous publiez sont applaudis, commentés et mis en favoris.",
 "Las fotos de la salida":"Les photos de la sortie",
 "El álbum del día queda colgado de la ruta, no perdido en un grupo de WhatsApp.":
   "L'album du jour reste attaché à l'itinéraire, pas perdu dans un groupe WhatsApp.",
 "Logros y retos":"Trophées et défis",
 "Kilómetros, curvas y provincias visitadas, con sus hitos.":
   "Kilomètres, virages et départements traversés, avec leurs paliers.",
 "Foro de la comunidad":"Forum de la communauté",
 "Preguntas, rutas recomendadas y lo que salga, con moderación de verdad.":
   "Questions, itinéraires recommandés et tout ce qui vient, avec une vraie modération.",
 "Rider Friendly":"Rider Friendly",
 "El directorio de bares, hoteles y talleres que tratan bien al motero.":
   "L'annuaire des bars, hôtels et garages qui traitent bien les motards.",
 "El proyecto":"Le projet",
 "Cómo está MOTOCLUBes hoy":"Où en est MOTOCLUBes aujourd'hui",
 "Somos una empresa tecnológica española, con sede en Barcelona y un producto propio en desarrollo continuo. Esto es lo que hay construido, sin adornos.":
   "Nous sommes une entreprise technologique espagnole, basée à Barcelone, avec un produit maison en développement continu. Voici ce qui est construit, sans fioritures.",
 "App nativa":"App native", "iOS y Android":"iOS et Android",
 "Infraestructura":"Infrastructure", "Propia, de extremo a extremo":"La nôtre, de bout en bout",
 "Pruebas":"Tests", "Con riders reales en carretera":"Avec de vrais motards sur la route",
 "Portal de negocios":"Portail professionnels", "En funcionamiento":"En service",
 "Por qué existe":"Pourquoi elle existe",
 "La ruta, el grupo y la voz nunca están en el mismo sitio":
   "L'itinéraire, le groupe et la voix ne sont jamais au même endroit",
 "Quien viaja en moto lo conoce: la ruta en una app, la quedada en un grupo de WhatsApp, la voz en un intercomunicador que no se habla con el del de al lado, y a mitad de camino nadie sabe dónde está el resto. Cinco herramientas para una sola salida.":
   "Tous les motards connaissent ça : l'itinéraire dans une app, le rendez-vous dans un groupe WhatsApp, la voix dans un intercom qui ne parle pas à celui du voisin, et à mi-chemin personne ne sait où sont les autres. Cinq outils pour une seule sortie.",
 "MOTOCLUBes nace de ahí. No de añadir una app más, sino de que planificar la ruta, navegarla y rodarla con tu gente dejen de ser tres cosas separadas. Lo construimos moteros, se prueba en carretera, y seguimos en ello.":
   "MOTOCLUBes est née de là. Pas pour ajouter une app de plus, mais pour que préparer l'itinéraire, le naviguer et le rouler avec les siens cessent d'être trois choses séparées. Ce sont des motards qui la construisent, elle se teste sur la route, et ça continue.",
 "El equipo de MOTOCLUBes":"L'équipe MOTOCLUBes",
 "Moteros · MOTOCLUBES TECH S.L., Barcelona":"Des motards · MOTOCLUBES TECH S.L., Barcelone",
 "¿Tienes un bar, un hotel o un taller?":"Vous avez un bar, un hôtel ou un garage ?",
 "Los moteros paran donde se les trata bien. El portal Rider Friendly te deja darte de alta, publicar tus ofertas y validarlas con un código cuando el rider llega a tu puerta.":
   "Les motards s'arrêtent là où on les traite bien. Le portail Rider Friendly vous permet de vous inscrire, de publier vos offres et de les valider par un code quand le motard arrive chez vous.",
 "Entrar al portal de negocios":"Accéder au portail professionnels",
 "Preguntas frecuentes":"Questions fréquentes", "Lo que nos preguntáis":"Ce que vous nous demandez",
 "¿Cuándo la puedo descargar?":"Quand pourrai-je la télécharger ?",
 "Está terminando su fase de pruebas en carretera con riders reales. En cuanto esté publicada en App Store y en Google Play, los dos enlaces aparecerán en esta misma página.":
   "Elle termine sa phase de tests sur route avec de vrais motards. Dès qu'elle sera publiée sur l'App Store et Google Play, les deux liens apparaîtront sur cette page.",
 "¿Necesito un intercomunicador de 400 €?":"Faut-il un intercom à 400 € ?",
 "No. La voz del grupo va por los datos del móvil, así que vale cualquier auricular o intercomunicador Bluetooth que ya tengas en el casco, sea de la marca que sea. Y no depende del alcance del aparato: mientras haya cobertura, seguís hablando.":
   "Non. La voix du groupe passe par les données mobiles : n'importe quelle oreillette ou intercom Bluetooth déjà dans votre casque fait l'affaire, quelle que soit la marque. Et ça ne dépend pas de la portée de l'appareil : tant qu'il y a du réseau, vous continuez à parler.",
 "¿Funciona con el móvil guardado y la pantalla bloqueada?":"Ça marche avec le téléphone rangé et l'écran verrouillé ?",
 "Sí. La navegación sigue funcionando en segundo plano con el GPS activo, que es justo lo que hace falta cuando el teléfono va en el bolsillo o en el soporte con la pantalla apagada.":
   "Oui. La navigation continue en arrière-plan avec le GPS actif, ce qu'il faut justement quand le téléphone est en poche ou sur le support, écran éteint.",
 "¿Puedo traerme las rutas que ya tengo?":"Puis-je importer les itinéraires que j'ai déjà ?",
 "Sí. Importas tus GPX de siempre y te llevas las nuevas en GPX cuando quieras. Tus rutas son tuyas y salen por donde entraron.":
   "Oui. Vous importez vos GPX habituels et vous repartez avec les nouveaux en GPX quand vous voulez. Vos itinéraires sont à vous et ressortent par où ils sont entrés.",
 "¿Todo el mundo ve dónde estoy?":"Est-ce que tout le monde voit où je suis ?",
 "No por defecto. El seguimiento en vivo solo funciona durante una salida, hay que activarlo en el grupo, y además cada rider tiene su propio interruptor en el perfil para no compartir su posición aunque el grupo lo tenga puesto.":
   "Pas par défaut. Le suivi en direct ne fonctionne que pendant une sortie, il faut l'activer dans le groupe, et chaque motard a en plus son propre interrupteur dans son profil pour ne pas partager sa position même si le groupe l'a activé.",
 "¿Es solo para clubes con chaleco y parches?":"C'est réservé aux clubs avec gilet et écussons ?",
 "No. Vale igual para un club con su estructura que para cuatro amigos que salen a desayunar el domingo. Un grupo es simplemente la gente con la que ruedas.":
   "Non. Ça vaut aussi bien pour un club structuré que pour quatre copains qui partent déjeuner le dimanche. Un groupe, c'est simplement les gens avec qui vous roulez.",
 "¿Y si mi grupo va con iPhone y con Android?":"Et si mon groupe mélange iPhone et Android ?",
 "Da igual. La app es nativa en las dos plataformas y todo funciona entre ellas: el grupo, la salida, el mapa y la voz.":
   "Aucune importance. L'app est native sur les deux plateformes et tout fonctionne entre elles : le groupe, la sortie, la carte et la voix.",
 "¿Quién está detrás de esto?":"Qui est derrière tout ça ?",
 "MOTOCLUBES TECH S.L., una empresa con sede en Barcelona. Producto propio, infraestructura propia y desarrollo continuo. No somos el proyecto paralelo de nadie.":
   "MOTOCLUBES TECH S.L., une entreprise basée à Barcelone. Produit maison, infrastructure maison et développement continu. Nous ne sommes le projet secondaire de personne.",
 "Próximamente en las dos tiendas":"Bientôt sur les deux stores",
 "La app está terminando su fase de pruebas. Cuando esté publicada, aquí estarán los dos enlaces.":
   "L'app termine sa phase de tests. Une fois publiée, les deux liens seront ici.",
 "Próximamente en":"Bientôt sur",
 "Producto":"Produit", "Darse de baja":"Se désinscrire", "Legal":"Mentions légales",
 "Aviso legal":"Mentions légales", "Privacidad":"Confidentialité", "Cookies":"Cookies",
 "Términos":"Conditions", "Normas del foro":"Règles du forum",
 "Contacto":"Contact", "Soporte y dudas:":"Support et questions :",
 # WEB-REPASO-142 (9-nov-2026): Android Auto, radio del grupo, preguntas nuevas, 1.26.1108
 "CarPlay y Android Auto":
   "CarPlay et Android Auto",
 "La ruta, los giros, las paradas, los radares y tus compañeros en la pantalla de la moto o del coche. Y sin ruta, el mapa con los radares.":
   "L'itinéraire, les directions, les arrêts, les alertes et vos compagnons sur l'écran de la moto ou de la voiture. Et sans itinéraire, la carte avec les alertes de la zone.",
 "Radio del grupo":
   "Radio du groupe",
 "Habláis todos por el intercomunicador que ya lleváis, de la marca que sea, por los datos del móvil. Sin intercomunicador, oyes al grupo.":
   "Tout le monde parle par l'intercom qu'il porte déjà, quelle que soit la marque, via les données du téléphone. Sans intercom, vous entendez le groupe.",
 "Crea el grupo, publica la salida, y en ruta todos se ven en el mapa y hablan por la radio del grupo.":
   "Créez le groupe, publiez la sortie, et sur la route chacun voit les autres sur la carte et parle par la radio du groupe.",
 "MOTOCLUBes es la app para moteros: planifica rutas, navega con GPS pensado para la moto, rueda en grupo con mapa y radio y comparte tus rutas con la comunidad.":
   "MOTOCLUBes est l'app des motards : préparez vos itinéraires, naviguez avec un GPS pensé pour la moto, roulez en groupe avec carte et radio et partagez vos parcours avec la communauté.",
 "Te avisa de los radares fijos y de tramo y del límite antes de que baje, con ruta o sin ella. En Francia, las zonas de peligro, como marca su ley.":
   "Vous prévient des radars fixes et de tronçon et de la limite avant qu'elle ne baisse, avec ou sans itinéraire. En France, les zones de danger, comme le veut la loi.",
 "Ranking, logros y retos":
   "Classement, trophées et défis",
 "Kilómetros, curvas, provincias, puertos, motos y grupos: el ranking del mes y el de siempre, con sus hitos.":
   "Kilomètres, virages, provinces, cols, motos et groupes : le classement du mois et celui de toujours, avec leurs paliers.",
 "No. Vale cualquier intercomunicador Bluetooth que ya lleves en el casco, sea de la marca que sea. La voz del grupo va por los datos del móvil, así que no depende del alcance del aparato: mientras haya cobertura, seguís hablando. Sin intercomunicador oyes al grupo, pero para hablar hace falta.":
   "Non. N'importe quel intercom Bluetooth que vous avez déjà dans le casque fait l'affaire, quelle que soit la marque. La voix du groupe passe par les données du téléphone : elle ne dépend pas de la portée de l'appareil, tant qu'il y a du réseau vous continuez à parler. Sans intercom vous entendez le groupe, mais pour parler il en faut un.",
 "No. Solo te ven los compañeros de tu salida, y solo mientras dura. Y si no quieres compartir tu posición, lo apagas en tu perfil.":
   "Non. Seuls les membres de votre sortie vous voient, et seulement pendant qu’elle dure. Et si vous ne voulez pas partager votre position, vous la désactivez dans votre profil.",
 "¿Funciona fuera de España?":
   "Ça marche en dehors de l'Espagne ?",
 "Sí. Los mapas, el planificador y la navegación valen en toda Europa, y el tiempo de tu salida también. Las gasolineras con su precio, en España, Francia, Portugal y Andorra. Los radares, en España, y en Francia las zonas de peligro, como marca su ley.":
   "Oui. Les cartes, le planificateur et la navigation fonctionnent dans toute l'Europe, tout comme la météo de votre sortie. Les stations-service avec leurs prix en Espagne, en France, au Portugal et en Andorre. Les radars en Espagne, et en France les zones de danger, comme le veut la loi.",
 "¿Tienes una duda o un problema?":
   "Une question ou un problème ?",
 "Escríbenos por WhatsApp al 653 835 720 o a soporte@motoclubes.es. Te contestamos lo antes posible.":
   "Écrivez-nous sur WhatsApp au +34 653 835 720 ou à soporte@motoclubes.es. Nous vous répondons au plus vite.",
 "💬 Escríbenos por WhatsApp":
   "💬 Écrivez-nous sur WhatsApp",
 "¿Cuándo sales? El tiempo por el camino":
   "Vous partez quand ? La météo sur la route",
 "Pon el día y la hora de tu salida: el día antes y esa misma mañana te avisamos del tiempo que te espera por la ruta.":
   "Indiquez le jour et l'heure de votre sortie : la veille et le matin même, on vous prévient de la météo qui vous attend sur l'itinéraire.",
 "Curvas, con autopista donde quieras":
   "Des virages, et l'autoroute où vous voulez",
 "En una ruta de curvas o de pista, marca los tramos que prefieres hacer por autopista para llegar antes a lo bueno.":
   "Sur un itinéraire sinueux ou tout-terrain, marquez les tronçons que vous préférez faire par l'autoroute pour arriver plus vite au meilleur.",
 "Cuentas del viaje":
   "Les comptes du voyage",
 "Cada uno apunta lo que paga (gasolina, comidas, hotel…) y la app dice quién debe a quién.":
   "Chacun note ce qu'il paie (essence, repas, hôtel…) et l'app dit qui doit combien à qui.",
 "Graba con el mapa delante":
   "Enregistrez avec la carte sous les yeux",
 "Graba tu salida viendo tu línea y los radares. Y si sales de la pantalla para usar la app, la grabación sigue.":
   "Enregistrez votre sortie en voyant votre tracé et les alertes. Et si vous quittez l'écran pour utiliser l'app, l'enregistrement continue.",
 "¿Llegas tarde? Únete por el camino":
   "En retard ? Rejoignez en route",
 "Si arrancas lejos del punto de encuentro, eliges dónde te unes al grupo y, mientras, te llevamos hasta allí.":
   "Si vous partez loin du point de rendez-vous, vous choisissez où rejoindre le groupe et, en attendant, on vous y guide.",
 "Radares y límite de velocidad":
   "Radars et limitation de vitesse"
}

PT = {
 "MOTOCLUBes — La app que viaja contigo | Rutas, navegación y comunidad motera":
   "MOTOCLUBes — A app que viaja contigo | Rotas, navegação e comunidade motard",
 "MOTOCLUBes es la app para moteros: planifica rutas, navega con GPS pensado para la moto, rueda en grupo con intercom y comparte tus rutas con la comunidad.":
   "MOTOCLUBes é a app para motards: planeia rotas, navega com GPS pensado para a mota, anda em grupo com intercomunicador e partilha as tuas rotas com a comunidade.",
 "Qué es":"A app", "Funciones":"Funções", "Proyecto":"O projeto", "Preguntas":"Perguntas",
 "Negocios":"Negócios", "Descarga":"Descarregar",
 "Planificar":"Planear", "🖥️ Planifica en el ordenador":"🖥️ Planeia no computador",  # PLANIFICAR-WEB-ENLACE-1 (127.ª)
 "La app que viaja contigo.":"A app que viaja contigo.",
 "Tu club. Tus rutas. Tu comunidad.":"O teu clube. As tuas rotas. A tua comunidade.",
 "Ver qué hace":"Ver o que faz", "Soy un negocio":"Tenho um negócio",
 "Estamos rodando la app con riders reales antes de abrirla al público.":
   "Estamos a testar a app na estrada com motards reais antes de a abrir ao público.",
 "Una app hecha por moteros, para moteros":"Uma app feita por motards, para motards",
 "MOTOCLUBes junta en un solo sitio las tres cosas que hoy están repartidas entre cinco aplicaciones distintas: planificar la ruta, navegarla en moto y rodarla con tu gente.":
   "A MOTOCLUBes junta num só sítio as três coisas que hoje andam espalhadas por cinco aplicações: planear a rota, navegá-la de mota e andá-la com a tua gente.",
 "Planifica":"Planeia",
 "Diseña la ruta por curvas, secundarias o sin peajes. Añade paradas de gasolinera, restaurante u hotel. Importa tus GPX de siempre.":
   "Traça a rota pelas curvas, por estradas secundárias ou sem portagens. Acrescenta paragens de bomba, restaurante ou hotel. Importa os teus GPX de sempre.",
 "Navega":"Navega",
 "Navegación GPS pensada para la moto, con la pantalla encendida, funcionando en segundo plano y con la voz preparada para el intercomunicador.":
   "Navegação GPS pensada para a mota, com o ecrã ligado, a funcionar em segundo plano e com a voz preparada para o intercomunicador.",
 "Rueda en grupo":"Anda em grupo",
 "Crea el grupo, publica la salida, y en ruta todos se ven en el mapa y hablan por el intercom de la propia app.":
   "Cria o grupo, publica a saída, e na estrada todos se veem no mapa e falam pelo intercomunicador da própria app.",
 "Todo lo que puedes hacer":"Tudo o que podes fazer",
 "Lo que ya está construido y funcionando en la app, y lo que llega después.":
   "O que já está construído e a funcionar na app, e o que vem a seguir.",
 "Tus rutas":"As tuas rotas",
 "Planificador de varios días":"Planeador de vários dias",
 "Etapas con su color, kilómetros y tiempo calculados, y el resumen de toda la salida en un mapa.":
   "Etapas com a sua cor, quilómetros e tempo calculados, e o resumo de toda a saída num mapa.",
 "Importa, edita y exporta GPX":"Importa, edita e exporta GPX",
 "No solo verlos: traes tu GPX, lo retocas a tu gusto y te lo llevas otra vez cuando quieras.":
   "Não é só vê-los: trazes o teu GPX, mexes-lhe à tua maneira e levas-o outra vez quando quiseres.",
 "Paradas y puntos de paso":"Paragens e pontos de passagem",
 "Gasolinera, restaurante, hotel o sitio que te apetece ver. Y los puntos por los que solo pasas no ensucian el mapa.":
   "Bomba, restaurante, hotel ou sítio que te apetece ver. E os pontos por onde só passas não sujam o mapa.",
 "Buscador de puertos":"Pesquisa de portos de montanha",
 "15.478 puertos y collados de España y Francia, buscables por nombre aunque te comas los acentos.":
   "15 478 portos e colos de Espanha e França, pesquisáveis pelo nome mesmo sem os acentos.",
 "El perfil real de la ruta":"O perfil real da rota",
 "Desnivel acumulado de subida y de bajada, altitud máxima y mínima, y las curvas contadas una a una.":
   "Desnível acumulado de subida e de descida, altitude máxima e mínima, e as curvas contadas uma a uma.",
 "Vuela la ruta antes de hacerla":"Sobrevoa a rota antes de a fazer",
 "Vista aérea a vista de dron de todo el recorrido, para ver por dónde vas a pasar sin salir de casa.":
   "Vista aérea, como um drone, de todo o percurso, para veres por onde vais passar sem saíres de casa.",
 "En carretera":"Na estrada",
 "Navegación pensada para la moto":"Navegação pensada para a mota",
 "Sigue en segundo plano, con la pantalla activa y el GPS continuo aunque bloquees el móvil.":
   "Continua em segundo plano, com o ecrã ativo e o GPS contínuo mesmo com o telemóvel bloqueado.",
 "Intercom del grupo":"Intercomunicador do grupo",
 "Voz entre los riders de la salida por los datos del móvil. Cualquier casco, cualquier marca.":
   "Voz entre os motards da saída pelos dados do telemóvel. Qualquer capacete, qualquer marca.",
 "Seguimiento en vivo":"Seguimento em direto",
 "Durante la salida cada uno ve dónde va el resto. Se activa en el grupo y se desactiva en tu perfil.":
   "Durante a saída cada um vê onde vão os outros. Ativa-se no grupo e desativa-se no teu perfil.",
 "Gasolineras de cuatro países":"Bombas de quatro países",
 "Más de 24.000 en España, Francia, Portugal y Andorra, con el precio actualizado cada mañana y la fecha a la vista. Al acercarte a la frontera salen las de los dos lados.":
   "Mais de 24 000 em Portugal, Espanha, França e Andorra, com o preço atualizado todas as manhãs e a data à vista. Ao aproximares-te da fronteira aparecem as dos dois lados.",
 "Tus lugares":"Os teus lugares",
 "Casa, trabajo y tus sitios de siempre, puestos con el dedo en el mapa: la entrada del garaje no es lo que devuelve un buscador.":
   "Casa, trabalho e os teus sítios do costume, postos com o dedo no mapa: a entrada da garagem não é o que um motor de busca devolve.",
 "CarPlay":"CarPlay",
 "Apple ya ha autorizado la navegación en CarPlay. Está en construcción.":
   "A Apple já autorizou a navegação no CarPlay. Está em construção.",
 "Próximamente":"Em breve",
 "Comunidad":"Comunidade",
 "Pública o privada, tú decides":"Pública ou privada, decides tu",
 "Cada ruta se publica o se queda para ti. Y lo puedes cambiar cuando quieras.":
   "Cada rota é publicada ou fica só para ti. E podes mudar quando quiseres.",
 "Aplausos y comentarios":"Aplausos e comentários",
 "Las rutas que publicas se aplauden, se comentan y se guardan en favoritos.":
   "As rotas que publicas são aplaudidas, comentadas e guardadas nos favoritos.",
 "Las fotos de la salida":"As fotos da saída",
 "El álbum del día queda colgado de la ruta, no perdido en un grupo de WhatsApp.":
   "O álbum do dia fica ligado à rota, não perdido num grupo de WhatsApp.",
 "Logros y retos":"Conquistas e desafios",
 "Kilómetros, curvas y provincias visitadas, con sus hitos.":
   "Quilómetros, curvas e distritos visitados, com os seus marcos.",
 "Foro de la comunidad":"Fórum da comunidade",
 "Preguntas, rutas recomendadas y lo que salga, con moderación de verdad.":
   "Perguntas, rotas recomendadas e o que aparecer, com moderação a sério.",
 "Rider Friendly":"Rider Friendly",
 "El directorio de bares, hoteles y talleres que tratan bien al motero.":
   "O diretório de bares, hotéis e oficinas que tratam bem os motards.",
 "El proyecto":"O projeto",
 "Cómo está MOTOCLUBes hoy":"Como está a MOTOCLUBes hoje",
 "Somos una empresa tecnológica española, con sede en Barcelona y un producto propio en desarrollo continuo. Esto es lo que hay construido, sin adornos.":
   "Somos uma empresa tecnológica espanhola, com sede em Barcelona e um produto próprio em desenvolvimento contínuo. Isto é o que está construído, sem enfeites.",
 "App nativa":"App nativa", "iOS y Android":"iOS e Android",
 "Infraestructura":"Infraestrutura", "Propia, de extremo a extremo":"Própria, de ponta a ponta",
 "Pruebas":"Testes", "Con riders reales en carretera":"Com motards reais na estrada",
 "Portal de negocios":"Portal de negócios", "En funcionamiento":"A funcionar",
 "Por qué existe":"Porque existe",
 "La ruta, el grupo y la voz nunca están en el mismo sitio":
   "A rota, o grupo e a voz nunca estão no mesmo sítio",
 "Quien viaja en moto lo conoce: la ruta en una app, la quedada en un grupo de WhatsApp, la voz en un intercomunicador que no se habla con el del de al lado, y a mitad de camino nadie sabe dónde está el resto. Cinco herramientas para una sola salida.":
   "Quem anda de mota conhece isto: a rota numa app, o encontro num grupo de WhatsApp, a voz num intercomunicador que não fala com o do lado, e a meio do caminho ninguém sabe onde estão os outros. Cinco ferramentas para uma só saída.",
 "MOTOCLUBes nace de ahí. No de añadir una app más, sino de que planificar la ruta, navegarla y rodarla con tu gente dejen de ser tres cosas separadas. Lo construimos moteros, se prueba en carretera, y seguimos en ello.":
   "A MOTOCLUBes nasce daí. Não de acrescentar mais uma app, mas de fazer com que planear a rota, navegá-la e andá-la com a tua gente deixem de ser três coisas separadas. Construímo-la nós, motards, testa-se na estrada, e continuamos.",
 "El equipo de MOTOCLUBes":"A equipa MOTOCLUBes",
 "Moteros · MOTOCLUBES TECH S.L., Barcelona":"Motards · MOTOCLUBES TECH S.L., Barcelona",
 "¿Tienes un bar, un hotel o un taller?":"Tens um bar, um hotel ou uma oficina?",
 "Los moteros paran donde se les trata bien. El portal Rider Friendly te deja darte de alta, publicar tus ofertas y validarlas con un código cuando el rider llega a tu puerta.":
   "Os motards param onde são bem tratados. O portal Rider Friendly deixa-te inscrever, publicar as tuas ofertas e validá-las com um código quando o motard chega à tua porta.",
 "Entrar al portal de negocios":"Entrar no portal de negócios",
 "Preguntas frecuentes":"Perguntas frequentes", "Lo que nos preguntáis":"O que nos perguntam",
 "¿Cuándo la puedo descargar?":"Quando é que a posso descarregar?",
 "Está terminando su fase de pruebas en carretera con riders reales. En cuanto esté publicada en App Store y en Google Play, los dos enlaces aparecerán en esta misma página.":
   "Está a terminar a fase de testes na estrada com motards reais. Assim que estiver publicada na App Store e no Google Play, os dois links aparecem nesta mesma página.",
 "¿Necesito un intercomunicador de 400 €?":"Preciso de um intercomunicador de 400 €?",
 "No. La voz del grupo va por los datos del móvil, así que vale cualquier auricular o intercomunicador Bluetooth que ya tengas en el casco, sea de la marca que sea. Y no depende del alcance del aparato: mientras haya cobertura, seguís hablando.":
   "Não. A voz do grupo vai pelos dados do telemóvel, por isso serve qualquer auricular ou intercomunicador Bluetooth que já tenhas no capacete, seja de que marca for. E não depende do alcance do aparelho: enquanto houver rede, continuam a falar.",
 "¿Funciona con el móvil guardado y la pantalla bloqueada?":"Funciona com o telemóvel guardado e o ecrã bloqueado?",
 "Sí. La navegación sigue funcionando en segundo plano con el GPS activo, que es justo lo que hace falta cuando el teléfono va en el bolsillo o en el soporte con la pantalla apagada.":
   "Sim. A navegação continua a funcionar em segundo plano com o GPS ativo, que é precisamente o que é preciso quando o telemóvel vai no bolso ou no suporte com o ecrã apagado.",
 "¿Puedo traerme las rutas que ya tengo?":"Posso trazer as rotas que já tenho?",
 "Sí. Importas tus GPX de siempre y te llevas las nuevas en GPX cuando quieras. Tus rutas son tuyas y salen por donde entraron.":
   "Sim. Importas os teus GPX de sempre e levas as novas em GPX quando quiseres. As tuas rotas são tuas e saem por onde entraram.",
 "¿Todo el mundo ve dónde estoy?":"Toda a gente vê onde estou?",
 "No por defecto. El seguimiento en vivo solo funciona durante una salida, hay que activarlo en el grupo, y además cada rider tiene su propio interruptor en el perfil para no compartir su posición aunque el grupo lo tenga puesto.":
   "Não por omissão. O seguimento em direto só funciona durante uma saída, tem de ser ativado no grupo, e além disso cada motard tem o seu próprio interruptor no perfil para não partilhar a posição mesmo que o grupo o tenha ligado.",
 "¿Es solo para clubes con chaleco y parches?":"É só para clubes com colete e emblemas?",
 "No. Vale igual para un club con su estructura que para cuatro amigos que salen a desayunar el domingo. Un grupo es simplemente la gente con la que ruedas.":
   "Não. Serve tanto para um clube com a sua estrutura como para quatro amigos que saem para tomar o pequeno-almoço ao domingo. Um grupo é simplesmente a gente com quem andas.",
 "¿Y si mi grupo va con iPhone y con Android?":"E se o meu grupo tem iPhone e Android?",
 "Da igual. La app es nativa en las dos plataformas y todo funciona entre ellas: el grupo, la salida, el mapa y la voz.":
   "Tanto faz. A app é nativa nas duas plataformas e tudo funciona entre elas: o grupo, a saída, o mapa e a voz.",
 "¿Quién está detrás de esto?":"Quem está por trás disto?",
 "MOTOCLUBES TECH S.L., una empresa con sede en Barcelona. Producto propio, infraestructura propia y desarrollo continuo. No somos el proyecto paralelo de nadie.":
   "MOTOCLUBES TECH S.L., uma empresa com sede em Barcelona. Produto próprio, infraestrutura própria e desenvolvimento contínuo. Não somos o projeto paralelo de ninguém.",
 "Próximamente en las dos tiendas":"Em breve nas duas lojas",
 "La app está terminando su fase de pruebas. Cuando esté publicada, aquí estarán los dos enlaces.":
   "A app está a terminar a fase de testes. Quando estiver publicada, os dois links estarão aqui.",
 "Próximamente en":"Em breve na",
 "Producto":"Produto", "Darse de baja":"Cancelar a conta", "Legal":"Legal",
 "Aviso legal":"Aviso legal", "Privacidad":"Privacidade", "Cookies":"Cookies",
 "Términos":"Termos", "Normas del foro":"Regras do fórum",
 "Contacto":"Contacto", "Soporte y dudas:":"Apoio e dúvidas:",
 # WEB-REPASO-142 (9-nov-2026): Android Auto, radio del grupo, preguntas nuevas, 1.26.1108
 "CarPlay y Android Auto":
   "CarPlay e Android Auto",
 "La ruta, los giros, las paradas, los radares y tus compañeros en la pantalla de la moto o del coche. Y sin ruta, el mapa con los radares.":
   "A rota, as mudanças de direção, as paragens, os radares e os teus companheiros no ecrã da mota ou do carro. E sem rota, o mapa com os radares.",
 "Radio del grupo":
   "Rádio do grupo",
 "Habláis todos por el intercomunicador que ya lleváis, de la marca que sea, por los datos del móvil. Sin intercomunicador, oyes al grupo.":
   "Falam todos pelo intercomunicador que já usam, seja de que marca for, através dos dados do telemóvel. Sem intercomunicador, ouves o grupo.",
 "Crea el grupo, publica la salida, y en ruta todos se ven en el mapa y hablan por la radio del grupo.":
   "Cria o grupo, publica a saída, e na estrada todos se veem no mapa e falam pelo rádio do grupo.",
 "MOTOCLUBes es la app para moteros: planifica rutas, navega con GPS pensado para la moto, rueda en grupo con mapa y radio y comparte tus rutas con la comunidad.":
   "MOTOCLUBes é a app para motociclistas: planeia rotas, navega com GPS pensado para a mota, anda em grupo com mapa e rádio e partilha as tuas rotas com a comunidade.",
 "Te avisa de los radares fijos y de tramo y del límite antes de que baje, con ruta o sin ella. En Francia, las zonas de peligro, como marca su ley.":
   "Avisa-te dos radares fixos e de troço e do limite antes de baixar, com ou sem rota. Em França, as zonas de perigo, como manda a lei.",
 "Ranking, logros y retos":
   "Ranking, conquistas e desafios",
 "Kilómetros, curvas, provincias, puertos, motos y grupos: el ranking del mes y el de siempre, con sus hitos.":
   "Quilómetros, curvas, províncias, passos de montanha, motas e grupos: o ranking do mês e o de sempre, com as suas metas.",
 "No. Vale cualquier intercomunicador Bluetooth que ya lleves en el casco, sea de la marca que sea. La voz del grupo va por los datos del móvil, así que no depende del alcance del aparato: mientras haya cobertura, seguís hablando. Sin intercomunicador oyes al grupo, pero para hablar hace falta.":
   "Não. Serve qualquer intercomunicador Bluetooth que já tenhas no capacete, seja de que marca for. A voz do grupo vai pelos dados do telemóvel, por isso não depende do alcance do aparelho: enquanto houver rede, continuam a falar. Sem intercomunicador ouves o grupo, mas para falar precisas de um.",
 "No. Solo te ven los compañeros de tu salida, y solo mientras dura. Y si no quieres compartir tu posición, lo apagas en tu perfil.":
   "Não. Só te veem os companheiros da tua saída, e só enquanto dura. E se não quiseres partilhar a tua posição, desligas no teu perfil.",
 "¿Funciona fuera de España?":
   "Funciona fora de Espanha?",
 "Sí. Los mapas, el planificador y la navegación valen en toda Europa, y el tiempo de tu salida también. Las gasolineras con su precio, en España, Francia, Portugal y Andorra. Los radares, en España, y en Francia las zonas de peligro, como marca su ley.":
   "Sim. Os mapas, o planeador e a navegação funcionam em toda a Europa, e a meteorologia da tua saída também. Os postos de combustível com o preço, em Espanha, França, Portugal e Andorra. Os radares, em Espanha, e em França as zonas de perigo, como manda a lei.",
 "¿Tienes una duda o un problema?":
   "Tens uma dúvida ou um problema?",
 "Escríbenos por WhatsApp al 653 835 720 o a soporte@motoclubes.es. Te contestamos lo antes posible.":
   "Escreve-nos por WhatsApp para o +34 653 835 720 ou para soporte@motoclubes.es. Respondemos o mais depressa possível.",
 "💬 Escríbenos por WhatsApp":
   "💬 Escreve-nos por WhatsApp",
 "¿Cuándo sales? El tiempo por el camino":
   "Quando sais? O tempo pelo caminho",
 "Pon el día y la hora de tu salida: el día antes y esa misma mañana te avisamos del tiempo que te espera por la ruta.":
   "Põe o dia e a hora da tua saída: na véspera e nessa mesma manhã avisamos-te do tempo que te espera pela rota.",
 "Curvas, con autopista donde quieras":
   "Curvas, com autoestrada onde quiseres",
 "En una ruta de curvas o de pista, marca los tramos que prefieres hacer por autopista para llegar antes a lo bueno.":
   "Numa rota de curvas ou de terra, marca os troços que preferes fazer por autoestrada para chegares mais depressa ao que interessa.",
 "Cuentas del viaje":
   "Contas da viagem",
 "Cada uno apunta lo que paga (gasolina, comidas, hotel…) y la app dice quién debe a quién.":
   "Cada um aponta o que paga (combustível, refeições, hotel…) e a app diz quem deve a quem.",
 "Graba con el mapa delante":
   "Grava com o mapa à frente",
 "Graba tu salida viendo tu línea y los radares. Y si sales de la pantalla para usar la app, la grabación sigue.":
   "Grava a tua saída a ver a tua linha e os radares. E se saíres do ecrã para usar a app, a gravação continua.",
 "¿Llegas tarde? Únete por el camino":
   "Chegas tarde? Junta-te pelo caminho",
 "Si arrancas lejos del punto de encuentro, eliges dónde te unes al grupo y, mientras, te llevamos hasta allí.":
   "Se arrancas longe do ponto de encontro, escolhes onde te juntas ao grupo e, entretanto, levamos-te até lá.",
 "Radares y límite de velocidad":
   "Radares e limite de velocidade"
}

# 🆕 IDIOMAS-PT-IT-1 (142.ª, 9-nov-2026): lo que faltaba en francés y portugués (menú, pie, formulario de aviso, enlaces de
# las páginas de SEO, la frase de los 6 idiomas) y el italiano entero. Las palabras cortas van entre > < (o como atributo) para no
# cambiar otros textos que las contengan. Traducciones de Claude (revisadas por un segundo agente), sin revisar por un nativo.
FR.update({
 ">Avísame<": ">Prévenez-moi<",
 "Avísame cuando salga": "Prévenez-moi à sa sortie",
 "Bares, hoteles y talleres que tratan bien al motero, para parar con el grupo.": "Des bars, hôtels et garages qui traitent bien les motards, pour s'arrêter avec le groupe.",
 "Cómo funciona Rider Friendly": "Comment fonctionne Rider Friendly",
 "Déjanos tu correo y te avisamos el día que salga.": "Laissez-nous votre e-mail et on vous prévient le jour de sa sortie.",
 "Entrar al portal": "Accéder au portail",
 "He leído y acepto la": "J'ai lu et j'accepte la",
 "La app está en pruebas cerradas": "L'app est en bêta fermée",
 "aria-label=\"Menú\"": "aria-label=\"Menu\"",
 "Motoclubs y grupos": "Motos-clubs et groupes",
 "Más sobre el navegador GPS para moto →": "En savoir plus sur le GPS moto →",
 "Más sobre el planificador de rutas para moto →": "En savoir plus sur le planificateur d'itinéraires moto →",
 "Navegador GPS para moto": "GPS pour moto",
 "Para motoclubs →": "Pour les motos-clubs →",
 ">Por dentro<": ">À l'intérieur<",
 "Quiero probarla antes, como tester": "Je veux l'essayer en avant-première, comme testeur",
 ">Rutas en moto<": ">Itinéraires moto<",
 "Salir en grupo en moto": "Rouler en groupe à moto",
 "Salir en grupo en moto →": "Rouler en groupe à moto →",
 "aria-label=\"Tu correo\"": "aria-label=\"Votre e-mail\"",
 "política de privacidad": "politique de confidentialité",
 "Y la app habla tu idioma: castellano, catalán, inglés, francés, portugués e italiano.": "Et l'app parle votre langue : espagnol, catalan, anglais, français, portugais et italien.",
 "\"¡Hecho! Te hemos mandado un correo: pulsa el enlace para confirmar.\"": "\"C’est fait ! Nous vous avons envoyé un e-mail : appuyez sur le lien pour confirmer.\"",
 "\"No se ha podido enviar. Inténtalo de nuevo en un momento.\"": "\"L’envoi a échoué. Réessayez dans un instant.\"",
 "\"Revisa el correo, parece que no está bien escrito.\"": "\"Vérifiez l’adresse e-mail, elle semble mal écrite.\"",
 "\"Marca la casilla de privacidad para poder avisarte.\"": "\"Cochez la case de confidentialité pour que nous puissions vous prévenir.\""
})
PT.update({
 ">Avísame<": ">Avisa-me<",
 "Avísame cuando salga": "Avisa-me quando sair",
 "Bares, hoteles y talleres que tratan bien al motero, para parar con el grupo.": "Bares, hotéis e oficinas que tratam bem os motards, para parar com o grupo.",
 "Cómo funciona Rider Friendly": "Como funciona o Rider Friendly",
 "Déjanos tu correo y te avisamos el día que salga.": "Deixa-nos o teu e-mail e avisamos-te no dia em que sair.",
 "Entrar al portal": "Entrar no portal",
 "He leído y acepto la": "Li e aceito a",
 "La app está en pruebas cerradas": "A app está em testes fechados",
 "aria-label=\"Menú\"": "aria-label=\"Menu\"",
 "Motoclubs y grupos": "Motoclubes e grupos",
 "Más sobre el navegador GPS para moto →": "Mais sobre o navegador GPS para mota →",
 "Más sobre el planificador de rutas para moto →": "Mais sobre o planeador de rotas para mota →",
 "Navegador GPS para moto": "Navegador GPS para mota",
 "Para motoclubs →": "Para motoclubes →",
 ">Por dentro<": ">Por dentro<",
 "Quiero probarla antes, como tester": "Quero experimentá-la antes, como tester",
 ">Rutas en moto<": ">Rotas de mota<",
 "Salir en grupo en moto": "Sair em grupo de mota",
 "Salir en grupo en moto →": "Sair em grupo de mota →",
 "aria-label=\"Tu correo\"": "aria-label=\"O teu e-mail\"",
 "política de privacidad": "política de privacidade",
 "Y la app habla tu idioma: castellano, catalán, inglés, francés, portugués e italiano.": "E a app fala a tua língua: castelhano, catalão, inglês, francês, português e italiano.",
 "\"¡Hecho! Te hemos mandado un correo: pulsa el enlace para confirmar.\"": "\"Feito! Enviámos-te um e-mail: carrega no link para confirmar.\"",
 "\"No se ha podido enviar. Inténtalo de nuevo en un momento.\"": "\"Não foi possível enviar. Tenta novamente daqui a pouco.\"",
 "\"Revisa el correo, parece que no está bien escrito.\"": "\"Revê o e-mail, parece que não está bem escrito.\"",
 "\"Marca la casilla de privacidad para poder avisarte.\"": "\"Marca a caixa da privacidade para te podermos avisar.\""
})
IT = {
 "MOTOCLUBes — La app que viaja contigo | Rutas, navegación y comunidad motera": "MOTOCLUBes — L'app che viaggia con te | Percorsi, navigazione e community dei biker",
 "MOTOCLUBes es la app para moteros: planifica rutas, navega con GPS pensado para la moto, rueda en grupo con intercom y comparte tus rutas con la comunidad.": "MOTOCLUBes è l'app per i biker: pianifica percorsi, naviga con un GPS pensato per la moto, viaggia in gruppo con l'interfono e condividi i tuoi percorsi con la community.",
 "Qué es": "L'app",
 "Funciones": "Funzioni",
 "Proyecto": "Il progetto",
 "Preguntas": "Domande",
 "Negocios": "Attività",
 "Descarga": "Scarica",
 "Planificar": "Pianifica",
 "🖥️ Planifica en el ordenador": "🖥️ Pianifica dal computer",
 "La app que viaja contigo.": "L'app che viaggia con te.",
 "Tu club. Tus rutas. Tu comunidad.": "Il tuo club. I tuoi percorsi. La tua community.",
 "Ver qué hace": "Guarda cosa fa",
 "Soy un negocio": "Ho un'attività",
 "Estamos rodando la app con riders reales antes de abrirla al público.": "Stiamo provando l'app su strada con biker veri prima di aprirla al pubblico.",
 "Una app hecha por moteros, para moteros": "Un'app fatta da biker, per i biker",
 "MOTOCLUBes junta en un solo sitio las tres cosas que hoy están repartidas entre cinco aplicaciones distintas: planificar la ruta, navegarla en moto y rodarla con tu gente.": "MOTOCLUBes riunisce in un solo posto le tre cose che oggi sono sparse tra cinque app diverse: pianificare il percorso, navigarlo in moto e farlo con la tua gente.",
 "Planifica": "Pianifica",
 "Diseña la ruta por curvas, secundarias o sin peajes. Añade paradas de gasolinera, restaurante u hotel. Importa tus GPX de siempre.": "Disegna il percorso tra le curve, per strade secondarie o senza pedaggi. Aggiungi soste al distributore, al ristorante o in hotel. Importa i tuoi GPX di sempre.",
 "Navega": "Naviga",
 "Navegación GPS pensada para la moto, con la pantalla encendida, funcionando en segundo plano y con la voz preparada para el intercomunicador.": "Navigazione GPS pensata per la moto, con lo schermo acceso, attiva in background e con la voce pronta per l'interfono.",
 "Rueda en grupo": "Viaggia in gruppo",
 "Crea el grupo, publica la salida, y en ruta todos se ven en el mapa y hablan por el intercom de la propia app.": "Crea il gruppo, pubblica l'uscita e in strada tutti si vedono sulla mappa e parlano con l'interfono dell'app stessa.",
 "Todo lo que puedes hacer": "Tutto quello che puoi fare",
 "Lo que ya está construido y funcionando en la app, y lo que llega después.": "Quello che è già costruito e funziona nell'app, e quello che arriva dopo.",
 "Tus rutas": "I tuoi percorsi",
 "Planificador de varios días": "Pianificatore per più giorni",
 "Etapas con su color, kilómetros y tiempo calculados, y el resumen de toda la salida en un mapa.": "Tappe con il loro colore, chilometri e tempi calcolati, e il riepilogo di tutta l'uscita su una mappa.",
 "Importa, edita y exporta GPX": "Importa, modifica ed esporta GPX",
 "No solo verlos: traes tu GPX, lo retocas a tu gusto y te lo llevas otra vez cuando quieras.": "Non solo vederli: porti il tuo GPX, lo ritocchi a tuo gusto e te lo riporti via quando vuoi.",
 "Paradas y puntos de paso": "Soste e punti di passaggio",
 "Gasolinera, restaurante, hotel o sitio que te apetece ver. Y los puntos por los que solo pasas no ensucian el mapa.": "Distributore, ristorante, hotel o un posto che ti va di vedere. E i punti dove passi soltanto non ingombrano la mappa.",
 "Buscador de puertos": "Ricerca dei passi",
 "15.478 puertos y collados de España y Francia, buscables por nombre aunque te comas los acentos.": "15.478 passi e valichi di Spagna e Francia, cercabili per nome anche se salti gli accenti.",
 "El perfil real de la ruta": "Il vero profilo del percorso",
 "Desnivel acumulado de subida y de bajada, altitud máxima y mínima, y las curvas contadas una a una.": "Dislivello accumulato in salita e in discesa, altitudine massima e minima, e le curve contate una per una.",
 "Vuela la ruta antes de hacerla": "Sorvola il percorso prima di farlo",
 "Vista aérea a vista de dron de todo el recorrido, para ver por dónde vas a pasar sin salir de casa.": "Vista aerea, come da un drone, di tutto il percorso, per vedere dove passerai senza uscire di casa.",
 "En carretera": "Su strada",
 "Navegación pensada para la moto": "Navigazione pensata per la moto",
 "Sigue en segundo plano, con la pantalla activa y el GPS continuo aunque bloquees el móvil.": "Continua in background, con lo schermo attivo e il GPS sempre acceso anche se blocchi il telefono.",
 "Intercom del grupo": "Interfono del gruppo",
 "Voz entre los riders de la salida por los datos del móvil. Cualquier casco, cualquier marca.": "Voce tra i biker dell'uscita tramite i dati del telefono. Qualsiasi casco, qualsiasi marca.",
 "Seguimiento en vivo": "Posizione in tempo reale",
 "Durante la salida cada uno ve dónde va el resto. Se activa en el grupo y se desactiva en tu perfil.": "Durante l'uscita ognuno vede dove sono gli altri. Si attiva nel gruppo e si disattiva nel tuo profilo.",
 "Gasolineras de cuatro países": "Distributori di quattro paesi",
 "Más de 24.000 en España, Francia, Portugal y Andorra, con el precio actualizado cada mañana y la fecha a la vista. Al acercarte a la frontera salen las de los dos lados.": "Più di 24.000 in Spagna, Francia, Portogallo e Andorra, con il prezzo aggiornato ogni mattina e la data ben visibile. Vicino al confine compaiono quelli di entrambi i lati.",
 "Tus lugares": "I tuoi luoghi",
 "Casa, trabajo y tus sitios de siempre, puestos con el dedo en el mapa: la entrada del garaje no es lo que devuelve un buscador.": "Casa, lavoro e i tuoi posti di sempre, messi col dito sulla mappa: l'ingresso del garage non è quello che ti restituisce un motore di ricerca.",
 "CarPlay": "CarPlay",
 "Apple ya ha autorizado la navegación en CarPlay. Está en construcción.": "Apple ha già autorizzato la navigazione su CarPlay. È in sviluppo.",
 "Próximamente": "Prossimamente",
 "Comunidad": "Community",
 "Pública o privada, tú decides": "Pubblico o privato, decidi tu",
 "Cada ruta se publica o se queda para ti. Y lo puedes cambiar cuando quieras.": "Ogni percorso si pubblica o resta solo tuo. E puoi cambiare idea quando vuoi.",
 "Aplausos y comentarios": "Applausi e commenti",
 "Las rutas que publicas se aplauden, se comentan y se guardan en favoritos.": "I percorsi che pubblichi si applaudono, si commentano e si salvano nei preferiti.",
 "Las fotos de la salida": "Le foto dell'uscita",
 "El álbum del día queda colgado de la ruta, no perdido en un grupo de WhatsApp.": "L'album della giornata resta legato al percorso, non perso in un gruppo WhatsApp.",
 "Logros y retos": "Traguardi e sfide",
 "Kilómetros, curvas y provincias visitadas, con sus hitos.": "Chilometri, curve e province visitate, con i loro obiettivi.",
 "Foro de la comunidad": "Forum della community",
 "Preguntas, rutas recomendadas y lo que salga, con moderación de verdad.": "Domande, percorsi consigliati e tutto quello che viene, con una moderazione vera.",
 "Rider Friendly": "Rider Friendly",
 "El directorio de bares, hoteles y talleres que tratan bien al motero.": "L'elenco di bar, hotel e officine che trattano bene i biker.",
 "El proyecto": "Il progetto",
 "Cómo está MOTOCLUBes hoy": "A che punto è MOTOCLUBes oggi",
 "Somos una empresa tecnológica española, con sede en Barcelona y un producto propio en desarrollo continuo. Esto es lo que hay construido, sin adornos.": "Siamo un'azienda tecnologica spagnola, con sede a Barcellona e un prodotto proprio in sviluppo continuo. Ecco cosa c'è di costruito, senza fronzoli.",
 "App nativa": "App nativa",
 "iOS y Android": "iOS e Android",
 "Infraestructura": "Infrastruttura",
 "Propia, de extremo a extremo": "Nostra, da un capo all'altro",
 "Pruebas": "Test",
 "Con riders reales en carretera": "Con biker veri su strada",
 "Portal de negocios": "Portale per le attività",
 "En funcionamiento": "Attivo",
 "Por qué existe": "Perché esiste",
 "La ruta, el grupo y la voz nunca están en el mismo sitio": "Il percorso, il gruppo e la voce non sono mai nello stesso posto",
 "Quien viaja en moto lo conoce: la ruta en una app, la quedada en un grupo de WhatsApp, la voz en un intercomunicador que no se habla con el del de al lado, y a mitad de camino nadie sabe dónde está el resto. Cinco herramientas para una sola salida.": "Chi viaggia in moto lo sa: il percorso in un'app, il ritrovo in un gruppo WhatsApp, la voce in un interfono che non parla con quello di chi ti sta accanto, e a metà strada nessuno sa dove sono gli altri. Cinque strumenti per una sola uscita.",
 "MOTOCLUBes nace de ahí. No de añadir una app más, sino de que planificar la ruta, navegarla y rodarla con tu gente dejen de ser tres cosas separadas. Lo construimos moteros, se prueba en carretera, y seguimos en ello.": "MOTOCLUBes nasce da qui. Non per aggiungere un'app in più, ma perché pianificare il percorso, navigarlo e farlo con la tua gente smettano di essere tre cose separate. La costruiamo noi biker, si prova su strada, e andiamo avanti.",
 "El equipo de MOTOCLUBes": "Il team di MOTOCLUBes",
 "Moteros · MOTOCLUBES TECH S.L., Barcelona": "Biker · MOTOCLUBES TECH S.L., Barcellona",
 "¿Tienes un bar, un hotel o un taller?": "Hai un bar, un hotel o un'officina?",
 "Los moteros paran donde se les trata bien. El portal Rider Friendly te deja darte de alta, publicar tus ofertas y validarlas con un código cuando el rider llega a tu puerta.": "I biker si fermano dove vengono trattati bene. Il portale Rider Friendly ti permette di registrarti, pubblicare le tue offerte e convalidarle con un codice quando il biker arriva alla tua porta.",
 "Entrar al portal de negocios": "Entra nel portale per le attività",
 "Preguntas frecuentes": "Domande frequenti",
 "Lo que nos preguntáis": "Quello che ci chiedete",
 "¿Cuándo la puedo descargar?": "Quando posso scaricarla?",
 "Está terminando su fase de pruebas en carretera con riders reales. En cuanto esté publicada en App Store y en Google Play, los dos enlaces aparecerán en esta misma página.": "Sta finendo la fase di test su strada con biker veri. Appena sarà pubblicata su App Store e Google Play, i due link compariranno in questa stessa pagina.",
 "¿Necesito un intercomunicador de 400 €?": "Mi serve un interfono da 400 €?",
 "No. La voz del grupo va por los datos del móvil, así que vale cualquier auricular o intercomunicador Bluetooth que ya tengas en el casco, sea de la marca que sea. Y no depende del alcance del aparato: mientras haya cobertura, seguís hablando.": "No. La voce del gruppo passa per i dati del telefono, quindi va bene qualsiasi auricolare o interfono Bluetooth che hai già nel casco, di qualunque marca. E non dipende dalla portata dell'apparecchio: finché c'è copertura, continuate a parlare.",
 "¿Funciona con el móvil guardado y la pantalla bloqueada?": "Funziona con il telefono in tasca e lo schermo bloccato?",
 "Sí. La navegación sigue funcionando en segundo plano con el GPS activo, que es justo lo que hace falta cuando el teléfono va en el bolsillo o en el soporte con la pantalla apagada.": "Sì. La navigazione continua a funzionare in background con il GPS attivo, che è proprio quello che serve quando il telefono è in tasca o sul supporto con lo schermo spento.",
 "¿Puedo traerme las rutas que ya tengo?": "Posso portarmi i percorsi che ho già?",
 "Sí. Importas tus GPX de siempre y te llevas las nuevas en GPX cuando quieras. Tus rutas son tuyas y salen por donde entraron.": "Sì. Importi i tuoi GPX di sempre e ti porti via i nuovi in GPX quando vuoi. I tuoi percorsi sono tuoi ed escono da dove sono entrati.",
 "¿Todo el mundo ve dónde estoy?": "Tutti vedono dove sono?",
 "No por defecto. El seguimiento en vivo solo funciona durante una salida, hay que activarlo en el grupo, y además cada rider tiene su propio interruptor en el perfil para no compartir su posición aunque el grupo lo tenga puesto.": "Non di default. La posizione in tempo reale funziona solo durante un'uscita, va attivata nel gruppo, e in più ogni biker ha il suo interruttore nel profilo per non condividere la propria posizione anche se il gruppo l'ha attivata.",
 "¿Es solo para clubes con chaleco y parches?": "È solo per club con gilet e toppe?",
 "No. Vale igual para un club con su estructura que para cuatro amigos que salen a desayunar el domingo. Un grupo es simplemente la gente con la que ruedas.": "No. Va bene sia per un club strutturato sia per quattro amici che la domenica escono a fare colazione. Un gruppo è semplicemente la gente con cui viaggi.",
 "¿Y si mi grupo va con iPhone y con Android?": "E se nel mio gruppo c'è chi ha iPhone e chi Android?",
 "Da igual. La app es nativa en las dos plataformas y todo funciona entre ellas: el grupo, la salida, el mapa y la voz.": "Non importa. L'app è nativa su entrambe le piattaforme e tutto funziona tra l'una e l'altra: il gruppo, l'uscita, la mappa e la voce.",
 "¿Quién está detrás de esto?": "Chi c'è dietro?",
 "MOTOCLUBES TECH S.L., una empresa con sede en Barcelona. Producto propio, infraestructura propia y desarrollo continuo. No somos el proyecto paralelo de nadie.": "MOTOCLUBES TECH S.L., un'azienda con sede a Barcellona. Prodotto proprio, infrastruttura propria e sviluppo continuo. Non siamo il progetto secondario di nessuno.",
 "Próximamente en las dos tiendas": "Presto su entrambi gli store",
 "La app está terminando su fase de pruebas. Cuando esté publicada, aquí estarán los dos enlaces.": "L'app sta finendo la fase di test. Quando sarà pubblicata, qui troverai i due link.",
 "Próximamente en": "Presto su",
 "Producto": "Prodotto",
 "Darse de baja": "Elimina account",
 "Legal": "Legale",
 "Aviso legal": "Note legali",
 "Privacidad": "Privacy",
 "Cookies": "Cookie",
 "Términos": "Termini",
 "Normas del foro": "Regole del forum",
 "Contacto": "Contatti",
 "Soporte y dudas:": "Supporto e domande:",
 "CarPlay y Android Auto": "CarPlay e Android Auto",
 "La ruta, los giros, las paradas, los radares y tus compañeros en la pantalla de la moto o del coche. Y sin ruta, el mapa con los radares.": "Il percorso, le svolte, le soste, gli autovelox e i tuoi compagni sullo schermo della moto o dell'auto. E senza percorso, la mappa con gli autovelox.",
 "Radio del grupo": "Radio del gruppo",
 "Habláis todos por el intercomunicador que ya lleváis, de la marca que sea, por los datos del móvil. Sin intercomunicador, oyes al grupo.": "Parlate tutti con l'interfono che avete già, di qualunque marca, tramite i dati del telefono. Senza interfono, senti il gruppo.",
 "Crea el grupo, publica la salida, y en ruta todos se ven en el mapa y hablan por la radio del grupo.": "Crea il gruppo, pubblica l'uscita e in strada tutti si vedono sulla mappa e parlano con la radio del gruppo.",
 "MOTOCLUBes es la app para moteros: planifica rutas, navega con GPS pensado para la moto, rueda en grupo con mapa y radio y comparte tus rutas con la comunidad.": "MOTOCLUBes è l'app per i biker: pianifica percorsi, naviga con un GPS pensato per la moto, viaggia in gruppo con mappa e radio e condividi i tuoi percorsi con la community.",
 "Te avisa de los radares fijos y de tramo y del límite antes de que baje, con ruta o sin ella. En Francia, las zonas de peligro, como marca su ley.": "Ti avvisa degli autovelox fissi e dei Tutor e del limite prima che si abbassi, con o senza percorso. In Francia, le zone di pericolo, come prevede la legge francese.",
 "Ranking, logros y retos": "Classifica, traguardi e sfide",
 "Kilómetros, curvas, provincias, puertos, motos y grupos: el ranking del mes y el de siempre, con sus hitos.": "Chilometri, curve, province, passi, moto e gruppi: la classifica del mese e quella di sempre, con i loro obiettivi.",
 "No. Vale cualquier intercomunicador Bluetooth que ya lleves en el casco, sea de la marca que sea. La voz del grupo va por los datos del móvil, así que no depende del alcance del aparato: mientras haya cobertura, seguís hablando. Sin intercomunicador oyes al grupo, pero para hablar hace falta.": "No. Va bene qualsiasi interfono Bluetooth che hai già nel casco, di qualunque marca. La voce del gruppo passa per i dati del telefono, quindi non dipende dalla portata dell'apparecchio: finché c'è copertura, continuate a parlare. Senza interfono senti il gruppo, ma per parlare ti serve.",
 "No. Solo te ven los compañeros de tu salida, y solo mientras dura. Y si no quieres compartir tu posición, lo apagas en tu perfil.": "No. Ti vedono solo i compagni della tua uscita, e solo finché dura. E se non vuoi condividere la tua posizione, la disattivi nel tuo profilo.",
 "¿Funciona fuera de España?": "Funziona fuori dalla Spagna?",
 "Sí. Los mapas, el planificador y la navegación valen en toda Europa, y el tiempo de tu salida también. Las gasolineras con su precio, en España, Francia, Portugal y Andorra. Los radares, en España, y en Francia las zonas de peligro, como marca su ley.": "Sì. Le mappe, il pianificatore e la navigazione funzionano in tutta Europa, e anche il meteo della tua uscita. I distributori con i prezzi, in Spagna, Francia, Portogallo e Andorra. Gli autovelox, in Spagna, e in Francia le zone di pericolo, come prevede la legge francese.",
 "¿Tienes una duda o un problema?": "Hai un dubbio o un problema?",
 "Escríbenos por WhatsApp al 653 835 720 o a soporte@motoclubes.es. Te contestamos lo antes posible.": "Scrivici su WhatsApp al +34 653 835 720 o a soporte@motoclubes.es. Ti rispondiamo il prima possibile.",
 "💬 Escríbenos por WhatsApp": "💬 Scrivici su WhatsApp",
 "¿Cuándo sales? El tiempo por el camino": "Quando parti? Il meteo lungo la strada",
 "Pon el día y la hora de tu salida: el día antes y esa misma mañana te avisamos del tiempo que te espera por la ruta.": "Inserisci il giorno e l'ora della tua uscita: il giorno prima e la mattina stessa ti avvisiamo del tempo che ti aspetta lungo il percorso.",
 "Curvas, con autopista donde quieras": "Curve, con l'autostrada dove vuoi",
 "En una ruta de curvas o de pista, marca los tramos que prefieres hacer por autopista para llegar antes a lo bueno.": "In un percorso di curve o di sterrato, segna i tratti che preferisci fare in autostrada per arrivare prima al bello.",
 "Cuentas del viaje": "I conti del viaggio",
 "Cada uno apunta lo que paga (gasolina, comidas, hotel…) y la app dice quién debe a quién.": "Ognuno segna quello che paga (benzina, pasti, hotel…) e l'app dice chi deve quanto a chi.",
 "Graba con el mapa delante": "Registra con la mappa davanti",
 "Graba tu salida viendo tu línea y los radares. Y si sales de la pantalla para usar la app, la grabación sigue.": "Registra la tua uscita vedendo la tua traccia e gli autovelox. E se esci dalla schermata per usare l'app, la registrazione continua.",
 "¿Llegas tarde? Únete por el camino": "Sei in ritardo? Unisciti lungo la strada",
 "Si arrancas lejos del punto de encuentro, eliges dónde te unes al grupo y, mientras, te llevamos hasta allí.": "Se parti lontano dal punto di ritrovo, scegli dove unirti al gruppo e intanto ti portiamo fino a lì.",
 "Radares y límite de velocidad": "Autovelox e limiti di velocità",
 ">Avísame<": ">Avvisami<",
 "Avísame cuando salga": "Avvisami quando esce",
 "Bares, hoteles y talleres que tratan bien al motero, para parar con el grupo.": "Bar, hotel e officine che trattano bene i biker, per fermarsi con il gruppo.",
 "Cómo funciona Rider Friendly": "Come funziona Rider Friendly",
 "Déjanos tu correo y te avisamos el día que salga.": "Lasciaci la tua email e ti avvisiamo il giorno in cui esce.",
 "Entrar al portal": "Entra nel portale",
 "He leído y acepto la": "Ho letto e accetto la",
 "La app está en pruebas cerradas": "L'app è in beta chiusa",
 "aria-label=\"Menú\"": "aria-label=\"Menu\"",
 "Motoclubs y grupos": "Motoclub e gruppi",
 "Más sobre el navegador GPS para moto →": "Più info sul navigatore GPS per moto →",
 "Más sobre el planificador de rutas para moto →": "Più info sul pianificatore di percorsi per moto →",
 "Navegador GPS para moto": "Navigatore GPS per moto",
 "Para motoclubs →": "Per i motoclub →",
 ">Por dentro<": ">Dentro l'app<",
 "Quiero probarla antes, como tester": "Voglio provarla prima, come tester",
 ">Rutas en moto<": ">Percorsi in moto<",
 "Salir en grupo en moto": "Uscite di gruppo in moto",
 "Salir en grupo en moto →": "Uscite di gruppo in moto →",
 "aria-label=\"Tu correo\"": "aria-label=\"La tua email\"",
 "política de privacidad": "privacy policy",
 "Y la app habla tu idioma: castellano, catalán, inglés, francés, portugués e italiano.": "E l'app parla la tua lingua: spagnolo, catalano, inglese, francese, portoghese e italiano.",
 "\"¡Hecho! Te hemos mandado un correo: pulsa el enlace para confirmar.\"": "\"Fatto! Ti abbiamo mandato un'email: tocca il link per confermare.\"",
 "\"No se ha podido enviar. Inténtalo de nuevo en un momento.\"": "\"Non è stato possibile inviare. Riprova tra un momento.\"",
 "\"Revisa el correo, parece que no está bien escrito.\"": "\"Controlla l'email, sembra scritta male.\"",
 "\"Marca la casilla de privacidad para poder avisarte.\"": "\"Spunta la casella della privacy per poterti avvisare.\""
}

# WEB-IT-1 (142.ª): el pie decía «Préparezdor / Planeiador / Pianificador de rutas» (la palabra corta se comía la larga) y el
# hueco del correo «tu@correo.com» en castellano.
FR.update({"Planificador de rutas": "Planificateur d'itinéraires", 'placeholder="tu@correo.com"': 'placeholder="toi@email.fr"'})
PT.update({"Planificador de rutas": "Planeador de rotas", 'placeholder="tu@correo.com"': 'placeholder="tu@email.pt"'})
IT.update({"Planificador de rutas": "Pianificatore di percorsi", 'placeholder="tu@correo.com"': 'placeholder="tu@email.it"'})

def generar(destino, dic, codigo, locale):
    s = io.open('index.html', encoding='utf8').read()
    # Las cadenas largas primero: si no, una corta rompe una larga que la contiene.
    # WEB-IT-1 (142.ª): UNA sola pasada. Antes, con un replace detrás de otro, lo ya traducido se volvía a traducir
    # («Planificateur» lleva dentro «Planifica» → salía «Préparezteur» en la web francesa).
    import re as _re0
    _pat = _re0.compile('|'.join(_re0.escape(k) for k in sorted(dic, key=len, reverse=True)))
    s = _pat.sub(lambda m: dic[m.group(0)], s)
    s = s.replace('<html lang="es">', f'<html lang="{codigo}">')
    s = s.replace('<meta property="og:locale" content="es">', f'<meta property="og:locale" content="{locale}">')
    s = s.replace('href="https://www.motoclubes.es/"><link rel="alternate" hreflang="x-default"',
                  'href="https://www.motoclubes.es/"><link rel="alternate" hreflang="x-default"')
    # SEO-1 (133.ª, 31-oct): cada idioma es su propia página canónica. Antes /fr/ y /pt/ decían a Google que eran copia de
    # la portada en castellano (canonical a «/») y Google no las guardaba.
    s = s.replace('<link rel="canonical" href="https://www.motoclubes.es/">',
                  f'<link rel="canonical" href="https://www.motoclubes.es/{codigo}/">')
    s = s.replace('<meta property="og:url" content="https://www.motoclubes.es/">',
                  f'<meta property="og:url" content="https://www.motoclubes.es/{codigo}/">')
    # Enlaces relativos: desde /fr/ y /pt/ hay que subir un nivel.
    # 🔴 Y el srcset TAMBIEN: se olvido la primera vez y el casco de la portada no
    # salia en ninguna de las dos, porque el navegador hace caso al srcset antes
    # que al src. La expresion de abajo barre todo lo que quede relativo.
    for a, b in [('href="img/','href="/img/'), ('href="assets/','href="/assets/'),
                 ('src="img/','src="/img/'), ('href="negocio/','href="/negocio/'),
                 ('href="legal/','href="/legal/'), ('href="baja/','href="/baja/'),
                 ('href="rutas/','href="/rutas/')]:
        s = s.replace(a, b)
    import re as _re
    s = _re.sub(r'(src|href|srcset)="(?!https?:|/|#|mailto:)', lambda m: f'{m.group(1)}="/', s)
    # El selector: marcar el idioma activo
    BANDERA = {"fr": "🇫🇷", "pt": "🇵🇹", "it": "🇮🇹"}
    s = s.replace('<summary aria-label="Idioma"><span>🇪🇸</span>ES</summary>',
                  f'<summary aria-label="Idioma"><span>{BANDERA[codigo]}</span>{codigo.upper()}</summary>')
    # IDIOMAS-PT-IT-1: el aria-label del selector, traducido (antes se quedaba en «Idioma»)
    s = s.replace('<summary aria-label="Idioma">', '<summary aria-label="' + {"fr": "Langue", "pt": "Idioma", "it": "Lingua"}[codigo] + '">')
    s = s.replace('<a href="/" hreflang="es" class="activo">', '<a href="/" hreflang="es" class="">')
    s = s.replace(f'<a href="/{codigo}/" hreflang="{codigo}" class="">',
                  f'<a href="/{codigo}/" hreflang="{codigo}" class="activo">')
    # IDIOMAS-PT-IT-1: el menú «Por dentro» lleva a la página en el mismo idioma (antes, a la de castellano)
    s = s.replace('<a href="/por-dentro/"', f'<a href="/{codigo}/por-dentro/"')
    io.open(destino, 'w', encoding='utf8').write(s)
    quedan = [es for es in dic if es in s and len(es) > 25]
    print(f'{destino}: escrito ({len(s)} car). Sin traducir: {len(quedan)}')
    for q in quedan[:5]: print('   🔴', q[:80])

generar('fr/index.html', FR, 'fr', 'fr')
generar('pt/index.html', PT, 'pt', 'pt')
generar('it/index.html', IT, 'it', 'it')
