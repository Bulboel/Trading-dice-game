// v220 — Recyclage des doublons : on garde de quoi faire un deck (et les decks enregistrés), le reste devient des Bubulles.
const assert=require('assert'),path=require('path');const R=require(path.join(__dirname,'../assets/recycle-v220.js'));
const defs=[{r:1},{r:2},{r:3},{r:5},{r:6},{r:7},{r:1}],rar=d=>d.r;
const profile={version:1,gold:10,inventory:{0:7,1:4,2:6,3:3,4:2,5:5,6:1},decks:[{id:'a',name:'A',dice:[0,0,0,0,0,0,1,2,3,5]}]};
const p=R.plan(profile,defs,rar),by=Object.fromEntries(p.items.map(i=>[i.id,i]));
assert.equal(by[0].keep,6,'A saved deck using 6 copies keeps 6');assert.equal(by[0].extra,1);
assert.ok(!by[1],'Exactly 4 uncommon copies: nothing to recycle');assert.ok(!by[6],'Single copy never recycled');
assert.equal(by[2].extra,2);assert.equal(by[3].extra,1,'Legendary: 2 kept (v252)');assert.equal(by[4].extra,1,'Divine: 1 kept');assert.equal(by[5].extra,3,'Énergie: 2 kept');
assert.equal(p.total,1*1+2*2+1*5+1*20+3*3);assert.equal(p.count,1+2+1+1+3);
const all=R.apply(profile,defs,rar);assert.equal(all.profile.gold,10+p.total);assert.equal(all.profile.inventory[3],2);assert.equal(all.profile.inventory[5],2);assert.equal(all.profile.recycled,p.count);assert.equal(profile.inventory[3],3,'Input untouched');
const some=R.apply(profile,defs,rar,[4]);assert.equal(some.gold,20);assert.equal(some.profile.inventory[2],6,'Unchosen dice untouched');
assert.equal(R.plan(all.profile,defs,rar).count,0,'Nothing left after recycling all');
// Une bourse entièrement recyclée rapporte nettement moins que son prix (10 Bubulles).
const odds={1:.30,2:.25,3:.20,5:.12,6:.01,7:.12},perDie=Object.entries(odds).reduce((s,[r,o])=>s+o*R.VALUE[r],0);assert.ok(perDie*3<7,'Recycling never makes pouches free ('+(perDie*3).toFixed(2)+' / 10)');
const portal=require('fs').readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8');assert.ok(portal.includes("a==='recycle')recycleDialog()")&&portal.includes("throw Error('Recyclage invalide')"));
console.log(`PASS: keeps a full deck's worth and saved-deck copies, recycles only extras (all or chosen), ${(perDie*3).toFixed(1)} Bubulles per fully recycled pouch (< 10), profile untouched.`);
