/* v220 — Recycler les doublons en Bubulles.
   On garde toujours assez d'exemplaires pour un deck complet (limites de deck) et pour chaque deck enregistré ;
   seuls les exemplaires en trop peuvent être recyclés. Une boubourse (10 Bubulles) recyclée en entier rapporte
   environ 6 Bubulles en moyenne : recycler aide à compléter sa collection sans rendre les boubourses gratuites. */
(function(root){'use strict';
// Valeur d'un exemplaire recyclé, par rareté (1 commun, 2 peu commun, 3 rare, 5 légendaire, 6 divin, 7 Énergie).
// v342 : barème revu à la baisse pour les raretés hautes (1 commun, 1 peu commun, 2 rare, 3 légendaire, 5 divin, 2 Énergie, 100 Crépitant).
// v360 : barème beaucoup plus bas, en dixièmes de Bubulle (TENTHS) : 10 communs = 1, 5 peu communs = 1, 2 rares = 1, 1 légendaire = 1,
// 1 divin = 50, 1 Crépitant = 100 (Énergie comme un rare : 2 = 1). Les fractions restantes sont gardées dans profile.recycleCredit (dixièmes).
const TENTHS={1:1,2:2,3:5,5:10,6:500,7:5,8:1000},VALUE=Object.fromEntries(Object.entries(TENTHS).map(([k,v])=>[k,v/10]));
const credit=p=>Number.isInteger(p?.recycleCredit)&&p.recycleCredit>0&&p.recycleCredit<10?p.recycleCredit:0;
// Exemplaires gardés au minimum : ce qu'un deck peut contenir (4 rares, 2 légendaires, 1 divin, 2 Énergie), 4 pour les autres.
const KEEP={1:4,2:4,3:4,5:2,6:1,7:2};/* un Crépitant (8) garde le minimum de son dé de base (voir plan) */
// v342 — réglages du joueur : profile.recycleCfg={auto:bool (Pack Sage seulement), keep:0 (assez pour un deck) | 1…10 (nombre fixe gardé par dé)}.
// Le recyclage automatique reste réservé au Pack Sage (activé par défaut, désactivable).
const cfg=profile=>{const c=profile?.recycleCfg||{};return{auto:!!profile?.premium?.sage&&c.auto!==false,keep:Number.isInteger(c.keep)&&c.keep>=1&&c.keep<=10?c.keep:0}};
function keepFor(profile,id,rarity){const k=cfg(profile).keep;let keep=k||(profile.premium?.sage?3:(KEEP[rarity]??4));/* Pack Sage : trois exemplaires gardés au minimum */for(const d of profile.decks||[]){const n=(d.dice||[]).filter(x=>x===id).length;if(n>keep)keep=n}return keep}
// Liste des doublons recyclables : [{id, owned, keep, extra, value}], et le total.
function plan(profile,defs,rarityOf){const items=[];for(const [k,owned] of Object.entries(profile.inventory||{})){const id=Number(k),d=defs[id];if(!d||!Number.isSafeInteger(owned)||profile.favorites?.[id])continue;/* les favoris ne sont jamais recyclés */const r=rarityOf(d),keep=keepFor(profile,id,d.shinyOf!=null&&defs[d.shinyOf]?rarityOf(defs[d.shinyOf]):r),extra=owned-keep;if(extra>0)items.push({id,owned,keep,extra,tenths:extra*(TENTHS[r]??1),value:extra*(TENTHS[r]??1)/10})}
 items.sort((a,b)=>b.value-a.value||a.id-b.id);const tenths=items.reduce((s,i)=>s+i.tenths,0);return{items,tenths,credit:credit(profile),total:Math.floor((tenths+credit(profile))/10),count:items.reduce((s,i)=>s+i.extra,0)}}
// Recycle les exemplaires choisis (ids), jamais en dessous du minimum gardé. Renvoie un nouveau profil.
function apply(profile,defs,rarityOf,ids){const p=plan(profile,defs,rarityOf),pick=ids?new Set(ids.map(Number)):null,next=structuredClone(profile);let tenths=credit(profile),count=0;
 for(const it of p.items){if(pick&&!pick.has(it.id))continue;next.inventory[it.id]=it.keep;tenths+=it.tenths;count+=it.extra}
 const gold=Math.floor(tenths/10);next.gold+=gold;next.recycleCredit=tenths%10;/* reste gardé pour le prochain recyclage */next.recycled=(Number.isSafeInteger(profile.recycled)?profile.recycled:0)+count;return{profile:next,gold,count}}
const api={VALUE,TENTHS,credit,KEEP,keepFor,plan,apply,cfg};root.HackeniaRecycle=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
