// v220 — Recyclage des doublons : on garde de quoi faire un deck (et les decks enregistrés), le reste devient des Bubulles.
const assert=require('assert'),path=require('path');const R=require(path.join(__dirname,'../assets/recycle-v220.js'));
const defs=[{r:1},{r:2},{r:3},{r:5},{r:6},{r:7},{r:1}],rar=d=>d.r;
const profile={version:1,gold:10,inventory:{0:7,1:4,2:6,3:3,4:2,5:5,6:1},decks:[{id:'a',name:'A',dice:[0,0,0,0,0,0,1,2,3,5]}]};
const p=R.plan(profile,defs,rar),by=Object.fromEntries(p.items.map(i=>[i.id,i]));
assert.equal(by[0].keep,6,'A saved deck using 6 copies keeps 6');assert.equal(by[0].extra,1);
assert.ok(!by[1],'Exactly 4 uncommon copies: nothing to recycle');assert.ok(!by[6],'Single copy never recycled');
assert.equal(by[2].extra,2);assert.equal(by[3].extra,1,'Legendary: 2 kept (v252)');assert.equal(by[4].extra,1,'Divine: 1 kept');assert.equal(by[5].extra,3,'Énergie: 2 kept');
assert.equal(p.tenths,1*1+2*5+1*10+1*500+3*2,'v360 : dixièmes (10 communs, 5 peu communs, 2 rares, 1 légendaire = 1 ; divin 50)');assert.equal(p.total,52);assert.equal(p.count,1+2+1+1+3);
const all=R.apply(profile,defs,rar);assert.equal(all.profile.gold,10+p.total);assert.equal(all.profile.inventory[3],2);assert.equal(all.profile.inventory[5],2);assert.equal(all.profile.recycled,p.count);assert.equal(profile.inventory[3],3,'Input untouched');
assert.equal(all.profile.recycleCredit,7,'reste gardé (0,7 Bubulle)');
const some=R.apply(profile,defs,rar,[4]);assert.equal(some.gold,50,'un divin = 50');
{const d1=[{r:1}],p1={version:1,gold:0,inventory:{0:9},decks:[]},a1=R.apply(p1,d1,rar);assert.equal(a1.gold,0,'5 communs < 1 Bubulle');assert.equal(a1.profile.recycleCredit,5);const a2=R.apply({...a1.profile,inventory:{0:9}},d1,rar);assert.equal(a2.gold,1,'le reste s’ajoute au recyclage suivant');assert.equal(a2.profile.recycleCredit,0)}assert.equal(some.profile.inventory[2],6,'Unchosen dice untouched');
assert.equal(R.plan(all.profile,defs,rar).count,0,'Nothing left after recycling all');
// Une boubourse entièrement recyclée rapporte nettement moins que son prix (10 Bubulles).
const odds={1:.338,2:.27,3:.22,5:.06,6:.004,7:.105,8:.003},/* taux réels des boubourses (v344) */perDie=Object.entries(odds).reduce((s,[r,o])=>s+o*R.VALUE[r],0);assert.ok(perDie*3<3,'Recycling never makes pouches free ('+(perDie*3).toFixed(2)+' / 10)');
// v342 — réglages : nombre fixe gardé et recyclage automatique (activé par défaut avec le Pack Sage)
assert.equal(R.plan({...profile,recycleCfg:{keep:1}},defs,rar).items.find(i=>i.id===1).extra,3,'Keep 1 copy');assert.equal(R.plan({...profile,recycleCfg:{keep:1}},defs,rar).items.find(i=>i.id===0).keep,6,'Saved decks still protected');assert.equal(R.cfg({}).auto,false);assert.equal(R.cfg({recycleCfg:{auto:true}}).auto,false,'Automatic recycling stays a Sage Pack perk');assert.equal(R.cfg({premium:{sage:true}}).auto,true);assert.equal(R.cfg({premium:{sage:true},recycleCfg:{auto:false}}).auto,false);
const portal=require('fs').readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8');assert.ok(portal.includes("a==='recycle')recycleDialog()")&&portal.includes("throw Error('Recyclage invalide')"));
console.log(`PASS: keeps a full deck's worth and saved-deck copies, recycles only extras (all or chosen), ${(perDie*3).toFixed(1)} Bubulles per fully recycled pouch (< 10), profile untouched.`);
