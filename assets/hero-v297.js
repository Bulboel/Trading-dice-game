/* v297 — Création du héros : un personnage hors deck, présent au début de chaque partie solo dans la zone à protéger.
   Étape 1 : nom, apparence (parmi les personnages jouables existants) et élément (définitif). */
(()=>{'use strict';
const MI=[37,36,38,39,40,1,57,4],ELS=[['foudre','Foudre','ϟ','#a799df'],['vent','Vent','〰','#9cc995'],['terre','Terre','❧','#b29b86'],['glace','Glace','❄','#9dcfdf'],['eau','Eau','◈','#7eaeed'],['feu','Feu','✹','#eaa078']];
const g=()=>window.hackeniaGame,P=()=>window.HackeniaPortal,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let dlg=null;
const skipped=()=>{try{return sessionStorage.getItem('hackenia-hero-later')==='1'}catch{return false}};
function open(){if(dlg||!P()?.profile?.()||P().profile().hero)return;let mi=MI[0],el='terre';
 dlg=document.createElement('dialog');dlg.id='hero-dialog';dlg.setAttribute('aria-labelledby','hero-title');
 const draw=()=>{dlg.innerHTML=`<h2 id="hero-title">Créez votre héros</h2><p class="hero-intro">Il commence chaque partie contre l’IA dans votre zone à protéger. Il ne compte pas dans votre deck : pour avancer, il lui faut des dalles. Sa dalle de départ est de <b>force 0</b> ; elle gagne +1 tous les 10 niveaux de joueur (6 au maximum).</p>
 <label class="hero-name">Nom<input id="hero-name" maxlength="18" autocomplete="off" placeholder="Votre héros" value="${esc(dlg.dataset.name||'')}"></label>
 <fieldset><legend>Apparence</legend><div class="hero-looks">${MI.map(m=>`<button type="button" class="hero-look" data-mi="${m}" aria-pressed="${m===mi}" aria-label="${esc(g().monsters[m].cn)}"><span>${g().portrait(m)}</span><small>${esc(g().monsters[m].cn)}</small></button>`).join('')}</div></fieldset>
 <fieldset><legend>Élément <em>(définitif)</em></legend><div class="hero-els">${ELS.map(([k,n,s,c])=>`<button type="button" class="hero-el" data-el="${k}" aria-pressed="${k===el}" style="--c:${c}"><b>${s}</b> ${n}</button>`).join('')}</div></fieldset>
 <div class="hero-actions"><button type="button" data-later>Plus tard</button><button type="button" class="hero-go" data-go>Créer mon héros</button></div>`;
  const inp=dlg.querySelector('#hero-name');inp.oninput=()=>{dlg.dataset.name=inp.value}};
 draw();document.body.append(dlg);
 dlg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mi){mi=+b.dataset.mi;draw()}else if(b.dataset.el){el=b.dataset.el;draw()}
  else if('later' in b.dataset){try{sessionStorage.setItem('hackenia-hero-later','1')}catch{}dlg.close()}
  else if('go' in b.dataset){const name=(dlg.dataset.name||'').trim()||'Héros',pr=structuredClone(P().profile());pr.hero={name:name.slice(0,18),mi,el,at:Date.now()};if(P().commit(pr)){dlg.close();window.HackeniaPortalToast?.('Votre héros « '+name+' » est prêt : il vous attend dans chaque partie contre l’IA !')}}});
 dlg.addEventListener('close',()=>{dlg.remove();dlg=null});dlg.addEventListener('cancel',()=>{try{sessionStorage.setItem('hackenia-hero-later','1')}catch{}});
 dlg.showModal()}
setInterval(()=>{if(dlg||skipped()||!document.body.classList.contains('portal-open')||document.body.dataset.portalView!=='home'||document.querySelector('dialog[open],#tuto-hub'))return;
 const sm=document.querySelector('.start-content');if(sm&&sm.offsetParent)return;const p=P()?.profile?.();if(!p||p.hero||!g()?.monsters)return;open()},1500);
window.HackeniaHero={open};
})();
