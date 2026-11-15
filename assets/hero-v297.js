/* v297 → v300 — Héros du joueur : personnage hors deck présent au début de chaque partie solo dans la zone à protéger.
   Modèle neutre unique : nom, couleur de peau et des yeux (palette complète), animations (attente, marche, attaque, victoire) et élément (définitif). */
(()=>{'use strict';
const ELS=[['foudre','Foudre','ϟ','#a799df'],['vent','Vent','〰','#9cc995'],['terre','Terre','❧','#b29b86'],['glace','Glace','❄','#9dcfdf'],['eau','Eau','◈','#7eaeed'],['feu','Feu','✹','#eaa078']];
const SKINS=['#fbe2cf','#f3c9a5','#e8b08c','#d39a72','#b87a55','#8d5a3b','#6a4129','#4a2c1d','#c8d9a8','#9fc2e8'],EYES=['#3a8fd0','#2f9e6a','#7a5230','#4a4a4a','#8a5cc8','#c24a4a','#d4a537','#35c9d6'];
const ANIMS={idle:['Balancement joyeux','Posture détendue'],walk:['Marche','Démarche assurée','Course'],spell:['Coup ascendant','Coup de pied spartiate','Sort de mage','Sort chargé'],victory:['Danse hip-hop','Génie magique','Danse rigolote','Défilé']};
const LABEL={idle:'Attente',walk:'Marche',spell:'Attaque',victory:'Victoire'};
const g=()=>window.hackeniaGame,P=()=>window.HackeniaPortal,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let dlg=null,stage=null;
const later=()=>{try{sessionStorage.setItem('hackenia-hero-later','1')}catch{}};
const skipped=()=>{try{return sessionStorage.getItem('hackenia-hero-later')==='1'}catch{return false}};
function open(edit){const prof=P()?.profile?.();if(dlg||!prof)return;const cur=prof.hero||null;edit=!!edit&&!!cur;if(!edit&&cur)return;
 const st={name:cur?.name||'',el:cur?.el||'terre',skin:cur?.skin||'#e8b08c',eye:cur?.eye||'#3a8fd0',anim:{idle:1,walk:1,spell:1,victory:1,...(cur?.anim||{})}};
 dlg=document.createElement('dialog');dlg.id='hero-dialog';dlg.setAttribute('aria-labelledby','hero-title');
 dlg.innerHTML=`<h2 id="hero-title">${edit?'Votre héros':'Créez votre héros'}</h2>
 <p class="hero-intro">Il commence chaque partie contre l’IA dans votre zone à protéger, hors deck. Sa dalle de départ est de <b>force 0</b> ; elle gagne +1 tous les 10 niveaux de joueur (6 au maximum).</p>
 <div class="hero-stage" aria-label="Aperçu 3D du héros"><span class="hero-loading">Chargement du héros…</span></div>
 <label class="hero-name">Nom<input id="hero-name" maxlength="18" autocomplete="off" placeholder="Votre héros" value="${esc(st.name)}"></label>
 <fieldset><legend>Couleur de peau</legend><div class="hero-colors" data-k="skin">${SKINS.map(c=>`<button type="button" class="hero-sw" data-c="${c}" style="--c:${c}" aria-label="Peau ${c}"></button>`).join('')}<label class="hero-pick" title="Palette complète"><input type="color" value="${st.skin}" aria-label="Couleur de peau personnalisée"><span>Palette</span></label></div></fieldset>
 <fieldset><legend>Couleur des yeux</legend><div class="hero-colors" data-k="eye">${EYES.map(c=>`<button type="button" class="hero-sw" data-c="${c}" style="--c:${c}" aria-label="Yeux ${c}"></button>`).join('')}<label class="hero-pick" title="Palette complète"><input type="color" value="${st.eye}" aria-label="Couleur des yeux personnalisée"><span>Palette</span></label></div></fieldset>
 <fieldset><legend>Animations <em>(touchez pour les voir)</em></legend><div class="hero-anims">${Object.keys(ANIMS).map(k=>`<label>${LABEL[k]}<select data-anim="${k}">${ANIMS[k].map((n,i)=>`<option value="${i+1}">${n}</option>`).join('')}</select></label>`).join('')}</div></fieldset>
 <fieldset><legend>Élément ${edit?'<em>(définitif)</em>':'<em>(définitif, à choisir avec soin)</em>'}</legend><div class="hero-els">${ELS.map(([k,n,s,c])=>`<button type="button" class="hero-el" data-el="${k}" style="--c:${c}" ${edit?'disabled':''}><b>${s}</b> ${n}</button>`).join('')}</div></fieldset>
 <div class="hero-actions"><button type="button" data-later>${edit?'Annuler':'Plus tard'}</button><button type="button" class="hero-go" data-go>${edit?'Enregistrer':'Créer mon héros'}</button></div>`;
 document.body.append(dlg);
 const look=()=>({kind:'skin',skin:st.skin,eye:st.eye}),sync=()=>{dlg.querySelectorAll('.hero-colors').forEach(w=>{const k=w.dataset.k;w.querySelectorAll('.hero-sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.c.toLowerCase()===st[k].toLowerCase())));w.querySelector('input').value=st[k]});dlg.querySelectorAll('.hero-el').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.el===st.el)));dlg.querySelectorAll('[data-anim]').forEach(s=>s.value=String(st.anim[s.dataset.anim]))};
 let t=0;const apply=()=>{clearTimeout(t);t=setTimeout(()=>stage?.setLook(look()),90)};
 const play=k=>{const n=st.anim[k];stage?.playClip('assets/characters/hero-'+k+n+'.glb').catch(()=>{})};
 sync();
 dlg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.classList.contains('hero-sw')){st[b.parentElement.dataset.k]=b.dataset.c;sync();apply()}
  else if(b.dataset.el&&!b.disabled){st.el=b.dataset.el;sync()}
  else if('later' in b.dataset){if(!edit)later();dlg.close()}
  else if('go' in b.dataset){const name=(dlg.querySelector('#hero-name').value||'').trim()||'Héros',pr=structuredClone(P().profile());
   let avatar=pr.hero?.avatar||'';try{avatar=stage?.snapshot({bust:true,size:256})||avatar}catch{}
   pr.hero={...(pr.hero||{}),name:name.slice(0,18),el:st.el,skin:st.skin,eye:st.eye,anim:st.anim,avatar,at:pr.hero?.at||Date.now()};delete pr.hero.mi;
   if(P().commit(pr)){dlg.close();window.HackeniaPortalToast?.(edit?'Votre héros a été mis à jour.':'Votre héros « '+name+' » est prêt : il vous attend dans chaque partie contre l’IA !')}}});
 dlg.addEventListener('input',e=>{const i=e.target;if(i.type==='color'){st[i.closest('.hero-colors').dataset.k]=i.value;sync();apply()}});
 dlg.addEventListener('change',e=>{const s=e.target.closest('[data-anim]');if(s){st.anim[s.dataset.anim]=+s.value;play(s.dataset.anim)}});
 dlg.addEventListener('close',()=>{clearTimeout(t);stage?.dispose();stage=null;dlg.remove();dlg=null;refreshAvatar()});dlg.addEventListener('cancel',()=>{if(!edit)later()});
 dlg.showModal();
 (async()=>{try{const game=g();game.loadModelViewer?.();const info=await game.heroModelInfo({...st,anim:st.anim});if(!info||!dlg)return;const mod=await import('./character-stage.js?v=20261226-v300');const host=dlg.querySelector('.hero-stage');if(!dlg)return;const s=await mod.createCharacterStage(host,{...info,variant:look()},()=>!!dlg&&dlg.open);if(!dlg){s.dispose();return}stage=s;host.querySelector('.hero-loading')?.remove();s.playClip('assets/characters/hero-idle'+st.anim.idle+'.glb').catch(()=>s.setPose('idle'))}catch(err){const h=dlg?.querySelector('.hero-loading');if(h)h.textContent='Aperçu 3D indisponible sur cet appareil.'}})()}
/* Avatar du héros dans la pastille de niveau (menu et en-têtes). */
function refreshAvatar(){const btn=document.getElementById('portal-level'),ring=btn?.querySelector('.pl-ring');if(!ring)return;const a=P()?.profile?.()?.hero?.avatar;let img=ring.querySelector('.pl-avatar');
 if(!a){img?.remove();btn.classList.remove('has-avatar');return}
 if(!img){img=document.createElement('img');img.className='pl-avatar';img.alt='';img.setAttribute('aria-hidden','true');ring.prepend(img)}
 if(img.src!==a)img.src=a;btn.classList.add('has-avatar')}
setInterval(()=>{refreshAvatar();if(dlg||skipped()||!document.body.classList.contains('portal-open')||document.body.dataset.portalView!=='home'||document.querySelector('dialog[open],#tuto-hub'))return;
 const sm=document.querySelector('.start-content');if(sm&&sm.offsetParent)return;const p=P()?.profile?.();if(!p||p.hero||!g()?.monsters)return;open()},1500);
window.addEventListener('hackenia-profile-saved',refreshAvatar);
window.HackeniaHero={open,edit:()=>open(true),refreshAvatar};
})();
