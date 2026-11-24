/* Plan a complete purchase before the single durable profile write. No partial debit.
   v257 — taux revus (Légendaire 6 %, Divin 1,5 %) et garanties : un légendaire que vous ne possédez pas toutes les 50 boubourses
   sans légendaire, un divin toutes les 100 boubourses sans divin (compteurs profile.pity = {leg, div}, remis à zéro dès qu'il en sort un). */
(()=>{'use strict';
// v425 — % par dé (total 100) : Commun 28,3, Peu commun 21, Rare 22, Légendaire 6, Divin 0,4, Énergie 22, Crépitant 0,3
// (dont Crépitant v1 0,2 et Crépitant émeraude v2 0,1 : voir CREP_SPLIT).
/* v425 — Énergie aussi fréquent qu'un rare (22 %) : Commun 28,3, Peu commun 21, Rare 22, Légendaire 6, Divin 0,4, Énergie 22, Crépitant 0,3 */const WEIGHTS=[28.3,21,22,0,6,0.4,22,0.3],CREP_SPLIT={1:0.2,2:0.1};/* v269 : Crépitant (rareté 8) = trois fois plus rare qu'un divin *//* % par dé : Commun 33, Peu commun 27, Rare 22, (ancien Épique, retiré), Légendaire 6, Divin 1,5, Énergie 10,5 */
const PITY={leg:50,div:80};
const pool=(r,kind=0)=>{const defs=window.hackeniaGame?.monsters;return defs?.map((d,i)=>({d,i})).filter(({d})=>(d.rarity??d.lv)===r&&!d.reserved&&(!kind||(d.shinyKind||1)===kind)).map(({i})=>i)||Array.from({length:6},(_,i)=>(r===7?58:r===8?128:(r-1)*6)+i)};
function plan(profile,count,random=Math.random){if(count!==1&&count!==10&&count!==100)throw RangeError('Lot invalide');if(count===100&&!profile.premium?.sage)return null;const price=count===100?900:count===10?90:10;if(profile.gold<price||(profile.pouchQueue?.length||0)>0)return null;const next=structuredClone(profile);next.pouchQueue=[];
 const pity={leg:Math.max(0,Math.floor(next.pity?.leg)||0),div:Math.max(0,Math.floor(next.pity?.div)||0)};
 const rarityOf=id=>{const d=window.hackeniaGame?.monsters?.[id];return d?(d.rarity??d.lv):0};
 for(let p=0;p<count;p++){const pack={dice:[],firstSeen:[]};
  for(let j=0;j<3;j++){let r=random()*WEIGHTS.reduce((x,y)=>x+y,0),l=0;while(l<WEIGHTS.length-1&&r>=WEIGHTS[l])r-=WEIGHTS[l++];const ids=l+1===8?pool(8,random()*(CREP_SPLIT[1]+CREP_SPLIT[2])<CREP_SPLIT[1]?1:2):pool(l+1);pack.dice.push(ids[Math.min(ids.length-1,Math.floor(random()*ids.length))])}
  pity.leg++;pity.div++;
  const has=r=>pack.dice.some(id=>rarityOf(id)===r),inv=id=>(next.inventory[id]||0);
  // garantie : on remplace le dé le plus ordinaire de la boubourse, de préférence par un dé que le joueur ne possède pas encore
  const force=(rar,keepIdx=-1)=>{const ids=pool(rar);if(!ids.length)return;const fresh=ids.filter(i=>!inv(i)&&!pack.dice.includes(i)),from=fresh.length?fresh:ids;const id=from[Math.min(from.length-1,Math.floor(random()*from.length))];
   let slot=-1,low=99;pack.dice.forEach((d,k)=>{const q=rarityOf(d);if(k!==keepIdx&&q<low&&q!==6&&q!==8){low=q;slot=k}});if(slot<0)slot=0;pack.dice[slot]=id;return slot};
  let kept=-1;
  if(has(6))pity.div=0;else if(pity.div>=PITY.div){kept=force(6);pity.div=0;pack.pity='divin'}
  if(has(5))pity.leg=0;else if(pity.leg>=PITY.leg){force(5,kept);pity.leg=0;pack.pity=pack.pity||'légendaire'}
  pack.dice.forEach((id,j)=>{if(!(next.inventory[id]||0))pack.firstSeen.push(j);next.inventory[id]=(next.inventory[id]||0)+1});next.pouchQueue.push(pack)}
 next.pity=pity;next.gold-=price;next.boosters=(next.boosters||0)+count;
 return next}
/* v433 — Boubourse garantie (Pack Aventurier) : 3 dés tirés normalement, dont un remplacé par un légendaire (ou un divin, 1 fois sur 8),
   de préférence un dé que le joueur ne possède pas encore. Ne débite rien : c'est le pack qui fixe le prix. */
function guaranteedPouch(profile,random=Math.random){const next=structuredClone(profile);next.pouchQueue=Array.isArray(next.pouchQueue)?next.pouchQueue.slice():[];
 const rarityOf=id=>{const d=window.hackeniaGame?.monsters?.[id];return d?(d.rarity??d.lv):0},pack={dice:[],firstSeen:[],pity:'légendaire'};
 for(let j=0;j<3;j++){let r=random()*WEIGHTS.reduce((x,y)=>x+y,0),l=0;while(l<WEIGHTS.length-1&&r>=WEIGHTS[l])r-=WEIGHTS[l++];const ids=l+1===8?pool(8,random()<CREP_SPLIT[1]/(CREP_SPLIT[1]+CREP_SPLIT[2])?1:2):pool(l+1);pack.dice.push(ids[Math.min(ids.length-1,Math.floor(random()*ids.length))])}
 if(!pack.dice.some(id=>[5,6,8].includes(rarityOf(id)))){const rar=random()<1/8?6:5,ids=pool(rar),fresh=ids.filter(i=>!(next.inventory[i]||0)),from=fresh.length?fresh:ids;let slot=0,low=99;pack.dice.forEach((d,k)=>{if(rarityOf(d)<low){low=rarityOf(d);slot=k}});pack.dice[slot]=from[Math.floor(random()*from.length)];if(rar===6)pack.pity='divin'}
 pack.dice.forEach((id,j)=>{if(!(next.inventory[id]||0))pack.firstSeen.push(j);next.inventory[id]=(next.inventory[id]||0)+1});next.pouchQueue.push(pack);next.boosters=(next.boosters||0)+1;return next}
window.HackeniaPurchases={guaranteedPouch,plan,WEIGHTS,CREP_SPLIT,PITY,pityLeft:profile=>({leg:Math.max(1,PITY.leg-(Math.floor(profile?.pity?.leg)||0)),div:Math.max(1,PITY.div-(Math.floor(profile?.pity?.div)||0))})};})();
