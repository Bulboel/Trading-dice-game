/* v200 — Dé « Annonces » (noir, lumière dorée) : les dernières mises à jour en grandes lignes. Visible sur l'accueil une fois les premiers pas terminés. */
(()=>{'use strict';
const SEEN='hackenia-news-seen-v1';
// Du plus récent au plus ancien. v447 — annonces condensées : l’essentiel seulement.
const NEWS=[
 {id:'v448',title:'Merci à nos testeurs ! 🎁',items:['Merci à toutes et à tous pour vos retours : ils font avancer Hackénia chaque jour.','Pour profiter pleinement de votre première expérience, le Pack Sage vous est offert (bague de sage, boubourses par 100, recyclage automatique, 1 000 Bubulles, sans publicité) : il est ajouté à votre compte par l’équipe dans les prochains jours.','Nous sommes désolés pour les problèmes de fluidité : le jeu a été profondément optimisé, et le mode fluide (Options › Affichage) est activé d’office sur téléphone.']},
 {id:'v445',title:'Un jeu bien plus fluide',items:['Menus et plateau 3D allégés sans rien perdre des graphismes.','Téléphones où la 3D ne démarre pas : mode compatibilité automatique.']},
 {id:'v441',title:'Corrections',items:['Boutique, options et arbre de compétences mieux adaptés aux téléphones.','Pouvoir Rappel corrigé, textes du plateau plus clairs.']},
 {id:'v435',title:'Chapitre V : L’attaque à Kierzan',items:['Un nouveau chapitre de l’Histoire, raconté dans le journal de Kala.','Les Sans-chiffres affrontent les héros dans tous les éléments.']},
 {id:'v433',title:'Packs Aventurier et Élémentaire',items:['Deux packs à 1 000 Bubulles : une boubourse légendaire garantie, ou un dé de chaque rareté dans l’élément de votre choix.','Nouvelle tenue de voyageur pour votre héros.']},
 {id:'v428',title:'Hackénia passe en bêta (0.5)',items:['Plus de 230 dés à collectionner, dont des personnages en papier.','Les dalles deviennent neutres : seuls les personnages portent un élément.']}
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
 dlg.innerHTML='<header><h2 id="news-title">Annonces</h2><button type="button" data-news="close" aria-label="Fermer">✕</button></header><p class="news-intro">Les dernières nouveautés d’Hackénia, en quelques mots.</p><p class="news-dev">🛠️ Hackénia est toujours en cours de développement : les changements importants sont toujours annoncés ici.</p><div id="news-body"></div>';document.body.append(dlg);
 die.onclick=()=>{draw();dlg.showModal();markRead()};dlg.addEventListener('click',e=>{if(e.target.closest('[data-news="close"]')||e.target===dlg)dlg.close()});update()}
// v410 — Avertissement « jeu en cours de développement » : affiché une seule fois, dès que le joueur arrive sur le menu.
const DEV='hackenia-dev-notice-v1';
function devNotice(){let done=false;try{done=localStorage.getItem(DEV)==='1'}catch{}if(done)return;
 const timer=setInterval(()=>{const P=window.HackeniaPortal?.profile?.();if(!document.body.classList.contains('portal-open')||document.querySelector('dialog[open]')||document.querySelector('.start-menu-open,#start-menu:not([hidden])')||document.documentElement.classList.contains('start-menu-open')||!P?.onboardingDone)return;clearInterval(timer);
  const d=document.createElement('dialog');d.id='dev-dialog';d.setAttribute('aria-labelledby','dev-title');
  d.innerHTML='<header><h2 id="dev-title">🛠️ Un jeu qui grandit</h2></header><div class="dev-body"><p>Hackénia est toujours en cours de développement : de nouveaux dés, terrains et chapitres arrivent régulièrement, et certaines règles peuvent encore évoluer.</p><p>Les changements importants seront toujours annoncés dans le dé « Annonces » du menu principal.</p><p>Merci pour votre patience et pour vos retours !</p></div><button type="button" class="portal-primary" data-dev="ok">J’ai compris</button>';
  const close=()=>{try{localStorage.setItem(DEV,'1')}catch{}d.close()};d.addEventListener('click',e=>{if(e.target.closest('[data-dev="ok"]'))close()});d.addEventListener('cancel',()=>{try{localStorage.setItem(DEV,'1')}catch{}});d.addEventListener('close',()=>d.remove());
  document.body.append(d);window.HackeniaI18n?.apply?.(d);d.showModal()},1500)}
setup();devNotice();window.HackeniaNews={items:NEWS,latest};
})();
