/* v228 — « Proposer un dé » (joueurs, niveau 5 et plus) et espace de validation réservé à l'administrateur.
   Données : Supabase (online/sql/03-dice-submissions.sql). Récompenses d'un dé accepté : badge Créateur,
   200 Bubulles, puis un exemplaire du dé quand il est intégré au jeu (champ « submission » du dé). */
(()=>{'use strict';
const MIN_LEVEL=5,REWARD_GOLD=200,IMG_MAX=2*1024*1024,GLB_MAX=20*1024*1024,BUCKET='dice-submissions';
const EL=[['foudre','Foudre'],['vent','Vent'],['terre','Terre'],['glace','Glace'],['eau','Eau'],['feu','Feu'],['','Sans élément'],['multi','Multi-élément']];
const COLORS={foudre:'#a799df',vent:'#9cc995',terre:'#b29b86',glace:'#9dcfdf',eau:'#7eaeed',feu:'#eaa078','':'#c9b3ff',multi:'#e9d4ff'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P=()=>window.HackeniaPortal,R=()=>window.HackeniaDiceRules,game=()=>window.hackeniaGame;
const level=()=>window.HackeniaProgress?.levelOf?.(P()?.profile()?.xp||0)?.level||1;
const STATUS={pending:['⏳','En attente de validation'],accepted:['✔','Acceptée'],rejected:['✖','Refusée']};
const G=5;// grille de l'éditeur : 5 × 5
let draft={name:'',author:'',description:'',element:'feu',rarity:1,tiles:[],sel:-1,image:null,imageUrl:'',model:null,rights:false},busy=false,mine=null,msg='';

// Schéma en SVG (utilisé partout : éditeur, suivi, validation).
function shapeSvg(tiles,element,size=22){if(!tiles?.length)return '';const xs=tiles.map(t=>t[0]),ys=tiles.map(t=>t[1]),x0=Math.min(...xs),y0=Math.min(...ys),w=Math.max(...xs)-x0+1,h=Math.max(...ys)-y0+1,sp=R()?.spawnIndex(tiles)??-1,c=COLORS[element]||'#c9b3ff';
 return `<svg class="sb-shape" viewBox="0 0 ${w*size} ${h*size}" width="${w*size}" height="${h*size}" aria-hidden="true">${tiles.map((t,i)=>`<g transform="translate(${(t[0]-x0)*size} ${(t[1]-y0)*size})"><rect x="1.5" y="1.5" width="${size-3}" height="${size-3}" rx="4" fill="#141a24" stroke="${i===sp?'#ffd76a':c}" stroke-width="${i===sp?2.4:1.6}"/><text x="${size/2}" y="${size/2+4.5}" text-anchor="middle" font-size="${size*.55}" font-weight="700" fill="#fff4d3">${t[2]}</text></g>`).join('')}</svg>`}

// ---------- Formulaire joueur ----------
function render(host){host=host||document.getElementById('portal-content');const prof=P()?.profile()||{},lv=level();if(!draft.author)draft.author=(window.HackeniaSettings?.get?.().playerName||'').slice(0,24);
 if(lv<MIN_LEVEL){host.innerHTML=`<div class="portal-title"><div><h2>Proposer un dé</h2><p>Créez votre propre dé : s’il est validé, il rejoint la collection de tous les joueurs !</p></div></div><section class="sb-locked"><b>🔒 Niveau ${MIN_LEVEL} requis</b><p>Vous êtes niveau ${lv}. Gagnez de l’expérience en jouant et en accomplissant vos quêtes pour débloquer la création de dés.</p><button type="button" data-sb="quests">Voir mes quêtes</button></section>`;bind(host);return}
 const rules=R().RULES,ru=rules[draft.rarity],res=R().check(draft,game()?.monsters||[]),ready=res.ok&&draft.name.trim().length>=2&&draft.author.trim()&&draft.image&&draft.rights;
 const cells=[];for(let y=0;y<G;y++)for(let x=0;x<G;x++){const i=draft.tiles.findIndex(t=>t[0]===x&&t[1]===y),t=draft.tiles[i];cells.push(`<button type="button" class="sb-cell${t?' on':''}${i===draft.sel?' sel':''}${i>=0&&i===res.spawn?' spawn':''}" data-cell="${x},${y}" aria-label="Case ${x+1}, ${y+1}${t?' : dalle de force '+t[2]:' vide'}">${t?t[2]:''}</button>`)}
 const selT=draft.tiles[draft.sel];
 host.innerHTML=`<div class="portal-title"><div><h2>Proposer un dé</h2><p>Imaginez un personnage : s’il est validé, il rejoint la collection de tous les joueurs, avec votre nom ! Une proposition par jour.</p></div></div>
 <form class="sb-form" novalidate>
  <section class="sb-card"><h3>1. Le personnage</h3>
   <label>Nom du personnage<input name="name" maxlength="40" value="${esc(draft.name)}" placeholder="Ex. : Fenrok le forgeron" required></label>
   <label>Votre pseudo (affiché comme créateur)<input name="author" maxlength="24" value="${esc(draft.author)}" required></label>
   <label>Description (facultatif)<textarea name="description" maxlength="400" rows="3" placeholder="Qui est-il ? Quelle est son histoire ?">${esc(draft.description)}</textarea></label>
   <div class="sb-row"><label>Élément<select name="element">${EL.map(([v,n])=>`<option value="${v}" ${draft.element===v?'selected':''}>${n}</option>`).join('')}</select></label>
   <label>Rareté souhaitée<select name="rarity">${Object.entries(rules).map(([k,r])=>`<option value="${k}" ${+k===draft.rarity?'selected':''}>${r.name}</option>`).join('')}</select></label></div>
   <p class="sb-hint">${ru.name} : <b>${ru.tiles} dalles</b>, total de force <b>${R().totalFor(draft.rarity,draft.element)}</b>, valeurs de ${ru.min} à ${ru.max}, lancer ${ru.throw}.</p></section>
  <section class="sb-card"><h3>2. Le schéma</h3><p class="sb-hint">Touchez une case pour poser une dalle, puis réglez sa force. La créature apparaît sur la plus forte dalle (✦).</p>
   <div class="sb-editor"><div class="sb-grid" style="--ec:${COLORS[draft.element]}">${cells.join('')}</div>
    <div class="sb-tools">${selT?`<p>Dalle sélectionnée</p><div class="sb-stepper"><button type="button" data-sb="minus" aria-label="Diminuer">−</button><b>${selT[2]}</b><button type="button" data-sb="plus" aria-label="Augmenter">+</button></div><button type="button" data-sb="remove">Retirer la dalle</button>`:'<p class="sb-hint">Aucune dalle sélectionnée.</p>'}<button type="button" data-sb="clear">Tout effacer</button></div></div>
   <ul class="sb-checks">${res.checks.map(c=>`<li class="${c.ok?'ok':'ko'}">${c.ok?'✔':'✖'} ${esc(c.text)}</li>`).join('')}</ul></section>
  <section class="sb-card"><h3>3. Les visuels</h3>
   <label class="sb-file">Portrait du personnage (obligatoire, image jusqu’à 2 Mo)<input type="file" name="image" accept="image/png,image/jpeg,image/webp"></label>${draft.imageUrl?`<img class="sb-preview" src="${draft.imageUrl}" alt="Aperçu du portrait">`:''}
   <label class="sb-file">Modèle 3D .glb (facultatif, jusqu’à 20 Mo)<input type="file" name="model" accept=".glb,model/gltf-binary"></label>${draft.model?`<p class="sb-hint">✔ ${esc(draft.model.name)} (${(draft.model.size/1e6).toFixed(1)} Mo)</p>`:'<p class="sb-hint">Pas de modèle ? Pas de souci : un beau portrait suffit, le modèle pourra être créé ensuite.</p>'}
   <label class="options-check sb-rights"><input type="checkbox" name="rights" ${draft.rights?'checked':''}> J’ai créé ce contenu moi-même (ou j’ai le droit de l’utiliser) et j’accepte qu’il soit ajouté au jeu.</label></section>
  <p class="sb-msg" role="status" aria-live="polite">${esc(msg)}</p>
  <div class="sb-actions"><button type="button" class="portal-primary" data-sb="send" ${ready&&!busy?'':'disabled'}>${busy?'Envoi en cours…':'Envoyer ma proposition'}</button></div>
 </form>
 <section class="sb-card sb-mine"><h3>Mes propositions</h3><div id="sb-mine">${mineHtml()}</div></section>`;
 bind(host);if(mine===null)loadMine(host)}
function mineHtml(){if(mine===null)return '<p class="sb-hint">Chargement…</p>';if(mine==='offline')return '<p class="sb-hint">Connectez-vous à Internet pour voir vos propositions.</p>';if(!mine.length)return '<p class="sb-hint">Aucune proposition pour l’instant.</p>';
 return '<ul class="sb-list">'+mine.map(s=>`<li class="sb-item ${s.status}"><div>${shapeSvg(s.tiles,s.element,16)}</div><div><b>${esc(s.name)}</b><small>${new Date(s.created_at).toLocaleDateString('fr-FR')} · ${R().RULES[s.rarity]?.name||''}</small>${s.review_note?`<p>« ${esc(s.review_note)} »</p>`:''}</div><span class="sb-status">${STATUS[s.status][0]} ${STATUS[s.status][1]}</span></li>`).join('')+'</ul>'}
async function loadMine(host){try{if(!navigator.onLine)throw 0;const {sb}=await window.HackeniaOnline.session();const {data,error}=await sb.from('dice_submissions').select('id,name,rarity,element,tiles,status,review_note,created_at').order('created_at',{ascending:false});if(error)throw error;mine=data||[];claimRewards(mine)}catch{mine='offline'}const box=host.querySelector('#sb-mine');if(box)box.innerHTML=mineHtml()}
function bind(host){const f=host.querySelector('.sb-form');
 host.querySelector('[data-sb="quests"]')?.addEventListener('click',()=>P()?.open('challenges'));if(!f)return;
 f.addEventListener('input',e=>{const t=e.target;if(t.name==='name'||t.name==='author'||t.name==='description'){draft[t.name]=t.value;const send=f.querySelector('[data-sb="send"]'),res=R().check(draft,game()?.monsters||[]);send.disabled=!(res.ok&&draft.name.trim().length>=2&&draft.author.trim()&&draft.image&&draft.rights)||busy}});
 f.addEventListener('change',async e=>{const t=e.target;
  if(t.name==='element'){draft.element=t.value;render(host)}
  else if(t.name==='rarity'){draft.rarity=+t.value;const R0=R().RULES[draft.rarity];draft.tiles=draft.tiles.slice(0,R0.tiles).map(([x,y,v])=>[x,y,Math.max(R0.min,Math.min(R0.max,v))]);draft.sel=-1;render(host)}
  else if(t.name==='rights'){draft.rights=t.checked;render(host)}
  else if(t.name==='image'&&t.files[0]){msg='';try{const {blob,url}=await toWebp(t.files[0]);if(blob.size>IMG_MAX)throw new Error('Image trop lourde (2 Mo au plus).');draft.image=blob;draft.imageUrl=url}catch(err){msg=err.message||'Image illisible.';draft.image=null;draft.imageUrl=''}render(host)}
  else if(t.name==='model'&&t.files[0]){const file=t.files[0];msg='';if(file.size>GLB_MAX){msg='Modèle trop lourd (20 Mo au plus).';draft.model=null}else if(!/\.glb$/i.test(file.name)){msg='Le modèle doit être un fichier .glb.';draft.model=null}else{const head=new Uint8Array(await file.slice(0,4).arrayBuffer());draft.model=String.fromCharCode(...head)==='glTF'?file:null;if(!draft.model)msg='Ce fichier n’est pas un modèle .glb valide.'}render(host)}});
 f.addEventListener('click',e=>{const cell=e.target.closest('[data-cell]'),act=e.target.closest('[data-sb]')?.dataset.sb;
  if(cell){const [x,y]=cell.dataset.cell.split(',').map(Number),i=draft.tiles.findIndex(t=>t[0]===x&&t[1]===y),ru=R().RULES[draft.rarity];if(i>=0)draft.sel=i;else if(draft.tiles.length<ru.tiles){draft.tiles.push([x,y,ru.min]);draft.sel=draft.tiles.length-1}else{msg=`${ru.tiles} dalles au maximum pour cette rareté.`}render(host);return}
  const ru=R().RULES[draft.rarity],t=draft.tiles[draft.sel];
  if(act==='plus'&&t){t[2]=Math.min(ru.max,t[2]+1);render(host)}else if(act==='minus'&&t){t[2]=Math.max(ru.min,t[2]-1);render(host)}
  else if(act==='remove'&&t){draft.tiles.splice(draft.sel,1);draft.sel=-1;render(host)}else if(act==='clear'){draft.tiles=[];draft.sel=-1;render(host)}
  else if(act==='send')send(host)})}
// Portrait : recadré au carré et converti en WebP 512 px (plus léger).
function toWebp(file){return new Promise((res,rej)=>{if(!/^image\//.test(file.type))return rej(new Error('Choisissez une image.'));const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const S=512,c=document.createElement('canvas');c.width=c.height=S;const s=Math.min(img.width,img.height),g=c.getContext('2d');g.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,S,S);URL.revokeObjectURL(u);c.toBlob(b=>b?res({blob:b,url:URL.createObjectURL(b)}):rej(new Error('Image illisible.')),'image/webp',.88)};img.onerror=()=>rej(new Error('Image illisible.'));img.src=u})}
async function send(host){if(busy)return;if(!navigator.onLine){msg='Connectez-vous à Internet pour envoyer votre proposition.';render(host);return}busy=true;msg='';render(host);
 try{const {sb,uid}=await window.HackeniaOnline.session(),id=crypto.randomUUID(),img=`${uid}/${id}.webp`;
  let up=await sb.storage.from(BUCKET).upload(img,draft.image,{contentType:'image/webp',upsert:false});if(up.error)throw up.error;
  let model=null;if(draft.model){model=`${uid}/${id}.glb`;up=await sb.storage.from(BUCKET).upload(model,draft.model,{contentType:'model/gltf-binary',upsert:false});if(up.error)throw up.error}
  const row={author:draft.author.trim(),name:draft.name.trim(),description:draft.description.trim(),element:draft.element,rarity:draft.rarity,tiles:draft.tiles.map(t=>[t[0],t[1],t[2]]),image_path:img,model_path:model,rights_ok:true};
  const {error}=await sb.from('dice_submissions').insert(row);if(error)throw error;
  draft={name:'',author:draft.author,description:'',element:'feu',rarity:1,tiles:[],sel:-1,image:null,imageUrl:'',model:null,rights:false};mine=null;msg='✔ Proposition envoyée ! Vous serez prévenu ici dès qu’elle sera examinée.'}
 catch(err){const m=String(err?.message||err);msg=/Une seule proposition/.test(m)?'Une seule proposition par jour : revenez demain !':/relation|does not exist|PGRST20|bucket/i.test(m)?'Les propositions ne sont pas encore ouvertes (configuration du serveur en cours).':'Envoi impossible : '+m}
 busy=false;render(host)}

// ---------- Récompenses du créateur ----------
function claimRewards(list){const portal=P();if(!portal)return;const prof=portal.profile(),cr=prof.creator||{claimed:[],dice:[]},claimed=new Set(cr.claimed||[]),got=new Set(cr.dice||[]);let next=null,gold=0,dice=[];
 for(const s of list||[])if(s.status==='accepted'&&!claimed.has(s.id)){next??=structuredClone(prof);claimed.add(s.id);gold+=REWARD_GOLD}
 // Un exemplaire du dé quand il a été intégré au jeu.
 (game()?.monsters||[]).forEach((d,i)=>{if(d.submission&&claimed.has(d.submission)&&!got.has(d.submission)){next??=structuredClone(prof);next.inventory[i]=(next.inventory[i]||0)+1;got.add(d.submission);dice.push(d.cn)}});
 if(!next)return;next.gold+=gold;next.creator={badge:true,claimed:[...claimed],dice:[...got]};if(portal.commit(next)){const t=[];if(gold)t.push(`✦ Votre dé a été accepté ! Badge Créateur et +${gold} Bubulles`);if(dice.length)t.push(`🎲 ${dice.join(', ')} rejoint votre collection !`);window.HackeniaPortalToast?.(t.join(' · '))||alert(t.join('\n'))}}
async function checkRewards(){try{if(!navigator.onLine||!window.HackeniaOnline)return;const {sb}=await window.HackeniaOnline.session();const {data,error}=await sb.from('dice_submissions').select('id,status').eq('status','accepted');if(!error)claimRewards(data)}catch{}}
setTimeout(checkRewards,8000);addEventListener('online',()=>setTimeout(checkRewards,3000));

// ---------- Espace de validation (administrateur) : ouvrir le jeu avec #admin ----------
let admin=null,adminFilter='pending',adminRows=null,adminMsg='';
function adminClient(){if(admin)return admin;const c=window.HACKENIA_PVP_CONFIG;admin=window.supabase.createClient(c.url,c.key,{auth:{storageKey:'hackenia-admin',persistSession:true,autoRefreshToken:true}});return admin}
async function renderAdmin(host){host=host||document.getElementById('portal-content');host.innerHTML='<p class="sb-hint">Chargement de l’espace de validation…</p>';
 try{await window.HackeniaOnline.getClient()}catch{host.innerHTML='<p>Service en ligne inaccessible.</p>';return}
 const sb=adminClient(),{data:{session}}=await sb.auth.getSession();
 if(!session||session.user.is_anonymous){host.innerHTML=`<div class="portal-title"><div><h2>Espace de validation</h2><p>Réservé à l’administrateur du jeu.</p></div></div><form class="sb-card sb-login"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" required></label><button class="portal-primary">Se connecter</button><p class="sb-msg">${esc(adminMsg)}</p></form>`;
  host.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.target),{error}=await sb.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')});adminMsg=error?'Connexion refusée : '+error.message:'';renderAdmin(host)});return}
 const {data:isAdmin}=await sb.rpc('is_hackenia_admin');if(!isAdmin){host.innerHTML='<div class="sb-card"><p>Ce compte n’est pas administrateur.</p><button type="button" data-a="logout">Se déconnecter</button></div>';host.querySelector('[data-a="logout"]').onclick=async()=>{await sb.auth.signOut();renderAdmin(host)};return}
 const {data,error}=await sb.from('dice_submissions').select('*').order('created_at',{ascending:false});adminRows=error?[]:data;
 const counts=Object.fromEntries(['pending','accepted','rejected'].map(k=>[k,adminRows.filter(r=>r.status===k).length])),rows=adminRows.filter(r=>r.status===adminFilter);
 host.innerHTML=`<div class="portal-title"><div><h2>Espace de validation</h2><p>${counts.pending} proposition${counts.pending>1?'s':''} en attente.</p></div><div class="sb-actions"><button type="button" data-a="tales">📜 Contes de la Taverne</button><button type="button" data-a="logout">Se déconnecter</button></div></div>
 <div class="sb-tabs">${[['pending','En attente'],['accepted','Acceptées'],['rejected','Refusées']].map(([k,n])=>`<button type="button" data-filter="${k}" aria-pressed="${adminFilter===k}">${n} (${counts[k]})</button>`).join('')}</div>
 <div class="sb-admin-list">${rows.length?rows.map(r=>`<article class="sb-card sb-review" data-id="${r.id}"><div class="sb-review-media"><img alt="Portrait proposé" data-img="${esc(r.image_path)}">${r.model_path?`<div class="sb-model" data-model="${esc(r.model_path)}"></div>`:'<p class="sb-hint">Pas de modèle 3D</p>'}</div>
  <div class="sb-review-body"><h3>${esc(r.name)}</h3><p class="sb-hint">par <b>${esc(r.author)}</b> · ${new Date(r.created_at).toLocaleString('fr-FR')} · ${EL.find(e=>e[0]===r.element)?.[1]||r.element} · ${R().RULES[r.rarity]?.name}</p>${r.description?`<p>${esc(r.description)}</p>`:''}<div class="sb-review-shape">${shapeSvg(r.tiles,r.element)}</div>
  <ul class="sb-checks">${R().check({rarity:r.rarity,element:r.element,tiles:r.tiles},game()?.monsters||[]).checks.map(c=>`<li class="${c.ok?'ok':'ko'}">${c.ok?'✔':'✖'} ${esc(c.text)}</li>`).join('')}</ul>
  <p class="sb-hint">Identifiant : <code>${r.id}</code> · <a href="#" data-dl="${esc(r.image_path)}">Télécharger le portrait</a>${r.model_path?` · <a href="#" data-dl="${esc(r.model_path)}">Télécharger le modèle</a>`:''}</p>
  <label>Message pour le joueur<textarea rows="2" maxlength="400" data-note>${esc(r.review_note)}</textarea></label>
  <div class="sb-actions"><button type="button" class="portal-primary" data-decide="accepted">✔ Accepter</button><button type="button" data-decide="rejected">✖ Refuser</button>${r.status!=='pending'?'<button type="button" data-decide="pending">Remettre en attente</button>':''}</div></div></article>`).join(''):'<p class="sb-hint">Aucune proposition ici.</p>'}</div>`;
 host.querySelector('[data-a="logout"]').onclick=async()=>{await sb.auth.signOut();renderAdmin(host)};host.querySelector('[data-a="tales"]').onclick=()=>window.HackeniaTales?.renderAdmin(host);
 host.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{adminFilter=b.dataset.filter;renderAdmin(host)});
 const signed=async p=>(await sb.storage.from(BUCKET).createSignedUrl(p,3600)).data?.signedUrl;
 host.querySelectorAll('img[data-img]').forEach(async im=>{im.src=await signed(im.dataset.img)||''});
 host.querySelectorAll('[data-model]').forEach(async box=>{const url=await signed(box.dataset.model);if(!url)return;game()?.loadModelViewer?.();box.innerHTML=`<model-viewer src="${url}" camera-controls auto-rotate autoplay shadow-intensity="1" style="width:100%;height:220px;background:#0b0f17;border-radius:12px"></model-viewer>`});
 host.querySelectorAll('[data-dl]').forEach(a=>a.onclick=async e=>{e.preventDefault();const url=await signed(a.dataset.dl);if(url)window.open(url,'_blank')});
 host.querySelectorAll('[data-decide]').forEach(b=>b.onclick=async()=>{const card=b.closest('[data-id]'),note=card.querySelector('[data-note]').value.trim(),status=b.dataset.decide;b.disabled=true;
  const {error}=await sb.from('dice_submissions').update({status,review_note:note,reviewed_at:status==='pending'?null:new Date().toISOString()}).eq('id',card.dataset.id);if(error)alert('Erreur : '+error.message);renderAdmin(host)})}

window.HackeniaSubmit={render:host=>{mine=null;render(host)},renderAdmin,shapeSvg,checkRewards,adminClient,MIN_LEVEL,REWARD_GOLD};
// Lien direct vers l'espace de validation : …/index.html#admin
const goAdmin=()=>{if(location.hash==='#admin'){const t=setInterval(()=>{if(P()){clearInterval(t);P().open('admin')}},400)}};addEventListener('hashchange',goAdmin);goAdmin();
})();
