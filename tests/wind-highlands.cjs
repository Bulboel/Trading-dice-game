// v232 — Terrain vent « Les vents de Hacko » : module 3D branché, nom cohérent partout.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const w=read('assets/wind-v232.js'),cl=read('assets/clearing-v105.js');
assert.ok(/export function createWindHighlands\(world,software=false,rows=10\)/.test(w)&&w.includes('return{root,update('));
for(const k of['prairie fauchée','collines','Herbes hautes','Pierres levées aux runes du vent','Moulins à vent','fanions','Traînées de vent'])assert.ok(w.includes(k),'Wind land has '+k);
for(const k of['Moutons qui broutent','Cerfs-volants','Nuages bas','Murets de pierre sèche','Bergerie','Arche de roche','Volée d','Aigrettes de pissenlit'])assert.ok(w.includes(k),'v242 wind detail: '+k);
assert.ok(w.includes('x=12-u*24')&&w.includes('x=13-u*26'),'Wind streaks and leaves blow left, like the gusts');
assert.ok(w.includes('z:-BZ-4.5-rnd()*5'),'Clouds stay behind the board, never over it');
assert.ok(cl.includes("import { createWindHighlands } from './wind-v232.js")&&cl.includes('windLand.update(t,light,moving)')&&cl.includes("'LES VENTS DE HACKO'")&&cl.includes("vent:'Vent +1 · Les vents de Hacko"));
for(const f of['index.html','assets/portal-v159.js','assets/pvp-online.js','assets/clearing-v105.js'])assert.ok(!read(f).includes('Plateau des vents'),'Old name removed from '+f);
console.log('PASS: Les vents de Hacko — emerald highland plateau (mown meadow cells, swaying tall grass, wind rune stones, windmills, prayer flags, wind streaks, spiralling leaves, hills); name updated everywhere.');
