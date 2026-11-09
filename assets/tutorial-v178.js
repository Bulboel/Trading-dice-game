/* Tutoriel guidé d'Hackénia (v178).
   Il tourne sur le vrai moteur de jeu, sur la Clairière des murmures (terrain terre).
   Chaque étape prépare un plateau précis, explique la règle, surligne en doré les cases utiles
   et attend l'action du joueur (ou joue une courte démonstration). Les lancers de dés sont fixés
   à l'avance pour montrer à coup sûr une réussite, un échec ou une paire magique.
   Camp du joueur : ligne du bas (y = 9). Camp adverse : ligne du haut (y = 0). */
(()=>{'use strict';
const T={active:false,i:0,rolls:[],done:false,demoRunning:false,timer:0,base:null};
const D={kala:37,grimgors:38,fourmi:2,bosco:29,tortue:14,sentierTerre:51,lapin:3};
const $=id=>document.getElementById(id);
const cycle='Eau › Foudre › Vent › Terre › Glace › Feu › Eau';

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

// ——— Les étapes ———
const steps=[
{title:'Bienvenue à Hackénia !',kind:'info',
 setup(){reset()},
 targets:()=>[...rowCells(H-1),...rowCells(0)],
 text:()=>`<p>Le plateau compte <b>8 colonnes et 10 lignes</b>. Ton camp est la <b>ligne du bas</b>, celui de l’adversaire la <b>ligne du haut</b> (surlignées en doré).</p>
 <p><b>Deux façons de gagner :</b></p><ul><li>faire entrer <b>2 créatures</b> dans le camp adverse ;</li><li>ou remporter <b>3 duels</b>.</li></ul>
 <p>Tu joues ici sur la <b>Clairière des murmures</b> : les dés de <b>terre</b> y gagnent <b>+1</b> en attaque.</p>`},
{title:'Ta main de dés',kind:'info',focus:'hand',
 setup(){reset();pl[0].h=[D.fourmi,D.kala,D.tortue,D.bosco,D.sentierTerre]},
 text:()=>`<p>En bas, ta <b>main</b> : jusqu’à 5 dés tirés de ta bourse. Chaque carte montre :</p>
 <ul><li>la <b>forme du dé déplié</b> et la valeur de chaque dalle ;</li><li>son <b>élément</b> et son <b>niveau</b> ;</li><li>le <b>lancer</b> à réussir, par exemple « 1 dé · 3+ ».</li></ul>
 <p>Touche une carte pour ouvrir sa fiche. Sur ordinateur, il suffit de la survoler.</p>`},
{title:'Poser un dé et le lancer',kind:'action',focus:'hand',
 setup(){reset();pl[0].h=[D.kala];T.rolls=[[4]]},
 targets:()=>anchors(D.kala),
 text:()=>`<p><b>À toi :</b> fais glisser le dé <b>Kala</b> sur une case dorée, puis appuie sur <b>« Lancer les dés »</b>.</p>
 <p>Un dé doit toucher <b>tes deux premières lignes</b> ou <b>une de tes dalles</b>. Kala demande <b>3 ou plus</b> avec 1 dé.</p>`,
 check:()=>mine().length>0&&mode==='i'&&idle(),
 success:()=>{const k=mine()[0];return `<p>✓ Réussi ! Le dé se déplie en dalles et <b>Kala apparaît sur la face la plus forte</b>.</p><p>Son attaque vaut <b>${k?atk(k.x,k.y):'?'}</b> : la valeur de sa dalle, <b>+1</b> parce que Kala est de terre sur un terrain de terre.</p><p>Poser un dé <b>termine ton tour</b>.</p>`}},
{title:'Un lancer raté',kind:'action',focus:'hand',
 setup(){reset();pl[0].h=[D.bosco];T.rolls=[[1,3]]},
 targets:()=>anchors(D.bosco),
 text:()=>`<p><b>Bosco</b> est légendaire : il faut <b>5 ou plus</b> avec l’un de ses <b>2 dés</b>. Pose-le et lance… ce lancer va rater.</p>`,
 check:()=>bonus[0]===1&&mode==='i'&&idle(),
 success:()=>`<p>✓ Raté : <b>le dé revient dans ta main</b> et ton tour se termine.</p><p>Consolation : tu gagnes un <b>dé bonus ✦</b>. Il ajoute un dé à un prochain lancer.</p>`},
{title:'Dé bonus et paire magique',kind:'action',focus:'hand',
 setup(){reset();pl[0].h=[D.bosco];bonus[0]=1;T.rolls=[[2]]},
 targets:()=>anchors(D.bosco),
 text:()=>`<p>Repose <b>Bosco</b>. Dans la barre de lancer, active <b>« Dé bonus ✦ »</b> : tu lanceras 3 dés au lieu de 2. Puis lance !</p>
 <p>À savoir : si <b>tous tes dés montrent la même face</b>, c’est une <b>paire</b> ou un <b>trio magique</b>. L’invocation réussit toujours, même sous le résultat demandé.</p>`,
 check:()=>mine().length>0&&mode==='i'&&idle(),
 success:()=>`<p>✓ <b>Dés identiques : invocation magique !</b> Bosco apparaît malgré des 2.</p><p>Chaque dé bonus ne sert qu’une fois. Tu en gagnes un après chaque échec, et tu peux en garder <b>jusqu’à 2</b> : à ton choix, ajoute-les un par un ou les deux à la fois pour mettre toutes les chances de ton côté.</p>`},
{title:'Déplacer une créature',kind:'action',
 setup(){reset();path(3,[9,8,7,6,5,4],0,[4,2,3,1,5,2]);unit(0,3,9,D.kala)},
 targets:()=>[[3,5]],
 text:()=>`<p><b>À toi :</b> touche <b>Kala</b>. Les cases lumineuses montrent où elle peut aller. Touche la <b>case dorée</b>, puis <b>« Confirmer »</b>.</p>
 <p>Une créature avance <b>aussi loin qu’elle veut</b>, mais <b>seulement sur des dalles reliées</b>. Tu peux déplacer <b>une créature par tour</b>, avant de poser un dé.</p>`,
 check:()=>moved&&idle()&&mine()[0]?.y===5,
 retry:()=>moved&&idle()&&mine()[0]?.y!==5,
 success:()=>{const k=mine()[0];return `<p>✓ Bien joué ! Regarde : l’attaque de Kala vaut maintenant <b>${atk(k.x,k.y)}</b>, contre 5 au départ.</p><p><b>La force d’une créature dépend de la dalle où elle se trouve</b> : choisis bien ta case avant un combat.</p>`}},
{title:'Les bonus élémentaires',kind:'info',
 setup(){reset();path(3,[9,8,7,6],0,[2,2,2,3]);tile(4,6,1,1,'glace');unit(0,3,6,D.kala);unit(1,6,1,D.grimgors);tile(6,1,1,4,'eau')},
 targets:()=>[[3,6],[4,6]],
 text:()=>`<p>L’attaque, c’est la <b>valeur de la dalle</b>, plus deux bonus possibles :</p>
 <ul><li><b>+1 terrain</b> : la dalle a l’élément du terrain (ici, la terre) ;</li><li><b>+1 voisin</b> : une dalle voisine a l’élément que le tien domine.</li></ul>
 <p>Ici, Kala est sur une dalle de terre de <b>3</b>, à côté d’une dalle de <b>glace</b> : 3 + 1 + 1 = <b>${atk(3,6)}</b>.</p>
 <p>Chaque élément domine le suivant : <b>${cycle}</b>.</p>`},
{title:'Combat au contact',kind:'action',
 setup(){reset();path(3,[8,7,6,5],0,[5,5,5,5],'vent');unit(0,3,8,D.kala);tile(4,5,1,2,'vent');tile(4,4,1,2,'vent');unit(1,4,5,D.grimgors)},
 targets:()=>[[3,5]],
 text:()=>`<p>Un ennemi est en vue ! Touche l’ennemi pour voir son attaque (<b>${atk(4,5)}</b>), puis la tienne (<b>5</b>).</p>
 <p><b>À toi :</b> avance Kala sur la <b>case dorée</b>, juste à côté de lui. <b>Arriver à côté d’un ennemi déclenche un combat</b> : la plus forte attaque gagne.</p>`,
 check:()=>kills[0]>=1&&idle(),
 retry:()=>moved&&idle()&&kills[0]<1,
 success:()=>`<p>✓ <b>Duel gagné !</b> La créature adverse disparaît. Plus que <b>2 duels</b> pour gagner la partie.</p><p>Une créature s’arrête toujours au contact d’un ennemi : impossible de passer à côté sans combattre.</p>`},
{title:'Combat perdu',kind:'demo',demoLabel:'Voir le combat',
 setup(){reset();path(3,[8,7,6,5],0,[2,2,2,2],'vent');unit(0,3,8,D.kala);tile(4,5,1,6,'vent');tile(4,4,1,6,'vent');unit(1,4,5,D.grimgors)},
 targets:()=>[[3,5],[4,5]],
 demo(){cur=0;mv(mine()[0],3,5);render()},
 check:()=>kills[1]>=1&&idle(),
 text:()=>`<p>Cette fois, Kala n’a que <b>2</b> d’attaque, et l’ennemi <b>6</b>. Que se passe-t-il si elle s’approche ?</p>`,
 success:()=>`<p>✗ <b>Kala a perdu</b> : elle disparaît, et l’adversaire marque un duel.</p><p>Avant d’avancer, <b>touche les créatures adverses</b> pour comparer les attaques.</p>`},
{title:'Égalité',kind:'demo',demoLabel:'Voir le combat',
 setup(){reset();path(3,[8,7,6,5],0,[4,4,4,4],'vent');unit(0,3,8,D.kala);tile(4,5,1,4,'vent');tile(4,4,1,4,'vent');unit(1,4,5,D.grimgors)},
 targets:()=>[[3,5],[4,5]],
 demo(){cur=0;mv(mine()[0],3,5);render()},
 check:()=>moved&&idle(),
 text:()=>`<p>Et si les deux attaques sont égales (<b>4 contre 4</b>) ?</p>`,
 success:()=>`<p>= <b>Les deux créatures disparaissent.</b> Chaque camp ajoute une créature battue à son compteur.</p><p>Si les deux camps atteignent trois créatures battues sur ce combat, la partie se termine par un <b>match nul</b>.</p>`},
{title:'Attaque directe',kind:'action',
 setup(){reset();path(3,[7,6,5],0,[2,1,5],'vent');tile(3,4,1,3,'vent');tile(3,3,1,3,'vent');unit(0,3,7,D.kala);unit(1,3,4,D.grimgors)},
 targets:()=>[[3,4]],
 text:()=>`<p>Tu peux aussi attaquer <b>directement la case</b> d’un ennemi.</p>
 <p><b>À toi :</b> touche Kala, puis la <b>case dorée de l’ennemi</b> (elle s’allume en rouge). Ou touche l’ennemi et choisis <b>« Préparer l’attaque »</b>. Puis confirme.</p>
 <p>Ta force est celle de la <b>dernière case de ton trajet, juste à côté de l’ennemi</b>, et non celle de ta case de départ. Ici, Kala est sur un <b>2</b> mais attaque depuis le <b>5</b> : 5 contre <b>${atk(3,4)}</b>.</p>`,
 check:()=>kills[0]>=1&&idle(),
 retry:()=>moved&&idle()&&kills[0]<1,
 success:()=>`<p>✓ <b>Victoire !</b> Ta créature <b>prend la place</b> de l’ennemi vaincu.</p><p>En cas de défaite, c’est elle qui disparaît. À attaque égale, les deux disparaissent et chaque camp compte une créature battue.</p>`},
{title:'Attention aux ripostes',kind:'demo',demoLabel:'Voir le tour adverse',
 setup(){reset();path(4,[6,5,4],0,[2,2,2],'vent');unit(0,4,4,D.kala);path(4,[1,2,3],1,[6,6,6],'vent');unit(1,4,1,D.grimgors)},
 targets:()=>[[4,3],[4,4]],
 demo(){cur=1;mv(foes()[0],4,3);render()},
 check:()=>kills[1]>=1&&idle(),
 text:()=>`<p>L’adversaire joue aussi ! Ici, une créature ennemie forte (<b>6</b>) peut atteindre une case voisine de Kala (<b>2</b>).</p>`,
 success:()=>`<p>✗ L’ennemi s’est approché : <b>combat au contact, Kala est battue</b>.</p><p>Avant de finir ton tour, regarde <b>quels ennemis peuvent t’atteindre</b>. L’IA, elle, y pense toujours !</p>`},
{title:'Entrer dans le camp adverse',kind:'action',
 setup(){reset();path(3,[9,8,7,6,5,4,3,2,1,0],0,[2,3,2,4,2,3,1,4,3,2]);unit(0,3,2,D.kala)},
 targets:()=>[[3,0]],
 text:()=>`<p>Ton chemin de dalles va jusqu’à la ligne du haut : le <b>camp adverse</b>.</p><p><b>À toi :</b> amène Kala sur la <b>case dorée</b>.</p>`,
 check:()=>pl[0].s>=1&&idle(),
 retry:()=>moved&&idle()&&pl[0].s<1,
 success:()=>`<p>✓ <b>Un passage ! 1 point sur 2.</b></p><p>En contrepartie, la créature quitte le plateau <b>avec tout le chemin relié</b> sur lequel elle se trouvait. Les autres créatures sur ce chemin disparaissent aussi.</p><p>Il faudra reconstruire une route pour le second passage.</p>`},
{title:'Les dés élémentaires',kind:'action',focus:'hand',
 setup(){reset();path(3,[9,8,7],0,[3,2,3]);path(3,[4,3],0,[2,4]);unit(0,3,7,D.kala);pl[0].h=[D.sentierTerre];T.base=tilesOf(0)},
 targets:()=>[[3,6],[3,5]],
 text:()=>`<p>Ton chemin a un <b>trou</b> (cases dorées). Le <b>Sentier de terre</b> est un <b>dé élémentaire</b> : 2 dalles (3 et 2), <b>sans lancer</b> et <b>sans créature</b>.</p>
 <p><b>À toi :</b> fais glisser le Sentier sur la <b>case dorée la plus proche de Kala</b>, puis appuie sur <b>« Poser le dé élémentaire »</b>.</p>
 <p>On ne peut pas poser une dalle <b>sous une créature</b>. Les autres faces du dé, elles, se posent normalement.</p>`,
 check:()=>tilesOf(0)>T.base&&mode==='i'&&idle(),
 success:()=>`<p>✓ <b>Posé sans lancer !</b> Les dés élémentaires servent à relier un chemin ou à poser une bonne dalle sous ta future route.</p><p>Comme les autres dés, ils terminent ton tour et retournent dans ta bourse.</p>`},
{title:'Le déroulement d’un tour',kind:'info',focus:'header',
 setup(){reset();path(3,[9,8,7],0,[3,2,3]);unit(0,3,8,D.kala);path(4,[0,1,2],1,[3,3,3]);unit(1,4,1,D.grimgors);pl[0].h=[D.fourmi,D.tortue,D.bosco,D.lapin,D.sentierTerre]},
 text:()=>`<p><b>À chaque tour :</b></p><ol><li><b>Si tu veux</b>, déplace <b>une</b> de tes créatures.</li><li><b>Puis pose un dé</b> : cela termine ton tour.</li></ol>
 <p>En haut de l’écran : les <b>scores</b> (passages ⚑, duels ⚔), ta <b>Bourse</b> (les dés qu’il te reste à piocher) et l’<b>Historique</b> de la partie.</p>`},
{title:'Tu es prêt !',kind:'final',
 setup(){reset()},
 text:()=>`<p><b>Pour gagner :</b> 2 créatures dans le camp adverse, <b>ou</b> 3 duels remportés.</p>
 <ul><li>Pose tes dés près de ton camp ou de tes dalles, et trace ton chemin.</li><li>Choisis bien la dalle d’arrivée : elle donne la force.</li><li>Compare les attaques avant chaque combat.</li><li>Utilise les bonus de terrain et d’élément.</li></ul>
 <p>Bonne aventure dans Hackénia !</p>`}
];

// ——— Panneau du guide ———
function coach(){let c=$('tuto-coach');if(!c){c=document.createElement('section');c.id='tuto-coach';c.setAttribute('aria-live','polite');c.setAttribute('aria-label','Tutoriel');place(c);
 c.addEventListener('click',e=>{const a=e.target.closest('[data-tuto]')?.dataset.tuto;if(!a)return;if(a==='next')go(T.i+1);else if(a==='prev')go(T.i-1);else if(a==='retry')go(T.i);else if(a==='quit')stop(true);else if(a==='demo')runDemo();else if(a==='play'){stop(false);window.HackeniaPortal?.afterTutorial?.()}})}return c}
// Ordinateur : panneau posé sur le côté gauche du plateau (qui garde toute sa taille). Téléphone : panneau au-dessus du plateau.
const wide=window.matchMedia?.('(min-width:900px)');
function place(c=$('tuto-coach')){if(!c)return;const bw=$('bw');if(wide?.matches){if(c.parentElement!==bw)bw.append(c)}else if(c.nextElementSibling!==bw)bw.parentElement.insertBefore(c,bw)}
wide?.addEventListener?.('change',()=>{place();window.dispatchEvent(new Event('resize'))});
function draw(){const s=steps[T.i],c=coach(),n=steps.length,canNext=s.kind==='info'||T.done,isLast=T.i===n-1;
 const status=s.kind==='action'?(T.done?'':T.retry?'<p class="tuto-retry">Pas tout à fait ! Appuie sur « Recommencer l’étape » pour réessayer.</p>':'<p class="tuto-todo">⟶ À toi de jouer.</p>'):'';
 c.innerHTML=`<header><span class="tuto-kicker">Tutoriel · étape ${T.i+1} sur ${n}</span><button type="button" class="tuto-quit" data-tuto="quit" aria-label="Quitter le tutoriel">Quitter ✕</button></header>
 <div class="tuto-bar" aria-hidden="true"><i style="width:${Math.round((T.i+(canNext?1:0))/n*100)}%"></i></div>
 <h2>${s.title}</h2><div class="tuto-text">${T.done&&s.success?s.success():s.text()}</div>${status}
 <footer>${T.i>0?'<button type="button" data-tuto="prev">← Précédent</button>':''}${s.kind!=='info'&&s.kind!=='final'?'<button type="button" data-tuto="retry">Recommencer l’étape</button>':''}${s.kind==='demo'&&!T.done&&!T.demoRunning?`<button type="button" class="tuto-main" data-tuto="demo">${s.demoLabel} ▶</button>`:''}${isLast?'<button type="button" data-tuto="retry">Revoir</button><button type="button" class="tuto-main" data-tuto="play">Terminer et jouer</button>':`<button type="button" class="tuto-main" data-tuto="next" ${canNext?'':'disabled'}>Suivant →</button>`}</footer>`;
 document.body.dataset.tutoFocus=T.done?'':s.focus||''}
function go(i){if(i<0||i>=steps.length)return;T.i=i;T.done=false;T.retry=false;T.demoRunning=false;T.rolls=[];closeCard?.();window.hideHandHover?.();steps[i].setup();msg=steps[i].kind==='action'?'Suis les consignes du tutoriel.':'';render();draw();window.dispatchEvent(new Event('resize'))}
function runDemo(){const s=steps[T.i];if(!s.demo||T.demoRunning)return;T.demoRunning=true;draw();s.demo()}
function freeze(){cur=0;mode='t';sel=null;movePlan=null;msg=String(msg).split(P[1]+' : glisse')[0].split(P[0]+' : glisse')[0].trim();render()}
function tick(){if(!T.active)return;if(document.body.classList.contains('portal-open')){stop(false);return}const s=steps[T.i];if(T.done||!s.check)return;
 if(s.check()){T.done=true;T.demoRunning=false;freeze();draw()}else if(s.retry&&!T.retry&&s.retry()){T.retry=true;draw()}}

// ——— Repères dorés sur le plateau (couche HTML au-dessus du rendu 3D, recalée à chaque image) ———
function cellPoint(x,y){const v=window.HackeniaView;if(v?.active&&v.cellScreen)return v.cellScreen(x,y);const bd=$('bd');if(!bd)return null;const r=bd.getBoundingClientRect();return{x:r.left+(x+.5)*r.width/W,y:r.top+(y+.5)*r.height/H}}
function drawMarks(){if(!T.active)return;let layer=$('tuto-marks');if(!layer){layer=document.createElement('div');layer.id='tuto-marks';layer.setAttribute('aria-hidden','true');document.body.append(layer)}
 const list=targets()||[],hidden=!$('fiche')?.hidden||document.querySelector('dialog[open]');while(layer.children.length<list.length){const m=document.createElement('i');m.className='tuto-mark';layer.append(m)}while(layer.children.length>list.length)layer.lastChild.remove();
 list.forEach(([x,y],k)=>{const p=cellPoint(x,y),m=layer.children[k];if(!p||hidden){m.style.display='none';return}m.style.display='';m.style.transform=`translate(${p.x}px,${p.y}px)`});T.raf=requestAnimationFrame(drawMarks)}

// ——— Démarrer / quitter ———
function start(){ONLINE=null;ai=false;chosenDeck=null;TER=TL.indexOf('terre');gamePaused=false;matchStarted=false;window.HackeniaPortal&&document.body.classList.remove('portal-open');document.body.classList.add('tutorial-mode');location.hash='partie';init();P[0]=window.HackeniaSettings?.get?.().playerName||'Toi';P[1]='Adversaire';T.active=true;clearInterval(T.timer);T.timer=setInterval(tick,250);go(0);cancelAnimationFrame(T.raf);T.raf=requestAnimationFrame(drawMarks);window.dispatchEvent(new Event('resize'))}
function stop(toMenu){if(!T.active)return;T.active=false;clearInterval(T.timer);cancelAnimationFrame(T.raf);$('tuto-marks')?.remove();T.rolls=[];document.body.classList.remove('tutorial-mode');delete document.body.dataset.tutoFocus;$('tuto-coach')?.remove();window.hackeniaGame.resetSession();if(toMenu)window.HackeniaPortal?.afterTutorial?.()}
function nextRoll(n){if(!T.active||!T.rolls.length)return null;const r=T.rolls.shift();return Array.from({length:n},(_,k)=>r[k%r.length])}
function targets(){if(!T.active||T.done)return null;const t=steps[T.i].targets;return t?t():null}
window.HackeniaTutorial={start,stop,nextRoll,targets,get active(){return T.active},get step(){return T.i},steps:steps.length};
})();
