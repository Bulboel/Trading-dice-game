/* v315 — Pack Sage : bague de sage, ouverture des bourses par 100, recyclage automatique des doublons (favoris protégés),
   1 000 Bubulles, jeu sans publicité. L'état est dans le profil (profile.premium) ; l'attribution peut aussi venir de l'administrateur
   (table premium_grants, voir online/sql/07-premium.sql). Le paiement réel passe par un fournisseur branchable (HackeniaPremium.billing). */
(function(root){'use strict';
const GOLD=1000,PRICE_GOLD=7500,RING='bague-de-sage';/* prix en Bubulles (1 000 sont rendues à l’activation) ; l’achat en argent réel n’apparaît que si un fournisseur de paiement est branché (billing) */
const BENEFITS=['Bague de sage (objet porté) : tous vos dés bonus dès le début de chaque duel contre l’IA','Ouverture des bourses par 100 (900 Bubulles)','Recyclage automatique des doublons : trois exemplaires gardés au minimum, favoris ♥ épargnés','1 000 Bubulles rendues dès l’activation','Jeu sans publicité'];
const active=p=>!!p?.premium?.sage,adsFree=p=>!!p?.premium?.noAds||active(p);
/* Active le pack sur un profil (renvoie un nouveau profil). Les 1 000 Bubulles ne sont versées qu'une fois. */
function activate(profile,source='purchase'){const next=structuredClone(profile),prem=next.premium||{};const first=!prem.goldPaid;
 next.premium={...prem,sage:true,noAds:true,goldPaid:true,source:prem.source||source,since:prem.since||new Date().toISOString()};
 if(first)next.gold=(Number.isSafeInteger(next.gold)?next.gold:0)+GOLD;
 if(!next.equipped)next.equipped=RING;return next}
const toggleFavorite=(profile,id)=>{const next=structuredClone(profile);next.favorites={...(next.favorites||{})};if(next.favorites[id])delete next.favorites[id];else next.favorites[id]=1;return next};
const isFavorite=(profile,id)=>!!profile?.favorites?.[id];
const api={PRICE_GOLD,GOLD,RING,BENEFITS,active,adsFree,activate,toggleFavorite,isFavorite,billing:null};root.HackeniaPremium=api;if(typeof module!=='undefined')module.exports=api;
/* ——— Espace administrateur : liste des joueurs et attribution du pack ——— */
if(typeof document==='undefined')return;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
let rows=null,q='';
async function renderPlayers(host){host=host||document.getElementById('portal-content');host.innerHTML='<p class="sb-hint">Chargement des joueurs…</p>';
 try{const sb=root.HackeniaSubmit.adminClient(),{data,error}=await sb.rpc('admin_list_players');if(error)throw error;rows=data||[]}catch(e){host.innerHTML='<div class="sb-card"><p>Impossible de charger les joueurs ('+esc(e?.message||e)+'). Le fichier online/sql/07-premium.sql a-t-il été exécuté ?</p><button type="button" data-a="back">Retour</button></div>';host.querySelector('[data-a=back]').onclick=()=>root.HackeniaSubmit.renderAdmin(host);return}
 draw(host)}
function draw(host){const list=rows.filter(r=>!q||(r.user_id+JSON.stringify(r.summary||{})).toLowerCase().includes(q.toLowerCase()));
 host.innerHTML=`<div class="portal-title"><div><h2>Joueurs</h2><p>${rows.length} joueur${rows.length>1?'s':''} · ${rows.filter(r=>r.sage).length} avec le Pack Sage.</p></div><div class="sb-actions"><button type="button" data-a="back">← Validation</button></div></div>
 <label class="search">Rechercher<input id="pl-q" type="search" value="${esc(q)}" placeholder="Identifiant, niveau…"></label>
 <div class="sb-admin-list">${list.map(r=>{const s=r.summary||{};return `<article class="sb-card" data-id="${esc(r.user_id)}"><div><b>${esc(String(r.user_id).slice(0,8))}</b> · niveau ${s.level||1} · ${s.kinds||0} dés différents · ${s.gold||0} Bubulles<br><small>Dernière sauvegarde : ${r.updated_at?new Date(r.updated_at).toLocaleString('fr-FR'):'—'}${r.sage?' · Pack Sage actif ('+esc(r.source||'admin')+')':''}</small></div><button type="button" data-a="grant" data-on="${r.sage?0:1}">${r.sage?'Retirer le Pack Sage':'Attribuer le Pack Sage'}</button></article>`}).join('')||'<p class="sb-hint">Aucun joueur.</p>'}</div>`;
 host.querySelector('[data-a=back]').onclick=()=>root.HackeniaSubmit.renderAdmin(host);
 const qi=host.querySelector('#pl-q');qi.oninput=()=>{q=qi.value;const pos=qi.selectionStart;draw(host);const n=host.querySelector('#pl-q');n.focus();n.setSelectionRange(pos,pos)};
 host.querySelectorAll('[data-a=grant]').forEach(b=>b.onclick=async()=>{const id=b.closest('[data-id]').dataset.id,on=b.dataset.on==='1';if(!confirm((on?'Attribuer':'Retirer')+' le Pack Sage à ce joueur ?'))return;b.disabled=true;
  const {error}=await root.HackeniaSubmit.adminClient().rpc('admin_set_premium',{p_user:id,p_on:on});if(error){alert('Erreur : '+error.message);b.disabled=false;return}
  const r=rows.find(x=>x.user_id===id);if(r){r.sage=on;r.source=on?'admin':null}draw(host)})}
api.renderPlayers=renderPlayers;
})(typeof window==='undefined'?globalThis:window);
