/* v337 / v339 — Mode Histoire : la carte d’Hackénia, un onglet par chapitre.
   Chaque chapitre n’affiche que ses propres parties : des points reliés par un chemin (doré une fois parcouru, en pointillés
   ensuite). À l’ouverture, la caméra plonge vers la prochaine partie du chapitre ; si une partie vient d’être terminée,
   le chemin se trace jusqu’au nouveau point. Toucher un point ouvre sa fiche (Commencer / Rejouer).
   Mode placement (Admin › 🗺 Placer les points de l’Histoire) : on glisse les points, puis « Copier les positions »
   donne un JSON à transmettre ; les positions sont aussi gardées sur l’appareil (localStorage) pour vérifier tout de suite. */
(()=>{'use strict';
// v342 — une carte par chapitre : la région du Bois tendre (chapitre I) et la ville de Dassom (chapitre II).
const MAPS={1:{src:'assets/story/region-bois-tendre.webp',w:1536,h:1024,alt:'Carte de la région du Bois tendre'},2:{src:'assets/story/dassom-ville.webp',w:1500,h:1000,alt:'Plan de la ville de Dassom'}};
MAPS[3]=MAPS[2];/* v347 — le chapitre III se déroule aussi à Dassom */
let MAP=MAPS[1];
// positions en % de la carte de leur chapitre (x, y) — v348 : placées avec l’outil d’administration sur les nouvelles cartes
const BASE={"c1p1":[46.68,76.9],"c1p2":[44.73,63.44],"c1p3":[52.27,45.51],"c1p4":[72.82,45],"c1p5":[88.19,39.84],"c1p6":[41.07,53.13],"c1p6bis":[38.32,49.22],"c1p6bonus":[49.93,39.12],"c1p7":[39.56,41.6],"c1p8":[49.13,23.01],"c1p8bis":[56.6,19.9],"c1p9":[65.01,21.71],"c1p10":[59.94,16.68],"c2p1":[48.56,24.63],"c2p2":[48.56,14.96],"c2p3":[40.1,20.73],"c2p4":[22,57],"c2p4bis":[30.5,61],"c2p5":[15.25,31.74],"c2p6":[82.31,70.93],"c2p7":[88.5,80.5],"c2p8":[48.95,69.38],"c2p9":[68.23,32.62],"c2p10":[42.45,30.17],"c2p11":[20.69,19.2],"c3p1":[48.95,69.38],"c3p2":[58,28],"c3p3":[43,64],"c3p4":[76,56],"c3p5":[80,62],"c3p6":[71,61],"c3p7":[75,67],"c3p8":[82,52],"c3p9":[62,44],"c3p10":[52,22]};
const VIEW={1:{x:.6,y:.5,s:1.4},2:{x:.5,y:.48,s:1.3}};// cadrage de chaque chapitre
const SEEN='hackenia-story-map-seen',POSKEY='hackenia-story-map-pos-v370',EDITKEY='hackenia-story-map-edit',TABKEY='hackenia-story-map-tab';
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const POS=()=>({...BASE,...store.get(POSKEY,{})});
let editing=false;try{editing=sessionStorage.getItem(EDITKEY)==='1'}catch{}
function setEdit(on){editing=!!on;try{sessionStorage.setItem(EDITKEY,on?'1':'0')}catch{}}
let cam={x:.5,y:.45,s:1},vp=null,world=null,lastS=1,tx=0,ty=0;
function curve(pts){if(pts.length<2)return '';let d=`M${pts[0][0]},${pts[0][1]}`;for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2,t=.5/3;
 d+=` C${p1[0]+(p2[0]-p0[0])*t},${p1[1]+(p2[1]-p0[1])*t} ${p2[0]-(p3[0]-p1[0])*t},${p2[1]-(p3[1]-p1[1])*t} ${p2[0]},${p2[1]}`}return d}
const px=p=>[p[0]/100*MAP.w,p[1]/100*MAP.h];
function minScale(){const r=vp.getBoundingClientRect();return Math.max(r.width/MAP.w,r.height/MAP.h)}
function clamp(){const r=vp.getBoundingClientRect(),s=cam.s*minScale(),hw=r.width/2/s/MAP.w,hh=r.height/2/s/MAP.h;cam.x=Math.min(1-hw,Math.max(hw,cam.x));cam.y=Math.min(1-hh,Math.max(hh,cam.y))}
function apply(ms=0){if(!vp||!vp.isConnected)return;cam.s=Math.min(3.5,Math.max(1,cam.s));clamp();const r=vp.getBoundingClientRect(),s=cam.s*minScale();lastS=s;tx=r.width/2-cam.x*MAP.w*s;ty=r.height/2-cam.y*MAP.h*s;
 world.style.transition=ms?`transform ${ms}ms cubic-bezier(.45,0,.2,1)`:'none';world.style.transform=`translate(${tx}px,${ty}px) scale(${s})`;
 world.style.setProperty('--inv',(1/s).toFixed(4));world.querySelectorAll('.sm-path').forEach(p=>p.style.strokeWidth=(p.dataset.w/s).toFixed(2))}
function fly(to,ms){cam={...cam,...to};apply(ms)}
function render(box,A){const d=A.prog(),parts=A.parts,pos=POS();
 const chOf=p=>p.chapter||1,chapters=[...new Set(parts.map(chOf))].sort();
 const mainAll=parts.filter(p=>!p.optional),nextAll=mainAll.find(p=>!d.done[p.id]),doneCount=mainAll.filter(p=>d.done[p.id]).length;
 const chOpen=ch=>parts.some(p=>chOf(p)===ch&&A.unlocked(p.id));
 let tab=store.get(TABKEY,null);if(!chapters.includes(tab)||(!chOpen(tab)&&!editing))tab=nextAll?chOf(nextAll):chapters[chapters.length-1];
 MAP=MAPS[tab]||MAPS[1];const list=parts.filter(p=>chOf(p)===tab);
 const all=list.map(p=>({p,xy:px(pos[p.id]||[50,50]),done:!!d.done[p.id],open:A.unlocked(p.id)}));
 const main=all.filter(n=>!n.p.optional),reached=main.filter(n=>n.done).length,cur=main.find(n=>!n.done)||main[main.length-1];
 const donePts=main.slice(0,Math.min(main.length,reached+(reached<main.length?1:0))).map(n=>n.xy),todoPts=main.slice(Math.max(0,reached)).map(n=>n.xy);
 const seenAll=store.get(SEEN,{}),seen=seenAll&&typeof seenAll==='object'?seenAll[tab]||0:0;
 const CHN={1:'I',2:'II',3:'III',4:'IV'},CHT=A.chapters||{};
 box.innerHTML=`<div class="portal-title story-head"><div><h2>Histoire</h2><span class="portal-muted">La Triade d’Hackénia</span></div><div class="story-progress" aria-label="${doneCount} parties terminées sur ${mainAll.length}"><span><b>${doneCount}</b> / ${mainAll.length} parties</span><i><em style="width:${Math.round(doneCount/Math.max(1,mainAll.length)*100)}%"></em></i></div></div>
 <div class="sm-tabs" role="tablist">${chapters.map(ch=>{const o=chOpen(ch)||editing,dn=parts.filter(p=>chOf(p)===ch&&!p.optional&&d.done[p.id]).length,tot=parts.filter(p=>chOf(p)===ch&&!p.optional).length;return `<button type="button" role="tab" class="sm-tab${ch===tab?' on':''}" data-tab="${ch}" aria-selected="${ch===tab}" ${o?'':'disabled'}><small>Chapitre ${CHN[ch]||ch}</small><b>${esc(CHT[ch]?.t||'')}</b><span>${o?dn+' / '+tot:'🔒'}</span></button>`}).join('')}</div>
 ${editing?`<div class="sm-edit-bar"><b>Mode placement</b><span>Glissez les points à leur place, puis copiez les positions.</span><div><button type="button" data-ed="copy" class="portal-primary">📋 Copier les positions</button><button type="button" data-ed="reset">↺ Réinitialiser</button><button type="button" data-ed="quit">✓ Terminer</button></div><textarea class="sm-json" hidden readonly></textarea></div>`:''}
 <div class="sm-wrap"><div class="sm-viewport${editing?' editing':''}" tabindex="0" aria-label="Carte d’Hackénia : glissez pour vous déplacer, pincez pour zoomer"><div class="sm-world" style="width:${MAP.w}px;height:${MAP.h}px">
 <img class="sm-map" src="${MAP.src}" alt="${MAP.alt}" draggable="false" width="${MAP.w}" height="${MAP.h}">
 <svg class="sm-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" aria-hidden="true"><path class="sm-path todo" data-w="2.6" d="${curve(todoPts)}"/>${all.filter(n=>n.p.optional).map(n=>{const i=list.indexOf(n.p),prev=all[i-1];return prev?`<path class="sm-path branch" data-w="2" d="M${prev.xy[0]},${prev.xy[1]} L${n.xy[0]},${n.xy[1]}"/>`:''}).join('')}<path class="sm-path done-glow" data-w="7" d="${curve(donePts)}"/><path class="sm-path done" data-w="3.2" d="${curve(donePts)}"/></svg>
 ${all.map(n=>{const [lab]=A.splitTitle(n.p.title),state=n.done?'done':n===cur&&!n.done?'current':n.open?'open':'locked',icon=n.done?'✓':!n.open?'🔒':n.p.optional?'★':n.p.duel?'⚔':'📖',num=(lab.match(/\d+\s*bis|\d+/)?.[0]||'').replace(/\s*bis/,'b');
  return `<button type="button" class="sm-node ${state}${n.p.optional?' bonus':''}" data-node="${n.p.id}" style="left:${n.xy[0]}px;top:${n.xy[1]}px" aria-label="${esc(n.p.title)}${n.done?' (terminée)':!n.open?' (verrouillée)':''}"><span class="sm-medal"><i>${icon}</i></span><span class="sm-tag">${editing?esc(n.p.id):esc(num||'★')}</span></button>`}).join('')}
 </div><div class="sm-ctrl"><button type="button" data-sm="in" aria-label="Zoomer">+</button><button type="button" data-sm="out" aria-label="Dézoomer">−</button><button type="button" data-sm="me" aria-label="Revenir à ma progression">📍</button><button type="button" data-sm="all" aria-label="Voir toute la carte">🗺</button></div>
 <div class="sm-sheet" hidden></div></div><div class="sm-foot"><span>Glissez pour explorer · touchez un point pour l’ouvrir</span><button type="button" class="story-view-toggle" data-view="list">☰ Liste des parties</button></div></div>`;
 box.querySelector('[data-view="list"]').onclick=()=>A.setView('list');
 box.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{store.set(TABKEY,+b.dataset.tab);render(box,A)});
 vp=box.querySelector('.sm-viewport');world=box.querySelector('.sm-world');
 const donePath=world.querySelector('.sm-path.done'),glowPath=world.querySelector('.sm-path.done-glow');
 const grow=!editing&&reached>seen&&reached>0&&donePts.length>1&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
 if(grow){const L=donePath.getTotalLength(),tmp=document.createElementNS('http://www.w3.org/2000/svg','path');tmp.setAttribute('d',curve(donePts.slice(0,-1)));world.querySelector('svg').append(tmp);const L0=donePts.length>2?tmp.getTotalLength():0;tmp.remove();
  for(const p of[donePath,glowPath]){p.style.strokeDasharray=L;p.style.strokeDashoffset=L-L0}}
 if(!editing)store.set(SEEN,{...(seenAll&&typeof seenAll==='object'?seenAll:{}),[tab]:reached});
 const view=VIEW[tab]||{x:.5,y:.45,s:2},target=cur?{x:cur.xy[0]/MAP.w,y:cur.xy[1]/MAP.h,s:view.s}:view;
 requestAnimationFrame(()=>{fly({...view,s:Math.max(1,view.s*.6)},0);setTimeout(()=>{fly(editing?view:target,1200);if(grow)setTimeout(()=>{for(const p of[donePath,glowPath]){p.style.transition='stroke-dashoffset 1.6s ease-in-out';p.style.strokeDashoffset='0'}setTimeout(()=>world.querySelector(`[data-node="${cur.p.id}"]`)?.classList.add('arrive'),1500)},1100)},300)});
 const sheet=box.querySelector('.sm-sheet');
 const open=id=>{const n=all.find(x=>x.p.id===id);if(!n)return;const [lab,name]=A.splitTitle(n.p.title),img=A.thumb(n.p);
  sheet.innerHTML=`<button type="button" class="sm-close" aria-label="Fermer">✕</button>${img?`<span class="sm-thumb" style="background-image:url('${esc(img)}')"></span>`:''}<div class="sm-info"><small>Chapitre ${CHN[tab]||tab} · ${esc(lab||'Partie')}${n.p.optional?' · bonus':''}</small><strong>${esc(name)}</strong><span class="story-kind ${n.p.duel?'duel':'tale'}">${n.p.duel?'⚔ Duel · '+esc(n.p.duel.foe):'📖 Récit'}${n.done?' · terminée':''}</span></div><button type="button" class="${n.open&&!n.done?'portal-primary':''}" data-go="${n.p.id}" ${n.open?'':'disabled'}>${!n.open?'🔒 Verrouillée':n.done?'Rejouer':'Commencer'}</button>`;
  sheet.hidden=false;sheet.querySelector('.sm-close').onclick=()=>{sheet.hidden=true};sheet.querySelector('[data-go]').onclick=()=>{sheet.hidden=true;A.start(id)}};
 // gestes : la capture du pointeur ne commence qu’au premier vrai glissement (sinon le clic suivant, sur la fiche, était détourné vers la carte)
 const pts=new Map();let moved=0,pinch=0,startCam=null,drag=null;
 const toMap=(cx,cy)=>{const r=vp.getBoundingClientRect();return [(cx-r.left-tx)/lastS,(cy-r.top-ty)/lastS]};
 vp.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;startCam={...cam};if(pts.size===2){const [a,b]=[...pts.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);drag=null}
  else if(editing){const node=e.target.closest?.('.sm-node');if(node){drag=node;try{vp.setPointerCapture(e.pointerId)}catch{}}}});
 vp.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const prev=pts.get(e.pointerId),c2={x:e.clientX,y:e.clientY};pts.set(e.pointerId,c2);
  if(drag){const [mx,my]=toMap(e.clientX,e.clientY);drag.style.left=Math.max(0,Math.min(MAP.w,mx))+'px';drag.style.top=Math.max(0,Math.min(MAP.h,my))+'px';moved+=9;return}
  if(pts.size===2&&pinch){const [a,b]=[...pts.values()];cam.s=startCam.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch;moved=99;apply();return}
  const dx=c2.x-prev.x,dy=c2.y-prev.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6&&!vp.hasPointerCapture(e.pointerId)){try{vp.setPointerCapture(e.pointerId)}catch{}}
  if(moved>6){cam.x-=dx/lastS/MAP.w;cam.y-=dy/lastS/MAP.h;apply()}});
 const end=e=>{const wasTap=moved<8&&pts.size===1;pts.delete(e.pointerId);if(pts.size<2)pinch=0;try{if(vp.hasPointerCapture(e.pointerId))vp.releasePointerCapture(e.pointerId)}catch{}
  if(drag){const id=drag.dataset.node,l=parseFloat(drag.style.left),t=parseFloat(drag.style.top);const saved=store.get(POSKEY,{});saved[id]=[+(l/MAP.w*100).toFixed(2),+(t/MAP.h*100).toFixed(2)];store.set(POSKEY,saved);drag=null;return}
  if(wasTap&&e.type==='pointerup'&&!editing&&!e.target.closest?.('.sm-ctrl,.sm-sheet')){/* v342 : un bouton de zoom ou la fiche posés sur un point n’ouvrent pas ce point */const node=document.elementsFromPoint(e.clientX,e.clientY).find(el=>el.classList?.contains('sm-node'));if(node)open(node.dataset.node)}};
 vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);
 vp.addEventListener('wheel',e=>{e.preventDefault();cam.s*=e.deltaY<0?1.15:1/1.15;apply(120)},{passive:false});
 vp.addEventListener('dblclick',()=>fly({s:cam.s*1.6},350));
 vp.addEventListener('keydown',e=>{const k={ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowUp:[0,-.04],ArrowDown:[0,.04]}[e.key];if(k){e.preventDefault();fly({x:cam.x+k[0]/cam.s,y:cam.y+k[1]/cam.s},200)}else if(e.key==='+')fly({s:cam.s*1.3},200);else if(e.key==='-')fly({s:cam.s/1.3},200)});
 box.querySelector('.sm-ctrl').addEventListener('click',e=>{const a=e.target.closest('[data-sm]')?.dataset.sm;if(a==='in')fly({s:cam.s*1.4},300);else if(a==='out')fly({s:cam.s/1.4},300);else if(a==='me')fly(target,700);else if(a==='all')fly({x:.5,y:.5,s:1},700)});
 if(editing){const ta=box.querySelector('.sm-json');box.querySelector('.sm-edit-bar').addEventListener('click',async e=>{const a=e.target.closest('[data-ed]')?.dataset.ed;if(!a)return;
  if(a==='copy'){const P=POS(),out={};for(const p of parts)if(P[p.id])out[p.id]=P[p.id];const json=JSON.stringify(out);ta.hidden=false;ta.value=json;ta.select();let ok=false;try{await navigator.clipboard.writeText(json);ok=true}catch{}const b=e.target.closest('button');b.textContent=ok?'✓ Copié !':'Copiez le texte ci-dessous';setTimeout(()=>{b.textContent='📋 Copier les positions'},2500)}
  else if(a==='reset'){store.set(POSKEY,{});render(box,A)}else if(a==='quit'){setEdit(false);render(box,A)}})}
 new ResizeObserver(()=>apply()).observe(vp)}
window.HackeniaStoryMap={render,positions:BASE,setEdit,isEditing:()=>editing};
})();
