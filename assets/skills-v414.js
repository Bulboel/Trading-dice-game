/* v414 — Arbre de compétences du joueur (« sphérier »).
   Niveau 1 : le héros. Niveau 3 : 1 point (un pouvoir v.1 au choix). Niveau 5 : 1 point de plus (un autre pouvoir v.1, ou la v.2 du pouvoir déjà appris).
   Les pouvoirs s'utilisent en Jouer, Partie rapide, Histoire, Panthéon et PVP en ligne 1 contre 1 (pas en 2 contre 2 ni dans le tutoriel).
   Profil : profile.skills = { vision: 0|1|2, impact: 0|1|2, block: 0|1|2 }. */
(()=>{'use strict';
const DEFS=[
 {key:'vision',icon:'👁',name:'Vision',color:'#7fd4ff',
  v:['Voir la main de l’adversaire une fois durant la partie.','Voir la main de l’adversaire deux fois durant la partie.']},
 {key:'impact',icon:'💥',name:'Impact',color:'#ff8a5c',
  v:['Une fois par partie : −1 PA à une créature adverse, jusqu’à la fin du duel (son niveau ne change pas).','Une fois par partie : −1 PA à deux créatures adverses différentes, jusqu’à la fin du duel.']},
 {key:'block',icon:'🛡',name:'Blocage',color:'#9be37a',
  v:['Une fois par partie : annule une attaque contre une de vos créatures et repousse l’attaquant d’une case (sa dalle le suit). Repoussé hors du damier, il est écrasé.','Une fois par partie : annule une attaque et repousse l’attaquant de deux cases. Repoussé hors du damier, il est écrasé.']}];
const LEVELS=[3,5];/* niveaux qui donnent un point */
const KEYS=DEFS.map(d=>d.key);
const levelOf=p=>{try{return window.HackeniaProgress?.levelOf?.(p?.xp||0)?.level||1}catch{return 1}};
function owned(p){const s=p&&typeof p.skills==='object'&&p.skills||{},o={};for(const k of KEYS)o[k]=Math.max(0,Math.min(2,s[k]|0));return o}
const spent=p=>Object.values(owned(p)).reduce((a,n)=>a+n,0);
const earned=p=>LEVELS.filter(l=>levelOf(p)>=l).length;
const points=p=>Math.max(0,earned(p)-spent(p));
/* Peut-on apprendre key au rang rank (1 ou 2) ? */
function canLearn(p,key,rank){const o=owned(p);if(!KEYS.includes(key)||o[key]!==rank-1)return false;if(points(p)<1)return false;if(rank===2&&levelOf(p)<5)return false;return true}
function learn(p,key,rank){if(!canLearn(p,key,rank))return null;const n=structuredClone(p);n.skills=Object.assign({},owned(p),{[key]:rank});return n}
/* Pouvoirs utilisables en partie : charges et puissance. */
function powers(p){const o=owned(p);return{vision:o.vision,impact:o.impact,block:o.block}}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* v417 — Sphérier en galaxie : nébuleuses, champ d'étoiles, orbites qui tournent ; chaque pouvoir est un dé qui pivote sur lui-même
   (D4 pour la v.1, D8 pour la v.2), relié au héros par des constellations. */
const die=(kind,pal,off)=>window.HackeniaPolyDie?window.HackeniaPolyDie(kind,pal,off):'<span class="sk-fallback">✦</span>';
function treeHTML(p,avatar){const o=owned(p),pts=points(p),lvl=levelOf(p),C=160,R1=76,R2=150;
 const node=(d,rank,ang,i)=>{const r=rank===1?R1:R2,x=C+Math.cos(ang)*r,y=C+Math.sin(ang)*r,have=o[d.key]>=rank,can=canLearn(p,d.key,rank),need=rank===1?3:5,locked=lvl<need;
  const st=have?'owned':can?'open':'locked';
  return{x,y,st,html:`<button type="button" class="sk-node r${rank} ${st}" style="left:${(x/3.2).toFixed(2)}%;top:${(y/3.2).toFixed(2)}%;--c:${d.color}" data-action="skill-node" data-skill="${d.key}" data-rank="${rank}" aria-label="${esc(d.name)} v.${rank} : ${have?'appris':can?'disponible':locked?'niveau '+need+' requis':'verrouillé'}"><span class="sk-halo" aria-hidden="true"></span><span class="sk-die" aria-hidden="true">${die(rank>1?'d8':'d4',have||can?d.key:'lock',i*2.1+rank)}<span class="sk-glyph">${have?d.icon:can?d.icon:'🔒'}</span></span>${have?'<span class="sk-spark" aria-hidden="true"><i></i><i></i><i></i></span>':''}<span class="sk-tag">${esc(d.name)} <b>v.${rank}</b></span></button>`}};
 let lines='',nodes='';DEFS.forEach((d,i)=>{const a=-Math.PI/2+i*2*Math.PI/3,n1=node(d,1,a,i),n2=node(d,2,a,i);
  lines+=`<line x1="${C}" y1="${C}" x2="${n1.x.toFixed(1)}" y2="${n1.y.toFixed(1)}" class="sk-link ${n1.st}" style="--c:${d.color}"/><line x1="${n1.x.toFixed(1)}" y1="${n1.y.toFixed(1)}" x2="${n2.x.toFixed(1)}" y2="${n2.y.toFixed(1)}" class="sk-link ${n2.st}" style="--c:${d.color}"/>`;nodes+=n1.html+n2.html});
 const orbits=`<g class="sk-orbit o1"><circle cx="${C}" cy="${C}" r="${R1}"/></g><g class="sk-orbit o2"><circle cx="${C}" cy="${C}" r="${R2}"/></g>`;
 const core=`<div class="sk-core" aria-hidden="true"><span class="sk-core-ring"></span>${avatar?`<img src="${esc(avatar)}" alt="">`:`<span class="sk-core-die">${die('d4','d4',0)}</span>`}<small>Niv. ${lvl}</small></div>`;
 const head=pts?`<p class="skg-points"><b>${pts}</b> point${pts>1?'s':''} à dépenser</p>`:`<p class="skg-points calm">${lvl<3?'Premier pouvoir au niveau 3':lvl<5&&spent(p)>=1?'Prochain point au niveau 5':'Tous les points sont dépensés'}</p>`;
 return `<section class="sk-galaxy" aria-label="Arbre de compétences"><div class="skg-sky" aria-hidden="true"><i class="skg-neb n1"></i><i class="skg-neb n2"></i><i class="skg-neb n3"></i><i class="skg-spiral"></i><i class="skg-stars s1"></i><i class="skg-stars s2"></i><i class="skg-stars s3"></i><i class="skg-comet"></i></div>
 <header class="skg-head"><button type="button" class="skg-back" data-action="challenges">‹ Niveau et quêtes</button><h2>Arbre de compétences</h2>${head}</header>
 <div class="sk-sphere"><svg viewBox="0 0 320 320" aria-hidden="true">${orbits}${lines}</svg>${core}${nodes}</div>
 <p class="sk-help">Niveau 3 : un premier pouvoir au choix. Niveau 5 : un deuxième pouvoir, ou la version améliorée du premier. Touchez un dé pour découvrir son pouvoir. Les pouvoirs s’utilisent en partie, y compris en ligne en 1 contre 1.</p></section>`}
/* Animation quand un pouvoir vient d'être appris : onde de choc, éclats d'étoiles, le dé tourbillonne puis s'allume. */
function celebrate(key,rank){const n=document.querySelector(`.sk-node[data-skill="${key}"][data-rank="${rank}"]`);if(!n)return;
 const reduce=matchMedia?.('(prefers-reduced-motion:reduce)').matches;n.classList.add('sk-new');setTimeout(()=>n.classList.remove('sk-new'),2400);if(reduce)return;
 const b=document.createElement('span');b.className='sk-burst';b.setAttribute('aria-hidden','true');b.innerHTML='<i class="ring"></i><i class="ring r2"></i>'+Array.from({length:16},(_,k)=>`<em style="--a:${(k*22.5+(k%3)*7).toFixed(1)}deg;--d:${(46+(k*37)%34)}px;--t:${(.7+((k*13)%5)/10).toFixed(2)}s"></em>`).join('');n.append(b);setTimeout(()=>b.remove(),1800);
 const link=[...document.querySelectorAll('.sk-link')].filter(l=>l.style.getPropertyValue('--c')===n.style.getPropertyValue('--c'))[rank-1];link?.classList.add('sk-lit');setTimeout(()=>link?.classList.remove('sk-lit'),1600)}
function describe(key,rank){const d=DEFS.find(x=>x.key===key);return d?{name:d.name+' v.'+rank,icon:d.icon,text:d.v[rank-1],color:d.color}:null}
const api={DEFS,KEYS,LEVELS,owned,points,earned,spent,canLearn,learn,powers,treeHTML,describe,levelOf,celebrate};
window.HackeniaSkills=api;if(typeof module!=='undefined')module.exports=api;
})();
