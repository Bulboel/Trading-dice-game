const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const timers=[];const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},querySelector:()=>null});
const ctx=vm.createContext({window:{},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:f=>timers.push(f),clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,Event});vm.runInContext(source,ctx);const run=c=>vm.runInContext(c,ctx);
// Catalogue : 12 dés ajoutés après les personnages, identifiants existants inchangés.
assert.equal(run('M.length'),128);assert.equal(run('M[42].n'),'Messire Balai');
// v3 « Rayon » : rareté Énergie, ligne droite 3-4-4, visuels des v2.
const v3=JSON.parse(run('JSON.stringify(M.slice(58,64))'));assert.deepEqual(v3.map(d=>d.el),'foudre vent terre glace eau feu'.split(' '));
for(const d of v3){assert.equal(d.pure,3);assert.equal(d.rarity,7);assert.deepEqual(d.c,[[0,0,3],[0,1,4],[0,2,4]]);assert.equal(d.modelKey,'pur-'+d.el+'-2');assert.ok(d.cn.startsWith('Rayon'))}
assert.equal(run('RARITY_NAME[6]'),'Énergie');assert.match(run('pureArt(58)'),/foudre-2-128\.webp.*|pure-v3/);assert.match(run('pureArt(58)'),/pure-v3/);
const pure=JSON.parse(run('JSON.stringify(M.slice(43,55))'));
assert.deepEqual(pure.map(d=>d.el),[...'foudre vent terre glace eau feu '.repeat(2).trim().split(' ')]);
for(const d of pure.slice(0,6)){assert.equal(d.pure,1);assert.deepEqual(d.c.map(a=>a[2]),[2]);assert.equal(run(`rarityOf(M[${pure.indexOf(d)+43}])`),1)}
for(const d of pure.slice(6)){assert.equal(d.pure,2);assert.deepEqual(d.c.map(a=>a[2]).sort(),[2,3]);assert.equal(d.rarity,2)}
assert.equal(pure[4].cn,'Éclat d’eau');assert.equal(pure[11].cn,'Sentier de feu');
// Pose : sans lancer, dalles posées, aucune créature, le tour passe.
run(`render=()=>{};ai=false;b=Array.from({length:H},()=>Array(W).fill(null));cr=[];over=0;kills=[0,0];bonus=[0,0];TER=0;pl=[{h:[53,0],q:[1],s:0},{h:[2],q:[],s:0}];cur=0;moved=0;hi=0;die=53;rot=0;pc={x:3,y:H-2};mode='p';lancer()`);
assert.equal(run('cr.length'),0,'No creature appears');assert.equal(run('b[H-2][3].v'),3);assert.equal(run('b[H-1][3].v'),2,'Second tile has force 2');assert.equal(run('b[H-2][3].el'),'eau');
assert.equal(run("gameEvents.some(e=>e.type==='Lancer')"),false,'No roll happens');
while(timers.length)timers.shift()();assert.equal(run('cur'),1,'Placing an elemental die ends the turn');assert.deepEqual(JSON.parse(run('JSON.stringify(pl[0].q)')),[1,53],'The die returns to the bottom of the pouch like any other');
// L'IA : un dé élémentaire est sûr de réussir et ne crée pas de créature dans sa simulation.
assert.equal(run('aiRollChance(43,0)'),1);run("cur=1;pl[1].h=[44];mode='i'");const choice=JSON.parse(run('JSON.stringify(aiChoosePlacement(1))'));assert.ok(choice);assert.equal(run('cr.length'),0);
// Bourses : les dés élémentaires font partie des tirages communs et peu communs.
const pctx=vm.createContext({window:{hackeniaGame:{monsters:JSON.parse(run('JSON.stringify(M)'))}},structuredClone,Math,RangeError});vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/purchases.js'),'utf8'),pctx);
let seen=new Set();for(let k=0;k<4000;k++){const r=pctx.window.HackeniaPurchases.plan({gold:10,inventory:{},boosters:0},1);r.pouchQueue[0].dice.forEach(i=>seen.add(i))}
for(let i=43;i<55;i++)assert.ok(seen.has(i),'Elemental die '+i+' can be drawn from a pouch');for(let i=58;i<64;i++)assert.ok(seen.has(i),'Énergie die '+i+' can be drawn from a pouch');
console.log('PASS: 12 elemental dice (1 tile of 2, 2 tiles of 3+2), stable IDs, placed without a roll or creature, turn ends, AI-safe, drawn from pouches.');
