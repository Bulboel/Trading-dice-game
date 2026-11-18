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
/* Sphérier : SVG centré sur le héros, trois branches à 120°, rang 1 (niveau 3) puis rang 2 (niveau 5). */
function treeHTML(p,avatar){const o=owned(p),pts=points(p),lvl=levelOf(p),C=160,R1=76,R2=148;
 const node=(d,rank,ang)=>{const r=rank===1?R1:R2,x=C+Math.cos(ang)*r,y=C+Math.sin(ang)*r,have=o[d.key]>=rank,can=canLearn(p,d.key,rank),need=rank===1?3:5,locked=lvl<need;
  const st=have?'owned':can?'open':'locked';
  return{x,y,html:`<button type="button" class="sk-node ${st}" style="left:${(x/3.2).toFixed(2)}%;top:${(y/3.2).toFixed(2)}%;--c:${d.color}" data-action="skill-node" data-skill="${d.key}" data-rank="${rank}" aria-label="${esc(d.name)} v.${rank} : ${have?'appris':can?'disponible':locked?'niveau '+need+' requis':'verrouillé'}"><span class="sk-orb" aria-hidden="true">${d.icon}</span><span class="sk-tag">${esc(d.name)} <b>v.${rank}</b></span></button>`,st}};
 let lines='',nodes='';DEFS.forEach((d,i)=>{const a=-Math.PI/2+i*2*Math.PI/3,n1=node(d,1,a),n2=node(d,2,a);
  lines+=`<line x1="${C}" y1="${C}" x2="${n1.x}" y2="${n1.y}" class="sk-link ${n1.st}" style="--c:${d.color}"/><line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}" class="sk-link ${n2.st}" style="--c:${d.color}"/>`;nodes+=n1.html+n2.html});
 const rings=`<circle cx="${C}" cy="${C}" r="${R1}" class="sk-ring"/><circle cx="${C}" cy="${C}" r="${R2}" class="sk-ring"/>`;
 const center=`<div class="sk-core" aria-hidden="true">${avatar?`<img src="${esc(avatar)}" alt="">`:'<span>✦</span>'}<small>Niv. ${lvl}</small></div>`;
 return `<section class="skill-tree" aria-label="Arbre de compétences"><div class="sk-head"><p class="sk-points">${pts?`<b>${pts}</b> point${pts>1?'s':''} à dépenser`:lvl<3?'Premier pouvoir au niveau 3':lvl<5&&spent(p)>=1?'Prochain point au niveau 5':'Tous les points sont dépensés'}</p></div>
 <div class="sk-sphere"><svg viewBox="0 0 320 320" aria-hidden="true">${rings}${lines}</svg>${center}${nodes}</div>
 <p class="sk-help">Niveau 3 : un premier pouvoir au choix. Niveau 5 : un deuxième pouvoir, ou la version améliorée du premier. Touchez une sphère pour la découvrir. Les pouvoirs s’utilisent en partie, y compris en ligne en 1 contre 1.</p></section>`}
function describe(key,rank){const d=DEFS.find(x=>x.key===key);return d?{name:d.name+' v.'+rank,icon:d.icon,text:d.v[rank-1],color:d.color}:null}
const api={DEFS,KEYS,LEVELS,owned,points,earned,spent,canLearn,learn,powers,treeHTML,describe,levelOf};
window.HackeniaSkills=api;if(typeof module!=='undefined')module.exports=api;
})();
