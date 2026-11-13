/* Tutoriel guidé d'Hackénia (v178, refondu en v273).
   Quatre leçons courtes, chacune est une mini-partie avec un but et une petite victoire ; chaque leçon réinvestit la précédente :
     1. Place un dé          → apprendre l'écran, la main et le lancer
     2. Traverse le terrain  → déplacer sa créature, prolonger sa route avec un dé, entrer dans le camp adverse (1re façon de gagner)
     3. Les combats          → gagner des duels (2e façon de gagner)
     4. Les affinités        → bonus de terrain et d'élément pour gagner un duel
   Une 5e leçon facultative (« Pour aller plus loin ») couvre les ripostes, le dé bonus, les dés élémentaires et le déroulement d'un tour.
   Il tourne sur le vrai moteur de jeu, sur Le Bois tendre (terrain terre). Chaque étape prépare un plateau précis, surligne en doré
   les cases utiles et attend l'action du joueur (ou joue une courte démonstration). Les lancers sont fixés à l'avance.
   Camp du joueur : ligne du bas (y = 11). Camp adverse : ligne du haut (y = 0). */
(()=>{'use strict';
const T={active:false,l:0,i:0,rolls:[],done:false,demoRunning:false,timer:0,base:null};
const D={kala:37,grimgors:38,fourmi:2,bosco:29,tortue:14,sentierTerre:51,lapin:3};
const KEY='hackenia-tuto-lessons-v1';
const $=id=>document.getElementById(id);
const cycle='Eau › Feu › Glace › Terre › Vent › Foudre › Eau';

// ——— Outils pour préparer un plateau ———
function reset(){b=Array.from({length:H},()=>Array(W).fill(null));cr=[];kills=[0,0];bonus=[0,0];over=0;cur=0;mode='i';moved=0;sel=null;movePlan=null;pc=null;hov=null;anim=null;useB=0;hi=0;die=undefined;cubeCls='';
 pl=[{h:[],q:[],s:0},{h:[],q:[],s:0}];gameEvents.length=0;turnNumber=1;window.HackeniaCombat?.reset?.();msg=''}
function tile(x,y,o,v,el='terre'){b[y][x]={o,el,v,lv:1,id:900+o,mn:'Dalle'}}
function path(x,ys,o,values,el='terre'){ys.forEach((y,k)=>tile(x,y,o,values[k%values.length],el))}
function unit(o,x,y,mi){const d=M[mi],u={o,x,y,em:d.em,id:++DID,mn:d.n,mi,lv:d.lv};cr.push(u);return u}
function mine(){return cr.filter(c=>c.o===0)}
function foes(){return cr.filter(c=>c.o===1)}
function tilesOf(o){return b.flat().filter(t=>t&&t.o===o&&!t.f).length}
function idle(){return !window.HackeniaCombat?.busy&&!busy&&!(anim&&Date.now()<anim.t0+anim.tot+200)}
function rowCells(y){return Array.from({length:W},(_,x)=>[x,y])}
function anchors(m){const out=[];for(let y=H-1;y>=H-3;y--)for(let x=0;x<W;x++){const cs=cellsOf(m,2,{x,y});if(ok(cs,M[m].lv)&&cs.every(([X,Y])=>inb(X,Y)))out.push([x,y])}return out.slice(0,6)}
const atk=(x,y)=>pw(x,y);

/* Placements possibles d'un dé (rotation du joueur) classés du plus haut au plus bas : sert à montrer où prolonger sa route. */
function topAnchors(m,n=1){const out=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const cs=cellsOf(m,2,{x,y});if(cs.every(([X,Y])=>inb(X,Y))&&ok(cs,M[m].lv))out.push({x,y,top:Math.min(...cs.map(c=>c[1])),dx:Math.abs(x-3)})}
 out.sort((a,b)=>a.top-b.top||a.dx-b.dx);return out.slice(0,n).map(o=>[o.x,o.y])}
function progress(){try{return JSON.parse(localStorage.getItem(KEY)||'{}').done||[]}catch{return[]}}
function markDone(id){try{const d=new Set(progress());d.add(id);localStorage.setItem(KEY,JSON.stringify({done:[...d]}))}catch{}}
// Scène de duel commune aux leçons 3 et 4 : une route verticale, deux cases d'attaque (2,6) et (4,6) autour d'un ennemi posé en (3,6).
function duelBoard(a,bT,enemyV,enemyEl=''){reset();path(3,[11,10,9,8],0,[2,3,2,3]);tile(2,8,0,2);tile(4,8,0,2);tile(2,7,0,2);tile(4,7,0,2);
 tile(2,6,0,a.v,a.el);tile(4,6,0,bT.v,bT.el);tile(3,6,1,enemyV,enemyEl);tile(3,5,1,enemyV,enemyEl);unit(0,3,11,D.kala);unit(1,3,6,D.grimgors)}

// ——— Les leçons ———
const LESSONS=[
{id:'place',title:'Place un dé',goal:'Poser ton premier dé sur le plateau.',steps:[
 {title:'Ton écran',kind:'info',
  setup(){reset()},
  targets:()=>[...rowCells(H-1),...rowCells(0)],
  text:()=>`<p>Tu joues <b>en bas</b> (ton camp). L’adversaire joue <b>en haut</b>.</p><p>Chaque leçon est une <b>mini-partie</b> avec un petit but. Ici : <b>poser un dé</b>.</p>`},
 {title:'Ta main de dés',kind:'info',focus:'hand',
  setup(){reset();pl[0].h=[D.fourmi,D.kala,D.tortue,D.bosco,D.sentierTerre]},
  text:()=>`<p>En bas, ta <b>main</b> : tes dés. Chaque carte montre sa <b>forme dépliée</b> et le <b>lancer à réussir</b> (ex. « 1 dé · 4+ »).</p><p>Touche une carte pour ouvrir sa fiche.</p>`},
 {title:'Pose ton premier dé',kind:'action',focus:'hand',
  setup(){reset();pl[0].h=[D.kala];T.rolls=[[4]]},
  targets:()=>anchors(D.kala),
  text:()=>`<p><b>À toi :</b> glisse <b>Kala</b> sur une case dorée, puis appuie sur <b>« Lancer les dés »</b>.</p><p>Il faut <b>4 ou plus</b>.</p>`,
  check:()=>mine().length>0&&mode==='i'&&idle(),
  success:()=>{const k=mine()[0];return `<p>✓ Réussi ! Le dé se déplie en dalles et <b>Kala apparaît</b>.</p><p>Son attaque vaut <b>${k?atk(k.x,k.y):'?'}</b> : la valeur de sa dalle.</p>`}},
 {title:'Quand le lancer rate',kind:'action',focus:'hand',
  setup(){reset();pl[0].h=[D.bosco];T.rolls=[[1,3]]},
  targets:()=>anchors(D.bosco),
  text:()=>`<p><b>Bosco</b> demande <b>4 ou plus</b> avec l’un de ses <b>2 dés</b>. Pose-le et lance : ça va rater.</p>`,
  check:()=>bonus[0]===1&&mode==='i'&&idle(),
  success:()=>`<p>✓ Raté : le dé revient dans ta main et ton tour se termine.</p><p>Consolation : un <b>dé bonus ✦</b> pour un prochain lancer.</p>`},
 {title:'Leçon 1 réussie !',kind:'final',lessonEnd:true,
  setup(){reset()},
  text:()=>`<p>🏆 Tu sais <b>poser un dé</b>.</p><p>Prochaine leçon : <b>traverser le terrain</b> avec ta créature.</p>`}]},
{id:'cross',title:'Traverse le terrain',goal:'Faire entrer une créature dans le camp adverse : une première façon de gagner.',steps:[
 {title:'Avance sur ta route',kind:'action',
  setup(){reset();path(3,[11,10,9,8,7,6],0,[4,2,3,1,5,2]);unit(0,3,11,D.kala)},
  targets:()=>[[3,6]],
  text:()=>`<p><b>À toi :</b> touche <b>Kala</b>, puis la <b>case dorée</b>, puis <b>« Confirmer »</b>.</p><p>Une créature avance aussi loin qu’elle veut, mais seulement sur des <b>dalles reliées</b>.</p>`,
  check:()=>moved&&idle()&&mine()[0]?.y===6,
  retry:()=>moved&&idle()&&mine()[0]?.y!==6,
  success:()=>`<p>✓ Bien avancé ! Mais ta route <b>s’arrête ici</b>…</p>`},
 {title:'Prolonge ta route',kind:'action',focus:'hand',
  setup(){reset();path(3,[11,10,9,8,7,6],0,[4,2,3,1,5,2]);unit(0,3,6,D.kala);pl[0].h=[D.grimgors];T.rolls=[[5]];T.base=tilesOf(0)},
  targets:()=>topAnchors(D.grimgors),
  text:()=>`<p>Ta route s’arrête. <b>À toi :</b> pose <b>Grimgors</b> au bout (case dorée), puis lance.</p><p>Une dalle posée doit <b>toucher tes dalles</b>.</p>`,
  check:()=>tilesOf(0)>T.base&&mode==='i'&&idle(),
  success:()=>`<p>✓ Ta route est plus longue ! Chaque dé posé peut <b>prolonger ton chemin</b>.</p>`},
 {title:'Entre dans le camp adverse',kind:'action',
  setup(){reset();path(3,[11,10,9,8,7,6,5,4,3,2,1,0],0,[2,3,2,4,2,3,1,4,3,2,3,2]);unit(0,3,5,D.kala)},
  targets:()=>[[3,0]],
  text:()=>`<p>La route est complète ! <b>À toi :</b> amène Kala dans la <b>ligne du haut</b> (case dorée).</p>`,
  check:()=>pl[0].s>=1&&idle(),
  retry:()=>moved&&idle()&&pl[0].s<1,
  success:()=>`<p>✓ <b>Un passage !</b> Faire entrer <b>2 créatures</b> dans le camp adverse, c’est gagner la partie.</p><p>La créature quitte le plateau avec tout le chemin relié sur lequel elle se trouvait.</p>`},
 {title:'Leçon 2 réussie !',kind:'final',lessonEnd:true,
  setup(){reset()},
  text:()=>`<p>🏆 Tu sais <b>poser des dés</b> et <b>traverser le terrain</b> : tu peux déjà gagner une partie !</p><p>Prochaine leçon : <b>les combats</b>.</p>`}]},
{id:'fight',title:'Les combats',goal:'Remporter 2 duels : la deuxième façon de gagner (4 duels en partie normale).',steps:[
 {title:'Ton premier duel',kind:'action',
  setup(){reset();path(3,[10,9,8,7],0,[5,5,5,5],'vent');unit(0,3,10,D.kala);tile(4,7,1,2,'vent');tile(4,6,1,2,'vent');unit(1,4,7,D.grimgors)},
  targets:()=>[[3,7]],
  text:()=>`<p>Un ennemi ! Touche-le pour voir son attaque (<b>${atk(4,7)}</b>), puis Kala (<b>5</b>).</p><p><b>À toi :</b> avance Kala à côté de lui (case dorée) : <b>la plus forte attaque gagne</b>.</p>`,
  check:()=>kills[0]>=1&&idle(),
  retry:()=>moved&&idle()&&kills[0]<1,
  success:()=>`<p>✓ <b>Duel gagné !</b> 1 duel sur 2.</p><p>Une créature s’arrête toujours au contact d’un ennemi : impossible de passer sans combattre.</p>`},
 {title:'Quand on perd',kind:'demo',demoLabel:'Voir le combat',
  setup(){reset();path(3,[10,9,8,7],0,[2,2,2,2],'vent');unit(0,3,10,D.kala);tile(4,7,1,6,'vent');tile(4,6,1,6,'vent');unit(1,4,7,D.grimgors);kills[0]=1},
  targets:()=>[[3,7],[4,7]],
  demo(){cur=0;mv(mine()[0],3,7);render()},
  check:()=>kills[1]>=1&&idle(),
  text:()=>`<p>Cette fois, Kala n’a que <b>2</b> d’attaque, et l’ennemi <b>6</b>. Que se passe-t-il si elle s’approche ?</p>`,
  success:()=>`<p>✗ <b>Kala a perdu</b> et disparaît : l’adversaire marque un duel.</p><p><b>Compare toujours les attaques avant d’avancer.</b> À égalité, les deux créatures disparaissent.</p>`},
 {title:'Attaque directe : le 2e duel',kind:'action',
  setup(){reset();path(3,[9,8,7],0,[2,1,5],'vent');tile(3,6,1,3,'vent');tile(3,5,1,3,'vent');unit(0,3,9,D.kala);unit(1,3,6,D.grimgors);kills[0]=1},
  targets:()=>[[3,6]],
  text:()=>`<p>Tu peux aussi viser <b>directement la case</b> de l’ennemi. <b>À toi :</b> touche Kala, puis la <b>case dorée de l’ennemi</b>, puis confirme.</p><p>Ta force est celle de la <b>dernière case de ton trajet</b> (ici un 5), pas de ta case de départ : <b>5</b> contre <b>${atk(3,6)}</b>.</p>`,
  check:()=>kills[0]>=2&&idle(),
  retry:()=>moved&&idle()&&kills[0]<2,
  success:()=>`<p>✓ <b>2 duels remportés !</b> Ta créature prend la place de l’ennemi vaincu.</p><p>En partie normale, il en faut <b>4</b> pour gagner.</p>`},
 {title:'Leçon 3 réussie !',kind:'final',lessonEnd:true,suggestPlay:true,
  setup(){reset()},
  text:()=>`<p>🏆 Tu sais <b>poser, avancer et combattre</b> : tu peux déjà tenter une <b>partie contre l’IA facile</b> !</p><p>Prochaine leçon (au choix) : <b>les affinités</b>, pour gagner encore plus de duels.</p>`}]},
{id:'affinity',title:'Les affinités',goal:'Utiliser les bonus de terrain et d’élément pour gagner un duel.',steps:[
 {title:'Le bonus de terrain',kind:'action',
  setup(){duelBoard({v:3,el:'vent'},{v:3,el:'terre'},3)},
  targets:()=>[[2,6],[4,6]],
  text:()=>`<p>Le terrain est <b>Le Bois tendre</b> : les dalles de <b>terre</b> gagnent <b>+1</b>. L’ennemi a <b>3</b> d’attaque.</p><p><b>À toi :</b> deux cases permettent d’attaquer (vent ou terre, toutes deux à 3). <b>Choisis la bonne</b> !</p>`,
  check:()=>kills[0]>=1&&mine().length>0&&idle(),
  retry:()=>moved&&idle()&&!(kills[0]>=1&&mine().length>0),
  success:()=>`<p>✓ <b>Duel gagné !</b> Sur la dalle de <b>terre</b>, 3 + 1 = <b>4</b> contre 3.</p><p>Sur la dalle de vent, c’était une égalité.</p>`},
 {title:'Le bonus de voisin',kind:'action',
  setup(){duelBoard({v:3,el:'terre'},{v:3,el:'terre'},4);tile(1,6,1,1,'vent')},
  targets:()=>[[2,6],[4,6]],
  text:()=>`<p>L’ennemi a <b>4</b>. Les deux dalles sont de <b>terre</b> (+1 terrain), mais l’une a une dalle de <b>vent</b> pour voisine : la terre <b>domine</b> le vent, <b>+1 de plus</b>. <b>Choisis-la !</b></p>`,
  check:()=>kills[0]>=1&&mine().length>0&&idle(),
  retry:()=>moved&&idle()&&!(kills[0]>=1&&mine().length>0),
  success:()=>`<p>✓ <b>Duel gagné !</b> 3 + 1 (terrain) + 1 (voisin) = <b>5</b> contre 4.</p><p>Chaque élément domine le suivant : <b>${cycle}</b>.</p>`},
 {title:'Leçon 4 réussie !',kind:'final',lessonEnd:true,
  setup(){reset()},
  text:()=>`<p>🏆 Tu connais les <b>affinités</b> : bonus de <b>terrain</b> (+1) et bonus de <b>voisin</b> (+1).</p><p>En partie, la <b>roue des éléments</b> à droite du plateau te rappelle qui domine qui.</p>`}]},
{id:'more',title:'Pour aller plus loin',optional:true,goal:'Se défendre et maîtriser les petits plus.',steps:[
 {title:'Attention aux ripostes',kind:'demo',demoLabel:'Voir le tour adverse',
  setup(){reset();path(4,[8,7,6],0,[2,2,2],'vent');unit(0,4,6,D.kala);path(4,[3,4,5],1,[6,6,6],'vent');unit(1,4,3,D.grimgors)},
  targets:()=>[[4,5],[4,6]],
  demo(){cur=1;mv(foes()[0],4,5);render()},
  check:()=>kills[1]>=1&&idle(),
  text:()=>`<p>L’adversaire joue aussi ! Une créature ennemie forte (<b>6</b>) peut atteindre une case voisine de Kala (<b>2</b>).</p>`,
  success:()=>`<p>✗ L’ennemi s’est approché : <b>Kala est battue</b>.</p><p>Avant de finir ton tour, regarde <b>quels ennemis peuvent t’atteindre</b>.</p>`},
 {title:'Dé bonus et paire magique',kind:'action',focus:'hand',
  setup(){reset();pl[0].h=[D.bosco];bonus[0]=1;T.rolls=[[2]]},
  targets:()=>anchors(D.bosco),
  text:()=>`<p>Repose <b>Bosco</b>. Dans la barre de lancer, active <b>« Dé bonus ✦ »</b> (3 dés au lieu de 2), puis lance !</p><p>Si <b>tous les dés montrent la même face</b>, l’invocation réussit toujours.</p>`,
  check:()=>mine().length>0&&mode==='i'&&idle(),
  success:()=>`<p>✓ <b>Dés identiques : invocation magique !</b> Bosco apparaît malgré des 2.</p><p>Tu gagnes un dé bonus après chaque échec (2 au plus en réserve).</p>`},
 {title:'Les dés élémentaires',kind:'action',focus:'hand',
  setup(){reset();path(3,[11,10,9],0,[3,2,3]);path(3,[6,5],0,[2,4]);unit(0,3,9,D.kala);pl[0].h=[D.sentierTerre];T.base=tilesOf(0)},
  targets:()=>[[3,8],[3,7]],
  text:()=>`<p>Ta route a un <b>trou</b>. Le <b>Sentier de terre</b> est un dé élémentaire : <b>sans lancer</b> et <b>sans créature</b>.</p><p><b>À toi :</b> glisse-le sur la case dorée la plus proche de Kala, puis <b>« Poser le dé élémentaire »</b>.</p>`,
  check:()=>tilesOf(0)>T.base&&mode==='i'&&idle(),
  success:()=>`<p>✓ <b>Posé sans lancer !</b> Idéal pour relier une route ou préparer une bonne dalle.</p>`},
 {title:'Un tour, en bref',kind:'info',focus:'header',
  setup(){reset();path(3,[11,10,9],0,[3,2,3]);unit(0,3,10,D.kala);path(4,[0,1,2],1,[3,3,3]);unit(1,4,1,D.grimgors);pl[0].h=[D.fourmi,D.tortue,D.bosco,D.lapin,D.sentierTerre]},
  text:()=>`<p><b>À chaque tour :</b></p><ol><li><b>Si tu veux</b>, déplace <b>une</b> créature.</li><li><b>Puis pose un dé</b> : le tour se termine.</li></ol><p>Un dé de <b>niveau supérieur</b> posé sur une créature adverse l’<b>écrase</b>. En haut : les scores, ta <b>Bourse</b> et l’<b>Historique</b>.</p>`},
 {title:'Tu es prêt !',kind:'final',lessonEnd:true,
  setup(){reset()},
  text:()=>`<p>🏆 <b>Pour gagner :</b> 2 créatures dans le camp adverse, <b>ou</b> 4 duels remportés.</p><p>Bonne aventure dans Hackénia !</p>`}]}
];
const TOTAL=LESSONS.reduce((n,l)=>n+l.steps.length,0);
const lesson=()=>LESSONS[T.l],step=()=>LESSONS[T.l].steps[T.i];

// ——— Menu des leçons ———
function hubEl(){let h=document.getElementById('tuto-hub');if(!h){h=document.createElement('section');h.id='tuto-hub';h.setAttribute('role','dialog');h.setAttribute('aria-modal','true');h.setAttribute('aria-labelledby','tuto-hub-title');document.body.append(h);
 h.addEventListener('click',e=>{const a=e.target.closest('[data-tuto]');if(!a)return;const k=a.dataset.tuto;if(k==='lesson')begin(+a.dataset.l);else if(k==='hub-quit'){closeHub();window.HackeniaPortal?.afterTutorial?.()}})}return h}
function closeHub(){document.getElementById('tuto-hub')?.remove();document.body.classList.remove('tuto-hub-open')}
function showHub(){const done=new Set(progress()),next=LESSONS.findIndex(l=>!l.optional&&!done.has(l.id)),h=hubEl();document.body.classList.add('tuto-hub-open');
 h.innerHTML=`<div class="tuto-hub-card"><h2 id="tuto-hub-title">Apprendre à jouer</h2><p class="tuto-hub-intro">Quatre petites leçons, une <b>mini-partie</b> chacune, environ une minute. Chaque leçon s’appuie sur la précédente.</p>
 <ol class="tuto-lessons">${LESSONS.map((l,k)=>{const d=done.has(l.id),isNext=k===next;return `<li class="${d?'done':''}${isNext?' next':''}${l.optional?' optional':''}"><button type="button" data-tuto="lesson" data-l="${k}"><span class="num" aria-hidden="true">${d?'✓':l.optional?'★':k+1}</span><span class="txt"><b>${l.optional?'':'Leçon '+(k+1)+' · '}${l.title}</b><small>${l.goal}</small></span><span class="go" aria-hidden="true">${isNext?'Commencer ▶':d?'Rejouer':'▶'}</span></button></li>`}).join('')}</ol>
 <div class="tuto-hub-actions"><button type="button" data-tuto="hub-quit">Retour au menu</button></div></div>`;
 h.querySelector('.next button, li button')?.focus?.()}

// ——— Panneau du guide ———
function coach(){let c=$('tuto-coach');if(!c){c=document.createElement('section');c.id='tuto-coach';c.setAttribute('aria-live','polite');c.setAttribute('aria-label','Tutoriel');place(c);
 c.addEventListener('click',e=>{const a=e.target.closest('[data-tuto]')?.dataset.tuto;if(!a)return;if(a==='min'){T.min=!T.min;draw();return}if(a==='next')go(T.i+1);else if(a==='prev')go(T.i-1);else if(a==='retry')go(T.i);else if(a==='quit')stop(true);else if(a==='demo')runDemo();
  else if(a==='menu'){stop(false);showHub()}else if(a==='again')begin(T.l);else if(a==='nextlesson'){const n=T.l+1;if(n<LESSONS.length)begin(n)}else if(a==='play'){stop(false);window.HackeniaPortal?.afterTutorial?.()}})}return c}
// Le panneau se pose toujours par-dessus le plateau : celui-ci garde toute sa taille (PC comme téléphone).
const wide=window.matchMedia?.('(min-width:900px)');
function place(c=$('tuto-coach')){if(!c)return;const bw=$('bw');if(c.parentElement!==bw)bw.append(c)}
wide?.addEventListener?.('change',()=>{place();window.dispatchEvent(new Event('resize'))});
function draw(){const L=lesson(),s=step(),c=coach(),n=L.steps.length,canNext=s.kind==='info'||T.done,isEnd=!!s.lessonEnd,last=T.l===LESSONS.length-1;
 const status=s.kind==='action'?(T.done?'':T.retry?'<p class="tuto-retry">Pas tout à fait ! Appuie sur « Recommencer » pour réessayer.</p>':'<p class="tuto-todo">⟶ À toi de jouer.</p>'):'';
 const dots=L.steps.map((_,k)=>`<i class="${k<T.i||(k===T.i&&(canNext||isEnd))?'on':''}${k===T.i?' cur':''}"></i>`).join('');
 const footer=isEnd?`${T.i>0?'<button type="button" data-tuto="prev">← Précédent</button>':''}<button type="button" data-tuto="again">Rejouer la leçon</button><button type="button" data-tuto="menu">Menu des leçons</button>${last?'<button type="button" class="tuto-main" data-tuto="play">Terminer et jouer</button>':`<button type="button" class="tuto-main" data-tuto="nextlesson">${LESSONS[T.l+1].optional?'Pour aller plus loin':'Leçon suivante'} ▶</button>`}`
  :`${T.i>0?'<button type="button" data-tuto="prev">← Précédent</button>':''}${s.kind!=='info'?'<button type="button" data-tuto="retry">Recommencer</button>':''}${s.kind==='demo'&&!T.done&&!T.demoRunning?`<button type="button" class="tuto-main" data-tuto="demo">${s.demoLabel} ▶</button>`:''}<button type="button" class="tuto-main" data-tuto="next" ${canNext?'':'disabled'}>Suivant →</button>`;
 c.innerHTML=`<header><span class="tuto-kicker">${L.optional?'Bonus':'Leçon '+(T.l+1)+'/'+LESSONS.filter(l=>!l.optional).length} · ${L.title}</span><span class="tuto-head-btns"><button type="button" class="tuto-min" data-tuto="min" aria-expanded="${!T.min}">${T.min?'Afficher ▾':'Réduire ▴'}</button><button type="button" class="tuto-quit" data-tuto="quit" aria-label="Quitter le tutoriel">Quitter ✕</button></span></header>
 <div class="tuto-dots" aria-hidden="true">${dots}</div>
 <h2>${s.title}</h2>${isEnd?'':`<p class="tuto-goal">🎯 ${L.goal}</p>`}<div class="tuto-text">${T.done&&s.success?s.success():s.text()}</div>${status}
 <footer>${footer}</footer>`;
 c.classList.toggle('min',!!T.min);c.classList.toggle('lesson-end',isEnd);document.body.dataset.tutoFocus=T.done?'':s.focus||''}
function go(i){const L=lesson();if(i<0||i>=L.steps.length)return;T.i=i;T.done=false;T.retry=false;T.demoRunning=false;T.rolls=[];closeCard?.();window.hideHandHover?.();L.steps[i].setup();msg=L.steps[i].kind==='action'?'Suis les consignes du tutoriel.':'';if(L.steps[i].lessonEnd)markDone(L.id);render();draw();window.dispatchEvent(new Event('resize'))}
function runDemo(){const s=step();if(!s.demo||T.demoRunning)return;T.demoRunning=true;draw();s.demo()}
function freeze(){cur=0;mode='t';sel=null;movePlan=null;msg=String(msg).split(P[1]+' : glisse')[0].split(P[0]+' : glisse')[0].trim();render()}
function tick(){if(!T.active)return;if(document.body.classList.contains('portal-open')){stop(false);return}const s=step();if(T.done||!s.check)return;
 if(s.check()){T.done=true;T.demoRunning=false;freeze();draw()}else if(s.retry&&!T.retry&&s.retry()){T.retry=true;draw()}}

// ——— Repères dorés sur le plateau (couche HTML au-dessus du rendu 3D, recalée à chaque image) ———
function cellPoint(x,y){const v=window.HackeniaView;if(v?.active&&v.cellScreen)return v.cellScreen(x,y);const bd=$('bd');if(!bd)return null;const r=bd.getBoundingClientRect();return{x:r.left+(x+.5)*r.width/W,y:r.top+(y+.5)*r.height/H}}
function drawMarks(){if(!T.active)return;let layer=$('tuto-marks');if(!layer){layer=document.createElement('div');layer.id='tuto-marks';layer.setAttribute('aria-hidden','true');document.body.append(layer)}
 const list=targets()||[],hidden=!$('fiche')?.hidden||document.querySelector('dialog[open]');while(layer.children.length<list.length){const m=document.createElement('i');m.className='tuto-mark';layer.append(m)}while(layer.children.length>list.length)layer.lastChild.remove();
 const box=$('tuto-coach')?.getBoundingClientRect();list.forEach(([x,y],k)=>{const p=cellPoint(x,y),m=layer.children[k];if(!p||hidden||(box&&p.x>box.left-4&&p.x<box.right+4&&p.y>box.top-4&&p.y<box.bottom+30)){m.style.display='none';return}m.style.display='';m.style.transform=`translate(${p.x}px,${p.y}px)`});T.raf=requestAnimationFrame(drawMarks)}

// ——— Démarrer / quitter ———
// start() ouvre le menu des leçons ; start(n) lance directement la leçon n (0 à 4).
function start(n){if(Number.isInteger(n)&&LESSONS[n])begin(n);else showHub()}
function begin(l){closeHub();if(T.active){clearInterval(T.timer);cancelAnimationFrame(T.raf)}T.l=l;T.i=0;T.done=false;T.rolls=[];ONLINE=null;ai=false;chosenDeck=null;TER=TL.indexOf('terre');gamePaused=false;matchStarted=false;window.HackeniaPortal&&document.body.classList.remove('portal-open');document.body.classList.add('tutorial-mode');location.hash='partie';init();P[0]=window.HackeniaSettings?.get?.().playerName||'Toi';P[1]='Adversaire';T.active=true;T.min=false;clearInterval(T.timer);T.timer=setInterval(tick,250);go(0);cancelAnimationFrame(T.raf);T.raf=requestAnimationFrame(drawMarks);window.dispatchEvent(new Event('resize'))}
function stop(toMenu){closeHub();if(!T.active){if(toMenu)window.HackeniaPortal?.afterTutorial?.();return}T.active=false;clearInterval(T.timer);cancelAnimationFrame(T.raf);$('tuto-marks')?.remove();T.rolls=[];document.body.classList.remove('tutorial-mode');delete document.body.dataset.tutoFocus;$('tuto-coach')?.remove();window.hackeniaGame.resetSession();if(toMenu)window.HackeniaPortal?.afterTutorial?.()}
function nextRoll(n){if(!T.active||!T.rolls.length)return null;const r=T.rolls.shift();return Array.from({length:n},(_,k)=>r[k%r.length])}
function targets(){if(!T.active||T.done)return null;const t=step()?.targets;return t?t():null}
window.HackeniaTutorial={start,stop,nextRoll,targets,_test:{LESSONS,go,begin,tick,draw,runDemo,progress,markDone,get T(){return T}},lessons:LESSONS.map(l=>({id:l.id,title:l.title,steps:l.steps.length,optional:!!l.optional})),get active(){return T.active},get lesson(){return T.l},get showWheel(){return !T.active||T.l>=3},/* la roue des éléments n'apparaît qu'à partir de la leçon sur les affinités */get step(){return T.i},steps:TOTAL};
})();
