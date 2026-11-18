/* v413 — Dés du menu sans grésillement.
   Quand une face d'un dé en rotation passe de profil, sa bordure lumineuse, son halo et ses étoiles sont
   écrasés dans une bande d'un pixel : le navigateur les dessine mal et ils scintillent. À chaque image, on
   calcule l'orientation de chaque face vers l'écran et on règle --f (0 = de profil, 1 = de face) ; le CSS
   estompe les décorations quand --f tombe, comme un vrai éclairage rasant. */
(()=>{'use strict';
const SEL='.menu-cube,#news-die .news-cube,#daily-die .daily-cube';
const FACES=':scope>.md-face,:scope>i';
let cubes=[],raf=0,last=0;
const mat=el=>{const t=getComputedStyle(el).transform;if(!t||t==='none')return null;const m=t.match(/matrix(3d)?\(([^)]+)\)/);if(!m)return null;const v=m[2].split(',').map(Number);
 if(m[1])return v;return [v[0],v[1],0,0,v[2],v[3],0,0,0,0,1,0,v[4],v[5],0,1]};
function collect(){cubes=[...document.querySelectorAll(SEL)].map(c=>({c,faces:[...c.querySelectorAll(FACES)].map(f=>({f,n:null,v:-1}))})).filter(x=>x.faces.length)}
const smooth=z=>{const t=Math.min(1,Math.max(0,(z-.04)/.3));return t*t*(3-2*t)};
function frame(now){raf=requestAnimationFrame(frame);if(now-last<30)return;last=now;
 if(document.hidden)return;
 for(const {c,faces} of cubes){if(!c.isConnected||!c.offsetParent)continue;const m=mat(c);if(!m)continue;
  for(const o of faces){if(!o.n){const fm=mat(o.f);if(!fm)continue;o.n=[fm[8],fm[9],fm[10]]}const z=m[2]*o.n[0]+m[6]*o.n[1]+m[10]*o.n[2];const v=Math.round(smooth(z)*40)/40;if(v!==o.v){o.v=v;o.f.style.setProperty('--f',v)}}}}
function start(){collect();if(!raf)raf=requestAnimationFrame(frame)}
let pending=0;new MutationObserver(()=>{clearTimeout(pending);pending=setTimeout(collect,120)}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')addEventListener('DOMContentLoaded',start);else start();
window.HackeniaDiceFacing={refresh:collect};
})();
