#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MC-WEB-IDIOMAS-20SEP-2026 · Genera /fr/ y /pt/ desde la página española.

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
}

PT = {
 "MOTOCLUBes — La app que viaja contigo | Rutas, navegación y comunidad motera":
   "MOTOCLUBes — A app que viaja consigo | Rotas, navegação e comunidade motard",
 "MOTOCLUBes es la app para moteros: planifica rutas, navega con GPS pensado para la moto, rueda en grupo con intercom y comparte tus rutas con la comunidad.":
   "MOTOCLUBes é a app para motards: planeia rotas, navega com GPS pensado para a mota, anda em grupo com intercomunicador e partilha as tuas rotas com a comunidade.",
 "Qué es":"A app", "Funciones":"Funções", "Proyecto":"O projeto", "Preguntas":"Perguntas",
 "Negocios":"Negócios", "Descarga":"Descarregar",
 "La app que viaja contigo.":"A app que viaja consigo.",
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
}

def generar(destino, dic, codigo, locale):
    s = io.open('index.html', encoding='utf8').read()
    # Las cadenas largas primero: si no, una corta rompe una larga que la contiene.
    for es in sorted(dic, key=len, reverse=True):
        s = s.replace(es, dic[es])
    s = s.replace('<html lang="es">', f'<html lang="{codigo}">')
    s = s.replace('<meta property="og:locale" content="es">', f'<meta property="og:locale" content="{locale}">')
    s = s.replace('href="https://www.motoclubes.es/"><link rel="alternate" hreflang="x-default"',
                  'href="https://www.motoclubes.es/"><link rel="alternate" hreflang="x-default"')
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
    s = s.replace('<summary aria-label="Idioma"><span>🇪🇸</span>ES</summary>',
                  f'<summary aria-label="Idioma"><span>{"🇫🇷" if codigo=="fr" else "🇵🇹"}</span>{codigo.upper()}</summary>')
    s = s.replace('<a href="/" hreflang="es" class="activo">', '<a href="/" hreflang="es" class="">')
    s = s.replace(f'<a href="/{codigo}/" hreflang="{codigo}" class="">',
                  f'<a href="/{codigo}/" hreflang="{codigo}" class="activo">')
    io.open(destino, 'w', encoding='utf8').write(s)
    quedan = [es for es in dic if es in s and len(es) > 25]
    print(f'{destino}: escrito ({len(s)} car). Sin traducir: {len(quedan)}')
    for q in quedan[:5]: print('   🔴', q[:80])

generar('fr/index.html', FR, 'fr', 'fr')
generar('pt/index.html', PT, 'pt', 'pt')
