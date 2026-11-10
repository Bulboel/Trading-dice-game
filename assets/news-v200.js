/* v200 — Dé « Annonces » (noir, lumière dorée) : les dernières mises à jour en grandes lignes. Visible sur l'accueil une fois les premiers pas terminés. */
(()=>{'use strict';
const SEEN='hackenia-news-seen-v1';
// Du plus récent au plus ancien. On reste général : pas de nom de personnage.
const NEWS=[
 {id:'v220',title:'Recyclez vos doublons',items:['Collection : transformez les exemplaires en trop en Bubulles. Vous gardez toujours de quoi faire un deck complet et tous vos decks enregistrés.','Le badge de niveau s’affiche mieux sur téléphone.']},
 {id:'v219',title:'Niveau de joueur et quêtes',items:['Gagnez de l’expérience à chaque partie et montez de niveau : chaque niveau rapporte des Bubulles, avec un palier tous les 5 niveaux.','Trois quêtes du jour et une quête de la semaine, à retrouver en touchant votre niveau en haut à droite.','Deux nouveaux effets de dé bonus à débloquer : « Éclair » au niveau 5 et « Feuille d’automne » au niveau 10.']},
 {id:'v218',title:'Petites finitions',items:['Le compteur de dés bonus affiche une goutte quand l’effet goutte d’eau est choisi.','Les fiches de dés sont mieux alignées et le symbole d’élément reste visible sur les cartes lumineuses.']},
 {id:'v217',title:'Ouverture rapide',items:['Boutique : achetez 10 bourses et ouvrez-les toutes d’un coup, sans animation, avec un récapitulatif des dés obtenus.','Un bouton permet aussi d’ouvrir d’un coup les bourses restantes d’un lot.']},
 {id:'v216',title:'Quatorze nouveaux dés',items:['Deux familles se déclinent dans de nouveaux éléments : cinq communs et cinq peu communs.','Quatre personnages reçoivent une version dans une rareté inédite pour eux, avec des schémas de dés jamais vus.']},
 {id:'v215',title:'Des variantes plus éclatantes',items:['Les statues, automates et personnages teintés gardent désormais leur apparence sur le plateau, avec des couleurs plus vives.','Six nouveaux dés communs : une créature de cristal déclinée dans chaque élément.']},
 {id:'v214',title:'Trois nouveaux personnages',items:['Nouveaux personnages animés en 3D : un commun et deux peu communs.','Nouveauté : les dés multi-élément reçoivent toujours le bonus de terrain, quel que soit le terrain, mais jamais le bonus de voisin.']},
 {id:'v213',title:'Des personnages pour tous les dés',items:['Les derniers dés sans personnage en reçoivent un : statues de pierre, automates d’argent pour les rares, idoles d’or pour les légendaires.','Les divins sont entourés d’une aura lumineuse sur le plateau.','Trois nouveaux dés rejoignent les bourses : deux communs et un peu commun.']},
 {id:'v212',title:'Des découvertes plus spectaculaires',items:['L’ouverture d’un nouveau dé est plus rapide et change selon sa rareté : bronze, argent, or, or ardent ou arc-en-ciel.','Nouveau décor étoilé pour les découvertes.']},
 {id:'v211',title:'Effets et éclat',items:['Personnalisez l’effet du dé bonus dans Options › Dés & bourse : un nouvel effet est disponible, d’autres seront à gagner.','Les dés légendaires brillent dans votre main, et les divins encore plus.']},
 {id:'v210',title:'Des formes de dés plus équilibrées',items:['Les formes trop longues créaient des raccourcis vers le camp adverse : plusieurs dés ont un nouveau schéma, plus compact.','Les astuces du menu ont été mises à jour avec les dernières nouveautés.']},
 {id:'v209',title:'Où apparaît votre créature ?',items:['La case où naît la créature est maintenant marquée d’un liseré doré sur le schéma de chaque dé.','Sur les dés les plus longs, la créature naît plus près du centre.']},
 {id:'v208',title:'Équilibrage des raretés',items:['Tous les dés légendaires lancent maintenant deux dés.','Tous les dés rares s’invoquent plus facilement, avec des dalles plus fortes.']},
 {id:'v207',title:'Des dés mieux équilibrés',items:['Chaque rareté a désormais son nombre de dalles : 3, 4, 5, puis 6 pour les légendaires et les divins.','Plusieurs dés légendaires reçoivent de nouvelles formes à six dalles, et les divins deviennent plus puissants.','Le premier objet à porter s’affiche en 3D, et de petites animations font vivre certains personnages.']},
 {id:'v204',title:'Votre progression à l’abri',items:['Sauvegarde en ligne automatique, sans compte à créer : aucun email, aucun mot de passe.','Un code de récupération permet de retrouver sa progression sur un autre téléphone (Options › Sauvegarde).']},
 {id:'v203',title:'Des fiches de dés plus utiles',items:['La Collection et Mes decks montrent maintenant la forme des dalles de chaque dé.','Fiches plus compactes et plus lisibles, sur téléphone comme sur ordinateur.']},
 {id:'v201',title:'Un jeu bien plus léger',items:['Les personnages et les dés en 3D sont 8 fois plus légers, sans perte de qualité visible.','Chargement plus rapide et moins de mémoire utilisée, surtout sur téléphone.']},
 {id:'v200',title:'Un menu plus clair',items:['Le dé Annonces vous présente les dernières nouveautés.','Les Bubulles rejoignent le cercle des dés.','Victoire aux combats : il faut maintenant vaincre 4 ennemis.','Récompense quotidienne revalorisée : 30 Bubulles par jour et 100 le 7e jour.','Vos deux dés bonus peuvent être lancés en même temps.']},
 {id:'v199',title:'Une nouvelle rareté : Énergie',items:['De nouveaux dés élémentaires chargés d’énergie, plus lumineux et plus puissants.','Les chances d’obtention des bourses ont été revues.']},
 {id:'v198',title:'Fins de partie et objets',items:['Nouvelles animations de victoire et de défaite.','Premier objet à porter, à débloquer en progressant dans l’Histoire.','Un nouveau défi lié à l’Histoire.','Un accueil plus simple pour bien démarrer.']},
 {id:'v197',title:'De nouveaux personnages',items:['Plusieurs dés deviennent des personnages animés.','De nouveaux dés avec des formes de dalles inédites.']},
 {id:'v196',title:'Plus lisible',items:['Cartes de dés plus lisibles en partie, sur ordinateur comme sur téléphone.','Menu Histoire et listes de choix redessinés.']},
 {id:'v195',title:'Un plateau plus grand',items:['Le damier passe à 8 colonnes et 12 lignes.']},
 {id:'v193',title:'Le mode Histoire',items:['Les premiers chapitres de l’histoire d’Hackénia, avec dialogues, illustrations et duels aux dés.']}
];
const latest=NEWS[0].id;
const read=()=>{try{return localStorage.getItem(SEEN)}catch{return null}};
const markRead=()=>{try{localStorage.setItem(SEEN,latest)}catch{}update()};
let die,dlg;
function update(){if(!die)return;const fresh=read()!==latest;die.classList.toggle('fresh',fresh);die.setAttribute('aria-label',fresh?'Annonces : nouveautés à découvrir':'Annonces');die.querySelector('.news-count').textContent=fresh?'!':'';die.querySelector('.news-count').hidden=!fresh}
function draw(){const seen=read();dlg.querySelector('#news-body').innerHTML='<ol class="news-list">'+NEWS.map((n,i)=>`<li class="news-item${i===0?' latest':''}"><header><span class="news-ver">${n.id}</span><strong>${n.title}</strong>${i===0&&seen!==latest?'<em>Nouveau</em>':''}</header><ul>${n.items.map(t=>`<li>${t}</li>`).join('')}</ul></li>`).join('')+'</ol>'}
function setup(){const nav=document.querySelector('#portal .portal-head');if(!nav){requestAnimationFrame(setup);return}
 die=document.createElement('button');die.id='news-die';die.type='button';
 die.innerHTML='<span class="news-stage" aria-hidden="true"><span class="news-cube"><u class="ncore"></u><u class="ncore y"></u><u class="ncore z"></u>'+[['f',[4]],['k',[0,2,3,5,6,8]],['r',[0,8]],['l',[0,2,6,8]],['t',[0,4,8]],['m',[0,2,4,6,8]]].map(([f,p])=>'<i class="nc-'+f+'">'+Array.from({length:9},(_,k)=>'<b'+(p.includes(k)?' class="on"':'')+'></b>').join('')+'</i>').join('')+'</span></span><span class="news-label">Annonces</span><span class="news-count" hidden></span>';
 nav.append(die);
 dlg=document.createElement('dialog');dlg.id='news-dialog';dlg.setAttribute('aria-labelledby','news-title');
 dlg.innerHTML='<header><h2 id="news-title">Annonces</h2><button type="button" data-news="close" aria-label="Fermer">✕</button></header><p class="news-intro">Les dernières nouveautés d’Hackénia, en quelques mots.</p><div id="news-body"></div>';document.body.append(dlg);
 die.onclick=()=>{draw();dlg.showModal();markRead()};dlg.addEventListener('click',e=>{if(e.target.closest('[data-news="close"]')||e.target===dlg)dlg.close()});update()}
setup();window.HackeniaNews={items:NEWS,latest};
})();
