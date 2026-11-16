/* v314 — Cérémonie divine : séquence plein écran (~4 s) jouée à l'ouverture d'une bourse contenant un dé Divin ou Crépitant.
   Pilier de lumière, double halo runique, rayons arc-en-ciel, ondes de choc, plumes de lumière, éclair blanc puis titre doré.
   Un toucher passe la séquence. Mouvement réduit : simple fondu lumineux avec le titre. */
(()=>{'use strict';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function markup(o){
 const runes=Array.from({length:16},(_,i)=>`<text x="0" y="-${i%2?232:245}" transform="rotate(${i*22.5})" text-anchor="middle">${'✦✧☼✶'[i%4]}</text>`).join('');
 const feathers=Array.from({length:46},(_,i)=>{const x=(i*53)%100,d=2.4+(i%7)*.45,dl=1.1+(i%11)*.16,sz=10+(i%5)*5;return `<i style="--x:${x}%;--d:${d}s;--dl:${dl}s;--s:${sz}px;--sw:${(i%2?1:-1)*(14+i%6*6)}px">${'✦✧✹'[i%3]}</i>`}).join('');
 const stars=Array.from({length:60},(_,i)=>`<i style="left:${(i*37)%100}%;top:${(i*61)%100}%;--t:${1.4+(i%5)*.5}s;--o:${(i%9)*.12}s"></i>`).join('');
 const letters=[...o.title].map((c,i)=>`<span style="--i:${i}">${esc(c)}</span>`).join('');
 return `<div class="dv-bg"></div><div class="dv-stars">${stars}</div><div class="dv-rays"></div><div class="dv-beam"></div><div class="dv-glow"></div>
 <svg class="dv-halo" viewBox="-300 -300 600 600" aria-hidden="true"><defs><linearGradient id="dvg" x1="0" y1="0" x2="1" y2="1">${o.theme==='legend'?'<stop offset="0" stop-color="#fff3c0"/><stop offset=".5" stop-color="#ffb12e"/><stop offset="1" stop-color="#e2541c"/>':'<stop offset="0" stop-color="#fff6c4"/><stop offset=".5" stop-color="#ffc94d"/><stop offset="1" stop-color="#ff9ad8"/>'}</linearGradient></defs>
 <g class="dv-ring r1"><circle r="258" fill="none" stroke="url(#dvg)" stroke-width="2.2"/><circle r="266" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".8" stroke-dasharray="3 9"/><g fill="url(#dvg)" font-size="22">${runes}</g></g>
 <g class="dv-ring r2"><circle r="196" fill="none" stroke="#9fe8ff" stroke-width="2"/><path d="M0-196 170 98H-170Z M0 196-170-98H170Z" fill="none" stroke="#ffe9a0" stroke-width="1.6"/><circle r="120" fill="none" stroke="url(#dvg)" stroke-width="1.6" stroke-dasharray="14 8"/></g></svg>
 <i class="dv-wave"></i><i class="dv-wave w2"></i><i class="dv-wave w3"></i><div class="dv-feathers">${feathers}</div><div class="dv-flash"></div>
 ${o.portrait?`<div class="dv-hero"><i class="dv-hero-glow"></i><img src="${esc(o.portrait)}" alt="" decoding="async"></div>`:''}<div class="dv-title" style="--accent:${o.accent}"><small>${esc(o.kicker)}</small><h2 aria-label="${esc(o.title)}">${letters}</h2><p>${esc(o.name)}</p></div><button class="dv-skip" type="button" aria-label="Passer la cérémonie">Passer ›</button>`}
function play(o){const T=window.HackeniaI18n?.t||(x=>x);o={...o};for(const k of['title','kicker'])if(o[k])o[k]=T(o[k]);return new Promise(resolve=>{const set=window.HackeniaSettings,reduced=!set?.get?.().motion||matchMedia('(prefers-reduced-motion:reduce)').matches;
 const dlg=document.createElement('dialog');dlg.className='dv-dialog'+(o.theme==='legend'?' dv-legend':'')+(o.portrait?' dv-has-hero':'')+(reduced?' dv-reduced':'');dlg.setAttribute('aria-label',o.title);
 dlg.innerHTML=markup({title:'DIVIN',kicker:'Une présence supérieure s’éveille…',accent:'#ffd36b',name:'',...o});document.body.append(dlg);
 let over=false;const timers=[],finish=()=>{if(over)return;over=true;timers.forEach(clearTimeout);dlg.classList.add('dv-out');setTimeout(()=>{try{dlg.close()}catch{}dlg.remove();resolve()},reduced?120:520)};
 dlg.addEventListener('cancel',e=>{e.preventDefault();finish()});dlg.addEventListener('click',finish);
 try{dlg.showModal()}catch{dlg.setAttribute('open','')}
 const at=(ms,fn)=>timers.push(setTimeout(fn,ms));
 try{set?.play?.('Invocation')}catch{}
 if(reduced){dlg.classList.add('dv-go');at(900,()=>set?.play?.('Divin'));at(o.portrait?3200:2100,finish);return}
 dlg.classList.add('dv-go');at(2350,()=>{try{set?.play?.('Divin')}catch{}dlg.classList.add('dv-shake')});at(o.portrait?5600:4300,finish)})}
window.HackeniaDivine={play};
})();
