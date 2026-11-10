/* v228 — Règles d'un dé, utilisées par l'éditeur « Proposer un dé » (et par les tests).
   Mêmes règles que les dés du jeu : nombre de dalles par rareté, total de force, valeur maximale, forme reliée,
   longueur maximale, case d'apparition sur la plus forte dalle à 2 cases au plus du bord arrière. */
(function(root){'use strict';
const RULES={
 1:{name:'Commun',tiles:3,total:6,max:3,min:1,len:3,throw:'1 dé, 2+'},
 2:{name:'Peu commun',tiles:4,total:10,max:4,min:1,len:3,throw:'1 dé, 3+'},
 3:{name:'Rare',tiles:5,total:20,max:6,min:2,len:3,throw:'1 dé, 3+'},
 5:{name:'Légendaire',tiles:6,total:28,max:6,min:2,len:4,throw:'2 dés, 5+'},
 6:{name:'Divin',tiles:6,total:32,max:6,min:3,len:4,throw:'2 dés, 5+'}};
// Multi-élément : bonus de terrain permanent, donc 2 points de force en moins.
const totalFor=(rarity,element)=>RULES[rarity].total-(element==='multi'?2:0);
const key=(x,y)=>x+','+y;
function connected(tiles){if(!tiles.length)return false;const set=new Set(tiles.map(t=>key(t[0],t[1]))),seen=new Set([key(tiles[0][0],tiles[0][1])]),todo=[tiles[0]];
 while(todo.length){const [x,y]=todo.pop();for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const k=key(x+dx,y+dy);if(set.has(k)&&!seen.has(k)){seen.add(k);todo.push([x+dx,y+dy])}}}return seen.size===set.size}
// Case d'apparition : la plus forte dalle (celle qui reste le plus près des bords en cas d'égalité, puis la plus centrale).
function spawnIndex(tiles){if(!tiles.length)return -1;const xs=tiles.map(t=>t[0]),ys=tiles.map(t=>t[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,max=Math.max(...tiles.map(t=>t[2]));
 const reach=t=>Math.max(t[0]-Math.min(...xs),Math.max(...xs)-t[0],t[1]-Math.min(...ys),Math.max(...ys)-t[1]);let best=-1,bd=1e9;tiles.forEach((t,i)=>{if(t[2]!==max)return;const d=reach(t)*100+Math.abs(t[0]-cx)+Math.abs(t[1]-cy);if(d<bd){bd=d;best=i}});return best}
function canon(cells){const out=[];let p=cells.map(([x,y])=>[x,y]);for(const f of[1,-1]){let q=p.map(([x,y])=>[x*f,y]);for(let r=0;r<4;r++){q=q.map(([x,y])=>[-y,x]);const mx=Math.min(...q.map(a=>a[0])),my=Math.min(...q.map(a=>a[1]));out.push(q.map(([x,y])=>(x-mx)+','+(y-my)).sort().join(' '))}}return out.sort()[0]}
// Vérifie un dé. Renvoie {ok, checks:[{ok,text}], spawn, total}. existing : dés du jeu (pour les formes légendaires uniques).
function check({rarity,element='',tiles=[]},existing=[]){const R=RULES[rarity],checks=[],add=(ok,text)=>checks.push({ok:!!ok,text});
 if(!R)return{ok:false,checks:[{ok:false,text:'Choisissez une rareté.'}],spawn:-1,total:0};
 const total=tiles.reduce((s,t)=>s+t[2],0),want=totalFor(rarity,element);
 add(tiles.length===R.tiles,`${R.tiles} dalles pour un dé ${R.name.toLowerCase()} (${tiles.length} posée${tiles.length>1?'s':''})`);
 add(total===want,`Total de force : ${want} (actuellement ${total})${element==='multi'?' — multi-élément : 2 de moins':''}`);
 add(tiles.every(t=>t[2]>=R.min&&t[2]<=R.max),`Chaque dalle vaut de ${R.min} à ${R.max}`);
 add(tiles.length>0&&connected(tiles),'Toutes les dalles se touchent par un côté');
 const xs=tiles.map(t=>t[0]),ys=tiles.map(t=>t[1]),len=tiles.length?Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))+1:0;
 add(tiles.length&&len<=R.len,`Longueur de ${R.len} cases au plus (actuellement ${len})`);
 const sp=spawnIndex(tiles);if(sp>=0){const [sx,sy]=tiles[sp],reach=Math.max(sx-Math.min(...xs),Math.max(...xs)-sx,sy-Math.min(...ys),Math.max(...ys)-sy);add(reach<=2,'La créature (✦, sur la plus forte dalle) apparaît à 2 cases au plus des bords')}else add(false,'La créature apparaît sur la plus forte dalle');
 if(rarity===5&&element!=='multi'){const v=tiles.map(t=>t[2]).sort((a,b)=>a-b);add(tiles.length===6&&[3,3,5,5,6,6].every((b,k)=>Math.abs(v[k]-b)<=1),'Légendaire : valeurs proches de 3, 3, 5, 5, 6, 6 (un point d’écart au plus)')}
 if(rarity===5&&tiles.length===6){const c=canon(tiles),twin=existing.find(d=>d&&!d.pure&&(d.rarity??d.lv)===5&&d.nd===2&&d.c?.length===6&&canon(d.c)===c);add(!twin,twin?`Forme déjà utilisée par ${twin.cn}`:'Forme légendaire inédite')}
 return{ok:checks.every(c=>c.ok),checks,spawn:sp,total}}
const api={RULES,totalFor,connected,spawnIndex,canon,check};root.HackeniaDiceRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
