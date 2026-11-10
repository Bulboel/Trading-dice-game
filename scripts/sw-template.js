/* Hackénia — mode hors ligne (service worker). FICHIER GÉNÉRÉ par scripts/build-offline.py : ne pas modifier sw.js à la main.
   - Au premier lancement : l'application (pages, scripts, styles, icônes, portraits miniatures) est gardée sur l'appareil.
   - Ensuite : la page se recharge depuis le réseau quand il est là (mises à jour), sinon depuis l'appareil.
   - Fichiers versionnés (?v=…), modèles 3D, portraits, bibliothèques : servis depuis l'appareil, téléchargés une seule fois.
   - Le PVP et la sauvegarde en ligne (Supabase) ne passent jamais par le cache. */
const VERSION='__VERSION__';
const SHELL=__SHELL__;
const FULL=__FULL__;
const CDN=[];// v226 : les bibliothèques sont intégrées au site (assets/vendor)
const APP='hackenia-app-'+VERSION,MEDIA='hackenia-media-v1';
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(APP);
 // Chaque fichier séparément : un fichier manquant ne bloque pas l'installation.
 await Promise.all([...SHELL,...CDN].map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>null)));await self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('hackenia-app-')&&k!==APP)await caches.delete(k);await self.clients.claim()})())});
const isApi=u=>/supabase\.co$/.test(u.hostname)||u.pathname.includes('/realtime/');
const isMedia=u=>/\.(glb|webp|png|jpg|mp3|svg)$/i.test(u.pathname);
async function fromCache(req){return(await caches.match(req))||(await caches.match(req,{ignoreSearch:true}))}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);
 if(isApi(url)||req.headers.has('range'))return;// réseau uniquement
 if(req.mode==='navigate'){e.respondWith((async()=>{try{const res=await fetch(req);if(res.ok){const c=await caches.open(APP);c.put('./index.html',res.clone())}return res}catch{return(await caches.match('./index.html'))||(await caches.match('./'))||Response.error()}})());return}
 const sameOrigin=url.origin===self.location.origin,versioned=url.search.includes('v=')||/@\d/.test(url.pathname);
 if(!sameOrigin&&!/jsdelivr|fonts\.(googleapis|gstatic)|githubusercontent/.test(url.hostname))return;
 e.respondWith((async()=>{const hit=await caches.match(req);
  if(hit&&(versioned||isMedia(url)||!sameOrigin))return hit;// immuable : directement depuis l'appareil
  try{const res=await fetch(req);if(res.ok||res.type==='opaque'){const c=await caches.open(isMedia(url)?MEDIA:APP);c.put(req,res.clone())}return res}
  catch{return hit||(await fromCache(req))||Response.error()}})())});
// « Télécharger tout le jeu » (Options) : modèles 3D, animations, portraits et images de l'Histoire.
self.addEventListener('message',e=>{if(e.data?.type==='download-all')e.waitUntil((async()=>{const c=await caches.open(MEDIA),todo=FULL;let done=0,failed=0;
 const report=()=>e.source?.postMessage({type:'download-progress',done,failed,total:todo.length});
 for(let i=0;i<todo.length;i+=6){await Promise.all(todo.slice(i,i+6).map(async u=>{try{if(!(await c.match(u))){const r=await fetch(u);if(!r.ok)throw 0;await c.put(u,r)}}catch{failed++}done++}));report()}
 e.source?.postMessage({type:'download-done',done,failed,total:todo.length})})());
 if(e.data?.type==='offline-status')e.waitUntil((async()=>{const c=await caches.open(MEDIA);let have=0;for(const u of FULL)if(await c.match(u))have++;e.source?.postMessage({type:'offline-status',have,total:FULL.length})})())});
