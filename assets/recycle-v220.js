/* v220 — Recycler les doublons en Bubulles.
   On garde toujours assez d'exemplaires pour un deck complet (limites de deck) et pour chaque deck enregistré ;
   seuls les exemplaires en trop peuvent être recyclés. Une bourse (10 Bubulles) recyclée en entier rapporte
   environ 6 Bubulles en moyenne : recycler aide à compléter sa collection sans rendre les bourses gratuites. */
(function(root){'use strict';
// Valeur d'un exemplaire recyclé, par rareté (1 commun, 2 peu commun, 3 rare, 5 légendaire, 6 divin, 7 Énergie).
// v342 : barème revu à la baisse pour les raretés hautes (1 commun, 1 peu commun, 2 rare, 3 légendaire, 5 divin, 2 Énergie, 100 Crépitant).
const VALUE={1:1,2:1,3:2,5:3,6:5,7:2,8:100};
// Exemplaires gardés au minimum : ce qu'un deck peut contenir (4 rares, 2 légendaires, 1 divin, 2 Énergie), 4 pour les autres.
const KEEP={1:4,2:4,3:4,5:2,6:1,7:2};/* un Crépitant (8) garde le minimum de son dé de base (voir plan) */
// v342 — réglages du joueur : profile.recycleCfg={auto:bool, keep:0 (assez pour un deck) | 1…10 (nombre fixe gardé par dé)}.
const cfg=profile=>{const c=profile?.recycleCfg||{};return{auto:typeof c.auto==='boolean'?c.auto:!!profile?.premium?.sage,keep:Number.isInteger(c.keep)&&c.keep>=1&&c.keep<=10?c.keep:0}};
function keepFor(profile,id,rarity){const k=cfg(profile).keep;let keep=k||(profile.premium?.sage?3:(KEEP[rarity]??4));/* Pack Sage : trois exemplaires gardés au minimum */for(const d of profile.decks||[]){const n=(d.dice||[]).filter(x=>x===id).length;if(n>keep)keep=n}return keep}
// Liste des doublons recyclables : [{id, owned, keep, extra, value}], et le total.
function plan(profile,defs,rarityOf){const items=[];for(const [k,owned] of Object.entries(profile.inventory||{})){const id=Number(k),d=defs[id];if(!d||!Number.isSafeInteger(owned)||profile.favorites?.[id])continue;/* les favoris ne sont jamais recyclés */const r=rarityOf(d),keep=keepFor(profile,id,d.shinyOf!=null&&defs[d.shinyOf]?rarityOf(defs[d.shinyOf]):r),extra=owned-keep;if(extra>0)items.push({id,owned,keep,extra,value:extra*(VALUE[r]??1)})}
 items.sort((a,b)=>b.value-a.value||a.id-b.id);return{items,total:items.reduce((s,i)=>s+i.value,0),count:items.reduce((s,i)=>s+i.extra,0)}}
// Recycle les exemplaires choisis (ids), jamais en dessous du minimum gardé. Renvoie un nouveau profil.
function apply(profile,defs,rarityOf,ids){const p=plan(profile,defs,rarityOf),pick=ids?new Set(ids.map(Number)):null,next=structuredClone(profile);let gold=0,count=0;
 for(const it of p.items){if(pick&&!pick.has(it.id))continue;next.inventory[it.id]=it.keep;gold+=it.value;count+=it.extra}
 next.gold+=gold;next.recycled=(Number.isSafeInteger(profile.recycled)?profile.recycled:0)+count;return{profile:next,gold,count}}
const api={VALUE,KEEP,keepFor,plan,apply,cfg};root.HackeniaRecycle=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
