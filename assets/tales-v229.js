/* v229 — « Les Contes de la Taverne » : concours de scènes de jeu de rôle (online/sql/04-tavern-tales.sql).
   Joueurs (niveau 5+) : une scène par concours, lecture et vote pour les scènes sélectionnées, Hall des Conteurs.
   Récompenses : 25 Bubulles par scène sélectionnée, 300 Bubulles et badge Scénariste pour le gagnant. */
(()=>{'use strict';
const MIN_LEVEL=5,SELECTED_GOLD=25,WINNER_GOLD=300;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nl=v=>esc(v).replace(/\n/g,'<br>');
const P=()=>window.HackeniaPortal,level=()=>window.HackeniaProgress?.levelOf?.(P()?.profile()?.xp||0)?.level||1;
const STATUS={sent:['📨','Envoyée — en attente du maître du jeu'],selected:['⭐','Sélectionnée ! Elle est soumise au vote du public'],winner:['🏆','Gagnante !'],rejected:['✖','Non retenue cette fois']};
const fmtDate=d=>new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});
let draft={title:'',author:'',situation:'',npc:'',choices:[{c:'',r:''},{c:'',r:''}],twist:'',rights:false},state=null,msg='',busy=false;

function discordButton(){const url=window.HACKENIA_COMMUNITY?.discord;return url?`<a class="tl-discord" href="${esc(url)}" target="_blank" rel="noopener">💬 Rejoindre la communauté sur Discord</a>`:''}
function entryHtml(e,{vote=false,myVote=null,count=null}={}){return `<article class="tl-entry ${e.status}" data-id="${e.id}"><header><h4>${esc(e.title)}</h4><small>par <b>${esc(e.author)}</b>${count!=null?` · ❤ ${count}`:''}</small></header>
 <p class="tl-sit">${nl(e.situation)}</p>${e.npc?`<p><b>Le PNJ :</b> ${nl(e.npc)}</p>`:''}
 <ol class="tl-choices">${(e.choices||[]).map(x=>`<li><b>${esc(x.c)}</b>${x.r?` → ${esc(x.r)}`:''}</li>`).join('')}</ol>${e.twist?`<p><b>Rebondissement :</b> ${nl(e.twist)}</p>`:''}
 ${vote?`<button type="button" class="${myVote===e.id?'portal-primary':''}" data-vote="${e.id}" ${myVote===e.id?'disabled':''}>${myVote===e.id?'❤ Votre coup de cœur':'♡ Coup de cœur'}</button>`:''}</article>`}

async function load(){const {sb,uid}=await window.HackeniaOnline.session();
 const {data:contests,error}=await sb.from('tale_contests').select('*').order('created_at',{ascending:false}).limit(20);if(error)throw error;
 const current=contests.find(c=>c.status!=='closed')||null,closed=contests.filter(c=>c.status==='closed');
 let mine=[],selected=[],myVote=null,winners=[];
 const r1=await sb.from('tale_entries').select('*').eq('user_id',uid);mine=r1.data||[];
 if(current&&current.status!=='open'){const r=await sb.from('tale_entries').select('id,contest_id,author,title,situation,npc,choices,twist,status').eq('contest_id',current.id).in('status',['selected','winner']);selected=r.data||[];
  const v=await sb.from('tale_votes').select('entry_id').eq('contest_id',current.id).maybeSingle();myVote=v.data?.entry_id||null}
 if(closed.length){const r=await sb.from('tale_entries').select('id,contest_id,author,title,situation,npc,choices,twist,status').in('contest_id',closed.map(c=>c.id)).eq('status','winner');winners=r.data||[]}
 return{uid,current,closed,mine,selected,myVote,winners}}

async function render(host){host=host||document.getElementById('portal-content');const lv=level();
 host.innerHTML=`<div class="portal-title"><div><h2>📜 Les Contes de la Taverne</h2><p>Avant chaque partie de jeu de rôle, imaginez une scène pour les aventuriers. La meilleure sera jouée autour de la table, racontée dans le podcast… et son auteur annoncé !</p></div></div><p class="sb-hint">Chargement…</p>`;
 if(!navigator.onLine){host.querySelector('.sb-hint').textContent='Connectez-vous à Internet pour découvrir le concours en cours.';return}
 try{state=await load();claim(state)}catch(err){host.querySelector('.sb-hint').textContent=/relation|does not exist|PGRST20/i.test(String(err?.message))?'Les Contes de la Taverne ouvrent bientôt !':'Service en ligne inaccessible pour le moment.';return}
 const c=state.current,my=c&&state.mine.find(e=>e.contest_id===c.id);let body='';
 if(!c)body=`<section class="sb-card"><h3>Pas de concours en ce moment</h3><p class="sb-hint">Le prochain sera annoncé avant la prochaine partie de jeu de rôle. Revenez bientôt !</p></section>`;
 else{body+=`<section class="sb-card tl-contest"><span class="tl-tag">${c.status==='open'?'Concours ouvert':'Vote du public'}</span><h3>${esc(c.title)}</h3>${c.theme?`<p>${nl(c.theme)}</p>`:''}<p class="sb-hint">${c.status==='open'?`Participations jusqu’au <b>${fmtDate(c.deadline)}</b>`:'Les participations sont closes : votez pour votre scène préférée !'}</p></section>`;
  if(my)body+=`<section class="sb-card"><h3>Votre participation</h3><p class="tl-status ${my.status}">${STATUS[my.status][0]} ${STATUS[my.status][1]}</p>${my.review_note?`<p class="sb-hint">« ${esc(my.review_note)} »</p>`:''}${entryHtml(my)}</section>`;
  else if(c.status==='open'&&new Date(c.deadline)>new Date())body+=lv<MIN_LEVEL?`<section class="sb-locked"><b>🔒 Niveau ${MIN_LEVEL} requis pour participer</b><p>Vous êtes niveau ${lv}. Jouez et accomplissez vos quêtes pour rejoindre les conteurs de la taverne !</p></section>`:formHtml();
  if(c.status==='voting')body+=`<section class="sb-card"><h3>❤ Le vote du public</h3><p class="sb-hint">Un coup de cœur par joueur (vous pouvez changer d’avis tant que le vote est ouvert).</p>${state.selected.length?state.selected.map(e=>entryHtml(e,{vote:e.id!==my?.id,myVote:state.myVote})).join(''):'<p class="sb-hint">La sélection arrive bientôt.</p>'}</section>`}
 const hall=state.closed.map(k=>{const w=state.winners.find(e=>e.contest_id===k.id);return w?`<li><span><b>${esc(w.title)}</b> par <b>${esc(w.author)}</b></span><small>${esc(k.title)}</small>${k.podcast_url?`<a href="${esc(k.podcast_url)}" target="_blank" rel="noopener">🎧 Écouter l’épisode</a>`:'<small>Épisode bientôt disponible</small>'}<details><summary>Lire la scène</summary>${entryHtml(w)}</details></li>`:''}).join('');
 host.innerHTML=`<div class="portal-title"><div><h2>📜 Les Contes de la Taverne</h2><p>Avant chaque partie de jeu de rôle, imaginez une scène pour les aventuriers. La meilleure sera jouée autour de la table, racontée dans le podcast… et son auteur annoncé !</p></div></div>${discordButton()}
 <p class="sb-msg" role="status" aria-live="polite">${esc(msg)}</p>${body}<section class="sb-card tl-hall"><h3>🏆 Le Hall des Conteurs</h3>${hall?`<ul>${hall}</ul>`:'<p class="sb-hint">Aucun conte encore couronné. Serez-vous le premier ?</p>'}<p class="sb-hint">Récompenses : ${WINNER_GOLD} Bubulles et le badge 🎭 Scénariste pour le gagnant, ${SELECTED_GOLD} Bubulles pour chaque scène sélectionnée.</p></section>`;
 bind(host)}
function formHtml(){if(!draft.author)draft.author=(window.HackeniaSettings?.get?.().playerName||'').slice(0,24);
 return `<form class="sb-card tl-form" novalidate><h3>Votre scène</h3>
 <label>Titre de la scène<input name="title" maxlength="80" value="${esc(draft.title)}" placeholder="Ex. : Le marchand de cailloux magiques"></label>
 <label>Votre pseudo (annoncé si vous gagnez)<input name="author" maxlength="24" value="${esc(draft.author)}"></label>
 <label>La situation de départ<textarea name="situation" maxlength="1500" rows="4" placeholder="Le groupe d’aventuriers croise sur la route…">${esc(draft.situation)}</textarea><small class="tl-count" data-count="situation">${draft.situation.length} / 1500 (40 au moins)</small></label>
 <label>Le PNJ : qui il est, ce qu’il veut, sa façon de parler (facultatif)<textarea name="npc" maxlength="800" rows="3">${esc(draft.npc)}</textarea></label>
 <fieldset class="tl-choice-set"><legend>Les choix des aventuriers et leurs conséquences (2 à 4)</legend>${draft.choices.map((x,i)=>`<div class="tl-choice"><input name="c${i}" maxlength="160" value="${esc(x.c)}" placeholder="Choix ${i+1} : ex. ${i?'Refuser le marché':'Accepter le marché'}"><input name="r${i}" maxlength="300" value="${esc(x.r)}" placeholder="Ce qui se passe alors…">${draft.choices.length>2?`<button type="button" data-tl="del" data-i="${i}" aria-label="Retirer ce choix">✕</button>`:''}</div>`).join('')}${draft.choices.length<4?'<button type="button" data-tl="add">＋ Ajouter un choix</button>':''}</fieldset>
 <label>Un rebondissement ? (facultatif)<textarea name="twist" maxlength="800" rows="2">${esc(draft.twist)}</textarea></label>
 <label class="options-check sb-rights"><input type="checkbox" name="rights" ${draft.rights?'checked':''}> Cette scène est de moi. J’autorise son utilisation et son adaptation pendant une partie de jeu de rôle et dans un podcast, sous mon pseudo.</label>
 <div class="sb-actions"><button type="button" class="portal-primary" data-tl="send" ${valid()&&!busy?'':'disabled'}>${busy?'Envoi…':'Envoyer ma scène'}</button></div></form>`}
function valid(){return draft.title.trim().length>=3&&draft.author.trim()&&draft.situation.trim().length>=40&&draft.choices.filter(x=>x.c.trim()).length>=2&&draft.rights}
function bind(host){const f=host.querySelector('.tl-form');
 if(f){f.addEventListener('input',e=>{const t=e.target,m=/^([cr])(\d)$/.exec(t.name||'');if(m)draft.choices[+m[2]][m[1]]=t.value;else if(t.name==='rights')draft.rights=t.checked;else if(t.name)draft[t.name]=t.value;
   const cnt=f.querySelector(`[data-count="${t.name}"]`);if(cnt)cnt.textContent=`${t.value.length} / 1500 (40 au moins)`;f.querySelector('[data-tl="send"]').disabled=!valid()||busy});
  f.addEventListener('change',e=>{if(e.target.name==='rights'){draft.rights=e.target.checked;f.querySelector('[data-tl="send"]').disabled=!valid()||busy}});
  f.addEventListener('click',e=>{const a=e.target.closest('[data-tl]')?.dataset.tl;if(a==='add'&&draft.choices.length<4){draft.choices.push({c:'',r:''});render(host)}else if(a==='del'){draft.choices.splice(+e.target.closest('[data-tl]').dataset.i,1);render(host)}else if(a==='send')send(host)})}
 host.querySelectorAll('[data-vote]').forEach(b=>b.onclick=()=>vote(host,b.dataset.vote))}
async function send(host){if(busy||!state?.current)return;busy=true;msg='';
 try{const {sb}=await window.HackeniaOnline.session();const row={contest_id:state.current.id,author:draft.author.trim(),title:draft.title.trim(),situation:draft.situation.trim(),npc:draft.npc.trim(),twist:draft.twist.trim(),choices:draft.choices.filter(x=>x.c.trim()).map(x=>({c:x.c.trim(),r:x.r.trim()})),rights_ok:true};
  const {error}=await sb.from('tale_entries').insert(row);if(error)throw error;draft={title:'',author:draft.author,situation:'',npc:'',choices:[{c:'',r:''},{c:'',r:''}],twist:'',rights:false};msg='✔ Scène envoyée ! Le maître du jeu la lira avant la prochaine partie.'}
 catch(err){const m=String(err?.message||err);msg=/duplicate|unique/i.test(m)?'Vous avez déjà participé à ce concours.':/row-level|policy/i.test(m)?'Ce concours est fermé.':'Envoi impossible : '+m}
 busy=false;render(host)}
async function vote(host,entry){try{const {sb,uid}=await window.HackeniaOnline.session(),{error}=await sb.from('tale_votes').upsert({contest_id:state.current.id,user_id:uid,entry_id:entry},{onConflict:'contest_id,user_id'});msg=error?'Vote impossible : '+error.message:'❤ Vote enregistré !'}catch{msg='Vote impossible pour le moment.'}render(host)}
// Récompenses : sélection (25) et victoire (300 + badge Scénariste), une seule fois chacune.
function claim(st){const portal=P();if(!portal)return;const prof=portal.profile(),sc=prof.scenarist||{claimed:[]},claimed=new Set(sc.claimed||[]);let next=null,gold=0,win=false;
 for(const e of st.mine){if((e.status==='selected'||e.status==='winner')&&!claimed.has('s:'+e.id)){claimed.add('s:'+e.id);gold+=SELECTED_GOLD}if(e.status==='winner'&&!claimed.has('w:'+e.id)){claimed.add('w:'+e.id);gold+=WINNER_GOLD;win=true}}
 if(!gold)return;next=structuredClone(prof);next.gold+=gold;next.scenarist={badge:!!(sc.badge||win),claimed:[...claimed]};
 if(portal.commit(next))window.HackeniaPortalToast?.(win?`🏆 Votre scène a gagné ! Badge 🎭 Scénariste et +${gold} Bubulles !`:`⭐ Votre scène a été sélectionnée ! +${gold} Bubulles`)}
async function checkRewards(){try{if(!navigator.onLine||!window.HackeniaOnline)return;const {sb,uid}=await window.HackeniaOnline.session(),{data,error}=await sb.from('tale_entries').select('id,status').eq('user_id',uid);if(!error)claim({mine:data||[]})}catch{}}
setTimeout(checkRewards,9000);

// ---------- Administration ----------
async function renderAdmin(host){const sb=window.HackeniaSubmit.adminClient(),{data:contests}=await sb.from('tale_contests').select('*').order('created_at',{ascending:false});
 const list=contests||[],cur=list.find(c=>c.id===renderAdmin.sel)||list[0];renderAdmin.sel=cur?.id;
 let entries=[],counts={};if(cur){const r=await sb.from('tale_entries').select('*').eq('contest_id',cur.id).order('created_at');entries=r.data||[];const v=await sb.rpc('tale_vote_counts',{p_contest:cur.id});for(const x of v.data||[])counts[x.entry_id]=x.votes}
 const soon=new Date(Date.now()+7*864e5);soon.setMinutes(soon.getMinutes()-soon.getTimezoneOffset());
 host.innerHTML=`<div class="portal-title"><div><h2>📜 Contes de la Taverne — administration</h2></div><div class="sb-actions"><button type="button" data-a="dice">🎲 Dés proposés</button></div></div>
 <form class="sb-card tl-new"><h3>Ouvrir un nouveau concours</h3><label>Titre<input name="title" maxlength="80" placeholder="Ex. : Une rencontre sur la route" required></label><label>Sujet et consignes<textarea name="theme" maxlength="600" rows="3" placeholder="Ce que vous attendez des joueurs…"></textarea></label><label>Date limite des participations<input name="deadline" type="datetime-local" value="${soon.toISOString().slice(0,16)}" required></label><button class="portal-primary">Ouvrir le concours</button></form>
 ${list.length?`<div class="sb-tabs">${list.map(c=>`<button type="button" data-contest="${c.id}" aria-pressed="${c.id===cur?.id}">${esc(c.title)} · ${({open:'ouvert',voting:'vote',closed:'terminé'})[c.status]}</button>`).join('')}</div>`:''}
 ${cur?`<section class="sb-card"><h3>${esc(cur.title)}</h3><p class="sb-hint">Date limite : ${fmtDate(cur.deadline)} · ${entries.length} participation${entries.length>1?'s':''}</p>
  <div class="sb-actions"><button type="button" data-status="open" ${cur.status==='open'?'disabled':''}>Participations ouvertes</button><button type="button" data-status="voting" ${cur.status==='voting'?'disabled':''}>Lancer le vote du public</button><button type="button" data-status="closed" ${cur.status==='closed'?'disabled':''}>Clore le concours</button></div>
  <label>Lien de l’épisode du podcast (https://…)<input name="podcast" value="${esc(cur.podcast_url)}" placeholder="https://"></label><button type="button" data-a="podcast">Enregistrer le lien</button></section>
  ${entries.map(e=>`<div class="sb-card tl-admin-entry" data-id="${e.id}">${entryHtml(e,{count:counts[e.id]??0})}<p class="tl-status ${e.status}">${STATUS[e.status][0]} ${STATUS[e.status][1]}</p><label>Message pour le joueur<textarea rows="2" maxlength="400" data-note>${esc(e.review_note)}</textarea></label><div class="sb-actions"><button type="button" data-entry="selected">⭐ Sélectionner</button><button type="button" class="portal-primary" data-entry="winner">🏆 Gagnant</button><button type="button" data-entry="rejected">✖ Non retenue</button><button type="button" data-entry="sent">Remettre en attente</button></div></div>`).join('')||'<p class="sb-hint">Aucune participation pour l’instant.</p>'}`:''}`;
 host.querySelector('[data-a="dice"]').onclick=()=>window.HackeniaSubmit.renderAdmin(host);
 host.querySelector('.tl-new').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target),{error}=await sb.from('tale_contests').insert({title:fd.get('title'),theme:fd.get('theme'),deadline:new Date(fd.get('deadline')).toISOString()});if(error)alert(error.message);renderAdmin.sel=null;renderAdmin(host)};
 host.querySelectorAll('[data-contest]').forEach(b=>b.onclick=()=>{renderAdmin.sel=b.dataset.contest;renderAdmin(host)});
 host.querySelectorAll('[data-status]').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('tale_contests').update({status:b.dataset.status}).eq('id',cur.id);if(error)alert(error.message);renderAdmin(host)});
 host.querySelector('[data-a="podcast"]')?.addEventListener('click',async()=>{const url=host.querySelector('[name="podcast"]').value.trim(),{error}=await sb.from('tale_contests').update({podcast_url:url}).eq('id',cur.id);alert(error?'Lien refusé (il doit commencer par https://).':'Lien enregistré !');renderAdmin(host)});
 host.querySelectorAll('[data-entry]').forEach(b=>b.onclick=async()=>{const card=b.closest('[data-id]'),{error}=await sb.from('tale_entries').update({status:b.dataset.entry,review_note:card.querySelector('[data-note]').value.trim()}).eq('id',card.dataset.id);if(error)alert(error.message);renderAdmin(host)})}

window.HackeniaTales={render,renderAdmin,checkRewards,MIN_LEVEL,SELECTED_GOLD,WINNER_GOLD};
})();
