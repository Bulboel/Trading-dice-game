// Défi « Fidèle à son élément » : une victoire divine sur chacun des six terrains élémentaires de base débloque la Fiole de verre tèbre sacrée.
const assert=require('assert');const C=require('../assets/challenges-v180.js');const E=require('../assets/equipment-v198.js');
let p={challengeStats:{}};const win=(t,d='divin',m='play')=>{p=C.advance(p,{won:true,terrain:t,mode:m,difficulty:d})};
const def=C.definitions.find(d=>d.id==='pure');assert.ok(def&&def.item==='fiole-de-verre-tebre'&&def.target===6);
for(const t of['eau','feu','terre','vent','foudre'])win(t);assert.equal(C.progress(p,def),5);
win('glace','difficile');win('ville');win('noel');win('terre','divin','quick');assert.equal(C.progress(p,def),5,'Seule la difficulté divine dans Jouer sur un terrain de base compte');
win('terre');assert.equal(C.progress(p,def),5,'Un terrain refait ne compte pas deux fois');
win('glace');assert.equal(C.progress(p,def),6);
const prof={...p,equipped:'fiole-de-verre-tebre'};assert.equal(E.equipped(prof)?.monoExtra,1);
console.log('PASS: Fiole de verre tèbre sacrée.');
