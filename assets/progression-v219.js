/* v219 — Niveau de joueur et quêtes.
   Tout est stocké dans le profil (donc dans la sauvegarde en ligne) :
   profile.xp (expérience totale), profile.quests ({day, daily:[…], week, weekly}), profile.unlocks ({bonusFx:[…]}).
   Les fonctions ne modifient jamais le profil reçu : elles renvoient une copie. */
(function(root){'use strict';
const EL_NAME={foudre:'Foudre',vent:'Vent',terre:'Terre',glace:'Glace',eau:'Eau',feu:'Feu'};
const MAX_LEVEL=99;
// Expérience nécessaire pour passer du niveau n au niveau n+1.
const need=level=>100+20*(Math.max(1,level)-1);
function levelOf(xp){let level=1,rest=Math.max(0,Math.floor(xp||0));while(level<MAX_LEVEL&&rest>=need(level)){rest-=need(level);level++}return{level,into:rest,need:need(level),max:level>=MAX_LEVEL}}
// Récompenses de niveau : des Bubulles à chaque niveau, un palier tous les 5 niveaux.
const UNLOCKS={5:{bonusFx:'spark',label:'Effet de dé bonus « Éclair »'},10:{bonusFx:'leaf',label:'Effet de dé bonus « Feuille d’automne »'}};
function levelReward(level){const palier=level%5===0;return{gold:20+2*level+(palier?100:0),palier,unlock:UNLOCKS[level]||null}}
// Expérience d'une partie.
const PLAY_WIN={facile:30,moyen:40,difficile:50,divin:60};
function matchXp(result,mode,difficulty){if(!['quick','play','story','online'].includes(mode))return 0;
 if(mode==='online')return 25;/* v257 — PVP en ligne : 25 XP quel que soit le résultat */
 if(result==='draw')return 20;if(result!=='win')return 15;
 return mode==='story'?50:mode==='play'?(PLAY_WIN[difficulty]??40):40}
// Quêtes.
const DAILY=[
 {id:'win2',text:'Gagnez 2 parties',kind:'win',target:2},
 {id:'play3',text:'Jouez 3 parties',kind:'play',target:3},
 {id:'combat3',text:'Remportez 3 combats',kind:'combat',target:3},
 {id:'pass2',text:'Faites passer 2 créatures dans le camp adverse',kind:'pass',target:2},
 {id:'legend',text:'Remportez un combat avec une créature légendaire ou divine',kind:'combat',minRarity:5,target:1},
 {id:'pouch2',text:'Ouvrez 2 bourses',kind:'pouch',target:2},
 ...Object.keys(EL_NAME).map(el=>({id:'summon-'+el,text:'Invoquez 4 créatures '+({eau:'d’',}[el]||'de ')+EL_NAME[el].toLowerCase(),kind:'summon',el,target:4}))];
const WEEKLY=[
 {id:'w-win10',text:'Gagnez 10 parties',kind:'win',target:10},
 {id:'w-combat20',text:'Remportez 20 combats',kind:'combat',target:20},
 {id:'w-summon30',text:'Invoquez 30 créatures',kind:'summon',target:30},
 {id:'w-pass8',text:'Faites passer 8 créatures dans le camp adverse',kind:'pass',target:8}];
const DAILY_REWARD={xp:40,gold:15},WEEKLY_REWARD={xp:200,gold:100};
const pad=n=>String(n).padStart(2,'0');
function dayKey(now=new Date()){return now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())}
// Semaine commençant le lundi (heure locale) : clé = date du lundi.
function weekKey(now=new Date()){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate());d.setDate(d.getDate()-((d.getDay()+6)%7));return 'S'+dayKey(d)}
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function pick(list,count,seed){const pool=list.slice(),out=[];let h=hash(seed);while(out.length<count&&pool.length){h=Math.imul(h^(h>>>15),2246822507)>>>0;const q=pool.splice(h%pool.length,1)[0];
  if(q.kind==='summon'&&out.some(o=>o.kind==='summon'))continue;// une seule quête d'invocation par jour
  if(q.kind==='combat'&&out.some(o=>o.kind==='combat'))continue;out.push(q)}return out}
const fresh=q=>({id:q.id,progress:0,done:false});
function dailyFor(day){return pick(DAILY,3,'d'+day)}
function weeklyFor(week){return pick(WEEKLY,1,'w'+week)}
const defOf=id=>DAILY.find(q=>q.id===id)||WEEKLY.find(q=>q.id===id)||null;
// Met les quêtes à jour pour aujourd'hui et cette semaine (nouvelles quêtes si la date a changé).
function ensure(profile,now=new Date()){const day=dayKey(now),week=weekKey(now),q=profile.quests;
 if(q&&q.day===day&&q.week===week&&Array.isArray(q.daily)&&q.weekly)return profile;
 const next=structuredClone(profile),old=next.quests||{};
 next.quests={day,daily:old.day===day&&Array.isArray(old.daily)?old.daily:dailyFor(day).map(fresh),week,weekly:old.week===week&&old.weekly?old.weekly:fresh(weeklyFor(week)[0])};
 return next}
function matches(def,e){if(def.kind!==e.kind)return false;if(def.el&&!(e.el===def.el||e.multi))return false;if(def.minRarity&&!(e.rarity>=def.minRarity&&e.rarity!==7))return false;return true}
// Ajoute l'expérience et distribue les récompenses de niveau.
function gainXp(profile,amount){const before=levelOf(profile.xp||0).level,next=structuredClone(profile);next.xp=Math.max(0,Math.floor((profile.xp||0)+amount));const after=levelOf(next.xp).level,levels=[];
 for(let l=before+1;l<=after;l++){const r=levelReward(l);next.gold+=r.gold;if(r.unlock?.bonusFx){next.unlocks={...(next.unlocks||{})};const list=new Set(next.unlocks.bonusFx||[]);list.add(r.unlock.bonusFx);next.unlocks.bonusFx=[...list]}levels.push({level:l,...r})}
 return{profile:next,levels}}
// Enregistre une action (partie, combat, invocation…) et valide les quêtes terminées.
function record(profile,event,now=new Date()){let next=ensure(profile,now);const done=[];next=structuredClone(next);const n=Math.max(1,event.n||1);
 const step=(q,reward,weekly)=>{if(q.done)return q;const def=defOf(q.id);if(!def||!matches(def,event))return q;const progress=Math.min(def.target,q.progress+n);const finished=progress>=def.target;if(finished)done.push({...def,weekly,reward});return{...q,progress,done:finished}};
 next.quests.daily=next.quests.daily.map(q=>step(q,DAILY_REWARD,false));next.quests.weekly=step(next.quests.weekly,WEEKLY_REWARD,true);
 let levels=[];for(const d of done){next.gold+=d.reward.gold;const g=gainXp(next,d.reward.xp);next=g.profile;levels=levels.concat(g.levels)}
 return{profile:next,done,levels}}
function unlocked(profile,fx){return(profile?.unlocks?.bonusFx||[]).includes(fx)}
function view(profile,now=new Date()){const p=ensure(profile,now),lv=levelOf(p.xp||0),tomorrow=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
 return{...lv,xp:p.xp||0,daily:p.quests.daily.map(q=>({...defOf(q.id),...q,reward:DAILY_REWARD})).filter(q=>q.text),weekly:{...defOf(p.quests.weekly.id),...p.quests.weekly,reward:WEEKLY_REWARD},
  resetIn:tomorrow-now,nextReward:levelReward(Math.min(MAX_LEVEL,lv.level+1)),nextUnlock:Object.entries(UNLOCKS).map(([l,u])=>({level:+l,...u})).find(u=>u.level>lv.level)||null}}
const api={MAX_LEVEL,need,levelOf,levelReward,matchXp,DAILY,WEEKLY,DAILY_REWARD,WEEKLY_REWARD,UNLOCKS,dayKey,weekKey,dailyFor,weeklyFor,ensure,record,gainXp,unlocked,view,lastGain:null};
root.HackeniaProgress=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
