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
   puis l'une de trois scènes au hasard : Messire Balai qui traverse la lune ou une pluie d'étoiles filantes (le loup a été retiré en v412).
   Téléphone (sans lune) : une comète traverse lentement l'écran de temps en temps ; l'attraper fait le même effet.
   Chaque lune taquinée compte 1 point, chaque comète 5 : 10 points valident le défi caché « Embêter la lune ». */
let AC=null;const audio=()=>{const S=window.HackeniaSettings?.get?.();if(!S||!S.sound)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();return {ac:AC,vol:Math.max(.05,S.volume??.5)}}catch{return null}};
function tone(type,f0,f1,dur,gain,delay=0){const a=audio();if(!a)return;const {ac,vol}=a,t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*vol,t+Math.min(.05,dur/4));g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+dur+.05)}
function noise(dur,f0,f1,gain,delay=0){const a=audio();if(!a)return;const {ac,vol}=a,t=ac.currentTime+delay,len=Math.floor(ac.sampleRate*dur),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;const src=ac.createBufferSource(),bp=ac.createBiquadFilter(),g=ac.createGain();src.buffer=buf;bp.type='bandpass';bp.Q.value=1.4;bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*vol,t+dur*.35);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(bp).connect(g).connect(ac.destination);src.start(t);src.stop(t+dur)}
const SFX={ding(){tone('sine',880,1320,.5,.18);tone('sine',1760,1760,.35,.06,.04)},
 whoosh(){noise(1.1,300,2400,.32)},
 shimmer(){[1568,2093,2637,3136,2349,2794].forEach((f,i)=>tone('sine',f,f*1.02,.6,.07,i*.11))}};
const calm=()=>document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const poke=amount=>{try{window.dispatchEvent(new CustomEvent('hackenia:moon-poke',{detail:{amount}}))}catch{}};
const moon=sky.querySelector('.sky-moon'),disc=sky.querySelector('.moon-disc');
function fx(html,cls,ms){const el=document.createElement('div');el.className='sky-fx '+cls;el.innerHTML=html;sky.append(el);setTimeout(()=>el.remove(),ms);return el}
function scene(){const r=moon.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,k=Math.floor(Math.random()*2);
 if(k===0){/* v412 — vraie silhouette de Messire Balai (tête en soleil de crins, manche sculpté), en ombre chinoise */const el=fx('<span class="fx-balai-body"><img src="assets/sky/balai-silhouette.webp?v=20270102-v425" alt=""></span><i class="fx-balai-dust"></i>','fx-balai',3200);el.style.left=(cx-r.width*1.25)+'px';el.style.top=(cy-r.height*.32)+'px';el.style.setProperty('--w',r.width*.42+'px');el.style.setProperty('--dx',r.width*2.5+'px');SFX.whoosh()}
 else{for(let i=0;i<6;i++){const el=fx('<em></em>','fx-star',2400);el.style.left=(cx+(Math.random()-.5)*r.width*.6)+'px';el.style.top=(cy+(Math.random()-.5)*r.height*.6)+'px';el.style.setProperty('--ang',(20+Math.random()*60)+'deg');el.style.setProperty('--d',(i*.16).toFixed(2)+'s');el.style.setProperty('--dist',(180+Math.random()*220)+'px')}SFX.shimmer()}}
let busy=0;function pokeMoon(){if(busy)return;busy=1;disc.classList.remove('poked');void disc.offsetWidth;disc.classList.add('poked');SFX.ding();poke(1);setTimeout(()=>{if(!calm())scene()},650);setTimeout(()=>{busy=0},1500)}
const hit=document.createElement('button');hit.type='button';hit.id='moon-hit';hit.setAttribute('aria-label','La lune');hit.title='La lune';hit.addEventListener('click',pokeMoon);document.body.append(hit);
function placeHit(){const show=document.body.classList.contains('portal-open')&&document.body.dataset.portalView==='home'&&getComputedStyle(moon).display!=='none';hit.hidden=!show;if(!show)return;const r=moon.getBoundingClientRect();Object.assign(hit.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'})}
setInterval(placeHit,700);addEventListener('resize',placeHit);
/* v401 — comète (téléphone) : vraie traînée de particules dessinée en continu sur un canevas.
   Le noyau émet à chaque image des particules d'ions (fines, bleu-blanc → indigo) et de poussière (douces, rose → rouge → violet)
   qui s'écoulent vers l'arrière, s'évasent et s'estompent : la queue ondule et vit pendant que la comète avance. */
const cv=document.createElement('canvas');cv.id='comet-canvas';sky.append(cv);const cx2=cv.getContext('2d');let DPR=1;
function sizeCanvas(){DPR=Math.min(2,window.devicePixelRatio||1);cv.width=innerWidth*DPR;cv.height=innerHeight*DPR}sizeCanvas();addEventListener('resize',sizeCanvas);
const sprite=(stops,r=32)=>{const c=document.createElement('canvas');c.width=c.height=r*2;const g=c.getContext('2d'),gr=g.createRadialGradient(r,r,0,r,r,r);stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,r*2,r*2);return c};
const SPR={ion:sprite([[0,'rgba(235,245,255,1)'],[.25,'rgba(150,190,255,.7)'],[1,'rgba(90,90,255,0)']]),
 dust0:sprite([[0,'rgba(255,170,190,.85)'],[.35,'rgba(230,70,110,.4)'],[1,'rgba(150,30,90,0)']]),
 dust1:sprite([[0,'rgba(170,80,220,.7)'],[.4,'rgba(110,50,170,.32)'],[1,'rgba(60,30,120,0)']]),
 glow:sprite([[0,'rgba(255,255,255,1)'],[.12,'rgba(230,246,255,.95)'],[.3,'rgba(140,200,255,.45)'],[.6,'rgba(100,130,255,.12)'],[1,'rgba(90,110,255,0)']],64)};
const C={on:false,caught:false,t0:0,dur:34000,x0:0,y0:0,x1:0,y1:0,parts:[],last:0,hx:0,hy:0,dx:1,dy:0};
const comet=document.createElement('button');comet.type='button';comet.id='sky-comet';comet.setAttribute('aria-label','Une comète');comet.hidden=true;document.body.append(comet);
function emit(n,kind,hx,hy){const back=[-C.dx,-C.dy],perp=[-C.dy,C.dx];for(let k=0;k<n;k++){const ion=kind==='ion',sp=ion?rnd(95,150):rnd(45,85),spread=ion?rnd(-3,3):rnd(-14,14),drift=ion?0:rnd(3,9);
  C.parts.push({x:hx+rnd(-1.5,1.5),y:hy+rnd(-1.5,1.5),vx:back[0]*sp+perp[0]*spread,vy:back[1]*sp+perp[1]*spread+drift,life:0,max:ion?rnd(1.5,2.3):rnd(2,3.2),s:ion?rnd(1.6,2.6):rnd(4,7.5),g:ion?.9:1.25,kind:ion?'ion':(Math.random()<.55?'dust0':'dust1')})}}
function frame(now){if(!C.on)return;requestAnimationFrame(frame);const dt=Math.min(.05,(now-(C.last||now))/1000);C.last=now;const t=Math.min(1,(now-C.t0)/C.dur);
 if(!C.caught&&t<1){C.hx=C.x0+(C.x1-C.x0)*t;C.hy=C.y0+(C.y1-C.y0)*t+Math.sin(t*Math.PI)*-8;emit(6,'ion',C.hx,C.hy);emit(6,'dust',C.hx,C.hy);comet.style.transform=`translate(${C.hx}px,${C.hy}px)`}
 const ctx=cx2;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);ctx.globalCompositeOperation='lighter';
 C.parts=C.parts.filter(p=>(p.life+=dt)<p.max);for(const p of C.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.992;p.vy*=.992;const a=1-p.life/p.max,sz=p.s*(1+p.life*p.g);ctx.globalAlpha=a*(p.kind==='ion'?.2:.055);ctx.drawImage(SPR[p.kind],p.x-sz,p.y-sz,sz*2,sz*2)}
 if(!C.caught&&t<1){const pulse=1+Math.sin(now/420)*.08;ctx.globalAlpha=1;ctx.drawImage(SPR.glow,C.hx-22*pulse,C.hy-22*pulse,44*pulse,44*pulse);ctx.globalAlpha=1;ctx.drawImage(SPR.glow,C.hx-7,C.hy-7,14,14)}
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 if((t>=1||C.caught)&&(!C.parts.length||now-C.t0>C.dur+6000)){C.parts=[];C.on=false;comet.hidden=true;ctx.clearRect(0,0,innerWidth,innerHeight)}else if(t>=1)comet.hidden=true}
function launchComet(force,dur){const mobile=matchMedia('(max-width:700px)').matches,home=document.body.classList.contains('portal-open')&&document.body.dataset.portalView==='home';
 if((force||(mobile&&home&&!document.hidden))&&!calm()&&!C.on){const ltr=Math.random()<.5,W=innerWidth,H=innerHeight,top=.07*H,bot=.29*H;C.y0=rnd(top,bot);C.y1=Math.min(bot,Math.max(top,C.y0+rnd(-.12,.14)*H));C.x0=ltr?-30:W+30;C.x1=ltr?W+60:-60;
  const L=Math.hypot(C.x1-C.x0,C.y1-C.y0);C.dx=(C.x1-C.x0)/L;C.dy=(C.y1-C.y0)/L;C.dur=dur||rnd(28000,40000);C.t0=performance.now();C.last=0;C.parts=[];C.caught=false;C.on=true;comet.hidden=false;sizeCanvas();requestAnimationFrame(frame)}
 if(!force)setTimeout(()=>launchComet(),rnd(45000,80000))}
comet.addEventListener('click',()=>{if(!C.on||C.caught)return;C.caught=true;comet.hidden=true;SFX.shimmer();poke(5);
 for(let k=0;k<70;k++){const a=Math.random()*Math.PI*2,sp=rnd(30,140);C.parts.push({x:C.hx,y:C.hy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0,max:rnd(.8,1.6),s:rnd(2,5),g:1.2,kind:k%3?'ion':'dust0'})}});
setTimeout(()=>launchComet(),20000);
window.HackeniaSky={pokeMoon,launchComet:d=>launchComet(true,d)};
})();
