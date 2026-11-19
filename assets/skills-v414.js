/* v414 — Arbre de compétences du joueur (« sphérier »). v418 — étendu jusqu'au niveau 35.
   Points aux niveaux 3, 5, 10, 15, 20, 25, 30 et 35 (8 points pour 22 rangs : il faut choisir).
   Les origines (niveau 3) : Vision, Impact, Blocage — v.2 au niveau 5, v.3 au niveau 20.
   L'éveil (niveau 10) : Bénédiction, Entrave, Rappel, Élan, Sabotage, Prévoyance — v.2 au niveau 15.
   Les ultimes (niveau 25) : Phénix, Portail, Tempête, Faveur des dés — un seul au choix.
   En ligne (1 contre 1), seuls 3 pouvoirs choisis sont emportés (profile.skillsOnline).
   Profil : profile.skills = { clé: rang }. */
(()=>{'use strict';
const DEFS=[
 {key:'vision',ring:1,max:3,icon:'👁',name:'Vision',color:'#7fd4ff',
  v:['Voir la main de l’adversaire une fois durant la partie.','Voir la main de l’adversaire deux fois durant la partie.','Voir la main de l’adversaire trois fois durant la partie ; pendant ce temps, ses pièges invisibles sont révélés.']},
 {key:'impact',ring:1,max:3,icon:'💥',name:'Impact',color:'#ff8a5c',
  v:['Une fois par partie : −1 PA à une créature adverse, jusqu’à la fin du duel (son niveau ne change pas).','Une fois par partie : −1 PA à deux créatures adverses différentes, jusqu’à la fin du duel.','Une fois par partie, au choix : −1 PA à trois créatures adverses, ou −2 PA à une seule, jusqu’à la fin du duel.']},
 {key:'block',ring:1,max:3,icon:'🛡',name:'Blocage',color:'#9be37a',
  v:['Une fois par partie : annule une attaque contre une de vos créatures et repousse l’attaquant d’une case (sa dalle le suit). Repoussé hors du damier, il est écrasé.','Une fois par partie : annule une attaque et repousse l’attaquant de deux cases. Repoussé hors du damier, il est écrasé.','Une fois par partie : annule une attaque et repousse l’attaquant de trois cases ; étourdi, il ne pourra pas bouger à son prochain tour.']},
 {key:'bless',ring:2,max:2,icon:'✨',name:'Bénédiction',color:'#ffe27a',
  v:['Une fois par partie : +1 PA à une de vos créatures, jusqu’à la fin du duel.','Une fois par partie : +1 PA à deux de vos créatures différentes, jusqu’à la fin du duel.']},
 {key:'bind',ring:2,max:2,icon:'⛓',name:'Entrave',color:'#c59bff',
  v:['Une fois par partie : une créature adverse ne peut pas bouger à son prochain tour.','Une fois par partie : une créature adverse ne peut pas bouger pendant ses deux prochains tours.']},
 {key:'recall',ring:2,max:2,icon:'↩',name:'Rappel',color:'#6ff0d0',
  v:['Une fois par partie : une de vos créatures quitte le plateau et son dé revient dans votre main (ses dalles disparaissent).','Une fois par partie : une de vos créatures revient dans votre main avec son dé, et ses dalles restent sur le plateau.']},
 {key:'surge',ring:2,max:2,icon:'💨',name:'Élan',color:'#9ef0ff',
  v:['Une fois par partie : vous pouvez déplacer une créature une seconde fois dans le même tour (ce second déplacement ne peut pas attaquer).','Une fois par partie : un second déplacement dans le même tour, qui peut attaquer.']},
 {key:'sabotage',ring:2,max:2,icon:'🪓',name:'Sabotage',color:'#ff8f8f',
  v:['Une fois par partie : détruit une dalle adverse sans créature dessus, pour lui couper la route.','Une fois par partie : détruit deux dalles adverses sans créature dessus.']},
 {key:'foresight',ring:2,max:2,icon:'🔮',name:'Prévoyance',color:'#d59cff',
  v:['Une fois par partie : regardez vos trois prochains dés et choisissez celui qui arrivera dans votre main.','Deux fois par partie : regardez vos trois prochains dés et choisissez celui qui arrivera dans votre main.']},
 {key:'phoenix',ring:3,max:1,icon:'🔥',name:'Phénix',color:'#ff9a3c',
  v:['Ultime : la première de vos créatures vaincue renaît aussitôt sur sa case d’apparition.']},
 {key:'portal',ring:3,max:1,icon:'🌀',name:'Portail',color:'#8f9bff',
  v:['Ultime : téléporte une de vos créatures, avec sa dalle, sur n’importe quelle case libre de votre moitié du plateau.']},
 {key:'storm',ring:3,max:1,icon:'⛈',name:'Tempête',color:'#9fd0ff',
  v:['Ultime : toutes les créatures adverses perdent 1 PA pendant deux tours.']},
 {key:'favor',ring:3,max:1,icon:'🎲',name:'Faveur des dés',color:'#ffd04a',
  v:['Ultime : votre prochain lancer d’invocation réussit d’office (sauf mort subite).']}];
const LEVELS=[3,5,10,15,20,25,30,35];/* niveaux qui donnent un point ; le niveau 40 donne un 2e objet porté */
const NEED={1:[3,5,20],2:[10,15],3:[25]};
const KEYS=DEFS.map(d=>d.key),BY=Object.fromEntries(DEFS.map(d=>[d.key,d])),ONLINE_MAX=3,RESET_COST=200;
const RINGS=[{ring:1,title:'Les origines',sub:'Chaque ligne se débloque au niveau indiqué à gauche.'},{ring:2,title:'L’éveil',sub:'Chaque ligne se débloque au niveau indiqué à gauche.'},{ring:3,title:'Les ultimes',sub:'Un seul ultime au choix, dès le niveau indiqué au centre.'}];
const levelOf=p=>{try{return window.HackeniaProgress?.levelOf?.(p?.xp||0)?.level||1}catch{return 1}};
const needFor=(key,rank)=>NEED[BY[key]?.ring]?.[rank-1]||99;
function owned(p){const s=p&&typeof p.skills==='object'&&p.skills||{},o={};for(const d of DEFS)o[d.key]=Math.max(0,Math.min(d.max,s[d.key]|0));return o}
const spent=p=>Object.values(owned(p)).reduce((a,n)=>a+n,0);
const earned=p=>LEVELS.filter(l=>levelOf(p)>=l).length;
const points=p=>Math.max(0,earned(p)-spent(p));
const ultimate=p=>{const o=owned(p);return DEFS.find(d=>d.ring===3&&o[d.key])?.key||''};
/* Peut-on apprendre key au rang rank ? */
function canLearn(p,key,rank){const d=BY[key],o=owned(p);if(!d||rank>d.max||o[key]!==rank-1||points(p)<1||levelOf(p)<needFor(key,rank))return false;if(d.ring===3&&ultimate(p))return false;return true}
function why(p,key,rank){const d=BY[key],o=owned(p);if(o[key]>=rank)return 'owned';if(levelOf(p)<needFor(key,rank))return 'level';if(o[key]<rank-1)return 'previous';if(d.ring===3&&ultimate(p))return 'ultimate';if(points(p)<1)return 'points';return 'open'}
function learn(p,key,rank){if(!canLearn(p,key,rank))return null;const n=structuredClone(p);n.skills=Object.assign({},owned(p),{[key]:rank});const on=onlineSet(p);if(rank===1&&on.length<ONLINE_MAX&&!on.includes(key))on.push(key);n.skillsOnline=on;return n}
function reset(p){if(!spent(p)||(p.gold|0)<RESET_COST)return null;const n=structuredClone(p);n.gold-=RESET_COST;n.skills={};n.skillsOnline=[];return n}
/* Pouvoirs emportés en ligne : 3 au plus, parmi ceux appris (par défaut, les premiers appris). */
function onlineSet(p){const o=owned(p),saved=Array.isArray(p?.skillsOnline);const out=[...new Set((saved?p.skillsOnline:[]).filter(k=>o[k]>0))].slice(0,ONLINE_MAX);if(!saved)for(const d of DEFS)if(out.length<ONLINE_MAX&&o[d.key]&&!out.includes(d.key))out.push(d.key);return out}
function toggleOnline(p,key){const o=owned(p);if(!o[key])return null;const cur=onlineSet(p),next=cur.includes(key)?cur.filter(k=>k!==key):cur.length<ONLINE_MAX?[...cur,key]:null;if(!next)return null;const n=structuredClone(p);n.skillsOnline=next;return n}
/* Pouvoirs utilisables en partie (en ligne : seulement les 3 emportés). */
function powers(p,online=false){const o=owned(p),out={};const keep=online?new Set(onlineSet(p)):null;for(const k of KEYS)out[k]=keep&&!keep.has(k)?0:o[k];return out}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const die=(kind,pal,off,sym)=>{try{return window.HackeniaPolyDie?window.HackeniaPolyDie(kind,pal,off,sym||'star'):'<span class="sk-fallback">✦</span>'}catch{return '<span class="sk-fallback">✦</span>'}};
const KIND=['d4','d8','d10'];
/* v417 — Sphérier en galaxie ; v418 — trois constellations (origines, éveil, ultimes). */
function treeHTML(p,avatar){const o=owned(p),pts=points(p),lvl=levelOf(p),C=160;
 const node=(d,rank,x,y,i,up)=>{const have=o[d.key]>=rank,can=canLearn(p,d.key,rank),need=needFor(d.key,rank);
  const st=have?'owned':can?'open':'locked',pal=have||can?d.key:'lock',kind=d.ring===3?'d10':KIND[rank-1];
  return{x,y,st,html:`<button type="button" class="sk-node r${rank} g${d.ring} ${st}${up?' tag-up':''}" style="left:${(x/3.2).toFixed(2)}%;top:${(y/3.2).toFixed(2)}%;--c:${d.color}" data-action="skill-node" data-skill="${d.key}" data-rank="${rank}" aria-label="${esc(d.name)}${d.max>1?' v.'+rank:''} : ${have?'appris':can?'disponible':lvl<need?'niveau '+need+' requis':'verrouillé'}"><span class="sk-halo" aria-hidden="true"></span><span class="sk-die" aria-hidden="true">${die(kind,pal,i*2.1+rank,have||can?d.key:'lock')}</span>${have?'<span class="sk-spark" aria-hidden="true"><i></i><i></i><i></i></span>':''}<span class="sk-tag">${esc(d.name)}${d.max>1?` <b>v.${rank}</b>`:''}</span></button>`}};
 /* Les origines forment un arbre : le héros en bas, trois branches qui montent (Blocage à gauche, Vision au centre, Impact à droite).
   L'éveil et les ultimes sont des constellations en étoile autour d'un dé central. */
 /* v420 — le niveau requis est affiché au bout de chaque ligne (origines) ou sur chaque anneau (éveil, ultimes) */
 const badge=(x,y,level)=>`<span class="sk-lvl${lvl>=level?' ok':''}" style="left:${(x/3.2).toFixed(2)}%;top:${(y/3.2).toFixed(2)}%">${lvl>=level?'':'🔒 '}Niv. ${level}</span>`;
 const constellation=(R,radii,centerHTML,cls,cx=C,cy=C,angles=null,pos=null,badges='')=>{const list=DEFS.filter(d=>d.ring===R.ring);let lines='',nodes=badges;
  list.forEach((d,i)=>{const a=angles?angles[i]:-Math.PI/2+i*2*Math.PI/list.length+(R.ring===3?Math.PI/4:0);let [px,py]=pos&&!centerHTML?pos(i,1):[cx,cy];
   for(let r=1;r<=d.max;r++){const [x,y]=pos?pos(i,r):[cx+Math.cos(a)*radii[r-1],cy+Math.sin(a)*radii[r-1]],n=node(d,r,x,y,i,!pos&&!angles&&y<cy-12);lines+=`<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="sk-link ${n.st}" data-skill="${d.key}" style="--c:${d.color}"/>`;nodes+=n.html;px=x;py=y}});
  const sealed=lvl<NEED[R.ring][0];
  const orbits=radii.map((r,k)=>`<g class="sk-orbit o${k+1}"><circle cx="${C}" cy="${C}" r="${r}"/></g>`).join('');
  return `<div class="sk-const ${cls}${sealed?' sealed':''}"><div class="sk-const-head"><h3>${R.title}</h3><small>${sealed?'🔒 ':''}${R.sub}</small></div><div class="sk-sphere"><svg viewBox="0 0 320 320" aria-hidden="true">${angles||pos?'':orbits}${lines}</svg>${centerHTML.replace('class="sk-core','style="left:'+(cx/3.2).toFixed(2)+'%;top:'+(cy/3.2).toFixed(2)+'%" class="sk-core')}${nodes}</div></div>`};
 const core=`<div class="sk-core" aria-hidden="true"><span class="sk-core-ring"></span>${avatar?`<img src="${esc(avatar)}" alt="">`:`<span class="sk-core-die">${die('d4','d4',0)}</span>`}<small>Niv. ${lvl}</small></div>`;
 const star=`<div class="sk-core small" aria-hidden="true"><span class="sk-core-ring"></span><span class="sk-core-die">${die('d8','d4',1)}</span></div>`;
 const crown=`<div class="sk-core small" aria-hidden="true"><span class="sk-core-ring"></span><span class="sk-core-die">${die('d10','d4',2)}</span></div>`;
 const next=LEVELS.find(l=>l>lvl);
 const head=pts?`<p class="skg-points"><b>${pts}</b> point${pts>1?'s':''} à dépenser</p>`:`<p class="skg-points calm">${next?'Prochain point au niveau '+next:'Tous les points sont gagnés'}</p>`;
 const learned=DEFS.filter(d=>o[d.key]),on=onlineSet(p);
 const loadout=learned.length?`<div class="sk-online"><h3>En ligne : ${ONLINE_MAX} pouvoirs emportés</h3><p>Pour garder les duels en ligne équitables, vous emportez ${ONLINE_MAX} pouvoirs au plus. Contre l’ordinateur, tous vos pouvoirs sont actifs.</p><div class="sk-chips">${learned.map(d=>`<button type="button" class="sk-chip${on.includes(d.key)?' on':''}" data-action="skill-online" data-skill="${d.key}" aria-pressed="${on.includes(d.key)}" style="--c:${d.color}"><span aria-hidden="true">${d.icon}</span>${esc(d.name)}${d.max>1?' v.'+o[d.key]:''}</button>`).join('')}</div><small class="sk-online-count">${on.length} / ${ONLINE_MAX}</small></div>`:'';
 const resetBtn=spent(p)?`<button type="button" class="sk-reset" data-action="skill-reset">↺ Réinitialiser l’arbre <small>${RESET_COST} Bubulles</small></button>`:'';
 return `<section class="sk-galaxy" aria-label="Arbre de compétences"><div class="skg-sky" aria-hidden="true"><i class="skg-neb n1"></i><i class="skg-neb n2"></i><i class="skg-neb n3"></i><i class="skg-spiral"></i><i class="skg-stars s1"></i><i class="skg-stars s2"></i><i class="skg-stars s3"></i><i class="skg-comet"></i></div>
 <header class="skg-head"><button type="button" class="skg-back" data-action="challenges">‹ Niveau et quêtes</button><h2>Arbre de compétences</h2>${head}</header>
 ${constellation(RINGS[0],[],core,'c1',C,276,null,(i,r)=>[[160,252,68][i],[200,128,56][r-1]],[[200,3],[128,5],[56,20]].map(([y,l])=>badge(18,y,l)).join(''))}${constellation(RINGS[1],[],'','c2',C,C,null,(i,r)=>[[160,252,68][i%3],i<3?[290,214][r-1]:[134,58][r-1]],[[290,10],[214,15],[134,10],[58,15]].map(([y,l])=>badge(18,y,l)).join(''))}${constellation(RINGS[2],[104],crown,'c3',C,C,null,null,badge(C,C+46,25))}
 ${loadout}${resetBtn}
 <p class="sk-help">Un point aux niveaux ${LEVELS.join(', ')} : impossible de tout apprendre, à vous de choisir votre style. Touchez un dé pour découvrir son pouvoir. Au niveau 40, vous pourrez porter un deuxième objet.</p></section>`}
/* Animation quand un pouvoir vient d'être appris : onde de choc, éclats d'étoiles, le dé tourbillonne puis s'allume. */
function celebrate(key,rank){const n=document.querySelector(`.sk-node[data-skill="${key}"][data-rank="${rank}"]`);if(!n)return;
 const reduce=matchMedia?.('(prefers-reduced-motion:reduce)').matches;n.classList.add('sk-new');setTimeout(()=>n.classList.remove('sk-new'),2400);try{n.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'})}catch{}if(reduce)return;
 const b=document.createElement('span');b.className='sk-burst';b.setAttribute('aria-hidden','true');b.innerHTML='<i class="ring"></i><i class="ring r2"></i>'+Array.from({length:16},(_,k)=>`<em style="--a:${(k*22.5+(k%3)*7).toFixed(1)}deg;--d:${(46+(k*37)%34)}px;--t:${(.7+((k*13)%5)/10).toFixed(2)}s"></em>`).join('');n.append(b);setTimeout(()=>b.remove(),1800);
 const link=[...document.querySelectorAll(`.sk-link[data-skill="${key}"]`)][rank-1];link?.classList.add('sk-lit');setTimeout(()=>link?.classList.remove('sk-lit'),1600)}
function describe(key,rank){const d=BY[key];return d?{name:d.name+(d.max>1?' v.'+rank:''),icon:d.icon,text:d.v[rank-1],color:d.color,ring:d.ring,need:needFor(key,rank),kind:d.ring===3?'d10':KIND[rank-1]}:null}
const api={DEFS,KEYS,LEVELS,NEED,RESET_COST,ONLINE_MAX,owned,points,earned,spent,ultimate,canLearn,why,learn,reset,onlineSet,toggleOnline,powers,treeHTML,describe,levelOf,celebrate,needFor};
window.HackeniaSkills=api;if(typeof module!=='undefined')module.exports=api;
})();
