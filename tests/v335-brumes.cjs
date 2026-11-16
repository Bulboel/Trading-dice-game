// v335 — Le quartier des brumes féeriques : terrain multi-élément, un seul élément favorisé à la fois, qui change à chaque tour complet.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});const events=[];
const ctx=vm.createContext({window:{dispatchEvent(e){events.push(e)}},CustomEvent:function(t,o){this.type=t;this.detail=o?.detail},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console,Event});vm.runInContext(source,ctx);const run=c=>vm.runInContext(c,ctx);
run("render=()=>{};TER=TL.indexOf('brumes');rewardMode='play';over=0;lotus=[];walls=[];mistEl=MIST_ELS[Math.floor(rnd()*MIST_ELS.length)]");
assert.ok(source.includes("mistEl=TL[TER]==='brumes'?MIST_ELS[Math.floor(rnd()*MIST_ELS.length)]:''"),'un élément tiré au début de chaque partie sur ce terrain');
const ELS=['feu','eau','terre','vent','glace','foudre'];
let el=run('mistEl');assert.ok(ELS.includes(el),'un élément favorisé dès le début');assert.deepEqual(JSON.parse(run("JSON.stringify(boostsOf('brumes'))")),[el]);
for(let i=0;i<12;i++){run('over=0;terrainEvent0()');const n=run('mistEl');assert.ok(ELS.includes(n));assert.notEqual(n,el,'la brume change à chaque tour complet');assert.ok(run(`boosted('${n}')`)&&!run(`boosted('${el}')`),'seul l’élément de la brume est favorisé');el=n}
assert.ok(events.some(e=>e.type==='hackenia:mist'),'le décor est prévenu du changement');
run("TER=TL.indexOf('terre')");assert.deepEqual(JSON.parse(run("JSON.stringify(boostsOf('terre'))")),['terre']);
assert.ok(fs.existsSync(path.join(root,'assets/fairy-v335.js'))&&fs.existsSync(path.join(root,'assets/elements/v2-brumes-64.webp')));
const cl=fs.readFileSync(path.join(root,'assets/clearing-v105.js'),'utf8');assert.equal((cl.match(/'automne','noel','brumes'\]/g)||[]).length,3,'scène 3D autorisée partout');
console.log('PASS: Fairy Mists terrain — one favored element at a time, changing every full turn; 3D scene wired.');
