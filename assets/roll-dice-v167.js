/* Six physical CSS planes. Presentation never draws or changes a random result. */
(()=>{'use strict';
const skins={ivory:{face:'#e6dfca',light:'#faf5e6',shade:'#b4ac96',edge:'#b89a5d',ink:'#243c35'},obsidian:{face:'#1c3332',light:'#39504c',shade:'#0c1a1d',edge:'#bd9e64',ink:'#f4e5b9'}};
const pips=[[],[[1,1]],[[0,0],[2,2]],[[0,0],[1,1],[2,2]],[[0,0],[2,0],[0,2],[2,2]],[[0,0],[2,0],[1,1],[0,2],[2,2]],[[0,0],[2,0],[0,1],[2,1],[0,2],[2,2]]];
const turns={1:[0,0],2:[-90,0],3:[0,-90],4:[0,90],5:[90,0],6:[0,180]};
let skin='ivory',host=null,dice=[],spinning=false;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||window.HackeniaSettings?.get().motion===false;
const pose=value=>{const [x,y]=turns[value];return `rotateX(-16deg) rotateY(-20deg) rotateX(${x}deg) rotateY(${y}deg)`};
function paint(){if(!host)return;for(const [key,color]of Object.entries(skins[skin]))host.style.setProperty('--roll-'+key,color)}
function reset(){for(const d of dice){d.spin?.cancel();d.settle?.cancel()}dice=[];host=null;spinning=false}
function build(target,count){reset();host=target;target.replaceChildren();paint();
 for(let i=0;i<count;i++){
  const wrap=document.createElement('span');wrap.className='roll-volume';wrap.setAttribute('role','img');
  const cube=document.createElement('span');cube.className='roll-cube';cube.setAttribute('aria-hidden','true');
  for(let value=1;value<=6;value++){
   const face=document.createElement('span');face.className='roll-plane face-'+value;face.dataset.value=String(value);
   face.innerHTML='<span class="roll-inlay">'+pips[value].map(([x,y])=>`<i class="roll-pip" style="--px:${x};--py:${y}"></i>`).join('')+'</span>';cube.append(face);
  }
  const result=document.createElement('b');result.className='roll-value';result.setAttribute('aria-hidden','true');result.textContent='';
  wrap.append(cube,result);target.append(wrap);dice.push({wrap,cube,result,spin:null,settle:null});
 }
}
function render(target,values,rolling=false,won=null){
 if(!values.length)return;if(host!==target||dice.length!==values.length||dice.some(d=>d.wrap.parentElement!==target))build(target,values.length);
 paint();target.className='roll-dice-tray roll-volume-tray'+(rolling?' rolling':won===true?' win':won===false?' lose':'');
 if(rolling){if(spinning)return;spinning=true;
  dice.forEach((d,i)=>{d.settle?.cancel();d.result.textContent='';d.wrap.setAttribute('aria-label','Dé '+(i+1)+' en rotation');d.cube.style.transform=pose(1);
   if(!reduced()&&d.cube.animate){const direction=i%2?-1:1;d.spin=d.cube.animate([{transform:pose(1)},{transform:`rotateX(${direction*410}deg) rotateY(${direction*515}deg) rotateZ(20deg)`,offset:.45},{transform:`rotateX(${direction*900}deg) rotateY(${direction*1080}deg) rotateZ(0deg)`}],{duration:1960,easing:'cubic-bezier(.15,.55,.35,1)',fill:'forwards'})}
  });return;
 }
 spinning=false;dice.forEach((d,i)=>{const value=Number(values[i]);if(!turns[value])return;
  const from=d.spin&&typeof getComputedStyle==='function'?getComputedStyle(d.cube).transform:null;d.spin?.cancel();d.spin=null;d.settle?.cancel();d.cube.style.transform=pose(value);d.result.textContent='';
  const reveal=()=>{d.result.textContent=String(value);d.wrap.setAttribute('aria-label','Dé '+(i+1)+' : '+value)};
  if(!reduced()&&from&&d.cube.animate){d.settle=d.cube.animate([{transform:from},{transform:pose(value)}],{duration:560,easing:'cubic-bezier(.16,1,.3,1)'});d.settle.onfinish=reveal}else reveal();
 });
}
function registerSkin(name,appearance){if(typeof name!=='string'||!name||!['face','light','shade','edge','ink'].every(k=>typeof appearance?.[k]==='string'&&/^#[0-9a-f]{6}$/i.test(appearance[k])))return false;skins[name]={...appearance};return true}
function setSkin(name){if(!Object.hasOwn(skins,name))return false;skin=name;paint();return true}
window.HackeniaRoll={render,reset,registerSkin,setSkin,skins:()=>Object.keys(skins)};
})();
