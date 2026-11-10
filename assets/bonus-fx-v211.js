/* v211 — Effets personnalisables du dé bonus gagné.
   « star » : l'étoile dorée d'origine (action-feedback). « drop » : une goutte d'eau tombe du dé raté, éclabousse,
   puis remonte comme un missile à tête chercheuse jusqu'au compteur de dés bonus. D'autres effets seront à gagner. */
(()=>{'use strict';
const STYLES=[
 {id:'star',name:'Étoile dorée',desc:'L’étoile classique qui file vers votre compteur.'},
 {id:'drop',name:'Goutte d’eau',desc:'Une goutte tombe, éclabousse, puis fond sur votre compteur comme une tête chercheuse.'},
 {id:'spark',name:'Éclair',desc:'Un éclair zèbre le plateau jusqu’à votre compteur.',level:5},
 {id:'leaf',name:'Feuille d’automne',desc:'Une feuille tourbillonne, puis un coup de vent l’emporte vers votre compteur.',level:10}];
// v219 — Les effets « Éclair » et « Feuille » se débloquent avec le niveau de joueur.
const isLocked=s=>!!s.level&&!window.HackeniaProgress?.unlocked?.(window.HackeniaPortal?.profile?.(),s.id);
for(const st of STYLES)if(st.level)Object.defineProperty(st,'locked',{enumerable:true,get(){return isLocked(st)}});
for(const st of STYLES)if(st.level)Object.defineProperty(st,'hint',{enumerable:true,get(){return isLocked(st)?'Débloqué au niveau '+st.level:''}});
const current=()=>{const v=window.HackeniaSettings?.get?.().bonusFx;return STYLES.some(s=>s.id===v&&!s.locked)?v:'star'};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||window.HackeniaSettings?.get?.().motion===false;

function canvasLayer(){const c=document.createElement('canvas'),dpr=Math.min(2,devicePixelRatio||1);c.className='bonus-fx-layer';c.setAttribute('aria-hidden','true');Object.assign(c.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'9999'});c.width=innerWidth*dpr;c.height=innerHeight*dpr;document.body.append(c);const g=c.getContext('2d');g.scale(dpr,dpr);return{c,g}}

// Goutte : corps rond + pointe orientée dans le sens du mouvement.
function drawDrop(g,x,y,r,angle,alpha=1){g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha=alpha;
 const grad=g.createRadialGradient(-r*.35,-r*.35,r*.1,0,0,r*1.6);grad.addColorStop(0,'#e9fbff');grad.addColorStop(.35,'#7fd3ff');grad.addColorStop(1,'#1f6fc4');
 g.fillStyle=grad;g.shadowColor='#6fc8ffcc';g.shadowBlur=12;g.beginPath();g.moveTo(-r*2.1,0);g.bezierCurveTo(-r*.9,-r*.95,r*.2,-r*1.05,r,0);g.arc(0,0,r,0,Math.PI,false);g.bezierCurveTo(r*.2,r*1.05,-r*.9,r*.95,-r*2.1,0);g.fill();
 g.shadowBlur=0;g.fillStyle='#ffffffcc';g.beginPath();g.ellipse(r*.25,-r*.4,r*.32,r*.18,-.5,0,Math.PI*2);g.fill();g.restore()}
function splash(parts,x,y,n,power){for(let i=0;i<n;i++){const a=-Math.PI*(.1+.8*Math.random()),v=power*(.6+Math.random()*.7);parts.push({x,y,vx:Math.cos(a)*v*(Math.random()<.5?-1:1),vy:Math.sin(a)*v,r:2.2+Math.random()*2.8,life:1})}}

function dropFx(a,b,done){const {c,g}=canvasLayer(),parts=[],trail=[],rings=[];
 const ox=a.left+a.width/2,oy=a.top+a.height/2,tx=b.left+b.width/2,ty=b.top+b.height/2,floor=oy+Math.min(44,a.height*.6);
 const side=tx>ox?-1:1,cx=(ox+tx)/2+side*Math.min(160,Math.abs(ty-oy)*.6+60),cy=Math.min(oy,ty)-90;// point de contrôle : la goutte part sur le côté puis fonce
 const T1=520,T2=380,T3=1050,start=performance.now();let splashed=false,arrived=false,prev={x:ox,y:floor};
 const bez=(t,p0,p1,p2)=>(1-t)*(1-t)*p0+2*(1-t)*t*p1+t*t*p2;
 const frame=now=>{const t=now-start;g.clearRect(0,0,c.width,c.height);
  if(t<T1){// 1. la goutte se forme puis tombe
   const k=t/T1,form=Math.min(1,k*3),y=oy-30+Math.pow(k,2.2)*(floor-oy+30);drawDrop(g,ox,y,10*form+2,Math.PI/2,1)}
  else if(t<T1+T2){// 2. éclaboussure au sol, la goutte se reforme
   if(!splashed){splashed=true;splash(parts,ox,floor,16,3.8);rings.push({x:ox,y:floor,r:4,life:1})}
   const k=(t-T1)/T2;drawDrop(g,ox,floor-8*k,5+6*k,-Math.PI/2,.4+.6*k)}
  else if(t<T1+T2+T3){// 3. tête chercheuse : trajectoire courbe accélérée vers le compteur
   const k=(t-T1-T2)/T3,e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,x=bez(e,ox,cx,tx),y=bez(e,floor-6,cy,ty),ang=Math.atan2(y-prev.y,x-prev.x);
   trail.push({x,y,life:1});if(Math.random()<.5)parts.push({x,y,vx:(Math.random()-.5)*.8,vy:.6+Math.random(),r:1.4+Math.random()*1.4,life:.8});
   drawDrop(g,x,y,11-3*k,ang,1);prev={x,y}}
  else if(!arrived){arrived=true;splash(parts,tx,ty,18,4.2);rings.push({x:tx,y:ty,r:6,life:1});done()}
  // traînée lumineuse
  for(const p of trail){p.life-=.06;if(p.life>0){g.fillStyle=`rgba(127,211,255,${p.life*.55})`;g.beginPath();g.arc(p.x,p.y,7*p.life,0,Math.PI*2);g.fill()}}
  // gouttelettes et ondes
  for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.life-=.025;if(p.life>0){g.fillStyle=`rgba(160,225,255,${p.life})`;g.beginPath();g.arc(p.x,p.y,p.r,0,Math.PI*2);g.fill()}}
  for(const r of rings){r.r+=1.8;r.life-=.04;if(r.life>0){g.strokeStyle=`rgba(180,235,255,${r.life})`;g.lineWidth=2;g.beginPath();g.ellipse(r.x,r.y,r.r,r.r*.38,0,0,Math.PI*2);g.stroke()}}
  if(t<T1+T2+T3+700)requestAnimationFrame(frame);else c.remove()};
 requestAnimationFrame(frame)}

// Éclair : un trait brisé part du dé et zèbre l'écran jusqu'au compteur, avec deux petites branches et un flash.
function bolt(a,b){const pts=[a],n=9;for(let i=1;i<n;i++){const t=i/n,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,len=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len,off=(Math.random()-.5)*Math.min(70,len*.18)*(1-Math.abs(.5-t));pts.push({x:x+nx*off,y:y+ny*off})}pts.push(b);return pts}
function sparkFx(a,b,done){const {c,g}=canvasLayer(),o={x:a.left+a.width/2,y:a.top+a.height/2},t={x:b.left+b.width/2,y:b.top+b.height/2},start=performance.now(),T=1100;let main=bolt(o,t),branches=[],hit=false;
 const draw=(pts,k,w,alpha)=>{const m=Math.max(2,Math.ceil(pts.length*k));g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(let i=1;i<m;i++)g.lineTo(pts[i].x,pts[i].y);g.lineWidth=w;g.strokeStyle=`rgba(190,170,255,${alpha*.5})`;g.shadowColor='#b79cff';g.shadowBlur=18;g.stroke();g.lineWidth=w*.4;g.strokeStyle=`rgba(255,255,255,${alpha})`;g.shadowBlur=6;g.stroke()};
 const frame=now=>{const e=now-start;g.clearRect(0,0,c.width,c.height);const grow=Math.min(1,e/260);
  if(e>90&&Math.random()<.35)main=bolt(o,t);// scintillement
  if(!branches.length&&e>140)for(let i=0;i<2;i++){const s=main[3+i*2],end={x:s.x+(Math.random()-.5)*120,y:s.y+(Math.random()-.5)*120};branches.push(bolt(s,end).slice(0,6))}
  const alpha=e<T*.6?1:Math.max(0,1-(e-T*.6)/(T*.4));draw(main,grow,7,alpha);for(const br of branches)draw(br,grow,3,alpha*.7);
  if(grow>=1&&!hit){hit=true;done()}
  if(hit){const k=Math.min(1,(e-260)/500),r=8+50*k;g.shadowBlur=0;g.fillStyle=`rgba(235,225,255,${(1-k)*.8})`;g.beginPath();g.arc(t.x,t.y,r,0,Math.PI*2);g.fill()}
  if(e<T)requestAnimationFrame(frame);else c.remove()};requestAnimationFrame(frame)}
// Feuille d'automne : elle tombe en se balançant, puis un coup de vent l'emporte en spirale vers le compteur.
function drawLeaf(g,x,y,r,angle,alpha=1){g.save();g.translate(x,y);g.rotate(angle);g.globalAlpha=alpha;const grad=g.createLinearGradient(-r,0,r,0);grad.addColorStop(0,'#c2410c');grad.addColorStop(.5,'#f59e0b');grad.addColorStop(1,'#facc15');g.fillStyle=grad;g.shadowColor='#f59e0b88';g.shadowBlur=8;
 g.beginPath();g.moveTo(-r,0);g.quadraticCurveTo(-r*.2,-r*.75,r,0);g.quadraticCurveTo(-r*.2,r*.75,-r,0);g.fill();g.shadowBlur=0;g.strokeStyle='#7c2d12aa';g.lineWidth=1.2;g.beginPath();g.moveTo(-r*1.25,0);g.lineTo(r*.85,0);g.stroke();g.restore()}
function leafFx(a,b,done){const {c,g}=canvasLayer(),ox=a.left+a.width/2,oy=a.top+a.height/2,tx=b.left+b.width/2,ty=b.top+b.height/2,start=performance.now(),T1=850,T2=1050,trail=[];let arrived=false;
 const frame=now=>{const e=now-start;g.clearRect(0,0,c.width,c.height);let x,y,ang;
  if(e<T1){const k=e/T1;x=ox+Math.sin(k*Math.PI*3)*38;y=oy-40+k*80;ang=Math.sin(k*Math.PI*3)*.9}
  else{const k=Math.min(1,(e-T1)/T2),ease=k*k*(3-2*k),sx=ox+Math.sin(Math.PI*3)*38,sy=oy+40,spin=(1-ease)*Math.PI*2.2,rad=(1-ease)*60;x=sx+(tx-sx)*ease+Math.cos(spin*2)*rad;y=sy+(ty-sy)*ease+Math.sin(spin*2)*rad;ang=e/90;
   trail.push({x,y,life:1});if(k>=1&&!arrived){arrived=true;done()}}
  for(const p of trail){p.life-=.05;if(p.life>0){g.fillStyle=`rgba(250,204,21,${p.life*.35})`;g.beginPath();g.arc(p.x,p.y,4*p.life,0,Math.PI*2);g.fill()}}
  if(!arrived)drawLeaf(g,x,y,18,ang);
  if(e<T1+T2+500)requestAnimationFrame(frame);else c.remove()};requestAnimationFrame(frame)}
function pulse(target){target?.animate?.([{boxShadow:'0 0 0 0 #7fd3ff00'},{boxShadow:'0 0 18px 6px #7fd3ffaa'},{boxShadow:'0 0 0 0 #7fd3ff00'}],{duration:900})}
// Joue un effet entre deux rectangles (partie ou aperçu des Options).
function play(style,a,b,target){if(reduced()||style==='star'||!a||!b){return false}if(style==='drop'){dropFx(a,b,()=>pulse(target));return true}if(style==='spark'){sparkFx(a,b,()=>pulse(target));return true}if(style==='leaf'){leafFx(a,b,()=>pulse(target));return true}return false}

const A=window.HackeniaActions;let original=null;
if(A?.bonusEarned){original=A.bonusEarned;A.bonusEarned=(camp,origin)=>{const style=current();if(style==='star')return original(camp,origin);const target=document.getElementById('bonus-counter-'+camp),a=origin||A.captureRollOrigin?.(),b=target?.getBoundingClientRect();if(!play(style,a,b&&b.width?b:null,target))return original(camp,origin)}}
window.HackeniaBonusFx={styles:STYLES,current,play,preview(style,fromEl,toEl){const a=fromEl?.getBoundingClientRect(),b=toEl?.getBoundingClientRect();if(!a||!b)return;if(style==='star'){if(!original)return;const t=document.createElement('span');t.id='bonus-counter-preview';Object.assign(t.style,{position:'fixed',left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px',pointerEvents:'none'});document.body.append(t);original('preview',{left:a.left,top:a.top,width:a.width,height:a.height});setTimeout(()=>t.remove(),2400);return}play(style,a,b,toEl)}};
})();
