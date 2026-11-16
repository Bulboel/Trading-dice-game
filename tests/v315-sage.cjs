// Pack Sage : activation (1 000 Bubulles une seule fois), favoris, recyclage à trois exemplaires, ×100 réservé au pack.
const assert=require('assert');require('../assets/challenges-v180.js');const P=require('../assets/premium-v315.js'),R=require('../assets/recycle-v220.js'),E=require('../assets/equipment-v198.js');
const defs=Array.from({length:4},(_,i)=>({cn:'D'+i,rarity:i===3?6:1,lv:1}));const rarity=d=>d.rarity;
let p={version:1,gold:50,inventory:{0:7,1:2,2:9,3:5},decks:[]};
assert.equal(P.active(p),false);
const a=P.activate(p);assert.equal(P.active(a),true);assert.equal(a.gold,1050);assert.equal(a.equipped,'bague-de-sage');assert.equal(P.adsFree(a),true);
assert.equal(P.activate(a).gold,1050,'Les 1 000 Bubulles ne sont versées qu’une fois');assert.equal(P.active(p),false,'Le profil d’origine n’est pas modifié');
assert.equal(E.owned(a).some(i=>i.id==='bague-de-sage'),true);assert.equal(E.owned(p).some(i=>i.id==='bague-de-sage'),false);
const ring=E.items.find(i=>i.id==='bague-de-sage');assert.ok(ring.startBonus>=6);
// recyclage : sans pack on garde 4 (commun), 1 (divin) ; avec pack 3 minimum pour tous ; favoris épargnés
const free=R.plan(p,defs,rarity);assert.deepEqual(free.items.map(i=>[i.id,i.keep]).sort(),[[0,4],[2,4],[3,1]]);
const sage=R.plan({...a},defs,rarity);assert.deepEqual(sage.items.map(i=>[i.id,i.keep,i.extra]).sort(),[[0,3,4],[2,3,6],[3,3,2]]);
const fav=P.toggleFavorite(a,2);assert.equal(P.isFavorite(fav,2),true);assert.ok(!R.plan(fav,defs,rarity).items.some(i=>i.id===2),'Un favori n’est jamais recyclé');
assert.equal(P.isFavorite(P.toggleFavorite(fav,2),2),false);
const res=R.apply(fav,defs,rarity);assert.equal(res.profile.inventory[2],9);assert.equal(res.profile.inventory[0],3);assert.equal(res.profile.inventory[1],2,'Moins de trois exemplaires : rien n’est recyclé');
const deck={...a,decks:[{id:'d',name:'x',dice:[0,0,0,0,0]}]};assert.equal(R.keepFor(deck,0,1),5,'Un deck enregistré garde ses exemplaires');
console.log('PASS: Pack Sage.');
