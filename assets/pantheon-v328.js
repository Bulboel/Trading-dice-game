/* v328 — Le Panthéon : les dix épreuves de la Triade d’Hackénia, rejouées en duels de dés.
   Mêmes adversaires, même ordre, mêmes illustrations (assets/pantheon/) ; chaque victoire débloque l’épreuve suivante.
   Les pouvoirs inventés pour le jeu de cartes deviennent des règles de duel :
   - Velmarys : son « cadeau » échange ton dé le plus puissant contre le sien, le temps du duel ;
   - Bosco : il éternue une fois quand 4 créatures sont sur le plateau, et les créatures échangent leurs places (moteur : foePower) ;
   - Soryan : grand tacticien, il replace une de ses créatures après son 2e tour sur la case où elle gagne le plus (moteur : foePower) ;
   - Caleïzis : un deck de trois Caleïzis, dont la Tempête sacrée.
   Règle du Panthéon pour ton deck : 2 dés légendaires ou divins au maximum.
   Progression : profile.pantheon = {won:{id:true}, rewarded:{id:true}}. */
(()=>{'use strict';
const game=window.hackeniaGame,P=()=>window.HackeniaPortal;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IMG=k=>`assets/pantheon/${k}.webp`,EN=()=>window.HackeniaI18n?.lang==='en';
const MAX_STRONG=2,strong=i=>(game.monsters[i]?.lv||0)>=5;
/* Scènes : [image, texte]. own:true = le texte est déjà dessiné dans l’illustration (sous-titre affiché seulement en anglais). */
const FOES=[
 {id:'georges',name:'Georges',title:'Georges, garde du palais',terrain:'ville',level:'moyen',reward:50,dice:[7,37,39,14],
  intro:'Aux portes du palais de Dassom, Georges t’interpelle.',
  meet:[['georges-palais','Devant les portes du palais de Dassom, un soldat te fait signe de t’arrêter.'],['georges-rencontre','« Hahaha ! Tu veux passer, aventurier ? Alors montre-moi ce que tu vaux ! Les portes du palais ne s’ouvrent qu’aux plus valeureux ! »',1]],
  win:[['georges-palais','« Bravo ! Mais je reste le moins fort du Panthéon, bonne chance pour la suite ! »']]},
 {id:'velcan',name:'Velcan',title:'Velcan, expert en détection de magie',terrain:'vent',level:'moyen',reward:50,dice:[89,64,6,44],
  intro:'Velcan s’accorde une pause entre deux grimoires.',
  meet:[['velcan-rencontre','« Ah, une pause ! Rien de tel qu’une partie pour se détendre ! »',1],['velcan-defi','« Toi aussi, tu joues ? Alors, installe-toi ! Je te propose un duel ! »',1]],
  win:[['velcan-victoire','« J’aime avoir du fil à retordre, bien joué ! »']]},
 {id:'pachie',name:'La fée Pachié',title:'La fée Pachié',terrain:'eau',level:'difficile',reward:75,dice:[34,89,10,74,64],
  intro:'Au cœur du quartier des brumes féeriques, la fée Pachié t’attendait.',
  meet:[['pachie-rencontre','« Te voilà enfin… j’ai failli attendre. »',1],['pachie-defi','« Allez, commençons, j’ai très envie de jouer. »',1]],
  win:[['pachie-victoire','« Tu ne manques pas d’audace, tu en auras besoin pour la suite… »',1]]},
 {id:'orven',name:'Orven',title:'Orven, membre des griffons dorés',terrain:'automne',level:'difficile',reward:75,dice:[2,3,130,0,33],
  intro:'Orven, des griffons dorés, a préparé un deck rien que pour toi.',
  meet:[['orven-rencontre','« Je t’ai senti arriver… »',1],['orven-defi','« J’ai tenté de faire un deck, tu me diras ce que tu en penses. »',1]],
  win:[['orven-victoire','« Oh, c’est donc comme ça que tu joues… Impressionnant… »',1]]},
 {id:'maebril',name:'Maebril',title:'Maebril, chef des griffons dorés',terrain:'ville',level:'difficile',reward:100,dice:[0,21,128,29,25],
  intro:'À la taverne du Griffon doré, Maebril essuie une chope en souriant.',
  meet:[['maebril-rencontre','« Je vois que tu avances bien dans le Panthéon… c’est parti ! »',1],['maebril-chance','« Je sens que je vais avoir de la chance au tirage… »',1],['maebril-defi','« Petit colibri veut devenir un busard ? Prouve-le !! »',1]],
  win:[['maebril-victoire','« Bien, je n’en attendais pas moins d’un de mes meilleurs chasseurs de primes ! »']]},
 {id:'bosco',name:'Bosco',title:'Bosco, aarakocra insouciant',terrain:'terre',level:'difficile',reward:100,dice:[29,143,76,77,78,80],power:'sneeze',
  intro:'Dans le Bois tendre, Bosco a déjà installé le plateau sur une souche.',
  powerText:'Éternuement : dès que 4 créatures sont sur le plateau, Bosco éternue. Toutes les créatures hors des zones de camp échangent leurs places (avec leur dalle), puis les combats au contact se résolvent.',
  meet:[['bosco-rencontre','« Ah ! Enfin quelqu’un bat Maebril ! Ça faisait longtemps que ce n’était pas arrivé ! »',1],['bosco-defi','« Promis, j’ai rien caché dans mes plumes ! »',1]],
  win:[['bosco-victoire','« J’ai fait ce que j’ai pu, mais t’es vraiment trop balaise… »',1]]},
 {id:'velmarys',name:'Velmarys',title:'Velmarys, au service de son noble',terrain:'glace',level:'difficile',reward:100,dice:[4,131,37,19,69],power:'gift',
  intro:'Dans son salon, au coin du feu, Velmarys t’invite à t’asseoir.',
  powerText:'Cadeau empoisonné : avant le duel, Velmarys t’offre son dé « Velmarys des Marées »… et prend ton dé le plus puissant pour ce duel.',
  meet:[['velmarys-rencontre','« Ça faisait longtemps qu’on ne s’était pas vu. »',1],['velmarys-defi','« Tu as bien le temps de jouer un peu avec moi… »',1]],
  win:[['velmarys-victoire','« Ces retrouvailles étaient mémorables, j’espère te revoir bientôt… »',1]]},
 {id:'soryan',name:'Soryan',title:'Soryan, sage grand tacticien',terrain:'feu',level:'divin',reward:200,dice:[19,35,136,22,18],power:'tactic',
  intro:'Soryan t’attend, entouré de chandelles et de parchemins.',
  powerText:'Grand tacticien : après son 2e tour, Soryan replace une de ses créatures (avec sa dalle) sur la case libre où elle bat le plus de créatures voisines.',
  meet:[['soryan-rencontre','« Avoue, tu t’attendais à me voir tôt ou tard… »',1],['soryan-defi','« J’ai participé à la création du jeu… ça te donne une idée de mon niveau. »',1]],
  win:[['soryan-victoire','« Tu es vraiment incroyable… Bravo ! »',1]]},
 {id:'hilam',name:'Hilam',title:'Hilam, souverain de Dassom',terrain:'ville',level:'divin',reward:200,dice:[26,32,140,90,14],
  intro:'Sur son balcon au-dessus de Dassom, le souverain t’attend.',
  meet:[['hilam-rencontre','« Tu as croisé de nombreux valeureux adversaires, j’espère me montrer à leur hauteur… »',1],['hilam-defi','« Commençons, et que le meilleur gagne. »',1]],
  win:[['hilam-victoire','« Il te reste une ultime étape pour terminer le Panthéon. En attendant, si tu t’ennuies, reviens me voir ! »',1]]},
 {id:'caleizis',name:'Caleïzis',title:'Caleïzis, proche du divin',terrain:'foudre',level:'divin',reward:300,dice:[112,144,88,30,113],power:'divine',
  intro:'Dans une caverne de cristaux violets, l’air crépite autour de Caleïzis.',
  powerText:'Proche du divin : Caleïzis aligne trois versions d’elle-même, dont la Tempête sacrée, et la divine Floréa.',
  meet:[['caleizis-rencontre','« Tu oses te confronter à moi ? Très bien, tu l’auras voulu… »',1],['caleizis-defi','« Je te promets un duel chaotique. »',1]],
  win:[['caleizis-victoire','« Mais… Comment… »',1]]}];
const LEVELS={moyen:'Moyen',difficile:'Difficile',divin:'Divin'};
let pending=null;// duel en cours : {id}

// ——— Progression ———
function prog(){const s=P()?.profile()?.pantheon;return{won:{...(s?.won||{})},rewarded:{...(s?.rewarded||{})}}}
const unlocked=i=>i===0||!!prog().won[FOES[i-1].id];
function record(f){const portal=P();if(!portal)return '';const pr=portal.profile(),first=!pr.pantheon?.rewarded?.[f.id],next=structuredClone(pr);
 next.pantheon={won:{...(pr.pantheon?.won||{}),[f.id]:true},rewarded:{...(pr.pantheon?.rewarded||{}),[f.id]:true}};if(first)next.gold+=f.reward;
 return portal.commit(next)?(first?`${f.name} vaincu(e) ! +${f.reward} Bubulles.`:`${f.name} vaincu(e) à nouveau !`):''}

// ——— Scène (illustration plein écran) ———
let scene;
function ensure(){if(scene)return scene;scene=document.createElement('section');scene.id='pantheon-scene';scene.hidden=true;scene.setAttribute('role','dialog');scene.setAttribute('aria-label','Le Panthéon');
 scene.innerHTML='<div class="pth-frame"><img class="pth-img" alt=""><p class="pth-sub"></p><div class="pth-note" hidden></div><div class="pth-actions"></div></div>';document.body.append(scene);return scene}
/* steps : [{img,text,own,note,actions:[[label,fn,primary]]}] — joue les étapes une à une. */
function show(step){const s=ensure(),img=s.querySelector('.pth-img'),sub=s.querySelector('.pth-sub'),note=s.querySelector('.pth-note'),act=s.querySelector('.pth-actions');
 img.src=IMG(step.img);img.alt=step.text||'';sub.textContent=step.text||'';sub.hidden=!step.text||(step.own&&!EN());
 note.hidden=!step.note;note.textContent=step.note||'';act.innerHTML='';
 for(const [label,fn,primary] of step.actions){const b=document.createElement('button');b.type='button';b.textContent=label;if(primary)b.className='pth-primary';b.onclick=()=>fn();act.append(b)}
 s.hidden=false;document.body.classList.add('pantheon-scene-open');act.querySelector('.pth-primary,button')?.focus()}
function hide(){if(!scene)return;scene.hidden=true;document.body.classList.remove('pantheon-scene-open')}
function sequence(list,last){const run=i=>{const [img,text,own]=list[i],end=i===list.length-1;
 show({img,text,own,actions:end?last:[['Retour',()=>{hide();P()?.open('pantheon')}],['Continuer →',()=>run(i+1),1]]})};run(0)}

// ——— Défi ———
const deckOk=dice=>dice.filter(strong).length<=MAX_STRONG;
function challenge(i){const f=FOES[i];if(!f||!unlocked(i))return;
 sequence(f.meet,[['Retour',()=>{hide();P()?.open('pantheon')}],['⚔ Accepter le défi',()=>chooseDeck(f),1]])}
function chooseDeck(f){const all=P()?.legalDecks?.()||[],decks=all.filter(d=>deckOk(d.dice)),names=d=>d.dice.map(i=>game.monsters[i]?.cn||'?').join(', ');
 document.getElementById('pantheon-deck')?.remove();const dlg=document.createElement('dialog');dlg.id='pantheon-deck';dlg.setAttribute('aria-labelledby','pantheon-deck-title');
 if(!decks.length){dlg.innerHTML=`<h3 id="pantheon-deck-title">Aucun deck autorisé</h3><p>Au Panthéon, un deck peut contenir au plus ${MAX_STRONG} dés légendaires ou divins.${all.length?' Aucun de vos decks ne respecte cette règle.':''}</p><div class="sd-actions"><button type="button" data-pd="cancel">Retour</button><button type="button" class="sd-go" data-pd="decks">Modifier mes decks</button></div>`}
 else{const cur=decks.find(d=>d.id===P().preferredDeck?.()?.id)?.id||decks[0].id;
  dlg.innerHTML=`<h3 id="pantheon-deck-title">Choisissez votre deck</h3><p>${MAX_STRONG} dés légendaires ou divins au maximum.${all.length>decks.length?` (${all.length-decks.length} deck${all.length-decks.length>1?'s':''} non autorisé${all.length-decks.length>1?'s':''})`:''}</p><select aria-label="Deck">${decks.map(d=>`<option value="${esc(d.id)}" ${d.id===cur?'selected':''}>${esc(d.name)}</option>`).join('')}</select><p class="sd-list"></p><div class="sd-actions"><button type="button" data-pd="cancel">Retour</button><button type="button" class="sd-go" data-pd="go">⚔ Commencer le duel</button></div>`;
  const sel=dlg.querySelector('select'),list=dlg.querySelector('.sd-list'),upd=()=>{const d=decks.find(x=>x.id===sel.value);list.textContent=d?names(d):''};sel.onchange=upd;upd()}
 dlg.addEventListener('click',e=>{const a=e.target.closest('[data-pd]')?.dataset.pd;if(!a)return;
  if(a==='go'){const d=decks.find(x=>x.id===dlg.querySelector('select').value);P().setPreferredDeck?.(d.id);dlg.close();f.power==='gift'?gift(f,d.dice):duel(f,d.dice)}
  else if(a==='decks'){dlg.close();hide();P()?.open('decks')}else{dlg.close();hide();P()?.open('pantheon')}});
 dlg.addEventListener('cancel',()=>{hide();P()?.open('pantheon')});dlg.addEventListener('close',()=>dlg.remove());document.body.append(dlg);dlg.showModal()}
/* Velmarys : échange le dé le plus puissant du joueur contre « Velmarys des Marées » (n° 65), le temps du duel. */
const GIFT=65;
function gift(f,dice){let k=0;dice.forEach((i,j)=>{const a=game.monsters[i],b=game.monsters[dice[k]];if((a?.lv||0)>(b?.lv||0)||((a?.lv||0)===(b?.lv||0)&&(a?.rarity||0)>(b?.rarity||0)))k=j});
 const taken=dice[k],mine=[...dice];mine[k]=GIFT;
 show({img:'velmarys-cadeau',text:'« Tiens, un cadeau pour ton aventure… »',own:1,
  note:`🎁 Velmarys t’offre ${game.monsters[GIFT].cn}… et garde ton ${game.monsters[taken]?.cn||'dé'} pour ce duel.`,
  actions:[['Retour',()=>{hide();P()?.open('pantheon')}],['⚔ Commencer le duel',()=>duel(f,mine,[taken]),1]]})}
function duel(f,deck,extra=[]){hide();pending={id:f.id};window.__hkDuelOwner='pantheon';document.body.classList.remove('portal-open');location.hash='partie';
 game.start(deck,f.terrain,'story',f.level,{name:f.name,dice:[...extra,...f.dice],power:['sneeze','tactic'].includes(f.power)?f.power:''});window.dispatchEvent(new Event('resize'))}
function after(won){if(!pending||window.__hkDuelOwner!=='pantheon')return;const f=FOES.find(x=>x.id===pending.id);pending=null;if(!f)return;
 setTimeout(()=>{game.pause?.();if(won){const msg=record(f),i=FOES.indexOf(f),nx=FOES[i+1];
   sequence(f.win,[['Retour au Panthéon',()=>{hide();P()?.open('pantheon');if(msg)P()?.toast(msg+(nx?` Prochaine épreuve : ${nx.name}.`:' Vous avez terminé le Panthéon !'))},1]])}
  else show({img:f.meet[f.meet.length-1][0],text:`${f.name} remporte ce duel… Reprenez votre souffle et retentez votre chance !`,actions:[['Retour au Panthéon',()=>{hide();P()?.open('pantheon')}],['⚔ Réessayer',()=>chooseDeck(f),1]]})},2600)}
window.addEventListener('hackenia-player-victory',e=>{if(e.gameMode==='story')after(true)});
window.addEventListener('hackenia-player-defeat',e=>{if(e.gameMode==='story')after(false)});
window.addEventListener('hackenia-player-draw',e=>{if(e.gameMode==='story')after(false)});
/* Pouvoir déclenché en pleine partie : le moteur se met en pause, l’illustration s’affiche, « Continuer » relance la partie. */
window.addEventListener('hackenia:foe-power',e=>{const d=e.detail||{},f=pending&&FOES.find(x=>x.id===pending.id);
 if(!f){game.resume?.();return}
 const resume=()=>{hide();if(!d.over)game.resume?.()};
 if(d.power==='sneeze')setTimeout(()=>show({img:'bosco-eternuement',text:'« Aaaa… AAAAATCHOUUUM ! Oh non ! »',own:1,note:'🤧 Les créatures du plateau échangent leurs places !',actions:[['Continuer →',resume,1]]}),700);
 else if(d.power==='tactic')setTimeout(()=>show({img:'soryan-defi',text:'Soryan — Grand tacticien',note:'♟ Soryan déplace une de ses créatures et déclenche les combats à sa nouvelle position.',actions:[['Continuer →',resume,1]]}),700);
 else resume()});

// ——— Menu du Panthéon ———
function render(el){const pr=prog(),done=FOES.filter(f=>pr.won[f.id]).length;
 el.innerHTML=`<section class="pantheon-hall pth-hall" aria-labelledby="pantheon-title"><span class="portal-kicker">Mode extrêmement difficile</span><h2 id="pantheon-title">Le Panthéon</h2>
 <p>Affrontez les figures légendaires (ou pas) d’Hackénia ! Chaque victoire ouvre l’épreuve suivante.</p>
 <p class="pth-rule">♜ Votre deck : ${MAX_STRONG} dés légendaires ou divins au maximum. · ${done} / ${FOES.length} épreuves remportées</p>
 <ol class="pth-list">${FOES.map((f,i)=>{const un=unlocked(i),won=!!pr.won[f.id];
  return `<li class="pth-foe ${won?'won':un?'open':'locked'}"><span class="pth-thumb" style="background-image:url('${IMG(f.meet[0][0])}')" aria-hidden="true"></span>
   <div class="pth-text"><small>Épreuve ${i+1}${won?' · remportée ✓':''}</small><strong>${esc(f.title)}</strong>
   <span>${un?esc(f.intro):`Battez ${esc(FOES[i-1].name)} pour débloquer ce duel.`}</span>
   ${un&&f.powerText?`<em>✦ ${esc(f.powerText)}</em>`:''}
   <span class="pth-meta">${esc(LEVELS[f.level])} · ${won?'récompense obtenue':`+${f.reward} Bubulles`}</span></div>
   <button type="button" class="${un&&!won?'portal-primary':''}" data-pantheon="${i}" ${un?'':'disabled'}>${un?'⚔ Défier':'🔒'}</button></li>`}).join('')}</ol>
 <button type="button" data-action="home">Retour au menu</button></section>`;
 el.querySelectorAll('[data-pantheon]').forEach(b=>b.addEventListener('click',()=>challenge(+b.dataset.pantheon)))}
window.HackeniaPantheon={render,foes:FOES,unlocked,deckOk,start:challenge};
})();
