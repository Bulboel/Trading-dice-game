/* Hackénia — PVP en ligne (Supabase). Contient : fonctions pures, cœur testable sans DOM, écrans du menu. */
(function(root){
'use strict';
const RARE=['Commun','Peu commun','Rare','Épique','Légendaire','Divin'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- fonctions pures ---------- */
function sanitizeDeck(deck,max){if(!Array.isArray(deck)||deck.length!==10||!deck.every(i=>Number.isInteger(i)&&i>=0&&i<max))throw new Error('Deck invalide');return deck.slice()}
function rarityCounts(ids,rarityOf){const c={};for(const i of ids){const r=rarityOf(i);c[r]=(c[r]||0)+1}return c}
function raritiesMatch(a,b,rarityOf){if(!a.length||!b.length)return false;const x=rarityCounts(a,rarityOf),y=rarityCounts(b,rarityOf);for(const k of new Set([...Object.keys(x),...Object.keys(y)]))if((x[k]||0)!==(y[k]||0))return false;return true}
function applyTrade(profile,give,get){const next=JSON.parse(JSON.stringify(profile)),inv=next.inventory;
 for(const i of give){if(!(inv[i]>0))throw new Error('Dé manquant dans ta collection');inv[i]-=1;if(inv[i]===0)delete inv[i]}
 for(const i of get)inv[i]=(inv[i]||0)+1;
 for(const d of next.decks){const used={};d.dice=d.dice.filter(i=>{used[i]=(used[i]||0)+1;return used[i]<=(inv[i]||0)})}
 return next}

/* ---------- cœur (aucun accès au DOM) ---------- */
function createCore(o){
 const sb=o.sb,game=o.game,cfg=o.cfg||{},pollMs=o.pollMs||cfg.pollMs||2500,monsters=o.maxDice||(game&&game.monsters?game.monsters.length:43);
 const S={user:null,gameId:null,code:'',seat:null,players:[],gameRow:null,applied:0,queue:[],started:false,ended:false,endSent:false,opponent:'',error:'',status:'idle',terrain:'',versionOK:true};
 const T={id:null,code:'',role:null,row:null,done:false};
 const subs=new Set(),tsubs=new Set();
 const emit=()=>subs.forEach(f=>{try{f(S)}catch(e){}}),emitT=()=>tsubs.forEach(f=>{try{f(T)}catch(e){}});
 let timer=null,chan=null,chanT=null,timerT=null,pumping=false,q=Promise.resolve();

 async function rpc(name,args){const r=await sb.rpc(name,args);if(r.error)throw new Error(r.error.message||String(r.error));return r.data}
 async function ensureAuth(){const s=await sb.auth.getSession();const cur=s&&s.data&&s.data.session;if(cur){S.user=cur.user;return S.user}
  const r=await sb.auth.signInAnonymously();if(r.error)throw new Error(r.error.message);S.user=r.data.user||(r.data.session&&r.data.session.user);return S.user}
 const first=x=>Array.isArray(x)?x[0]:x;

 /* parties */
 async function createGame(p){await ensureAuth();reset();const r=first(await rpc('create_game',{p_name:p.name,p_deck:p.deck,p_terrain:p.terrain}));S.gameId=r.game_id;S.code=r.game_code;S.seat=0;S.status='waiting';S.terrain=p.terrain;watch();emit();return r}
 async function joinGame(p){await ensureAuth();reset();S.gameId=await rpc('join_game',{p_code:p.code,p_name:p.name,p_deck:p.deck});S.status='joining';watch();await refreshGame();emit();return S.gameId}
 function reset(){stopWatch();Object.assign(S,{gameId:null,code:'',seat:null,players:[],gameRow:null,applied:0,queue:[],started:false,ended:false,endSent:false,opponent:'',error:'',status:'idle',versionOK:true})}
 function watch(){stopWatch();const id=S.gameId;
  try{chan=sb.channel('hk-game-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'game_events',filter:'game_id=eq.'+id},p=>ingest([p.new])).on('postgres_changes',{event:'*',schema:'public',table:'game_players',filter:'game_id=eq.'+id},()=>refreshGame().catch(()=>{})).on('postgres_changes',{event:'UPDATE',schema:'public',table:'games',filter:'id=eq.'+id},()=>refreshGame().catch(()=>{})).subscribe()}catch(e){chan=null}
  timer=setInterval(tick,pollMs)}
 function stopWatch(){if(timer)clearInterval(timer);timer=null;try{chan&&chan.unsubscribe&&chan.unsubscribe()}catch(e){}chan=null}
 async function tick(){try{if(!S.started)await refreshGame();else{await fetchEvents();await refreshGame();checkEnd()}}catch(e){S.error=e.message;emit()}}
 async function refreshGame(){const g=await sb.from('games').select('*').eq('id',S.gameId).single();if(g.error)throw new Error(g.error.message);
  const p=await sb.from('game_players').select('*').eq('game_id',S.gameId);S.gameRow=g.data;S.players=p.data||[];
  const me=S.players.find(x=>x.user_id===S.user.id),op=S.players.find(x=>x.user_id!==S.user.id);if(me)S.seat=me.seat;S.opponent=op?op.name||'Adversaire':'';
  if(!S.started&&S.gameRow.status==='playing'&&S.players.length===2)startMatch();
  if(S.started&&!S.ended&&S.gameRow.status==='finished'){await fetchEvents();if(S.applied>=Number(S.gameRow.last_seq||0))finishFromServer()}emit()}
 function startMatch(){try{const by=[0,1].map(s=>S.players.find(p=>p.seat===s)),decks=by.map(p=>sanitizeDeck(p.deck,monsters));
   const run=()=>game.startOnline({seat:S.seat,decks,terrain:S.gameRow.terrain,seed:Number(S.gameRow.seed),send:fn=>send(fn),onError:e=>{S.error=e&&e.message||String(e);emit()}});
   S.started=true;S.status='playing';S.terrain=S.gameRow.terrain;(o.enter||(f=>f()))(run);
   send(rpc=>rpc('play_action',{p_kind:'hello',p_payload:{version:cfg.version||''}})).catch(()=>{});fetchEvents().catch(()=>{});emit()}
  catch(e){S.error=e.message;S.status='error';emit()}}
 function send(fn){const p=q.then(()=>fn((name,args)=>rpc(name,Object.assign({p_game:S.gameId},args))));q=p.catch(()=>{});return p}
 async function fetchEvents(){const r=await sb.from('game_events').select('*').eq('game_id',S.gameId).gt('seq',S.applied).order('seq',{ascending:true});if(r.error)throw new Error(r.error.message);ingest(r.data||[])}
 function ingest(rows){for(const ev of rows){if(ev.seq>S.applied&&!S.queue.some(x=>x.seq===ev.seq))S.queue.push(ev)}S.queue.sort((a,b)=>a.seq-b.seq);pump()}
 async function waitIdle(ev){const t0=Date.now();for(;;){const st=game.onlineState();if(st.over)return false;if(!st.busy&&st.mode==='i'&&st.cur===ev.seat)return true;if(Date.now()-t0>(o.idleTimeout||45000))return false;await sleep(o.idleStep||80)}}
 async function pump(){if(pumping)return;pumping=true;try{
   while(S.queue.length){const ev=S.queue[0];
    if(ev.seq<=S.applied){S.queue.shift();continue}
    if(ev.seq!==S.applied+1){await fetchEvents();if(S.queue[0]&&S.queue[0].seq!==S.applied+1)break;continue}
    if(ev.kind==='hello'&&ev.payload?.result==='draw'){game.endOnline(null,'Match nul : les deux camps ont vaincu quatre créatures.');S.ended=true;S.status='draw'}
    if(ev.seat!==S.seat){
     if(ev.kind==='roll')game.pushRoll((ev.payload.values||[]).map(Number));
     else if(ev.kind==='hello'){if(String(ev.payload.version||'')!==String(cfg.version||'')){S.versionOK=false;S.error='Ton adversaire n’a pas la même version du jeu : recharge la page des deux côtés.'}}
     else if(ev.kind==='resign'){game.endOnline(S.seat,'L’adversaire abandonne : victoire !');S.ended=true}
     else if(ev.kind==='place'||ev.kind==='move'){const ok=await waitIdle(ev);if(!ok&&!game.onlineState().over){S.error='Désynchronisation : impossible de rejouer l’action de l’adversaire.';S.status='desync';emit();break}
       if(ok&&!game.applyRemote(ev)){S.error='Désynchronisation : action de l’adversaire refusée par le moteur.';S.status='desync';emit();break}}
    }
    S.applied=ev.seq;S.queue.shift();emit()}
  }finally{pumping=false}}
 function checkEnd(){const st=game.onlineState();if(!st.over||S.endSent)return;S.endSent=true;S.ended=true;
  if(st.result?.outcome==='draw'||st.kills.every(n=>n>=st.kw)){S.status='draw';if(S.seat===0)send(rpc=>rpc('finish_draw',{})).catch(e=>{S.error='Match nul reconnu. Enregistrement serveur indisponible : '+e.message;emit()});emit();return}
  const w=st.result?.winner??[0,1].find(s=>st.scores[s]>=st.win||st.kills[s]>=st.kw);if(w===S.seat)send(rpc=>rpc('play_action',{p_kind:'win',p_payload:{}})).catch(()=>{});emit()}
 function finishFromServer(){S.ended=true;const w=S.gameRow.winner;if(w===null){S.status='draw';game.endOnline(null,'Match nul : les deux camps ont vaincu quatre créatures.')}else if(w===S.seat)game.endOnline(S.seat,'L’adversaire a quitté la partie : victoire !');else if(w!==null&&w!==undefined&&!game.onlineState().over)game.endOnline(w,'Défaite par abandon.');emit()}
 async function resign(){if(!S.gameId||S.ended)return;S.ended=true;try{await send(rpc=>rpc('play_action',{p_kind:'resign',p_payload:{}}))}catch(e){}game.endOnline(1-S.seat,'Tu as abandonné la partie.');emit()}
 function leave(){stopWatch();const was=S.started;reset();try{was&&game.leaveOnline()}catch(e){}emit()}

 /* échanges */
 async function tradeCreate(p){await ensureAuth();tradeReset();const r=first(await rpc('create_trade',{p_name:p.name,p_inventory:p.inventory}));T.id=r.trade_id;T.code=r.trade_code;T.role='host';await tradeRefresh();tradeWatch();return r}
 async function tradeJoin(p){await ensureAuth();tradeReset();T.id=await rpc('join_trade',{p_code:p.code,p_name:p.name,p_inventory:p.inventory});await tradeRefresh();tradeWatch();return T.id}
 function tradeReset(){if(timerT)clearInterval(timerT);timerT=null;try{chanT&&chanT.unsubscribe&&chanT.unsubscribe()}catch(e){}chanT=null;Object.assign(T,{id:null,code:'',role:null,row:null,done:false})}
 function tradeWatch(){try{chanT=sb.channel('hk-trade-'+T.id).on('postgres_changes',{event:'UPDATE',schema:'public',table:'trades',filter:'id=eq.'+T.id},()=>tradeRefresh().catch(()=>{})).subscribe()}catch(e){chanT=null}
  timerT=setInterval(()=>tradeRefresh().catch(()=>{}),pollMs)}
 async function tradeRefresh(){const r=await sb.from('trades').select('*').eq('id',T.id).single();if(r.error)throw new Error(r.error.message);T.row=r.data;T.code=r.data.code;T.role=r.data.host_id===S.user.id?'host':'guest';emitT()}
 async function setOffer(ids){await rpc('set_offer',{p_trade:T.id,p_offer:ids});await tradeRefresh()}
 async function confirm(flag){const st=await rpc('confirm_trade',{p_trade:T.id,p_confirm:!!flag});await tradeRefresh();return st}
 async function tradeCancel(){await rpc('cancel_trade',{p_trade:T.id});await tradeRefresh()}
 const mySide=()=>T.role==='host'?'host':'guest',otherSide=()=>T.role==='host'?'guest':'host';

 return{S,T,rpc,ensureAuth,createGame,joinGame,resign,leave,stop:stopWatch,onChange:f=>{subs.add(f);return()=>subs.delete(f)},onTrade:f=>{tsubs.add(f);return()=>tsubs.delete(f)},
  tradeCreate,tradeJoin,setOffer,confirm,tradeCancel,tradeStop:tradeReset,mySide,otherSide,_pump:pump,_tick:tick}
}

/* ---------- écrans du menu (navigateur uniquement) ---------- */
let core=null,U={view:'home',err:'',busy:false,name:'',deck:'',terrain:'terre',code:'',tcode:'',offer:[]},host=null,bridge=null,hud=null;
const TERRAINS=[['terre','🌲','Le Bois tendre'],['feu','🌋','Les Terres embrasées'],['glace','🏔️','La Route vers Forfalla'],['vent','🍃','Les vents de Hacko'],['eau','🌊','Le lac rose'],['foudre','⚡','Île céleste'],['ville','🏰','La ville de Dassom'],['grotte','🕯️','La grotte souterraine']];
const LIB=['assets/vendor/supabase/supabase.js'];  // dernière version 2.x (compatible avec les clés « publishable ») ; à figer après le premier essai réussi
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('script inaccessible'));document.head.append(s)})}
async function ensureCore(){if(core)return core;const c=root.HACKENIA_PVP_CONFIG;if(!c||!c.url||!c.key)throw new Error('Configuration du mode en ligne manquante.');
 if(!root.supabase){let ok=false;for(const u of LIB){try{await loadScript(u);ok=!!root.supabase;if(ok)break}catch(e){}}if(!ok)throw new Error('Connexion au service en ligne impossible : vérifie ta connexion internet.')}
 const sb=root.__hackeniaSupabase||(root.__hackeniaSupabase=root.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true}}));// v204 : client partagé avec la sauvegarde en ligne
 core=createCore({sb,game:root.hackeniaGame,cfg:c,enter:f=>bridge.enterMatch(f)});core.onChange(updateHud);setInterval(updateHud,1000);core.onTrade(()=>{if(U.view==='trade')draw()});core.onChange(()=>{if(U.view==='wait')draw()});return core}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function myName(){if(!U.name){try{U.name=localStorage.getItem('hackenia-pvp-name')||''}catch(e){}if(!U.name)U.name='Joueur'+String(Math.floor(100+Math.random()*900))}return U.name}
function saveName(v){U.name=(v||'').trim().slice(0,24)||U.name;try{localStorage.setItem('hackenia-pvp-name',U.name)}catch(e){}}
function legalDecks(){const p=bridge.getProfile();return p.decks.filter(d=>bridge.legal(d.dice))}
function draw(){if(!host)return;const f=U.view==='wait'?waitView:U.view==='trade'?tradeView:homeView;host.innerHTML=f()}
function homeView(){const decks=legalDecks();if(!U.deck||!decks.some(d=>d.id===U.deck))U.deck=decks[0]?decks[0].id:'';
 const dOpts=decks.map(d=>'<option value="'+esc(d.id)+'"'+(U.deck===d.id?' selected':'')+'>'+esc(d.name)+' · 10 dés</option>').join(''),tOpts=TERRAINS.map(t=>'<option value="'+t[0]+'"'+(U.terrain===t[0]?' selected':'')+'>'+t[1]+' '+t[2]+'</option>').join('');
 return '<div class="portal-title"><div><h2>PVP en ligne</h2></div><span class="portal-muted">Duel contre un autre joueur</span></div>'+
 '<p class="portal-muted">Aucune récompense en Bubulles pour l’instant. Les dés sont lancés par le serveur : personne ne peut les truquer.</p>'+
 (U.err?'<p class="pvp-error" role="alert">'+esc(U.err)+'</p>':'')+
 '<section class="pvp-card"><label for="pvp-name">Ton pseudo</label><input id="pvp-name" maxlength="24" value="'+esc(myName())+'"></section>'+
 '<section class="pvp-card"><h3>⚔️ Duel</h3>'+(decks.length?'<label for="pvp-deck">Ton deck</label><select id="pvp-deck">'+dOpts+'</select><label for="pvp-terrain">Terrain (choisi par celui qui crée la partie)</label><select id="pvp-terrain">'+tOpts+'</select><div class="deck-actions"><button class="portal-primary" data-pvp="create"'+(U.busy?' disabled':'')+'>Créer une partie</button></div><label for="pvp-code">Rejoindre avec un code</label><div class="pvp-row"><input id="pvp-code" maxlength="6" autocapitalize="characters" placeholder="ABC123" value="'+esc(U.code)+'"><button data-pvp="join"'+(U.busy?' disabled':'')+'>Rejoindre</button></div>':'<p class="pvp-error">Tu n’as aucun deck complet de 10 dés. Crée-en un dans « Mes decks ».</p>')+'</section>'+
 '<section class="pvp-card"><h3>🔁 Échanges de dés</h3><p class="portal-muted">Échange uniquement (pas de don), contre des dés de même rareté. Les deux joueurs doivent confirmer.</p><div class="deck-actions"><button data-pvp="trade-create"'+(U.busy?' disabled':'')+'>Créer une salle d’échange</button></div><label for="pvp-tcode">Rejoindre avec un code</label><div class="pvp-row"><input id="pvp-tcode" maxlength="6" autocapitalize="characters" placeholder="XYZ789" value="'+esc(U.tcode)+'"><button data-pvp="trade-join"'+(U.busy?' disabled':'')+'>Rejoindre</button></div></section>'}
function waitView(){const S=core.S;return '<div class="portal-title"><div><h2>En attente d’un adversaire</h2></div></div><section class="pvp-card pvp-wait"><p>Donne ce code à ton adversaire :</p><div class="pvp-code" aria-live="polite">'+esc(S.code)+'</div><div class="deck-actions"><button data-pvp="copy">Copier le code</button><button data-pvp="cancel-wait">Annuler</button></div>'+(S.error?'<p class="pvp-error">'+esc(S.error)+'</p>':'')+'<p class="portal-muted">La partie démarre automatiquement quand il te rejoint. Garde cette page ouverte.</p></section>'}
function tradeView(){const T=core.T,row=T.row,p=bridge.getProfile(),rar=i=>bridge.rarity(bridge.defs[i]);
 if(!row)return '<p>Connexion à l’échange…</p>';
 const me=core.mySide(),ot=core.otherSide(),mine=row[me+'_offer']||[],theirs=row[ot+'_offer']||[],okMe=row[me+'_ok'],okOt=row[ot+'_ok'],opp=row[ot+'_name']||'En attente…',match=raritiesMatch(mine,theirs,rar),done=row.status==='done',cancelled=row.status==='cancelled';
 const list=(ids,rm)=>ids.length?ids.map((id,k)=>'<li><span class="pvp-chip r'+rar(id)+'">'+RARE[rar(id)-1]+'</span> '+esc(bridge.defs[id].cn||bridge.defs[id].n)+(rm?' <button class="pvp-x" data-pvp="rm" data-k="'+k+'" aria-label="Retirer">✕</button>':'')+'</li>').join(''):'<li class="portal-muted">Aucun dé proposé</li>';
 const counts={};mine.forEach(i=>counts[i]=(counts[i]||0)+1);
 const owned=Object.keys(p.inventory).map(Number).filter(i=>(p.inventory[i]-(counts[i]||0))>0&&bridge.defs[i]).sort((a,b)=>rar(a)-rar(b)||a-b);
 const cards=owned.map(i=>'<button class="pvp-die r'+rar(i)+'" data-pvp="add" data-id="'+i+'"'+(mine.length>=5||done||cancelled?' disabled':'')+'><b>'+esc(bridge.defs[i].cn||bridge.defs[i].n)+'</b><small>'+RARE[rar(i)-1]+' · ×'+(p.inventory[i]-(counts[i]||0))+'</small></button>').join('');
 let state=done?'<p class="pvp-ok">✅ Échange réalisé ! Ta collection est à jour.</p>':cancelled?'<p class="pvp-error">Échange annulé.</p>':!row.guest_id?'<p class="portal-muted">En attente du deuxième joueur. Code : <b class="pvp-code-inline">'+esc(T.code)+'</b></p>':(mine.length&&theirs.length?(match?'<p class="pvp-ok">Raretés équivalentes ✔</p>':'<p class="pvp-error">Il faut le même nombre de dés de chaque rareté des deux côtés.</p>'):'<p class="portal-muted">Chacun propose 1 à 5 dés de rareté équivalente.</p>');
 return '<div class="portal-title"><div><h2>Échange de dés</h2></div><span class="portal-muted">Code '+esc(T.code)+'</span></div>'+(U.err?'<p class="pvp-error" role="alert">'+esc(U.err)+'</p>':'')+state+
 '<div class="pvp-cols"><section class="pvp-card"><h3>Ton offre'+(okMe?' ✔':'')+'</h3><ul class="pvp-list">'+list(mine,!done&&!cancelled)+'</ul></section><section class="pvp-card"><h3>'+esc(opp)+(okOt?' ✔':'')+'</h3><ul class="pvp-list">'+list(theirs,false)+'</ul></section></div>'+
 (done||cancelled?'<div class="deck-actions"><button class="portal-primary" data-pvp="trade-home">Retour</button></div>':'<div class="deck-actions"><button class="portal-primary" data-pvp="confirm"'+(!(row.guest_id&&match&&mine.length)?' disabled':'')+'>'+(okMe?'Retirer ma confirmation':'Je confirme l’échange')+'</button><button data-pvp="trade-cancel">Annuler l’échange</button></div><h3>Mes dés</h3><div class="pvp-dice">'+(cards||'<p class="portal-muted">Aucun dé disponible.</p>')+'</div>')}
async function maybeApplyTrade(){const T=core.T,row=T.row;if(!row||row.status!=='done'||T.done)return;T.done=true;
 try{const me=core.mySide(),ot=core.otherSide(),next=applyTrade(bridge.getProfile(),row[me+'_offer'],row[ot+'_offer']);if(bridge.commit(next))bridge.toast('Échange réussi ✅')}catch(e){U.err='Échange réalisé sur le serveur, mais ta collection locale n’a pas pu être mise à jour : '+e.message}}
async function act(a,el){U.err='';
 try{
  if(a==='create'||a==='join'){const deck=bridge.getProfile().decks.find(d=>d.id===U.deck);if(!deck||!bridge.legal(deck.dice))throw new Error('Choisis un deck complet.');
   U.busy=true;draw();const c=await ensureCore();
   if(a==='create'){await c.createGame({name:myName(),deck:deck.dice,terrain:U.terrain});U.view='wait'}
   else{const code=U.code.trim().toUpperCase();if(code.length!==6)throw new Error('Le code contient 6 caractères.');await c.joinGame({code,name:myName(),deck:deck.dice});U.view='wait'}}
  else if(a==='cancel-wait'){core&&core.leave();U.view='home'}
  else if(a==='copy'){try{await navigator.clipboard.writeText(core.S.code);bridge.toast('Code copié')}catch(e){bridge.toast('Code : '+core.S.code)}}
  else if(a==='trade-create'||a==='trade-join'){U.busy=true;draw();const c=await ensureCore(),inv=bridge.getProfile().inventory;
   if(a==='trade-create')await c.tradeCreate({name:myName(),inventory:inv});else{const code=U.tcode.trim().toUpperCase();if(code.length!==6)throw new Error('Le code contient 6 caractères.');await c.tradeJoin({code,name:myName(),inventory:inv})}
   U.view='trade'}
  else if(a==='trade-home'||a==='trade-cancel'){if(a==='trade-cancel')await core.tradeCancel().catch(()=>{});core.tradeStop();U.view='home'}
  else if(a==='add'){const id=Number(el.dataset.id),T=core.T,mine=(T.row[core.mySide()+'_offer']||[]).concat([id]);await core.setOffer(mine)}
  else if(a==='rm'){const T=core.T,mine=(T.row[core.mySide()+'_offer']||[]).filter((_,k)=>k!==Number(el.dataset.k));await core.setOffer(mine)}
  else if(a==='confirm'){const T=core.T,flag=!T.row[core.mySide()+'_ok'];await core.confirm(flag);await maybeApplyTrade()}
 }catch(e){U.err=e.message||String(e)}
 U.busy=false;draw()}
function mount(container,b){bridge=b;host=container;U.view=core&&core.T.id&&core.T.row&&core.T.row.status==='open'?'trade':core&&core.S.gameId&&!core.S.started&&core.S.status==='waiting'?'wait':'home';
 if(!container.__pvp){container.__pvp=true;
  container.addEventListener('click',e=>{const el=e.target.closest('[data-pvp]');if(el)act(el.dataset.pvp,el)});
  container.addEventListener('input',e=>{if(e.target.id==='pvp-code'){U.code=e.target.value.toUpperCase()}else if(e.target.id==='pvp-tcode'){U.tcode=e.target.value.toUpperCase()}else if(e.target.id==='pvp-name'){saveName(e.target.value)}});
  container.addEventListener('change',e=>{if(e.target.id==='pvp-deck')U.deck=e.target.value;if(e.target.id==='pvp-terrain')U.terrain=e.target.value})}
 draw();ensureCore().then(()=>{if(core.T.row)maybeApplyTrade()}).catch(()=>{})}
/* barre d'état pendant un duel en ligne */
function updateHud(){if(typeof document==='undefined')return;if(!hud){hud=document.createElement('div');hud.id='pvp-hud';hud.hidden=true;document.body.append(hud);
  hud.addEventListener('click',e=>{const a=e.target.closest('[data-hud]');if(!a)return;if(a.dataset.hud==='resign'){if(confirm('Abandonner la partie ? Ton adversaire sera déclaré vainqueur.'))core.resign()}else if(a.dataset.hud==='quit'){core.leave();hud.hidden=true;bridge.toMenu()}})}
 const S=core.S,on=S.started&&root.hackeniaGame&&root.hackeniaGame.isOnline&&root.hackeniaGame.isOnline();hud.hidden=!on||document.body.classList.contains('portal-open');if(hud.hidden)return;
 const camp=S.seat===0?'🟢 Vert':'🟠 Orange';
 hud.innerHTML='<span>🌐 '+(S.status==='draw'?'Match nul':'En ligne')+' · contre <b>'+esc(S.opponent||'…')+'</b> · tu es '+camp+'</span>'+(S.error?'<span class="pvp-hud-err">'+esc(S.error)+'</span>':'')+(S.ended||S.status==='desync'?'<button data-hud="quit">Quitter</button>':'<button data-hud="resign">Abandonner</button>')}
root.HackeniaPVP={mount,updateHud,createCore,sanitizeDeck,raritiesMatch,rarityCounts,applyTrade};
if(typeof module!=='undefined'&&module.exports)module.exports={createCore,sanitizeDeck,raritiesMatch,rarityCounts,applyTrade};
})(typeof window!=='undefined'?window:globalThis);
