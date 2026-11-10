// v231 — Terrain foudre « Île céleste » : module 3D branché, nom cohérent partout.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const sky=read('assets/sky-v231.js'),cl=read('assets/clearing-v105.js');
assert.ok(/export function createSkyIsland\(world,software=false,rows=10\)/.test(sky)&&sky.includes('return{root,update('));
for(const k of['Falaises suspendues','Mer de nuages','Éclairs dans les nuages','Pylônes de cuivre','Îlots flottants','Étincelles'])assert.ok(sky.includes(k),'Sky island has '+k);
assert.ok(sky.includes("if(!moving){boltMat.opacity"),'No flashing lightning when animations are reduced');
assert.ok(cl.includes("import { createSkyIsland } from './sky-v231.js")&&cl.includes('boardFrame.visible=value&&!fire&&!skyOn')&&cl.includes('skyIsland.update(t,light,moving)'));
assert.ok(cl.includes("'L’ÎLE CÉLESTE'")&&cl.includes("foudre:'Foudre +1 · Île céleste'"));
for(const f of['index.html','assets/portal-v159.js','assets/pvp-online.js','assets/clearing-v105.js'])assert.ok(!read(f).includes('Plaine foudroyée'),'Old name removed from '+f);
console.log('PASS: Île céleste — floating slate sanctuary with electric veins, hanging cliffs, storm cloud sea, lightning (off with reduced motion), copper pylons, floating crystal islets, sparks; name updated everywhere.');
