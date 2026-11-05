/* A failed roll grants one bonus; feedback always follows the earning camp. */
(()=>{'use strict';const flights=new Set();
function reset(){for(const flight of flights){flight.animation?.cancel();flight.node.remove()}flights.clear()}
function bonusEarned(camp){
 const target=document.getElementById('bonus-counter-'+camp),source=document.getElementById('roll');if(!target||!source)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||window.HackeniaSettings?.get().motion===false;
 const pulse=()=>{const counter=document.getElementById('bonus-counter-'+camp);if(counter?.animate)counter.animate([{boxShadow:'0 0 0 0 #f4d48000'},{boxShadow:'0 0 18px 5px #f4d48090'},{boxShadow:'0 0 0 0 #f4d48000'}],{duration:reduced?250:900})};
 if(reduced||!target.animate){pulse();return}
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();if(!a.width||!b.width)return;
 const node=document.createElement('span');node.className='bonus-flight';node.setAttribute('aria-hidden','true');node.style.width=node.style.height='30px';node.innerHTML='<svg viewBox="0 0 32 32"><path d="m16 1 3.7 10.2L30 16l-10.3 4.8L16 31l-3.7-10.2L2 16l10.3-4.8Z"/></svg>';document.body.append(node);
 const x=a.left+a.width/2-15,y=a.top+a.height/2-15,tx=b.left+b.width/2-15,ty=b.top+b.height/2-15;
 const transform=(X,Y,scale,angle)=>`translate(${X}px,${Y}px) scale(${scale}) rotate(${angle}deg)`;
 const animation=node.animate([{transform:transform(x,y,.25,0),opacity:0,offset:0},{transform:transform(x,y-24,1.1,35),opacity:1,offset:.16},{transform:transform(x+(tx-x)*.45,Math.min(y,ty)-45,1,115),opacity:1,offset:.58},{transform:transform(tx,ty,.35,200),opacity:0,offset:1}],{duration:1650,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
 const flight={node,animation};flights.add(flight);animation.onfinish=()=>{node.remove();flights.delete(flight);pulse()};animation.oncancel=()=>{node.remove();flights.delete(flight)};
}
window.HackeniaActions={bonusEarned,reset};})();
