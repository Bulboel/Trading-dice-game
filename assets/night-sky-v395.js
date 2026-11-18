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
 '<div class="sky-moon"><span class="moon-halo"></span><span class="moon-disc"><i class="mare a"></i><i class="mare b"></i><i class="mare c"></i><i class="crater c1"></i><i class="crater c2"></i><i class="crater c3"></i><i class="crater c4"></i><i class="crater c5"></i></span></div>'+
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
})();
