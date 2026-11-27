/* v193 — Mode Histoire : chapitres de la Triade d’Hackénia (textes, décors et personnages d’origine) avec des duels de dés.
   Données : assets/story-data-v193.js (window.HACKENIA_STORY). Progression enregistrée dans le profil (profile.story). */
(()=>{'use strict';
const PARTS=window.HACKENIA_STORY||[],game=window.hackeniaGame,P=()=>window.HackeniaPortal;
const REWARD=50,LOAN=[36,37,38,39,1,3,5,7,9,11];// deck prêté (Ébérien, Kala, Grimgors, Jhimm + dés communs) si aucun deck valide
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pending=null;// duel d'histoire en cours : {id}

// ——— Progression ———
function prog(){const s=P()?.profile()?.story,done={...(s?.done||{})};/* v370 — partie 10 du chapitre I ajoutée en cours de route : déjà vécue par qui a fini la partie suivante */if(done.c1p9&&!done.c1p8bis)done.c1p8bis=true;if(done.c2p5&&!done.c2p4bis)done.c2p4bis=true;/* v373 — idem pour la partie 5 du chapitre II */return{done,rewarded:{...(s?.rewarded||{})}}}
function mainline(){return PARTS.filter(p=>!p.optional)}
function unlocked(id){const part=PARTS.find(p=>p.id===id),d=prog().done;if(!part)return false;if(part.optional){const i=PARTS.indexOf(part);return !!d[PARTS[i-1]?.id]}const line=mainline(),i=line.indexOf(part);return line.slice(0,i).every(p=>d[p.id]||(p.id==='c1p1'&&triedSet().has('c1p1'))/* v418 — duel contre Kayla : il suffit de l’avoir tenté, même abandonné en cours */)}
function complete(id){const portal=P();if(!portal)return;const pr=portal.profile(),first=!pr.story?.rewarded?.[id];let next=structuredClone(pr);next.story={done:{...(pr.story?.done||{}),[id]:true},rewarded:{...(pr.story?.rewarded||{}),[id]:true}};
 let gift='';if(first){const withPouch=portal.planPouch({...next,gold:next.gold+10});if(withPouch){next=withPouch;gift=' et une boubourse offerte'}else next.gold+=10;next.gold+=REWARD}
 const C=window.HackeniaChallenges,before=C?C.unlocked(pr).map(d=>d.id):[];
 if(portal.commit(next)){const fresh=C?C.unlocked(next).filter(d=>!before.includes(d.id)):[];portal.toast((first?`Partie terminée ! +${REWARD} Bubulles${gift||' (+10)'} · ouvrez votre boubourse dans la Boutique.`:'Partie terminée.')+fresh.map(d=>` ✦ Défi « ${d.title} » accompli : ${d.reward} ! Équipez-la dans Options › Objet porté.`).join(''))}}

// ——— Scène de dialogue ———
let scene,seq=[],step=0,onDone=null;
function ensureScene(){if(scene)return scene;scene=document.createElement('section');scene.id='story-scene';scene.hidden=true;scene.setAttribute('role','dialog');scene.setAttribute('aria-label','Histoire');
 scene.innerHTML='<div class="ss-bg"></div><div class="ss-bgb"></div><div class="ss-caption"></div><div class="ss-cast"></div><div class="ss-box"><button type="button" class="ss-skip" data-ss="skip" hidden></button><div class="ss-speaker"></div><p class="ss-text" aria-live="polite"></p><div class="ss-choices"></div><div class="ss-actions"><span class="ss-progress"></span><button type="button" data-ss="prev">Précédent</button><button type="button" data-ss="quit">Menu</button><button type="button" class="ss-next" data-ss="next">Continuer</button></div></div>';
 document.body.append(scene);
 scene.addEventListener('click',e=>{const a=e.target.closest('[data-ss]')?.dataset.ss;if(a==='prev'&&step>0){step--;draw()}else if(a==='next')next();else if(a==='quit'){close();P()?.open('story')}else if(a==='skip'&&skipHandler){const f=skipHandler;close();f()}else if(a==='choice'){const c=seq[step].choices[+e.target.closest('[data-i]').dataset.i];close();choose(c.go)}});
 document.addEventListener('keydown',e=>{if(scene.hidden)return;if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){if(!seq[step]?.choices){e.preventDefault();next()}}else if(e.key==='ArrowLeft'&&step>0){step--;draw()}});return scene}
let chooseHandler=null,skipHandler=null,skipLabel='';function choose(go){chooseHandler?.(go)}
function play(beats,done,choice,skip=null,label='⏩ Passer au duel'){ensureScene();seq=beats;step=0;onDone=done;chooseHandler=choice||null;skipHandler=skip;skipLabel=label;if(!seq.length){done?.();return}scene.hidden=false;document.body.classList.add('story-open');draw()}
function close(){if(scene){scene.hidden=true}document.body.classList.remove('story-open')}
function preloadNext(){const b=seq[step+1];for(const x of b?.cast||[]){const u=x.p?null:window.HackeniaEmo?.pick(x.n,x.m||'neutral');if(u)(new Image).src=u}}/* v429 — la pose suivante est déjà chargée */
function next(){if(step<seq.length-1){step++;draw()}else{const d=onDone;close();d?.()}}
/* v431 — Proportions : chaque personnage est découpé sur sa silhouette (assets/story-sprites-v431.js) et affiché à sa taille réelle
   (HackeniaEmo.stature : un nain fait environ la moitié d'un humain), pieds alignés. Les grands sprites (boss, jumeaux, pixies, cheval) gardent leur mise en page. */
function spriteSpec(sp,x,emo){const B=window.HACKENIA_SPRITE_BOUNDS;if(!B||/ss-(boss|twins|pixie|equine)-sprite/.test(sp.className))return null;
 let url=emo||x.p||'',cell=null;if(!url){const m=/url\("?([^")]+)"?\)/.exec(x.img||'');if(!m)return null;url=m[1];if(x.sz==='400% 300%'){const [px,py]=(x.pos||'').split(' ').map(parseFloat);cell=[Math.round(px/33.3333),Math.round(py/50)];if(cell[0]<0||cell[0]>3||cell[1]<0||cell[1]>2)return null}}
 const b=B[url+(cell?'#'+cell[0]+','+cell[1]:'')];if(!b)return null;return {sp,url,cell,b,stat:window.HackeniaEmo?.stature?.(x.n)??1}}
function fitCast(cast,specs){if(!specs.length)return;const Hb=Math.min(innerHeight*.36,340,innerWidth*.62),gap=6;
 const dims=specs.map(s=>{const bh=s.b[3]-s.b[1],bw=(s.b[2]-s.b[0])*s.b[4],h=Hb*s.stat;return {h,w:h*bw/bh}});
 const others=[...cast.children].filter(e=>!specs.some(s=>s.sp===e)).reduce((a,e)=>a+e.getBoundingClientRect().width,0),avail=(cast.clientWidth||innerWidth)-others-gap*(cast.children.length-1);
 const k=Math.min(1,avail/dims.reduce((a,d)=>a+d.w,0));
 specs.forEach((s,i)=>{const h=dims[i].h*k,w=dims[i].w*k,bh=s.b[3]-s.b[1],cellH=h/bh,cellW=cellH*s.b[4],sp=s.sp,st=sp.style;
  sp.replaceChildren();sp.classList.add('ss-sized');st.setProperty('background-image','url("'+s.url+'")');
  st.setProperty('width',w+'px','important');st.setProperty('height',h+'px','important');st.setProperty('flex','0 0 auto','important');st.setProperty('max-width','none','important');st.setProperty('aspect-ratio','auto','important');
  st.setProperty('background-size',s.cell?(4*cellW)+'px '+(3*cellH)+'px':cellW+'px '+cellH+'px','important');
  st.setProperty('background-position',-((s.cell?s.cell[0]:0)*cellW+s.b[0]*cellW)+'px '+(-((s.cell?s.cell[1]:0)*cellH+s.b[1]*cellH))+'px','important');
  st.setProperty('margin','0 '+gap/2+'px')})}
function draw(){const b=seq[step];scene.className='ss '+(b.c||[]).map(c=>'ss-'+c).join(' ')+(b.s==='Voix off'?' ss-narration':/^Journal de /.test(b.s||'')?' ss-narration ss-diary':'');/* v452 — journaux de Kala, Jhimm et Bolduc */
 scene.querySelector('.ss-bg').style.backgroundImage=b.bg&&b.bg!=='none'?b.bg:'';scene.querySelector('.ss-bgb').style.backgroundImage=b.bgb||'';
 scene.querySelector('.ss-caption').textContent=b.l||'';const cast=scene.querySelector('.ss-cast');cast.replaceChildren();
 /* v452 — personnages vivants : apparition, tremblement s'ils ont peur, élan en combat, petit saut de joie, chute K.-O. (seulement quand l'humeur change) */
 const was=new Map((step>0?seq[step-1]?.cast||[]:[]).filter(x=>x.n).map(x=>[x.n,x.m||'neutral'])),anim=x=>{const m=x.m||'neutral';if(!was.has(x.n))return 'in';if(was.get(x.n)===m)return '';return {scared:'scared',fight:'fight',angry:'fight',happy:'happy',ko:'ko',surprised:'happy'}[m]||''};
 const sized=[];for(const x of b.cast||[]){if(x.art){const img=document.createElement('img');img.className='ss-art';img.src=x.art;img.alt=x.alt||'';cast.append(img);continue}
  const sp=document.createElement('div');sp.className='ss-sprite '+(x.k||[]).map(k=>'ss-'+k.replace(/^story-/,'').replace(/^is-/,'')).join(' ');sp.setAttribute('role','img');sp.setAttribute('aria-label',x.n||'');{const a=anim(x);if(a)sp.classList.add('ss-anim-'+a)}
  const emo=x.p?null:window.HackeniaEmo?.pick(x.n,x.m||'neutral');/* v429 — pose de la planche d’émotions qui correspond à l’humeur de la réplique */
  if(x.p||emo){sp.style.backgroundImage='none';const im=document.createElement('img');im.src=x.p||emo;im.alt='';if(emo)sp.classList.add('ss-emo');sp.append(im)}else{sp.style.backgroundImage=x.img;sp.style.backgroundSize=x.sz||'contain';sp.style.backgroundPosition=x.pos||'center bottom'}cast.append(sp);sized.push(spriteSpec(sp,x,emo))}
 fitCast(cast,sized.filter(Boolean));
 {const all=[...cast.querySelectorAll('.ss-sprite')];all.forEach((el,i)=>el.style.setProperty('--ss-dir',i<(all.length-1)/2?1:i>(all.length-1)/2?-1:(i%2?-1:1)))}/* l’élan part vers le centre de la scène */
 preloadNext();scene.querySelector('.ss-speaker').textContent=b.s;scene.querySelector('.ss-text').textContent=b.t;
 const ch=scene.querySelector('.ss-choices');ch.innerHTML=(b.choices||[]).map((c,i)=>`<button type="button" data-ss="choice" data-i="${i}" class="${c.go==='duel'?'ss-primary':''}">${esc(c.label)}</button>`).join('');
 const nx=scene.querySelector('.ss-next');nx.hidden=!!b.choices;nx.textContent=step===seq.length-1?(b.next||'Continuer'):'Continuer';scene.querySelector('[data-ss="prev"]').disabled=step===0;scene.querySelector('.ss-progress').textContent=(step+1)+' / '+seq.length;const sk=scene.querySelector('.ss-skip');sk.hidden=!skipHandler;sk.textContent=skipLabel}

// ——— Déroulement d’une partie ———
/* v302 — avant chaque duel de l'Histoire : confirmer (ou changer) le deck utilisé. */
function chooseDeck(go){const decks=P()?.legalDecks?.()||[];if(!decks.length){go();return}
 document.getElementById('story-deck')?.remove();const dlg=document.createElement('dialog');dlg.id='story-deck';dlg.setAttribute('aria-labelledby','story-deck-title');const cur=P().preferredDeck?.()?.id||decks[0].id;
 const names=d=>d.dice.map(i=>game.monsters[i]?.cn||'?').join(', ');
 dlg.innerHTML=`<h3 id="story-deck-title">Avec quel deck ?</h3><p>Choisissez le deck de ce duel.</p><select aria-label="Deck">${decks.map(d=>`<option value="${esc(d.id)}" ${d.id===cur?'selected':''}>${esc(d.name)}</option>`).join('')}</select><p class="sd-list"></p><div class="sd-actions"><button type="button" data-sd="cancel">Retour</button><button type="button" class="sd-go" data-sd="go">Lancer le duel</button></div>`;
 const sel=dlg.querySelector('select'),list=dlg.querySelector('.sd-list'),show=()=>{const d=decks.find(x=>x.id===sel.value);list.textContent=d?names(d):''};sel.onchange=show;show();
 dlg.addEventListener('click',e=>{const a=e.target.closest('[data-sd]')?.dataset.sd;if(a==='go'){P().setPreferredDeck?.(sel.value);dlg.close();go()}else if(a==='cancel'){dlg.close();P()?.open('story')}});dlg.addEventListener('cancel',()=>{P()?.open('story')});dlg.addEventListener('close',()=>dlg.remove());document.body.append(dlg);dlg.showModal()}
function start(id){const part=PARTS.find(p=>p.id===id);if(!part||!unlocked(id))return;
 const afterIntro=()=>part.duel?chooseDeck(()=>duel(part)):complete(part.id)||P()?.open('story');
 /* v379 — duel déjà tenté (ou partie déjà finie) : un bouton permet de passer directement au duel */const tried=part.duel&&(prog().done[part.id]||triedSet().has(part.id));
 play(part.intro,afterIntro,go=>{if(go==='duel')chooseDeck(()=>duel(part));else play(part.silence||[],()=>{complete(part.id);P()?.open('story')})},tried?()=>chooseDeck(()=>duel(part)):null);}
function triedSet(){try{return new Set(JSON.parse(localStorage.getItem('hackenia-story-tried')||'[]'))}catch{return new Set()}}
function markTried(id){try{const t=triedSet();t.add(id);localStorage.setItem('hackenia-story-tried',JSON.stringify([...t]))}catch{}}
function duel(part){const d=part.duel,deck=P()?.preferredDeck();pending={id:part.id};window.__hkDuelOwner='story';markTried(part.id);document.body.classList.remove('portal-open');location.hash='partie';
 game.start(deck?deck.dice:LOAN,d.terrain,'story',d.level,{name:d.foe,dice:d.dice,boss:d.boss});window.dispatchEvent(new Event('resize'));
 if(!deck)setTimeout(()=>P()?.toast('Aucun deck valide : Kayla vous prête un deck de départ pour ce duel.'),600)}
function after(won){if(!pending||window.__hkDuelOwner!=='story')return;const part=PARTS.find(p=>p.id===pending.id);pending=null;if(!part)return;
 setTimeout(()=>{game.pause?.();if(won||part.id==='c1p1')play(part.victory||[],()=>{complete(part.id);P()?.open('story')});else play(part.lose&&part.lose.length?part.lose:[{s:'Voix off',t:'Ce duel est perdu… Reprenez votre souffle et retentez votre chance depuis le menu Histoire.',l:part.title,c:[],cast:[],next:'Retour au menu'}],()=>P()?.open('story'),null,()=>chooseDeck(()=>duel(part)),'↻ Rejouer le duel')},2600)}
window.addEventListener('hackenia-player-victory',e=>{if(e.gameMode==='story')after(true)});
window.addEventListener('hackenia-player-defeat',e=>{if(e.gameMode==='story')after(false)});
window.addEventListener('hackenia-player-draw',e=>{if(e.gameMode==='story')after(false)});
/* v331 — En plein duel : quand l'adversaire pose sa première créature, l'illustration de sa carte (reprise de la Triade) surgit
   quelques secondes, comme une carte jouée. La partie continue dessous ; toucher l'image la referme. */
const REVEAL={c1p1:'p28',c1p2:'p12',c1p4:'p38',c1p5:'p02',c1p6:'p16',c1p6bis:'p42',c1p7:'p37',c1p8:'p05',c1p9:'p11',c1p10:'p69',c2p1:'p67',c2p2:'p84',c2p4bis:'../dassom-golem-incident',c2p5:'p76',c2p6:'p65',c2p7:'p82',c2p8:'../../pantheon/maebril-defi',c2p11:'../../pantheon/pachie-defi',c3p2:'../../pantheon/hilam-defi',c3p6:'p37',c3p8:'p42',c4p4:'p113',c4p8:'p68',c4p11:'p71',c4p13:'p88'};
window.addEventListener('hackenia:foe-reveal',e=>{if(!pending)return;const k=REVEAL[pending.id],part=PARTS.find(p=>p.id===pending.id);if(!k||!part)return;
 document.getElementById('story-reveal')?.remove();const el=document.createElement('div');el.id='story-reveal';el.setAttribute('role','status');
 el.innerHTML=`<figure><img src="assets/story/cards/${k}.webp?v=359" alt="${esc(part.duel.foe)}"><figcaption>${esc(part.duel.foe)} entre dans le duel !</figcaption></figure>`;
 let done=false;const close=()=>{if(done)return;done=true;el.classList.add('out');setTimeout(()=>el.remove(),450)};el.addEventListener('click',close);
 document.body.append(el);setTimeout(close,2900)});

// ——— Menu des chapitres ———
const CHAPTERS={1:{n:'I',t:'Les jumeaux de Dassom',img:'assets/story/twins-temple-background.webp'},2:{n:'II',t:'Les mystères de Dassom',img:'assets/story/dassom-council-background.webp'},3:{n:'III',t:'Le tournoi des apprenti(e)s',img:'assets/story/cards/p92.webp'},4:{n:'IV',t:'Entre primes et barde téméraire',img:'assets/story/cards/p88.webp'},5:{n:'V',t:'Les fidèles d’Orcus',img:'assets/story/mirrhol-road-background.webp'},6:{n:'VI',t:'Les malices d’Erevan, 1re partie',img:'assets/story/erevan-cave-background.webp'},7:{n:'VII',t:'Les malices d’Erevan, détour vers Mirrhol',img:'assets/story/unicorn-nest-background.webp'}};/* v432 — chapitre V, raconté par Kala *//* v368 — chapitres renommés ; le III s'affiche dès qu'il a une partie */
const thumb=p=>{const beats=[...(p.intro||[]),...(p.victory||[])];for(const b of beats){const m=/url\((?:\\?["'])?([^"')\\]+)/.exec(b.bg||'');if(m)return m[1]}for(const b of beats)for(const x of b.cast||[]){const a=x.art||x.p;if(a&&a.startsWith('assets/story/'))return a}return CHAPTERS[p.chapter]?.img||''};
const splitTitle=t=>{const m=/^(.*?)\s*:\s*(.+)$/.exec(t);return m?[m[1],m[2]]:['',t]};
/* v337 — vue « carte » par défaut (assets/story-map-v337.js) ; la liste reste accessible */
const VIEWKEY='hackenia-story-view';const getView=()=>{try{return localStorage.getItem(VIEWKEY)||'map'}catch{return 'map'}};
function render(box){if((getView()==='map'&&window.HackeniaStoryMap||window.HackeniaStoryMap?.isEditing?.())&&window.HackeniaStoryMap){window.HackeniaStoryMap.render(box,{parts:PARTS,chapters:CHAPTERS,prog,mainline,unlocked,start,thumb,splitTitle,setView:v=>{try{localStorage.setItem(VIEWKEY,v)}catch{}render(box)}});return}renderList(box)}
function renderList(box){const d=prog(),line=mainline(),doneCount=line.filter(p=>d.done[p.id]).length,nextPart=line.find(p=>!d.done[p.id]),pct=Math.round(doneCount/Math.max(1,line.length)*100);
 box.innerHTML=`<div class="portal-title story-head compact"><h2 class="story-sr">Histoire</h2><div class="story-progress" aria-label="${doneCount} parties terminées sur ${line.length}"><span><b>${doneCount}</b> / ${line.length} parties</span><i><em style="width:${pct}%"></em></i></div></div><p class="story-intro">Revivez l’histoire de la Triade d’Hackénia, avec ses dialogues et ses illustrations. Chaque duel se joue aux dés. Première réussite d’une partie : <b>+${REWARD} Bubulles</b> et une boubourse offerte.</p><div class="story-list-tools"><button type="button" class="story-view-toggle" data-view="map">🗺 Voir la carte</button></div><div class="story-chapters">`+
 /* v435 — tous les chapitres, pas seulement I à IV */Object.keys(CHAPTERS).map(Number).filter(ch=>PARTS.some(p=>p.chapter===ch)).map((ch,i,all)=>{const C=CHAPTERS[ch],parts=PARTS.filter(p=>p.chapter===ch),done=parts.filter(p=>d.done[p.id]).length,open=parts.includes(nextPart)||(!nextPart&&ch===all[all.length-1]),unl=parts.some(p=>unlocked(p.id));
  return `<details class="story-chapter${done===parts.length?' complete':''}${unl?'':' locked'}" ${open?'open':''}><summary><span class="story-banner" style="background-image:url('${C.img}')"></span><span class="story-chapter-text"><small>Chapitre ${C.n}</small><strong>${esc(C.t)}</strong></span><span class="story-chapter-count">${done} / ${parts.length}</span></summary><ol class="story-parts">`+parts.map(p=>{const un=unlocked(p.id),dn=!!d.done[p.id],cur=p===nextPart,[label,name]=splitTitle(p.title),img=thumb(p);
   const state=dn?'done':cur?'current':un?'open':'locked',seal=dn?'✓':p.optional?'★':(label.match(/\d+\s*bis|\d+/)?.[0]||'·').replace(/\s*bis/,'b');
   return `<li class="story-part ${state}"><span class="story-seal" aria-hidden="true" data-n="${seal}"></span>${img?`<span class="story-thumb" style="background-image:url('${esc(img)}')"></span>`:'<span class="story-thumb"></span>'}<div class="story-part-text"><small>${esc(label||'Partie')}${p.optional&&!/bonus/i.test(label)?' · bonus':''}</small><strong>${esc(name)}</strong><span class="story-kind ${p.duel?'duel':'tale'}">${p.duel?'⚔ Duel · '+esc(p.duel.foe):'📖 Récit'}${dn?' · terminée':''}</span></div><button type="button" class="${un&&!dn?'portal-primary':''}" data-story="${p.id}" ${un?'':'disabled'}>${!un?'🔒':dn?'Rejouer':cur?'Commencer':'Jouer'}</button></li>`}).join('')+'</ol></details>'}).join('')+'</div>';
 box.querySelectorAll('[data-story]').forEach(b=>b.onclick=()=>start(b.dataset.story));box.querySelector('[data-view="map"]')?.addEventListener('click',()=>{try{localStorage.setItem(VIEWKEY,'map')}catch{}render(box)})}
window.HackeniaStory={render,start,parts:PARTS,unlocked,_after:after};
})();
