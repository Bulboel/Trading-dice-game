/* v225 — Mode hors ligne : enregistrement du service worker (sw.js), indicateur « Hors ligne »,
   téléchargement complet du contenu et état dans Options › Sauvegarde. */
(()=>{'use strict';
const native=!!window.Capacitor?.isNativePlatform?.(),sw=navigator.serviceWorker,ok=!native&&!!sw&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');
const $=id=>document.getElementById(id);
function setText(t){const el=$('offline-status');if(el)el.textContent=t}
function bar(done,total){const b=document.querySelector('.offline-bar');if(!b)return;b.hidden=!total;b.querySelector('i').style.width=(total?Math.round(done/total*100):0)+'%'}
function post(msg){if(!ok)return false;const c=sw.controller;if(c){c.postMessage(msg);return true}sw.ready.then(r=>r.active?.postMessage(msg));return true}
function status(){if(native){setText('✔ Application : tout le jeu est déjà sur votre appareil.');const b=document.querySelector('[data-action="offline-download"]');if(b)b.hidden=true;return}if(!ok){setText('Le mode hors ligne n’est pas disponible dans ce navigateur.');return}setText(navigator.onLine?'Vérification…':'Vous êtes hors ligne.');post({type:'offline-status'})}
function downloadAll(){if(!ok){setText('Le mode hors ligne n’est pas disponible dans ce navigateur.');return}if(!navigator.onLine){setText('Connectez-vous à Internet pour télécharger le contenu.');return}
 const btn=document.querySelector('[data-action="offline-download"]');if(btn)btn.disabled=true;setText('Téléchargement en cours…');post({type:'download-all'})}
if(ok){sw.addEventListener('message',e=>{const d=e.data||{},btn=document.querySelector('[data-action="offline-download"]');
  if(d.type==='offline-status'){const full=d.have>=d.total;setText(full?'✔ Tout le jeu est disponible hors ligne.':`${d.have} / ${d.total} fichiers lourds déjà sur l’appareil. Le jeu se lance hors ligne ; les éléments manquants se téléchargeront à leur première utilisation.`);bar(0,0);if(btn){btn.disabled=full;btn.textContent=full?'Tout est téléchargé':'Télécharger tout le jeu'}}
  if(d.type==='download-progress'){setText(`Téléchargement… ${d.done} / ${d.total}`);bar(d.done,d.total)}
  if(d.type==='download-done'){setText(d.failed?`Terminé, ${d.failed} fichier(s) n’ont pas pu être téléchargés : réessayez plus tard.`:'✔ Tout le jeu est disponible hors ligne.');bar(0,0);if(btn){btn.disabled=!d.failed;btn.textContent=d.failed?'Réessayer':'Tout est téléchargé'}}});
 addEventListener('load',()=>sw.register('sw.js',{scope:'./'}).catch(err=>console.info('Mode hors ligne indisponible :',err)))}
// Indicateur réseau
function net(){document.body?.classList.toggle('is-offline',!navigator.onLine);let b=$('offline-badge');if(!navigator.onLine){if(!b){b=document.createElement('div');b.id='offline-badge';b.setAttribute('role','status');b.innerHTML='<span aria-hidden="true">⚡̸</span> Hors ligne · le PVP et la sauvegarde en ligne reprendront au retour du réseau';document.body.append(b)}b.hidden=false}else if(b)b.hidden=true}
addEventListener('online',()=>{net();status()});addEventListener('offline',()=>{net();status()});addEventListener('DOMContentLoaded',net);if(document.readyState!=='loading')net();
window.HackeniaOffline={status,downloadAll,supported:ok};
})();
