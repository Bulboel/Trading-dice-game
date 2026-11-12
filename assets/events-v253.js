/* v253 — Événements saisonniers. Le premier : « La nuit des Lumières » (Noël), du 1er décembre au 6 janvier inclus.
   Pour tester avant l'heure : ajouter ?evenement=noel à l'adresse (mémorisé pour la session). */
(function(root){'use strict';
const EVENTS={noel:{name:'La nuit des Lumières',terrain:'noel',from:[12,1],to:[1,6],label:'du 1er décembre au 6 janvier'}};
function forced(id){try{const q=new URLSearchParams(root.location?.search||'').get('evenement');if(q)root.sessionStorage?.setItem('hackenia-event-preview',q);return(root.sessionStorage?.getItem('hackenia-event-preview')||'').split(',').includes(id)}catch{return false}}
function inWindow(e,now){const m=now.getMonth()+1,d=now.getDate(),v=m*100+d,a=e.from[0]*100+e.from[1],b=e.to[0]*100+e.to[1];return a<=b?v>=a&&v<=b:v>=a||v<=b}
function active(id,now=new Date()){const e=EVENTS[id];return!!e&&(forced(id)||inWindow(e,now))}
function terrainOpen(t,now=new Date()){const e=Object.entries(EVENTS).find(([,v])=>v.terrain===t);return!e||active(e[0],now)}
const api={EVENTS,active,terrainOpen,inWindow};root.HackeniaEvents=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
