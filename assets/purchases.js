/* Plan a complete purchase before the single durable profile write. No partial debit.
   v257 — taux revus (Légendaire 6 %, Divin 1,5 %) et garanties : un légendaire que vous ne possédez pas toutes les 50 bourses
   sans légendaire, un divin toutes les 100 bourses sans divin (compteurs profile.pity = {leg, div}, remis à zéro dès qu'il en sort un). */
(()=>{'use strict';
const WEIGHTS=[33,27,22,0,6,1.5,10.5];/* % par dé : Commun 33, Peu commun 27, Rare 22, (ancien Épique, retiré), Légendaire 6, Divin 1,5, Énergie 10,5 */
const PITY={leg:50,div:100};
const pool=(r)=>{const defs=window.hackeniaGame?.monsters;return defs?.map((d,i)=>({d,i})).filter(({d})=>(d.rarity??d.lv)===r).map(({i})=>i)||Array.from({length:6},(_,i)=>(r===7?58:(r-1)*6)+i)};
function plan(profile,count,random=Math.random){if(count!==1&&count!==10)throw RangeError('Lot invalide');const price=count===10?90:10;if(profile.gold<price||(profile.pouchQueue?.length||0)>0)return null;const next=structuredClone(profile);next.pouchQueue=[];
 const pity={leg:Math.max(0,Math.floor(next.pity?.leg)||0),div:Math.max(0,Math.floor(next.pity?.div)||0)};
 const rarityOf=id=>{const d=window.hackeniaGame?.monsters?.[id];return d?(d.rarity??d.lv):0};
 for(let p=0;p<count;p++){const pack={dice:[],firstSeen:[]};
  for(let j=0;j<3;j++){let r=random()*WEIGHTS.reduce((x,y)=>x+y,0),l=0;while(l<WEIGHTS.length-1&&r>=WEIGHTS[l])r-=WEIGHTS[l++];const ids=pool(l+1);pack.dice.push(ids[Math.min(ids.length-1,Math.floor(random()*ids.length))])}
  pity.leg++;pity.div++;
  const has=r=>pack.dice.some(id=>rarityOf(id)===r),inv=id=>(next.inventory[id]||0);
  // garantie : on remplace le dé le plus ordinaire de la bourse, de préférence par un dé que le joueur ne possède pas encore
  const force=(rar,keepIdx=-1)=>{const ids=pool(rar);if(!ids.length)return;const fresh=ids.filter(i=>!inv(i)&&!pack.dice.includes(i)),from=fresh.length?fresh:ids;const id=from[Math.min(from.length-1,Math.floor(random()*from.length))];
   let slot=-1,low=99;pack.dice.forEach((d,k)=>{const q=rarityOf(d);if(k!==keepIdx&&q<low&&q!==6){low=q;slot=k}});if(slot<0)slot=0;pack.dice[slot]=id;return slot};
  let kept=-1;
  if(has(6))pity.div=0;else if(pity.div>=PITY.div){kept=force(6);pity.div=0;pack.pity='divin'}
  if(has(5))pity.leg=0;else if(pity.leg>=PITY.leg){force(5,kept);pity.leg=0;pack.pity=pack.pity||'légendaire'}
  pack.dice.forEach((id,j)=>{if(!(next.inventory[id]||0))pack.firstSeen.push(j);next.inventory[id]=(next.inventory[id]||0)+1});next.pouchQueue.push(pack)}
 next.pity=pity;next.gold-=price;next.boosters=(next.boosters||0)+count;
 return next}
window.HackeniaPurchases={plan,WEIGHTS,PITY,pityLeft:profile=>({leg:Math.max(1,PITY.leg-(Math.floor(profile?.pity?.leg)||0)),div:Math.max(1,PITY.div-(Math.floor(profile?.pity?.div)||0))})};})();
