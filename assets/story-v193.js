/* v193 — Mode Histoire : chapitres de la Triade d’Hackénia (textes, décors et personnages d’origine) avec des duels de dés.
   Données : assets/story-data-v193.js (window.HACKENIA_STORY). Progression enregistrée dans le profil (profile.story). */
(()=>{'use strict';
const PARTS=window.HACKENIA_STORY||[],game=window.hackeniaGame,P=()=>window.HackeniaPortal;
const REWARD=50,LOAN=[36,37,38,39,1,3,5,7,9,11];// deck prêté (Ébérien, Kala, Grimgors, Jhimm + dés communs) si aucun deck valide
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pending=null;// duel d'histoire en cours : {id}

// ——— Progression ———
function prog(){const s=P()?.profile()?.story;return{done:{...(s?.done||{})},rewarded:{...(s?.rewarded||{})}}}
function mainline(){return PARTS.filter(p=>!p.optional)}
function unlocked(id){const part=PARTS.find(p=>p.id===id),d=prog().done;if(!part)return false;if(part.optional){const i=PARTS.indexOf(part);return !!d[PARTS[i-1]?.id]}const line=mainline(),i=line.indexOf(part);return line.slice(0,i).every(p=>d[p.id])}
function complete(id){const portal=P();if(!portal)return;const pr=portal.profile(),first=!pr.story?.rewarded?.[id];let next=structuredClone(pr);next.story={done:{...(pr.story?.done||{}),[id]:true},rewarded:{...(pr.story?.rewarded||{}),[id]:true}};
 let gift='';if(first){const withPouch=portal.planPouch({...next,gold:next.gold+10});if(withPouch){next=withPouch;gift=' et une bourse offerte'}else next.gold+=10;next.gold+=REWARD}
 if(portal.commit(next))portal.toast(first?`Partie terminée ! +${REWARD} Bubulles${gift||' (+10)'} · ouvrez votre bourse dans la Boutique.`:'Partie terminée.')}

// ——— Scène de dialogue ———
let scene,seq=[],step=0,onDone=null;
function ensureScene(){if(scene)return scene;scene=document.createElement('section');scene.id='story-scene';scene.hidden=true;scene.setAttribute('role','dialog');scene.setAttribute('aria-label','Histoire');
 scene.innerHTML='<div class="ss-bg"></div><div class="ss-bgb"></div><div class="ss-caption"></div><div class="ss-cast"></div><div class="ss-box"><div class="ss-speaker"></div><p class="ss-text" aria-live="polite"></p><div class="ss-choices"></div><div class="ss-actions"><span class="ss-progress"></span><button type="button" data-ss="prev">Précédent</button><button type="button" data-ss="quit">Menu</button><button type="button" class="ss-next" data-ss="next">Continuer</button></div></div>';
 document.body.append(scene);
 scene.addEventListener('click',e=>{const a=e.target.closest('[data-ss]')?.dataset.ss;if(a==='prev'&&step>0){step--;draw()}else if(a==='next')next();else if(a==='quit'){close();P()?.open('story')}else if(a==='choice'){const c=seq[step].choices[+e.target.closest('[data-i]').dataset.i];close();choose(c.go)}});
 document.addEventListener('keydown',e=>{if(scene.hidden)return;if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){if(!seq[step]?.choices){e.preventDefault();next()}}else if(e.key==='ArrowLeft'&&step>0){step--;draw()}});return scene}
let chooseHandler=null;function choose(go){chooseHandler?.(go)}
function play(beats,done,choice){ensureScene();seq=beats;step=0;onDone=done;chooseHandler=choice||null;if(!seq.length){done?.();return}scene.hidden=false;document.body.classList.add('story-open');draw()}
function close(){if(scene){scene.hidden=true}document.body.classList.remove('story-open')}
function next(){if(step<seq.length-1){step++;draw()}else{const d=onDone;close();d?.()}}
function draw(){const b=seq[step];scene.className='ss '+(b.c||[]).map(c=>'ss-'+c).join(' ')+(b.s==='Voix off'?' ss-narration':'');
 scene.querySelector('.ss-bg').style.backgroundImage=b.bg&&b.bg!=='none'?b.bg:'';scene.querySelector('.ss-bgb').style.backgroundImage=b.bgb||'';
 scene.querySelector('.ss-caption').textContent=b.l||'';const cast=scene.querySelector('.ss-cast');cast.replaceChildren();
 for(const x of b.cast||[]){if(x.art){const img=document.createElement('img');img.className='ss-art';img.src=x.art;img.alt=x.alt||'';cast.append(img);continue}
  const sp=document.createElement('div');sp.className='ss-sprite '+(x.k||[]).map(k=>'ss-'+k.replace(/^story-/,'').replace(/^is-/,'')).join(' ');sp.setAttribute('role','img');sp.setAttribute('aria-label',x.n||'');
  if(x.p){sp.style.backgroundImage='none';const im=document.createElement('img');im.src=x.p;im.alt='';sp.append(im)}else{sp.style.backgroundImage=x.img;sp.style.backgroundSize=x.sz||'contain';sp.style.backgroundPosition=x.pos||'center bottom'}cast.append(sp)}
 scene.querySelector('.ss-speaker').textContent=b.s;scene.querySelector('.ss-text').textContent=b.t;
 const ch=scene.querySelector('.ss-choices');ch.innerHTML=(b.choices||[]).map((c,i)=>`<button type="button" data-ss="choice" data-i="${i}" class="${c.go==='duel'?'ss-primary':''}">${esc(c.label)}</button>`).join('');
 const nx=scene.querySelector('.ss-next');nx.hidden=!!b.choices;nx.textContent=step===seq.length-1?(b.next||'Continuer'):'Continuer';scene.querySelector('[data-ss="prev"]').disabled=step===0;scene.querySelector('.ss-progress').textContent=(step+1)+' / '+seq.length}

// ——— Déroulement d’une partie ———
function start(id){const part=PARTS.find(p=>p.id===id);if(!part||!unlocked(id))return;
 const afterIntro=()=>part.duel?duel(part):complete(part.id)||P()?.open('story');
 play(part.intro,afterIntro,go=>{if(go==='duel')duel(part);else play(part.silence||[],()=>{complete(part.id);P()?.open('story')})});}
function duel(part){const d=part.duel,deck=P()?.preferredDeck();pending={id:part.id};document.body.classList.remove('portal-open');location.hash='partie';
 game.start(deck?deck.dice:LOAN,d.terrain,'story',d.level,{name:d.foe,dice:d.dice});window.dispatchEvent(new Event('resize'));
 if(!deck)setTimeout(()=>P()?.toast('Aucun deck valide : Kayla vous prête un deck de départ pour ce duel.'),600)}
function after(won){if(!pending)return;const part=PARTS.find(p=>p.id===pending.id);pending=null;if(!part)return;
 setTimeout(()=>{game.pause?.();if(won)play(part.victory||[],()=>{complete(part.id);P()?.open('story')});else play(part.lose&&part.lose.length?part.lose:[{s:'Voix off',t:'Ce duel est perdu… Reprenez votre souffle et retentez votre chance depuis le menu Histoire.',l:part.title,c:[],cast:[],next:'Retour au menu'}],()=>P()?.open('story'))},2600)}
window.addEventListener('hackenia-player-victory',e=>{if(e.gameMode==='story')after(true)});
window.addEventListener('hackenia-player-defeat',e=>{if(e.gameMode==='story')after(false)});
window.addEventListener('hackenia-player-draw',e=>{if(e.gameMode==='story')after(false)});

// ——— Menu des chapitres ———
const CHAPTERS={1:{n:'I',t:'Les jumeaux de Dassom',img:'assets/story/twins-temple-background.webp'},2:{n:'II',t:'Le grand tournoi des apprentis',img:'assets/story/dassom-council-background.webp'}};
const thumb=p=>{const beats=[...(p.intro||[]),...(p.victory||[])];for(const b of beats){const m=/url\((?:\\?["'])?([^"')\\]+)/.exec(b.bg||'');if(m)return m[1]}for(const b of beats)for(const x of b.cast||[]){const a=x.art||x.p;if(a&&a.startsWith('assets/story/'))return a}return CHAPTERS[p.chapter]?.img||''};
const splitTitle=t=>{const m=/^(.*?)\s*:\s*(.+)$/.exec(t);return m?[m[1],m[2]]:['',t]};
function render(box){const d=prog(),line=mainline(),doneCount=line.filter(p=>d.done[p.id]).length,nextPart=line.find(p=>!d.done[p.id]),pct=Math.round(doneCount/Math.max(1,line.length)*100);
 box.innerHTML=`<div class="portal-title story-head"><div><h2>Histoire</h2><span class="portal-muted">La Triade d’Hackénia</span></div><div class="story-progress" aria-label="${doneCount} parties terminées sur ${line.length}"><span><b>${doneCount}</b> / ${line.length} parties</span><i><em style="width:${pct}%"></em></i></div></div><p class="story-intro">Revivez l’histoire de la Triade d’Hackénia, avec ses dialogues et ses illustrations. Chaque duel se joue aux dés. Première réussite d’une partie : <b>+${REWARD} Bubulles</b> et une bourse offerte.</p><div class="story-chapters">`+
 [1,2].map(ch=>{const C=CHAPTERS[ch],parts=PARTS.filter(p=>p.chapter===ch),done=parts.filter(p=>d.done[p.id]).length,open=parts.includes(nextPart)||(!nextPart&&ch===2),unl=parts.some(p=>unlocked(p.id));
  return `<details class="story-chapter${done===parts.length?' complete':''}${unl?'':' locked'}" ${open?'open':''}><summary><span class="story-banner" style="background-image:url('${C.img}')"></span><span class="story-chapter-text"><small>Chapitre ${C.n}</small><strong>${esc(C.t)}</strong></span><span class="story-chapter-count">${done} / ${parts.length}</span></summary><ol class="story-parts">`+parts.map(p=>{const un=unlocked(p.id),dn=!!d.done[p.id],cur=p===nextPart,[label,name]=splitTitle(p.title),img=thumb(p);
   const state=dn?'done':cur?'current':un?'open':'locked',seal=dn?'✓':p.optional?'★':(label.match(/\d+\s*bis|\d+/)?.[0]||'·').replace(/\s*bis/,'b');
   return `<li class="story-part ${state}"><span class="story-seal" aria-hidden="true" data-n="${seal}"></span>${img?`<span class="story-thumb" style="background-image:url('${esc(img)}')"></span>`:'<span class="story-thumb"></span>'}<div class="story-part-text"><small>${esc(label||'Partie')}${p.optional&&!/bonus/i.test(label)?' · bonus':''}</small><strong>${esc(name)}</strong><span class="story-kind ${p.duel?'duel':'tale'}">${p.duel?'⚔ Duel · '+esc(p.duel.foe):'📖 Récit'}${dn?' · terminée':''}</span></div><button type="button" class="${un&&!dn?'portal-primary':''}" data-story="${p.id}" ${un?'':'disabled'}>${!un?'🔒':dn?'Rejouer':cur?'Commencer':'Jouer'}</button></li>`}).join('')+'</ol></details>'}).join('')+'</div>';
 box.querySelectorAll('[data-story]').forEach(b=>b.onclick=()=>start(b.dataset.story))}
window.HackeniaStory={render,start,parts:PARTS,unlocked,_after:after};
})();
