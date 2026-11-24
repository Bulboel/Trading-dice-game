/* v433 — Packs spéciaux, en plus du Pack Sage.
   Pack Aventurier (une seule fois) : une boubourse qui contient forcément un légendaire (ou mieux) et 500 Bubulles.
   Pack Élémentaire : le joueur choisit un élément ; son héros prend cet élément, et il reçoit un dé de cet élément de chaque rareté
   (commun, peu commun, rare, légendaire), de préférence des dés qu'il ne possède pas encore, plus 500 Bubulles.
   Les prix sont en Bubulles (achat dans le jeu) ; un achat en argent réel pourra se brancher sur billing, comme pour le Pack Sage. */
(function(root){'use strict';
const ADVENTURER={price:1000,gold:500},ELEMENTAL={price:1000,gold:500};
const ELS=['foudre','vent','terre','glace','eau','feu'],RARITIES=[1,2,3,5];
const defs=()=>root.hackeniaGame?.monsters||[];
const owned=(p,i)=>(p.inventory?.[i]||0)>0;
function adventurerOwned(p){return !!p?.packs?.aventurier}
function buyAdventurer(profile,random=Math.random){if(adventurerOwned(profile)||profile.gold<ADVENTURER.price||(profile.pouchQueue?.length||0)>0)return null;
 const next=root.HackeniaPurchases.guaranteedPouch(profile,random);next.gold=next.gold-ADVENTURER.price+ADVENTURER.gold;next.packs={...(next.packs||{}),aventurier:new Date().toISOString()};return next}
function elementDice(profile,el,random=Math.random){const D=defs();return RARITIES.map(r=>{const ids=D.map((d,i)=>[d,i]).filter(([d])=>d.el===el&&(d.rarity??d.lv)===r&&!d.reserved&&!d.shiny&&!d.pure&&!d.els&&!d.multi&&!d.card&&!d.cls&&!d.fx).map(([,i])=>i);
 const fresh=ids.filter(i=>!owned(profile,i)),from=fresh.length?fresh:ids;return from[Math.min(from.length-1,Math.floor(random()*from.length))]}).filter(i=>Number.isInteger(i))}
function buyElemental(profile,el,random=Math.random){if(!ELS.includes(el)||profile.gold<ELEMENTAL.price)return null;const next=structuredClone(profile),dice=elementDice(profile,el,random);
 for(const i of dice)next.inventory[i]=(next.inventory[i]||0)+1;next.gold=next.gold-ELEMENTAL.price+ELEMENTAL.gold;if(next.hero&&typeof next.hero==='object')next.hero.el=el;
 next.packs={...(next.packs||{}),elementaire:((next.packs||{}).elementaire|0)+1,element:el};return {profile:next,dice}}
const api={ADVENTURER,ELEMENTAL,ELS,adventurerOwned,buyAdventurer,elementDice,buyElemental};root.HackeniaPacks=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
