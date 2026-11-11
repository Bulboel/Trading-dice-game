/* v248 — Roue des éléments dans les duels. Aucun effet sur les règles ou les récompenses. */
(()=>{'use strict';
const game=window.hackeniaGame,settings=window.HackeniaSettings;
const elements=[
 {name:'Feu',file:'Dé Feu v.2.glb',color:'#ee8754'},
 {name:'Eau',file:'Dé eau v.2.glb',color:'#76b9f1'},
 {name:'Glace',file:'Dé glace V.2.glb',color:'#a6e3f4'},
 {name:'Terre',file:'Dé terre v.2.glb',color:'#b9a27c'},
 {name:'Vent',file:'Dé vent v.2.glb',color:'#a8d589'},
 {name:'Foudre',file:'Dé foudre v.2.glb',color:'#c1a2fa'}
];
const host=document.createElement('section');
host.id='element-wheel-host';host.hidden=true;host.setAttribute('aria-label','Roue des éléments');
host.innerHTML='<div class="element-wheel" role="button" tabindex="0" aria-label="Roue des éléments. Touchez pour arrêter."><div class="element-wheel-disc"></div><span class="element-wheel-pointer" aria-hidden="true"></span><div class="element-wheel-hub" aria-hidden="true">TOUCHEZ<br>POUR ARRÊTER</div></div><p class="element-wheel-status" role="status" aria-live="polite">La roue tourne</p>';
const mr=document.getElementById('mr');
if(!mr)return;
const pedestal=mr.querySelector('.roll-pedestal');
if(pedestal)pedestal.after(host);else mr.prepend(host);
const disc=host.querySelector('.element-wheel-disc'),wheel=host.querySelector('.element-wheel'),hub=host.querySelector('.element-wheel-hub'),status=host.querySelector('.element-wheel-status');
let modelsReady=false,angle=0,frame=0,lastTime=0,state='hidden',stopPlan=null,lastResult=-1;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||settings?.get?.().motion===false;
function buildModels(){
 if(modelsReady)return;modelsReady=true;
 window.hackeniaGame?.loadModelViewer?.();
 const base='assets/models-web/';
 elements.forEach((element,i)=>{
  const model=document.createElement('model-viewer');
  model.className='element-wheel-model';model.setAttribute('src',base+element.file);model.setAttribute('alt','Dé élémentaire '+element.name);
  model.setAttribute('camera-controls','');model.setAttribute('disable-zoom','');model.setAttribute('disable-pan','');model.setAttribute('disable-tap','');
  model.setAttribute('interaction-prompt','none');model.setAttribute('shadow-intensity','0.45');model.setAttribute('exposure','1.08');
  model.setAttribute('camera-orbit','0deg 68deg auto');model.setAttribute('field-of-view','34deg');model.setAttribute('loading','eager');model.style.setProperty('--dice-element',element.color);
  const a=(i*60-90)*Math.PI/180,radius=37;
  model.style.left='calc(50% + '+(Math.cos(a)*radius).toFixed(2)+'px)';model.style.top='calc(50% + '+(Math.sin(a)*radius).toFixed(2)+'px');
  disc.append(model);
 });
}
function setAngle(v){angle=((v%360)+360)%360;disc.style.transform='rotate('+angle+'deg)'}
function resultIndex(v){return ((Math.round((((360-(v%360))%360)/60))%6)+6)%6}
function stop(){
 if(state!=='spinning')return;
 const now=performance.now(),progress=stopPlan?.progress??0;
 if(reduced()){if(frame)cancelAnimationFrame(frame);frame=0;setAngle(Math.floor(Math.random()*360));finish();return}
 stopPlan={from:angle,to:angle+58,duration:2200,started:now};
 state='slowing';hub.innerHTML='LA ROUE<br>RALENTIT';status.textContent='La roue s’arrête…';
}
function finish(){
 state='stopped';stopPlan=null;
 const ix=resultIndex(angle);lastResult=ix;
 const name=elements[ix].name;
 hub.textContent=name.toUpperCase();status.dataset.result='true';status.textContent='Élément : '+name;
 wheel.setAttribute('aria-label','Résultat : '+name+'. Touchez pour relancer la roue.');
}
function start(){
 if(frame)cancelAnimationFrame(frame);frame=0;stopPlan=null;lastTime=0;state='spinning';lastResult=-1;
 status.dataset.result='false';status.textContent='Touchez la roue pour arrêter';
 hub.innerHTML='TOUCHEZ<br>POUR ARRÊTER';wheel.setAttribute('aria-label','Roue des éléments. Touchez pour arrêter.');
 if(reduced()){setAngle(0);state='spinning';status.textContent='Touchez pour tirer un élément';wheel.setAttribute('aria-label','Roue des éléments. Touchez pour tirer.');return}
 function tick(now){
  if(!lastTime)lastTime=now;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
  if(state==='spinning')setAngle(angle+18*dt);
  else if(state==='slowing'&&stopPlan){
   const t=Math.min(1,(now-stopPlan.started)/stopPlan.duration),ease=1-Math.pow(1-t,3);
   setAngle(stopPlan.from+(stopPlan.to-stopPlan.from)*ease);
   if(t>=1){frame=0;finish();return}
  }else{frame=0;return}
  frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
}
function activate(on){
 if(on){if(host.hidden){host.hidden=false;buildModels();setAngle(0);start()}}
 else if(!host.hidden){host.hidden=true;if(frame)cancelAnimationFrame(frame);frame=0;state='hidden';setAngle(0);status.dataset.result='false'}
}
function sync(){
 const visible=!!game?.hasMatch?.()&&!game?.snapshot?.()?.result&&settings?.get?.().elementWheel!==false&&!document.body.classList.contains('portal-open')&&!document.body.classList.contains('start-menu-open');
 activate(visible);
}
wheel.addEventListener('click',()=>{if(state==='spinning')stop();else if(state==='slowing')return;else start()});
wheel.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();wheel.click()}});
setInterval(sync,350);sync();
})();