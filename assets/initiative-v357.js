/* v357 — Lancer d'initiative : avant chaque partie contre l'IA, chaque camp lance un D20 ; le plus haut lancer commence
   (égalité : on relance), un 20 naturel rapporte un dé bonus. Le moteur (index.html) tire les résultats et attend
   game.initiativeDone(id) ; ce module ne fait que les mettre en scène. Le D20 reprend les couleurs du dé de jet choisi
   dans les options (HackeniaRoll.palette()). Toucher l'écran passe l'animation. */
(()=>{'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const reduced=()=>window.HackeniaSettings?.get?.().motion===false||matchMedia('(prefers-reduced-motion: reduce)').matches;
const sfx=k=>{try{window.HackeniaSettings?.play?.(k)}catch{}};
// Icosaèdre vu de face : hexagone, face centrale (le résultat) et neuf facettes autour.
const H=[[0,-46],[39.8,-23],[39.8,23],[0,46],[-39.8,23],[-39.8,-23]],T=[0,-25],R=[21.6,12.5],L=[-21.6,12.5];
const FACETS=[[T,H[0],H[1],'hi'],[T,H[1],R,'mid'],[R,H[1],H[2],'mid'],[R,H[2],H[3],'lo'],[R,H[3],L,'lo'],[L,H[3],H[4],'lo'],[L,H[4],H[5],'mid'],[L,H[5],T,'mid'],[T,H[5],H[0],'hi']];
const pts=a=>a.map(p=>p.join(',')).join(' ');
function d20(){return `<svg class="ini-d20" viewBox="-50 -50 100 100" aria-hidden="true">
 <polygon class="ini-shadow" points="${pts(H)}" transform="translate(2 4)"/>
 ${FACETS.map(([a,b,c,k])=>`<polygon class="ini-facet ${k}" points="${pts([a,b,c])}"/>`).join('')}
 <polygon class="ini-face" points="${pts([T,R,L])}"/>
 <polygon class="ini-edge" points="${pts(H)}"/>
 <g class="ini-side-num"><text x="16" y="-22" transform="rotate(30 16 -22)">0</text><text x="-16" y="-22" transform="rotate(-30 -16 -22)">0</text><text x="0" y="30">0</text></g>
 <text class="ini-num" x="0" y="5.5">?</text></svg>`}
let box=null,skip=null;
function paint(){const p=window.HackeniaRoll?.palette?.()||{face:'#e6dfca',light:'#faf5e6',shade:'#b4ac96',edge:'#b89a5d',ink:'#243c35'};for(const [k,v] of Object.entries(p))box.style.setProperty('--ini-'+k,v)}
function setNum(die,v){die.querySelector('.ini-num').textContent=v;const s=die.querySelectorAll('.ini-side-num text');const n=[(v%20)+1,((v+6)%20)+1,((v+12)%20)+1];s.forEach((t,i)=>t.textContent=n[i])}
async function roll(die,value,from,fast){const svg=die.querySelector('.ini-d20');if(fast){setNum(die,value);return}
 sfx('Roulement');const dur=1500,start=performance.now();
 die.animate([{transform:`translate(${from}px,-90px) scale(.55)`,opacity:0},{transform:`translate(${from*.45}px,-28px) scale(.9)`,opacity:1,offset:.32},{transform:'translate(0,0) scale(1.06)',offset:.62},{transform:'translate(0,-14px) scale(.98)',offset:.78},{transform:'translate(0,0) scale(1)'}],{duration:dur,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'});
 svg.animate([{transform:`rotate(${from>0?540:-540}deg)`},{transform:'rotate(0deg)'}],{duration:dur,easing:'cubic-bezier(.12,.7,.2,1)',fill:'both'});
 // le chiffre défile de plus en plus lentement, puis s'arrête sur le résultat tiré par le moteur
 let gap=45;while(performance.now()-start<dur-180&&!box?.dataset.skip){setNum(die,1+Math.floor(Math.random()*20));die.classList.toggle('flip');await wait(gap);gap*=1.12}
 die.classList.remove('flip');setNum(die,value);sfx('Impact');die.classList.add('landed');setTimeout(()=>die.classList.remove('landed'),500)}
async function show({rolls,winner,crit,names,id}){box?.remove();const fast=reduced();const camps=window.HackeniaSettings?.campColors?.(0)||[{ui:'#3fae74'},{ui:'#d0453f'}];
 box=document.createElement('div');box.id='initiative';box.className='ini'+(fast?' ini-still':'');box.setAttribute('role','dialog');box.setAttribute('aria-label','Lancer d’initiative');
 box.innerHTML=`<div class="ini-panel"><small class="ini-kicker">Qui commence ?</small><h2>Lancer d’initiative</h2>
 <div class="ini-duel">${[0,1].map(o=>`<div class="ini-player p${o}" style="--camp:${camps[o]?.ui||'#ccc'}"><b>${esc(o===0?'Vous':names[1])}</b><div class="ini-die">${d20()}</div><span class="ini-crit" hidden>20 naturel ! +1 dé bonus</span></div>${o===0?'<span class="ini-vs" aria-hidden="true">⚔</span>':''}`).join('')}</div>
 <p class="ini-result" role="status">Les dés roulent…</p><span class="ini-hint">Toucher pour passer</span></div>`;
 document.body.append(box);paint();const dice=[...box.querySelectorAll('.ini-die')],result=box.querySelector('.ini-result');
 let done=false;const finish=()=>{if(done)return;done=true;box.classList.add('out');setTimeout(()=>{box?.remove();box=null},380);window.hackeniaGame?.initiativeDone?.(id)};
 box.addEventListener('click',()=>{if(box.dataset.skip){finish();return}box.dataset.skip='1'});
 requestAnimationFrame(()=>box.classList.add('in'));await wait(fast?100:450);
 for(let k=0;k<rolls.length&&!done;k++){const [a,b]=rolls[k],quick=fast||!!box.dataset.skip;box.querySelectorAll('.ini-player').forEach(p=>p.classList.remove('win','lose'));
  result.textContent=k?'Égalité ! On relance…':'Les dés roulent…';await Promise.all([roll(dice[0],a,-170,quick),wait(quick?0:140).then(()=>roll(dice[1],b,170,quick))]);
  if(k<rolls.length-1){result.textContent=`Égalité : ${a} partout ! On relance…`;await wait(quick?250:1000)}}
 if(done)return;const last=rolls[rolls.length-1],P=box.querySelectorAll('.ini-player');P[winner].classList.add('win');P[1-winner].classList.add('lose');
 crit.forEach((c,o)=>{if(c){P[o].classList.add('crit');P[o].querySelector('.ini-crit').hidden=false}});if(crit.some(Boolean))sfx('Rareté');sfx(winner===0?'Victoire':'Point');
 result.innerHTML=winner===0?`<strong>Vous commencez !</strong> ${last[0]} contre ${last[1]}`:`<strong>${esc(names[1])} commence.</strong> ${last[1]} contre ${last[0]}`;
 await wait(box.dataset.skip?600:fast?1500:1800);finish()}
window.addEventListener('hackenia:initiative',e=>{show(e.detail).catch(()=>window.hackeniaGame?.initiativeDone?.(e.detail.id))});
window.HackeniaInitiative={show};
})();
