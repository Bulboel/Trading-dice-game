/* v198 — Objets portés : un seul objet équipé à la fois, débloqué par un défi, enregistré dans le profil (profile.equipped). */
(function(root){'use strict';
const items=[
 {id:'bague-chanceuse',name:'Bague chanceuse',art:'assets/items/bague-chanceuse.svg',model:'assets/models-web/bague-chanceuse.glb',effect:'Vous commencez chaque duel contre l’IA avec un dé de jet bonus.',lore:'Inspirée de la bague de l’apprentie : sa gemme aux mille reflets attire la chance au premier lancer.',challenge:'chapter1',startBonus:1},
 // v253 — récompense de l'événement de Noël (gardée pour toujours une fois débloquée)
 {id:'grelot-des-neiges',name:'Grelot des neiges',art:'assets/items/grelot-des-neiges.svg',effect:'Une fois par duel contre l’IA, votre premier lancer d’invocation raté est relancé automatiquement.',lore:'Il tinte au cou des rennes de la nuit des Lumières : quand la chance vous échappe, son carillon la rappelle.',challenge:'noel5',reroll:1},
 // v261 — objets des terrains : gagnés avec les défis de chaque terrain (le Sac sans fond récompense la collection)
 {id:'feuille-d-or',name:'Feuille d’or',art:'assets/items/feuille-d-or.svg',effect:'Votre première créature posée gagne +1 de force pour toute la partie.',lore:'Tombée de l’érable le plus ancien de la forêt d’automne, elle ne se fane jamais et porte chance à celui qui ose frapper le premier.',challenge:'autumn',goldFirst:1},
 {id:'lanterne-du-mineur',name:'Lanterne du mineur',art:'assets/items/lanterne-du-mineur.svg',effect:'Sur un terrain à événement (foudre, vent, lac, nuit des Lumières), vous voyez à l’avance la case visée par le prochain événement.',lore:'Les mineurs de Berdésa la tiennent de leurs anciens : sa flamme vacille avant que le ciel ne gronde.',challenge:'deep',forecast:1},
 {id:'echarpe-de-kayla',name:'Écharpe de Kayla',art:'assets/items/echarpe-de-kayla.svg',effect:'La première de vos créatures que prend une tornade résiste et ne bouge pas.',lore:'Tissée par Kayla dans un souffle des vents de Hacko : le vent reconnaît son propre ouvrage et le laisse en paix.',challenge:'wind',scarf:1},
 {id:'sac-sans-fond',name:'Le sac sans fond',art:'assets/items/sac-sans-fond.svg',effect:'Vous commencez le duel avec un dé rare supplémentaire, tiré au hasard, dans votre main.',lore:'On y glisse la main pour une pièce et on en ressort un trésor. Personne n’a jamais touché le fond.',challenge:'collector',extraRare:1}
];
function owned(profile){const C=root.HackeniaChallenges;if(!C||!profile)return[];const done=new Set(C.unlocked(profile).map(d=>d.id));return items.filter(i=>done.has(i.challenge))}
function equipped(profile){const id=profile?.equipped;return id?owned(profile).find(i=>i.id===id)||null:null}
// Dés bonus de départ pour le joueur local (seulement contre l'IA : Jouer, Partie rapide, Histoire).
function startBonus(){try{return equipped(root.HackeniaPortal?.profile?.())?.startBonus||0}catch{return 0}}
const api={items,owned,equipped,startBonus};root.HackeniaEquipment=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
