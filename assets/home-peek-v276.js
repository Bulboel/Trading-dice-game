/* v276 — Menu principal : de temps en temps, la tête d'un bébémentaire dépasse d'un côté de l'écran, fait un coucou
   (moins d'une seconde) puis se cache. Uniquement sur l'accueil, jamais avec « réduire les animations ». */
(()=>{'use strict';
const ELS=['eau','feu','foudre','glace','terre','vent'];let last='',timer=0,busy=false;
const calm=()=>document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const onHome=()=>document.body.classList.contains('portal-open')&&document.body.dataset.portalView==='home'&&!document.hidden&&!document.querySelector('dialog[open],#tuto-hub,#reveal,.pack-reveal');
function show(el,side){if(busy||calm())return false;el=el||ELS[Math.floor(Math.random()*ELS.length)];side=side||(Math.random()<.5?'left':'right');
 const img=new Image();img.src='assets/peek/bebe-'+el+'.webp?v=20261223-v279';img.alt='';img.setAttribute('aria-hidden','true');img.className='home-peek '+side;
 img.style.top=(16+Math.random()*58).toFixed(1)+'%';busy=true;
 const end=()=>{img.remove();busy=false};img.addEventListener('animationend',end,{once:true});setTimeout(end,2500);
 img.decode?.().catch(()=>{}).then(()=>document.body.append(img));return true}
function loop(){clearTimeout(timer);timer=setTimeout(()=>{if(onHome()){let el;do{el=ELS[Math.floor(Math.random()*ELS.length)]}while(el===last);last=el;show(el)}loop()},11000+Math.random()*17000)}
loop();window.HackeniaPeek={show,ELS};
})();
