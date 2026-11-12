/* v198 — Objets portés : un seul objet équipé à la fois, débloqué par un défi, enregistré dans le profil (profile.equipped). */
(function(root){'use strict';
const items=[
 {id:'bague-chanceuse',name:'Bague chanceuse',art:'assets/items/bague-chanceuse.svg',model:'assets/models-web/bague-chanceuse.glb',effect:'Vous commencez chaque duel contre l’IA avec un dé de jet bonus.',lore:'Inspirée de la bague de l’apprentie : sa gemme aux mille reflets attire la chance au premier lancer.',challenge:'chapter1',startBonus:1},
 // v253 — récompense de l'événement de Noël (gardée pour toujours une fois débloquée)
 {id:'grelot-des-neiges',name:'Grelot des neiges',art:'assets/items/grelot-des-neiges.svg',effect:'Une fois par duel contre l’IA, votre premier lancer d’invocation raté est relancé automatiquement.',lore:'Il tinte au cou des rennes de la nuit des Lumières : quand la chance vous échappe, son carillon la rappelle.',challenge:'noel5',reroll:1}
];
function owned(profile){const C=root.HackeniaChallenges;if(!C||!profile)return[];const done=new Set(C.unlocked(profile).map(d=>d.id));return items.filter(i=>done.has(i.challenge))}
function equipped(profile){const id=profile?.equipped;return id?owned(profile).find(i=>i.id===id)||null:null}
// Dés bonus de départ pour le joueur local (seulement contre l'IA : Jouer, Partie rapide, Histoire).
function startBonus(){try{return equipped(root.HackeniaPortal?.profile?.())?.startBonus||0}catch{return 0}}
const api={items,owned,equipped,startBonus};root.HackeniaEquipment=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
