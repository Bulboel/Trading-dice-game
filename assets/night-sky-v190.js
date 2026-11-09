/* v190 — Ciel du menu : étoiles scintillantes sur trois profondeurs qui dérivent, étoiles filantes et lune lumineuse.
   Visible uniquement dans les menus (body.portal-open). Respecte la réduction des animations. */
(()=>{'use strict';
const sky=document.createElement('div');sky.id='night-sky';sky.setAttribute('aria-hidden','true');
const rnd=(a,b)=>a+Math.random()*(b-a);
const layers=[[70,.6,1.2,'far'],[45,1,1.8,'mid'],[18,1.6,2.6,'near']];
sky.innerHTML=layers.map(([n,min,max,cls])=>'<div class="sky-layer '+cls+'">'+Array.from({length:n},()=>{const s=rnd(min,max).toFixed(2),hue=Math.random()<.25?'#ffe9c4':Math.random()<.5?'#cfe0ff':'#ffffff';return '<i style="left:'+rnd(0,100).toFixed(2)+'%;top:'+rnd(0,100).toFixed(2)+'%;width:'+s+'px;height:'+s+'px;background:'+hue+';--tw:'+rnd(2.5,7).toFixed(2)+'s;--td:-'+rnd(0,7).toFixed(2)+'s;--lo:'+rnd(.15,.5).toFixed(2)+'"></i>'}).join('')+'</div>').join('')+
 '<div class="sky-moon"><span class="moon-halo"></span><span class="moon-disc"></span></div><span class="shooting-star"></span><span class="shooting-star second"></span>';
document.body.prepend(sky);
// Étoiles filantes : une de temps en temps, à un endroit et un angle différents.
const stars=[...sky.querySelectorAll('.shooting-star')];let k=0;
function shoot(){const calm=document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!calm&&document.body.classList.contains('portal-open')&&!document.hidden){const s=stars[k++%stars.length];s.style.left=rnd(15,85)+'%';s.style.top=rnd(4,40)+'%';s.style.setProperty('--ang',rnd(150,170)+'deg');s.classList.remove('go');void s.offsetWidth;s.classList.add('go')}
 setTimeout(shoot,rnd(4500,11000))}
setTimeout(shoot,2500);
})();
