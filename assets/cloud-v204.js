/* v204 — Sauvegarde en ligne automatique (compte anonyme Supabase, aucun email) et code de récupération.
   La progression locale reste la référence : elle est envoyée quelques secondes après chaque changement,
   hors ligne elle attend le retour du réseau. Rien n'est jamais écrasé sans demander au joueur.
   SQL côté Supabase : online/sql/02-cloud-save.sql */
(function(root){'use strict';
const META='hackenia-cloud-v1',DEBOUNCE=4000,RETRY=60000;

function summaryOf(p){const inv=p?.inventory||{};return{gold:p?.gold|0,dice:Object.values(inv).reduce((a,n)=>a+(n|0),0),kinds:Object.values(inv).filter(n=>n>0).length,decks:(p?.decks||[]).length,story:Object.keys(p?.story?.done||{}).length,...(p?.xp?{level:(typeof window!=='undefined'&&window.HackeniaProgress||globalThis.HackeniaProgress)?.levelOf?.(p.xp)?.level||1}:{})}}
const missingTable=e=>/PGRST20[25]|42P01|42883|could not find|does not exist/i.test(String(e?.code||'')+' '+String(e?.message||''));
const denied=e=>/42501|permission denied/i.test(String(e?.code||'')+' '+String(e?.message||''));

function createCloud({getClient,portal,store=root.localStorage,schedule=(f,ms)=>setTimeout(f,ms),cancel=clearTimeout,now=()=>Date.now()}){
 const S={status:'off',uid:null,lastSync:0,conflict:null,error:'',code:null,dirty:false},subs=new Set();let sb=null,timer=0,started=null;
 const readMeta=()=>{try{return JSON.parse(store.getItem(META)||'{}')||{}}catch{return{}}};
 const writeMeta=m=>{try{store.setItem(META,JSON.stringify({...readMeta(),...m}))}catch{}};
 const set=patch=>{Object.assign(S,patch);subs.forEach(f=>{try{f(S)}catch{}})};
 async function session(){sb=sb||await getClient();const g=await sb.auth.getSession();let user=g?.data?.session?.user;if(!user){const r=await sb.auth.signInAnonymously();if(r.error)throw r.error;user=r.data.user||r.data.session?.user}S.uid=user.id;const m=readMeta();if(m.uid===S.uid&&m.code)S.code=m.code;return user}
 async function pull(){const r=await sb.from('player_saves').select('data,summary,rev,updated_at').eq('user_id',S.uid).maybeSingle();if(r.error)throw r.error;return r.data}
 async function push(){if(S.conflict)return false;const p=portal.profile();if(!p)return false;const m=readMeta(),rev=(m.uid===S.uid?m.rev|0:0)+1;
  const r=await sb.from('player_saves').upsert({user_id:S.uid,data:p,summary:summaryOf(p),rev,updated_at:new Date(now()).toISOString()}).select('rev').single();if(r.error)throw r.error;
  writeMeta({uid:S.uid,rev:r.data?.rev??rev,at:now()});set({status:'synced',lastSync:now(),dirty:false,error:''});return true}
 function fail(e){const detail=[e?.code,e?.message].filter(Boolean).join(' · ')||String(e);try{console.info('Sauvegarde en ligne :',detail)}catch{}if(denied(e))set({status:'denied',error:detail});else if(missingTable(e))set({status:'unavailable',error:detail});else set({status:'offline',error:detail});retry()}
 function retry(){cancel(timer);timer=schedule(()=>{timer=0;if(!['unavailable','denied'].includes(S.status))sync()},RETRY)}
 async function sync(){try{if(!S.uid)await session();if(S.conflict)return;await push()}catch(e){fail(e)}}
 function changed(){if(!started||['unavailable','denied'].includes(S.status))return;set({dirty:true,status:S.status==='synced'?'pending':S.status});cancel(timer);timer=schedule(()=>{timer=0;sync()},DEBOUNCE)}
 async function start(){if(started)return started;set({status:'connecting'});started=(async()=>{try{await session();const remote=await pull(),m=readMeta();
   if(!remote){await push();return}
   const known=m.uid===S.uid&&(m.rev|0)>=(remote.rev|0);
   if(known){await push();return}
   // Une sauvegarde en ligne existe mais cet appareil ne l'a pas encore vue : on demande avant de remplacer quoi que ce soit.
   const local=summaryOf(portal.profile());if(JSON.stringify(local)===JSON.stringify(remote.summary||summaryOf(remote.data))){writeMeta({uid:S.uid,rev:remote.rev});await push();return}
   set({status:'conflict',conflict:{remote,local}})}catch(e){fail(e)}})();return started}
 async function retryNow(){started=null;set({status:'off',error:''});return start()}
 async function resolve(keep){const c=S.conflict;if(!c)return;if(keep==='remote'){if(!portal.restore(c.remote.data))throw new Error('Sauvegarde en ligne illisible');writeMeta({uid:S.uid,rev:c.remote.rev});set({conflict:null,status:'synced',lastSync:now()})}else{writeMeta({uid:S.uid,rev:c.remote.rev});set({conflict:null});await sync()}}
 async function createCode(){await session();if(S.conflict)throw new Error('Choisissez d’abord quelle progression garder.');await push();const r=await sb.rpc('create_recovery_code');if(r.error)throw r.error;writeMeta({uid:S.uid,code:r.data});set({code:r.data});return r.data}
 async function peek(code){await session();const r=await sb.rpc('peek_recovery_code',{p_code:code});if(r.error)throw r.error;return r.data}
 async function claim(code){await session();const r=await sb.rpc('claim_recovery_code',{p_code:code});if(r.error)throw r.error;if(!r.data)return false;if(!portal.restore(r.data.data))throw new Error('Sauvegarde illisible');
  const remote=await pull();writeMeta({uid:S.uid,rev:remote?.rev|0,code:code.toUpperCase().trim()});set({conflict:null,status:'synced',lastSync:now(),code:code.toUpperCase().trim()});return true}
 return{state:S,start,retryNow,sync,changed,resolve,createCode,peek,claim,onChange:f=>{subs.add(f);return()=>subs.delete(f)},summaryOf}
}

/* ---------- navigateur ---------- */
if(typeof module!=='undefined')module.exports={createCloud,summaryOf};
if(!root.document)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
async function getClient(){if(root.__hackeniaSupabase)return root.__hackeniaSupabase;const c=root.HACKENIA_PVP_CONFIG;if(!c?.url||!c?.key)throw new Error('Configuration en ligne absente');
 if(!root.supabase)await new Promise((res,rej)=>{const s=document.createElement('script');s.src=LIB;s.onload=res;s.onerror=()=>rej(new Error('Service en ligne inaccessible'));document.head.append(s)});
 return root.__hackeniaSupabase=root.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true}})}
const cloud=createCloud({getClient,portal:{profile:()=>root.HackeniaPortal?.profile(),restore:p=>root.HackeniaPortal?.restore(p)}});
root.HackeniaCloud=cloud;
root.addEventListener('hackenia-profile-saved',()=>cloud.changed());
root.addEventListener('online',()=>{if(cloud.state.status==='offline')cloud.sync()});
// Démarrage discret, une fois le jeu affiché.
const boot=()=>{if(root.HackeniaPortal)cloud.start();else setTimeout(boot,1500)};setTimeout(boot,2500);

const ago=t=>{if(!t)return'';const s=Math.round((Date.now()-t)/1000);return s<60?'à l’instant':s<3600?'il y a '+Math.round(s/60)+' min':'il y a '+Math.round(s/3600)+' h'};
const line=s=>`${s.level?'Niveau '+s.level+' · ':''}${s.gold} Bubulles · ${s.dice} dés (${s.kinds} différents) · ${s.decks} deck${s.decks>1?'s':''}${s.story?' · '+s.story+' parties d’histoire':''}`;
function statusText(S){return({off:'Démarrage…',connecting:'Connexion au service en ligne…',synced:'☁️ Progression sauvegardée en ligne '+ago(S.lastSync)+'.',pending:'☁️ Sauvegarde en cours…',offline:'📴 Hors ligne : la progression sera envoyée dès le retour du réseau.',unavailable:'La sauvegarde en ligne n’est pas encore activée sur le serveur.',denied:'Le serveur refuse l’accès à la sauvegarde : il manque les droits d’accès à la table (voir online/sql/02-cloud-save.sql).',conflict:'⚠️ Une autre progression existe en ligne : choisissez laquelle garder.'})[S.status]||''}
let panel=null,msg='',busy=false,shown=null;
function render(){if(!panel||!panel.isConnected)return;const S=cloud.state,c=S.conflict;
 panel.innerHTML=`<fieldset><legend>Sauvegarde en ligne</legend><p class="cloud-status cloud-${S.status}" role="status">${esc(statusText(S))}</p><p class="opt-hint">Automatique et sans compte : aucun email, aucun mot de passe. Nous ne stockons que votre progression de jeu.</p>${['unavailable','denied','offline'].includes(S.status)?`<div class="deck-actions"><button type="button" data-cloud="retry" ${busy?'disabled':''}>Réessayer</button></div>${S.error?`<p class="opt-hint cloud-detail">Détail : ${esc(S.error)}</p>`:''}`:''}
 ${c?`<div class="cloud-conflict"><div><strong>Sur cet appareil</strong><small>${esc(line(c.local))}</small><button type="button" data-cloud="keep-local">Garder celle-ci</button></div><div><strong>En ligne</strong><small>${esc(line(c.remote.summary||cloud.summaryOf(c.remote.data)))}</small><button type="button" class="portal-primary" data-cloud="keep-remote">Reprendre celle-ci</button></div></div>`:''}</fieldset>
 <fieldset><legend>Code de récupération</legend><p class="opt-hint">Notez ce code ou prenez-le en photo : il permet de retrouver votre progression sur un autre téléphone ou après une réinstallation. Ne le partagez pas.</p>
 ${shown||S.code?`<p class="cloud-code" aria-label="Votre code de récupération">${esc(shown||S.code)}</p><div class="deck-actions"><button type="button" data-cloud="copy">Copier le code</button><button type="button" data-cloud="new-code" ${busy?'disabled':''}>Générer un nouveau code</button></div><p class="opt-hint">Un nouveau code remplace l’ancien, qui ne fonctionnera plus.</p>`:`<button type="button" class="portal-primary" data-cloud="new-code" ${busy||['unavailable','denied','conflict'].includes(S.status)?'disabled':''}>Créer mon code de récupération</button>`}</fieldset>
 <fieldset><legend>Récupérer une progression</legend><p class="opt-hint">Vous avez un code ? La progression liée remplacera celle de cet appareil (une confirmation vous sera demandée).</p><div class="cloud-restore"><input id="cloud-code-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="HACK-XXXX-XXXX-XXXX" maxlength="24" aria-label="Code de récupération"><button type="button" data-cloud="restore" ${busy||['unavailable','denied'].includes(S.status)?'disabled':''}>Récupérer</button></div></fieldset>
 ${msg?`<p class="cloud-msg" role="alert">${esc(msg)}</p>`:''}`}
async function act(fn){busy=true;msg='';render();try{await fn()}catch(e){msg=/tentatives/i.test(e?.message)?e.message:'Opération impossible pour le moment : vérifiez votre connexion et réessayez.'}busy=false;render()}
function mount(el){panel=el;render();if(cloud.state.status==='off')cloud.start();
 el.onclick=e=>{const a=e.target.closest('[data-cloud]')?.dataset.cloud;if(!a)return;
  if(a==='new-code')act(async()=>{shown=await cloud.createCode();msg='Code créé. Gardez-le précieusement.'});
  else if(a==='copy'){navigator.clipboard?.writeText(shown||cloud.state.code).then(()=>{msg='Code copié.';render()},()=>{})}
  else if(a==='keep-remote')act(async()=>{await cloud.resolve('remote');msg='Progression en ligne reprise.'});
  else if(a==='restore')el.__restore?.();
  else if(a==='retry')act(async()=>{await cloud.retryNow();msg=cloud.state.status==='synced'?'Sauvegarde en ligne activée !':''});
  else if(a==='keep-local')act(async()=>{await cloud.resolve('local');msg='Progression de cet appareil gardée et envoyée en ligne.'})};
 const restore=()=>{const code=el.querySelector('#cloud-code-input')?.value.trim();if(!code)return;act(async()=>{const info=await cloud.peek(code);if(!info){msg='Code inconnu. Vérifiez les caractères (sans 0, O, 1 ni I).';return}if(info.same){msg='Ce code correspond déjà à la progression de cet appareil.';return}
  if(!confirm('Remplacer la progression de cet appareil par celle-ci ?\n\n'+line(info.summary)+'\n\nLa progression actuelle de cet appareil sera perdue.'))return;if(await cloud.claim(code)){shown=null;msg='Progression récupérée ! Bon retour à Hackénia.';root.HackeniaPortal?.toast('Progression récupérée !')}else msg='Code inconnu.'})};
 el.addEventListener('keydown',e=>{if(e.target.id==='cloud-code-input'&&e.key==='Enter'){e.preventDefault();restore()}});el.__restore=restore}
cloud.onChange(render);setInterval(()=>{if(cloud.state.status==='synced')render()},30000);
root.HackeniaCloudUI={mount};
})(typeof window==='undefined'?globalThis:window);
