// v219 — Niveau de joueur et quêtes : courbe d'XP, récompenses, quêtes déterministes par jour/semaine, progression et validation.
const assert=require('assert'),path=require('path');const P=require(path.join(__dirname,'../assets/progression-v219.js'));
const base={version:1,gold:100,inventory:{},decks:[]};
// Courbe : 100 XP pour le niveau 2, puis +20 par niveau.
assert.deepEqual(P.levelOf(0),{level:1,into:0,need:100,max:false});assert.equal(P.levelOf(99).level,1);assert.equal(P.levelOf(100).level,2);assert.equal(P.levelOf(220).level,3);assert.equal(P.levelOf(1e9).level,P.MAX_LEVEL);
// XP des parties.
assert.equal(P.matchXp('win','quick'),40);assert.equal(P.matchXp('loss','quick'),15);assert.equal(P.matchXp('win','play','divin'),60);assert.equal(P.matchXp('win','online'),25);assert.equal(P.matchXp('loss','online'),25);assert.equal(P.matchXp('win','story'),50);assert.equal(P.matchXp('draw','play'),20);assert.equal(P.matchXp('win','tutorial'),0,'No XP in the tutorial');assert.equal(P.matchXp('win','local'),0,'No XP in local two-player games');
// Montée de niveau : Bubulles à chaque niveau, palier tous les 5 niveaux, effets de dé bonus aux niveaux 5 et 10.
let g=P.gainXp(base,100);assert.equal(P.levelOf(g.profile.xp).level,2);assert.equal(g.levels.length,1);assert.equal(g.profile.gold,100+P.levelReward(2).gold);assert.equal(base.xp,undefined,'Input profile is never mutated');
let total=0;for(let l=1;l<5;l++)total+=P.need(l);g=P.gainXp(base,total);assert.equal(g.levels.at(-1).level,5);assert.ok(g.levels.at(-1).palier);assert.ok(P.unlocked(g.profile,'spark'));assert.ok(!P.unlocked(g.profile,'leaf'));
g=P.gainXp(base,99999);assert.ok(P.unlocked(g.profile,'leaf'));assert.ok(P.levelReward(10).gold>=P.levelReward(9).gold+100);
// Quêtes : 3 par jour, une par semaine, identiques pour une même date, une seule quête d'invocation et de combat par jour.
const day=new Date(2026,10,14,10),p1=P.ensure(base,day);assert.equal(p1.quests.daily.length,3);assert.ok(p1.quests.weekly.id);assert.deepEqual(P.ensure(base,day).quests,p1.quests,'Deterministic per day');
for(let d=1;d<=60;d++){const q=P.dailyFor('2026-12-'+d).map(x=>x.kind);assert.equal(new Set(q).size,3,'Three different kinds of daily quests');}
assert.equal(P.ensure(p1,new Date(2026,10,14,23)),p1,'Same day keeps progress');const next=P.ensure(p1,new Date(2026,10,15,8));assert.notDeepEqual(next.quests.day,p1.quests.day);assert.equal(next.quests.week,p1.quests.week,'Sunday is still the same week');
assert.notEqual(P.ensure(p1,new Date(2026,10,16,8)).quests.week,p1.quests.week,'Weekly quest renews on Monday');
// Progression d'une quête jusqu'à sa récompense (XP + Bubulles), sans dépasser l'objectif.
const prof=structuredClone(p1);prof.quests.daily=[{id:'combat3',progress:0,done:false},{id:'summon-feu',progress:0,done:false},{id:'pouch2',progress:0,done:false}];prof.quests.weekly={id:'w-win10',progress:9,done:false};
let r=P.record(prof,{kind:'combat',el:'eau',rarity:2},day);assert.equal(r.profile.quests.daily[0].progress,1);assert.equal(r.done.length,0);
r=P.record(r.profile,{kind:'summon',el:'eau'},day);assert.equal(r.profile.quests.daily[1].progress,0,'Wrong element does not count');r=P.record(r.profile,{kind:'summon',el:'',multi:true},day);assert.equal(r.profile.quests.daily[1].progress,1,'Multi-element creatures count for any element');
r=P.record(r.profile,{kind:'pouch',n:10},day);assert.equal(r.profile.quests.daily[2].progress,2,'Capped at the target');assert.equal(r.done.length,1);assert.equal(r.profile.gold,prof.gold+P.DAILY_REWARD.gold);assert.equal(r.profile.xp,P.DAILY_REWARD.xp);
const again=P.record(r.profile,{kind:'pouch'},day);assert.equal(again.done.length,0,'A finished quest pays only once');
r=P.record(r.profile,{kind:'win'},day);assert.ok(r.profile.quests.weekly.done);assert.equal(r.done[0].weekly,true);assert.equal(r.profile.xp,P.DAILY_REWARD.xp+P.WEEKLY_REWARD.xp);
// Légendaire : les dés Énergie (rareté 7) ne comptent pas.
const leg=structuredClone(prof);leg.quests.daily=[{id:'legend',progress:0,done:false}];assert.equal(P.record(leg,{kind:'combat',rarity:7},day).profile.quests.daily[0].progress,0);assert.equal(P.record(leg,{kind:'combat',rarity:6},day).profile.quests.daily[0].progress,1);
// Vue : quêtes complètes avec textes et compte à rebours.
const v=P.view(prof,day);assert.equal(v.daily.length,3);assert.ok(v.daily.every(q=>q.text&&q.target));assert.ok(v.resetIn>0&&v.resetIn<=864e5);assert.equal(v.nextUnlock.level,5);
// Intégration : le moteur envoie les statistiques, le portail donne l'XP et l'affiche.
const fs=require('fs'),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),portal=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8'),fx=fs.readFileSync(path.join(__dirname,'../assets/bonus-fx-v211.js'),'utf8');
for(const k of["questStat('summon',nc)","questStat('combat',","questStat('pass',"])assert.ok(html.includes(k),k);assert.ok(html.includes("rewardMode==='tutorial'"),'Tutorial excluded');
assert.ok(portal.includes('progressMatch(next')&&portal.includes("addEventListener('hackenia-stat'")&&portal.includes('id="portal-level"')&&portal.includes("throw Error('Expérience invalide')"));
assert.ok(/id:'spark'[^}]*level:5/.test(fx)&&/id:'leaf'[^}]*level:10/.test(fx),'Bonus effects unlock with level');
console.log('PASS: XP curve and match XP (no XP in tutorial/local), level rewards with milestone every 5 levels and bonus effects at 5 and 10, deterministic daily/weekly quests, progress capped and paid once, multi-element counts for any element, engine and portal wiring.');
