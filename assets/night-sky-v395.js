/* v395 — Ciel du menu : étoiles plus nombreuses qui scintillent franchement, quelques étoiles à quatre branches qui s'illuminent,
   étoiles filantes naturelles (rares, accélèrent dans leur propre direction, tête lumineuse et traînée qui s'étire puis s'efface)
   et lune soignée sur ordinateur seulement. Visible uniquement dans les menus (body.portal-open). Respecte la réduction des animations. */
(()=>{'use strict';
const sky=document.createElement('div');sky.id='night-sky';sky.setAttribute('aria-hidden','true');
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const tints=['#ffffff','#ffffff','#ffffff','#dfe9ff','#cfe0ff','#fff1d6','#ffe3c2','#e9dcff'];
const layers=[[110,.5,1.1,'far',[2,5]],[60,.9,1.7,'mid',[1.8,4.5]],[26,1.4,2.4,'near',[1.6,3.8]]];
sky.innerHTML='<div class="sky-band"></div>'+layers.map(([n,min,max,cls,[t0,t1]])=>'<div class="sky-layer '+cls+'">'+Array.from({length:n},()=>{const s=rnd(min,max).toFixed(2);return '<i style="left:'+rnd(0,100).toFixed(2)+'%;top:'+rnd(0,100).toFixed(2)+'%;width:'+s+'px;height:'+s+'px;color:'+pick(tints)+';--tw:'+rnd(t0,t1).toFixed(2)+'s;--td:-'+rnd(0,6).toFixed(2)+'s;--lo:'+rnd(.05,.35).toFixed(2)+'"></i>'}).join('')+'</div>').join('')+
 '<div class="sky-glints">'+Array.from({length:9},()=>'<b style="left:'+rnd(4,96).toFixed(2)+'%;top:'+rnd(3,92).toFixed(2)+'%;--gs:'+rnd(.7,1.3).toFixed(2)+';--gd:'+rnd(5,11).toFixed(2)+'s;--gl:-'+rnd(0,11).toFixed(2)+'s;color:'+pick(['#ffffff','#dfe9ff','#fff1d6','#e9dcff'])+'"></b>').join('')+'</div>'+
 '<div class="sky-moon"><span class="moon-halo"></span><span class="moon-disc"><i class="mare a"></i><i class="mare b"></i><i class="mare c"></i><i class="crater c1"></i><i class="crater c2"></i><i class="crater c3"></i><i class="crater c4"></i><i class="crater c5"></i><span class="moon-face"><u class="eye l"></u><u class="eye r"></u><u class="cheek l"></u><u class="cheek r"></u><u class="mouth"></u></span></span></div>'+
 '<span class="shooting-star"><em></em></span><span class="shooting-star"><em></em></span>';
document.body.prepend(sky);
const stars=[...sky.querySelectorAll('.shooting-star')];let k=0;
function shoot(){const calm=document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!calm&&document.body.classList.contains('portal-open')&&!document.hidden){const s=stars[k++%stars.length],ltr=Math.random()<.5,W=innerWidth,H=innerHeight;
  /* départ dans le tiers haut, direction descendante douce (vers la gauche ou la droite) */
  const ang=ltr?rnd(18,38):rnd(142,162),len=rnd(90,170),dist=rnd(.28,.45)*Math.max(W,H);
  s.style.left=(ltr?rnd(5,55):rnd(45,95))+'%';s.style.top=rnd(3,35)+'%';
  s.style.setProperty('--ang',ang+'deg');s.style.setProperty('--len',len+'px');s.style.setProperty('--dist',dist+'px');s.style.setProperty('--dur',rnd(.8,1.3).toFixed(2)+'s');
  s.classList.remove('go');void s.offsetWidth;s.classList.add('go')}
 setTimeout(shoot,rnd(7000,18000))}
setTimeout(shoot,4000);

/* v399 — Secrets du ciel. Ordinateur : toucher la lune la fait réagir (clin d'œil, joues roses, petit « ding »),
   puis l'une de trois scènes au hasard : Messire Balai qui traverse la lune, un loup qui hurle, une pluie d'étoiles filantes.
   Téléphone (sans lune) : une comète traverse lentement l'écran de temps en temps ; l'attraper fait le même effet.
   Chaque lune taquinée compte 1 point, chaque comète 5 : 10 points valident le défi caché « Embêter la lune ». */
let AC=null;const audio=()=>{const S=window.HackeniaSettings?.get?.();if(!S||!S.sound)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return {ac:AC,vol:Math.max(.05,S.volume??.5)}}catch{return null}};
function tone(type,f0,f1,dur,gain,delay=0){const a=audio();if(!a)return;const {ac,vol}=a,t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*vol,t+Math.min(.05,dur/4));g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+dur+.05)}
function noise(dur,f0,f1,gain,delay=0){const a=audio();if(!a)return;const {ac,vol}=a,t=ac.currentTime+delay,len=Math.floor(ac.sampleRate*dur),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;const src=ac.createBufferSource(),bp=ac.createBiquadFilter(),g=ac.createGain();src.buffer=buf;bp.type='bandpass';bp.Q.value=1.4;bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*vol,t+dur*.35);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(bp).connect(g).connect(ac.destination);src.start(t);src.stop(t+dur)}
const SFX={ding(){tone('sine',880,1320,.5,.18);tone('sine',1760,1760,.35,.06,.04)},
 whoosh(){noise(1.1,300,2400,.32)},
 howl(){const a=audio();if(!a)return;const {ac,vol}=a,t=ac.currentTime,o=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),g=ac.createGain();o.type='sawtooth';o.frequency.setValueAtTime(260,t);o.frequency.linearRampToValueAtTime(520,t+.5);o.frequency.linearRampToValueAtTime(470,t+1.5);o.frequency.linearRampToValueAtTime(330,t+2.2);lfo.frequency.value=5.5;lg.gain.value=9;lfo.connect(lg).connect(o.frequency);const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09*vol,t+.35);g.gain.setValueAtTime(.09*vol,t+1.7);g.gain.exponentialRampToValueAtTime(.0001,t+2.3);o.connect(lp).connect(g).connect(ac.destination);o.start(t);lfo.start(t);o.stop(t+2.4);lfo.stop(t+2.4)},
 shimmer(){[1568,2093,2637,3136,2349,2794].forEach((f,i)=>tone('sine',f,f*1.02,.6,.07,i*.11))}};
const calm=()=>document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const poke=amount=>{try{window.dispatchEvent(new CustomEvent('hackenia:moon-poke',{detail:{amount}}))}catch{}};
const moon=sky.querySelector('.sky-moon'),disc=sky.querySelector('.moon-disc');
function fx(html,cls,ms){const el=document.createElement('div');el.className='sky-fx '+cls;el.innerHTML=html;sky.append(el);setTimeout(()=>el.remove(),ms);return el}
function scene(){const r=moon.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,k=Math.floor(Math.random()*3);
 if(k===0){const el=fx('<svg viewBox="0 0 100 100"><polygon points="89.0,32.0 83.3,34.0 88.0,37.8 82.0,37.8 85.0,42.9 79.4,40.8 80.5,46.7 75.9,42.8 75.0,48.7 72.0,43.5 69.0,48.7 68.1,42.8 63.5,46.7 64.6,40.8 59.0,42.9 62.0,37.8 56.0,37.8 60.7,34.0 55.0,32.0 60.7,30.0 56.0,26.2 62.0,26.2 59.0,21.1 64.6,23.2 63.5,17.3 68.1,21.2 69.0,15.3 72.0,20.5 75.0,15.3 75.9,21.2 80.5,17.3 79.4,23.2 85.0,21.1 82.0,26.2 88.0,26.2 83.3,30.0"/><path d="M60 42 L64 46 L16 82 L11 78 Z"/><path d="M8 84 q-6 2 -8 -1" stroke="#05060c" stroke-width="2" fill="none"/><g fill="none" stroke="#ffffff55" stroke-width="1.2"><path d="M40 70 h-26"/><path d="M50 62 h-22"/></g></svg>','fx-balai',3200);el.style.left=(cx-r.width*1.4)+'px';el.style.top=(cy-r.height*.35)+'px';el.style.setProperty('--w',r.width*.95+'px');el.style.setProperty('--dx',r.width*2.8+'px');SFX.whoosh()}
 else if(k===1){const el=fx('<svg viewBox="0 0 100 100"><path d="M0 100 Q30 84 52 86 Q78 88 100 100 Z"/><path d="M40 90 L40 72 L37 62 L36 54 L31 46 L25 38 L16 31 L15 27 L23 26 L29 25 L32 19 L35 9 L38 18 L41 21 L46 30 L52 41 L60 51 L66 61 L70 71 L76 75 L89 71 L85 79 L75 83 L73 90 Z"/></svg>','fx-wolf',3600);el.style.left=(cx-r.width*.55)+'px';el.style.top=(r.bottom-r.height*.62)+'px';el.style.setProperty('--w',r.width*.95+'px');setTimeout(()=>SFX.howl(),350)}
 else{for(let i=0;i<6;i++){const el=fx('<em></em>','fx-star',2400);el.style.left=(cx+(Math.random()-.5)*r.width*.6)+'px';el.style.top=(cy+(Math.random()-.5)*r.height*.6)+'px';el.style.setProperty('--ang',(20+Math.random()*60)+'deg');el.style.setProperty('--d',(i*.16).toFixed(2)+'s');el.style.setProperty('--dist',(180+Math.random()*220)+'px')}SFX.shimmer()}}
let busy=0;function pokeMoon(){if(busy)return;busy=1;disc.classList.remove('poked');void disc.offsetWidth;disc.classList.add('poked');SFX.ding();poke(1);setTimeout(()=>{if(!calm())scene()},650);setTimeout(()=>{busy=0},1500)}
const hit=document.createElement('button');hit.type='button';hit.id='moon-hit';hit.setAttribute('aria-label','La lune');hit.title='La lune';hit.addEventListener('click',pokeMoon);document.body.append(hit);
function placeHit(){const show=document.body.classList.contains('portal-open')&&document.body.dataset.portalView==='home'&&getComputedStyle(moon).display!=='none';hit.hidden=!show;if(!show)return;const r=moon.getBoundingClientRect();Object.assign(hit.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'})}
setInterval(placeHit,700);addEventListener('resize',placeHit);
/* comète (téléphone) : lente, bien visible, facile à toucher */
const comet=document.createElement('button');comet.type='button';comet.id='sky-comet';comet.setAttribute('aria-label','Une comète');comet.innerHTML='<span class="comet-tail"></span><span class="comet-head"></span>';comet.hidden=true;document.body.append(comet);
function launchComet(){const mobile=matchMedia('(max-width:700px)').matches,home=document.body.classList.contains('portal-open')&&document.body.dataset.portalView==='home';
 if(mobile&&home&&!document.hidden&&!calm()&&comet.hidden){const ltr=Math.random()<.5,W=innerWidth,H=innerHeight,y0=rnd(.13,.2)*H,y1=y0+rnd(.02,.06)*H;comet.style.setProperty('--x0',(ltr?-60:W+60)+'px');comet.style.setProperty('--x1',(ltr?W+60:-60)+'px');comet.style.setProperty('--y0',y0+'px');comet.style.setProperty('--y1',y1+'px');comet.style.setProperty('--tail',ltr?'180deg':'0deg');comet.classList.remove('go','caught');comet.hidden=false;void comet.offsetWidth;comet.classList.add('go')}
 setTimeout(launchComet,rnd(45000,80000))}
comet.addEventListener('animationend',e=>{if(e.animationName==='comet-cross')comet.hidden=true});
comet.addEventListener('click',()=>{if(comet.classList.contains('caught'))return;const r=comet.getBoundingClientRect();comet.style.setProperty('--cx',r.left+'px');comet.style.setProperty('--cy',r.top+'px');comet.classList.add('caught');SFX.shimmer();poke(5);for(let i=0;i<10;i++){const el=fx('<em></em>','fx-spark',1400);el.style.left=(r.left+r.width/2)+'px';el.style.top=(r.top+r.height/2)+'px';el.style.setProperty('--a',(i*36)+'deg')}setTimeout(()=>{comet.hidden=true},700)});
setTimeout(launchComet,20000);
window.HackeniaSky={pokeMoon,launchComet:()=>{comet.hidden=true;const t=setTimeout;launchComet()}};
})();
