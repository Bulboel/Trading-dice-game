// v230 — Terrain eau « Le lac rose » : module 3D branché, nom et textes cohérents partout.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const lake=read('assets/lake-v230.js'),cl=read('assets/clearing-v105.js');
assert.ok(/export function createLake\(world,software=false,rows=10\)/.test(lake)&&lake.includes('return{root,update('),'Lake module API');
for(const k of['nénuphars','Ruines du sanctuaire','Cerisiers','Ponton','lucioles','Reflet de la lune'])assert.ok(lake.toLowerCase().includes(k.toLowerCase()),'Lake has '+k);
assert.ok(cl.includes("import { createLake } from './lake-v230.js")&&cl.includes("forest.visible=value&&!fire&&!ice&&!lakeOn")&&cl.includes('lake.update(t,light,moving)'),'Wired into the 3D board');
assert.ok(cl.includes("'LE LAC ROSE'")&&cl.includes("eau:'Eau +1 · Le lac rose"));
for(const f of['index.html','assets/portal-v159.js','assets/pvp-online.js','assets/clearing-v105.js'])assert.ok(!read(f).includes('Lagon cristallin'),'Old name removed from '+f);
console.log('PASS: Le lac rose — procedural scene (water, terrace, islets, lilies, ruins, blossoms, pier, fireflies, moon reflection) wired into the board, name updated everywhere.');
