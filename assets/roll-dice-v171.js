/* Six physical CSS planes. Presentation never draws or changes a random result. */
(()=>{'use strict';
const skins={ivory:{face:'#e6dfca',light:'#faf5e6',shade:'#b4ac96',edge:'#b89a5d',ink:'#243c35'},obsidian:{face:'#1c3332',light:'#39504c',shade:'#0c1a1d',edge:'#bd9e64',ink:'#f4e5b9'}};
const pips=[[],[[1,1]],[[0,0],[2,2]],[[0,0],[1,1],[2,2]],[[0,0],[2,0],[0,2],[2,2]],[[0,0],[2,0],[1,1],[0,2],[2,2]],[[0,0],[2,0],[0,1],[2,1],[0,2],[2,2]]];
const turns={1:[0,0],2:[-90,0],3:[0,-90],4:[0,90],5:[90,0],6:[0,180]};
let skin=['ivory','obsidian'].includes(window.HackeniaSettings?.get().rollSkin)?window.HackeniaSettings.get().rollSkin:'ivory',host=null,dice=[],spinning=false;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||window.HackeniaSettings?.get().motion===false;
const pose=value=>{const [x,y]=turns[value];return `rotateX(-16deg) rotateY(-20deg) rotateX(${x}deg) rotateY(${y}deg)`};
// Use the known outcome as the endpoint of ONE decelerating rotation.
// Matching transform functions preserve full turns rather than matrix-shortcut interpolation.
const landing=(value,index)=>{const [x,y]=turns[value],direction=index%2?-1:1;return `rotateX(-16deg) rotateY(-20deg) rotateX(${direction*1080+x}deg) rotateY(${direction*1440+y}deg)`};
function reveal(d,value,index){d.cube.style.transform=pose(value);d.spin?.cancel();d.spin=null;d.result.textContent=String(value);d.wrap.setAttribute('aria-label','Dé '+(index+1)+' : '+value)}
function paint(){if(!host)return;for(const [key,color]of Object.entries(skins[skin]))host.style.setProperty('--roll-'+key,color)}
function reset(){for(const d of dice){d.spin?.cancel()}dice=[];host=null;spinning=false}
function createDie(){
 const wrap=document.createElement('span');wrap.className='roll-volume';wrap.setAttribute('role','img');
 const cube=document.createElement('span');cube.className='roll-cube';cube.setAttribute('aria-hidden','true');
 for(let value=1;value<=6;value++){const face=document.createElement('span');face.className='roll-plane face-'+value;face.dataset.value=String(value);face.innerHTML='<span class="roll-inlay">'+pips[value].map(([x,y])=>`<i class="roll-pip" style="--px:${x};--py:${y}"></i>`).join('')+'</span>';cube.append(face)}
 const result=document.createElement('b');result.className='roll-value';result.setAttribute('aria-hidden','true');result.textContent='';wrap.append(cube,result);
 return{wrap,cube,result,spin:null,finished:false,ready:false,rollValue:null};
}
function build(target,count){reset();host=target;target.replaceChildren();paint();for(let i=0;i<count;i++){const d=createDie();target.append(d.wrap);dice.push(d)}}
function preview(target,name){const appearance=skins[name];if(!appearance||!target)return false;target.replaceChildren();for(const [key,color]of Object.entries(appearance))target.style.setProperty('--roll-'+key,color);const d=createDie();d.wrap.setAttribute('aria-hidden','true');d.cube.style.transform=pose(5);target.append(d.wrap);return true}
function render(target,values,rolling=false,won=null){
 if(!values.length)return;if(host!==target||dice.length!==values.length||dice.some(d=>d.wrap.parentElement!==target))build(target,values.length);
 paint();target.className='roll-dice-tray roll-volume-tray'+(rolling?' rolling':won===true?' win':won===false?' lose':'');
 if(rolling){if(spinning)return;spinning=true;
  dice.forEach((d,i)=>{const value=Number(values[i]);if(!turns[value])return;d.spin?.cancel();d.finished=false;d.ready=false;d.rollValue=value;d.result.textContent='';d.wrap.setAttribute('aria-label','Dé '+(i+1)+' en rotation');d.cube.style.transform=pose(1);
   if(!reduced()&&d.cube.animate){d.spin=d.cube.animate([{transform:pose(1)},{transform:landing(value,i)}],{duration:2520,easing:'cubic-bezier(.16,.65,.28,1)',fill:'forwards'});d.spin.onfinish=()=>{d.finished=true;if(d.ready)reveal(d,d.rollValue,i)}}
  });return;
 }
 spinning=false;dice.forEach((d,i)=>{const value=Number(values[i]);if(!turns[value])return;d.ready=true;
  // The engine supplies the same result from the start. Let the existing rotation
  // reach that face, then remove the equivalent whole turns without a second pivot.
  if(d.spin&&d.rollValue===value&&!d.finished&&d.spin.playState!=='finished'&&!reduced())return;
  reveal(d,value,i);
 });
}

function registerSkin(name,appearance){if(typeof name!=='string'||!name||!['face','light','shade','edge','ink'].every(k=>typeof appearance?.[k]==='string'&&/^#[0-9a-f]{6}$/i.test(appearance[k])))return false;skins[name]={...appearance};return true}
function setSkin(name){if(!Object.hasOwn(skins,name))return false;skin=name;paint();return true}
window.addEventListener?.('hackenia:settings',event=>setSkin(event.detail.rollSkin));
window.HackeniaRoll={render,reset,preview,registerSkin,setSkin,skins:()=>Object.keys(skins)};
})();
