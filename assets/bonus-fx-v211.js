/* v211 — Effets personnalisables du dé bonus gagné.
   « star » : l'étoile dorée d'origine (action-feedback). « drop » : une goutte d'eau tombe du dé raté, éclabousse,
   puis remonte comme un missile à tête chercheuse jusqu'au compteur de dés bonus. D'autres effets seront à gagner. */
(()=>{'use strict';
const STYLES=[
 {id:'star',name:'Étoile dorée',desc:'L’étoile classique qui file vers votre compteur.'},
 {id:'drop',name:'Goutte d’eau',desc:'Une goutte tombe, éclabousse, puis fond sur votre compteur comme une tête chercheuse.'},
 {id:'locked-1',name:'Effet mystère',desc:'À gagner prochainement.',locked:true},
 {id:'locked-2',name:'Effet mystère',desc:'À gagner prochainement.',locked:true}];
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

function pulse(target){target?.animate?.([{boxShadow:'0 0 0 0 #7fd3ff00'},{boxShadow:'0 0 18px 6px #7fd3ffaa'},{boxShadow:'0 0 0 0 #7fd3ff00'}],{duration:900})}
// Joue un effet entre deux rectangles (partie ou aperçu des Options).
function play(style,a,b,target){if(reduced()||style==='star'||!a||!b){return false}if(style==='drop'){dropFx(a,b,()=>pulse(target));return true}return false}

const A=window.HackeniaActions;let original=null;
if(A?.bonusEarned){original=A.bonusEarned;A.bonusEarned=(camp,origin)=>{const style=current();if(style==='star')return original(camp,origin);const target=document.getElementById('bonus-counter-'+camp),a=origin||A.captureRollOrigin?.(),b=target?.getBoundingClientRect();if(!play(style,a,b&&b.width?b:null,target))return original(camp,origin)}}
window.HackeniaBonusFx={styles:STYLES,current,play,preview(style,fromEl,toEl){const a=fromEl?.getBoundingClientRect(),b=toEl?.getBoundingClientRect();if(!a||!b)return;if(style==='star'){if(!original)return;const t=document.createElement('span');t.id='bonus-counter-preview';Object.assign(t.style,{position:'fixed',left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px',pointerEvents:'none'});document.body.append(t);original('preview',{left:a.left,top:a.top,width:a.width,height:a.height});setTimeout(()=>t.remove(),2400);return}play(style,a,b,toEl)}};
})();
