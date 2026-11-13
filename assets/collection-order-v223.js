/* v223 — Ordre officiel de la collection (numéros N° 001…).
   1. Bolduc, Eberien, Grimgors, Jhimm, Kala, chacun suivi de toutes ses versions (légendaire, argent, or…).
   2. Les autres personnages par ordre alphabétique, chacun suivi de ses versions.
   3. Les dés élémentaires à la fin, élément par élément : Éclat, Sentier, Rayon.
   Dans une famille : le dé d'origine, puis les autres versions « officielles » par rareté, puis les variantes
   (teintes, pierre, argent, or) par rareté et par élément. */
(function(root){'use strict';
const HEAD=['bolduc','eberien','grimgors','jhimm','kala'],ELS=['foudre','vent','terre','glace','eau','feu'];
const rarityOf=d=>d.rarity??d.lv,rank=r=>r===7?4.5:r;// Énergie entre rare et légendaire
function family(d){if(d.pure)return null;const k=d.modelKey||'';if(k==='max-alastor')return 'max';return k.replace(/-legendaire$/,'')||null}
function order(defs){const fams=new Map(),pure=[],orphans=[];
 const parked=[];defs.forEach((d,i)=>{if(!d)return;if(d.reserved){parked.push(i);return}/* v261 : dés mis de côté, numérotés après tous les autres */if(d.pure&&!d.card){pure.push(i);return}if(d.card){orphans.push(i);return}const f=family(d);if(!f){orphans.push(i);return}if(!fams.has(f))fams.set(f,[]);fams.get(f).push(i)});
 const within=(f,ids)=>ids.slice().sort((a,b)=>{const A=defs[a],B=defs[b],oa=A.modelKey===f&&!A.variant&&!A.fx&&!A.terrain2&&!A.cls?0:1,ob=B.modelKey===f&&!B.variant&&!B.fx&&!B.terrain2&&!B.cls?0:1;if(oa!==ob)return oa-ob;
  const va=A.variant||A.fx||A.terrain2||A.cls?1:0,vb=B.variant||B.fx||B.terrain2||B.cls?1:0;if(va!==vb)return va-vb;return rank(rarityOf(A))-rank(rarityOf(B))||ELS.indexOf(A.el)-ELS.indexOf(B.el)||a-b});
 const keys=[...HEAD.filter(k=>fams.has(k)),...[...fams.keys()].filter(k=>!HEAD.includes(k)).sort((a,b)=>a.localeCompare(b,'fr'))];
 const out=[];for(const k of keys)out.push(...within(k,fams.get(k)));
 out.push(...orphans.sort((a,b)=>String(defs[a].cn).localeCompare(defs[b].cn,'fr')));
 out.push(...pure.sort((a,b)=>ELS.indexOf(defs[a].el)-ELS.indexOf(defs[b].el)||defs[a].pure-defs[b].pure||a-b));
 out.push(...parked);return out}
// Numéro officiel (1, 2, 3…) de chaque identifiant de dé.
function numbers(defs){const n={};order(defs).forEach((id,k)=>n[id]=k+1);return n}
const api={HEAD,family,order,numbers};root.HackeniaCollectionOrder=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
