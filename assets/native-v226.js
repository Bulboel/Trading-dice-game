/* v226 — Application Android (Capacitor) : bouton retour, vibrations, barre d'état, arrière-plan.
   Sur le site web, seules les vibrations (navigator.vibrate) sont utilisées, si le téléphone les permet. */
(()=>{'use strict';
const C=window.Capacitor,native=!!C?.isNativePlatform?.(),P=C?.Plugins||{};
const allowed=()=>window.HackeniaSettings?.get?.().vibration!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
function buzz(kind){if(!allowed())return;try{
 if(native&&P.Haptics){if(kind==='win'||kind==='loss'||kind==='draw')P.Haptics.notification({type:kind==='win'?'SUCCESS':kind==='loss'?'ERROR':'WARNING'});else P.Haptics.impact({style:kind==='combat'?'MEDIUM':'LIGHT'});return}
 navigator.vibrate?.(kind==='combat'?35:kind==='win'?[40,60,80]:kind==='loss'?120:kind==='draw'?[30,40,30]:15)}catch{}}
addEventListener('hackenia-stat',e=>{const k=e.detail?.kind;if(k==='combat'||k==='summon')buzz(k)});
addEventListener('hackenia-match-end',e=>{const o=e.detail?.outcome;buzz(o==='win'||o==='local'?'win':o==='loss'?'loss':'draw')});
window.HackeniaHaptics={buzz};
if(!native)return;
document.documentElement.classList.add('native-app');
// Bouton retour Android : ferme la fenêtre ouverte, sinon revient au menu, sinon met l'app en arrière-plan.
P.App?.addListener('backButton',()=>{
 const dlg=[...document.querySelectorAll('dialog[open]')].pop();if(dlg){dlg.close();return}
 const end=document.getElementById('match-end');if(end&&!end.hidden){window.HackeniaMatchEnd?.close();return}
 if(!document.body.classList.contains('portal-open')){document.getElementById('menu-return')?.click();return}
 const back=document.getElementById('portal-back');if(back&&!back.hidden){back.click();return}
 P.App.minimizeApp?P.App.minimizeApp():P.App.exitApp()});
P.App?.addListener('appStateChange',({isActive})=>dispatchEvent(new CustomEvent('hackenia-app-state',{detail:{active:isActive}})));
P.StatusBar?.setBackgroundColor?.({color:'#10211d'}).catch?.(()=>{});P.StatusBar?.setStyle?.({style:'DARK'}).catch?.(()=>{});
})();
