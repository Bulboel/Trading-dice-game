/* Capture the settled die before a turn/layout change. The flight lives above the game. */
(()=>{'use strict';const flights=new Set();
function reset(){for(const flight of [...flights]){cancelAnimationFrame(flight.frame);flight.animation?.cancel();flight.node.remove()}flights.clear()}
function captureRollOrigin(){const source=document.querySelector('#roll .roll-volume:last-child')||document.getElementById('roll'),r=source?.getBoundingClientRect();return r&&r.width>0&&r.height>0?{left:r.left,top:r.top,width:r.width,height:r.height}:null}
function bonusEarned(camp,origin){
 const target=document.getElementById('bonus-counter-'+camp);if(!target)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||window.HackeniaSettings?.get().motion===false;
 const pulse=()=>{const counter=document.getElementById('bonus-counter-'+camp);if(counter?.animate)counter.animate([{boxShadow:'0 0 0 0 #f4d48000'},{boxShadow:'0 0 18px 5px #f4d48090'},{boxShadow:'0 0 0 0 #f4d48000'}],{duration:reduced?250:900})};
 if(reduced){pulse();return}
 const a=origin||captureRollOrigin(),b=target.getBoundingClientRect();if(!a||!b.width||!b.height){pulse();return}
 const node=document.createElement('span');node.className='bonus-flight';node.setAttribute('aria-hidden','true');
 const x=a.left+a.width/2-15,y=a.top+a.height/2-15,tx=b.left+b.width/2-15,ty=b.top+b.height/2-15;
 const transform=(X,Y,scale,angle)=>`translate(${X}px,${Y}px) scale(${scale}) rotate(${angle}deg)`;
 // The first visible frame must exist before animate() starts, including after a layout rebuild.
 Object.assign(node.style,{position:'fixed',left:'0px',top:'0px',display:'block',width:'30px',height:'30px',zIndex:'9999',pointerEvents:'none',opacity:'1',transform:transform(x,y,.65,0)});
 node.innerHTML='<svg viewBox="0 0 32 32"><path d="m16 1 3.7 10.2L30 16l-10.3 4.8L16 31l-3.7-10.2L2 16l10.3-4.8Z"/></svg>';document.body.append(node);
 const flight={node,animation:null,frame:0};flights.add(flight);
 const clean=()=>{node.remove();flights.delete(flight)};
 flight.frame=requestAnimationFrame(()=>{
  if(!flights.has(flight))return;
  if(!node.animate){clean();pulse();return}
  flight.animation=node.animate([
   {transform:transform(x,y,.65,0),opacity:1,offset:0,easing:'ease-out'},
   {transform:transform(x,y-22,1.12,25),opacity:1,offset:.18,easing:'ease-in-out'},
   {transform:transform(x+(tx-x)*.65,y+(ty-y)*.65-32,1,120),opacity:1,offset:.74,easing:'ease-out'},
   {transform:transform(tx,ty,.4,200),opacity:.25,offset:1}
  ],{duration:1650,easing:'linear',fill:'forwards'});
  flight.animation.onfinish=()=>{clean();pulse()};flight.animation.oncancel=clean;
 });
}
window.HackeniaActions={captureRollOrigin,bonusEarned,reset};})();
