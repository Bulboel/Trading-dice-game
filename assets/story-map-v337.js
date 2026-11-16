/* v337 — Mode Histoire : la carte d’Hackénia.
   Chaque partie est un point sur la carte du continent (assets/story/hackenia-map.webp), relié au suivant par un chemin.
   Le chemin parcouru est doré ; la suite est en pointillés. À l’ouverture, la caméra survole la carte puis plonge vers la
   prochaine partie ; si une partie vient d’être terminée, le chemin se trace jusqu’au nouveau point.
   Navigation : glisser pour se déplacer, pincer / molette / boutons pour zoomer, 📍 pour revenir à sa progression.
   Toucher un point ouvre sa fiche (Commencer / Rejouer). Le chapitre II se déroule dans Dassom : ses points entourent la ville. */
(()=>{'use strict';
const MAP={src:'assets/story/hackenia-map.webp',w:1617,h:1079};
// positions en % de la carte (x, y)
const POS={c1p1:[50.8,45.4],c1p2:[46.5,43.5],c1p3:[52.8,41.0],c1p4:[60.2,37.6],c1p5:[63.8,33.6],c1p6:[58.6,40.8],c1p6bis:[55.6,44.5],c1p6bonus:[51.0,38.2],c1p7:[50.6,34.2],c1p8:[52.2,28.6],c1p9:[57.0,27.6],c1p10:[54.4,24.6],
 // chapitre II : tout se passe dans Dassom, les points font le tour de la ville dans l'ordre de l'histoire
 c2p1:[45.4,48.9],c2p2:[48.3,47.4],c2p3:[52.0,48.9],c2p4:[52.6,53.0],c2p5:[49.2,55.4],c2p6:[45.2,53.8]};
const SEEN='hackenia-story-map-seen';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cam={x:.5,y:.45,s:1},vp=null,world=null,api=null,anim=0;
function pos(p,i,list){if(POS[p.id])return POS[p.id];const prev=list[i-1];const q=prev?pos(prev,i-1,list):[50,50];return [q[0]+2,q[1]+1.5]}
// courbe lisse passant par les points (Catmull-Rom → Bézier)
function curve(pts){if(pts.length<2)return '';let d=`M${pts[0][0]},${pts[0][1]}`;for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2,t=.5/3;
 d+=` C${p1[0]+(p2[0]-p0[0])*t},${p1[1]+(p2[1]-p0[1])*t} ${p2[0]-(p3[0]-p1[0])*t},${p2[1]-(p3[1]-p1[1])*t} ${p2[0]},${p2[1]}`}return d}
const px=p=>[p[0]/100*MAP.w,p[1]/100*MAP.h];
function minScale(){const r=vp.getBoundingClientRect();return Math.max(r.width/MAP.w,r.height/MAP.h)}
function clamp(){const r=vp.getBoundingClientRect(),s=cam.s*minScale(),hw=r.width/2/s/MAP.w,hh=r.height/2/s/MAP.h;cam.x=Math.min(1-hw,Math.max(hw,cam.x));cam.y=Math.min(1-hh,Math.max(hh,cam.y))}
function apply(ms=0){if(!vp)return;cam.s=Math.min(5,Math.max(1,cam.s));clamp();const r=vp.getBoundingClientRect(),s=cam.s*minScale();
 world.style.transition=ms?`transform ${ms}ms cubic-bezier(.45,0,.2,1)`:'none';world.style.transform=`translate(${r.width/2-cam.x*MAP.w*s}px,${r.height/2-cam.y*MAP.h*s}px) scale(${s})`;
 world.style.setProperty('--inv',(1/s).toFixed(4));world.querySelectorAll('.sm-path').forEach(p=>p.style.strokeWidth=(p.dataset.w/s).toFixed(2))}
function fly(to,ms){cam={...cam,...to};apply(ms)}
function render(box,A){api=A;const d=A.prog(),line=A.mainline(),parts=A.parts,nextPart=line.find(p=>!d.done[p.id]),doneCount=line.filter(p=>d.done[p.id]).length;
 const all=parts.map((p,i)=>({p,xy:px(pos(p,i,parts)),done:!!d.done[p.id],open:A.unlocked(p.id)}));
 const main=all.filter(n=>!n.p.optional),reached=main.filter(n=>n.done).length,cur=main.find(n=>!n.done)||main[main.length-1];
 /* les chapitres pas encore atteints restent cachés : la carte se dévoile au fil de l'aventure */
 const curCh=cur.p.chapter,shown=n=>n.p.chapter<=curCh||n.done||n.open;
 const donePts=main.slice(0,Math.min(main.length,reached+1)).map(n=>n.xy),todoPts=main.slice(Math.max(0,reached)).filter(shown).map(n=>n.xy);
 let seen=0;try{seen=+localStorage.getItem(SEEN)||0}catch{}
 box.innerHTML=`<div class="portal-title story-head"><div><h2>Histoire</h2><span class="portal-muted">La Triade d’Hackénia</span></div><div class="story-progress" aria-label="${doneCount} parties terminées sur ${line.length}"><span><b>${doneCount}</b> / ${line.length} parties</span><i><em style="width:${Math.round(doneCount/Math.max(1,line.length)*100)}%"></em></i></div></div>
 <div class="sm-wrap"><div class="sm-viewport" tabindex="0" aria-label="Carte d’Hackénia : glissez pour vous déplacer, pincez pour zoomer"><div class="sm-world" style="width:${MAP.w}px;height:${MAP.h}px">
 <img class="sm-map" src="${MAP.src}" alt="Carte du continent d’Hackénia" draggable="false" width="${MAP.w}" height="${MAP.h}">
 <svg class="sm-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" aria-hidden="true"><path class="sm-path todo" data-w="3.2" d="${curve(todoPts)}"/>${all.filter(n=>n.p.optional&&shown(n)).map(n=>{const i=parts.indexOf(n.p),prev=all[i-1];return prev?`<path class="sm-path branch" data-w="2.4" d="M${prev.xy[0]},${prev.xy[1]} L${n.xy[0]},${n.xy[1]}"/>`:''}).join('')}<path class="sm-path done-glow" data-w="9" d="${curve(donePts)}"/><path class="sm-path done" data-w="4" d="${curve(donePts)}"/></svg>
 ${all.filter(shown).map(n=>{const [lab,name]=A.splitTitle(n.p.title),state=n.done?'done':n===cur?'current':n.open?'open':'locked',icon=n.done?'✓':!n.open?'🔒':n.p.optional?'★':n.p.duel?'⚔':'📖',num=(lab.match(/\d+\s*bis|\d+/)?.[0]||'').replace(/\s*bis/,'b');
  return `<button type="button" class="sm-node ${state}${n.p.optional?' bonus':''}" data-node="${n.p.id}" style="left:${n.xy[0]}px;top:${n.xy[1]}px" aria-label="${esc(n.p.title)}${n.done?' (terminée)':!n.open?' (verrouillée)':''}"><span class="sm-medal"><i>${icon}</i></span><span class="sm-tag">${n.p.chapter===2?'II':'I'}·${esc(num||'★')}</span></button>`}).join('')}
 </div><div class="sm-ctrl"><button type="button" data-sm="in" aria-label="Zoomer">+</button><button type="button" data-sm="out" aria-label="Dézoomer">−</button><button type="button" data-sm="me" aria-label="Revenir à ma progression">📍</button><button type="button" data-sm="all" aria-label="Voir toute la carte">🗺</button></div>
 <div class="sm-sheet" hidden></div></div><div class="sm-foot"><span>Glissez pour explorer · touchez un point pour l’ouvrir</span><button type="button" class="story-view-toggle" data-view="list">☰ Liste des parties</button></div></div>`;
 box.querySelector('[data-view="list"]').onclick=()=>A.setView('list');
 vp=box.querySelector('.sm-viewport');world=box.querySelector('.sm-world');
 // tracé du chemin : si une partie vient d’être terminée, le dernier tronçon se dessine
 const donePath=world.querySelector('.sm-path.done'),glowPath=world.querySelector('.sm-path.done-glow');
 const grow=reached>seen&&reached>0&&donePts.length>1&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
 if(grow){const L=donePath.getTotalLength(),seg=curve(donePts.slice(0,-1)),tmp=document.createElementNS('http://www.w3.org/2000/svg','path');tmp.setAttribute('d',seg);world.querySelector('svg').append(tmp);const L0=donePts.length>2?tmp.getTotalLength():0;tmp.remove();
  for(const p of[donePath,glowPath]){p.style.strokeDasharray=L;p.style.strokeDashoffset=L-L0}}
 try{localStorage.setItem(SEEN,String(reached))}catch{}
 // caméra : vue d’ensemble, puis plongée vers la partie en cours
 const target={x:cur.xy[0]/MAP.w,y:cur.xy[1]/MAP.h,s:cur.p.chapter===2?3:2.4};
 requestAnimationFrame(()=>{fly({x:.52,y:.42,s:1.15},0);setTimeout(()=>{fly(target,1500);if(grow)setTimeout(()=>{for(const p of[donePath,glowPath]){p.style.transition='stroke-dashoffset 1.6s ease-in-out';p.style.strokeDashoffset='0'}setTimeout(()=>world.querySelector(`[data-node="${cur.p.id}"]`)?.classList.add('arrive'),1500)},1300)},350)});
 // fiche d’un point
 const sheet=box.querySelector('.sm-sheet');
 const open=id=>{const n=all.find(x=>x.p.id===id);if(!n)return;const [lab,name]=A.splitTitle(n.p.title),img=A.thumb(n.p);
  sheet.innerHTML=`<button type="button" class="sm-close" aria-label="Fermer">✕</button>${img?`<span class="sm-thumb" style="background-image:url('${esc(img)}')"></span>`:''}<div class="sm-info"><small>Chapitre ${n.p.chapter===2?'II':'I'} · ${esc(lab||'Partie')}${n.p.optional?' · bonus':''}</small><strong>${esc(name)}</strong><span class="story-kind ${n.p.duel?'duel':'tale'}">${n.p.duel?'⚔ Duel · '+esc(n.p.duel.foe):'📖 Récit'}${n.done?' · terminée':''}</span></div><button type="button" class="${n.open&&!n.done?'portal-primary':''}" data-go="${n.p.id}" ${n.open?'':'disabled'}>${!n.open?'🔒 Verrouillée':n.done?'Rejouer':'Commencer'}</button>`;
  sheet.hidden=false;sheet.querySelector('.sm-close').onclick=()=>{sheet.hidden=true};sheet.querySelector('[data-go]').onclick=()=>A.start(id);
  fly({x:n.xy[0]/MAP.w,y:n.xy[1]/MAP.h+(.06/cam.s),s:Math.max(cam.s,2.2)},600)};
 // gestes : glisser, pincer, molette, double-toucher
 const pts=new Map();let moved=0,pinch=0,startCam=null;
 vp.addEventListener('pointerdown',e=>{vp.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;startCam={...cam};if(pts.size===2){const [a,b]=[...pts.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
 vp.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const prev=pts.get(e.pointerId),cur2={x:e.clientX,y:e.clientY};pts.set(e.pointerId,cur2);const s=cam.s*minScale();
  if(pts.size===2&&pinch){const [a,b]=[...pts.values()];const k=Math.hypot(a.x-b.x,a.y-b.y)/pinch;cam.s=startCam.s*k;moved=99;apply();return}
  const dx=cur2.x-prev.x,dy=cur2.y-prev.y;moved+=Math.abs(dx)+Math.abs(dy);cam.x-=dx/s/MAP.w;cam.y-=dy/s/MAP.h;apply()});
 const up=e=>{const wasTap=moved<8&&pts.size===1;pts.delete(e.pointerId);if(pts.size<2)pinch=0;if(wasTap){const node=document.elementsFromPoint(e.clientX,e.clientY).find(el=>el.classList?.contains('sm-node'));if(node)open(node.dataset.node)}};
 vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);pinch=0});
 vp.addEventListener('wheel',e=>{e.preventDefault();cam.s*=e.deltaY<0?1.15:1/1.15;apply(120)},{passive:false});
 vp.addEventListener('dblclick',()=>fly({s:cam.s*1.6},350));
 vp.addEventListener('keydown',e=>{const k={ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowUp:[0,-.04],ArrowDown:[0,.04]}[e.key];if(k){e.preventDefault();fly({x:cam.x+k[0]/cam.s,y:cam.y+k[1]/cam.s},200)}else if(e.key==='+')fly({s:cam.s*1.3},200);else if(e.key==='-')fly({s:cam.s/1.3},200)});
 box.querySelector('.sm-ctrl').addEventListener('click',e=>{const a=e.target.closest('[data-sm]')?.dataset.sm;if(a==='in')fly({s:cam.s*1.4},300);else if(a==='out')fly({s:cam.s/1.4},300);else if(a==='me')fly(target,700);else if(a==='all')fly({x:.5,y:.5,s:1},700)});
 new ResizeObserver(()=>apply()).observe(vp)}
window.HackeniaStoryMap={render,positions:POS};
})();
